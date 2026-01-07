#!/bin/bash

# Script pour démarrer le frontend ET le backend

echo "🚀 Démarrage complet de Peace Magazine"
echo "========================================"
echo ""

# Aller dans le dossier du projet
cd "$(dirname "$0")"

# Couleurs pour les messages
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonction pour tuer un processus sur un port
kill_port() {
    local port=$1
    local pid=$(lsof -ti:$port)
    if [ ! -z "$pid" ]; then
        echo "🔄 Arrêt du processus sur le port $port..."
        kill -9 $pid 2>/dev/null
        sleep 1
    fi
}

# Tuer les anciens processus
kill_port 8080
kill_port 3000

echo ""
echo "═══════════════════════════════════════════════════════"
echo "🌐 DÉMARRAGE DU FRONTEND"
echo "═══════════════════════════════════════════════════════"
echo ""

# Vérifier Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 n'est pas installé"
    echo "💡 Installez Python3 pour continuer"
    exit 1
fi

# Démarrer le frontend en arrière-plan
echo "🌟 Démarrage du serveur frontend sur http://localhost:8080"
python3 -m http.server 8080 > /dev/null 2>&1 &
FRONTEND_PID=$!

sleep 2

# Vérifier que le frontend est démarré
if lsof -ti:8080 > /dev/null; then
    echo -e "${GREEN}✅ Frontend démarré (PID: $FRONTEND_PID)${NC}"
else
    echo -e "${YELLOW}⚠️  Frontend n'a pas démarré correctement${NC}"
fi

echo ""
echo "═══════════════════════════════════════════════════════"
echo "🔧 DÉMARRAGE DU BACKEND"
echo "═══════════════════════════════════════════════════════"
echo ""

# Vérifier Node.js
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}⚠️  Node.js n'est pas installé${NC}"
    echo "💡 Le backend ne peut pas démarrer sans Node.js"
    echo "💡 Le frontend fonctionnera mais certaines fonctionnalités nécessitent le backend"
    echo ""
else
    # Aller dans le dossier backend
    cd backend
    
    # Vérifier que package.json existe
    if [ ! -f "package.json" ]; then
        echo "❌ package.json non trouvé dans backend/"
        cd ..
    else
        # Vérifier que node_modules existe
        if [ ! -d "node_modules" ]; then
            echo "📦 Installation des dépendances..."
            npm install
        fi
        
        # Démarrer le backend
        echo "🌟 Démarrage du serveur backend sur http://localhost:3000"
        npm start > /tmp/peace-backend.log 2>&1 &
        BACKEND_PID=$!
        
        sleep 3
        
        # Vérifier que le backend est démarré
        if lsof -ti:3000 > /dev/null; then
            echo -e "${GREEN}✅ Backend démarré (PID: $BACKEND_PID)${NC}"
        else
            echo -e "${YELLOW}⚠️  Backend n'a pas démarré correctement${NC}"
            echo "💡 Vérifiez les logs : tail -f /tmp/peace-backend.log"
        fi
        
        cd ..
    fi
fi

echo ""
echo "═══════════════════════════════════════════════════════"
echo "🌐 VOS SITES SONT ACCESSIBLES SUR :"
echo "═══════════════════════════════════════════════════════"
echo ""
echo -e "   ${BLUE}📱 Frontend: http://localhost:8080${NC}"
if lsof -ti:3000 > /dev/null; then
    echo -e "   ${BLUE}🔧 Backend:  http://localhost:3000${NC}"
    echo -e "   ${BLUE}❤️  Health:   http://localhost:3000/health${NC}"
fi
echo ""
echo "═══════════════════════════════════════════════════════"
echo ""
echo "💡 Pour arrêter les serveurs :"
echo "   kill $FRONTEND_PID"
if [ ! -z "$BACKEND_PID" ]; then
    echo "   kill $BACKEND_PID"
fi
echo ""
echo "💡 Ou utilisez : pkill -f 'http.server 8080' et pkill -f 'node.*server.dev.js'"
echo ""

# Garder le script actif pour voir les logs
echo "Appuyez sur Ctrl+C pour arrêter les serveurs"
echo ""

# Attendre
wait








