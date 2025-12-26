# 🌐 Lien d'accès au site Peace Magazine

## 📱 Lien principal

**http://localhost:8080**

Ouvrez cette URL dans votre navigateur (Chrome, Firefox, Safari, etc.)

## 🚀 Comment démarrer le site

### Option 1 : Script automatique (recommandé)

Ouvrez un terminal et exécutez :

```bash
cd "/Users/ephremkouadio/Peace magazine"
./demarrer-frontend.sh
```

### Option 2 : Commande manuelle

```bash
cd "/Users/ephremkouadio/Peace magazine"
python3 -m http.server 8080
```

### Option 3 : Redémarrer proprement

```bash
cd "/Users/ephremkouadio/Peace magazine"
./redemarrer-site.sh
```

## ✅ Vérification

Une fois le serveur démarré, vous devriez voir dans le terminal :

```
🌟 Démarrage du serveur sur http://localhost:8080
```

Puis ouvrez votre navigateur et allez sur :

**http://localhost:8080**

## 🔍 Si le site ne s'affiche pas

### 1. Vérifier que le serveur est actif

```bash
lsof -ti:8080 && echo "✅ Serveur actif" || echo "❌ Serveur non actif"
```

### 2. Si le serveur n'est pas actif

Redémarrez-le avec :

```bash
cd "/Users/ephremkouadio/Peace magazine"
./redemarrer-site.sh
```

### 3. Si le port est occupé

```bash
# Tuer le processus sur le port 8080
lsof -ti:8080 | xargs kill -9

# Redémarrer
cd "/Users/ephremkouadio/Peace magazine"
python3 -m http.server 8080
```

### 4. Vérifier la console du navigateur

1. Ouvrez http://localhost:8080
2. Appuyez sur **F12** (ou Cmd+Option+I sur Mac)
3. Allez dans l'onglet **Console**
4. Notez les erreurs en rouge

## 📋 Checklist

- [ ] Le serveur Python est démarré
- [ ] J'ai ouvert http://localhost:8080 dans mon navigateur
- [ ] La page se charge (même si elle est blanche)
- [ ] J'ai vérifié la console du navigateur (F12) pour les erreurs

## 🆘 Besoin d'aide ?

- 📱 WhatsApp : +225 07 67 66 04 76
- 📧 Email : morak6@icloud.com

