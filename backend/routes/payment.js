const express = require('express');
const router = express.Router();
const wavePaymentService = require('../services/wavePaymentService');
const emailService = require('../services/emailService');
const { Order, File: FileModel } = require('../models/supabase'); // Modèle Supabase
const FileValidator = require('../utils/fileValidator');
const fileSecurity = require('../utils/fileSecurity');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');

// Créer un lien de paiement Wave (utilise Supabase)
router.post('/create-link/:orderId', async (req, res) => {
    try {
        const { orderId } = req.params;
        const { amount } = req.body;

        // Récupérer la commande via le modèle Order
        const order = await Order.findByPk(orderId);
        
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Commande non trouvée'
            });
        }
        
        if (order.paymentStatus === 'paid') {
            return res.status(400).json({
                success: false,
                message: 'Cette commande est déjà payée'
            });
        }

        // Convertir en format attendu par wavePaymentService
        const orderData = {
            id: order.id,
            orderId: order.id,
            orderNumber: order.orderNumber,
            order_number: order.orderNumber,
            totalPrice: order.totalPrice || 25000,
            total_price: order.totalPrice || 25000,
            clientEmail: order.customerEmail,
            customer_email: order.customerEmail,
            clientName: order.customerName,
            customer_name: order.customerName
        };
        
        const result = await wavePaymentService.createPaymentLink(orderData, amount);
        
        if (result.success) {
            res.json({
                success: true,
                data: {
                    paymentUrl: result.paymentUrl,
                    amount: result.amount,
                    orderId: result.orderId,
                    orderNumber: result.orderNumber
                }
            });
        } else {
            res.status(400).json({
                success: false,
                message: 'Erreur lors de la création du lien de paiement',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Erreur lors de la création du lien de paiement:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur interne du serveur'
        });
    }
});

// Vérifier le statut d'un paiement
router.get('/verify/:orderId', async (req, res) => {
    try {
        const { orderId } = req.params;
        const result = await wavePaymentService.verifyPayment(orderId);
        
        if (result.success) {
            res.json({
                success: true,
                data: result
            });
        } else {
            res.status(400).json({
                success: false,
                message: 'Erreur lors de la vérification du paiement',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Erreur lors de la vérification du paiement:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur interne du serveur'
        });
    }
});

// Confirmer un paiement (nécessite preuve de paiement)
// ⚠️ SÉCURITÉ: Cette route nécessite une référence de paiement valide et un montant
router.post('/confirm/:orderId', async (req, res) => {
    try {
        const { orderId } = req.params;
        const { 
            paymentReference, 
            amount, 
            proofUrl, 
            confirmedBy, 
            notes,
            transactionToken // Token de transaction pour validation supplémentaire
        } = req.body;

        // ⚠️ SÉCURITÉ: Vérifications obligatoires
        if (!paymentReference || paymentReference.trim().length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Référence de paiement obligatoire pour confirmer le paiement',
                requiresReview: true,
                security: { missingReference: true }
            });
        }

        if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
            return res.status(400).json({
                success: false,
                error: 'Montant obligatoire et doit être supérieur à 0',
                requiresReview: true,
                security: { invalidAmount: true }
            });
        }

        const result = await wavePaymentService.confirmPayment(orderId, {
            paymentReference,
            amount,
            proofUrl,
            confirmedBy: confirmedBy || 'admin-api',
            notes,
            transactionToken // Passer le token pour validation
        });

        if (result.success) {
            res.json({
                success: true,
                message: result.message,
                data: result.order,
                security: result.security
            });
        } else {
            res.status(400).json({
                success: false,
                message: result.error,
                requiresReview: result.requiresReview || false
            });
        }
    } catch (error) {
        console.error('Erreur lors de la confirmation du paiement:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur interne du serveur'
        });
    }
});

// Confirmer le paiement avec capture d'écran (Wave ou Orange Money)
router.post('/confirm-screenshot', async (req, res) => {
    try {
        const { orderId, orderNumber, screenshot, paymentMethod, amount } = req.body;

        if (!orderId) {
            return res.status(400).json({
                success: false,
                message: 'ID de commande manquant'
            });
        }

        if (!screenshot || !screenshot.data) {
            return res.status(400).json({
                success: false,
                message: 'Capture d\'écran du paiement obligatoire'
            });
        }

        // Récupérer la commande
        const order = await Order.findByPk(orderId);
        
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Commande non trouvée'
            });
        }

        // Sauvegarder la capture d'écran
        let screenshotUrl = null;
        try {
            const validation = FileValidator.validateBase64File(screenshot.data, screenshot.name || 'screenshot.jpg');
            
            if (!validation.valid) {
                return res.status(400).json({
                    success: false,
                    message: `Erreur de validation de l'image: ${validation.errors.join(', ')}`
                });
            }

            const { mimeType, buffer, sanitizedFilename, requiresQuarantine } = validation;

            if (requiresQuarantine) {
                const tempPath = path.join(__dirname, '../../uploads', `temp-${crypto.randomUUID()}${path.extname(sanitizedFilename)}`);
                await fs.writeFile(tempPath, buffer);
                await fileSecurity.quarantineFile(tempPath, 'Contenu suspect détecté dans la capture de paiement');
                
                return res.status(400).json({
                    success: false,
                    message: 'Fichier suspect détecté. Contactez l\'administrateur.'
                });
            }

            const fileExtension = FileValidator.getExtensionFromMimeType(mimeType) || '.jpg';
            const uniqueFilename = `payment-${orderId}-${crypto.randomUUID()}${fileExtension}`;
            const filePath = path.join(__dirname, '../../uploads', uniqueFilename);

            const uploadsDir = path.join(__dirname, '../../uploads');
            await fs.mkdir(uploadsDir, { recursive: true });
            await fs.writeFile(filePath, buffer);

            screenshotUrl = `/api/files/${uniqueFilename}`;

            // Sauvegarder les métadonnées dans Supabase
            await FileModel.create({
                originalName: sanitizedFilename,
                filename: uniqueFilename,
                mimetype: mimeType,
                size: buffer.length,
                path: filePath,
                url: screenshotUrl,
                orderId: orderId,
                type: 'payment_screenshot'
            });
        } catch (fileError) {
            console.error('Erreur lors de la sauvegarde de la capture:', fileError);
            return res.status(500).json({
                success: false,
                message: 'Erreur lors de la sauvegarde de la capture d\'écran'
            });
        }

        // Mettre à jour la commande avec la capture et le statut
        const updateData = {
            payment_screenshot: screenshotUrl,
            payment_status: 'pending_verification',
            payment_method: paymentMethod || 'wave_or_orange_money',
            payment_amount: amount || 15000
        };

        await Order.update(orderId, updateData);

        // Récupérer la commande mise à jour
        const updatedOrder = await Order.findByPk(orderId);

        // Envoyer l'email de confirmation automatiquement
        try {
            const orderData = updatedOrder.toJSON ? updatedOrder.toJSON() : updatedOrder;
            await emailService.sendOrderConfirmation(orderData, orderData.customer_email || orderData.customerEmail);
            console.log('✅ Email de confirmation envoyé automatiquement');
        } catch (emailError) {
            console.error('❌ Erreur lors de l\'envoi de l\'email:', emailError);
            // Ne pas faire échouer la requête si l'email échoue
        }

        res.json({
            success: true,
            message: 'Capture d\'écran enregistrée avec succès. Un email de confirmation a été envoyé.',
            data: {
                orderId: orderId,
                orderNumber: orderNumber || order.orderNumber,
                screenshotUrl: screenshotUrl,
                emailSent: true
            }
        });
    } catch (error) {
        console.error('Erreur lors de la confirmation du paiement avec capture:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur interne du serveur'
        });
    }
});

// Annuler un paiement
router.post('/cancel/:orderId', async (req, res) => {
    try {
        const { orderId } = req.params;
        const { reason } = req.body;

        const result = await wavePaymentService.cancelPayment(orderId, reason);

        if (result.success) {
            res.json({
                success: true,
                message: result.message,
                data: result.order
            });
        } else {
            res.status(400).json({
                success: false,
                message: result.error
            });
        }
    } catch (error) {
        console.error('Erreur lors de l\'annulation du paiement:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur interne du serveur'
        });
    }
});

// Webhook Wave (si configuré)
// ⚠️ Note: Wave ne fournit pas de webhook officiel, cette route est pour un système personnalisé
router.post('/wave-webhook', async (req, res) => {
    try {
        const result = await wavePaymentService.handleWebhook(req.body);

        if (result.success) {
            res.json({
                success: true,
                message: result.message
            });
        } else {
            res.status(400).json({
                success: false,
                error: result.error
            });
        }
    } catch (error) {
        console.error('Erreur lors du traitement du webhook:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur interne du serveur'
        });
    }
});

module.exports = router;






