const express = require('express');
const router = express.Router();
const db = require('../config/db_postgres');
const emailService = require('../emails/emailService');
const { body, validationResult } = require('express-validator');

/**
 * POST /api/contacts
 * Envoyer un message via le formulaire de contact
 */
router.post('/', [
  body('name').trim().notEmpty().withMessage('Le nom est requis'),
  body('email').isEmail().withMessage('Email invalide'),
  body('message').trim().notEmpty().withMessage('Le message est requis')
], async (req, res) => {
  try {
    // Valider les données
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { name, email, phone, subject, message } = req.body;

    // Enregistrer le message dans la base de données
    let messageId = null;
    try {
      const insertResult = await db.query(`
        INSERT INTO contact_messages (name, email, phone, subject, message, created_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
        RETURNING id
      `, [name, email, phone || null, subject || 'Nouveau message', message]);
      messageId = insertResult.rows[0]?.id;
      console.log('📧 Message de contact enregistré, ID:', messageId);
    } catch (dbError) {
      console.warn('⚠️ Impossible d\'enregistrer le message en DB:', dbError.message);
    }

    // Créer une notification pour tous les admins
    try {
      const admins = await db.query("SELECT id FROM users WHERE role = 'admin' AND is_active = true");
      for (const admin of admins.rows) {
        await db.query(`
          INSERT INTO notifications (user_id, type, title, message, metadata, created_at)
          VALUES ($1, 'contact_message', $2, $3, $4, NOW())
        `, [
          admin.id,
          'Nouveau message de contact',
          `${name} vous a envoyé un message: "${(subject || message).substring(0, 50)}..."`,
          JSON.stringify({ messageId, senderName: name, senderEmail: email })
        ]);
      }
      console.log('🔔 Notifications créées pour', admins.rows.length, 'admin(s)');
    } catch (notifError) {
      console.warn('⚠️ Impossible de créer les notifications:', notifError.message);
    }

    // Répondre immédiatement au client (message enregistré en DB)
    res.json({
      success: true,
      message: 'Votre message a été envoyé avec succès. Nous vous répondrons dans les plus brefs délais.',
      messageId
    });

    // Envoyer l'e-mail en arrière-plan (non-bloquant)
    emailService.sendContactMessage({
      name,
      email,
      phone,
      subject,
      message
    }).then(result => {
      console.log('📧 Email envoyé:', result.success ? 'OK' : 'Échec');
    }).catch(err => {
      console.warn('⚠️ Erreur envoi email:', err.message);
    });

  } catch (error) {
    console.error('❌ Erreur traitement message contact:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de l\'envoi du message'
    });
  }
});

/**
 * GET /api/contacts
 * Liste des messages de contact (admin seulement)
 */
router.get('/', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT id, name, email, phone, subject, message, created_at
      FROM contact_messages
      ORDER BY created_at DESC
      LIMIT 50
    `);

    res.json({
      success: true,
      messages: result.rows
    });

  } catch (error) {
    console.error('❌ Erreur récupération messages:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des messages'
    });
  }
});

/**
 * GET /api/contact/info
 * Informations de contact avec horaires depuis nursery_settings
 * Utilise les clés unifiées: opening_time, closing_time, saturday_opening_time, saturday_closing_time
 */
router.get('/info', async (req, res) => {
  try {
    // Récupérer tous les paramètres nécessaires
    const result = await db.query(`
      SELECT setting_key, value_fr, value_ar
      FROM nursery_settings
      WHERE setting_key IN (
        'opening_time', 'closing_time', 
        'saturday_open', 'saturday_opening_time', 'saturday_closing_time',
        'address', 'phone', 'email', 'nursery_name'
      )
      AND is_active = true
    `);

    // Parser les résultats
    const settings = {};
    const settingsAr = {};
    result.rows.forEach(row => {
      settings[row.setting_key] = row.value_fr;
      settingsAr[row.setting_key] = row.value_ar;
    });

    console.log('📋 Settings trouvés:', settings);

    // Construire les horaires
    const openingTime = settings.opening_time || '07:00';
    const closingTime = settings.closing_time || '18:00';
    const saturdayOpen = settings.saturday_open === 'true'; // false par défaut
    const satOpeningTime = settings.saturday_opening_time || '08:00';
    const satClosingTime = settings.saturday_closing_time || '13:00'; // 13:00 par défaut

    // Horaires formatés avec statut explicite du samedi
    let hoursFr = `Lun - Ven: ${openingTime}-${closingTime}`;
    let hoursAr = `الإثنين - الجمعة: ${openingTime}-${closingTime}`;

    if (saturdayOpen) {
      hoursFr += `, Sam: ${satOpeningTime}-${satClosingTime}`;
      hoursAr += `، السبت: ${satOpeningTime}-${satClosingTime}`;
    } else {
      hoursFr += `, Sam: Fermé`;
      hoursAr += `، السبت: مغلق`;
    }

    console.log('✅ Horaires finaux:', hoursFr);

    // Gestion de l'adresse bilingue avec règle de secours croisé :
    // Si addressAr est vide => prend addressFr, et inversement.
    // Si les deux sont vides => 'Non définie' (FR) / 'غير محددة' (AR)
    const rawAddressFr = settings.address ? settings.address.trim() : '';
    const rawAddressAr = settingsAr.address ? settingsAr.address.trim() : '';

    const addressFr = rawAddressFr || rawAddressAr || 'Non définie';
    const addressAr = rawAddressAr || rawAddressFr || 'غير محددة';

    // Nom de la crèche bilingue
    const rawNameFr = settings.nursery_name ? settings.nursery_name.trim() : '';
    const rawNameAr = settingsAr.nursery_name ? settingsAr.nursery_name.trim() : '';
    const nurseryNameFr = rawNameFr || rawNameAr || 'Crèche Mima Elghalia';
    const nurseryNameAr = rawNameAr || rawNameFr || 'روضة ميما الغالية';

    res.json({
      success: true,
      contact: {
        nursery_name: nurseryNameFr,
        nursery_name_ar: nurseryNameAr,
        address: addressFr,
        address_ar: addressAr,
        phone: settings.phone || '+216 25 95 35 32',
        email: settings.email || 'contact@mimaelghalia.tn',
        hours: hoursFr,
        hours_ar: hoursAr,
        saturday_open: saturdayOpen,
        saturday_opening_time: satOpeningTime,
        saturday_closing_time: satClosingTime,
        latitude: '33.340592',
        longitude: '10.490699',
        plus_code: '8FRR+77'
      }
    });

  } catch (error) {
    console.error('❌ Erreur récupération infos contact:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des informations'
    });
  }
});

/**
 * GET /api/contacts/test-smtp
 * Tester la configuration SMTP (admin seulement)
 */
router.get('/test-smtp', async (req, res) => {
  try {
    const emailConfig = {
      provider: process.env.RESEND_API_KEY ? 'resend' : (process.env.SMTP_HOST ? 'smtp' : 'none'),
      resend_configured: !!process.env.RESEND_API_KEY,
      smtp_host: process.env.SMTP_HOST || 'NON DÉFINI',
      smtp_port: process.env.SMTP_PORT || 'NON DÉFINI',
      smtp_user: process.env.SMTP_USER || 'NON DÉFINI',
      smtp_pass_configured: !!process.env.SMTP_PASS
    };

    console.log('🔧 Test Email - Configuration:', emailConfig);

    // Tester l'envoi d'un email
    const testResult = await emailService.sendContactMessage({
      name: 'Test Email',
      email: 'test@diagnostic.com',
      subject: 'Test Email Diagnostic',
      message: `Test envoyé le ${new Date().toLocaleString('fr-FR')}`
    });

    res.json({
      success: true,
      emailConfig,
      emailResult: testResult
    });

  } catch (error) {
    console.error('❌ Erreur test email:', error);
    res.json({
      success: false,
      error: error.message,
      emailConfig: {
        provider: process.env.RESEND_API_KEY ? 'resend' : (process.env.SMTP_HOST ? 'smtp' : 'none'),
        resend_configured: !!process.env.RESEND_API_KEY,
        smtp_host: process.env.SMTP_HOST || 'NON DÉFINI',
        smtp_port: process.env.SMTP_PORT || 'NON DÉFINI'
      }
    });
  }
});

module.exports = router;
