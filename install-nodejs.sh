#!/bin/bash

# Script d'installation de Node.js pour Peace Magazine
# Ce script installe Homebrew puis Node.js

set -e

echo "🚀 Installation de Node.js pour Peace Magazine"
echo "================================================"
echo ""

# Vérifier si Homebrew est déjà installé
if command -v brew &> /dev/null; then
    echo "✅ Homebrew est déjà installé"
else
    echo "📦 Installation de Homebrew..."
    echo "   (Vous devrez entrer votre mot de passe macOS)"
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    
    # Ajouter Homebrew au PATH si nécessaire
    if [[ -f "/opt/homebrew/bin/brew" ]]; then
        echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
        eval "$(/opt/homebrew/bin/brew shellenv)"
    elif [[ -f "/usr/local/bin/brew" ]]; then
        echo 'eval "$(/usr/local/bin/brew shellenv)"' >> ~/.zprofile
        eval "$(/usr/local/bin/brew shellenv)"
    fi
fi

# Vérifier si Node.js est déjà installé
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "✅ Node.js est déjà installé : $NODE_VERSION"
    
    # Vérifier la version
    NODE_MAJOR=$(echo $NODE_VERSION | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_MAJOR" -lt 18 ]; then
        echo "⚠️  Version de Node.js trop ancienne (< 18). Mise à jour..."
        brew upgrade node
    fi
else
    echo "📦 Installation de Node.js..."
    brew install node
fi

# Vérifier l'installation
echo ""
echo "🔍 Vérification de l'installation..."
echo "================================================"

if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "✅ Node.js : $NODE_VERSION"
else
    echo "❌ Erreur : Node.js n'est pas installé"
    exit 1
fi

if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo "✅ npm : $NPM_VERSION"
else
    echo "❌ Erreur : npm n'est pas installé"
    exit 1
fi

echo ""
echo "🎉 Installation terminée avec succès !"
echo ""
echo "Prochaines étapes :"
echo "1. Pour le backend : cd backend && npm install && npm run dev"
echo "2. Pour le frontend : npm start (ou python3 -m http.server 8080)"
echo ""












