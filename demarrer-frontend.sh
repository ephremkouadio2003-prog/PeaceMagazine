#!/bin/bash

# Script pour démarrer uniquement le frontend

echo "🚀 Démarrage du frontend Peace Magazine"
echo "========================================"
echo ""

# Aller dans le dossier du projet
cd "$(dirname "$0")"

# Tuer les anciens processus sur le port 8080
echo "🔄 Arrêt des anciens serveurs..."
lsof -ti:8080 | xargs kill -9 2>/dev/null
sleep 1

# Vérifier Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 n'est pas installé"
    echo "💡 Installez Python3 pour continuer"
    exit 1
fi

# Démarrer le serveur
echo "🌟 Démarrage du serveur sur http://localhost:8080"
echo ""
echo "═══════════════════════════════════════════════════════"
echo "🌐 VOTRE SITE EST ACCESSIBLE SUR :"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "   📱 http://localhost:8080"
echo ""
echo "═══════════════════════════════════════════════════════"
echo ""
echo "Appuyez sur Ctrl+C pour arrêter le serveur"
echo ""

# Démarrer le serveur Python
python3 -m http.server 8080








