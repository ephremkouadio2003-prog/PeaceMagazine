/**
 * Routes d'authentification admin
 * Utilise Supabase Auth pour l'authentification
 */

const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY; // Clé publique pour le frontend

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('⚠️  Supabase non configuré pour l\'authentification admin');
}

/**
 * POST /api/admin/auth/login
 * Connexion admin via Supabase Auth
 */
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email et mot de passe requis'
            });
        }

        if (!supabaseUrl || !supabaseAnonKey) {
            return res.status(503).json({
                success: false,
                message: 'Supabase non configuré'
            });
        }

        // Créer un client Supabase pour le frontend
        const supabase = createClient(supabaseUrl, supabaseAnonKey);

        // Se connecter avec Supabase Auth
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            return res.status(401).json({
                success: false,
                message: 'Identifiants incorrects'
            });
        }

        // Vérifier si l'utilisateur est admin
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!supabaseServiceKey) {
            return res.status(503).json({
                success: false,
                message: 'Configuration Supabase incomplète'
            });
        }

        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
        const { data: adminUser, error: adminError } = await supabaseAdmin
            .from('admin_users')
            .select('*')
            .eq('email', email)
            .eq('is_active', true)
            .single();

        if (adminError || !adminUser) {
            return res.status(403).json({
                success: false,
                message: 'Accès refusé. Vous n\'êtes pas administrateur.'
            });
        }

        // Retourner le token de session
        res.json({
            success: true,
            message: 'Connexion réussie',
            data: {
                user: {
                    id: data.user.id,
                    email: data.user.email,
                    name: adminUser.name
                },
                session: {
                    accessToken: data.session.access_token,
                    refreshToken: data.session.refresh_token,
                    expiresAt: data.session.expires_at
                }
            }
        });
    } catch (error) {
        console.error('Erreur lors de la connexion admin:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la connexion'
        });
    }
});

/**
 * POST /api/admin/auth/logout
 * Déconnexion admin
 */
router.post('/logout', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Token manquant'
            });
        }

        const token = authHeader.substring(7);

        if (!supabaseUrl || !supabaseAnonKey) {
            return res.status(503).json({
                success: false,
                message: 'Supabase non configuré'
            });
        }

        const supabase = createClient(supabaseUrl, supabaseAnonKey);
        await supabase.auth.signOut();

        res.json({
            success: true,
            message: 'Déconnexion réussie'
        });
    } catch (error) {
        console.error('Erreur lors de la déconnexion:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la déconnexion'
        });
    }
});

/**
 * GET /api/admin/auth/me
 * Récupérer les informations de l'admin connecté
 */
router.get('/me', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Token manquant'
            });
        }

        const token = authHeader.substring(7);

        if (!supabaseUrl || !supabaseAnonKey) {
            return res.status(503).json({
                success: false,
                message: 'Supabase non configuré'
            });
        }

        const supabase = createClient(supabaseUrl, supabaseAnonKey);
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            return res.status(401).json({
                success: false,
                message: 'Token invalide'
            });
        }

        // Vérifier si admin
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!supabaseServiceKey) {
            return res.status(503).json({
                success: false,
                message: 'Configuration Supabase incomplète'
            });
        }

        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
        const { data: adminUser } = await supabaseAdmin
            .from('admin_users')
            .select('*')
            .eq('email', user.email)
            .eq('is_active', true)
            .single();

        if (!adminUser) {
            return res.status(403).json({
                success: false,
                message: 'Accès refusé'
            });
        }

        res.json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    name: adminUser.name,
                    role: adminUser.role
                }
            }
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des infos admin:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des informations'
        });
    }
});

module.exports = router;

