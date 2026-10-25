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

/**
 * GET /api/dashboard/recent-activities - Flux d'activités récentes (Enfants & Éducatrices)
 * Rassemble en direct : Pointages, Bilans du jour, Activités partagées, Absences, Inscriptions
 * Exclut toute donnée technique, erreur ou compte développeur
 */
router.get('/recent-activities', authenticateToken, async (req, res) => {
    try {
        const events = [];

        // 1. Arrivées et départs (attendance)
        try {
            const attResult = await db.query(`
                SELECT 
                    a.id,
                    a.check_in_time,
                    a.check_out_time,
                    a.created_at,
                    c.first_name,
                    c.last_name,
                    c.photo_url
                FROM attendance a
                JOIN children c ON a.child_id = c.id
                WHERE a.check_in_time IS NOT NULL
                ORDER BY COALESCE(a.check_out_time, a.check_in_time) DESC
                LIMIT 8
            `);

            attResult.rows.forEach(row => {
                const childName = `${row.first_name} ${row.last_name}`;
                if (row.check_out_time) {
                    events.push({
                        id: `att_out_${row.id}`,
                        type: 'check_out',
                        action: 'check_out',
                        title: 'Départ enfant',
                        titleAr: 'مغادرة الطفل',
                        message: `Départ de ${childName} validé`,
                        messageAr: `تم تسجيل مغادرة ${childName}`,
                        childName,
                        photoUrl: row.photo_url,
                        timestamp: new Date(row.check_out_time).toISOString(),
                        icon: 'UserX',
                        color: 'text-orange-500 bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800',
                        link: '/dashboard/attendance/today'
                    });
                }
                if (row.check_in_time) {
                    events.push({
                        id: `att_in_${row.id}`,
                        type: 'check_in',
                        action: 'check_in',
                        title: 'Arrivée enfant',
                        titleAr: 'وصول الطفل',
                        message: `Arrivée de ${childName} à la crèche`,
                        messageAr: `وصل(ت) ${childName} إلى الحضانة`,
                        childName,
                        photoUrl: row.photo_url,
                        timestamp: new Date(row.check_in_time).toISOString(),
                        icon: 'UserCheck',
                        color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800',
                        link: '/dashboard/attendance/today'
                    });
                }
            });
        } catch (e) {
            console.error('Erreur chargement pointages pour flux:', e.message);
        }

        // 2. Bilans du jour (daily_reports)
        try {
            const repResult = await db.query(`
                SELECT 
                    dr.id,
                    dr.date,
                    dr.created_at,
                    c.first_name,
                    c.last_name,
                    c.photo_url
                FROM daily_reports dr
                JOIN children c ON dr.child_id = c.id
                ORDER BY dr.created_at DESC
                LIMIT 8
            `);

            repResult.rows.forEach(row => {
                const childName = `${row.first_name} ${row.last_name}`;
                events.push({
                    id: `rep_${row.id}`,
                    type: 'daily_report',
                    action: 'daily_report',
                    title: 'Bilan journalier',
                    titleAr: 'التقرير اليومي',
                    message: `Bilan quotidien complété pour ${childName}`,
                    messageAr: `تم إكمال التقرير اليومي لـ ${childName}`,
                    childName,
                    photoUrl: row.photo_url,
                    timestamp: new Date(row.created_at || row.date).toISOString(),
                    icon: 'ClipboardList',
                    color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800',
                    link: '/dashboard/daily-reports'
                });
            });
        } catch (e) {
            console.error('Erreur chargement bilans pour flux:', e.message);
        }

        // 3. Activités partagées (activities)
        try {
            const actResult = await db.query(`
                SELECT 
                    act.id,
                    act.title,
                    act.created_at,
                    u.first_name as author_first_name,
                    u.last_name as author_last_name
                FROM activities act
                LEFT JOIN users u ON act.author_id = u.id
                WHERE COALESCE(u.role, 'staff') != 'developer'
                ORDER BY act.created_at DESC
                LIMIT 8
            `);

            actResult.rows.forEach(row => {
                const author = row.author_first_name ? `${row.author_first_name}` : 'L\'équipe';
                events.push({
                    id: `act_${row.id}`,
                    type: 'activity',
                    action: 'activity',
                    title: 'Activité partagée',
                    titleAr: 'نشاط تربوي',
                    message: `${author} a partagé l'activité "${row.title}"`,
                    messageAr: `شاركت ${author} نشاط "${row.title}"`,
                    activityTitle: row.title,
                    timestamp: new Date(row.created_at).toISOString(),
                    icon: 'Sparkles',
                    color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800',
                    link: '/dashboard/activities'
                });
            });
        } catch (e) {
            console.error('Erreur chargement activités pour flux:', e.message);
        }

        // 4. Demandes d'absence (absence_requests)
        try {
            const absResult = await db.query(`
                SELECT 
                    ar.id,
                    ar.start_date,
                    ar.end_date,
                    ar.reason,
                    ar.created_at,
                    c.first_name,
                    c.last_name,
                    c.photo_url
                FROM absence_requests ar
                JOIN children c ON ar.child_id = c.id
                ORDER BY ar.created_at DESC
                LIMIT 6
            `);

            absResult.rows.forEach(row => {
                const childName = `${row.first_name} ${row.last_name}`;
                events.push({
                    id: `abs_${row.id}`,
                    type: 'absence',
                    action: 'absence',
                    title: 'Absence signalée',
                    titleAr: 'طلب غياب',
                    message: `Absence signalée pour ${childName}`,
                    messageAr: `تم تسجيل طلب غياب لـ ${childName}`,
                    childName,
                    photoUrl: row.photo_url,
                    timestamp: new Date(row.created_at).toISOString(),
                    icon: 'AlertCircle',
                    color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800',
                    link: '/dashboard/absence-management'
                });
            });
        } catch (e) {
            console.error('Erreur chargement absences pour flux:', e.message);
        }

        // 5. Inscriptions récentes (enrollments)
        try {
            const enrResult = await db.query(`
                SELECT 
                    e.id,
                    e.status,
                    e.created_at,
                    c.first_name,
                    c.last_name
                FROM enrollments e
                JOIN children c ON e.child_id = c.id
                ORDER BY e.created_at DESC
                LIMIT 6
            `);

            enrResult.rows.forEach(row => {
                const childName = `${row.first_name} ${row.last_name}`;
                const isApproved = row.status === 'approved';
                events.push({
                    id: `enr_${row.id}`,
                    type: 'enrollment',
                    action: 'enrollment',
                    title: isApproved ? 'Inscription validée' : 'Nouvelle inscription',
                    titleAr: isApproved ? 'قبول تسجيل' : 'طلب تسجيل جديد',
                    message: isApproved 
                        ? `Inscription de ${childName} validée`
                        : `Nouvelle demande d'inscription pour ${childName}`,
                    messageAr: isApproved
                        ? `تم تأكيد تسجيل ${childName}`
                        : `طلب تسجيل جديد للطفل ${childName}`,
                    childName,
                    timestamp: new Date(row.created_at).toISOString(),
                    icon: 'CheckCircle',
                    color: isApproved 
                        ? 'text-teal-500 bg-teal-50 dark:bg-teal-950/30 border-teal-200 dark:border-teal-800'
                        : 'text-cyan-500 bg-cyan-50 dark:bg-cyan-950/30 border-cyan-200 dark:border-cyan-800',
                    link: '/dashboard/enrollments'
                });
            });
        } catch (e) {
            console.error('Erreur chargement inscriptions pour flux:', e.message);
        }

        // 6. Tâches terminées par le personnel (tasks)
        try {
            const tasksResult = await db.query(`
                SELECT 
                    t.id,
                    t.title,
                    t.description,
                    t.status,
                    t.completed_at,
                    t.created_at,
                    u.first_name as staff_first_name,
                    u.last_name as staff_last_name,
                    u.profile_image as staff_photo
                FROM tasks t
                LEFT JOIN users u ON t.assigned_to = u.id
                WHERE t.status = 'completed' AND t.completed_at IS NOT NULL
                ORDER BY t.completed_at DESC
                LIMIT 8
            `);

            tasksResult.rows.forEach(row => {
                const staffName = row.staff_first_name ? `${row.staff_first_name} ${row.staff_last_name || ''}`.trim() : 'Une éducatrice';
                events.push({
                    id: `task_done_${row.id}`,
                    type: 'task_completed',
                    action: 'task_completed',
                    title: 'Tâche terminée',
                    titleAr: 'مهمة منجزة',
                    message: `${staffName} a terminé la tâche : "${row.title}"`,
                    messageAr: `أكملت ${staffName} المهمة : "${row.title}"`,
                    taskTitle: row.title,
                    photoUrl: row.staff_photo,
                    timestamp: new Date(row.completed_at).toISOString(),
                    icon: 'CheckSquare',
                    color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800',
                    link: '/dashboard/tasks'
                });
            });
        } catch (e) {
            console.error('Erreur chargement tâches complétées pour flux:', e.message);
        }

        // 7. Tâches nouvellement assignées
        try {
            const assignedResult = await db.query(`
                SELECT 
                    t.id,
                    t.title,
                    t.created_at,
                    u.first_name as staff_first_name,
                    u.last_name as staff_last_name,
                    creator.first_name as creator_first_name
                FROM tasks t
                LEFT JOIN users u ON t.assigned_to = u.id
                LEFT JOIN users creator ON t.created_by = creator.id
                WHERE t.created_at > NOW() - INTERVAL '3 days'
                ORDER BY t.created_at DESC
                LIMIT 4
            `);

            assignedResult.rows.forEach(row => {
                const staffName = row.staff_first_name ? `${row.staff_first_name}` : 'l\'équipe';
                events.push({
                    id: `task_assigned_${row.id}`,
                    type: 'task_assigned',
                    action: 'task_assigned',
                    title: 'Tâche assignée',
                    titleAr: 'تكليف بمهمة',
                    message: `Tâche "${row.title}" assignée à ${staffName}`,
                    messageAr: `تم تكليف ${staffName} بمهمة "${row.title}"`,
                    taskTitle: row.title,
                    timestamp: new Date(row.created_at).toISOString(),
                    icon: 'ClipboardList',
                    color: 'text-cyan-600 bg-cyan-50 dark:bg-cyan-950/30 border-cyan-200 dark:border-cyan-800',
                    link: '/dashboard/tasks'
                });
            });
        } catch (e) {
            console.error('Erreur chargement tâches assignées pour flux:', e.message);
        }

        // Trier tous les événements par date décroissante
        events.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        // Prendre les 15 plus récents
        const recentActivities = events.slice(0, 15);

        res.json({
            success: true,
            activities: recentActivities
        });
    } catch (error) {
        console.error('❌ Erreur recent-activities dashboard:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la récupération des activités récentes'
        });
    }
});

module.exports = router;
