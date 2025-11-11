/**
 * ROUTES MÉMOS PERSONNELS
 * Mémos personnels pour chaque utilisateur
 */

const express = require('express');
const router = express.Router();
const personalMemoService = require('../services/personalMemoService');
const auth = require('../middleware/auth');

/**
 * POST /api/personal-memos - Créer un mémo
 */
router.post('/', auth.authenticateToken, async (req, res) => {
  try {
    const result = await personalMemoService.createMemo(req.body, req.user.userId);
    
    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
    
  } catch (error) {
    console.error('❌ Erreur POST /api/personal-memos:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur lors de la création du mémo' 
    });
  }
});

/**
 * GET /api/personal-memos - Récupérer mes mémos
 */
router.get('/', auth.authenticateToken, async (req, res) => {
  try {
    const { date, is_completed } = req.query;
    const result = await personalMemoService.getUserMemos(req.user.userId, { 
      date, 
      is_completed: is_completed === 'true' 
    });
    
    res.json(result);
    
  } catch (error) {
    console.error('❌ Erreur GET /api/personal-memos:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur lors de la récupération des mémos' 
    });
  }
});

/**
 * GET /api/personal-memos/today - Mémos d'aujourd'hui
 */
router.get('/today', auth.authenticateToken, async (req, res) => {
  try {
    const result = await personalMemoService.getTodayMemos(req.user.userId);
    
    res.json(result);
    
  } catch (error) {
    console.error('❌ Erreur GET /api/personal-memos/today:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur lors de la récupération des mémos' 
    });
  }
});

/**
 * PATCH /api/personal-memos/:id/complete - Marquer comme complété
 */
router.patch('/:id/complete', auth.authenticateToken, async (req, res) => {
  try {
    const result = await personalMemoService.completeMemo(
      parseInt(req.params.id),
      req.user.userId
    );
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(404).json(result);
    }
    
  } catch (error) {
    console.error('❌ Erreur PATCH /api/personal-memos/:id/complete:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur lors de la complétion' 
    });
  }
});

/**
 * DELETE /api/personal-memos/:id - Supprimer un mémo
 */
router.delete('/:id', auth.authenticateToken, async (req, res) => {
  try {
    const result = await personalMemoService.deleteMemo(
      parseInt(req.params.id),
      req.user.userId
    );
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(404).json(result);
    }
    
  } catch (error) {
    console.error('❌ Erreur DELETE /api/personal-memos/:id:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur lors de la suppression' 
    });
  }
});

module.exports = router;
