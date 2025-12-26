# 🎛️ Configuration Complète de l'Interface Administrateur

## 📋 Vue d'ensemble

Une interface administrateur complète et sécurisée a été créée pour gérer les commandes, leads, contacts et fichiers.

## ✅ Fonctionnalités

### 1. **Authentification sécurisée**
- Connexion via Supabase Auth
- Vérification que l'utilisateur est dans la table `admin_users`
- Tokens JWT pour l'authentification

### 2. **Gestion des commandes**
- ✅ Voir toutes les commandes
- ✅ Voir les détails d'une commande
- ✅ Modifier le statut d'une commande
- ✅ Modifier le statut de paiement
- ✅ Télécharger toutes les photos d'une commande en ZIP

### 3. **Gestion des leads**
- ✅ Voir tous les leads
- ✅ Filtrer par statut

### 4. **Gestion des contacts**
- ✅ Voir tous les messages de contact

### 5. **Statistiques**
- ✅ Tableau de bord avec statistiques
- ✅ Graphiques des commandes
- ✅ Revenus totaux

## 🔐 Configuration de la sécurité (RLS)

### Étape 1 : Exécuter le script SQL

1. **Ouvrez Supabase Dashboard** → SQL Editor
2. **Exécutez le fichier** `supabase-rls-secure.sql`
3. **Remplacez l'email** dans la section "INSÉRER LE PREMIER ADMIN" :

```sql
INSERT INTO admin_users (email, name, role) 
VALUES ('votre-email@example.com', 'Administrateur Principal', 'admin')
ON CONFLICT (email) DO NOTHING;
```

### Étape 2 : Créer un compte admin dans Supabase Auth

1. **Ouvrez Supabase Dashboard** → Authentication → Users
2. **Cliquez sur "Add user"** → "Create new user"
3. **Entrez l'email** que vous avez mis dans `admin_users`
4. **Générez un mot de passe** ou laissez Supabase en générer un
5. **Copiez le mot de passe** (vous pourrez le changer après)

### Étape 3 : Configurer les variables d'environnement

Assurez-vous que votre fichier `.env` contient :

```env
SUPABASE_URL=https://votre-projet.supabase.co
SUPABASE_ANON_KEY=votre_cle_anon
SUPABASE_SERVICE_ROLE_KEY=votre_cle_service_role
```

**⚠️ IMPORTANT :**
- `SUPABASE_ANON_KEY` : Clé publique (utilisée par le frontend)
- `SUPABASE_SERVICE_ROLE_KEY` : Clé service (utilisée par le backend, gardez-la secrète !)

## 🚀 Utilisation

### 1. Démarrer le serveur backend

```bash
cd backend
npm install  # Pour installer archiver si nécessaire
npm start
```

### 2. Accéder à l'interface admin

Ouvrez votre navigateur : `http://localhost:3000/admin`

### 3. Se connecter

- **Email** : L'email que vous avez créé dans Supabase Auth
- **Mot de passe** : Le mot de passe que vous avez défini

## 📊 Routes API Admin

### Authentification

- `POST /api/admin/auth/login` - Connexion
- `POST /api/admin/auth/logout` - Déconnexion
- `GET /api/admin/auth/me` - Infos de l'admin connecté

### Commandes

- `GET /api/admin/orders` - Liste des commandes
- `GET /api/admin/orders/:id` - Détails d'une commande
- `PATCH /api/admin/orders/:id/status` - Modifier le statut
- `PATCH /api/admin/orders/:id/payment-status` - Modifier le statut de paiement
- `GET /api/admin/orders/:id/download-photos` - Télécharger les photos (ZIP)

### Statistiques

- `GET /api/admin/stats` - Statistiques du dashboard

### Leads

- `GET /api/admin/leads` - Liste des leads

### Contacts

- `GET /api/admin/contacts` - Liste des contacts

## 🔒 Sécurité RLS

Les règles RLS (Row Level Security) sont maintenant configurées :

### ✅ Permissions publiques (pour le frontend)
- **INSERT** : Public (pour créer des commandes)
- **SELECT** : Public pour orders/leads/files (lecture)

### 🔐 Permissions admin uniquement
- **UPDATE** : Admin uniquement
- **DELETE** : Admin uniquement
- **SELECT contacts** : Admin uniquement

### Comment ça fonctionne

1. **Frontend** : Utilise `SUPABASE_ANON_KEY` (clé publique)
   - Peut créer des commandes
   - Peut lire les commandes/leads/files
   - Ne peut PAS modifier/supprimer

2. **Backend Admin** : Utilise `SUPABASE_SERVICE_ROLE_KEY` (clé service)
   - Vérifie que l'utilisateur est admin via `admin_users`
   - Peut tout faire (modifier, supprimer, etc.)

## 📝 Ajouter un nouvel admin

### Via SQL

```sql
INSERT INTO admin_users (email, name, role) 
VALUES ('nouvel-admin@example.com', 'Nom Admin', 'admin')
ON CONFLICT (email) DO NOTHING;
```

### Via Supabase Dashboard

1. **SQL Editor** → Exécutez la requête ci-dessus
2. **Authentication** → Créez l'utilisateur avec le même email

## 🛠️ Dépannage

### "Accès refusé. Vous n'êtes pas administrateur."

**Solution :**
1. Vérifiez que l'email est dans `admin_users`
2. Vérifiez que `is_active = true` dans `admin_users`
3. Vérifiez que vous êtes connecté avec le bon email dans Supabase Auth

### "Token invalide ou expiré"

**Solution :**
1. Déconnectez-vous et reconnectez-vous
2. Vérifiez que `SUPABASE_SERVICE_ROLE_KEY` est correct dans `.env`

### "Supabase non configuré"

**Solution :**
1. Vérifiez que toutes les variables Supabase sont dans `.env`
2. Redémarrez le serveur backend

### Les photos ne se téléchargent pas

**Solution :**
1. Vérifiez que le dossier `uploads/` existe
2. Vérifiez que les fichiers sont bien dans `uploads/`
3. Vérifiez que `archiver` est installé : `npm install archiver`

## 📚 Documentation supplémentaire

- `supabase-rls-secure.sql` - Script SQL pour configurer RLS
- `backend/routes/admin.js` - Routes admin
- `backend/routes/admin-auth.js` - Routes d'authentification admin
- `backend/admin/admin.js` - Interface admin frontend

## 🎯 Prochaines étapes

1. ✅ Exécuter `supabase-rls-secure.sql`
2. ✅ Créer un compte admin dans Supabase Auth
3. ✅ Ajouter l'email dans `admin_users`
4. ✅ Configurer les variables d'environnement
5. ✅ Démarrer le serveur backend
6. ✅ Accéder à `http://localhost:3000/admin`
7. ✅ Se connecter et tester !

## 📞 Besoin d'aide ?

- 📱 WhatsApp : +225 07 67 66 04 76
- 📧 Email : morak6@icloud.com

