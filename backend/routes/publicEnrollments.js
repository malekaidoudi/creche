const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const { pool, transaction } = require('../config/database');

const router = express.Router();

// POST /api/public/enrollments
// Crée un parent, un enfant, l'inscription et lie les documents (optionnels) en une transaction
router.post('/', [
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
  body('regulation_accepted').optional().isBoolean(),
  body('documents').optional().isArray().withMessage('Documents doit être un tableau')
], async (req, res) => {
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
      documents = []
    } = req.body;

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
        'INSERT INTO children (first_name, last_name, birth_date, gender, medical_info, emergency_contact_name, emergency_contact_phone) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [child_first_name, child_last_name, birth_date, gender, null, emergency_contact_name || null, emergency_contact_phone || null]
      );
      const childId = childRes.insertId;

      // Créer inscription
      const [enrollRes] = await conn.execute(
        'INSERT INTO enrollments (parent_id, child_id, enrollment_date, status, lunch_assistance, regulation_accepted) VALUES (?, ?, ?, ?, ?, ?)',
        [parentId, childId, enrollment_date, 'pending', lunch_assistance ? 1 : 0, regulation_accepted ? 1 : 0]
      );
      const enrollmentId = enrollRes.insertId;

      // Lier documents (optionnels)
      if (Array.isArray(documents)) {
        for (const doc of documents) {
          const { document_type, upload_id } = doc || {};
          if (!document_type || !upload_id) continue;
          // Vérifier que l\'upload existe
          const [up] = await conn.execute('SELECT id FROM uploads WHERE id = ?', [upload_id]);
          if (up.length === 0) continue;
          await conn.execute(
            'INSERT INTO enrollment_documents (enrollment_id, document_type, upload_id) VALUES (?, ?, ?)',
            [enrollmentId, document_type, upload_id]
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
