const fetch = require('node-fetch');

// Configuration Resend
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || 'onboarding@resend.dev';

console.log('📧 Configuration Resend:', {
  apiKeyPresent: !!RESEND_API_KEY,
  apiKeyLength: RESEND_API_KEY?.length || 0,
  emailFrom: EMAIL_FROM
});

const emailService = {
  /**
   * Envoyer un email de confirmation d'inscription
   */
  sendEnrollmentConfirmation: async (enrollmentData) => {
    try {
      if (!RESEND_API_KEY) {
        console.error('❌ RESEND_API_KEY non configuré');
        return { success: false, error: 'API Key manquante' };
      }

      const { applicant_email, applicant_first_name, child_first_name, id } = enrollmentData;
      
      const emailContent = {
        from: EMAIL_FROM,
        to: applicant_email,
        subject: 'Confirmation de votre demande d\'inscription - Crèche Mima Elghalia',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Confirmation de demande d'inscription</h2>
            <p>Bonjour ${applicant_first_name},</p>
            <p>Nous avons bien reçu votre demande d'inscription pour <strong>${child_first_name}</strong>.</p>
            <p><strong>Numéro de dossier :</strong> #${id}</p>
            <p>Nous examinerons votre demande dans les plus brefs délais et vous tiendrons informé(e) de la suite.</p>
            <hr style="border: 1px solid #e5e7eb; margin: 20px 0;">
            <p style="color: #6b7280; font-size: 14px;">
              Crèche Mima Elghalia<br>
              Email: crechemimaelghalia@gmail.com
            </p>
          </div>
        `
      };

      console.log('📧 Envoi email via Resend vers:', applicant_email);

      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(emailContent)
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('❌ Erreur Resend:', data);
        return { success: false, error: data.message || 'Erreur envoi email' };
      }

      console.log('✅ Email envoyé via Resend:', data.id);
      return { success: true, messageId: data.id };

    } catch (error) {
      console.error('❌ Erreur envoi email:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Envoyer un email d'approbation
   */
  sendEnrollmentApproval: async (enrollmentData) => {
    try {
      if (!RESEND_API_KEY) {
        return { success: false, error: 'API Key manquante' };
      }

      const { applicant_email, applicant_first_name, child_first_name } = enrollmentData;
      
      const emailContent = {
        from: EMAIL_FROM,
        to: applicant_email,
        subject: 'Demande d\'inscription approuvée - Crèche Mima Elghalia',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #16a34a;">✅ Demande approuvée</h2>
            <p>Bonjour ${applicant_first_name},</p>
            <p>Nous avons le plaisir de vous informer que la demande d'inscription de <strong>${child_first_name}</strong> a été approuvée.</p>
            <p>Nous vous contacterons prochainement pour finaliser l'inscription.</p>
            <hr style="border: 1px solid #e5e7eb; margin: 20px 0;">
            <p style="color: #6b7280; font-size: 14px;">
              Crèche Mima Elghalia<br>
              Email: crechemimaelghalia@gmail.com
            </p>
          </div>
        `
      };

      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(emailContent)
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('❌ Erreur Resend:', data);
        return { success: false, error: data.message };
      }

      console.log('✅ Email approbation envoyé:', data.id);
      return { success: true, messageId: data.id };

    } catch (error) {
      console.error('❌ Erreur envoi email:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Envoyer un email de rejet
   */
  sendEnrollmentRejection: async (enrollmentData) => {
    try {
      if (!RESEND_API_KEY) {
        return { success: false, error: 'API Key manquante' };
      }

      const { applicant_email, applicant_first_name, child_first_name, rejection_reason } = enrollmentData;
      
      const emailContent = {
        from: EMAIL_FROM,
        to: applicant_email,
        subject: 'Mise à jour de votre demande - Crèche Mima Elghalia',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #dc2626;">Mise à jour de votre demande</h2>
            <p>Bonjour ${applicant_first_name},</p>
            <p>Nous vous informons que nous ne pouvons pas donner suite à la demande d'inscription de <strong>${child_first_name}</strong>.</p>
            ${rejection_reason ? `<p><strong>Raison :</strong> ${rejection_reason}</p>` : ''}
            <p>N'hésitez pas à nous contacter pour plus d'informations.</p>
            <hr style="border: 1px solid #e5e7eb; margin: 20px 0;">
            <p style="color: #6b7280; font-size: 14px;">
              Crèche Mima Elghalia<br>
              Email: crechemimaelghalia@gmail.com
            </p>
          </div>
        `
      };

      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(emailContent)
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('❌ Erreur Resend:', data);
        return { success: false, error: data.message };
      }

      console.log('✅ Email rejet envoyé:', data.id);
      return { success: true, messageId: data.id };

    } catch (error) {
      console.error('❌ Erreur envoi email:', error);
      return { success: false, error: error.message };
    }
  }
};

module.exports = emailService;
