# Configuration Heyzine - URLs Publiques pour PDFs

## Problème

Heyzine nécessite des **URLs publiquement accessibles** depuis Internet pour convertir les PDFs en magazines interactifs. Les URLs locales (`localhost` ou `127.0.0.1`) ne fonctionnent pas car les serveurs Heyzine ne peuvent pas y accéder.

## Solutions

### Solution 1 : Utiliser ngrok (Recommandé pour le développement)

1. **Installer ngrok** :
   ```bash
   # macOS
   brew install ngrok
   
   # Ou télécharger depuis https://ngrok.com/
   ```

2. **Démarrer votre serveur local** :
   ```bash
   python3 -m http.server 8080
   # Ou utilisez serve-pdfs.py
   python3 serve-pdfs.py
   ```

3. **Créer un tunnel ngrok** (dans un autre terminal) :
   ```bash
   ngrok http 8080
   ```

4. **Configurer l'URL dans le navigateur** :
   - Ouvrez la console du navigateur (F12)
   - Copiez l'URL HTTPS fournie par ngrok (ex: `https://abc123.ngrok.io`)
   - Exécutez :
     ```javascript
     window.PDF_BASE_URL = 'https://abc123.ngrok.io';
     ```
   - Rechargez la page

### Solution 2 : Utiliser l'IP Locale (Réseau local uniquement)

Si vous êtes sur le même réseau que le serveur, vous pouvez utiliser l'IP locale :

1. **Trouver votre IP locale** :
   ```bash
   # macOS/Linux
   ifconfig | grep "inet " | grep -v 127.0.0.1
   
   # Windows
   ipconfig
   ```

2. **Configurer dans le navigateur** :
   ```javascript
   localStorage.setItem('LOCAL_IP', '10.23.129.33'); // Remplacez par votre IP
   ```

3. **Recharger la page**

**Note** : Cette solution ne fonctionne que si Heyzine peut accéder à votre réseau local, ce qui n'est généralement pas le cas. Utilisez ngrok pour un accès public.

### Solution 3 : Déployer en Production

Déployez votre site sur un serveur accessible publiquement (Vercel, Netlify, Firebase Hosting, etc.). Les PDFs seront alors automatiquement accessibles via des URLs publiques.

## Détection Automatique

Le code tente automatiquement de détecter votre IP locale via WebRTC. Si une IP locale est trouvée, elle sera utilisée à la place de `localhost`.

## Vérification

1. Ouvrez la console du navigateur (F12)
2. Cliquez sur un magazine dans la galerie
3. Vérifiez les logs :
   - `🌐 Utilisation de l'IP locale: X.X.X.X` - IP locale détectée
   - `⚠️ Utilisation de localhost` - Avertissement, Heyzine ne pourra pas accéder

## Messages d'Erreur

Si vous voyez l'erreur `{"success":false,"code":"-120","msg":"The url in the pdf parameter is invalid or is not available"}` :

1. Vérifiez que l'URL du PDF est accessible publiquement
2. Testez l'URL directement dans le navigateur
3. Utilisez ngrok pour créer un tunnel public
4. Vérifiez que le serveur PDF est bien démarré

## Configuration Permanente

Pour une configuration permanente, ajoutez dans `index.html` avant la fermeture de `<body>` :

```html
<script>
    // Configuration ngrok (remplacez par votre URL)
    window.PDF_BASE_URL = 'https://votre-tunnel.ngrok.io';
</script>
```

Ou pour l'IP locale :

```html
<script>
    localStorage.setItem('LOCAL_IP', '10.23.129.33');
</script>
```


