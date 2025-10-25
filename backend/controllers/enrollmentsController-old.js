const db = require('../config/database');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');

const enrollmentsController = {
  // Obtenir toutes les demandes d'inscription
  getAllEnrollments: async (req, res) => {
    try {
      console.log('🔍 getAllEnrollments appelé avec:', req.query);
      const { page = 1, limit = 20, status = 'all' } = req.query;
      const offset = (page - 1) * limit;

      // Requête simple pour récupérer les inscriptions
      let query = 'SELECT * FROM enrollments';
      let params = [];

      if (status !== 'all') {
        query += ' WHERE status = ?';
        params.push(status);
      }

      query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
      params.push(parseInt(limit), parseInt(offset));

      const [enrollments] = await db.execute(query, params);

      // Enrichir chaque inscription avec les infos parent/enfant/fichiers
      const enrichedEnrollments = await Promise.all(
        enrollments.map(async (enrollment) => {
          // Récupérer les infos du parent
          const [parents] = await db.execute(
            'SELECT first_name, last_name, email FROM users WHERE id = ?',
            [enrollment.parent_id]
          );

          // Récupérer les infos de l'enfant
          const [children] = await db.execute(
            'SELECT first_name, last_name, birth_date FROM children WHERE id = ?',
            [enrollment.child_id]
          );

          // Récupérer les fichiers
          const [files] = await db.execute(
            'SELECT * FROM uploads WHERE child_id = ? ORDER BY id DESC',
            [enrollment.child_id]
          );

          return {
            ...enrollment,
            parent_first_name: parents[0]?.first_name || '',
            parent_last_name: parents[0]?.last_name || '',
            parent_email: parents[0]?.email || '',
            child_first_name: children[0]?.first_name || '',
            child_last_name: children[0]?.last_name || '',
            child_birth_date: children[0]?.birth_date || null,
            files: files || []
          };
        })
      );

      // Compter le total
      let countQuery = 'SELECT COUNT(*) as total FROM enrollments';
      let countParams = [];
      
      if (status !== 'all') {
        countQuery += ' WHERE status = ?';
        countParams.push(status);
      }

      const [countResult] = await db.execute(countQuery, countParams);
      const total = countResult[0].total;

      res.json({
        enrollments: enrichedEnrollments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Erreur récupération inscriptions:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  },

  // Obtenir une demande d'inscription par ID
  getEnrollmentById: async (req, res) => {
    try {
      const { id } = req.params;

      const [enrollments] = await db.execute(
        'SELECT * FROM enrollments WHERE id = ?',
        [id]
      );

      if (enrollments.length === 0) {
        return res.status(404).json({ error: 'Demande d\'inscription non trouvée' });
      }

      const enrollment = enrollments[0];
      enrollment.files = enrollment.files ? JSON.parse(enrollment.files) : [];

      res.json(enrollment);
    } catch (error) {
      console.error('Erreur récupération inscription:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  },

  // Créer une nouvelle demande d'inscription (depuis le formulaire public)
  createEnrollment: async (req, res) => {
    try {
      const {
        child_first_name,
        child_last_name,
        child_birth_date,
        child_gender,
        child_medical_info,
        emergency_contact_name,
        emergency_contact_phone,
        lunch_assistance,
        preferred_start_date,
        parent_first_name,
        parent_last_name,
        parent_email,
        parent_phone,
        parent_password
      } = req.body;

      // Validation des champs requis
      if (!child_first_name || !child_last_name || !child_birth_date || !child_gender ||
          !parent_first_name || !parent_last_name || !parent_email) {
        return res.status(400).json({ error: 'Champs requis manquants' });
      }

      // Vérifier si l'email parent existe déjà
      const [existingParents] = await db.execute(
        'SELECT id FROM users WHERE email = ?',
        [parent_email]
      );

      // Hasher le mot de passe si fourni
      let hashedPassword = null;
      if (parent_password) {
        hashedPassword = await bcrypt.hash(parent_password, 10);
      }

      // Gérer les fichiers uploadés (si présents)
      let files = [];
      if (req.files && req.files.length > 0) {
        files = req.files.map(file => ({
          name: file.originalname,
          path: file.path,
          size: file.size,
          type: file.mimetype
        }));
      }

      // Transaction pour créer parent, enfant et inscription
      const result = await db.transaction(async (conn) => {
        let parentId;
        
        // Créer ou récupérer le parent
        if (existingParents.length > 0) {
          parentId = existingParents[0].id;
        } else {
          // Créer nouveau parent
          const [userRes] = await conn.execute(
            'INSERT INTO users (email, password, first_name, last_name, phone, role) VALUES (?, ?, ?, ?, ?, ?)',
            [parent_email, hashedPassword, parent_first_name, parent_last_name, parent_phone || null, 'parent']
          );
          parentId = userRes.insertId;
        }

        // Créer l'enfant avec status 'pending'
        const [childRes] = await conn.execute(
          'INSERT INTO children (first_name, last_name, birth_date, gender, parent_id, medical_info, emergency_contact_name, emergency_contact_phone, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [child_first_name, child_last_name, child_birth_date, child_gender, parentId, child_medical_info || null, emergency_contact_name || null, emergency_contact_phone || null, 'pending']
        );
        const childId = childRes.insertId;

        // Créer l'inscription avec status 'pending'
        const [enrollRes] = await conn.execute(
          'INSERT INTO enrollments (parent_id, child_id, enrollment_date, status, lunch_assistance, regulation_accepted) VALUES (?, ?, ?, ?, ?, ?)',
          [parentId, childId, preferred_start_date || new Date().toISOString().split('T')[0], 'pending', lunch_assistance ? 1 : 0, 1]
        );
        const enrollmentId = enrollRes.insertId;

        // Sauvegarder les fichiers uploadés dans la table uploads
        if (files.length > 0) {
          for (const file of files) {
            await conn.execute(
              'INSERT INTO uploads (filename, original_name, file_path, file_size, mime_type, uploaded_by, child_id, category) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
              [file.name, file.name, file.path, file.size, file.type, parentId, childId, 'document']
            );
          }
        }

        return { parentId, childId, enrollmentId };
      });

      // Envoyer un email de confirmation
      console.log('📧 Tentative d\'envoi email de confirmation à:', parent_email);
      await sendConfirmationEmail(parent_email, parent_first_name, child_first_name);
      console.log('✅ Email de confirmation envoyé');

      res.status(201).json({
        message: 'Demande d\'inscription créée avec succès',
        enrollmentId: result.enrollmentId,
        parentId: result.parentId,
        childId: result.childId
      });
    } catch (error) {
      console.error('Erreur création inscription:', error);
      res.status(500).json({ error: 'Erreur lors de la création' });
    }
  },

  // Approuver une demande d'inscription
  approveEnrollment: async (req, res) => {
    try {
      const { id } = req.params;
      const { appointment_date, admin_comment } = req.body;
      
      console.log('🔍 Approbation inscription - Paramètres:', { id, appointment_date, admin_comment });

      // Récupérer l'inscription avec les informations du parent et de l'enfant
      const [enrollments] = await db.execute(`
        SELECT e.*, u.email as parent_email, u.first_name as parent_first_name, 
               c.first_name as child_first_name
        FROM enrollments e
        JOIN users u ON e.parent_id = u.id
        JOIN children c ON e.child_id = c.id
        WHERE e.id = ?
      `, [id]);

      if (enrollments.length === 0) {
        return res.status(404).json({ error: 'Demande d\'inscription non trouvée' });
      }

      const enrollment = enrollments[0];

      // Mettre à jour le statut de l'inscription
      await db.execute(
        'UPDATE enrollments SET status = ?, appointment_date = ?, admin_notes = ?, updated_at = NOW() WHERE id = ?',
        ['approved', appointment_date || null, admin_comment || null, id]
      );

      // Mettre à jour le statut de l'enfant
      await db.execute(
        'UPDATE children SET status = ?, updated_at = NOW() WHERE id = ?',
        ['approved', enrollment.child_id]
      );

      // Activer le compte parent
      await db.execute(
        'UPDATE users SET is_active = 1, updated_at = NOW() WHERE id = ?',
        [enrollment.parent_id]
      );

      // Envoyer un email d'approbation
      try {
        console.log('📧 Tentative d\'envoi email d\'approbation à:', enrollment.parent_email);
        await sendApprovalEmail(
          enrollment.parent_email,
          enrollment.parent_first_name,
          enrollment.child_first_name,
          appointment_date
        );
        console.log('✅ Email d\'approbation envoyé avec succès');
      } catch (emailError) {
        console.error('❌ Erreur envoi email d\'approbation:', emailError.message);
      }

      res.json({
        message: 'Demande approuvée avec succès',
        enrollmentId: id,
        childId: enrollment.child_id,
        parentId: enrollment.parent_id
      });
    } catch (error) {
      console.error('Erreur approbation inscription:', error);
      res.status(500).json({ error: 'Erreur lors de l\'approbation' });
    }
  },

  // Rejeter une demande d'inscription
  rejectEnrollment: async (req, res) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      // Récupérer l'inscription avec les informations du parent et de l'enfant
      const [enrollments] = await db.execute(`
        SELECT e.*, u.email as parent_email, u.first_name as parent_first_name, 
               c.first_name as child_first_name
        FROM enrollments e
        JOIN users u ON e.parent_id = u.id
        JOIN children c ON e.child_id = c.id
        WHERE e.id = ?
      `, [id]);

      if (enrollments.length === 0) {
        return res.status(404).json({ error: 'Demande d\'inscription non trouvée' });
      }

      const enrollment = enrollments[0];

      // Mettre à jour le statut de l'inscription
      await db.execute(
        'UPDATE enrollments SET status = ?, admin_notes = ?, updated_at = NOW() WHERE id = ?',
        ['rejected', reason || null, id]
      );

      // Mettre à jour le statut de l'enfant
      await db.execute(
        'UPDATE children SET status = ?, updated_at = NOW() WHERE id = ?',
        ['rejected', enrollment.child_id]
      );

      // Envoyer un email de rejet (si la fonction existe)
      try {
        await sendRejectionEmail(
          enrollment.parent_email,
          enrollment.parent_first_name,
          enrollment.child_first_name,
          reason
        );
      } catch (emailError) {
        console.log('Erreur envoi email:', emailError.message);
      }

      res.json({ 
        message: 'Demande rejetée avec succès',
        enrollmentId: id,
        childId: enrollment.child_id
      });
    } catch (error) {
      console.error('Erreur rejet inscription:', error);
      res.status(500).json({ error: 'Erreur lors du rejet' });
    }
  },

  // Obtenir les statistiques des inscriptions
  getEnrollmentStats: async (req, res) => {
    try {
      const [totalResult] = await db.execute('SELECT COUNT(*) as total FROM enrollments');
      const [pendingResult] = await db.execute('SELECT COUNT(*) as pending FROM enrollments WHERE status = "pending"');
      const [approvedResult] = await db.execute('SELECT COUNT(*) as approved FROM enrollments WHERE status = "approved"');
      const [rejectedResult] = await db.execute('SELECT COUNT(*) as rejected FROM enrollments WHERE status = "rejected"');

      const stats = {
        total: totalResult[0].total,
        pending: pendingResult[0].pending,
        approved: approvedResult[0].approved,
        rejected: rejectedResult[0].rejected
      };

      res.json(stats);
    } catch (error) {
      console.error('Erreur statistiques inscriptions:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  },

  // Rejeter une inscription
  rejectEnrollment: async (req, res) => {
    try {
      const { id } = req.params;
      const { reason, notes } = req.body;

      // Récupérer l'inscription
      const [enrollments] = await db.execute(
        'SELECT * FROM enrollments WHERE id = ?',
        [id]
      );

      if (enrollments.length === 0) {
        return res.status(404).json({ error: 'Inscription non trouvée' });
      }

      const enrollment = enrollments[0];

      // Vérifier si l'inscription est en attente
      if (enrollment.status !== 'pending') {
        return res.status(400).json({ error: 'Cette inscription a déjà été traitée' });
      }

      // Mettre à jour le statut
      await db.execute(
        'UPDATE enrollments SET status = ?, rejection_reason = ?, notes = ?, updated_at = NOW() WHERE id = ?',
        ['rejected', reason, notes, id]
      );

      // Envoyer email de rejet
      await sendRejectionEmail(
        enrollment.parent_email,
        enrollment.parent_first_name,
        enrollment.child_first_name,
        reason
      );

      res.json({
        success: true,
        message: 'Inscription rejetée avec succès'
      });

    } catch (error) {
      console.error('Erreur rejet inscription:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
};

// Fonctions utilitaires pour l'envoi d'emails
async function sendConfirmationEmail(email, parentName, childName) {
  try {
    // Configuration SMTP (à adapter selon vos paramètres)
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
        <p>Cordialement,<br>L'équipe de la Crèche Mima Elghalia</p>
      `
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Erreur envoi email confirmation:', error);
  }
}

async function sendApprovalEmail(email, parentName, childName, appointmentDate) {
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
      subject: 'Inscription approuvée - Crèche Mima Elghalia',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h2 style="color: #4CAF50; text-align: center; margin-bottom: 30px;">🎉 Félicitations ! Votre demande a été approuvée</h2>
            
            <p style="font-size: 16px; line-height: 1.6;">Bonjour <strong>${parentName}</strong>,</p>
            
            <p style="font-size: 16px; line-height: 1.6;">
              Nous avons le plaisir de vous informer que l'inscription de <strong>${childName}</strong> 
              à la Crèche Mima Elghalia a été <span style="color: #4CAF50; font-weight: bold;">approuvée</span> !
            </p>
            
            ${appointmentDate ? `
              <div style="background-color: #e8f5e8; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p style="margin: 0; font-weight: bold; color: #2e7d32;">
                  📅 Rendez-vous fixé le : ${new Date(appointmentDate).toLocaleDateString('fr-FR')}
                </p>
              </div>
            ` : ''}
            
            <div style="background-color: #f0f8ff; padding: 20px; border-radius: 5px; margin: 25px 0;">
              <h3 style="color: #1976d2; margin-top: 0;">🔐 Accès à votre espace parent</h3>
              <p style="margin-bottom: 15px;">Votre compte parent est maintenant <strong>activé</strong> ! Vous pouvez accéder à votre espace personnel :</p>
              
              <div style="text-align: center; margin: 20px 0;">
                <a href="http://localhost:5173/login" 
                   style="background-color: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                  🚀 Accéder à mon espace parent
                </a>
              </div>
              
              <p style="font-size: 14px; color: #666;">
                <strong>Vos identifiants de connexion :</strong><br>
                Email : ${email}<br>
                Mot de passe : celui que vous avez choisi lors de l'inscription
              </p>
            </div>
            
            <div style="border-top: 2px solid #4CAF50; padding-top: 20px; margin-top: 30px;">
              <p style="font-size: 16px; line-height: 1.6;">
                Nous sommes ravis d'accueillir <strong>${childName}</strong> dans notre crèche !
              </p>
              <p style="font-size: 16px; line-height: 1.6;">
                Si vous avez des questions, n'hésitez pas à nous contacter.
              </p>
              <p style="font-size: 16px; line-height: 1.6; margin-bottom: 0;">
                Cordialement,<br>
                <strong>L'équipe de la Crèche Mima Elghalia</strong>
              </p>
            </div>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Erreur envoi email approbation:', error);
  }
}

async function sendRejectionEmail(email, parentName, childName, reason) {
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
      subject: 'Réponse à votre demande d\'inscription - Crèche Mima Elghalia',
      html: `
        <h2>Réponse à votre demande d'inscription</h2>
        <p>Bonjour ${parentName},</p>
        <p>Nous vous remercions pour votre demande d'inscription pour <strong>${childName}</strong>.</p>
        <p>Malheureusement, nous ne pouvons pas donner suite à votre demande pour le moment.</p>
        ${reason ? `<p>Motif : ${reason}</p>` : ''}
        <p>N'hésitez pas à nous recontacter ultérieurement.</p>
        <p>Cordialement,<br>L'équipe de la Crèche Mima Elghalia</p>
      `
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Erreur envoi email rejet:', error);
  }
}

module.exports = enrollmentsController;
