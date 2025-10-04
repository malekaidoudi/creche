const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Child = require('../models/Child');
const { authenticateToken, requireStaff, requireChildAccess } = require('../middleware/auth');

const router = express.Router();

// GET /api/children - Obtenir tous les enfants
router.get('/', [
  authenticateToken,
  query('page').optional().isInt({ min: 1 }).withMessage('Page doit être un entier positif'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit doit être entre 1 et 100'),
  query('search').optional().isLength({ min: 2 }).withMessage('Recherche doit contenir au moins 2 caractères')
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
    
    const search = req.query.search;

    let result;

    // Si l'utilisateur est un parent, ne montrer que ses enfants
    if (req.user.role === 'parent') {
      result = await Child.findByParent(req.user.id, page, limit);
    } else {
      // Admin et staff peuvent voir tous les enfants
      result = await Child.findAll(page, limit, search);
    }

    res.json({
      message: 'Enfants récupérés avec succès',
      ...result
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des enfants:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération des enfants'
    });
  }
});

// GET /api/children/:id - Obtenir un enfant par ID
router.get('/:id', [
  authenticateToken,
  requireChildAccess
], async (req, res) => {
  try {
    const childId = parseInt(req.params.id);
    
    if (isNaN(childId)) {
      return res.status(400).json({
        error: 'ID enfant invalide'
      });
    }

    const child = await Child.findById(childId);
    
    if (!child) {
      return res.status(404).json({
        error: 'Enfant non trouvé'
      });
    }

    res.json({
      message: 'Enfant récupéré avec succès',
      child
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'enfant:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération de l\'enfant'
    });
  }
});

// POST /api/children - Créer un nouvel enfant (staff seulement)
router.post('/', [
  authenticateToken,
  requireStaff,
  body('first_name')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Le prénom doit contenir au moins 2 caractères'),
  body('last_name')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Le nom doit contenir au moins 2 caractères'),
  body('birth_date')
    .isISO8601()
    .withMessage('Date de naissance invalide (format YYYY-MM-DD)'),
  body('gender')
    .isIn(['M', 'F'])
    .withMessage('Genre invalide (M ou F)'),
  body('medical_info')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Informations médicales trop longues'),
  body('emergency_contact_name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Nom du contact d\'urgence invalide'),
  body('emergency_contact_phone')
    .optional()
    .isMobilePhone('any')
    .withMessage('Téléphone du contact d\'urgence invalide'),
  body('photo_url')
    .optional()
    .isURL()
    .withMessage('URL de photo invalide')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Données invalides',
        details: errors.array()
      });
    }

    const {
      first_name,
      last_name,
      birth_date,
      gender,
      medical_info,
      emergency_contact_name,
      emergency_contact_phone,
      photo_url
    } = req.body;

    const child = await Child.create({
      first_name,
      last_name,
      birth_date,
      gender,
      medical_info,
      emergency_contact_name,
      emergency_contact_phone,
      photo_url
    });

    res.status(201).json({
      message: 'Enfant créé avec succès',
      child
    });
  } catch (error) {
    console.error('Erreur lors de la création de l\'enfant:', error);
    res.status(500).json({
      error: 'Erreur lors de la création de l\'enfant'
    });
  }
});

// PUT /api/children/:id - Mettre à jour un enfant
router.put('/:id', [
  authenticateToken,
  requireStaff,
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
  body('birth_date')
    .optional()
    .isISO8601()
    .withMessage('Date de naissance invalide (format YYYY-MM-DD)'),
  body('gender')
    .optional()
    .isIn(['M', 'F'])
    .withMessage('Genre invalide (M ou F)'),
  body('medical_info')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Informations médicales trop longues'),
  body('emergency_contact_name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Nom du contact d\'urgence invalide'),
  body('emergency_contact_phone')
    .optional()
    .isMobilePhone('any')
    .withMessage('Téléphone du contact d\'urgence invalide'),
  body('photo_url')
    .optional()
    .isURL()
    .withMessage('URL de photo invalide'),
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

    const childId = parseInt(req.params.id);
    
    if (isNaN(childId)) {
      return res.status(400).json({
        error: 'ID enfant invalide'
      });
    }

    const {
      first_name,
      last_name,
      birth_date,
      gender,
      medical_info,
      emergency_contact_name,
      emergency_contact_phone,
      photo_url,
      is_active
    } = req.body;

    const updatedChild = await Child.update(childId, {
      first_name,
      last_name,
      birth_date,
      gender,
      medical_info,
      emergency_contact_name,
      emergency_contact_phone,
      photo_url,
      is_active
    });

    if (!updatedChild) {
      return res.status(404).json({
        error: 'Enfant non trouvé'
      });
    }

    res.json({
      message: 'Enfant mis à jour avec succès',
      child: updatedChild
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'enfant:', error);
    res.status(500).json({
      error: 'Erreur lors de la mise à jour de l\'enfant'
    });
  }
});

// DELETE /api/children/:id - Supprimer un enfant (staff seulement)
router.delete('/:id', [
  authenticateToken,
  requireStaff
], async (req, res) => {
  try {
    const childId = parseInt(req.params.id);
    
    if (isNaN(childId)) {
      return res.status(400).json({
        error: 'ID enfant invalide'
      });
    }

    const deleted = await Child.delete(childId);

    if (!deleted) {
      return res.status(404).json({
        error: 'Enfant non trouvé'
      });
    }

    res.json({
      message: 'Enfant supprimé avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'enfant:', error);
    res.status(500).json({
      error: 'Erreur lors de la suppression de l\'enfant'
    });
  }
});

// GET /api/children/:id/attendance - Obtenir les présences d'un enfant
router.get('/:id/attendance', [
  authenticateToken,
  requireChildAccess,
  query('start_date').optional().isISO8601().withMessage('Date de début invalide'),
  query('end_date').optional().isISO8601().withMessage('Date de fin invalide')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Paramètres invalides',
        details: errors.array()
      });
    }

    const childId = parseInt(req.params.id);
    
    if (isNaN(childId)) {
      return res.status(400).json({
        error: 'ID enfant invalide'
      });
    }

    const child = await Child.findById(childId);
    
    if (!child) {
      return res.status(404).json({
        error: 'Enfant non trouvé'
      });
    }

    const startDate = req.query.start_date;
    const endDate = req.query.end_date;

    const attendance = await child.getAttendance(startDate, endDate);

    res.json({
      message: 'Présences récupérées avec succès',
      child: {
        id: child.id,
        fullName: child.fullName
      },
      attendance
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des présences:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération des présences'
    });
  }
});

module.exports = router;
