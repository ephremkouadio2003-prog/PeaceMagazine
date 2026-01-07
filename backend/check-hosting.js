#!/usr/bin/env node

/**
 * Script de vérification de l'environnement d'hébergement
 * Vérifie si le système de fichiers est persistant ou éphémère
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

console.log('🔍 Vérification de l\'environnement d\'hébergement...');
console.log('═══════════════════════════════════════════════════════\n');

// Détecter la plateforme
const platform = process.env.VERCEL ? 'Vercel' :
                 process.env.NETLIFY ? 'Netlify' :
                 process.env.HEROKU_APP_NAME ? 'Heroku' :
                 process.env.RENDER ? 'Render' :
                 process.env.RAILWAY_ENVIRONMENT ? 'Railway' :
                 process.env.FLY_APP_NAME ? 'Fly.io' :
                 'Autre/VPS';

console.log(`📦 Plateforme détectée : ${platform}`);

// Vérifier si c'est une plateforme serverless
const serverlessPlatforms = ['Vercel', 'Netlify', 'Heroku', 'Render'];
const isServerless = serverlessPlatforms.includes(platform);

if (isServerless) {
    console.log('\n🚨 ═══════════════════════════════════════════════════════');
    console.log('🚨 ATTENTION : PLATEFORME SERVERLESS DÉTECTÉE');
    console.log('🚨 ═══════════════════════════════════════════════════════');
    console.log('');
    console.log('❌ Cette plateforme utilise un système de fichiers ÉPHÉMÈRE');
    console.log('❌ Toutes les photos seront PERDUES à chaque redémarrage');
    console.log('❌ Les données ne seront PAS persistantes');
    console.log('');
    console.log('✅ Solutions recommandées :');
    console.log('   1. Migrer vers un VPS (DigitalOcean, OVH, etc.)');
    console.log('   2. Utiliser Supabase Storage ou Cloudinary');
    console.log('   3. Utiliser Railway/Fly.io avec Volume persistant');
    console.log('');
    console.log('📚 Consultez HEBERGEMENT-ET-STOCKAGE.md pour plus d\'infos');
    console.log('');
} else {
    console.log('\n✅ Plateforme avec système de fichiers persistant');
    console.log('✅ Les fichiers seront conservés entre les redémarrages');
}

// Vérifier l'espace disque disponible
const uploadsDir = path.join(__dirname, '../uploads');
try {
    if (fs.existsSync(uploadsDir)) {
        const stats = fs.statSync(uploadsDir);
        console.log(`\n📁 Dossier uploads : ${uploadsDir}`);
        console.log(`   Existe : ✅`);
        
        // Calculer la taille (approximative)
        let totalSize = 0;
        const files = fs.readdirSync(uploadsDir);
        files.forEach(file => {
            const filePath = path.join(uploadsDir, file);
            try {
                const stat = fs.statSync(filePath);
                if (stat.isFile()) {
                    totalSize += stat.size;
                }
            } catch (e) {
                // Ignorer les erreurs
            }
        });
        
        const sizeMB = (totalSize / (1024 * 1024)).toFixed(2);
        console.log(`   Taille actuelle : ${sizeMB} MB`);
        console.log(`   Nombre de fichiers : ${files.length}`);
    } else {
        console.log(`\n📁 Dossier uploads : ${uploadsDir}`);
        console.log(`   Existe : ❌ (sera créé au premier upload)`);
    }
} catch (error) {
    console.log(`\n⚠️  Impossible de vérifier le dossier uploads : ${error.message}`);
}

// Vérifier l'espace disque système
try {
    const freeSpace = os.freemem();
    const totalSpace = os.totalmem();
    const freeSpaceGB = (freeSpace / (1024 * 1024 * 1024)).toFixed(2);
    const totalSpaceGB = (totalSpace / (1024 * 1024 * 1024)).toFixed(2);
    
    console.log(`\n💾 Espace disque système :`);
    console.log(`   Libre : ${freeSpaceGB} GB`);
    console.log(`   Total : ${totalSpaceGB} GB`);
    
    if (freeSpace < 100 * 1024 * 1024) { // Moins de 100MB
        console.log(`   ⚠️  Attention : Espace disque faible`);
    }
} catch (error) {
    console.log(`\n⚠️  Impossible de vérifier l'espace disque : ${error.message}`);
}

// Recommandations
console.log('\n═══════════════════════════════════════════════════════');
console.log('💡 Recommandations :');
console.log('═══════════════════════════════════════════════════════');

if (isServerless) {
    console.log('');
    console.log('1. ⚠️  MIGRER VERS UN VPS (OBLIGATOIRE pour la production)');
    console.log('   - DigitalOcean Droplet ($6-12/mois)');
    console.log('   - OVH VPS (€3.50-10/mois)');
    console.log('   - Voir GUIDE-HEBERGEMENT-VPS.md');
    console.log('');
    console.log('2. 🔄 OU utiliser Supabase Storage');
    console.log('   - 1GB gratuit');
    console.log('   - Nécessite des modifications du code');
    console.log('');
} else {
    console.log('');
    console.log('✅ Votre environnement semble approprié');
    console.log('');
    console.log('💡 Pensez à :');
    console.log('   - Configurer des sauvegardes automatiques');
    console.log('   - Monitorer l\'espace disque');
    console.log('   - Configurer un système de purge automatique');
    console.log('');
}

console.log('═══════════════════════════════════════════════════════\n');






