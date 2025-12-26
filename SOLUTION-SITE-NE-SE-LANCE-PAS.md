# 🔧 Le site ne se lance pas - Solutions

## 🎯 Solution rapide

### Étape 1 : Redémarrer le serveur

Ouvrez un terminal et exécutez :

```bash
cd "/Users/ephremkouadio/Peace magazine"
./redemarrer-site.sh
```

Ce script va :
1. ✅ Arrêter tous les anciens serveurs
2. ✅ Démarrer un nouveau serveur proprement
3. ✅ Vous donner l'URL à ouvrir

### Étape 2 : Ouvrir le site

Une fois le serveur démarré, ouvrez votre navigateur et allez sur :

**http://localhost:8080**

## 🔍 Diagnostic étape par étape

### 1. Vérifier que le serveur est actif

```bash
# Vérifier si un processus écoute sur le port 8080
lsof -ti:8080 && echo "✅ Serveur actif" || echo "❌ Serveur non actif"
```

### 2. Si le serveur n'est pas actif

```bash
cd "/Users/ephremkouadio/Peace magazine"
python3 -m http.server 8080
```

### 3. Si le port est occupé par un autre processus

```bash
# Voir quel processus utilise le port
lsof -i:8080

# Tuer le processus
lsof -ti:8080 | xargs kill -9

# Redémarrer
cd "/Users/ephremkouadio/Peace magazine"
python3 -m http.server 8080
```

### 4. Si vous voyez "Cannot GET /"

Cela signifie que le serveur Python ne trouve pas `index.html`.

**Solution :**
```bash
# Vérifier que vous êtes dans le bon dossier
cd "/Users/ephremkouadio/Peace magazine"
ls index.html  # Doit afficher "index.html"

# Si le fichier existe, redémarrer le serveur
python3 -m http.server 8080
```

### 5. Si la page est blanche

1. Ouvrez la console du navigateur (F12)
2. Allez dans l'onglet **Console**
3. Notez les erreurs en rouge
4. Allez dans l'onglet **Network**
5. Rechargez la page (F5)
6. Vérifiez que les fichiers chargent (statut 200)

## 📋 Checklist de diagnostic

- [ ] Python3 est installé (`python3 --version`)
- [ ] Je suis dans le bon dossier (`/Users/ephremkouadio/Peace magazine`)
- [ ] Le fichier `index.html` existe
- [ ] Le port 8080 est libre ou j'ai tué l'ancien processus
- [ ] Le serveur Python est démarré
- [ ] J'ai ouvert http://localhost:8080 dans mon navigateur
- [ ] J'ai vérifié la console du navigateur (F12) pour les erreurs

## 🛠️ Scripts disponibles

### Redémarrer le site
```bash
./redemarrer-site.sh
```

### Démarrer uniquement le frontend
```bash
./demarrer-frontend.sh
```

### Démarrer frontend + backend
```bash
./demarrer-tout.sh
```

### Tester la connexion
```bash
./test-connexion.sh
```

## 🐛 Problèmes courants

### "Port already in use"

Le port 8080 est déjà utilisé.

**Solution :**
```bash
lsof -ti:8080 | xargs kill -9
./redemarrer-site.sh
```

### "Cannot GET /"

Le serveur ne trouve pas `index.html`.

**Solution :**
```bash
cd "/Users/ephremkouadio/Peace magazine"
ls index.html  # Vérifier que le fichier existe
python3 -m http.server 8080
```

### Page blanche

Le serveur fonctionne mais la page ne s'affiche pas.

**Solution :**
1. Ouvrez la console (F12)
2. Vérifiez les erreurs JavaScript
3. Vérifiez l'onglet Network pour les fichiers manquants

### "Connection refused"

Le serveur n'est pas démarré.

**Solution :**
```bash
./redemarrer-site.sh
```

## 🆘 Si rien ne fonctionne

1. **Arrêter tous les processus :**
   ```bash
   lsof -ti:8080 | xargs kill -9
   lsof -ti:3000 | xargs kill -9
   ```

2. **Redémarrer proprement :**
   ```bash
   cd "/Users/ephremkouadio/Peace magazine"
   ./redemarrer-site.sh
   ```

3. **Ouvrir le navigateur :**
   - Allez sur http://localhost:8080
   - Ouvrez la console (F12)
   - Notez toutes les erreurs

4. **Contactez le support :**
   - 📱 WhatsApp : +225 07 67 66 04 76
   - 📧 Email : morak6@icloud.com
   - 📋 Incluez les messages d'erreur de la console

