const express = require('express');
const { body, validationResult, query } = require('express-validator');
const User = require('../models/User');
const { authenticateToken, requireAdmin, requireOwnershipOrStaff } = require('../middleware/auth');

const router = express.Router();

// GET /api/users - Obtenir tous les utilisateurs (admin seulement)
router.get('/', [
  authenticateToken,
  requireAdmin,
  query('page').optional().isInt({ min: 1 }).withMessage('Page doit être un entier positif'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit doit être entre 1 et 100'),
  query('role').optional().isIn(['admin', 'staff', 'parent']).withMessage('Rôle invalide')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Paramètres invalides',
        details: errors.array()
      });
    }

    // Valeurs par défaut robustes pour la pagination
    let page = 1;
    let limit = 10;
    
    if (req.query.page && !isNaN(req.query.page)) {
      page = Math.max(1, parseInt(req.query.page));
    }
    
    if (req.query.limit && !isNaN(req.query.limit)) {
      limit = Math.max(1, Math.min(100, parseInt(req.query.limit)));
    }
    
    const role = req.query.role;

    const result = await User.findAll(page, limit, role);

    res.json({
      message: 'Utilisateurs récupérés avec succès',
      ...result
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération des utilisateurs'
    });
  }
});

// GET /api/users/:id - Obtenir un utilisateur par ID
router.get('/:id', [
  authenticateToken,
  requireOwnershipOrStaff
], async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    if (isNaN(userId)) {
      return res.status(400).json({
        error: 'ID utilisateur invalide'
      });
    }

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        error: 'Utilisateur non trouvé'
      });
    }

    res.json({
      message: 'Utilisateur récupéré avec succès',
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération de l\'utilisateur'
    });
  }
});

// POST /api/users - Créer un nouvel utilisateur (admin seulement)
router.post('/', [
  authenticateToken,
  requireAdmin,
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
    .isIn(['parent', 'staff', 'admin'])
    .withMessage('Rôle invalide')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Données invalides',
        details: errors.array()
      });
    }

    const { email, password, first_name, last_name, phone, role } = req.body;

    const user = await User.create({
      email,
      password,
      first_name,
      last_name,
      phone,
      role
    });

    res.status(201).json({
      message: 'Utilisateur créé avec succès',
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Erreur lors de la création de l\'utilisateur:', error);
    
    if (error.message.includes('email existe déjà')) {
      return res.status(409).json({
        error: error.message
      });
    }

    res.status(500).json({
      error: 'Erreur lors de la création de l\'utilisateur'
    });
  }
});

// PUT /api/users/:id - Mettre à jour un utilisateur
router.put('/:id', [
  authenticateToken,
  requireOwnershipOrStaff,
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
    .withMessage('Numéro de téléphone invalide'),
  body('role')
    .optional()
    .isIn(['parent', 'staff', 'admin'])
    .withMessage('Rôle invalide'),
  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('is_active doit être un booléen')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Données invalides',
        details: errors.array()
      });
    }

    const userId = parseInt(req.params.id);
    
    if (isNaN(userId)) {
      return res.status(400).json({
        error: 'ID utilisateur invalide'
      });
    }

    const { email, first_name, last_name, phone, role, is_active } = req.body;

    // Seuls les admins peuvent modifier le rôle et le statut actif
    const updateData = { email, first_name, last_name, phone };
    
    if (req.user.role === 'admin') {
      if (role !== undefined) updateData.role = role;
      if (is_active !== undefined) updateData.is_active = is_active;
    }

    const updatedUser = await User.update(userId, updateData);

    if (!updatedUser) {
      return res.status(404).json({
        error: 'Utilisateur non trouvé'
      });
    }

    res.json({
      message: 'Utilisateur mis à jour avec succès',
      user: updatedUser.toJSON()
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
    
    if (error.message.includes('email existe déjà')) {
      return res.status(409).json({
        error: error.message
      });
    }

    res.status(500).json({
      error: 'Erreur lors de la mise à jour de l\'utilisateur'
    });
  }
});

// DELETE /api/users/:id - Supprimer un utilisateur (admin seulement)
router.delete('/:id', [
  authenticateToken,
  requireAdmin
], async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    if (isNaN(userId)) {
      return res.status(400).json({
        error: 'ID utilisateur invalide'
      });
    }

    // Empêcher la suppression de son propre compte
    if (userId === req.user.id) {
      return res.status(400).json({
        error: 'Vous ne pouvez pas supprimer votre propre compte'
      });
    }

    const deleted = await User.delete(userId);

    if (!deleted) {
      return res.status(404).json({
        error: 'Utilisateur non trouvé'
      });
    }

    res.json({
      message: 'Utilisateur supprimé avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'utilisateur:', error);
    res.status(500).json({
      error: 'Erreur lors de la suppression de l\'utilisateur'
    });
  }
});

module.exports = router;
