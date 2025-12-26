# ⚠️ MySQL désactivé - Migration vers Supabase

## ✅ Changements effectués

Toutes les connexions MySQL ont été supprimées et remplacées par Supabase.

### Fichiers modifiés :

1. **`server.dev.js`** - Connexion MySQL désactivée
2. **`config/database.js`** - Sequelize désactivé
3. **`models/index.js`** - Modèles Sequelize désactivés
4. **`config.dev.js`** - Variables MySQL commentées
5. **`config.env.example`** - Variables MySQL commentées
6. **`backend/services/supabaseService.js`** - Nouveau service Supabase créé

### Dépendances :

- **`@supabase/supabase-js`** ajouté au `package.json`
- **`mysql2`** et **`sequelize`** conservés mais non utilisés (peuvent être supprimés plus tard)

## 🚀 Utilisation

### Le backend fonctionne maintenant uniquement pour :
- ✅ Envoi d'emails via Brevo
- ✅ Gestion des fichiers uploadés
- ✅ API de paiement (Wave)

### Toutes les données sont gérées par Supabase :
- ✅ Commandes (`orders`)
- ✅ Leads (`leads`)
- ✅ Contacts (`contacts`)
- ✅ Fichiers (`files`)

## 📝 Configuration Supabase

Les variables d'environnement Supabase doivent être définies dans `.env` :

```env
SUPABASE_URL=https://chxhkoeqwssrczfviar.supabase.co
SUPABASE_KEY=VOTRE_CLE_SUPABASE_ANON_KEY_ICI
```

## 🔄 Migration des contrôleurs

Les contrôleurs (`orderController.js`, `leadController.js`, etc.) utilisent encore Sequelize mais peuvent être migrés vers Supabase en utilisant le service `supabaseService.js`.

## ⚠️ Important

Le backend n'est plus nécessaire pour la persistance des données. Le frontend communique directement avec Supabase. Le backend reste utile pour :
- Les emails de confirmation (Brevo)
- L'administration (si nécessaire)
- Les webhooks de paiement

## 📞 Besoin d'aide ?

- 📱 WhatsApp : +225 07 67 66 04 76
- 📧 Email : morak6@icloud.com



