# Intégration Heyzine API - Documentation

## Vue d'ensemble

L'API Heyzine a été intégrée dans le projet Peace Magazine pour permettre la conversion de PDF en magazines interactifs (flipbooks). Cette fonctionnalité permet aux clients de visualiser leurs magazines dans un format interactif et élégant.

## Clé API

**Clé API Heyzine :** `ec3a82d3304fb4247d20493afd981d1b8a31f2ed.6af572085b58bbc0`

⚠️ **Important :** Cette clé est actuellement codée en dur dans les fichiers. Pour la production, il est recommandé de la déplacer dans les variables d'environnement.

## Architecture

### Frontend (`heyzine-service.js`)

Le service frontend `HeyzineService` fournit les fonctionnalités suivantes :

- **Conversion de PDF en flipbook** : Via l'API REST Heyzine
- **Génération de liens directs** : Pour un accès rapide aux flipbooks
- **Affichage en plein écran** : Modal élégante pour visualiser les magazines
- **Intégration galerie** : Boutons automatiques pour les magazines avec PDF

### Backend (`backend/services/heyzineService.js`)

Le service backend gère :

- **Conversion via API REST** : Appels sécurisés à l'API Heyzine
- **Cache des conversions** : Optimisation des performances
- **Gestion d'erreurs** : Fallback vers les liens directs en cas d'erreur

### Routes API (`backend/routes/heyzine.js`)

Endpoints disponibles :

- `POST /api/heyzine/convert` - Convertit un PDF en flipbook
- `GET /api/heyzine/direct-url` - Génère un lien direct
- `POST /api/heyzine/convert-multiple` - Convertit plusieurs PDFs

## Utilisation

### 1. Conversion d'un PDF

```javascript
// Via le service frontend
const result = await window.heyzineService.convertPdfToFlipbook('https://example.com/magazine.pdf');

if (result.success) {
    // Afficher le flipbook
    window.heyzineService.openFullscreenViewer(result.flipbookUrl);
}
```

### 2. Lien direct

```javascript
// Générer un lien direct (conversion automatique)
const directUrl = window.heyzineService.getFlipbookDirectUrl('https://example.com/magazine.pdf');
```

### 3. Ajouter un bouton dans la galerie

```javascript
// Ajouter automatiquement un bouton de visualisation
window.heyzineService.addViewButtonToGalleryItem(galleryItemElement, pdfUrl);
```

### 4. Via l'API backend

```javascript
// POST /api/heyzine/convert
const response = await fetch('/api/heyzine/convert', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        pdfUrl: 'https://example.com/magazine.pdf',
        options: { prevNext: true }
    })
});

const data = await response.json();
```

## Configuration de la galerie

Pour ajouter des PDFs à la galerie, modifiez la fonction `initializeHeyzineGallery()` dans `script.js` :

```javascript
const galleryPdfs = {
    'magazine-fatim': 'https://example.com/magazine-fatim.pdf',
    'magazine-jess': 'https://example.com/magazine-jess.pdf',
    // ... autres magazines
};
```

## Format de réponse API Heyzine

```json
{
    "id": "identifiant_du_flipbook.pdf",
    "url": "https://heyzine.com/flip-book/identifiant_du_flipbook.html",
    "thumbnail": "https://cdnc.heyzine.com/flip-book/cover/identifiant_du_flipbook.jpg",
    "pdf": "https://cdnc.heyzine.com/flip-book/pdf/identifiant_du_flipbook.pdf",
    "meta": {
        "num_pages": 6,
        "aspect_ratio": 0.7078
    }
}
```

## Sécurité

1. **Clé API** : Déplacer dans les variables d'environnement pour la production
2. **Validation des URLs** : Les URLs de PDF sont validées avant conversion
3. **Rate limiting** : Les routes API sont protégées par rate limiting

## Dépendances

### Backend
- `axios` : Pour les appels HTTP à l'API Heyzine

### Frontend
- Aucune dépendance externe (utilise l'API Fetch native)

## Installation

1. **Backend** : Installer axios
```bash
cd backend
npm install axios
```

2. **Frontend** : Le service est déjà inclus via `<script src="heyzine-service.js"></script>`

## Exemples d'utilisation

### Exemple 1 : Visualiser un magazine après commande

```javascript
// Dans le callback de succès de commande
const pdfUrl = orderData.finalMagazinePdfUrl;
const result = await window.heyzineService.convertPdfToFlipbook(pdfUrl);

if (result.success) {
    window.heyzineService.openFullscreenViewer(result.flipbookUrl);
}
```

### Exemple 2 : Ajouter un bouton de visualisation

```javascript
const button = window.heyzineService.createViewButton(
    'https://example.com/magazine.pdf',
    'Voir mon magazine'
);
document.body.appendChild(button);
```

## Limitations

1. **Première conversion** : La première conversion peut prendre du temps (Heyzine génère le flipbook)
2. **URLs publiques** : Les PDFs doivent être accessibles publiquement (pas de fichiers locaux)
3. **Taille des fichiers** : Respecter les limites de taille de l'API Heyzine

## Support

Pour plus d'informations sur l'API Heyzine :
- Documentation : https://heyzine.com/developers
- Support : https://heyzine.com/support

## Notes

- Le cache des conversions est conservé en mémoire (Map)
- Les erreurs sont gérées avec fallback vers les liens directs
- La modal plein écran peut être fermée avec la touche Escape



