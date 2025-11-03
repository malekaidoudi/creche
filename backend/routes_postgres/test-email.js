const express = require('express');
const router = express.Router();
const emailService = require('../services/emailService');

/**
 * POST /api/test-email
 * Tester l'envoi d'email
 */
router.post('/', async (req, res) => {
  try {
    const { to } = req.body;
    
    if (!to) {
      return res.status(400).json({
        success: false,
        error: 'Email destinataire requis'
      });
    }
    
    console.log('🧪 Test envoi email vers:', to);
    
    // Tester l'envoi
    const result = await emailService.sendEnrollmentConfirmation({
      applicant_email: to,
      applicant_first_name: 'Test',
      child_first_name: 'Enfant Test',
      id: 999
    });
    
    console.log('📧 Résultat envoi:', result);
    
    res.json({
      success: result.success,
      message: result.success ? 'Email envoyé avec succès' : 'Erreur envoi email',
      details: result
    });
    
  } catch (error) {
    console.error('❌ Erreur test email:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
});

module.exports = router;
