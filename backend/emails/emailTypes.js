/**
 * Types d'e-mails et leurs configurations
 */

const EMAIL_TYPES = {
  // E-mails d'inscription
  REGISTRATION_CONFIRMATION: {
    type: 'registration_confirmation',
    from: 'inscription@mima-elghalia.com',
    template: 'registration.html',
    subject: 'Confirmation de votre demande d\'inscription - Crèche Mima Elghalia'
  },
  
  ENROLLMENT_ACCEPTED: {
    type: 'enrollment_accepted',
    from: 'inscription@mima-elghalia.com',
    template: 'accepted.html',
    subject: 'Votre dossier a été accepté 🎉 - Crèche Mima Elghalia'
  },
  
  ENROLLMENT_MISSING_DOCS: {
    type: 'enrollment_missing_docs',
    from: 'inscription@mima-elghalia.com',
    template: 'missing-docs.html',
    subject: 'Documents manquants pour votre dossier d\'inscription - Crèche Mima Elghalia'
  },
  
  ENROLLMENT_REJECTED: {
    type: 'enrollment_rejected',
    from: 'inscription@mima-elghalia.com',
    template: 'rejected.html',
    subject: 'Mise à jour de votre demande d\'inscription - Crèche Mima Elghalia'
  },
  
  // E-mails de contact
  CONTACT_MESSAGE: {
    type: 'contact_message',
    from: 'contact@mima-elghalia.com',
    template: 'contact.html',
    subject: 'Nouveau message de contact - Crèche Mima Elghalia'
  },
  
  // E-mails généraux
  GENERAL_NOTIFICATION: {
    type: 'general_notification',
    from: 'noreply@mima-elghalia.com',
    template: null, // Utilise du HTML direct
    subject: 'Notification - Crèche Mima Elghalia'
  }
};

/**
 * Statuts d'envoi d'e-mail
 */
const EMAIL_STATUS = {
  PENDING: 'pending',
  SENT: 'sent',
  FAILED: 'failed',
  BOUNCED: 'bounced'
};

module.exports = {
  EMAIL_TYPES,
  EMAIL_STATUS
};
