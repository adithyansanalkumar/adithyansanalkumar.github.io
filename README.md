# Portfolio — Adithyan Sanal Kumar

Site portfolio de technicien bureau d'études CVC. Thème « plan technique » (blueprint),
bilingue FR / EN, thème sombre / clair, animations au défilement, visionneuse 3D.

Construit avec [Astro](https://astro.build), GSAP, Lenis et `<model-viewer>`.
Publié automatiquement sur GitHub Pages à chaque `git push`.

---

## Panneau d'administration — https://adithyansanalkumar.github.io/admin/

Tout le contenu se modifie depuis `/admin/` (projets, images, CV, parcours, chiffres,
expertise, logiciels, **tous les textes FR/EN**). Chaque « Enregistrer » met le site à jour en ~1 minute.

**Connexion (une seule fois par navigateur) :** cliquer **« Sign In Using Access Token »**,
suivre le lien vers GitHub (les permissions sont pré-cochées : *Contents → Read and write*
sur ce dépôt), créer le jeton, le coller. Ne partagez jamais ce jeton.

### Statistiques de visites (GoatCounter)
1. Créer un compte gratuit sur https://www.goatcounter.com (code ex. `adithyansanalkumar`).
2. Admin → Réglages du site → Profil & contact → « Statistiques : code GoatCounter ».
3. Tableau de bord : `https://<code>.goatcounter.com` (visites, pages, pays, sources, clics CV/LinkedIn).

### Formulaire de contact (Web3Forms)
1. Sur https://web3forms.com, saisir votre e-mail → une clé d'accès arrive par e-mail.
2. Admin → Profil & contact → « Formulaire de contact : clé Web3Forms ». Le formulaire apparaît.

## Modifier le contenu à la main (fichiers)

| Je veux…                                   | Fichier à modifier                    |
| ------------------------------------------ | ------------------------------------- |
| Changer mon e-mail, LinkedIn, CV, stats, formulaire | `src/content/settings/profile.json` |
| Modifier mon parcours / mes expériences    | `src/content/settings/timeline.json`  |
| Modifier compétences, logiciels, chiffres  | `src/content/settings/skills.json`    |
| Modifier tous les textes du site (FR/EN)   | `src/content/settings/texts.json`     |
| Ajouter / modifier un projet               | `src/content/projects/<nom>.json`     |

### Ajouter un projet

1. Créer un dossier `public/images/projects/<nom-du-projet>/` et y mettre les images (JPG/PNG/WebP, ~1600 px de large suffit).
2. Copier un fichier de `src/content/projects/`, le renommer (le nom = l'adresse de la page) et changer les textes FR/EN.
3. Renseigner `cover` (image principale) et `gallery` (liste des images).

### Ajouter une maquette 3D (Revit → GLB)

1. Dans Revit, exporter la vue 3D en **.glb** (complément gratuit « glTF Exporter », ou Revit → IFC → convertisseur IFC→GLB).
2. Garder le fichier léger (< 20 Mo idéalement : vue 3D filtrée sur le lot CVC).
3. Le copier dans `public/models/<nom-du-projet>.glb`.
4. Dans le projet : `"model": "/models/<nom-du-projet>.glb"` (ou via l'admin, champ « Maquette 3D »).

Le visiteur clique sur « Charger la maquette 3D » et peut tourner / zoomer le modèle.

### Remplacer le CV

Admin → Profil & contact → CV (PDF), ou mettre `cv.pdf` dans `public/` et `"cv": "/cv.pdf"` dans `profile.json`.

---

## Publier une modification

```bash
git add .
git commit -m "Ajout projet X"
git push
```

Le site est reconstruit et mis en ligne automatiquement en ~1 minute
(suivi dans l'onglet **Actions** du dépôt).

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
