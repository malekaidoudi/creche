const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');

const router = express.Router();

// Configuration JWT
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// POST /api/auth/login
router.post('/login', [
  body('email').isEmail().withMessage('Email invalide'),
  body('password').isLength({ min: 1 }).withMessage('Mot de passe requis')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Données invalides', 
        details: errors.array() 
      });
    }

    const { email, password } = req.body;

    // Trouver l'utilisateur
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    // Vérifier le mot de passe
    const isValidPassword = await user.verifyPassword(password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    // Créer le token JWT
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Retourner les données de l'utilisateur (sans mot de passe) et le token
    res.json({
      message: 'Connexion réussie',
      token,
      user: user.toJSON()
    });

  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// POST /api/auth/register (pour les parents uniquement)
router.post('/register', [
  body('email').isEmail().withMessage('Email invalide'),
  body('password').isLength({ min: 6 }).withMessage('Mot de passe trop court (minimum 6 caractères)'),
  body('first_name').isLength({ min: 1 }).withMessage('Prénom requis'),
  body('last_name').isLength({ min: 1 }).withMessage('Nom requis'),
  body('phone').optional().isMobilePhone('any').withMessage('Numéro de téléphone invalide')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Données invalides', 
        details: errors.array() 
      });
    }

    const { email, password, first_name, last_name, phone } = req.body;

    // Créer l'utilisateur (rôle parent par défaut)
    const user = await User.create({
      email,
      password,
      first_name,
      last_name,
      phone,
      role: 'parent'
    });

    // Créer le token JWT
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(201).json({
      message: 'Compte créé avec succès',
      token,
      user: user.toJSON()
    });

  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error);
    
    if (error.message.includes('email existe déjà')) {
      return res.status(409).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Erreur lors de la création du compte' });
  }
});

// GET /api/auth/me (vérifier le token et retourner les infos utilisateur)
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Token manquant' });
    }

    // Vérifier le token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Récupérer l'utilisateur
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: 'Utilisateur non trouvé' });
    }

    res.json({ user: user.toJSON() });

  } catch (error) {
    console.error('Erreur lors de la vérification du token:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Token invalide' });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expiré' });
    }
    
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// POST /api/auth/change-password
router.post('/change-password', [
  body('currentPassword').isLength({ min: 1 }).withMessage('Mot de passe actuel requis'),
  body('newPassword').isLength({ min: 6 }).withMessage('Nouveau mot de passe trop court (minimum 6 caractères)')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Données invalides', 
        details: errors.array() 
      });
    }

    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Token manquant' });
    }

    // Vérifier le token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    const { currentPassword, newPassword } = req.body;

    // Changer le mot de passe
    await User.changePassword(decoded.userId, currentPassword, newPassword);

    res.json({ message: 'Mot de passe modifié avec succès' });

  } catch (error) {
    console.error('Erreur lors du changement de mot de passe:', error);
    
    if (error.message.includes('incorrect')) {
      return res.status(400).json({ error: error.message });
    }
    
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token invalide ou expiré' });
    }
    
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

module.exports = router;
