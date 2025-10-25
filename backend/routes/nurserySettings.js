const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

// GET /api/nursery-settings - Récupérer tous les paramètres (public)
router.get('/', async (req, res) => {
  try {
    const { lang = 'fr', category } = req.query;
    
    let sql = 'SELECT setting_key, value_fr, value_ar, category FROM nursery_settings WHERE is_active = TRUE';
    const params = [];
    
    if (category) {
      sql += ' AND category = ?';
      params.push(category);
    }
    
    sql += ' ORDER BY category, setting_key';
    
    const [rows] = await db.execute(sql, params);
    
    // Transformer les données selon la langue
    const settings = {};
    rows.forEach(row => {
      const value = lang === 'ar' ? row.value_ar : row.value_fr;
      settings[row.setting_key] = {
        value,
        category: row.category,
        fr: row.value_fr,
        ar: row.value_ar
      };
    });
    
    // Retourner directement les settings pour compatibilité avec le frontend
    res.json(settings);
    
  } catch (error) {
    console.error('Erreur récupération paramètres:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
});

// GET /api/nursery-settings/contact - Paramètres de contact spécifiquement
router.get('/contact', async (req, res) => {
  try {
    const { lang = 'fr' } = req.query;
    
    const [rows] = await db.execute(
      'SELECT setting_key, value_fr, value_ar FROM nursery_settings WHERE (category IN (?, ?, ?) OR setting_key = ?) AND is_active = TRUE',
      ['contact', 'schedule', 'location', 'saturday_open']
    );
    
    const contactInfo = {};
    rows.forEach(row => {
      const value = lang === 'ar' ? row.value_ar : row.value_fr;
      contactInfo[row.setting_key] = value;
    });
    
    // Traitement spécial pour les horaires avec gestion samedi ouvert/fermé
    if (contactInfo.working_hours_weekdays) {
      const saturdayOpen = contactInfo.saturday_open === 'true';
      
      console.log('🕐 Traitement horaires contact:');
      console.log('  - saturday_open:', contactInfo.saturday_open);
      console.log('  - saturdayOpen (boolean):', saturdayOpen);
      console.log('  - working_hours_saturday:', contactInfo.working_hours_saturday);
      
      contactInfo.formatted_hours = {
        weekdays: contactInfo.working_hours_weekdays,
        saturday: saturdayOpen ? contactInfo.working_hours_saturday : null,
        saturday_open: saturdayOpen,
        display: saturdayOpen && contactInfo.working_hours_saturday
          ? (lang === 'ar' 
              ? `الاثنين - الجمعة: ${contactInfo.working_hours_weekdays} | السبت: ${contactInfo.working_hours_saturday}`
              : `Lun - Ven: ${contactInfo.working_hours_weekdays} | Sam: ${contactInfo.working_hours_saturday}`)
          : (lang === 'ar'
              ? `الاثنين - الجمعة: ${contactInfo.working_hours_weekdays} | السبت: مغلق`
              : `Lun - Ven: ${contactInfo.working_hours_weekdays} | Sam: Fermé`)
      };
      
      console.log('  - formatted_hours.display:', contactInfo.formatted_hours.display);
    }
    
    res.json({
      success: true,
      contact: contactInfo,
      language: lang
    });
    
  } catch (error) {
    console.error('Erreur récupération contact:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
});

// PUT /api/nursery-settings - Mettre à jour plusieurs paramètres (admin seulement)
router.put('/', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    console.log('💾 PUT /api/nursery-settings - Sauvegarde en masse');
    console.log('📝 Données reçues:', req.body);
    
    const { settings } = req.body;
    
    if (!Array.isArray(settings)) {
      return res.status(400).json({
        success: false,
        error: 'Le format des données est incorrect. Un array de settings est attendu.'
      });
    }
    
    // Commencer une transaction
    await db.execute('START TRANSACTION');
    
    try {
      for (const setting of settings) {
        const { setting_key, value_fr, value_ar } = setting;
        
        console.log(`🔄 Mise à jour: ${setting_key} = ${value_fr}`);
        
        // Mettre à jour ou insérer le paramètre
        const updateQuery = `
          INSERT INTO nursery_settings (setting_key, value_fr, value_ar, category, updated_at)
          VALUES (?, ?, ?, 'general', NOW())
          ON DUPLICATE KEY UPDATE
          value_fr = VALUES(value_fr),
          value_ar = VALUES(value_ar),
          updated_at = NOW()
        `;
        
        await db.execute(updateQuery, [setting_key, value_fr, value_ar]);
      }
      
      // Confirmer la transaction
      await db.execute('COMMIT');
      
      console.log('✅ Tous les paramètres ont été sauvegardés');
      res.json({
        success: true,
        message: 'Paramètres sauvegardés avec succès',
        updated_count: settings.length
      });
      
    } catch (error) {
      // Annuler la transaction en cas d'erreur
      await db.execute('ROLLBACK');
      throw error;
    }
    
  } catch (error) {
    console.error('❌ Erreur PUT nursery-settings:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la sauvegarde des paramètres',
      details: error.message
    });
  }
});

// POST /api/nursery-settings/simple-update - Mise à jour simple SANS vérification de rôle
router.post('/simple-update', authenticateToken, async (req, res) => {
  try {
    console.log('💾 Nursery Settings - Sauvegarde simple des paramètres');
    console.log('👤 Utilisateur:', req.user);
    console.log('📝 Données reçues:', req.body);
    
    const {
      nursery_name,
      address,
      phone,
      email,
      capacity,
      working_hours_weekdays,
      saturday_open,
      working_hours_saturday
    } = req.body;
    
    // Mettre à jour chaque paramètre individuellement
    const updates = [
      { key: 'nursery_name', value: nursery_name },
      { key: 'address', value: address },
      { key: 'phone', value: phone },
      { key: 'email', value: email },
      { key: 'capacity', value: capacity },
      { key: 'working_hours_weekdays', value: working_hours_weekdays },
      { key: 'saturday_open', value: saturday_open },
      { key: 'working_hours_saturday', value: working_hours_saturday }
    ];
    
    let updatedCount = 0;
    
    for (const update of updates) {
      if (update.value !== undefined && update.value !== null) {
        try {
          // Vérifier si le paramètre existe
          const [existing] = await db.execute(
            'SELECT id FROM nursery_settings WHERE setting_key = ?',
            [update.key]
          );
          
          if (existing.length > 0) {
            // Mettre à jour
            await db.execute(
              'UPDATE nursery_settings SET value_fr = ?, value_ar = ?, updated_at = NOW() WHERE setting_key = ?',
              [update.value, update.value, update.key]
            );
            console.log(`✅ Mis à jour: ${update.key} = ${update.value}`);
          } else {
            // Insérer
            await db.execute(
              'INSERT INTO nursery_settings (setting_key, value_fr, value_ar, category, is_active) VALUES (?, ?, ?, ?, ?)',
              [update.key, update.value, update.value, 'general', true]
            );
            console.log(`➕ Créé: ${update.key} = ${update.value}`);
          }
          updatedCount++;
        } catch (error) {
          console.error(`❌ Erreur mise à jour ${update.key}:`, error);
        }
      }
    }
    
    console.log(`✅ ${updatedCount} paramètres mis à jour`);
    
    res.json({
      success: true,
      message: `${updatedCount} paramètres mis à jour avec succès`,
      updated_count: updatedCount
    });
    
  } catch (error) {
    console.error('❌ Erreur sauvegarde simple:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la sauvegarde'
    });
  }
});

module.exports = router;
