/**
 * ROUTES ANNONCES
 * Actualités/événements pour les parents
 */

const express = require('express');
const router = express.Router();
const announcementService = require('../services/announcementService');
const auth = require('../middleware/auth');
const permissionsService = require('../services/permissionsService');

/**
 * Middleware d'accès aux annonces :
 * - admin / developer : accès total
 * - parent : accès aux annonces de ses enfants
 * - staff : accès conditionné à la permission 'announcements.view'
 */
async function requireAnnouncementAccess(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ success: false, error: 'Non authentifié' });
  }
  const role = req.user.role === 'developer' ? 'admin' : req.user.role;
  if (role === 'admin' || role === 'parent') {
    return next();
  }
  if (role === 'staff') {
    const userId = req.user.id || req.user.userId;
    const hasAccess = await permissionsService.userHasPermission(userId, 'announcements.view');
    if (hasAccess) return next();
    return res.status(403).json({
      success: false,
      code: 'PERMISSION_DENIED',
      error: 'Accès non autorisé aux annonces (permission requise: announcements.view)'
    });
  }
  return res.status(403).json({ success: false, error: 'Accès non autorisé' });
}

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
 * GET /api/announcements - Récupérer les annonces (admin, staff avec permission, parent)
 */
router.get('/', auth.authenticateToken, requireAnnouncementAccess, async (req, res) => {
  try {
    const userRole = req.user.role === 'developer' ? 'admin' : req.user.role;
    const userId = req.user.id || req.user.userId;

    if (userRole === 'parent') {
      const result = await announcementService.getParentAnnouncements(userId);
      return res.json(result);
    }

    const { is_published, event_type } = req.query;
    const result = await announcementService.getAnnouncements({ 
      is_published: userRole === 'admin' ? (is_published !== undefined ? is_published === 'true' : undefined) : true, 
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
 * GET /api/announcements/my - Récupérer mes annonces (parent/staff avec permission)
 */
router.get('/my', auth.authenticateToken, requireAnnouncementAccess, async (req, res) => {
  try {
    const userRole = req.user.role;
    
    // Parents voient leurs annonces filtrées
    if (userRole === 'parent') {
      const result = await announcementService.getParentAnnouncements(req.user.userId);
      return res.json(result);
    }
    
    // Staff/Admin voient toutes les annonces publiées du mois courant
    const result = await announcementService.getAnnouncements({ 
      is_published: true,
      current_month_only: true 
    });
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
