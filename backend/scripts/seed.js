const { User, Order, Lead } = require('../models');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function seed() {
    try {
        console.log('🌱 Début du seeding de la base de données...');

        // Créer un utilisateur admin
        const adminUser = await User.create({
            email: 'admin@peacemagazine.ci',
            password: 'admin123',
            firstName: 'Faveur',
            lastName: 'Morak',
            phone: '+2250767660476',
            role: 'admin',
            emailVerified: true,
            isActive: true
        });

        console.log('✅ Utilisateur admin créé:', adminUser.email);

        // Créer un utilisateur manager
        const managerUser = await User.create({
            email: 'manager@peacemagazine.ci',
            password: 'manager123',
            firstName: 'Ephrem',
            lastName: 'Kouadio',
            phone: '+2250707114818',
            role: 'manager',
            emailVerified: true,
            isActive: true
        });

        console.log('✅ Utilisateur manager créé:', managerUser.email);

        // Créer des commandes d'exemple
        const sampleOrders = [
            {
                orderNumber: 'PM-20241201-001',
                personName: 'Marie Kouassi',
                occasion: 'anniversaire',
                relationship: 'Ma sœur adorée',
                description: 'Marie est une personne exceptionnelle qui mérite d\'être célébrée pour son 30ème anniversaire.',
                clientName: 'Jean Kouassi',
                clientEmail: 'jean.kouassi@email.com',
                clientPhone: '+2250701234567',
                deliveryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 jours
                deliveryAddress: 'Cocody, Abidjan, Côte d\'Ivoire',
                deliveryPhone: '+2250701234567',
                status: 'confirmed',
                paymentStatus: 'paid',
                paymentMethod: 'stripe',
                basePrice: 25000.00,
                totalPrice: 25000.00,
                currency: 'XOF',
                confirmedAt: new Date(),
                userId: adminUser.id
            },
            {
                orderNumber: 'PM-20241201-002',
                personName: 'Papa Amadou',
                occasion: 'hommage',
                relationship: 'Mon père bien-aimé',
                description: 'Un hommage à mon père qui nous a quittés trop tôt. Il mérite que son histoire soit racontée.',
                clientName: 'Fatou Traoré',
                clientEmail: 'fatou.traore@email.com',
                clientPhone: '+2250707654321',
                deliveryDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 21 jours
                deliveryAddress: 'Plateau, Abidjan, Côte d\'Ivoire',
                deliveryPhone: '+2250707654321',
                status: 'in_progress',
                paymentStatus: 'paid',
                paymentMethod: 'bank_transfer',
                basePrice: 25000.00,
                totalPrice: 25000.00,
                currency: 'XOF',
                confirmedAt: new Date(),
                startedAt: new Date(),
                userId: managerUser.id
            }
        ];

        for (const orderData of sampleOrders) {
            const order = await Order.create(orderData);
            console.log('✅ Commande créée:', order.orderNumber);
        }

        // Créer des leads d'exemple
        const sampleLeads = [
            {
                name: 'Aïcha Diallo',
                email: 'aicha.diallo@email.com',
                phone: '+2250701111111',
                occasion: 'mariage',
                source: 'contact_form',
                status: 'new',
                priority: 'high',
                message: 'Je souhaite créer un magazine pour mon mariage prévu dans 3 mois.',
                score: 85
            },
            {
                name: 'Kouadio Jean',
                email: 'kouadio.jean@email.com',
                phone: '+2250702222222',
                occasion: 'naissance',
                source: 'quick_lead',
                status: 'contacted',
                priority: 'medium',
                message: 'Magazine pour la naissance de mon fils.',
                score: 70,
                lastContactedAt: new Date()
            },
            {
                name: 'Traoré Aminata',
                email: 'aminata.traore@email.com',
                phone: '+2250703333333',
                occasion: 'reussite',
                source: 'whatsapp',
                status: 'qualified',
                priority: 'high',
                message: 'Célébrer la réussite de ma fille à son examen.',
                score: 90,
                lastContactedAt: new Date()
            }
        ];

        for (const leadData of sampleLeads) {
            const lead = await Lead.create(leadData);
            console.log('✅ Lead créé:', lead.name);
        }

        console.log('✅ Seeding terminé avec succès !');
        console.log('📧 Admin: admin@peacemagazine.ci / admin123');
        console.log('👨‍💼 Manager: manager@peacemagazine.ci / manager123');
        process.exit(0);

    } catch (error) {
        console.error('❌ Erreur lors du seeding:', error);
        process.exit(1);
    }
}

seed();











