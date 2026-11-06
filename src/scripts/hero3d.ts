/* =====================================================================
   HERO 3D — an interactive BIM scene built with three.js
   • 3-storey building: slabs, columns, glazing, partitions, door swings,
     stair core, technical shaft, entrance canopy
   • HVAC: rooftop air-handling unit (CTA) + chiller, supply (blue) and
     return (orange) duct networks with VAV boxes and diffusers
   • Hydronics: ground-floor boiler, heating risers, radiators per floor
   • Drawing annotations: structural grid with bubbles, level datums,
     dimension lines, north arrow, equipment tags
   • floors drop in, ducts "grow", a section plane sweeps the model
   • scroll = exploded axonometric view, mouse = orbit / tilt
   Loaded only on the home page; falls back to the SVG drawing.
===================================================================== */
import * as THREE from 'three';

type Theme = { ink: THREE.Color; ink2: THREE.Color; cool: THREE.Color; warm: THREE.Color; dark: boolean };
type V = THREE.Vector3;

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
  const fr = (document.documentElement.lang || 'fr').startsWith('fr');

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
  const mWall = new THREE.LineBasicMaterial({ transparent: true, opacity: 0.3 });
  const mSlab = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.07, side: THREE.DoubleSide, depthWrite: false });
  const mGlass = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.05, side: THREE.DoubleSide, depthWrite: false });
  const mCool = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.38, depthWrite: false });
  const mWarm = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.38, depthWrite: false });
  const mCoolLine = new THREE.LineBasicMaterial({ transparent: true, opacity: 0.9 });
  const mWarmLine = new THREE.LineBasicMaterial({ transparent: true, opacity: 0.9 });
  const mEquip = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.1, depthWrite: false });
  const mCut = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.06, side: THREE.DoubleSide, depthWrite: false });
  const mCutLine = new THREE.LineBasicMaterial({ transparent: true, opacity: 0.85 });
  const mGrid = new THREE.LineBasicMaterial({ transparent: true, opacity: 0.12 });
  const mAnno = new THREE.LineBasicMaterial({ transparent: true, opacity: 0.7 }); // ground dims / north arrow
  const mAxis = new THREE.LineDashedMaterial({ transparent: true, opacity: 0.45, dashSize: 0.45, gapSize: 0.18 });

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
  const mPartCoolS = mPartCool.clone(); // smaller particles for water pipes
  const mPartWarmS = mPartCool.clone();
  mPartCoolS.size = mPartWarmS.size = 0.13;

  /* ---------- text labels (canvas sprites) ---------- */
  type Tone = 'ink' | 'mute' | 'cool' | 'warm';
  // ground: ground-level annotation that fades out when the model explodes (it would hit the HUD legend)
  type Label = { sp: THREE.Sprite; text: string; tone: Tone; h: number; shape: 'none' | 'box' | 'circle'; ground: boolean };
  const labels: Label[] = [];
  let groundNext = false;
  const toneColor = (tone: Tone) =>
    (tone === 'cool' ? theme.cool : tone === 'warm' ? theme.warm : tone === 'ink' ? theme.ink : theme.ink2).getStyle();

  function drawLabel(l: Label) {
    const cv = document.createElement('canvas');
    const ctx = cv.getContext('2d')!;
    const fs = 46;
    const font = `500 ${fs}px "IBM Plex Mono", ui-monospace, monospace`;
    ctx.font = font;
    const tw = Math.ceil(ctx.measureText(l.text).width);
    const pad = l.shape === 'none' ? 6 : 16;
    if (l.shape === 'circle') {
      cv.width = cv.height = Math.max(tw, fs) + pad * 2;
    } else {
      cv.width = tw + pad * 2;
      cv.height = fs + pad * 2;
    }
    const col = toneColor(l.tone);
    ctx.font = font; // resizing the canvas resets the context
    ctx.strokeStyle = col;
    ctx.fillStyle = col;
    ctx.lineWidth = 3;
    if (l.shape === 'box') ctx.strokeRect(1.5, 1.5, cv.width - 3, cv.height - 3);
    if (l.shape === 'circle') {
      ctx.beginPath();
      ctx.arc(cv.width / 2, cv.height / 2, cv.width / 2 - 2, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(l.text, cv.width / 2, cv.height / 2 + 3);
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    const mat = l.sp.material as THREE.SpriteMaterial;
    mat.map?.dispose();
    mat.map = tex;
    mat.needsUpdate = true;
    l.sp.scale.set((l.h * cv.width) / cv.height, l.h, 1);
  }

  function label(parent: THREE.Object3D, text: string, pos: V, h = 0.3, tone: Tone = 'mute', shape: Label['shape'] = 'none') {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, depthWrite: false, depthTest: false }));
    sp.position.copy(pos);
    sp.renderOrder = 10;
    parent.add(sp);
    const l: Label = { sp, text, tone, h, shape, ground: groundNext };
    labels.push(l);
    drawLabel(l);
  }

  function applyTheme() {
    theme = readTheme();
    mLine.color.copy(theme.ink);
    mFaint.color.copy(theme.ink2);
    mWall.color.copy(theme.ink2);
    mGrid.color.copy(theme.ink2);
    mAxis.color.copy(theme.warm);
    mAnno.color.copy(theme.ink);
    mSlab.color.copy(theme.cool);
    mGlass.color.copy(theme.cool);
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
    mPartCoolS.color.copy(mPartCool.color);
    mPartWarmS.color.copy(mPartWarm.color);
    for (const m of [mPartCool, mPartWarm, mPartCoolS, mPartWarmS]) {
      m.blending = theme.dark ? THREE.AdditiveBlending : THREE.NormalBlending;
      m.needsUpdate = true;
    }
    mLine.opacity = theme.dark ? 0.7 : 0.8;
    mFaint.opacity = theme.dark ? 0.18 : 0.28;
    mWall.opacity = theme.dark ? 0.3 : 0.4;
    mGrid.opacity = theme.dark ? 0.12 : 0.18;
    labels.forEach(drawLabel);
  }
  applyTheme();

  /* ---------- helpers ---------- */
  const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
  const edges = (geo: THREE.BufferGeometry, mat: THREE.LineBasicMaterial) => new THREE.LineSegments(new THREE.EdgesGeometry(geo), mat);
  const lines = (pts: V[], mat: THREE.LineBasicMaterial | THREE.LineDashedMaterial) =>
    new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), mat);
  const polyPath = (pts: V[]) => {
    const p = new THREE.CurvePath<V>();
    for (let i = 0; i < pts.length - 1; i++) p.add(new THREE.LineCurve3(pts[i], pts[i + 1]));
    return p;
  };
  /** push the 12 edges of an axis-aligned box (centre + size) as line segments */
  const boxSegs = (arr: V[], cx: number, cy: number, cz: number, sx: number, sy: number, sz: number) => {
    const x0 = cx - sx / 2, x1 = cx + sx / 2, y0 = cy - sy / 2, y1 = cy + sy / 2, z0 = cz - sz / 2, z1 = cz + sz / 2;
    const c = [v(x0, y0, z0), v(x1, y0, z0), v(x1, y0, z1), v(x0, y0, z1), v(x0, y1, z0), v(x1, y1, z0), v(x1, y1, z1), v(x0, y1, z1)];
    for (let k = 0; k < 4; k++) arr.push(c[k], c[(k + 1) % 4], c[k + 4], c[((k + 1) % 4) + 4], c[k], c[k + 4]);
  };
  /** push a horizontal arc as line segments */
  const arcSegs = (arr: V[], cx: number, y: number, cz: number, r: number, a0: number, a1: number, n = 10) => {
    for (let k = 0; k < n; k++) {
      const a = a0 + ((a1 - a0) * k) / n, b = a0 + ((a1 - a0) * (k + 1)) / n;
      arr.push(v(cx + Math.cos(a) * r, y, cz + Math.sin(a) * r), v(cx + Math.cos(b) * r, y, cz + Math.sin(b) * r));
    }
  };
  /** equipment box: translucent body + crisp edges */
  const equip = (parent: THREE.Object3D, cx: number, cy: number, cz: number, sx: number, sy: number, sz: number) => {
    const g = new THREE.BoxGeometry(sx, sy, sz);
    const m = new THREE.Mesh(g, mEquip);
    const e = edges(g, mLine);
    m.position.set(cx, cy, cz);
    e.position.set(cx, cy, cz);
    parent.add(m, e);
  };
  /** level datum: leader line, triangle marker and elevation tag */
  const datum = (parent: THREE.Object3D, text: string) => {
    const lx = -W / 2 - 1.2, lz = D / 2 + 0.25;
    const dt: V[] = [v(-W / 2, 0.14, D / 2), v(lx, 0.14, lz)];
    dt.push(v(lx, 0.14, lz), v(lx + 0.2, 0.36, lz), v(lx + 0.2, 0.36, lz), v(lx - 0.2, 0.36, lz), v(lx - 0.2, 0.36, lz), v(lx, 0.14, lz));
    parent.add(lines(dt, mWarmLine));
    label(parent, text, v(lx, 0.75, lz), 0.36, 'ink');
  };
  const elev = (m: number) => m.toFixed(2).replace('.', fr ? ',' : '.');

  type Flow = { path: THREE.CurvePath<V>; pts: THREE.Points; offs: Float32Array; speed: number };
  const flows: Flow[] = [];
  const tubes: THREE.Mesh[] = [];
  const fans: { obj: THREE.Object3D; speed: number }[] = [];

  /** duct (thick) or pipe (thin) with flowing particles */
  function duct(parent: THREE.Object3D, pts: V[], kind: 'cool' | 'warm', r: number, pipe = false) {
    const path = polyPath(pts);
    const len = path.getLength();
    const tube = new THREE.Mesh(
      new THREE.TubeGeometry(path as unknown as THREE.Curve<V>, Math.max(8, Math.round(len * 10)), r, pipe ? 6 : 10, false),
      kind === 'cool' ? mCool : mWarm,
    );
    parent.add(tube);
    tubes.push(tube);
    parent.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), kind === 'cool' ? mCoolLine : mWarmLine));
    const n = Math.max(4, Math.round(len * (pipe ? 4.5 : 3.2)));
    const offs = new Float32Array(n);
    for (let i = 0; i < n; i++) offs[i] = i / n + Math.random() * (0.5 / n);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    const mat = pipe ? (kind === 'cool' ? mPartCoolS : mPartWarmS) : kind === 'cool' ? mPartCool : mPartWarm;
    const p = new THREE.Points(geo, mat);
    p.frustumCulled = false;
    parent.add(p);
    flows.push({ path, pts: p, offs, speed: (pipe ? 0.4 : 0.55) / len });
  }

  /** ring fan (outline + blades) that spins; axis 'z' = facing front, 'y' = facing up */
  function fan(parent: THREE.Object3D, pos: V, r: number, axis: 'y' | 'z', speed: number) {
    const g = new THREE.Group();
    const ring = new THREE.LineLoop(
      new THREE.BufferGeometry().setFromPoints(new THREE.EllipseCurve(0, 0, r, r).getPoints(36).map((p) => v(p.x, p.y, 0))),
      mLine,
    );
    const bl: V[] = [];
    for (let k = 0; k < 4; k++) {
      const a = (k / 4) * Math.PI * 2;
      bl.push(v(0, 0, 0), v(Math.cos(a) * r * 0.88, Math.sin(a) * r * 0.88, 0));
    }
    const inner = new THREE.Group();
    inner.add(lines(bl, mLine));
    g.add(ring, inner);
    if (axis === 'y') g.rotation.x = -Math.PI / 2;
    g.position.copy(pos);
    parent.add(g);
    fans.push({ obj: inner, speed });
  }

  /* ---------- the model ---------- */
  const root = new THREE.Group();
  scene.add(root);
  const levels: THREE.Group[] = [];

  // ground grid
  const gp: V[] = [];
  for (let k = -12; k <= 12; k += 1.5) gp.push(v(k, 0, -12), v(k, 0, 12), v(-12, 0, k), v(12, 0, k));
  root.add(lines(gp, mGrid));

  /* ----- drawing annotations on the ground (they don't explode) ----- */
  groundNext = true;
  {
    // structural grid: axes 1-2-3 (x) and A-B (z), dashed, with bubbles
    const ax: V[] = [];
    [-W / 2, 0, W / 2].forEach((x, i) => {
      ax.push(v(x, 0.01, -D / 2 - 1.4), v(x, 0.01, D / 2 + 2.1));
      label(root, String(i + 1), v(x, 0.05, D / 2 + 2.6), 0.72, 'warm', 'circle');
    });
    [-D / 2, D / 2].forEach((z, i) => {
      ax.push(v(-W / 2 - 2.1, 0.01, z), v(W / 2 + 1.4, 0.01, z));
      label(root, 'AB'[i], v(-W / 2 - 2.6, 0.05, z), 0.72, 'warm', 'circle');
    });
    const axes = lines(ax, mAxis);
    axes.computeLineDistances();
    root.add(axes);

    // dimension lines with oblique ticks (mm, as on a drawing)
    const dim: V[] = [];
    const zd = D / 2 + 1.25;
    const xd = W / 2 + 0.95;
    dim.push(v(-W / 2 - 0.3, 0.01, zd), v(W / 2 + 0.3, 0.01, zd));
    dim.push(v(xd, 0.01, -D / 2 - 0.3), v(xd, 0.01, D / 2 + 0.3));
    for (const x of [-W / 2, 0, W / 2]) dim.push(v(x - 0.15, 0.01, zd + 0.15), v(x + 0.15, 0.01, zd - 0.15), v(x, 0.01, D / 2 + 0.2), v(x, 0.01, zd + 0.25));
    for (const z of [-D / 2, D / 2]) dim.push(v(xd - 0.15, 0.01, z + 0.15), v(xd + 0.15, 0.01, z - 0.15), v(W / 2 + 0.2, 0.01, z), v(xd + 0.25, 0.01, z));
    root.add(lines(dim, mAnno));
    label(root, '4 500', v(-W / 4, 0.25, zd), 0.36, 'mute');
    label(root, '4 500', v(W / 4, 0.25, zd), 0.36, 'mute');
    label(root, '6 000', v(xd, 0.25, 0), 0.36, 'mute');

    // north arrow
    const na: V[] = [];
    const nx = W / 2 + 2.6, nz = -D / 2 - 1.2;
    arcSegs(na, nx, 0.01, nz, 0.55, 0, Math.PI * 2, 28);
    na.push(v(nx, 0.01, nz + 0.55), v(nx, 0.01, nz - 0.75), v(nx, 0.01, nz - 0.75), v(nx - 0.22, 0.01, nz - 0.35), v(nx, 0.01, nz - 0.75), v(nx + 0.22, 0.01, nz - 0.35));
    root.add(lines(na, mAnno));
    label(root, 'N', v(nx, 0.2, nz - 1.1), 0.36, 'ink');
  }
  groundNext = false;

  const RS = { x: 3.3, z: -2.3 }; // supply air riser
  const RR = { x: 3.95, z: -2.3 }; // return air riser
  const HF = { x: 3.55, z: 2.72 }; // heating flow riser
  const HR = { x: 3.85, z: 2.55 }; // heating return riser

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
    const top = i === FLOORS - 1;

    // columns
    const col: V[] = [];
    for (const x of [-W / 2, 0, W / 2]) for (const z of [-D / 2, D / 2]) col.push(v(x, 0.14, z), v(x, H, z));
    lvl.add(lines(col, mLine));

    // curtain wall: mullions, sill, head and a faint glass skin (front + right facades)
    const mull: V[] = [];
    for (let x = -W / 2 + 0.75; x < W / 2 - 0.1; x += 0.75) mull.push(v(x, 0.5, D / 2), v(x, H - 0.25, D / 2));
    for (let z = -D / 2 + 0.75; z < D / 2 - 0.1; z += 0.75) mull.push(v(W / 2, 0.5, z), v(W / 2, H - 0.25, z));
    for (const y of [0.5, H - 0.25]) mull.push(v(-W / 2, y, D / 2), v(W / 2, y, D / 2), v(W / 2, y, D / 2), v(W / 2, y, -D / 2));
    lvl.add(lines(mull, mFaint));
    const gl1 = new THREE.Mesh(new THREE.PlaneGeometry(W, H - 0.75), mGlass);
    gl1.position.set(0, 0.5 + (H - 0.75) / 2, D / 2);
    const gl2 = new THREE.Mesh(new THREE.PlaneGeometry(D, H - 0.75), mGlass);
    gl2.rotation.y = Math.PI / 2;
    gl2.position.set(W / 2, 0.5 + (H - 0.75) / 2, 0);
    lvl.add(gl1, gl2);

    // partitions (offices / corridor / stair core) — walls stop at the suspended ceiling
    const walls: V[] = [];
    const hw = H - 0.62;
    const wy = 0.14 + hw / 2;
    boxSegs(walls, 0.95, wy, -0.3, 7.1, hw, 0.08); // corridor wall (back)
    boxSegs(walls, 0, wy, 1.1, W, hw, 0.08); // corridor wall (front)
    boxSegs(walls, -0.5, wy, -1.65, 0.08, hw, 2.7); // back offices
    boxSegs(walls, 2.0, wy, -1.65, 0.08, hw, 2.7);
    for (const x of i === 0 ? [-1.5, 2.6] : [-1.5, 1.5]) boxSegs(walls, x, wy, 2.05, 0.08, hw, 1.9); // ground: plant room
    boxSegs(walls, -2.6, wy, -2.2, 0.08, hw, 1.6); // stair core
    boxSegs(walls, -3.55, wy, -1.4, 1.9, hw, 0.08);

    // stair: two flights with a landing, zig-zag steps
    const steps = 8;
    const rise = (H - 0.14) / 2 / steps;
    let sy = 0.14;
    const flight = (x0: number, x1: number, z: number) => {
      const run = (x1 - x0) / steps;
      for (let s = 0; s < steps; s++) {
        const x = x0 + run * s;
        walls.push(v(x, sy, z - 0.35), v(x, sy + rise, z - 0.35), v(x, sy + rise, z - 0.35), v(x + run, sy + rise, z - 0.35));
        walls.push(v(x, sy + rise, z + 0.35), v(x + run, sy + rise, z + 0.35));
        sy += rise;
      }
    };
    flight(-4.25, -3.0, -2.6);
    walls.push(v(-3.0, sy, -2.95), v(-2.65, sy, -2.95), v(-2.65, sy, -2.95), v(-2.65, sy, -1.45), v(-2.65, sy, -1.45), v(-3.0, sy, -1.45));
    flight(-3.0, -4.25, -1.85);
    lvl.add(lines(walls, mWall));

    // door swings + technical shaft around the risers
    const fnt: V[] = [];
    for (const x of [-1.7, 0.9, 3.3]) {
      arcSegs(fnt, x, 0.15, -0.3, 0.55, Math.PI / 2, Math.PI, 8);
      fnt.push(v(x, 0.15, -0.3), v(x, 0.15, 0.25));
    }
    for (const x of i === 0 ? [-3.0, 0.4] : [-3.0, 0, 3.0]) {
      arcSegs(fnt, x, 0.15, 1.1, 0.55, Math.PI, Math.PI * 1.5, 8);
      fnt.push(v(x, 0.15, 1.1), v(x, 0.15, 0.55));
    }
    boxSegs(fnt, 3.625, 0.07 + H / 2, -2.3, 1.25, H - 0.14, 0.7);
    lvl.add(lines(fnt, mFaint));

    // ---- air: risers, supply + return networks
    const yd = H - 0.45; // supply level
    const yr = H - 0.85; // return level
    duct(lvl, [v(RS.x, H, RS.z), v(RS.x, i === 0 ? yd : 0.14, RS.z)], 'cool', 0.16);
    duct(lvl, [v(RR.x, i === 0 ? yr : 0.14, RR.z), v(RR.x, H, RR.z)], 'warm', 0.15);
    duct(lvl, [v(RS.x, yd, RS.z), v(RS.x, yd, -0.7), v(-3.6, yd, -0.7), v(-3.6, yd, 1.9), v(2.2, yd, 1.9)], 'cool', 0.13);
    duct(lvl, [v(-2.8, yr, 0.6), v(RR.x, yr, 0.6), v(RR.x, yr, RR.z)], 'warm', 0.12);

    // VAV box + fire damper, diffusers (supply)
    const cl: V[] = [];
    boxSegs(cl, 2.3, yd, -0.7, 0.62, 0.36, 0.42);
    boxSegs(cl, RS.x, yd, -1.45, 0.4, 0.4, 0.08);
    for (const [x, z] of [[1.4, -0.7], [-1.0, -0.7], [-3.6, 0.6], [-1.6, 1.9], [1.2, 1.9]] as const) {
      boxSegs(cl, x, yd - 0.35, z, 0.5, 0.05, 0.5);
      boxSegs(cl, x, yd - 0.35, z, 0.28, 0.05, 0.28);
      cl.push(v(x, yd, z), v(x, yd - 0.33, z));
    }
    lvl.add(lines(cl, mCoolLine));
    // return grilles with blades
    const wl: V[] = [];
    for (const x of [-2.0, 0.8]) {
      boxSegs(wl, x, yr - 0.3, 0.6, 0.6, 0.05, 0.3);
      for (let k = -2; k <= 2; k++) wl.push(v(x + k * 0.1, yr - 0.3, 0.47), v(x + k * 0.1, yr - 0.3, 0.73));
      wl.push(v(x, yr, 0.6), v(x, yr - 0.28, 0.6));
    }
    lvl.add(lines(wl, mWarmLine));

    // ---- hydronic heating: risers, flow (warm) / return (cool) pipes, radiators under the glazing
    const pr = 0.045;
    const yF = 0.32;
    const yR = 0.24;
    if (i === 0) {
      // boiler room: boiler + expansion vessel + pipework
      equip(lvl, 3.55, 0.74, 1.75, 0.7, 1.2, 0.6);
      const ev = edges(new THREE.CylinderGeometry(0.17, 0.17, 0.55, 18), mLine);
      ev.position.set(2.95, 0.44, 2.6);
      lvl.add(ev);
      const bd: V[] = [];
      for (let k = 0; k < 4; k++) bd.push(v(3.25, 0.4 + k * 0.18, 2.055), v(3.85, 0.4 + k * 0.18, 2.055));
      lvl.add(lines(bd, mFaint));
      label(lvl, fr ? 'CHAUD. 01' : 'BOILER 01', v(3.55, 1.75, 1.75), 0.38, 'warm', 'box');
      duct(lvl, [v(3.55, 1.34, 1.85), v(3.55, 1.6, 1.85), v(HF.x, 1.6, HF.z), v(HF.x, H, HF.z)], 'warm', pr, true);
      duct(lvl, [v(3.25, yF, 1.75), v(2.5, yF, 1.75), v(2.5, yF, HF.z), v(-4.1, yF, HF.z)], 'warm', pr, true);
      duct(lvl, [v(-4.1, yR, HR.z), v(2.75, yR, HR.z), v(2.75, yR, 1.95), v(3.2, yR, 1.95)], 'cool', pr, true);
      duct(lvl, [v(HR.x, H, HR.z), v(HR.x, 1.0, HR.z), v(HR.x, 1.0, 1.75), v(3.9, 1.0, 1.75)], 'cool', pr, true);
    } else {
      duct(lvl, [v(HF.x, 0, HF.z), v(HF.x, top ? yF : H, HF.z)], 'warm', pr, true);
      duct(lvl, [v(HF.x, yF, HF.z), v(-4.1, yF, HF.z)], 'warm', pr, true);
      duct(lvl, [v(-4.1, yR, HR.z), v(HR.x, yR, HR.z)], 'cool', pr, true);
      duct(lvl, [v(HR.x, top ? yR : H, HR.z), v(HR.x, 0, HR.z)], 'cool', pr, true);
    }
    const rad: V[] = [];
    const radH = 0.42;
    for (const x of [-3.4, -1.2, 1.2]) {
      boxSegs(rad, x, 0.62, 2.86, 0.9, radH, 0.07);
      for (let k = 1; k < 8; k++) rad.push(v(x - 0.45 + k * 0.1125, 0.62 - radH / 2, 2.9), v(x - 0.45 + k * 0.1125, 0.62 + radH / 2, 2.9));
      rad.push(v(x - 0.38, yF, HF.z), v(x - 0.38, 0.41, 2.84), v(x + 0.38, yR, HR.z), v(x + 0.38, 0.41, 2.84));
    }
    // ground floor entrance: door frame + canopy on posts
    if (i === 0) {
      rad.push(v(-0.6, 0.14, D / 2), v(-0.6, 2.05, D / 2), v(-0.6, 2.05, D / 2), v(0.6, 2.05, D / 2), v(0.6, 2.05, D / 2), v(0.6, 0.14, D / 2));
      rad.push(v(0, 0.14, D / 2), v(0, 2.05, D / 2));
      boxSegs(rad, 0, 2.2, D / 2 + 0.6, 2.6, 0.08, 1.2);
      rad.push(v(-1.2, 2.16, D / 2 + 1.15), v(-1.2, 0.0, D / 2 + 1.15), v(1.2, 2.16, D / 2 + 1.15), v(1.2, 0.0, D / 2 + 1.15));
    }
    lvl.add(lines(rad, mLine));

    groundNext = i === 0;
    datum(lvl, `${fr ? 'R+' : 'L'}${i}  ${i === 0 ? '±' : '+'}${elev(i * H)}`);
    groundNext = false;
  }

  // roof: parapet, CTA, chiller, PV, hatch, exhaust
  const roof = new THREE.Group();
  roof.userData.base = FLOORS * H;
  root.add(roof);
  levels.push(roof);
  slabWithEdges(roof);
  {
    const par: V[] = [];
    const c = [v(-W / 2, 0.45, -D / 2), v(W / 2, 0.45, -D / 2), v(W / 2, 0.45, D / 2), v(-W / 2, 0.45, D / 2)];
    for (let k = 0; k < 4; k++) par.push(c[k], c[(k + 1) % 4], c[k], v(c[k].x, 0.14, c[k].z));
    roof.add(lines(par, mFaint));

    // ---- air-handling unit (CTA): body, sections, filter, coil, intake louvres, base rails
    equip(roof, 0, 0.79, -2.3, 3.4, 1.3, 1.3);
    const ct: V[] = [];
    for (const x of [-1.15, -0.6, 0.4]) ct.push(v(x, 0.14, -1.65), v(x, 1.44, -1.65));
    for (let k = 0; k < 7; k++) ct.push(v(-1.7, 0.3 + k * 0.17, -2.85), v(-1.7, 0.3 + k * 0.17, -1.75));
    for (let k = 0; k < 6; k++) ct.push(v(-1.5 + (k % 2) * 0.35, 0.25 + k * 0.2, -1.64), v(-1.5 + ((k + 1) % 2) * 0.35, 0.25 + (k + 1) * 0.2, -1.64));
    for (let k = 0; k < 5; k++) ct.push(v(-0.45 + k * 0.17, 0.25, -1.64), v(-0.45 + k * 0.17, 1.33, -1.64));
    ct.push(v(-1.8, 0.14, -2.75), v(1.8, 0.14, -2.75), v(-1.8, 0.14, -1.85), v(1.8, 0.14, -1.85));
    boxSegs(ct, -3.6, 1.95, -2.3, 0.5, 0.16, 0.5); // exhaust cowl
    boxSegs(ct, -3.4, 0.24, -1.75, 0.8, 0.2, 0.5); // roof hatch above the stair
    roof.add(lines(ct, mLine));
    fan(roof, v(1.0, 0.79, -1.64), 0.45, 'z', 6);
    label(roof, fr ? 'CTA 01' : 'AHU 01', v(0, 1.95, -2.3), 0.46, 'cool', 'box');

    duct(roof, [v(1.7, 0.45, RS.z), v(RS.x, 0.45, RS.z), v(RS.x, 0.0, RS.z)], 'cool', 0.16);
    duct(roof, [v(RR.x, 0.0, RR.z), v(RR.x, 1.05, RR.z), v(1.7, 1.05, RR.z)], 'warm', 0.15);
    duct(roof, [v(-3.6, 0.6, -2.3), v(-1.7, 0.6, -2.3)], 'cool', 0.13);
    duct(roof, [v(-1.7, 1.05, -2.3), v(-3.6, 1.05, -2.3), v(-3.6, 1.8, -2.3)], 'warm', 0.13);

    // ---- chiller with two top fans + chilled-water pipes to the CTA coil
    equip(roof, 2.6, 0.64, 1.45, 2.0, 1.0, 1.3);
    const ch: V[] = [];
    for (let k = 1; k < 10; k++) ch.push(v(1.6 + k * 0.2, 0.24, 2.105), v(1.6 + k * 0.2, 1.04, 2.105));
    roof.add(lines(ch, mFaint));
    fan(roof, v(2.1, 1.15, 1.45), 0.38, 'y', 9);
    fan(roof, v(3.1, 1.15, 1.45), 0.38, 'y', 9);
    label(roof, fr ? 'GF 01' : 'CH 01', v(2.6, 1.85, 1.45), 0.42, 'cool', 'box');
    duct(roof, [v(1.85, 0.36, 0.8), v(1.85, 0.36, -1.2), v(0.9, 0.36, -1.2), v(0.9, 0.36, -1.64)], 'cool', 0.05, true);
    duct(roof, [v(0.65, 0.26, -1.64), v(0.65, 0.26, -1.0), v(2.15, 0.26, -1.0), v(2.15, 0.26, 0.8)], 'warm', 0.05, true);

    // ---- PV array: 3 tilted rows with cell divisions and supports
    const pv: V[] = [];
    const tilt = 0.45;
    const dz = Math.cos(tilt) * 0.31, dy = Math.sin(tilt) * 0.31;
    for (const z of [0.55, 1.45, 2.35]) {
      const g = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 0.62), mSlab);
      g.rotation.x = -Math.PI / 2 + tilt;
      g.position.set(-2.4, 0.42, z);
      roof.add(g);
      const lo = [0.42 - dy, z + dz], hi = [0.42 + dy, z - dz];
      for (let k = 0; k <= 5; k++) {
        const x = -4.1 + k * 0.68;
        pv.push(v(x, lo[0], lo[1]), v(x, hi[0], hi[1]));
      }
      pv.push(v(-4.1, lo[0], lo[1]), v(-0.7, lo[0], lo[1]), v(-4.1, hi[0], hi[1]), v(-0.7, hi[0], hi[1]), v(-4.1, 0.42, z), v(-0.7, 0.42, z));
      for (const x of [-3.9, -0.9]) pv.push(v(x, 0.14, lo[1]), v(x, lo[0], lo[1]), v(x, 0.14, hi[1]), v(x, hi[0], hi[1]));
    }
    roof.add(lines(pv, mFaint));

    datum(roof, `${fr ? 'TOIT.' : 'ROOF'}  +${elev(FLOORS * H)}`);
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

  // labels use IBM Plex Mono: redraw once the web font is ready
  document.fonts?.ready.then(() => labels.forEach(drawLabel)).catch(() => {});

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
    // ducts and pipes grow once the floors have landed
    const grow = ease((k3 - 1.4) / 1.6);
    for (const tb of tubes) {
      const geo = tb.geometry as THREE.BufferGeometry;
      const cnt = geo.index ? geo.index.count : geo.attributes.position.count;
      geo.setDrawRange(0, Math.floor(cnt * grow));
    }
    // drawing annotations fade in last
    const lab = ease((k3 - 2.2) / 1.0);
    const gnd = lab * Math.max(0, 1 - explodeT * 2.5); // ground annotations clear the HUD as floors separate
    for (const l of labels) (l.sp.material as THREE.SpriteMaterial).opacity = 0.92 * (l.ground ? gnd : lab);
    mAxis.opacity = 0.45 * gnd;
    mAnno.opacity = (theme.dark ? 0.7 : 0.8) * gnd;

    // air & water particles
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

    for (const f of fans) f.obj.rotation.z = opts.reduce ? 0.4 : t * f.speed;
    const top = FLOORS * H + explodeT * FLOORS * GAP + 1.4;
    cut.position.y = (0.5 + 0.5 * Math.sin(t * 0.45)) * top;
    cut.visible = !opts.reduce && intro > 0.7;

    // orbit: slow auto-rotation + mouse
    const az = -0.7 + (opts.reduce ? 0 : t * 0.07) + ry * 0.45;
    root.rotation.y = az;
    const cy = 2.7 + explodeT * 2.4;
    const dist = (camera.aspect < 1.3 ? 27 : 32) + explodeT * 5;
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
      for (const l of labels) (l.sp.material as THREE.SpriteMaterial).map?.dispose();
      renderer.dispose();
    },
  };
}
