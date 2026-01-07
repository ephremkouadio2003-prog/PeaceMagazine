# ⚠️ Routes désactivées - Migration vers Supabase

## ❌ Problème identifié

Les contrôleurs utilisent Sequelize (`Order.create()`, `User.findByPk()`, etc.) mais les modèles sont à `null` après la désactivation de MySQL. Cela causerait des erreurs `TypeError` si ces routes étaient utilisées.

## ✅ Solution appliquée

### Routes désactivées (nécessitent Sequelize) :

1. **`/api/orders`** (routes admin) - DÉSACTIVÉES
   - `POST /api/orders` - Création authentifiée
   - `GET /api/orders` - Liste des commandes
   - `GET /api/orders/stats` - Statistiques
   - `GET /api/orders/:id` - Détails d'une commande
   - `PUT /api/orders/:id` - Mise à jour
   - `PUT /api/orders/:id/assign` - Assignation
   - `DELETE /api/orders/:id` - Suppression

2. **`/api/leads`** - TOUTES LES ROUTES DÉSACTIVÉES
   - Les leads sont gérés directement par Supabase côté frontend

3. **`/api/files`** - DÉSACTIVÉES
   - Nécessitent Sequelize pour la gestion des fichiers

### Routes actives (utilisent Supabase) :

1. **`POST /api/orders/public`** - ✅ ACTIVE
   - Création de commande publique
   - Utilise Supabase directement via `routes/orders-supabase.js`
   - Ne dépend plus de Sequelize

2. **`/api/payment`** - ✅ ACTIVES
   - Routes de paiement (Wave)

3. **`/api/heyzine`** - ✅ ACTIVES
   - Intégration Heyzine

## 🔄 Migration effectuée

### Nouveau fichier : `routes/orders-supabase.js`

Cette route remplace `OrderController.createPublicOrder` qui utilisait Sequelize :

```javascript
router.post('/public', async (req, res) => {
    // Utilise supabaseService.createOrder() directement
    // Pas de dépendance à Sequelize
});
```

### Modifications dans `server.dev.js`

```javascript
// Ancien (désactivé)
// app.use('/api/orders', orderRoutes);

// Nouveau (utilise Supabase)
const ordersSupabaseRoutes = require('./routes/orders-supabase');
app.use('/api/orders', ordersSupabaseRoutes);
```

## 📊 Architecture actuelle

### Frontend → Supabase (direct)
- ✅ Création de commandes
- ✅ Gestion des leads
- ✅ Gestion des contacts
- ✅ Gestion des fichiers

### Backend → Supabase (via routes publiques)
- ✅ `POST /api/orders/public` - Création de commande avec emails Brevo

### Backend (services uniquement)
- ✅ Emails Brevo
- ✅ Paiement Wave
- ✅ Heyzine

## 🚀 Utilisation

### Pour créer une commande

**Option 1 : Frontend → Supabase (recommandé)**
```javascript
// Le frontend utilise directement supabase-service.js
await supabaseService.createOrder(orderData);
```

**Option 2 : Backend → Supabase**
```javascript
// Via la route publique
POST /api/orders/public
```

### Pour les routes admin

Utilisez l'interface Supabase directement :
- https://app.supabase.com
- Table Editor pour voir/modifier les données
- SQL Editor pour les requêtes complexes

## ⚠️ Important

1. **Les routes admin ne fonctionnent plus** - Utilisez Supabase directement
2. **Le frontend utilise Supabase directement** - Pas besoin du backend pour les données
3. **Le backend sert uniquement pour** :
   - Emails Brevo
   - Paiement Wave
   - Webhooks

## 📝 Pour réactiver les routes admin

Si vous voulez réactiver les routes admin, vous devez :
1. Migrer tous les contrôleurs vers Supabase
2. Remplacer toutes les méthodes Sequelize par des appels Supabase
3. Gérer les transactions manuellement (Supabase ne supporte pas les transactions comme Sequelize)

**Recommandation** : Utilisez Supabase directement pour l'administration.

## 📞 Besoin d'aide ?

- 📱 WhatsApp : +225 07 67 66 04 76
- 📧 Email : morak6@icloud.com








