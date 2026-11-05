/* ------------------------------------------------------------------
   PROJECTS are stored one per file in  src/content/projects/*.json
   Add / edit them from the admin panel (https://<site>/admin/)
   or by copying an existing JSON file.  The file name is the URL.
------------------------------------------------------------------- */

import type { L } from './site';

export type Category = 'bim' | 'auto' | 'cad' | 'audit' | 'thermal';
type Art = 'bim' | 'auto' | 'cad' | 'audit' | 'house';

export const categories: Record<Category, L> = {
  bim: { fr: 'BIM CVC', en: 'HVAC BIM' },
  auto: { fr: 'Automatisation', en: 'Automation' },
  cad: { fr: 'AutoCAD', en: 'AutoCAD' },
  audit: { fr: 'Audit', en: 'Audit' },
  thermal: { fr: 'Thermique', en: 'Thermal' },
};

export type Project = {
  slug: string;
  title: L;
  category: Category;
  art: Art;
  year?: string;
  status?: L;
  tools: string[];
  summary: L;
  context?: L;
  mission?: L;
  highlights?: { fr: string[]; en: string[] };
  cover?: string;
  gallery?: { src: string; alt: L }[];
  model?: string;
  links?: { label: L; url: string }[];
};

const files = import.meta.glob('../content/projects/*.json', { eager: true, import: 'default' }) as Record<string, any>;

const both = (o: any, k: string): L => ({ fr: o?.[`${k}_fr`] ?? '', en: o?.[`${k}_en`] ?? '' });
// Optional bilingual text: falls back to the other language, undefined if both empty
const opt = (o: any, k: string): L | undefined => {
  const fr = (o?.[`${k}_fr`] || '').trim();
  const en = (o?.[`${k}_en`] || '').trim();
  if (!fr && !en) return undefined;
  return { fr: fr || en, en: en || fr };
};
const catOk = (c: string): Category => (c in categories ? (c as Category) : 'bim');
const artFor = (a: string, c: Category): Art =>
  (['bim', 'auto', 'cad', 'audit', 'house'].includes(a) ? a : { bim: 'bim', auto: 'auto', cad: 'cad', audit: 'audit', thermal: 'house' }[c]) as Art;

export const projects: Project[] = Object.entries(files)
  .map(([path, d]) => ({ slug: path.split('/').pop()!.replace(/\.json$/, ''), d }))
  .filter(({ d }) => !d.hidden)
  .sort((a, b) => (Number(a.d.order) || 99) - (Number(b.d.order) || 99) || a.slug.localeCompare(b.slug))
  .map(({ slug, d }) => {
    const category = catOk(d.category);
    const title = opt(d, 'title') ?? { fr: slug, en: slug };
    const hlFr: string[] = (d.highlights_fr || []).filter(Boolean);
    const hlEn: string[] = (d.highlights_en || []).filter(Boolean);
    return {
      slug,
      title,
      category,
      art: artFor(d.art, category),
      year: d.year || undefined,
      status: opt(d, 'status'),
      tools: (d.tools || []).filter(Boolean),
      summary: opt(d, 'summary') ?? { fr: '', en: '' },
      context: opt(d, 'context'),
      mission: opt(d, 'mission'),
      highlights: hlFr.length || hlEn.length ? { fr: hlFr.length ? hlFr : hlEn, en: hlEn.length ? hlEn : hlFr } : undefined,
      cover: d.cover || undefined,
      gallery: (d.gallery || [])
        .filter((g: any) => g?.src)
        .map((g: any) => ({ src: g.src, alt: both(g, 'alt') })),
      model: d.model || undefined,
      links: (() => {
        const ls = (d.links || []).filter((l: any) => l?.url).map((l: any) => ({ label: opt(l, 'label') ?? { fr: l.url, en: l.url }, url: l.url }));
        return ls.length ? ls : undefined;
      })(),
    } satisfies Project;
  });
