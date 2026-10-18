const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const aiAssistantService = require('../services/aiAssistantService');

// Rate limiter spécifique pour l'IA (20 requêtes / minute par IP)
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: {
    success: false,
    fallback: true,
    message: 'Trop de requêtes IA, veuillez patienter un instant.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Middleware d'extraction optionnelle de l'utilisateur connecté
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
      req.user = decoded;
    } catch {
      // Token invalide ou expiré : on continue en anonyme
      req.user = null;
    }
  }
  next();
};

/**
 * @route   GET /api/ai/status
 * @desc    Vérifie si l'assistant IA est configuré et prêt
 * @access  Public
 */
router.get('/status', (req, res) => {
  res.json({
    success: true,
    available: aiAssistantService.isConfigured(),
    models: aiAssistantService.models
  });
});

/**
 * @route   POST /api/ai/chat
 * @desc    Pose une question à l'assistant IA
 * @access  Public (authentifié ou visiteur avec rate limit)
 */
router.post('/chat', aiLimiter, optionalAuth, async (req, res) => {
  try {
    const { message, pathname, language } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Le message est requis.'
      });
    }

    // Le rôle vérifié du token prime sur celui envoyé par le client
    const role = req.user?.role || req.body.role || 'visitor';
    const cleanLanguage = language === 'ar' ? 'ar' : 'fr';
    const cleanPath = typeof pathname === 'string' ? pathname.slice(0, 100) : '/';

    const aiResult = await aiAssistantService.chat({
      message: message.trim().slice(0, 500),
      role,
      pathname: cleanPath,
      language: cleanLanguage
    });

    if (aiResult) {
      return res.json({
        success: true,
        ...aiResult
      });
    }

    // Si Gemini n'est pas configuré ou est temporairement indisponible
    return res.json({
      success: false,
      fallback: true,
      message: 'IA non disponible, basculement vers le moteur local.'
    });
  } catch (error) {
    console.error('Erreur route /api/ai/chat:', error.message);
    return res.status(500).json({
      success: false,
      fallback: true,
      error: 'Erreur interne du serveur lors du traitement IA.'
    });
  }
});

module.exports = router;
