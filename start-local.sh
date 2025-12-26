#!/bin/bash

echo "🚀 Démarrage de Peace Magazine en mode local..."

# Vérifier si Python est installé
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 n'est pas installé. Veuillez installer Python 3.6+"
    exit 1
fi

# Aller dans le dossier du projet
cd "$(dirname "$0")"

# Démarrer le serveur local
echo "🌟 Démarrage du serveur local sur http://localhost:8080"
echo "📱 Site accessible à : http://localhost:8080"
echo "🔧 Backend API (optionnel) : http://localhost:3000"
echo ""
echo "Appuyez sur Ctrl+C pour arrêter le serveur"
echo ""

# Démarrer le serveur HTTP simple
python3 -m http.server 8080
