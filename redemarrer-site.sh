#!/bin/bash

# Script pour redémarrer proprement le site

echo "🔄 Redémarrage du site Peace Magazine"
echo "======================================"
echo ""

# Aller dans le dossier du projet
cd "$(dirname "$0")"

# Tuer tous les processus sur le port 8080
echo "🛑 Arrêt des anciens serveurs..."
PIDS=$(lsof -ti:8080 2>/dev/null)
if [ ! -z "$PIDS" ]; then
    echo "   Arrêt du processus PID: $PIDS"
    kill -9 $PIDS 2>/dev/null
    sleep 2
    echo "✅ Anciens serveurs arrêtés"
else
    echo "✅ Aucun serveur actif sur le port 8080"
fi

# Vérifier Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 n'est pas installé"
    echo "💡 Installez Python3 pour continuer"
    exit 1
fi

echo ""
echo "🚀 Démarrage du serveur..."
echo ""

# Démarrer le serveur
python3 -m http.server 8080 &
SERVER_PID=$!

# Attendre un peu pour que le serveur démarre
sleep 2

# Vérifier que le serveur est bien démarré
if lsof -ti:8080 > /dev/null; then
    echo "✅ Serveur démarré avec succès (PID: $SERVER_PID)"
    echo ""
    echo "═══════════════════════════════════════════════════════"
    echo "🌐 VOTRE SITE EST ACCESSIBLE SUR :"
    echo "═══════════════════════════════════════════════════════"
    echo ""
    echo "   📱 http://localhost:8080"
    echo ""
    echo "═══════════════════════════════════════════════════════"
    echo ""
    echo "💡 Ouvrez cette URL dans votre navigateur"
    echo "💡 Appuyez sur Ctrl+C pour arrêter le serveur"
    echo ""
    
    # Garder le script actif
    wait $SERVER_PID
else
    echo "❌ Le serveur n'a pas pu démarrer"
    echo "💡 Vérifiez les erreurs ci-dessus"
    exit 1
fi






