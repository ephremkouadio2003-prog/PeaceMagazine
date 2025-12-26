/**
 * Modèle Contact pour Supabase
 * Remplace complètement le modèle Sequelize
 */

const supabaseService = require('../../services/supabaseService');

class Contact {
    constructor(data) {
        this.id = data.id;
        this.name = data.name;
        this.email = data.email;
        this.message = data.message;
        this.source = data.source || 'contact_form';
        this.createdAt = data.created_at || data.createdAt;
    }

    /**
     * Convertir en format Supabase
     */
    toSupabase() {
        return {
            name: this.name,
            email: this.email,
            message: this.message,
            source: this.source
        };
    }

    /**
     * Convertir en JSON
     */
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            email: this.email,
            message: this.message,
            source: this.source,
            createdAt: this.createdAt
        };
    }

    /**
     * Créer un contact dans Supabase
     */
    static async create(data) {
        if (!supabaseService.isConfigured()) {
            throw new Error('Supabase n\'est pas configuré');
        }

        try {
            const contact = new Contact(data);
            const supabaseData = contact.toSupabase();
            
            if (!supabaseData.created_at) {
                supabaseData.created_at = new Date().toISOString();
            }

            const { data: result, error } = await supabaseService.client
                .from('contacts')
                .insert([supabaseData])
                .select()
                .single();

            if (error) {
                throw error;
            }

            return new Contact(result);
        } catch (error) {
            console.error('Erreur lors de la création du contact:', error);
            throw error;
        }
    }

    /**
     * Trouver un contact par ID
     */
    static async findByPk(id) {
        if (!supabaseService.isConfigured()) {
            throw new Error('Supabase n\'est pas configuré');
        }

        try {
            const { data, error } = await supabaseService.client
                .from('contacts')
                .select('*')
                .eq('id', id)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    return null;
                }
                throw error;
            }

            return data ? new Contact(data) : null;
        } catch (error) {
            console.error('Erreur lors de la récupération du contact:', error);
            throw error;
        }
    }

    /**
     * Trouver tous les contacts avec filtres
     */
    static async findAll(options = {}) {
        if (!supabaseService.isConfigured()) {
            throw new Error('Supabase n\'est pas configuré');
        }

        try {
            let query = supabaseService.client.from('contacts').select('*');

            if (options.where) {
                if (options.where.email) {
                    query = query.eq('email', options.where.email);
                }
                if (options.where.source) {
                    query = query.eq('source', options.where.source);
                }
            }

            if (options.order) {
                const [field, direction] = options.order[0] || ['created_at', 'DESC'];
                query = query.order(field, { ascending: direction !== 'DESC' });
            } else {
                query = query.order('created_at', { ascending: false });
            }

            if (options.limit) {
                query = query.limit(options.limit);
            }
            if (options.offset) {
                query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
            }

            const { data, error } = await query;

            if (error) {
                throw error;
            }

            return data ? data.map(item => new Contact(item)) : [];
        } catch (error) {
            console.error('Erreur lors de la récupération des contacts:', error);
            throw error;
        }
    }
}

module.exports = Contact;



