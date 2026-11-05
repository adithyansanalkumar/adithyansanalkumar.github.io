/* =====================================================================
   Client-side behaviour: smooth scroll, scroll-drawn duct, reveals,
   counters, filters, theme, copy-to-clipboard, lightbox, 3D viewer.
   Everything degrades gracefully: with JS off or "reduce motion" on,
   all content is visible and usable.
===================================================================== */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => r.querySelector<T>(s);
const $$ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => Array.from(r.querySelectorAll<T>(s));

/* ---------- Smooth scroll (Lenis) synced with GSAP ---------- */
let lenis: Lenis | null = null;
if (!reduce) {
  lenis = new Lenis({ duration: 1.15, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis!.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

function scrollToTarget(target: HTMLElement | string) {
  const el = typeof target === 'string' ? (target === '#main' || target === '#top' ? document.body : $(target)) : target;
  if (!el) return;
  if (lenis) lenis.scrollTo(el === document.body ? 0 : (el as HTMLElement), { offset: -90 });
  else (el === document.body ? window.scrollTo({ top: 0 }) : el.scrollIntoView());
}

// In-page anchor links use the smooth scroller
document.addEventListener('click', (e) => {
  const a = (e.target as HTMLElement).closest('a');
  if (!a) return;
  const raw = a.getAttribute('href') || '';
  const hash = raw.startsWith('#') ? raw : '';
  if (!hash || hash.length < 2) return;
  if (hash !== '#main' && !$(hash)) return;
  e.preventDefault();
  closeMenu();
  scrollToTarget(hash);
  if (hash !== '#main') history.replaceState(null, '', hash);
  // move keyboard focus for accessibility
  const focusEl = hash === '#main' ? $('#main') : $(hash);
  focusEl?.setAttribute('tabindex', '-1');
  focusEl?.focus({ preventScroll: true });
});

// Arriving from another page with a #hash
window.addEventListener('load', () => {
  if (location.hash && $(location.hash)) setTimeout(() => scrollToTarget(location.hash), 80);
});

/* ---------- Header: background on scroll, hide on scroll down ---------- */
const hdr = $('[data-hdr]');
const nav = $('[data-nav]');
const burger = $<HTMLButtonElement>('[data-burger]');
let lastY = 0;
function onScroll() {
  const y = window.scrollY;
  hdr?.classList.toggle('is-scrolled', y > 20);
  const menuOpen = nav?.classList.contains('is-open');
  if (!menuOpen) hdr?.classList.toggle('is-hidden', y > 500 && y > lastY + 2);
  if (y < lastY - 2) hdr?.classList.remove('is-hidden');
  lastY = y;
  updateLevel(y);
}
window.addEventListener('scroll', onScroll, { passive: true });
hdr?.addEventListener('focusin', () => hdr.classList.remove('is-hidden'));

function closeMenu() {
  nav?.classList.remove('is-open');
  burger?.setAttribute('aria-expanded', 'false');
}
burger?.addEventListener('click', () => {
  const open = !nav?.classList.contains('is-open');
  nav?.classList.toggle('is-open', open);
  burger.setAttribute('aria-expanded', String(open));
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && nav?.classList.contains('is-open')) {
    closeMenu();
    burger?.focus();
  }
});

/* ---------- Elevation marker (scroll depth in "metres") ---------- */
const levelEl = $('[data-level]');
function updateLevel(y: number) {
  if (!levelEl) return;
  const m = (y / 100).toFixed(2).replace('.', ',');
  levelEl.textContent = y < 5 ? '±0,00' : `−${m}`;
}

/* ---------- Theme toggle ---------- */
const themeBtn = $<HTMLButtonElement>('[data-theme-toggle]');
function syncThemeBtn() {
  const cur = document.documentElement.getAttribute('data-theme');
  if (!themeBtn) return;
  themeBtn.setAttribute('aria-label', cur === 'dark' ? themeBtn.dataset.labelLight! : themeBtn.dataset.labelDark!);
  const meta = $<HTMLMetaElement>('meta[name="theme-color"]');
  if (meta) meta.content = cur === 'dark' ? '#081325' : '#f3f5f8';
}
syncThemeBtn();
themeBtn?.addEventListener('click', () => {
  const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  try {
    localStorage.setItem('theme', next);
  } catch {}
  syncThemeBtn();
});

/* ---------- Reveal on scroll ---------- */
const revealEls = $$('[data-reveal]');
if (reduce || !('IntersectionObserver' in window)) {
  revealEls.forEach((el) => el.classList.add('is-in'));
} else {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        const el = en.target as HTMLElement;
        // small stagger between siblings entering together
        const sibs = el.parentElement ? $$(':scope > [data-reveal]', el.parentElement) : [];
        const i = Math.max(0, sibs.indexOf(el));
        el.style.transitionDelay = `${Math.min(i % 6, 5) * 70}ms`;
        el.classList.add('is-in');
        io.unobserve(el);
      });
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
  );
  revealEls.forEach((el) => io.observe(el));
}

/* ---------- Counters ---------- */
$$('[data-count]').forEach((el) => {
  const end = Number(el.dataset.count || 0);
  if (reduce) return;
  const obj = { v: 0 };
  el.textContent = '0';
  ScrollTrigger.create({
    trigger: el,
    start: 'top 90%',
    once: true,
    onEnter: () =>
      gsap.to(obj, {
        v: end,
        duration: 1.6,
        ease: 'power3.out',
        onUpdate: () => (el.textContent = String(Math.round(obj.v))),
      }),
  });
});

/* ---------- Hero intro ---------- */
const heroLines = $$('[data-hero-line]');
if (heroLines.length && !reduce) {
  const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
  tl.from(heroLines, { yPercent: 110, duration: 1.3, stagger: 0.12 })
    .from('[data-hero-item]', { y: 24, opacity: 0, duration: 1, stagger: 0.08 }, '-=0.9');

  // Draw every line of the hero schematic
  const drawPaths = $$<SVGGeometryElement>('.hd [data-draw] path, .hd [data-draw] rect, .hd [data-draw] circle, .hd .duct');
  drawPaths.forEach((p) => {
    const len = p.getTotalLength ? p.getTotalLength() : 600;
    p.style.strokeDasharray = `${len}`;
    p.style.strokeDashoffset = `${len}`;
  });
  tl.to(drawPaths, { strokeDashoffset: 0, duration: 1.6, stagger: 0.025, ease: 'power2.inOut' }, 0.2);
  tl.from('.hd .flow, .hd text, .hd__fan', { opacity: 0, duration: 0.8, stagger: 0.02 }, 1.2);
  tl.add(() => drawPaths.forEach((p) => (p.style.strokeDasharray = '')), '>');

  // Gentle parallax of the drawing while leaving the hero
  gsap.to('[data-hero-art]', {
    yPercent: 12,
    ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
  });
}

/* ---------- Marquee driven by scroll ---------- */
const track = $('[data-marquee]');
if (track && !reduce) {
  gsap.fromTo(
    track,
    { xPercent: 0 },
    {
      xPercent: -33.333,
      ease: 'none',
      scrollTrigger: { trigger: track.parentElement, start: 'top bottom', end: 'bottom top', scrub: 0.6 },
    },
  );
}

/* ---------- The scroll-drawn duct ---------- */
const zone = $('[data-duct-zone]');
if (zone) initDuct(zone);

function initDuct(zone: HTMLElement) {
  const svg = $<SVGSVGElement>('[data-duct]', zone)!;
  const base = $<SVGPathElement>('[data-duct-base]', svg)!;
  const body = $<SVGPathElement>('[data-duct-body]', svg)!;
  const flow = $<SVGPathElement>('[data-duct-flow]', svg)!;
  const maskPath = $<SVGPathElement>('[data-duct-maskpath]', svg)!;
  const head = $<SVGCircleElement>('[data-duct-head]', svg)!;
  const grad = $<SVGLinearGradientElement>('[data-duct-grad]', svg)!;
  const branchesG = $<SVGGElement>('[data-duct-branches]', svg)!;
  const NS = 'http://www.w3.org/2000/svg';

  let total = 0;
  let nodes: { at: number; g: SVGGElement; len: number; p: SVGPathElement }[] = [];
  let st: ScrollTrigger | null = null;

  function build() {
    const zr = zone.getBoundingClientRect();
    const W = zr.width;
    const H = zone.scrollHeight;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.setAttribute('height', String(H));
    grad.setAttribute('y2', String(H));

    const wrap = $('.wrap', zone)!;
    const contentLeft = wrap.getBoundingClientRect().left - zr.left + parseFloat(getComputedStyle(wrap).paddingLeft);
    const x = Math.max(8, Math.round(contentLeft / 2));
    const y0 = 0;
    const yEnd = H - 40;
    const d = `M${x} ${y0}V${yEnd}`;
    [base, body, flow, maskPath].forEach((p) => p.setAttribute('d', d));
    total = yEnd - y0;
    body.style.strokeDasharray = `${total}`;
    maskPath.style.strokeDasharray = `${total}`;

    // branches to each section title block
    branchesG.innerHTML = '';
    nodes = $$('[data-duct-node]', zone).map((n, i) => {
      const r = n.getBoundingClientRect();
      const y = Math.round(r.top - zr.top + Math.min(r.height / 2, 44));
      const x2 = Math.round(r.left - zr.left) - 2;
      const g = document.createElementNS(NS, 'g');
      const color = i % 2 ? 'var(--warm)' : 'var(--cool)';
      const p = document.createElementNS(NS, 'path');
      const len = Math.max(0, x2 - x - 6);
      p.setAttribute('d', `M${x} ${y}H${x + len}`);
      p.setAttribute('class', 'br');
      p.style.stroke = color;
      p.style.strokeDasharray = `${len}`;
      p.style.strokeDashoffset = `${len}`;
      const term = document.createElementNS(NS, 'rect');
      term.setAttribute('x', String(x - 6));
      term.setAttribute('y', String(y - 6));
      term.setAttribute('width', '12');
      term.setAttribute('height', '12');
      term.setAttribute('transform', `rotate(45 ${x} ${y})`);
      term.setAttribute('class', 'br-term');
      term.style.stroke = color;
      g.append(p, term);
      branchesG.append(g);
      return { at: y - y0, g, len, p };
    });
  }

  function render(progress: number) {
    const drawn = total * progress;
    const off = String(total - drawn);
    body.style.strokeDashoffset = off;
    maskPath.style.strokeDashoffset = off;
    const pt = body.getPointAtLength(Math.max(0, Math.min(drawn, total)));
    head.setAttribute('cx', String(pt.x));
    head.setAttribute('cy', String(pt.y));
    nodes.forEach((n) => {
      const on = drawn >= n.at;
      if (on !== n.g.classList.contains('br-on')) {
        n.g.classList.toggle('br-on', on);
        n.p.style.strokeDashoffset = on ? '0' : String(n.len);
      }
    });
  }

  build();
  if (reduce) {
    render(1);
  } else {
    st = ScrollTrigger.create({
      trigger: zone,
      start: 'top 75%',
      end: 'bottom bottom',
      scrub: 0.4,
      onUpdate: (self) => render(self.progress),
      onRefresh: (self) => render(self.progress),
    });
    render(0);
  }

  let t: number | undefined;
  const ro = new ResizeObserver(() => {
    clearTimeout(t);
    t = window.setTimeout(() => {
      build();
      if (st) {
        ScrollTrigger.refresh();
        render(st.progress);
      } else render(1);
    }, 150);
  });
  ro.observe(zone);
}

/* ---------- Active nav link ---------- */
const navLinks = $$<HTMLAnchorElement>('[data-navlink]');
if (navLinks.length && 'IntersectionObserver' in window) {
  const map = new Map(navLinks.map((a) => [a.dataset.navlink!, a]));
  const so = new IntersectionObserver(
    (entries) => {
      entries.forEach((en) => {
        const a = map.get(en.target.id);
        if (!a) return;
        if (en.isIntersecting) {
          navLinks.forEach((l) => {
            l.classList.remove('is-active');
            l.removeAttribute('aria-current');
          });
          a.classList.add('is-active');
          a.setAttribute('aria-current', 'true');
        }
      });
    },
    { rootMargin: '-45% 0px -50% 0px' },
  );
  $$('[data-section]').forEach((s) => so.observe(s));
}

/* ---------- Project filters ---------- */
const filterBtns = $$<HTMLButtonElement>('[data-filter]');
if (filterBtns.length) {
  const cards = $$('[data-grid] > [data-cat]');
  const empty = $('[data-empty]');
  const status = $('[data-filter-status]');
  filterBtns.forEach((b) =>
    b.addEventListener('click', () => {
      const f = b.dataset.filter!;
      filterBtns.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      let shown = 0;
      cards.forEach((c) => {
        const ok = f === 'all' || c.dataset.cat === f;
        c.classList.toggle('is-hidden', !ok);
        if (ok) {
          shown++;
          c.classList.add('is-in');
          if (!reduce) gsap.fromTo(c, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.5, delay: shown * 0.05, clearProps: 'opacity,transform' });
        }
      });
      if (empty) empty.hidden = shown > 0;
      if (status) status.textContent = `${shown} / ${cards.length}`;
      ScrollTrigger.refresh();
    }),
  );
}

/* ---------- Copy email ---------- */
$$<HTMLButtonElement>('[data-copy]').forEach((btn) => {
  const label = $('[data-copy-label]', btn);
  const status = $('[data-copy-status]');
  const original = label?.textContent || '';
  btn.addEventListener('click', async () => {
    let ok = false;
    try {
      await navigator.clipboard.writeText(btn.dataset.copy!);
      ok = true;
    } catch {
      ok = false;
    }
    const msg = ok ? btn.dataset.copied! : btn.dataset.copyfail!;
    if (label) label.textContent = msg;
    if (status) status.textContent = msg;
    setTimeout(() => label && (label.textContent = original), 2200);
  });
});

/* ---------- Lightbox (project galleries) ---------- */
const dlg = $<HTMLDialogElement>('[data-lightbox]');
if (dlg) {
  const img = $<HTMLImageElement>('img', dlg)!;
  const cap = $('[data-lb-cap]', dlg);
  $$<HTMLAnchorElement>('[data-lb]').forEach((a) =>
    a.addEventListener('click', (e) => {
      e.preventDefault();
      img.src = a.href;
      img.alt = a.dataset.alt || '';
      if (cap) cap.textContent = a.dataset.alt || '';
      dlg.showModal();
      lenis?.stop();
    }),
  );
  dlg.addEventListener('close', () => lenis?.start());
  dlg.addEventListener('click', (e) => {
    if (e.target === dlg) dlg.close();
  });
}

/* ---------- 3D model viewer: load the library only when needed ---------- */
$$<HTMLButtonElement>('[data-model-load]').forEach((btn) =>
  btn.addEventListener('click', async () => {
    const host = btn.closest('[data-model]') as HTMLElement;
    const src = host.dataset.model!;
    btn.disabled = true;
    btn.setAttribute('aria-busy', 'true');
    try {
      await import('@google/model-viewer');
      const mv = document.createElement('model-viewer');
      mv.setAttribute('src', src);
      mv.setAttribute('alt', host.dataset.alt || '3D model');
      mv.setAttribute('camera-controls', '');
      mv.setAttribute('auto-rotate', '');
      mv.setAttribute('shadow-intensity', '0.6');
      mv.setAttribute('exposure', '1');
      mv.setAttribute('touch-action', 'pan-y');
      mv.addEventListener('error', () => {
        host.classList.add('is-error');
      });
      $('[data-model-stage]', host)!.replaceChildren(mv);
      host.classList.add('is-loaded');
    } catch {
      host.classList.add('is-error');
      btn.disabled = false;
    }
    btn.removeAttribute('aria-busy');
  }),
);

// Recalculate trigger positions once fonts/images have settled
window.addEventListener('load', () => ScrollTrigger.refresh());
onScroll();
