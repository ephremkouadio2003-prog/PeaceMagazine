/**
 * Gestionnaire d'erreurs centralisé pour le backend
 */

class AppError extends Error {
    constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details = null) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
        this.isOperational = true;
        
        Error.captureStackTrace(this, this.constructor);
    }
}

// Codes d'erreur personnalisés
const ErrorCodes = {
    // Erreurs de validation
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    INVALID_DATA: 'INVALID_DATA',
    MISSING_FIELD: 'MISSING_FIELD',
    
    // Erreurs de fichiers
    FILE_TOO_LARGE: 'FILE_TOO_LARGE',
    INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
    FILE_SAVE_ERROR: 'FILE_SAVE_ERROR',
    INVALID_BASE64: 'INVALID_BASE64',
    
    // Erreurs de commandes
    ORDER_NOT_FOUND: 'ORDER_NOT_FOUND',
    ORDER_ALREADY_PAID: 'ORDER_ALREADY_PAID',
    INVALID_ORDER_STATUS: 'INVALID_ORDER_STATUS',
    
    // Erreurs de paiement
    PAYMENT_FAILED: 'PAYMENT_FAILED',
    PAYMENT_NOT_FOUND: 'PAYMENT_NOT_FOUND',
    INVALID_PAYMENT_AMOUNT: 'INVALID_PAYMENT_AMOUNT',
    
    // Erreurs de base de données
    DATABASE_ERROR: 'DATABASE_ERROR',
    DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',
    
    // Erreurs d'authentification
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',
    TOKEN_EXPIRED: 'TOKEN_EXPIRED',
    
    // Erreurs générales
    INTERNAL_ERROR: 'INTERNAL_ERROR',
    NOT_FOUND: 'NOT_FOUND',
    BAD_REQUEST: 'BAD_REQUEST'
};

// Middleware de gestion d'erreurs
const errorHandler = (error, req, res, next) => {
    let statusCode = error.statusCode || 500;
    let code = error.code || ErrorCodes.INTERNAL_ERROR;
    let message = error.message || 'Erreur interne du serveur';
    let details = error.details || null;

    // Gestion des erreurs Sequelize
    if (error.name === 'SequelizeValidationError') {
        statusCode = 400;
        code = ErrorCodes.VALIDATION_ERROR;
        message = 'Erreurs de validation';
        details = error.errors.map(err => ({
            field: err.path,
            message: err.message,
            value: err.value
        }));
    } else if (error.name === 'SequelizeUniqueConstraintError') {
        statusCode = 409;
        code = ErrorCodes.DUPLICATE_ENTRY;
        message = 'Cette entrée existe déjà';
        details = {
            field: error.errors[0]?.path,
            value: error.errors[0]?.value
        };
    } else if (error.name === 'SequelizeDatabaseError') {
        statusCode = 500;
        code = ErrorCodes.DATABASE_ERROR;
        message = 'Erreur de base de données';
    } else if (error.name === 'JsonWebTokenError') {
        statusCode = 401;
        code = ErrorCodes.UNAUTHORIZED;
        message = 'Token invalide';
    } else if (error.name === 'TokenExpiredError') {
        statusCode = 401;
        code = ErrorCodes.TOKEN_EXPIRED;
        message = 'Token expiré';
    }

    // Logging de l'erreur
    console.error('❌ Erreur:', {
        code,
        message,
        statusCode,
        path: req.path,
        method: req.method,
        details: process.env.NODE_ENV === 'development' ? details : undefined,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });

    // Réponse d'erreur
    const errorResponse = {
        success: false,
        error: {
            code,
            message,
            ...(details && { details }),
            ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
        }
    };

    res.status(statusCode).json(errorResponse);
};

// Wrapper pour les routes async
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

module.exports = {
    AppError,
    ErrorCodes,
    errorHandler,
    asyncHandler
};






