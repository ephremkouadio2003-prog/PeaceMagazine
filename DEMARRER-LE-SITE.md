# 🚀 Comment démarrer le site Peace Magazine

## Méthode 1 : Script automatique (Recommandé)

### Sur macOS/Linux :

```bash
cd "/Users/ephremkouadio/Peace magazine"
./demarrer-site-simple.sh
```

### Ou directement :

```bash
cd "/Users/ephremkouadio/Peace magazine"
bash demarrer-site-simple.sh
```

## Méthode 2 : Commande manuelle

```bash
cd "/Users/ephremkouadio/Peace magazine"
python3 -m http.server 8080
```

## 🌐 Accéder au site

Une fois le serveur démarré, ouvrez votre navigateur et allez sur :

**http://localhost:8080**

## ⚠️ Si le port 8080 est déjà utilisé

Si vous voyez une erreur comme "Address already in use", tuez le processus existant :

```bash
# Trouver le processus
lsof -ti:8080

# Tuer le processus
lsof -ti:8080 | xargs kill -9

# Puis redémarrer
python3 -m http.server 8080
```

## 🔍 Vérifier que le serveur fonctionne

Ouvrez un nouveau terminal et testez :

```bash
curl http://localhost:8080
```

Vous devriez voir le code HTML de la page.

## 📱 Accès depuis un autre appareil sur le même réseau

Si vous voulez accéder depuis votre téléphone ou un autre ordinateur :

1. Trouvez votre adresse IP locale :
   ```bash
   ifconfig | grep "inet " | grep -v 127.0.0.1
   ```

2. Démarrer le serveur avec l'option `--bind` :
   ```bash
   python3 -m http.server 8080 --bind 0.0.0.0
   ```

3. Accéder depuis l'autre appareil :
   ```
   http://VOTRE_IP:8080
   ```

## ❌ Arrêter le serveur

Appuyez sur **Ctrl+C** dans le terminal où le serveur tourne.

## 📞 Besoin d'aide ?

- 📱 WhatsApp : +225 07 67 66 04 76
- 📧 Email : morak6@icloud.com



