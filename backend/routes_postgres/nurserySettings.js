const express = require('express');
const router = express.Router();
const db = require('../config/db_postgres');

// GET /api/nursery-settings - Récupérer tous les paramètres (public)
router.get('/', async (req, res) => {
  try {
    const { lang = 'fr', category } = req.query;
    
    let sql = 'SELECT setting_key, value_fr, value_ar, category FROM nursery_settings WHERE is_active = TRUE';
    const params = [];
    
    if (category) {
      sql += ' AND category = $1';
      params.push(category);
    }
    
    sql += ' ORDER BY setting_key';
    
    const result = await db.query(sql, params);
    
    // Transformer en objet avec les valeurs selon la langue
    const settings = {};
    result.rows.forEach(row => {
      const value = lang === 'ar' && row.value_ar ? row.value_ar : row.value_fr;
      settings[row.setting_key] = value;
    });
    
    res.json({
      success: true,
      settings,
      language: lang,
      total: result.rows.length
    });
    
  } catch (error) {
    console.error('Erreur récupération paramètres:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération des paramètres' 
    });
  }
});

// GET /api/nursery-settings/raw - Récupérer les paramètres bruts (admin)
router.get('/raw', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM nursery_settings ORDER BY category, setting_key'
    );
    
    res.json({
      success: true,
      settings: result.rows,
      total: result.rows.length
    });
    
  } catch (error) {
    console.error('Erreur récupération paramètres bruts:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération des paramètres' 
    });
  }
});

// PUT /api/nursery-settings/:key - Mettre à jour un paramètre (admin)
router.put('/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const { value_fr, value_ar, category, is_active } = req.body;
    
    // Vérifier si le paramètre existe
    const existing = await db.query(
      'SELECT id FROM nursery_settings WHERE setting_key = $1',
      [key]
    );
    
    if (existing.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Paramètre non trouvé' 
      });
    }
    
    // Mettre à jour le paramètre
    await db.query(
      `UPDATE nursery_settings 
       SET value_fr = $1, value_ar = $2, category = $3, is_active = $4, updated_at = CURRENT_TIMESTAMP
       WHERE setting_key = $5`,
      [value_fr, value_ar, category, is_active, key]
    );
    
    res.json({
      success: true,
      message: 'Paramètre mis à jour avec succès'
    });
    
  } catch (error) {
    console.error('Erreur mise à jour paramètre:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la mise à jour du paramètre' 
    });
  }
});

// POST /api/nursery-settings - Créer un nouveau paramètre (admin)
router.post('/', async (req, res) => {
  try {
    const { setting_key, value_fr, value_ar, category = 'general', is_active = true } = req.body;
    
    if (!setting_key || !value_fr) {
      return res.status(400).json({ 
        success: false, 
        error: 'Clé et valeur française requises' 
      });
    }
    
    // Vérifier si le paramètre existe déjà
    const existing = await db.query(
      'SELECT id FROM nursery_settings WHERE setting_key = $1',
      [setting_key]
    );
    
    if (existing.rows.length > 0) {
      return res.status(409).json({ 
        success: false, 
        error: 'Ce paramètre existe déjà' 
      });
    }
    
    // Créer le nouveau paramètre
    const result = await db.query(
      `INSERT INTO nursery_settings (setting_key, value_fr, value_ar, category, is_active) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [setting_key, value_fr, value_ar, category, is_active]
    );
    
    res.status(201).json({
      success: true,
      message: 'Paramètre créé avec succès',
      setting: result.rows[0]
    });
    
  } catch (error) {
    console.error('Erreur création paramètre:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la création du paramètre' 
    });
  }
});

// POST /api/nursery-settings/simple-update - Mise à jour simplifiée de plusieurs paramètres (admin)
router.post('/simple-update', async (req, res) => {
  try {
    const updates = req.body;
    
    if (!updates || typeof updates !== 'object') {
      return res.status(400).json({ 
        success: false, 
        error: 'Données invalides' 
      });
    }
    
    const client = await db.getClient();
    
    try {
      await client.query('BEGIN');
      
      // Pour chaque paramètre à mettre à jour
      for (const [key, value] of Object.entries(updates)) {
        // Vérifier si le paramètre existe
        const existing = await client.query(
          'SELECT id FROM nursery_settings WHERE setting_key = $1',
          [key]
        );
        
        if (existing.rows.length > 0) {
          // Mettre à jour
          await client.query(
            `UPDATE nursery_settings 
             SET value_fr = $1, updated_at = CURRENT_TIMESTAMP
             WHERE setting_key = $2`,
            [value, key]
          );
        } else {
          // Créer si n'existe pas
          await client.query(
            `INSERT INTO nursery_settings (setting_key, value_fr, category, is_active) 
             VALUES ($1, $2, 'general', true)`,
            [key, value]
          );
        }
      }
      
      await client.query('COMMIT');
      
      res.json({
        success: true,
        message: 'Paramètres mis à jour avec succès',
        updated: Object.keys(updates).length
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Erreur mise à jour simple:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la mise à jour des paramètres' 
    });
  }
});

module.exports = router;
