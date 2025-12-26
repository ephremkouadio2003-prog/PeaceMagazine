# 🚀 Comment démarrer les serveurs

## 🎯 Démarrage rapide

### Option 1 : Démarrer tout (Frontend + Backend)

```bash
cd "/Users/ephremkouadio/Peace magazine"
./demarrer-tout.sh
```

Ce script démarre :
- ✅ Frontend sur **http://localhost:8080**
- ✅ Backend sur **http://localhost:3000**

### Option 2 : Démarrer séparément

#### Frontend uniquement

```bash
cd "/Users/ephremkouadio/Peace magazine"
./demarrer-frontend.sh
```

Ou directement :
```bash
cd "/Users/ephremkouadio/Peace magazine"
python3 -m http.server 8080
```

#### Backend uniquement

```bash
cd "/Users/ephremkouadio/Peace magazine/backend"
./demarrer-backend.sh
```

Ou directement :
```bash
cd "/Users/ephremkouadio/Peace magazine/backend"
npm start
```

## 🌐 URLs des serveurs

### Frontend
- **URL principale** : http://localhost:8080
- **Fichier** : `index.html`

### Backend
- **API** : http://localhost:3000/api
- **Health check** : http://localhost:3000/health
- **Admin** : http://localhost:3000/admin

## ⚠️ Prérequis

### Pour le Frontend
- ✅ Python 3 (généralement déjà installé sur macOS)

### Pour le Backend
- ✅ Node.js (voir `DEMARRER-LE-BACKEND.md` pour l'installation)
- ✅ Fichier `.env` dans `backend/` (optionnel mais recommandé)

## 🔍 Vérification

### Vérifier que les serveurs sont démarrés

```bash
# Frontend (port 8080)
lsof -ti:8080 && echo "✅ Frontend actif" || echo "❌ Frontend non actif"

# Backend (port 3000)
lsof -ti:3000 && echo "✅ Backend actif" || echo "❌ Backend non actif"
```

### Tester les serveurs

```bash
# Tester le frontend
curl http://localhost:8080

# Tester le backend
curl http://localhost:3000/health
```

## 🛑 Arrêter les serveurs

### Arrêter tout

```bash
# Tuer le frontend
lsof -ti:8080 | xargs kill -9

# Tuer le backend
lsof -ti:3000 | xargs kill -9
```

### Ou utiliser pkill

```bash
# Frontend
pkill -f "http.server 8080"

# Backend
pkill -f "node.*server.dev.js"
```

## 📋 Checklist

Avant de démarrer :

- [ ] Python 3 installé (`python3 --version`)
- [ ] Node.js installé (`node --version`) - pour le backend uniquement
- [ ] Fichier `.env` créé dans `backend/` (optionnel)
- [ ] Dépendances backend installées (`cd backend && npm install`)

## 🔧 Problèmes courants

### "Port already in use"

Le port est déjà utilisé par un autre processus.

**Solution :**
```bash
# Tuer le processus sur le port 8080
lsof -ti:8080 | xargs kill -9

# Tuer le processus sur le port 3000
lsof -ti:3000 | xargs kill -9
```

### "Command not found: node"

Node.js n'est pas installé.

**Solution :**
Consultez `DEMARRER-LE-BACKEND.md` pour installer Node.js.

### "Command not found: python3"

Python 3 n'est pas installé.

**Solution :**
```bash
# Vérifier si Python est installé
python3 --version

# Si non installé, installer via Homebrew
brew install python3
```

## 📞 Besoin d'aide ?

- 📱 WhatsApp : +225 07 67 66 04 76
- 📧 Email : morak6@icloud.com



