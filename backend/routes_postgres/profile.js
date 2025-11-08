const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const db = require('../config/db_postgres');
const auth = require('../middleware/auth');
const cloudinaryService = require('../services/cloudinaryService');

// Configuration Multer pour l'upload d'images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/profiles');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'image-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Seuls les fichiers image sont autorisés'), false);
    }
  }
});

// GET /api/profile - Récupérer le profil de l'utilisateur connecté
router.get('/', auth.authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    
    const result = await db.query(
      `SELECT id, email, first_name, last_name, phone, role, profile_image, 
              is_active, created_at, updated_at
       FROM users WHERE id = $1`,
      [userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Utilisateur non trouvé' 
      });
    }
    
    res.json({
      success: true,
      user: result.rows[0]
    });
    
  } catch (error) {
    console.error('Erreur récupération profil:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur lors de la récupération du profil' 
    });
  }
});

// PUT /api/profile - Mettre à jour le profil de l'utilisateur connecté
router.put('/', [
  auth.authenticateToken,
  body('first_name').optional().trim().notEmpty().withMessage('Prénom requis'),
  body('last_name').optional().trim().notEmpty().withMessage('Nom requis'),
  body('email').optional().trim().isEmail().withMessage('Email invalide'),
  body('phone').optional().trim(),
  body('current_password').optional(),
  body('new_password').optional().isLength({ min: 6 }).withMessage('Le nouveau mot de passe doit contenir au moins 6 caractères')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Erreurs de validation:', errors.array());
      return res.status(400).json({ 
        success: false,
        error: 'Données invalides', 
        details: errors.array() 
      });
    }
    
    console.log('✅ Validation OK, données reçues:', {
      first_name: req.body.first_name,
      last_name: req.body.last_name,
      email: req.body.email,
      phone: req.body.phone,
      has_password_change: !!req.body.new_password
    });
    
    const userId = req.user.userId || req.user.id;
    const { 
      first_name, 
      last_name, 
      email, 
      phone, 
      current_password, 
      new_password,
      confirm_password 
    } = req.body;
    
    // Vérifier si l'utilisateur existe
    const userResult = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Utilisateur non trouvé' 
      });
    }
    
    const user = userResult.rows[0];
    
    // Si changement de mot de passe demandé
    if (new_password) {
      if (!current_password) {
        return res.status(400).json({ 
          success: false,
          error: 'Mot de passe actuel requis' 
        });
      }
      
      if (new_password !== confirm_password) {
        return res.status(400).json({ 
          success: false,
          error: 'Les mots de passe ne correspondent pas' 
        });
      }
      
      // Vérifier le mot de passe actuel
      const isValidPassword = await bcrypt.compare(current_password, user.password);
      if (!isValidPassword) {
        return res.status(400).json({ 
          success: false,
          error: 'Mot de passe actuel incorrect' 
        });
      }
    }
    
    // Vérifier si l'email est déjà utilisé par un autre utilisateur
    if (email && email !== user.email) {
      const emailExists = await db.query('SELECT id FROM users WHERE email = $1 AND id != $2', [email, userId]);
      if (emailExists.rows.length > 0) {
        return res.status(409).json({ 
          success: false,
          error: 'Cet email est déjà utilisé' 
        });
      }
    }
    
    // Construire la requête de mise à jour
    const updates = [];
    const params = [];
    let paramCount = 0;
    
    if (first_name !== undefined) {
      paramCount++;
      updates.push(`first_name = $${paramCount}`);
      params.push(first_name);
    }
    
    if (last_name !== undefined) {
      paramCount++;
      updates.push(`last_name = $${paramCount}`);
      params.push(last_name);
    }
    
    if (email !== undefined) {
      paramCount++;
      updates.push(`email = $${paramCount}`);
      params.push(email);
    }
    
    if (phone !== undefined) {
      paramCount++;
      updates.push(`phone = $${paramCount}`);
      params.push(phone);
    }
    
    if (new_password) {
      const hashedPassword = await bcrypt.hash(new_password, 10);
      paramCount++;
      updates.push(`password = $${paramCount}`);
      params.push(hashedPassword);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ 
        success: false,
        error: 'Aucune donnée à mettre à jour' 
      });
    }
    
    // Ajouter updated_at
    paramCount++;
    updates.push(`updated_at = $${paramCount}`);
    params.push(new Date());
    
    // Ajouter l'ID pour la clause WHERE
    paramCount++;
    params.push(userId);
    
    const sql = `
      UPDATE users 
      SET ${updates.join(', ')} 
      WHERE id = $${paramCount}
      RETURNING id, email, first_name, last_name, phone, role, profile_image, 
                is_active, created_at, updated_at
    `;
    
    const result = await db.query(sql, params);
    
    res.json({
      success: true,
      message: 'Profil mis à jour avec succès',
      user: result.rows[0]
    });
    
  } catch (error) {
    console.error('Erreur mise à jour profil:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur lors de la mise à jour du profil' 
    });
  }
});

// POST /api/profile/upload - Upload d'une photo de profil
router.post('/upload', upload.single('image'), auth.authenticateToken, async (req, res) => {
  try {
    console.log('📸 Upload - req.user:', req.user);
    console.log('📸 Upload - req.file:', req.file ? 'Présent' : 'Absent');
    
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        error: 'Aucun fichier fourni' 
      });
    }
    
    // Le token JWT contient userId (pas id)
    const userId = req.user?.userId || req.user?.id;
    
    if (!userId) {
      console.error('❌ userId est undefined! req.user:', req.user);
      return res.status(401).json({ 
        success: false,
        error: 'Utilisateur non authentifié' 
      });
    }
    
    console.log('✅ userId:', userId);
    
    // Récupérer l'ancienne image pour la supprimer de Cloudinary
    let oldCloudinaryId = null;
    try {
      const userResult = await db.query('SELECT profile_image, cloudinary_public_id FROM users WHERE id = $1', [userId]);
      oldCloudinaryId = userResult.rows[0]?.cloudinary_public_id;
    } catch (err) {
      // Si la colonne cloudinary_public_id n'existe pas, continuer sans erreur
      console.log('⚠️ Colonne cloudinary_public_id non trouvée, migration nécessaire');
    }
    
    // Upload vers Cloudinary
    const cloudinaryResult = await cloudinaryService.uploadFile(
      req.file.path,
      'profiles',
      `profile_${userId}_${Date.now()}`
    );
    
    // Supprimer le fichier temporaire local
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    if (!cloudinaryResult.success) {
      return res.status(500).json({ 
        success: false,
        error: 'Erreur lors de l\'upload sur Cloudinary' 
      });
    }
    
    // Supprimer l'ancienne image de Cloudinary si elle existe
    if (oldCloudinaryId) {
      await cloudinaryService.deleteFile(oldCloudinaryId);
    }
    
    // Mettre à jour l'URL de l'image dans la base de données
    // Essayer d'abord avec cloudinary_public_id, sinon sans
    let result;
    try {
      result = await db.query(
        `UPDATE users 
         SET profile_image = $1, 
             cloudinary_public_id = $2,
             updated_at = CURRENT_TIMESTAMP 
         WHERE id = $3 
         RETURNING id, email, first_name, last_name, phone, role, profile_image, 
                   is_active, created_at, updated_at`,
        [cloudinaryResult.url, cloudinaryResult.publicId, userId]
      );
    } catch (err) {
      // Si la colonne n'existe pas, mettre à jour sans cloudinary_public_id
      console.log('⚠️ Mise à jour sans cloudinary_public_id');
      result = await db.query(
        `UPDATE users 
         SET profile_image = $1,
             updated_at = CURRENT_TIMESTAMP 
         WHERE id = $2 
         RETURNING id, email, first_name, last_name, phone, role, profile_image, 
                   is_active, created_at, updated_at`,
        [cloudinaryResult.url, userId]
      );
    }
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Utilisateur non trouvé' 
      });
    }
    
    res.json({
      success: true,
      message: 'Photo de profil mise à jour avec succès',
      imageUrl: cloudinaryResult.url,
      user: result.rows[0]
    });
    
  } catch (error) {
    console.error('Erreur upload image profil:', error);
    
    // Nettoyer le fichier temporaire en cas d'erreur
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ 
      success: false,
      error: 'Erreur lors de l\'upload de l\'image' 
    });
  }
});

// DELETE /api/profile/image - Supprimer la photo de profil
router.delete('/image', auth.authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    
    // Récupérer l'ID Cloudinary de l'image
    const userResult = await db.query('SELECT cloudinary_public_id FROM users WHERE id = $1', [userId]);
    const cloudinaryId = userResult.rows[0]?.cloudinary_public_id;
    
    // Supprimer de Cloudinary si l'ID existe
    if (cloudinaryId) {
      await cloudinaryService.deleteFile(cloudinaryId);
    }
    
    // Supprimer l'URL de l'image de la base de données
    const result = await db.query(
      `UPDATE users 
       SET profile_image = NULL, 
           cloudinary_public_id = NULL,
           updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1 
       RETURNING id, email, first_name, last_name, phone, role, profile_image, 
                 is_active, created_at, updated_at`,
      [userId]
    );
    
    res.json({
      success: true,
      message: 'Photo de profil supprimée avec succès',
      user: result.rows[0]
    });
    
  } catch (error) {
    console.error('Erreur suppression image profil:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur lors de la suppression de l\'image' 
    });
  }
});

module.exports = router;
