# Configuration Brevo pour les emails de confirmation

## 📧 Intégration Brevo (ex-Sendinblue)

Brevo est maintenant intégré pour envoyer les emails de confirmation de commande. Le système utilise Brevo en priorité et fait un fallback vers Nodemailer si Brevo n'est pas disponible.

## 🚀 Installation

### 1. Installer le package Brevo

```bash
cd backend
npm install @getbrevo/brevo --save
```

### 2. Configuration des variables d'environnement

Ajoutez ces variables dans votre fichier `.env` :

```env
# Brevo (ex-Sendinblue) - Email transactionnel
BREVO_API_KEY=xkeysib-VOTRE_CLE_BREVO_ICI
BREVO_FROM_EMAIL=morak6@icloud.com
BREVO_FROM_NAME=Peace Magazine
```

### 3. Obtenir votre clé API Brevo

1. Connectez-vous à votre compte Brevo : https://app.brevo.com/
2. Allez dans **Settings** > **API Keys**
3. Créez une nouvelle clé API ou utilisez une existante
4. Copiez la clé (commence par `xkeysib-`)
5. Ajoutez-la dans votre fichier `.env`

## ✅ Fonctionnement

### Priorité d'envoi

1. **Brevo** (si configuré) - Utilisé en priorité pour les emails de confirmation
2. **Nodemailer** (fallback) - Utilisé si Brevo n'est pas disponible ou en cas d'erreur

### Emails concernés

- ✅ **Confirmation de commande** - Envoyé via Brevo si configuré
- ✅ **Notifications admin** - Toujours via Nodemailer
- ✅ **Autres emails** - Via Nodemailer

## 🔍 Vérification

Pour vérifier que Brevo fonctionne :

1. Démarrez le serveur backend
2. Vérifiez les logs au démarrage :
   ```
   ✅ Service Brevo initialisé avec succès
   ```
3. Créez une commande de test
4. Vérifiez les logs lors de l'envoi :
   ```
   📧 Tentative d'envoi via Brevo...
   ✅ Email envoyé avec succès via Brevo
   ```

## 📝 Exemple d'utilisation

Le service est automatiquement utilisé lors de la confirmation d'une commande :

```javascript
// Dans wavePaymentService.js ou orderController.js
await emailService.sendOrderConfirmation(order, order.clientEmail);
```

Le service email détecte automatiquement si Brevo est configuré et l'utilise en priorité.

## 🛠️ Dépannage

### Erreur : "Service Brevo non configuré"

- Vérifiez que `BREVO_API_KEY` est défini dans votre `.env`
- Vérifiez que la clé API est valide
- Redémarrez le serveur après modification du `.env`

### Erreur : "Échec Brevo, fallback vers Nodemailer"

- Le système bascule automatiquement vers Nodemailer
- Vérifiez les logs pour l'erreur spécifique
- Vérifiez que votre clé API Brevo est valide et active

### Email non reçu

1. Vérifiez les logs du serveur
2. Vérifiez le dossier spam
3. Vérifiez que l'adresse email du destinataire est valide
4. Vérifiez votre compte Brevo pour les statistiques d'envoi

## 📊 Statistiques Brevo

Vous pouvez consulter les statistiques d'envoi dans votre tableau de bord Brevo :
- Taux de livraison
- Taux d'ouverture
- Taux de clics
- Emails en échec

## 🔐 Sécurité

⚠️ **Important** : Ne partagez jamais votre clé API Brevo publiquement. Elle doit rester dans votre fichier `.env` qui est dans `.gitignore`.

## 📚 Documentation

- Documentation Brevo : https://developers.brevo.com/
- SDK Node.js : https://github.com/getbrevo/brevo-nodejs












