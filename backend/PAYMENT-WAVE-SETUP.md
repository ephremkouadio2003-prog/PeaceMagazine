# Configuration Paiement Wave et Email

## ✅ Modifications effectuées

### 1. Service Email corrigé
- ✅ `createTransporter` → `createTransport` (corrigé)
- ✅ Variables d'environnement chargées automatiquement
- ✅ Vérification de connexion au démarrage (`verifyConnection()`)
- ✅ Envoi d'email de confirmation après validation du paiement

### 2. Service de Paiement Wave
- ✅ Nouveau service `wavePaymentService.js`
- ✅ Intégration du lien Wave : `https://pay.wave.com/m/M_ci_fvwQ2s3AQ91O/c/ci`
- ✅ Validation du paiement obligatoire avant traitement de la commande
- ✅ Email de confirmation envoyé uniquement après validation du paiement

### 3. Routes de Paiement
- ✅ `POST /api/payment/create-link/:orderId` - Créer un lien de paiement Wave
- ✅ `GET /api/payment/verify/:orderId` - Vérifier le statut d'un paiement
- ✅ `POST /api/payment/confirm/:orderId` - Confirmer un paiement (admin seulement)
- ✅ `POST /api/payment/cancel/:orderId` - Annuler un paiement

### 4. Contrôleur de Commandes
- ✅ Création automatique du lien de paiement Wave lors de la création d'une commande
- ✅ Vérification du paiement avant toute modification de statut
- ✅ Email de confirmation envoyé uniquement après validation du paiement

## 📋 Configuration requise

### Variables d'environnement (`.env`)

```env
# Email (Nodemailer)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM=Peace Magazine <noreply@peacemagazine.ci>
```

### Montant par défaut Wave
- Montant par défaut : **15 000 XOF**
- Montant configurable via le lien Wave avec le paramètre `?amount=15000`

## 🔄 Flux de paiement

1. **Création de commande**
   - Une commande est créée avec le statut `pending`
   - Un lien de paiement Wave est généré automatiquement
   - L'email de confirmation n'est PAS envoyé

2. **Paiement Wave**
   - Le client est redirigé vers Wave pour effectuer le paiement
   - URL : `https://pay.wave.com/m/M_ci_fvwQ2s3AQ91O/c/ci?amount=15000`

3. **Vérification du paiement**
   - L'admin vérifie manuellement le paiement dans Wave
   - L'admin confirme le paiement via l'API : `POST /api/payment/confirm/:orderId`

4. **Confirmation**
   - Le statut de la commande passe à `confirmed`
   - Le statut de paiement passe à `paid`
   - L'email de confirmation est envoyé automatiquement au client

## 🚫 Sécurité : Rien n'avance sans paiement

- ✅ Une commande ne peut pas passer à `confirmed` ou `in_progress` sans paiement validé
- ✅ L'email de confirmation n'est envoyé qu'après validation du paiement
- ✅ Seuls les admins peuvent confirmer les paiements

## 📧 Envoi d'emails

L'email de confirmation est envoyé automatiquement lors de :
- La confirmation d'un paiement Wave (`POST /api/payment/confirm/:orderId`)

L'email contient :
- Numéro de commande
- Détails de la commande
- Prochaines étapes
- Informations de contact

## 🔧 Utilisation de l'API

### Créer un lien de paiement
```bash
POST /api/payment/create-link/:orderId
Body: { "amount": 15000 }
```

### Vérifier un paiement
```bash
GET /api/payment/verify/:orderId
```

### Confirmer un paiement (Admin)
```bash
POST /api/payment/confirm/:orderId
Headers: { "Authorization": "Bearer <token>" }
Body: { 
  "paymentReference": "WAVE-123456789",
  "amount": 15000
}
```

## 📝 Notes importantes

- Wave ne fournit pas d'API webhook officielle
- La vérification du paiement doit être faite manuellement par l'admin
- Le montant par défaut est 15 000 XOF mais peut être personnalisé
- Le lien Wave est : `https://pay.wave.com/m/M_ci_fvwQ2s3AQ91O/c/ci?amount=15000`

## ✅ Vérification au démarrage

Le serveur vérifie automatiquement :
- ✅ Connexion à la base de données
- ✅ Configuration du service email (`emailService.verifyConnection()`)






