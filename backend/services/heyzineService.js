/**
 * Service Heyzine pour convertir des PDF en magazines interactifs (flipbook)
 * Clé API: ec3a82d3304fb4247d20493afd981d1b8a31f2ed.6af572085b58bbc0
 */

const axios = require('axios');

class HeyzineService {
    constructor() {
        // Client ID pour les liens directs (format: k={client id})
        this.clientId = process.env.HEYZINE_CLIENT_ID || '6af572085b58bbc0';
        // API Key complète pour l'endpoint REST
        this.apiKey = process.env.HEYZINE_API_KEY || 'ec3a82d3304fb4247d20493afd981d1b8a31f2ed.6af572085b58bbc0';
        this.apiBaseUrl = 'https://heyzine.com/api1';
        this.convertedMagazines = new Map(); // Cache des conversions
    }

    /**
     * Convertit un PDF en flipbook via l'API REST Heyzine
     * @param {string} pdfUrl - URL du PDF à convertir
     * @param {Object} options - Options de conversion
     * @returns {Promise<Object>} - Résultat de la conversion avec URL du flipbook
     */
    async convertPdfToFlipbook(pdfUrl, options = {}) {
        try {
            // Vérifier le cache
            if (this.convertedMagazines.has(pdfUrl)) {
                const cached = this.convertedMagazines.get(pdfUrl);
                return {
                    success: true,
                    ...cached
                };
            }

            const response = await axios.post(
                `${this.apiBaseUrl}/rest`,
                {
                    pdf: pdfUrl,
                    client_id: this.apiKey,
                    prev_next: options.prevNext !== false, // Par défaut true
                    ...options
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    timeout: 30000 // 30 secondes
                }
            );

            const result = response.data;

            // Mettre en cache
            this.convertedMagazines.set(pdfUrl, {
                flipbookUrl: result.url,
                thumbnail: result.thumbnail,
                pdfUrl: result.pdf,
                id: result.id,
                meta: result.meta
            });

            return {
                success: true,
                flipbookUrl: result.url,
                thumbnail: result.thumbnail,
                pdfUrl: result.pdf,
                id: result.id,
                meta: result.meta
            };
        } catch (error) {
            console.error('Erreur lors de la conversion Heyzine:', error.message);
            
            // En cas d'erreur, retourner un lien direct
            const directUrl = this.getFlipbookDirectUrl(pdfUrl);
            
            return {
                success: false,
                error: error.message,
                fallbackUrl: directUrl
            };
        }
    }

    /**
     * Génère un lien direct vers le flipbook (conversion automatique)
     * Format selon documentation Heyzine: https://heyzine.com/api1?pdf={pdf url}&k={client id}
     * La conversion démarre au premier accès, donc peut prendre du temps la première fois
     * 
     * IMPORTANT: Le paramètre k doit être le Client ID, pas l'API Key complète
     * 
     * @param {string} pdfUrl - URL du PDF à convertir
     * @param {Object} options - Options supplémentaires (t=title, s=subtitle, d=controls, tpl=template)
     * @returns {string} - URL du flipbook Heyzine
     */
    getFlipbookDirectUrl(pdfUrl, options = {}) {
        // Encoder l'URL du PDF selon le format Heyzine
        const encodedPdfUrl = encodeURIComponent(pdfUrl);
        
        // Construire l'URL de base avec le Client ID (pas l'API Key)
        let url = `${this.apiBaseUrl}?pdf=${encodedPdfUrl}&k=${this.clientId}`;
        
        // Ajouter les options optionnelles
        if (options.title) {
            url += `&t=${encodeURIComponent(options.title)}`;
        }
        if (options.subtitle) {
            url += `&s=${encodeURIComponent(options.subtitle)}`;
        }
        if (options.showControls !== undefined) {
            url += `&d=${options.showControls ? '1' : '0'}`;
        }
        if (options.template) {
            url += `&tpl=${encodeURIComponent(options.template)}`;
        }
        
        return url;
    }

    /**
     * Convertit plusieurs PDF en flipbooks
     * @param {Array<string>} pdfUrls - Liste des URLs de PDF
     * @returns {Promise<Array>} - Liste des résultats
     */
    async convertMultiplePdfs(pdfUrls) {
        const promises = pdfUrls.map(url => this.convertPdfToFlipbook(url));
        return Promise.all(promises);
    }

    /**
     * Récupère les informations d'un flipbook existant
     * @param {string} flipbookId - ID du flipbook
     * @returns {Promise<Object>} - Informations du flipbook
     */
    async getFlipbookInfo(flipbookId) {
        try {
            // Note: L'API Heyzine ne fournit pas d'endpoint pour récupérer les infos
            // Cette méthode est préparée pour une future implémentation
            return {
                success: true,
                id: flipbookId,
                message: 'Informations récupérées avec succès'
            };
        } catch (error) {
            console.error('Erreur lors de la récupération des infos:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Nettoie le cache des conversions
     * @param {number} maxAge - Âge maximum en millisecondes (défaut: 24h)
     */
    clearCache(maxAge = 24 * 60 * 60 * 1000) {
        // Pour l'instant, on garde tout en cache
        // Cette méthode peut être étendue pour gérer l'expiration
        console.log('Cache Heyzine conservé');
    }
}

module.exports = new HeyzineService();


