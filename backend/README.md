# Peace Magazine Backend

Backend complet pour Peace Magazine - API REST avec toutes les fonctionnalités modernes.

## 🚀 Fonctionnalités

### 🔐 Authentification & Autorisation
- **JWT** avec refresh tokens
- **Rôles** : admin, manager, designer, client
- **Permissions** granulaires
- **Réinitialisation** de mot de passe
- **Vérification** d'email

### 📋 Gestion des Commandes
- **Workflow complet** en 5 étapes
- **Statuts** et suivi en temps réel
- **Assignation** aux équipes
- **Historique** détaillé
- **Statistiques** avancées

### 👥 Gestion des Leads
- **Scoring automatique** (0-100)
- **Sources multiples** (formulaire, WhatsApp, etc.)
- **Conversion** en commandes
- **Assignation** aux équipes
- **Suivi** des contacts

### 📁 Upload de Fichiers
- **Upload multiple** (30+ photos)
- **Compression** automatique avec Sharp
- **Stockage cloud** (Cloudinary/S3)
- **Métadonnées** complètes
- **Optimisation** des images

### 💳 Système de Paiement
- **Stripe** intégré
- **Webhooks** sécurisés
- **Remboursements**
- **Historique** des paiements
- **Gestion** des litiges

### 📧 Service Email
- **Nodemailer** configuré
- **Templates** HTML
- **Notifications** automatiques
- **Vérification** d'email
- **Récupération** de mot de passe

### 📊 Panneau d'Administration
- **Dashboard** interactif
- **Graphiques** Chart.js
- **Gestion** des commandes/leads
- **Statistiques** en temps réel
- **Interface** responsive

## 🛠️ Technologies

### Backend Core
- **Node.js 18+** - Runtime JavaScript
- **Express.js** - Framework web
- **MySQL 8.0** - Base de données
- **Sequelize** - ORM
- **JWT** - Authentification

### Upload & Stockage
- **Multer** - Upload de fichiers
- **Sharp** - Optimisation d'images
- **Cloudinary** - Stockage cloud
- **AWS S3** - Stockage de fichiers

### Services Externes
- **Stripe** - Paiements
- **Nodemailer** - Emails
- **Redis** - Cache
- **WhatsApp Business API** - Notifications

### Sécurité & Validation
- **Helmet** - Sécurité HTTP
- **CORS** - Cross-origin
- **Rate Limiting** - Protection
- **Joi** - Validation des schémas
- **bcrypt** - Hachage des mots de passe

## 📦 Installation

### Prérequis
- Node.js 18+
- MySQL 8.0+
- Redis (optionnel)
- npm ou yarn

### 1. Cloner le projet
```bash
git clone <repository-url>
cd peace-magazine/backend
```

### 2. Installer les dépendances
```bash
npm install
```

### 3. Configuration
```bash
# Copier le fichier de configuration
cp config.env.example .env

# Éditer les variables d'environnement
nano .env
```

### 4. Base de données
```bash
# Créer la base de données
mysql -u root -p
CREATE DATABASE peace_magazine;

# Migrer la base de données
npm run migrate

# Seeder avec des données d'exemple
npm run seed
```

### 5. Démarrer le serveur
```bash
# Développement
npm run dev

# Production
npm start
```

## 🔧 Configuration

### Variables d'Environnement

#### Serveur
```env
NODE_ENV=development
PORT=3000
HOST=localhost
```

#### Base de données
```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=peace_magazine
DB_USER=root
DB_PASSWORD=your_password
```

#### JWT
```env
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=7d
```

#### Email
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM=Peace Magazine <noreply@peacemagazine.ci>
```

#### Stripe
```env
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

#### Cloudinary
```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## 📚 API Documentation

### Authentification
```bash
POST /api/auth/register    # Inscription
POST /api/auth/login       # Connexion
POST /api/auth/refresh     # Rafraîchir token
GET  /api/auth/profile     # Profil utilisateur
```

### Commandes
```bash
GET    /api/orders         # Liste des commandes
POST   /api/orders         # Créer une commande
GET    /api/orders/:id     # Détails d'une commande
PUT    /api/orders/:id     # Modifier une commande
DELETE /api/orders/:id     # Supprimer une commande
GET    /api/orders/stats   # Statistiques
```

### Leads
```bash
GET    /api/leads          # Liste des leads
POST   /api/leads          # Créer un lead
GET    /api/leads/:id      # Détails d'un lead
PUT    /api/leads/:id      # Modifier un lead
DELETE /api/leads/:id      # Supprimer un lead
GET    /api/leads/stats    # Statistiques
```

### Fichiers
```bash
POST   /api/files/upload   # Upload de fichiers
GET    /api/files          # Liste des fichiers
GET    /api/files/:id      # Détails d'un fichier
GET    /api/files/:id/download # Télécharger
DELETE /api/files/:id      # Supprimer un fichier
```

### Paiements
```bash
POST /api/payment/create-session/:orderId  # Créer session
POST /api/payment/webhook                  # Webhook Stripe
GET  /api/payment/details/:paymentIntentId # Détails paiement
POST /api/payment/refund/:paymentIntentId  # Remboursement
```

## 🐳 Docker

### Développement
```bash
# Construire et démarrer
docker-compose up --build

# En arrière-plan
docker-compose up -d

# Voir les logs
docker-compose logs -f app
```

### Production
```bash
# Avec variables d'environnement
docker-compose -f docker-compose.prod.yml up -d
```

## 📊 Panneau d'Administration

Accéder au panneau d'administration :
```
http://localhost:3000/admin
```

### Comptes par défaut
- **Admin** : admin@peacemagazine.ci / admin123
- **Manager** : manager@peacemagazine.ci / manager123

## 🧪 Tests

```bash
# Lancer les tests
npm test

# Tests avec couverture
npm run test:coverage

# Tests en mode watch
npm run test:watch
```

## 📈 Monitoring

### Logs
```bash
# Voir les logs en temps réel
tail -f logs/app.log

# Logs d'erreur
tail -f logs/error.log
```

### Santé du serveur
```bash
# Vérifier l'état
curl http://localhost:3000/health
```

## 🚀 Déploiement

### Heroku
```bash
# Installer Heroku CLI
npm install -g heroku

# Se connecter
heroku login

# Créer l'app
heroku create peace-magazine-api

# Configurer les variables
heroku config:set NODE_ENV=production
heroku config:set DB_HOST=your_db_host

# Déployer
git push heroku main
```

### VPS/Dedicated
```bash
# Installer PM2
npm install -g pm2

# Démarrer l'application
pm2 start server.js --name "peace-magazine-api"

# Configurer le démarrage automatique
pm2 startup
pm2 save
```

## 🔒 Sécurité

### Recommandations
- Utiliser HTTPS en production
- Configurer un firewall
- Mettre à jour régulièrement les dépendances
- Utiliser des mots de passe forts
- Activer l'authentification à deux facteurs

### Audit de sécurité
```bash
# Vérifier les vulnérabilités
npm audit

# Corriger automatiquement
npm audit fix
```

## 📞 Support

Pour toute question ou problème :
- **Email** : morak6@icloud.com
- **WhatsApp** : +225 07 67 66 04 76

## 📄 Licence

© 2024 Peace Magazine. Tous droits réservés.

---

*Backend créé avec ❤️ pour Peace Magazine*











