# Connexion Frontend-Backend - Commandes

## ✅ Modifications effectuées

### 1. Route publique pour les commandes
- ✅ **Route ajoutée** : `POST /api/orders/public`
- ✅ **Authentification** : `optionalAuth` (pas de token requis)
- ✅ **Validation** : Schéma `schemas.createOrder` appliqué

### 2. Contrôleur de commandes mis à jour
- ✅ **Gestion des fichiers** : Sauvegarde automatique des fichiers base64
- ✅ **Stockage** : Fichiers stockés dans `/backend/uploads/`
- ✅ **Modèle File** : Création d'enregistrements File pour chaque fichier
- ✅ **Numéro de commande** : Généré automatiquement (format: `PM-<timestamp>-<random>`)
- ✅ **Lien de paiement** : Génération automatique du lien Wave
- ✅ **Email** : NON envoyé à la création (seulement après validation du paiement)

### 3. Frontend mis à jour
- ✅ **Endpoint** : Envoi vers `/api/orders/public` au lieu de `/api/leads`
- ✅ **Format des données** : Transformation des données pour correspondre au schéma de validation
- ✅ **Mapping** : `customerName` → `clientName`, `customerEmail` → `clientEmail`
- ✅ **Anecdotes** : Format `{title, content}` au lieu de `{title, text}`
- ✅ **Témoignages** : Format `{name, relationship, message}` au lieu de `{name, relation, text}`
- ✅ **Fichiers** : Envoi en base64 avec `uploadedFiles` et `coverPhoto`
- ✅ **Message de succès** : Affichage du numéro de commande et lien de paiement Wave

### 4. Configuration serveur
- ✅ **Taille max** : Augmentée à 50MB pour les payloads avec fichiers base64
- ✅ **Fichiers statiques** : Route `/uploads` pour servir les fichiers uploadés

## 📋 Format des données envoyées

```javascript
{
  // Informations principales
  personName: string,
  occasion: 'anniversaire' | 'mariage' | 'hommage' | 'naissance' | 'reussite' | 'autre',
  relationship: string,
  description: string,
  
  // Anecdotes
  anecdotes: [
    { title: string, content: string }
  ],
  
  // Témoignages
  testimonials: [
    { name: string, relationship: string, message: string }
  ],
  
  // Style
  colors: string | null,
  style: string | null,
  additionalInfo: string | null,
  
  // Livraison
  deliveryDate: string (ISO date),
  deliveryAddress: string,
  deliveryPhone: string,
  
  // Client
  clientName: string,
  clientEmail: string,
  clientPhone: string,
  
  // Fichiers
  uploadedFiles: [
    { name: string, type: string, size: number, data: string (base64) }
  ],
  coverPhoto: { name: string, data: string (base64) } | null
}
```

## 🔄 Flux de création de commande

1. **Frontend** : L'utilisateur remplit le formulaire et soumet
2. **Transformation** : `prepareOrderData()` transforme les données au bon format
3. **Envoi** : `POST /api/orders/public` avec toutes les données
4. **Backend** : 
   - Validation des données (schéma Joi)
   - Création de la commande avec numéro unique
   - Sauvegarde des fichiers (base64 → fichiers physiques)
   - Création des enregistrements File
   - Génération du lien de paiement Wave
5. **Réponse** : 
   - Numéro de commande
   - Lien de paiement Wave
   - Informations de la commande
6. **Frontend** : Affichage du message de succès avec bouton de paiement

## 📁 Structure des fichiers

```
backend/
├── uploads/              # Dossier créé automatiquement
│   └── [UUID].[ext]     # Fichiers uploadés
├── controllers/
│   └── orderController.js  # Gestion des fichiers base64
└── routes/
    └── orders.js        # Route publique ajoutée
```

## 🎯 Points importants

- ✅ **Pas d'email à la création** : L'email de confirmation est envoyé uniquement après validation du paiement
- ✅ **Fichiers stockés localement** : Pour le développement, les fichiers sont dans `/backend/uploads/`
- ✅ **Numéro de commande** : Format `PM-<timestamp>-<random>` (ex: `PM-1701234567890-ABC1`)
- ✅ **Paiement requis** : La commande ne peut pas être confirmée sans paiement validé
- ✅ **Validation stricte** : Toutes les données sont validées avec Joi avant traitement

## 🔧 Configuration requise

- Node.js avec support des fichiers système
- Dossier `uploads/` créé automatiquement (ou créer manuellement)
- Permissions d'écriture sur le dossier `uploads/`

## 📝 Notes

- Les fichiers base64 peuvent être volumineux, d'où la limite de 50MB
- Pour la production, envisager un stockage cloud (Cloudinary, S3)
- Le numéro de commande est unique et stocké en base de données






