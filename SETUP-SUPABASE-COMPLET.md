# 🚀 Configuration complète Supabase - Guide étape par étape

## ✅ Votre site fonctionne maintenant avec Supabase !

Avec Supabase configuré, **vous n'avez PAS besoin du backend Node.js**. Le site fonctionne entièrement avec Supabase.

## 📋 Étapes de configuration

### Étape 1 : Créer les tables dans Supabase

1. **Connectez-vous** à votre projet Supabase :
   - Allez sur : https://app.supabase.com/
   - Sélectionnez votre projet

2. **Ouvrez le SQL Editor** :
   - Dans le menu de gauche, cliquez sur "SQL Editor"
   - Cliquez sur "New query"

3. **Exécutez le script SQL** :
   - Ouvrez le fichier `supabase-setup.sql` dans votre projet
   - **Copiez TOUT le contenu** du fichier
   - **Collez-le** dans le SQL Editor de Supabase
   - Cliquez sur **"Run"** (ou appuyez sur Cmd+Enter)

4. **Vérifiez que les tables sont créées** :
   - Allez dans "Table Editor" dans le menu de gauche
   - Vous devriez voir 4 tables :
     - ✅ `orders` (commandes)
     - ✅ `leads` (prospects)
     - ✅ `contacts` (messages de contact)
     - ✅ `files` (fichiers)

### Étape 2 : Vérifier les politiques RLS

Les politiques RLS (Row Level Security) sont déjà incluses dans le fichier `supabase-setup.sql`. Elles permettent :
- ✅ **INSERT** pour les utilisateurs anonymes (pour créer des commandes)
- ✅ **SELECT** pour les utilisateurs anonymes (pour lire les données)

Si vous voulez restreindre l'accès SELECT aux admins uniquement, modifiez les politiques dans Supabase > Authentication > Policies.

### Étape 3 : Tester votre site

1. **Ouvrez votre site** : http://localhost:8080

2. **Ouvrez la console du navigateur** (F12) :
   - Vous devriez voir : `Supabase activé: true`

3. **Testez une commande** :
   - Remplissez le formulaire de commande
   - Soumettez la commande
   - Vérifiez dans la console qu'il n'y a pas d'erreurs

4. **Vérifiez dans Supabase** :
   - Allez dans Supabase > Table Editor > `orders`
   - Vous devriez voir votre commande apparaître !

## ✅ Configuration actuelle

- **URL Supabase** : `https://chxhkoeqwssrczfviar.supabase.co`
- **Clé API** : `VOTRE_CLE_SUPABASE_ANON_KEY_ICI`
- **Supabase activé** : ✅ Oui

## 🎯 Ce qui fonctionne avec Supabase

- ✅ **Création de commandes** - Sauvegardées dans `orders`
- ✅ **Création de leads** - Sauvegardés dans `leads`
- ✅ **Messages de contact** - Sauvegardés dans `contacts`
- ✅ **Upload de fichiers** - Métadonnées sauvegardées dans `files`

## ⚠️ Ce qui nécessite le backend (optionnel)

- 📧 **Envoi d'emails** (Brevo) - Nécessite le backend
- 💳 **Paiements avancés** - Nécessite le backend
- 📁 **Upload de fichiers** - Peut être fait via Supabase Storage (à configurer)

## 🔍 Vérification

### Vérifier que Supabase fonctionne

1. **Console du navigateur** :
   ```
   Supabase activé: true
   ⚠️ @supabase/supabase-js non disponible, utilisation de fetch API
   ```
   (C'est normal - le service utilise fetch API directement)

2. **Créer une commande de test** :
   - Remplissez le formulaire
   - Soumettez
   - Vérifiez dans Supabase que la commande apparaît

### Erreurs courantes

#### "relation does not exist"
→ Les tables n'existent pas. Exécutez le fichier `supabase-setup.sql` dans Supabase.

#### "permission denied"
→ Les politiques RLS ne sont pas configurées. Vérifiez que le script SQL a bien créé les politiques.

#### "Invalid API key"
→ La clé API est incorrecte. Vérifiez dans `index.html` que la clé correspond à celle de votre projet Supabase.

## 📊 Visualiser vos données

Dans Supabase, vous pouvez :
- **Table Editor** : Voir toutes les données en temps réel
- **SQL Editor** : Exécuter des requêtes personnalisées
- **API Docs** : Documentation automatique de l'API REST

## 🎉 C'est tout !

Une fois les tables créées dans Supabase, votre site fonctionne **100% avec Supabase** sans avoir besoin du backend Node.js !

## 📞 Besoin d'aide ?

- 📱 WhatsApp : +225 07 67 66 04 76
- 📧 Email : morak6@icloud.com




