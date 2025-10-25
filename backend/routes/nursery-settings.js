// Route pour gérer les paramètres de la crèche (nursery_settings)
const express = require('express');
const router = express.Router();
const db = require('../config/database');
const authenticateToken = require('../middleware/auth');

// GET /api/nursery-settings - Récupérer tous les paramètres
router.get('/', authenticateToken, async (req, res) => {
  try {
    console.log('📡 GET /api/nursery-settings appelé');
    
    const query = `
      SELECT setting_key, value_fr, value_ar, category 
      FROM nursery_settings 
      WHERE is_active = TRUE 
      ORDER BY category, setting_key
    `;
    
    const [rows] = await db.execute(query);
    console.log('📋 Données trouvées:', rows.length, 'settings');
    
    res.json(rows);
  } catch (error) {
    console.error('❌ Erreur GET nursery-settings:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération des paramètres',
      details: error.message 
    });
  }
});

// PUT /api/nursery-settings - Mettre à jour les paramètres
router.put('/', authenticateToken, async (req, res) => {
  try {
    console.log('💾 PUT /api/nursery-settings appelé');
    console.log('📝 Données reçues:', req.body);
    
    const { settings } = req.body;
    
    if (!Array.isArray(settings)) {
      return res.status(400).json({ 
        error: 'Le format des données est incorrect. Un array de settings est attendu.' 
      });
    }
    
    // Commencer une transaction
    await db.execute('START TRANSACTION');
    
    try {
      for (const setting of settings) {
        const { setting_key, value_fr, value_ar } = setting;
        
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
        console.log(`✅ Setting mis à jour: ${setting_key}`);
      }
      
      // Confirmer la transaction
      await db.execute('COMMIT');
      
      console.log('🎉 Tous les paramètres ont été sauvegardés');
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
      error: 'Erreur lors de la sauvegarde des paramètres',
      details: error.message 
    });
  }
});

// GET /api/nursery-settings/public - Paramètres publics (sans auth)
router.get('/public', async (req, res) => {
  try {
    const query = `
      SELECT setting_key, value_fr, value_ar 
      FROM nursery_settings 
      WHERE is_active = TRUE 
      AND category IN ('general', 'contact', 'social')
      ORDER BY setting_key
    `;
    
    const [rows] = await db.execute(query);
    
    // Transformer en objet simple pour l'usage public
    const publicSettings = {};
    rows.forEach(row => {
      publicSettings[row.setting_key] = {
        fr: row.value_fr,
        ar: row.value_ar
      };
    });
    
    res.json(publicSettings);
  } catch (error) {
    console.error('❌ Erreur GET nursery-settings/public:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération des paramètres publics' 
    });
  }
});

module.exports = router;
