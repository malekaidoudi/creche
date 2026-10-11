const express = require('express');
const router = express.Router();
const db = require('../config/db_postgres');
const auth = require('../middleware/auth');

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
    const settings_ar = {};
    result.rows.forEach(row => {
      const value = lang === 'ar' && row.value_ar ? row.value_ar : row.value_fr;
      settings[row.setting_key] = value;
      settings_ar[row.setting_key] = row.value_ar || row.value_fr;
    });

    res.json({
      success: true,
      settings,
      settings_ar,
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

// GET /api/nursery-settings/raw - Récupérer les paramètres bruts (admin/developer)
router.get('/raw', auth.authenticateToken, auth.requireRole('admin', 'developer'), async (req, res) => {
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

// GET /api/nursery-settings/annual-vacation - Récupérer les vacances annuelles (public)
router.get('/annual-vacation', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT annual_vacation_enabled, annual_vacation_start_date, annual_vacation_end_date 
       FROM nursery_settings 
       WHERE setting_key = 'annual_vacation'
       LIMIT 1`
    );

    if (result.rows.length === 0) {
      return res.json({
        success: true,
        enabled: false,
        start_date: null,
        end_date: null
      });
    }

    const vacation = result.rows[0];
    res.json({
      success: true,
      enabled: vacation.annual_vacation_enabled || false,
      start_date: vacation.annual_vacation_start_date,
      end_date: vacation.annual_vacation_end_date
    });

  } catch (error) {
    console.error('Erreur récupération vacances annuelles:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des vacances annuelles'
    });
  }
});

// PUT /api/nursery-settings/annual-vacation - Mettre à jour les vacances annuelles (admin/developer)
router.put('/annual-vacation', auth.authenticateToken, auth.requireRole('admin', 'developer'), async (req, res) => {
  try {
    const { enabled, start_date, end_date } = req.body;

    console.log('💾 Mise à jour vacances annuelles:', { enabled, start_date, end_date });

    // Vérifier d'abord si les colonnes existent
    const checkColumns = await db.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'nursery_settings' 
        AND column_name IN ('annual_vacation_enabled', 'annual_vacation_start_date', 'annual_vacation_end_date')
    `);

    console.log('🔍 Colonnes trouvées:', checkColumns.rows.map(r => r.column_name));

    if (checkColumns.rows.length < 3) {
      console.error('❌ Les colonnes annual_vacation_* n\'existent pas toutes');
      console.error('📋 Colonnes manquantes:', 3 - checkColumns.rows.length);
      console.error('📋 Veuillez exécuter la migration: backend/database/migrations/add_annual_vacation.sql');

      return res.status(500).json({
        success: false,
        error: 'Migration requise: les colonnes de vacances annuelles n\'existent pas encore. Veuillez exécuter add_annual_vacation.sql'
      });
    }

    // Les colonnes existent, procéder à la mise à jour
    console.log('✅ Toutes les colonnes existent, mise à jour...');

    // Vérifier si l'entrée existe
    const checkEntry = await db.query(
      'SELECT id, setting_key FROM nursery_settings WHERE setting_key = $1',
      ['annual_vacation']
    );

    console.log('🔍 Entrée trouvée:', checkEntry.rows);

    if (checkEntry.rows.length === 0) {
      // Créer l'entrée
      console.log('➕ Création de l\'entrée annual_vacation');
      const insertResult = await db.query(
        `INSERT INTO nursery_settings (
          setting_key, value_fr, value_ar, category, 
          annual_vacation_enabled, annual_vacation_start_date, annual_vacation_end_date
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id`,
        [
          'annual_vacation',
          'Vacances annuelles de la crèche',
          'العطلة السنوية للحضانة',
          'schedule',
          enabled,
          start_date,
          end_date
        ]
      );
      console.log('✅ Entrée créée avec ID:', insertResult.rows[0].id);
    } else {
      // Mettre à jour l'entrée existante
      console.log('🔄 Mise à jour de l\'entrée existante ID:', checkEntry.rows[0].id);
      const updateResult = await db.query(
        `UPDATE nursery_settings 
         SET annual_vacation_enabled = $1, 
             annual_vacation_start_date = $2, 
             annual_vacation_end_date = $3,
             updated_at = CURRENT_TIMESTAMP
         WHERE setting_key = 'annual_vacation'
         RETURNING id`,
        [enabled, start_date, end_date]
      );
      console.log('✅ Entrée mise à jour, lignes affectées:', updateResult.rowCount);
    }

    console.log('✅ Vacances annuelles mises à jour avec succès');
    res.json({
      success: true,
      message: 'Vacances annuelles mises à jour avec succès'
    });

  } catch (error) {
    console.error('💥 Erreur mise à jour vacances annuelles:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erreur lors de la mise à jour des vacances annuelles'
    });
  }
});

// POST /api/nursery-settings/simple-update - Mise à jour simplifiée de plusieurs paramètres (admin/developer)
// Met à jour value_fr ET value_ar pour les valeurs qui sont identiques (horaires, capacité, etc.)
router.post('/simple-update', auth.authenticateToken, auth.requireRole('admin', 'developer'), async (req, res) => {
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

      // Clés bilingues gérées explicitement
      // Règle demandée : si address_ar est vide => prend address_fr, et inversement
      if (updates.address !== undefined || updates.address_ar !== undefined) {
        let addressFr = updates.address !== undefined ? String(updates.address).trim() : null;
        let addressAr = updates.address_ar !== undefined ? String(updates.address_ar).trim() : null;

        // Récupérer les valeurs existantes pour les fusions partielles
        const currAddress = await client.query('SELECT value_fr, value_ar FROM nursery_settings WHERE setting_key = $1', ['address']);
        const currFr = currAddress.rows[0]?.value_fr || '';
        const currAr = currAddress.rows[0]?.value_ar || '';

        if (addressFr === null) addressFr = currFr;
        if (addressAr === null) addressAr = currAr;

        // Application de la règle : si l'un est vide, il prend la valeur de l'autre
        if (!addressAr && addressFr) addressAr = addressFr;
        if (!addressFr && addressAr) addressFr = addressAr;

        if (currAddress.rows.length > 0) {
          await client.query(
            `UPDATE nursery_settings 
             SET value_fr = $1, value_ar = $2, updated_at = CURRENT_TIMESTAMP 
             WHERE setting_key = 'address'`,
            [addressFr, addressAr]
          );
        } else {
          await client.query(
            `INSERT INTO nursery_settings (setting_key, value_fr, value_ar, category, is_active) 
             VALUES ('address', $1, $2, 'contact', true)`,
            [addressFr, addressAr]
          );
        }
      }

      // Règle identique pour le nom de la crèche (nursery_name et nursery_name_ar)
      if (updates.nursery_name !== undefined || updates.nursery_name_ar !== undefined) {
        let nameFr = updates.nursery_name !== undefined ? String(updates.nursery_name).trim() : null;
        let nameAr = updates.nursery_name_ar !== undefined ? String(updates.nursery_name_ar).trim() : null;

        const currName = await client.query('SELECT value_fr, value_ar FROM nursery_settings WHERE setting_key = $1', ['nursery_name']);
        const currFr = currName.rows[0]?.value_fr || '';
        const currAr = currName.rows[0]?.value_ar || '';

        if (nameFr === null) nameFr = currFr;
        if (nameAr === null) nameAr = currAr;

        if (!nameAr && nameFr) nameAr = nameFr;
        if (!nameFr && nameAr) nameFr = nameAr;

        if (currName.rows.length > 0) {
          await client.query(
            `UPDATE nursery_settings 
             SET value_fr = $1, value_ar = $2, updated_at = CURRENT_TIMESTAMP 
             WHERE setting_key = 'nursery_name'`,
            [nameFr, nameAr]
          );
        } else {
          await client.query(
            `INSERT INTO nursery_settings (setting_key, value_fr, value_ar, category, is_active) 
             VALUES ('nursery_name', $1, $2, 'general', true)`,
            [nameFr, nameAr]
          );
        }
      }

      // Clés non traduisibles à valeur identique FR/AR
      const sameValueKeys = [
        'opening_time', 'closing_time',
        'saturday_opening_time', 'saturday_closing_time',
        'saturday_open', 'max_capacity', 'phone', 'email'
      ];

      // Pour chaque autre paramètre à mettre à jour
      for (const [key, value] of Object.entries(updates)) {
        // Ignorer les clés bilingues déjà gérées ci-dessus
        if (['address', 'address_ar', 'nursery_name', 'nursery_name_ar'].includes(key)) {
          continue;
        }

        const updateAr = sameValueKeys.includes(key);

        const existing = await client.query(
          'SELECT id FROM nursery_settings WHERE setting_key = $1',
          [key]
        );

        if (existing.rows.length > 0) {
          if (updateAr) {
            await client.query(
              `UPDATE nursery_settings 
               SET value_fr = $1, value_ar = $1, updated_at = CURRENT_TIMESTAMP
               WHERE setting_key = $2`,
              [value, key]
            );
          } else {
            await client.query(
              `UPDATE nursery_settings 
               SET value_fr = $1, updated_at = CURRENT_TIMESTAMP
               WHERE setting_key = $2`,
              [value, key]
            );
          }
        } else {
          const valueAr = updateAr ? value : null;
          await client.query(
            `INSERT INTO nursery_settings (setting_key, value_fr, value_ar, category, is_active) 
             VALUES ($1, $2, $3, 'general', true)`,
            [key, value, valueAr]
          );
        }
      }

      // Synchroniser working_hours_weekdays si opening_time ou closing_time modifié
      if (updates.opening_time !== undefined || updates.closing_time !== undefined) {
        await client.query(`
          UPDATE nursery_settings 
          SET value_fr = (SELECT value_fr FROM nursery_settings WHERE setting_key = 'opening_time') || '-' || (SELECT value_fr FROM nursery_settings WHERE setting_key = 'closing_time'),
              value_ar = (SELECT value_fr FROM nursery_settings WHERE setting_key = 'opening_time') || '-' || (SELECT value_fr FROM nursery_settings WHERE setting_key = 'closing_time'),
              updated_at = CURRENT_TIMESTAMP
          WHERE setting_key = 'working_hours_weekdays'
        `);
      }

      // Synchroniser working_hours_saturday si saturday_opening_time ou saturday_closing_time modifié
      if (updates.saturday_opening_time !== undefined || updates.saturday_closing_time !== undefined) {
        await client.query(`
          UPDATE nursery_settings 
          SET value_fr = (SELECT value_fr FROM nursery_settings WHERE setting_key = 'saturday_opening_time') || '-' || (SELECT value_fr FROM nursery_settings WHERE setting_key = 'saturday_closing_time'),
              value_ar = (SELECT value_fr FROM nursery_settings WHERE setting_key = 'saturday_opening_time') || '-' || (SELECT value_fr FROM nursery_settings WHERE setting_key = 'saturday_closing_time'),
              updated_at = CURRENT_TIMESTAMP
          WHERE setting_key = 'working_hours_saturday'
        `);
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

// PUT /api/nursery-settings/:key - Mettre à jour un paramètre (admin/developer)
router.put('/:key', auth.authenticateToken, auth.requireRole('admin', 'developer'), async (req, res) => {
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

// POST /api/nursery-settings - Créer un nouveau paramètre (admin/developer)
router.post('/', auth.authenticateToken, auth.requireRole('admin', 'developer'), async (req, res) => {
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

module.exports = router;
