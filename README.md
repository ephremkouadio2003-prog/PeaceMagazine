# Peace Magazine

Site vitrine de **Peace Magazine** : création de magazines personnalisés de luxe (anniversaires, mariages, hommages, naissances, réussites).

🌐 **Site en ligne :** [peacemagazine.shop](https://peacemagazine.shop) (GitHub Pages)

## Fonctionnement

Site **100 % statique** : aucun serveur, aucune base de données, aucune dépendance externe hormis les polices Google.

- **Commande** : questionnaire en 6 étapes sur le site → dossier Google Drive (fiche Google Docs + photos) et ligne Google Sheet créés automatiquement (voir [GUIDE-CONFIGURATION-COMMANDES.md](GUIDE-CONFIGURATION-COMMANDES.md))
- **Galerie** : carrousel « coverflow » en 3D, piloté à la souris, au doigt ou au clavier
- **Lecture** : feuilletage réaliste en double page, la feuille se courbe et suit le doigt
- **Vidéos** : lecture au clic, rien n'est téléchargé avant

## Structure

```
├── index.html              # Page unique
├── styles.css              # Styles
├── script.js               # Navigation, FAQ, contact, vidéos
├── coverflow.js            # Carrousel 3D de la galerie
├── polaroid.js             # Carrousel « polaroïds sur un fil »
├── flipbook-viewer.js      # Lecteur de magazine (feuilletage)
├── order-form.js           # Questionnaire de commande
├── apps-script/Code.gs     # Script Google : reçoit les commandes (Drive + Sheets)
├── serve.py                # Serveur local sans cache (npm start)
└── assets/
    ├── images/opt/         # Images du site, en WebP dimensionné
    ├── magazines/<nom>/    # Pages des magazines (001.webp, 002.webp…)
    ├── videos/             # Vidéos + posters/
    └── icons/              # Favicon
```

### Images et magazines

Les fichiers lourds (PDF d'origine, PNG/JPG sources) sont **conservés en local mais exclus du dépôt** : le site ne sert que les versions optimisées.

Pour ajouter un magazine :

```bash
# depuis un PDF
gs -dNOPAUSE -dBATCH -dQUIET -sDEVICE=png16m -r150 \
   -sOutputFile=/tmp/p-%03d.png "mon-magazine.pdf"
mkdir -p assets/magazines/mon-magazine
i=0; for f in /tmp/p-*.png; do i=$((i+1)); printf -v n "%03d" $i
  cwebp -q 76 -metadata none -resize 1240 0 "$f" -o "assets/magazines/mon-magazine/$n.webp"
done
```

Puis ajouter une carte dans la galerie d'`index.html` :

```html
<article class="coverflow-card"
         data-pages="assets/magazines/mon-magazine" data-page-count="20"
         data-title="Mon magazine" data-subtitle="Description · 20 pages">
    <img src="./assets/images/opt/ma-couverture.webp" alt="Mon magazine"
         width="520" height="736" loading="lazy" decoding="async">
</article>
```

### Vidéos

```bash
ffmpeg -i source.MP4 -c:v libx264 -crf 30 -preset slow -profile:v main \
  -pix_fmt yuv420p -movflags +faststart -c:a aac -b:a 64k -ac 1 /tmp/sortie.mp4
```

⚠️ Toujours encoder vers un dossier temporaire : le système de fichiers macOS ignore la casse, donc écrire `magazine.mp4` à côté de `Magazine.MP4` **écrase la source en cours de lecture**.

## Développement local

```bash
npm run start     # http://localhost:8080
```

## Déploiement

Chaque `git push` sur `main` déploie le site via GitHub Pages.

## Informations commerciales

- **Prix** : 30 000 FCFA pour 24 pages (hors livraison) · acompte 15 000 FCFA
- **Délais** : commander 1 à 2 semaines avant la date souhaitée
- **Contact** : WhatsApp +225 07 67 66 04 76 · morak6@icloud.com
- **Réseaux** : TikTok [@peacemagazine_](https://www.tiktok.com/@peacemagazine_)
