const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs').promises;
const brevoService = require('./brevoService');

class EmailService {
    constructor() {
        this.transporter = null;
        this.initializeTransporter();
    }

    initializeTransporter() {
        // ⚠️ Gmail/Nodemailer désactivé - Utilisation de Brevo uniquement
        // Si Brevo est configuré, on n'initialise pas Nodemailer
        if (brevoService.isConfigured()) {
            console.log('ℹ️  Nodemailer/Gmail désactivé - Utilisation de Brevo uniquement');
            return;
        }

        // Fallback vers Nodemailer uniquement si Brevo n'est pas configuré
        if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.warn('⚠️  Variables d\'environnement email non configurées. Le service email ne fonctionnera pas.');
            return;
        }

        this.transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: parseInt(process.env.EMAIL_PORT) || 587,
            secure: process.env.EMAIL_PORT == 465,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });
    }

    // Vérifier la configuration email
    async verifyConnection() {
        // Si Brevo est configuré, on n'a pas besoin de vérifier Nodemailer
        if (brevoService.isConfigured()) {
            console.log('✅ Service email configuré avec succès (Brevo)');
            return true;
        }

        // Vérifier Nodemailer uniquement si Brevo n'est pas configuré
        try {
            if (!this.transporter) {
                console.warn('⚠️  Service email non initialisé. Vérifiez les variables d\'environnement.');
                return false;
            }
            await this.transporter.verify();
            console.log('✅ Service email configuré avec succès (Nodemailer)');
            return true;
        } catch (error) {
            console.error('❌ Erreur de configuration email:', error.message);
            console.warn('💡 Astuce: Configurez Brevo pour éviter cette erreur Gmail');
            return false;
        }
    }

    // Envoyer un email
    async sendEmail(to, subject, html, attachments = []) {
        try {
            if (!this.transporter) {
                console.warn(`⚠️  Tentative d'envoi d'email sans transporter initialisé. Email non envoyé à ${to}`);
                return { success: false, error: 'Service email non configuré' };
            }

            const mailOptions = {
                from: process.env.EMAIL_FROM || 'Peace Magazine <noreply@peacemagazine.ci>',
                to,
                subject,
                html,
                attachments
            };

            const result = await this.transporter.sendMail(mailOptions);
            console.log(`📧 Email envoyé à ${to}: ${result.messageId}`);
            return { success: true, messageId: result.messageId };
        } catch (error) {
            console.error('Erreur lors de l\'envoi de l\'email:', error);
            return { success: false, error: error.message };
        }
    }

    // Email de confirmation de commande
    async sendOrderConfirmation(order, clientEmail) {
        // Utiliser Brevo en priorité si disponible
        if (brevoService.isConfigured()) {
            try {
                console.log('📧 Envoi via Brevo...');
                const result = await brevoService.sendOrderConfirmation(order, clientEmail);
                if (result.success) {
                    console.log('✅ Email envoyé avec succès via Brevo');
                    return result;
                } else {
                    throw new Error(`Brevo a échoué: ${result.error}`);
                }
            } catch (error) {
                console.error('❌ Erreur Brevo:', error.message);
                throw new Error(`Impossible d'envoyer l'email via Brevo: ${error.message}`);
            }
        }

        // Fallback vers Nodemailer uniquement si Brevo n'est pas configuré
        if (!this.transporter) {
            throw new Error('Aucun service email configuré. Configurez Brevo ou Gmail/Nodemailer.');
        }

        console.log('📧 Envoi via Nodemailer (fallback)...');
        const subject = `Confirmation de commande - ${order.orderNumber}`;
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Confirmation de commande</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #F5C542, #FFB300); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .order-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
                    .highlight { color: #F5C542; font-weight: bold; }
                    .footer { text-align: center; margin-top: 30px; color: #666; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🎉 Commande Confirmée !</h1>
                        <p>Votre magazine personnalisé est en cours de création</p>
                    </div>
                    <div class="content">
                        <h2>Bonjour ${order.clientName},</h2>
                        <p>Nous avons bien reçu votre commande et nous sommes ravis de créer votre magazine personnalisé !</p>
                        
                        <div class="order-details">
                            <h3>📋 Détails de votre commande</h3>
                            <p><strong>Numéro de commande :</strong> <span class="highlight">${order.orderNumber}</span></p>
                            <p><strong>Personne célébrée :</strong> ${order.personName}</p>
                            <p><strong>Occasion :</strong> ${order.occasion}</p>
                            <p><strong>Date de livraison souhaitée :</strong> ${new Date(order.deliveryDate).toLocaleDateString('fr-FR')}</p>
                            <p><strong>Prix total :</strong> <span class="highlight">${order.totalPrice.toLocaleString()} FCFA</span></p>
                        </div>

                        <p style="background: #FFF3E0; padding: 15px; border-radius: 8px; border-left: 4px solid #F5C542; margin: 20px 0;">
                            <strong>✅ Paiement reçu</strong><br>
                            Nous avons bien reçu votre capture d'écran de paiement. Après vérification des informations, nous vous recontacterons dans les 24h pour finaliser votre commande.
                        </p>

                        <h3>🔄 Prochaines étapes</h3>
                        <ol>
                            <li><strong>Vérification (24h) :</strong> Notre équipe va vérifier votre paiement et examiner vos informations</li>
                            <li><strong>Contact :</strong> Nous vous recontacterons pour confirmer les détails</li>
                            <li><strong>Création (3-5 jours) :</strong> Design et mise en page de votre magazine</li>
                            <li><strong>Aperçu :</strong> Vous recevrez un aperçu pour validation</li>
                            <li><strong>Impression :</strong> Impression haute qualité sur papier premium</li>
                            <li><strong>Livraison :</strong> Envoi sécurisé à l'adresse fournie</li>
                        </ol>

                        <h3>📞 Besoin d'aide ?</h3>
                        <p>Notre équipe est à votre disposition :</p>
                        <p>📧 Email : <a href="mailto:morak6@icloud.com">morak6@icloud.com</a></p>
                        <p>📱 WhatsApp : <a href="https://wa.me/2250767660476">+225 07 67 66 04 76</a></p>
                    </div>
                    <div class="footer">
                        <p>Merci de votre confiance !<br>L'équipe Peace Magazine</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        return await this.sendEmail(clientEmail, subject, html);
    }

    // Email interne de notification de nouvelle commande
    async sendAdminOrderNotification(options = {}) {
        const {
            to = process.env.ORDER_ALERT_EMAIL || 'morak6@icloud.com',
            order,
            paymentUrl,
            fileLinks = [],
            attachments = [],
            attachmentsInfo = {},
            warnings = []
        } = options;

        if (!order) {
            console.warn('Tentative d\'envoi de notification sans commande.');
            return { success: false, error: 'order_data_missing' };
        }

        const html = this.buildAdminOrderHtml(order, {
            paymentUrl,
            fileLinks,
            attachmentsInfo,
            warnings
        });

        const subject = `🆕 Nouvelle commande - ${order.orderNumber}`;
        return await this.sendEmail(to, subject, html, attachments);
    }

    buildAdminOrderHtml(order, { paymentUrl, fileLinks = [], attachmentsInfo = {}, warnings = [] }) {
        const escape = (value) => this.escapeHtml(value);
        const metadata = order.metadata || {};
        const anecdotes = Array.isArray(order.anecdotes) ? order.anecdotes : [];
        const testimonials = Array.isArray(order.testimonials) ? order.testimonials : [];
        const deliveryDate = order.deliveryDate
            ? new Date(order.deliveryDate).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
            : 'Non communiqué';
        const fileRows = fileLinks.length
            ? fileLinks.map(file => `
                <tr>
                    <td style="padding:8px 12px;border:1px solid #eee;">${escape(file.filename || 'Sans nom')}</td>
                    <td style="padding:8px 12px;border:1px solid #eee;">${escape(file.type || '-')}</td>
                    <td style="padding:8px 12px;border:1px solid #eee;">${escape(file.size || '-')}</td>
                    <td style="padding:8px 12px;border:1px solid #eee;">
                        ${file.url ? `<a href="${escape(file.url)}" style="color:#2563EB;">Ouvrir</a>` : '—'}
                    </td>
                </tr>
            `).join('')
            : '';

        const fileSection = fileLinks.length
            ? `
                <table style="width:100%;border-collapse:collapse;margin-top:10px;">
                    <thead>
                        <tr style="background:#F3F4F6;">
                            <th style="text-align:left;padding:8px 12px;border:1px solid #eee;">Fichier</th>
                            <th style="text-align:left;padding:8px 12px;border:1px solid #eee;">Type</th>
                            <th style="text-align:left;padding:8px 12px;border:1px solid #eee;">Taille</th>
                            <th style="text-align:left;padding:8px 12px;border:1px solid #eee;">Lien</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${fileRows}
                    </tbody>
                </table>
            `
            : '<p style="margin:0;">Aucun fichier reçu via le formulaire.</p>';

        const skippedAttachments = attachmentsInfo.skipped || [];
        const attachmentNote = skippedAttachments.length
            ? `<p style="margin-top:10px;color:#B45309;"><strong>⚠️ Remarque :</strong> ${skippedAttachments.length} fichier(s) supplémentaire(s) n'ont pas été joints pour éviter de dépasser la limite d'email (${Math.round((attachmentsInfo.limit || 0) / (1024 * 1024)) || 20} MB).</p>`
            : '';

        const warningsHtml = warnings.length
            ? `
                <div style="background:#FEF3C7;padding:12px;border-radius:8px;margin-top:20px;">
                    <strong>Alertes fichiers :</strong>
                    <ul style="margin:10px 0 0 18px;padding:0;">
                        ${warnings.map(warning => `<li>${escape(warning.filename || 'Fichier')} : ${escape(warning.error || 'Erreur inconnue')}</li>`).join('')}
                    </ul>
                </div>
            `
            : '';

        const anecdotesHtml = anecdotes.length
            ? `<ol style="margin:10px 0 0 20px;">${anecdotes.map(item => `<li><strong>${escape(item.title || 'Sans titre')}</strong> — ${escape(item.content || '')}</li>`).join('')}</ol>`
            : '<p style="margin:0;">Pas d\'anecdotes fournies.</p>';

        const testimonialsHtml = testimonials.length
            ? `<ol style="margin:10px 0 0 20px;">${testimonials.map(item => `<li><strong>${escape(item.name || 'Anonyme')}</strong> (${escape(item.relationship || '-')}) — ${escape(item.message || '')}</li>`).join('')}</ol>`
            : '<p style="margin:0;">Pas de témoignages fournis.</p>';

        const paymentSection = paymentUrl
            ? `
                <p style="margin-top:0;">Acompte demandé : <strong>15 000 FCFA</strong></p>
                <a href="${escape(paymentUrl)}" style="display:inline-block;margin-top:10px;padding:12px 20px;background:#059669;color:white;text-decoration:none;border-radius:8px;">Ouvrir le lien de paiement</a>
            `
            : '<p>Aucun lien de paiement généré.</p>';

        return `
            <!DOCTYPE html>
            <html lang="fr">
            <head>
                <meta charset="utf-8">
                <title>Nouvelle commande Peace Magazine</title>
            </head>
            <body style="font-family:Arial,sans-serif;background:#f4f4f5;margin:0;padding:20px;color:#111827;">
                <div style="max-width:700px;margin:0 auto;background:white;border-radius:12px;overflow:hidden;box-shadow:0 10px 30px rgba(15,23,42,0.1);">
                    <div style="background:linear-gradient(135deg,#F5C542,#FFB300);padding:24px;color:white;">
                        <h2 style="margin:0;">Nouvelle commande reçue</h2>
                        <p style="margin:8px 0 0;">${escape(order.orderNumber)}</p>
                    </div>
                    <div style="padding:24px;">
                        <div style="margin-bottom:20px;">
                            <h3 style="margin:0 0 10px;">Commanditaire</h3>
                            <p style="margin:0;"><strong>${escape(order.clientName)}</strong></p>
                            <p style="margin:4px 0;">${escape(order.clientEmail)} — ${escape(order.clientPhone)}</p>
                        </div>
                        <div style="margin-bottom:20px;">
                            <h3 style="margin:0 0 10px;">Personne célébrée</h3>
                            <p style="margin:0;"><strong>${escape(order.personName)}</strong> (${escape(order.occasion)})</p>
                            <p style="margin:4px 0;">Lien avec le commanditaire : ${escape(order.relationship)}</p>
                            <p style="margin:4px 0;">Style souhaité : ${escape(order.style || 'Non précisé')}</p>
                            <p style="margin:4px 0;">Palette / couleurs : ${escape(order.colors || 'Non précisé')}</p>
                            <p style="margin:10px 0 0;">${escape(order.description)}</p>
                        </div>
                        <div style="margin-bottom:20px;">
                            <h3 style="margin:0 0 10px;">Livraison & planning</h3>
                            <p style="margin:0;">Date souhaitée : ${escape(deliveryDate)}</p>
                            <p style="margin:4px 0;">Adresse de livraison : ${escape(order.deliveryAddress)}</p>
                            <p style="margin:4px 0;">Mode d'envoi des photos : ${escape(metadata.photoDeliveryMode || 'Non précisé')}</p>
                            ${metadata.photoLink ? `<p style="margin:4px 0;">Lien/transfert photos : <a href="${escape(metadata.photoLink)}">${escape(metadata.photoLink)}</a></p>` : ''}
                        </div>
                        <div style="margin-bottom:20px;">
                            <h3 style="margin:0 0 10px;">Fichiers reçus (${fileLinks.length})</h3>
                            ${fileSection}
                            ${attachmentNote}
                        </div>
                        ${warningsHtml}
                        <div style="margin-bottom:20px;">
                            <h3 style="margin:0 0 10px;">Anecdotes (${anecdotes.length})</h3>
                            ${anecdotesHtml}
                        </div>
                        <div style="margin-bottom:20px;">
                            <h3 style="margin:0 0 10px;">Témoignages (${testimonials.length})</h3>
                            ${testimonialsHtml}
                        </div>
                        <div style="margin-bottom:20px;">
                            <h3 style="margin:0 0 10px;">Instructions complémentaires</h3>
                            <p style="margin:0;">${escape(order.additionalInfo || 'Aucune instruction supplémentaire')}</p>
                        </div>
                        <div style="margin-bottom:0;">
                            <h3 style="margin:0 0 10px;">Paiement</h3>
                            ${paymentSection}
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `;
    }

    escapeHtml(value) {
        if (value === undefined || value === null) {
            return '';
        }
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    // Email de contact
    async sendContactEmail(contactData) {
        const subject = `Nouveau message de contact - ${contactData.name}`;
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Nouveau message de contact</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #F5C542; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                    .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
                    .message-box { background: white; padding: 15px; border-left: 4px solid #F5C542; margin: 15px 0; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h2>📧 Nouveau message de contact</h2>
                    </div>
                    <div class="content">
                        <p><strong>Nom :</strong> ${contactData.name}</p>
                        <p><strong>Email :</strong> ${contactData.email}</p>
                        <p><strong>Date :</strong> ${new Date().toLocaleString('fr-FR')}</p>
                        
                        <div class="message-box">
                            <h4>Message :</h4>
                            <p>${contactData.message}</p>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `;

        return await this.sendEmail(process.env.EMAIL_FROM, subject, html);
    }

    // Email de nouveau lead
    async sendNewLeadNotification(lead) {
        const subject = `Nouveau lead - ${lead.name}`;
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Nouveau lead</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #059669; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                    .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
                    .score { background: #059669; color: white; padding: 10px; border-radius: 5px; display: inline-block; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h2>🎯 Nouveau lead qualifié</h2>
                    </div>
                    <div class="content">
                        <p><strong>Nom :</strong> ${lead.name}</p>
                        <p><strong>Email :</strong> ${lead.email || 'Non fourni'}</p>
                        <p><strong>Téléphone :</strong> ${lead.phone || 'Non fourni'}</p>
                        <p><strong>Occasion :</strong> ${lead.occasion || 'Non spécifiée'}</p>
                        <p><strong>Source :</strong> ${lead.source}</p>
                        <p><strong>Score :</strong> <span class="score">${lead.score}/100</span></p>
                        <p><strong>Date :</strong> ${new Date(lead.createdAt).toLocaleString('fr-FR')}</p>
                        
                        ${lead.message ? `
                            <div style="background: white; padding: 15px; border-left: 4px solid #059669; margin: 15px 0;">
                                <h4>Message :</h4>
                                <p>${lead.message}</p>
                            </div>
                        ` : ''}
                        
                        <p><strong>Action recommandée :</strong> Contacter dans les 24h pour maximiser les chances de conversion.</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        return await this.sendEmail(process.env.EMAIL_FROM, subject, html);
    }

    // Email de réinitialisation de mot de passe
    async sendPasswordResetEmail(user, resetToken) {
        const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
        const subject = 'Réinitialisation de votre mot de passe - Peace Magazine';
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Réinitialisation de mot de passe</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #dc3545; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                    .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
                    .button { background: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h2>🔐 Réinitialisation de mot de passe</h2>
                    </div>
                    <div class="content">
                        <p>Bonjour ${user.firstName},</p>
                        <p>Vous avez demandé la réinitialisation de votre mot de passe pour votre compte Peace Magazine.</p>
                        
                        <p>Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :</p>
                        
                        <a href="${resetUrl}" class="button">Réinitialiser mon mot de passe</a>
                        
                        <p><strong>Ce lien expire dans 1 heure.</strong></p>
                        
                        <p>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
                        
                        <p>L'équipe Peace Magazine</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        return await this.sendEmail(user.email, subject, html);
    }

    // Email de vérification d'email
    async sendEmailVerification(user, verificationToken) {
        const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
        const subject = 'Vérifiez votre adresse email - Peace Magazine';
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Vérification d'email</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #F5C542; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                    .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
                    .button { background: #F5C542; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h2>✅ Vérifiez votre email</h2>
                    </div>
                    <div class="content">
                        <p>Bonjour ${user.firstName},</p>
                        <p>Bienvenue chez Peace Magazine ! Pour activer votre compte, veuillez vérifier votre adresse email.</p>
                        
                        <a href="${verificationUrl}" class="button">Vérifier mon email</a>
                        
                        <p>Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :</p>
                        <p style="word-break: break-all; background: #e9ecef; padding: 10px; border-radius: 5px;">${verificationUrl}</p>
                        
                        <p>L'équipe Peace Magazine</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        return await this.sendEmail(user.email, subject, html);
    }

    // Email de notification de statut de commande
    async sendOrderStatusUpdate(order, statusText) {
        const subject = `Mise à jour de votre commande ${order.orderNumber}`;
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Mise à jour de commande</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #17a2b8; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                    .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h2>📦 Mise à jour de commande</h2>
                    </div>
                    <div class="content">
                        <p>Bonjour ${order.clientName},</p>
                        <p>Votre commande <strong>${order.orderNumber}</strong> a été mise à jour.</p>
                        
                        <p><strong>Nouveau statut :</strong> ${statusText}</p>
                        
                        <p>Vous pouvez suivre l'avancement de votre commande en nous contactant :</p>
                        <p>📧 Email : <a href="mailto:morak6@icloud.com">morak6@icloud.com</a></p>
                        <p>📱 WhatsApp : <a href="https://wa.me/2250767660476">+225 07 67 66 04 76</a></p>
                        
                        <p>L'équipe Peace Magazine</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        return await this.sendEmail(order.clientEmail, subject, html);
    }
}

module.exports = new EmailService();





