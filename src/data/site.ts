/* ------------------------------------------------------------------
   PROFILE + ALL INTERFACE TEXT (French / English)
   Edit this file to change your contact details, career path, tools
   and every label shown on the site.
------------------------------------------------------------------- */

export type Lang = 'fr' | 'en';
export type L = { fr: string; en: string };

/* Editable content lives in src/content/settings/*.json
   (edit it from the /admin panel or directly in those files). */
import profileData from '../content/settings/profile.json';
import timelineData from '../content/settings/timeline.json';
import skillsData from '../content/settings/skills.json';

const both = (o: any, k: string): L => ({ fr: o[`${k}_fr`] ?? '', en: o[`${k}_en`] ?? '' });

export const profile = {
  firstName: 'Adithyan',
  lastName: 'Sanal Kumar',
  initials: 'ASK',
  email: profileData.email,
  linkedin: profileData.linkedin,
  cvUrl: profileData.cv,
  location: both(profileData, 'location'),
  company: profileData.company,
  // only the account code, e.g. "adithyansanalkumar" (letters, digits, dashes)
  goatcounter: (profileData.goatcounter || '').trim().toLowerCase().replace(/[^a-z0-9-]/g, ''),
  web3formsKey: (profileData.web3forms_key || '').trim(),
};

/* ---------- Career path (most recent first) ---------- */
export type TimelineItem = {
  kind: 'work' | 'school';
  period: L;
  title: L;
  org: string;
  place?: string;
  points?: { fr: string[]; en: string[] };
  current?: boolean;
};

export const timeline: TimelineItem[] = (timelineData.items as any[]).map((it) => ({
  kind: it.kind === 'school' ? 'school' : 'work',
  current: !!it.current,
  period: both(it, 'period'),
  title: both(it, 'title'),
  org: it.org || '',
  place: it.place || undefined,
  points: it.points_fr?.length || it.points_en?.length ? { fr: it.points_fr || [], en: it.points_en || [] } : undefined,
}));

/* ---------- Key figures ---------- */
export const stats = (skillsData.stats as any[]).map((s) => ({
  value: Number(s.value) || 0,
  suffix: s.suffix || '',
  label: both(s, 'label'),
  note: both(s, 'note'),
}));

/* ---------- Expertise "schedule" (nomenclature) ---------- */
export const expertise = (skillsData.expertise as any[]).map((e) => ({
  ref: e.ref || '',
  title: both(e, 'title'),
  desc: both(e, 'desc'),
  tools: (e.tools || []) as string[],
}));

export const tools = (skillsData.software as any[]).map((x) => ({
  code: x.code || x.name.slice(0, 3),
  name: x.name,
  note: both(x, 'note'),
}));

/* ---------- Interface text ---------- */
import textsData from '../content/settings/texts.json';
// All interface texts (FR/EN) — editable in /admin → Textes du site
export const ui = textsData as Record<Lang, any>;

export const base = import.meta.env.BASE_URL.replace(/\/$/, '');
export const href = (p: string) => `${base}${p.startsWith('/') ? p : '/' + p}`;
export const homeUrl = (lang: Lang) => href(lang === 'fr' ? '/' : '/en/');
export const calcUrl = (lang: Lang) => href(lang === 'fr' ? '/calculs/' : '/en/calculations/');
export const projectUrl = (lang: Lang, slug: string) =>
  href(lang === 'fr' ? `/projets/${slug}/` : `/en/projects/${slug}/`);
