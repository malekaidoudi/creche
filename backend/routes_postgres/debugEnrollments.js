/**
 * Routes de diagnostic pour les inscriptions
 * À SUPPRIMER EN PRODUCTION
 */
const express = require('express');
const router = express.Router();
const db = require('../config/db_postgres');
const auth = require('../middleware/auth');

// GET /api/debug/enrollments - Voir toutes les inscriptions
router.get('/enrollments', auth.authenticateToken, auth.requireRole('admin'), async (req, res) => {
    try {
        const result = await db.query(`
      SELECT 
        e.id as enrollment_id,
        e.parent_id,
        e.child_id,
        e.status,
        e.child_first_name,
        e.child_last_name,
        e.applicant_email,
        u.email as parent_email,
        u.first_name as parent_first_name
      FROM enrollments e
      LEFT JOIN users u ON e.parent_id = u.id
      ORDER BY e.id
    `);

        res.json({
            success: true,
            enrollments: result.rows,
            count: result.rows.length
        });
    } catch (error) {
        console.error('Erreur:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/debug/parents - Voir tous les parents
router.get('/parents', auth.authenticateToken, auth.requireRole('admin'), async (req, res) => {
    try {
        const result = await db.query(`
      SELECT id, email, first_name, last_name, phone
      FROM users 
      WHERE role = 'parent'
      ORDER BY id
    `);

        res.json({
            success: true,
            parents: result.rows,
            count: result.rows.length
        });
    } catch (error) {
        console.error('Erreur:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/debug/children-without-parent - Enfants sans parent assigné
router.get('/children-without-parent', auth.authenticateToken, auth.requireRole('admin'), async (req, res) => {
    try {
        const result = await db.query(`
      SELECT 
        c.id,
        c.first_name,
        c.last_name,
        c.birth_date,
        e.id as enrollment_id,
        e.parent_id,
        e.status
      FROM children c
      LEFT JOIN enrollments e ON c.id = e.child_id
      WHERE c.is_active = true
      ORDER BY c.id
    `);

        res.json({
            success: true,
            children: result.rows,
            count: result.rows.length,
            withoutParent: result.rows.filter(c => !c.parent_id).length
        });
    } catch (error) {
        console.error('Erreur:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/debug/assign-child - Assigner un enfant à un parent
router.post('/assign-child', auth.authenticateToken, auth.requireRole('admin'), async (req, res) => {
    try {
        const { childId, parentId } = req.body;

        if (!childId || !parentId) {
            return res.status(400).json({
                success: false,
                error: 'childId et parentId sont requis'
            });
        }

        // Vérifier si une inscription existe déjà pour cet enfant
        const existingEnrollment = await db.query(
            'SELECT id FROM enrollments WHERE child_id = $1',
            [childId]
        );

        if (existingEnrollment.rows.length > 0) {
            // Mettre à jour le parent_id de l'inscription existante
            await db.query(
                'UPDATE enrollments SET parent_id = $1, updated_at = NOW() WHERE child_id = $2',
                [parentId, childId]
            );

            return res.json({
                success: true,
                message: `Inscription mise à jour: enfant ${childId} assigné au parent ${parentId}`,
                action: 'updated'
            });
        }

        // Créer une nouvelle inscription
        const child = await db.query(
            'SELECT first_name, last_name, birth_date, gender FROM children WHERE id = $1',
            [childId]
        );

        if (child.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Enfant non trouvé' });
        }

        const parent = await db.query(
            'SELECT first_name, last_name, email, phone FROM users WHERE id = $1',
            [parentId]
        );

        if (parent.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Parent non trouvé' });
        }

        const c = child.rows[0];
        const p = parent.rows[0];

        await db.query(`
      INSERT INTO enrollments (
        parent_id, child_id, child_first_name, child_last_name, 
        child_birth_date, child_gender, applicant_first_name, 
        applicant_last_name, applicant_email, applicant_phone, 
        status, enrollment_date, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'approved', NOW(), NOW())
    `, [
            parentId, childId, c.first_name, c.last_name,
            c.birth_date, c.gender, p.first_name,
            p.last_name, p.email, p.phone
        ]);

        res.json({
            success: true,
            message: `Nouvelle inscription créée: enfant ${childId} assigné au parent ${parentId}`,
            action: 'created'
        });

    } catch (error) {
        console.error('Erreur:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
