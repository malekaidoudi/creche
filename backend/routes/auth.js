const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const User = require('../models/User');

const router = express.Router();

// Configuration JWT
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Configuration Multer pour l'upload de photos de profil
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/profiles/')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, 'profile_image-' + uniqueSuffix + path.extname(file.originalname))
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max
  },
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Seules les images sont autorisées'), false);
    }
  }
});

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

// POST /api/auth/register-parent-existing-child
router.post('/register-parent-existing-child', [
  body('email').isEmail().withMessage('Email invalide'),
  body('password').isLength({ min: 6 }).withMessage('Mot de passe trop court (minimum 6 caractères)'),
  body('first_name').isLength({ min: 1 }).withMessage('Prénom requis'),
  body('last_name').isLength({ min: 1 }).withMessage('Nom requis'),
  body('phone').optional().isMobilePhone('any').withMessage('Numéro de téléphone invalide'),
  body('child_id').isInt().withMessage('ID enfant requis')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Données invalides', 
        details: errors.array() 
      });
    }

    const { email, password, first_name, last_name, phone, child_id } = req.body;

    // Vérifier que l'enfant existe et n'a pas de parent
    const db = require('../config/database');
    const [children] = await db.execute('SELECT * FROM children WHERE id = ? AND parent_id IS NULL', [child_id]);
    
    if (children.length === 0) {
      return res.status(400).json({ error: 'Enfant non trouvé ou déjà associé à un parent' });
    }

    // Créer l'utilisateur parent
    const user = await User.create({
      email,
      password,
      first_name,
      last_name,
      phone,
      role: 'parent'
    });

    // Associer l'enfant au parent
    await db.execute('UPDATE children SET parent_id = ? WHERE id = ?', [user.id, child_id]);

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
      message: 'Compte parent créé et enfant associé avec succès',
      token,
      user: user.toJSON()
    });

  } catch (error) {
    console.error('Erreur lors de la création du compte parent:', error);
    
    if (error.message.includes('email existe déjà')) {
      return res.status(409).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Erreur lors de la création du compte' });
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

// PUT /api/auth/profile - Mettre à jour le profil utilisateur
router.put('/profile', upload.single('profile_image'), [
  body('first_name').optional().isLength({ min: 1 }).withMessage('Prénom requis'),
  body('last_name').optional().isLength({ min: 1 }).withMessage('Nom requis'),
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

    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Token manquant' });
    }

    // Vérifier le token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Récupérer l'utilisateur actuel
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: 'Utilisateur non trouvé' });
    }

    // Préparer les données à mettre à jour
    const updateData = {};
    
    if (req.body.first_name) updateData.first_name = req.body.first_name;
    if (req.body.last_name) updateData.last_name = req.body.last_name;
    if (req.body.phone) updateData.phone = req.body.phone;
    
    // Si une image a été uploadée
    if (req.file) {
      updateData.profile_image = `/uploads/profiles/${req.file.filename}`;
    }

    console.log('🔄 Données à mettre à jour:', updateData);
    
    // Mettre à jour l'utilisateur
    const updatedUser = await User.updateProfile(decoded.userId, updateData);
    
    console.log('✅ Utilisateur mis à jour:', updatedUser);

    res.json({
      success: true,
      message: 'Profil mis à jour avec succès',
      user: updatedUser
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour du profil:', error);
    
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token invalide ou expiré' });
    }
    
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

module.exports = router;
