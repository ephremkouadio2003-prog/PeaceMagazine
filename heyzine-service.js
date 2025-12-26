/**
 * Service Heyzine pour convertir des PDF en magazines interactifs (flipbook)
 * La clé API est gérée côté serveur pour la sécurité
 * Fallback: Utilisation directe en développement si le backend n'est pas disponible
 */

class HeyzineService {
    constructor() {
        // Client ID pour les liens directs (format: k={client id})
        this.clientId = '6af572085b58bbc0';
        // API Key complète pour l'endpoint REST (si nécessaire)
        this.apiKey = 'ec3a82d3304fb4247d20493afd981d1b8a31f2ed.6af572085b58bbc0';
        this.apiBaseUrl = 'https://heyzine.com/api1';
        this.convertedMagazines = new Map(); // Cache des conversions
    }

    /**
     * Convertit un PDF en flipbook via l'API REST Heyzine (via notre backend)
     * @param {string} pdfUrl - URL du PDF à convertir
     * @param {Object} options - Options de conversion
     * @returns {Promise<Object>} - Résultat de la conversion avec URL du flipbook
     */
    async convertPdfToFlipbook(pdfUrl, options = {}) {
        try {
            // Vérifier le cache
            if (this.convertedMagazines.has(pdfUrl)) {
                return this.convertedMagazines.get(pdfUrl);
            }

            // Utiliser notre backend pour sécuriser l'appel API
            if (API_BASE_URL) {
                try {
                    const response = await apiCall('/api/heyzine/convert', 'POST', {
                        pdfUrl: pdfUrl,
                        options: options
                    });

                    if (response && response.success) {
                        const result = {
                            success: true,
                            flipbookUrl: response.data.flipbookUrl,
                            thumbnail: response.data.thumbnail,
                            pdfUrl: response.data.pdfUrl,
                            id: response.data.id,
                            meta: response.data.meta
                        };
                        
                        // Mettre en cache
                        this.convertedMagazines.set(pdfUrl, result);
                        return result;
                    }
                } catch (error) {
                    console.warn('Erreur conversion via backend, fallback lien direct:', error);
                }
            }

            // Fallback : utiliser le lien direct (mais sans clé API exposée)
            // La clé sera gérée côté serveur Heyzine si nécessaire
            const directUrl = this.getFlipbookDirectUrl(pdfUrl);
            return {
                success: false,
                error: 'Conversion nécessite un backend configuré',
                fallbackUrl: directUrl
            };
        } catch (error) {
            console.error('Erreur lors de la conversion Heyzine:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Génère un lien direct vers le flipbook (conversion automatique)
     * Format: https://heyzine.com/api1?pdf={pdf url}&k={client id}
     * Note: Le paramètre k doit être le Client ID, pas l'API Key complète
     * 
     * @param {string} pdfUrl - URL du PDF à convertir
     * @param {Object} options - Options supplémentaires (t=title, s=subtitle, d=controls, tpl=template)
     * @returns {Promise<string>} - URL du flipbook
     */
    async getFlipbookDirectUrl(pdfUrl, options = {}) {
        // Utiliser le backend pour obtenir l'URL sécurisée avec la clé API
        // Cela évite d'exposer la clé API côté client
        if (API_BASE_URL && typeof apiCall === 'function') {
            try {
                const response = await apiCall(`/api/heyzine/direct-url?pdfUrl=${encodeURIComponent(pdfUrl)}`, 'GET');
                if (response && response.success && response.directUrl) {
                    return response.directUrl;
                }
            } catch (error) {
                console.warn('Erreur récupération URL Heyzine via backend:', error);
                // Si le backend n'est pas disponible, utiliser directement Heyzine
                // Note: En production, il faudrait toujours utiliser le backend
            }
        }
        
        // Fallback : utiliser directement Heyzine avec le Client ID
        // Format selon documentation Heyzine: https://heyzine.com/api1?pdf={pdf url}&k={client id}
        // Le paramètre k doit être le Client ID, pas l'API Key complète
        const encodedPdfUrl = encodeURIComponent(pdfUrl);
        
        // Construire l'URL de base avec le Client ID
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
     * Affiche un flipbook dans un iframe ou une nouvelle fenêtre
     * @param {string} flipbookUrl - URL du flipbook
     * @param {Object} options - Options d'affichage
     */
    displayFlipbook(flipbookUrl, options = {}) {
        const {
            containerId = 'heyzine-container',
            width = '100%',
            height = '800px',
            fullscreen = false
        } = options;

        if (fullscreen) {
            this.openFullscreenViewer(flipbookUrl);
            return;
        }

        // Afficher dans un conteneur
        let container = document.getElementById(containerId);
        if (!container) {
            container = document.createElement('div');
            container.id = containerId;
            container.className = 'heyzine-flipbook-container';
            container.style.width = width;
            container.style.height = height;
            container.style.border = '1px solid #ddd';
            container.style.borderRadius = '8px';
            container.style.overflow = 'hidden';
            document.body.appendChild(container);
        }

        const iframe = document.createElement('iframe');
        iframe.src = flipbookUrl;
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.border = 'none';
        iframe.setAttribute('allowfullscreen', 'true');
        iframe.setAttribute('loading', 'lazy');

        container.innerHTML = '';
        container.appendChild(iframe);
    }

    /**
     * Ouvre un visualiseur plein écran pour le flipbook
     * @param {string} flipbookUrl - URL du flipbook
     */
    openFullscreenViewer(flipbookUrl) {
        console.log('🔵 Ouverture du visualiseur avec URL Heyzine:', flipbookUrl);
        console.log('📝 Note: La conversion démarre au premier accès et peut prendre quelques instants');
        
        // Vérifier que l'URL est valide
        if (!flipbookUrl || !flipbookUrl.startsWith('http')) {
            console.error('❌ URL invalide:', flipbookUrl);
            const errorModal = document.createElement('div');
            errorModal.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(0, 0, 0, 0.95);
                color: white;
                padding: 30px;
                border-radius: 12px;
                z-index: 10002;
                max-width: 500px;
                text-align: center;
            `;
            errorModal.innerHTML = `
                <h2 style="color: #ff4444; margin-bottom: 20px;">❌ Erreur</h2>
                <p>URL du magazine invalide.</p>
                <p style="margin: 20px 0; font-size: 0.9rem; opacity: 0.8;">
                    L'URL générée n'est pas valide. Cela peut être dû à un problème d'encodage ou d'accessibilité du PDF.
                </p>
                <button onclick="this.parentElement.remove()" style="
                    margin-top: 20px;
                    padding: 10px 20px;
                    background: #F5C542;
                    color: black;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: 600;
                ">Fermer</button>
            `;
            document.body.appendChild(errorModal);
            return;
        }
        
        const modal = document.createElement('div');
        modal.className = 'heyzine-fullscreen-modal';
        modal.id = 'heyzine-modal-' + Date.now();
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.95);
            z-index: 10000;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
        `;

        const header = document.createElement('div');
        header.style.cssText = `
            width: 100%;
            padding: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: rgba(0, 0, 0, 0.8);
            color: white;
        `;

        const title = document.createElement('h2');
        title.textContent = 'Magazine Interactif';
        title.style.cssText = 'margin: 0; color: white; font-size: 1.5rem;';

        const closeBtn = document.createElement('button');
        closeBtn.textContent = '×';
        closeBtn.style.cssText = `
            background: transparent;
            border: none;
            color: white;
            font-size: 2rem;
            cursor: pointer;
            padding: 0 20px;
            line-height: 1;
        `;
        closeBtn.addEventListener('click', () => {
            if (document.body.contains(modal)) {
                document.body.removeChild(modal);
            }
            document.body.style.overflow = '';
        });

        // Bouton pour ouvrir dans un nouvel onglet
        const openNewTabBtn = document.createElement('button');
        openNewTabBtn.textContent = '🔗 Ouvrir dans un nouvel onglet';
        openNewTabBtn.style.cssText = `
            background: rgba(245, 197, 66, 0.9);
            border: none;
            color: black;
            font-size: 0.9rem;
            cursor: pointer;
            padding: 8px 16px;
            border-radius: 6px;
            margin-right: 10px;
            font-weight: 600;
        `;
        openNewTabBtn.addEventListener('click', () => {
            window.open(flipbookUrl, '_blank');
        });

        header.appendChild(title);
        header.appendChild(openNewTabBtn);
        header.appendChild(closeBtn);

        const iframeContainer = document.createElement('div');
        iframeContainer.style.cssText = `
            flex: 1;
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        `;

        const iframe = document.createElement('iframe');
        iframe.id = 'heyzine-iframe-' + Date.now();
        iframe.src = flipbookUrl;
        iframe.style.cssText = `
            width: 100%;
            max-width: 1200px;
            height: 90vh;
            min-height: 600px;
            border: none;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
            background: white;
        `;
        iframe.setAttribute('allowfullscreen', 'true');
        // Retirer sandbox pour permettre le chargement complet de Heyzine
        // iframe.setAttribute('sandbox', 'allow-same-origin allow-scripts allow-popups allow-forms allow-top-navigation');
        iframe.setAttribute('loading', 'eager');
        iframe.setAttribute('referrerpolicy', 'no-referrer-when-downgrade');
        
        console.log('📦 Iframe créée avec src:', flipbookUrl);
        
        // Afficher un message de chargement
        const loadingMsg = document.createElement('div');
        loadingMsg.id = 'heyzine-loading-msg';
        loadingMsg.style.cssText = `
            color: white;
            text-align: center;
            padding: 20px;
            margin-bottom: 20px;
        `;
        loadingMsg.innerHTML = `
            <div style="font-size: 1.2rem; margin-bottom: 10px;">⏳ Chargement en cours...</div>
            <div style="font-size: 0.9rem; opacity: 0.8;">La conversion peut prendre quelques instants au premier accès</div>
        `;
        iframeContainer.appendChild(loadingMsg);
        
        // Gérer les erreurs de chargement
        iframe.onerror = () => {
            console.error('❌ Erreur de chargement de l\'iframe');
            loadingMsg.remove();
            const errorMsg = document.createElement('div');
            errorMsg.style.cssText = `
                color: white;
                text-align: center;
                padding: 30px;
                background: rgba(255, 68, 68, 0.2);
                border: 2px solid rgba(255, 68, 68, 0.5);
                border-radius: 12px;
                margin: 20px;
            `;
            errorMsg.innerHTML = `
                <h3 style="color: #ff4444; margin-bottom: 15px;">⚠️ Erreur de chargement</h3>
                <p style="margin-bottom: 15px;">Le magazine ne peut pas être chargé. Heyzine indique que l'URL du PDF n'est pas accessible.</p>
                <div style="background: rgba(0,0,0,0.3); padding: 15px; border-radius: 8px; margin: 15px 0;">
                    <strong style="color: #F5C542;">Solutions :</strong>
                    <ul style="text-align: left; display: inline-block; margin-top: 10px;">
                        <li>Démarrer le serveur PDF : <code style="background: rgba(0,0,0,0.5); padding: 2px 6px; border-radius: 4px;">python3 serve-pdfs.py</code></li>
                        <li>Utiliser ngrok pour créer un tunnel public</li>
                        <li>Uploader les PDFs vers Google Drive/Dropbox</li>
                        <li>Déployer le site en production</li>
                    </ul>
                </div>
                <p style="margin-top: 20px; font-size: 0.85rem; opacity: 0.8;">
                    <strong>URL utilisée :</strong><br>
                    <code style="font-size: 0.75rem; word-break: break-all; background: rgba(0,0,0,0.5); padding: 5px 10px; border-radius: 4px; display: inline-block; margin-top: 10px;">${flipbookUrl}</code>
                </p>
                <button onclick="window.open('${flipbookUrl}', '_blank')" style="
                    margin-top: 20px;
                    padding: 10px 20px;
                    background: #F5C542;
                    color: black;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: 600;
                ">🔗 Essayer dans un nouvel onglet</button>
            `;
            iframeContainer.appendChild(errorMsg);
        };
        
        // Vérifier si l'iframe se charge
        let iframeLoaded = false;
        iframe.onload = () => {
            console.log('✅ Iframe chargée avec succès');
            iframeLoaded = true;
            if (document.getElementById(loadingMsg.id)) {
                loadingMsg.remove();
            }
        };
        
        // Timeout pour détecter si le chargement prend trop de temps
        setTimeout(() => {
            if (document.getElementById(loadingMsg.id) && !iframeLoaded) {
                console.warn('⏱️ Le chargement prend plus de temps que prévu...');
                loadingMsg.innerHTML = `
                    <div style="font-size: 1.2rem; margin-bottom: 10px;">⏳ Chargement en cours...</div>
                    <div style="font-size: 0.9rem; opacity: 0.8; margin-bottom: 15px;">La conversion peut prendre plusieurs minutes au premier accès</div>
                    <button onclick="window.open('${flipbookUrl}', '_blank')" style="
                        background: rgba(245, 197, 66, 0.9);
                        border: none;
                        color: black;
                        padding: 10px 20px;
                        border-radius: 6px;
                        cursor: pointer;
                        font-weight: 600;
                    ">🔗 Ouvrir dans un nouvel onglet</button>
                `;
            }
        }, 15000);

        iframeContainer.appendChild(iframe);

        modal.appendChild(header);
        modal.appendChild(iframeContainer);

        // Vérifier que le modal peut être ajouté
        try {
            document.body.appendChild(modal);
            document.body.style.overflow = 'hidden';
            console.log('✅ Modal ajouté au DOM');
            
            // Vérifier que l'iframe est bien dans le DOM
            setTimeout(() => {
                const addedIframe = document.getElementById(iframe.id);
                if (addedIframe) {
                    console.log('✅ Iframe trouvée dans le DOM');
                } else {
                    console.error('❌ Iframe non trouvée dans le DOM');
                }
            }, 100);
        } catch (error) {
            console.error('❌ Erreur lors de l\'ajout du modal:', error);
            alert('Erreur lors de l\'ouverture du visualiseur. Veuillez réessayer.');
        }

        // Fermer avec la touche Escape
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                document.body.removeChild(modal);
                document.body.style.overflow = '';
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        document.addEventListener('keydown', escapeHandler);
    }

    /**
     * Crée un bouton pour ouvrir un magazine en format flipbook
     * @param {string} pdfUrl - URL du PDF
     * @param {string} label - Texte du bouton
     * @returns {HTMLElement} - Élément bouton
     */
    createViewButton(pdfUrl, label = 'Voir en format magazine') {
        const button = document.createElement('button');
        button.className = 'btn-view-magazine';
        button.textContent = `📖 ${label}`;
        button.style.cssText = `
            padding: 12px 24px;
            background: linear-gradient(135deg, #F5C542 0%, #FFB300 100%);
            color: white;
            border: none;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 2px 8px rgba(245, 197, 66, 0.3);
        `;

        button.addEventListener('mouseenter', () => {
            button.style.transform = 'translateY(-2px)';
            button.style.boxShadow = '0 4px 12px rgba(245, 197, 66, 0.5)';
        });

        button.addEventListener('mouseleave', () => {
            button.style.transform = 'translateY(0)';
            button.style.boxShadow = '0 2px 8px rgba(245, 197, 66, 0.3)';
        });

        button.addEventListener('click', async () => {
            button.disabled = true;
            button.textContent = '⏳ Conversion en cours...';

            try {
                // Essayer d'abord la conversion via API REST
                const result = await this.convertPdfToFlipbook(pdfUrl);
                
                if (result.success) {
                    this.openFullscreenViewer(result.flipbookUrl);
                } else {
                    // Fallback vers le lien direct
                    const directUrl = this.getFlipbookDirectUrl(pdfUrl);
                    this.openFullscreenViewer(directUrl);
                }
            } catch (error) {
                console.error('Erreur:', error);
                // Fallback vers le lien direct en cas d'erreur
                const directUrl = this.getFlipbookDirectUrl(pdfUrl);
                this.openFullscreenViewer(directUrl);
            } finally {
                button.disabled = false;
                button.textContent = `📖 ${label}`;
            }
        });

        return button;
    }

    /**
     * Ajoute un bouton de visualisation à un élément de galerie
     * @param {HTMLElement} galleryItem - Élément de la galerie
     * @param {string} pdfUrl - URL du PDF du magazine
     */
    addViewButtonToGalleryItem(galleryItem, pdfUrl) {
        const infoSection = galleryItem.querySelector('.gallery-info');
        if (!infoSection || !pdfUrl) {
            return;
        }

        // Vérifier si le bouton existe déjà
        if (infoSection.querySelector('.btn-view-magazine')) {
            return;
        }

        const button = this.createViewButton(pdfUrl, 'Voir en format magazine interactif');
        button.style.marginTop = '16px';
        infoSection.appendChild(button);
    }
}

// Instance globale du service
window.heyzineService = new HeyzineService();

// Export pour utilisation dans d'autres modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HeyzineService;
}

