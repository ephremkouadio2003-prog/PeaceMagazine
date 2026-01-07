#!/bin/bash

# Script de configuration du projet Peace Magazine après installation de Node.js

set -e

echo "🔧 Configuration du projet Peace Magazine"
echo "=========================================="
echo ""

# Vérifier que Node.js est installé
if ! command -v node &> /dev/null; then
    echo "❌ Erreur : Node.js n'est pas installé"
    echo "   Veuillez d'abord exécuter : ./install-nodejs.sh"
    exit 1
fi

NODE_VERSION=$(node --version)
NPM_VERSION=$(npm --version)
echo "✅ Node.js : $NODE_VERSION"
echo "✅ npm : $NPM_VERSION"
echo ""

# Installer les dépendances du backend
echo "📦 Installation des dépendances du backend..."
cd backend
npm install
echo "✅ Dépendances du backend installées"
echo ""

# Revenir au répertoire racine
cd ..

echo "🎉 Configuration terminée !"
echo ""
echo "Commandes utiles :"
echo "  - Démarrer le backend : cd backend && npm run dev"
echo "  - Démarrer le frontend : npm start (ou python3 -m http.server 8080)"
echo ""












