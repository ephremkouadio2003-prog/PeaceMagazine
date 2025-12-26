/**
 * Routes de fichiers utilisant Supabase directement
 * Remplace les routes Sequelize
 */

const express = require('express');
const router = express.Router();
const { File: FileModel } = require('../models/supabase');
const FileValidator = require('../utils/fileValidator');
const fileSecurity = require('../utils/fileSecurity');
const path = require('path');
const fs = require('fs');
const fsPromises = require('fs').promises;
const crypto = require('crypto');

/**
 * Upload de fichier (base64)
 * Route publique pour uploader des fichiers depuis le frontend
 * 
 * ⚠️ AVERTISSEMENT HÉBERGEMENT :
 * Cette route sauvegarde les fichiers dans backend/uploads/
 * 
 * ❌ NE PAS utiliser sur :
 * - Vercel, Netlify, Heroku (gratuit), Render (gratuit)
 * - Toute plateforme serverless sans disque persistant
 * 
 * ✅ UTILISER sur :
 * - VPS (DigitalOcean, OVH, Hetzner, etc.)
 * - Railway avec Volume persistant
 * - Fly.io avec Volume persistant
 * - Render avec Disque persistant
 * 
 * Voir : HEBERGEMENT-ET-STOCKAGE.md pour plus d'informations
 */
router.post('/upload', async (req, res) => {
    try {
        const { name, type, size, data } = req.body;

        // Vérifier que les données sont présentes
        if (!name || !data) {
            return res.status(400).json({
                success: false,
                message: 'Nom de fichier et données (base64) sont obligatoires'
            });
        }

        // Valider le fichier base64
        const validation = FileValidator.validateBase64File(data, name);
        
        if (!validation.valid) {
            return res.status(400).json({
                success: false,
                message: `Erreur de validation: ${validation.errors.join(', ')}`
            });
        }

        const { mimeType, buffer, sanitizedFilename, requiresQuarantine } = validation;

        // ⚠️ Si le fichier nécessite une quarantaine, le mettre en quarantaine
        if (requiresQuarantine) {
            const tempPath = path.join(__dirname, '../../uploads', `temp-${crypto.randomUUID()}${path.extname(sanitizedFilename)}`);
            await fsPromises.writeFile(tempPath, buffer);
            
            await fileSecurity.quarantineFile(tempPath, 'Contenu suspect détecté lors de l\'upload');
            
            return res.status(400).json({
                success: false,
                message: 'Fichier suspect détecté et mis en quarantaine. Contactez l\'administrateur.'
            });
        }

        // Générer un nom de fichier unique et sécurisé
        const fileExtension = FileValidator.getExtensionFromMimeType(mimeType) || '.jpg';
        const uniqueFilename = `${crypto.randomUUID()}${fileExtension}`;
        const filePath = path.join(__dirname, '../../uploads', uniqueFilename);

        // Créer le dossier uploads s'il n'existe pas
        const uploadsDir = path.join(__dirname, '../../uploads');
        await fsPromises.mkdir(uploadsDir, { recursive: true });

        // Sauvegarder le fichier
        await fsPromises.writeFile(filePath, buffer);

        // URL sécurisée via API
        const fileUrl = `/api/files/${uniqueFilename}`;

        // Sauvegarder les métadonnées dans Supabase
        let savedFile;
        try {
            savedFile = await FileModel.create({
                originalName: sanitizedFilename,
                filename: uniqueFilename,
                mimetype: mimeType,
                size: buffer.length,
                path: filePath,
                url: fileUrl,
                orderId: null, // Sera associé lors de la création de la commande
                type: 'photo'
            });
        } catch (supabaseError) {
            console.error('Erreur lors de la sauvegarde dans Supabase:', supabaseError);
            // Supprimer le fichier physique si Supabase échoue
            try {
                await fsPromises.unlink(filePath);
            } catch (unlinkError) {
                console.warn('Impossible de supprimer le fichier après erreur Supabase:', unlinkError);
            }
            
            return res.status(500).json({
                success: false,
                message: 'Erreur lors de la sauvegarde des métadonnées. Le fichier a été supprimé.'
            });
        }

        // Retourner les informations du fichier créé
        // Format attendu par le frontend : { success: true, data: { files: [{ id, url, server_url, ... }] } }
        const fileJson = savedFile.toJSON();
        res.json({
            success: true,
            message: 'Fichier uploadé avec succès',
            data: {
                files: [{
                    id: fileJson.id,
                    name: fileJson.originalName, // Nom original
                    originalName: fileJson.originalName, // Alias
                    filename: fileJson.filename, // Nom unique sur le serveur
                    type: fileJson.mimetype,
                    mimetype: fileJson.mimetype, // Alias
                    size: fileJson.size,
                    url: fileJson.url, // URL principale
                    server_url: fileJson.url, // Alias pour compatibilité avec le frontend
                    serverId: fileJson.id, // Alias pour compatibilité
                    orderId: fileJson.orderId,
                    uploaded_at: fileJson.uploadedAt,
                    uploadedAt: fileJson.uploadedAt // Alias
                }]
            }
        });
    } catch (error) {
        console.error('Erreur lors de l\'upload du fichier:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de l\'upload du fichier',
            error: error.message
        });
    }
});

/**
 * Récupérer les statistiques des fichiers
 * ⚠️ IMPORTANT: Cette route doit être AVANT GET /:id pour éviter les conflits
 */
router.get('/stats/summary', async (req, res) => {
    try {
        const allFiles = await FileModel.findAll();
        
        const stats = {
            total: allFiles.length,
            totalSize: allFiles.reduce((sum, f) => sum + (f.size || 0), 0),
            byType: {},
            byOrder: {}
        };

        allFiles.forEach(file => {
            // Par type
            const type = file.type || 'unknown';
            stats.byType[type] = (stats.byType[type] || 0) + 1;

            // Par commande
            if (file.orderId) {
                stats.byOrder[file.orderId] = (stats.byOrder[file.orderId] || 0) + 1;
            }
        });

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Erreur lors du calcul des statistiques:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors du calcul des statistiques'
        });
    }
});

/**
 * Récupérer tous les fichiers (avec filtres optionnels)
 * ⚠️ IMPORTANT: Cette route doit être AVANT GET /:id
 */
router.get('/', async (req, res) => {
    try {
        const { orderId, type, limit = 50, offset = 0 } = req.query;

        const options = {
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['uploaded_at', 'DESC']]
        };

        if (orderId || type) {
            options.where = {};
            if (orderId) options.where.orderId = orderId;
            if (type) options.where.type = type;
        }

        const files = await FileModel.findAll(options);

        res.json({
            success: true,
            data: files.map(f => f.toJSON()),
            count: files.length
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des fichiers:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des fichiers'
        });
    }
});

/**
 * Récupérer un fichier par ID
 * ⚠️ IMPORTANT: Cette route doit être APRÈS les routes spécifiques (GET /, GET /stats/summary)
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const file = await FileModel.findByPk(id);

        if (!file) {
            return res.status(404).json({
                success: false,
                message: 'Fichier non trouvé'
            });
        }

        res.json({
            success: true,
            data: file.toJSON()
        });
    } catch (error) {
        console.error('Erreur lors de la récupération du fichier:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération du fichier'
        });
    }
});

/**
 * Mettre à jour un fichier
 */
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const file = await FileModel.findByPk(id);

        if (!file) {
            return res.status(404).json({
                success: false,
                message: 'Fichier non trouvé'
            });
        }

        await file.update(updateData);

        res.json({
            success: true,
            message: 'Fichier mis à jour avec succès',
            data: file.toJSON()
        });
    } catch (error) {
        console.error('Erreur lors de la mise à jour du fichier:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la mise à jour du fichier'
        });
    }
});

/**
 * Supprimer un fichier
 */
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const file = await FileModel.findByPk(id);

        if (!file) {
            return res.status(404).json({
                success: false,
                message: 'Fichier non trouvé'
            });
        }

        // Supprimer le fichier physique s'il existe
        if (file.path) {
            try {
                await fsPromises.unlink(file.path);
            } catch (fsError) {
                console.warn('Impossible de supprimer le fichier physique:', fsError.message);
            }
        }

        // Supprimer de Supabase
        await file.destroy();

        res.json({
            success: true,
            message: 'Fichier supprimé avec succès'
        });
    } catch (error) {
        console.error('Erreur lors de la suppression du fichier:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la suppression du fichier'
        });
    }
});

module.exports = router;



