# 🔧 Résolution de l'erreur MySQL

## ❌ Erreur actuelle

```
Access denied for user 'root'@'localhost' (using password: NO)
```

## ✅ Solution rapide (2 minutes)

### Étape 1 : Créer le fichier .env

**Option A : Utiliser le script automatique** (recommandé)

```bash
cd "/Users/ephremkouadio/Peace magazine/backend"
./create-env.sh
```

Le script vous demandera votre mot de passe MySQL.

**Option B : Créer manuellement**

1. Créez un fichier nommé `.env` dans le dossier `backend/`
2. Ajoutez ce contenu (remplacez `votre_mot_de_passe` par votre mot de passe MySQL) :

```env
# Base de données MySQL
DB_HOST=localhost
DB_PORT=3306
DB_NAME=peace_magazine
DB_USER=root
DB_PASSWORD=votre_mot_de_passe

# Brevo
BREVO_API_KEY=xkeysib-VOTRE_CLE_BREVO_ICI
BREVO_FROM_EMAIL=morak6@icloud.com
BREVO_FROM_NAME=Peace Magazine

# Serveur
NODE_ENV=development
PORT=3000
HOST=localhost

# URLs
FRONTEND_URL=http://localhost:8080
BACKEND_URL=http://localhost:3000
```

### Étape 2 : Si vous n'avez pas de mot de passe MySQL

Si votre MySQL n'a pas de mot de passe, vous devez en définir un :

```bash
# Se connecter à MySQL
mysql -u root

# Dans MySQL, exécutez :
ALTER USER 'root'@'localhost' IDENTIFIED BY 'votre_nouveau_mot_de_passe';
FLUSH PRIVILEGES;
EXIT;
```

Puis utilisez ce mot de passe dans le fichier `.env`.

### Étape 3 : Créer la base de données

```bash
mysql -u root -p
```

Puis dans MySQL :
```sql
CREATE DATABASE IF NOT EXISTS peace_magazine;
EXIT;
```

### Étape 4 : Redémarrer le serveur

```bash
cd "/Users/ephremkouadio/Peace magazine/backend"
npm run dev
```

## ✅ Résultat attendu

Vous devriez voir :
```
✅ Connexion à la base de données établie avec succès
✅ Service Brevo initialisé avec succès
🚀 Serveur démarré sur http://localhost:3000
```

## 🆘 Si ça ne fonctionne toujours pas

1. **Vérifiez que MySQL est démarré** :
   ```bash
   # macOS
   brew services list
   # ou
   mysql.server start
   ```

2. **Testez la connexion MySQL** :
   ```bash
   mysql -u root -p
   # Entrez votre mot de passe
   ```

3. **Vérifiez que la base de données existe** :
   ```sql
   SHOW DATABASES;
   ```

## 📞 Besoin d'aide ?

Contactez-nous :
- 📱 WhatsApp : +225 07 67 66 04 76
- 📧 Email : morak6@icloud.com







