const db = require('../config/db_postgres');
const multer = require('multer');
const path = require('path');
const emailService = require('../services/emailService');

// Configuration upload
const upload = multer({
  dest: 'uploads/enrollments/',
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'application/pdf'];
    cb(null, allowed.includes(file.mimetype));
  }
});

const enrollmentsController = {
  
  // POST /api/enrollments - Création dossier visiteur
  createEnrollment: async (req, res) => {
    try {
      const {
        applicant_first_name, applicant_last_name, applicant_email, applicant_phone,
        child_first_name, child_last_name, child_birth_date, child_gender
      } = req.body;
      
      // Validation
      if (!applicant_email || !child_first_name) {
        return res.status(400).json({ success: false, error: 'Champs requis manquants' });
      }
      
      // Créer enrollment
      const result = await db.query(`
        INSERT INTO enrollments (
          applicant_first_name, applicant_last_name, applicant_email, applicant_phone,
          child_first_name, child_last_name, child_birth_date, child_gender,
          new_status, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', NOW())
        RETURNING id, new_status
      `, [applicant_first_name, applicant_last_name, applicant_email, applicant_phone,
          child_first_name, child_last_name, child_birth_date, child_gender]);
      
      const enrollment = result.rows[0];
      
      // Envoyer email de confirmation (async, ne pas bloquer la réponse)
      emailService.sendEnrollmentConfirmation({
        id: enrollment.id,
        applicant_email,
        applicant_first_name,
        child_first_name
      }).catch(err => console.error('Erreur envoi email:', err));
      
      res.status(201).json({
        success: true,
        enrollment: enrollment,
        message: 'Dossier créé avec succès'
      });
      
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },
  
  // POST /api/enrollments/:id/approve - Approbation avec date RDV
  approveEnrollment: async (req, res) => {
    try {
      const { id } = req.params;
      const { appointment_date } = req.body;
      
      if (!appointment_date) {
        return res.status(400).json({ 
          success: false, 
          error: 'Date de rendez-vous requise' 
        });
      }
      
      // Générer un token pour la création du mot de passe
      const crypto = require('crypto');
      const passwordToken = crypto.randomBytes(32).toString('hex');
      const tokenExpires = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48h
      
      // Mettre à jour le dossier
      const result = await db.query(`
        UPDATE enrollments 
        SET new_status = 'approved', 
            approved_by = $1, 
            approved_at = NOW(),
            appointment_date = $2,
            password_token = $3,
            password_token_expires = $4,
            processed_by = $1,
            processed_at = NOW()
        WHERE id = $5
        RETURNING *
      `, [req.user.id, appointment_date, passwordToken, tokenExpires, id]);
      
      const enrollment = result.rows[0];
      
      // Envoyer l'email d'approbation avec RDV et lien création MDP
      emailService.sendApprovalEmail({
        applicant_email: enrollment.applicant_email,
        applicant_first_name: enrollment.applicant_first_name,
        child_first_name: enrollment.child_first_name,
        appointment_date: appointment_date,
        enrollment_id: id
      }).catch(err => console.error('Erreur envoi email approbation:', err));
      
      res.json({
        success: true,
        message: 'Dossier approuvé avec succès',
        enrollment: enrollment
      });
      
    } catch (error) {
      console.error('Erreur approbation:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },
  
  // GET /api/enrollments - Liste dossiers
  getAllEnrollments: async (req, res) => {
    try {
      const { status = 'all', page = 1, limit = 20 } = req.query;
      const offset = (page - 1) * limit;
      
      let whereClause = '1=1';
      let params = [];
      
      if (status !== 'all') {
        whereClause = 'e.new_status = $1';
        params.push(status);
      }
      
      const query = `
        SELECT e.*, COUNT(ed.id) as documents_count
        FROM enrollments e
        LEFT JOIN enrollment_documents ed ON e.id = ed.enrollment_id
        WHERE ${whereClause}
        GROUP BY e.id
        ORDER BY e.created_at DESC
        LIMIT $${params.length + 1} OFFSET $${params.length + 2}
      `;
      
      params.push(limit, offset);
      
      const result = await db.query(query, params);
      
      res.json({
        success: true,
        enrollments: result.rows
      });
      
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },
  
  // PUT /api/enrollments/:id/reject - Rejet avec 4 types
  rejectEnrollment: async (req, res) => {
    try {
      const { id } = req.params;
      const { rejection_type, custom_reason, appointment_date } = req.body;
      
      // Valider le type de rejet
      const validTypes = ['age_depasse', 'maladie_contagieuse', 'dossier_manquant', 'autre'];
      if (!validTypes.includes(rejection_type)) {
        return res.status(400).json({ 
          success: false, 
          error: 'Type de rejet invalide' 
        });
      }
      
      // Mettre à jour le dossier
      const result = await db.query(`
        UPDATE enrollments 
        SET new_status = 'rejected', 
            rejection_type = $1,
            rejection_reason = $2,
            appointment_date = $3,
            rejected_by = $4,
            rejected_at = NOW(),
            processed_by = $4,
            processed_at = NOW()
        WHERE id = $5
        RETURNING *
      `, [rejection_type, custom_reason, appointment_date, req.user.id, id]);
      
      const enrollment = result.rows[0];
      
      // Envoyer l'email de rejet selon le type
      emailService.sendRejectionEmail(
        {
          applicant_email: enrollment.applicant_email,
          applicant_first_name: enrollment.applicant_first_name,
          child_first_name: enrollment.child_first_name,
          enrollment_id: id
        },
        rejection_type,
        custom_reason,
        appointment_date
      ).catch(err => console.error('Erreur envoi email rejet:', err));
      
      res.json({
        success: true,
        message: 'Dossier rejeté',
        enrollment: enrollment
      });
      
    } catch (error) {
      console.error('Erreur rejet:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },
  
  // POST /api/enrollments/:id/choose-appointment - Parent choisit de prendre RDV
  chooseAppointment: async (req, res) => {
    try {
      const { id } = req.params;
      const { appointment_date } = req.body;
      
      if (!appointment_date) {
        return res.status(400).json({ 
          success: false, 
          error: 'Date de rendez-vous requise' 
        });
      }
      
      // Mettre à jour le dossier
      const result = await db.query(`
        UPDATE enrollments 
        SET parent_chose_rdv = true,
            parent_rdv_choice_date = NOW(),
            appointment_date = $1
        WHERE id = $2
        RETURNING *
      `, [appointment_date, id]);
      
      const enrollment = result.rows[0];
      
      // Récupérer les infos de la personne qui a traité le dossier
      const processorResult = await db.query(`
        SELECT u.first_name, u.last_name, u.email, u.role
        FROM users u
        WHERE u.id = $1
      `, [enrollment.processed_by]);
      
      const processor = processorResult.rows[0];
      
      // Envoyer notification à l'admin/staff
      // TODO: Implémenter système de notifications
      console.log('📅 Notification RDV:', {
        parent: `${enrollment.applicant_first_name} ${enrollment.applicant_last_name}`,
        date: appointment_date,
        traite_par: `${processor.first_name} ${processor.last_name}`
      });
      
      // Envoyer email de confirmation au parent
      const crypto = require('crypto');
      const transporter = require('nodemailer').createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD
        }
      });
      
      const rdvDate = new Date(appointment_date).toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: enrollment.applicant_email,
        subject: 'Confirmation de rendez-vous - Crèche Mima Elghalia',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4f46e5;">Rendez-vous confirmé</h2>
            
            <p>Bonjour ${enrollment.applicant_first_name},</p>
            
            <p>Votre rendez-vous pour compléter le dossier de <strong>${enrollment.child_first_name}</strong> est confirmé.</p>
            
            <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
              <p style="margin: 0; color: #92400e;"><strong>📅 Date du rendez-vous :</strong></p>
              <p style="margin: 10px 0 0 0; color: #92400e; font-size: 18px;"><strong>${rdvDate}</strong></p>
            </div>
            
            <p><strong>Documents à apporter :</strong></p>
            <ul>
              <li>📋 Carnet de santé de l'enfant</li>
              <li>📄 Acte de naissance</li>
              <li>🩺 Certificat médical récent</li>
            </ul>
            
            <p>À bientôt !</p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            
            <p style="color: #6b7280; font-size: 14px;">
              Crèche Mima Elghalia<br>
              Email: ${process.env.EMAIL_FROM}
            </p>
          </div>
        `
      });
      
      res.json({
        success: true,
        message: 'Rendez-vous confirmé',
        enrollment: enrollment
      });
      
    } catch (error) {
      console.error('Erreur choix RDV:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },
  
  // POST /api/enrollments/:id/documents - Upload documents
  uploadDocuments: async (req, res) => {
    try {
      const { id } = req.params;
      const files = req.files;
      
      if (!files || Object.keys(files).length === 0) {
        return res.status(400).json({ 
          success: false, 
          error: 'Aucun fichier fourni' 
        });
      }
      
      // Vérifier que l'enrollment existe
      const enrollmentCheck = await db.query(
        'SELECT id FROM enrollments WHERE id = $1',
        [id]
      );
      
      if (enrollmentCheck.rows.length === 0) {
        return res.status(404).json({ 
          success: false, 
          error: 'Dossier non trouvé' 
        });
      }
      
      // Sauvegarder les documents
      const savedDocuments = [];
      
      for (const [fieldName, fileArray] of Object.entries(files)) {
        const file = Array.isArray(fileArray) ? fileArray[0] : fileArray;
        
        const result = await db.query(`
          INSERT INTO enrollment_documents (
            enrollment_id, document_type, filename, original_filename, 
            file_path, file_size, mime_type, uploaded_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
          RETURNING id, document_type, original_filename
        `, [
          id,
          fieldName,
          file.filename,
          file.originalname,
          file.path,
          file.size,
          file.mimetype
        ]);
        
        savedDocuments.push(result.rows[0]);
      }
      
      res.json({
        success: true,
        message: 'Documents téléchargés avec succès',
        documents: savedDocuments
      });
      
    } catch (error) {
      console.error('Erreur upload documents:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erreur lors de l\'upload des documents' 
      });
    }
  }
};

module.exports = enrollmentsController;
