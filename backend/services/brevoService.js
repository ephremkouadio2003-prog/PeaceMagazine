const SibApiV3Sdk = require('@getbrevo/brevo');

/**
 * Service Brevo (ex-Sendinblue) pour l'envoi d'emails transactionnels
 * Utilisé pour les emails de confirmation de commande
 */
class BrevoService {
    constructor() {
        this.apiInstance = null;
        this.initialized = false;
        this.initialize();
    }

    initialize() {
        const apiKey = process.env.BREVO_API_KEY;
        
        if (!apiKey) {
            console.warn('⚠️  BREVO_API_KEY non configurée. Le service Brevo ne fonctionnera pas.');
            return;
        }

        try {
            // Configuration de l'API Brevo
            const defaultClient = SibApiV3Sdk.ApiClient.instance;
            const apiKeyAuth = defaultClient.authentications['api-key'];
            apiKeyAuth.apiKey = apiKey;

            // Instance de l'API Transactional Emails
            this.apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
            this.initialized = true;
            
            console.log('✅ Service Brevo initialisé avec succès');
        } catch (error) {
            console.error('❌ Erreur lors de l\'initialisation de Brevo:', error);
            this.initialized = false;
        }
    }

    /**
     * Envoyer un email transactionnel via Brevo
     * @param {Object} options - Options d'envoi
     * @param {string} options.to - Email du destinataire
     * @param {string} options.subject - Sujet de l'email
     * @param {string} options.htmlContent - Contenu HTML de l'email
     * @param {string} options.textContent - Contenu texte (optionnel)
     * @param {string} options.fromName - Nom de l'expéditeur (optionnel)
     * @param {string} options.fromEmail - Email de l'expéditeur (optionnel)
     * @param {Array} options.attachments - Pièces jointes (optionnel)
     * @returns {Promise<Object>} Résultat de l'envoi
     */
    async sendTransactionalEmail(options) {
        if (!this.initialized || !this.apiInstance) {
            console.warn('⚠️  Service Brevo non initialisé. Email non envoyé.');
            return { 
                success: false, 
                error: 'Service Brevo non configuré' 
            };
        }

        const {
            to,
            subject,
            htmlContent,
            textContent = null,
            fromName = process.env.BREVO_FROM_NAME || 'Peace Magazine',
            fromEmail = process.env.BREVO_FROM_EMAIL || 'morak6@icloud.com',
            attachments = []
        } = options;

        try {
            const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

            // Destinataire
            sendSmtpEmail.to = [{ email: to }];

            // Expéditeur
            sendSmtpEmail.sender = {
                name: fromName,
                email: fromEmail
            };

            // Sujet et contenu
            sendSmtpEmail.subject = subject;
            sendSmtpEmail.htmlContent = htmlContent;
            
            if (textContent) {
                sendSmtpEmail.textContent = textContent;
            }

            // Pièces jointes
            if (attachments && attachments.length > 0) {
                sendSmtpEmail.attachment = attachments.map(att => ({
                    name: att.filename || att.name || 'attachment',
                    content: att.content || att.data,
                    contentType: att.contentType || att.type || 'application/octet-stream'
                }));
            }

            // Envoyer l'email
            const result = await this.apiInstance.sendTransacEmail(sendSmtpEmail);
            
            console.log(`📧 Email Brevo envoyé à ${to}: ${result.messageId}`);
            
            return {
                success: true,
                messageId: result.messageId,
                provider: 'brevo'
            };

        } catch (error) {
            console.error('❌ Erreur lors de l\'envoi d\'email via Brevo:', error);
            
            // Gérer les erreurs spécifiques de Brevo
            let errorMessage = 'Erreur inconnue';
            if (error.response && error.response.body) {
                errorMessage = error.response.body.message || JSON.stringify(error.response.body);
            } else if (error.message) {
                errorMessage = error.message;
            }

            return {
                success: false,
                error: errorMessage,
                provider: 'brevo'
            };
        }
    }

    /**
     * Envoyer un email de confirmation de commande
     * @param {Object} order - Données de la commande
     * @param {string} clientEmail - Email du client
     * @returns {Promise<Object>} Résultat de l'envoi
     */
    async sendOrderConfirmation(order, clientEmail) {
        const subject = `Confirmation de commande - ${order.orderNumber}`;
        
        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Confirmation de commande</title>
                <style>
                    body { 
                        font-family: Arial, sans-serif; 
                        line-height: 1.6; 
                        color: #333; 
                        margin: 0;
                        padding: 0;
                        background-color: #f4f4f4;
                    }
                    .container { 
                        max-width: 600px; 
                        margin: 0 auto; 
                        padding: 20px; 
                    }
                    .header { 
                        background: linear-gradient(135deg, #F5C542, #FFB300); 
                        color: white; 
                        padding: 30px; 
                        text-align: center; 
                        border-radius: 10px 10px 0 0; 
                    }
                    .content { 
                        background: #f9f9f9; 
                        padding: 30px; 
                        border-radius: 0 0 10px 10px; 
                    }
                    .order-details { 
                        background: white; 
                        padding: 20px; 
                        border-radius: 8px; 
                        margin: 20px 0; 
                        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    }
                    .highlight { 
                        color: #F5C542; 
                        font-weight: bold; 
                    }
                    .footer { 
                        text-align: center; 
                        margin-top: 30px; 
                        color: #666; 
                        font-size: 0.9rem;
                    }
                    .button {
                        display: inline-block;
                        padding: 12px 24px;
                        background: #F5C542;
                        color: #1A1A1A;
                        text-decoration: none;
                        border-radius: 6px;
                        font-weight: 600;
                        margin: 10px 0;
                    }
                    .button:hover {
                        background: #FFB300;
                    }
                    ul {
                        margin: 15px 0;
                        padding-left: 20px;
                    }
                    li {
                        margin: 8px 0;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1 style="margin: 0;">🎉 Commande Confirmée !</h1>
                        <p style="margin: 10px 0 0;">Votre magazine personnalisé est en cours de création</p>
                    </div>
                    <div class="content">
                        <h2 style="color: #1A1A1A;">Bonjour ${this.escapeHtml(order.clientName || 'Client')},</h2>
                        <p>Nous avons bien reçu votre commande et nous sommes ravis de créer votre magazine personnalisé !</p>
                        
                        <div class="order-details">
                            <h3 style="color: #1A1A1A; margin-top: 0;">📋 Détails de votre commande</h3>
                            <p><strong>Numéro de commande :</strong> <span class="highlight">${this.escapeHtml(order.orderNumber)}</span></p>
                            <p><strong>Personne célébrée :</strong> ${this.escapeHtml(order.personName || 'Non spécifié')}</p>
                            <p><strong>Occasion :</strong> ${this.escapeHtml(order.occasion || 'Non spécifiée')}</p>
                            ${order.deliveryDate ? `<p><strong>Date de livraison souhaitée :</strong> ${new Date(order.deliveryDate).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>` : ''}
                            ${order.totalPrice ? `<p><strong>Prix total :</strong> <span class="highlight">${order.totalPrice.toLocaleString('fr-FR')} FCFA</span></p>` : ''}
                        </div>

                        <div style="background: #FFF3E0; padding: 15px; border-radius: 8px; border-left: 4px solid #F5C542; margin: 20px 0;">
                            <strong>✅ Paiement reçu</strong><br>
                            Nous avons bien reçu votre capture d'écran de paiement. Après vérification des informations, nous vous recontacterons dans les 24h pour finaliser votre commande.
                        </div>

                        <h3 style="color: #1A1A1A;">🔄 Prochaines étapes</h3>
                        <ol style="margin: 15px 0; padding-left: 20px;">
                            <li><strong>Vérification (24h) :</strong> Notre équipe va vérifier votre paiement et examiner vos informations</li>
                            <li><strong>Contact :</strong> Nous vous recontacterons pour confirmer les détails</li>
                            <li><strong>Création (3-5 jours) :</strong> Design et mise en page de votre magazine</li>
                            <li><strong>Aperçu :</strong> Vous recevrez un aperçu pour validation</li>
                            <li><strong>Impression :</strong> Impression haute qualité sur papier premium</li>
                            <li><strong>Livraison :</strong> Envoi sécurisé à l'adresse fournie</li>
                        </ol>

                        <h3 style="color: #1A1A1A;">📞 Besoin d'aide ?</h3>
                        <p>Notre équipe est à votre disposition :</p>
                        <p>📧 Email : <a href="mailto:morak6@icloud.com" style="color: #F5C542;">morak6@icloud.com</a></p>
                        <p>📱 WhatsApp : <a href="https://wa.me/2250767660476" style="color: #F5C542;">+225 07 67 66 04 76</a></p>
                    </div>
                    <div class="footer">
                        <p>Merci de votre confiance !<br><strong>L'équipe Peace Magazine</strong></p>
                        <p style="font-size: 0.8rem; margin-top: 20px; color: #999;">
                            Cet email a été envoyé automatiquement. Merci de ne pas y répondre directement.
                        </p>
                    </div>
                </div>
            </body>
            </html>
        `;

        const textContent = `
Confirmation de commande - ${order.orderNumber}

Bonjour ${order.clientName || 'Client'},

Nous avons bien reçu votre commande et nous sommes ravis de créer votre magazine personnalisé !

Détails de votre commande :
- Numéro de commande : ${order.orderNumber}
- Personne célébrée : ${order.personName || 'Non spécifié'}
- Occasion : ${order.occasion || 'Non spécifiée'}
${order.deliveryDate ? `- Date de livraison souhaitée : ${new Date(order.deliveryDate).toLocaleDateString('fr-FR')}` : ''}
${order.totalPrice ? `- Prix total : ${order.totalPrice.toLocaleString('fr-FR')} FCFA` : ''}

✅ Paiement reçu
Nous avons bien reçu votre capture d'écran de paiement. Après vérification des informations, nous vous recontacterons dans les 24h pour finaliser votre commande.

Prochaines étapes :
1. Vérification (24h) : Notre équipe va vérifier votre paiement et examiner vos informations
2. Contact : Nous vous recontacterons pour confirmer les détails
3. Création (3-5 jours) : Design et mise en page de votre magazine
4. Aperçu : Vous recevrez un aperçu pour validation
5. Impression : Impression haute qualité sur papier premium
6. Livraison : Envoi sécurisé à l'adresse fournie

Besoin d'aide ?
Email : morak6@icloud.com
WhatsApp : +225 07 67 66 04 76

Merci de votre confiance !
L'équipe Peace Magazine
        `;

        return await this.sendTransactionalEmail({
            to: clientEmail,
            subject,
            htmlContent,
            textContent,
            fromName: 'Peace Magazine',
            fromEmail: process.env.BREVO_FROM_EMAIL || 'morak6@icloud.com'
        });
    }

    /**
     * Échapper les caractères HTML pour éviter les injections
     */
    escapeHtml(text) {
        if (!text) return '';
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    /**
     * Vérifier la configuration du service
     */
    isConfigured() {
        return this.initialized && this.apiInstance !== null;
    }
}

module.exports = new BrevoService();







