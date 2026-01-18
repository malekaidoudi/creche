/**
 * Routes API pour les témoignages parents
 * Crèche Mima El Ghalia
 */

const express = require('express');
const router = express.Router();
const db = require('../config/db_postgres');
const auth = require('../middleware/auth');

// ============================================
// ROUTES PUBLIQUES
// ============================================

/**
 * GET /api/testimonials/approved
 * Récupérer les témoignages approuvés (pour la page d'accueil)
 * Accessible publiquement
 */
router.get('/approved', async (req, res) => {
    try {
        const { limit = 10, featured_only = false } = req.query;

        let query = `
      SELECT 
        t.id,
        t.parent_name,
        t.child_name,
        t.content,
        t.rating,
        t.is_featured,
        t.created_at,
        u.profile_image as parent_image
      FROM testimonials t
      LEFT JOIN users u ON t.user_id = u.id
      WHERE t.status = 'approved'
    `;

        if (featured_only === 'true') {
            query += ` AND t.is_featured = TRUE`;
        }

        query += ` ORDER BY t.is_featured DESC, t.created_at DESC LIMIT $1`;

        const result = await db.query(query, [parseInt(limit)]);

        res.json({
            success: true,
            testimonials: result.rows,
            count: result.rows.length
        });
    } catch (error) {
        console.error('❌ Erreur récupération témoignages approuvés:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la récupération des témoignages'
        });
    }
});

/**
 * GET /api/testimonials/stats
 * Statistiques publiques des témoignages
 */
router.get('/stats', async (req, res) => {
    try {
        const result = await db.query(`
      SELECT 
        COUNT(*) as total_approved,
        ROUND(AVG(rating)::numeric, 1) as average_rating,
        COUNT(CASE WHEN rating = 5 THEN 1 END) as five_stars
      FROM testimonials
      WHERE status = 'approved'
    `);

        res.json({
            success: true,
            stats: result.rows[0]
        });
    } catch (error) {
        console.error('❌ Erreur statistiques témoignages:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la récupération des statistiques'
        });
    }
});

// ============================================
// ROUTES PARENTS (authentifiées)
// ============================================

/**
 * POST /api/testimonials
 * Soumettre un nouveau témoignage (parent uniquement)
 */
router.post('/', auth.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId || req.user.id;
        const userRole = req.user.role;

        // Seuls les parents peuvent soumettre des témoignages
        if (userRole !== 'parent') {
            return res.status(403).json({
                success: false,
                error: 'Seuls les parents peuvent soumettre des témoignages'
            });
        }

        const { content, rating = 5, child_name } = req.body;

        // Validation
        if (!content || content.trim().length < 10) {
            return res.status(400).json({
                success: false,
                error: 'Le témoignage doit contenir au moins 10 caractères'
            });
        }

        if (content.length > 1000) {
            return res.status(400).json({
                success: false,
                error: 'Le témoignage ne peut pas dépasser 1000 caractères'
            });
        }

        if (rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                error: 'La note doit être entre 1 et 5'
            });
        }

        // Récupérer le nom du parent
        const userResult = await db.query(
            'SELECT first_name, last_name FROM users WHERE id = $1',
            [userId]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Utilisateur non trouvé'
            });
        }

        const parentName = `${userResult.rows[0].first_name} ${userResult.rows[0].last_name}`;

        // Vérifier si le parent a déjà un témoignage en attente
        const pendingCheck = await db.query(
            'SELECT id FROM testimonials WHERE user_id = $1 AND status = $2',
            [userId, 'pending']
        );

        if (pendingCheck.rows.length > 0) {
            return res.status(400).json({
                success: false,
                error: 'Vous avez déjà un témoignage en attente de validation'
            });
        }

        // Insérer le témoignage
        const result = await db.query(`
      INSERT INTO testimonials (user_id, parent_name, child_name, content, rating, status)
      VALUES ($1, $2, $3, $4, $5, 'pending')
      RETURNING *
    `, [userId, parentName, child_name || null, content.trim(), rating]);

        console.log(`✅ Nouveau témoignage soumis par ${parentName} (ID: ${result.rows[0].id})`);

        res.status(201).json({
            success: true,
            message: 'Témoignage soumis avec succès. Il sera visible après validation.',
            testimonial: result.rows[0]
        });
    } catch (error) {
        console.error('❌ Erreur soumission témoignage:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la soumission du témoignage'
        });
    }
});

/**
 * GET /api/testimonials/my
 * Récupérer mes témoignages (parent)
 */
router.get('/my', auth.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId || req.user.id;

        const result = await db.query(`
      SELECT id, parent_name, child_name, content, rating, status, 
             admin_notes, is_featured, created_at, approved_at
      FROM testimonials
      WHERE user_id = $1
      ORDER BY created_at DESC
    `, [userId]);

        res.json({
            success: true,
            testimonials: result.rows
        });
    } catch (error) {
        console.error('❌ Erreur récupération mes témoignages:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la récupération de vos témoignages'
        });
    }
});

/**
 * DELETE /api/testimonials/:id
 * Supprimer mon témoignage (parent - seulement si en attente)
 */
router.delete('/:id', auth.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId || req.user.id;
        const userRole = req.user.role;
        const { id } = req.params;

        // Vérifier que le témoignage appartient à l'utilisateur ou que c'est un admin
        const checkResult = await db.query(
            'SELECT user_id, status FROM testimonials WHERE id = $1',
            [id]
        );

        if (checkResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Témoignage non trouvé'
            });
        }

        const testimonial = checkResult.rows[0];

        // Admin peut supprimer n'importe quel témoignage
        if (userRole === 'admin' || userRole === 'developer') {
            await db.query('DELETE FROM testimonials WHERE id = $1', [id]);
            return res.json({
                success: true,
                message: 'Témoignage supprimé'
            });
        }

        // Parent peut supprimer seulement son propre témoignage en attente
        if (testimonial.user_id !== userId) {
            return res.status(403).json({
                success: false,
                error: 'Vous ne pouvez pas supprimer ce témoignage'
            });
        }

        if (testimonial.status !== 'pending') {
            return res.status(400).json({
                success: false,
                error: 'Vous ne pouvez supprimer que les témoignages en attente'
            });
        }

        await db.query('DELETE FROM testimonials WHERE id = $1', [id]);

        res.json({
            success: true,
            message: 'Témoignage supprimé'
        });
    } catch (error) {
        console.error('❌ Erreur suppression témoignage:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la suppression du témoignage'
        });
    }
});

// ============================================
// ROUTES ADMIN (modération)
// ============================================

/**
 * GET /api/testimonials/all
 * Récupérer tous les témoignages (admin uniquement)
 */
router.get('/all', auth.authenticateToken, auth.requireRole('admin', 'developer'), async (req, res) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        let query = `
      SELECT 
        t.*,
        u.email as user_email,
        u.profile_image as parent_image,
        approver.first_name || ' ' || approver.last_name as approved_by_name
      FROM testimonials t
      LEFT JOIN users u ON t.user_id = u.id
      LEFT JOIN users approver ON t.approved_by = approver.id
    `;

        const params = [];

        if (status) {
            query += ` WHERE t.status = $1`;
            params.push(status);
        }

        query += ` ORDER BY 
      CASE t.status 
        WHEN 'pending' THEN 1 
        WHEN 'approved' THEN 2 
        ELSE 3 
      END,
      t.created_at DESC
    `;

        query += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(parseInt(limit), offset);

        const result = await db.query(query, params);

        // Compter le total
        let countQuery = 'SELECT COUNT(*) FROM testimonials';
        const countParams = [];
        if (status) {
            countQuery += ' WHERE status = $1';
            countParams.push(status);
        }
        const countResult = await db.query(countQuery, countParams);
        const total = parseInt(countResult.rows[0].count);

        // Statistiques par statut
        const statsResult = await db.query(`
      SELECT 
        status,
        COUNT(*) as count
      FROM testimonials
      GROUP BY status
    `);

        const stats = {
            pending: 0,
            approved: 0,
            rejected: 0
        };
        statsResult.rows.forEach(row => {
            stats[row.status] = parseInt(row.count);
        });

        res.json({
            success: true,
            testimonials: result.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / parseInt(limit))
            },
            stats
        });
    } catch (error) {
        console.error('❌ Erreur récupération tous témoignages:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la récupération des témoignages'
        });
    }
});

/**
 * PUT /api/testimonials/:id/approve
 * Approuver un témoignage (admin)
 */
router.put('/:id/approve', auth.authenticateToken, auth.requireRole('admin', 'developer'), async (req, res) => {
    try {
        const adminId = req.user.userId || req.user.id;
        const { id } = req.params;
        const { is_featured = false } = req.body;

        const result = await db.query(`
      UPDATE testimonials
      SET status = 'approved',
          approved_at = CURRENT_TIMESTAMP,
          approved_by = $1,
          is_featured = $2,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *
    `, [adminId, is_featured, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Témoignage non trouvé'
            });
        }

        console.log(`✅ Témoignage #${id} approuvé par admin #${adminId}`);

        res.json({
            success: true,
            message: 'Témoignage approuvé',
            testimonial: result.rows[0]
        });
    } catch (error) {
        console.error('❌ Erreur approbation témoignage:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de l\'approbation du témoignage'
        });
    }
});

/**
 * PUT /api/testimonials/:id/reject
 * Rejeter un témoignage (admin)
 */
router.put('/:id/reject', auth.authenticateToken, auth.requireRole('admin', 'developer'), async (req, res) => {
    try {
        const { id } = req.params;
        const { admin_notes } = req.body;

        const result = await db.query(`
      UPDATE testimonials
      SET status = 'rejected',
          admin_notes = $1,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `, [admin_notes || null, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Témoignage non trouvé'
            });
        }

        console.log(`❌ Témoignage #${id} rejeté`);

        res.json({
            success: true,
            message: 'Témoignage rejeté',
            testimonial: result.rows[0]
        });
    } catch (error) {
        console.error('❌ Erreur rejet témoignage:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors du rejet du témoignage'
        });
    }
});

/**
 * PUT /api/testimonials/:id/feature
 * Mettre en avant un témoignage (admin)
 */
router.put('/:id/feature', auth.authenticateToken, auth.requireRole('admin', 'developer'), async (req, res) => {
    try {
        const { id } = req.params;
        const { is_featured } = req.body;

        const result = await db.query(`
      UPDATE testimonials
      SET is_featured = $1,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 AND status = 'approved'
      RETURNING *
    `, [is_featured, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Témoignage non trouvé ou non approuvé'
            });
        }

        res.json({
            success: true,
            message: is_featured ? 'Témoignage mis en avant' : 'Témoignage retiré de la mise en avant',
            testimonial: result.rows[0]
        });
    } catch (error) {
        console.error('❌ Erreur mise en avant témoignage:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la mise en avant du témoignage'
        });
    }
});

module.exports = router;
