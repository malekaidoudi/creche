/**
 * Service d'envoi d'emails pour les événements
 * Utilise SMTP Hostinger
 */

const nodemailer = require('nodemailer');

// Initialiser SMTP Hostinger
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
}

/**
 * Envoyer un email de rappel d'événement
 */
async function sendEventReminder(event, user, reminderOffset) {
  try {
    if (!smtpTransporter) {
      console.warn('⚠️ SMTP non configuré, email rappel non envoyé');
      return { success: false, error: 'SMTP non configuré' };
    }

    const offsetText = formatOffset(reminderOffset);

    const result = await smtpTransporter.sendMail({
      from: 'Crèche Mima Elghalia <contact@mima-elghalia.com>',
      to: user.email,
      subject: `Rappel: ${event.title} - ${offsetText}`,
      html: generateReminderEmailHTML(event, user, offsetText),
    });

    console.log('✅ Email rappel envoyé via SMTP:', result.messageId);
    return { success: true, messageId: result.messageId };

  } catch (error) {
    console.error('❌ Erreur sendEventReminder:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Envoyer un email de notification d'événement assigné
 */
async function sendEventAssigned(event, assignedUser, creatorUser) {
  try {
    if (!smtpTransporter) {
      console.warn('⚠️ SMTP non configuré, email assignation non envoyé');
      return { success: false, error: 'SMTP non configuré' };
    }

    const result = await smtpTransporter.sendMail({
      from: 'Crèche Mima Elghalia <contact@mima-elghalia.com>',
      to: assignedUser.email,
      subject: `Nouvelle tâche assignée: ${event.title}`,
      html: generateAssignedEmailHTML(event, assignedUser, creatorUser),
    });

    console.log('✅ Email assignation envoyé via SMTP:', result.messageId);
    return { success: true, messageId: result.messageId };

  } catch (error) {
    console.error('❌ Erreur sendEventAssigned:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Envoyer un email de notification d'événement en retard
 */
async function sendEventOverdue(event, user) {
  try {
    if (!smtpTransporter) {
      console.warn('⚠️ SMTP non configuré, email retard non envoyé');
      return { success: false, error: 'SMTP non configuré' };
    }

    const result = await smtpTransporter.sendMail({
      from: 'Crèche Mima Elghalia <contact@mima-elghalia.com>',
      to: user.email,
      subject: `⚠️ Événement en retard: ${event.title}`,
      html: generateOverdueEmailHTML(event, user),
    });

    console.log('✅ Email retard envoyé via SMTP:', result.messageId);
    return { success: true, messageId: result.messageId };

  } catch (error) {
    console.error('❌ Erreur sendEventOverdue:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Envoyer un email de notification d'anniversaire
 */
async function sendBirthdayReminder(child, users, daysUntil) {
  try {
    if (!smtpTransporter) {
      console.warn('⚠️ SMTP non configuré, email anniversaire non envoyé');
      return { success: false, error: 'SMTP non configuré' };
    }

    const emails = users.map(u => u.email).join(', ');

    const result = await smtpTransporter.sendMail({
      from: 'Crèche Mima Elghalia <contact@mima-elghalia.com>',
      to: emails,
      subject: `🎂 Anniversaire de ${child.first_name} dans ${daysUntil} jours`,
      html: generateBirthdayEmailHTML(child, daysUntil),
    });

    console.log('✅ Email anniversaire envoyé via SMTP:', result.messageId);
    return { success: true, messageId: result.messageId };

  } catch (error) {
    console.error('❌ Erreur sendBirthdayReminder:', error.message);
    return { success: false, error: error.message };
  }
}

// =====================================================
// Helpers pour formater les emails
// =====================================================

function formatOffset(minutes) {
  if (minutes < 60) {
    return `dans ${minutes} minute${minutes > 1 ? 's' : ''}`;
  } else if (minutes < 1440) {
    const hours = Math.floor(minutes / 60);
    return `dans ${hours} heure${hours > 1 ? 's' : ''}`;
  } else {
    const days = Math.floor(minutes / 1440);
    return `dans ${days} jour${days > 1 ? 's' : ''}`;
  }
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function getEventTypeLabel(type) {
  const labels = {
    memo: 'Mémo',
    task: 'Tâche',
    rdv: 'Rendez-vous',
    birthday: 'Anniversaire',
    vacation_reminder: 'Rappel Vacances',
    medical: 'RDV Médical',
    meeting: 'Réunion',
    custom: 'Événement'
  };
  return labels[type] || 'Événement';
}

function getPriorityLabel(priority) {
  const labels = {
    low: 'Basse',
    medium: 'Moyenne',
    high: 'Haute',
    urgent: 'Urgente'
  };
  return labels[priority] || 'Moyenne';
}

function getPriorityColor(priority) {
  const colors = {
    low: '#6B7280',
    medium: '#3B82F6',
    high: '#F59E0B',
    urgent: '#EF4444'
  };
  return colors[priority] || '#3B82F6';
}

// =====================================================
// Templates HTML des emails
// =====================================================

function generateReminderEmailHTML(event, user, offsetText) {
  const typeLabel = getEventTypeLabel(event.type);
  const priorityLabel = getPriorityLabel(event.priority);
  const priorityColor = getPriorityColor(event.priority);
  const dateFormatted = formatDate(event.start_date);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
    .event-card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${priorityColor}; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; }
    .priority { background: ${priorityColor}; color: white; }
    .type { background: #e5e7eb; color: #374151; }
    .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
    .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">🔔 Rappel d'Événement</h1>
      <p style="margin: 10px 0 0 0; opacity: 0.9;">${offsetText}</p>
    </div>
    
    <div class="content">
      <p>Bonjour ${user.first_name},</p>
      
      <p>Ceci est un rappel pour l'événement suivant :</p>
      
      <div class="event-card">
        <div style="margin-bottom: 15px;">
          <span class="badge type">${typeLabel}</span>
          <span class="badge priority">${priorityLabel}</span>
        </div>
        
        <h2 style="margin: 0 0 10px 0; color: #111827;">${event.title}</h2>
        
        ${event.description ? `<p style="color: #6b7280; margin: 10px 0;">${event.description}</p>` : ''}
        
        <p style="margin: 15px 0 5px 0;">
          <strong>📅 Date:</strong> ${dateFormatted}
        </p>
        
        ${event.location ? `
        <p style="margin: 5px 0;">
          <strong>📍 Lieu:</strong> ${event.location}
        </p>
        ` : ''}
      </div>
      
      <a href="${process.env.FRONTEND_URL}/dashboard/events/${event.id}" class="button">
        Voir les détails
      </a>
      
      <div class="footer">
        <p>Crèche Mima Elghalia</p>
        <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

function generateAssignedEmailHTML(event, assignedUser, creatorUser) {
  const typeLabel = getEventTypeLabel(event.type);
  const priorityLabel = getPriorityLabel(event.priority);
  const priorityColor = getPriorityColor(event.priority);
  const dateFormatted = formatDate(event.start_date);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
    .event-card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${priorityColor}; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; }
    .priority { background: ${priorityColor}; color: white; }
    .type { background: #e5e7eb; color: #374151; }
    .button { display: inline-block; padding: 12px 24px; background: #10b981; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
    .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">✅ Nouvelle Tâche Assignée</h1>
    </div>
    
    <div class="content">
      <p>Bonjour ${assignedUser.first_name},</p>
      
      <p>${creatorUser.first_name} ${creatorUser.last_name} vous a assigné une nouvelle tâche :</p>
      
      <div class="event-card">
        <div style="margin-bottom: 15px;">
          <span class="badge type">${typeLabel}</span>
          <span class="badge priority">${priorityLabel}</span>
        </div>
        
        <h2 style="margin: 0 0 10px 0; color: #111827;">${event.title}</h2>
        
        ${event.description ? `<p style="color: #6b7280; margin: 10px 0;">${event.description}</p>` : ''}
        
        <p style="margin: 15px 0 5px 0;">
          <strong>📅 Date limite:</strong> ${dateFormatted}
        </p>
      </div>
      
      <a href="${process.env.FRONTEND_URL}/dashboard/tasks/kanban" class="button">
        Voir mes tâches
      </a>
      
      <div class="footer">
        <p>Crèche Mima Elghalia</p>
        <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

function generateOverdueEmailHTML(event, user) {
  const typeLabel = getEventTypeLabel(event.type);
  const dateFormatted = formatDate(event.end_date || event.start_date);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
    .event-card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; background: #fee2e2; color: #991b1b; }
    .button { display: inline-block; padding: 12px 24px; background: #ef4444; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
    .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">⚠️ Événement en Retard</h1>
    </div>
    
    <div class="content">
      <p>Bonjour ${user.first_name},</p>
      
      <p>L'événement suivant est maintenant en retard :</p>
      
      <div class="event-card">
        <div style="margin-bottom: 15px;">
          <span class="badge">${typeLabel}</span>
        </div>
        
        <h2 style="margin: 0 0 10px 0; color: #111827;">${event.title}</h2>
        
        ${event.description ? `<p style="color: #6b7280; margin: 10px 0;">${event.description}</p>` : ''}
        
        <p style="margin: 15px 0 5px 0;">
          <strong>📅 Date prévue:</strong> ${dateFormatted}
        </p>
      </div>
      
      <p>Merci de traiter cet événement dès que possible.</p>
      
      <a href="${process.env.FRONTEND_URL}/dashboard/events/${event.id}" class="button">
        Voir les détails
      </a>
      
      <div class="footer">
        <p>Crèche Mima Elghalia</p>
        <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

function generateBirthdayEmailHTML(child, daysUntil) {
  const birthDate = new Date(child.birth_date);
  const age = new Date().getFullYear() - birthDate.getFullYear();

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #ec4899 0%, #db2777 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
    .birthday-card { background: white; padding: 30px; border-radius: 8px; margin: 20px 0; text-align: center; border: 2px solid #ec4899; }
    .cake { font-size: 60px; margin: 20px 0; }
    .button { display: inline-block; padding: 12px 24px; background: #ec4899; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
    .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">🎂 Anniversaire à Venir</h1>
    </div>
    
    <div class="content">
      <div class="birthday-card">
        <div class="cake">🎂</div>
        
        <h2 style="margin: 0 0 10px 0; color: #111827;">
          ${child.first_name} ${child.last_name}
        </h2>
        
        <p style="font-size: 18px; color: #ec4899; font-weight: 600;">
          Aura ${age} ans dans ${daysUntil} jours !
        </p>
        
        <p style="color: #6b7280; margin-top: 20px;">
          N'oubliez pas de préparer une petite célébration 🎉
        </p>
      </div>
      
      <a href="${process.env.FRONTEND_URL}/dashboard/events/calendar" class="button">
        Voir le calendrier
      </a>
      
      <div class="footer">
        <p>Crèche Mima Elghalia</p>
        <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

module.exports = {
  sendEventReminder,
  sendEventAssigned,
  sendEventOverdue,
  sendBirthdayReminder
};
