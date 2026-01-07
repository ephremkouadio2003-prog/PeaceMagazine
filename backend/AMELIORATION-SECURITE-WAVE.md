# 🔒 Amélioration de la sécurité - Paiement Wave

## ❌ Problèmes identifiés

1. **URL statique sans signature** - Vulnérable à la manipulation
2. **Pas de webhook** - Aucune confirmation automatique côté PSP
3. **`confirmPayment` non sécurisé** - Valide un paiement sans vérification réelle
4. **Aucune traçabilité** - Pas de référence de paiement requise

## ✅ Améliorations apportées

### 1. Tokens de transaction sécurisés

**Méthode : `generateTransactionToken()`**

- Génère un token HMAC-SHA256 unique pour chaque transaction
- Stocké dans Supabase avec la commande
- Permet de vérifier l'intégrité de la transaction

```javascript
const token = generateTransactionToken(orderId, orderNumber, amount);
// Stocké dans order.payment_token
```

### 2. Vérifications de sécurité dans `confirmPayment`

**Nouvelles vérifications obligatoires :**

- ✅ **Référence de paiement requise** - Impossible de confirmer sans référence
- ✅ **Vérification du montant** - Le montant doit correspondre (tolérance de 100 XOF)
- ✅ **Vérification du statut** - Impossible de confirmer un paiement déjà payé
- ✅ **Preuve de paiement optionnelle** - URL de screenshot/preuve peut être fournie
- ✅ **Traçabilité complète** - Logs avec timestamp, références, etc.

### 3. Route webhook (système personnalisé)

**Route : `POST /api/payment/wave-webhook`**

- Traite les webhooks avec vérification de signature
- ⚠️ **Note** : Wave ne fournit pas de webhook officiel
- Cette route peut être utilisée pour un système de callback personnalisé

### 4. Amélioration de `verifyPayment`

- Utilise Supabase au lieu de Sequelize
- Vérifie la correspondance des références de paiement
- Retourne des informations détaillées sur l'état du paiement

### 5. Logs de sécurité

Tous les événements critiques sont loggés :
- Confirmation de paiement (avec références)
- Annulation de paiement (avec raison)
- Erreurs de vérification

## 🔐 Utilisation sécurisée

### Confirmer un paiement (avec vérifications)

```bash
POST /api/payment/confirm/:orderId
Content-Type: application/json

{
  "paymentReference": "WAVE-123456789",  // ⚠️ OBLIGATOIRE
  "amount": 15000,                        // Vérifié contre le montant attendu
  "proofUrl": "https://...",             // Optionnel: screenshot/preuve
  "confirmedBy": "admin@example.com",    // Optionnel: qui confirme
  "notes": "Paiement vérifié manuellement" // Optionnel: notes
}
```

**Réponse en cas d'erreur :**
```json
{
  "success": false,
  "error": "Référence de paiement requise pour confirmer le paiement",
  "requiresReview": true
}
```

**Réponse en cas de succès :**
```json
{
  "success": true,
  "message": "Paiement confirmé avec succès",
  "data": { ... },
  "security": {
    "referenceVerified": true,
    "amountVerified": true,
    "proofProvided": true
  }
}
```

### Vérifier un paiement

```bash
GET /api/payment/verify/:orderId?paymentReference=WAVE-123456789
```

**Réponse :**
```json
{
  "success": true,
  "order": { ... },
  "paymentStatus": "pending",
  "requiresManualVerification": true,
  "message": "Vérification du paiement requise. Fournissez une preuve de paiement..."
}
```

## ⚠️ Limitations actuelles

### Wave ne fournit pas :

1. **API webhook officielle** - Pas de notification automatique
2. **API de vérification** - Impossible de vérifier automatiquement le statut
3. **Signature des URLs** - Les URLs Wave sont statiques

### Solutions de contournement :

1. **Vérification manuelle obligatoire** - Un admin doit vérifier chaque paiement
2. **Référence de paiement requise** - Le client doit fournir une référence
3. **Preuve de paiement** - Screenshot ou autre preuve peut être demandée
4. **Logs complets** - Tous les événements sont tracés pour audit

## 🔄 Processus recommandé

### 1. Création de commande
- Un lien de paiement est généré avec un token unique
- Le token est stocké dans Supabase

### 2. Paiement client
- Le client paie via Wave
- Le client reçoit une référence de paiement de Wave

### 3. Vérification (OBLIGATOIRE)
- L'admin vérifie le paiement dans Wave
- L'admin confirme via l'API avec :
  - Référence de paiement Wave
  - Montant payé
  - Preuve (screenshot, etc.)

### 4. Confirmation
- Le système vérifie :
  - La référence existe
  - Le montant correspond
  - Le statut n'est pas déjà "paid"
- Si tout est OK, le paiement est confirmé
- Email de confirmation envoyé

## 📝 Variables d'environnement

```env
# Clé secrète pour signer les transactions (utilise JWT_SECRET si non défini)
WAVE_SECRET_KEY=your-secret-key-here

# URL de webhook (optionnel, pour système personnalisé)
WAVE_WEBHOOK_URL=https://votre-domaine.com/api/payment/wave-webhook
```

## 🚨 Recommandations de sécurité

1. **Toujours exiger une référence de paiement** - Ne jamais confirmer sans référence
2. **Vérifier le montant** - S'assurer que le montant correspond
3. **Demander une preuve** - Screenshot ou autre preuve pour les gros montants
4. **Logs complets** - Tous les événements doivent être tracés
5. **Double vérification** - Pour les gros montants, faire vérifier par 2 personnes

## 📞 Besoin d'aide ?

- 📱 WhatsApp : +225 07 67 66 04 76
- 📧 Email : morak6@icloud.com








