#!/bin/bash

# Script complet pour démarrer le backend Peace Magazine
# Vérifie toutes les dépendances et démarre le serveur

echo "🚀 Démarrage du backend Peace Magazine"
echo "======================================"
echo ""

# Vérifier Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js n'est pas installé !"
    echo ""
    echo "📥 Pour installer Node.js :"
    echo "   1. Allez sur https://nodejs.org/"
    echo "   2. Téléchargez la version LTS"
    echo "   3. Installez le fichier .pkg"
    echo "   4. Redémarrez votre Terminal"
    echo ""
    echo "   OU via Homebrew :"
    echo "   brew install node"
    echo ""
    exit 1
fi

NODE_VERSION=$(node --version)
NPM_VERSION=$(npm --version)
echo "✅ Node.js : $NODE_VERSION"
echo "✅ npm : $NPM_VERSION"
echo ""

# Vérifier npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm n'est pas installé !"
    exit 1
fi

# Aller dans le dossier backend
cd "$(dirname "$0")"

# Vérifier que le fichier .env existe
if [ ! -f ".env" ]; then
    echo "⚠️  Le fichier .env n'existe pas !"
    echo ""
    echo "📝 Création du fichier .env..."
    
    if [ -f "create-env.sh" ]; then
        echo "   Exécution du script create-env.sh..."
        ./create-env.sh
    else
        echo "   Veuillez créer le fichier .env manuellement."
        echo "   Consultez RESOLUTION-ERREUR-MYSQL.md pour plus d'infos."
        exit 1
    fi
fi

# Vérifier que les dépendances sont installées
if [ ! -d "node_modules" ]; then
    echo "📦 Installation des dépendances..."
    npm install
    echo ""
fi

# Vérifier MySQL (optionnel - juste un avertissement)
if command -v mysql &> /dev/null; then
    echo "✅ MySQL est installé"
else
    echo "⚠️  MySQL n'est pas installé ou pas dans le PATH"
    echo "   Le backend peut ne pas fonctionner sans MySQL"
fi

echo ""
echo "🚀 Démarrage du serveur backend..."
echo "======================================"
echo ""
echo "Le serveur sera accessible sur : http://localhost:3000"
echo "Appuyez sur Ctrl+C pour arrêter le serveur"
echo ""

# Démarrer le serveur
npm run dev









