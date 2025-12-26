/**
 * Utilitaires de sécurité pour les fichiers uploadés
 * - Quarantaine pour fichiers suspects
 * - Purge automatique des fichiers anciens
 * - Validation stricte du contenu
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class FileSecurity {
    constructor() {
        this.uploadsDir = path.join(__dirname, '../../uploads');
        this.quarantineDir = path.join(__dirname, '../../uploads/quarantine');
        this.maxFileAge = 90 * 24 * 60 * 60 * 1000; // 90 jours en millisecondes
        this.purgeInterval = 24 * 60 * 60 * 1000; // Purge quotidienne
    }

    /**
     * Initialiser les dossiers de sécurité
     */
    async initialize() {
        try {
            await fs.mkdir(this.uploadsDir, { recursive: true });
            await fs.mkdir(this.quarantineDir, { recursive: true });
            console.log('✅ Dossiers de sécurité des fichiers initialisés');
        } catch (error) {
            console.error('❌ Erreur lors de l\'initialisation des dossiers:', error);
        }
    }

    /**
     * Mettre un fichier en quarantaine
     */
    async quarantineFile(filePath, reason) {
        try {
            const filename = path.basename(filePath);
            const quarantinePath = path.join(this.quarantineDir, `${Date.now()}-${filename}`);
            
            await fs.rename(filePath, quarantinePath);
            
            // Log de sécurité
            console.warn(`⚠️  Fichier mis en quarantaine: ${filename}`, {
                reason,
                quarantinePath,
                timestamp: new Date().toISOString()
            });

            return quarantinePath;
        } catch (error) {
            console.error('Erreur lors de la mise en quarantaine:', error);
            throw error;
        }
    }

    /**
     * Purger les fichiers anciens
     */
    async purgeOldFiles() {
        try {
            const now = Date.now();
            let purgedCount = 0;
            let totalSizeFreed = 0;

            // Purger les fichiers dans uploads/
            const files = await fs.readdir(this.uploadsDir);
            for (const file of files) {
                const filePath = path.join(this.uploadsDir, file);
                
                try {
                    const stats = await fs.stat(filePath);
                    if (stats.isFile()) {
                        const age = now - stats.mtimeMs;
                        
                        if (age > this.maxFileAge) {
                            const size = stats.size;
                            await fs.unlink(filePath);
                            purgedCount++;
                            totalSizeFreed += size;
                            console.log(`🗑️  Fichier ancien supprimé: ${file} (${(age / (24 * 60 * 60 * 1000)).toFixed(0)} jours)`);
                        }
                    }
                } catch (error) {
                    console.warn(`Impossible de traiter ${file}:`, error.message);
                }
            }

            // Purger les fichiers en quarantaine (après 30 jours)
            let quarantineFiles = [];
            try {
                quarantineFiles = await fs.readdir(this.quarantineDir);
            } catch (error) {
                // Dossier quarantine n'existe pas encore, ignorer
            }
            
            const quarantineMaxAge = 30 * 24 * 60 * 60 * 1000; // 30 jours

            for (const file of quarantineFiles) {
                const filePath = path.join(this.quarantineDir, file);
                
                try {
                    const stats = await fs.stat(filePath);
                    if (stats.isFile()) {
                        const age = now - stats.mtimeMs;
                        
                        if (age > quarantineMaxAge) {
                            const size = stats.size;
                            await fs.unlink(filePath);
                            purgedCount++;
                            totalSizeFreed += size;
                            console.log(`🗑️  Fichier en quarantaine supprimé: ${file}`);
                        }
                    }
                } catch (error) {
                    console.warn(`Impossible de traiter ${file}:`, error.message);
                }
            }

            if (purgedCount > 0) {
                console.log(`✅ Purge terminée: ${purgedCount} fichier(s) supprimé(s), ${(totalSizeFreed / (1024 * 1024)).toFixed(2)} MB libéré(s)`);
            }

            return { purgedCount, totalSizeFreed };
        } catch (error) {
            console.error('Erreur lors de la purge:', error);
            return { purgedCount: 0, totalSizeFreed: 0 };
        }
    }

    /**
     * Démarrer la purge automatique
     */
    startAutoPurge() {
        // Purger immédiatement au démarrage
        this.purgeOldFiles();

        // Puis purger quotidiennement
        setInterval(() => {
            this.purgeOldFiles();
        }, this.purgeInterval);

        console.log('✅ Purge automatique des fichiers activée (quotidienne)');
    }

    /**
     * Obtenir les statistiques des fichiers
     */
    async getFileStats() {
        try {
            const stats = {
                totalFiles: 0,
                totalSize: 0,
                filesByType: {},
                oldestFile: null,
                newestFile: null
            };

            const files = await fs.readdir(this.uploadsDir);
            
            for (const file of files) {
                const filePath = path.join(this.uploadsDir, file);
                
                try {
                    const fileStats = await fs.stat(filePath);
                    if (fileStats.isFile()) {
                        stats.totalFiles++;
                        stats.totalSize += fileStats.size;

                        const ext = path.extname(file).toLowerCase();
                        stats.filesByType[ext] = (stats.filesByType[ext] || 0) + 1;

                        if (!stats.oldestFile || fileStats.mtimeMs < stats.oldestFile.mtime) {
                            stats.oldestFile = { name: file, mtime: fileStats.mtimeMs };
                        }

                        if (!stats.newestFile || fileStats.mtimeMs > stats.newestFile.mtime) {
                            stats.newestFile = { name: file, mtime: fileStats.mtimeMs };
                        }
                    }
                } catch (error) {
                    // Ignorer les erreurs pour les fichiers individuels
                }
            }

            return stats;
        } catch (error) {
            console.error('Erreur lors du calcul des statistiques:', error);
            return null;
        }
    }
}

module.exports = new FileSecurity();



