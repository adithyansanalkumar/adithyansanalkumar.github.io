/* =====================================================================
   HERO 3D — an interactive BIM scene built with three.js
   • 3-storey building in wireframe, rooftop air-handling unit (CTA)
   • supply (blue) + return (orange) duct networks on every floor
   • glowing air particles flowing through the ducts
   • floors drop in, ducts "grow", a section plane sweeps the model
   • scroll = exploded axonometric view, mouse = orbit / tilt
   Loaded only on the home page; falls back to the SVG drawing.
===================================================================== */
import * as THREE from 'three';

type Theme = { ink: THREE.Color; ink2: THREE.Color; cool: THREE.Color; warm: THREE.Color; dark: boolean };

const W = 9; // building length (x)
const D = 6; // building depth (z)
const H = 2.4; // storey height
const FLOORS = 3;
const GAP = 1.5; // extra spacing per floor when fully exploded

export function initHero3D(host: HTMLElement, opts: { reduce: boolean; onFrame?: (az: number, explode: number) => void }) {
  const canvas = document.createElement('canvas');
  canvas.className = 'h3d__canvas';
  canvas.setAttribute('aria-hidden', 'true');

  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch {
    return null; // no WebGL → keep the SVG fallback
  }
  host.prepend(canvas);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 200);

  /* ---------- theme colours from CSS variables ---------- */
  const readTheme = (): Theme => {
    const cs = getComputedStyle(document.documentElement);
    const c = (name: string, f: string) => new THREE.Color((cs.getPropertyValue(name) || '').trim() || f);
    return {
      ink: c('--ink', '#e9eef7'),
      ink2: c('--ink-3', '#7a8ca8'),
      cool: c('--cool', '#4fb0ff'),
      warm: c('--warm', '#ff7a3c'),
      dark: document.documentElement.getAttribute('data-theme') !== 'light',
    };
  };
  let theme = readTheme();

  /* ---------- shared materials ---------- */
  const mLine = new THREE.LineBasicMaterial({ transparent: true, opacity: 0.7 });
  const mFaint = new THREE.LineBasicMaterial({ transparent: true, opacity: 0.18 });
  const mSlab = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.07, side: THREE.DoubleSide, depthWrite: false });
  const mCool = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.38, depthWrite: false });
  const mWarm = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.38, depthWrite: false });
  const mCoolLine = new THREE.LineBasicMaterial({ transparent: true, opacity: 0.9 });
  const mWarmLine = new THREE.LineBasicMaterial({ transparent: true, opacity: 0.9 });
  const mEquip = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.1, depthWrite: false });
  const mCut = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.06, side: THREE.DoubleSide, depthWrite: false });
  const mCutLine = new THREE.LineBasicMaterial({ transparent: true, opacity: 0.85 });
  const mGrid = new THREE.LineBasicMaterial({ transparent: true, opacity: 0.12 });

  // soft round sprite for particles
  const spr = document.createElement('canvas');
  spr.width = spr.height = 64;
  const g2 = spr.getContext('2d')!;
  const grd = g2.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, 'rgba(255,255,255,1)');
  grd.addColorStop(0.35, 'rgba(255,255,255,.8)');
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  g2.fillStyle = grd;
  g2.fillRect(0, 0, 64, 64);
  const sprite = new THREE.CanvasTexture(spr);
  const mPartCool = new THREE.PointsMaterial({ size: 0.26, map: sprite, transparent: true, depthWrite: false, sizeAttenuation: true });
  const mPartWarm = mPartCool.clone();

  function applyTheme() {
    theme = readTheme();
    mLine.color.copy(theme.ink);
    mFaint.color.copy(theme.ink2);
    mGrid.color.copy(theme.ink2);
    mSlab.color.copy(theme.cool);
    mEquip.color.copy(theme.ink);
    mCool.color.copy(theme.cool);
    mWarm.color.copy(theme.warm);
    mCoolLine.color.copy(theme.cool);
    mWarmLine.color.copy(theme.warm);
    mCut.color.copy(theme.warm);
    mCutLine.color.copy(theme.warm);
    const white = new THREE.Color('#ffffff');
    mPartCool.color.copy(theme.dark ? theme.cool.clone().lerp(white, 0.45) : theme.cool);
    mPartWarm.color.copy(theme.dark ? theme.warm.clone().lerp(white, 0.35) : theme.warm);
    mPartCool.blending = mPartWarm.blending = theme.dark ? THREE.AdditiveBlending : THREE.NormalBlending;
    mPartCool.needsUpdate = mPartWarm.needsUpdate = true;
    mLine.opacity = theme.dark ? 0.7 : 0.8;
    mFaint.opacity = theme.dark ? 0.18 : 0.28;
    mGrid.opacity = theme.dark ? 0.12 : 0.18;
  }
  applyTheme();

  /* ---------- helpers ---------- */
  const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
  const edges = (geo: THREE.BufferGeometry, mat: THREE.LineBasicMaterial) => new THREE.LineSegments(new THREE.EdgesGeometry(geo), mat);
  const lines = (pts: THREE.Vector3[], mat: THREE.LineBasicMaterial) =>
    new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), mat);
  const polyPath = (pts: THREE.Vector3[]) => {
    const p = new THREE.CurvePath<THREE.Vector3>();
    for (let i = 0; i < pts.length - 1; i++) p.add(new THREE.LineCurve3(pts[i], pts[i + 1]));
    return p;
  };

  type Flow = { path: THREE.CurvePath<THREE.Vector3>; pts: THREE.Points; offs: Float32Array; speed: number };
  const flows: Flow[] = [];
  const tubes: THREE.Mesh[] = [];

  function duct(parent: THREE.Object3D, pts: THREE.Vector3[], kind: 'cool' | 'warm', r: number) {
    const path = polyPath(pts);
    const len = path.getLength();
    const tube = new THREE.Mesh(
      new THREE.TubeGeometry(path as unknown as THREE.Curve<THREE.Vector3>, Math.max(8, Math.round(len * 10)), r, 10, false),
      kind === 'cool' ? mCool : mWarm,
    );
    parent.add(tube);
    tubes.push(tube);
    parent.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), kind === 'cool' ? mCoolLine : mWarmLine));
    const n = Math.max(4, Math.round(len * 3.2));
    const offs = new Float32Array(n);
    for (let i = 0; i < n; i++) offs[i] = i / n + Math.random() * (0.5 / n);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    const p = new THREE.Points(geo, kind === 'cool' ? mPartCool : mPartWarm);
    p.frustumCulled = false;
    parent.add(p);
    flows.push({ path, pts: p, offs, speed: 0.55 / len });
  }

  /* ---------- the model ---------- */
  const root = new THREE.Group();
  scene.add(root);
  const levels: THREE.Group[] = [];

  // ground grid
  const gp: THREE.Vector3[] = [];
  for (let k = -12; k <= 12; k += 1.5) gp.push(v(k, 0, -12), v(k, 0, 12), v(-12, 0, k), v(12, 0, k));
  root.add(lines(gp, mGrid));

  const RS = { x: 3.3, z: -2.3 }; // supply riser
  const RR = { x: 3.95, z: -2.3 }; // return riser

  const slabWithEdges = (parent: THREE.Object3D) => {
    const slabGeo = new THREE.BoxGeometry(W, 0.14, D);
    const s = new THREE.Mesh(slabGeo, mSlab);
    s.position.y = 0.07;
    const e = edges(slabGeo, mLine);
    e.position.y = 0.07;
    parent.add(s, e);
  };

  for (let i = 0; i < FLOORS; i++) {
    const lvl = new THREE.Group();
    lvl.userData.base = i * H;
    root.add(lvl);
    levels.push(lvl);
    slabWithEdges(lvl);

    // columns + facade mullions
    const col: THREE.Vector3[] = [];
    for (const x of [-W / 2, 0, W / 2]) for (const z of [-D / 2, D / 2]) col.push(v(x, 0.14, z), v(x, H, z));
    lvl.add(lines(col, mLine));
    const mull: THREE.Vector3[] = [];
    for (let x = -W / 2 + 0.75; x < W / 2 - 0.1; x += 0.75) mull.push(v(x, 0.5, D / 2), v(x, H - 0.25, D / 2));
    for (let z = -D / 2 + 0.75; z < D / 2 - 0.1; z += 0.75) mull.push(v(W / 2, 0.5, z), v(W / 2, H - 0.25, z));
    mull.push(v(-W / 2, 0.5, D / 2), v(W / 2, 0.5, D / 2), v(W / 2, 0.5, D / 2), v(W / 2, 0.5, -D / 2));
    lvl.add(lines(mull, mFaint));

    const yd = H - 0.45; // supply level
    const yr = H - 0.85; // return level
    duct(lvl, [v(RS.x, H, RS.z), v(RS.x, i === 0 ? yd : 0.14, RS.z)], 'cool', 0.16);
    duct(lvl, [v(RR.x, i === 0 ? yr : 0.14, RR.z), v(RR.x, H, RR.z)], 'warm', 0.15);
    duct(lvl, [v(RS.x, yd, RS.z), v(RS.x, yd, -0.7), v(-3.6, yd, -0.7), v(-3.6, yd, 1.9), v(2.2, yd, 1.9)], 'cool', 0.13);
    duct(lvl, [v(-2.8, yr, 0.6), v(RR.x, yr, 0.6), v(RR.x, yr, RR.z)], 'warm', 0.12);

    for (const [x, z] of [[1.6, -0.7], [-1.0, -0.7], [-3.6, 0.6], [-1.6, 1.9], [1.2, 1.9]] as const) {
      const e = edges(new THREE.BoxGeometry(0.5, 0.05, 0.5), mCoolLine);
      e.position.set(x, yd - 0.35, z);
      lvl.add(e, lines([v(x, yd, z), v(x, yd - 0.33, z)], mCoolLine));
    }
    for (const x of [-2.0, 0.8]) {
      const e = edges(new THREE.BoxGeometry(0.6, 0.05, 0.3), mWarmLine);
      e.position.set(x, yr - 0.3, 0.6);
      lvl.add(e, lines([v(x, yr, 0.6), v(x, yr - 0.28, 0.6)], mWarmLine));
    }
  }

  // roof + rooftop air-handling unit (CTA)
  const roof = new THREE.Group();
  roof.userData.base = FLOORS * H;
  root.add(roof);
  levels.push(roof);
  slabWithEdges(roof);
  {
    const par: THREE.Vector3[] = [];
    const c = [v(-W / 2, 0.45, -D / 2), v(W / 2, 0.45, -D / 2), v(W / 2, 0.45, D / 2), v(-W / 2, 0.45, D / 2)];
    for (let k = 0; k < 4; k++) par.push(c[k], c[(k + 1) % 4], c[k], v(c[k].x, 0.14, c[k].z));
    roof.add(lines(par, mFaint));

    const cta = new THREE.BoxGeometry(3.4, 1.3, 1.3);
    const m = new THREE.Mesh(cta, mEquip);
    m.position.set(0, 0.79, -2.3);
    const e = edges(cta, mLine);
    e.position.copy(m.position);
    roof.add(m, e);
    roof.add(lines([v(-0.6, 0.14, -1.65), v(-0.6, 1.44, -1.65), v(0.4, 0.14, -1.65), v(0.4, 1.44, -1.65)], mLine));

    const fan = new THREE.Group();
    const ring = new THREE.LineLoop(
      new THREE.BufferGeometry().setFromPoints(new THREE.EllipseCurve(0, 0, 0.45, 0.45).getPoints(40).map((p) => v(p.x, p.y, 0))),
      mLine,
    );
    const blades: THREE.Vector3[] = [];
    for (let k = 0; k < 3; k++) {
      const a = (k / 3) * Math.PI * 2;
      blades.push(v(0, 0, 0), v(Math.cos(a) * 0.4, Math.sin(a) * 0.4, 0));
    }
    fan.add(ring, lines(blades, mLine));
    fan.position.set(1.0, 0.79, -1.64);
    roof.add(fan);
    roof.userData.fan = fan;

    const zz: THREE.Vector3[] = [];
    for (let k = 0; k < 6; k++) zz.push(v(-1.5 + (k % 2) * 0.35, 0.25 + k * 0.2, -1.64), v(-1.5 + ((k + 1) % 2) * 0.35, 0.25 + (k + 1) * 0.2, -1.64));
    roof.add(lines(zz, mLine));

    duct(roof, [v(1.7, 0.45, RS.z), v(RS.x, 0.45, RS.z), v(RS.x, 0.0, RS.z)], 'cool', 0.16);
    duct(roof, [v(RR.x, 0.0, RR.z), v(RR.x, 1.05, RR.z), v(1.7, 1.05, RR.z)], 'warm', 0.15);
    duct(roof, [v(-3.6, 0.6, -2.3), v(-1.7, 0.6, -2.3)], 'cool', 0.13);
    duct(roof, [v(-1.7, 1.05, -2.3), v(-3.6, 1.05, -2.3), v(-3.6, 1.8, -2.3)], 'warm', 0.13);
  }

  // section plane that sweeps the model
  const cut = new THREE.Group();
  const cutGeo = new THREE.PlaneGeometry(W + 1.6, D + 1.6);
  const cutMesh = new THREE.Mesh(cutGeo, mCut);
  cutMesh.rotation.x = -Math.PI / 2;
  const cutEdge = edges(cutGeo, mCutLine);
  cutEdge.rotation.x = -Math.PI / 2;
  cut.add(cutMesh, cutEdge);
  root.add(cut);

  /* ---------- state ---------- */
  let explode = 0;
  let explodeT = 0;
  let mx = 0,
    my = 0,
    rx = 0,
    ry = 0;
  let intro = opts.reduce ? 1 : 0;
  const t0 = performance.now();
  let running = true;
  let visible = true;

  function size() {
    const r = host.getBoundingClientRect();
    renderer.setSize(Math.max(10, r.width), Math.max(10, r.height), false);
    camera.aspect = Math.max(10, r.width) / Math.max(10, r.height);
    camera.updateProjectionMatrix();
    if (opts.reduce) loop();
  }
  const ro = new ResizeObserver(size);
  ro.observe(host);

  const onMove = (e: PointerEvent) => {
    mx = (e.clientX / window.innerWidth - 0.5) * 2;
    my = (e.clientY / window.innerHeight - 0.5) * 2;
  };
  if (!opts.reduce) window.addEventListener('pointermove', onMove, { passive: true });

  const mo = new MutationObserver(() => {
    applyTheme();
    if (opts.reduce) loop();
  });
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  const io = new IntersectionObserver(([en]) => {
    visible = en.isIntersecting;
    if (visible) loop();
  });
  io.observe(host);
  const onVis = () => {
    if (!document.hidden && visible) loop();
  };
  document.addEventListener('visibilitychange', onVis);

  const ease = (x: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);
  let raf = 0;
  const tmp = new THREE.Vector3();

  function frame(now: number) {
    const t = (now - t0) / 1000;
    if (!opts.reduce) intro = Math.min(1, t / 3.2);
    const k3 = intro * 3.2;

    explodeT += (explode - explodeT) * (opts.reduce ? 1 : 0.08);
    rx += (my - rx) * 0.05;
    ry += (mx - ry) * 0.05;

    // floors drop in one after the other, then separate with scroll
    levels.forEach((lvl, i) => {
      const k = ease((k3 - i * 0.35) / 1.1);
      lvl.position.y = lvl.userData.base + explodeT * i * GAP + (1 - k) * 6;
      lvl.visible = k > 0.01;
    });
    // ducts grow once the floors have landed
    const grow = ease((k3 - 1.4) / 1.6);
    for (const tb of tubes) {
      const geo = tb.geometry as THREE.BufferGeometry;
      const cnt = geo.index ? geo.index.count : geo.attributes.position.count;
      geo.setDrawRange(0, Math.floor(cnt * grow));
    }

    // air particles
    const pVis = grow > 0.98;
    for (const f of flows) {
      f.pts.visible = pVis;
      if (!pVis) continue;
      const attr = f.pts.geometry.attributes.position as THREE.BufferAttribute;
      const arr = attr.array as Float32Array;
      for (let i = 0; i < f.offs.length; i++) {
        f.path.getPointAt((f.offs[i] + t * f.speed) % 1, tmp);
        arr[i * 3] = tmp.x;
        arr[i * 3 + 1] = tmp.y;
        arr[i * 3 + 2] = tmp.z;
      }
      attr.needsUpdate = true;
    }

    const fan = roof.userData.fan as THREE.Group;
    fan.rotation.z = opts.reduce ? 0.4 : t * 6;
    const top = FLOORS * H + explodeT * FLOORS * GAP + 1.4;
    cut.position.y = (0.5 + 0.5 * Math.sin(t * 0.45)) * top;
    cut.visible = !opts.reduce && intro > 0.7;

    // orbit: slow auto-rotation + mouse
    const az = -0.7 + (opts.reduce ? 0 : t * 0.07) + ry * 0.45;
    root.rotation.y = az;
    const cy = 3.4 + explodeT * 2.2;
    const dist = (camera.aspect < 1.3 ? 22 : 27) + explodeT * 5;
    camera.position.set(0, cy + 9 - rx * 2.2, dist);
    camera.lookAt(0, cy, 0);

    renderer.render(scene, camera);
    opts.onFrame?.(((((az * 180) / Math.PI) % 360) + 360) % 360, explodeT);
  }

  function loop() {
    cancelAnimationFrame(raf);
    const step = (now: number) => {
      if (!running || !visible || document.hidden) return;
      frame(now);
      if (!opts.reduce) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  }
  size();
  loop();
  host.classList.add('is-3d');

  return {
    setExplode(p: number) {
      explode = Math.min(1, Math.max(0, p));
      if (opts.reduce) loop();
    },
    destroy() {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      mo.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('pointermove', onMove);
      renderer.dispose();
    },
  };
}
