const express = require('express');
const router = express.Router();
const db = require('../config/db_postgres');
const { authenticateToken } = require('../middleware/auth');

/**
 * GET /api/dashboard/stats - Récupérer les statistiques du dashboard
 * Retourne les vraies valeurs depuis la base de données
 */
router.get('/stats', authenticateToken, async (req, res) => {
    try {
        console.log('📊 Chargement des statistiques du dashboard...');

        // 1. Nombre total d'enfants actifs
        const childrenResult = await db.query(`
            SELECT COUNT(*) as total 
            FROM children 
            WHERE is_active = true
        `);
        const totalChildren = parseInt(childrenResult.rows[0].total) || 0;

        // 2. Enfants présents aujourd'hui
        const today = new Date().toISOString().split('T')[0];
        const presentResult = await db.query(`
            SELECT COUNT(DISTINCT child_id) as present 
            FROM attendance 
            WHERE date = $1 
            AND check_in_time IS NOT NULL 
            AND check_out_time IS NULL
        `, [today]);
        const presentToday = parseInt(presentResult.rows[0].present) || 0;

        // 3. Demandes d'inscription en attente
        const pendingResult = await db.query(`
            SELECT COUNT(*) as pending 
            FROM enrollments 
            WHERE status = 'pending'
        `);
        const pendingEnrollments = parseInt(pendingResult.rows[0].pending) || 0;

        // 4. Capacité maximale depuis nursery_settings
        const capacityResult = await db.query(`
            SELECT value_fr 
            FROM nursery_settings 
            WHERE setting_key = 'max_capacity'
        `);
        const maxCapacity = parseInt(capacityResult.rows[0]?.value_fr) || 30;

        // 5. Places disponibles
        const availablePlaces = Math.max(0, maxCapacity - totalChildren);

        // 6. Taux de présence aujourd'hui
        const attendanceRate = totalChildren > 0
            ? Math.round((presentToday / totalChildren) * 100)
            : 0;

        // 7. Nouvelles inscriptions ce mois
        const firstDayOfMonth = new Date();
        firstDayOfMonth.setDate(1);
        firstDayOfMonth.setHours(0, 0, 0, 0);

        const newEnrollmentsResult = await db.query(`
            SELECT COUNT(*) as count 
            FROM enrollments 
            WHERE created_at >= $1
        `, [firstDayOfMonth.toISOString()]);
        const newEnrollmentsThisMonth = parseInt(newEnrollmentsResult.rows[0].count) || 0;

        // 8. Absences prévues aujourd'hui
        const absencesResult = await db.query(`
            SELECT COUNT(*) as count 
            FROM absence_requests 
            WHERE $1 BETWEEN start_date AND end_date 
            AND status = 'approved'
        `, [today]);
        const plannedAbsences = parseInt(absencesResult.rows[0].count) || 0;

        const stats = {
            totalChildren,
            presentToday,
            pendingEnrollments,
            maxCapacity,
            availablePlaces,
            attendanceRate,
            newEnrollmentsThisMonth,
            plannedAbsences
        };

        console.log('✅ Statistiques chargées:', stats);

        res.json({
            success: true,
            stats
        });

    } catch (error) {
        console.error('❌ Erreur statistiques dashboard:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la récupération des statistiques',
            stats: {
                totalChildren: 0,
                presentToday: 0,
                pendingEnrollments: 0,
                maxCapacity: 30,
                availablePlaces: 30,
                attendanceRate: 0,
                newEnrollmentsThisMonth: 0,
                plannedAbsences: 0
            }
        });
    }
});

/**
 * GET /api/dashboard/overview - Vue d'ensemble rapide
 */
router.get('/overview', authenticateToken, async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];

        // Requête combinée pour performance
        const result = await db.query(`
            SELECT 
                (SELECT COUNT(*) FROM children WHERE is_active = true) as total_children,
                (SELECT COUNT(DISTINCT child_id) FROM attendance WHERE date = $1 AND check_in_time IS NOT NULL) as checked_in,
                (SELECT COUNT(*) FROM enrollments WHERE status = 'pending') as pending,
                (SELECT value_fr FROM nursery_settings WHERE setting_key = 'max_capacity') as capacity
        `, [today]);

        const data = result.rows[0];

        res.json({
            success: true,
            overview: {
                totalChildren: parseInt(data.total_children) || 0,
                checkedIn: parseInt(data.checked_in) || 0,
                pendingEnrollments: parseInt(data.pending) || 0,
                capacity: parseInt(data.capacity) || 30
            }
        });

    } catch (error) {
        console.error('❌ Erreur overview dashboard:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la récupération de la vue d\'ensemble'
        });
    }
});

module.exports = router;
