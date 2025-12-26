# 🔧 Dépannage Heyzine - Magazines non visibles

## Problème

Quand vous cliquez sur un magazine pour le visualiser, rien ne s'affiche.

## Cause principale

**Heyzine nécessite des URLs publiquement accessibles** (HTTP/HTTPS accessibles depuis Internet). Les fichiers locaux (`localhost` ou `127.0.0.1`) ne sont **pas accessibles** depuis les serveurs Heyzine.

## Solutions

### Solution 1 : Utiliser un tunnel (Recommandé pour le développement local)

Utilisez **ngrok** ou un service similaire pour rendre vos fichiers locaux accessibles :

```bash
# Installer ngrok
# macOS: brew install ngrok
# Ou télécharger depuis https://ngrok.com/

# Démarrer votre serveur local
python3 -m http.server 8080

# Dans un autre terminal, créer un tunnel
ngrok http 8080
```

Vous obtiendrez une URL publique (ex: `https://abc123.ngrok.io`) que vous pouvez utiliser pour accéder à vos PDFs.

### Solution 2 : Uploader les PDFs vers un service cloud

1. **Google Drive** : Uploader le PDF, partager publiquement, obtenir le lien direct
2. **Dropbox** : Uploader, créer un lien partagé
3. **GitHub** : Uploader dans un repo public
4. **Cloud Storage** : AWS S3, Google Cloud Storage, etc.

### Solution 3 : Utiliser un serveur de production

Déployer le site sur un serveur accessible publiquement (Vercel, Netlify, Firebase Hosting, etc.)

## Vérifications

1. **Ouvrir la console du navigateur** (F12) pour voir les erreurs
2. **Vérifier les logs** : Les messages de débogage indiquent l'URL utilisée
3. **Tester l'URL du PDF** : Ouvrir directement l'URL du PDF dans le navigateur pour vérifier qu'elle est accessible

## Messages d'erreur courants

- `Erreur API Heyzine: 400` : URL invalide ou PDF non accessible
- `CORS error` : Problème de permissions cross-origin
- `Network error` : Le PDF n'est pas accessible depuis Internet

## Code de débogage

Le code ajoute maintenant des logs dans la console :
- `Tentative de conversion PDF:` - Affiche l'URL utilisée
- `Fichier local détecté` - Indique qu'un fichier local a été détecté
- `URL Heyzine directe:` - Affiche l'URL générée pour Heyzine

## Test rapide

Pour tester si un PDF est accessible :

```javascript
// Dans la console du navigateur
fetch('http://localhost:8080/assets/PDF/Template%20Magazine.pdf')
  .then(r => console.log('✅ Accessible:', r.status))
  .catch(e => console.error('❌ Non accessible:', e));
```

Si cela fonctionne localement mais pas avec Heyzine, c'est que le fichier n'est pas accessible depuis Internet.



