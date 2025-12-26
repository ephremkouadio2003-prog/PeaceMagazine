#!/bin/bash

# Script simple pour démarrer le site Peace Magazine

echo "🚀 Démarrage du site Peace Magazine"
echo ""

# Aller dans le dossier du projet
cd "$(dirname "$0")"

# Tuer les anciens processus sur le port 8080
echo "🔄 Arrêt des anciens serveurs..."
lsof -ti:8080 | xargs kill -9 2>/dev/null
sleep 1

# Démarrer le serveur
echo "🌟 Démarrage du serveur..."
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



