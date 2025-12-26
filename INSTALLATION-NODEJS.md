# Guide d'installation de Node.js pour Peace Magazine

## Problème
Node.js et npm ne sont pas installés sur votre système macOS.

## Solution 1 : Installation via Homebrew (Recommandé)

### Étape 1 : Installer Homebrew
Ouvrez le Terminal et exécutez :
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

Suivez les instructions à l'écran. Vous devrez peut-être entrer votre mot de passe.

### Étape 2 : Installer Node.js
Une fois Homebrew installé, exécutez :
```bash
brew install node
```

### Étape 3 : Vérifier l'installation
```bash
node --version
npm --version
```

Vous devriez voir des numéros de version (Node.js >= 18.0.0 est requis).

## Solution 2 : Installation directe depuis le site officiel

1. Visitez https://nodejs.org/
2. Téléchargez la version LTS (Long Term Support) pour macOS
3. Exécutez le fichier .pkg téléchargé
4. Suivez l'assistant d'installation
5. Redémarrez votre terminal

## Après l'installation

### Pour le frontend (optionnel - utilise Python par défaut)
```bash
cd "/Users/ephremkouadio/Peace magazine"
npm start
# ou simplement
python3 -m http.server 8080
```

### Pour le backend (nécessite Node.js)
```bash
cd "/Users/ephremkouadio/Peace magazine/backend"
npm install
npm run dev
```

## Vérification rapide

Après l'installation, testez avec :
```bash
node --version
npm --version
```

Si ces commandes retournent des numéros de version, Node.js est correctement installé !








