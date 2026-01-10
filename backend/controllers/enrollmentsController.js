const db = require('../config/db_postgres');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
// Nouveau service d'e-mails avec templates
const emailService = require('../emails/emailService');
// Utiliser Cloudinary pour stockage cloud (Render = système éphémère)
const cloudinaryService = require('../services/cloudinaryService');
const { createLog } = require('../routes_postgres/logs');

/**
 * Marquer automatiquement la tâche d'inscription comme complétée
 * quand le dossier est traité (approuvé ou rejeté)
 */
async function completeEnrollmentTask(enrollmentId) {
  try {
    // Chercher la tâche liée à ce dossier d'inscription
    const taskResult = await db.query(`
      UPDATE tasks 
      SET status = 'completed', completed_at = NOW()
      WHERE title LIKE $1 AND status != 'completed'
      RETURNING id, title
    `, [`%Traiter dossier inscription #${enrollmentId}%`]);

    if (taskResult.rows.length > 0) {
      console.log(`✅ Tâche #${taskResult.rows[0].id} marquée comme complétée (dossier #${enrollmentId} traité)`);
      return { success: true, taskId: taskResult.rows[0].id };
    } else {
      console.log(`ℹ️ Aucune tâche en attente trouvée pour le dossier #${enrollmentId}`);
      return { success: true, taskId: null };
    }
  } catch (error) {
    console.error(`❌ Erreur lors de la complétion de la tâche pour dossier #${enrollmentId}:`, error.message);
    return { success: false, error: error.message };
  }
}

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
          status, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', NOW())
        RETURNING id, status
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

      // Créer une tâche automatique pour l'admin dans la table TASKS
      // La tâche est créée le jour de l'inscription, même si c'est un jour non ouvrable
      // Si non traitée, elle apparaîtra dans "Tâches en retard" le lendemain
      try {
        // Récupérer l'ID de l'admin principal (role = 'admin')
        const adminResult = await db.query(`SELECT id FROM users WHERE role = 'admin' ORDER BY id LIMIT 1`);
        const adminId = adminResult.rows.length > 0 ? adminResult.rows[0].id : null;

        console.log(`📋 Création tâche TASKS pour admin ID: ${adminId}, dossier #${enrollment.id}`);

        if (adminId) {
          // Créer dans la table TASKS (visible dans le widget Tâches du jour)
          // Note: La description contient le lien vers la page des inscriptions en attente
          const taskResult = await db.query(`
            INSERT INTO tasks (
              title, description, assigned_to, created_by, 
              due_date, priority, status, created_at
            ) VALUES ($1, $2, $3, $4, $5, 'high', 'pending', NOW())
            RETURNING id
          `, [
            `📋 Traiter dossier inscription #${enrollment.id}`,
            `Nouvelle demande d'inscription pour ${child_first_name} ${child_last_name || ''} (parent: ${applicant_first_name} ${applicant_last_name}). Email: ${applicant_email}.\n\n🔗 Lien: /dashboard/pending-enrollments`,
            adminId,
            adminId,
            new Date() // due_date = aujourd'hui
          ]);

          if (taskResult.rows.length > 0) {
            console.log(`✅ Tâche créée dans table TASKS - ID: ${taskResult.rows[0].id}, dossier #${enrollment.id}`);
          }
        } else {
          console.warn('⚠️ Aucun admin trouvé pour créer la tâche');
        }
      } catch (taskError) {
        console.error('⚠️ Erreur création tâche automatique:', taskError.message);
        console.error('⚠️ Stack:', taskError.stack);
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
  // WORKFLOW: Crée le compte parent + RDV. Si RDV échoue, le compte sera supprimé.
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

      // Récupérer d'abord les infos du dossier
      const enrollmentCheck = await db.query(
        'SELECT * FROM enrollments WHERE id = $1',
        [id]
      );

      if (enrollmentCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Dossier non trouvé'
        });
      }

      const enrollmentData = enrollmentCheck.rows[0];

      // Vérifier si l'email n'existe pas déjà dans users
      const emailCheck = await db.query(
        'SELECT id, first_name, last_name FROM users WHERE email = $1',
        [enrollmentData.applicant_email]
      );

      if (emailCheck.rows.length > 0) {
        const existingUser = emailCheck.rows[0];
        return res.status(409).json({
          success: false,
          error: `Un compte existe déjà avec cet email (${existingUser.first_name} ${existingUser.last_name}). Si ce parent souhaite inscrire un autre enfant, utilisez la fonction "Ajouter un enfant" depuis son profil.`,
          existingUserId: existingUser.id
        });
      }

      // Générer un token pour la création du mot de passe (7 jours)
      const passwordToken = crypto.randomBytes(32).toString('hex');
      const tokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      // ============================================================
      // WORKFLOW: Dossier approuvé → Créer compte parent + RDV
      // Si RDV échoue/annulé → Supprimer le compte parent
      // Si RDV validé → Garder le compte parent
      // ============================================================

      // 1. CRÉER LE COMPTE PARENT (sans mot de passe défini)
      const tempPassword = await bcrypt.hash(crypto.randomBytes(16).toString('hex'), 10);

      const userResult = await db.query(`
        INSERT INTO users (
          email, password, first_name, last_name, phone, role,
          password_token, password_token_expires, password_set,
          is_active, created_at
        ) VALUES ($1, $2, $3, $4, $5, 'parent', $6, $7, false, true, NOW())
        RETURNING id, email, first_name, last_name, phone, role
      `, [
        enrollmentData.applicant_email,
        tempPassword,
        enrollmentData.applicant_first_name || 'Parent',
        enrollmentData.applicant_last_name || '',
        enrollmentData.applicant_phone || '',
        passwordToken,
        tokenExpires
      ]);

      const newUser = userResult.rows[0];
      console.log(`✅ Compte parent créé: ${newUser.email} (ID: ${newUser.id})`);

      // 2. CRÉER LE RDV avec le parent_id
      const appointmentResult = await db.query(`
        INSERT INTO appointments (
          enrollment_id,
          parent_id,
          child_id,
          created_by,
          subject,
          description,
          proposed_date,
          status,
          location,
          appointment_type,
          parent_email,
          parent_phone,
          parent_first_name,
          parent_last_name,
          child_first_name,
          child_last_name
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        RETURNING *
      `, [
        id,
        newUser.id,
        null,
        req.user.id,
        `Rendez-vous d'inscription - ${enrollmentData.child_first_name}`,
        `Rendez-vous pour finaliser l'inscription de ${enrollmentData.child_first_name} ${enrollmentData.child_last_name || ''} à la crèche.`,
        appointment_date,
        'proposed',
        'Crèche Mima Elghalia',
        'inscription',
        enrollmentData.applicant_email,
        enrollmentData.applicant_phone || '',
        enrollmentData.applicant_first_name || 'Parent',
        enrollmentData.applicant_last_name || '',
        enrollmentData.child_first_name,
        enrollmentData.child_last_name || ''
      ]);

      const appointmentId = appointmentResult.rows[0].id;

      // 3. Mettre à jour le dossier avec status = 'in_progress', lier le RDV et le user créé
      const result = await db.query(`
        UPDATE enrollments 
        SET status = 'in_progress', 
            approved_by = $1, 
            approved_at = NOW(),
            password_token = $2,
            password_token_expires = $3,
            processed_by = $1,
            processed_at = NOW(),
            active_appointment_id = $4,
            created_parent_user_id = $5
        WHERE id = $6
        RETURNING *
      `, [req.user.id, passwordToken, tokenExpires, appointmentId, newUser.id, id]);

      const enrollment = result.rows[0];

      console.log(`✅ RDV créé dans appointments: ID ${appointmentId} pour inscription #${id}`);
      console.log(`📋 Dossier #${id} passé en status 'in_progress' (en attente du RDV)`);

      // Créer un log d'approbation
      await createLog(
        req.user.id,
        'approve_enrollment',
        `Inscription approuvée pour ${enrollment.child_first_name} ${enrollment.child_last_name || ''} - RDV créé`
      );

      // Générer le lien de création de mot de passe
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
      ).then(emailResult => {
        if (emailResult.success) {
          console.log(`✅ E-mail d'approbation envoyé à ${enrollment.applicant_email}`);
        } else {
          console.error(`❌ Échec envoi e-mail à ${enrollment.applicant_email}:`, emailResult.error);
        }
      }).catch(err => console.error('❌ Erreur envoi email approbation:', err));

      // NOTE: Les documents restent dans enrollment_documents et seront copiés vers children_documents
      // lors de la finalisation de l'inscription (quand l'enfant est créé dans la table children)
      console.log(`📄 Documents d'inscription conservés pour le dossier #${id} (seront transférés à la finalisation)`);

      // Marquer automatiquement la tâche d'inscription comme complétée
      completeEnrollmentTask(id);

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

  // GET /api/enrollments - Liste dossiers (enrollments + enrollments_archive)
  // Jointure avec children et users pour récupérer les vraies données
  getAllEnrollments: async (req, res) => {
    try {
      const { status = 'all', page = 1, limit = 20, include_archived = 'true' } = req.query;
      const offset = (page - 1) * limit;

      let params = [];
      let paramIndex = 1;

      // Requête pour enrollments actifs
      let enrollmentsWhere = '1=1';
      if (status !== 'all') {
        enrollmentsWhere = `e.status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
      }

      // Requête principale: UNION entre enrollments et enrollments_archive
      // IMPORTANT: Jointure avec children et users pour récupérer les vraies données
      const includeArchived = include_archived === 'true';

      let query;
      if (includeArchived && (status === 'all' || status === 'approved' || status === 'rejected_deleted')) {
        // UNION avec enrollments_archive pour les statuts finalisés
        query = `
          WITH combined AS (
            -- Inscriptions actives avec jointure children et users
            SELECT 
              e.id, e.status::text as status, e.created_at, e.updated_at,
              -- Priorité: données de la table children, sinon données de enrollments
              COALESCE(c.first_name, e.child_first_name) as child_first_name,
              COALESCE(c.last_name, e.child_last_name) as child_last_name,
              COALESCE(c.birth_date, e.child_birth_date) as child_birth_date,
              COALESCE(c.gender, e.child_gender) as child_gender,
              -- Priorité: données du parent (users), sinon données de enrollments
              COALESCE(u.first_name, e.applicant_first_name) as applicant_first_name,
              COALESCE(u.last_name, e.applicant_last_name) as applicant_last_name,
              COALESCE(u.email, e.applicant_email) as applicant_email,
              COALESCE(u.phone, e.applicant_phone) as applicant_phone,
              COALESCE(u.first_name, e.applicant_first_name) AS parent_first_name,
              COALESCE(u.last_name, e.applicant_last_name) AS parent_last_name,
              COALESCE(u.email, e.applicant_email) AS parent_email,
              COALESCE(u.phone, e.applicant_phone) AS parent_phone,
              e.admin_notes, e.approved_by, e.approved_at,
              e.active_appointment_id, e.failed_appointments_count,
              COALESCE((SELECT COUNT(*) FROM enrollment_documents ed WHERE ed.enrollment_id = e.id), 0) as documents_count,
              'active' as source
            FROM enrollments e
            LEFT JOIN children c ON e.child_id = c.id
            LEFT JOIN users u ON c.parent_id = u.id
            WHERE ${enrollmentsWhere}
            
            UNION ALL
            
            -- Inscriptions archivées
            SELECT 
              ea.id, COALESCE(ea.new_status::text, ea.status::text) as status, ea.created_at, ea.updated_at,
              NULL as child_first_name, NULL as child_last_name, NULL as child_birth_date, NULL as child_gender,
              ea.applicant_first_name, ea.applicant_last_name, ea.applicant_email, NULL as applicant_phone,
              ea.applicant_first_name AS parent_first_name,
              ea.applicant_last_name AS parent_last_name,
              ea.applicant_email AS parent_email,
              NULL AS parent_phone,
              ea.admin_notes, ea.approved_by, ea.approved_at,
              NULL as active_appointment_id, NULL as failed_appointments_count,
              0 as documents_count,
              'archived' as source
            FROM enrollments_archive ea
            WHERE ${status === 'all' ? '1=1' : (status === 'approved' ? "COALESCE(ea.new_status::text, ea.status::text) = 'approved'" : (status === 'rejected_deleted' ? "COALESCE(ea.new_status::text, ea.status::text) = 'rejected_deleted'" : '1=0'))}
          )
          SELECT * FROM combined
          ORDER BY created_at DESC
          LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;
      } else {
        // Requête simple sans archive - avec jointure children et users
        query = `
          SELECT 
            e.id, e.status, e.created_at, e.updated_at,
            e.admin_notes, e.approved_by, e.approved_at,
            e.active_appointment_id, e.failed_appointments_count,
            -- Priorité: données de la table children, sinon données de enrollments
            COALESCE(c.first_name, e.child_first_name) as child_first_name,
            COALESCE(c.last_name, e.child_last_name) as child_last_name,
            COALESCE(c.birth_date, e.child_birth_date) as child_birth_date,
            COALESCE(c.gender, e.child_gender) as child_gender,
            -- Priorité: données du parent (users), sinon données de enrollments
            COALESCE(u.first_name, e.applicant_first_name) AS parent_first_name,
            COALESCE(u.last_name, e.applicant_last_name) AS parent_last_name,
            COALESCE(u.email, e.applicant_email) AS parent_email,
            COALESCE(u.phone, e.applicant_phone) AS parent_phone,
            COALESCE((SELECT COUNT(*) FROM enrollment_documents ed WHERE ed.enrollment_id = e.id), 0) as documents_count,
            'active' as source
          FROM enrollments e
          LEFT JOIN children c ON e.child_id = c.id
          LEFT JOIN users u ON c.parent_id = u.id
          WHERE ${enrollmentsWhere}
          ORDER BY e.created_at DESC
          LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;
      }

      params.push(limit, offset);

      const result = await db.query(query, params);

      res.json({
        success: true,
        enrollments: result.rows
      });

    } catch (error) {
      console.error('❌ Erreur getAllEnrollments:', error);
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
        SET status = $1, 
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

        // Supprimer le dossier Cloudinary complet (rejet définitif)
        (async () => {
          try {
            console.log(`🗑️ Suppression dossier Cloudinary pour rejet définitif #${id}`);
            const deleteResult = await cloudinaryService.deleteFolder(id, 'enrollment');
            if (deleteResult.success) {
              console.log(`✅ Dossier Cloudinary supprimé: ${deleteResult.deletedCount} fichier(s)`);
            }
            // Supprimer les documents de la base
            await db.query('DELETE FROM enrollment_documents WHERE enrollment_id = $1', [id]);
            console.log(`✅ Documents supprimés de la base pour rejet #${id}`);
          } catch (cleanupError) {
            console.error('❌ Erreur suppression documents rejet:', cleanupError);
          }
        })();
      }

      // Marquer automatiquement la tâche d'inscription comme complétée
      completeEnrollmentTask(id);

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
          // Upload vers Cloudinary si configuré (nouvelle méthode unifiée)
          let cloudinaryUrl = null;
          let cloudinaryPublicId = null;

          if (cloudinaryService.isConfigured()) {
            console.log('☁️  Upload vers Cloudinary (méthode unifiée):', file.originalname);
            const uploadResult = await cloudinaryService.uploadEnrollmentDocument(
              file.path,
              id,
              fieldName
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
