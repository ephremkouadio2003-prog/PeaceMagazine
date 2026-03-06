// Configuration de l'API
function getApiBaseUrl() {
    if (typeof window !== 'undefined' && window.APP_CONFIG && typeof window.APP_CONFIG.apiBaseUrl === 'string') {
        return window.APP_CONFIG.apiBaseUrl.replace(/\/+$/, '');
    }
    if (typeof window !== 'undefined') {
        const hostname = window.location.hostname;
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return 'http://localhost:3000';
        }
    }
    return '';
}

const API_BASE_URL = getApiBaseUrl();

// Fonction API pour communiquer avec le backend
async function apiCall(endpoint, method = 'GET', data = null) {
    // Vérifier que l'API est configurée
    if (!API_BASE_URL && endpoint.includes('/orders')) {
        throw new Error('Backend non configuré. Impossible de créer une commande.');
    }

    try {
        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            }
        };

        // Ajouter le token d'authentification s'il existe
        const token = localStorage.getItem('auth_token');
        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }

        // Ajouter les données pour POST/PUT
        if (data && (method === 'POST' || method === 'PUT')) {
            options.body = JSON.stringify(data);
        }

        const base = API_BASE_URL || '';
        const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
        const url = `${base}${normalizedEndpoint}`;
        
        console.log(`API Call: ${method} ${url}`);
        
        const response = await fetch(url, options);
        
        // Lire le corps de la réponse même en cas d'erreur
        let responseData;
        try {
            const text = await response.text();
            if (text) {
                responseData = JSON.parse(text);
            } else {
                responseData = { message: `Erreur HTTP ${response.status}` };
            }
        } catch (e) {
            responseData = { message: `Erreur HTTP ${response.status} - Impossible de lire la réponse` };
        }
        
        if (!response.ok) {
            console.error('Erreur API:', {
                status: response.status,
                statusText: response.statusText,
                data: responseData,
                url: url
            });
            throw new Error(responseData.message || `Erreur HTTP ${response.status}: ${response.statusText}`);
        }

        return responseData;
    } catch (error) {
        console.error('Erreur API complète:', error);
        
        // Améliorer les messages d'erreur selon le type
        let errorMessage = error.message;
        
        if (error.message.includes('Failed to fetch') || error.message.includes('Load failed') || error.message.includes('NetworkError')) {
            errorMessage = 'Impossible de se connecter au serveur. Vérifiez votre connexion Internet et que le serveur backend est démarré.';
        } else if (error.message.includes('CORS')) {
            errorMessage = 'Erreur de sécurité CORS. Le serveur backend doit autoriser les requêtes depuis cette origine.';
        } else if (error.message.includes('timeout')) {
            errorMessage = 'La requête a expiré. Le serveur met trop de temps à répondre.';
        }
        
        // Créer une nouvelle erreur avec un message amélioré
        const improvedError = new Error(errorMessage);
        improvedError.originalError = error;
        
        // ⚠️ SÉCURITÉ: Pour les commandes, uploads et données PII, on ne fait PAS de fallback
        // Conformité RGPD: Ne pas stocker de données personnelles dans localStorage
        const piiEndpoints = ['/orders', '/files/upload', '/leads', '/contact'];
        if (piiEndpoints.some(ep => endpoint.includes(ep))) {
            throw improvedError;
        }
        // Fallback vers localStorage uniquement pour les endpoints non-PII
        return await fallbackApiCall(endpoint, method, data);
    }
}

// ⚠️ SÉCURITÉ: Fallback localStorage désactivé pour les données PII (Personally Identifiable Information)
// Conformité RGPD: Ne pas stocker de données personnelles sans consentement explicite
async function fallbackApiCall(endpoint, method, data) {
    // ⚠️ SÉCURITÉ: Ne PAS utiliser localStorage pour les données PII
    // Les endpoints suivants contiennent des données personnelles :
    // - /api/orders/public (nom, email, téléphone, adresse)
    // - /api/leads (nom, email, téléphone)
    // - /api/contact (nom, email, message)
    // - /api/files/upload (peut contenir des images avec métadonnées)
    
    const piiEndpoints = ['/api/orders', '/api/leads', '/api/contact', '/api/files/upload'];
    
    if (piiEndpoints.some(ep => endpoint.includes(ep))) {
        console.error('❌ SÉCURITÉ: Fallback localStorage désactivé pour les données PII');
        throw new Error('Impossible de sauvegarder les données. Le serveur doit être disponible pour traiter les commandes et contacts. Veuillez réessayer plus tard ou contactez-nous sur WhatsApp : +225 07 67 66 04 76');
    }
    
    // Pour les endpoints non-PII uniquement (si nécessaire)
    console.warn('⚠️ Fallback localStorage utilisé pour:', endpoint, '(endpoint non-PII)');
    return { success: false, error: 'Endpoint non supporté en mode fallback' };
}

// Navigation fixe - pas de menu mobile

// Smooth scrolling pour les liens d'ancrage
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (event) => {
        const hash = anchor.getAttribute('href');
        if (!hash || hash === '#') {
            return;
        }

        const target = document.querySelector(hash);
        if (target) {
            event.preventDefault();
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});

class OrderForm {
    constructor() {
        this.form = document.getElementById('orderForm');
        if (!this.form) {
            return;
        }

        this.currentStep = 1;
        this.totalSteps = 5;
        this.minPhotosRequired = 30;
        this.recommendedPhotos = 30;

        this.state = this.getEmptyState();
        this.uploadedFiles = [];
        this.selectedCoverPhotoId = null;

        this.progressFill = document.getElementById('progressFill');
        this.progressIndicators = document.querySelectorAll('.step-indicator');

        this.init();
    }

    getEmptyState() {
        return {
            // Informations principales supprimées - seront collectées via WhatsApp
            // Informations principales supprimées - seront collectées via WhatsApp
            personName: null,
            occasion: null,
            relationship: null,
            customerName: null,
            customerEmail: null,
            description: null,
            anecdotes: [],
            includeTestimonials: 'no',
            testimonials: [],
            customColors: '',
            customColorHex: null,
            style: '',
            additionalInfo: '',
            deliveryDate: '',
            deliveryAddress: '',
            deliveryPhone: '',
            acceptTerms: false,
            paymentMethod: 'whatsapp',
            captions: {},
            selectedPaletteColor: null,
            photoDeliveryMode: 'upload',
            photoLink: ''
        };
    }

    init() {
        this.setupStepNavigation();
        this.setupFileUpload();
        this.setupAnecdotes();
        this.setupTestimonials();
        this.setupColorPicker();
        this.setupDateValidation();
         this.setupFormListeners();
         this.setupLeadRecovery();
         this.restoreFromStorage();
         this.setupPhotoDeliveryMode();
         this.showStep(this.currentStep);
         this.updateProgress();
         this.updateSummary();
    }

    setupFormListeners() {
        this.form.addEventListener('submit', (event) => {
            event.preventDefault();
            this.syncStateFromForm();
            
            console.log('📝 Soumission du formulaire - Étape actuelle:', this.currentStep);
            
            // Valider l'étape actuelle
            const isValid = this.validateStep(this.currentStep);
            console.log('✅ Validation de l\'étape', this.currentStep, ':', isValid ? 'OK' : 'ÉCHEC');
            
            if (isValid) {
                this.generateSummary();
                // S'assurer qu'on est bien à l'étape 5 avant de soumettre
                if (this.currentStep === 4) {
                    console.log('🚀 Démarrage de la soumission de la commande...');
                    this.submitOrder();
                } else {
                    console.warn('⚠️ Tentative de soumission alors que nous ne sommes pas à l\'étape 5. Étape actuelle:', this.currentStep);
                    const step5El = document.querySelector('[data-step="5"]');
                    if (step5El) {
                        this.showGeneralError('Veuillez compléter toutes les étapes avant de confirmer votre commande. Vous êtes actuellement à l\'étape ' + this.currentStep + ' sur 5.', step5El);
                    } else {
                        // Si l'étape 5 n'existe pas, aller à l'étape suivante
                        this.nextStep();
                    }
                }
            } else {
                console.warn('❌ Validation échouée pour l\'étape', this.currentStep);
                // Les erreurs sont déjà affichées par validateStep
                // Mais on peut aussi afficher un message général
                const stepEl = document.querySelector(`[data-step="${this.currentStep}"]`);
                if (stepEl && !stepEl.querySelector('.form-error')) {
                    this.showGeneralError('Veuillez corriger les erreurs ci-dessus avant de continuer.', stepEl);
                }
                
                // Si on est à l'étape 5 et que la validation échoue, afficher un message spécifique
                if (this.currentStep === 4) {
                    alert('⚠️ Veuillez compléter tous les champs obligatoires avant de confirmer votre commande.');
                }
            }
        });

        this.form.addEventListener('input', () => {
            this.syncStateFromForm();
            this.updateSummary();
            this.persistState();
        });

        this.form.addEventListener('change', () => {
            this.syncStateFromForm();
            this.updateSummary();
            this.persistState();
        });
    }

    setupStepNavigation() {
        document.querySelectorAll('.next-step').forEach(button => {
            button.addEventListener('click', () => this.nextStep());
        });

        document.querySelectorAll('.prev-step').forEach(button => {
            button.addEventListener('click', () => this.prevStep());
        });
    }

    nextStep() {
        if (this.currentStep >= this.totalSteps) {
            return;
        }

        this.syncStateFromForm(this.currentStep);
        if (!this.validateStep(this.currentStep)) {
            return;
        }

        this.currentStep += 1;
        this.showStep(this.currentStep);
        this.updateProgress();
        this.updateSummary();
        this.persistState();
    }

    prevStep() {
        if (this.currentStep <= 1) {
            return;
        }

        this.currentStep -= 1;
        this.showStep(this.currentStep);
        this.updateProgress();
        this.updateSummary();
        this.persistState();
    }

    showStep(step) {
        document.querySelectorAll('.form-step').forEach(stepEl => {
            stepEl.classList.toggle('active', parseInt(stepEl.dataset.step, 10) === step);
        });

        this.progressIndicators.forEach(indicator => {
            const indicatorStep = parseInt(indicator.dataset.step, 10);
            indicator.classList.toggle('active', indicatorStep === step);
            indicator.classList.toggle('completed', indicatorStep < step);
        });
    }

    updateProgress() {
        if (!this.progressFill) {
            return;
        }
        const progress = (this.currentStep / this.totalSteps) * 100;
        this.progressFill.style.width = `${progress}%`;
    }

    validateStep(step) {
        const stepEl = document.querySelector(`.form-step[data-step="${step}"]`);
        if (!stepEl) {
            return true;
        }

        this.clearGeneralError(stepEl);
        this.clearFieldErrors(stepEl);

        let isValid = true;
        const generalErrors = [];

        // Étape 1 : Photos (anciennement étape 2)
        if (step === 1) {
             if (this.state.photoDeliveryMode === 'upload') {
                 if (this.uploadedFiles.length < this.minPhotosRequired) {
                     const missing = this.minPhotosRequired - this.uploadedFiles.length;
                     generalErrors.push(`⚠️ Minimum 30 photos requis pour un magazine de 24 pages. Il vous manque ${missing} photo${missing > 1 ? 's' : ''}.`);
                     isValid = false;
                 }
                if (!this.selectedCoverPhotoId) {
                    generalErrors.push('Sélectionnez une photo de couverture.');
                    isValid = false;
                }
            } else {
                if (!this.state.photoLink) {
                    const linkField = document.getElementById('photoLink');
                    this.showFieldError(linkField, 'Indiquez comment vous nous enverrez les photos.');
                    generalErrors.push('Précisez comment vous transmettrez vos photos (lien ou instructions).');
                    isValid = false;
                }
            }
        // Étape 2 : Style (pas de validation obligatoire)
        } else if (step === 2) {
            // Pas de validation obligatoire pour le style
        // Étape 3 : Livraison (anciennement étape 4)
        } else if (step === 3) {
            isValid &= this.requireField('deliveryDate', 'Indiquez une date de livraison souhaitée.');
            isValid &= this.requireField('deliveryAddress', 'Précisez l\'adresse de livraison.');
            isValid &= this.requireField('deliveryPhone', 'Ajoutez un numéro de téléphone de contact.');

            const phoneField = document.getElementById('deliveryPhone');
            const normalizedPhone = this.normalizePhoneNumber(this.state.deliveryPhone);
            if (!normalizedPhone) {
                this.showFieldError(phoneField, 'Numéro de téléphone invalide. Utilisez un format ivoirien ou international.');
                isValid = false;
            } else {
                this.clearFieldError(phoneField);
            }

            if (!this.state.acceptTerms) {
                generalErrors.push('Merci d\'accepter les conditions de commande.');
                isValid = false;
            }

            if (this.state.deliveryDate) {
                const delivery = new Date(this.state.deliveryDate);
                const today = new Date();
                const minDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
                if (delivery < minDate) {
                    generalErrors.push('La date de livraison doit être au moins 7 jours après aujourd\'hui.');
                    isValid = false;
                }
            }
        // Étape 4 : Récapitulatif & Paiement (anciennement étape 5)
        } else if (step === 4) {
            // Validation finale avant soumission
            console.log('🔍 Validation finale de l\'étape 4 (récapitulatif)...');
            
            // Vérifier les photos (étape 2)
            if (this.state.photoDeliveryMode === 'upload') {
                if (this.uploadedFiles.length < this.minPhotosRequired) {
                    const missing = this.minPhotosRequired - this.uploadedFiles.length;
                    generalErrors.push(`Minimum ${this.minPhotosRequired} photos requis. Il vous manque ${missing} photo${missing > 1 ? 's' : ''}.`);
                    isValid = false;
                }
                if (!this.selectedCoverPhotoId) {
                    generalErrors.push('Sélectionnez une photo de couverture.');
                    isValid = false;
                }
            } else if (this.state.photoDeliveryMode === 'link') {
                if (!this.state.photoLink || !this.state.photoLink.trim()) {
                    generalErrors.push('Indiquez comment vous nous enverrez les photos.');
                    isValid = false;
                }
            }
            
            // Vérifier la livraison (étape 4)
            if (!this.state.deliveryDate || !this.state.deliveryDate.trim()) {
                generalErrors.push('La date de livraison est obligatoire.');
                isValid = false;
            }
            if (!this.state.deliveryAddress || !this.state.deliveryAddress.trim()) {
                generalErrors.push('L\'adresse de livraison est obligatoire.');
                isValid = false;
            }
            if (!this.state.deliveryPhone || !this.state.deliveryPhone.trim()) {
                generalErrors.push('Le numéro de téléphone de livraison est obligatoire.');
                isValid = false;
            } else {
                const normalizedPhone = this.normalizePhoneNumber(this.state.deliveryPhone);
                if (!normalizedPhone) {
                    generalErrors.push('Numéro de téléphone invalide. Utilisez un format ivoirien ou international.');
                    isValid = false;
                }
            }
            if (!this.state.acceptTerms) {
                generalErrors.push('Vous devez accepter les conditions de commande.');
                isValid = false;
            }
            
            console.log('✅ Validation étape 5:', isValid ? 'OK' : 'ÉCHEC', generalErrors.length > 0 ? `(${generalErrors.length} erreur(s))` : '');
        }

        if (generalErrors.length > 0) {
            this.showGeneralError(generalErrors.join(' '), stepEl);
        }

        return Boolean(isValid);
    }

    requireField(fieldId, message) {
        const field = document.getElementById(fieldId);
        if (!field) {
            return true;
        }

        const value = field.value ? field.value.trim() : '';
        if (!value) {
            this.showFieldError(field, message);
            return false;
        }

        this.clearFieldError(field);
        return true;
    }

    showFieldError(field, message) {
        if (!field) {
            return;
        }

        field.style.borderColor = '#DC2626';
        if (field.parentNode && !field.parentNode.querySelector('.field-error')) {
            const errorEl = document.createElement('div');
            errorEl.className = 'field-error';
            errorEl.textContent = message;
            field.parentNode.appendChild(errorEl);
        }
    }

    clearFieldError(field) {
        if (!field) {
            return;
        }

        field.style.borderColor = '';
        const errorEl = field.parentNode ? field.parentNode.querySelector('.field-error') : null;
        if (errorEl) {
            errorEl.remove();
        }
    }

    clearFieldErrors(stepEl) {
        stepEl.querySelectorAll('.field-error').forEach(errorEl => errorEl.remove());
        stepEl.querySelectorAll('input, textarea, select').forEach(field => {
            field.style.borderColor = '';
        });
    }

    showGeneralError(message, stepEl) {
        const container = stepEl || document.querySelector(`.form-step[data-step="${this.currentStep}"]`);
        if (!container) {
            return;
        }

        this.clearGeneralError(container);

        const errorEl = document.createElement('div');
        errorEl.className = 'form-error';
        errorEl.textContent = message;
        container.insertBefore(errorEl, container.firstChild);
    }

    clearGeneralError(stepEl) {
        const container = stepEl || document.querySelector(`.form-step[data-step="${this.currentStep}"]`);
        if (!container) {
            return;
        }

        const existingError = container.querySelector('.form-error');
        if (existingError) {
            existingError.remove();
        }
    }

    syncStateFromForm(step = null) {
        const stepsToSync = step ? [step] : [1, 2, 3, 4];

        stepsToSync.forEach(current => {
            // Étape 1 : Photos (anciennement étape 2)
            if (current === 1) {
                const captions = {};
                document.querySelectorAll('#photo-captions-list .photo-caption-item').forEach(item => {
                    const fileId = item.dataset.fileId;
                    const textarea = item.querySelector('textarea');
                    if (fileId && textarea) {
                        const caption = textarea.value.trim();
                        if (caption) {
                            captions[fileId] = caption;
                        }
                    }
                });
                this.state.captions = captions;

                const photoDeliveryRadio = document.querySelector('input[name="photoDeliveryMode"]:checked');
                this.state.photoDeliveryMode = photoDeliveryRadio ? photoDeliveryRadio.value : 'upload';
                this.state.photoLink = this.state.photoDeliveryMode === 'link' ? this.getInputValue('photoLink') : '';
            }

            if (current === 3) {
                this.state.customColors = this.getInputValue('customColors');
                const styleSelect = document.getElementById('style');
                this.state.style = styleSelect ? styleSelect.value : '';
                this.state.additionalInfo = this.getInputValue('additionalInfo');
            }

            if (current === 4) {
                this.state.deliveryDate = this.getInputValue('deliveryDate');
                this.state.deliveryAddress = this.getInputValue('deliveryAddress');
                this.state.deliveryPhone = this.getInputValue('deliveryPhone');
                const acceptTerms = document.getElementById('acceptTerms');
                this.state.acceptTerms = acceptTerms ? acceptTerms.checked : false;
            }

            if (current === 5) {
                const paymentMethod = this.form.querySelector('input[name="paymentMethod"]:checked');
                this.state.paymentMethod = paymentMethod ? paymentMethod.value : 'whatsapp';
            }
        });

        this.state.selectedCoverPhotoId = this.selectedCoverPhotoId;
    }

    getInputValue(fieldId) {
        const field = document.getElementById(fieldId);
        return field ? field.value.trim() : '';
    }

    isValidEmail(email) {
        if (!email) {
            return false;
        }
        const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return pattern.test(email);
    }

    normalizePhoneNumber(rawPhone) {
        if (!rawPhone) {
            return null;
        }
        let digits = rawPhone.replace(/\D/g, '');
        if (!digits) {
            return null;
        }
        if (digits.startsWith('00')) {
            digits = digits.slice(2);
        }
        if (digits.startsWith('225') && digits.length === 12) {
            return `+${digits}`;
        }
        if (digits.startsWith('0') && digits.length === 10) {
            return `+225${digits.slice(1)}`;
        }
        if (!digits.startsWith('0') && digits.length >= 8 && digits.length <= 15) {
            return `+${digits}`;
        }
        return null;
    }

    setupFileUpload() {
        const uploadArea = document.getElementById('fileUploadArea');
        const fileInput = document.getElementById('photoUpload');
        if (!uploadArea || !fileInput) {
            return;
        }

        const stopDefaults = (event) => {
            event.preventDefault();
            event.stopPropagation();
        };

        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, stopDefaults, false);
        });

        uploadArea.addEventListener('dragover', () => {
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (event) => {
            uploadArea.classList.remove('dragover');
            this.handleFiles(event.dataTransfer.files);
        });

        uploadArea.addEventListener('click', () => {
            fileInput.click();
        });

        fileInput.addEventListener('change', () => {
            if (fileInput.files) {
                this.handleFiles(fileInput.files);
                fileInput.value = '';
            }
        });
    }

    setupPhotoDeliveryMode() {
        const radios = document.querySelectorAll('input[name="photoDeliveryMode"]');
        const linkGroup = document.getElementById('photoLinkGroup');
        const linkInput = document.getElementById('photoLink');

        if (!radios.length) {
            return;
        }

        const applyMode = (mode) => {
            const useUpload = mode !== 'link';
            this.state.photoDeliveryMode = useUpload ? 'upload' : 'link';

            if (linkGroup) {
                linkGroup.style.display = useUpload ? 'none' : 'block';
            }

            if (useUpload) {
                this.state.photoLink = '';
                if (linkInput) {
                    linkInput.value = '';
                }
            } else {
                this.selectedCoverPhotoId = null;
                this.state.selectedCoverPhotoId = null;
                this.state.captions = {};
            }

            this.renderCoverOptions();
            this.renderCaptions();
            this.updatePhotoCounter();
        };

        radios.forEach(radio => {
            radio.addEventListener('change', () => {
                if (!radio.checked) {
                    return;
                }
                applyMode(radio.value);
                this.persistState();
                this.updateSummary();
            });
        });

        if (linkInput) {
            linkInput.addEventListener('input', () => {
                this.state.photoLink = linkInput.value.trim();
                this.persistState();
                this.updateSummary();
            });
        }

        const initialMode = this.state.photoDeliveryMode || 'upload';
        const selectedRadio = Array.from(radios).find(radio => radio.value === initialMode);
        if (selectedRadio) {
            selectedRadio.checked = true;
        }
        if (initialMode === 'link' && linkInput) {
            linkInput.value = this.state.photoLink || '';
        }
        applyMode(initialMode);
    }

     handleFiles(fileList) {
         const files = Array.from(fileList);
         if (!files.length) {
             return;
         }

         const validTypes = ['image/png', 'image/jpeg', 'image/jpg'];
         const maxSize = 10 * 1024 * 1024; // 10MB max
         const stepEl = document.querySelector('[data-step="2"]');

         files.forEach(file => {
             if (!validTypes.includes(file.type)) {
                 this.showGeneralError(`Le fichier ${file.name} n'est pas un format d'image valide (PNG, JPG, JPEG).`, stepEl);
                 return;
             }

             if (file.size > maxSize) {
                 this.showGeneralError(`Le fichier ${file.name} est trop volumineux (${this.formatFileSize(file.size)}). Maximum autorisé : 10MB.`, stepEl);
                 return;
             }

             this.compressAndUploadFile(file);
         });
     }

     async compressAndUploadFile(file) {
         try {
             // Afficher un indicateur de compression
             this.showCompressionIndicator(file.name);

             // Compression de l'image
             const compressedData = await this.compressImage(file);
             
            // ⚠️ STRATÉGIE "GRATUIT À VIE" : On désactive l'upload Supabase pour les images
            // pour ne pas saturer la limite de 1GB. On force l'utilisation du stockage du serveur backend.
            /*
            // Essayer Supabase en premier si disponible
            if (window.APP_CONFIG?.useSupabase && window.supabaseService) {
                try {
                    const uploadResult = await window.supabaseService.uploadFile({
                        name: file.name,
                        type: file.type,
                        size: file.size,
                        data: compressedData
                    });

                    if (uploadResult && uploadResult.success) {
                        const uploadedFile = uploadResult.data.files[0];
                        const fileData = {
                            id: uploadedFile.id || `file-${Date.now()}`,
                            name: file.name,
                            data: compressedData,
                            type: file.type,
                            size: file.size,
                            compressedSize: compressedData.length,
                            serverId: uploadedFile.id,
                            serverUrl: uploadedFile.server_url
                        };

                        this.uploadedFiles.push(fileData);
                        this.renderUploadedFiles();
                        this.persistState();
                        
                        if (this.currentStep === 4) {
                            this.updateSummary();
                        }

                        this.hideCompressionIndicator();
                        return; // Succès, sortir de la fonction
                    }
                } catch (supabaseError) {
                    console.warn('Erreur upload Supabase, fallback backend:', supabaseError);
                    // Continuer avec le backend classique
                }
            }
            */
            
            // Fallback vers le backend classique
            if (!API_BASE_URL) {
                throw new Error('Backend non configuré. Impossible d\'uploader les photos. Veuillez contacter le support.');
            }

            // Upload vers le serveur - PAS de fallback pour les uploads
            const uploadResult = await apiCall('/api/files/upload', 'POST', {
                name: file.name,
                type: file.type,
                size: file.size,
                data: compressedData
            });

             if (uploadResult && uploadResult.success) {
                 const uploadedFile = uploadResult.data?.files?.[0];
                 if (!uploadedFile) {
                     throw new Error('Réponse serveur invalide : fichier non reçu');
                 }

                 const fileData = {
                     id: uploadedFile.id || `file-${Date.now()}`,
                     name: file.name,
                     data: compressedData, // Garder en mémoire pour l'affichage
                     type: file.type,
                     size: file.size,
                     compressedSize: compressedData.length,
                     serverId: uploadedFile.id, // ID serveur pour référence
                     serverUrl: uploadedFile.url // URL serveur si disponible
                 };

                this.uploadedFiles.push(fileData);
                this.renderUploadedFiles();
                // Persister l'état (sans les données base64 complètes pour économiser localStorage)
                this.persistState();
                 
                 if (this.currentStep === 4) {
                     this.updateSummary();
                 }

                 this.hideCompressionIndicator();
             } else {
                 throw new Error(uploadResult?.error || uploadResult?.message || 'Erreur lors de l\'upload');
             }
         } catch (error) {
             this.hideCompressionIndicator();
             const errorMsg = error.message || 'Erreur lors du traitement du fichier';
             this.showGeneralError(`Erreur lors du traitement de ${file.name}: ${errorMsg}. Veuillez réessayer ou contacter le support.`, document.querySelector('[data-step="2"]'));
             console.error('Erreur upload fichier:', error);
         }
     }

     async compressImage(file, maxWidth = 3500, quality = 0.9) {
         return new Promise((resolve) => {
             const canvas = document.createElement('canvas');
             const ctx = canvas.getContext('2d');
             const img = new Image();

             img.onload = () => {
                 // Calculer les nouvelles dimensions
                 let { width, height } = img;
                 if (width > maxWidth) {
                     height = (height * maxWidth) / width;
                     width = maxWidth;
                 }

                 canvas.width = width;
                 canvas.height = height;

                 // Dessiner l'image redimensionnée
                 ctx.drawImage(img, 0, 0, width, height);

                 // Convertir en base64 avec compression
                 const compressedData = canvas.toDataURL('image/jpeg', quality);
                 resolve(compressedData);
             };

             img.src = URL.createObjectURL(file);
         });
     }

     showCompressionIndicator(fileName) {
         const indicator = document.createElement('div');
         indicator.className = 'compression-indicator';
         indicator.innerHTML = `
             <div class="compression-content">
                 <div class="compression-spinner"></div>
                 <span>Compression de ${fileName}...</span>
             </div>
         `;
         document.body.appendChild(indicator);
     }

     hideCompressionIndicator() {
         const indicator = document.querySelector('.compression-indicator');
         if (indicator) {
             indicator.remove();
         }
     }

     formatFileSize(bytes) {
         if (bytes === 0) return '0 Bytes';
         const k = 1024;
         const sizes = ['Bytes', 'KB', 'MB', 'GB'];
         const i = Math.floor(Math.log(bytes) / Math.log(k));
         return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
     }

    renderUploadedFiles() {
        const container = document.getElementById('uploaded-files');
        if (!container) {
            return;
        }

        container.innerHTML = '';

        this.uploadedFiles.forEach(file => {
            const fileEl = document.createElement('div');
            fileEl.className = 'uploaded-file';
            fileEl.dataset.fileId = file.id;
            fileEl.innerHTML = `
                <img src="${file.data}" alt="${this.escapeHtml(file.name)}">
                <div class="file-info">
                    <span class="file-name">${this.escapeHtml(file.name)}</span>
                    <button type="button" class="remove-file" aria-label="Supprimer ${this.escapeHtml(file.name)}">&times;</button>
                </div>
            `;

            const removeButton = fileEl.querySelector('.remove-file');
            removeButton.addEventListener('click', (event) => {
                event.stopPropagation();
                this.removeFile(file.id);
            });

            container.appendChild(fileEl);
        });

        this.renderCoverOptions();
        this.renderCaptions();
        this.updatePhotoCounter();
    }

    removeFile(fileId) {
        this.uploadedFiles = this.uploadedFiles.filter(file => file.id !== fileId);
        delete this.state.captions[fileId];

        if (this.selectedCoverPhotoId === fileId) {
            this.selectedCoverPhotoId = null;
            this.state.selectedCoverPhotoId = null;
        }

        this.renderUploadedFiles();
        this.persistState();
        this.updateSummary();
    }

    renderCoverOptions() {
        const coverSelection = document.getElementById('cover-selection');
        if (!coverSelection) {
            return;
        }

        if (this.state.photoDeliveryMode === 'link') {
            coverSelection.innerHTML = '<p>Vous enverrez vos photos plus tard. Nous choisirons la meilleure couverture avec vous après réception.</p>';
            return;
        }

        if (!this.uploadedFiles.length) {
            coverSelection.innerHTML = '<p>Sélectionnez d\'abord vos photos ci-dessus</p>';
            return;
        }

        coverSelection.innerHTML = '<h4>Sélectionnez votre photo de couverture :</h4>';

        this.uploadedFiles.forEach((file, index) => {
            const optionEl = document.createElement('div');
            optionEl.className = 'cover-option';
            if (this.selectedCoverPhotoId === file.id) {
                optionEl.classList.add('selected');
            }

            optionEl.innerHTML = `
                <img src="${file.data}" alt="${this.escapeHtml(file.name)}">
                <div class="cover-overlay">
                    <span class="cover-label">Photo ${index + 1}</span>
                </div>
            `;

            optionEl.addEventListener('click', () => {
                this.selectedCoverPhotoId = file.id;
                this.state.selectedCoverPhotoId = file.id;
                this.renderCoverOptions();
                this.persistState();
                if (this.currentStep === 4) {
                    this.updateSummary();
                }
            });

            coverSelection.appendChild(optionEl);
        });
    }

    renderCaptions() {
        const captionsContainer = document.getElementById('photo-captions-list');
        if (!captionsContainer) {
            return;
        }

        captionsContainer.innerHTML = '';

        if (this.state.photoDeliveryMode === 'link') {
            const info = document.createElement('p');
            info.className = 'help-text';
            info.textContent = 'Vous pourrez ajouter des légendes lorsque vous nous transmettrez vos photos.';
            captionsContainer.appendChild(info);
            return;
        }

        if (!this.uploadedFiles.length) {
            const info = document.createElement('p');
            info.className = 'help-text';
            info.textContent = 'Ajoutez des photos pour définir leurs légendes.';
            captionsContainer.appendChild(info);
            return;
        }

        this.uploadedFiles.forEach(file => {
            const captionEl = document.createElement('div');
            captionEl.className = 'photo-caption-item';
            captionEl.dataset.fileId = file.id;

            const header = document.createElement('div');
            header.className = 'caption-header';
            header.innerHTML = `<span class="caption-filename">${this.escapeHtml(file.name)}</span>`;

            const textarea = document.createElement('textarea');
            textarea.name = `photo-caption-${file.id}`;
            textarea.rows = 2;
            textarea.placeholder = 'Ajoutez une légende pour cette photo (optionnel)';
            textarea.value = this.state.captions[file.id] || '';

            textarea.addEventListener('input', () => {
                const value = textarea.value.trim();
                if (value) {
                    this.state.captions[file.id] = value;
                } else {
                    delete this.state.captions[file.id];
                }
                this.persistState();
                if (this.currentStep === 4) {
                    this.updateSummary();
                }
            });

            captionEl.appendChild(header);
            captionEl.appendChild(textarea);
            captionsContainer.appendChild(captionEl);
        });
    }

    updatePhotoCounter() {
        const uploadArea = document.getElementById('fileUploadArea');
        if (!uploadArea) {
            return;
        }

        let counterEl = document.getElementById('photo-counter');
        if (!counterEl) {
            counterEl = document.createElement('div');
            counterEl.id = 'photo-counter';
            counterEl.className = 'photo-counter';
            const uploadContent = uploadArea.querySelector('.upload-content');
            if (uploadContent) {
                uploadContent.appendChild(counterEl);
            }
        }

        const mode = this.state.photoDeliveryMode || 'upload';
        const count = this.uploadedFiles.length;

        if (mode === 'link') {
            counterEl.innerHTML = `
                <div class="counter-info">
                    <span class="count info">${count}</span>
                    <span class="separator">/</span>
                    <span class="min-required">30 photos recommandées</span>
                </div>
                <div class="counter-status info">
                    Vous enverrez vos photos via un lien ou WhatsApp. Nous vous guiderons pour la sélection de couverture.
                </div>
                <p class="counter-note">Vous pouvez tout de même ajouter quelques photos dès maintenant si vous disposez déjà d’images clés.</p>
            `;
            return;
        }

        const missing = Math.max(0, this.minPhotosRequired - count);
        const statusClass = missing === 0 ? 'valid' : 'invalid';
        const statusText = missing === 0
            ? '<i class="fas fa-check" aria-hidden="true"></i> Prêt pour l\'étape suivante'
            : `<i class="fas fa-exclamation-triangle" aria-hidden="true"></i> Ajoutez encore ${missing} photo${missing > 1 ? 's' : ''}`;

        counterEl.innerHTML = `
            <div class="counter-info">
                <span class="count ${statusClass}">${count}</span>
                <span class="separator">/</span>
                <span class="min-required">${this.minPhotosRequired} minimum</span>
            </div>
            <div class="counter-status ${statusClass}">
                ${statusText}
            </div>
            <p class="counter-note">30 photos minimum requis pour créer un magazine de 24 pages de qualité. Chaque photo sera retouchée et mise en page professionnellement.</p>
        `;
    }

    setupAnecdotes() {
        const addButton = document.getElementById('add-anecdote');
        const container = document.getElementById('anecdotes-container');
        if (!addButton || !container) {
            return;
        }

        addButton.addEventListener('click', () => {
            const item = this.createAnecdoteItem();
            container.appendChild(item);
            this.syncStateFromForm(1);
            this.persistState();
        });

        container.querySelectorAll('.anecdote-item').forEach(item => {
            this.attachAnecdoteRemoveHandler(item);
        });
    }

    createAnecdoteItem(data = {}) {
        const { title = '', text = '' } = data;
        const item = document.createElement('div');
        item.className = 'anecdote-item';
        item.innerHTML = `
            <input type="text" name="anecdoteTitle[]" placeholder="Titre de l'anecdote">
            <textarea name="anecdoteText[]" rows="2" placeholder="Racontez l'anecdote..."></textarea>
            <button type="button" class="remove-anecdote">Supprimer</button>
        `;

        const titleField = item.querySelector('input[name="anecdoteTitle[]"]');
        const textField = item.querySelector('textarea[name="anecdoteText[]"]');
        titleField.value = title;
        textField.value = text;

        this.attachAnecdoteRemoveHandler(item);
        return item;
    }

    attachAnecdoteRemoveHandler(item) {
        const removeButton = item.querySelector('.remove-anecdote');
        if (!removeButton) {
            return;
        }
        removeButton.addEventListener('click', () => {
            item.remove();
            this.syncStateFromForm(1);
            this.persistState();
            this.updateSummary();
        });
    }

    setupTestimonials() {
        const radios = document.querySelectorAll('input[name="testimonials"]');
        const container = document.getElementById('testimonials-container');
        const addButton = document.getElementById('add-testimonial');

        if (!container || !radios.length) {
            return;
        }

        radios.forEach(radio => {
            radio.addEventListener('change', () => {
                this.state.includeTestimonials = radio.value;
                this.toggleTestimonialsVisibility(radio.value === 'yes');
                this.syncStateFromForm(1);
                this.persistState();
            });
        });

        if (addButton) {
            addButton.addEventListener('click', () => {
                const item = this.createTestimonialItem();
                container.appendChild(item);
                this.syncStateFromForm(1);
                this.persistState();
            });
        }

        container.querySelectorAll('.testimonial-item').forEach(item => {
            this.attachTestimonialRemoveHandler(item);
        });
    }

    createTestimonialItem(data = {}) {
        const { name = '', relation = '', text = '' } = data;
        const item = document.createElement('div');
        item.className = 'testimonial-item';
        item.innerHTML = `
            <input type="text" name="testimonialName[]" placeholder="Nom de la personne">
            <input type="text" name="testimonialRelation[]" placeholder="Lien avec la personne célébrée">
            <textarea name="testimonialText[]" rows="2" placeholder="Leur témoignage..."></textarea>
            <button type="button" class="remove-testimonial">Supprimer</button>
        `;

        item.querySelector('input[name="testimonialName[]"]').value = name;
        item.querySelector('input[name="testimonialRelation[]"]').value = relation;
        item.querySelector('textarea[name="testimonialText[]"]').value = text;

        this.attachTestimonialRemoveHandler(item);
        return item;
    }

    attachTestimonialRemoveHandler(item) {
        const removeButton = item.querySelector('.remove-testimonial');
        if (!removeButton) {
            return;
        }
        removeButton.addEventListener('click', () => {
            item.remove();
            this.syncStateFromForm(1);
            this.persistState();
            this.updateSummary();
        });
    }

    toggleTestimonialsVisibility(show) {
        const container = document.getElementById('testimonials-container');
        if (!container) {
            return;
        }

        container.style.display = show ? 'block' : 'none';
        if (!show) {
            container.querySelectorAll('.testimonial-item').forEach(item => item.remove());
        } else if (!container.querySelector('.testimonial-item')) {
            container.appendChild(this.createTestimonialItem());
        }
    }

    setupColorPicker() {
        const trigger = document.getElementById('colorPickerTrigger');
        const dropdown = document.getElementById('colorPickerDropdown');
        const closeBtn = document.getElementById('closeColorPicker');
        const colorPreview = document.getElementById('colorPreview');
        const customColorInput = document.getElementById('customColorHex');
        const applyCustomColorBtn = document.getElementById('applyCustomColor');
        const customColorPreview = document.getElementById('customColorPreview');
        const selectedColorValue = document.getElementById('selectedColorValue');
        
        if (!trigger || !dropdown) {
            return;
        }

        // Ouvrir/fermer le dropdown
        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = dropdown.style.display !== 'none';
            dropdown.style.display = isOpen ? 'none' : 'block';
        });

        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                dropdown.style.display = 'none';
            });
        }

        // Fermer en cliquant en dehors
        document.addEventListener('click', (e) => {
            if (!trigger.contains(e.target) && !dropdown.contains(e.target)) {
                dropdown.style.display = 'none';
            }
        });

        // Sélectionner une couleur prédéfinie
        const colorOptions = dropdown.querySelectorAll('.color-option');
        colorOptions.forEach(option => {
            option.addEventListener('click', () => {
                colorOptions.forEach(opt => opt.classList.remove('selected'));
                option.classList.add('selected');
                
                const colorHex = option.dataset.hex || '#F5C542';
                const colorName = option.dataset.color || 'gold';
                
                this.state.selectedPaletteColor = colorName;
                this.state.customColorHex = colorHex;
                
                // Mettre à jour l'aperçu
                if (colorPreview) {
                    colorPreview.style.background = colorHex;
                }
                if (selectedColorValue) {
                    selectedColorValue.value = colorHex;
                }
                
                // Mettre à jour le label
                const label = trigger.querySelector('.color-picker-label');
                if (label) {
                    label.textContent = `${option.title || colorName} (${colorHex})`;
                }
                
                this.persistState();
                if (this.currentStep === 4) {
                    this.updateSummary();
                }
                
                // Fermer le dropdown après sélection
                setTimeout(() => {
                    dropdown.style.display = 'none';
                }, 300);
            });
        });

        // Appliquer une couleur personnalisée
        if (applyCustomColorBtn && customColorInput) {
            applyCustomColorBtn.addEventListener('click', () => {
                let hexValue = customColorInput.value.trim().toUpperCase();
                
                // Ajouter # si manquant
                if (!hexValue.startsWith('#')) {
                    hexValue = '#' + hexValue;
                }
                
                // Valider le format hex
                if (/^#[0-9A-F]{6}$/i.test(hexValue)) {
                    // Désélectionner les couleurs prédéfinies
                    colorOptions.forEach(opt => opt.classList.remove('selected'));
                    
                    this.state.selectedPaletteColor = null;
                    this.state.customColorHex = hexValue;
                    
                    // Mettre à jour les aperçus
                    if (colorPreview) {
                        colorPreview.style.background = hexValue;
                    }
                    if (customColorPreview) {
                        customColorPreview.style.background = hexValue;
                    }
                    if (selectedColorValue) {
                        selectedColorValue.value = hexValue;
                    }
                    
                    // Mettre à jour le label
                    const label = trigger.querySelector('.color-picker-label');
                    if (label) {
                        label.textContent = `Couleur personnalisée (${hexValue})`;
                    }
                    
                    this.persistState();
                    if (this.currentStep === 4) {
                        this.updateSummary();
                    }
                } else {
                    alert('Format invalide. Veuillez entrer un code couleur hexadécimal (ex: #F5C542)');
                    customColorInput.focus();
                }
            });
        }

        // Mettre à jour l'aperçu en temps réel lors de la saisie
        if (customColorInput) {
            customColorInput.addEventListener('input', (e) => {
                let hexValue = e.target.value.trim().toUpperCase();
                if (!hexValue.startsWith('#')) {
                    hexValue = '#' + hexValue;
                }
                
                if (/^#[0-9A-F]{0,6}$/i.test(hexValue)) {
                    if (customColorPreview && hexValue.length === 7) {
                        customColorPreview.style.background = hexValue;
                    }
                }
            });
        }

        // Restaurer la couleur sélectionnée si elle existe
        if (this.state.customColorHex) {
            const hex = this.state.customColorHex;
            if (colorPreview) {
                colorPreview.style.background = hex;
            }
            const label = trigger.querySelector('.color-picker-label');
            if (label) {
                label.textContent = `Couleur sélectionnée (${hex})`;
            }
        } else if (this.state.selectedPaletteColor) {
            const selectedOption = dropdown.querySelector(`.color-option[data-color="${this.state.selectedPaletteColor}"]`);
            if (selectedOption) {
                selectedOption.classList.add('selected');
                const hex = selectedOption.dataset.hex || '#F5C542';
                if (colorPreview) {
                    colorPreview.style.background = hex;
                }
                const label = trigger.querySelector('.color-picker-label');
                if (label) {
                    label.textContent = `${selectedOption.title || this.state.selectedPaletteColor} (${hex})`;
                }
            }
        }
    }

    setupDateValidation() {
        const deliveryDateInput = document.getElementById('deliveryDate');
        if (!deliveryDateInput) {
            return;
        }
        const today = new Date();
        const minDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
        deliveryDateInput.min = minDate.toISOString().split('T')[0];
    }

    generateSummary() {
        this.syncStateFromForm();
        this.updateSummary();
    }

    updateSummary() {
        const summaryInfo = document.getElementById('summary-info');
        const summaryPhotos = document.getElementById('summary-photos');
        const summaryDelivery = document.getElementById('summary-delivery');
        if (!summaryInfo || !summaryPhotos || !summaryDelivery) {
            return;
        }

        const colorLabels = {
            gold: 'Or doux',
            honey: 'Miel',
            amber: 'Ambre',
            sand: 'Sable clair'
        };

        summaryInfo.innerHTML = `
            <h3>Informations</h3>
            <p><em>Les informations détaillées (personne célébrée, occasion, anecdotes, etc.) seront collectées lors du contact WhatsApp après la commande.</em></p>
        `;

        const selectedCover = this.getSelectedCoverPhoto();
        const captions = this.state.captions || {};
        const selectedPalette = colorLabels[this.state.selectedPaletteColor] || null;
        const photoModeLabels = {
            upload: 'Téléchargement sur le site',
            link: 'Lien ou envoi différé'
        };
        const photoMode = this.state.photoDeliveryMode || 'upload';
        const coverLabel = photoMode === 'link'
            ? 'À définir après réception des photos'
            : (selectedCover ? this.outputText(selectedCover.name) : 'Non sélectionnée');
        const photoCountBadge = photoMode === 'upload'
            ? `${this.uploadedFiles.length} ${this.uploadedFiles.length >= this.minPhotosRequired ? '<i class="fas fa-check" aria-hidden="true"></i>' : '<i class="fas fa-exclamation-triangle" aria-hidden="true"></i>'}`
            : 'À réception';

        summaryPhotos.innerHTML = `
            <h3>Photos & style</h3>
            <p><strong>Mode d'envoi :</strong> ${photoModeLabels[photoMode] || 'À confirmer'}</p>
            <p><strong>Nombre de photos :</strong> ${photoCountBadge}</p>
            ${photoMode === 'link' && this.state.photoLink ? `<p><strong>Lien / instructions :</strong> ${this.outputText(this.state.photoLink)}</p>` : ''}
            <p><strong>Photo de couverture :</strong> ${coverLabel}</p>
            ${this.state.style ? `<p><strong>Style souhaité :</strong> ${this.outputText(this.state.style)}</p>` : ''}
            ${selectedPalette ? `<p><strong>Palette privilégiée :</strong> ${selectedPalette}</p>` : ''}
            ${this.state.customColors ? `<p><strong>Couleurs personnalisées :</strong> ${this.outputText(this.state.customColors)}</p>` : ''}
            ${this.state.additionalInfo ? `<p><strong>Instructions supplémentaires :</strong> ${this.outputText(this.state.additionalInfo)}</p>` : ''}
            ${Object.keys(captions).length ? `
                <h4>Légendes de photos</h4>
                ${Object.entries(captions).map(([fileId, value]) => {
                    const file = this.uploadedFiles.find(item => item.id === fileId);
                    return file ? `<p><strong>${this.outputText(file.name)} :</strong> ${this.outputText(value)}</p>` : '';
                }).join('')}
            ` : ''}
        `;

        const paymentLabels = {
            whatsapp: 'Paiement via WhatsApp',
            bank: 'Virement bancaire',
            cash: 'Paiement à la livraison'
        };

        summaryDelivery.innerHTML = `
            <h3>Livraison & Paiement</h3>
            <p><strong>Date de livraison :</strong> ${this.state.deliveryDate ? this.outputText(this.state.deliveryDate) : 'Non renseigné'}</p>
            <p><strong>Adresse :</strong> ${this.outputText(this.state.deliveryAddress) || 'Non renseignée'}</p>
            <p><strong>Téléphone :</strong> ${this.outputText(this.state.deliveryPhone) || 'Non renseigné'}</p>
            <p><strong>Méthode de paiement :</strong> ${paymentLabels[this.state.paymentMethod] || 'Non sélectionnée'}</p>
            <p><strong>Conditions acceptées :</strong> ${this.state.acceptTerms ? 'Oui <i class="fas fa-check" aria-hidden="true"></i>' : 'Non <i class="fas fa-exclamation-triangle" aria-hidden="true"></i>'}</p>
        `;
    }

    getSelectedCoverPhoto() {
        return this.uploadedFiles.find(file => file.id === this.selectedCoverPhotoId) || null;
    }

     async submitOrder() {
        const submitButton = this.form.querySelector('button[type="submit"]');
        if (!submitButton) {
            console.error('❌ Bouton de soumission non trouvé');
            alert('Erreur : Le bouton de soumission est introuvable. Veuillez recharger la page.');
            return;
        }

        const originalLabel = submitButton.textContent;
        submitButton.disabled = true;
        submitButton.textContent = 'Traitement en cours...';

        const stepEl = document.querySelector('[data-step="5"]');
        if (!stepEl) {
            console.error('❌ Élément de l\'étape 5 non trouvé');
            submitButton.disabled = false;
            submitButton.textContent = originalLabel;
            alert('Erreur : Impossible de trouver la section de confirmation. Veuillez recharger la page.');
            return;
        }
        
        this.clearGeneralError(stepEl);

        try {
            console.log('🚀 Début de la soumission de la commande...');
            console.log('📋 État actuel:', {
                currentStep: this.currentStep,
                hasFiles: this.uploadedFiles.length,
                personName: this.state.personName,
                customerEmail: this.state.customerEmail,
                useSupabase: window.APP_CONFIG?.useSupabase,
                supabaseService: !!window.supabaseService
            });
            
            const orderData = this.prepareOrderData();
            console.log('✅ Données de commande préparées:', {
                hasFiles: orderData.uploadedFiles?.length || 0,
                hasPersonName: !!orderData.personName,
                hasEmail: !!orderData.clientEmail,
                hasDeliveryDate: !!orderData.deliveryDate,
                hasDeliveryAddress: !!orderData.deliveryAddress
            });
            
            // Vérifier que les données essentielles sont présentes (sans les champs supprimés)
            if (!orderData.deliveryDate || !orderData.deliveryAddress) {
                const missingFields = [];
                if (!orderData.deliveryDate) missingFields.push('Date de livraison');
                if (!orderData.deliveryAddress) missingFields.push('Adresse de livraison');
                
                throw new Error(`Données manquantes : ${missingFields.join(', ')}. Veuillez compléter toutes les étapes du formulaire.`);
            }
            
            const response = await this.sendOrderToBackend(orderData);
            console.log('📥 Réponse du backend:', response);

            if (response && response.success) {
                console.log('✅ Commande créée avec succès:', response.orderNumber);
                this.showSuccessMessage(
                    response.orderId, 
                    response.orderNumber
                );
                this.clearForm();
            } else {
                const errorMsg = response?.message || 'Erreur inconnue lors de la soumission.';
                console.error('❌ Erreur de soumission:', errorMsg);
                console.error('📋 Réponse complète:', response);
                throw new Error(errorMsg);
            }
        } catch (error) {
            console.error('Erreur complète lors de la soumission:', error);
            let errorMessage = 'Erreur lors de la soumission de votre commande.';
            
            // Gérer différents types d'erreurs
            if (error.message) {
                errorMessage = error.message;
            } else if (error.originalError) {
                errorMessage = error.message || error.originalError.message || errorMessage;
            }
            
            // Messages spécifiques selon le type d'erreur
            if (errorMessage.includes('Supabase') || errorMessage.includes('relation') || errorMessage.includes('permission denied') || errorMessage.includes('table')) {
                // Erreur Supabase - ne pas mentionner le backend
                if (errorMessage.includes('relation') || errorMessage.includes('does not exist')) {
                    errorMessage = 'Les tables Supabase n\'existent pas encore.\n\n✅ Solution :\n1. Allez sur https://app.supabase.com/\n2. Ouvrez SQL Editor\n3. Exécutez le fichier supabase-setup.sql\n\nConsultez SETUP-SUPABASE-COMPLET.md pour les instructions détaillées.';
                } else if (errorMessage.includes('permission') || errorMessage.includes('denied')) {
                    errorMessage = 'Erreur de permissions Supabase.\n\n✅ Solution : Exécutez le fichier supabase-setup.sql dans Supabase (SQL Editor) pour configurer les politiques RLS.';
                } else if (errorMessage.includes('Invalid API key') || errorMessage.includes('401')) {
                    errorMessage = 'Clé API Supabase invalide.\n\n✅ Solution : Vérifiez que la clé API dans index.html correspond à celle de votre projet Supabase (Settings > API).';
                } else {
                    errorMessage = errorMessage + '\n\nConsultez DEBUG-SUPABASE.md pour résoudre le problème.';
                }
            } else if (errorMessage.includes('Backend non configuré') || errorMessage.includes('non disponible')) {
                errorMessage = 'Le serveur backend n\'est pas disponible. Veuillez réessayer plus tard ou contactez-nous sur WhatsApp : +225 07 67 66 04 76';
            } else if (errorMessage.includes('connexion') || errorMessage.includes('connecter') || errorMessage.includes('Load failed') || errorMessage.includes('Failed to fetch')) {
                // Si Supabase est configuré, ne pas mentionner le backend
                if (window.APP_CONFIG?.useSupabase) {
                    errorMessage = 'Impossible de se connecter à Supabase.\n\n✅ Vérifiez :\n1. Votre connexion Internet fonctionne\n2. L\'URL Supabase est correcte\n3. Les tables existent dans Supabase\n\nConsultez DEBUG-SUPABASE.md pour plus d\'aide.';
                } else {
                    errorMessage = 'Impossible de se connecter au serveur. Vérifiez que :\n\n1. Le serveur backend est démarré (http://localhost:3000)\n2. Votre connexion Internet fonctionne\n3. Aucun pare-feu ne bloque la connexion\n\nSi le problème persiste, contactez-nous sur WhatsApp : +225 07 67 66 04 76';
                }
            } else if (errorMessage.includes('CORS')) {
                errorMessage = 'Erreur de sécurité. Le serveur doit être configuré pour accepter les requêtes depuis cette origine.';
            } else if (errorMessage.includes('timeout')) {
                errorMessage = 'La requête a pris trop de temps. Le serveur est peut-être surchargé. Veuillez réessayer.';
            }
            
            this.showGeneralError(errorMessage, stepEl);
            
            // Afficher aussi une alerte pour s'assurer que l'utilisateur voit l'erreur
            setTimeout(() => {
                const alertMessage = errorMessage.includes('\n') 
                    ? `❌ ${errorMessage}` 
                    : `❌ ${errorMessage}\n\nSi le problème persiste, contactez-nous sur WhatsApp : +225 07 67 66 04 76`;
                alert(alertMessage);
            }, 500);
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = originalLabel;
        }
    }

     // Système de récupération de leads en cas d'abandon
     setupLeadRecovery() {
         let abandonTimer;
         let hasInteracted = false;
         
         // Détecter l'interaction avec le formulaire
         this.form.addEventListener('input', () => {
             hasInteracted = true;
             clearTimeout(abandonTimer);
             
             // Timer de 2 minutes après la dernière interaction
             abandonTimer = setTimeout(() => {
                 if (hasInteracted && this.currentStep < 5) {
                     this.showAbandonRecovery();
                 }
             }, 120000); // 2 minutes
         });

         // Détecter la tentative de fermeture de page
         window.addEventListener('beforeunload', (e) => {
             if (hasInteracted && this.currentStep < 5) {
                 e.preventDefault();
                 e.returnValue = 'Vous avez commencé une commande. Êtes-vous sûr de vouloir quitter ?';
                 return e.returnValue;
             }
         });
     }

     async showAbandonRecovery() {
         // Créer un lead avant d'afficher la modal
         try {
             this.syncStateFromForm();
             const orderData = this.prepareOrderData();
             const leadData = this.buildLeadPayload(orderData);
             
             // Essayer Supabase en premier si disponible
             if (window.APP_CONFIG?.useSupabase && window.supabaseService) {
                 try {
                     await window.supabaseService.createLead(leadData);
                     console.log('✅ Lead créé avec succès dans Supabase');
                     // Continuer pour afficher la modal
                 } catch (supabaseError) {
                     // ⚠️ SÉCURITÉ: Si erreur RLS, ne pas réessayer
                     if (supabaseError.rlsError) {
                         console.error('🚨 Erreur RLS lors de la création du lead - Accès refusé');
                         // Continuer avec le fallback backend/WhatsApp
                     } else {
                         console.warn('Erreur création lead Supabase, fallback:', supabaseError);
                     }
                 }
             }
             
             // Fallback vers le backend classique
             if (API_BASE_URL) {
                 try {
                     await apiCall('/api/leads', 'POST', leadData);
                     console.log('Lead créé avec succès');
                 } catch (error) {
                     console.warn('Erreur création lead, fallback WhatsApp:', error);
                     // En cas d'erreur, envoyer via WhatsApp
                     this.sendLeadViaWhatsApp(leadData);
                 }
             } else {
                 // Pas d'API, envoyer directement via WhatsApp
                 this.sendLeadViaWhatsApp(leadData);
             }
         } catch (error) {
             console.error('Erreur lors de la création du lead:', error);
         }

         const modal = document.createElement('div');
         modal.className = 'abandon-recovery-modal';
         modal.innerHTML = `
             <div class="modal-content">
                 <div class="recovery-header">
                     <h3>🚀 Ne partez pas encore !</h3>
                     <p>Vous étiez en train de créer un magazine personnalisé. Laissez-nous vous aider à terminer votre commande.</p>
                 </div>
                 <div class="recovery-options">
                     <button class="btn-primary" onclick="this.closest('.abandon-recovery-modal').remove(); window.orderFormInstance.showStep(window.orderFormInstance.currentStep);">
                         Continuer ma commande
                     </button>
                     <button class="btn-secondary" onclick="this.closest('.abandon-recovery-modal').remove(); window.orderFormInstance.showQuickQuote();">
                         Contacter sur WhatsApp
                     </button>
                     <button class="btn-text" onclick="this.closest('.abandon-recovery-modal').remove();">
                         Fermer
                     </button>
                 </div>
                 <div class="recovery-benefits">
                     <p><strong>Pourquoi continuer ?</strong></p>
                     <ul>
                         <li><i class="fas fa-check" aria-hidden="true"></i> Devis personnalisé gratuit</li>
                         <li><i class="fas fa-check" aria-hidden="true"></i> Aperçu de votre magazine</li>
                         <li><i class="fas fa-check" aria-hidden="true"></i> Accompagnement personnalisé</li>
                         <li><i class="fas fa-check" aria-hidden="true"></i> Livraison sécurisée</li>
                     </ul>
                 </div>
             </div>
         `;
         document.body.appendChild(modal);
     }

     sendLeadViaWhatsApp(leadData) {
         const message = encodeURIComponent(
             `Nouveau Lead Peace Magazine\n\n` +
             `Nom: ${leadData.name || 'Non renseigné'}\n` +
             `Email: ${leadData.email || 'Non renseigné'}\n` +
             `Téléphone: ${leadData.phone || 'Non renseigné'}\n` +
             `Occasion: ${leadData.occasion || 'Non renseigné'}\n\n` +
             `Message:\n${leadData.message || 'Aucun message'}`
         );
         const whatsappUrl = `https://wa.me/2250767660476?text=${message}`;
         window.open(whatsappUrl, '_blank');
     }

     showQuickQuote() {
         const modal = document.createElement('div');
         modal.className = 'quick-quote-modal';
         modal.innerHTML = `
             <div class="modal-content">
                 <h3><i class="fas fa-comments" aria-hidden="true"></i> Contactez-nous sur WhatsApp</h3>
                 <p>Pour une prise en charge rapide et personnalisée</p>
                 <div class="whatsapp-contact-section">
                     <div class="whatsapp-info">
                         <h4><i class="fas fa-rocket" aria-hidden="true"></i> Pourquoi nous contacter ?</h4>
                         <ul>
                             <li><i class="fas fa-check" aria-hidden="true"></i> Devis personnalisé en 5 minutes</li>
                             <li><i class="fas fa-check" aria-hidden="true"></i> Conseils d'expert gratuits</li>
                             <li><i class="fas fa-check" aria-hidden="true"></i> Réponse immédiate</li>
                             <li><i class="fas fa-check" aria-hidden="true"></i> Accompagnement personnalisé</li>
                         </ul>
                     </div>
                     <div class="whatsapp-contact">
                         <a href="https://wa.me/2250767660476?text=Bonjour%20Peace%20Magazine%2C%20je%20souhaite%20obtenir%20un%20devis%20personnalisé%20pour%20mon%20projet." 
                            target="_blank" class="whatsapp-button">
                             <i class="fab fa-whatsapp"></i>
                             Contacter sur WhatsApp
                         </a>
                         <p class="whatsapp-note">Réponse garantie en moins de 5 minutes</p>
                     </div>
                 </div>
                 <button class="close-modal" onclick="this.closest('.quick-quote-modal').remove()">×</button>
             </div>
         `;
         document.body.appendChild(modal);
     }

    buildLeadPayload(orderData) {
        const normalizedPhone = this.normalizePhoneNumber(orderData.deliveryPhone);
        const photoModeLabels = {
            upload: 'Téléchargement sur le site',
            link: 'Lien ou envoi différé'
        };

        const lines = [
            'Demande Peace Magazine',
            `Commanditaire : ${orderData.customerName} (${orderData.customerEmail})`,
            `Personne célébrée : ${orderData.personName}`,
            `Relation : ${orderData.relationship}`,
            `Occasion : ${orderData.occasion}`,
            `Livraison souhaitée : ${orderData.deliveryDate} — ${orderData.deliveryAddress}`,
            `Téléphone indiqué : ${orderData.deliveryPhone}`,
            `Mode d'envoi des photos : ${photoModeLabels[orderData.photoDeliveryMode] || 'À confirmer'}`,
            orderData.photoLink ? `Lien/Instructions photos : ${orderData.photoLink}` : null,
            orderData.anecdotes?.length ? `Anecdotes fournies : ${orderData.anecdotes.length}` : null,
            orderData.testimonials?.length ? `Témoignages fournis : ${orderData.testimonials.length}` : null,
            orderData.additionalInfo ? `Instructions supplémentaires : ${orderData.additionalInfo}` : null
        ];

        const message = lines.filter(Boolean).join('\n');
        const trimmedMessage = message.length > 1000 ? `${message.slice(0, 997)}...` : message;

        const payload = {
            name: orderData.customerName || orderData.personName || 'Client Peace Magazine',
            email: orderData.customerEmail || undefined,
            phone: normalizedPhone || undefined,
            occasion: orderData.occasion || 'autre',
            message: trimmedMessage,
            source: 'contact_form'
        };

        return payload;
    }

    prepareOrderData() {
        // Transformer les données pour correspondre au schéma de validation du backend
        const orderPayload = {
            // Informations principales (supprimées - seront collectées via WhatsApp)
            personName: null,
            occasion: null,
            relationship: null,
            description: null,
            anecdotes: [],
            testimonials: [],
            
            // Style et couleurs
            colors: this.state.customColorHex || this.state.selectedPaletteColor || this.state.customColors || null,
            style: this.state.style || null,
            additionalInfo: this.state.additionalInfo || null,
            
            // Livraison
            deliveryDate: this.state.deliveryDate,
            deliveryAddress: this.state.deliveryAddress,
            deliveryPhone: this.normalizePhoneNumber(this.state.deliveryPhone) || this.state.deliveryPhone,
            
            // Informations client (seront collectées via WhatsApp)
            clientName: null,
            clientEmail: null,
            clientPhone: this.normalizePhoneNumber(this.state.deliveryPhone) || this.state.deliveryPhone,
            
            // Fichiers uploadés - utiliser les IDs serveur si disponibles
            uploadedFiles: this.uploadedFiles.map(file => {
                // Si on a un serverId, utiliser seulement la référence
                if (file.serverId) {
                    return {
                        serverId: file.serverId,
                        name: file.name,
                        type: file.type,
                        size: file.size,
                        url: file.serverUrl
                    };
                }
                // Sinon, envoyer les données base64 (fallback si upload échoué)
                return {
                name: file.name,
                type: file.type,
                size: file.size,
                data: file.data // Format base64
                };
            }),
            
            // Photo de couverture
            coverPhoto: this.getSelectedCoverPhoto()
                ? {
                    name: this.getSelectedCoverPhoto().name,
                    data: this.getSelectedCoverPhoto().data
                }
                : null
        };

        return orderPayload;
    }

    async sendOrderToBackend(orderData) {
        try {
            console.log('📤 Envoi de la commande...', {
                hasFiles: orderData.uploadedFiles?.length || 0,
                hasCoverPhoto: !!orderData.coverPhoto
            });
            
            // SIMPLIFICATION : Utiliser Supabase si disponible, sinon backend
            // Plus de fallback complexe, un seul chemin
            if (window.APP_CONFIG?.useSupabase && window.supabaseService) {
                console.log('🔗 Création via Supabase...');
                const response = await window.supabaseService.createOrder(orderData);
                
                if (response && response.success) {
                    const order = response.data.order;
                    const orderNumber = order.order_number || `PM-${order.id.substring(0, 8)}`;
                    
                    return {
                        success: true,
                        orderId: order.id,
                        orderNumber: orderNumber
                    };
                } else {
                    throw new Error(response?.message || 'Erreur lors de la création de la commande');
                }
            }
            
            // Fallback : Backend classique
            if (!API_BASE_URL) {
                throw new Error('Configuration manquante. Veuillez contacter le support : +225 07 67 66 04 76');
            }
            
            const response = await apiCall('/api/orders/public', 'POST', orderData);
            
            if (response && response.success) {
                const orderNumber = response.data?.orderNumber || response.data?.order?.orderNumber || `PM-${Date.now()}`;
                return { 
                    success: true, 
                    orderId: response.data?.order?.id || orderNumber,
                    orderNumber: orderNumber
                };
            }
            
            throw new Error(response?.message || 'Erreur lors de la création de la commande');
        } catch (error) {
            console.error('❌ Erreur:', error);
            throw error;
        }
    }

    async submitPaymentScreenshot(orderId, orderNumber, screenshotData) {
        try {
            console.log('📸 Envoi de la capture d\'écran du paiement...');
            console.log('📋 Données:', { orderId, orderNumber, hasScreenshot: !!screenshotData });
            
            const paymentData = {
                orderId: orderId,
                orderNumber: orderNumber,
                screenshot: screenshotData,
                paymentMethod: 'wave_or_orange_money',
                amount: 15000
            };
            
            // Essayer Supabase en premier
            if (window.APP_CONFIG?.useSupabase && window.supabaseService) {
                try {
                    console.log('🔗 Mise à jour via Supabase...');
                    // Mettre à jour la commande avec la capture
                    const updateResult = await window.supabaseService.apiCall('orders', 'PATCH', {
                        payment_screenshot: JSON.stringify(screenshotData),
                        payment_status: 'pending_verification',
                        payment_method: 'wave_or_orange_money'
                    }, { id: `eq.${orderId}` });
                    
                    console.log('✅ Commande mise à jour dans Supabase');
                    
                    // Essayer d'envoyer au backend pour traitement et email (optionnel)
                    if (API_BASE_URL) {
                        try {
                            console.log('📧 Envoi au backend pour email...');
                            const response = await apiCall('/api/payment/confirm-screenshot', 'POST', paymentData);
                            if (response && response.success) {
                                console.log('✅ Email envoyé via backend');
                                return { success: true, message: 'Paiement confirmé avec succès. Email envoyé.' };
                            }
                        } catch (backendError) {
                            console.warn('⚠️ Backend non disponible, mais capture enregistrée dans Supabase:', backendError.message);
                            // Continuer même si le backend échoue
                        }
                    }
                    
                    // Si pas de backend, on considère que c'est OK (l'email sera envoyé manuellement)
                    return { success: true, message: 'Capture d\'écran enregistrée avec succès. Vous recevrez un email de confirmation sous peu.' };
                } catch (error) {
                    console.error('❌ Erreur Supabase:', error);
                    // Si Supabase échoue, essayer le backend
                    if (API_BASE_URL) {
                        console.log('🔄 Tentative via backend...');
                        const response = await apiCall('/api/payment/confirm-screenshot', 'POST', paymentData);
                        if (response && response.success) {
                            return { success: true, message: 'Paiement confirmé avec succès' };
                        }
                        throw new Error(response?.message || 'Erreur lors de la confirmation');
                    }
                    throw error;
                }
            }
            
            // Fallback vers backend uniquement
            if (API_BASE_URL) {
                console.log('🔧 Envoi via backend uniquement...');
                const response = await apiCall('/api/payment/confirm-screenshot', 'POST', paymentData);
                if (response && response.success) {
                    return { success: true, message: 'Paiement confirmé avec succès' };
                }
                throw new Error(response?.message || 'Erreur lors de la confirmation');
            }
            
            throw new Error('Aucun service disponible. Veuillez configurer Supabase ou démarrer le backend.');
        } catch (error) {
            console.error('❌ Erreur lors de l\'envoi de la capture:', error);
            throw error;
        }
    }

    openPaymentWindow(url) {
        // Ouvrir une nouvelle fenêtre popup pour le paiement
        const width = 800;
        const height = 900;
        const left = (screen.width - width) / 2;
        const top = (screen.height - height) / 2;
        
        const paymentWindow = window.open(
            url,
            'PaiementWave',
            `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,toolbar=no,location=no,menubar=no`
        );
        
        // Vérifier si la fenêtre a été bloquée
        if (!paymentWindow || paymentWindow.closed || typeof paymentWindow.closed === 'undefined') {
            // Si la popup est bloquée, ouvrir dans un nouvel onglet
            window.open(url, '_blank');
            alert('Votre navigateur a bloqué la fenêtre popup. Le paiement s\'ouvre dans un nouvel onglet. Veuillez autoriser les popups pour une meilleure expérience.');
        }
        
        return paymentWindow;
    }

    showSuccessMessage(orderId, orderNumber, paymentUrl) {
        // SIMPLIFICATION : Redirection directe vers WhatsApp pour le paiement
        const whatsappMessage = encodeURIComponent(
            `Bonjour Peace Magazine ! 👋\n\n` +
            `Je viens de passer une commande :\n` +
            `📋 Numéro de commande : ${orderNumber}\n\n` +
            `Je souhaite effectuer le paiement de l'acompte de 15 000 FCFA.\n` +
            `Pouvez-vous me guider pour le paiement via Wave ou Orange Money ?\n\n` +
            `Merci ! 🙏`
        );
        const whatsappUrl = `https://wa.me/2250767660476?text=${whatsappMessage}`;
        
        // Créer la modal simplifiée
        const modal = document.createElement('div');
        modal.className = 'success-modal-fullscreen';
        modal.innerHTML = `
            <div class="success-modal-content-fullscreen">
                <div class="success-header">
                    <div class="success-icon-large"><i class="fas fa-circle-check" aria-hidden="true"></i></div>
                    <h1><i class="fas fa-champagne-glasses" aria-hidden="true"></i> Commande créée avec succès !</h1>
                    <div class="order-number-badge">
                        <strong>Numéro de commande :</strong> 
                        <span class="order-number-value">${this.outputText(orderNumber || orderId)}</span>
                    </div>
                </div>
                
                <div class="success-body">
                    <div class="payment-section">
                        <h2><i class="fas fa-credit-card" aria-hidden="true"></i> Finaliser votre commande</h2>
                        <p class="payment-description">
                            Votre commande a été enregistrée avec succès !<br>
                            Pour finaliser, effectuez le paiement de l'<strong>acompte de 15 000 FCFA</strong>.
                        </p>
                        
                        <div class="payment-simple-box">
                            <div class="payment-amount-large">15 000 FCFA</div>
                            <p class="payment-methods-simple">
                                <i class="fas fa-mobile-screen-button" aria-hidden="true"></i> Wave ou <i class="fas fa-wallet" aria-hidden="true"></i> Orange Money<br>
                                <strong>Numéro : +225 0767660476</strong>
                            </p>
                        </div>
                        
                        <div class="whatsapp-payment-section">
                            <a href="${whatsappUrl}" target="_blank" class="whatsapp-payment-button">
                                <span class="whatsapp-icon"><i class="fas fa-comments" aria-hidden="true"></i></span>
                                <span>Contacter sur WhatsApp pour le paiement</span>
                            </a>
                            <p class="whatsapp-note">
                                Cliquez ci-dessus pour nous contacter directement sur WhatsApp.<br>
                                Nous vous guiderons pour le paiement et vous enverrons la confirmation.
                            </p>
                        </div>
                        
                        <div class="payment-info-box">
                            <div class="info-icon"><i class="fas fa-circle-info" aria-hidden="true"></i></div>
                            <div class="info-content">
                                <strong>Après le paiement :</strong><br>
                                <i class="fas fa-chevron-right" aria-hidden="true"></i> Vous recevrez un email de confirmation<br>
                                <i class="fas fa-chevron-right" aria-hidden="true"></i> Nous vérifierons vos informations<br>
                                <i class="fas fa-chevron-right" aria-hidden="true"></i> Nous vous recontacterons dans les 24h
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="success-footer">
                    <button type="button" class="btn-close-success">Fermer</button>
                </div>
            </div>
        `;

        // Bouton fermer
        const closeBtn = modal.querySelector('.btn-close-success');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                modal.remove();
                document.body.style.overflow = '';
            });
        }

        document.body.appendChild(modal);
        
        // Empêcher le scroll du body quand la modal est ouverte
        document.body.style.overflow = 'hidden';

        // Supprimer la modal après fermeture
        const cleanup = () => {
            document.body.style.overflow = '';
        };
        
        // Observer la suppression de la modal
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (!document.body.contains(modal)) {
                    cleanup();
                    observer.disconnect();
                }
            });
        });
        
        observer.observe(document.body, { childList: true });
        
        // La modal reste ouverte jusqu'à fermeture manuelle (pas de timeout)
    }

    clearForm() {
        this.form.reset();
        this.state = this.getEmptyState();
        this.uploadedFiles = [];
        this.selectedCoverPhotoId = null;
        this.currentStep = 1;

        this.renderUploadedFiles();
        this.populateAnecdotes();
        this.populateTestimonials();
        const radio = document.querySelector('input[name="testimonials"][value="no"]');
        if (radio) {
            radio.checked = true;
        }
        this.toggleTestimonialsVisibility(false);
        const photoModeRadio = document.querySelector('input[name="photoDeliveryMode"][value="upload"]');
        if (photoModeRadio) {
            photoModeRadio.checked = true;
        }
        const photoLinkGroup = document.getElementById('photoLinkGroup');
        if (photoLinkGroup) {
            photoLinkGroup.style.display = 'none';
        }
        const photoLinkInput = document.getElementById('photoLink');
        if (photoLinkInput) {
            photoLinkInput.value = '';
        }
        localStorage.removeItem('peaceMagazineFormData');

        this.showStep(this.currentStep);
        this.updateProgress();
        this.updateSummary();
    }

    populateAnecdotes() {
        const container = document.getElementById('anecdotes-container');
        if (!container) {
            return;
        }

        container.innerHTML = '';

        if (this.state.anecdotes.length) {
            this.state.anecdotes.forEach(anecdote => {
                container.appendChild(this.createAnecdoteItem(anecdote));
            });
        } else {
            container.appendChild(this.createAnecdoteItem());
        }
    }

    populateTestimonials() {
        const container = document.getElementById('testimonials-container');
        if (!container) {
            return;
        }

        container.innerHTML = '';

        if (this.state.includeTestimonials === 'yes') {
            const radio = document.querySelector('input[name="testimonials"][value="yes"]');
            if (radio) {
                radio.checked = true;
            }
            if (this.state.testimonials.length) {
                this.state.testimonials.forEach(testimonial => {
                    container.appendChild(this.createTestimonialItem(testimonial));
                });
            } else {
                container.appendChild(this.createTestimonialItem());
            }
            container.style.display = 'block';
        } else {
            const radio = document.querySelector('input[name="testimonials"][value="no"]');
            if (radio) {
                radio.checked = true;
            }
            container.style.display = 'none';
        }
    }

    persistState() {
        try {
            // ⚠️ SÉCURITÉ: Sauvegarder uniquement les métadonnées (pas de PII)
            // Conformité RGPD: Ne pas stocker de données personnelles complètes dans localStorage
            const payload = {
                // Métadonnées uniquement (pas de données personnelles complètes)
                currentStep: this.currentStep,
                uploadedFilesRefs: this.uploadedFiles.map(f => ({
                    id: f.id,
                    name: f.name,
                    serverId: f.serverId,
                    serverUrl: f.serverUrl,
                    type: f.type,
                    size: f.size
                    // Ne pas inclure 'data' (base64) ni données personnelles
                })),
                selectedCoverPhotoId: this.selectedCoverPhotoId,
                // Ne pas sauvegarder: personName, customerEmail, customerPhone, deliveryAddress, etc.
                // Ces données sont des PII et ne doivent pas être stockées localement
                savedAt: new Date().toISOString()
            };
            
            // Purge automatique des anciennes données (30 jours)
            try {
                const savedData = localStorage.getItem('peaceMagazineFormData');
                if (savedData) {
                    const parsed = JSON.parse(savedData);
                    const savedAt = parsed.savedAt ? new Date(parsed.savedAt) : null;
                    if (savedAt && (Date.now() - savedAt.getTime()) > 30 * 24 * 60 * 60 * 1000) {
                        localStorage.removeItem('peaceMagazineFormData');
                        console.log('🧹 Purge automatique: données de formulaire anciennes supprimées');
                    }
                }
            } catch (e) {
                // Ignorer les erreurs de purge
            }
            
            // Sauvegarder uniquement les métadonnées
            localStorage.setItem('peaceMagazineFormData', JSON.stringify(payload));
        } catch (error) {
            console.error('Impossible de sauvegarder les métadonnées du formulaire :', error);
            // Si localStorage est plein, ne pas forcer la sauvegarde
            if (error.name === 'QuotaExceededError') {
                console.warn('⚠️ localStorage plein, impossible de sauvegarder les métadonnées');
                localStorage.removeItem('peaceMagazineFormData');
            }
        }
    }

    restoreFromStorage() {
        const savedData = localStorage.getItem('peaceMagazineFormData');
        if (!savedData) {
            this.renderUploadedFiles();
            this.populateAnecdotes();
            this.populateTestimonials();
            return;
        }

        try {
            const parsed = JSON.parse(savedData);
            
            // ⚠️ SÉCURITÉ: Vérifier l'âge des données (purge si > 30 jours)
            const savedAt = parsed.savedAt ? new Date(parsed.savedAt) : null;
            if (savedAt && (Date.now() - savedAt.getTime()) > 30 * 24 * 60 * 60 * 1000) {
                localStorage.removeItem('peaceMagazineFormData');
                console.log('🧹 Données de formulaire expirées, suppression');
                this.renderUploadedFiles();
                this.populateAnecdotes();
                this.populateTestimonials();
                return;
            }
            
            // ⚠️ SÉCURITÉ: Restaurer uniquement les métadonnées (pas de PII)
            // Ne pas restaurer: personName, customerEmail, customerPhone, deliveryAddress, etc.
            // L'utilisateur devra ressaisir ces informations
            if (parsed.uploadedFilesRefs) {
                // Restaurer uniquement les références des fichiers (sans données base64)
                this.uploadedFiles = parsed.uploadedFilesRefs.map(ref => ({
                    id: ref.id,
                    name: ref.name,
                    serverId: ref.serverId,
                    serverUrl: ref.serverUrl,
                    type: ref.type,
                    size: ref.size
                }));
            }
            this.selectedCoverPhotoId = parsed.selectedCoverPhotoId || null;
            this.currentStep = Math.min(parsed.currentStep || 1, this.totalSteps);

            // Ne pas restaurer les champs du formulaire (PII)
            // Ne pas appeler populateFormFields() pour éviter de restaurer les PII
            this.renderUploadedFiles();
            this.populateAnecdotes();
            this.populateTestimonials();
            console.log('✅ Métadonnées de formulaire restaurées (sans PII)');
        } catch (error) {
            console.error('Impossible de restaurer les métadonnées du formulaire :', error);
            localStorage.removeItem('peaceMagazineFormData');
            this.renderUploadedFiles();
            this.populateAnecdotes();
            this.populateTestimonials();
        }
    }

    populateFormFields() {
        const map = {
            personName: 'personName',
            occasion: 'occasion',
            relationship: 'relationship',
            customerName: 'customerName',
            customerEmail: 'customerEmail',
            description: 'description',
            customColors: 'customColors',
            style: 'style',
            additionalInfo: 'additionalInfo',
            deliveryDate: 'deliveryDate',
            deliveryAddress: 'deliveryAddress',
            deliveryPhone: 'deliveryPhone',
            photoLink: 'photoLink'
        };

        Object.entries(map).forEach(([stateKey, fieldId]) => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.value = this.state[stateKey] || '';
            }
        });

        const acceptTerms = document.getElementById('acceptTerms');
        if (acceptTerms) {
            acceptTerms.checked = Boolean(this.state.acceptTerms);
        }

        const payment = this.form.querySelector(`input[name="paymentMethod"][value="${this.state.paymentMethod}"]`);
        if (payment) {
            payment.checked = true;
        }

        const photoModeRadio = this.form.querySelector(`input[name="photoDeliveryMode"][value="${this.state.photoDeliveryMode}"]`);
        if (photoModeRadio) {
            photoModeRadio.checked = true;
        }

        if (this.state.selectedPaletteColor) {
            const option = document.querySelector(`.color-option[data-color="${this.state.selectedPaletteColor}"]`);
            if (option) {
                document.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('selected'));
                option.classList.add('selected');
            }
        }
    }

    escapeHtml(text) {
        if (text === undefined || text === null) {
            return '';
        }
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    outputText(text) {
        const value = this.escapeHtml(text);
        return value || 'Non renseigné';
    }
}

class FAQ {
    constructor() {
        this.init();
    }

    init() {
        const faqItems = document.querySelectorAll('.faq-item');
        if (!faqItems.length) {
            return;
        }

        faqItems.forEach((item, index) => {
            const question = item.querySelector('.faq-question');
            if (!question) {
                return;
            }

            const answer = item.querySelector('.faq-answer');
            const toggle = question.querySelector('.faq-toggle');

            const toggleFAQ = () => {
                const isActive = item.classList.contains('active');
                faqItems.forEach(other => {
                    other.classList.remove('active');
                    const otherQuestion = other.querySelector('.faq-question');
                    const otherAnswer = other.querySelector('.faq-answer');
                    if (otherQuestion) {
                        otherQuestion.setAttribute('aria-expanded', 'false');
                    }
                });
                
                item.classList.toggle('active', !isActive);
                question.setAttribute('aria-expanded', !isActive ? 'true' : 'false');
                
                if (toggle) {
                    toggle.textContent = !isActive ? '−' : '+';
                }
            };

            // Clic
            question.addEventListener('click', toggleFAQ);
            
            // Clavier (Enter et Espace)
            question.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleFAQ();
                }
            });
        });
    }
}

class ContactForm {
    constructor() {
        this.form = document.getElementById('contactForm');
        if (!this.form) {
            return;
        }
        this.statusEl = null;
        this.init();
    }

    init() {
        this.statusEl = document.createElement('div');
        this.statusEl.className = 'form-status';
        this.statusEl.setAttribute('aria-live', 'polite');
        this.form.prepend(this.statusEl);

        this.form.addEventListener('submit', (event) => {
            event.preventDefault();
            this.submitForm();
        });
    }

     async submitForm() {
         const submitButton = this.form.querySelector('button[type="submit"]');
         if (!submitButton) {
             return;
         }

         const originalLabel = submitButton.textContent;
         submitButton.disabled = true;
         submitButton.textContent = 'Envoi en cours...';
         this.setStatus('info', 'Envoi en cours...');

         try {
             // Collecter les données du formulaire
             const formData = new FormData(this.form);
             const contactData = {
                 name: formData.get('contactName'),
                 email: formData.get('contactEmail'),
                 message: formData.get('contactMessage'),
                 timestamp: new Date().toISOString(),
                 source: 'contact_form'
             };

             // Simuler l'envoi d'email
             const emailResult = await this.sendContactEmail(contactData);
             
             if (emailResult.success) {
                 this.setStatus('success', 'Votre message a été envoyé avec succès ! Nous vous répondrons à l\'adresse ' + contactData.email + ' dans les plus brefs délais.');
                 this.form.reset();
             } else {
                 throw new Error(emailResult.error || 'Erreur lors de l\'envoi');
             }
         } catch (error) {
             this.setStatus('error', 'Erreur lors de l\'envoi : ' + error.message + '. Vous pouvez nous contacter directement à morak6@icloud.com');
         } finally {
             submitButton.disabled = false;
             submitButton.textContent = originalLabel;
         }
     }

     async sendContactEmail(contactData) {
         try {
             // Vérifier que l'API est configurée
             if (!API_BASE_URL) {
                 // Si pas d'API, créer un lead et envoyer via WhatsApp
                 return await this.sendContactViaWhatsApp(contactData);
             }

             const response = await apiCall('/api/contact', 'POST', contactData);
             
             // Si l'API échoue, essayer WhatsApp en fallback
             if (!response || !response.success) {
                 console.warn('API contact échouée, fallback WhatsApp');
                 return await this.sendContactViaWhatsApp(contactData);
             }
             
             return response;
         } catch (error) {
             console.error('Erreur lors de l\'envoi de l\'email:', error);
             // En cas d'erreur, proposer WhatsApp
             return await this.sendContactViaWhatsApp(contactData);
         }
     }

     async sendContactViaWhatsApp(contactData) {
         // Créer un lien WhatsApp avec le message
         const message = encodeURIComponent(
             `Bonjour Peace Magazine,\n\n` +
             `Nom: ${contactData.name}\n` +
             `Email/Téléphone: ${contactData.email}\n\n` +
             `Message:\n${contactData.message}`
         );
         const whatsappUrl = `https://wa.me/2250767660476?text=${message}`;
         
         // Ouvrir WhatsApp
         window.open(whatsappUrl, '_blank');
         
         return {
             success: true,
             message: 'Redirection vers WhatsApp pour envoyer votre message.',
             viaWhatsApp: true
         };
     }

    setStatus(type, message) {
        if (!this.statusEl) {
            return;
        }
        this.statusEl.textContent = message;
        this.statusEl.className = `form-status ${type}`;
    }
}

class ScrollAnimations {
    constructor() {
        this.init();
    }

    init() {
        if (!('IntersectionObserver' in window)) {
            return;
        }

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        document.querySelectorAll('.step, .gallery-item, .faq-item').forEach(element => {
            element.style.opacity = '0';
            element.style.transform = 'translateY(30px)';
            element.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
            observer.observe(element);
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Initialiser les couvertures vidéo
    initializeVideoCovers();
    
    const orderForm = new OrderForm();
    if (orderForm && orderForm.form) {
        window.orderFormInstance = orderForm;
        setInterval(() => {
            orderForm.syncStateFromForm();
            orderForm.persistState();
        }, 30000);
    }

    new FAQ();
    new ContactForm();
    new ScrollAnimations();
    
    // Initialiser Heyzine pour la galerie
    if (window.heyzineService) {
        console.log('✅ Service Heyzine disponible');
        initializeHeyzineGallery();
    } else {
        console.error('❌ Service Heyzine non disponible');
    }
    
    // Initialiser le menu mobile
    initializeMobileMenu();
    
    // Initialiser l'effet de scroll sur la navbar
    initializeNavbarScroll();
});

/**
 * Initialise l'effet de scroll sur la navbar (rétraction et transparence)
 */
function initializeNavbarScroll() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) {
        return;
    }
    
    let lastScrollTop = 0;
    const scrollThreshold = 50; // Seuil en pixels pour déclencher l'effet
    
    window.addEventListener('scroll', () => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        if (scrollTop > scrollThreshold) {
            // Ajouter la classe 'scrolled' pour rétracter et rendre transparent
            navbar.classList.add('scrolled');
        } else {
            // Retirer la classe pour revenir à l'état normal
            navbar.classList.remove('scrolled');
        }
        
        lastScrollTop = scrollTop;
    }, { passive: true });
}

/**
 * Initialise le menu mobile avec hamburger
 */
function initializeMobileMenu() {
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');
    
    if (!navToggle || !navMenu) {
        return;
    }
    
    navToggle.addEventListener('click', () => {
        const isExpanded = navToggle.getAttribute('aria-expanded') === 'true';
        navToggle.setAttribute('aria-expanded', !isExpanded ? 'true' : 'false');
        navMenu.classList.toggle('active', !isExpanded);
    });
    
    // Fermer le menu en cliquant sur un lien
    navMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            navToggle.setAttribute('aria-expanded', 'false');
            navMenu.classList.remove('active');
        });
    });
    
    // Fermer le menu en cliquant en dehors
    document.addEventListener('click', (e) => {
        if (!navMenu.contains(e.target) && !navToggle.contains(e.target)) {
            navToggle.setAttribute('aria-expanded', 'false');
            navMenu.classList.remove('active');
        }
    });
}

/**
 * Initialise l'intégration Heyzine dans la galerie
 */
function initializeHeyzineGallery() {
    if (!window.heyzineService) {
        console.warn('Service Heyzine non disponible');
        return;
    }

    // Fonction pour détecter automatiquement l'IP locale (via WebRTC)
    async function detectLocalIP() {
        return new Promise((resolve) => {
            // Vérifier d'abord le localStorage
            const storedIp = localStorage.getItem('LOCAL_IP');
            if (storedIp) {
                resolve(storedIp);
                return;
            }
            
            // Essayer de détecter via WebRTC
            const RTCPeerConnection = window.RTCPeerConnection || 
                                     window.mozRTCPeerConnection || 
                                     window.webkitRTCPeerConnection;
            
            if (!RTCPeerConnection) {
                resolve(null);
                return;
            }
            
            const pc = new RTCPeerConnection({
                iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
            });
            
            const ips = [];
            pc.createDataChannel('');
            
            pc.onicecandidate = (event) => {
                if (event.candidate) {
                    const candidate = event.candidate.candidate;
                    const match = candidate.match(/([0-9]{1,3}(\.[0-9]{1,3}){3})/);
                    if (match) {
                        const ip = match[1];
                        // Ignorer les IPs locales (127.0.0.1) et les IPs publiques
                        if (!ip.startsWith('127.') && !ip.startsWith('169.254.')) {
                            if (ips.indexOf(ip) === -1) {
                                ips.push(ip);
                            }
                        }
                    }
                } else {
                    // Plus de candidats
                    pc.close();
                    // Prendre la première IP locale trouvée
                    const localIp = ips.find(ip => ip.startsWith('10.') || ip.startsWith('192.168.') || ip.startsWith('172.'));
                    if (localIp) {
                        localStorage.setItem('LOCAL_IP', localIp);
                        resolve(localIp);
                    } else {
                        resolve(null);
                    }
                }
            };
            
            pc.createOffer()
                .then(offer => pc.setLocalDescription(offer))
                .catch(() => resolve(null));
            
            // Timeout après 3 secondes
            setTimeout(() => {
                pc.close();
                resolve(null);
            }, 3000);
        });
    }

    // Fonction pour convertir un chemin relatif en URL absolue
    async function getAbsoluteUrl(relativePath) {
        // Si c'est déjà une URL absolue, la retourner telle quelle
        if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
            return relativePath;
        }
        
        // Utiliser l'URL de base configurée pour les PDFs (pour Heyzine)
        // Si PDF_BASE_URL est défini, l'utiliser (ex: ngrok tunnel)
        // Sinon, utiliser window.APP_CONFIG.pdfBaseUrl si disponible
        // Sinon, utiliser window.location.origin
        let baseUrl = window.PDF_BASE_URL || 
                     (window.APP_CONFIG && window.APP_CONFIG.pdfBaseUrl) || 
                     window.location.origin;
        
        // En local, essayer de détecter l'IP locale pour remplacer localhost
        // Cela permet à Heyzine d'accéder aux PDFs si on est sur le même réseau
        if (baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1')) {
            // Essayer de récupérer l'IP locale depuis le localStorage ou la détecter
            let localIp = localStorage.getItem('LOCAL_IP');
            
            // Si pas d'IP stockée, essayer de la détecter (une seule fois)
            if (!localIp && !window._localIpDetectionAttempted) {
                window._localIpDetectionAttempted = true;
                localIp = await detectLocalIP();
            }
            
            if (localIp) {
                baseUrl = baseUrl.replace('localhost', localIp).replace('127.0.0.1', localIp);
                console.log('🌐 Utilisation de l\'IP locale:', localIp);
            } else {
                // Afficher un avertissement si on utilise localhost (ne fonctionnera pas avec Heyzine)
                console.warn('⚠️ Utilisation de localhost - Heyzine ne pourra pas accéder aux PDFs depuis Internet.');
                console.warn('💡 Solutions:');
                console.warn('   1. Configurer window.PDF_BASE_URL avec une URL publique (ex: ngrok)');
                console.warn('   2. Configurer localStorage.setItem("LOCAL_IP", "votre-ip-locale")');
            }
        }
        
        let path = relativePath.startsWith('./') ? relativePath.substring(2) : relativePath;
        
        // Décoder d'abord si l'URL est déjà encodée (pour éviter le double encodage)
        try {
            path = decodeURIComponent(path);
        } catch (e) {
            // Si le décodage échoue, c'est que l'URL n'était pas encodée, on continue
        }
        
        // Encoder les espaces et caractères spéciaux dans le chemin
        // Diviser le chemin en parties et encoder chaque partie
        const pathParts = path.split('/');
        const encodedParts = pathParts.map(part => {
            // Encoder chaque partie du chemin (mais pas les slashes)
            // Ne pas encoder si la partie est vide
            return part ? encodeURIComponent(part) : '';
        }).filter(part => part !== ''); // Filtrer les parties vides
        path = encodedParts.join('/');
        
        const fullUrl = `${baseUrl}/${path}`;
        console.log('URL convertie:', { relativePath, baseUrl, fullUrl });
        return fullUrl;
    }

    // Ajouter les fonctionnalités de feuilletage aux éléments de la galerie
    document.querySelectorAll('.gallery-item').forEach(async (item) => {
        const pdfUrl = item.getAttribute('data-pdf-url');
        
        if (!pdfUrl) {
            return; // Pas de PDF pour cet élément
        }

        // Rendre l'image cliquable
        const galleryImage = item.querySelector('.gallery-image');
        if (galleryImage) {
            galleryImage.style.cursor = 'pointer';
            galleryImage.style.position = 'relative';
            
            // Ajouter un overlay au survol
            const overlay = item.querySelector('.gallery-overlay');
            if (overlay) {
                overlay.style.cssText = `
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(135deg, rgba(245, 197, 66, 0.95) 0%, rgba(255, 179, 0, 0.95) 100%);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    opacity: 0;
                    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                    border-radius: var(--border-radius);
                    color: white;
                    font-weight: 600;
                    backdrop-filter: blur(2px);
                    box-shadow: inset 0 0 50px rgba(0, 0, 0, 0.1);
                `;
            }
            
            // Fonction pour ouvrir le magazine
            const openMagazine = async (e) => {
                if (e) {
                    e.preventDefault();
                    e.stopPropagation();
                }
                
                // Afficher un indicateur de chargement
                if (overlay) {
                    overlay.innerHTML = `
                        <div style="text-align: center;">
                            <div class="loading-spinner" style="
                                width: 50px;
                                height: 50px;
                                border: 4px solid rgba(255, 255, 255, 0.3);
                                border-top-color: white;
                                border-radius: 50%;
                                animation: spin 0.8s linear infinite;
                                margin: 0 auto 15px;
                            "></div>
                            <p style="font-size: 1.1rem; margin: 0;">Chargement...</p>
                        </div>
                    `;
                }
                
                try {
                    // Convertir le chemin relatif en URL absolue
                    const absolutePdfUrl = await getAbsoluteUrl(pdfUrl);
                    console.log('📖 Ouverture du flipbook:', absolutePdfUrl);
                    
                    // Récupérer le titre du magazine depuis l'élément de galerie
                    const galleryInfo = item.querySelector('.gallery-info h3');
                    const magazineTitle = galleryInfo ? galleryInfo.textContent : 'Magazine';
                    
                    // Vérifier que le flipbook viewer est disponible
                    if (!window.flipbookViewer) {
                        console.error('Flipbook viewer non disponible');
                        // Recharger le script si nécessaire
                        if (overlay) {
                            overlay.innerHTML = `
                                <i class="fas fa-book-open view-magazine-icon" aria-hidden="true"></i>
                                <span class="view-magazine-text">Feuilleter le magazine</span>
                            `;
                        }
                        alert('Le visualiseur de magazine n\'est pas disponible. Veuillez recharger la page.');
                        return;
                    }
                    
                    // Ouvrir le PDF
                    await window.flipbookViewer.loadPDF(absolutePdfUrl, magazineTitle);
                    console.log('✅ Flipbook ouvert avec succès');
                } catch (error) {
                    console.error('Erreur lors du chargement du PDF:', error);
                    
                    // Restaurer l'overlay
                    if (overlay) {
                        overlay.innerHTML = `
                            <i class="fas fa-book-open view-magazine-icon" aria-hidden="true"></i>
                            <span class="view-magazine-text">Feuilleter le magazine</span>
                        `;
                    }
                    
                    // Afficher un message d'erreur à l'utilisateur
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
                        box-shadow: 0 8px 32px rgba(0,0,0,0.5);
                    `;
                    errorModal.innerHTML = `
                        <h2 style="color: #ff4444; margin-bottom: 20px;">❌ Erreur</h2>
                        <p style="margin-bottom: 20px; font-size: 1.1rem;">Impossible de charger le magazine.</p>
                        <p style="margin: 20px 0; font-size: 0.9rem; opacity: 0.8;">
                            ${error.message || 'Erreur inconnue lors du chargement du PDF'}
                        </p>
                        <p style="margin-top: 20px; font-size: 0.85rem; opacity: 0.7;">
                            Vérifiez que le fichier PDF est accessible et que votre connexion Internet fonctionne.
                        </p>
                        <button onclick="this.parentElement.remove()" style="
                            margin-top: 20px;
                            padding: 12px 24px;
                            background: #F5C542;
                            color: black;
                            border: none;
                            border-radius: 6px;
                            cursor: pointer;
                            font-weight: 600;
                            font-size: 1rem;
                            transition: all 0.3s ease;
                        " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">Fermer</button>
                    `;
                    document.body.appendChild(errorModal);
                }
            };
            
            // Gérer le clic sur l'image
            galleryImage.addEventListener('click', openMagazine);
            
            // Gérer le clic sur l'overlay
            if (overlay) {
                overlay.style.cursor = 'pointer';
                overlay.style.zIndex = '10';
                overlay.style.pointerEvents = 'auto';
                overlay.addEventListener('click', openMagazine);
            }
            
            // Gérer le survol pour afficher l'overlay avec animation
            galleryImage.addEventListener('mouseenter', () => {
                if (overlay) {
                    overlay.style.opacity = '1';
                    overlay.style.transform = 'scale(1.02)';
                }
            });
            
            galleryImage.addEventListener('mouseleave', () => {
                if (overlay) {
                    overlay.style.opacity = '0';
                    overlay.style.transform = 'scale(1)';
                }
            });
        }
        
        // Ajouter aussi un bouton dans la section info (après avoir obtenu l'URL absolue)
        const infoSection = item.querySelector('.gallery-info');
        if (infoSection && !infoSection.querySelector('.btn-view-magazine')) {
            try {
                const absolutePdfUrl = await getAbsoluteUrl(pdfUrl);
                if (window.heyzineService && window.heyzineService.createViewButton) {
                    const button = window.heyzineService.createViewButton(
                        absolutePdfUrl,
                        'Feuilleter le magazine'
                    );
                    infoSection.appendChild(button);
                }
            } catch (error) {
                console.error('Erreur lors de la création du bouton:', error);
            }
        }
    });
}

// Navigation fixe - reste toujours en haut avec arrière-plan

function showLegalSection(type) {
    const modal = document.getElementById('legal-modal');
    const title = document.getElementById('legal-title');
    const content = document.getElementById('legal-content');

    if (!modal || !title || !content) {
        return;
    }

    if (type === 'mentions') {
        title.textContent = 'Mentions Légales';
        content.innerHTML = `
            <h3>Éditeur du site</h3>
            <p><strong>Peace Magazine</strong><br>
            Société de création de magazines personnalisés<br>
            Côte d'Ivoire, Abidjan<br>
            Téléphone : +225 07 67 66 04 76<br>
            Email : morak6@icloud.com</p>
            <h3>Hébergement</h3>
            <p>Ce site est hébergé par un prestataire professionnel.</p>
            <h3>Propriété intellectuelle</h3>
            <p>L'ensemble de ce site relève de la législation sur le droit d'auteur et la propriété intellectuelle. Tous les droits de reproduction sont réservés.</p>
            <h3>Protection des données personnelles</h3>
            <p>Conformément à la loi, vous disposez d'un droit d'accès, de rectification et de suppression des données vous concernant. Pour l'exercer, contactez-nous.</p>
            <h3>Cookies</h3>
            <p>Ce site utilise des cookies pour améliorer votre expérience de navigation et sauvegarder vos données de formulaire.</p>
        `;
    } else if (type === 'cgv') {
        title.textContent = 'Conditions Générales de Vente';
        content.innerHTML = `
            <h3>Article 1 - Objet</h3>
            <p>Les présentes conditions générales de vente s'appliquent aux services de création de magazines personnalisés.</p>
            <h3>Article 2 - Tarifs</h3>
            <p>Le prix d'un magazine personnalisé est de <strong>30 000 FCFA</strong> pour 24 pages (hors livraison).</p>
            <h3>Article 3 - Délais</h3>
            <p>Les commandes doivent être passées 1 à 2 semaines avant la date de livraison souhaitée.</p>
            <h3>Article 4 - Processus de commande</h3>
            <p>1. Collecte des informations et photos<br>
            2. Création d'un aperçu personnalisé<br>
            3. Validation par le client<br>
            4. Paiement selon l'option choisie<br>
            5. Impression et livraison</p>
            <h3>Article 5 - Paiement</h3>
            <p>Le paiement s'effectue après validation de l'aperçu. Moyens acceptés : virement bancaire, mobile money, espèces.</p>
            <h3>Article 6 - Livraison</h3>
            <p>La livraison est à la charge du client. Le tarif est confirmé après validation de la commande.</p>
            <h3>Article 7 - Responsabilité</h3>
            <p>Peace Magazine s'engage à respecter la confidentialité des informations fournies et à livrer un produit de qualité.</p>
            <h3>Article 8 - Droit de rétractation</h3>
            <p>Du fait du caractère personnalisé du service, le droit de rétractation ne s'applique pas après validation de l'aperçu.</p>
            <h3>Article 9 - Contact</h3>
            <p>Pour toute question : WhatsApp +225 07 67 66 04 76</p>
        `;
    }

    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeLegalSection() {
    const modal = document.getElementById('legal-modal');
    if (!modal) {
        return;
    }
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

document.addEventListener('click', (event) => {
    const modal = document.getElementById('legal-modal');
    if (modal && event.target === modal) {
        closeLegalSection();
    }
});

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        closeLegalSection();
    }
});

// ===== GESTION DES COUVERTURES VIDÉO =====
function initializeVideoCovers() {
    const videoItems = document.querySelectorAll('.video-item');
    
    videoItems.forEach(item => {
        const videoCover = item.querySelector('.video-cover');
        const video = item.querySelector('video');
        
        if (!videoCover || !video) return;
        
        // Clic sur la couverture pour lancer la vidéo
        videoCover.addEventListener('click', () => {
            videoCover.classList.add('hidden');
            video.classList.remove('hidden');
            video.play().catch(err => {
                console.error('Erreur lors de la lecture de la vidéo:', err);
                // Si la lecture échoue, réafficher la couverture
                videoCover.classList.remove('hidden');
                video.classList.add('hidden');
            });
        });
        
        // Masquer la couverture quand la vidéo commence à jouer
        video.addEventListener('play', () => {
            videoCover.classList.add('hidden');
            video.classList.remove('hidden');
        });
        
        // Réafficher la couverture quand la vidéo se termine
        video.addEventListener('ended', () => {
            videoCover.classList.remove('hidden');
            video.classList.add('hidden');
            video.currentTime = 0;
        });
        
        // Masquer la vidéo par défaut (la couverture est visible)
        video.classList.add('hidden');
    });
}

// L'initialisation est faite dans le DOMContentLoaded principal ci-dessus

// ===== MODE LOCAL UNIQUEMENT =====
// Toutes les données sont stockées localement via localStorage et le backend local
// Aucune dépendance Firebase requise
