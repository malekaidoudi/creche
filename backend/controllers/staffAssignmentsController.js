const db = require('../config/db_postgres');

/**
 * GET /api/staff-assignments
 * Liste tous les membres du staff avec leurs affectations de tranche d'âge
 */
const getStaffAssignments = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT 
                u.id,
                u.first_name,
                u.last_name,
                u.email,
                u.role,
                u.profile_image,
                COALESCE(sa.age_group, 'both') as age_group
            FROM users u
            LEFT JOIN staff_age_assignments sa ON u.id = sa.staff_id
            WHERE u.role IN ('admin', 'staff') AND u.is_active = true
            ORDER BY u.role DESC, u.first_name, u.last_name
        `);

        res.json({
            success: true,
            staff: result.rows
        });
    } catch (error) {
        console.error('Erreur getStaffAssignments:', error);
        res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
    }
};

/**
 * PUT /api/staff-assignments/:staffId
 * Met à jour l'affectation de tranche d'âge d'un membre du staff
 */
const updateStaffAssignment = async (req, res) => {
    try {
        const { staffId } = req.params;
        const { age_group } = req.body;

        if (!['baby', 'child', 'both'].includes(age_group)) {
            return res.status(400).json({
                success: false,
                message: 'Tranche d\'âge invalide. Valeurs acceptées: baby, child, both'
            });
        }

        // Vérifier que l'utilisateur existe et est staff/admin
        const userCheck = await db.query(
            'SELECT id, role FROM users WHERE id = $1 AND role IN (\'admin\', \'staff\') AND is_active = true',
            [staffId]
        );

        if (userCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Membre du staff non trouvé'
            });
        }

        // Upsert l'affectation
        await db.query(`
            INSERT INTO staff_age_assignments (staff_id, age_group, updated_at)
            VALUES ($1, $2, CURRENT_TIMESTAMP)
            ON CONFLICT (staff_id) 
            DO UPDATE SET age_group = $2, updated_at = CURRENT_TIMESTAMP
        `, [staffId, age_group]);

        res.json({
            success: true,
            message: 'Affectation mise à jour avec succès',
            staff_id: parseInt(staffId),
            age_group
        });
    } catch (error) {
        console.error('Erreur updateStaffAssignment:', error);
        res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
    }
};

/**
 * GET /api/staff-assignments/my-assignment
 * Récupère l'affectation du staff connecté
 */
const getMyAssignment = async (req, res) => {
    try {
        const userId = req.user.id;

        const result = await db.query(`
            SELECT COALESCE(sa.age_group, 'both') as age_group
            FROM users u
            LEFT JOIN staff_age_assignments sa ON u.id = sa.staff_id
            WHERE u.id = $1
        `, [userId]);

        if (result.rows.length === 0) {
            return res.json({ success: true, age_group: 'both' });
        }

        res.json({
            success: true,
            age_group: result.rows[0].age_group
        });
    } catch (error) {
        console.error('Erreur getMyAssignment:', error);
        res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
    }
};

module.exports = {
    getStaffAssignments,
    updateStaffAssignment,
    getMyAssignment
};
