const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const { pool, transaction } = require('../config/database');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');

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
    body('parent_first_name').notEmpty().withMessage('Prénom parent requis'),
    body('parent_last_name').notEmpty().withMessage('Nom parent requis'),
    body('parent_email').isEmail().withMessage('Email parent invalide'),
    body('parent_password').isLength({ min: 6 }).withMessage('Mot de passe parent invalide'),
    body('child_first_name').notEmpty().withMessage('Prénom enfant requis'),
    body('child_last_name').notEmpty().withMessage('Nom enfant requis'),
    body('birth_date').notEmpty().withMessage('Date de naissance requise'),
    body('gender').isIn(['M','F']).withMessage('Sexe invalide'),
    body('enrollment_date').notEmpty().withMessage('Date d\'inscription requise')
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

      // Créer utilisateur parent (inactif jusqu'à approbation de l'enfant)
      const [userRes] = await conn.execute(
        'INSERT INTO users (email, password, first_name, last_name, phone, role, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [parent_email, hashed, parent_first_name, parent_last_name, parent_phone || null, 'parent', 0]
      );
      const parentId = userRes.insertId;

      // Créer l'enfant avec status 'pending'
      const [childRes] = await conn.execute(
        'INSERT INTO children (first_name, last_name, birth_date, gender, parent_id, medical_info, emergency_contact_name, emergency_contact_phone, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [child_first_name, child_last_name, birth_date, gender, parentId, medical_info || null, emergency_contact_name || null, emergency_contact_phone || null, 'pending']
      );
      const childId = childRes.insertId;

      // Créer inscription
      const [enrollRes] = await conn.execute(
        'INSERT INTO enrollments (parent_id, child_id, enrollment_date, status, lunch_assistance, regulation_accepted, admin_notes) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [parentId, childId, enrollment_date, 'pending', lunch_assistance ? 1 : 0, regulation_accepted ? 1 : 0, notes || null]
      );
      const enrollmentId = enrollRes.insertId;

      // Sauvegarder les fichiers uploadés
      const documentTypes = ['carnet_medical', 'acte_naissance', 'certificat_medical'];
      
      for (const docType of documentTypes) {
        if (uploadedFiles[docType] && uploadedFiles[docType][0]) {
          const file = uploadedFiles[docType][0];
          
          // Enregistrer dans la table uploads avec les bons noms de champs
          const [uploadRes] = await conn.execute(
            'INSERT INTO uploads (filename, original_name, file_path, file_size, mime_type, uploaded_by, child_id, category) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [file.filename, file.originalname, `/uploads/documents/${file.filename}`, file.size, file.mimetype, parentId, childId, 'document']
          );
        }
      }

      return { parentId, childId, enrollmentId };
    });

    // Envoyer un email de confirmation
    try {
      console.log('📧 Tentative d\'envoi email de confirmation à:', parent_email);
      await sendConfirmationEmail(parent_email, parent_first_name, child_first_name);
      console.log('✅ Email de confirmation envoyé');
    } catch (emailError) {
      console.error('❌ Erreur envoi email:', emailError.message);
      // Ne pas faire échouer l'inscription si l'email échoue
    }

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

// Fonction utilitaire pour l'envoi d'email de confirmation
async function sendConfirmationEmail(email, parentName, childName) {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      }
    });

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.SMTP_USER,
      to: email,
      subject: 'Confirmation de votre demande d\'inscription - Crèche Mima Elghalia',
      html: `
        <h2>Confirmation de demande d'inscription</h2>
        <p>Bonjour ${parentName},</p>
        <p>Nous avons bien reçu votre demande d'inscription pour <strong>${childName}</strong>.</p>
        <p>Votre demande est en cours de traitement. Nous vous contacterons prochainement.</p>
        <p><strong>Important :</strong> Votre compte parent sera activé une fois que votre demande sera approuvée par notre équipe.</p>
        <p>Cordialement,<br>L'équipe de la Crèche Mima Elghalia</p>
      `
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Erreur envoi email confirmation:', error);
    throw error;
  }
}

module.exports = router;
