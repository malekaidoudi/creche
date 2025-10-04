const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { query: dbQuery } = require('../config/database');
const { authenticateToken, requireStaff, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/news - Obtenir toutes les actualités
router.get('/', [
  optionalAuth,
  query('page').optional().isInt({ min: 1 }).withMessage('Page doit être un entier positif'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit doit être entre 1 et 100'),
  query('status').optional().isIn(['draft', 'published']).withMessage('Statut invalide'),
  query('lang').optional().isIn(['fr', 'ar']).withMessage('Langue invalide'),
  query('upcoming').optional().isBoolean().withMessage('Upcoming doit être un booléen')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Paramètres invalides',
        details: errors.array()
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;
    const upcoming = req.query.upcoming === 'true';
    const offset = (page - 1) * limit;

    let sql = `
      SELECT n.*, u.first_name as author_first_name, u.last_name as author_last_name
      FROM news n
      INNER JOIN users u ON n.author_id = u.id
      WHERE 1=1
    `;
    let params = [];

    // Si l'utilisateur n'est pas connecté ou n'est pas staff, ne montrer que les actualités publiées
    if (!req.user || !['admin', 'staff'].includes(req.user.role)) {
      sql += ' AND n.status = "published"';
    } else if (status) {
      sql += ' AND n.status = ?';
      params.push(status);
    }

    // Filtrer par événements à venir ou passés
    if (upcoming) {
      sql += ' AND n.event_date >= CURDATE()';
    }

    sql += ' ORDER BY n.event_date DESC, n.published_at DESC, n.created_at DESC';
    // Temporairement sans LIMIT pour tester
    // sql += ' LIMIT ?, ?';
    // params.push(parseInt(offset), parseInt(limit));

    console.log('🔍 Debug - Paramètres reçus:', { limit, offset, status });
    console.log('🔍 Debug - Paramètres convertis:', { limitInt: parseInt(limit), offsetInt: parseInt(offset) });
    console.log('🔍 Debug - SQL final:', sql);
    console.log('🔍 Debug - Params final:', params);
    console.log('🔍 Debug - Nombre de ? dans SQL:', (sql.match(/\?/g) || []).length);
    console.log('🔍 Debug - Nombre de params:', params.length);
    
    // Test avec une requête simple d'abord
    try {
      const testQuery = 'SELECT COUNT(*) as count FROM news';
      const testResult = await dbQuery(testQuery, []);
      console.log('✅ Test simple réussi:', testResult);
    } catch (testError) {
      console.log('❌ Test simple échoué:', testError.message);
    }
    
    const news = await dbQuery(sql, params);
    
    // Compter le total
    let countSql = 'SELECT COUNT(*) as total FROM news n WHERE 1=1';
    let countParams = [];
    
    if (!req.user || !['admin', 'staff'].includes(req.user.role)) {
      countSql += ' AND n.status = "published"';
    } else if (status) {
      countSql += ' AND n.status = ?';
      countParams.push(status);
    }
    
    if (upcoming) {
      countSql += ' AND n.event_date >= CURDATE()';
    }
    
    const totalResult = await dbQuery(countSql, countParams);
    const total = totalResult[0].total;

    res.json({
      message: 'Actualités récupérées avec succès',
      news,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des actualités:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération des actualités'
    });
  }
});

// GET /api/news/:id - Obtenir une actualité par ID
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const newsId = parseInt(req.params.id);
    
    if (isNaN(newsId)) {
      return res.status(400).json({
        error: 'ID actualité invalide'
      });
    }

    let sql = `
      SELECT n.*, u.first_name as author_first_name, u.last_name as author_last_name
      FROM news n
      INNER JOIN users u ON n.author_id = u.id
      WHERE n.id = ?
    `;
    let params = [newsId];

    // Si l'utilisateur n'est pas staff, ne montrer que les actualités publiées
    if (!req.user || !['admin', 'staff'].includes(req.user.role)) {
      sql += ' AND n.status = "published"';
    }

    const results = await dbQuery(sql, params);
    
    if (results.length === 0) {
      return res.status(404).json({
        error: 'Actualité non trouvée'
      });
    }

    res.json({
      message: 'Actualité récupérée avec succès',
      news: results[0]
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'actualité:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération de l\'actualité'
    });
  }
});

// POST /api/news - Créer une nouvelle actualité (staff seulement)
router.post('/', [
  authenticateToken,
  requireStaff,
  body('title_fr')
    .trim()
    .isLength({ min: 5, max: 255 })
    .withMessage('Le titre français doit contenir entre 5 et 255 caractères'),
  body('title_ar')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Le titre arabe ne peut dépasser 255 caractères'),
  body('description_fr')
    .trim()
    .isLength({ min: 20 })
    .withMessage('La description française doit contenir au moins 20 caractères'),
  body('description_ar')
    .optional()
    .trim(),
  body('image_url')
    .optional()
    .isURL()
    .withMessage('URL d\'image invalide'),
  body('event_date')
    .optional()
    .isISO8601()
    .withMessage('Date d\'événement invalide (format YYYY-MM-DD)'),
  body('status')
    .optional()
    .isIn(['draft', 'published'])
    .withMessage('Statut invalide')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Données invalides',
        details: errors.array()
      });
    }

    const { 
      title_fr, 
      title_ar, 
      description_fr, 
      description_ar, 
      image_url, 
      event_date, 
      status = 'draft' 
    } = req.body;
    const author_id = req.user.id;
    const published_at = status === 'published' ? new Date() : null;

    const sql = `
      INSERT INTO news (title_fr, title_ar, description_fr, description_ar, image_url, event_date, status, author_id, published_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const result = await dbQuery(sql, [
      title_fr,
      title_ar,
      description_fr,
      description_ar,
      image_url,
      event_date,
      status,
      author_id,
      published_at
    ]);
    
    // Récupérer l'actualité créée
    const newsSql = `
      SELECT n.*, u.first_name as author_first_name, u.last_name as author_last_name
      FROM news n
      INNER JOIN users u ON n.author_id = u.id
      WHERE n.id = ?
    `;
    
    const news = await dbQuery(newsSql, [result.insertId]);

    res.status(201).json({
      message: 'Actualité créée avec succès',
      news: news[0]
    });
  } catch (error) {
    console.error('Erreur lors de la création de l\'actualité:', error);
    res.status(500).json({
      error: 'Erreur lors de la création de l\'actualité'
    });
  }
});

// PUT /api/news/:id - Mettre à jour une actualité (staff seulement)
router.put('/:id', [
  authenticateToken,
  requireStaff,
  body('title_fr')
    .optional()
    .trim()
    .isLength({ min: 5, max: 255 })
    .withMessage('Le titre français doit contenir entre 5 et 255 caractères'),
  body('title_ar')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Le titre arabe ne peut dépasser 255 caractères'),
  body('description_fr')
    .optional()
    .trim()
    .isLength({ min: 20 })
    .withMessage('La description française doit contenir au moins 20 caractères'),
  body('description_ar')
    .optional()
    .trim(),
  body('image_url')
    .optional()
    .isURL()
    .withMessage('URL d\'image invalide'),
  body('event_date')
    .optional()
    .isISO8601()
    .withMessage('Date d\'événement invalide (format YYYY-MM-DD)'),
  body('status')
    .optional()
    .isIn(['draft', 'published'])
    .withMessage('Statut invalide')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Données invalides',
        details: errors.array()
      });
    }

    const newsId = parseInt(req.params.id);
    
    if (isNaN(newsId)) {
      return res.status(400).json({
        error: 'ID actualité invalide'
      });
    }

    // Vérifier si l'actualité existe
    const existingNews = await dbQuery('SELECT * FROM news WHERE id = ?', [newsId]);
    if (existingNews.length === 0) {
      return res.status(404).json({
        error: 'Actualité non trouvée'
      });
    }

    const { 
      title_fr, 
      title_ar, 
      description_fr, 
      description_ar, 
      image_url, 
      event_date, 
      status 
    } = req.body;
    const updateFields = [];
    const updateValues = [];

    if (title_fr !== undefined) {
      updateFields.push('title_fr = ?');
      updateValues.push(title_fr);
    }

    if (title_ar !== undefined) {
      updateFields.push('title_ar = ?');
      updateValues.push(title_ar);
    }

    if (description_fr !== undefined) {
      updateFields.push('description_fr = ?');
      updateValues.push(description_fr);
    }

    if (description_ar !== undefined) {
      updateFields.push('description_ar = ?');
      updateValues.push(description_ar);
    }

    if (image_url !== undefined) {
      updateFields.push('image_url = ?');
      updateValues.push(image_url);
    }

    if (event_date !== undefined) {
      updateFields.push('event_date = ?');
      updateValues.push(event_date);
    }

    if (status !== undefined) {
      updateFields.push('status = ?');
      updateValues.push(status);
      
      // Si on publie l'actualité, mettre à jour published_at
      if (status === 'published' && existingNews[0].status !== 'published') {
        updateFields.push('published_at = NOW()');
      } else if (status === 'draft') {
        updateFields.push('published_at = NULL');
      }
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        error: 'Aucune donnée à mettre à jour'
      });
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    updateValues.push(newsId);

    const sql = `UPDATE news SET ${updateFields.join(', ')} WHERE id = ?`;
    await dbQuery(sql, updateValues);

    // Récupérer l'actualité mise à jour
    const newsSql = `
      SELECT n.*, u.first_name as author_first_name, u.last_name as author_last_name
      FROM news n
      INNER JOIN users u ON n.author_id = u.id
      WHERE n.id = ?
    `;
    
    const news = await dbQuery(newsSql, [newsId]);

    res.json({
      message: 'Actualité mise à jour avec succès',
      news: news[0]
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'actualité:', error);
    res.status(500).json({
      error: 'Erreur lors de la mise à jour de l\'actualité'
    });
  }
});

// DELETE /api/news/:id - Supprimer une actualité (staff seulement)
router.delete('/:id', [
  authenticateToken,
  requireStaff
], async (req, res) => {
  try {
    const newsId = parseInt(req.params.id);
    
    if (isNaN(newsId)) {
      return res.status(400).json({
        error: 'ID actualité invalide'
      });
    }

    const result = await dbQuery('DELETE FROM news WHERE id = ?', [newsId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        error: 'Actualité non trouvée'
      });
    }

    res.json({
      message: 'Actualité supprimée avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'actualité:', error);
    res.status(500).json({
      error: 'Erreur lors de la suppression de l\'actualité'
    });
  }
});

module.exports = router;
