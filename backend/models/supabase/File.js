/**
 * Modèle File pour Supabase
 * Remplace complètement le modèle Sequelize
 */

const supabaseService = require('../../services/supabaseService');

class File {
    constructor(data) {
        this.id = data.id;
        this.originalName = data.original_name || data.originalName || data.name;
        this.filename = data.filename;
        this.mimetype = data.mimetype || data.type;
        this.size = data.size;
        this.path = data.path;
        this.url = data.url || data.server_url;
        this.orderId = data.order_id || data.orderId;
        this.type = data.type || 'photo';
        this.uploadedAt = data.uploaded_at || data.created_at || data.uploadedAt;
    }

    /**
     * Convertir en format Supabase
     */
    toSupabase() {
        return {
            original_name: this.originalName,
            filename: this.filename,
            mimetype: this.mimetype,
            size: this.size,
            path: this.path,
            url: this.url,
            order_id: this.orderId,
            type: this.type
        };
    }

    /**
     * Convertir en JSON
     */
    toJSON() {
        return {
            id: this.id,
            originalName: this.originalName,
            filename: this.filename,
            mimetype: this.mimetype,
            size: this.size,
            path: this.path,
            url: this.url,
            orderId: this.orderId,
            type: this.type,
            uploadedAt: this.uploadedAt
        };
    }

    /**
     * Créer un fichier dans Supabase
     */
    static async create(data) {
        if (!supabaseService.isConfigured()) {
            throw new Error('Supabase n\'est pas configuré');
        }

        try {
            const file = new File(data);
            const supabaseData = file.toSupabase();
            
            if (!supabaseData.uploaded_at) {
                supabaseData.uploaded_at = new Date().toISOString();
            }

            const { data: result, error } = await supabaseService.client
                .from('files')
                .insert([supabaseData])
                .select()
                .single();

            if (error) {
                throw error;
            }

            return new File(result);
        } catch (error) {
            console.error('Erreur lors de la création du fichier:', error);
            throw error;
        }
    }

    /**
     * Trouver un fichier par ID
     */
    static async findByPk(id) {
        if (!supabaseService.isConfigured()) {
            throw new Error('Supabase n\'est pas configuré');
        }

        try {
            const { data, error } = await supabaseService.client
                .from('files')
                .select('*')
                .eq('id', id)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    return null;
                }
                throw error;
            }

            return data ? new File(data) : null;
        } catch (error) {
            console.error('Erreur lors de la récupération du fichier:', error);
            throw error;
        }
    }

    /**
     * Trouver un fichier par filename
     */
    static async findByFilename(filename) {
        if (!supabaseService.isConfigured()) {
            throw new Error('Supabase n\'est pas configuré');
        }

        try {
            const { data, error } = await supabaseService.client
                .from('files')
                .select('*')
                .eq('filename', filename)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    return null;
                }
                throw error;
            }

            return data ? new File(data) : null;
        } catch (error) {
            console.error('Erreur lors de la récupération du fichier:', error);
            throw error;
        }
    }

    /**
     * Trouver tous les fichiers avec filtres
     */
    static async findAll(options = {}) {
        if (!supabaseService.isConfigured()) {
            throw new Error('Supabase n\'est pas configuré');
        }

        try {
            let query = supabaseService.client.from('files').select('*');

            if (options.where) {
                if (options.where.orderId || options.where.order_id) {
                    query = query.eq('order_id', options.where.orderId || options.where.order_id);
                }
                if (options.where.type) {
                    query = query.eq('type', options.where.type);
                }
            }

            if (options.order) {
                const [field, direction] = options.order[0] || ['uploaded_at', 'DESC'];
                query = query.order(field, { ascending: direction !== 'DESC' });
            } else {
                query = query.order('uploaded_at', { ascending: false });
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

            return data ? data.map(item => new File(item)) : [];
        } catch (error) {
            console.error('Erreur lors de la récupération des fichiers:', error);
            throw error;
        }
    }

    /**
     * Mettre à jour le fichier
     */
    async update(updateData) {
        if (!this.id) {
            throw new Error('Impossible de mettre à jour un fichier sans ID');
        }

        if (!supabaseService.isConfigured()) {
            throw new Error('Supabase n\'est pas configuré');
        }

        try {
            Object.assign(this, updateData);
            const supabaseData = this.toSupabase();

            const { data, error } = await supabaseService.client
                .from('files')
                .update(supabaseData)
                .eq('id', this.id)
                .select()
                .single();

            if (error) {
                throw error;
            }

            Object.assign(this, new File(data));
            return this;
        } catch (error) {
            console.error('Erreur lors de la mise à jour du fichier:', error);
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
     * Supprimer le fichier
     */
    async destroy() {
        if (!this.id) {
            throw new Error('Impossible de supprimer un fichier sans ID');
        }

        if (!supabaseService.isConfigured()) {
            throw new Error('Supabase n\'est pas configuré');
        }

        try {
            const { error } = await supabaseService.client
                .from('files')
                .delete()
                .eq('id', this.id);

            if (error) {
                throw error;
            }

            return true;
        } catch (error) {
            console.error('Erreur lors de la suppression du fichier:', error);
            throw error;
        }
    }
}

module.exports = File;



