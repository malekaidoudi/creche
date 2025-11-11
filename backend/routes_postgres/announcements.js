/**
 * ROUTES ANNONCES
 * Actualités/événements pour les parents
 */

const express = require('express');
const router = express.Router();
const announcementService = require('../services/announcementService');
const auth = require('../middleware/auth');

/**
 * POST /api/announcements - Créer une annonce (admin uniquement)
 */
router.post('/', auth.authenticateToken, auth.requireRole('admin'), async (req, res) => {
  try {
    const result = await announcementService.createAnnouncement(req.body, req.user.userId);
    
    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
    
  } catch (error) {
    console.error('❌ Erreur POST /api/announcements:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur lors de la création de l\'annonce' 
    });
  }
});

/**
 * GET /api/announcements - Récupérer toutes les annonces (admin)
 */
router.get('/', auth.authenticateToken, auth.requireRole('admin'), async (req, res) => {
  try {
    const { is_published, event_type } = req.query;
    const result = await announcementService.getAnnouncements({ 
      is_published: is_published === 'true', 
      event_type 
    });
    
    res.json(result);
    
  } catch (error) {
    console.error('❌ Erreur GET /api/announcements:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur lors de la récupération des annonces' 
    });
  }
});

/**
 * GET /api/announcements/my - Récupérer mes annonces (parent)
 */
router.get('/my', auth.authenticateToken, auth.requireRole('parent'), async (req, res) => {
  try {
    const result = await announcementService.getParentAnnouncements(req.user.userId);
    
    res.json(result);
    
  } catch (error) {
    console.error('❌ Erreur GET /api/announcements/my:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur lors de la récupération des annonces' 
    });
  }
});

/**
 * PATCH /api/announcements/:id/publish - Publier une annonce (admin)
 */
router.patch('/:id/publish', auth.authenticateToken, auth.requireRole('admin'), async (req, res) => {
  try {
    const result = await announcementService.publishAnnouncement(parseInt(req.params.id));
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(404).json(result);
    }
    
  } catch (error) {
    console.error('❌ Erreur PATCH /api/announcements/:id/publish:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur lors de la publication' 
    });
  }
});

/**
 * DELETE /api/announcements/:id - Supprimer une annonce (admin)
 */
router.delete('/:id', auth.authenticateToken, auth.requireRole('admin'), async (req, res) => {
  try {
    const result = await announcementService.deleteAnnouncement(parseInt(req.params.id));
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(404).json(result);
    }
    
  } catch (error) {
    console.error('❌ Erreur DELETE /api/announcements/:id:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur lors de la suppression' 
    });
  }
});

module.exports = router;
