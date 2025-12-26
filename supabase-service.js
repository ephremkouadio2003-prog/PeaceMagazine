/**
 * Service Supabase pour la persistance des données
 * Gère les commandes, leads, fichiers et contacts
 */

class SupabaseService {
    constructor() {
        // Configuration Supabase depuis window.APP_CONFIG (configuré dans index.html)
        // ⚠️ SÉCURITÉ: La clé publique (anon key) est exposée côté client
        // Les politiques RLS (Row Level Security) doivent être correctement configurées
        const config = window.APP_CONFIG || {};
        this.supabaseUrl = config.supabaseUrl || 'https://chxhkoeqwssrczfviar.supabase.co';
        this.supabaseKey = config.supabaseKey || 'VOTRE_CLE_SUPABASE_ANON_KEY_ICI'; // ⚠️ Remplacez par votre clé publique Supabase (anon key)
        
        // ⚠️ SÉCURITÉ: Garde-fou - Vérifier que la clé est bien une clé publique (anon)
        if (this.supabaseKey && !this.supabaseKey.startsWith('sb_publishable_') && !this.supabaseKey.startsWith('eyJ')) {
            console.error('⚠️ SÉCURITÉ: Clé Supabase suspecte détectée. Utilisez uniquement la clé publique (anon key).');
        }
        
        // Initialiser le client Supabase si disponible
        this.client = null;
        this.rlsEnabled = true; // Supposé activé par défaut
        this.init();
    }

    init() {
        // Vérifier si @supabase/supabase-js est disponible
        if (typeof supabase !== 'undefined') {
            this.client = supabase.createClient(this.supabaseUrl, this.supabaseKey);
            console.log('✅ Supabase client initialisé');
        } else {
            console.warn('⚠️ @supabase/supabase-js non disponible, utilisation de fetch API');
        }
    }

    /**
     * Appel API Supabase générique
     */
    async apiCall(table, method = 'GET', data = null, filters = {}) {
        try {
            const url = `${this.supabaseUrl}/rest/v1/${table}`;
            const options = {
                method: method,
                headers: {
                    'apikey': this.supabaseKey,
                    'Authorization': `Bearer ${this.supabaseKey}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                }
            };

            // Ajouter les filtres pour GET
            if (method === 'GET' && Object.keys(filters).length > 0) {
                const queryParams = new URLSearchParams();
                Object.entries(filters).forEach(([key, value]) => {
                    queryParams.append(key, `eq.${value}`);
                });
                options.url = `${url}?${queryParams.toString()}`;
            } else {
                options.url = url;
            }

            // Ajouter les données pour POST/PUT/PATCH
            if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
                options.body = JSON.stringify(data);
            }

            const response = await fetch(options.url, options);
            
            if (!response.ok) {
                let errorData;
                try {
                    errorData = await response.json();
                } catch (e) {
                    errorData = { message: response.statusText, code: response.status };
                }
                
                // ⚠️ SÉCURITÉ: Vérifier les erreurs RLS avant de continuer
                if (response.status === 401 || response.status === 403) {
                    // Erreur d'authentification/autorisation - Ne pas réessayer
                    const error = new Error('Erreur de sécurité Supabase. Les politiques RLS (Row Level Security) peuvent être mal configurées. Contactez l\'administrateur.');
                    error.status = response.status;
                    error.rlsError = true; // Flag pour indiquer une erreur RLS
                    error.data = { 
                        message: 'Accès refusé par les politiques de sécurité',
                        hint: 'Vérifiez que les politiques RLS sont correctement configurées dans Supabase'
                    };
                    throw error;
                }
                
                // Messages d'erreur plus clairs selon le code HTTP
                let errorMessage = errorData.message || `Erreur HTTP: ${response.status}`;
                
                if (response.status === 404) {
                    errorMessage = `Table "${table}" n'existe pas dans Supabase. Veuillez exécuter le fichier supabase-setup.sql dans votre projet Supabase (SQL Editor).`;
                } else if (response.status === 400) {
                    errorMessage = `Erreur de validation Supabase: ${errorData.message || 'Données invalides'}`;
                } else if (response.status === 500) {
                    errorMessage = `Erreur serveur Supabase. Vérifiez que les tables et politiques sont correctement configurées.`;
                }
                
                const error = new Error(errorMessage);
                error.status = response.status;
                error.data = errorData;
                throw error;
            }

            // Pour DELETE, pas de contenu
            if (method === 'DELETE' && response.status === 204) {
                return { success: true };
            }

            const result = await response.json();
            return Array.isArray(result) ? result : [result];
        } catch (error) {
            console.error(`Erreur Supabase ${table}:`, error);
            throw error;
        }
    }

    /**
     * Créer une commande
     */
    async createOrder(orderData) {
        try {
            const order = {
                person_name: orderData.personName,
                occasion: orderData.occasion,
                relationship: orderData.relationship,
                customer_name: orderData.customerName || orderData.clientName,
                customer_email: orderData.customerEmail || orderData.clientEmail,
                customer_phone: orderData.deliveryPhone || orderData.clientPhone,
                delivery_date: orderData.deliveryDate,
                delivery_address: orderData.deliveryAddress,
                delivery_phone: orderData.deliveryPhone,
                photo_delivery_mode: orderData.photoDeliveryMode,
                photo_link: orderData.photoLink || null,
                description: orderData.description || null,
                style: orderData.style || null,
                colors: orderData.colors ? JSON.stringify(orderData.colors) : null,
                additional_info: orderData.additionalInfo || null,
                uploaded_files: orderData.uploadedFiles ? JSON.stringify(orderData.uploadedFiles) : null,
                cover_photo: orderData.coverPhoto ? JSON.stringify(orderData.coverPhoto) : null,
                anecdotes: orderData.anecdotes ? JSON.stringify(orderData.anecdotes) : null,
                testimonials: orderData.testimonials ? JSON.stringify(orderData.testimonials) : null,
                status: 'pending',
                created_at: new Date().toISOString()
            };

            const result = await this.apiCall('orders', 'POST', order);
            return {
                success: true,
                data: {
                    order: result[0],
                    orderId: result[0].id,
                    orderNumber: result[0].order_number || `PM-${result[0].id}`
                }
            };
        } catch (error) {
            console.error('Erreur création commande Supabase:', error);
            throw error;
        }
    }

    /**
     * Créer un lead
     */
    async createLead(leadData) {
        try {
            const lead = {
                name: leadData.name,
                email: leadData.email || null,
                phone: leadData.phone || null,
                occasion: leadData.occasion || 'autre',
                message: leadData.message || null,
                source: leadData.source || 'contact_form',
                status: 'new',
                score: this.calculateLeadScore(leadData),
                created_at: new Date().toISOString()
            };

            const result = await this.apiCall('leads', 'POST', lead);
            return {
                success: true,
                data: result[0]
            };
        } catch (error) {
            console.error('Erreur création lead Supabase:', error);
            throw error;
        }
    }

    /**
     * Calculer le score d'un lead (0-100)
     */
    calculateLeadScore(leadData) {
        let score = 0;
        
        // Nom complet (20 points)
        if (leadData.name && leadData.name.length > 3) score += 20;
        
        // Email valide (20 points)
        if (leadData.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(leadData.email)) score += 20;
        
        // Téléphone (20 points)
        if (leadData.phone && leadData.phone.length > 8) score += 20;
        
        // Message détaillé (20 points)
        if (leadData.message && leadData.message.length > 50) score += 20;
        
        // Occasion spécifique (20 points)
        const highValueOccasions = ['mariage', 'anniversaire', 'naissance'];
        if (highValueOccasions.includes(leadData.occasion?.toLowerCase())) score += 20;
        
        return Math.min(score, 100);
    }

    /**
     * Créer un contact
     */
    async createContact(contactData) {
        try {
            const contact = {
                name: contactData.name,
                email: contactData.email,
                message: contactData.message,
                source: contactData.source || 'contact_form',
                created_at: new Date().toISOString()
            };

            const result = await this.apiCall('contacts', 'POST', contact);
            return {
                success: true,
                data: result[0]
            };
        } catch (error) {
            console.error('Erreur création contact Supabase:', error);
            throw error;
        }
    }

    /**
     * Uploader un fichier (stockage dans Supabase Storage)
     */
    async uploadFile(fileData) {
        try {
            // Pour l'instant, on stocke les métadonnées dans la table files
            // Les fichiers eux-mêmes peuvent être stockés dans Supabase Storage
            const file = {
                name: fileData.name,
                type: fileData.type,
                size: fileData.size,
                data: fileData.data, // Base64 ou URL
                server_id: fileData.serverId || null,
                server_url: fileData.serverUrl || null,
                created_at: new Date().toISOString()
            };

            const result = await this.apiCall('files', 'POST', file);
            return {
                success: true,
                data: {
                    files: [result[0]]
                }
            };
        } catch (error) {
            console.error('Erreur upload fichier Supabase:', error);
            throw error;
        }
    }

    /**
     * Récupérer une commande par ID
     */
    async getOrder(orderId) {
        try {
            const result = await this.apiCall('orders', 'GET', null, { id: orderId });
            return result[0] || null;
        } catch (error) {
            console.error('Erreur récupération commande Supabase:', error);
            throw error;
        }
    }
}

// Initialiser le service Supabase
window.supabaseService = new SupabaseService();


