/**
 * ROUTES QUESTIONNAIRE DE PERMISSIONS
 * Formulaire simple (sans jargon technique) destiné à la direction pour
 * définir quels accès seront accordés aux éducatrices.
 */

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const logger = require('../utils/logger');
const service = require('../services/permissionsQuestionnaireService');

/**
 * GET /api/permissions-questionnaire - Récupérer la dernière réponse enregistrée
 */
router.get('/', auth.authenticateToken, auth.requireRole('admin', 'developer'), async (req, res) => {
  try {
    const response = await service.getLatestResponse();

    res.json({
      success: true,
      response
    });
  } catch (error) {
    logger.error('❌ Erreur GET /api/permissions-questionnaire:', error.message);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération du questionnaire'
    });
  }
});

/**
 * POST /api/permissions-questionnaire - Enregistrer les réponses
 */
router.post('/', auth.authenticateToken, auth.requireRole('admin', 'developer'), async (req, res) => {
  try {
    const { answers, comment } = req.body;

    if (!answers || typeof answers !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Réponses manquantes ou invalides'
      });
    }

    const submittedBy = req.user.id || req.user.userId;
    const saved = await service.saveResponse({ answers, comment, submittedBy });

    res.status(201).json({
      success: true,
      message: 'Merci, vos réponses ont été enregistrées avec succès.',
      response: saved
    });
  } catch (error) {
    logger.error('❌ Erreur POST /api/permissions-questionnaire:', error.message);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'enregistrement du questionnaire'
    });
  }
});

module.exports = router;
