const express = require('express');
const router = express.Router();
const heyzineService = require('../services/heyzineService');
// ⚠️ Authentification désactivée - Routes publiques
// const { authenticateToken } = require('../middleware/auth');

/**
 * @route POST /api/heyzine/convert
 * @desc Convertit un PDF en flipbook via Heyzine
 * @access Public (peut être restreint si nécessaire)
 */
router.post('/convert', async (req, res) => {
    try {
        const { pdfUrl, options } = req.body;

        if (!pdfUrl) {
            return res.status(400).json({
                success: false,
                error: 'URL du PDF requise'
            });
        }

        // Valider que c'est bien une URL
        try {
            new URL(pdfUrl);
        } catch (e) {
            return res.status(400).json({
                success: false,
                error: 'URL invalide'
            });
        }

        const result = await heyzineService.convertPdfToFlipbook(pdfUrl, options || {});

        if (result.success) {
            res.json({
                success: true,
                data: {
                    flipbookUrl: result.flipbookUrl,
                    thumbnail: result.thumbnail,
                    pdfUrl: result.pdfUrl,
                    id: result.id,
                    meta: result.meta
                }
            });
        } else {
            res.status(500).json({
                success: false,
                error: result.error,
                fallbackUrl: result.fallbackUrl
            });
        }
    } catch (error) {
        console.error('Erreur route Heyzine:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la conversion'
        });
    }
});

/**
 * @route GET /api/heyzine/direct-url
 * @desc Génère un lien direct vers un flipbook (avec Client ID sécurisé)
 * @desc Format Heyzine: https://heyzine.com/api1?pdf={pdf url}&k={client id}
 * @desc La conversion démarre au premier accès, peut prendre du temps la première fois
 * @desc Options: ?title=...&subtitle=...&controls=1&template=...
 * @access Public
 */
router.get('/direct-url', (req, res) => {
    try {
        const { pdfUrl, title, subtitle, controls, template } = req.query;

        if (!pdfUrl) {
            return res.status(400).json({
                success: false,
                error: 'URL du PDF requise'
            });
        }

        // Valider que c'est bien une URL
        try {
            new URL(pdfUrl);
        } catch (e) {
            return res.status(400).json({
                success: false,
                error: 'URL invalide'
            });
        }

        // Options pour le flipbook
        const options = {};
        if (title) options.title = title;
        if (subtitle) options.subtitle = subtitle;
        if (controls !== undefined) options.showControls = controls === '1' || controls === 'true';
        if (template) options.template = template;

        // Générer l'URL avec le Client ID (côté serveur uniquement)
        // Format: https://heyzine.com/api1?pdf={pdf url}&k={client id}
        const directUrl = heyzineService.getFlipbookDirectUrl(pdfUrl, options);

        // Retourner l'URL (ne pas rediriger, laisser le frontend gérer)
        res.json({
            success: true,
            directUrl: directUrl,
            note: 'La conversion démarre au premier accès et peut prendre quelques instants'
        });
    } catch (error) {
        console.error('Erreur route Heyzine direct-url:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la génération du lien'
        });
    }
});

/**
 * @route POST /api/heyzine/convert-multiple
 * @desc Convertit plusieurs PDF en flipbooks
 * @access Public (peut être restreint si nécessaire)
 */
router.post('/convert-multiple', async (req, res) => {
    try {
        const { pdfUrls } = req.body;

        if (!pdfUrls || !Array.isArray(pdfUrls) || pdfUrls.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Liste d\'URLs de PDF requise'
            });
        }

        const results = await heyzineService.convertMultiplePdfs(pdfUrls);

        res.json({
            success: true,
            results: results
        });
    } catch (error) {
        console.error('Erreur route Heyzine convert-multiple:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la conversion multiple'
        });
    }
});

module.exports = router;


