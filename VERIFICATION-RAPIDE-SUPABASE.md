# ⚡ Vérification rapide Supabase - 2 minutes

## ❌ Vous voyez : "Impossible de se connecter au serveur"

Avec Supabase configuré, cette erreur signifie généralement que **les tables n'existent pas encore** dans Supabase.

## ✅ Solution en 3 étapes

### Étape 1 : Ouvrir la console du navigateur

1. Ouvrez votre site : **http://localhost:8080**
2. Appuyez sur **F12** (outils de développement)
3. Allez dans l'onglet **Console**
4. Essayez de créer une commande
5. **Regardez le message d'erreur exact**

### Étape 2 : Identifier l'erreur

#### Si vous voyez : `relation "orders" does not exist`
→ **Les tables n'existent pas** - Passez à l'étape 3

#### Si vous voyez : `permission denied`
→ **Les politiques RLS ne sont pas configurées** - Passez à l'étape 3

#### Si vous voyez : `Invalid API key`
→ **La clé API est incorrecte** - Vérifiez dans Supabase > Settings > API

### Étape 3 : Créer les tables (2 minutes)

1. **Connectez-vous** à Supabase : https://app.supabase.com/
2. **Sélectionnez votre projet**
3. **Cliquez sur "SQL Editor"** dans le menu de gauche
4. **Cliquez sur "New query"**
5. **Ouvrez le fichier** `supabase-setup.sql` dans votre projet
6. **Copiez TOUT le contenu** du fichier (151 lignes)
7. **Collez** dans le SQL Editor de Supabase
8. **Cliquez sur "Run"** (ou appuyez sur Cmd+Enter)

### Vérification

1. **Allez dans "Table Editor"** dans Supabase
2. **Vérifiez** que vous voyez 4 tables :
   - ✅ `orders`
   - ✅ `leads`
   - ✅ `contacts`
   - ✅ `files`

## ✅ Après avoir créé les tables

1. **Rechargez votre site** : http://localhost:8080
2. **Essayez de créer une commande**
3. **Vérifiez dans Supabase** > Table Editor > `orders` que la commande apparaît

## 🆘 Si ça ne fonctionne toujours pas

1. **Copiez le message d'erreur exact** de la console
2. **Vérifiez** dans Supabase > Table Editor que les tables existent
3. **Vérifiez** dans Supabase > Authentication > Policies que les politiques existent

## 📞 Besoin d'aide ?

Envoyez-moi :
- Le message d'erreur exact de la console
- Une capture d'écran de Supabase > Table Editor

- 📱 WhatsApp : +225 07 67 66 04 76
- 📧 Email : morak6@icloud.com









