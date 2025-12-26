#!/bin/bash

# Script pour démarrer uniquement le backend

echo "🚀 Démarrage du backend Peace Magazine"
echo "======================================"
echo ""

# Aller dans le dossier backend
cd "$(dirname "$0")/backend"

# Vérifier Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js n'est pas installé"
    echo "💡 Installez Node.js pour continuer"
    echo "💡 Consultez INSTALLATION-NODEJS.md ou DEMARRER-LE-BACKEND.md"
    exit 1
fi

# Tuer les anciens processus sur le port 3000
echo "🔄 Arrêt des anciens serveurs..."
lsof -ti:3000 | xargs kill -9 2>/dev/null
sleep 1

# Vérifier que package.json existe
if [ ! -f "package.json" ]; then
    echo "❌ package.json non trouvé"
    exit 1
fi

# Vérifier que node_modules existe
if [ ! -d "node_modules" ]; then
    echo "📦 Installation des dépendances..."
    npm install
fi

# Vérifier que .env existe
if [ ! -f ".env" ]; then
    echo "⚠️  Fichier .env non trouvé"
    echo "💡 Créez un fichier .env basé sur config.env.example"
    echo "💡 Le serveur peut démarrer mais certaines fonctionnalités ne fonctionneront pas"
    echo ""
fi

# Démarrer le serveur
echo "🌟 Démarrage du serveur backend sur http://localhost:3000"
echo ""
echo "═══════════════════════════════════════════════════════"
echo "🔧 VOTRE BACKEND EST ACCESSIBLE SUR :"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "   🔧 API:     http://localhost:3000/api"
echo "   ❤️  Health:  http://localhost:3000/health"
echo "   🎛️  Admin:   http://localhost:3000/admin"
echo ""
echo "═══════════════════════════════════════════════════════"
echo ""
echo "Appuyez sur Ctrl+C pour arrêter le serveur"
echo ""

# Démarrer le serveur Node.js
npm start



