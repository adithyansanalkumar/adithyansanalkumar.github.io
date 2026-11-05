# Portfolio — Adithyan Sanal Kumar

Site portfolio de technicien bureau d'études CVC. Thème « plan technique » (blueprint),
bilingue FR / EN, thème sombre / clair, animations au défilement, visionneuse 3D.

Construit avec [Astro](https://astro.build), GSAP, Lenis et `<model-viewer>`.
Publié automatiquement sur GitHub Pages à chaque `git push`.

---

## Modifier le contenu (sans coder)

| Je veux…                                   | Fichier à modifier                    |
| ------------------------------------------ | ------------------------------------- |
| Changer mon e-mail, LinkedIn, lien du CV    | `src/data/site.ts` → `profile`        |
| Modifier mon parcours / mes expériences    | `src/data/site.ts` → `timeline`       |
| Modifier compétences, logiciels, chiffres  | `src/data/site.ts` → `expertise`, `tools`, `ui.fr.stats` |
| Ajouter / modifier un projet               | `src/data/projects.ts`                |

### Ajouter un projet

1. Créer un dossier `public/images/projects/<nom-du-projet>/` et y mettre les images (JPG/PNG/WebP, ~1600 px de large suffit).
2. Dans `src/data/projects.ts`, copier un bloc existant, changer le `slug` et les textes FR/EN.
3. Renseigner `cover` (image principale) et `gallery` (liste des images).

### Ajouter une maquette 3D (Revit → GLB)

1. Dans Revit, exporter la vue 3D en **.glb** (complément gratuit « glTF Exporter », ou Revit → IFC → convertisseur IFC→GLB).
2. Garder le fichier léger (< 20 Mo idéalement : vue 3D filtrée sur le lot CVC).
3. Le copier dans `public/models/<nom-du-projet>.glb`.
4. Dans le projet : `model: '/models/<nom-du-projet>.glb'`.

Le visiteur clique sur « Charger la maquette 3D » et peut tourner / zoomer le modèle.

### Remplacer le CV

Mettre `cv.pdf` dans `public/`, puis dans `src/data/site.ts` : `cvUrl: '/cv.pdf'`.

---

## Publier une modification

```bash
git add .
git commit -m "Ajout projet X"
git push
```

Le site est reconstruit et mis en ligne en ~1 minute (onglet **Actions** du dépôt).

## Travailler en local

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # vérifie que tout compile
npm run og       # régénère l'image d'aperçu LinkedIn (public/og.png)
```

## Changer l'adresse du site

L'adresse est `https://<nom-utilisateur>.github.io`. Après avoir renommé le compte GitHub
(ex. `adithyan-sanalkumar`), renommer aussi ce dépôt en `adithyan-sanalkumar.github.io`
(Settings → General → Repository name). Le reste se met à jour automatiquement.
