/**
 * Modèle Order pour Supabase
 * Remplace complètement le modèle Sequelize
 */

const supabaseService = require('../../services/supabaseService');

class Order {
    constructor(data) {
        this.id = data.id;
        this.orderNumber = data.order_number || data.orderNumber;
        this.personName = data.person_name || data.personName;
        this.occasion = data.occasion;
        this.relationship = data.relationship;
        this.customerName = data.customer_name || data.customerName;
        this.customerEmail = data.customer_email || data.customerEmail;
        this.customerPhone = data.customer_phone || data.customerPhone;
        this.deliveryDate = data.delivery_date || data.deliveryDate;
        this.deliveryAddress = data.delivery_address || data.deliveryAddress;
        this.deliveryPhone = data.delivery_phone || data.deliveryPhone;
        this.description = data.description;
        this.style = data.style;
        this.colors = data.colors;
        this.additionalInfo = data.additional_info || data.additionalInfo;
        this.status = data.status || 'pending';
        this.paymentStatus = data.payment_status || data.paymentStatus || 'pending';
        this.paymentMethod = data.payment_method || data.paymentMethod;
        this.paymentUrl = data.payment_url || data.paymentUrl;
        this.paymentAmount = data.payment_amount || data.paymentAmount;
        this.basePrice = data.base_price || data.basePrice;
        this.totalPrice = data.total_price || data.totalPrice;
        this.currency = data.currency || 'XOF';
        this.metadata = typeof data.metadata === 'string' ? JSON.parse(data.metadata) : data.metadata;
        this.createdAt = data.created_at || data.createdAt;
        this.updatedAt = data.updated_at || data.updatedAt;
    }

    /**
     * Convertir en format Supabase (snake_case)
     */
    toSupabase() {
        return {
            order_number: this.orderNumber,
            person_name: this.personName,
            occasion: this.occasion,
            relationship: this.relationship,
            customer_name: this.customerName,
            customer_email: this.customerEmail,
            customer_phone: this.customerPhone,
            delivery_date: this.deliveryDate,
            delivery_address: this.deliveryAddress,
            delivery_phone: this.deliveryPhone,
            description: this.description,
            style: this.style,
            colors: typeof this.colors === 'string' ? this.colors : JSON.stringify(this.colors),
            additional_info: this.additionalInfo,
            status: this.status,
            payment_status: this.paymentStatus,
            payment_method: this.paymentMethod,
            payment_url: this.paymentUrl,
            payment_amount: this.paymentAmount,
            base_price: this.basePrice,
            total_price: this.totalPrice,
            currency: this.currency,
            metadata: typeof this.metadata === 'string' ? this.metadata : JSON.stringify(this.metadata),
            updated_at: new Date().toISOString()
        };
    }

    /**
     * Convertir en JSON (camelCase pour le frontend)
     */
    toJSON() {
        return {
            id: this.id,
            orderNumber: this.orderNumber,
            personName: this.personName,
            occasion: this.occasion,
            relationship: this.relationship,
            customerName: this.customerName,
            clientName: this.customerName, // Alias pour compatibilité
            customerEmail: this.customerEmail,
            clientEmail: this.customerEmail, // Alias pour compatibilité
            customerPhone: this.customerPhone,
            clientPhone: this.customerPhone, // Alias pour compatibilité
            deliveryDate: this.deliveryDate,
            deliveryAddress: this.deliveryAddress,
            deliveryPhone: this.deliveryPhone,
            description: this.description,
            style: this.style,
            colors: this.colors,
            additionalInfo: this.additionalInfo,
            status: this.status,
            paymentStatus: this.paymentStatus,
            paymentMethod: this.paymentMethod,
            paymentUrl: this.paymentUrl,
            paymentAmount: this.paymentAmount,
            basePrice: this.basePrice,
            totalPrice: this.totalPrice,
            currency: this.currency,
            metadata: this.metadata,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }

    /**
     * Créer une commande dans Supabase
     */
    static async create(data) {
        if (!supabaseService.isConfigured()) {
            throw new Error('Supabase n\'est pas configuré');
        }

        try {
            const order = new Order(data);
            const supabaseData = order.toSupabase();
            
            // Ajouter created_at si pas présent
            if (!supabaseData.created_at) {
                supabaseData.created_at = new Date().toISOString();
            }

            const { data: result, error } = await supabaseService.client
                .from('orders')
                .insert([supabaseData])
                .select()
                .single();

            if (error) {
                throw error;
            }

            return new Order(result);
        } catch (error) {
            console.error('Erreur lors de la création de la commande:', error);
            throw error;
        }
    }

    /**
     * Trouver une commande par ID
     */
    static async findByPk(id) {
        if (!supabaseService.isConfigured()) {
            throw new Error('Supabase n\'est pas configuré');
        }

        try {
            const { data, error } = await supabaseService.client
                .from('orders')
                .select('*')
                .eq('id', id)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    return null; // Non trouvé
                }
                throw error;
            }

            return data ? new Order(data) : null;
        } catch (error) {
            console.error('Erreur lors de la récupération de la commande:', error);
            throw error;
        }
    }

    /**
     * Trouver une commande par numéro
     */
    static async findByOrderNumber(orderNumber) {
        if (!supabaseService.isConfigured()) {
            throw new Error('Supabase n\'est pas configuré');
        }

        try {
            const { data, error } = await supabaseService.client
                .from('orders')
                .select('*')
                .eq('order_number', orderNumber)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    return null;
                }
                throw error;
            }

            return data ? new Order(data) : null;
        } catch (error) {
            console.error('Erreur lors de la récupération de la commande:', error);
            throw error;
        }
    }

    /**
     * Trouver toutes les commandes avec filtres
     */
    static async findAll(options = {}) {
        if (!supabaseService.isConfigured()) {
            throw new Error('Supabase n\'est pas configuré');
        }

        try {
            let query = supabaseService.client.from('orders').select('*');

            // Filtres where
            if (options.where) {
                if (options.where.status) {
                    query = query.eq('status', options.where.status);
                }
                if (options.where.paymentStatus || options.where.payment_status) {
                    query = query.eq('payment_status', options.where.paymentStatus || options.where.payment_status);
                }
                if (options.where.customerEmail || options.where.customer_email) {
                    query = query.eq('customer_email', options.where.customerEmail || options.where.customer_email);
                }
            }

            // Tri
            if (options.order) {
                const [field, direction] = options.order[0] || ['created_at', 'DESC'];
                query = query.order(field, { ascending: direction !== 'DESC' });
            } else {
                query = query.order('created_at', { ascending: false });
            }

            // Pagination
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

            return data ? data.map(item => new Order(item)) : [];
        } catch (error) {
            console.error('Erreur lors de la récupération des commandes:', error);
            throw error;
        }
    }

    /**
     * Mettre à jour la commande
     */
    async update(updateData) {
        if (!this.id) {
            throw new Error('Impossible de mettre à jour une commande sans ID');
        }

        if (!supabaseService.isConfigured()) {
            throw new Error('Supabase n\'est pas configuré');
        }

        try {
            // Mettre à jour les propriétés
            Object.assign(this, updateData);

            const supabaseData = this.toSupabase();
            supabaseData.updated_at = new Date().toISOString();

            const { data, error } = await supabaseService.client
                .from('orders')
                .update(supabaseData)
                .eq('id', this.id)
                .select()
                .single();

            if (error) {
                throw error;
            }

            // Mettre à jour l'instance
            Object.assign(this, new Order(data));
            return this;
        } catch (error) {
            console.error('Erreur lors de la mise à jour de la commande:', error);
            throw error;
        }
    }

    /**
     * Sauvegarder (alias pour update)
     */
    async save() {
        return this.update({});
    }

    /**
     * Supprimer la commande
     */
    async destroy() {
        if (!this.id) {
            throw new Error('Impossible de supprimer une commande sans ID');
        }

        if (!supabaseService.isConfigured()) {
            throw new Error('Supabase n\'est pas configuré');
        }

        try {
            const { error } = await supabaseService.client
                .from('orders')
                .delete()
                .eq('id', this.id);

            if (error) {
                throw error;
            }

            return true;
        } catch (error) {
            console.error('Erreur lors de la suppression de la commande:', error);
            throw error;
        }
    }

    /**
     * Calculer le prix total
     */
    calculateTotal() {
        const base = parseFloat(this.basePrice) || 25000;
        const additional = parseFloat(this.additionalCosts) || 0;
        this.totalPrice = base + additional;
        return this.totalPrice;
    }
}

module.exports = Order;



