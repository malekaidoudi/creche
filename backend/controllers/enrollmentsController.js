const db = require('../config/database');
const nodemailer = require('nodemailer');

const enrollmentsController = {
  // Obtenir toutes les demandes d'inscription
  getAllEnrollments: async (req, res) => {
    try {
      console.log('📋 Récupération des inscriptions...');
      
      const { page = 1, limit = 100, status = 'all' } = req.query;
      
      // Récupérer les inscriptions de base
      let query = 'SELECT * FROM enrollments';
      let params = [];

      if (status !== 'all') {
        query += ' WHERE status = ?';
        params.push(status);
      }

      // Ajouter LIMIT directement dans la requête pour éviter les problèmes de paramètres
      const limitValue = parseInt(limit) || 100;
      query += ` ORDER BY created_at DESC LIMIT ${limitValue}`;

      console.log('🔍 Exécution requête enrollments:', query, params);
      const [enrollments] = await db.execute(query, params);
      console.log(`✅ ${enrollments.length} inscriptions récupérées`);

      // Enrichir chaque inscription avec les données complètes
      const enrichedEnrollments = [];
      
      for (const enrollment of enrollments) {
        try {
          // Récupérer les données du parent
          const [parentData] = await db.execute(
            'SELECT first_name, last_name, email, phone FROM users WHERE id = ?',
            [enrollment.parent_id]
          );
          
          // Récupérer les données de l'enfant
          const [childData] = await db.execute(
            'SELECT first_name, last_name, birth_date, gender, medical_info FROM children WHERE id = ?',
            [enrollment.child_id]
          );
          
          // Récupérer les fichiers associés à l'enfant
          const [files] = await db.execute(
            'SELECT id, filename, original_name, file_path, file_size, mime_type FROM uploads WHERE child_id = ?',
            [enrollment.child_id]
          );

          const parent = parentData[0] || {};
          const child = childData[0] || {};
          

          // Créer l'inscription enrichie avec tous les champs
          const enrichedEnrollment = {
            // Données de l'inscription
            id: enrollment.id,
            parent_id: enrollment.parent_id,
            child_id: enrollment.child_id,
            enrollment_date: enrollment.enrollment_date,
            status: enrollment.status,
            lunch_assistance: enrollment.lunch_assistance,
            regulation_accepted: enrollment.regulation_accepted,
            appointment_date: enrollment.appointment_date,
            appointment_time: enrollment.appointment_time,
            admin_notes: enrollment.admin_notes,
            created_at: enrollment.created_at,
            updated_at: enrollment.updated_at,
            
            // Données du parent
            parent_first_name: parent.first_name || '',
            parent_last_name: parent.last_name || '',
            parent_email: parent.email || '',
            parent_phone: parent.phone || '',
            
            // Données de l'enfant
            child_first_name: child.first_name || '',
            child_last_name: child.last_name || '',
            child_birth_date: child.birth_date || null,
            child_gender: child.gender || '',
            medical_info: child.medical_info || '',
            
            // Fichiers
            files: files || []
          };
          
          
          enrichedEnrollments.push(enrichedEnrollment);

        } catch (enrichError) {
          console.error('❌ Erreur enrichissement inscription:', enrichError);
          // Ajouter l'inscription de base en cas d'erreur
          enrichedEnrollments.push({
            ...enrollment,
            files: [],
            parent_first_name: '',
            parent_last_name: '',
            parent_email: '',
            parent_phone: '',
            child_first_name: '',
            child_last_name: '',
            child_birth_date: null,
            child_gender: '',
            medical_info: ''
          });
        }
      }

      res.json({
        enrollments: enrichedEnrollments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: enrichedEnrollments.length,
          pages: Math.ceil(enrichedEnrollments.length / limit)
        }
      });

    } catch (error) {
      console.error('❌ Erreur getAllEnrollments:', error);
      console.error('Stack:', error.stack);
      res.status(500).json({ error: 'Erreur lors de la récupération des inscriptions' });
    }
  },

  // Approuver une demande d'inscription
  approveEnrollment: async (req, res) => {
    try {
      const { id } = req.params;
      const { appointment_date, admin_comment } = req.body;
      
      console.log('🔍 Approbation inscription ID:', id);
      console.log('📅 Date RDV:', appointment_date);
      console.log('💬 Commentaire:', admin_comment);

      // Récupérer l'inscription avec les infos parent/enfant
      const [enrollments] = await db.execute(`
        SELECT e.*, 
               u.email as parent_email, u.first_name as parent_first_name, 
               c.first_name as child_first_name
        FROM enrollments e
        JOIN users u ON e.parent_id = u.id
        JOIN children c ON e.child_id = c.id
        WHERE e.id = ?
      `, [id]);

      if (enrollments.length === 0) {
        return res.status(404).json({ error: 'Inscription non trouvée' });
      }

      const enrollment = enrollments[0];

      if (enrollment.status !== 'pending') {
        return res.status(400).json({ error: 'Cette inscription a déjà été traitée' });
      }

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

      // Envoyer l'email d'approbation
      try {
        console.log('📧 Envoi email d\'approbation à:', enrollment.parent_email);
        await sendApprovalEmail(
          enrollment.parent_email,
          enrollment.parent_first_name,
          enrollment.child_first_name,
          appointment_date,
          admin_comment
        );
        console.log('✅ Email d\'approbation envoyé');
      } catch (emailError) {
        console.error('❌ Erreur envoi email:', emailError);
        // Ne pas faire échouer l'approbation si l'email échoue
      }

      res.json({
        message: 'Demande approuvée avec succès',
        enrollmentId: id,
        childId: enrollment.child_id,
        parentId: enrollment.parent_id
      });

    } catch (error) {
      console.error('❌ Erreur approbation:', error);
      res.status(500).json({ error: 'Erreur lors de l\'approbation' });
    }
  },

  // Rejeter une demande d'inscription
  rejectEnrollment: async (req, res) => {
    try {
      const { id } = req.params;
      const { reason, admin_comment } = req.body;

      console.log('🔍 Rejet inscription ID:', id);
      console.log('📝 Raison:', reason);
      console.log('💬 Commentaire:', admin_comment);

      // Récupérer l'inscription avec les infos parent/enfant
      const [enrollments] = await db.execute(`
        SELECT e.*, 
               u.email as parent_email, u.first_name as parent_first_name, 
               c.first_name as child_first_name
        FROM enrollments e
        JOIN users u ON e.parent_id = u.id
        JOIN children c ON e.child_id = c.id
        WHERE e.id = ?
      `, [id]);

      if (enrollments.length === 0) {
        return res.status(404).json({ error: 'Inscription non trouvée' });
      }

      const enrollment = enrollments[0];

      if (enrollment.status !== 'pending') {
        return res.status(400).json({ error: 'Cette inscription a déjà été traitée' });
      }

      // Mettre à jour le statut
      await db.execute(
        'UPDATE enrollments SET status = ?, rejection_reason = ?, admin_notes = ?, updated_at = NOW() WHERE id = ?',
        ['rejected', reason || null, admin_comment || null, id]
      );

      // Envoyer l'email de rejet
      try {
        console.log('📧 Envoi email de rejet à:', enrollment.parent_email);
        await sendRejectionEmail(
          enrollment.parent_email,
          enrollment.parent_first_name,
          enrollment.child_first_name,
          reason,
          admin_comment
        );
        console.log('✅ Email de rejet envoyé');
      } catch (emailError) {
        console.error('❌ Erreur envoi email de rejet:', emailError);
        // Ne pas faire échouer le rejet si l'email échoue
      }

      res.json({
        message: 'Demande rejetée avec succès',
        enrollmentId: id
      });

    } catch (error) {
      console.error('❌ Erreur rejet:', error);
      res.status(500).json({ error: 'Erreur lors du rejet' });
    }
  },

  // Obtenir une inscription par ID
  getEnrollmentById: async (req, res) => {
    try {
      const { id } = req.params;

      const [enrollments] = await db.execute(
        'SELECT * FROM enrollments WHERE id = ?',
        [id]
      );

      if (enrollments.length === 0) {
        return res.status(404).json({ error: 'Inscription non trouvée' });
      }

      res.json(enrollments[0]);
    } catch (error) {
      console.error('❌ Erreur getEnrollmentById:', error);
      res.status(500).json({ error: 'Erreur lors de la récupération' });
    }
  },

  // Obtenir les statistiques des inscriptions
  getEnrollmentStats: async (req, res) => {
    try {
      // Compter par statut
      const [pending] = await db.execute('SELECT COUNT(*) as count FROM enrollments WHERE status = ?', ['pending']);
      const [approved] = await db.execute('SELECT COUNT(*) as count FROM enrollments WHERE status = ?', ['approved']);
      const [rejected] = await db.execute('SELECT COUNT(*) as count FROM enrollments WHERE status = ?', ['rejected']);
      const [total] = await db.execute('SELECT COUNT(*) as count FROM enrollments');

      res.json({
        pending: pending[0].count,
        approved: approved[0].count,
        rejected: rejected[0].count,
        total: total[0].count
      });
    } catch (error) {
      console.error('❌ Erreur getEnrollmentStats:', error);
      res.status(500).json({ error: 'Erreur lors de la récupération des statistiques' });
    }
  },

  // Créer une nouvelle inscription (publique)
  createEnrollment: async (req, res) => {
    try {
      console.log('📝 Création nouvelle inscription...');
      
      // Cette fonction sera implémentée plus tard
      // Pour l'instant, retournons une erreur temporaire
      res.status(501).json({ error: 'Fonction en cours d\'implémentation' });
      
    } catch (error) {
      console.error('❌ Erreur createEnrollment:', error);
      res.status(500).json({ error: 'Erreur lors de la création' });
    }
  }
};

// Fonction pour envoyer l'email d'approbation
async function sendApprovalEmail(email, parentName, childName, appointmentDate, adminComment) {
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

    const appointmentInfo = appointmentDate 
      ? `<div style="background-color: #e8f5e8; padding: 15px; border-radius: 5px; margin: 20px 0;">
           <p style="margin: 0; font-weight: bold; color: #2e7d32;">
             📅 Rendez-vous fixé le : ${new Date(appointmentDate).toLocaleDateString('fr-FR')}
           </p>
         </div>`
      : '';

    const commentInfo = adminComment
      ? `<div style="background-color: #f0f8ff; padding: 15px; border-radius: 5px; margin: 20px 0;">
           <p style="margin: 0; font-style: italic; color: #1976d2;">
             💬 "${adminComment}"
           </p>
         </div>`
      : '';

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
            
            ${appointmentInfo}
            ${commentInfo}
            
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
    throw error;
  }
}

// Fonction pour envoyer l'email de rejet
async function sendRejectionEmail(email, parentName, childName, reason, adminComment) {
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

    const reasonInfo = reason 
      ? `<div style="background-color: #fef2f2; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ef4444;">
           <h4 style="margin: 0 0 10px 0; color: #dc2626; font-weight: bold;">Motif du rejet :</h4>
           <p style="margin: 0; color: #7f1d1d;">${reason}</p>
         </div>`
      : '';

    const commentInfo = adminComment
      ? `<div style="background-color: #f0f8ff; padding: 15px; border-radius: 5px; margin: 20px 0;">
           <h4 style="margin: 0 0 10px 0; color: #1976d2; font-weight: bold;">Commentaires administratifs :</h4>
           <p style="margin: 0; color: #1565c0; font-style: italic;">"${adminComment}"</p>
         </div>`
      : '';

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.SMTP_USER,
      to: email,
      subject: 'Demande d\'inscription rejetée - Crèche Mima Elghalia',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h2 style="color: #dc2626; text-align: center; margin-bottom: 30px;">Demande d'inscription non retenue</h2>
            
            <p style="font-size: 16px; line-height: 1.6;">Bonjour <strong>${parentName}</strong>,</p>
            
            <p style="font-size: 16px; line-height: 1.6;">
              Nous vous remercions pour votre demande d'inscription de <strong>${childName}</strong> 
              à la Crèche Mima Elghalia.
            </p>
            
            <p style="font-size: 16px; line-height: 1.6;">
              Après examen de votre dossier, nous regrettons de vous informer que nous ne pouvons pas 
              donner suite favorablement à votre demande pour le moment.
            </p>
            
            ${reasonInfo}
            ${commentInfo}
            
            <div style="background-color: #f0f8ff; padding: 20px; border-radius: 5px; margin: 25px 0;">
              <h3 style="color: #1976d2; margin-top: 0;">💡 Que faire maintenant ?</h3>
              <ul style="margin: 10px 0; padding-left: 20px; color: #1565c0;">
                <li>Vous pouvez corriger les éléments mentionnés et soumettre une nouvelle demande</li>
                <li>N'hésitez pas à nous contacter pour plus d'informations</li>
                <li>Nous vous encourageons à renouveler votre demande ultérieurement</li>
              </ul>
            </div>
            
            <div style="border-top: 2px solid #dc2626; padding-top: 20px; margin-top: 30px;">
              <p style="font-size: 16px; line-height: 1.6;">
                Nous vous remercions de votre compréhension et restons à votre disposition 
                pour toute question concernant cette décision.
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
    console.error('Erreur envoi email rejet:', error);
    throw error;
  }
}

// Ajouter la méthode pour récupérer les inscriptions d'un parent
enrollmentsController.getEnrollmentsByParent = async (req, res) => {
  try {
    const { parentId } = req.params;
    console.log(`📋 Récupération des inscriptions pour le parent ${parentId}...`);
    
    // Vérifier que l'utilisateur connecté peut accéder à ces données
    console.log('🔐 Vérification permissions:', {
      userRole: req.user.role,
      userId: req.user.id,
      requestedParentId: parentId
    });
    
    if (req.user.role !== 'admin' && req.user.role !== 'staff' && req.user.id != parentId) {
      console.log('❌ Accès refusé pour l\'utilisateur:', req.user.id, 'demandant parent:', parentId);
      return res.status(403).json({ error: 'Accès non autorisé' });
    }
    
    console.log('✅ Accès autorisé pour l\'utilisateur:', req.user.id);

    // Récupérer les inscriptions du parent avec les données des enfants
    const query = `
      SELECT 
        e.*,
        c.first_name as child_first_name,
        c.last_name as child_last_name,
        c.birth_date as child_birth_date,
        c.gender as child_gender
      FROM enrollments e
      LEFT JOIN children c ON e.child_id = c.id
      WHERE e.parent_id = ?
      ORDER BY e.created_at DESC
    `;

    const [enrollments] = await db.execute(query, [parentId]);
    console.log(`✅ ${enrollments.length} inscriptions trouvées pour le parent ${parentId}`);

    res.json({
      success: true,
      enrollments: enrollments
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des inscriptions du parent:', error);
    res.status(500).json({ 
      error: 'Erreur interne du serveur',
      details: error.message 
    });
  }
};

module.exports = enrollmentsController;
