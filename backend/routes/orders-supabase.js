/**
 * Routes de commandes utilisant Supabase directement
 * Remplace les routes Sequelize qui ne fonctionnent plus
 */

const express = require('express');
const router = express.Router();
const supabaseService = require('../services/supabaseService');
const emailService = require('../services/emailService');
const wavePaymentService = require('../services/wavePaymentService');
const FileValidator = require('../utils/fileValidator');
const fileSecurity = require('../utils/fileSecurity');
const { Order, File: FileModel } = require('../models/supabase'); // Modèles Supabase
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

/**
 * Sauvegarder un fichier base64 avec sécurité renforcée
 */
async function saveBase64FileSecure(base64Data, filename, orderId, type = 'photo') {
    // Valider le fichier avec vérification du contenu réel
    const validation = FileValidator.validateBase64File(base64Data, filename);
    
    if (!validation.valid) {
        throw new Error(`Erreur de validation: ${validation.errors.join(', ')}`);
    }

    const { mimeType, buffer, sanitizedFilename, requiresQuarantine } = validation;

    // ⚠️ Si le fichier nécessite une quarantaine, le mettre en quarantaine
    if (requiresQuarantine) {
        // Sauvegarder temporairement pour la quarantaine
        const tempPath = path.join(__dirname, '../../uploads', `temp-${crypto.randomUUID()}${path.extname(sanitizedFilename)}`);
        await fs.writeFile(tempPath, buffer);
        
        // Mettre en quarantaine via le système de sécurité
        await fileSecurity.quarantineFile(tempPath, 'Contenu suspect détecté lors de la validation');
        
        throw new Error('Fichier suspect détecté et mis en quarantaine. Contactez l\'administrateur.');
    }

    // Générer un nom de fichier unique et sécurisé
    const fileExtension = FileValidator.getExtensionFromMimeType(mimeType) || '.jpg';
    const uniqueFilename = `${crypto.randomUUID()}${fileExtension}`;
    const filePath = path.join(__dirname, '../../uploads', uniqueFilename);

    // Créer le dossier uploads s'il n'existe pas
    const uploadsDir = path.join(__dirname, '../../uploads');
    await fs.mkdir(uploadsDir, { recursive: true });

    // Sauvegarder le fichier
    await fs.writeFile(filePath, buffer);

    // Sauvegarder les métadonnées dans Supabase via le modèle
    if (supabaseService.isConfigured()) {
        try {
            await FileModel.create({
                originalName: sanitizedFilename,
                filename: uniqueFilename,
                mimetype: mimeType,
                size: buffer.length,
                path: filePath,
                url: `/api/files/${uniqueFilename}`, // URL sécurisée via API
                orderId: orderId,
                type: type
            });
        } catch (error) {
            console.warn('Impossible de sauvegarder les métadonnées dans Supabase:', error);
        }
    }

    return {
        filename: uniqueFilename,
        originalName: sanitizedFilename,
        url: `/api/files/${uniqueFilename}`,
        size: buffer.length,
        mimetype: mimeType
    };
}

/**
 * Route publique pour créer une commande via Supabase
 * Cette route remplace OrderController.createPublicOrder qui utilisait Sequelize
 * ⚠️ SÉCURITÉ: Validation stricte des fichiers uploadés
 */
router.post('/public', async (req, res) => {
    try {
        const orderData = req.body;
        
        // Générer un numéro de commande unique
        const orderNumber = `PM-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

        // Préparer les données pour le modèle Order
        const orderDataModel = {
            orderNumber: orderNumber,
            personName: orderData.personName,
            occasion: orderData.occasion,
            relationship: orderData.relationship,
            customerName: orderData.customerName || orderData.clientName,
            customerEmail: orderData.customerEmail || orderData.clientEmail,
            customerPhone: orderData.clientPhone || orderData.deliveryPhone,
            deliveryDate: orderData.deliveryDate,
            deliveryAddress: orderData.deliveryAddress,
            deliveryPhone: orderData.deliveryPhone,
            description: orderData.description || null,
            style: orderData.style || null,
            colors: orderData.colors || null,
            additionalInfo: orderData.additionalInfo || null,
            status: 'pending',
            paymentStatus: 'pending',
            basePrice: 25000.00,
            totalPrice: 25000.00,
            currency: 'XOF',
            metadata: orderData.metadata || {}
        };

        // Créer la commande via le modèle Order (AVANT les fichiers pour avoir l'ID)
        const order = await Order.create(orderDataModel);

        // Traiter les fichiers uploadés avec sécurité renforcée (APRÈS création de la commande)
        const uploadedFiles = Array.isArray(orderData.uploadedFiles) ? orderData.uploadedFiles : [];
        const coverPhoto = orderData.coverPhoto;
        const savedFiles = [];
        const fileErrors = [];

        // Traiter les fichiers uploadés
        for (const fileData of uploadedFiles) {
            if (fileData.data) {
                try {
                    const savedFile = await saveBase64FileSecure(
                        fileData.data,
                        fileData.name || 'photo.jpg',
                        order.id, // orderId disponible maintenant
                        'photo'
                    );
                    savedFiles.push(savedFile);
                } catch (fileError) {
                    fileErrors.push({
                        filename: fileData.name || 'photo.jpg',
                        error: fileError.message
                    });
                    console.error(`Erreur lors de la sauvegarde du fichier ${fileData.name}:`, fileError);
                }
            }
        }

        // Traiter la photo de couverture
        if (coverPhoto && coverPhoto.data) {
            try {
                const savedCover = await saveBase64FileSecure(
                    coverPhoto.data,
                    coverPhoto.name || 'cover.jpg',
                    order.id, // orderId disponible maintenant
                    'cover'
                );
                savedFiles.push(savedCover);
            } catch (coverError) {
                fileErrors.push({
                    filename: coverPhoto.name || 'cover.jpg',
                    error: coverError.message
                });
                console.error('Erreur lors de la sauvegarde de la couverture:', coverError);
            }
        }

        // Les fichiers sont déjà associés à la commande lors de leur création
        // Pas besoin de mise à jour supplémentaire

        // Créer le lien de paiement Wave
        const paymentLink = await wavePaymentService.createPaymentLink(
            {
                id: order.id,
                orderId: order.id,
                orderNumber: order.orderNumber,
                totalPrice: order.totalPrice || 25000,
                clientEmail: order.customerEmail,
                clientName: order.customerName
            },
            15000
        );

        // Mettre à jour la commande avec l'URL de paiement
        if (paymentLink?.paymentUrl) {
            order.paymentUrl = paymentLink.paymentUrl;
            await order.save();
        }

        // Envoyer l'email de confirmation via Brevo
        try {
            await emailService.sendOrderConfirmation(order.toJSON(), order.customerEmail);
        } catch (emailError) {
            console.error('Erreur lors de l\'envoi de l\'email:', emailError);
            // Ne pas faire échouer la commande si l'email échoue
        }

        // Envoyer l'email de notification à l'équipe
        try {
            await emailService.sendAdminOrderNotification({
                to: process.env.ORDER_ALERT_EMAIL || 'morak6@icloud.com',
                order: order.toJSON(),
                paymentUrl: paymentLink?.paymentUrl
            });
        } catch (emailError) {
            console.error('Erreur lors de l\'envoi de l\'email d\'équipe:', emailError);
        }

        res.status(201).json({
            success: true,
            message: 'Commande créée avec succès. Veuillez effectuer le paiement de l\'acompte de 15 000 FCFA pour confirmer.',
            data: {
                order: order.toJSON(),
                orderNumber: order.orderNumber,
                paymentUrl: paymentLink?.paymentUrl,
                paymentAmount: 15000,
                paymentRequired: true,
                files: savedFiles.map(f => ({
                    filename: f.filename,
                    url: f.url,
                    size: f.size
                })),
                ...(fileErrors.length > 0 && {
                    warnings: {
                        fileErrors,
                        message: `${fileErrors.length} fichier(s) n'ont pas pu être sauvegardés`
                    }
                })
            }
        });

    } catch (error) {
        console.error('Erreur lors de la création de la commande:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Erreur lors de la création de la commande',
            error: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

module.exports = router;



