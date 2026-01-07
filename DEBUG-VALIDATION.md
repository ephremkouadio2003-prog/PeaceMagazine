# 🐛 Guide de débogage - Validation de commande

## 🔍 Étapes de diagnostic

### 1. Ouvrir la console du navigateur

1. Ouvrez http://localhost:8080
2. Appuyez sur **F12** (ou Cmd+Option+I sur Mac)
3. Allez dans l'onglet **Console**

### 2. Tester la validation

1. Remplissez le formulaire jusqu'à l'étape 5
2. Cliquez sur "Confirmer ma commande"
3. Observez les messages dans la console

### 3. Messages attendus dans la console

Si tout fonctionne, vous devriez voir :

```
📝 Soumission du formulaire - Étape actuelle: 5
✅ Validation de l'étape 5 : OK
🚀 Démarrage de la soumission de la commande...
🚀 Début de la soumission de la commande...
📋 État actuel: {currentStep: 5, hasFiles: 30, ...}
✅ Données de commande préparées: {hasFiles: 30, hasPersonName: true, ...}
🔗 Tentative de création via Supabase...
✅ Réponse Supabase: {success: true, data: {...}}
✅ Commande créée dans Supabase: {orderId: 123, orderNumber: "PM-123", ...}
✅ Commande créée avec succès: PM-123
💳 URL de paiement: https://pay.wave.com/...
```

### 4. Erreurs courantes et solutions

#### Erreur : "Étape actuelle: 4" (ou moins)
**Problème :** Vous n'êtes pas à la dernière étape.

**Solution :**
- Cliquez sur "Suivant" jusqu'à arriver à l'étape 5 (Récapitulatif)
- Vérifiez que tous les champs obligatoires sont remplis

#### Erreur : "Validation de l'étape X : ÉCHEC"
**Problème :** Des champs obligatoires ne sont pas remplis.

**Solution :**
- Regardez les messages d'erreur affichés sur la page
- Remplissez tous les champs marqués en rouge
- Vérifiez que vous avez au moins 30 photos si mode "upload"
- Vérifiez que vous avez sélectionné une photo de couverture

#### Erreur : "Données manquantes : ..."
**Problème :** Des données essentielles ne sont pas présentes.

**Solution :**
- Retournez aux étapes précédentes
- Vérifiez que tous les champs sont bien remplis
- Rechargez la page si nécessaire

#### Erreur : "Erreur Supabase: relation 'orders' does not exist"
**Problème :** Les tables Supabase n'existent pas.

**Solution :**
1. Allez sur https://app.supabase.com/
2. Ouvrez votre projet
3. Allez dans **SQL Editor**
4. Exécutez le fichier `supabase-setup.sql`
5. Vérifiez que les tables existent :
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('orders', 'leads', 'contacts', 'files');
   ```

#### Erreur : "Erreur Supabase: permission denied"
**Problème :** Les politiques RLS (Row Level Security) ne sont pas configurées.

**Solution :**
1. Dans Supabase, allez dans **Authentication > Policies**
2. Vérifiez que les politiques existent pour la table `orders`
3. Exécutez à nouveau `supabase-setup.sql` pour créer les politiques

#### Erreur : "Erreur Supabase: Invalid API key"
**Problème :** La clé API Supabase est incorrecte.

**Solution :**
1. Dans Supabase, allez dans **Settings > API**
2. Copiez la clé publique (anon key) qui commence par `sb_publishable_`
3. Ouvrez `index.html`
4. Trouvez `window.APP_CONFIG` (vers la ligne 882)
5. Remplacez `supabaseKey` par votre clé

#### Erreur : "Backend non configuré et Supabase non disponible"
**Problème :** Ni Supabase ni le backend ne sont disponibles.

**Solution :**
- **Option 1 (recommandé) :** Configurez Supabase (voir ci-dessus)
- **Option 2 :** Démarrez le backend :
  ```bash
  cd "/Users/ephremkouadio/Peace magazine/backend"
  npm start
  ```

### 5. Test manuel de Supabase

Ouvrez la console du navigateur et exécutez :

```javascript
// Vérifier la configuration
console.log('Config:', window.APP_CONFIG);

// Vérifier le service Supabase
console.log('Supabase Service:', window.supabaseService);

// Tester la connexion
if (window.supabaseService) {
    window.supabaseService.apiCall('orders', 'GET', null, { limit: 1 })
        .then(result => {
            console.log('✅ Supabase fonctionne:', result);
        })
        .catch(error => {
            console.error('❌ Erreur Supabase:', error);
            console.error('Message:', error.message);
            console.error('Status:', error.status);
        });
} else {
    console.error('❌ Supabase service non initialisé');
}
```

### 6. Vérifier les données préparées

Dans la console, vous pouvez inspecter les données avant l'envoi :

```javascript
// Dans la console, après avoir cliqué sur "Confirmer ma commande"
// Les données sont loggées automatiquement, mais vous pouvez aussi :
console.log('État du formulaire:', window.orderFormInstance?.state);
console.log('Fichiers uploadés:', window.orderFormInstance?.uploadedFiles);
```

## 📋 Checklist de débogage

- [ ] La console du navigateur est ouverte (F12)
- [ ] Je suis à l'étape 5 (Récapitulatif)
- [ ] Tous les champs obligatoires sont remplis
- [ ] J'ai au moins 30 photos si mode "upload"
- [ ] J'ai sélectionné une photo de couverture
- [ ] La date de livraison est valide (au moins 7 jours)
- [ ] J'ai accepté les conditions générales
- [ ] Les messages dans la console sont clairs
- [ ] Supabase est configuré (tables + politiques)
- [ ] La clé API Supabase est correcte

## 🆘 Si le problème persiste

1. **Copiez tous les messages de la console** (surtout ceux en rouge)
2. **Notez à quelle étape vous êtes** quand l'erreur se produit
3. **Décrivez ce qui se passe** (bouton grisé, message d'erreur, etc.)
4. **Contactez le support :**
   - 📱 WhatsApp : +225 07 67 66 04 76
   - 📧 Email : morak6@icloud.com








