# 🗄️ Créer la base de données MySQL

## ❌ Erreur actuelle

```
Unknown database 'peace_magazine'
```

La base de données MySQL `peace_magazine` n'existe pas encore.

## ✅ Solution rapide (1 minute)

### Étape 1 : Se connecter à MySQL

Ouvrez votre Terminal et exécutez :

```bash
mysql -u root -p
```

**Note** : Si vous n'avez pas de mot de passe MySQL, essayez simplement :
```bash
mysql -u root
```

### Étape 2 : Créer la base de données

Une fois connecté à MySQL, copiez-collez ces commandes :

```sql
CREATE DATABASE IF NOT EXISTS peace_magazine;
SHOW DATABASES;
EXIT;
```

### Étape 3 : Vérifier que le fichier .env existe

Assurez-vous que le fichier `backend/.env` contient votre mot de passe MySQL :

```env
DB_PASSWORD=votre_mot_de_passe_mysql
```

Si le fichier `.env` n'existe pas, créez-le avec :

```bash
cd "/Users/ephremkouadio/Peace magazine/backend"
./create-env.sh
```

### Étape 4 : Redémarrer le serveur

```bash
cd "/Users/ephremkouadio/Peace magazine/backend"
npm start
```

## ✅ Résultat attendu

Vous devriez voir :
```
✅ Connexion à la base de données établie avec succès
✅ Service Brevo initialisé avec succès
🚀 Serveur démarré sur http://localhost:3000
```

## 🆘 Si MySQL n'est pas installé

### macOS (avec Homebrew)
```bash
brew install mysql
brew services start mysql
```

### Vérifier que MySQL fonctionne
```bash
mysql --version
```

## 📝 Alternative : Script automatique

Si vous préférez, vous pouvez utiliser ce script SQL :

```bash
mysql -u root -p < creer-database.sql
```

(Voir le fichier `creer-database.sql` dans le dossier `backend/`)

## ⚠️ Important : Backend optionnel avec Supabase

**Rappel** : Si vous utilisez Supabase pour la persistance des données, le backend Node.js n'est **pas obligatoire** pour que le site fonctionne. Le backend est utile pour :
- Envoyer des emails de confirmation via Brevo
- Gérer l'administration des commandes

Mais les commandes peuvent être sauvegardées directement dans Supabase sans backend.

## 📞 Besoin d'aide ?

- 📱 WhatsApp : +225 07 67 66 04 76
- 📧 Email : morak6@icloud.com








