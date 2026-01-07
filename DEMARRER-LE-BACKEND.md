# 🚀 Comment démarrer le backend - Guide complet

## ❌ Problème actuel

Le backend n'est pas démarré, donc le site ne peut pas créer de commandes.

## ✅ Solution : Installer Node.js puis démarrer le backend

### ÉTAPE 1 : Installer Node.js (5 minutes)

#### Option A : Via le site web (LE PLUS SIMPLE) ⭐

1. **Ouvrez votre navigateur** et allez sur : **https://nodejs.org/**
2. **Cliquez sur le bouton vert "LTS"** (Long Term Support)
3. **Téléchargez** le fichier `.pkg` pour macOS
4. **Double-cliquez** sur le fichier téléchargé dans votre dossier Téléchargements
5. **Suivez l'assistant** d'installation (cliquez sur "Continuer" plusieurs fois)
6. **Redémarrez votre Terminal** (fermez-le et rouvrez-le)

#### Option B : Via Homebrew (Terminal)

Ouvrez votre Terminal et exécutez :

```bash
# Installer Homebrew (vous demandera votre mot de passe : Juillet2003@)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Configurer Homebrew
eval "$(/opt/homebrew/bin/brew shellenv)"
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile

# Installer Node.js
brew install node
```

---

### ÉTAPE 2 : Vérifier l'installation

Dans votre Terminal, exécutez :

```bash
node --version
npm --version
```

Vous devriez voir des numéros de version (ex: `v20.x.x` et `10.x.x`)

Si vous voyez "command not found", Node.js n'est pas installé. Réessayez l'étape 1.

---

### ÉTAPE 3 : Configurer la base de données MySQL

#### 3.1 Créer le fichier .env

```bash
cd "/Users/ephremkouadio/Peace magazine/backend"
./create-env.sh
```

Le script vous demandera votre mot de passe MySQL.

**OU créez-le manuellement** :

1. Créez un fichier `.env` dans le dossier `backend/`
2. Ajoutez ce contenu (remplacez `votre_mot_de_passe` par votre mot de passe MySQL) :

```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=peace_magazine
DB_USER=root
DB_PASSWORD=votre_mot_de_passe

BREVO_API_KEY=xkeysib-VOTRE_CLE_BREVO_ICI
BREVO_FROM_EMAIL=morak6@icloud.com
BREVO_FROM_NAME=Peace Magazine
```

#### 3.2 Créer la base de données MySQL

```bash
mysql -u root -p
```

Puis dans MySQL :
```sql
CREATE DATABASE IF NOT EXISTS peace_magazine;
EXIT;
```

---

### ÉTAPE 4 : Installer les dépendances du backend

```bash
cd "/Users/ephremkouadio/Peace magazine/backend"
npm install
```

Cette étape peut prendre quelques minutes.

---

### ÉTAPE 5 : Démarrer le backend

```bash
npm run dev
```

Vous devriez voir :
```
✅ Connexion à la base de données établie avec succès
✅ Service Brevo initialisé avec succès
🚀 Serveur démarré sur http://localhost:3000
```

---

## ✅ Vérification

Une fois le backend démarré :

1. **Ouvrez votre navigateur** et allez sur : **http://localhost:3000/health**
2. Vous devriez voir une réponse JSON avec le statut du serveur
3. **Retournez sur votre site** : **http://localhost:8080**
4. **Essayez de créer une commande** - cela devrait fonctionner maintenant !

---

## 🆘 Problèmes courants

### "command not found: npm"
→ Node.js n'est pas installé. Retournez à l'ÉTAPE 1.

### "Access denied for user 'root'@'localhost'"
→ Le fichier `.env` n'existe pas ou le mot de passe MySQL est incorrect. Vérifiez l'ÉTAPE 3.

### "Unknown database 'peace_magazine'"
→ Créez la base de données : `CREATE DATABASE peace_magazine;`

### "Port 3000 already in use"
→ Un autre processus utilise le port. Arrêtez-le ou changez le port dans `.env`.

---

## 📞 Besoin d'aide ?

- 📱 WhatsApp : +225 07 67 66 04 76
- 📧 Email : morak6@icloud.com

---

## 📋 Résumé rapide

1. ✅ Installer Node.js (https://nodejs.org/)
2. ✅ Créer le fichier `.env` avec votre mot de passe MySQL
3. ✅ Créer la base de données `peace_magazine`
4. ✅ `npm install` dans le dossier backend
5. ✅ `npm run dev` pour démarrer

Une fois ces étapes terminées, votre backend sera accessible et les commandes fonctionneront ! 🎉









