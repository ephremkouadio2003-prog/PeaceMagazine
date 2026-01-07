#!/bin/bash

# Script pour tester la connexion au site

echo "🔍 Test de connexion au site Peace Magazine"
echo "============================================="
echo ""

# Test du frontend
echo "📱 Test du frontend (port 8080)..."
if curl -s -o /dev/null -w "Status: %{http_code}\n" http://localhost:8080 2>/dev/null | grep -q "200"; then
    echo "✅ Frontend accessible sur http://localhost:8080"
else
    echo "❌ Frontend non accessible"
    echo "💡 Vérifiez que le serveur est démarré : ./demarrer-frontend.sh"
fi

echo ""

# Test du backend
echo "🔧 Test du backend (port 3000)..."
if curl -s -o /dev/null -w "Status: %{http_code}\n" http://localhost:3000/health 2>/dev/null | grep -q "200"; then
    echo "✅ Backend accessible sur http://localhost:3000"
else
    echo "⚠️  Backend non accessible (optionnel si Supabase est configuré)"
fi

echo ""
echo "═══════════════════════════════════════════════════════"
echo "🌐 Ouvrez votre navigateur sur :"
echo "   http://localhost:8080"
echo "═══════════════════════════════════════════════════════"






