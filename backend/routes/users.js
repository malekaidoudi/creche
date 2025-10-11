const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Routes pour les profils utilisateurs

// Obtenir le profil de l'utilisateur connecté
router.get('/profile', authenticateToken, userController.getProfile);

// Mettre à jour le profil de l'utilisateur connecté
router.put('/profile', authenticateToken, userController.updateProfile);

// Upload photo de profil
router.post('/profile/image', authenticateToken, upload.single('profile_image'), userController.uploadProfileImage);

// Changer le mot de passe
router.put('/change-password', authenticateToken, userController.changePassword);

// Obtenir tous les utilisateurs (admin seulement)
router.get('/', authenticateToken, userController.getAllUsers);

// Obtenir un utilisateur par ID
router.get('/:id', authenticateToken, userController.getUserById);

// Mettre à jour un utilisateur par ID
router.put('/:id', authenticateToken, userController.updateProfile);

// Basculer le statut actif/inactif d'un utilisateur (admin seulement)
router.put('/:id/toggle-status', authenticateToken, userController.toggleUserStatus);

module.exports = router;
