# ✅ Vérification de la connexion Supabase

## 🔑 Clé API configurée

Votre clé API Supabase a été mise à jour :
- **Clé publique** : `VOTRE_CLE_SUPABASE_ANON_KEY_ICI`
- **URL Supabase** : `https://chxhkoeqwssrczfviar.supabase.co`

## 📝 Fichiers mis à jour

- ✅ `index.html` - Configuration Supabase dans APP_CONFIG
- ✅ `supabase-service.js` - Clé API dans le service

## 🧪 Test de la connexion

### Étape 1 : Ouvrir la console du navigateur

1. Ouvrez votre site : **http://localhost:8080**
2. Appuyez sur **F12** (ou Cmd+Option+I sur Mac)
3. Allez dans l'onglet **Console**

### Étape 2 : Vérifier les messages

Vous devriez voir :
```
✅ Supabase client initialisé
Supabase activé: true
```

### Étape 3 : Tester une commande

1. Remplissez le formulaire de commande
2. Soumettez la commande
3. Vérifiez dans la console qu'il n'y a pas d'erreurs Supabase

## 🔍 Vérification dans Supabase

1. **Connectez-vous à votre projet Supabase** : https://app.supabase.com/
2. **Allez dans "Table Editor"**
3. **Vérifiez que les tables existent** :
   - `orders` (commandes)
   - `leads` (prospects)
   - `contacts` (contacts)
   - `files` (fichiers)

## ⚠️ Si vous voyez des erreurs

### Erreur : "Invalid API key"
- Vérifiez que la clé API est correcte
- Assurez-vous que c'est la clé **publique** (anonyme), pas la clé secrète

### Erreur : "relation does not exist"
- Les tables n'existent pas encore dans Supabase
- Exécutez le fichier `supabase-setup.sql` dans votre projet Supabase

### Erreur : "permission denied"
- Vérifiez les politiques RLS (Row Level Security) dans Supabase
- Les tables doivent permettre les INSERT pour les utilisateurs anonymes

## 📋 Configuration RLS (Row Level Security)

Pour que les utilisateurs puissent créer des commandes, vous devez configurer les politiques dans Supabase :

1. **Allez dans "Authentication" > "Policies"**
2. **Pour chaque table** (orders, leads, contacts, files) :
   - Créez une politique pour permettre INSERT aux utilisateurs anonymes
   - Créez une politique pour permettre SELECT aux utilisateurs authentifiés (admin)

### Exemple de politique pour INSERT (anonyme)

```sql
-- Permettre l'insertion pour les utilisateurs anonymes
CREATE POLICY "Allow anonymous insert" ON orders
FOR INSERT
TO anon
WITH CHECK (true);
```

## ✅ Configuration complète

Une fois configuré, votre site utilisera Supabase pour :
- ✅ Sauvegarder les commandes
- ✅ Sauvegarder les leads (prospects)
- ✅ Sauvegarder les contacts
- ✅ Sauvegarder les fichiers

Le backend Node.js devient optionnel - Supabase gère tout !

## 📞 Besoin d'aide ?

- 📱 WhatsApp : +225 07 67 66 04 76
- 📧 Email : morak6@icloud.com









