# 🔍 Débogage Supabase - Guide de résolution

## ❌ Problème : "Impossible de se connecter au serveur"

Si vous voyez ce message alors que Supabase est configuré, voici comment identifier et résoudre le problème.

## 🔍 Étape 1 : Vérifier la console du navigateur

1. **Ouvrez votre site** : http://localhost:8080
2. **Appuyez sur F12** (outils de développement)
3. **Allez dans l'onglet Console**
4. **Essayez de créer une commande**
5. **Regardez les messages d'erreur** dans la console

### Messages à chercher :

#### ✅ Si vous voyez :
```
Tentative via Supabase...
```
→ Supabase est bien configuré et le code essaie de l'utiliser.

#### ❌ Si vous voyez :
```
relation "orders" does not exist
```
→ **Solution** : Les tables n'existent pas. Exécutez `supabase-setup.sql` dans Supabase.

#### ❌ Si vous voyez :
```
permission denied for table "orders"
```
→ **Solution** : Les politiques RLS ne sont pas configurées. Exécutez `supabase-setup.sql` dans Supabase.

#### ❌ Si vous voyez :
```
Invalid API key
```
→ **Solution** : La clé API est incorrecte. Vérifiez dans Supabase > Settings > API.

#### ❌ Si vous voyez :
```
Failed to fetch
```
→ **Solution** : Problème de connexion Internet ou CORS. Vérifiez votre connexion.

## 🔧 Étape 2 : Vérifier la configuration Supabase

### Dans votre projet Supabase :

1. **Allez dans Settings > API**
2. **Vérifiez** :
   - **Project URL** : Doit être `https://chxhkoeqwssrczfviar.supabase.co`
   - **anon public key** : Doit correspondre à la clé dans `index.html`

### Dans votre fichier index.html :

Vérifiez que la configuration est :
```javascript
supabaseUrl: 'https://chxhkoeqwssrczfviar.supabase.co',
supabaseKey: 'VOTRE_CLE_SUPABASE_ANON_KEY_ICI',
useSupabase: true
```

## 📋 Étape 3 : Vérifier que les tables existent

1. **Dans Supabase**, allez dans **Table Editor**
2. **Vérifiez** que vous voyez ces tables :
   - ✅ `orders`
   - ✅ `leads`
   - ✅ `contacts`
   - ✅ `files`

### Si les tables n'existent pas :

1. **Allez dans SQL Editor** dans Supabase
2. **Ouvrez** le fichier `supabase-setup.sql` de votre projet
3. **Copiez TOUT le contenu**
4. **Collez** dans le SQL Editor
5. **Cliquez sur Run** (ou Cmd+Enter)

## 🔒 Étape 4 : Vérifier les politiques RLS

1. **Dans Supabase**, allez dans **Authentication > Policies**
2. **Pour chaque table** (orders, leads, contacts, files), vérifiez qu'il y a :
   - Une politique **INSERT** pour `anon` (utilisateurs anonymes)
   - Une politique **SELECT** pour `anon` (utilisateurs anonymes)

### Si les politiques n'existent pas :

Le fichier `supabase-setup.sql` contient déjà les politiques. Si elles n'existent pas, exécutez à nouveau le fichier SQL.

## 🧪 Étape 5 : Tester manuellement Supabase

### Test 1 : Vérifier l'URL Supabase

Dans votre navigateur, allez sur :
```
https://chxhkoeqwssrczfviar.supabase.co/rest/v1/orders
```

Vous devriez voir une réponse JSON (même vide si aucune commande).

### Test 2 : Tester avec curl (Terminal)

```bash
curl -X GET "https://chxhkoeqwssrczfviar.supabase.co/rest/v1/orders" \
  -H "apikey: VOTRE_CLE_SUPABASE_ANON_KEY_ICI" \
  -H "Authorization: Bearer VOTRE_CLE_SUPABASE_ANON_KEY_ICI"
```

Si vous voyez une erreur, notez le message d'erreur.

## ✅ Solutions selon l'erreur

### Erreur : "relation does not exist"
**Solution** : Exécutez `supabase-setup.sql` dans Supabase > SQL Editor

### Erreur : "permission denied"
**Solution** : Vérifiez que les politiques RLS sont créées (dans `supabase-setup.sql`)

### Erreur : "Invalid API key"
**Solution** : 
1. Allez dans Supabase > Settings > API
2. Copiez la clé "anon public"
3. Mettez à jour `index.html` avec cette clé

### Erreur : "Failed to fetch" ou "Load failed"
**Solution** : 
- Vérifiez votre connexion Internet
- Vérifiez que l'URL Supabase est correcte
- Vérifiez qu'il n'y a pas de bloqueur de CORS

## 📞 Besoin d'aide ?

Si le problème persiste après avoir vérifié tout ceci :
- 📱 WhatsApp : +225 07 67 66 04 76
- 📧 Email : morak6@icloud.com

**Important** : Copiez les messages d'erreur exacts de la console du navigateur pour que je puisse mieux vous aider.




