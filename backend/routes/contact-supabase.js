/**
 * Routes de contact utilisant Supabase directement
 */

const express = require('express');
const router = express.Router();
const { Contact } = require('../models/supabase');
const emailService = require('../services/emailService');

/**
 * Créer un message de contact
 */
router.post('/', async (req, res) => {
    try {
        const { name, email, message, source } = req.body;

        // Validation
        if (!name || !email || !message) {
            return res.status(400).json({
                success: false,
                message: 'Tous les champs sont requis (name, email, message)'
            });
        }

        // Créer le contact via le modèle
        const contact = await Contact.create({
            name,
            email,
            message,
            source: source || 'contact_form'
        });

        // Envoyer un email de notification (optionnel)
        try {
            await emailService.sendContactEmail({
                name: contact.name,
                email: contact.email,
                message: contact.message
            });
        } catch (emailError) {
            console.warn('Erreur lors de l\'envoi de l\'email de contact:', emailError);
            // Ne pas faire échouer la création du contact
        }

        res.status(201).json({
            success: true,
            message: 'Votre message a été envoyé avec succès. Nous vous répondrons dans les plus brefs délais.',
            data: contact.toJSON()
        });

    } catch (error) {
        console.error('Erreur lors de la création du contact:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Erreur lors de l\'envoi du message',
            error: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

module.exports = router;



