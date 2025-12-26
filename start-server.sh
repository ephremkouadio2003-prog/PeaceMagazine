#!/bin/bash

echo "🚀 Démarrage du serveur Peace Magazine..."
echo ""
echo "📁 Dossier: $(pwd)"
echo ""

# Tuer les anciens serveurs
lsof -ti:8080 | xargs kill -9 2>/dev/null
lsof -ti:3001 | xargs kill -9 2>/dev/null
sleep 1

# Démarrer le serveur
echo "🌟 Serveur démarré sur le port 8080"
echo ""
echo "═══════════════════════════════════════════════════════"
echo "🌐 LIENS POUR ACCÉDER AU SITE :"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "   📱 Site principal :"
echo "   http://localhost:8080"
echo ""
echo "   🧪 Page de test :"
echo "   http://localhost:8080/test.html"
echo ""
echo "═══════════════════════════════════════════════════════"
echo ""
echo "Appuyez sur Ctrl+C pour arrêter le serveur"
echo ""

cd "$(dirname "$0")"
python3 -m http.server 8080






