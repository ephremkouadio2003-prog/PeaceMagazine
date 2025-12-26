/**
 * Routes Admin sécurisées pour Peace Magazine
 * Nécessite une authentification Supabase valide avec un email admin
 */

const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs').promises;
const archiver = require('archiver');
const { Order } = require('../models/supabase');
const { File } = require('../models/supabase');
const { Lead } = require('../models/supabase');
const { Contact } = require('../models/supabase');

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Clé service (pas la clé publique)

if (!supabaseUrl || !supabaseServiceKey) {
    console.warn('⚠️  Supabase non configuré pour les routes admin');
}

const supabaseAdmin = supabaseUrl && supabaseServiceKey 
    ? createClient(supabaseUrl, supabaseServiceKey)
    : null;

/**
 * Middleware d'authentification admin
 * Vérifie que l'utilisateur est authentifié via Supabase Auth et est admin
 */
async function authenticateAdmin(req, res, next) {
    try {
        // Récupérer le token depuis le header Authorization
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Token d\'authentification manquant'
            });
        }

        const token = authHeader.substring(7);

        // Vérifier le token avec Supabase
        if (!supabaseAdmin) {
            return res.status(503).json({
                success: false,
                message: 'Supabase non configuré'
            });
        }

        const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

        if (error || !user || !user.email) {
            return res.status(401).json({
                success: false,
                message: 'Token invalide ou expiré'
            });
        }

        // Vérifier si l'email est dans la table admin_users
        const { data: adminUser, error: adminError } = await supabaseAdmin
            .from('admin_users')
            .select('*')
            .eq('email', user.email)
            .eq('is_active', true)
            .single();

        if (adminError || !adminUser) {
            return res.status(403).json({
                success: false,
                message: 'Accès refusé. Vous n\'êtes pas administrateur.'
            });
        }

        // Ajouter les infos admin à la requête
        req.admin = {
            id: user.id,
            email: user.email,
            adminUser: adminUser
        };

        next();
    } catch (error) {
        console.error('Erreur d\'authentification admin:', error);
        return res.status(500).json({
            success: false,
            message: 'Erreur d\'authentification'
        });
    }
}

/**
 * GET /api/admin/orders
 * Récupérer toutes les commandes (avec filtres optionnels)
 */
router.get('/orders', authenticateAdmin, async (req, res) => {
    try {
        const { status, paymentStatus, limit = 50, offset = 0, sortBy = 'created_at', sortOrder = 'DESC' } = req.query;

        const options = {
            limit: parseInt(limit),
            offset: parseInt(offset),
            orderBy: sortBy,
            orderDirection: sortOrder.toUpperCase()
        };

        if (status) {
            options.where = { ...options.where, status };
        }
        if (paymentStatus) {
            options.where = { ...options.where, paymentStatus };
        }

        const orders = await Order.findAll(options);

        res.json({
            success: true,
            data: {
                orders: orders.map(o => o.toJSON()),
                total: orders.length
            }
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des commandes:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des commandes'
        });
    }
});

/**
 * GET /api/admin/orders/:id
 * Récupérer une commande spécifique avec ses fichiers
 */
router.get('/orders/:id', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        const order = await Order.findByPk(id);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Commande non trouvée'
            });
        }

        // Récupérer les fichiers associés
        const files = await File.findAll({
            where: { orderId: id }
        });

        res.json({
            success: true,
            data: {
                order: order.toJSON(),
                files: files.map(f => f.toJSON())
            }
        });
    } catch (error) {
        console.error('Erreur lors de la récupération de la commande:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération de la commande'
        });
    }
});

/**
 * PATCH /api/admin/orders/:id/status
 * Modifier le statut d'une commande
 */
router.patch('/orders/:id/status', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({
                success: false,
                message: 'Le statut est requis'
            });
        }

        const order = await Order.findByPk(id);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Commande non trouvée'
            });
        }

        order.status = status;
        await order.save();

        res.json({
            success: true,
            message: 'Statut mis à jour avec succès',
            data: {
                order: order.toJSON()
            }
        });
    } catch (error) {
        console.error('Erreur lors de la mise à jour du statut:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la mise à jour du statut'
        });
    }
});

/**
 * PATCH /api/admin/orders/:id/payment-status
 * Modifier le statut de paiement d'une commande
 */
router.patch('/orders/:id/payment-status', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { paymentStatus, paymentNotes } = req.body;

        if (!paymentStatus) {
            return res.status(400).json({
                success: false,
                message: 'Le statut de paiement est requis'
            });
        }

        const order = await Order.findByPk(id);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Commande non trouvée'
            });
        }

        order.paymentStatus = paymentStatus;
        if (paymentNotes) {
            order.metadata = order.metadata || {};
            order.metadata.paymentNotes = paymentNotes;
        }
        await order.save();

        res.json({
            success: true,
            message: 'Statut de paiement mis à jour avec succès',
            data: {
                order: order.toJSON()
            }
        });
    } catch (error) {
        console.error('Erreur lors de la mise à jour du statut de paiement:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la mise à jour du statut de paiement'
        });
    }
});

/**
 * GET /api/admin/orders/:id/download-photos
 * Télécharger toutes les photos d'une commande en ZIP
 */
router.get('/orders/:id/download-photos', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        const order = await Order.findByPk(id);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Commande non trouvée'
            });
        }

        // Récupérer les fichiers associés
        const files = await File.findAll({
            where: { orderId: id, type: 'photo' }
        });

        if (files.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Aucune photo trouvée pour cette commande'
            });
        }

        // Créer un ZIP avec toutes les photos
        const zip = archiver('zip', { zlib: { level: 9 } });
        const zipFilename = `commande-${order.orderNumber || id}-photos.zip`;

        res.attachment(zipFilename);
        zip.pipe(res);

        for (const file of files) {
            const filePath = path.join(__dirname, '../../uploads', file.filename);
            try {
                await fs.access(filePath);
                zip.file(filePath, { name: file.originalName || file.filename });
            } catch (error) {
                console.warn(`Fichier non trouvé: ${filePath}`);
            }
        }

        await zip.finalize();
    } catch (error) {
        console.error('Erreur lors du téléchargement des photos:', error);
        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                message: 'Erreur lors du téléchargement des photos'
            });
        }
    }
});

/**
 * GET /api/admin/stats
 * Récupérer les statistiques du dashboard
 */
router.get('/stats', authenticateAdmin, async (req, res) => {
    try {
        // Récupérer toutes les commandes pour calculer les stats
        const orders = await Order.findAll({ limit: 10000 });
        const leads = await Lead.findAll({ limit: 10000 });

        // Calculer les statistiques
        const statusStats = {};
        const paymentStats = {};
        let totalRevenue = 0;

        orders.forEach(order => {
            // Stats par statut
            statusStats[order.status] = (statusStats[order.status] || 0) + 1;
            
            // Stats par statut de paiement
            paymentStats[order.paymentStatus] = (paymentStats[order.paymentStatus] || 0) + 1;
            
            // Revenus
            if (order.paymentStatus === 'paid' && order.totalPrice) {
                totalRevenue += parseFloat(order.totalPrice);
            }
        });

        // Convertir en array
        const statusStatsArray = Object.entries(statusStats).map(([status, count]) => ({
            status,
            count
        }));

        // Stats mensuelles (simplifié)
        const monthlyStats = [];
        const currentMonth = new Date().getMonth() + 1;
        monthlyStats.push({
            month: `${currentMonth}/2024`,
            count: orders.length
        });

        res.json({
            success: true,
            data: {
                totalOrders: orders.length,
                totalRevenue,
                statusStats: statusStatsArray,
                paymentStats,
                monthlyStats,
                totalLeads: leads.length,
                conversionRate: {
                    totalLeads: leads.length,
                    convertedLeads: orders.length
                }
            }
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des statistiques:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des statistiques'
        });
    }
});

/**
 * GET /api/admin/leads
 * Récupérer tous les leads
 */
router.get('/leads', authenticateAdmin, async (req, res) => {
    try {
        const { limit = 50, offset = 0 } = req.query;

        const leads = await Lead.findAll({
            limit: parseInt(limit),
            offset: parseInt(offset),
            orderBy: 'created_at',
            orderDirection: 'DESC'
        });

        res.json({
            success: true,
            data: {
                leads: leads.map(l => l.toJSON()),
                total: leads.length
            }
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des leads:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des leads'
        });
    }
});

/**
 * GET /api/admin/contacts
 * Récupérer tous les contacts
 */
router.get('/contacts', authenticateAdmin, async (req, res) => {
    try {
        const { limit = 50, offset = 0 } = req.query;

        const contacts = await Contact.findAll({
            limit: parseInt(limit),
            offset: parseInt(offset),
            orderBy: 'created_at',
            orderDirection: 'DESC'
        });

        res.json({
            success: true,
            data: {
                contacts: contacts.map(c => c.toJSON()),
                total: contacts.length
            }
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des contacts:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des contacts'
        });
    }
});

module.exports = router;

