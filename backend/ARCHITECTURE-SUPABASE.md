# 🏗️ Architecture Supabase - Modèle de fonctionnement complet

## ✅ Modèle de persistance Supabase créé

Un modèle de persistance Supabase a été créé pour remplacer complètement Sequelize.

## 📁 Structure des modèles

### `backend/models/supabase/`

```
models/supabase/
├── Order.js      → Modèle complet pour les commandes
├── Lead.js       → Modèle complet pour les leads
├── File.js       → Modèle complet pour les fichiers
├── Contact.js    → Modèle complet pour les contacts
└── index.js      → Export centralisé
```

## 🔧 Fonctionnalités

### Chaque modèle inclut :

1. **Constructeur intelligent**
   - Convertit automatiquement snake_case (Supabase) ↔ camelCase (JavaScript)
   - Gère les alias pour compatibilité (customerName/clientName)

2. **Méthodes de conversion**
   - `toSupabase()` - Pour insertion/mise à jour
   - `toJSON()` - Pour le frontend

3. **Méthodes CRUD complètes**
   - `create(data)` - Créer
   - `findByPk(id)` - Trouver par ID
   - `findAll(options)` - Recherche avec filtres
   - `update(data)` - Mettre à jour
   - `save()` - Sauvegarder
   - `destroy()` - Supprimer

## 📊 Exemple d'utilisation

### Créer une commande

```javascript
const { Order } = require('./models/supabase');

const order = await Order.create({
    orderNumber: 'PM-123456',
    personName: 'John Doe',
    occasion: 'anniversaire',
    customerEmail: 'john@example.com',
    customerPhone: '+225 07 12 34 56 78',
    deliveryDate: '2024-12-25',
    deliveryAddress: '123 Rue Example',
    status: 'pending',
    paymentStatus: 'pending',
    basePrice: 25000,
    totalPrice: 25000
});

console.log(order.toJSON());
```

### Rechercher des commandes

```javascript
// Trouver par ID
const order = await Order.findByPk('uuid-here');

// Trouver avec filtres
const pendingOrders = await Order.findAll({
    where: { 
        status: 'pending',
        paymentStatus: 'pending'
    },
    order: [['created_at', 'DESC']],
    limit: 10,
    offset: 0
});

// Trouver par numéro de commande
const order = await Order.findByOrderNumber('PM-123456');
```

### Mettre à jour

```javascript
const order = await Order.findByPk(orderId);
order.status = 'confirmed';
order.paymentStatus = 'paid';
await order.save();
```

## 🔄 Routes utilisant les modèles

### Routes actives

1. **`POST /api/orders/public`** - Création de commande
   - Utilise `Order.create()`
   - Utilise `File.create()` pour les fichiers

2. **`POST /api/contact`** - Message de contact
   - Utilise `Contact.create()`

3. **`GET /api/files/:filename`** - Servir un fichier
   - Utilise `File.findByFilename()`

## 📋 Schéma Supabase mis à jour

Le fichier `supabase-setup.sql` a été mis à jour pour inclure :

- ✅ Tous les champs de paiement (payment_status, payment_method, payment_reference, etc.)
- ✅ Champs de fichiers complets (original_name, filename, mimetype, path, url, order_id)
- ✅ Index optimisés
- ✅ Relations (files.order_id → orders.id)

## 🚀 Démarrage

### 1. Exécuter le schéma SQL

Dans Supabase SQL Editor, exécutez `supabase-setup.sql`

### 2. Vérifier la connexion

Le serveur vérifie automatiquement la connexion Supabase au démarrage :

```bash
cd backend
npm start
```

Vous devriez voir :
```
✅ Service Supabase initialisé pour le backend
✅ Connexion Supabase vérifiée
```

## 🔍 Vérification

### Tester la création d'une commande

```bash
curl -X POST http://localhost:3000/api/orders/public \
  -H "Content-Type: application/json" \
  -d '{
    "personName": "Test",
    "occasion": "anniversaire",
    "customerName": "Client Test",
    "customerEmail": "test@example.com",
    "customerPhone": "+225 07 12 34 56 78"
  }'
```

### Vérifier dans Supabase

1. Allez sur https://app.supabase.com
2. Ouvrez votre projet
3. Table Editor → `orders`
4. Vous devriez voir la commande créée

## 📊 Architecture complète

```
┌─────────────────────────────────────────────────┐
│                  FRONTEND                        │
│  script.js → supabase-service.js → Supabase API │
└─────────────────────────────────────────────────┘
                        │
                        │ (optionnel)
                        ▼
┌─────────────────────────────────────────────────┐
│                  BACKEND                         │
│  routes → models/supabase/* → supabaseService   │
│                      ↓                           │
│              Supabase API                        │
└─────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────┐
│              SUPABASE DATABASE                   │
│  orders | leads | contacts | files               │
└─────────────────────────────────────────────────┘
```

## ✅ Avantages

1. **Modèles réutilisables** - Même interface que Sequelize
2. **Type safety** - Conversion automatique
3. **Maintenabilité** - Code organisé
4. **Scalabilité** - Supabase gère tout
5. **Pas de base locale** - Tout dans le cloud
6. **Backup automatique** - Géré par Supabase

## 📝 Prochaines étapes

1. ✅ Modèles créés
2. ✅ Routes mises à jour
3. ✅ Schéma SQL mis à jour
4. ⏳ Tester avec des données réelles
5. ⏳ Vérifier dans Supabase Dashboard

## 📞 Besoin d'aide ?

- 📱 WhatsApp : +225 07 67 66 04 76
- 📧 Email : morak6@icloud.com








