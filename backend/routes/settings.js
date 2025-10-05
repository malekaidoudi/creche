const express = require('express');
const router = express.Router();
const Settings = require('../models/Settings');
const { authenticateToken, requireRole } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Configuration multer pour l'upload d'images
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../frontend/public/images');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    // Si c'est un logo, utiliser un nom fixe pour l'overwrite
    if (req.params && req.params.key === 'nursery_logo') {
      cb(null, 'logo' + path.extname(file.originalname));
    } else {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, 'setting-' + uniqueSuffix + path.extname(file.originalname));
    }
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp|svg/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Seules les images sont autorisées'));
    }
  }
});

// GET /api/settings/public - Récupérer les paramètres publics
router.get('/public', async (req, res) => {
  try {
    const settings = await Settings.getPublic();
    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Error fetching public settings:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des paramètres'
    });
  }
});

// GET /api/settings - Récupérer tous les paramètres (admin seulement)
router.get('/', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const settings = await Settings.getAll();
    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des paramètres'
    });
  }
});

// GET /api/settings/categories - Récupérer les catégories
router.get('/categories', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const categories = await Settings.getCategories();
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des catégories'
    });
  }
});

// GET /api/settings/category/:category - Récupérer par catégorie
router.get('/category/:category', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { category } = req.params;
    const settings = await Settings.getByCategory(category);
    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Error fetching settings by category:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des paramètres'
    });
  }
});

// PUT /api/settings/:key - Mettre à jour un paramètre (temporairement sans auth pour le développement)
router.put('/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const { value, type = 'string' } = req.body;

    if (value === undefined) {
      return res.status(400).json({
        success: false,
        message: 'La valeur est requise'
      });
    }

    const updated = await Settings.updateByKey(key, value, type);
    
    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Paramètre non trouvé'
      });
    }

    res.json({
      success: true,
      message: 'Paramètre mis à jour avec succès'
    });
  } catch (error) {
    console.error('Error updating setting:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du paramètre'
    });
  }
});

// PUT /api/settings - Mettre à jour plusieurs paramètres (temporairement sans auth pour le développement)
router.put('/', async (req, res) => {
  try {
    const { settings } = req.body;

    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Les paramètres sont requis'
      });
    }

    await Settings.updateMultiple(settings);

    res.json({
      success: true,
      message: 'Paramètres mis à jour avec succès'
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour des paramètres'
    });
  }
});

// POST /api/settings - Créer un nouveau paramètre
router.post('/', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { key, value, type = 'string', category = 'general', description = '', isPublic = true } = req.body;

    if (!key || value === undefined) {
      return res.status(400).json({
        success: false,
        message: 'La clé et la valeur sont requises'
      });
    }

    const id = await Settings.create(key, value, type, category, description, isPublic);

    res.status(201).json({
      success: true,
      message: 'Paramètre créé avec succès',
      data: { id }
    });
  } catch (error) {
    console.error('Error creating setting:', error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        message: 'Un paramètre avec cette clé existe déjà'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du paramètre'
    });
  }
});

// DELETE /api/settings/:key - Supprimer un paramètre
router.delete('/:key', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { key } = req.params;
    const deleted = await Settings.delete(key);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Paramètre non trouvé'
      });
    }

    res.json({
      success: true,
      message: 'Paramètre supprimé avec succès'
    });
  } catch (error) {
    console.error('Error deleting setting:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du paramètre'
    });
  }
});

// POST /api/settings/upload/:key - Upload d'image pour un paramètre (temporairement sans auth pour le développement)
router.post('/upload/:key', upload.single('image'), async (req, res) => {
  try {
    const { key } = req.params;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Aucune image fournie'
      });
    }

    // Ajouter un timestamp pour forcer le rafraîchissement du cache
    const timestamp = Date.now();
    const imagePath = `/images/${req.file.filename}?v=${timestamp}`;
    
    // Mettre à jour le paramètre avec le chemin de l'image
    const updated = await Settings.updateByKey(key, imagePath, 'image');
    
    if (!updated) {
      // Supprimer le fichier si la mise à jour échoue
      await fs.unlink(req.file.path).catch(console.error);
      
      return res.status(404).json({
        success: false,
        message: 'Paramètre non trouvé'
      });
    }

    res.json({
      success: true,
      message: 'Image uploadée avec succès',
      data: {
        path: imagePath,
        filename: req.file.filename,
        timestamp: timestamp
      }
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    
    // Supprimer le fichier en cas d'erreur
    if (req.file) {
      await fs.unlink(req.file.path).catch(console.error);
    }
    
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'upload de l\'image'
    });
  }
});

module.exports = router;
