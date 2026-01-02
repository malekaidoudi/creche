// Charger les variables d'environnement
require('dotenv').config();

const { Resend } = require('resend');
const nodemailer = require('nodemailer');
const fs = require('fs').promises;
const path = require('path');
const { EMAIL_TYPES, EMAIL_STATUS } = require('./emailTypes');
const db = require('../config/db_postgres');
const SettingsService = require('../services/SettingsService');

// Initialiser Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// Initialiser Nodemailer (fallback SMTP Hostinger)
let smtpTransporter = null;
if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
  smtpTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 465,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
  console.log('📧 SMTP Hostinger configuré comme fallback');
}

/**
 * Service d'envoi d'e-mails avec Resend
 */
class EmailService {
  /**
   * Charger un template HTML
   */
  async loadTemplate(templateName) {
    try {
      const templatePath = path.join(__dirname, 'templates', templateName);
      const template = await fs.readFile(templatePath, 'utf-8');
      return template;
    } catch (error) {
      console.error(`❌ Erreur chargement template ${templateName}:`, error);
      throw new Error(`Template ${templateName} introuvable`);
    }
  }

  /**
   * Remplacer les variables dans le template
   */
  replaceVariables(template, variables) {
    let result = template;

    // Remplacer les variables simples {{variable}}
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, variables[key] || '');
    });

    // Gérer les conditions {{#if variable}}...{{/if}}
    result = result.replace(/{{#if\s+(\w+)}}([\s\S]*?){{\/if}}/g, (match, varName, content) => {
      return variables[varName] ? content : '';
    });

    // Gérer les boucles {{#each array}}...{{/each}}
    result = result.replace(/{{#each\s+(\w+)}}([\s\S]*?){{\/each}}/g, (match, varName, content) => {
      const array = variables[varName];
      if (!Array.isArray(array) || array.length === 0) return '';

      return array.map(item => {
        let itemContent = content;
        if (typeof item === 'string') {
          itemContent = itemContent.replace(/{{this}}/g, item);
        } else {
          Object.keys(item).forEach(key => {
            itemContent = itemContent.replace(new RegExp(`{{${key}}}`, 'g'), item[key]);
          });
        }
        return itemContent;
      }).join('');
    });

    return result;
  }

  /**
   * Enregistrer l'envoi dans la base de données
   */
  async logEmail(emailData) {
    try {
      const query = `
        INSERT INTO email_logs (
          email_type, recipient_email, sender_email, subject, 
          status, resend_id, error_message, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id
      `;

      const values = [
        emailData.type,
        emailData.to,
        emailData.from,
        emailData.subject,
        emailData.status,
        emailData.resendId || null,
        emailData.error || null,
        JSON.stringify(emailData.metadata || {})
      ];

      const result = await db.query(query, values);
      return result.rows[0].id;
    } catch (error) {
      console.error('❌ Erreur enregistrement email log:', error);
      // Ne pas bloquer l'envoi si le log échoue
      return null;
    }
  }

  /**
   * Récupérer les données de contact depuis nursery_settings
   */
  async getContactData() {
    try {
      const { settings } = await SettingsService.getAllSettings();
      return {
        contact_email: settings.email?.fr || 'crechemimaelghalia@gmail.com',
        contact_phone: settings.phone?.fr || '+216 25 95 35 32',
        nursery_name: settings.nursery_name?.fr || 'Crèche Mima Elghalia',
        address: settings.address?.fr || 'Tunisie'
      };
    } catch (error) {
      console.warn('⚠️ Impossible de récupérer les données de contact, utilisation des valeurs par défaut:', error.message);
      return {
        contact_email: 'crechemimaelghalia@gmail.com',
        contact_phone: '+216 25 95 35 32',
        nursery_name: 'Crèche Mima Elghalia',
        address: 'Tunisie'
      };
    }
  }

  /**
   * Envoyer un e-mail
   */
  async sendEmail(emailType, recipient, variables = {}) {
    try {
      if (!process.env.RESEND_API_KEY) {
        throw new Error('RESEND_API_KEY non configurée');
      }

      const config = EMAIL_TYPES[emailType];
      if (!config) {
        throw new Error(`Type d'email inconnu: ${emailType}`);
      }

      // Récupérer les données de contact dynamiques
      const contactData = await this.getContactData();

      // Fusionner les variables avec les données de contact
      const allVariables = {
        ...contactData,
        ...variables
      };

      // Charger et préparer le template
      let htmlContent;
      if (config.template) {
        const template = await this.loadTemplate(config.template);
        htmlContent = this.replaceVariables(template, allVariables);
      } else {
        htmlContent = variables.html || '<p>Contenu de l\'email</p>';
      }

      // Préparer l'e-mail
      const emailData = {
        from: `Crèche Mima Elghalia <${config.from}>`,
        to: recipient,
        subject: variables.subject || config.subject,
        html: htmlContent
      };

      console.log(`📧 Envoi email ${emailType} vers ${recipient}...`);

      let emailId = null;
      let usedSmtp = false;

      // Priorité 1: SMTP Hostinger (plus fiable pour emails vers Hostinger)
      if (smtpTransporter) {
        console.log('📧 Tentative envoi via SMTP Hostinger...');
        try {
          const smtpResult = await smtpTransporter.sendMail({
            from: emailData.from,
            to: emailData.to,
            subject: emailData.subject,
            html: emailData.html
          });
          emailId = smtpResult.messageId;
          usedSmtp = true;
          console.log(`✅ Email envoyé via SMTP Hostinger (ID: ${emailId})`);
        } catch (smtpError) {
          console.warn(`⚠️ SMTP Hostinger a échoué: ${smtpError.message}`);
          // Fallback vers Resend
          try {
            const response = await resend.emails.send(emailData);
            emailId = response.data?.id || response.id;
            console.log(`✅ Email envoyé via Resend (fallback) (ID: ${emailId})`);
          } catch (resendError) {
            console.error(`❌ Resend a aussi échoué: ${resendError.message}`);
            throw new Error(`SMTP: ${smtpError.message} | Resend: ${resendError.message}`);
          }
        }
      } else {
        // Pas de SMTP configuré, utiliser Resend
        console.log('📧 SMTP non configuré, envoi via Resend...');
        try {
          const response = await resend.emails.send(emailData);
          emailId = response.data?.id || response.id;
          console.log(`✅ Email envoyé via Resend (ID: ${emailId})`);
        } catch (resendError) {
          console.error(`❌ Resend a échoué: ${resendError.message}`);
          throw resendError;
        }
      }

      // Enregistrer dans les logs
      await this.logEmail({
        type: config.type,
        to: recipient,
        from: config.from,
        subject: emailData.subject,
        status: EMAIL_STATUS.SENT,
        resendId: emailId,
        metadata: { ...variables, usedSmtp }
      });

      return {
        success: true,
        messageId: emailId,
        type: emailType,
        usedSmtp
      };

    } catch (error) {
      console.error(`❌ Erreur envoi email ${emailType}:`, error);

      // Enregistrer l'échec
      await this.logEmail({
        type: emailType,
        to: recipient,
        from: EMAIL_TYPES[emailType]?.from || 'unknown',
        subject: EMAIL_TYPES[emailType]?.subject || 'Unknown',
        status: EMAIL_STATUS.FAILED,
        error: error.message,
        metadata: variables
      });

      return {
        success: false,
        error: error.message,
        type: emailType
      };
    }
  }

  /**
   * Envoyer un e-mail de confirmation d'inscription
   */
  async sendRegistrationConfirmation(enrollmentData) {
    return this.sendEmail('REGISTRATION_CONFIRMATION', enrollmentData.applicant_email, {
      applicant_first_name: enrollmentData.applicant_first_name,
      child_first_name: enrollmentData.child_first_name,
      enrollment_id: enrollmentData.id
    });
  }

  /**
   * Envoyer un e-mail d'acceptation avec date de RDV
   */
  async sendAcceptedEmail(enrollmentData, appointmentDate, passwordLink) {
    // La date peut déjà être formatée ou être un objet Date/string ISO
    let formattedDate;

    if (typeof appointmentDate === 'string' && appointmentDate.includes(' ')) {
      // Date déjà formatée (ex: "samedi 29 novembre 2025 à 10:00")
      formattedDate = appointmentDate;
    } else {
      // Date brute, on la formate
      const dateObj = new Date(appointmentDate);
      if (isNaN(dateObj.getTime())) {
        console.warn('⚠️ Date de RDV invalide:', appointmentDate);
        formattedDate = 'Date à confirmer';
      } else {
        formattedDate = dateObj.toLocaleDateString('fr-FR', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
    }

    return this.sendEmail('ENROLLMENT_ACCEPTED', enrollmentData.applicant_email, {
      applicant_first_name: enrollmentData.applicant_first_name,
      child_first_name: enrollmentData.child_first_name,
      appointment_date: formattedDate,
      password_link: passwordLink
    });
  }

  /**
   * Envoyer un e-mail pour documents manquants
   */
  async sendMissingDocsEmail(enrollmentData, missingDocs, appointmentDate = null, uploadLink) {
    const variables = {
      applicant_first_name: enrollmentData.applicant_first_name,
      child_first_name: enrollmentData.child_first_name,
      missing_documents: missingDocs,
      upload_link: uploadLink
    };

    if (appointmentDate) {
      // La date peut déjà être formatée ou être un objet Date/string ISO
      if (typeof appointmentDate === 'string' && appointmentDate.includes(' ')) {
        // Date déjà formatée
        variables.appointment_date = appointmentDate;
      } else {
        // Date brute, on la formate
        const dateObj = new Date(appointmentDate);
        if (!isNaN(dateObj.getTime())) {
          variables.appointment_date = dateObj.toLocaleDateString('fr-FR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
        } else {
          console.warn('⚠️ Date de RDV invalide pour missing docs:', appointmentDate);
        }
      }
    }

    return this.sendEmail('ENROLLMENT_MISSING_DOCS', enrollmentData.applicant_email, variables);
  }

  /**
   * Envoyer un e-mail de rejet
   */
  async sendRejectionEmail(enrollmentData, rejectionReason) {
    return this.sendEmail('ENROLLMENT_REJECTED', enrollmentData.applicant_email, {
      applicant_first_name: enrollmentData.applicant_first_name,
      child_first_name: enrollmentData.child_first_name,
      rejection_reason: rejectionReason
    });
  }

  /**
   * Envoyer un message de contact à l'équipe
   * Utilise SMTP Hostinger en priorité (plus fiable pour emails internes)
   * Fallback vers Resend si SMTP échoue
   */
  async sendContactMessage(contactData) {
    const timestamp = new Date().toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // Récupérer l'email de contact depuis la base de données
    let contactEmail = 'contact@mima-elghalia.com';
    try {
      const result = await db.query(
        "SELECT value_fr FROM nursery_settings WHERE setting_key = 'contact_email' AND is_active = true"
      );
      if (result.rows.length > 0 && result.rows[0].value_fr) {
        contactEmail = result.rows[0].value_fr;
      }
    } catch (err) {
      console.warn('⚠️ Impossible de récupérer contact_email depuis settings');
    }

    console.log(`📧 Envoi message contact vers: ${contactEmail}`);

    // Charger le template
    const config = EMAIL_TYPES.CONTACT_MESSAGE;
    const contactDataForEmail = await this.getContactData();
    const template = await this.loadTemplate(config.template);
    const htmlContent = this.replaceVariables(template, {
      ...contactDataForEmail,
      sender_name: contactData.name,
      sender_email: contactData.email,
      sender_phone: contactData.phone || null,
      subject: contactData.subject || 'Nouveau message',
      message: contactData.message,
      timestamp: timestamp
    });

    const emailData = {
      from: `Crèche Mima Elghalia <${config.from}>`,
      to: contactEmail,
      subject: `${contactData.subject || 'Nouveau message'} - Contact`,
      html: htmlContent
    };

    let emailId = null;
    let usedSmtp = false;

    // Priorité 1: SMTP Hostinger (plus fiable pour emails vers Hostinger)
    if (smtpTransporter) {
      console.log('📧 Tentative envoi via SMTP Hostinger...');
      try {
        const smtpResult = await smtpTransporter.sendMail(emailData);
        emailId = smtpResult.messageId;
        usedSmtp = true;
        console.log(`✅ Email contact envoyé via SMTP Hostinger (ID: ${emailId})`);
      } catch (smtpError) {
        console.warn(`⚠️ SMTP Hostinger a échoué: ${smtpError.message}`);
        // Fallback vers Resend
        try {
          const response = await resend.emails.send(emailData);
          emailId = response.data?.id || response.id;
          console.log(`✅ Email contact envoyé via Resend (fallback) (ID: ${emailId})`);
        } catch (resendError) {
          console.error(`❌ Resend a aussi échoué: ${resendError.message}`);
          throw new Error(`SMTP: ${smtpError.message} | Resend: ${resendError.message}`);
        }
      }
    } else {
      // Pas de SMTP configuré, utiliser Resend
      console.log('📧 SMTP non configuré, envoi via Resend...');
      try {
        const response = await resend.emails.send(emailData);
        emailId = response.data?.id || response.id;
        console.log(`✅ Email contact envoyé via Resend (ID: ${emailId})`);
      } catch (resendError) {
        console.error(`❌ Resend a échoué: ${resendError.message}`);
        throw resendError;
      }
    }

    // Log l'envoi
    await this.logEmail({
      type: config.type,
      to: contactEmail,
      from: config.from,
      subject: emailData.subject,
      status: EMAIL_STATUS.SENT,
      resendId: emailId,
      metadata: { ...contactData, timestamp, usedSmtp }
    });

    return {
      success: true,
      messageId: emailId,
      usedSmtp
    };
  }

  /**
   * Envoyer un e-mail de confirmation de rendez-vous
   */
  async sendAppointmentConfirmation(enrollmentData, appointmentDate) {
    // Formater la date
    const formattedDate = new Date(appointmentDate).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    return this.sendEmail('APPOINTMENT_CONFIRMATION', enrollmentData.applicant_email, {
      applicant_first_name: enrollmentData.applicant_first_name,
      child_first_name: enrollmentData.child_first_name,
      appointment_date: formattedDate
    });
  }

  /**
   * Envoyer un e-mail générique
   */
  async sendGenericEmail(recipient, subject, htmlContent) {
    return this.sendEmail('GENERAL_NOTIFICATION', recipient, {
      subject: subject,
      html: htmlContent
    });
  }
}

// Export singleton
module.exports = new EmailService();
