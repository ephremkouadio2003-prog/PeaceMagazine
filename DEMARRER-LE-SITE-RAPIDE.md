# 🚀 Démarrer le site - Guide rapide

## ✅ État actuel

- ✅ **Frontend** : Actif sur http://localhost:8080
- ❌ **Backend** : Non actif (optionnel si Supabase est configuré)

## 🌐 Accéder au site

Le site devrait être accessible sur :

**http://localhost:8080**

Ouvrez cette URL dans votre navigateur.

## 🔧 Si le site ne s'affiche pas

### Solution 1 : Redémarrer le frontend

Ouvrez un terminal et exécutez :

```bash
cd "/Users/ephremkouadio/Peace magazine"
./demarrer-frontend.sh
```

### Solution 2 : Démarrer manuellement

```bash
cd "/Users/ephremkouadio/Peace magazine"
python3 -m http.server 8080
```

Puis ouvrez http://localhost:8080 dans votre navigateur.

### Solution 3 : Vérifier que le port est libre

Si le port 8080 est occupé :

```bash
# Tuer le processus sur le port 8080
lsof -ti:8080 | xargs kill -9

# Puis redémarrer
cd "/Users/ephremkouadio/Peace magazine"
python3 -m http.server 8080
```

## 📋 Checklist

- [ ] Le serveur Python est démarré
- [ ] J'ai ouvert http://localhost:8080 dans mon navigateur
- [ ] La page se charge (même si elle est blanche)
- [ ] J'ai ouvert la console du navigateur (F12) pour voir les erreurs

## 🐛 Diagnostic

### Si la page est blanche

1. Ouvrez la console du navigateur (F12)
2. Allez dans l'onglet **Console**
3. Notez les erreurs en rouge
4. Allez dans l'onglet **Network**
5. Rechargez la page (F5)
6. Vérifiez que les fichiers chargent (statut 200)

### Si vous voyez "Cannot GET /"

Cela signifie que le serveur Python ne trouve pas `index.html`.

**Solution :**
```bash
# Vérifier que vous êtes dans le bon dossier
cd "/Users/ephremkouadio/Peace magazine"
ls index.html  # Doit afficher "index.html"

# Redémarrer le serveur
python3 -m http.server 8080
```

### Si le port est déjà utilisé

```bash
# Voir quel processus utilise le port 8080
lsof -i:8080

# Tuer le processus
lsof -ti:8080 | xargs kill -9

# Redémarrer
python3 -m http.server 8080
```

## 🆘 Besoin d'aide ?

- 📱 WhatsApp : +225 07 67 66 04 76
- 📧 Email : morak6@icloud.com

