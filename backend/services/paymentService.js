const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { Order } = require('../models');

class PaymentService {
    constructor() {
        this.stripe = stripe;
    }

    // Créer une session de paiement
    async createPaymentSession(order) {
        try {
            const session = await this.stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                line_items: [
                    {
                        price_data: {
                            currency: 'xof',
                            product_data: {
                                name: `Magazine personnalisé - ${order.personName}`,
                                description: `Magazine de luxe pour ${order.occasion} - ${order.orderNumber}`,
                                images: order.coverPhoto ? [order.coverPhoto] : []
                            },
                            unit_amount: Math.round(order.totalPrice * 100), // Convertir en centimes
                        },
                        quantity: 1,
                    },
                ],
                mode: 'payment',
                success_url: `${process.env.FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: `${process.env.FRONTEND_URL}/payment/cancel?order_id=${order.id}`,
                metadata: {
                    orderId: order.id,
                    orderNumber: order.orderNumber,
                    clientEmail: order.clientEmail
                },
                customer_email: order.clientEmail,
                billing_address_collection: 'required',
                shipping_address_collection: {
                    allowed_countries: ['CI', 'FR', 'SN', 'ML', 'BF', 'NE', 'TD', 'CM', 'CF', 'CG', 'CD', 'GA', 'GQ', 'ST'],
                }
            });

            return {
                success: true,
                sessionId: session.id,
                url: session.url
            };
        } catch (error) {
            console.error('Erreur lors de la création de la session de paiement:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Traiter le webhook Stripe
    async handleWebhook(req, res) {
        const sig = req.headers['stripe-signature'];
        let event;

        try {
            event = this.stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
        } catch (err) {
            console.error('Erreur de signature webhook:', err.message);
            return res.status(400).send(`Webhook Error: ${err.message}`);
        }

        try {
            switch (event.type) {
                case 'checkout.session.completed':
                    await this.handleCheckoutSessionCompleted(event.data.object);
                    break;
                case 'payment_intent.succeeded':
                    await this.handlePaymentSucceeded(event.data.object);
                    break;
                case 'payment_intent.payment_failed':
                    await this.handlePaymentFailed(event.data.object);
                    break;
                case 'charge.dispute.created':
                    await this.handleChargeDispute(event.data.object);
                    break;
                default:
                    console.log(`Événement non géré: ${event.type}`);
            }

            res.json({ received: true });
        } catch (error) {
            console.error('Erreur lors du traitement du webhook:', error);
            res.status(500).json({ error: 'Erreur interne du serveur' });
        }
    }

    // Gérer la session de paiement complétée
    async handleCheckoutSessionCompleted(session) {
        try {
            const orderId = session.metadata.orderId;
            const order = await Order.findByPk(orderId);

            if (!order) {
                console.error(`Commande non trouvée: ${orderId}`);
                return;
            }

            // Mettre à jour le statut de paiement
            order.paymentStatus = 'paid';
            order.paymentMethod = 'stripe';
            order.paymentId = session.payment_intent;
            order.status = 'confirmed';
            order.confirmedAt = new Date();

            await order.save();

            console.log(`Paiement confirmé pour la commande ${order.orderNumber}`);

            // TODO: Envoyer email de confirmation
            // await emailService.sendOrderConfirmation(order, order.clientEmail);

        } catch (error) {
            console.error('Erreur lors du traitement de la session complétée:', error);
        }
    }

    // Gérer le paiement réussi
    async handlePaymentSucceeded(paymentIntent) {
        try {
            const order = await Order.findOne({
                where: { paymentId: paymentIntent.id }
            });

            if (!order) {
                console.error(`Commande non trouvée pour le paiement: ${paymentIntent.id}`);
                return;
            }

            order.paymentStatus = 'paid';
            order.status = 'confirmed';
            order.confirmedAt = new Date();

            await order.save();

            console.log(`Paiement confirmé pour la commande ${order.orderNumber}`);

        } catch (error) {
            console.error('Erreur lors du traitement du paiement réussi:', error);
        }
    }

    // Gérer le paiement échoué
    async handlePaymentFailed(paymentIntent) {
        try {
            const order = await Order.findOne({
                where: { paymentId: paymentIntent.id }
            });

            if (!order) {
                console.error(`Commande non trouvée pour le paiement échoué: ${paymentIntent.id}`);
                return;
            }

            order.paymentStatus = 'failed';
            await order.save();

            console.log(`Paiement échoué pour la commande ${order.orderNumber}`);

            // TODO: Envoyer email d'échec de paiement

        } catch (error) {
            console.error('Erreur lors du traitement du paiement échoué:', error);
        }
    }

    // Gérer les litiges
    async handleChargeDispute(dispute) {
        try {
            const order = await Order.findOne({
                where: { paymentId: dispute.payment_intent }
            });

            if (!order) {
                console.error(`Commande non trouvée pour le litige: ${dispute.payment_intent}`);
                return;
            }

            // Marquer la commande comme litigieuse
            order.paymentStatus = 'disputed';
            order.internalNotes = `Litige Stripe: ${dispute.reason} - ${dispute.status}`;
            await order.save();

            console.log(`Litige créé pour la commande ${order.orderNumber}: ${dispute.reason}`);

            // TODO: Notifier l'équipe du litige

        } catch (error) {
            console.error('Erreur lors du traitement du litige:', error);
        }
    }

    // Créer un remboursement
    async createRefund(paymentIntentId, amount = null, reason = 'requested_by_customer') {
        try {
            const refundData = {
                payment_intent: paymentIntentId,
                reason: reason
            };

            if (amount) {
                refundData.amount = Math.round(amount * 100); // Convertir en centimes
            }

            const refund = await this.stripe.refunds.create(refundData);

            // Mettre à jour la commande
            const order = await Order.findOne({
                where: { paymentId: paymentIntentId }
            });

            if (order) {
                order.paymentStatus = 'refunded';
                order.internalNotes = `Remboursement créé: ${refund.id} - ${reason}`;
                await order.save();
            }

            return {
                success: true,
                refundId: refund.id,
                amount: refund.amount / 100,
                status: refund.status
            };

        } catch (error) {
            console.error('Erreur lors de la création du remboursement:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Récupérer les détails d'un paiement
    async getPaymentDetails(paymentIntentId) {
        try {
            const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
            
            return {
                success: true,
                payment: {
                    id: paymentIntent.id,
                    amount: paymentIntent.amount / 100,
                    currency: paymentIntent.currency,
                    status: paymentIntent.status,
                    created: new Date(paymentIntent.created * 1000),
                    description: paymentIntent.description,
                    metadata: paymentIntent.metadata
                }
            };

        } catch (error) {
            console.error('Erreur lors de la récupération des détails du paiement:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Créer un client Stripe
    async createCustomer(email, name, phone = null) {
        try {
            const customer = await this.stripe.customers.create({
                email,
                name,
                phone,
                metadata: {
                    source: 'peace_magazine'
                }
            });

            return {
                success: true,
                customerId: customer.id
            };

        } catch (error) {
            console.error('Erreur lors de la création du client:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Récupérer l'historique des paiements d'un client
    async getCustomerPayments(customerId) {
        try {
            const paymentIntents = await this.stripe.paymentIntents.list({
                customer: customerId,
                limit: 100
            });

            return {
                success: true,
                payments: paymentIntents.data.map(payment => ({
                    id: payment.id,
                    amount: payment.amount / 100,
                    currency: payment.currency,
                    status: payment.status,
                    created: new Date(payment.created * 1000),
                    description: payment.description
                }))
            };

        } catch (error) {
            console.error('Erreur lors de la récupération des paiements du client:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Calculer les frais de transaction
    calculateTransactionFees(amount) {
        // Stripe: 2.9% + 0.30€ par transaction
        // Pour XOF, on utilise un taux approximatif
        const stripeFee = (amount * 0.029) + 200; // 200 XOF approximativement 0.30€
        return Math.round(stripeFee);
    }

    // Vérifier la validité d'un montant
    validateAmount(amount) {
        const minAmount = 1000; // 10 XOF minimum
        const maxAmount = 1000000; // 10,000 XOF maximum

        if (amount < minAmount) {
            return { valid: false, error: 'Montant trop faible' };
        }
        if (amount > maxAmount) {
            return { valid: false, error: 'Montant trop élevé' };
        }
        return { valid: true };
    }
}

module.exports = new PaymentService();











