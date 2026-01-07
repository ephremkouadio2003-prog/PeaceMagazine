# 🔧 Configuration MySQL pour Peace Magazine

## ❌ Erreur actuelle

```
Access denied for user 'root'@'localhost' (using password: NO)
```

Cette erreur signifie que MySQL refuse la connexion car aucun mot de passe n'est fourni.

## ✅ Solutions

### Solution 1 : Configurer le mot de passe MySQL dans .env

1. **Ouvrez le fichier `.env`** dans le dossier `backend/`

2. **Trouvez la ligne** :
   ```env
   DB_PASSWORD=
   ```

3. **Ajoutez votre mot de passe MySQL** :
   ```env
   DB_PASSWORD=votre_mot_de_passe_mysql
   ```

4. **Redémarrez le serveur backend**

### Solution 2 : Si vous n'avez pas de mot de passe MySQL

Si votre MySQL n'a pas de mot de passe pour l'utilisateur `root`, vous pouvez :

#### Option A : Définir un mot de passe MySQL

```bash
# Se connecter à MySQL
mysql -u root

# Dans MySQL, exécutez :
ALTER USER 'root'@'localhost' IDENTIFIED BY 'votre_nouveau_mot_de_passe';
FLUSH PRIVILEGES;
EXIT;
```

Puis ajoutez ce mot de passe dans le fichier `.env` :
```env
DB_PASSWORD=votre_nouveau_mot_de_passe
```

#### Option B : Créer un utilisateur MySQL dédié

```bash
# Se connecter à MySQL
mysql -u root

# Créer un utilisateur et une base de données
CREATE DATABASE peace_magazine;
CREATE USER 'peace_magazine'@'localhost' IDENTIFIED BY 'mot_de_passe_securise';
GRANT ALL PRIVILEGES ON peace_magazine.* TO 'peace_magazine'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

Puis modifiez le fichier `.env` :
```env
DB_NAME=peace_magazine
DB_USER=peace_magazine
DB_PASSWORD=mot_de_passe_securise
```

### Solution 3 : Utiliser SQLite (plus simple pour le développement)

Si vous ne voulez pas configurer MySQL, vous pouvez utiliser SQLite qui ne nécessite pas de serveur séparé.

1. **Installez sqlite3** :
   ```bash
   cd backend
   npm install sqlite3 --save
   ```

2. **Modifiez `config/database.js`** pour utiliser SQLite :
   ```javascript
   const sequelize = new Sequelize({
       dialect: 'sqlite',
       storage: './database.sqlite',
       logging: false
   });
   ```

## 🔍 Vérification

### Vérifier que MySQL fonctionne

```bash
# Tester la connexion MySQL
mysql -u root -p
# Entrez votre mot de passe quand demandé
```

### Vérifier que la base de données existe

```bash
mysql -u root -p
```

Puis dans MySQL :
```sql
SHOW DATABASES;
CREATE DATABASE IF NOT EXISTS peace_magazine;
USE peace_magazine;
SHOW TABLES;
```

## 📝 Configuration complète du fichier .env

Assurez-vous que votre fichier `.env` contient au minimum :

```env
# Base de données MySQL
DB_HOST=localhost
DB_PORT=3306
DB_NAME=peace_magazine
DB_USER=root
DB_PASSWORD=votre_mot_de_passe_ici
DB_DIALECT=mysql

# Brevo
BREVO_API_KEY=xkeysib-VOTRE_CLE_BREVO_ICI
BREVO_FROM_EMAIL=morak6@icloud.com
BREVO_FROM_NAME=Peace Magazine
```

## 🚀 Après configuration

1. **Redémarrez le serveur backend** :
   ```bash
   cd backend
   npm run dev
   ```

2. **Vérifiez les logs** - Vous devriez voir :
   ```
   ✅ Connexion à la base de données établie avec succès
   ✅ Service Brevo initialisé avec succès
   🚀 Serveur démarré sur http://localhost:3000
   ```

## 🆘 Problèmes courants

### "Access denied" même avec le mot de passe
- Vérifiez que le mot de passe est correct
- Vérifiez que l'utilisateur MySQL existe : `SELECT user FROM mysql.user;`
- Vérifiez les permissions : `SHOW GRANTS FOR 'root'@'localhost';`

### "Unknown database 'peace_magazine'"
- Créez la base de données : `CREATE DATABASE peace_magazine;`

### MySQL n'est pas installé
- **macOS** : `brew install mysql` puis `brew services start mysql`
- **Linux** : `sudo apt-get install mysql-server` (Ubuntu/Debian)
- **Windows** : Téléchargez depuis https://dev.mysql.com/downloads/mysql/

## 📞 Besoin d'aide ?

Si le problème persiste, contactez-nous :
- 📱 WhatsApp : +225 07 67 66 04 76
- 📧 Email : morak6@icloud.com












