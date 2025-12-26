const Joi = require('joi');
const { validationResult } = require('express-validator');

// Middleware de validation avec Joi
const validate = (schema) => {
    return (req, res, next) => {
        const { error } = schema.validate(req.body, { abortEarly: false });
        
        if (error) {
            const errors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message
            }));
            
            return res.status(400).json({
                success: false,
                message: 'Données de validation invalides',
                errors
            });
        }
        
        next();
    };
};

// Middleware de validation express-validator
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Données de validation invalides',
            errors: errors.array().map(error => ({
                field: error.path,
                message: error.msg,
                value: error.value
            }))
        });
    }
    
    next();
};

// Schémas de validation Joi
const schemas = {
    // Authentification
    register: Joi.object({
        email: Joi.string().email().required().messages({
            'string.email': 'Email invalide',
            'any.required': 'Email requis'
        }),
        password: Joi.string().min(6).required().messages({
            'string.min': 'Le mot de passe doit contenir au moins 6 caractères',
            'any.required': 'Mot de passe requis'
        }),
        firstName: Joi.string().min(2).max(100).required().messages({
            'string.min': 'Le prénom doit contenir au moins 2 caractères',
            'string.max': 'Le prénom ne peut pas dépasser 100 caractères',
            'any.required': 'Prénom requis'
        }),
        lastName: Joi.string().min(2).max(100).required().messages({
            'string.min': 'Le nom doit contenir au moins 2 caractères',
            'string.max': 'Le nom ne peut pas dépasser 100 caractères',
            'any.required': 'Nom requis'
        }),
        phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).optional().messages({
            'string.pattern.base': 'Numéro de téléphone invalide'
        })
    }),

    login: Joi.object({
        email: Joi.string().email().required().messages({
            'string.email': 'Email invalide',
            'any.required': 'Email requis'
        }),
        password: Joi.string().required().messages({
            'any.required': 'Mot de passe requis'
        })
    }),

    // Commandes
    createOrder: Joi.object({
        personName: Joi.string().min(2).max(255).required().messages({
            'string.min': 'Le nom de la personne doit contenir au moins 2 caractères',
            'any.required': 'Nom de la personne requis'
        }),
        occasion: Joi.string().valid('anniversaire', 'mariage', 'hommage', 'naissance', 'reussite', 'autre').required().messages({
            'any.only': 'Type d\'occasion invalide',
            'any.required': 'Type d\'occasion requis'
        }),
        relationship: Joi.string().min(10).required().messages({
            'string.min': 'La relation doit contenir au moins 10 caractères',
            'any.required': 'Relation requise'
        }),
        description: Joi.string().min(20).required().messages({
            'string.min': 'La description doit contenir au moins 20 caractères',
            'any.required': 'Description requise'
        }),
        anecdotes: Joi.array().items(
            Joi.object({
                title: Joi.string().min(5).max(255).required(),
                content: Joi.string().min(10).required()
            })
        ).optional(),
        testimonials: Joi.array().items(
            Joi.object({
                name: Joi.string().min(2).max(255).required(),
                relationship: Joi.string().min(5).max(255).required(),
                message: Joi.string().min(10).required()
            })
        ).optional(),
        colors: Joi.string().max(255).optional(),
        style: Joi.string().max(255).optional(),
        additionalInfo: Joi.string().max(1000).optional(),
        deliveryDate: Joi.date().min('now').required().messages({
            'date.min': 'La date de livraison doit être dans le futur',
            'any.required': 'Date de livraison requise'
        }),
        deliveryAddress: Joi.string().min(10).required().messages({
            'string.min': 'L\'adresse doit contenir au moins 10 caractères',
            'any.required': 'Adresse de livraison requise'
        }),
        deliveryPhone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).required().messages({
            'string.pattern.base': 'Numéro de téléphone invalide',
            'any.required': 'Téléphone de livraison requis'
        }),
        clientName: Joi.string().min(2).max(255).required().messages({
            'string.min': 'Le nom du client doit contenir au moins 2 caractères',
            'any.required': 'Nom du client requis'
        }),
        clientEmail: Joi.string().email().required().messages({
            'string.email': 'Email invalide',
            'any.required': 'Email du client requis'
        }),
        clientPhone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).required().messages({
            'string.pattern.base': 'Numéro de téléphone invalide',
            'any.required': 'Téléphone du client requis'
        }),
        uploadedFiles: Joi.array().items(
            Joi.object({
                name: Joi.string().max(255).required(),
                type: Joi.string().max(100).optional(),
                size: Joi.number().min(0).optional(),
                data: Joi.string().pattern(/^data:[A-Za-z0-9+/.:-]+;base64,.+/).optional().messages({
                    'string.pattern.base': 'Le fichier doit être encodé en base64 (data:*;base64,...)'
                }),
                serverId: Joi.string().optional(),
                url: Joi.string().uri().optional()
            })
        ).max(60).optional(),
        coverPhoto: Joi.object({
            name: Joi.string().max(255).required(),
            data: Joi.string().pattern(/^data:[A-Za-z0-9+/.:-]+;base64,.+/).required().messages({
                'string.pattern.base': 'La photo de couverture doit être encodée en base64'
            })
        }).allow(null),
        photoLink: Joi.string().max(1000).allow('', null).optional(),
        photoDeliveryMode: Joi.string().valid('upload', 'link').optional(),
        photoCaptions: Joi.object().pattern(Joi.string(), Joi.string().allow('')).optional(),
        source: Joi.string().max(255).optional()
    }),

    updateOrder: Joi.object({
        status: Joi.string().valid('pending', 'confirmed', 'in_progress', 'review', 'approved', 'printing', 'shipped', 'delivered', 'cancelled').optional(),
        paymentStatus: Joi.string().valid('pending', 'paid', 'failed', 'refunded').optional(),
        paymentMethod: Joi.string().valid('whatsapp', 'bank_transfer', 'cash_on_delivery', 'stripe').optional(),
        additionalCosts: Joi.number().min(0).optional(),
        internalNotes: Joi.string().max(1000).optional(),
        assignedTo: Joi.string().uuid().optional()
    }),

    // Leads
    createLead: Joi.object({
        name: Joi.string().min(2).max(255).required().messages({
            'string.min': 'Le nom doit contenir au moins 2 caractères',
            'any.required': 'Nom requis'
        }),
        email: Joi.string().email().optional().messages({
            'string.email': 'Email invalide'
        }),
        phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).optional().messages({
            'string.pattern.base': 'Numéro de téléphone invalide'
        }),
        occasion: Joi.string().valid('anniversaire', 'mariage', 'hommage', 'naissance', 'reussite', 'autre').optional(),
        message: Joi.string().max(1000).optional(),
        source: Joi.string().valid('contact_form', 'quick_lead', 'abandon_recovery', 'whatsapp', 'phone', 'referral').optional()
    }),

    updateLead: Joi.object({
        status: Joi.string().valid('new', 'contacted', 'qualified', 'converted', 'lost').optional(),
        priority: Joi.string().valid('low', 'medium', 'high', 'urgent').optional(),
        assignedTo: Joi.string().uuid().optional(),
        notes: Joi.string().max(1000).optional(),
        tags: Joi.array().items(Joi.string()).optional()
    }),

    // Contact
    contactForm: Joi.object({
        name: Joi.string().min(2).max(255).required().messages({
            'string.min': 'Le nom doit contenir au moins 2 caractères',
            'any.required': 'Nom requis'
        }),
        email: Joi.string().email().required().messages({
            'string.email': 'Email invalide',
            'any.required': 'Email requis'
        }),
        message: Joi.string().min(10).max(1000).required().messages({
            'string.min': 'Le message doit contenir au moins 10 caractères',
            'string.max': 'Le message ne peut pas dépasser 1000 caractères',
            'any.required': 'Message requis'
        })
    }),

    // Utilisateurs
    updateUser: Joi.object({
        firstName: Joi.string().min(2).max(100).optional(),
        lastName: Joi.string().min(2).max(100).optional(),
        phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).optional().messages({
            'string.pattern.base': 'Numéro de téléphone invalide'
        }),
        role: Joi.string().valid('admin', 'manager', 'designer', 'client').optional(),
        isActive: Joi.boolean().optional()
    }),

    // Fichiers
    uploadFile: Joi.object({
        type: Joi.string().valid('photo', 'cover', 'document', 'preview', 'final').required().messages({
            'any.only': 'Type de fichier invalide',
            'any.required': 'Type de fichier requis'
        }),
        orderId: Joi.string().uuid().optional(),
        isPublic: Joi.boolean().optional()
    })
};

module.exports = {
    validate,
    handleValidationErrors,
    schemas
};









