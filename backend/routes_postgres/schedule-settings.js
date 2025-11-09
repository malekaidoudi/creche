const express = require('express');
const router = express.Router();
const db = require('../config/db_postgres');

// GET /api/schedule-settings/closed-days/:year/:month - Jours fermés d'un mois
router.get('/closed-days/:year/:month', async (req, res) => {
  try {
    const { year, month } = req.params;
    
    // Validation des paramètres
    const yearNum = parseInt(year);
    const monthNum = parseInt(month);
    
    if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      return res.status(400).json({
        success: false,
        error: 'Paramètres invalides'
      });
    }
    
    // Récupérer les paramètres hebdomadaires (samedi, dimanche)
    const settingsResult = await db.query(
      `SELECT setting_key, value_fr 
       FROM nursery_settings 
       WHERE setting_key IN ('saturday_open', 'sunday_open')
       AND is_active = true`
    );
    
    const weeklySettings = {
      saturday_open: false,
      sunday_open: false
    };
    
    settingsResult.rows.forEach(row => {
      weeklySettings[row.setting_key] = row.value_fr === 'true' || row.value_fr === '1';
    });
    
    // Récupérer les jours fériés du mois
    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
    const lastDay = new Date(yearNum, monthNum, 0).getDate(); // Dernier jour du mois
    const endDate = `${year}-${month.toString().padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`;
    
    const holidaysResult = await db.query(
      `SELECT id, name, date, is_closed 
       FROM holidays 
       WHERE date >= $1 AND date <= $2
       AND is_closed = true
       ORDER BY date`,
      [startDate, endDate]
    );
    
    // Calculer tous les jours fermés du mois
    const closedDays = [];
    const daysInMonth = new Date(yearNum, monthNum, 0).getDate();
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(yearNum, monthNum - 1, day);
      const dayOfWeek = date.getDay(); // 0 = dimanche, 6 = samedi
      
      // Vérifier si c'est un jour de weekend fermé
      if (dayOfWeek === 0 && !weeklySettings.sunday_open) {
        closedDays.push({
          day: day,
          reason: 'Dimanche',
          type: 'weekend'
        });
      } else if (dayOfWeek === 6 && !weeklySettings.saturday_open) {
        closedDays.push({
          day: day,
          reason: 'Samedi',
          type: 'weekend'
        });
      }
    }
    
    // Ajouter les jours fériés
    holidaysResult.rows.forEach(holiday => {
      const holidayDate = new Date(holiday.date);
      closedDays.push({
        day: holidayDate.getDate(),
        reason: holiday.name,
        type: 'holiday',
        holiday_id: holiday.id
      });
    });
    
    res.json({
      success: true,
      year: yearNum,
      month: monthNum,
      closed_days: closedDays,
      weekly_settings: weeklySettings
    });
    
  } catch (error) {
    console.error('Erreur récupération jours fermés:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des jours fermés'
    });
  }
});

module.exports = router;
