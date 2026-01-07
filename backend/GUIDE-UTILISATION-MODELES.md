# 📖 Guide d'utilisation des modèles Supabase

## 🎯 Vue d'ensemble

Les modèles Supabase remplacent complètement Sequelize et offrent une interface similaire mais adaptée à Supabase.

## 📦 Modèles disponibles

```javascript
const { Order, Lead, File, Contact } = require('./models/supabase');
```

## 🔧 Utilisation des modèles

### 1. Order (Commandes)

#### Créer une commande

```javascript
const { Order } = require('./models/supabase');

const order = await Order.create({
    orderNumber: 'PM-1234567890-ABCD',
    personName: 'Marie Dupont',
    occasion: 'anniversaire',
    relationship: 'amie',
    customerName: 'Jean Martin',
    customerEmail: 'jean@example.com',
    customerPhone: '+225 07 12 34 56 78',
    deliveryDate: '2024-12-25',
    deliveryAddress: '123 Rue Example, Abidjan',
    description: 'Magazine pour l\'anniversaire de Marie',
    status: 'pending',
    paymentStatus: 'pending',
    basePrice: 25000,
    totalPrice: 25000,
    currency: 'XOF'
});

console.log(order.id); // UUID de la commande
console.log(order.toJSON()); // Format JSON pour le frontend
```

#### Trouver une commande

```javascript
// Par ID
const order = await Order.findByPk('uuid-here');

// Par numéro de commande
const order = await Order.findByOrderNumber('PM-1234567890-ABCD');

// Avec filtres
const orders = await Order.findAll({
    where: {
        status: 'pending',
        paymentStatus: 'pending'
    },
    order: [['created_at', 'DESC']],
    limit: 10,
    offset: 0
});
```

#### Mettre à jour

```javascript
const order = await Order.findByPk(orderId);
order.status = 'confirmed';
order.paymentStatus = 'paid';
await order.save();

// Ou avec update()
await order.update({
    status: 'confirmed',
    paymentStatus: 'paid'
});
```

### 2. Lead (Prospects)

#### Créer un lead

```javascript
const { Lead } = require('./models/supabase');

const lead = await Lead.create({
    name: 'Sophie Martin',
    email: 'sophie@example.com',
    phone: '+225 07 12 34 56 78',
    occasion: 'mariage',
    message: 'Je souhaite créer un magazine pour mon mariage',
    source: 'contact_form'
});

// Le score est calculé automatiquement
console.log(lead.score); // 0-100
```

#### Rechercher des leads

```javascript
// Tous les leads
const leads = await Lead.findAll();

// Avec filtres
const newLeads = await Lead.findAll({
    where: {
        status: 'new'
    },
    order: [['score', 'DESC']],
    limit: 20
});
```

### 3. File (Fichiers)

#### Créer un fichier

```javascript
const { File } = require('./models/supabase');

const file = await File.create({
    originalName: 'photo.jpg',
    filename: 'uuid-generated.jpg',
    mimetype: 'image/jpeg',
    size: 1024000,
    path: '/path/to/file.jpg',
    url: '/api/files/uuid-generated.jpg',
    orderId: 'order-uuid',
    type: 'photo'
});
```

#### Trouver un fichier

```javascript
// Par ID
const file = await File.findByPk('file-uuid');

// Par filename
const file = await File.findByFilename('uuid-generated.jpg');

// Par commande
const files = await File.findAll({
    where: {
        orderId: 'order-uuid'
    }
});
```

### 4. Contact (Messages de contact)

#### Créer un contact

```javascript
const { Contact } = require('./models/supabase');

const contact = await Contact.create({
    name: 'Pierre Dupont',
    email: 'pierre@example.com',
    message: 'Bonjour, j\'aimerais des informations',
    source: 'contact_form'
});
```

## 🔄 Conversion des formats

### toSupabase() - Pour Supabase

```javascript
const order = new Order(data);
const supabaseData = order.toSupabase();
// { order_number: '...', person_name: '...', ... }
```

### toJSON() - Pour le frontend

```javascript
const order = await Order.findByPk(id);
const json = order.toJSON();
// { orderNumber: '...', personName: '...', ... }
```

## 📊 Options de recherche

### findAll() - Options complètes

```javascript
const results = await Order.findAll({
    // Filtres WHERE
    where: {
        status: 'pending',
        paymentStatus: 'pending',
        customerEmail: 'client@example.com'
    },
    
    // Tri
    order: [['created_at', 'DESC']], // ou [['status', 'ASC']]
    
    // Pagination
    limit: 10,
    offset: 20
});
```

## ⚠️ Gestion des erreurs

```javascript
try {
    const order = await Order.create(data);
} catch (error) {
    if (error.code === '23505') {
        // Violation de contrainte unique (ex: order_number existe déjà)
        console.error('Numéro de commande déjà utilisé');
    } else if (error.code === 'PGRST116') {
        // Non trouvé
        console.error('Commande non trouvée');
    } else {
        console.error('Erreur Supabase:', error.message);
    }
}
```

## 🔍 Exemples pratiques

### Créer une commande complète avec fichiers

```javascript
const { Order, File } = require('./models/supabase');

// 1. Créer la commande
const order = await Order.create({
    orderNumber: 'PM-123456',
    personName: 'Marie',
    occasion: 'anniversaire',
    customerEmail: 'client@example.com',
    // ...
});

// 2. Créer les fichiers associés
for (const fileData of uploadedFiles) {
    await File.create({
        originalName: fileData.name,
        filename: fileData.filename,
        mimetype: fileData.mimetype,
        size: fileData.size,
        path: fileData.path,
        url: fileData.url,
        orderId: order.id,
        type: 'photo'
    });
}
```

### Mettre à jour le statut de paiement

```javascript
const order = await Order.findByPk(orderId);

if (order.paymentStatus === 'pending') {
    order.paymentStatus = 'paid';
    order.paymentReference = 'WAVE-123456789';
    order.paymentConfirmedAt = new Date().toISOString();
    await order.save();
}
```

## 📝 Notes importantes

1. **Conversion automatique** - Les modèles convertissent automatiquement snake_case ↔ camelCase
2. **Alias** - `customerName` et `clientName` sont tous deux supportés
3. **JSON fields** - Les champs JSONB sont automatiquement parsés/stringifiés
4. **Timestamps** - `created_at` et `updated_at` sont gérés automatiquement

## 📞 Besoin d'aide ?

- 📱 WhatsApp : +225 07 67 66 04 76
- 📧 Email : morak6@icloud.com








