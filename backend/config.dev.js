// Configuration de développement pour Peace Magazine Backend
module.exports = {
    // Serveur
    NODE_ENV: 'development',
    PORT: 3000,
    HOST: 'localhost',

    // ⚠️ Base de données MySQL désactivée - Utilisation de Supabase uniquement
    // DB_HOST: 'localhost',
    // DB_PORT: 3306,
    // DB_NAME: 'peace_magazine',
    // DB_USER: 'root',
    // DB_PASSWORD: '', // MySQL désactivé

    // ⚠️ SÉCURITÉ: Secrets doivent être définis dans .env uniquement
    // Ces valeurs sont des placeholders et ne doivent JAMAIS être utilisées en production
    // Le serveur doit charger les valeurs depuis process.env (fichier .env)
    JWT_SECRET: process.env.JWT_SECRET || null, // ⚠️ OBLIGATOIRE dans .env
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',

    // Email (Brevo recommandé, Gmail désactivé)
    // ⚠️ SÉCURITÉ: Ne pas mettre de vraies clés ici
    EMAIL_HOST: process.env.EMAIL_HOST || null,
    EMAIL_PORT: process.env.EMAIL_PORT || 587,
    EMAIL_USER: process.env.EMAIL_USER || null,
    EMAIL_PASS: process.env.EMAIL_PASS || null,
    EMAIL_FROM: process.env.EMAIL_FROM || 'Peace Magazine <noreply@peacemagazine.ci>',
    BREVO_API_KEY: process.env.BREVO_API_KEY || null, // ⚠️ OBLIGATOIRE dans .env pour les emails

    // Stripe (clés de test - ⚠️ À définir dans .env)
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || null,
    STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY || null,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || null,

    // Cloudinary (optionnel - ⚠️ À définir dans .env)
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || null,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || null,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || null,
    
    // Supabase (⚠️ À définir dans .env)
    SUPABASE_URL: process.env.SUPABASE_URL || null,
    SUPABASE_KEY: process.env.SUPABASE_KEY || null,
    
    // Wave Payment (⚠️ À définir dans .env)
    WAVE_SECRET_KEY: process.env.WAVE_SECRET_KEY || null,
    WAVE_WEBHOOK_URL: process.env.WAVE_WEBHOOK_URL || null,

    // URLs
    FRONTEND_URL: 'http://localhost:8080',
    BACKEND_URL: 'http://localhost:3000',

    // Rate Limiting
    RATE_LIMIT_WINDOW_MS: 900000,
    RATE_LIMIT_MAX_REQUESTS: 100
};
