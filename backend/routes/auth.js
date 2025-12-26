const express = require('express');
const router = express.Router();
// ⚠️ MySQL/Sequelize désactivé - Toutes les routes d'authentification sont désactivées
// L'authentification est gérée par Supabase côté frontend

// ⚠️ Routes désactivées (nécessitent Sequelize)
// router.post('/register', ...) - DÉSACTIVÉ
// router.post('/login', ...) - DÉSACTIVÉ
// router.post('/refresh-token', ...) - DÉSACTIVÉ
// router.post('/logout', ...) - DÉSACTIVÉ
// router.get('/profile', ...) - DÉSACTIVÉ
// router.put('/profile', ...) - DÉSACTIVÉ
// router.put('/change-password', ...) - DÉSACTIVÉ
// router.post('/forgot-password', ...) - DÉSACTIVÉ
// router.post('/reset-password', ...) - DÉSACTIVÉ
// router.get('/verify-email/:token', ...) - DÉSACTIVÉ

// Route de santé pour vérifier que le serveur fonctionne
router.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Route auth accessible - Authentification gérée par Supabase',
        note: 'Utilisez Supabase Auth côté frontend pour l\'authentification'
    });
});

module.exports = router;











