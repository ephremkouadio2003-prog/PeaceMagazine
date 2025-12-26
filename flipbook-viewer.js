/**
 * Flipbook Viewer - Visualiseur de PDF en format flipbook
 * Affiche les PDFs avec un effet de page tournante
 */

class FlipbookViewer {
    constructor() {
        this.pdfDoc = null;
        this.currentPage = 1;
        this.totalPages = 0;
        this.scale = 1.5;
        this.isFullscreen = false;
        this.modal = null;
        this.canvas = null;
        this.ctx = null;
    }

    /**
     * Charge un PDF et l'affiche dans le visualiseur
     * @param {string} pdfUrl - URL du PDF à charger
     * @param {string} title - Titre du magazine
     */
    async loadPDF(pdfUrl, title = 'Magazine') {
        try {
            // Afficher le modal de chargement
            this.showLoadingModal(title);

            // Charger PDF.js si pas déjà chargé
            if (typeof pdfjsLib === 'undefined') {
                await this.loadPDFJS();
            }

            // Charger le PDF
            const loadingTask = pdfjsLib.getDocument({
                url: pdfUrl,
                cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/',
                cMapPacked: true,
            });

            this.pdfDoc = await loadingTask.promise;
            this.totalPages = this.pdfDoc.numPages;
            this.currentPage = 1;

            // Créer le visualiseur
            this.createViewer(title);
            
            // Charger la première page
            await this.renderPage(1);

            // Ajouter les contrôles
            this.addControls();

            console.log(`✅ PDF chargé: ${this.totalPages} pages`);
        } catch (error) {
            console.error('Erreur lors du chargement du PDF:', error);
            this.showError('Impossible de charger le PDF. Veuillez réessayer.');
        }
    }

    /**
     * Charge PDF.js depuis CDN
     */
    async loadPDFJS() {
        return new Promise((resolve, reject) => {
            if (typeof pdfjsLib !== 'undefined') {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
            script.onload = () => {
                pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
                resolve();
            };
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    /**
     * Affiche le modal de chargement
     */
    showLoadingModal(title) {
        const modal = document.createElement('div');
        modal.id = 'flipbook-modal';
        modal.className = 'flipbook-modal';
        modal.innerHTML = `
            <div class="flipbook-container">
                <div class="flipbook-header">
                    <h2 class="flipbook-title">${title}</h2>
                    <button class="flipbook-close" aria-label="Fermer">×</button>
                </div>
                <div class="flipbook-content">
                    <div class="flipbook-loading">
                        <div class="loading-spinner"></div>
                        <p>Chargement du magazine...</p>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        this.modal = modal;

        // Fermer au clic sur le bouton
        modal.querySelector('.flipbook-close').addEventListener('click', () => this.close());
        
        // Fermer au clic en dehors
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.close();
            }
        });

        // Fermer avec Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal) {
                this.close();
            }
        });
    }

    /**
     * Crée le visualiseur flipbook
     */
    createViewer(title) {
        const content = this.modal.querySelector('.flipbook-content');
        content.innerHTML = `
            <div class="flipbook-viewer">
                <div class="flipbook-pages">
                    <div class="flipbook-page-container">
                        <canvas id="flipbook-canvas" class="flipbook-canvas"></canvas>
                    </div>
                </div>
                <div class="flipbook-controls">
                    <button class="flipbook-btn flipbook-prev" aria-label="Page précédente">
                        <span>‹</span>
                    </button>
                    <div class="flipbook-page-info">
                        <span class="current-page">1</span> / <span class="total-pages">${this.totalPages}</span>
                    </div>
                    <button class="flipbook-btn flipbook-next" aria-label="Page suivante">
                        <span>›</span>
                    </button>
                    <button class="flipbook-btn flipbook-zoom-out" aria-label="Zoom arrière">
                        <span>−</span>
                    </button>
                    <button class="flipbook-btn flipbook-zoom-in" aria-label="Zoom avant">
                        <span>+</span>
                    </button>
                    <button class="flipbook-btn flipbook-fullscreen" aria-label="Plein écran">
                        <span>⛶</span>
                    </button>
                </div>
            </div>
        `;

        this.canvas = document.getElementById('flipbook-canvas');
        this.ctx = this.canvas.getContext('2d');

        // Mettre à jour le titre
        const titleEl = this.modal.querySelector('.flipbook-title');
        if (titleEl) {
            titleEl.textContent = title;
        }
    }

    /**
     * Rend une page du PDF
     */
    async renderPage(pageNum) {
        if (!this.pdfDoc || pageNum < 1 || pageNum > this.totalPages) {
            return;
        }

        try {
            this.currentPage = pageNum;
            const page = await this.pdfDoc.getPage(pageNum);
            const viewport = page.getViewport({ scale: this.scale });

            // Ajuster la taille du canvas
            this.canvas.height = viewport.height;
            this.canvas.width = viewport.width;

            // Rendre la page
            const renderContext = {
                canvasContext: this.ctx,
                viewport: viewport
            };

            await page.render(renderContext).promise;

            // Mettre à jour l'info de page
            const currentPageEl = this.modal.querySelector('.current-page');
            if (currentPageEl) {
                currentPageEl.textContent = pageNum;
            }

            // Mettre à jour les boutons
            this.updateButtons();
        } catch (error) {
            console.error('Erreur lors du rendu de la page:', error);
        }
    }

    /**
     * Page précédente
     */
    async previousPage() {
        if (this.currentPage > 1) {
            await this.renderPage(this.currentPage - 1);
        }
    }

    /**
     * Page suivante
     */
    async nextPage() {
        if (this.currentPage < this.totalPages) {
            await this.renderPage(this.currentPage + 1);
        }
    }

    /**
     * Zoom avant
     */
    async zoomIn() {
        this.scale = Math.min(this.scale + 0.25, 3);
        await this.renderPage(this.currentPage);
    }

    /**
     * Zoom arrière
     */
    async zoomOut() {
        this.scale = Math.max(this.scale - 0.25, 0.5);
        await this.renderPage(this.currentPage);
    }

    /**
     * Basculer le mode plein écran
     */
    toggleFullscreen() {
        if (!this.modal) {
            console.error('Modal non trouvé pour le fullscreen');
            return;
        }
        
        if (!this.isFullscreen) {
            // Entrer en mode plein écran
            this.modal.classList.add('fullscreen');
            this.isFullscreen = true;
            
            // Mettre à jour le style pour vraiment occuper tout l'écran
            this.modal.style.position = 'fixed';
            this.modal.style.top = '0';
            this.modal.style.left = '0';
            this.modal.style.width = '100vw';
            this.modal.style.height = '100vh';
            this.modal.style.margin = '0';
            this.modal.style.padding = '0';
            this.modal.style.zIndex = '99999';
            
            const container = this.modal.querySelector('.flipbook-container');
            if (container) {
                container.style.width = '100%';
                container.style.height = '100%';
                container.style.maxWidth = '100%';
                container.style.maxHeight = '100%';
                container.style.margin = '0';
                container.style.borderRadius = '0';
            }
            
            // Utiliser l'API Fullscreen du navigateur si disponible
            const element = this.modal;
            if (element.requestFullscreen) {
                element.requestFullscreen().catch(err => {
                    console.log('Erreur fullscreen API:', err);
                });
            } else if (element.webkitRequestFullscreen) {
                element.webkitRequestFullscreen();
            } else if (element.webkitRequestFullScreen) {
                element.webkitRequestFullScreen();
            } else if (element.mozRequestFullScreen) {
                element.mozRequestFullScreen();
            } else if (element.msRequestFullscreen) {
                element.msRequestFullscreen();
            }
            
            console.log('✅ Mode plein écran activé');
        } else {
            // Sortir du mode plein écran
            this.modal.classList.remove('fullscreen');
            this.isFullscreen = false;
            
            // Restaurer les styles par défaut
            this.modal.style.position = '';
            this.modal.style.top = '';
            this.modal.style.left = '';
            this.modal.style.width = '';
            this.modal.style.height = '';
            this.modal.style.margin = '';
            this.modal.style.padding = '';
            
            const container = this.modal.querySelector('.flipbook-container');
            if (container) {
                container.style.width = '';
                container.style.height = '';
                container.style.maxWidth = '';
                container.style.maxHeight = '';
                container.style.margin = '';
                container.style.borderRadius = '';
            }
            
            // Utiliser l'API Fullscreen du navigateur si disponible
            if (document.exitFullscreen) {
                document.exitFullscreen().catch(err => {
                    console.log('Erreur exit fullscreen:', err);
                });
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.webkitCancelFullScreen) {
                document.webkitCancelFullScreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
            
            console.log('✅ Mode plein écran désactivé');
        }
        
        // Re-rendre la page avec le nouveau zoom après un court délai pour laisser le temps au layout de se mettre à jour
        setTimeout(() => {
            this.renderPage(this.currentPage);
        }, 100);
    }

    /**
     * Ajoute les contrôles et événements
     */
    addControls() {
        // Vérifier que le modal existe
        if (!this.modal) {
            console.error('Modal non trouvé pour ajouter les contrôles');
            return;
        }

        // Boutons de navigation - avec vérification d'existence
        const prevBtn = this.modal.querySelector('.flipbook-prev');
        const nextBtn = this.modal.querySelector('.flipbook-next');
        const zoomInBtn = this.modal.querySelector('.flipbook-zoom-in');
        const zoomOutBtn = this.modal.querySelector('.flipbook-zoom-out');
        const fullscreenBtn = this.modal.querySelector('.flipbook-fullscreen');

        if (prevBtn) {
            prevBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.previousPage();
            });
        } else {
            console.error('Bouton précédent non trouvé');
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.nextPage();
            });
        } else {
            console.error('Bouton suivant non trouvé');
        }

        if (zoomInBtn) {
            zoomInBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.zoomIn();
            });
        } else {
            console.error('Bouton zoom in non trouvé');
        }

        if (zoomOutBtn) {
            zoomOutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.zoomOut();
            });
        } else {
            console.error('Bouton zoom out non trouvé');
        }

        if (fullscreenBtn) {
            fullscreenBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.toggleFullscreen();
            });
        } else {
            console.error('Bouton fullscreen non trouvé');
        }

        // Navigation au clavier
        document.addEventListener('keydown', (e) => {
            if (!this.modal || !document.body.contains(this.modal)) return;
            
            switch(e.key) {
                case 'ArrowLeft':
                    e.preventDefault();
                    this.previousPage();
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    this.nextPage();
                    break;
                case '+':
                case '=':
                    e.preventDefault();
                    this.zoomIn();
                    break;
                case '-':
                    e.preventDefault();
                    this.zoomOut();
                    break;
            }
        });

        // Navigation tactile (swipe)
        let touchStartX = 0;
        let touchEndX = 0;

        this.canvas.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        });

        this.canvas.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            this.handleSwipe(touchStartX, touchEndX);
        });

        // Navigation à la souris (clic sur les bords)
        this.canvas.addEventListener('click', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const width = rect.width;

            // Clic sur le tiers gauche = page précédente
            if (clickX < width / 3) {
                this.previousPage();
            }
            // Clic sur le tiers droit = page suivante
            else if (clickX > (width * 2) / 3) {
                this.nextPage();
            }
        });
    }

    /**
     * Gère le swipe tactile
     */
    handleSwipe(touchStartX, touchEndX) {
        const swipeThreshold = 50;
        const diff = touchStartX - touchEndX;

        if (Math.abs(diff) > swipeThreshold) {
            if (diff > 0) {
                // Swipe gauche = page suivante
                this.nextPage();
            } else {
                // Swipe droite = page précédente
                this.previousPage();
            }
        }
    }

    /**
     * Met à jour l'état des boutons
     */
    updateButtons() {
        const prevBtn = this.modal.querySelector('.flipbook-prev');
        const nextBtn = this.modal.querySelector('.flipbook-next');

        if (prevBtn) {
            prevBtn.disabled = this.currentPage === 1;
            prevBtn.classList.toggle('disabled', this.currentPage === 1);
        }

        if (nextBtn) {
            nextBtn.disabled = this.currentPage === this.totalPages;
            nextBtn.classList.toggle('disabled', this.currentPage === this.totalPages);
        }
    }

    /**
     * Affiche une erreur
     */
    showError(message) {
        if (this.modal) {
            const content = this.modal.querySelector('.flipbook-content');
            content.innerHTML = `
                <div class="flipbook-error">
                    <h3>❌ Erreur</h3>
                    <p>${message}</p>
                    <button class="flipbook-btn" onclick="this.closest('.flipbook-modal').remove()">Fermer</button>
                </div>
            `;
        }
    }

    /**
     * Ferme le visualiseur
     */
    close() {
        if (this.modal && document.body.contains(this.modal)) {
            document.body.removeChild(this.modal);
            this.modal = null;
            this.pdfDoc = null;
            this.canvas = null;
            this.ctx = null;
        }
    }
}

// Instance globale
window.flipbookViewer = new FlipbookViewer();

