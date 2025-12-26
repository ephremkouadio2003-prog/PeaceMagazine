/**
 * Export centralisé des modèles Supabase
 * Remplace complètement les modèles Sequelize
 */

const Order = require('./Order');
const Lead = require('./Lead');
const File = require('./File');
const Contact = require('./Contact');

// Vérifier la connexion Supabase
const supabaseService = require('../../services/supabaseService');

const testConnection = async () => {
    if (!supabaseService.isConfigured()) {
        console.warn('⚠️  Supabase n\'est pas configuré');
        return false;
    }

    try {
        // Tester la connexion en récupérant une commande (même si vide)
        const { error } = await supabaseService.client
            .from('orders')
            .select('id')
            .limit(1);

        if (error && error.code !== 'PGRST116') {
            throw error;
        }

        console.log('✅ Connexion Supabase vérifiée');
        return true;
    } catch (error) {
        console.error('❌ Erreur de connexion Supabase:', error.message);
        return false;
    }
};

module.exports = {
    Order,
    Lead,
    File,
    Contact,
    testConnection
};



