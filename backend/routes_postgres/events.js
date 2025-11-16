/**
 * Routes pour la gestion des événements
 */

const express = require('express');
const router = express.Router();
const eventService = require('../services/eventService');
const { authenticateToken } = require('../middleware/auth');

// =====================================================
// Routes CRUD de base
// =====================================================

/**
 * GET /api/events
 * Récupérer tous les événements avec filtres
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const filters = {
      type: req.query.type,
      status: req.query.status,
      priority: req.query.priority,
      assigned_to: req.query.assigned_to,
      child_id: req.query.child_id,
      start_date: req.query.start_date,
      end_date: req.query.end_date,
      limit: req.query.limit ? parseInt(req.query.limit) : 50,
      offset: req.query.offset ? parseInt(req.query.offset) : 0,
      // 🆕 Toujours passer l'ID utilisateur pour filtrer les mémos automatiquement
      user_id: req.user.id,
      created_by: req.query.created_by
    };

    const result = await eventService.getEvents(filters);
    res.json(result);

  } catch (error) {
    console.error('❌ Erreur GET /api/events:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des événements'
    });
  }
});

/**
 * GET /api/events/:id
 * Récupérer un événement par ID
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await eventService.getEventById(req.params.id);

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json(result);

  } catch (error) {
    console.error('❌ Erreur GET /api/events/:id:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération de l\'événement'
    });
  }
});

/**
 * POST /api/events
 * Créer un nouvel événement
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const eventData = req.body;

    // Validation basique
    if (!eventData.title || !eventData.type || !eventData.start_date) {
      return res.status(400).json({
        success: false,
        error: 'Champs requis manquants: title, type, start_date'
      });
    }

    const result = await eventService.createEvent(eventData, req.user.id);
    res.status(201).json(result);

  } catch (error) {
    console.error('❌ Erreur POST /api/events:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la création de l\'événement'
    });
  }
});

/**
 * PUT /api/events/:id
 * Mettre à jour un événement
 */
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const updates = req.body;
    const result = await eventService.updateEvent(req.params.id, updates, req.user.id);
    res.json(result);

  } catch (error) {
    console.error('❌ Erreur PUT /api/events/:id:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la mise à jour de l\'événement'
    });
  }
});

/**
 * PATCH /api/events/:id/status
 * Changer le statut d'un événement
 */
router.patch('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Statut requis'
      });
    }

    const result = await eventService.updateEventStatus(req.params.id, status, req.user.id);
    res.json(result);

  } catch (error) {
    console.error('❌ Erreur PATCH /api/events/:id/status:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la mise à jour du statut'
    });
  }
});

/**
 * DELETE /api/events/:id
 * Supprimer un événement (soft delete)
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await eventService.deleteEvent(req.params.id, req.user.id);
    res.json(result);

  } catch (error) {
    console.error('❌ Erreur DELETE /api/events/:id:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la suppression de l\'événement'
    });
  }
});

// =====================================================
// Routes spécifiques
// =====================================================

/**
 * GET /api/events/upcoming
 * Récupérer les événements à venir
 */
router.get('/views/upcoming', authenticateToken, async (req, res) => {
  try {
    const days = req.query.days ? parseInt(req.query.days) : 7;
    const result = await eventService.getUpcomingEvents(req.user.id, days);
    res.json(result);

  } catch (error) {
    console.error('❌ Erreur GET /api/events/upcoming:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des événements à venir'
    });
  }
});

/**
 * GET /api/events/overdue
 * Récupérer les événements en retard
 */
router.get('/views/overdue', authenticateToken, async (req, res) => {
  try {
    const result = await eventService.getOverdueEvents(req.user.id);
    res.json(result);

  } catch (error) {
    console.error('❌ Erreur GET /api/events/overdue:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des événements en retard'
    });
  }
});

/**
 * GET /api/events/calendar
 * Récupérer les événements pour le calendrier
 */
router.get('/views/calendar', authenticateToken, async (req, res) => {
  try {
    const { start, end, type } = req.query;

    if (!start || !end) {
      return res.status(400).json({
        success: false,
        error: 'Paramètres start et end requis'
      });
    }

    // Convertir le paramètre type en tableau si présent
    const types = type ? type.split(',') : null;

    // Passer le rôle de l'utilisateur pour les permissions
    const result = await eventService.getCalendarEvents(start, end, req.user.id, types, req.user.role);
    res.json(result);

  } catch (error) {
    console.error(' Erreur GET /api/events/calendar:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des événements du calendrier'
    });
  }
});

/**
 * GET /api/events/tasks/kanban
 * Récupérer les tâches pour la vue Kanban
 */
router.get('/tasks/kanban', authenticateToken, async (req, res) => {
  try {
    const result = await eventService.getTasksKanban(req.user.id);
    res.json(result);

  } catch (error) {
    console.error('❌ Erreur GET /api/events/tasks/kanban:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des tâches'
    });
  }
});

// =====================================================
// Commentaires
// =====================================================

/**
 * POST /api/events/:id/comments
 * Ajouter un commentaire à un événement
 */
router.post('/:id/comments', authenticateToken, async (req, res) => {
  try {
    const { comment } = req.body;

    if (!comment) {
      return res.status(400).json({
        success: false,
        error: 'Commentaire requis'
      });
    }

    const result = await eventService.addComment(req.params.id, req.user.id, comment);
    res.status(201).json(result);

  } catch (error) {
    console.error('❌ Erreur POST /api/events/:id/comments:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'ajout du commentaire'
    });
  }
});

module.exports = router;
