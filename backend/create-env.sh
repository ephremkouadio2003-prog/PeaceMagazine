#!/bin/bash

# Script pour créer le fichier .env avec les configurations de base

echo "🔧 Création du fichier .env pour Peace Magazine Backend"
echo "========================================================"
echo ""

ENV_FILE=".env"

# Vérifier si .env existe déjà
if [ -f "$ENV_FILE" ]; then
    echo "⚠️  Le fichier .env existe déjà."
    read -p "Voulez-vous le remplacer ? (o/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Oo]$ ]]; then
        echo "❌ Opération annulée."
        exit 1
    fi
fi

# Demander le mot de passe MySQL
echo ""
echo "📊 Configuration de la base de données MySQL"
echo "--------------------------------------------"
read -p "Mot de passe MySQL pour l'utilisateur 'root' (laissez vide si pas de mot de passe): " MYSQL_PASSWORD
echo ""

# Créer le fichier .env
cat > "$ENV_FILE" << EOF
# Configuration de l'environnement Peace Magazine
# Généré automatiquement le $(date)

# Serveur
NODE_ENV=development
PORT=3000
HOST=localhost

# Base de données MySQL
DB_HOST=localhost
DB_PORT=3306
DB_NAME=peace_magazine
DB_USER=root
DB_PASSWORD=${MYSQL_PASSWORD}
DB_DIALECT=mysql

# JWT
JWT_SECRET=peace_magazine_super_secret_key_2024_changez_moi_en_production
JWT_EXPIRES_IN=7d

# Email (Nodemailer - Fallback)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM=Peace Magazine <noreply@peacemagazine.ci>

# Brevo (ex-Sendinblue) - Email transactionnel
BREVO_API_KEY=xkeysib-VOTRE_CLE_BREVO_ICI
BREVO_FROM_EMAIL=morak6@icloud.com
BREVO_FROM_NAME=Peace Magazine

# Stripe (Paiements) - Optionnel
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Cloudinary (Stockage d'images) - Optionnel
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# AWS S3 (Stockage de fichiers) - Optionnel
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1
AWS_BUCKET_NAME=peace-magazine-files

# Redis (Cache) - Optionnel
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=your_redis_password

# WhatsApp Business API - Optionnel
WHATSAPP_TOKEN=your_whatsapp_business_token
WHATSAPP_PHONE_ID=your_phone_id

# Analytics
GOOGLE_ANALYTICS_ID=GA-XXXXXXXXX

# Sécurité
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Upload
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/webp

# URLs
FRONTEND_URL=http://localhost:8080
BACKEND_URL=http://localhost:3000
ADMIN_URL=http://localhost:3000/admin
EOF

echo "✅ Fichier .env créé avec succès !"
echo ""
echo "📝 Prochaines étapes :"
echo "1. Vérifiez que MySQL est installé et démarré"
echo "2. Créez la base de données : CREATE DATABASE peace_magazine;"
echo "3. Redémarrez le serveur backend : npm run dev"
echo ""












