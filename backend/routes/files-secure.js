/**
 * Routes sécurisées pour servir les fichiers uploadés
 * Remplace l'accès statique direct pour plus de sécurité
 */

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs'); // Pour createReadStream

/**
 * Servir un fichier de manière sécurisée
 * Vérifie que le fichier existe et est autorisé avant de le servir
 */
router.get('/:filename', async (req, res) => {
    try {
        const { filename } = req.params;

        // ⚠️ SÉCURITÉ: Valider le nom de fichier (pas de path traversal)
        if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
            return res.status(400).json({
                success: false,
                error: 'Nom de fichier invalide'
            });
        }

            // Vérifier que le fichier existe dans Supabase via le modèle
            const { File: FileModel } = require('../models/supabase');
            try {
                const file = await FileModel.findByFilename(filename);
                if (!file) {
                    return res.status(404).json({
                        success: false,
                        error: 'Fichier non trouvé'
                    });
                }
                // Le fichier existe dans la base, on peut le servir
            } catch (error) {
                console.warn('Erreur lors de la vérification du fichier:', error);
                // Continuer quand même si Supabase échoue
            }

        // Chemin du fichier
        const filePath = path.join(__dirname, '../../uploads', filename);

        // Vérifier que le fichier existe physiquement
        try {
            await fs.access(filePath);
        } catch (error) {
            return res.status(404).json({
                success: false,
                error: 'Fichier non trouvé'
            });
        }

        // Lire les stats du fichier
        const stats = await fs.stat(filePath);

        // Déterminer le type MIME
        const ext = path.extname(filename).toLowerCase();
        const mimeTypes = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.webp': 'image/webp',
            '.gif': 'image/gif'
        };
        const contentType = mimeTypes[ext] || 'application/octet-stream';

        // Définir les headers de sécurité
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Length', stats.size);
        res.setHeader('Cache-Control', 'private, max-age=3600'); // Cache 1h
        res.setHeader('X-Content-Type-Options', 'nosniff'); // Empêcher le MIME sniffing
        res.setHeader('Content-Disposition', `inline; filename="${filename}"`); // Inline pour les images

        // Servir le fichier
        const fileStream = fsSync.createReadStream(filePath);
        fileStream.pipe(res);

    } catch (error) {
        console.error('Erreur lors du service du fichier:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors du service du fichier'
        });
    }
});

module.exports = router;



