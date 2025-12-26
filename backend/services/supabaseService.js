/**
 * Service Supabase pour le backend
 * Remplace MySQL/Sequelize pour toutes les opérations de base de données
 */

const { createClient } = require('@supabase/supabase-js');

class SupabaseService {
    constructor() {
        // Configuration Supabase depuis les variables d'environnement
        this.supabaseUrl = process.env.SUPABASE_URL || 'https://chxhkoeqwssrczfviar.supabase.co';
        this.supabaseKey = process.env.SUPABASE_KEY || 'VOTRE_CLE_SUPABASE_ANON_KEY_ICI'; // ⚠️ Remplacez par votre clé publique Supabase (anon key)
        
        // Initialiser le client Supabase
        this.client = null;
        try {
            this.client = createClient(this.supabaseUrl, this.supabaseKey);
            console.log('✅ Service Supabase initialisé pour le backend');
        } catch (error) {
            console.error('❌ Erreur lors de l\'initialisation de Supabase:', error);
        }
    }

    /**
     * Vérifier que Supabase est configuré
     */
    isConfigured() {
        return this.client !== null;
    }

    /**
     * Créer une commande dans Supabase
     */
    async createOrder(orderData) {
        if (!this.isConfigured()) {
            throw new Error('Supabase n\'est pas configuré');
        }

        try {
            const { data, error } = await this.client
                .from('orders')
                .insert([orderData])
                .select()
                .single();

            if (error) {
                throw error;
            }

            return { success: true, data };
        } catch (error) {
            console.error('Erreur lors de la création de la commande dans Supabase:', error);
            throw error;
        }
    }

    /**
     * Récupérer une commande par ID
     */
    async getOrderById(id) {
        if (!this.isConfigured()) {
            throw new Error('Supabase n\'est pas configuré');
        }

        try {
            const { data, error } = await this.client
                .from('orders')
                .select('*')
                .eq('id', id)
                .single();

            if (error) {
                throw error;
            }

            return { success: true, data };
        } catch (error) {
            console.error('Erreur lors de la récupération de la commande:', error);
            throw error;
        }
    }

    /**
     * Récupérer toutes les commandes avec filtres
     */
    async getOrders(filters = {}) {
        if (!this.isConfigured()) {
            throw new Error('Supabase n\'est pas configuré');
        }

        try {
            let query = this.client.from('orders').select('*');

            // Appliquer les filtres
            if (filters.status) {
                query = query.eq('status', filters.status);
            }
            if (filters.paymentStatus) {
                query = query.eq('payment_status', filters.paymentStatus);
            }
            if (filters.userId) {
                query = query.eq('user_id', filters.userId);
            }

            // Tri
            if (filters.sortBy) {
                query = query.order(filters.sortBy, { ascending: filters.sortOrder !== 'DESC' });
            } else {
                query = query.order('created_at', { ascending: false });
            }

            // Pagination
            if (filters.limit) {
                query = query.limit(filters.limit);
            }
            if (filters.offset) {
                query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
            }

            const { data, error } = await query;

            if (error) {
                throw error;
            }

            return { success: true, data };
        } catch (error) {
            console.error('Erreur lors de la récupération des commandes:', error);
            throw error;
        }
    }

    /**
     * Mettre à jour une commande
     */
    async updateOrder(id, updateData) {
        if (!this.isConfigured()) {
            throw new Error('Supabase n\'est pas configuré');
        }

        try {
            const { data, error } = await this.client
                .from('orders')
                .update(updateData)
                .eq('id', id)
                .select()
                .single();

            if (error) {
                throw error;
            }

            return { success: true, data };
        } catch (error) {
            console.error('Erreur lors de la mise à jour de la commande:', error);
            throw error;
        }
    }

    /**
     * Créer un lead dans Supabase
     */
    async createLead(leadData) {
        if (!this.isConfigured()) {
            throw new Error('Supabase n\'est pas configuré');
        }

        try {
            const { data, error } = await this.client
                .from('leads')
                .insert([leadData])
                .select()
                .single();

            if (error) {
                throw error;
            }

            return { success: true, data };
        } catch (error) {
            console.error('Erreur lors de la création du lead dans Supabase:', error);
            throw error;
        }
    }

    /**
     * Récupérer les leads avec filtres
     */
    async getLeads(filters = {}) {
        if (!this.isConfigured()) {
            throw new Error('Supabase n\'est pas configuré');
        }

        try {
            let query = this.client.from('leads').select('*');

            // Appliquer les filtres
            if (filters.status) {
                query = query.eq('status', filters.status);
            }
            if (filters.source) {
                query = query.eq('source', filters.source);
            }

            // Tri
            query = query.order('created_at', { ascending: false });

            // Pagination
            if (filters.limit) {
                query = query.limit(filters.limit);
            }
            if (filters.offset) {
                query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
            }

            const { data, error } = await query;

            if (error) {
                throw error;
            }

            return { success: true, data };
        } catch (error) {
            console.error('Erreur lors de la récupération des leads:', error);
            throw error;
        }
    }

    /**
     * Créer un contact dans Supabase
     */
    async createContact(contactData) {
        if (!this.isConfigured()) {
            throw new Error('Supabase n\'est pas configuré');
        }

        try {
            const { data, error } = await this.client
                .from('contacts')
                .insert([contactData])
                .select()
                .single();

            if (error) {
                throw error;
            }

            return { success: true, data };
        } catch (error) {
            console.error('Erreur lors de la création du contact:', error);
            throw error;
        }
    }

    /**
     * Créer un fichier dans Supabase
     */
    async createFile(fileData) {
        if (!this.isConfigured()) {
            throw new Error('Supabase n\'est pas configuré');
        }

        try {
            const { data, error } = await this.client
                .from('files')
                .insert([fileData])
                .select()
                .single();

            if (error) {
                throw error;
            }

            return { success: true, data };
        } catch (error) {
            console.error('Erreur lors de la création du fichier:', error);
            throw error;
        }
    }

    /**
     * Récupérer un fichier par filename
     */
    async getFileByFilename(filename) {
        if (!this.isConfigured()) {
            throw new Error('Supabase n\'est pas configuré');
        }

        try {
            const { data, error } = await this.client
                .from('files')
                .select('*')
                .eq('filename', filename)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    return { success: false, data: null };
                }
                throw error;
            }

            return { success: true, data };
        } catch (error) {
            console.error('Erreur lors de la récupération du fichier:', error);
            throw error;
        }
    }
}

// Instance singleton
const supabaseService = new SupabaseService();

module.exports = supabaseService;



