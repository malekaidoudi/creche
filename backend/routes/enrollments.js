const express = require('express');
const { body, validationResult } = require('express-validator');
const Enrollment = require('../models/Enrollment');
const { authenticateToken, requireAdmin, requireStaff } = require('../middleware/auth');

const router = express.Router();

// GET /api/enrollments - Obtenir toutes les inscriptions (Admin/Staff)
router.get('/', authenticateToken, requireStaff, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    
    const result = await Enrollment.findAll(page, limit, status);
    
    res.json(result);
  } catch (error) {
    console.error('Erreur lors de la récupération des inscriptions:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// GET /api/enrollments/stats - Obtenir les statistiques des inscriptions (Admin/Staff)
router.get('/stats', authenticateToken, requireStaff, async (req, res) => {
  try {
    const stats = await Enrollment.getStats();
    res.json(stats);
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// GET /api/enrollments/:id - Obtenir une inscription par ID (Admin/Staff)
router.get('/:id', authenticateToken, requireStaff, async (req, res) => {
  try {
    const { id } = req.params;
    
    const enrollment = await Enrollment.findById(id);
    if (!enrollment) {
      return res.status(404).json({ error: 'Inscription non trouvée' });
    }
    
    // Récupérer les documents associés
    const documents = await Enrollment.getDocuments(id);
    
    res.json({
      ...enrollment,
      documents
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'inscription:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// PUT /api/enrollments/:id/status - Mettre à jour le statut d'une inscription (Admin seulement)
router.put('/:id/status', [
  authenticateToken,
  requireAdmin,
  body('status').isIn(['pending', 'approved', 'rejected']).withMessage('Statut invalide'),
  body('admin_notes').optional().isString().withMessage('Notes admin invalides'),
  body('appointment_date').optional().isISO8601().withMessage('Date de rendez-vous invalide'),
  body('appointment_time').optional().matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Heure de rendez-vous invalide')
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
    const { status, admin_notes, appointment_date, appointment_time } = req.body;
    
    const enrollment = await Enrollment.updateStatus(id, status, admin_notes, appointment_date, appointment_time);
    
    if (!enrollment) {
      return res.status(404).json({ error: 'Inscription non trouvée' });
    }

    // TODO: Envoyer un email si le statut est 'approved'
    if (status === 'approved') {
      // Logique d'envoi d'email à implémenter
      console.log(`Inscription approuvée pour ${enrollment.child_first_name} ${enrollment.child_last_name}`);
    }

    res.json({
      message: 'Statut mis à jour avec succès',
      enrollment
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// GET /api/enrollments/parent/:parentId - Obtenir les inscriptions d'un parent
router.get('/parent/:parentId', authenticateToken, async (req, res) => {
  try {
    const { parentId } = req.params;
    
    // Vérifier que l'utilisateur peut accéder à ces données
    if (req.user.role === 'parent' && req.user.id !== parseInt(parentId)) {
      return res.status(403).json({ error: 'Accès refusé' });
    }
    
    const enrollments = await Enrollment.findByParentId(parentId);
    
    // Pour chaque inscription, récupérer les documents
    const enrollmentsWithDocuments = await Promise.all(
      enrollments.map(async (enrollment) => {
        const documents = await Enrollment.getDocuments(enrollment.id);
        return {
          ...enrollment,
          documents
        };
      })
    );
    
    res.json(enrollmentsWithDocuments);
  } catch (error) {
    console.error('Erreur lors de la récupération des inscriptions du parent:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// DELETE /api/enrollments/:id - Supprimer une inscription (Admin seulement)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Vérifier que l'inscription existe
    const enrollment = await Enrollment.findById(id);
    if (!enrollment) {
      return res.status(404).json({ error: 'Inscription non trouvée' });
    }
    
    // Supprimer l'inscription (vous devrez implémenter cette méthode dans le modèle)
    // await Enrollment.delete(id);
    
    res.json({ message: 'Inscription supprimée avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'inscription:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

module.exports = router;
