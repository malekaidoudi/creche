const db = require('../config/db_postgres');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
// Nouveau service d'e-mails avec Resend et templates
const emailService = require('../emails/emailService');
// Utiliser Cloudinary pour stockage cloud (Render = système éphémère)
const cloudinaryService = require('../services/cloudinaryService');
const { createLog } = require('../routes_postgres/logs');

// Créer le dossier uploads si nécessaire
const uploadsDir = path.join(__dirname, '../uploads/enrollments');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('✅ Dossier uploads/enrollments créé');
}

// Configuration upload
const upload = multer({
  dest: uploadsDir,
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

      // Créer un log d'activité pour la nouvelle inscription
      try {
        await createLog(
          null, // Pas d'utilisateur connecté (inscription publique)
          'new_enrollment',
          `Nouvelle inscription : ${child_first_name} ${child_last_name || ''} (parent: ${applicant_first_name} ${applicant_last_name})`,
          { enrollment_id: enrollment.id, applicant_email }
        );
      } catch (logError) {
        console.error('⚠️ Erreur création log activité:', logError);
      }

      // Envoyer email de confirmation (async, ne pas bloquer la réponse)
      emailService.sendRegistrationConfirmation({
        id: enrollment.id,
        applicant_email,
        applicant_first_name,
        child_first_name
      }).then(result => {
        if (result.success) {
          console.log(`✅ E-mail de confirmation envoyé à ${applicant_email}`);
        } else {
          console.error(`❌ Échec envoi e-mail à ${applicant_email}:`, result.error);
        }
      }).catch(err => {
        console.error('❌ Erreur envoi email confirmation:', err);
      });

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

      // Créer un log d'approbation
      await createLog(
        req.user.id,
        'approve_enrollment',
        `Inscription approuvée pour ${enrollment.child_first_name} ${enrollment.child_last_name || ''}`
      );

      // Générer le lien de création de mot de passe
      // Forcer l'URL de production pour éviter les problèmes de configuration
      const frontendUrl = process.env.FRONTEND_URL || 'https://mima-elghalia.com';
      console.log(`📧 URL Frontend utilisée pour email: ${frontendUrl}`);
      const passwordLink = `${frontendUrl}/create-password?token=${passwordToken}&email=${encodeURIComponent(enrollment.applicant_email)}`;

      // Formater la date de rendez-vous en français
      const appointmentDateFormatted = new Date(appointment_date).toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      // Envoyer l'email d'approbation avec RDV et lien création MDP
      emailService.sendAcceptedEmail(
        enrollment,
        appointmentDateFormatted,
        passwordLink
      ).then(result => {
        if (result.success) {
          console.log(`✅ E-mail d'approbation envoyé à ${enrollment.applicant_email}`);
        } else {
          console.error(`❌ Échec envoi e-mail à ${enrollment.applicant_email}:`, result.error);
        }
      }).catch(err => console.error('❌ Erreur envoi email approbation:', err));

      // Supprimer les documents d'inscription de Cloudinary (après approbation, ils ne sont plus nécessaires)
      // Cette opération est effectuée de manière asynchrone pour ne pas bloquer la réponse
      (async () => {
        try {
          // Récupérer tous les documents avec cloudinary_public_id
          const documentsResult = await db.query(`
            SELECT id, cloudinary_public_id, original_filename
            FROM enrollment_documents
            WHERE enrollment_id = $1 AND cloudinary_public_id IS NOT NULL
          `, [id]);

          if (documentsResult.rows.length > 0) {
            console.log(`🗑️  Suppression de ${documentsResult.rows.length} document(s) Cloudinary pour le dossier #${id}`);

            for (const doc of documentsResult.rows) {
              const deleteResult = await cloudinaryService.deleteFile(doc.cloudinary_public_id);
              if (deleteResult.success) {
                console.log(`   ✅ Document supprimé: ${doc.original_filename}`);
                // Mettre à jour la base pour indiquer que le fichier Cloudinary a été supprimé
                await db.query(`
                  UPDATE enrollment_documents
                  SET cloudinary_url = NULL, cloudinary_public_id = NULL
                  WHERE id = $1
                `, [doc.id]);
              } else {
                console.warn(`   ⚠️ Échec suppression: ${doc.original_filename}`, deleteResult.error);
              }
            }

            console.log(`✅ Nettoyage Cloudinary terminé pour dossier #${id}`);
          }
        } catch (cleanupError) {
          console.error('❌ Erreur nettoyage Cloudinary:', cleanupError);
          // On ne fait pas échouer l'approbation si le nettoyage échoue
        }
      })();

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

      // Sélection explicite avec alias pour compatibilité frontend
      const query = `
        SELECT 
          e.id,
          e.child_first_name,
          e.child_last_name,
          e.child_birth_date,
          e.child_gender,
          e.applicant_first_name AS parent_first_name,
          e.applicant_last_name AS parent_last_name,
          e.applicant_email AS parent_email,
          e.applicant_phone AS parent_phone,
          e.new_status,
          e.rejection_type,
          e.rejection_reason,
          e.appointment_date,
          e.approved_at,
          e.rejected_at,
          e.processed_at,
          e.created_at,
          e.updated_at,
          e.medical_info,
          COUNT(ed.id) as documents_count
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
      const validTypes = ['age_depasse', 'maladie_contagieuse', 'dossier_manquant', 'places_completes', 'autre'];
      if (!validTypes.includes(rejection_type)) {
        return res.status(400).json({
          success: false,
          error: 'Type de rejet invalide'
        });
      }

      // Déterminer le statut selon le type de rejet
      const status = rejection_type === 'dossier_manquant' ? 'rejected_incomplete' : 'rejected_deleted';

      // Mettre à jour le dossier
      const result = await db.query(`
        UPDATE enrollments 
        SET new_status = $1, 
            rejection_type = $2,
            rejection_reason = $3,
            appointment_date = $4,
            rejected_by = $5,
            rejected_at = NOW(),
            processed_by = $5,
            processed_at = NOW()
        WHERE id = $6
        RETURNING *
      `, [status, rejection_type, custom_reason, appointment_date, req.user.id, id]);

      const enrollment = result.rows[0];

      // Créer un log de rejet
      await createLog(
        req.user.id,
        'reject_enrollment',
        `Inscription rejetée pour ${enrollment.child_first_name} ${enrollment.child_last_name || ''} (${rejection_type})`
      );

      // Envoyer l'email selon le type de rejet
      if (rejection_type === 'dossier_manquant') {
        // Générer un token pour l'upload des documents
        const uploadToken = crypto.randomBytes(32).toString('hex');

        // Forcer l'URL de production pour éviter les problèmes de configuration
        const frontendUrl = process.env.FRONTEND_URL || 'https://mima-elghalia.com';
        console.log(`📧 URL Frontend utilisée pour email documents manquants: ${frontendUrl}`);
        const uploadLink = `${frontendUrl}/upload-documents?token=${uploadToken}&enrollment=${id}`;

        // Liste des documents manquants (à personnaliser selon les besoins)
        const missingDocs = custom_reason ? custom_reason.split(',').map(d => d.trim()) : [
          'Carnet de santé de l\'enfant',
          'Acte de naissance',
          'Certificat médical récent'
        ];

        emailService.sendMissingDocsEmail(
          enrollment,
          missingDocs,
          appointment_date,
          uploadLink
        ).catch(err => console.error('❌ Erreur envoi email documents manquants:', err));
      } else {
        // Rejet définitif
        emailService.sendRejectionEmail(
          enrollment,
          custom_reason || 'Votre demande ne peut pas être acceptée pour le moment.'
        ).catch(err => console.error('❌ Erreur envoi email rejet:', err));
      }

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
        traite_par: processor ? `${processor.first_name} ${processor.last_name}` : 'N/A'
      });

      // Envoyer email de confirmation au parent via Resend
      emailService.sendAppointmentConfirmation(enrollment, appointment_date)
        .then(result => {
          if (result.success) {
            console.log(`✅ E-mail de confirmation RDV envoyé à ${enrollment.applicant_email}`);
          } else {
            console.error(`❌ Échec envoi e-mail RDV à ${enrollment.applicant_email}:`, result.error);
          }
        })
        .catch(err => console.error('❌ Erreur envoi email confirmation RDV:', err));

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

      console.log('📎 Upload documents - Enrollment ID:', id);
      console.log('📁 Fichiers reçus:', files ? Object.keys(files) : 'aucun');

      if (!files || Object.keys(files).length === 0) {
        console.log('❌ Aucun fichier fourni');
        return res.status(400).json({
          success: false,
          error: 'Aucun fichier fourni'
        });
      }

      // Vérifier que l'enrollment existe
      console.log('🔍 Vérification enrollment ID:', id);
      const enrollmentCheck = await db.query(
        'SELECT id FROM enrollments WHERE id = $1',
        [id]
      );

      if (enrollmentCheck.rows.length === 0) {
        console.log('❌ Enrollment non trouvé:', id);
        return res.status(404).json({
          success: false,
          error: 'Dossier non trouvé'
        });
      }

      console.log('✅ Enrollment trouvé, sauvegarde des documents...');

      // Sauvegarder les documents
      const savedDocuments = [];

      for (const [fieldName, fileArray] of Object.entries(files)) {
        const file = Array.isArray(fileArray) ? fileArray[0] : fileArray;

        console.log(`📄 Sauvegarde document: ${fieldName}`, {
          filename: file.filename,
          originalname: file.originalname,
          path: file.path,
          size: file.size,
          mimetype: file.mimetype
        });

        try {
          // Upload vers Cloudinary si configuré
          let cloudinaryUrl = null;
          let cloudinaryPublicId = null;

          if (cloudinaryService.isConfigured()) {
            console.log('☁️  Upload vers Cloudinary:', file.originalname);
            const uploadResult = await cloudinaryService.uploadFile(
              file.path,
              'enrollments',
              `enrollment_${id}_${fieldName}_${Date.now()}`
            );

            if (uploadResult.success) {
              cloudinaryUrl = uploadResult.url;
              cloudinaryPublicId = uploadResult.publicId;
              console.log('✅ Fichier sur Cloudinary:', cloudinaryUrl);

              // Supprimer le fichier local après upload Cloudinary
              try {
                fs.unlinkSync(file.path);
                console.log('🗑️  Fichier local supprimé:', file.path);
              } catch (unlinkError) {
                console.warn('⚠️  Impossible de supprimer fichier local:', unlinkError.message);
              }
            } else {
              console.warn('⚠️  Échec upload Cloudinary, utilisation stockage local');
            }
          } else {
            console.warn('⚠️  Cloudinary non configuré, stockage local utilisé');
          }

          const result = await db.query(`
            INSERT INTO enrollment_documents (
              enrollment_id, document_type, filename, original_filename, 
              file_path, file_size, mime_type, cloudinary_url, cloudinary_public_id, uploaded_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
            RETURNING id, document_type, original_filename, cloudinary_url
          `, [
            id,
            fieldName,
            file.filename,
            file.originalname,
            cloudinaryUrl || file.path,
            file.size,
            file.mimetype,
            cloudinaryUrl,
            cloudinaryPublicId
          ]);

          console.log('✅ Document sauvegardé en DB:', result.rows[0]);
          savedDocuments.push(result.rows[0]);
        } catch (dbError) {
          console.error('❌ Erreur DB pour document:', fieldName, dbError.message);
          throw dbError;
        }
      }

      console.log('✅ Tous les documents sauvegardés:', savedDocuments.length);

      res.json({
        success: true,
        message: 'Documents téléchargés avec succès',
        documents: savedDocuments
      });

    } catch (error) {
      console.error('❌ Erreur upload documents:', error.message);
      console.error('Stack:', error.stack);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de l\'upload des documents',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
};

module.exports = enrollmentsController;
