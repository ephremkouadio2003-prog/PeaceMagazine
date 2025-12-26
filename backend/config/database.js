// ⚠️ MySQL/Sequelize désactivé - Utilisation de Supabase uniquement
// Ce fichier est conservé pour la compatibilité mais ne fait plus rien

// Test de connexion désactivé (Supabase gère tout)
const testConnection = async () => {
    console.log('ℹ️  MySQL désactivé - Supabase gère toutes les données');
    return true;
};

// Sequelize désactivé
const sequelize = null;

module.exports = { sequelize, testConnection };

