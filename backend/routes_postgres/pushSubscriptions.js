const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const auth = require('../middleware/auth');
const pushNotificationService = require('../services/pushNotificationService');

// GET /api/push/vapid-public-key - Clé publique VAPID nécessaire côté client pour s'abonner
router.get('/vapid-public-key', (req, res) => {
  const publicKey = pushNotificationService.getPublicKey();

  if (!publicKey) {
    return res.status(503).json({
      success: false,
      error: 'Service de notifications push non configuré'
    });
  }

  res.json({ success: true, publicKey });
});

// POST /api/push/subscribe - Enregistrer un abonnement push pour l'utilisateur connecté
router.post('/subscribe', auth.authenticateToken, [
  body('subscription.endpoint').isString().notEmpty().withMessage('endpoint requis'),
  body('subscription.keys.p256dh').isString().notEmpty().withMessage('clé p256dh requise'),
  body('subscription.keys.auth').isString().notEmpty().withMessage('clé auth requise')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Abonnement push invalide',
        details: errors.array()
      });
    }

    const userId = req.user.userId;
    const { subscription } = req.body;
    const userAgent = req.headers['user-agent'] || null;

    const saved = await pushNotificationService.saveSubscription(userId, subscription, userAgent);

    res.status(201).json({
      success: true,
      message: 'Abonnement aux notifications push enregistré',
      subscription: { id: saved.id, endpoint: saved.endpoint }
    });
  } catch (error) {
    console.error('❌ Erreur enregistrement abonnement push:', error.message);
    res.status(500).json({
      success: false,
      error: "Erreur lors de l'enregistrement de l'abonnement push"
    });
  }
});

// DELETE /api/push/unsubscribe - Retirer un abonnement push de l'utilisateur connecté
router.delete('/unsubscribe', auth.authenticateToken, [
  body('endpoint').isString().notEmpty().withMessage('endpoint requis')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Requête invalide',
        details: errors.array()
      });
    }

    const userId = req.user.userId;
    const { endpoint } = req.body;

    await pushNotificationService.removeSubscription(userId, endpoint);

    res.json({ success: true, message: 'Abonnement aux notifications push supprimé' });
  } catch (error) {
    console.error('❌ Erreur suppression abonnement push:', error.message);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la suppression de l'abonnement push"
    });
  }
});

module.exports = router;
