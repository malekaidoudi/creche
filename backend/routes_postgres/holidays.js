const express = require('express');
const router = express.Router();
const db = require('../config/db_postgres');

// GET /api/holidays - Récupérer tous les jours fériés
router.get('/', async (req, res) => {
  try {
    console.log('📅 Récupération des jours fériés PostgreSQL');
    
    const result = await db.query(`
      SELECT id, name, date, is_closed, description, created_at, updated_at
      FROM holidays 
      ORDER BY date ASC
    `);
    
    res.json({
      success: true,
      holidays: result.rows,
      total: result.rows.length
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
router.post('/', async (req, res) => {
  try {
    const { name, date, is_closed = true, description } = req.body;
    
    console.log('➕ Création nouveau jour férié PostgreSQL:', { name, date, is_closed });
    
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

// PUT /api/holidays/:id - Modifier un jour férié (admin)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, date, is_closed, description } = req.body;
    
    console.log('📝 Modification jour férié PostgreSQL:', { id, name, date, is_closed });
    
    // Vérifier si le jour férié existe
    const existing = await db.query('SELECT id FROM holidays WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Jour férié non trouvé' 
      });
    }
    
    // Mettre à jour le jour férié
    const result = await db.query(
      `UPDATE holidays 
       SET name = $1, date = $2, is_closed = $3, description = $4, updated_at = CURRENT_TIMESTAMP
       WHERE id = $5 
       RETURNING *`,
      [name, date, is_closed, description, id]
    );
    
    res.json({
      success: true,
      message: 'Jour férié modifié avec succès',
      holiday: result.rows[0]
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
router.delete('/:id', async (req, res) => {
  try {
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
