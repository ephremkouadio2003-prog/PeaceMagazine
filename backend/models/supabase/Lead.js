/**
 * Modèle Lead pour Supabase
 * Remplace complètement le modèle Sequelize
 */

const supabaseService = require('../../services/supabaseService');

class Lead {
    constructor(data) {
        this.id = data.id;
        this.name = data.name;
        this.email = data.email;
        this.phone = data.phone;
        this.occasion = data.occasion;
        this.message = data.message;
        this.source = data.source || 'contact_form';
        this.status = data.status || 'new';
        this.score = data.score || 0;
        this.createdAt = data.created_at || data.createdAt;
        this.updatedAt = data.updated_at || data.updatedAt;
    }

    /**
     * Convertir en format Supabase
     */
    toSupabase() {
        return {
            name: this.name,
            email: this.email,
            phone: this.phone,
            occasion: this.occasion,
            message: this.message,
            source: this.source,
            status: this.status,
            score: this.score,
            updated_at: new Date().toISOString()
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
            phone: this.phone,
            occasion: this.occasion,
            message: this.message,
            source: this.source,
            status: this.status,
            score: this.score,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }

    /**
     * Créer un lead dans Supabase
     */
    static async create(data) {
        if (!supabaseService.isConfigured()) {
            throw new Error('Supabase n\'est pas configuré');
        }

        try {
            const lead = new Lead(data);
            
            // Calculer le score si pas fourni
            if (!lead.score) {
                lead.score = Lead.calculateScore(data);
            }

            const supabaseData = lead.toSupabase();
            if (!supabaseData.created_at) {
                supabaseData.created_at = new Date().toISOString();
            }

            const { data: result, error } = await supabaseService.client
                .from('leads')
                .insert([supabaseData])
                .select()
                .single();

            if (error) {
                throw error;
            }

            return new Lead(result);
        } catch (error) {
            console.error('Erreur lors de la création du lead:', error);
            throw error;
        }
    }

    /**
     * Calculer le score d'un lead (0-100)
     */
    static calculateScore(leadData) {
        let score = 0;
        
        if (leadData.name && leadData.name.length > 3) score += 20;
        if (leadData.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(leadData.email)) score += 20;
        if (leadData.phone && leadData.phone.length > 8) score += 20;
        if (leadData.message && leadData.message.length > 50) score += 20;
        
        const highValueOccasions = ['mariage', 'anniversaire', 'naissance'];
        if (highValueOccasions.includes(leadData.occasion?.toLowerCase())) score += 20;
        
        return Math.min(score, 100);
    }

    /**
     * Trouver un lead par ID
     */
    static async findByPk(id) {
        if (!supabaseService.isConfigured()) {
            throw new Error('Supabase n\'est pas configuré');
        }

        try {
            const { data, error } = await supabaseService.client
                .from('leads')
                .select('*')
                .eq('id', id)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    return null;
                }
                throw error;
            }

            return data ? new Lead(data) : null;
        } catch (error) {
            console.error('Erreur lors de la récupération du lead:', error);
            throw error;
        }
    }

    /**
     * Trouver tous les leads avec filtres
     */
    static async findAll(options = {}) {
        if (!supabaseService.isConfigured()) {
            throw new Error('Supabase n\'est pas configuré');
        }

        try {
            let query = supabaseService.client.from('leads').select('*');

            if (options.where) {
                if (options.where.status) {
                    query = query.eq('status', options.where.status);
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

            return data ? data.map(item => new Lead(item)) : [];
        } catch (error) {
            console.error('Erreur lors de la récupération des leads:', error);
            throw error;
        }
    }

    /**
     * Mettre à jour le lead
     */
    async update(updateData) {
        if (!this.id) {
            throw new Error('Impossible de mettre à jour un lead sans ID');
        }

        if (!supabaseService.isConfigured()) {
            throw new Error('Supabase n\'est pas configuré');
        }

        try {
            Object.assign(this, updateData);
            
            // Recalculer le score si nécessaire
            if (updateData.name || updateData.email || updateData.phone || updateData.message) {
                this.score = Lead.calculateScore(this);
            }

            const supabaseData = this.toSupabase();
            supabaseData.updated_at = new Date().toISOString();

            const { data, error } = await supabaseService.client
                .from('leads')
                .update(supabaseData)
                .eq('id', this.id)
                .select()
                .single();

            if (error) {
                throw error;
            }

            Object.assign(this, new Lead(data));
            return this;
        } catch (error) {
            console.error('Erreur lors de la mise à jour du lead:', error);
            throw error;
        }
    }

    /**
     * Sauvegarder
     */
    async save() {
        return this.update({});
    }

    /**
     * Supprimer le lead
     */
    async destroy() {
        if (!this.id) {
            throw new Error('Impossible de supprimer un lead sans ID');
        }

        if (!supabaseService.isConfigured()) {
            throw new Error('Supabase n\'est pas configuré');
        }

        try {
            const { error } = await supabaseService.client
                .from('leads')
                .delete()
                .eq('id', this.id);

            if (error) {
                throw error;
            }

            return true;
        } catch (error) {
            console.error('Erreur lors de la suppression du lead:', error);
            throw error;
        }
    }
}

module.exports = Lead;



