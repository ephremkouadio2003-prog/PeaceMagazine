# ✅ Modèle de fonctionnement Supabase complet

## 🎯 Architecture créée

Un modèle de persistance Supabase complet a été créé pour remplacer Sequelize avec une architecture propre et fonctionnelle.

## 📁 Structure complète

```
backend/
├── models/
│   ├── supabase/           ← NOUVEAU - Modèles Supabase complets
│   │   ├── Order.js        → Modèle complet pour les commandes
│   │   ├── Lead.js         → Modèle complet pour les leads
│   │   ├── File.js         → Modèle complet pour les fichiers
│   │   ├── Contact.js      → Modèle complet pour les contacts
│   │   └── index.js        → Export centralisé
│   └── index.js            → Export unifié (utilise supabase/)
│
├── services/
│   └── supabaseService.js  → Service Supabase backend (avec @supabase/supabase-js)
│
├── routes/
│   ├── orders-supabase.js  → Route commandes utilisant les modèles
│   ├── contact-supabase.js → Route contact utilisant les modèles
│   └── files-secure.js     → Route sécurisée pour servir les fichiers
│
└── utils/
    ├── fileValidator.js    → Validation renforcée (magic bytes)
    └── fileSecurity.js     → Quarantaine et purge automatique
```

## 🔧 Modèles Supabase

### Caractéristiques

Chaque modèle (`Order`, `Lead`, `File`, `Contact`) :

1. **Convertit automatiquement** snake_case ↔ camelCase
2. **Méthodes CRUD complètes** : `create()`, `findByPk()`, `findAll()`, `update()`, `save()`, `destroy()`
3. **Gestion des erreurs** Supabase
4. **Conversion JSON** : `toJSON()` pour le frontend, `toSupabase()` pour la base

### Exemple Order

```javascript
const { Order } = require('./models/supabase');

// Créer
const order = await Order.create({
    orderNumber: 'PM-123456',
    personName: 'Marie',
    customerEmail: 'marie@example.com',
    // ...
});

// Lire
const order = await Order.findByPk(orderId);

// Mettre à jour
order.status = 'confirmed';
await order.save();

// Recherche
const orders = await Order.findAll({
    where: { status: 'pending' },
    limit: 10
});
```

## 🔄 Flux de données

### Frontend → Supabase (direct)

```javascript
// script.js
const response = await window.supabaseService.createOrder(orderData);
// Utilise supabase-service.js → API Supabase REST
```

### Backend → Supabase (via modèles)

```javascript
// routes/orders-supabase.js
const { Order } = require('../models/supabase');
const order = await Order.create(orderData);
// Utilise models/supabase/Order.js → supabaseService → API Supabase
```

## 📊 Routes actives

### 1. `POST /api/orders/public`

**Utilise :**
- `Order.create()` - Créer la commande
- `File.create()` - Créer les fichiers
- `wavePaymentService` - Lien de paiement
- `emailService` - Emails Brevo

**Flux :**
1. Créer la commande dans Supabase
2. Traiter et sauvegarder les fichiers (avec sécurité)
3. Créer le lien de paiement Wave
4. Envoyer les emails

### 2. `POST /api/contact`

**Utilise :**
- `Contact.create()` - Créer le contact
- `emailService` - Email de notification

### 3. `GET /api/files/:filename`

**Utilise :**
- `File.findByFilename()` - Vérifier le fichier
- Servir le fichier de manière sécurisée

## 🔐 Sécurité

### Fichiers

- ✅ Validation du contenu réel (magic bytes)
- ✅ Détection de contenus suspects
- ✅ Quarantaine automatique
- ✅ Purge automatique (90 jours)
- ✅ Accès via API sécurisée (pas de statique direct)

### Paiements

- ✅ Référence de paiement obligatoire
- ✅ Vérification du montant
- ✅ Logs de sécurité complets

## 📋 Schéma Supabase

Le fichier `supabase-setup.sql` a été mis à jour avec :

- ✅ Tous les champs nécessaires (paiement, fichiers, etc.)
- ✅ Index optimisés
- ✅ Relations (files.order_id → orders.id)
- ✅ Politiques RLS configurées

## 🚀 Démarrage

### 1. Installer la dépendance Supabase

```bash
cd backend
npm install @supabase/supabase-js
```

### 2. Exécuter le schéma SQL

Dans Supabase SQL Editor :
1. Ouvrez https://app.supabase.com
2. Votre projet → SQL Editor
3. Exécutez `supabase-setup.sql`

### 3. Démarrer le serveur

```bash
cd backend
npm start
```

**Résultat attendu :**
```
✅ Service Supabase initialisé pour le backend
✅ Connexion Supabase vérifiée
✅ Dossiers de sécurité des fichiers initialisés
✅ Purge automatique des fichiers activée (quotidienne)
✅ Service Brevo initialisé avec succès
🚀 Serveur démarré sur http://localhost:3000
```

## ✅ Vérification

### Tester la création d'une commande

```bash
curl -X POST http://localhost:3000/api/orders/public \
  -H "Content-Type: application/json" \
  -d '{
    "personName": "Test",
    "occasion": "anniversaire",
    "customerName": "Client",
    "customerEmail": "client@example.com",
    "customerPhone": "+225 07 12 34 56 78"
  }'
```

### Vérifier dans Supabase

1. Allez sur https://app.supabase.com
2. Table Editor → `orders`
3. Vous devriez voir la commande créée

## 📊 Avantages

1. **Modèles réutilisables** - Interface similaire à Sequelize
2. **Type safety** - Conversion automatique
3. **Maintenabilité** - Code organisé
4. **Scalabilité** - Supabase gère tout
5. **Pas de base locale** - Tout dans le cloud
6. **Backup automatique** - Géré par Supabase
7. **Interface web** - Administration via Dashboard

## 🔍 Architecture complète

```
┌─────────────────────────────────────────────┐
│           FRONTEND (script.js)              │
│  supabase-service.js → API Supabase REST     │
└─────────────────────────────────────────────┘
                    │
                    │ (optionnel)
                    ▼
┌─────────────────────────────────────────────┐
│           BACKEND (routes)                  │
│  orders-supabase.js                          │
│    ↓                                          │
│  models/supabase/Order.js                    │
│    ↓                                          │
│  services/supabaseService.js                 │
│    ↓                                          │
│  @supabase/supabase-js → API Supabase        │
└─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────┐
│         SUPABASE DATABASE                    │
│  orders | leads | contacts | files           │
└─────────────────────────────────────────────┘
```

## 📝 Documentation créée

1. ✅ `MODELE-SUPABASE-COMPLET.md` - Vue d'ensemble
2. ✅ `GUIDE-UTILISATION-MODELES.md` - Guide d'utilisation
3. ✅ `ARCHITECTURE-SUPABASE.md` - Architecture détaillée
4. ✅ `FONCTIONNEMENT-COMPLET-SUPABASE.md` - Ce fichier

## ✅ Résultat

Vous avez maintenant un **modèle de persistance Supabase complet et fonctionnel** qui :

- ✅ Remplace complètement Sequelize
- ✅ Offre une interface similaire (facilite la migration)
- ✅ Gère automatiquement les conversions de format
- ✅ Inclut toutes les opérations CRUD
- ✅ Est sécurisé et optimisé
- ✅ Est documenté et maintenable

## 📞 Besoin d'aide ?

- 📱 WhatsApp : +225 07 67 66 04 76
- 📧 Email : morak6@icloud.com








