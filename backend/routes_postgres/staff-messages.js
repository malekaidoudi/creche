/**
 * ROUTES MESSAGES STAFF
 * Messages staff ↔ admin avec réponses
 */

const express = require('express');
const router = express.Router();
const staffMessageService = require('../services/staffMessageService');
const auth = require('../middleware/auth');

/**
 * POST /api/staff-messages - Envoyer un message
 */
router.post('/', auth.authenticateToken, auth.requireRole('staff', 'admin', 'parent'), async (req, res) => {
  try {
    const result = await staffMessageService.sendMessage(req.body, req.user.userId);
    
    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
    
  } catch (error) {
    console.error('❌ Erreur POST /api/staff-messages:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur lors de l\'envoi du message' 
    });
  }
});

/**
 * GET /api/staff-messages - Récupérer mes messages
 */
router.get('/', auth.authenticateToken, auth.requireRole('staff', 'admin', 'parent'), async (req, res) => {
  try {
    const result = await staffMessageService.getUserMessages(req.user.userId);
    
    res.json(result);
    
  } catch (error) {
    console.error('❌ Erreur GET /api/staff-messages:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur lors de la récupération des messages' 
    });
  }
});

/**
 * GET /api/staff-messages/:id/conversation - Récupérer une conversation
 */
router.get('/:id/conversation', auth.authenticateToken, auth.requireRole('staff', 'admin', 'parent'), async (req, res) => {
  try {
    const result = await staffMessageService.getConversation(
      parseInt(req.params.id),
      req.user.userId
    );
    
    res.json(result);
    
  } catch (error) {
    console.error('❌ Erreur GET /api/staff-messages/:id/conversation:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur lors de la récupération de la conversation' 
    });
  }
});

/**
 * PATCH /api/staff-messages/:id/read - Marquer comme lu
 */
router.patch('/:id/read', auth.authenticateToken, auth.requireRole('staff', 'admin', 'parent'), async (req, res) => {
  try {
    const result = await staffMessageService.markAsRead(
      parseInt(req.params.id),
      req.user.userId
    );
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(404).json(result);
    }
    
  } catch (error) {
    console.error('❌ Erreur PATCH /api/staff-messages/:id/read:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur lors du marquage' 
    });
  }
});

module.exports = router;
