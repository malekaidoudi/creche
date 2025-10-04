const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { query: dbQuery } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Configuration de multer pour le stockage des fichiers
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', process.env.UPLOADS_DIR || 'uploads');
    
    // Créer le dossier s'il n'existe pas
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Générer un nom de fichier unique
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + extension);
  }
});

// Filtrer les types de fichiers autorisés
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Type de fichier non autorisé'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 // 5MB par défaut
  }
});

// POST /api/uploads - Upload d'un fichier
router.post('/', [
  authenticateToken,
  upload.single('file')
], async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'Aucun fichier fourni'
      });
    }

    const { originalname, filename, mimetype, size, path: filePath } = req.file;
    const uploaded_by = req.user.id;

    // Enregistrer les informations du fichier en base de données
    const sql = `
      INSERT INTO uploads (original_name, filename, mimetype, size, path, uploaded_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    const result = await dbQuery(sql, [originalname, filename, mimetype, size, filePath, uploaded_by]);
    
    // Construire l'URL d'accès au fichier
    const fileUrl = `/media/${filename}`;

    res.status(201).json({
      message: 'Fichier uploadé avec succès',
      file: {
        id: result.insertId,
        original_name: originalname,
        filename,
        mimetype,
        size,
        url: fileUrl,
        uploaded_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Erreur lors de l\'upload:', error);
    
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'Fichier trop volumineux'
      });
    }
    
    if (error.message === 'Type de fichier non autorisé') {
      return res.status(400).json({
        error: 'Type de fichier non autorisé'
      });
    }

    res.status(500).json({
      error: 'Erreur lors de l\'upload du fichier'
    });
  }
});

// POST /api/uploads/multiple - Upload de plusieurs fichiers
router.post('/multiple', [
  authenticateToken,
  upload.array('files', 10) // Maximum 10 fichiers
], async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        error: 'Aucun fichier fourni'
      });
    }

    const uploaded_by = req.user.id;
    const uploadedFiles = [];

    // Traiter chaque fichier
    for (const file of req.files) {
      const { originalname, filename, mimetype, size, path: filePath } = file;

      const sql = `
        INSERT INTO uploads (original_name, filename, mimetype, size, path, uploaded_by)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      
      const result = await dbQuery(sql, [originalname, filename, mimetype, size, filePath, uploaded_by]);
      
      uploadedFiles.push({
        id: result.insertId,
        original_name: originalname,
        filename,
        mimetype,
        size,
        url: `/media/${filename}`,
        uploaded_at: new Date().toISOString()
      });
    }

    res.status(201).json({
      message: `${uploadedFiles.length} fichier(s) uploadé(s) avec succès`,
      files: uploadedFiles
    });
  } catch (error) {
    console.error('Erreur lors de l\'upload multiple:', error);
    
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'Un ou plusieurs fichiers sont trop volumineux'
      });
    }

    res.status(500).json({
      error: 'Erreur lors de l\'upload des fichiers'
    });
  }
});

// GET /api/uploads - Obtenir la liste des fichiers uploadés
router.get('/', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    let sql = `
      SELECT u.*, us.first_name, us.last_name
      FROM uploads u
      INNER JOIN users us ON u.uploaded_by = us.id
      WHERE 1=1
    `;
    let params = [];

    // Si l'utilisateur n'est pas admin/staff, ne montrer que ses fichiers
    if (!['admin', 'staff'].includes(req.user.role)) {
      sql += ' AND u.uploaded_by = ?';
      params.push(req.user.id);
    }

    sql += ` ORDER BY u.created_at DESC LIMIT ${limit} OFFSET ${offset}`;
    // Ne pas ajouter limit et offset aux params

    const uploads = await dbQuery(sql, params);
    
    // Compter le total
    let countSql = 'SELECT COUNT(*) as total FROM uploads WHERE 1=1';
    let countParams = [];
    
    if (!['admin', 'staff'].includes(req.user.role)) {
      countSql += ' AND uploaded_by = ?';
      countParams.push(req.user.id);
    }
    
    const countResult = await dbQuery(countSql, countParams);
    const total = countResult[0].total;

    // Ajouter l'URL complète à chaque fichier
    const uploadsWithUrls = uploads.map(upload => ({
      ...upload,
      url: `/media/${upload.filename}`
    }));

    res.json({
      message: 'Fichiers récupérés avec succès',
      uploads: uploadsWithUrls,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des fichiers:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération des fichiers'
    });
  }
});

// GET /api/uploads/:id - Obtenir les informations d'un fichier
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const uploadId = parseInt(req.params.id);
    
    if (isNaN(uploadId)) {
      return res.status(400).json({
        error: 'ID fichier invalide'
      });
    }

    let sql = `
      SELECT u.*, us.first_name, us.last_name
      FROM uploads u
      INNER JOIN users us ON u.uploaded_by = us.id
      WHERE u.id = ?
    `;
    let params = [uploadId];

    // Vérifier les permissions
    if (!['admin', 'staff'].includes(req.user.role)) {
      sql += ' AND u.uploaded_by = ?';
      params.push(req.user.id);
    }

    const results = await dbQuery(sql, params);
    
    if (results.length === 0) {
      return res.status(404).json({
        error: 'Fichier non trouvé'
      });
    }

    const upload = results[0];
    upload.url = `/media/${upload.filename}`;

    res.json({
      message: 'Fichier récupéré avec succès',
      upload
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du fichier:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération du fichier'
    });
  }
});

// DELETE /api/uploads/:id - Supprimer un fichier
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const uploadId = parseInt(req.params.id);
    
    if (isNaN(uploadId)) {
      return res.status(400).json({
        error: 'ID fichier invalide'
      });
    }

    // Récupérer les informations du fichier
    let sql = 'SELECT * FROM uploads WHERE id = ?';
    let params = [uploadId];

    // Vérifier les permissions
    if (!['admin', 'staff'].includes(req.user.role)) {
      sql += ' AND uploaded_by = ?';
      params.push(req.user.id);
    }

    const results = await dbQuery(sql, params);
    
    if (results.length === 0) {
      return res.status(404).json({
        error: 'Fichier non trouvé'
      });
    }

    const upload = results[0];

    // Supprimer le fichier physique
    try {
      if (fs.existsSync(upload.path)) {
        fs.unlinkSync(upload.path);
      }
    } catch (fileError) {
      console.error('Erreur lors de la suppression du fichier physique:', fileError);
    }

    // Supprimer l'enregistrement de la base de données
    await dbQuery('DELETE FROM uploads WHERE id = ?', [uploadId]);

    res.json({
      message: 'Fichier supprimé avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la suppression du fichier:', error);
    res.status(500).json({
      error: 'Erreur lors de la suppression du fichier'
    });
  }
});

module.exports = router;
