const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { authenticateToken, requireAdmin, requireStaff, requireOwnershipOrStaff } = require('../middleware/auth');

const router = express.Router();

// GET /api/users - Obtenir tous les utilisateurs (Admin/Staff)
router.get('/', authenticateToken, requireStaff, async (req, res) => {
  try {
    const { page = 1, limit = 20, role } = req.query;
    
    const result = await User.findAll(page, limit, role);
    
    res.json(result);
  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// GET /api/users/stats - Obtenir les statistiques des utilisateurs (Admin/Staff)
router.get('/stats', authenticateToken, requireStaff, async (req, res) => {
  try {
    // Obtenir les statistiques par rôle
    const [adminResult, staffResult, parentResult] = await Promise.all([
      User.findAll(1, 1, 'admin'),
      User.findAll(1, 1, 'staff'),
      User.findAll(1, 1, 'parent')
    ]);
    
    const stats = {
      total: adminResult.pagination.total + staffResult.pagination.total + parentResult.pagination.total,
      admin: adminResult.pagination.total,
      staff: staffResult.pagination.total,
      parent: parentResult.pagination.total
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// GET /api/users/:id - Obtenir un utilisateur par ID
router.get('/:id', authenticateToken, requireOwnershipOrStaff, async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    
    res.json(user.toJSON());
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// POST /api/users - Créer un nouvel utilisateur (Admin seulement)
router.post('/', [
  authenticateToken,
  requireAdmin,
  body('email').isEmail().withMessage('Email invalide'),
  body('password').isLength({ min: 6 }).withMessage('Mot de passe trop court (minimum 6 caractères)'),
  body('first_name').isLength({ min: 1 }).withMessage('Prénom requis'),
  body('last_name').isLength({ min: 1 }).withMessage('Nom requis'),
  body('phone').optional().isMobilePhone('any').withMessage('Numéro de téléphone invalide'),
  body('role').isIn(['admin', 'staff', 'parent']).withMessage('Rôle invalide')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Données invalides', 
        details: errors.array() 
      });
    }

    const userData = req.body;
    const user = await User.create(userData);
    
    res.status(201).json({
      message: 'Utilisateur créé avec succès',
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Erreur lors de la création de l\'utilisateur:', error);
    
    if (error.message.includes('email existe déjà')) {
      return res.status(409).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// PUT /api/users/:id - Mettre à jour un utilisateur
router.put('/:id', [
  authenticateToken,
  requireOwnershipOrStaff,
  body('email').optional().isEmail().withMessage('Email invalide'),
  body('first_name').optional().isLength({ min: 1 }).withMessage('Prénom requis'),
  body('last_name').optional().isLength({ min: 1 }).withMessage('Nom requis'),
  body('phone').optional().isMobilePhone('any').withMessage('Numéro de téléphone invalide'),
  body('role').optional().isIn(['admin', 'staff', 'parent']).withMessage('Rôle invalide'),
  body('is_active').optional().isBoolean().withMessage('Statut actif invalide')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Données invalides', 
        details: errors.array() 
      });
    }

    const { id } = req.params;
    const updateData = req.body;
    
    // Seuls les admins peuvent modifier le rôle et le statut actif
    if (req.user.role !== 'admin') {
      delete updateData.role;
      delete updateData.is_active;
    }
    
    const user = await User.update(id, updateData);
    
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    
    res.json({
      message: 'Utilisateur mis à jour avec succès',
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
    
    if (error.message.includes('email existe déjà')) {
      return res.status(409).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// DELETE /api/users/:id - Supprimer un utilisateur (soft delete) (Admin seulement)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Empêcher la suppression de son propre compte
    if (req.user.id === parseInt(id)) {
      return res.status(400).json({ error: 'Vous ne pouvez pas supprimer votre propre compte' });
    }
    
    const success = await User.delete(id);
    
    if (!success) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    
    res.json({ message: 'Utilisateur supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'utilisateur:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// PUT /api/users/:id/password - Changer le mot de passe d'un utilisateur (Admin ou propriétaire)
router.put('/:id/password', [
  authenticateToken,
  requireOwnershipOrStaff,
  body('currentPassword').if((value, { req }) => req.user.id === parseInt(req.params.id)).isLength({ min: 1 }).withMessage('Mot de passe actuel requis'),
  body('newPassword').isLength({ min: 6 }).withMessage('Nouveau mot de passe trop court (minimum 6 caractères)')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Données invalides', 
        details: errors.array() 
      });
    }

    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;
    
    // Si c'est l'utilisateur lui-même, vérifier le mot de passe actuel
    if (req.user.id === parseInt(id)) {
      await User.changePassword(id, currentPassword, newPassword);
    } else if (req.user.role === 'admin') {
      // Si c'est un admin qui change le mot de passe d'un autre utilisateur
      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({ error: 'Utilisateur non trouvé' });
      }
      
      // Forcer le changement de mot de passe (sans vérifier l'ancien)
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      const { query } = require('../config/database');
      await query('UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [hashedPassword, id]);
    } else {
      return res.status(403).json({ error: 'Accès refusé' });
    }
    
    res.json({ message: 'Mot de passe modifié avec succès' });
  } catch (error) {
    console.error('Erreur lors du changement de mot de passe:', error);
    
    if (error.message.includes('incorrect')) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// GET /api/users/parents/list - Obtenir la liste des parents (pour association d'enfants)
router.get('/parents/list', authenticateToken, requireStaff, async (req, res) => {
  try {
    const result = await User.findAll(1, 1000, 'parent'); // Récupérer tous les parents
    
    const parentsList = result.users.map(user => ({
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      fullName: user.fullName
    }));
    
    res.json(parentsList);
  } catch (error) {
    console.error('Erreur lors de la récupération des parents:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

module.exports = router;
