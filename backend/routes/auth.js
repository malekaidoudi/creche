const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Générer un token JWT
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// POST /api/auth/register - Inscription
router.post('/register', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email valide requis'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Le mot de passe doit contenir au moins 6 caractères'),
  body('first_name')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Le prénom doit contenir au moins 2 caractères'),
  body('last_name')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Le nom doit contenir au moins 2 caractères'),
  body('phone')
    .optional()
    .isMobilePhone('any')
    .withMessage('Numéro de téléphone invalide'),
  body('role')
    .optional()
    .isIn(['parent', 'staff', 'admin'])
    .withMessage('Rôle invalide')
], async (req, res) => {
  try {
    // Vérifier les erreurs de validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Données invalides',
        details: errors.array()
      });
    }

    const { email, password, first_name, last_name, phone, role } = req.body;

    // Créer l'utilisateur
    const user = await User.create({
      email,
      password,
      first_name,
      last_name,
      phone,
      role: role || 'parent'
    });

    // Générer le token
    const token = generateToken(user.id);

    res.status(201).json({
      message: 'Inscription réussie',
      user: user.toJSON(),
      token
    });
  } catch (error) {
    console.error('Erreur d\'inscription:', error);
    
    if (error.message.includes('email existe déjà')) {
      return res.status(409).json({
        error: error.message
      });
    }

    res.status(500).json({
      error: 'Erreur lors de l\'inscription'
    });
  }
});

// POST /api/auth/login - Connexion
router.post('/login', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email valide requis'),
  body('password')
    .notEmpty()
    .withMessage('Mot de passe requis')
], async (req, res) => {
  try {
    // Vérifier les erreurs de validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Données invalides',
        details: errors.array()
      });
    }

    const { email, password } = req.body;

    // Trouver l'utilisateur
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({
        error: 'Email ou mot de passe incorrect'
      });
    }

    // Vérifier le mot de passe
    const isValidPassword = await user.verifyPassword(password);
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Email ou mot de passe incorrect'
      });
    }

    // Vérifier si le compte est actif
    if (!user.is_active) {
      return res.status(401).json({
        error: 'Compte désactivé'
      });
    }

    // Générer le token
    const token = generateToken(user.id);

    res.json({
      message: 'Connexion réussie',
      user: user.toJSON(),
      token
    });
  } catch (error) {
    console.error('Erreur de connexion:', error);
    res.status(500).json({
      error: 'Erreur lors de la connexion'
    });
  }
});

// GET /api/auth/me - Obtenir les informations de l'utilisateur connecté
router.get('/me', authenticateToken, async (req, res) => {
  try {
    res.json({
      user: req.user.toJSON()
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du profil:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération du profil'
    });
  }
});

// PUT /api/auth/profile - Mettre à jour le profil
router.put('/profile', [
  authenticateToken,
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Email valide requis'),
  body('first_name')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Le prénom doit contenir au moins 2 caractères'),
  body('last_name')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Le nom doit contenir au moins 2 caractères'),
  body('phone')
    .optional()
    .isMobilePhone('any')
    .withMessage('Numéro de téléphone invalide')
], async (req, res) => {
  try {
    // Vérifier les erreurs de validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Données invalides',
        details: errors.array()
      });
    }

    const { email, first_name, last_name, phone } = req.body;

    // Mettre à jour l'utilisateur
    const updatedUser = await User.update(req.user.id, {
      email,
      first_name,
      last_name,
      phone
    });

    res.json({
      message: 'Profil mis à jour avec succès',
      user: updatedUser.toJSON()
    });
  } catch (error) {
    console.error('Erreur de mise à jour du profil:', error);
    
    if (error.message.includes('email existe déjà')) {
      return res.status(409).json({
        error: error.message
      });
    }

    res.status(500).json({
      error: 'Erreur lors de la mise à jour du profil'
    });
  }
});

// PUT /api/auth/change-password - Changer le mot de passe
router.put('/change-password', [
  authenticateToken,
  body('oldPassword')
    .notEmpty()
    .withMessage('Ancien mot de passe requis'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('Le nouveau mot de passe doit contenir au moins 6 caractères')
], async (req, res) => {
  try {
    // Vérifier les erreurs de validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Données invalides',
        details: errors.array()
      });
    }

    const { oldPassword, newPassword } = req.body;

    // Changer le mot de passe
    await User.changePassword(req.user.id, oldPassword, newPassword);

    res.json({
      message: 'Mot de passe changé avec succès'
    });
  } catch (error) {
    console.error('Erreur de changement de mot de passe:', error);
    
    if (error.message.includes('incorrect')) {
      return res.status(400).json({
        error: error.message
      });
    }

    res.status(500).json({
      error: 'Erreur lors du changement de mot de passe'
    });
  }
});

// POST /api/auth/refresh - Rafraîchir le token
router.post('/refresh', authenticateToken, async (req, res) => {
  try {
    // Générer un nouveau token
    const token = generateToken(req.user.id);

    res.json({
      message: 'Token rafraîchi avec succès',
      token
    });
  } catch (error) {
    console.error('Erreur de rafraîchissement du token:', error);
    res.status(500).json({
      error: 'Erreur lors du rafraîchissement du token'
    });
  }
});

module.exports = router;
