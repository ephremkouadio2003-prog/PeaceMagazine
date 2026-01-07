# 🔧 Diagnostic - Paiement et Validation de commande

## 🔍 Problèmes signalés

1. ❌ Le volet paiement ne fonctionne pas
2. ❌ Impossible de valider la commande

## 📋 Checklist de diagnostic

### 1. Ouvrir la console du navigateur

1. Ouvrez http://localhost:8080
2. Appuyez sur **F12** (ou Cmd+Option+I sur Mac)
3. Allez dans l'onglet **Console**
4. Notez toutes les erreurs en rouge

### 2. Tester la validation de commande

1. Remplissez le formulaire jusqu'à l'étape 5 (Récapitulatif)
2. Cliquez sur "Confirmer ma commande"
3. Observez les messages dans la console

**Messages attendus si tout fonctionne :**
```
📝 Soumission du formulaire - Étape actuelle: 5
✅ Validation de l'étape 5 : OK
🚀 Démarrage de la soumission de la commande...
🚀 Début de la soumission de la commande...
✅ Données de commande préparées: {...}
🔗 Tentative de création via Supabase...
✅ Réponse Supabase: {...}
✅ Commande créée avec succès: PM-...
```

### 3. Tester le paiement

Une fois la commande créée :

1. La modal de paiement doit s'afficher
2. Vous devez voir Wave et Orange Money avec le numéro +225 0767660476
3. Cliquez sur "Cliquez pour télécharger la capture d'écran"
4. Sélectionnez une image
5. Le bouton "Confirmer le paiement" doit s'activer
6. Cliquez sur "Confirmer le paiement"

**Messages attendus :**
```
📸 Envoi de la capture d'écran du paiement...
🔗 Mise à jour via Supabase...
✅ Commande mise à jour dans Supabase
📧 Envoi au backend pour email...
✅ Email envoyé via backend
```

## 🐛 Erreurs courantes et solutions

### Erreur : "Validation échouée pour l'étape 5"

**Cause :** Des champs obligatoires ne sont pas remplis.

**Solution :**
- Vérifiez que tous les champs sont remplis :
  - Nom de la personne célébrée
  - Occasion
  - Votre nom
  - Votre email
  - Date de livraison
  - Adresse de livraison
  - Téléphone
  - Conditions générales acceptées
- Si mode "upload" : minimum 30 photos + photo de couverture

### Erreur : "Les tables Supabase n'existent pas"

**Solution :**
1. Allez sur https://app.supabase.com/
2. Ouvrez votre projet
3. Allez dans **SQL Editor**
4. Exécutez le fichier `supabase-setup.sql`
5. Vérifiez que les tables existent

### Erreur : "Erreur de permissions Supabase"

**Solution :**
1. Dans Supabase, allez dans **Authentication > Policies**
2. Vérifiez que les politiques RLS sont activées
3. Exécutez à nouveau `supabase-setup.sql`

### Erreur : "Backend non configuré"

**Solution :**
- **Option 1 (recommandé) :** Configurez Supabase (voir ci-dessus)
- **Option 2 :** Démarrez le backend :
  ```bash
  cd "/Users/ephremkouadio/Peace magazine/backend"
  npm start
  ```

### Erreur : "Impossible de se connecter"

**Solution :**
1. Vérifiez votre connexion Internet
2. Vérifiez que Supabase est accessible
3. Si vous utilisez le backend, vérifiez qu'il est démarré :
  ```bash
  lsof -ti:3000 && echo "✅ Backend actif" || echo "❌ Backend non actif"
  ```

### Le bouton "Confirmer le paiement" reste désactivé

**Cause :** Aucune capture d'écran n'a été uploadée.

**Solution :**
1. Cliquez sur "Cliquez pour télécharger la capture d'écran"
2. Sélectionnez une image (JPG, PNG, WEBP)
3. Vérifiez que l'aperçu s'affiche
4. Le bouton devrait s'activer automatiquement

### La modal de paiement ne s'affiche pas

**Cause :** La commande n'a pas été créée avec succès.

**Solution :**
1. Vérifiez la console pour les erreurs
2. Vérifiez que vous êtes bien à l'étape 5
3. Vérifiez que tous les champs sont remplis
4. Réessayez de confirmer la commande

## 🧪 Test manuel dans la console

Ouvrez la console (F12) et exécutez :

```javascript
// Vérifier la configuration
console.log('Config:', window.APP_CONFIG);
console.log('Supabase Service:', window.supabaseService);
console.log('API Base URL:', API_BASE_URL);

// Vérifier l'état du formulaire
if (window.orderFormInstance) {
    console.log('État du formulaire:', {
        currentStep: window.orderFormInstance.currentStep,
        hasFiles: window.orderFormInstance.uploadedFiles.length,
        personName: window.orderFormInstance.state.personName,
        customerEmail: window.orderFormInstance.state.customerEmail
    });
} else {
    console.error('❌ OrderFormInstance non trouvé');
}

// Tester Supabase
if (window.supabaseService) {
    window.supabaseService.apiCall('orders', 'GET', null, { limit: 1 })
        .then(result => console.log('✅ Supabase fonctionne:', result))
        .catch(error => console.error('❌ Erreur Supabase:', error));
}
```

## 📞 Besoin d'aide ?

Si le problème persiste :

1. **Copiez tous les messages de la console** (surtout ceux en rouge)
2. **Notez à quelle étape vous êtes** quand l'erreur se produit
3. **Décrivez ce qui se passe** (bouton grisé, message d'erreur, etc.)
4. **Contactez le support :**
   - 📱 WhatsApp : +225 07 67 66 04 76
   - 📧 Email : morak6@icloud.com






