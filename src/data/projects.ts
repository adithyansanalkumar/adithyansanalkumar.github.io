/* ------------------------------------------------------------------
   YOUR PROJECTS  —  how to add one:
   1. Copy one block below and give it a new unique "slug" (url name).
   2. Put its images in  public/images/projects/<slug>/
      and list them in "gallery" (first one can also be the "cover").
   3. Optional 3D model: export a .glb from Revit, put it in
      public/models/<slug>.glb and set  model: '/models/<slug>.glb'
   4. Commit + push: the site rebuilds itself in ~1 minute.
   "art" = the blueprint illustration used when there is no cover image:
   'bim' | 'auto' | 'cad' | 'audit' | 'house'
------------------------------------------------------------------- */

import type { L } from './site';

export type Category = 'bim' | 'auto' | 'cad' | 'audit' | 'thermal';

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
  art: 'bim' | 'auto' | 'cad' | 'audit' | 'house';
  year?: string;
  status?: L;
  tools: string[];
  summary: L;
  context?: L;
  mission?: L;
  highlights?: { fr: string[]; en: string[] };
  cover?: string;
  gallery?: { src: string; alt: L }[];
  model?: string; // path to a .glb file
  links?: { label: L; url: string }[];
};

export const projects: Project[] = [
  {
    slug: 'extension-pyrevit-be-cvc',
    title: { fr: 'Extension pyRevit « BE CVC ADI »', en: '“BE CVC ADI” pyRevit extension' },
    category: 'auto',
    art: 'auto',
    year: '2026',
    tools: ['pyRevit', 'Python', 'Revit API'],
    summary: {
      fr: 'Un onglet Revit sur mesure qui automatise les tâches répétitives du bureau d’études CVC.',
      en: 'A custom Revit tab that automates the repetitive tasks of an HVAC design office.',
    },
    context: {
      fr: 'Sur un projet CVC, une grande partie du temps passe dans des tâches répétitives : réservations, numérotation des bouches, calorifuge, contrôles. J’ai développé ma propre barre d’outils Revit pour les automatiser.',
      en: 'On an HVAC project, a lot of time goes into repetitive tasks: openings, terminal numbering, insulation, checks. I built my own Revit toolbar to automate them.',
    },
    mission: {
      fr: 'Conception, développement en Python (pyRevit / API Revit) et design des icônes de plus de 20 outils répartis en 9 panneaux.',
      en: 'Design, Python development (pyRevit / Revit API) and icon design for 20+ tools across 9 panels.',
    },
    highlights: {
      fr: [
        'Réseaux : tracer et relier les réseaux, calorifuge, couleurs par système',
        'Réservations : génération automatique des réservations du projet',
        'Hydraulique : calcul des pertes de charge, raccordement des appareils',
        'Thermique : bilan thermique directement dans Revit',
        'Clashs : détection et contrôle des conflits',
        'Outils : renommage des bouches, atelier familles, lien Excel, audit VRD',
      ],
      en: [
        'Networks: draw and connect systems, insulation, colour by system',
        'Openings: automatic generation of builder’s work openings',
        'Hydronics: pressure-drop calculation, equipment connection',
        'Thermal: heat-load calculation inside Revit',
        'Clashes: conflict detection and checks',
        'Utilities: terminal renaming, family workshop, Excel link, VRD audit',
      ],
    },
    cover: '/images/projects/extension-pyrevit-be-cvc/icons.png',
    gallery: [
      {
        src: '/images/projects/extension-pyrevit-be-cvc/icons.png',
        alt: { fr: 'Les icônes des outils de l’extension, thèmes sombre et clair', en: 'The extension’s tool icons, dark and light themes' },
      },
    ],
  },
  {
    slug: 'groupe-scolaire-verfeil',
    title: { fr: 'Groupe scolaire Verfeil', en: 'Verfeil school complex' },
    category: 'bim',
    art: 'bim',
    year: '2025 — 2026',
    status: { fr: 'Projet BTS — 120 h+', en: 'BTS project — 120h+' },
    tools: ['Revit'],
    summary: {
      fr: 'Modélisation BIM des installations CVC d’un groupe scolaire, réalisée sur plus de 120 heures.',
      en: 'BIM modelling of the HVAC systems of a school complex, over 120+ hours of work.',
    },
    mission: {
      fr: 'Modélisation des réseaux CVC sur Revit dans le cadre du projet de 120 h du BTS FED.',
      en: 'Modelling the HVAC networks in Revit as part of the 120-hour BTS FED project.',
    },
  },
  {
    slug: 'habitat-jeune-20-logements',
    title: { fr: 'Habitat Jeune — 20 logements', en: 'Habitat Jeune — 20 dwellings' },
    category: 'bim',
    art: 'bim',
    tools: ['Revit'],
    summary: {
      fr: 'Maquette BIM CVC d’une construction de 20 logements pour jeunes.',
      en: 'HVAC BIM model for a new 20-unit youth housing building.',
    },
    links: [
      {
        label: { fr: 'Dossier du projet (Google Drive)', en: 'Project folder (Google Drive)' },
        url: 'https://drive.google.com/drive/folders/1Vm_DYYMnc-FaBF2Xg-dyiPL_FC1Y6XCO',
      },
    ],
  },
  {
    slug: 'audit-chaufferies-admj',
    title: { fr: 'ADMJ — Audit technique de chaufferies', en: 'ADMJ — Boiler-room technical audit' },
    category: 'audit',
    art: 'audit',
    status: { fr: 'Projet création d’entreprise — BTS 1', en: 'Business-creation project — BTS year 1' },
    tools: ['Audit', 'Chaufferie'],
    summary: {
      fr: 'Création d’une entreprise fictive, ADMJ, spécialisée dans l’audit technique des chaufferies.',
      en: 'Setting up ADMJ, a mock company specialised in technical audits of boiler rooms.',
    },
  },
  {
    slug: 'maison-individuelle',
    title: { fr: 'Maison individuelle', en: 'Detached house' },
    category: 'thermal',
    art: 'house',
    tools: [],
    summary: {
      fr: 'Étude CVC d’une maison individuelle.',
      en: 'HVAC study of a detached house.',
    },
  },
  {
    slug: 'schemas-de-principe-autocad',
    title: { fr: 'Schémas de principe', en: 'Schematic diagrams' },
    category: 'cad',
    art: 'cad',
    tools: ['AutoCAD'],
    summary: {
      fr: 'Série de schémas de principe hydrauliques et aérauliques réalisés sur AutoCAD.',
      en: 'A set of hydronic and air schematic diagrams drawn in AutoCAD.',
    },
  },
];
