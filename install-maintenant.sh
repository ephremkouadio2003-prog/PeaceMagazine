#!/bin/bash

# Script simple à exécuter dans VOTRE terminal
# Copiez-collez ce script dans votre Terminal

echo "🚀 Installation de Node.js"
echo "=========================="
echo ""

# Installation de Homebrew
echo "📦 Étape 1/3 : Installation de Homebrew..."
echo "   (Vous devrez entrer votre mot de passe : Juillet2003@)"
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Ajouter Homebrew au PATH
if [[ -f "/opt/homebrew/bin/brew" ]]; then
    eval "$(/opt/homebrew/bin/brew shellenv)"
    echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
elif [[ -f "/usr/local/bin/brew" ]]; then
    eval "$(/usr/local/bin/brew shellenv)"
    echo 'eval "$(/usr/local/bin/brew shellenv)"' >> ~/.zprofile
fi

# Installation de Node.js
echo ""
echo "📦 Étape 2/3 : Installation de Node.js..."
brew install node

# Vérification
echo ""
echo "🔍 Étape 3/3 : Vérification..."
node --version
npm --version

# Installation des dépendances
echo ""
echo "📦 Installation des dépendances du backend..."
cd "$(dirname "$0")/backend"
npm install

echo ""
echo "✅ Installation terminée !"
echo ""
echo "Pour démarrer : cd backend && npm run dev"







