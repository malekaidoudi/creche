const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const { pool, transaction } = require('../config/database');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuration multer pour les documents
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads/documents');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Seuls les fichiers JPG, PNG et PDF sont autorisés'));
    }
  }
});

const router = express.Router();

// POST /api/public/enrollments
// Crée un parent, un enfant, l'inscription et lie les documents (optionnels) en une transaction
router.post('/', 
  upload.fields([
    { name: 'carnet_medical', maxCount: 1 },
    { name: 'acte_naissance', maxCount: 1 },
    { name: 'certificat_medical', maxCount: 1 }
  ]),
  [
    body('parent_first_name').isLength({ min: 1 }).withMessage('Prénom parent requis'),
    body('parent_last_name').isLength({ min: 1 }).withMessage('Nom parent requis'),
    body('parent_email').isEmail().withMessage('Email parent invalide'),
    body('parent_password').isLength({ min: 6 }).withMessage('Mot de passe parent invalide'),
    body('child_first_name').isLength({ min: 1 }).withMessage('Prénom enfant requis'),
    body('child_last_name').isLength({ min: 1 }).withMessage('Nom enfant requis'),
    body('birth_date').isISO8601().withMessage('Date de naissance invalide'),
    body('gender').isIn(['M','F']).withMessage('Sexe invalide'),
    body('enrollment_date').isISO8601().withMessage('Date d\'inscription invalide'),
    body('lunch_assistance').optional().isBoolean(),
    body('regulation_accepted').optional().isBoolean()
  ], 
  async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Données invalides', details: errors.array() });
    }

    const {
      parent_first_name, parent_last_name, parent_email, parent_password,
      parent_phone,
      child_first_name, child_last_name, birth_date, gender,
      emergency_contact_name, emergency_contact_phone,
      enrollment_date, lunch_assistance = false, regulation_accepted = false,
      medical_info, notes
    } = req.body;

    // Récupérer les fichiers uploadés
    const uploadedFiles = req.files || {};

    const result = await transaction(async (conn) => {
      // Vérifier email existant
      const [existing] = await conn.execute('SELECT id FROM users WHERE email = ? AND is_active = TRUE', [parent_email]);
      if (existing.length > 0) {
        throw Object.assign(new Error('Email déjà utilisé'), { status: 409 });
      }

      const hashed = await bcrypt.hash(parent_password, 10);

      // Créer utilisateur parent
      const [userRes] = await conn.execute(
        'INSERT INTO users (email, password, first_name, last_name, phone, role) VALUES (?, ?, ?, ?, ?, ?)',
        [parent_email, hashed, parent_first_name, parent_last_name, parent_phone || null, 'parent']
      );
      const parentId = userRes.insertId;

      // Créer enfant
      const [childRes] = await conn.execute(
        'INSERT INTO children (first_name, last_name, birth_date, gender, medical_info, emergency_contact_name, emergency_contact_phone, parent_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [child_first_name, child_last_name, birth_date, gender, medical_info || null, emergency_contact_name || null, emergency_contact_phone || null, parentId]
      );
      const childId = childRes.insertId;

      // Créer inscription
      const [enrollRes] = await conn.execute(
        'INSERT INTO enrollments (parent_id, child_id, child_first_name, child_last_name, parent_first_name, parent_last_name, parent_email, parent_phone, birth_date, gender, medical_info, emergency_contact_name, emergency_contact_phone, enrollment_date, status, lunch_assistance, regulation_accepted, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [parentId, childId, child_first_name, child_last_name, parent_first_name, parent_last_name, parent_email, parent_phone || null, birth_date, gender, medical_info || null, emergency_contact_name || null, emergency_contact_phone || null, enrollment_date, 'pending', lunch_assistance ? 1 : 0, regulation_accepted ? 1 : 0, notes || null]
      );
      const enrollmentId = enrollRes.insertId;

      // Sauvegarder les fichiers uploadés
      const documentTypes = ['carnet_medical', 'acte_naissance', 'certificat_medical'];
      
      for (const docType of documentTypes) {
        if (uploadedFiles[docType] && uploadedFiles[docType][0]) {
          const file = uploadedFiles[docType][0];
          
          // Enregistrer dans la table uploads
          const [uploadRes] = await conn.execute(
            'INSERT INTO uploads (filename, original_name, mime_type, size, path, uploaded_by_user_id, child_id, category) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [file.filename, file.originalname, file.mimetype, file.size, file.path, parentId, childId, docType]
          );
        }
      }

      return { parentId, childId, enrollmentId };
    });

    res.status(201).json({
      message: 'Pré-inscription créée avec succès',
      parent_id: result.parentId,
      child_id: result.childId,
      enrollment_id: result.enrollmentId
    });
  } catch (error) {
    console.error('Erreur public enrollment:', error);
    const status = error.status || 500;
    res.status(status).json({ error: error.message || 'Erreur lors de la création de la pré-inscription' });
  }
});

module.exports = router;
