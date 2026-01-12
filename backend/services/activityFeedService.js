/**
 * Service pour le Fil d'Activité Simplifié
 * Crèche Mima El Ghalia
 * 
 * Version orientée métier pour le directeur
 */

const db = require('../config/db_postgres');

// Messages lisibles par type d'action
const ACTION_MESSAGES = {
    // Actions Parents
    login_success: { icon: '🔐', getMessage: (data) => `s'est connecté(e)` },
    logout: { icon: '👋', getMessage: (data) => `s'est déconnecté(e)` },
    enrollment_created: { icon: '📝', getMessage: (data) => `a inscrit son enfant ${data.target_name || ''}` },
    document_uploaded: { icon: '📎', getMessage: (data) => `a ajouté un document${data.target_name ? ` pour ${data.target_name}` : ''}` },
    absence_requested: { icon: '❌', getMessage: (data) => `a signalé une absence${data.target_name ? ` pour ${data.target_name}` : ''}` },
    appointment_created: { icon: '📅', getMessage: (data) => `a pris rendez-vous` },
    contact_received: { icon: '💬', getMessage: (data) => `a envoyé un message de contact` },
    profile_updated: { icon: '👤', getMessage: (data) => `a mis à jour son profil` },

    // Actions Staff
    attendance_checkin: { icon: '🚪', getMessage: (data) => `a pointé l'arrivée de ${data.target_name || 'un enfant'}` },
    attendance_checkout: { icon: '👋', getMessage: (data) => `a pointé le départ de ${data.target_name || 'un enfant'}` },
    attendance_recorded: { icon: '✅', getMessage: (data) => `a enregistré une présence` },
    daily_report_created: { icon: '📋', getMessage: (data) => `a rempli un rapport journalier` },
    activity_created: { icon: '📸', getMessage: (data) => `a partagé une activité` },
    child_updated: { icon: '👶', getMessage: (data) => `a mis à jour les infos de ${data.target_name || 'un enfant'}` },

    // Actions Admin
    enrollment_approved: { icon: '✅', getMessage: (data) => `a validé l'inscription de ${data.target_name || 'un enfant'}` },
    enrollment_rejected: { icon: '❌', getMessage: (data) => `a refusé l'inscription de ${data.target_name || 'un enfant'}` },
    user_created: { icon: '👤', getMessage: (data) => `a créé un compte utilisateur` },
    user_updated: { icon: '✏️', getMessage: (data) => `a modifié un compte utilisateur` },
    user_deleted: { icon: '🗑️', getMessage: (data) => `a supprimé un compte utilisateur` },
    child_created: { icon: '👶', getMessage: (data) => `a ajouté l'enfant ${data.target_name || ''}` },
    child_deleted: { icon: '🗑️', getMessage: (data) => `a supprimé un enfant` },
    announcement_created: { icon: '📢', getMessage: (data) => `a publié une annonce` },
    settings_updated: { icon: '⚙️', getMessage: (data) => `a modifié les paramètres` },
    backup_created: { icon: '💾', getMessage: (data) => `a créé une sauvegarde` },

    // Actions système
    email_sent: { icon: '📧', getMessage: (data) => `Email envoyé` },
    email_failed: { icon: '⚠️', getMessage: (data) => `Échec d'envoi email` },

    // Défaut
    default: { icon: '📝', getMessage: (data) => data.title || 'Action effectuée' }
};

// Couleurs par rôle
const ROLE_COLORS = {
    admin: 'purple',
    staff: 'blue',
    parent: 'green',
    system: 'gray'
};

// Labels par rôle
const ROLE_LABELS = {
    admin: 'Direction',
    staff: 'Éducatrice',
    parent: 'Parent',
    system: 'Système'
};

const activityFeedService = {
    /**
     * Récupérer le fil d'activité simplifié
     */
    async getFeed(params = {}) {
        const {
            page = 1,
            limit = 30,
            role = null,
            date = null,
            userId = null
        } = params;

        const offset = (page - 1) * limit;
        const conditions = ['1=1'];
        const values = [];
        let paramIndex = 1;

        // Exclure les actions de debug et les requêtes GET simples
        conditions.push(`action NOT IN ('get_', 'options_')`);
        conditions.push(`action NOT LIKE 'get_%'`);

        if (role) {
            conditions.push(`user_role = $${paramIndex++}`);
            values.push(role);
        }

        if (date) {
            conditions.push(`DATE(created_at) = $${paramIndex++}`);
            values.push(date);
        }

        if (userId) {
            conditions.push(`user_id = $${paramIndex++}`);
            values.push(userId);
        }

        const whereClause = conditions.join(' AND ');

        try {
            const result = await db.query(`
        SELECT 
          id,
          action,
          category,
          severity,
          title,
          description,
          user_id,
          user_email,
          user_name,
          user_role,
          target_type,
          target_id,
          target_name,
          metadata,
          created_at
        FROM activity_logs
        WHERE ${whereClause}
        ORDER BY created_at DESC
        LIMIT $${paramIndex++} OFFSET $${paramIndex}
      `, [...values, limit, offset]);

            // Transformer les logs en messages lisibles
            const feed = result.rows.map(log => this.transformToFeedItem(log));

            // Compter le total
            const countResult = await db.query(`
        SELECT COUNT(*) as total
        FROM activity_logs
        WHERE ${whereClause}
      `, values);

            return {
                feed,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: parseInt(countResult.rows[0].total),
                    totalPages: Math.ceil(countResult.rows[0].total / limit)
                }
            };
        } catch (error) {
            console.error('❌ Erreur récupération feed:', error);
            throw error;
        }
    },

    /**
     * Transformer un log en élément de fil d'activité lisible
     */
    transformToFeedItem(log) {
        const actionConfig = ACTION_MESSAGES[log.action] || ACTION_MESSAGES.default;

        return {
            id: log.id,
            // Informations utilisateur
            userName: log.user_name || 'Utilisateur',
            userRole: log.user_role || 'system',
            userRoleLabel: ROLE_LABELS[log.user_role] || 'Système',
            userRoleColor: ROLE_COLORS[log.user_role] || 'gray',

            // Message lisible
            icon: actionConfig.icon,
            message: actionConfig.getMessage(log),

            // Métadonnées
            action: log.action,
            category: log.category,
            targetName: log.target_name,
            targetType: log.target_type,

            // Temps
            createdAt: log.created_at,
            timeAgo: this.getTimeAgo(log.created_at)
        };
    },

    /**
     * Calculer le temps écoulé
     */
    getTimeAgo(date) {
        const now = new Date();
        const past = new Date(date);
        const diffMs = now - past;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'à l\'instant';
        if (diffMins < 60) return `il y a ${diffMins} min`;
        if (diffHours < 24) return `il y a ${diffHours}h`;
        if (diffDays === 1) return 'hier';
        if (diffDays < 7) return `il y a ${diffDays} jours`;
        return past.toLocaleDateString('fr-FR');
    },

    /**
     * Résumé du jour
     */
    async getDailySummary(date = null) {
        const targetDate = date || new Date().toISOString().split('T')[0];

        try {
            // Statistiques générales
            const stats = await db.query(`
        SELECT 
          COUNT(*) FILTER (WHERE user_role = 'parent') as parent_actions,
          COUNT(*) FILTER (WHERE user_role = 'staff') as staff_actions,
          COUNT(*) FILTER (WHERE user_role = 'admin') as admin_actions,
          COUNT(DISTINCT user_id) FILTER (WHERE user_role = 'parent') as active_parents,
          COUNT(DISTINCT user_id) FILTER (WHERE user_role = 'staff') as active_staff,
          COUNT(*) FILTER (WHERE action = 'enrollment_created') as new_enrollments,
          COUNT(*) FILTER (WHERE action = 'enrollment_approved') as approved_enrollments,
          COUNT(*) FILTER (WHERE action LIKE 'attendance%') as attendance_actions,
          COUNT(*) FILTER (WHERE action = 'document_uploaded') as documents_uploaded,
          COUNT(*) FILTER (WHERE action = 'contact_received') as messages_received
        FROM activity_logs
        WHERE DATE(created_at) = $1
      `, [targetDate]);

            // Présences du jour
            const attendance = await db.query(`
        SELECT 
          COUNT(*) FILTER (WHERE status = 'present') as present,
          COUNT(*) FILTER (WHERE status = 'absent') as absent,
          COUNT(*) as total
        FROM attendance
        WHERE date = $1
      `, [targetDate]);

            // Dernières actions importantes
            const recentActions = await db.query(`
        SELECT 
          id, action, user_name, user_role, target_name, created_at
        FROM activity_logs
        WHERE DATE(created_at) = $1
          AND action IN ('enrollment_created', 'enrollment_approved', 'enrollment_rejected', 
                         'contact_received', 'document_uploaded', 'announcement_created')
        ORDER BY created_at DESC
        LIMIT 5
      `, [targetDate]);

            // Transformer les actions récentes de manière sécurisée
            const recentImportant = recentActions.rows.map(log => {
                try {
                    return this.transformToFeedItem(log);
                } catch (e) {
                    return {
                        id: log.id,
                        userName: log.user_name || 'Utilisateur',
                        userRole: log.user_role || 'system',
                        message: log.action,
                        createdAt: log.created_at
                    };
                }
            });

            return {
                date: targetDate,
                stats: stats.rows[0] || {
                    parent_actions: 0,
                    staff_actions: 0,
                    admin_actions: 0,
                    active_parents: 0,
                    active_staff: 0,
                    new_enrollments: 0,
                    approved_enrollments: 0,
                    attendance_actions: 0,
                    documents_uploaded: 0,
                    messages_received: 0
                },
                attendance: attendance.rows[0] || { present: 0, absent: 0, total: 0 },
                recentImportant
            };
        } catch (error) {
            console.error('❌ Erreur résumé journalier:', error);
            throw error;
        }
    },

    /**
     * Données pour le calendrier
     */
    async getCalendarData(year, month) {
        try {
            const result = await db.query(`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as total_actions,
          COUNT(*) FILTER (WHERE user_role = 'parent') as parent_actions,
          COUNT(*) FILTER (WHERE user_role = 'staff') as staff_actions,
          COUNT(*) FILTER (WHERE user_role = 'admin') as admin_actions,
          COUNT(*) FILTER (WHERE severity = 'warning' OR severity = 'critical') as alerts
        FROM activity_logs
        WHERE EXTRACT(YEAR FROM created_at) = $1
          AND EXTRACT(MONTH FROM created_at) = $2
        GROUP BY DATE(created_at)
        ORDER BY date
      `, [year, month]);

            return result.rows.map(row => ({
                date: row.date,
                totalActions: parseInt(row.total_actions),
                parentActions: parseInt(row.parent_actions),
                staffActions: parseInt(row.staff_actions),
                adminActions: parseInt(row.admin_actions),
                hasAlerts: parseInt(row.alerts) > 0
            }));
        } catch (error) {
            console.error('❌ Erreur données calendrier:', error);
            throw error;
        }
    },

    /**
     * Activités par utilisateur
     */
    async getUserActivity(userId, limit = 20) {
        try {
            const result = await db.query(`
        SELECT 
          id, action, category, title, target_name, created_at
        FROM activity_logs
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT $2
      `, [userId, limit]);

            return result.rows.map(log => this.transformToFeedItem(log));
        } catch (error) {
            console.error('❌ Erreur activité utilisateur:', error);
            throw error;
        }
    }
};

module.exports = activityFeedService;
