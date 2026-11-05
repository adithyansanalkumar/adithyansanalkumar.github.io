/* ------------------------------------------------------------------
   PROFILE + ALL INTERFACE TEXT (French / English)
   Edit this file to change your contact details, career path, tools
   and every label shown on the site.
------------------------------------------------------------------- */

export type Lang = 'fr' | 'en';
export type L = { fr: string; en: string };

export const profile = {
  firstName: 'Adithyan',
  lastName: 'Sanal Kumar',
  initials: 'ASK',
  email: 'adithyansanalkumar@gmail.com',
  linkedin: 'https://www.linkedin.com/in/adithyan-sanal-kumar-abcd/',
  // CV: currently the CV from the old site (Google Drive).
  // To use a new one: drop "cv.pdf" into /public and set cvUrl: '/cv.pdf'
  cvUrl: 'https://drive.google.com/file/d/1Y5geJFNED2zRtBsrxWE8KKP1FGExcQBS/view?usp=sharing',
  location: { fr: 'Île-de-France', en: 'Île-de-France, France' },
  company: 'Derichebourg Énergie',
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

export const timeline: TimelineItem[] = [
  {
    kind: 'work',
    current: true,
    period: { fr: 'Actuellement', en: 'Currently' },
    title: { fr: "Technicien Bureau d'Études CVC", en: 'HVAC Design Office Technician' },
    org: 'Derichebourg Énergie',
    points: {
      fr: ['Études et modélisation BIM des installations CVC', 'Développement d’outils pyRevit pour le bureau d’études'],
      en: ['HVAC studies and BIM modelling', 'Building pyRevit tools for the design office'],
    },
  },
  {
    kind: 'school',
    period: { fr: 'Formation', en: 'Education' },
    title: { fr: 'Licence BIM CVC', en: 'Bachelor’s degree — HVAC BIM' },
    org: 'Licence professionnelle',
  },
  {
    kind: 'school',
    period: { fr: '2025 — 2026', en: '2025 — 2026' },
    title: {
      fr: 'BTS FED — Génie Climatique et Fluidique',
      en: 'BTS FED — HVAC & Fluid Engineering',
    },
    org: 'Lycée Raspail',
    place: 'Paris 14e',
    points: {
      fr: ['Projet de 120 h+ sur Revit : Groupe scolaire Verfeil', 'Projet création d’entreprise : audit technique de chaufferies'],
      en: ['120h+ Revit project: Verfeil school complex', 'Business-creation project: technical audit of boiler rooms'],
    },
  },
  {
    kind: 'work',
    period: { fr: 'Stage', en: 'Internship' },
    title: { fr: 'Stagiaire Maintenance & Performance Énergétique', en: 'Maintenance & Energy Performance Intern' },
    org: 'Dalkia',
    points: {
      fr: ['Suivi et maintenance des installations CVC', 'Relevés techniques sur site', 'Normes de sécurité et procédures d’exploitation'],
      en: ['Monitoring and maintenance of HVAC installations', 'On-site technical surveys', 'Safety standards and operating procedures'],
    },
  },
  {
    kind: 'work',
    period: { fr: '2024', en: '2024' },
    title: { fr: 'Agent Logistique — JO Paris 2024', en: 'Logistics Agent — Paris 2024 Olympics' },
    org: 'Aéroport Charles de Gaulle',
    points: {
      fr: ['Gestion des bagages et équipements sportifs', 'Accueil et orientation des athlètes internationaux'],
      en: ['Handling of luggage and sports equipment', 'Assisting international athletes'],
    },
  },
  {
    kind: 'school',
    period: { fr: '2021 — 2023', en: '2021 — 2023' },
    title: { fr: 'BAC STI2D — Énergie & Environnement', en: 'STI2D Baccalaureate — Energy & Environment' },
    org: 'Le Raincy (93)',
  },
];

/* ---------- Expertise "schedule" (nomenclature) ---------- */
export const expertise = [
  {
    ref: 'M-01',
    title: { fr: 'Modélisation BIM CVC', en: 'HVAC BIM modelling' },
    desc: {
      fr: 'Réseaux aérauliques et hydrauliques, équipements, familles et maquettes coordonnées.',
      en: 'Ductwork and piping networks, equipment, families and coordinated models.',
    },
    tools: ['Revit'],
  },
  {
    ref: 'T-02',
    title: { fr: 'Bilans thermiques', en: 'Heat-load calculations' },
    desc: {
      fr: 'Calcul des déperditions et des puissances pour le dimensionnement des installations.',
      en: 'Heat-loss and load calculations to size heating and cooling systems.',
    },
    tools: ['Perrenoud', 'ClimaBIM'],
  },
  {
    ref: 'S-03',
    title: { fr: 'Schémas & plans', en: 'Schematics & drawings' },
    desc: {
      fr: 'Schémas de principe hydrauliques et aérauliques, plans de réseaux.',
      en: 'Hydronic and air schematic diagrams, network layouts.',
    },
    tools: ['AutoCAD'],
  },
  {
    ref: 'A-04',
    title: { fr: 'Automatisation Revit', en: 'Revit automation' },
    desc: {
      fr: 'Outils sur mesure : réservations automatiques, pertes de charge, calorifuge, contrôle de clashs.',
      en: 'Custom tools: automatic openings, pressure drops, insulation, clash checks.',
    },
    tools: ['pyRevit', 'Python', 'Dynamo'],
  },
  {
    ref: 'E-05',
    title: { fr: 'Exploitation & audit', en: 'Operations & audit' },
    desc: {
      fr: 'Maintenance CVC, relevés sur site et audit technique de chaufferies.',
      en: 'HVAC maintenance, site surveys and technical audits of boiler rooms.',
    },
    tools: ['Terrain', 'Audit'],
  },
];

export const tools = [
  { code: 'Rvt', name: 'Revit', note: { fr: 'Modélisation BIM', en: 'BIM modelling' } },
  { code: 'Cad', name: 'AutoCAD', note: { fr: 'Schémas, plans', en: 'Schematics, plans' } },
  { code: 'Prn', name: 'Perrenoud', note: { fr: 'Bilans thermiques', en: 'Heat loads' } },
  { code: 'Clb', name: 'ClimaBIM', note: { fr: 'Bilans thermiques', en: 'Heat loads' } },
  { code: 'Py', name: 'pyRevit', note: { fr: 'Outils Revit', en: 'Revit tools' } },
  { code: 'Dyn', name: 'Dynamo', note: { fr: 'Scripts visuels', en: 'Visual scripts' } },
];

/* ---------- Interface text ---------- */
export const ui = {
  fr: {
    htmlLang: 'fr',
    metaTitle: "Adithyan Sanal Kumar — Technicien Bureau d'Études CVC",
    metaDesc:
      "Portfolio d'Adithyan Sanal Kumar, technicien bureau d'études CVC chez Derichebourg Énergie : modélisation BIM Revit, bilans thermiques, schémas AutoCAD et outils pyRevit.",
    nav: { expertise: 'Expertise', works: 'Réalisations', path: 'Parcours', contact: 'Contact' },
    skip: 'Aller au contenu',
    menu: 'Menu',
    themeToLight: 'Passer en thème clair',
    themeToDark: 'Passer en thème sombre',
    switchLang: 'English version',
    hero: {
      plate: 'Plan n° 01 — Lot CVC',
      role: "Technicien Bureau d'Études CVC",
      at: 'chez',
      intro:
        "Je conçois et modélise des installations de chauffage, ventilation et climatisation — du bilan thermique à la maquette BIM — et je développe mes propres outils pour aller plus vite sur Revit.",
      ctaWorks: 'Voir mes réalisations',
      ctaCv: 'Télécharger le CV',
      supply: 'Soufflage',
      ret: 'Reprise',
      scroll: 'Défiler',
    },
    stats: {
      title: 'Repères',
      items: [
        { value: 120, suffix: '+', label: 'heures sur Revit', note: 'Projet BTS' },
        { value: 20, suffix: '', label: 'logements modélisés', note: 'Habitat Jeune' },
        { value: 20, suffix: '+', label: 'outils pyRevit', note: 'Extension BE CVC ADI' },
      ],
      projects: 'projets présentés',
    },
    sections: {
      expertise: { n: '02', title: 'Expertise', sub: 'Nomenclature des compétences' },
      works: { n: '03', title: 'Réalisations', sub: 'Projets & études' },
      path: { n: '04', title: 'Parcours', sub: 'Expérience & formation' },
      tools: { n: '05', title: 'Outils', sub: 'Logiciels' },
      contact: { n: '06', title: 'Contact', sub: 'Travaillons ensemble' },
    },
    table: { ref: 'Réf.', domain: 'Domaine', desc: 'Description', tools: 'Outils' },
    filters: { all: 'Tous' },
    works: {
      open: 'Voir le projet',
      empty: 'Aucun projet dans cette catégorie pour le moment.',
      soon: 'Visuels à venir',
    },
    contact: {
      lead: 'Un projet CVC, une question BIM, ou simplement envie d’échanger ?',
      copy: 'Copier l’adresse',
      copied: 'Adresse copiée',
      copyFail: 'Copie impossible — sélectionnez l’adresse',
      email: 'E-mail',
      linkedin: 'LinkedIn',
      cv: 'CV',
      cvLabel: 'Télécharger le CV',
      location: 'Localisation',
    },
    project: {
      back: 'Toutes les réalisations',
      year: 'Année',
      category: 'Catégorie',
      tools: 'Outils',
      status: 'Statut',
      context: 'Contexte',
      mission: 'Ma mission',
      highlights: 'Points clés',
      model: 'Maquette 3D',
      modelHint: 'Faites glisser pour tourner · molette pour zoomer',
      modelSoon: 'Maquette 3D interactive bientôt disponible',
      modelLoad: 'Charger la maquette 3D',
      gallery: 'Galerie',
      gallerySoon: 'Les visuels de ce projet seront ajoutés prochainement.',
      links: 'Documents',
      next: 'Projet suivant',
      close: 'Fermer',
    },
    footer: { rights: 'Tous droits réservés', top: 'Haut de page', built: 'Conçu & développé avec soin' },
    level: 'Niv.',
    notFound: { title: 'Plan introuvable', text: 'Cette page n’existe pas ou a été déplacée.', home: 'Retour à l’accueil' },
  },
  en: {
    htmlLang: 'en',
    metaTitle: 'Adithyan Sanal Kumar — HVAC Design Office Technician',
    metaDesc:
      'Portfolio of Adithyan Sanal Kumar, HVAC design office technician at Derichebourg Énergie: Revit BIM modelling, heat-load calculations, AutoCAD schematics and pyRevit tools.',
    nav: { expertise: 'Expertise', works: 'Work', path: 'Career', contact: 'Contact' },
    skip: 'Skip to content',
    menu: 'Menu',
    themeToLight: 'Switch to light theme',
    themeToDark: 'Switch to dark theme',
    switchLang: 'Version française',
    hero: {
      plate: 'Drawing no. 01 — HVAC',
      role: 'HVAC Design Office Technician',
      at: 'at',
      intro:
        'I design and model heating, ventilation and air-conditioning systems — from heat-load calculations to the BIM model — and I build my own tools to work faster in Revit.',
      ctaWorks: 'See my work',
      ctaCv: 'Download CV',
      supply: 'Supply',
      ret: 'Return',
      scroll: 'Scroll',
    },
    stats: {
      title: 'Key figures',
      items: [
        { value: 120, suffix: '+', label: 'hours in Revit', note: 'BTS project' },
        { value: 20, suffix: '', label: 'dwellings modelled', note: 'Habitat Jeune' },
        { value: 20, suffix: '+', label: 'pyRevit tools', note: 'BE CVC ADI extension' },
      ],
      projects: 'projects shown',
    },
    sections: {
      expertise: { n: '02', title: 'Expertise', sub: 'Skills schedule' },
      works: { n: '03', title: 'Work', sub: 'Projects & studies' },
      path: { n: '04', title: 'Career', sub: 'Experience & education' },
      tools: { n: '05', title: 'Tools', sub: 'Software' },
      contact: { n: '06', title: 'Contact', sub: 'Let’s work together' },
    },
    table: { ref: 'Ref.', domain: 'Field', desc: 'Description', tools: 'Tools' },
    filters: { all: 'All' },
    works: {
      open: 'View project',
      empty: 'No project in this category yet.',
      soon: 'Visuals coming soon',
    },
    contact: {
      lead: 'An HVAC project, a BIM question, or just want to talk?',
      copy: 'Copy address',
      copied: 'Address copied',
      copyFail: 'Could not copy — select the address',
      email: 'Email',
      linkedin: 'LinkedIn',
      cv: 'CV',
      cvLabel: 'Download CV',
      location: 'Location',
    },
    project: {
      back: 'All work',
      year: 'Year',
      category: 'Category',
      tools: 'Tools',
      status: 'Status',
      context: 'Context',
      mission: 'My role',
      highlights: 'Highlights',
      model: '3D model',
      modelHint: 'Drag to rotate · scroll to zoom',
      modelSoon: 'Interactive 3D model coming soon',
      modelLoad: 'Load the 3D model',
      gallery: 'Gallery',
      gallerySoon: 'Visuals for this project will be added soon.',
      links: 'Documents',
      next: 'Next project',
      close: 'Close',
    },
    footer: { rights: 'All rights reserved', top: 'Back to top', built: 'Designed & built with care' },
    level: 'Lvl.',
    notFound: { title: 'Drawing not found', text: 'This page does not exist or has moved.', home: 'Back to home' },
  },
} as const;

export const base = import.meta.env.BASE_URL.replace(/\/$/, '');
export const href = (p: string) => `${base}${p.startsWith('/') ? p : '/' + p}`;
export const homeUrl = (lang: Lang) => href(lang === 'fr' ? '/' : '/en/');
export const projectUrl = (lang: Lang, slug: string) =>
  href(lang === 'fr' ? `/projets/${slug}/` : `/en/projects/${slug}/`);
