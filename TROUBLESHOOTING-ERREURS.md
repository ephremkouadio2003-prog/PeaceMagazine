# 🔧 Guide de dépannage - Erreurs de soumission

## ❌ Erreur "Load failed" lors de la soumission

### Symptômes
- Message d'erreur : "Erreur lors de la soumission : Load failed"
- Le formulaire ne se soumet pas
- Aucune confirmation de commande

### Causes possibles

#### 1. Backend non démarré
**Solution :**
```bash
cd backend
npm install  # Si ce n'est pas déjà fait
npm run dev
```

Le backend doit être accessible sur `http://localhost:3000`

#### 2. Problème de connexion réseau
**Vérifications :**
- Vérifiez votre connexion Internet
- Vérifiez qu'aucun pare-feu ne bloque la connexion
- Essayez d'accéder directement à `http://localhost:3000/health`

#### 3. CORS (Cross-Origin Resource Sharing)
**Solution :**
Vérifiez que le backend autorise les requêtes depuis votre origine. Dans `backend/server.dev.js`, assurez-vous que CORS est configuré :

```javascript
app.use(cors({
    origin: ['http://localhost:8080', 'http://localhost:8000', 'https://peacemagazine.ci'],
    credentials: true
}));
```

#### 4. Timeout de la requête
**Solution :**
- Vérifiez que le backend répond rapidement
- Augmentez le timeout si nécessaire (actuellement 30 secondes)
- Vérifiez les logs du backend pour voir s'il y a des erreurs

### 🔍 Diagnostic

#### Étape 1 : Vérifier que le backend est démarré
Ouvrez votre navigateur et allez sur : `http://localhost:3000/health`

Vous devriez voir une réponse JSON avec le statut du serveur.

#### Étape 2 : Vérifier la console du navigateur
1. Ouvrez les outils de développement (F12)
2. Allez dans l'onglet "Console"
3. Regardez les messages d'erreur détaillés

#### Étape 3 : Vérifier les logs du backend
Dans le terminal où le backend est démarré, vérifiez les logs pour voir s'il y a des erreurs.

### ✅ Solutions rapides

#### Solution 1 : Redémarrer le backend
```bash
# Arrêter le backend (Ctrl+C)
# Puis redémarrer
cd backend
npm run dev
```

#### Solution 2 : Vérifier les variables d'environnement
Assurez-vous que le fichier `.env` dans le dossier `backend` contient toutes les variables nécessaires.

#### Solution 3 : Utiliser Supabase (si configuré)
Si Supabase est configuré, le système utilisera automatiquement Supabase en priorité. Vérifiez la configuration dans `index.html` :

```javascript
window.APP_CONFIG = {
    useSupabase: true,
    // ...
};
```

### 📞 Contact support

Si le problème persiste après avoir essayé toutes ces solutions, contactez-nous :
- 📱 WhatsApp : +225 07 67 66 04 76
- 📧 Email : morak6@icloud.com

### 🔄 Messages d'erreur améliorés

Le système affiche maintenant des messages d'erreur plus clairs :
- **"Backend non configuré"** → Le serveur backend doit être démarré
- **"Impossible de se connecter"** → Vérifiez la connexion Internet et que le backend est démarré
- **"La requête a expiré"** → Le serveur met trop de temps à répondre
- **"Erreur CORS"** → Problème de configuration du serveur







