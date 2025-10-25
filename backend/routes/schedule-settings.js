const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

// GET /api/schedule-settings - Récupérer les paramètres d'horaires et jours d'ouverture
router.get('/', authenticateToken, async (req, res) => {
  try {
    console.log('📅 Récupération des paramètres d\'horaires');
    
    // Récupérer les paramètres d'ouverture hebdomadaires
    const [weekSettings] = await db.execute(`
      SELECT 
        monday_open, tuesday_open, wednesday_open, thursday_open, 
        friday_open, saturday_open, sunday_open
      FROM nursery_settings 
      WHERE monday_open IS NOT NULL
      LIMIT 1
    `);

    let scheduleSettings = {};
    if (weekSettings.length > 0) {
      scheduleSettings = weekSettings[0];
    } else {
      // Valeurs par défaut si pas de paramètres
      scheduleSettings = {
        monday_open: true,
        tuesday_open: true,
        wednesday_open: true,
        thursday_open: true,
        friday_open: true,
        saturday_open: false,
        sunday_open: false
      };
    }

    res.json({
      success: true,
      settings: scheduleSettings
    });

  } catch (error) {
    console.error('❌ Erreur récupération paramètres horaires:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur',
      details: error.message
    });
  }
});

// PUT /api/schedule-settings - Mettre à jour les paramètres d'horaires (admin seulement)
router.put('/', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const {
      monday_open, tuesday_open, wednesday_open, thursday_open,
      friday_open, saturday_open, sunday_open
    } = req.body;
    
    console.log('📝 Mise à jour paramètres horaires:', req.body);

    // Construire la requête de mise à jour
    const updates = [];
    const values = [];

    if (monday_open !== undefined) {
      updates.push('monday_open = ?');
      values.push(monday_open);
    }
    if (tuesday_open !== undefined) {
      updates.push('tuesday_open = ?');
      values.push(tuesday_open);
    }
    if (wednesday_open !== undefined) {
      updates.push('wednesday_open = ?');
      values.push(wednesday_open);
    }
    if (thursday_open !== undefined) {
      updates.push('thursday_open = ?');
      values.push(thursday_open);
    }
    if (friday_open !== undefined) {
      updates.push('friday_open = ?');
      values.push(friday_open);
    }
    if (saturday_open !== undefined) {
      updates.push('saturday_open = ?');
      values.push(saturday_open);
    }
    if (sunday_open !== undefined) {
      updates.push('sunday_open = ?');
      values.push(sunday_open);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Aucune donnée à mettre à jour'
      });
    }

    updates.push('updated_at = NOW()');

    // Mettre à jour les paramètres
    await db.execute(`
      UPDATE nursery_settings 
      SET ${updates.join(', ')}
      WHERE id = 1
    `, values);

    // Récupérer les paramètres mis à jour
    const [updatedSettings] = await db.execute(`
      SELECT 
        monday_open, tuesday_open, wednesday_open, thursday_open, 
        friday_open, saturday_open, sunday_open
      FROM nursery_settings 
      WHERE monday_open IS NOT NULL
      LIMIT 1
    `);

    console.log('✅ Paramètres horaires mis à jour avec succès');

    res.json({
      success: true,
      message: 'Paramètres d\'horaires mis à jour avec succès',
      settings: updatedSettings[0]
    });

  } catch (error) {
    console.error('❌ Erreur mise à jour paramètres horaires:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur',
      details: error.message
    });
  }
});

// GET /api/schedule-settings/closed-days/:year/:month - Récupérer les jours fermés d'un mois
router.get('/closed-days/:year/:month', authenticateToken, async (req, res) => {
  try {
    const { year, month } = req.params;
    console.log(`📅 Récupération jours fermés pour ${year}-${month}`);
    
    // 1. Récupérer les paramètres d'ouverture hebdomadaire
    const [settings] = await db.execute(`
      SELECT monday_open, tuesday_open, wednesday_open, thursday_open, 
             friday_open, saturday_open, sunday_open
      FROM nursery_settings 
      LIMIT 1
    `);

    // 2. Récupérer les jours fériés du mois
    const [holidays] = await db.execute(`
      SELECT date, name, is_closed
      FROM holidays 
      WHERE YEAR(date) = ? AND MONTH(date) = ? AND is_closed = TRUE
    `, [year, month]);

    // 3. Calculer tous les jours fermés du mois
    const closedDays = [];
    const weekSettings = settings[0] || {};
    
    // Calculer les jours de la semaine fermés
    const daysInMonth = new Date(year, month, 0).getDate();
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      const dayOfWeek = date.getDay(); // 0 = Dimanche, 6 = Samedi
      
      const weekDaySettings = {
        0: !weekSettings.sunday_open,    // Dimanche
        1: !weekSettings.monday_open,    // Lundi
        2: !weekSettings.tuesday_open,   // Mardi
        3: !weekSettings.wednesday_open, // Mercredi
        4: !weekSettings.thursday_open,  // Jeudi
        5: !weekSettings.friday_open,    // Vendredi
        6: !weekSettings.saturday_open   // Samedi
      };

      if (weekDaySettings[dayOfWeek]) {
        closedDays.push({
          day: day,
          date: date.toISOString().split('T')[0],
          reason: 'weekly_closure',
          dayName: ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'][dayOfWeek]
        });
      }
    }

    // Ajouter les jours fériés
    holidays.forEach(holiday => {
      const holidayDate = new Date(holiday.date);
      const day = holidayDate.getDate();
      
      // Vérifier si ce jour n'est pas déjà fermé pour une autre raison
      const existingClosure = closedDays.find(cd => cd.day === day);
      if (!existingClosure) {
        closedDays.push({
          day: day,
          date: holiday.date,
          reason: 'holiday',
          name: holiday.name
        });
      } else {
        // Mettre à jour la raison si c'est un jour férié
        existingClosure.reason = 'holiday_and_weekly';
        existingClosure.name = holiday.name;
      }
    });

    res.json({
      success: true,
      year: parseInt(year),
      month: parseInt(month),
      closed_days: closedDays.sort((a, b) => a.day - b.day),
      weekly_settings: weekSettings,
      holidays_count: holidays.length
    });

  } catch (error) {
    console.error('❌ Erreur récupération jours fermés:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur',
      details: error.message
    });
  }
});

module.exports = router;
