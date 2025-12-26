const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

// Configuration de développement
const config = require('./config.dev');

// Charger les variables d'environnement depuis config.dev si pas définies dans .env
if (!process.env.EMAIL_HOST) process.env.EMAIL_HOST = config.EMAIL_HOST;
if (!process.env.EMAIL_PORT) process.env.EMAIL_PORT = config.EMAIL_PORT;
if (!process.env.EMAIL_USER) process.env.EMAIL_USER = config.EMAIL_USER;
if (!process.env.EMAIL_PASS) process.env.EMAIL_PASS = config.EMAIL_PASS;
if (!process.env.EMAIL_FROM) process.env.EMAIL_FROM = config.EMAIL_FROM;
if (!process.env.JWT_SECRET) process.env.JWT_SECRET = config.JWT_SECRET;
if (!process.env.JWT_EXPIRES_IN) process.env.JWT_EXPIRES_IN = config.JWT_EXPIRES_IN;
if (!process.env.FRONTEND_URL) process.env.FRONTEND_URL = config.FRONTEND_URL;

// ⚠️ MySQL désactivé - Utilisation de Supabase uniquement
// Le backend fonctionne maintenant uniquement pour les emails Brevo
// Toutes les données sont gérées par Supabase côté frontend

// Import des modèles Supabase
const { testConnection, syncDatabase } = require('./models');

// Import des routes Supabase
const authRoutes = require('./routes/auth');
const ordersSupabaseRoutes = require('./routes/orders-supabase');
const contactSupabaseRoutes = require('./routes/contact-supabase');
const filesSupabaseRoutes = require('./routes/files-supabase');
const filesSecureRoutes = require('./routes/files-secure');
const paymentRoutes = require('./routes/payment');
const heyzineRoutes = require('./routes/heyzine');

// Import du service email
const emailService = require('./services/emailService');

// Configuration de l'application
const app = express();
const PORT = config.PORT || 3000;
const HOST = config.HOST || 'localhost';

// Middleware de sécurité
app.use(helmet({
    contentSecurityPolicy: false // Désactiver pour le développement
}));

// CORS
app.use(cors({
    origin: config.FRONTEND_URL || 'http://localhost:8080',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Compression
app.use(compression());

// Logging
app.use(morgan('dev'));

// Rate limiting (plus permissif en développement)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // 1000 requêtes par fenêtre en développement
    message: {
        success: false,
        message: 'Trop de requêtes, veuillez réessayer plus tard'
    }
});
app.use('/api/', limiter);

// Parsing des données (augmenté pour les fichiers base64)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Servir les fichiers statiques du panneau admin
app.use('/admin', express.static(path.join(__dirname, 'admin')));

// ⚠️ SÉCURITÉ: Ne plus servir les fichiers directement en statique
// Les fichiers sont servis via une route API sécurisée
// app.use('/uploads', express.static(path.join(__dirname, '../uploads'))); // DÉSACTIVÉ

// Routes de santé
app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Peace Magazine API est opérationnelle',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: 'development',
        database: 'Supabase'
    });
});

// Routes API
app.use('/api/auth', authRoutes);

// Routes Supabase
app.use('/api/orders', ordersSupabaseRoutes);

// Routes fichiers Supabase (admin: GET /, GET /stats/summary, PUT /:id, DELETE /:id)
app.use('/api/files', filesSupabaseRoutes);

// Route sécurisée pour servir les fichiers (GET /api/files/:filename)
// Note: Express matche dans l'ordre, donc les routes spécifiques de files-supabase
// (GET /, GET /stats/summary) sont prioritaires sur GET /:filename
app.use('/api/files', filesSecureRoutes);

app.use('/api/payment', paymentRoutes);
app.use('/api/heyzine', heyzineRoutes);

// Route de contact via Supabase
app.use('/api/contact', contactSupabaseRoutes);

// Routes admin sécurisées
const adminRoutes = require('./routes/admin');
app.use('/api/admin', adminRoutes);

// Routes d'authentification admin
const adminAuthRoutes = require('./routes/admin-auth');
app.use('/api/admin/auth', adminAuthRoutes);

// Route pour les statistiques publiques
app.get('/api/stats/public', (req, res) => {
    res.json({
        success: true,
        data: {
            totalOrders: 0,
            totalCustomers: 0,
            averageRating: 4.8,
            yearsInBusiness: new Date().getFullYear() - 2023
        }
    });
});

// Gestion des erreurs 404
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route non trouvée',
        path: req.originalUrl
    });
});

// Middleware de gestion des erreurs globales
const { errorHandler } = require('./utils/errorHandler');
app.use(errorHandler);

// Initialisation du serveur
const startServer = async () => {
    try {
        console.log('🔄 Initialisation du serveur de développement...');
        console.log('ℹ️  MySQL désactivé - Utilisation de Supabase uniquement');

        // ⚠️ SÉCURITÉ: Vérifier que les secrets critiques sont définis
        const criticalSecrets = {
            'BREVO_API_KEY': process.env.BREVO_API_KEY || config.BREVO_API_KEY,
            'SUPABASE_URL': process.env.SUPABASE_URL || config.SUPABASE_URL,
            'SUPABASE_KEY': process.env.SUPABASE_KEY || config.SUPABASE_KEY
        };

        const missingSecrets = Object.entries(criticalSecrets)
            .filter(([key, value]) => !value)
            .map(([key]) => key);

        if (missingSecrets.length > 0) {
            console.warn('');
            console.warn('⚠️  ═══════════════════════════════════════════════════════');
            console.warn('⚠️  SÉCURITÉ: Secrets manquants dans .env');
            console.warn('⚠️  ═══════════════════════════════════════════════════════');
            console.warn('⚠️  Variables manquantes:', missingSecrets.join(', '));
            console.warn('⚠️  Le serveur peut démarrer mais certaines fonctionnalités ne fonctionneront pas.');
            console.warn('');
            console.warn('💡 Solution:');
            console.warn('   1. Créez un fichier .env dans le dossier backend/');
            console.warn('   2. Copiez config.env.example vers .env');
            console.warn('   3. Remplissez les variables manquantes');
            console.warn('');
        } else {
            console.log('✅ Tous les secrets critiques sont configurés');
        }

        // Vérifier la connexion Supabase
        await testConnection();

        // Initialiser la sécurité des fichiers
        const fileSecurity = require('./utils/fileSecurity');
        await fileSecurity.initialize();
        fileSecurity.startAutoPurge();
        
        // ⚠️ AVERTISSEMENT : Vérifier l'environnement d'hébergement
        const isServerless = process.env.VERCEL || process.env.NETLIFY || 
                            (process.env.HEROKU_APP_NAME && !process.env.HEROKU_SLUG_COMMIT) ||
                            (process.env.RENDER && !process.env.RENDER_DISK_PATH);
        
        if (isServerless) {
            console.warn('');
            console.warn('🚨 ═══════════════════════════════════════════════════════');
            console.warn('🚨 AVERTISSEMENT : PLATEFORME SERVERLESS DÉTECTÉE');
            console.warn('🚨 ═══════════════════════════════════════════════════════');
            console.warn('');
            console.warn('❌ Les fichiers uploadés seront PERDUS à chaque redémarrage');
            console.warn('❌ Cette configuration n\'est PAS adaptée à la production');
            console.warn('');
            console.warn('✅ Solutions :');
            console.warn('   1. Migrer vers un VPS (voir GUIDE-HEBERGEMENT-VPS.md)');
            console.warn('   2. Utiliser Supabase Storage ou Cloudinary');
            console.warn('   3. Utiliser Railway/Fly.io avec Volume persistant');
            console.warn('');
            console.warn('📚 Consultez HEBERGEMENT-ET-STOCKAGE.md pour plus d\'infos');
            console.warn('');
        }

        // Vérifier la configuration email
        await emailService.verifyConnection();

        // Démarrer le serveur
        app.listen(PORT, HOST, () => {
            console.log(`🚀 Serveur Peace Magazine démarré sur http://${HOST}:${PORT}`);
            console.log(`📊 Environnement: développement`);
            console.log(`🔗 API disponible sur: http://${HOST}:${PORT}/api`);
            console.log(`❤️  Santé du serveur: http://${HOST}:${PORT}/health`);
            console.log(`🎛️  Panneau admin: http://${HOST}:${PORT}/admin`);
            console.log(`📁 Base de données: Supabase (MySQL désactivé)`);
            console.log('');
            console.log('💡 Le site frontend doit être accessible sur http://localhost:8080');
            console.log('💡 Pour démarrer le frontend: python3 -m http.server 8080');
            console.log('💡 Toutes les données sont gérées par Supabase côté frontend');
        });

    } catch (error) {
        console.error('❌ Erreur lors du démarrage du serveur:', error);
        process.exit(1);
    }
};

// Gestion des signaux de fermeture
process.on('SIGTERM', () => {
    console.log('🛑 Signal SIGTERM reçu, fermeture du serveur...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('🛑 Signal SIGINT reçu, fermeture du serveur...');
    process.exit(0);
});

// Démarrer le serveur
startServer();

module.exports = app;
