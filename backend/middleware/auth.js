const jwt = require('jsonwebtoken');
// ⚠️ MySQL/Sequelize désactivé - User model retiré
// const { User } = require('../models');

// ⚠️ Middleware d'authentification désactivé (nécessite Sequelize)
// Toutes les routes authentifiées sont désactivées
const authenticateToken = async (req, res, next) => {
    return res.status(503).json({
        success: false,
        message: 'Authentification désactivée - MySQL/Sequelize n\'est plus disponible. Utilisez Supabase directement pour l\'administration.'
    });
};

// ⚠️ Middleware d'autorisation désactivé (nécessite authentification)
const authorize = (...roles) => {
    return (req, res, next) => {
        return res.status(503).json({
            success: false,
            message: 'Autorisation désactivée - MySQL/Sequelize n\'est plus disponible.'
        });
    };
};

// ⚠️ Middleware désactivé (nécessite Sequelize)
const checkResourceOwnership = (resourceModel, resourceIdParam = 'id') => {
    return async (req, res, next) => {
        return res.status(503).json({
            success: false,
            message: 'Vérification de propriété désactivée - MySQL/Sequelize n\'est plus disponible.'
        });
    };
};

// ⚠️ Middleware pour les routes publiques - Token optionnel ignoré (Sequelize désactivé)
const optionalAuth = async (req, res, next) => {
    // Ignorer l'authentification pour les routes publiques
    // Sequelize n'est plus disponible, donc on ne peut pas vérifier les tokens
    // Les routes publiques fonctionnent sans authentification
    next();
};

// Génération de tokens
const generateTokens = (user) => {
    const payload = {
        userId: user.id,
        email: user.email,
        role: user.role
    };

    const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });

    const refreshToken = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: '30d'
    });

    return { accessToken, refreshToken };
};

// Vérification du token de rafraîchissement
const verifyRefreshToken = (token) => {
    try {
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        throw new Error('Token de rafraîchissement invalide');
    }
};

module.exports = {
    authenticateToken,
    authorize,
    checkResourceOwnership,
    optionalAuth,
    generateTokens,
    verifyRefreshToken
};











