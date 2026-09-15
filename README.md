# Peace Magazine

Site vitrine de **Peace Magazine** : création de magazines personnalisés de luxe (anniversaires, mariages, hommages, naissances, réussites).

🌐 **Site en ligne :** [peacemagazine.shop](https://peacemagazine.shop) (hébergé sur GitHub Pages)

## Fonctionnement

Le site est **100 % statique** : aucune base de données ni serveur nécessaire.

- **Commandes et contact** : via WhatsApp (+225 07 67 66 04 76)
- **Galerie** : les magazines s'ouvrent dans un lecteur "flipbook" (PDF.js chargé depuis un CDN)
- **Vidéos** : lecture au clic dans la section Vidéos

## Structure

```
├── index.html            # Page unique du site
├── styles.css            # Styles
├── script.js             # Interactions (menu, FAQ, galerie, contact WhatsApp…)
├── flipbook-viewer.js    # Lecteur PDF plein écran (PDF.js)
├── robots.txt            # SEO
├── sitemap.xml           # SEO
├── CNAME                 # Domaine GitHub Pages (peacemagazine.shop)
└── assets/
    ├── images/           # Logo, couvertures, photos d'équipe
    ├── PDF/              # Magazines feuilletables de la galerie
    ├── videos/           # Vidéos de réalisation
    └── icons/            # Favicon
```

Le dossier `backend/` (présent en local uniquement) contient un ancien prototype Node.js/Supabase **non déployé et non utilisé par le site**. Il est ignoré par git.

## Développement local

```bash
npm run start     # sert le site sur http://localhost:8080 (python3 requis)
```

Ou simplement ouvrir `index.html` dans un navigateur (le flipbook nécessite toutefois un serveur local).

## Déploiement

Chaque `git push` sur la branche `main` déploie automatiquement le site via GitHub Pages.

## Informations commerciales

- **Prix** : 30 000 FCFA pour 24 pages (hors livraison)
- **Délais** : commander 1 à 2 semaines avant la date souhaitée
- **Contact** : WhatsApp +225 07 67 66 04 76 · morak6@icloud.com
- **TikTok** : [@peacemagazine_](https://www.tiktok.com/@peacemagazine_)
