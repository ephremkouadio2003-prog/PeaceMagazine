# 🚀 Guide d'installation rapide - Peace Magazine

## Étape 1 : Installer Node.js

**Ouvrez votre Terminal et exécutez ces commandes :**

### Option A : Via Homebrew (Recommandé)

```bash
# Installer Homebrew (vous demandera votre mot de passe)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Installer Node.js
brew install node

# Vérifier l'installation
node --version
npm --version
```

### Option B : Via nvm (Node Version Manager - sans sudo)

```bash
# Installer nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Recharger votre terminal ou exécuter :
source ~/.zshrc

# Installer Node.js LTS
nvm install --lts
nvm use --lts

# Vérifier l'installation
node --version
npm --version
```

### Option C : Téléchargement direct

1. Visitez https://nodejs.org/
2. Téléchargez la version LTS pour macOS
3. Installez le fichier .pkg
4. Redémarrez votre terminal

---

## Étape 2 : Configurer le projet

Une fois Node.js installé, **dans le Terminal**, exécutez :

```bash
# Aller dans le dossier du projet
cd "/Users/ephremkouadio/Peace magazine"

# Installer les dépendances du backend
cd backend
npm install

# Revenir au dossier racine
cd ..
```

---

## Étape 3 : Démarrer le projet

### Démarrer le backend :
```bash
cd "/Users/ephremkouadio/Peace magazine/backend"
npm run dev
```

### Démarrer le frontend (dans un autre terminal) :
```bash
cd "/Users/ephremkouadio/Peace magazine"
npm start
# ou
python3 -m http.server 8080
```

---

## ✅ Vérification

Si tout fonctionne, vous devriez voir :
- Node.js version >= 18.0.0
- npm version >= 8.0.0
- Le backend démarre sur un port (généralement 3000 ou 5000)
- Le frontend est accessible sur http://localhost:8080

---

## 🆘 Problèmes courants

### "command not found: node"
→ Node.js n'est pas installé ou pas dans le PATH. Réinstallez Node.js.

### "Permission denied"
→ Utilisez l'option B (nvm) qui ne nécessite pas de permissions sudo.

### "EACCES: permission denied" lors de npm install
→ Exécutez : `sudo chown -R $(whoami) ~/.npm`

---

**Besoin d'aide ?** Consultez `INSTALLATION-NODEJS.md` pour plus de détails.







