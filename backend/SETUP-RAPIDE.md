# 🚀 Configuration rapide - Backend Peace Magazine

## ⚠️ Erreurs courantes et solutions

### 1. Erreur MySQL : "Access denied for user 'root'@'localhost'"

**Problème** : MySQL refuse la connexion car aucun mot de passe n'est fourni.

**Solution rapide** :

#### Option A : Créer le fichier .env manuellement

1. Créez un fichier `.env` dans le dossier `backend/`
2. Ajoutez cette ligne avec votre mot de passe MySQL :
   ```env
   DB_PASSWORD=votre_mot_de_passe_mysql
   ```

#### Option B : Utiliser le script automatique

```bash
cd backend
./create-env.sh
```

Le script vous demandera votre mot de passe MySQL.

#### Option C : Si vous n'avez pas de mot de passe MySQL

1. Connectez-vous à MySQL :
   ```bash
   mysql -u root
   ```

2. Définissez un mot de passe :
   ```sql
   ALTER USER 'root'@'localhost' IDENTIFIED BY 'votre_nouveau_mot_de_passe';
   FLUSH PRIVILEGES;
   EXIT;
   ```

3. Ajoutez ce mot de passe dans le fichier `.env` :
   ```env
   DB_PASSWORD=votre_nouveau_mot_de_passe
   ```

### 2. Avertissement : "BREVO_API_KEY non configurée"

**Solution** : La clé API Brevo est déjà dans le fichier `.env` créé. Si vous voyez cet avertissement, vérifiez que le fichier `.env` contient :

```env
BREVO_API_KEY=xkeysib-VOTRE_CLE_BREVO_ICI
```

## 📋 Configuration complète étape par étape

### Étape 1 : Créer le fichier .env

```bash
cd backend
./create-env.sh
```

Ou créez-le manuellement en copiant `config.env.example` vers `.env` et modifiez les valeurs.

### Étape 2 : Configurer MySQL

1. **Vérifiez que MySQL est installé** :
   ```bash
   mysql --version
   ```

2. **Démarrez MySQL** (si nécessaire) :
   ```bash
   # macOS avec Homebrew
   brew services start mysql
   
   # Linux
   sudo systemctl start mysql
   ```

3. **Créez la base de données** :
   ```bash
   mysql -u root -p
   ```
   
   Puis dans MySQL :
   ```sql
   CREATE DATABASE IF NOT EXISTS peace_magazine;
   EXIT;
   ```

### Étape 3 : Installer les dépendances

```bash
cd backend
npm install
```

### Étape 4 : Démarrer le serveur

```bash
npm run dev
```

Vous devriez voir :
```
✅ Connexion à la base de données établie avec succès
✅ Service Brevo initialisé avec succès
🚀 Serveur démarré sur http://localhost:3000
```

## 🔍 Vérification

### Vérifier que tout fonctionne

1. **Backend** : http://localhost:3000/health
2. **API** : http://localhost:3000/api
3. **Admin** : http://localhost:3000/admin

## 📝 Fichier .env minimal requis

Pour que le backend démarre, vous devez au minimum avoir :

```env
# Base de données
DB_HOST=localhost
DB_PORT=3306
DB_NAME=peace_magazine
DB_USER=root
DB_PASSWORD=votre_mot_de_passe_ici

# Brevo (déjà configuré)
BREVO_API_KEY=xkeysib-VOTRE_CLE_BREVO_ICI
BREVO_FROM_EMAIL=morak6@icloud.com
BREVO_FROM_NAME=Peace Magazine
```

## 🆘 Problèmes courants

### "Unknown database 'peace_magazine'"
→ Créez la base de données : `CREATE DATABASE peace_magazine;`

### "MySQL n'est pas installé"
→ Installez MySQL : `brew install mysql` (macOS) ou `sudo apt-get install mysql-server` (Linux)

### "Port 3000 already in use"
→ Changez le port dans `.env` : `PORT=3001`

## 📞 Besoin d'aide ?

- 📱 WhatsApp : +225 07 67 66 04 76
- 📧 Email : morak6@icloud.com







