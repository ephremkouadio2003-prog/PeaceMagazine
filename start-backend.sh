#!/bin/bash

echo "🚀 Démarrage du backend Peace Magazine..."

# Vérifier si Node.js est installé
if ! command -v node &> /dev/null; then
    echo "❌ Node.js n'est pas installé. Veuillez installer Node.js 18+"
    exit 1
fi

# Vérifier si npm est installé
if ! command -v npm &> /dev/null; then
    echo "❌ npm n'est pas installé. Veuillez installer npm"
    exit 1
fi

# Aller dans le dossier backend
cd backend

# Vérifier si package.json existe
if [ ! -f "package.json" ]; then
    echo "❌ package.json non trouvé dans le dossier backend"
    exit 1
fi

# Installer les dépendances si node_modules n'existe pas
if [ ! -d "node_modules" ]; then
    echo "📦 Installation des dépendances..."
    npm install
fi

# Créer le fichier .env s'il n'existe pas
if [ ! -f ".env" ]; then
    echo "⚙️ Création du fichier .env..."
    cp config.env.example .env
    echo "📝 Veuillez configurer le fichier .env avec vos paramètres"
fi

# Démarrer le serveur
echo "🌟 Démarrage du serveur sur http://localhost:3000"
echo "📊 Panneau admin: http://localhost:3000/admin"
echo "❤️ Santé du serveur: http://localhost:3000/health"
echo ""
echo "Appuyez sur Ctrl+C pour arrêter le serveur"

npm start











