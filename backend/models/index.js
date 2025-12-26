/**
 * Export centralisé de tous les modèles
 * ✅ Utilisation de Supabase - Modèles complets et fonctionnels
 */

// Modèles Supabase (remplacent Sequelize)
const { Order, Lead, File, Contact, testConnection } = require('./supabase');

// Sequelize désactivé
const sequelize = null;
const User = null; // User n'est pas utilisé (authentification via Supabase Auth)

// Fonction de synchronisation (non nécessaire avec Supabase)
const syncDatabase = async (force = false) => {
    console.log('ℹ️  Supabase gère la base de données - Pas de synchronisation nécessaire');
    return true;
};

module.exports = {
    sequelize,
    Order,
    User,
    File,
    Lead,
    Contact,
    testConnection,
    syncDatabase
};






