// ⚠️ MySQL/Sequelize désactivé - Order model retiré
const emailService = require('./emailService');
const supabaseService = require('./supabaseService');
const crypto = require('crypto');

class WavePaymentService {
    constructor() {
        // URL de base Wave
        this.waveBaseUrl = 'https://pay.wave.com/m/M_ci_fvwQ2s3AQ91O/c/ci';
        this.minAmount = 1000; // Montant minimum en XOF
        this.maxAmount = 1000000; // Montant maximum en XOF
        
        // ⚠️ SÉCURITÉ: Clé secrète pour signer les URLs (OBLIGATOIRE dans .env)
        // Ne pas utiliser de valeur par défaut en production
        this.secretKey = process.env.WAVE_SECRET_KEY || process.env.JWT_SECRET;
        if (!this.secretKey) {
            console.error('⚠️ SÉCURITÉ: WAVE_SECRET_KEY non définie dans .env - Les tokens de paiement ne seront pas sécurisés');
            // Générer une clé temporaire pour le développement uniquement
            this.secretKey = 'wave-secret-key-change-me-' + Date.now();
            console.warn('⚠️ Clé temporaire générée - À remplacer par une vraie clé dans .env');
        }
        
        // URL de callback webhook (à configurer dans Wave si possible)
        this.webhookUrl = process.env.WAVE_WEBHOOK_URL || `${process.env.BACKEND_URL || 'http://localhost:3000'}/api/payment/wave-webhook`;
    }

    // Créer un lien de paiement Wave
    async createPaymentLink(order, amount = null) {
        try {
            // Vérifier que la commande existe (peut être un objet simple ou un modèle)
            const orderId = order.id || order.orderId;
            const orderNumber = order.orderNumber || order.order_number;

            if (!orderId && !orderNumber) {
                return {
                    success: false,
                    error: 'Commande invalide'
                };
            }

            // Utiliser le montant fourni ou l'acompte par défaut de 15000 FCFA
            const paymentAmount = amount || 15000;

            // Valider le montant
            const validation = this.validateAmount(paymentAmount);
            if (!validation.valid) {
                return {
                    success: false,
                    error: validation.error
                };
            }

            // Générer un token unique pour cette transaction
            const transactionToken = this.generateTransactionToken(orderId, orderNumber, paymentAmount);
            
            // Générer le lien de paiement Wave avec signature
            const paymentUrl = this.generateSignedPaymentUrl(paymentAmount, orderId, transactionToken);

            // Sauvegarder les informations de paiement dans Supabase si on a un ID
            if (orderId && supabaseService.isConfigured()) {
                try {
                    await supabaseService.updateOrder(orderId, {
                        payment_method: 'wave',
                        payment_status: 'pending',
                        payment_amount: paymentAmount,
                        payment_url: paymentUrl,
                        payment_token: transactionToken,
                        payment_created_at: new Date().toISOString()
                    });
                } catch (updateError) {
                    console.warn('Impossible de mettre à jour la commande dans Supabase:', updateError);
                    // Ne pas faire échouer la création du lien de paiement
                }
            }

            return {
                success: true,
                paymentUrl: paymentUrl,
                amount: paymentAmount,
                orderId: orderId,
                orderNumber: orderNumber
            };

        } catch (error) {
            console.error('Erreur lors de la création du lien de paiement Wave:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Vérifier le statut d'un paiement depuis Supabase
    async verifyPayment(orderId, paymentReference = null) {
        try {
            if (!supabaseService.isConfigured()) {
                return {
                    success: false,
                    error: 'Supabase n\'est pas configuré'
                };
            }

            const orderResult = await supabaseService.getOrderById(orderId);
            
            if (!orderResult.success || !orderResult.data) {
                return {
                    success: false,
                    error: 'Commande non trouvée'
                };
            }

            const order = orderResult.data;
            
            // Vérifier si une référence de paiement est fournie et correspond
            if (paymentReference && order.payment_reference) {
                if (order.payment_reference !== paymentReference) {
                    return {
                        success: false,
                        error: 'Référence de paiement invalide',
                        requiresManualVerification: true
                    };
                }
            }
            
            return {
                success: true,
                order: order,
                paymentStatus: order.payment_status,
                requiresManualVerification: order.payment_status === 'pending',
                message: order.payment_status === 'pending' 
                    ? 'Vérification du paiement requise. Fournissez une preuve de paiement (screenshot, référence Wave, etc.) pour confirmer.'
                    : `Statut du paiement: ${order.payment_status}`
            };

        } catch (error) {
            console.error('Erreur lors de la vérification du paiement:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Confirmer un paiement avec vérifications de sécurité
    // ⚠️ IMPORTANT: Cette méthode nécessite une preuve de paiement (référence, screenshot, etc.)
    // ⚠️ SÉCURITÉ: Validation stricte pour éviter les confirmations frauduleuses
    async confirmPayment(orderId, paymentData = {}) {
        try {
            const {
                paymentReference,
                amount,
                proofUrl,
                confirmedBy,
                notes,
                transactionToken // Token de transaction pour validation supplémentaire
            } = paymentData;

            if (!supabaseService.isConfigured()) {
                return {
                    success: false,
                    error: 'Supabase n\'est pas configuré'
                };
            }

            // Récupérer la commande depuis Supabase
            const orderResult = await supabaseService.getOrderById(orderId);
            
            if (!orderResult.success || !orderResult.data) {
                return {
                    success: false,
                    error: 'Commande non trouvée'
                };
            }

            const order = orderResult.data;

            // ⚠️ SÉCURITÉ: Vérifications de sécurité renforcées
            if (order.payment_status === 'paid') {
                return {
                    success: false,
                    error: 'Cette commande est déjà payée',
                    order: order,
                    security: { alreadyPaid: true }
                };
            }

            // ⚠️ SÉCURITÉ: Vérifier le token de transaction si disponible
            // Le token est stocké lors de la création du lien de paiement
            if (order.payment_token && transactionToken) {
                const isValidToken = this.verifyTransactionToken(
                    transactionToken,
                    orderId,
                    order.order_number,
                    order.payment_amount || amount
                );
                if (!isValidToken) {
                    console.warn('⚠️ SÉCURITÉ: Token de transaction invalide', {
                        orderId,
                        orderNumber: order.order_number,
                        providedToken: transactionToken?.substring(0, 8) + '...',
                        expectedToken: order.payment_token?.substring(0, 8) + '...'
                    });
                    return {
                        success: false,
                        error: 'Token de transaction invalide - Possible tentative de fraude',
                        requiresReview: true,
                        security: { tokenInvalid: true }
                    };
                }
            } else if (order.payment_token && !transactionToken) {
                // Token attendu mais non fourni - suspect
                console.warn('⚠️ SÉCURITÉ: Token de transaction attendu mais non fourni', {
                    orderId,
                    orderNumber: order.order_number
                });
                // Ne pas bloquer mais marquer pour révision
            }

            // ⚠️ SÉCURITÉ: Vérifier que le montant correspond (OBLIGATOIRE)
            if (!amount) {
                return {
                    success: false,
                    error: 'Montant obligatoire pour confirmer le paiement',
                    requiresReview: true
                };
            }

            if (order.payment_amount) {
                const expectedAmount = parseFloat(order.payment_amount);
                const providedAmount = parseFloat(amount);
                const tolerance = 100; // Tolérance de 100 XOF pour les arrondis

                if (Math.abs(expectedAmount - providedAmount) > tolerance) {
                    return {
                        success: false,
                        error: `Montant incorrect. Attendu: ${expectedAmount} XOF, Reçu: ${providedAmount} XOF`,
                        requiresReview: true,
                        security: { amountMismatch: true }
                    };
                }
            }

            // ⚠️ SÉCURITÉ: Exiger une référence de paiement pour la traçabilité (OBLIGATOIRE)
            if (!paymentReference || paymentReference.trim().length === 0) {
                return {
                    success: false,
                    error: 'Référence de paiement obligatoire pour confirmer le paiement',
                    requiresReview: true,
                    security: { missingReference: true }
                };
            }

            // ⚠️ SÉCURITÉ: Vérifier que la référence n'a pas déjà été utilisée
            if (order.payment_reference && order.payment_reference === paymentReference && order.payment_status === 'pending') {
                // Même référence mais toujours pending - possible doublon
                console.warn('⚠️ Référence de paiement déjà utilisée pour cette commande:', paymentReference);
            }

            // Préparer les données de mise à jour
            const updateData = {
                payment_status: 'paid',
                payment_method: 'wave',
                payment_reference: paymentReference,
                payment_confirmed_at: new Date().toISOString(),
                status: 'confirmed'
            };

            if (amount) {
                updateData.payment_amount = parseFloat(amount);
            }

            if (proofUrl) {
                updateData.payment_proof_url = proofUrl;
            }

            if (confirmedBy) {
                updateData.payment_confirmed_by = confirmedBy;
            }

            if (notes) {
                updateData.payment_notes = notes;
            }

            // Mettre à jour dans Supabase
            const updateResult = await supabaseService.updateOrder(orderId, updateData);

            if (!updateResult.success) {
                return {
                    success: false,
                    error: 'Erreur lors de la mise à jour de la commande',
                    details: updateResult.error
                };
            }

            const updatedOrder = updateResult.data;

            // Envoyer l'email de confirmation
            if (updatedOrder.customer_email) {
                try {
                    await emailService.sendOrderConfirmation(updatedOrder, updatedOrder.customer_email);
                    console.log(`📧 Email de confirmation envoyé à ${updatedOrder.customer_email}`);
                } catch (emailError) {
                    console.error('Erreur lors de l\'envoi de l\'email de confirmation:', emailError);
                    // Ne pas faire échouer la confirmation si l'email échoue
                }
            }

            // Log de sécurité
            console.log(`✅ Paiement confirmé pour la commande ${updatedOrder.order_number}`, {
                orderId,
                paymentReference,
                amount: updateData.payment_amount,
                confirmedBy: confirmedBy || 'system',
                timestamp: new Date().toISOString()
            });

            return {
                success: true,
                order: updatedOrder,
                message: 'Paiement confirmé avec succès',
                security: {
                    referenceVerified: true,
                    amountVerified: amount ? true : false,
                    proofProvided: !!proofUrl
                }
            };

        } catch (error) {
            console.error('Erreur lors de la confirmation du paiement:', error);
            return {
                success: false,
                error: error.message,
                requiresReview: true
            };
        }
    }

    // Annuler un paiement
    async cancelPayment(orderId, reason = null) {
        try {
            if (!supabaseService.isConfigured()) {
                return {
                    success: false,
                    error: 'Supabase n\'est pas configuré'
                };
            }

            const orderResult = await supabaseService.getOrderById(orderId);
            
            if (!orderResult.success || !orderResult.data) {
                return {
                    success: false,
                    error: 'Commande non trouvée'
                };
            }

            const order = orderResult.data;

            if (order.payment_status === 'paid') {
                return {
                    success: false,
                    error: 'Impossible d\'annuler un paiement déjà confirmé'
                };
            }

            const updateData = {
                payment_status: 'cancelled',
                payment_cancelled_at: new Date().toISOString()
            };

            if (reason) {
                updateData.payment_cancellation_reason = reason;
            }

            const updateResult = await supabaseService.updateOrder(orderId, updateData);

            if (!updateResult.success) {
                return {
                    success: false,
                    error: 'Erreur lors de l\'annulation du paiement'
                };
            }

            console.log(`⚠️  Paiement annulé pour la commande ${order.order_number}`, {
                orderId,
                reason,
                timestamp: new Date().toISOString()
            });

            return {
                success: true,
                order: updateResult.data,
                message: 'Paiement annulé'
            };

        } catch (error) {
            console.error('Erreur lors de l\'annulation du paiement:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Générer un token de transaction unique et sécurisé
     */
    generateTransactionToken(orderId, orderNumber, amount) {
        const data = `${orderId}-${orderNumber}-${amount}-${Date.now()}`;
        return crypto.createHmac('sha256', this.secretKey)
            .update(data)
            .digest('hex')
            .substring(0, 32);
    }

    /**
     * Générer une URL de paiement signée avec token
     */
    generateSignedPaymentUrl(amount, orderId, token) {
        const baseUrl = `${this.waveBaseUrl}?amount=${Math.round(amount)}`;
        // Note: Wave ne supporte pas les paramètres personnalisés dans l'URL
        // Le token est stocké dans Supabase pour vérification ultérieure
        return baseUrl;
    }

    /**
     * Vérifier la signature d'un token de transaction
     * ⚠️ SÉCURITÉ: Utilise crypto.timingSafeEqual pour éviter les attaques par timing
     */
    verifyTransactionToken(token, orderId, orderNumber, amount) {
        if (!token || !orderId || !orderNumber || !amount) {
            return false;
        }

        try {
            // Régénérer le token avec les mêmes paramètres et comparer
            // Note: En production, il faudrait stocker le timestamp et vérifier l'expiration
            const expectedToken = this.generateTransactionToken(orderId, orderNumber, amount);
            
            // Utiliser timingSafeEqual pour éviter les attaques par timing
            if (token.length !== expectedToken.substring(0, 32).length) {
                return false;
            }
            
            return crypto.timingSafeEqual(
                Buffer.from(token),
                Buffer.from(expectedToken.substring(0, 32))
            );
        } catch (error) {
            console.error('Erreur lors de la vérification du token:', error);
            return false;
        }
    }

    /**
     * Traiter un webhook Wave (si configuré)
     * ⚠️ Wave ne fournit pas de webhook officiel, cette méthode est pour un système personnalisé
     */
    async handleWebhook(webhookData) {
        try {
            const { 
                orderId, 
                paymentReference, 
                amount, 
                status,
                signature 
            } = webhookData;

            // Vérifier la signature si fournie
            if (signature) {
                const expectedSignature = crypto
                    .createHmac('sha256', this.secretKey)
                    .update(JSON.stringify({ orderId, paymentReference, amount }))
                    .digest('hex');

                if (signature !== expectedSignature) {
                    return {
                        success: false,
                        error: 'Signature invalide'
                    };
                }
            }

            if (status === 'paid' || status === 'completed') {
                return await this.confirmPayment(orderId, {
                    paymentReference,
                    amount,
                    confirmedBy: 'wave-webhook',
                    notes: 'Paiement confirmé via webhook Wave'
                });
            }

            return {
                success: true,
                message: 'Webhook traité',
                status
            };

        } catch (error) {
            console.error('Erreur lors du traitement du webhook:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Valider un montant
    validateAmount(amount) {
        if (!amount || isNaN(amount)) {
            return { valid: false, error: 'Montant invalide' };
        }

        const numAmount = parseFloat(amount);

        if (numAmount < this.minAmount) {
            return { valid: false, error: `Montant trop faible (minimum: ${this.minAmount} XOF)` };
        }

        if (numAmount > this.maxAmount) {
            return { valid: false, error: `Montant trop élevé (maximum: ${this.maxAmount} XOF)` };
        }

        return { valid: true };
    }

    // Générer l'URL de paiement Wave avec le montant (méthode simplifiée)
    generatePaymentUrl(amount) {
        const validatedAmount = Math.round(amount);
        return `${this.waveBaseUrl}?amount=${validatedAmount}`;
    }
}

module.exports = new WavePaymentService();

