const db = require('../config/database');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');

const enrollmentsController = {
  // Obtenir toutes les demandes d'inscription
  getAllEnrollments: async (req, res) => {
    try {
      const { page = 1, limit = 20, status = 'all' } = req.query;
      const offset = (page - 1) * limit;

      let whereClause = '1=1';
      let params = [];

      // Filtrage par statut
      if (status !== 'all') {
        whereClause += ' AND status = ?';
        params.push(status);
      }

      const query = `
        SELECT * FROM enrollments 
        WHERE ${whereClause}
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `;

      const [enrollments] = await db.execute(query, [...params, parseInt(limit), offset]);

      // Compter le total pour la pagination
      const countQuery = `SELECT COUNT(*) as total FROM enrollments WHERE ${whereClause}`;
      const [countResult] = await db.execute(countQuery, params);
      const total = countResult[0].total;

      // Parser les fichiers JSON
      const enrollmentsWithFiles = enrollments.map(enrollment => ({
        ...enrollment,
        files: enrollment.files ? JSON.parse(enrollment.files) : []
      }));

      res.json({
        enrollments: enrollmentsWithFiles,
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

      const [result] = await db.execute(`
        INSERT INTO enrollments (
          child_first_name, child_last_name, child_birth_date, child_gender,
          child_medical_info, emergency_contact_name, emergency_contact_phone,
          lunch_assistance, preferred_start_date, parent_first_name, parent_last_name,
          parent_email, parent_phone, parent_password, files
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        child_first_name, child_last_name, child_birth_date, child_gender,
        child_medical_info, emergency_contact_name, emergency_contact_phone,
        lunch_assistance || false, preferred_start_date, parent_first_name, parent_last_name,
        parent_email, parent_phone, hashedPassword, JSON.stringify(files)
      ]);

      // Envoyer un email de confirmation
      await sendConfirmationEmail(parent_email, parent_first_name, child_first_name);

      res.status(201).json({
        message: 'Demande d\'inscription créée avec succès',
        enrollmentId: result.insertId
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

      // Vérifier que la demande existe
      const [enrollments] = await db.execute(
        'SELECT * FROM enrollments WHERE id = ?',
        [id]
      );

      if (enrollments.length === 0) {
        return res.status(404).json({ error: 'Demande d\'inscription non trouvée' });
      }

      const enrollment = enrollments[0];

      // Vérifier si le parent existe déjà
      const [existingParents] = await db.execute(
        'SELECT id FROM users WHERE email = ?',
        [enrollment.parent_email]
      );

      let parentId = null;

      // Créer le compte parent si il n'existe pas
      if (existingParents.length === 0 && enrollment.parent_password) {
        const [parentResult] = await db.execute(`
          INSERT INTO users (first_name, last_name, email, password, phone, role)
          VALUES (?, ?, ?, ?, ?, 'parent')
        `, [
          enrollment.parent_first_name,
          enrollment.parent_last_name,
          enrollment.parent_email,
          enrollment.parent_password,
          enrollment.parent_phone
        ]);
        parentId = parentResult.insertId;
      } else if (existingParents.length > 0) {
        parentId = existingParents[0].id;
      }

      // Créer l'enfant dans la table children
      const [childResult] = await db.execute(`
        INSERT INTO children (
          first_name, last_name, birth_date, gender, parent_id,
          medical_info, emergency_contact_name, emergency_contact_phone,
          lunch_assistance, enrollment_date
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `, [
        enrollment.child_first_name,
        enrollment.child_last_name,
        enrollment.child_birth_date,
        enrollment.child_gender,
        parentId,
        enrollment.child_medical_info,
        enrollment.emergency_contact_name,
        enrollment.emergency_contact_phone,
        enrollment.lunch_assistance
      ]);

      // Mettre à jour le statut de la demande
      await db.execute(`
        UPDATE enrollments 
        SET status = 'approved', appointment_date = ?, admin_comment = ?, updated_at = NOW()
        WHERE id = ?
      `, [appointment_date, admin_comment, id]);

      // Envoyer un email d'approbation
      await sendApprovalEmail(
        enrollment.parent_email,
        enrollment.parent_first_name,
        enrollment.child_first_name,
        appointment_date
      );

      res.json({
        message: 'Demande approuvée avec succès',
        childId: childResult.insertId,
        parentId
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

      // Vérifier que la demande existe
      const [enrollments] = await db.execute(
        'SELECT * FROM enrollments WHERE id = ?',
        [id]
      );

      if (enrollments.length === 0) {
        return res.status(404).json({ error: 'Demande d\'inscription non trouvée' });
      }

      const enrollment = enrollments[0];

      // Mettre à jour le statut de la demande
      await db.execute(`
        UPDATE enrollments 
        SET status = 'rejected', admin_comment = ?, updated_at = NOW()
        WHERE id = ?
      `, [reason, id]);

      // Envoyer un email de rejet
      await sendRejectionEmail(
        enrollment.parent_email,
        enrollment.parent_first_name,
        enrollment.child_first_name,
        reason
      );

      res.json({ message: 'Demande rejetée avec succès' });
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
  }
};

// Fonctions utilitaires pour l'envoi d'emails
async function sendConfirmationEmail(email, parentName, childName) {
  try {
    // Configuration SMTP (à adapter selon vos paramètres)
    const transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      }
    });

    const mailOptions = {
      from: process.env.SMTP_USER,
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
    const transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      }
    });

    const mailOptions = {
      from: process.env.SMTP_USER,
      to: email,
      subject: 'Inscription approuvée - Crèche Mima Elghalia',
      html: `
        <h2>Félicitations ! Votre demande a été approuvée</h2>
        <p>Bonjour ${parentName},</p>
        <p>Nous avons le plaisir de vous informer que l'inscription de <strong>${childName}</strong> a été approuvée.</p>
        ${appointmentDate ? `<p>Rendez-vous fixé le : <strong>${new Date(appointmentDate).toLocaleDateString()}</strong></p>` : ''}
        <p>Vous pouvez maintenant accéder à votre espace parent avec vos identifiants.</p>
        <p>Cordialement,<br>L'équipe de la Crèche Mima Elghalia</p>
      `
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Erreur envoi email approbation:', error);
  }
}

async function sendRejectionEmail(email, parentName, childName, reason) {
  try {
    const transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      }
    });

    const mailOptions = {
      from: process.env.SMTP_USER,
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
