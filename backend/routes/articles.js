const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { query: dbQuery } = require('../config/database');
const { authenticateToken, requireStaff, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/articles - Obtenir tous les articles
router.get('/', [
  optionalAuth,
  query('page').optional().isInt({ min: 1 }).withMessage('Page doit être un entier positif'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit doit être entre 1 et 100'),
  query('status').optional().isIn(['draft', 'published']).withMessage('Statut invalide'),
  query('lang').optional().isIn(['fr', 'ar']).withMessage('Langue invalide'),
  query('search').optional().isLength({ min: 2 }).withMessage('Recherche doit contenir au moins 2 caractères')
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
    const lang = req.query.lang;
    const search = req.query.search;
    const offset = (page - 1) * limit;

    let sql = `
      SELECT a.*, u.first_name as author_first_name, u.last_name as author_last_name
      FROM articles a
      INNER JOIN users u ON a.author_id = u.id
      WHERE 1=1
    `;
    let params = [];

    // Si l'utilisateur n'est pas connecté ou n'est pas staff, ne montrer que les articles publiés
    if (!req.user || !['admin', 'staff'].includes(req.user.role)) {
      sql += ' AND a.status = "published"';
    } else if (status) {
      sql += ' AND a.status = ?';
      params.push(status);
    }

    // Recherche textuelle
    if (search) {
      if (lang === 'ar') {
        sql += ' AND (a.title_ar LIKE ? OR a.content_ar LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
      } else {
        sql += ' AND (a.title_fr LIKE ? OR a.content_fr LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
      }
    }

    sql += ' ORDER BY a.published_at DESC, a.created_at DESC';
    // Temporairement sans LIMIT pour tester
    // sql += ' LIMIT ?, ?';
    // params.push(parseInt(offset), parseInt(limit));

    console.log('🔍 Debug Articles - Paramètres:', { limit, offset, status });
    const articles = await dbQuery(sql, params);
    
    // Compter le total
    let countSql = 'SELECT COUNT(*) as total FROM articles a WHERE 1=1';
    let countParams = [];
    
    if (!req.user || !['admin', 'staff'].includes(req.user.role)) {
      countSql += ' AND a.status = "published"';
    } else if (status) {
      countSql += ' AND a.status = ?';
      countParams.push(status);
    }
    
    if (search) {
      if (lang === 'ar') {
        countSql += ' AND (a.title_ar LIKE ? OR a.content_ar LIKE ?)';
        countParams.push(`%${search}%`, `%${search}%`);
        countSql += ' AND (a.title_fr LIKE ? OR a.content_fr LIKE ?)';
        countParams.push(`%${search}%`, `%${search}%`);
      }
    }
    
    const totalResult = await dbQuery(countSql, countParams);
    const total = totalResult[0].total;

    res.json({
      message: 'Articles récupérés avec succès',
      articles,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des articles:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération des articles'
    });
  }
});

// GET /api/articles/:id - Obtenir un article par ID
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const articleId = parseInt(req.params.id);
    
    if (isNaN(articleId)) {
      return res.status(400).json({
        error: 'ID article invalide'
      });
    }

    let sql = `
      SELECT a.*, u.first_name as author_first_name, u.last_name as author_last_name
      FROM articles a
      INNER JOIN users u ON a.author_id = u.id
      WHERE a.id = ?
    `;
    let params = [articleId];

    // Si l'utilisateur n'est pas staff, ne montrer que les articles publiés
    if (!req.user || !['admin', 'staff'].includes(req.user.role)) {
      sql += ' AND a.status = "published"';
    }

    const results = await dbQuery(sql, params);
    
    if (results.length === 0) {
      return res.status(404).json({
        error: 'Article non trouvé'
      });
    }

    res.json({
      message: 'Article récupéré avec succès',
      article: results[0]
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'article:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération de l\'article'
    });
  }
});

// POST /api/articles - Créer un nouvel article (staff seulement)
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
  body('content_fr')
    .trim()
    .isLength({ min: 50 })
    .withMessage('Le contenu français doit contenir au moins 50 caractères'),
  body('content_ar')
    .optional()
    .trim(),
  body('image_url')
    .optional()
    .isURL()
    .withMessage('URL d\'image invalide'),
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

    const { title_fr, title_ar, content_fr, content_ar, image_url, status = 'draft' } = req.body;
    const author_id = req.user.id;
    const published_at = status === 'published' ? new Date() : null;

    const sql = `
      INSERT INTO articles (title_fr, title_ar, content_fr, content_ar, image_url, status, author_id, published_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const result = await dbQuery(sql, [
      title_fr,
      title_ar,
      content_fr,
      content_ar,
      image_url,
      status,
      author_id,
      published_at
    ]);
    
    // Récupérer l'article créé
    const articleSql = `
      SELECT a.*, u.first_name as author_first_name, u.last_name as author_last_name
      FROM articles a
      INNER JOIN users u ON a.author_id = u.id
      WHERE a.id = ?
    `;
    
    const article = await dbQuery(articleSql, [result.insertId]);

    res.status(201).json({
      message: 'Article créé avec succès',
      article: article[0]
    });
  } catch (error) {
    console.error('Erreur lors de la création de l\'article:', error);
    res.status(500).json({
      error: 'Erreur lors de la création de l\'article'
    });
  }
});

// PUT /api/articles/:id - Mettre à jour un article (staff seulement)
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
  body('content_fr')
    .optional()
    .trim()
    .isLength({ min: 50 })
    .withMessage('Le contenu français doit contenir au moins 50 caractères'),
  body('content_ar')
    .optional()
    .trim(),
  body('image_url')
    .optional()
    .isURL()
    .withMessage('URL d\'image invalide'),
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

    const articleId = parseInt(req.params.id);
    
    if (isNaN(articleId)) {
      return res.status(400).json({
        error: 'ID article invalide'
      });
    }

    // Vérifier si l'article existe
    const existingArticle = await dbQuery('SELECT * FROM articles WHERE id = ?', [articleId]);
    if (existingArticle.length === 0) {
      return res.status(404).json({
        error: 'Article non trouvé'
      });
    }

    const { title_fr, title_ar, content_fr, content_ar, image_url, status } = req.body;
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

    if (content_fr !== undefined) {
      updateFields.push('content_fr = ?');
      updateValues.push(content_fr);
    }

    if (content_ar !== undefined) {
      updateFields.push('content_ar = ?');
      updateValues.push(content_ar);
    }

    if (image_url !== undefined) {
      updateFields.push('image_url = ?');
      updateValues.push(image_url);
    }

    if (status !== undefined) {
      updateFields.push('status = ?');
      updateValues.push(status);
      
      // Si on publie l'article, mettre à jour published_at
      if (status === 'published' && existingArticle[0].status !== 'published') {
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
    updateValues.push(articleId);

    const sql = `UPDATE articles SET ${updateFields.join(', ')} WHERE id = ?`;
    await dbQuery(sql, updateValues);

    // Récupérer l'article mis à jour
    const articleSql = `
      SELECT a.*, u.first_name as author_first_name, u.last_name as author_last_name
      FROM articles a
      INNER JOIN users u ON a.author_id = u.id
      WHERE a.id = ?
    `;
    
    const article = await dbQuery(articleSql, [articleId]);

    res.json({
      message: 'Article mis à jour avec succès',
      article: article[0]
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'article:', error);
    res.status(500).json({
      error: 'Erreur lors de la mise à jour de l\'article'
    });
  }
});

// DELETE /api/articles/:id - Supprimer un article (staff seulement)
router.delete('/:id', [
  authenticateToken,
  requireStaff
], async (req, res) => {
  try {
    const articleId = parseInt(req.params.id);
    
    if (isNaN(articleId)) {
      return res.status(400).json({
        error: 'ID article invalide'
      });
    }

    const result = await dbQuery('DELETE FROM articles WHERE id = ?', [articleId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        error: 'Article non trouvé'
      });
    }

    res.json({
      message: 'Article supprimé avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'article:', error);
    res.status(500).json({
      error: 'Erreur lors de la suppression de l\'article'
    });
  }
});

module.exports = router;
