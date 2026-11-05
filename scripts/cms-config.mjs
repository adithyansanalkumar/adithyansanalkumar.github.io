// Generates public/admin/config.yml (the admin panel's forms).
// Runs automatically before every build. The "Textes du site" form is built
// from src/content/settings/texts.json, so every text on the site is editable.
import fs from 'node:fs';

const REPO = 'adithyansanalkumar/adithyansanalkumar.github.io';
const texts = JSON.parse(fs.readFileSync('src/content/settings/texts.json', 'utf8'));

const labels = {
  htmlLang: 'Code langue (ne pas modifier)', metaTitle: 'Titre (onglet + Google)', metaDesc: 'Description (Google + LinkedIn)',
  nav: 'Menu', hero: 'Accueil (haut de page)', stats: 'Chiffres clés', sections: 'Titres des sections', table: 'Tableau expertise',
  filters: 'Filtres projets', works: 'Réalisations', contact: 'Contact', project: 'Page projet', footer: 'Pied de page',
  notFound: 'Page 404', marquee: 'Bandeau défilant (mots)', intro: 'Texte de présentation', role: 'Métier',
  plate: 'Petit texte au-dessus du nom', ctaWorks: 'Bouton projets', ctaCv: 'Bouton CV', title: 'Titre', sub: 'Sous-titre', n: 'Numéro',
};
const human = (k) => labels[k] || k.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase());
const longKeys = /intro|desc|lead|text|sent|failed|soon|empty|gallerySoon|modelSoon/i;

function fieldsFor(obj) {
  return Object.entries(obj).map(([k, v]) => {
    if (Array.isArray(v)) return { name: k, label: human(k), widget: 'list', field: { name: 'item', label: 'Élément', widget: 'string' } };
    if (v && typeof v === 'object') return { name: k, label: human(k), widget: 'object', collapsed: true, fields: fieldsFor(v) };
    return { name: k, label: human(k), widget: longKeys.test(k) && String(v).length > 60 ? 'text' : 'string', required: false };
  });
}

const s = (name, label, extra = {}) => ({ name, label, widget: 'string', required: false, ...extra });
const strList = (name, label) => ({ name, label, widget: 'list', required: false, field: { name: 'item', label, widget: 'string' } });
const fr_en = (name, label, widget = 'string') => [
  { name: `${name}_fr`, label: `${label} (FR)`, widget, required: false },
  { name: `${name}_en`, label: `${label} (EN)`, widget, required: false },
];

const config = {
  backend: { name: 'github', repo: REPO, branch: 'main' },
  site_url: `https://${REPO.split('/')[1]}`,
  locale: 'fr',
  media_folder: '/public/uploads',
  public_folder: '/uploads',
  collections: [
    {
      name: 'projects',
      label: 'Projets',
      label_singular: 'Projet',
      folder: '/src/content/projects',
      format: 'json',
      extension: 'json',
      create: true,
      delete: true,
      identifier_field: 'title_fr',
      slug: '{{title_fr}}',
      summary: '{{order}}. {{title_fr}}',
      sortable_fields: ['order', 'title_fr'],
      fields: [
        { name: 'order', label: 'Ordre d’affichage (1 = premier)', widget: 'number', value_type: 'int', default: 10 },
        { name: 'hidden', label: 'Masquer ce projet', widget: 'boolean', default: false, required: false },
        ...fr_en('title', 'Titre'),
        {
          name: 'category', label: 'Catégorie', widget: 'select',
          options: [
            { label: 'BIM CVC', value: 'bim' }, { label: 'Automatisation', value: 'auto' }, { label: 'AutoCAD', value: 'cad' },
            { label: 'Audit', value: 'audit' }, { label: 'Thermique', value: 'thermal' },
          ],
        },
        {
          name: 'art', label: 'Illustration (si pas d’image)', widget: 'select', required: false,
          options: [
            { label: 'Bâtiment BIM', value: 'bim' }, { label: 'Barre d’outils', value: 'auto' }, { label: 'Schéma hydraulique', value: 'cad' },
            { label: 'Chaufferie / audit', value: 'audit' }, { label: 'Maison', value: 'house' },
          ],
        },
        s('year', 'Année / période'),
        ...fr_en('status', 'Statut (ex. Projet BTS)'),
        strList('tools', 'Logiciels / outils'),
        ...fr_en('summary', 'Résumé (carte)', 'text'),
        ...fr_en('context', 'Contexte', 'text'),
        ...fr_en('mission', 'Ma mission', 'text'),
        strList('highlights_fr', 'Points clés (FR)'),
        strList('highlights_en', 'Points clés (EN)'),
        { name: 'cover', label: 'Image principale', widget: 'image', required: false },
        {
          name: 'gallery', label: 'Galerie d’images', widget: 'list', required: false,
          fields: [{ name: 'src', label: 'Image', widget: 'image' }, ...fr_en('alt', 'Légende')],
        },
        { name: 'model', label: 'Maquette 3D (.glb)', widget: 'file', required: false, hint: 'Export GLB depuis Revit, idéalement < 20 Mo' },
        {
          name: 'links', label: 'Documents / liens', widget: 'list', required: false,
          fields: [...fr_en('label', 'Texte du lien'), { name: 'url', label: 'Adresse (URL) ou fichier', widget: 'file', required: false }],
        },
      ],
    },
    {
      name: 'settings',
      label: 'Réglages du site',
      files: [
        {
          name: 'profile', label: 'Profil & contact', file: '/src/content/settings/profile.json',
          fields: [
            s('email', 'E-mail'),
            s('linkedin', 'Lien LinkedIn'),
            { name: 'cv', label: 'CV (PDF)', widget: 'file', required: false, hint: 'Téléversez votre CV en PDF' },
            s('company', 'Entreprise actuelle'),
            ...fr_en('location', 'Localisation'),
            s('goatcounter', 'Statistiques : code GoatCounter', { hint: 'Ex. « adithyansanalkumar » si votre tableau de bord est adithyansanalkumar.goatcounter.com' }),
            s('web3forms_key', 'Formulaire de contact : clé Web3Forms', { hint: 'Clé reçue par e-mail sur web3forms.com (laisser vide pour masquer le formulaire)' }),
          ],
        },
        {
          name: 'timeline', label: 'Parcours', file: '/src/content/settings/timeline.json',
          fields: [{
            name: 'items', label: 'Étapes (la plus récente en premier)', widget: 'list', summary: '{{fields.title_fr}}',
            fields: [
              { name: 'kind', label: 'Type', widget: 'select', options: [{ label: 'Expérience', value: 'work' }, { label: 'Formation', value: 'school' }] },
              { name: 'current', label: 'Poste actuel', widget: 'boolean', default: false, required: false },
              ...fr_en('period', 'Période'), ...fr_en('title', 'Intitulé'),
              s('org', 'Entreprise / école'), s('place', 'Lieu'),
              strList('points_fr', 'Détails (FR)'), strList('points_en', 'Détails (EN)'),
            ],
          }],
        },
        {
          name: 'skills', label: 'Chiffres, expertise & logiciels', file: '/src/content/settings/skills.json',
          fields: [
            {
              name: 'stats', label: 'Chiffres clés', widget: 'list', summary: '{{fields.value}}{{fields.suffix}} {{fields.label_fr}}',
              fields: [{ name: 'value', label: 'Valeur', widget: 'number', value_type: 'int' }, s('suffix', 'Suffixe (ex. +)'), ...fr_en('label', 'Libellé'), ...fr_en('note', 'Note')],
            },
            {
              name: 'expertise', label: 'Expertise', widget: 'list', summary: '{{fields.title_fr}}',
              fields: [s('ref', 'Réf. (ex. M-01)'), ...fr_en('title', 'Domaine'), ...fr_en('desc', 'Description', 'text'), strList('tools', 'Outils')],
            },
            {
              name: 'software', label: 'Logiciels', widget: 'list', summary: '{{fields.name}}',
              fields: [s('name', 'Nom'), s('code', 'Abréviation (2-3 lettres)'), ...fr_en('note', 'Usage')],
            },
          ],
        },
        {
          name: 'texts', label: 'Textes du site (tous)', file: '/src/content/settings/texts.json',
          fields: [
            { name: 'fr', label: 'Français', widget: 'object', fields: fieldsFor(texts.fr) },
            { name: 'en', label: 'English', widget: 'object', fields: fieldsFor(texts.en) },
          ],
        },
      ],
    },
  ],
};

// JSON is valid YAML: write it as config.yml
fs.writeFileSync('public/admin/config.yml', '# Generated by scripts/cms-config.mjs — edit that file instead.\n' + JSON.stringify(config, null, 2) + '\n');
console.log('admin config written');
