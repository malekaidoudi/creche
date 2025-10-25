const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

// GET /api/holidays - Récupérer tous les jours fériés
router.get('/', authenticateToken, async (req, res) => {
  try {
    console.log('📅 Récupération des jours fériés');
    
    const [holidays] = await db.execute(`
      SELECT id, name, date, is_closed, description, created_at, updated_at
      FROM holidays 
      ORDER BY date ASC
    `);

    res.json({
      success: true,
      holidays: holidays
    });

  } catch (error) {
    console.error('❌ Erreur récupération jours fériés:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur',
      details: error.message
    });
  }
});

// GET /api/holidays/year/:year - Récupérer les jours fériés d'une année
router.get('/year/:year', authenticateToken, async (req, res) => {
  try {
    const { year } = req.params;
    console.log(`📅 Récupération des jours fériés pour l'année ${year}`);
    
    const [holidays] = await db.execute(`
      SELECT id, name, date, is_closed, description
      FROM holidays 
      WHERE YEAR(date) = ?
      ORDER BY date ASC
    `, [year]);

    res.json({
      success: true,
      holidays: holidays
    });

  } catch (error) {
    console.error('❌ Erreur récupération jours fériés année:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur',
      details: error.message
    });
  }
});

// POST /api/holidays - Créer un nouveau jour férié (admin seulement)
router.post('/', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { name, date, is_closed = true, description } = req.body;
    
    console.log('➕ Création nouveau jour férié:', { name, date, is_closed });

    // Validation
    if (!name || !date) {
      return res.status(400).json({
        success: false,
        error: 'Le nom et la date sont requis'
      });
    }

    // Vérifier si la date existe déjà
    const [existing] = await db.execute(
      'SELECT id FROM holidays WHERE date = ?',
      [date]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Un jour férié existe déjà pour cette date'
      });
    }

    // Insérer le nouveau jour férié
    const [result] = await db.execute(`
      INSERT INTO holidays (name, date, is_closed, description)
      VALUES (?, ?, ?, ?)
    `, [name, date, is_closed, description]);

    // Récupérer le jour férié créé
    const [newHoliday] = await db.execute(
      'SELECT * FROM holidays WHERE id = ?',
      [result.insertId]
    );

    console.log('✅ Jour férié créé avec succès');

    res.status(201).json({
      success: true,
      message: 'Jour férié créé avec succès',
      holiday: newHoliday[0]
    });

  } catch (error) {
    console.error('❌ Erreur création jour férié:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur',
      details: error.message
    });
  }
});

// PUT /api/holidays/:id - Modifier un jour férié (admin seulement)
router.put('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, date, is_closed, description } = req.body;
    
    console.log(`📝 Modification jour férié ${id}:`, { name, date, is_closed });

    // Vérifier si le jour férié existe
    const [existing] = await db.execute('SELECT id FROM holidays WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Jour férié non trouvé'
      });
    }

    // Vérifier si la nouvelle date n'existe pas déjà (sauf pour ce jour férié)
    if (date) {
      const [dateExists] = await db.execute(
        'SELECT id FROM holidays WHERE date = ? AND id != ?',
        [date, id]
      );

      if (dateExists.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Un autre jour férié existe déjà pour cette date'
        });
      }
    }

    // Construire la requête de mise à jour
    const updates = [];
    const values = [];

    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name);
    }
    if (date !== undefined) {
      updates.push('date = ?');
      values.push(date);
    }
    if (is_closed !== undefined) {
      updates.push('is_closed = ?');
      values.push(is_closed);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Aucune donnée à mettre à jour'
      });
    }

    updates.push('updated_at = NOW()');
    values.push(id);

    await db.execute(`
      UPDATE holidays 
      SET ${updates.join(', ')} 
      WHERE id = ?
    `, values);

    // Récupérer le jour férié mis à jour
    const [updatedHoliday] = await db.execute(
      'SELECT * FROM holidays WHERE id = ?',
      [id]
    );

    console.log('✅ Jour férié mis à jour avec succès');

    res.json({
      success: true,
      message: 'Jour férié mis à jour avec succès',
      holiday: updatedHoliday[0]
    });

  } catch (error) {
    console.error('❌ Erreur modification jour férié:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur',
      details: error.message
    });
  }
});

// DELETE /api/holidays/:id - Supprimer un jour férié (admin seulement)
router.delete('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`🗑️ Suppression jour férié ${id}`);

    // Vérifier si le jour férié existe
    const [existing] = await db.execute('SELECT id, name FROM holidays WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Jour férié non trouvé'
      });
    }

    // Supprimer le jour férié
    await db.execute('DELETE FROM holidays WHERE id = ?', [id]);

    console.log(`✅ Jour férié "${existing[0].name}" supprimé avec succès`);

    res.json({
      success: true,
      message: 'Jour férié supprimé avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur suppression jour férié:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur',
      details: error.message
    });
  }
});

// GET /api/holidays/check/:date - Vérifier si une date est un jour férié
router.get('/check/:date', authenticateToken, async (req, res) => {
  try {
    const { date } = req.params;
    
    const [holiday] = await db.execute(`
      SELECT id, name, is_closed, description
      FROM holidays 
      WHERE date = ?
    `, [date]);

    res.json({
      success: true,
      is_holiday: holiday.length > 0,
      is_closed: holiday.length > 0 ? holiday[0].is_closed : false,
      holiday: holiday.length > 0 ? holiday[0] : null
    });

  } catch (error) {
    console.error('❌ Erreur vérification jour férié:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur',
      details: error.message
    });
  }
});

module.exports = router;
