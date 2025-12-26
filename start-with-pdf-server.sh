#!/bin/bash

# Script pour démarrer le site avec le serveur PDF
# Ce script démarre le serveur PDF Python et le serveur HTTP pour le site

echo "🚀 Démarrage de Peace Magazine avec serveur PDF..."
echo ""

# Vérifier si Python est installé
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 n'est pas installé. Veuillez l'installer d'abord."
    exit 1
fi

# Rendre le script serveur PDF exécutable
chmod +x serve-pdfs.py

# Démarrer le serveur PDF en arrière-plan
echo "📄 Démarrage du serveur PDF sur le port 8080..."
python3 serve-pdfs.py &
PDF_SERVER_PID=$!

# Attendre un peu que le serveur démarre
sleep 2

# Vérifier que le serveur PDF fonctionne
if curl -s http://localhost:8080 > /dev/null 2>&1; then
    echo "✅ Serveur PDF démarré avec succès"
    echo "📄 Les PDFs sont accessibles sur http://localhost:8080/assets/PDF/"
else
    echo "⚠️  Le serveur PDF pourrait ne pas être démarré correctement"
fi

# Démarrer le serveur HTTP pour le site
echo ""
echo "🌐 Démarrage du serveur HTTP pour le site..."
echo "📍 Le site sera accessible sur http://localhost:8000"
echo ""
echo "⚠️  IMPORTANT : Gardez ce terminal ouvert"
echo "   Pour arrêter les serveurs, appuyez sur Ctrl+C"
echo ""

# Fonction pour nettoyer les processus à l'arrêt
cleanup() {
    echo ""
    echo "🛑 Arrêt des serveurs..."
    kill $PDF_SERVER_PID 2>/dev/null
    exit 0
}

trap cleanup INT TERM

# Démarrer le serveur HTTP Python
python3 -m http.server 8000

