const nodemailer = require('nodemailer');

// Configuration du transporteur email
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false, // true pour 465, false pour les autres ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  }
});

// Vérifier la configuration au démarrage
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Erreur configuration email:', error);
  } else {
    console.log('✅ Configuration email OK - Prêt à envoyer des emails');
  }
});

const emailService = {
  /**
   * Envoyer un email de confirmation d'inscription
   */
  sendEnrollmentConfirmation: async (enrollmentData) => {
    try {
      const { applicant_email, applicant_first_name, child_first_name, id } = enrollmentData;
      
      const mailOptions = {
        from: process.env.EMAIL_FROM || process.env.SMTP_USER,
        to: applicant_email,
        subject: 'Confirmation de votre demande d\'inscription - Crèche Mima Elghalia',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Demande d'inscription reçue</h2>
            
            <p>Bonjour ${applicant_first_name},</p>
            
            <p>Nous avons bien reçu votre demande d'inscription pour <strong>${child_first_name}</strong>.</p>
            
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0;"><strong>Numéro de dossier :</strong> #${id}</p>
              <p style="margin: 10px 0 0 0;"><strong>Statut :</strong> En attente de traitement</p>
            </div>
            
            <div style="background-color: #dbeafe; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
              <p style="margin: 0; color: #1e40af;">⏰ <strong>Délai de traitement :</strong> 48 heures (jours ouvrables)</p>
            </div>
            
            <p>Notre équipe va examiner votre dossier et vous contactera dans les 48 heures (jours ouvrables).</p>
            
            <p><strong>Prochaines étapes :</strong></p>
            <ul>
              <li>Votre dossier sera examiné par notre équipe</li>
              <li>Vous recevrez un email avec la décision (approbation ou rejet)</li>
              <li>En cas d'approbation, vous pourrez créer votre compte parent</li>
            </ul>
            
            <p>Si vous avez des questions, n'hésitez pas à nous contacter.</p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            
            <p style="color: #6b7280; font-size: 14px;">
              Crèche Mima Elghalia<br>
              Email: ${process.env.EMAIL_FROM || 'crechemimaelghalia@gmail.com'}
            </p>
          </div>
        `
      };
      
      const info = await transporter.sendMail(mailOptions);
      console.log('✅ Email envoyé:', info.messageId);
      return { success: true, messageId: info.messageId };
      
    } catch (error) {
      console.error('❌ Erreur envoi email:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Envoyer un email d'approbation avec date de RDV et lien création mot de passe
   */
  sendApprovalEmail: async (enrollmentData) => {
    try {
      const { applicant_email, applicant_first_name, child_first_name, appointment_date, enrollment_id } = enrollmentData;
      
      // Générer un token sécurisé pour la création de mot de passe
      const crypto = require('crypto');
      const token = crypto.randomBytes(32).toString('hex');
      
      // URL de création de mot de passe (à implémenter côté frontend)
      const createPasswordUrl = `${process.env.FRONTEND_URL || 'https://malekaidoudi.github.io/creche'}/create-password?token=${token}&email=${encodeURIComponent(applicant_email)}`;
      
      // Formater la date de RDV
      const rdvDate = new Date(appointment_date).toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      const mailOptions = {
        from: process.env.EMAIL_FROM || process.env.SMTP_USER,
        to: applicant_email,
        subject: 'Inscription approuvée - Crèche Mima Elghalia',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #10b981;">Félicitations ! Votre inscription est approuvée</h2>
            
            <p>Bonjour ${applicant_first_name},</p>
            
            <p>Nous avons le plaisir de vous informer que l'inscription de <strong>${child_first_name}</strong> a été approuvée.</p>
            
            <div style="background-color: #d1fae5; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
              <p style="margin: 0; color: #065f46;"><strong>✅ Statut : APPROUVÉ</strong></p>
            </div>
            
            <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
              <p style="margin: 0; color: #92400e;"><strong>📅 Rendez-vous à la crèche :</strong></p>
              <p style="margin: 10px 0 0 0; color: #92400e; font-size: 18px;"><strong>${rdvDate}</strong></p>
            </div>
            
            <p><strong>Documents à apporter le jour du rendez-vous :</strong></p>
            <ul>
              <li>📋 Carnet de santé de l'enfant</li>
              <li>📄 Acte de naissance</li>
              <li>🩺 Certificat médical récent</li>
              <li>📸 2 photos d'identité de l'enfant</li>
              <li>🆔 Pièce d'identité du parent</li>
            </ul>
            
            <div style="background-color: #e0e7ff; padding: 20px; border-radius: 8px; margin: 30px 0; text-align: center;">
              <p style="margin: 0 0 15px 0; color: #3730a3;"><strong>🔐 Créez votre compte parent</strong></p>
              <p style="margin: 0 0 15px 0; color: #4338ca;">Pour accéder à votre espace parent et suivre la scolarité de ${child_first_name}, créez votre mot de passe :</p>
              <a href="${createPasswordUrl}" style="display: inline-block; background-color: #4f46e5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">Créer mon mot de passe</a>
              <p style="margin: 15px 0 0 0; color: #6366f1; font-size: 12px;">Ce lien est valide pendant 48 heures</p>
            </div>
            
            <p>Nous sommes ravis d'accueillir ${child_first_name} dans notre crèche !</p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            
            <p style="color: #6b7280; font-size: 14px;">
              Crèche Mima Elghalia<br>
              Email: ${process.env.EMAIL_FROM || 'crechemimaelghalia@gmail.com'}
            </p>
          </div>
        `
      };
      
      const info = await transporter.sendMail(mailOptions);
      console.log('✅ Email approbation envoyé:', info.messageId);
      return { success: true, messageId: info.messageId };
      
    } catch (error) {
      console.error('❌ Erreur envoi email approbation:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Envoyer un email de rejet avec raison spécifique
   * Raisons possibles: 'age_depasse', 'maladie_contagieuse', 'dossier_manquant', 'autre'
   */
  sendRejectionEmail: async (enrollmentData, rejectionType, customReason, appointmentDate = null) => {
    try {
      const { applicant_email, applicant_first_name, child_first_name, enrollment_id } = enrollmentData;
      
      // Définir le message selon le type de rejet
      let reasonTitle = '';
      let reasonMessage = '';
      let additionalInfo = '';
      
      switch(rejectionType) {
        case 'age_depasse':
          reasonTitle = '📅 Âge de l\'enfant dépassé';
          reasonMessage = 'Malheureusement, l\'âge de votre enfant dépasse la limite d\'admission de notre crèche.';
          additionalInfo = '<p>Notre crèche accueille les enfants de 3 mois à 3 ans. Nous vous invitons à consulter d\'autres structures adaptées à l\'âge de votre enfant.</p>';
          break;
          
        case 'maladie_contagieuse':
          reasonTitle = '🩺 Maladie contagieuse';
          reasonMessage = 'Pour la sécurité de tous les enfants, nous ne pouvons pas accepter les enfants atteints de maladies contagieuses.';
          additionalInfo = '<p>Nous vous invitons à consulter votre pédiatre et à soumettre une nouvelle demande une fois que votre enfant sera rétabli.</p>';
          break;
          
        case 'dossier_manquant':
          reasonTitle = '📋 Dossier incomplet';
          reasonMessage = 'Votre dossier d\'inscription est incomplet. Certains documents obligatoires sont manquants.';
          
          // Générer un token pour l'upload des documents
          const crypto = require('crypto');
          const uploadToken = crypto.randomBytes(32).toString('hex');
          const uploadUrl = `${process.env.FRONTEND_URL || 'https://malekaidoudi.github.io/creche'}/upload-documents?token=${uploadToken}&enrollment=${enrollment_id}`;
          
          // Si une date de RDV est fournie
          if (appointmentDate) {
            const rdvDate = new Date(appointmentDate).toLocaleDateString('fr-FR', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });
            
            additionalInfo = `
              <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
                <p style="margin: 0; color: #92400e;"><strong>📅 Rendez-vous fixé :</strong></p>
                <p style="margin: 10px 0 0 0; color: #92400e; font-size: 18px;"><strong>${rdvDate}</strong></p>
              </div>
              
              <p><strong>Vous avez deux options :</strong></p>
              <ol>
                <li><strong>Télécharger les documents en ligne :</strong>
                  <div style="margin: 15px 0;">
                    <a href="${uploadUrl}" style="display: inline-block; background-color: #4f46e5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">Télécharger mes documents</a>
                  </div>
                </li>
                <li><strong>Apporter les documents le jour du rendez-vous</strong></li>
              </ol>
              
              <p><strong>Documents requis :</strong></p>
              <ul>
                <li>📋 Carnet de santé de l'enfant</li>
                <li>📄 Acte de naissance</li>
                <li>🩺 Certificat médical récent</li>
              </ul>
            `;
          } else {
            additionalInfo = `
              <p><strong>Pour compléter votre dossier, vous pouvez :</strong></p>
              <div style="margin: 20px 0; text-align: center;">
                <a href="${uploadUrl}" style="display: inline-block; background-color: #4f46e5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">Télécharger mes documents</a>
              </div>
              
              <p><strong>Documents requis :</strong></p>
              <ul>
                <li>📋 Carnet de santé de l'enfant</li>
                <li>📄 Acte de naissance</li>
                <li>🩺 Certificat médical récent</li>
              </ul>
            `;
          }
          break;
          
        case 'autre':
        default:
          reasonTitle = '📝 Autre raison';
          reasonMessage = customReason || 'Votre demande d\'inscription ne peut pas être acceptée pour le moment.';
          additionalInfo = '<p>Pour plus d\'informations, n\'hésitez pas à nous contacter directement.</p>';
          break;
      }
      
      const mailOptions = {
        from: process.env.EMAIL_FROM || process.env.SMTP_USER,
        to: applicant_email,
        subject: 'Mise à jour de votre demande d\'inscription - Crèche Mima Elghalia',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #dc2626;">Mise à jour de votre demande d'inscription</h2>
            
            <p>Bonjour ${applicant_first_name},</p>
            
            <p>Concernant la demande d'inscription de <strong>${child_first_name}</strong> :</p>
            
            <div style="background-color: #fee2e2; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
              <p style="margin: 0; color: #991b1b;"><strong>${reasonTitle}</strong></p>
              <p style="margin: 10px 0 0 0; color: #991b1b;">${reasonMessage}</p>
            </div>
            
            ${additionalInfo}
            
            <p>N'hésitez pas à nous contacter pour plus d'informations.</p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            
            <p style="color: #6b7280; font-size: 14px;">
              Crèche Mima Elghalia<br>
              Email: ${process.env.EMAIL_FROM || 'crechemimaelghalia@gmail.com'}
            </p>
          </div>
        `
      };
      
      const info = await transporter.sendMail(mailOptions);
      console.log('✅ Email rejet envoyé:', info.messageId);
      return { success: true, messageId: info.messageId };
      
    } catch (error) {
      console.error('❌ Erreur envoi email rejet:', error);
      return { success: false, error: error.message };
    }
  }
};

module.exports = emailService;
