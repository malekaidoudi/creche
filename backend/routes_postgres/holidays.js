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
    if (req.user.role !== 'admin' && req.user.role !== 'developer') {
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
    if (req.user.role !== 'admin' && req.user.role !== 'developer') {
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
    if (req.user.role !== 'admin' && req.user.role !== 'developer') {
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
    if (req.user.role !== 'admin' && req.user.role !== 'developer') {
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

// POST /api/holidays/init - Initialiser les jours fériés tunisiens (premier lancement)
// Cette route peut être appelée sans authentification mais vérifie si la table est vide
router.post('/init', async (req, res) => {
  try {
    console.log('🚀 Initialisation des jours fériés tunisiens...');

    // Vérifier si des jours fériés existent déjà
    const existing = await db.query('SELECT COUNT(*) as count FROM holidays');
    const count = parseInt(existing.rows[0].count);

    if (count > 0) {
      console.log(`ℹ️ ${count} jours fériés déjà configurés`);
      return res.json({
        success: true,
        message: `${count} jours fériés déjà configurés`,
        initialized: false,
        count
      });
    }

    // Liste des politiques de jours fériés tunisiens à créer
    const holidayPolicies = [
      // Jours fériés nationaux (dates fixes)
      { holiday_key: 'new_year', name: "Jour de l'An", name_ar: "رأس السنة الميلادية", type: 'national', fixed_day: 1, fixed_month: 1, days_count: 1, is_active: true, display_order: 1 },
      { holiday_key: 'revolution_day', name: "Fête de la Révolution", name_ar: "عيد الثورة", type: 'national', fixed_day: 14, fixed_month: 1, days_count: 1, is_active: true, display_order: 2 },
      { holiday_key: 'independence_day', name: "Fête de l'Indépendance", name_ar: "عيد الاستقلال", type: 'national', fixed_day: 20, fixed_month: 3, days_count: 1, is_active: true, display_order: 3 },
      { holiday_key: 'martyrs_day', name: "Fête des Martyrs", name_ar: "عيد الشهداء", type: 'national', fixed_day: 9, fixed_month: 4, days_count: 1, is_active: true, display_order: 4 },
      { holiday_key: 'labor_day', name: "Fête du Travail", name_ar: "عيد العمال", type: 'national', fixed_day: 1, fixed_month: 5, days_count: 1, is_active: true, display_order: 5 },
      { holiday_key: 'republic_day', name: "Fête de la République", name_ar: "عيد الجمهورية", type: 'national', fixed_day: 25, fixed_month: 7, days_count: 1, is_active: true, display_order: 6 },
      { holiday_key: 'womens_day', name: "Fête de la Femme", name_ar: "عيد المرأة", type: 'national', fixed_day: 13, fixed_month: 8, days_count: 1, is_active: true, display_order: 7 },
      { holiday_key: 'evacuation_day', name: "Fête de l'Évacuation", name_ar: "عيد الجلاء", type: 'national', fixed_day: 15, fixed_month: 10, days_count: 1, is_active: true, display_order: 8 },

      // Jours fériés religieux (dates variables)
      { holiday_key: 'hijri_new_year', name: "Nouvel An Hégirien", name_ar: "رأس السنة الهجرية", type: 'religious', days_count: 1, is_active: true, display_order: 10 },
      { holiday_key: 'achoura', name: "Achoura", name_ar: "عاشوراء", type: 'religious', days_count: 1, is_active: true, display_order: 11 },
      { holiday_key: 'mawlid', name: "Mawlid (Naissance du Prophète)", name_ar: "المولد النبوي الشريف", type: 'religious', days_count: 1, is_active: true, display_order: 12 },
      { holiday_key: 'isra_miraj', name: "Isra et Miraj", name_ar: "ليلة الإسراء والمعراج", type: 'religious', days_count: 1, is_active: true, display_order: 13 },
      { holiday_key: 'eid_fitr', name: "Aïd el-Fitr", name_ar: "عيد الفطر", type: 'religious', days_count: 3, is_active: true, display_order: 14 },
      { holiday_key: 'arafat', name: "Jour d'Arafat", name_ar: "وقفة عرفة", type: 'religious', days_count: 1, is_active: true, display_order: 15 },
      { holiday_key: 'eid_adha', name: "Aïd el-Adha", name_ar: "عيد الأضحى", type: 'religious', days_count: 4, is_active: true, display_order: 16 },

      // Vacances scolaires
      { holiday_key: 'autumn_vacation', name: "Vacances d'Automne", name_ar: "عطلة الخريف", type: 'school', days_count: 1, is_active: false, display_order: 20 },
      { holiday_key: 'winter_vacation', name: "Vacances d'Hiver", name_ar: "عطلة الشتاء", type: 'school', days_count: 1, is_active: false, display_order: 21 },
      { holiday_key: 'spring_vacation', name: "Vacances de Printemps", name_ar: "عطلة الربيع", type: 'school', days_count: 1, is_active: false, display_order: 22 },
      { holiday_key: 'summer_vacation', name: "Vacances d'Été", name_ar: "عطلة الصيف", type: 'school', days_count: 1, is_active: false, display_order: 23 },
    ];

    let added = 0;
    for (const policy of holidayPolicies) {
      await db.query(`
        INSERT INTO holidays (holiday_key, name, name_ar, type, fixed_day, fixed_month, days_count, is_active, is_closed, display_order, description)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, $9, $10)
      `, [
        policy.holiday_key,
        policy.name,
        policy.name_ar,
        policy.type,
        policy.fixed_day || null,
        policy.fixed_month || null,
        policy.days_count,
        policy.is_active,
        policy.display_order,
        policy.name_ar
      ]);
      added++;
    }

    console.log(`✅ ${added} jours fériés tunisiens initialisés`);

    res.json({
      success: true,
      message: `${added} jours fériés tunisiens initialisés avec succès`,
      initialized: true,
      count: added
    });

  } catch (error) {
    console.error('Erreur initialisation jours fériés:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'initialisation des jours fériés'
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
