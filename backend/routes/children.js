const express = require('express');
const { body, validationResult } = require('express-validator');
const Child = require('../models/Child');
const { authenticateToken, requireAdmin, requireStaff, requireChildAccess } = require('../middleware/auth');

const router = express.Router();

// GET /api/children - Obtenir tous les enfants (Admin/Staff)
router.get('/', authenticateToken, requireStaff, async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    
    const result = await Child.findAll(page, limit, search);
    
    res.json(result);
  } catch (error) {
    console.error('Erreur lors de la récupération des enfants:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// GET /api/children/stats - Obtenir les statistiques des enfants (Admin/Staff)
router.get('/stats', authenticateToken, requireStaff, async (req, res) => {
  try {
    const stats = await Child.getStats();
    res.json(stats);
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// GET /api/children/:id - Obtenir un enfant par ID
router.get('/:id', authenticateToken, requireChildAccess, async (req, res) => {
  try {
    const { id } = req.params;
    
    const child = await Child.findById(id);
    if (!child) {
      return res.status(404).json({ error: 'Enfant non trouvé' });
    }
    
    res.json(child);
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'enfant:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// POST /api/children - Créer un nouvel enfant (Admin seulement)
router.post('/', [
  authenticateToken,
  requireAdmin,
  body('first_name').isLength({ min: 1 }).withMessage('Prénom requis'),
  body('last_name').isLength({ min: 1 }).withMessage('Nom requis'),
  body('birth_date').isISO8601().withMessage('Date de naissance invalide'),
  body('gender').isIn(['M', 'F']).withMessage('Sexe invalide (M ou F)'),
  body('medical_info').optional().isString().withMessage('Informations médicales invalides'),
  body('emergency_contact_name').optional().isString().withMessage('Nom du contact d\'urgence invalide'),
  body('emergency_contact_phone').optional().isString().withMessage('Téléphone du contact d\'urgence invalide'),
  body('photo_url').optional().isURL().withMessage('URL de photo invalide')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Données invalides', 
        details: errors.array() 
      });
    }

    const childData = req.body;
    const child = await Child.create(childData);
    
    res.status(201).json({
      message: 'Enfant créé avec succès',
      child
    });
  } catch (error) {
    console.error('Erreur lors de la création de l\'enfant:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// PUT /api/children/:id - Mettre à jour un enfant (Admin seulement)
router.put('/:id', [
  authenticateToken,
  requireAdmin,
  body('first_name').optional().isLength({ min: 1 }).withMessage('Prénom requis'),
  body('last_name').optional().isLength({ min: 1 }).withMessage('Nom requis'),
  body('birth_date').optional().isISO8601().withMessage('Date de naissance invalide'),
  body('gender').optional().isIn(['M', 'F']).withMessage('Sexe invalide (M ou F)'),
  body('medical_info').optional().isString().withMessage('Informations médicales invalides'),
  body('emergency_contact_name').optional().isString().withMessage('Nom du contact d\'urgence invalide'),
  body('emergency_contact_phone').optional().isString().withMessage('Téléphone du contact d\'urgence invalide'),
  body('photo_url').optional().isURL().withMessage('URL de photo invalide'),
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
    
    const child = await Child.update(id, updateData);
    
    if (!child) {
      return res.status(404).json({ error: 'Enfant non trouvé' });
    }
    
    res.json({
      message: 'Enfant mis à jour avec succès',
      child
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'enfant:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// DELETE /api/children/:id - Supprimer un enfant (soft delete) (Admin seulement)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const success = await Child.delete(id);
    
    if (!success) {
      return res.status(404).json({ error: 'Enfant non trouvé' });
    }
    
    res.json({ message: 'Enfant supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'enfant:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// GET /api/children/parent/:parentId - Obtenir les enfants d'un parent
router.get('/parent/:parentId', authenticateToken, async (req, res) => {
  try {
    const { parentId } = req.params;
    
    // Vérifier que l'utilisateur peut accéder à ces données
    if (req.user.role === 'parent' && req.user.id !== parseInt(parentId)) {
      return res.status(403).json({ error: 'Accès refusé' });
    }
    
    const children = await Child.findByParentId(parentId);
    
    res.json(children);
  } catch (error) {
    console.error('Erreur lors de la récupération des enfants du parent:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// POST /api/children/:id/photo - Uploader une photo pour un enfant (Admin seulement)
router.post('/:id/photo', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { photo_url } = req.body;
    
    if (!photo_url) {
      return res.status(400).json({ error: 'URL de photo requise' });
    }
    
    const child = await Child.update(id, { photo_url });
    
    if (!child) {
      return res.status(404).json({ error: 'Enfant non trouvé' });
    }
    
    res.json({
      message: 'Photo mise à jour avec succès',
      child
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la photo:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

module.exports = router;
