const express = require('express');
const router = express.Router();
const db = require('../config/db_postgres');
const { authenticateToken } = require('../middleware/auth');
const notificationService = require('../services/notificationService');
const { getIslamicHolidays, getNationalHolidays } = require('../utils/tunisianHolidays');

/**
 * Génère les dates effectives des jours fériés basées sur les politiques actives
 * Utilisé pour l'affichage dans les widgets
 */
function generateEffectiveHolidays(holidays) {
  const effective = [];
  const currentYear = new Date().getFullYear();
  const years = [currentYear, currentYear + 1];

  for (const holiday of holidays) {
    if (!holiday.is_active) continue;

    // Pour les fêtes multi-jours (Aïd), générer les jours individuels
    if ((holiday.holiday_key === 'eid_fitr' || holiday.holiday_key === 'eid_adha') && holiday.days_count > 1) {
      for (const year of years) {
        const islamicHolidays = getIslamicHolidays(year);
        const eidDays = islamicHolidays.filter(h => h.holiday_key === holiday.holiday_key && h.day_index);

        for (const day of eidDays) {
          if (day.day_index <= holiday.days_count) {
            effective.push({
              id: holiday.id,
              name: day.name,
              name_ar: day.name_ar,
              date: day.date,
              type: holiday.type,
              is_closed: true,
              holiday_key: holiday.holiday_key,
              day_index: day.day_index
            });
          }
        }
      }
    } else if (holiday.fixed_day && holiday.fixed_month) {
      // Jours nationaux avec date fixe
      for (const year of years) {
        const date = `${year}-${String(holiday.fixed_month).padStart(2, '0')}-${String(holiday.fixed_day).padStart(2, '0')}`;
        effective.push({
          id: holiday.id,
          name: holiday.name,
          name_ar: holiday.name_ar,
          date: date,
          type: holiday.type,
          is_closed: true,
          holiday_key: holiday.holiday_key
        });
      }
    } else {
      // Jours religieux avec date variable
      for (const year of years) {
        const islamicHolidays = getIslamicHolidays(year);
        const match = islamicHolidays.find(h => h.holiday_key === holiday.holiday_key && !h.day_index);
        if (match) {
          effective.push({
            id: holiday.id,
            name: holiday.name,
            name_ar: holiday.name_ar,
            date: match.date,
            type: holiday.type,
            is_closed: true,
            holiday_key: holiday.holiday_key
          });
        }
      }
    }
  }

  // Trier par date et filtrer les dates passées (garder 30 derniers jours)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  return effective
    .filter(h => new Date(h.date) >= thirtyDaysAgo)
    .sort((a, b) => new Date(a.date) - new Date(b.date));
}

// GET /api/holidays - Récupérer tous les jours fériés (politiques + dates effectives)
router.get('/', async (req, res) => {
  try {
    console.log('📅 Récupération des jours fériés depuis la table holidays');

    const { effective } = req.query; // ?effective=true pour obtenir les dates générées

    const result = await db.query(`
      SELECT id, holiday_key, name, name_ar, type, fixed_day, fixed_month, 
             days_count, is_active, display_order, date, is_closed, description,
             created_at, updated_at 
      FROM holidays 
      ORDER BY display_order ASC, date ASC
    `);

    const holidays = result.rows.map(h => ({
      ...h,
      date: h.date instanceof Date ? h.date.toISOString().split('T')[0] : h.date
    }));

    // Si on demande les dates effectives (pour les widgets)
    if (effective === 'true') {
      const effectiveHolidays = generateEffectiveHolidays(holidays);
      return res.json({
        success: true,
        holidays: effectiveHolidays,
        total: effectiveHolidays.length
      });
    }

    // Sinon retourner les politiques (pour la page admin)
    res.json({
      success: true,
      holidays: holidays,
      total: holidays.length
    });

  } catch (error) {
    console.error('Erreur récupération jours fériés:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des jours fériés'
    });
  }
});

// POST /api/holidays - Créer un jour férié (admin)
router.post('/', authenticateToken, async (req, res) => {
  try {
    // Vérifier que l'utilisateur est admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Accès réservé aux administrateurs'
      });
    }

    const { name, date, is_closed = true, description } = req.body;

    console.log(' Création nouveau jour férié PostgreSQL:', { name, date, is_closed });

    if (!name || !date) {
      return res.status(400).json({
        success: false,
        error: 'Nom et date requis'
      });
    }

    // Vérifier si la date existe déjà
    const existing = await db.query('SELECT id FROM holidays WHERE date = $1', [date]);
    if (existing.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'Un jour férié existe déjà pour cette date'
      });
    }

    // Insérer le nouveau jour férié
    const result = await db.query(
      `INSERT INTO holidays (name, date, is_closed, description) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
      [name, date, is_closed, description]
    );

    console.log('✅ Jour férié créé:', result.rows[0]);

    res.status(201).json({
      success: true,
      message: 'Jour férié créé avec succès',
      holiday: result.rows[0]
    });

  } catch (error) {
    console.error('Erreur création jour férié:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la création du jour férié'
    });
  }
});

// PUT /api/holidays/:id - Modifier un jour férié ou sa politique (admin)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    // Vérifier que l'utilisateur est admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Accès réservé aux administrateurs'
      });
    }

    const { id } = req.params;
    const { name, date, is_closed, description, is_active, days_count } = req.body;

    console.log('📝 Modification jour férié PostgreSQL:', { id, is_active, days_count });

    // Vérifier si le jour férié existe
    const existing = await db.query('SELECT * FROM holidays WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Jour férié non trouvé'
      });
    }

    // Construire la requête de mise à jour dynamiquement
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (typeof is_active === 'boolean') {
      updates.push(`is_active = $${paramIndex++}`);
      values.push(is_active);
    }

    if (typeof days_count === 'number' && days_count >= 1 && days_count <= 4) {
      updates.push(`days_count = $${paramIndex++}`);
      values.push(days_count);
    }

    if (name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(name);
    }

    if (date !== undefined) {
      updates.push(`date = $${paramIndex++}`);
      values.push(date);
    }

    if (is_closed !== undefined) {
      updates.push(`is_closed = $${paramIndex++}`);
      values.push(is_closed);
    }

    if (description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(description);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Aucune modification fournie'
      });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await db.query(
      `UPDATE holidays 
       SET ${updates.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING *`,
      values
    );

    const updatedHoliday = result.rows[0];

    // Envoyer des notifications si le statut is_active a changé
    if (typeof is_active === 'boolean') {
      console.log('🔔 Envoi notification jour férié:', { is_active, holiday: updatedHoliday.name });
      try {
        if (is_active) {
          await notificationService.notifyHolidayAdded(updatedHoliday, req.user.userId);
        } else {
          await notificationService.notifyHolidayRemoved(updatedHoliday, req.user.userId);
        }
      } catch (notifError) {
        console.error('⚠️ Erreur envoi notifications:', notifError.message);
      }
    }

    res.json({
      success: true,
      message: 'Jour férié modifié avec succès',
      holiday: updatedHoliday
    });

  } catch (error) {
    console.error('Erreur modification jour férié:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la modification du jour férié'
    });
  }
});

// DELETE /api/holidays/:id - Supprimer un jour férié (admin)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    // Vérifier que l'utilisateur est admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Accès réservé aux administrateurs'
      });
    }

    const { id } = req.params;

    console.log('🗑️ Suppression jour férié PostgreSQL:', id);

    // Vérifier si le jour férié existe
    const existing = await db.query('SELECT id, name FROM holidays WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Jour férié non trouvé'
      });
    }

    // Supprimer le jour férié
    await db.query('DELETE FROM holidays WHERE id = $1', [id]);

    console.log('✅ Jour férié supprimé:', existing.rows[0].name);

    res.json({
      success: true,
      message: 'Jour férié supprimé avec succès'
    });

  } catch (error) {
    console.error('Erreur suppression jour férié:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la suppression du jour férié'
    });
  }
});

// POST /api/holidays/sync - Synchroniser les jours fériés générés dans la DB (admin)
router.post('/sync', authenticateToken, async (req, res) => {
  try {
    // Vérifier que l'utilisateur est admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Accès réservé aux administrateurs'
      });
    }

    console.log('🔄 Synchronisation des jours fériés...');

    // Vérifier si la colonne type existe, sinon l'ajouter
    try {
      await db.query(`SELECT type FROM holidays LIMIT 1`);
    } catch (e) {
      console.log('📝 Ajout de la colonne type à la table holidays...');
      await db.query(`ALTER TABLE holidays ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'custom'`);
    }

    // Générer les jours fériés
    const generatedHolidays = generateUpcomingHolidays();

    let added = 0;
    let skipped = 0;

    for (const holiday of generatedHolidays) {
      // Vérifier si la date existe déjà
      const existing = await db.query('SELECT id FROM holidays WHERE date = $1', [holiday.date]);

      if (existing.rows.length === 0) {
        // Insérer le nouveau jour férié
        await db.query(
          `INSERT INTO holidays (name, date, is_closed, type, description) 
           VALUES ($1, $2, $3, $4, $5)`,
          [holiday.name, holiday.date, true, holiday.type, holiday.name_ar]
        );
        added++;
      } else {
        skipped++;
      }
    }

    console.log(`✅ Synchronisation terminée: ${added} ajoutés, ${skipped} existants`);

    res.json({
      success: true,
      message: `Synchronisation terminée: ${added} jours fériés ajoutés`,
      added,
      skipped,
      total: generatedHolidays.length
    });

  } catch (error) {
    console.error('Erreur synchronisation jours fériés:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la synchronisation des jours fériés'
    });
  }
});

// GET /api/holidays/check/:date - Vérifier si une date est férié
router.get('/check/:date', async (req, res) => {
  try {
    const { date } = req.params;

    const result = await db.query(
      'SELECT id, name, is_closed FROM holidays WHERE date = $1',
      [date]
    );

    const isHoliday = result.rows.length > 0;
    const holiday = isHoliday ? result.rows[0] : null;

    res.json({
      success: true,
      date,
      is_holiday: isHoliday,
      is_closed: holiday?.is_closed || false,
      holiday
    });

  } catch (error) {
    console.error('Erreur vérification jour férié:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la vérification du jour férié'
    });
  }
});

module.exports = router;
