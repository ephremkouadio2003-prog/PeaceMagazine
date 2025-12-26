#!/bin/bash

# Script d'installation avec mot de passe
# ATTENTION: Ce script contient votre mot de passe - ne le partagez JAMAIS !

set -e

PASSWORD="Juillet2003@"

echo "🚀 Installation de Node.js pour Peace Magazine"
echo "================================================"
echo ""

# Vérifier si Homebrew est installé
if ! command -v brew &> /dev/null; then
    echo "📦 Installation de Homebrew..."
    echo "$PASSWORD" | /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)" || {
        echo ""
        echo "⚠️  L'installation automatique a échoué."
        echo "   Veuillez exécuter manuellement :"
        echo "   /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
        echo "   Et entrez votre mot de passe quand demandé."
        exit 1
    }
    
    # Ajouter Homebrew au PATH
    if [[ -f "/opt/homebrew/bin/brew" ]]; then
        echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
        eval "$(/opt/homebrew/bin/brew shellenv)"
    elif [[ -f "/usr/local/bin/brew" ]]; then
        echo 'eval "$(/usr/local/bin/brew shellenv)"' >> ~/.zprofile
        eval "$(/usr/local/bin/brew shellenv)"
    fi
else
    echo "✅ Homebrew est déjà installé"
fi

# Installer Node.js
if ! command -v node &> /dev/null; then
    echo "📦 Installation de Node.js..."
    brew install node
else
    NODE_VERSION=$(node --version)
    echo "✅ Node.js est déjà installé : $NODE_VERSION"
    
    # Vérifier la version
    NODE_MAJOR=$(echo $NODE_VERSION | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_MAJOR" -lt 18 ]; then
        echo "⚠️  Version trop ancienne. Mise à jour..."
        brew upgrade node
    fi
fi

# Vérifier l'installation
echo ""
echo "🔍 Vérification..."
echo "================================================"

if command -v node &> /dev/null; then
    echo "✅ Node.js : $(node --version)"
    echo "✅ npm : $(npm --version)"
    echo ""
    echo "🎉 Installation réussie !"
else
    echo "❌ Erreur lors de l'installation"
    exit 1
fi

echo ""
echo "📦 Installation des dépendances du backend..."
cd "$(dirname "$0")/backend"
npm install

echo ""
echo "✅ Tout est prêt !"
echo ""
echo "Pour démarrer le backend :"
echo "  cd backend && npm run dev"
echo ""







