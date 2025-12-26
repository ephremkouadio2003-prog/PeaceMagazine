const { syncDatabase } = require('../models');
require('dotenv').config();

async function migrate() {
    try {
        console.log('🔄 Début de la migration de la base de données...');
        
        // Synchroniser la base de données
        await syncDatabase(true); // Force la synchronisation
        
        console.log('✅ Migration terminée avec succès !');
        process.exit(0);
    } catch (error) {
        console.error('❌ Erreur lors de la migration:', error);
        process.exit(1);
    }
}

migrate();











