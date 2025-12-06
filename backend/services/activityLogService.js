/**
 * Service de gestion des logs d'activité
 * Crèche Mima El Ghalia - Journal d'Activité
 */

const db = require('../config/db_postgres');

// Catégories d'activités
const CATEGORIES = {
    AUTH: 'auth',
    ENROLLMENT: 'enrollment',
    ATTENDANCE: 'attendance',
    DOCUMENT: 'document',
    ACCOUNT: 'account',
    SYSTEM: 'system',
    SECURITY: 'security',
    CONTACT: 'contact',
    CHILD: 'child',
    PAYMENT: 'payment',
    OTHER: 'other'
};

// Niveaux de sévérité
const SEVERITY = {
    CRITICAL: 'critical',  // 🔴 Urgent
    WARNING: 'warning',    // 🟡 Important
    INFO: 'info',          // 🟢 Normal
    DEBUG: 'debug'         // ℹ️ Information
};

// Actions prédéfinies avec leurs métadonnées
const ACTIONS = {
    // Authentification
    LOGIN_SUCCESS: { action: 'login_success', category: CATEGORIES.AUTH, severity: SEVERITY.INFO, title: 'Connexion réussie' },
    LOGIN_FAILED: { action: 'login_failed', category: CATEGORIES.AUTH, severity: SEVERITY.WARNING, title: 'Échec de connexion' },
    LOGOUT: { action: 'logout', category: CATEGORIES.AUTH, severity: SEVERITY.DEBUG, title: 'Déconnexion' },
    PASSWORD_RESET: { action: 'password_reset', category: CATEGORIES.AUTH, severity: SEVERITY.INFO, title: 'Réinitialisation mot de passe' },
    PASSWORD_CHANGED: { action: 'password_changed', category: CATEGORIES.ACCOUNT, severity: SEVERITY.INFO, title: 'Mot de passe modifié' },

    // Comptes
    ACCOUNT_CREATED: { action: 'account_created', category: CATEGORIES.ACCOUNT, severity: SEVERITY.INFO, title: 'Nouveau compte créé' },
    ACCOUNT_UPDATED: { action: 'account_updated', category: CATEGORIES.ACCOUNT, severity: SEVERITY.INFO, title: 'Compte modifié' },
    ACCOUNT_DELETED: { action: 'account_deleted', category: CATEGORIES.ACCOUNT, severity: SEVERITY.WARNING, title: 'Compte supprimé' },
    ACCOUNT_LOCKED: { action: 'account_locked', category: CATEGORIES.SECURITY, severity: SEVERITY.CRITICAL, title: 'Compte verrouillé' },

    // Inscriptions
    ENROLLMENT_CREATED: { action: 'enrollment_created', category: CATEGORIES.ENROLLMENT, severity: SEVERITY.INFO, title: 'Nouvelle inscription' },
    ENROLLMENT_UPDATED: { action: 'enrollment_updated', category: CATEGORIES.ENROLLMENT, severity: SEVERITY.INFO, title: 'Inscription modifiée' },
    ENROLLMENT_APPROVED: { action: 'enrollment_approved', category: CATEGORIES.ENROLLMENT, severity: SEVERITY.INFO, title: 'Inscription validée' },
    ENROLLMENT_REJECTED: { action: 'enrollment_rejected', category: CATEGORIES.ENROLLMENT, severity: SEVERITY.WARNING, title: 'Inscription refusée' },
    ENROLLMENT_PENDING: { action: 'enrollment_pending', category: CATEGORIES.ENROLLMENT, severity: SEVERITY.INFO, title: 'Inscription en attente' },

    // Présences
    ATTENDANCE_CHECKIN: { action: 'attendance_checkin', category: CATEGORIES.ATTENDANCE, severity: SEVERITY.INFO, title: 'Arrivée enregistrée' },
    ATTENDANCE_CHECKOUT: { action: 'attendance_checkout', category: CATEGORIES.ATTENDANCE, severity: SEVERITY.INFO, title: 'Départ enregistré' },
    ATTENDANCE_ABSENT: { action: 'attendance_absent', category: CATEGORIES.ATTENDANCE, severity: SEVERITY.INFO, title: 'Absence signalée' },

    // Documents
    DOCUMENT_UPLOADED: { action: 'document_uploaded', category: CATEGORIES.DOCUMENT, severity: SEVERITY.INFO, title: 'Document téléversé' },
    DOCUMENT_DOWNLOADED: { action: 'document_downloaded', category: CATEGORIES.DOCUMENT, severity: SEVERITY.DEBUG, title: 'Document téléchargé' },
    DOCUMENT_GENERATED: { action: 'document_generated', category: CATEGORIES.DOCUMENT, severity: SEVERITY.INFO, title: 'Document généré' },
    DOCUMENT_SIGNED: { action: 'document_signed', category: CATEGORIES.DOCUMENT, severity: SEVERITY.INFO, title: 'Document signé' },
    DOCUMENT_DELETED: { action: 'document_deleted', category: CATEGORIES.DOCUMENT, severity: SEVERITY.WARNING, title: 'Document supprimé' },

    // Enfants
    CHILD_CREATED: { action: 'child_created', category: CATEGORIES.CHILD, severity: SEVERITY.INFO, title: 'Enfant ajouté' },
    CHILD_UPDATED: { action: 'child_updated', category: CATEGORIES.CHILD, severity: SEVERITY.INFO, title: 'Informations enfant modifiées' },
    CHILD_MEDICAL_UPDATED: { action: 'child_medical_updated', category: CATEGORIES.CHILD, severity: SEVERITY.INFO, title: 'Informations médicales mises à jour' },

    // Contacts
    CONTACT_RECEIVED: { action: 'contact_received', category: CATEGORIES.CONTACT, severity: SEVERITY.INFO, title: 'Message reçu' },
    CONTACT_CALLBACK_REQUESTED: { action: 'contact_callback', category: CATEGORIES.CONTACT, severity: SEVERITY.WARNING, title: 'Rappel demandé' },

    // Système
    SYSTEM_ERROR: { action: 'system_error', category: CATEGORIES.SYSTEM, severity: SEVERITY.CRITICAL, title: 'Erreur système' },
    SYSTEM_WARNING: { action: 'system_warning', category: CATEGORIES.SYSTEM, severity: SEVERITY.WARNING, title: 'Avertissement système' },
    EMAIL_FAILED: { action: 'email_failed', category: CATEGORIES.SYSTEM, severity: SEVERITY.WARNING, title: 'Échec envoi email' },
    EMAIL_SENT: { action: 'email_sent', category: CATEGORIES.SYSTEM, severity: SEVERITY.DEBUG, title: 'Email envoyé' },

    // Sécurité
    SECURITY_ALERT: { action: 'security_alert', category: CATEGORIES.SECURITY, severity: SEVERITY.CRITICAL, title: 'Alerte sécurité' },
    MULTIPLE_LOGIN_FAILURES: { action: 'multiple_login_failures', category: CATEGORIES.SECURITY, severity: SEVERITY.CRITICAL, title: 'Tentatives de connexion multiples' },
    UNAUTHORIZED_ACCESS: { action: 'unauthorized_access', category: CATEGORIES.SECURITY, severity: SEVERITY.CRITICAL, title: 'Accès non autorisé' },

    // Paiements
    PAYMENT_RECEIVED: { action: 'payment_received', category: CATEGORIES.PAYMENT, severity: SEVERITY.INFO, title: 'Paiement reçu' },
    PAYMENT_ALERT_SENT: { action: 'payment_alert_sent', category: CATEGORIES.PAYMENT, severity: SEVERITY.INFO, title: 'Rappel de paiement envoyé' },

    // Rapports
    REPORT_GENERATED: { action: 'report_generated', category: CATEGORIES.SYSTEM, severity: SEVERITY.INFO, title: 'Rapport généré' },
    REPORT_EXPORTED: { action: 'report_exported', category: CATEGORIES.SYSTEM, severity: SEVERITY.DEBUG, title: 'Rapport exporté' }
};

const activityLogService = {
    /**
     * Créer un log d'activité
     * @param {Object} params - Paramètres du log
     * @returns {Object} Log créé
     */
    async create(params) {
        const {
            action,
            category = CATEGORIES.OTHER,
            severity = SEVERITY.INFO,
            title,
            description = null,
            userId = null,
            userEmail = null,
            userName = null,
            userRole = null,
            targetType = null,
            targetId = null,
            targetName = null,
            ipAddress = null,
            userAgent = null,
            requestPath = null,
            requestMethod = null,
            responseStatus = null,
            metadata = {}
        } = params;

        try {
            const result = await db.query(`
        INSERT INTO activity_logs (
          action, category, severity, title, description,
          user_id, user_email, user_name, user_role,
          target_type, target_id, target_name,
          ip_address, user_agent, request_path, request_method, response_status,
          metadata, created_at
        ) VALUES (
          $1, $2, $3, $4, $5,
          $6, $7, $8, $9,
          $10, $11, $12,
          $13, $14, $15, $16, $17,
          $18, NOW()
        )
        RETURNING *
      `, [
                action, category, severity, title, description,
                userId, userEmail, userName, userRole,
                targetType, targetId, targetName,
                ipAddress, userAgent, requestPath, requestMethod, responseStatus,
                JSON.stringify(metadata)
            ]);

            const log = result.rows[0];

            // Vérifier si une alerte doit être créée
            if (severity === SEVERITY.CRITICAL || severity === SEVERITY.WARNING) {
                await this.checkAndCreateAlert(log);
            }

            return log;
        } catch (error) {
            console.error('❌ Erreur création activity log:', error);
            throw error;
        }
    },

    /**
     * Créer un log à partir d'une action prédéfinie
     * @param {string} actionKey - Clé de l'action (ex: 'LOGIN_SUCCESS')
     * @param {Object} params - Paramètres additionnels
     */
    async logAction(actionKey, params = {}) {
        const actionConfig = ACTIONS[actionKey];
        if (!actionConfig) {
            console.warn(`⚠️ Action inconnue: ${actionKey}`);
            return this.create({ action: actionKey, ...params });
        }

        return this.create({
            ...actionConfig,
            ...params,
            title: params.title || actionConfig.title
        });
    },

    /**
     * Récupérer les logs avec filtres et pagination
     */
    async getAll(params = {}) {
        const {
            page = 1,
            limit = 50,
            category = null,
            severity = null,
            action = null,
            userId = null,
            targetType = null,
            targetId = null,
            search = null,
            startDate = null,
            endDate = null,
            includeArchived = false
        } = params;

        const offset = (page - 1) * limit;
        const conditions = ['1=1'];
        const values = [];
        let paramIndex = 1;

        if (!includeArchived) {
            conditions.push('is_archived = FALSE');
        }

        if (category) {
            conditions.push(`category = $${paramIndex++}`);
            values.push(category);
        }

        if (severity) {
            conditions.push(`severity = $${paramIndex++}`);
            values.push(severity);
        }

        if (action) {
            conditions.push(`action = $${paramIndex++}`);
            values.push(action);
        }

        if (userId) {
            conditions.push(`user_id = $${paramIndex++}`);
            values.push(userId);
        }

        if (targetType) {
            conditions.push(`target_type = $${paramIndex++}`);
            values.push(targetType);
        }

        if (targetId) {
            conditions.push(`target_id = $${paramIndex++}`);
            values.push(targetId);
        }

        if (search) {
            conditions.push(`(
        title ILIKE $${paramIndex} OR 
        description ILIKE $${paramIndex} OR 
        user_name ILIKE $${paramIndex} OR 
        user_email ILIKE $${paramIndex} OR
        target_name ILIKE $${paramIndex}
      )`);
            values.push(`%${search}%`);
            paramIndex++;
        }

        if (startDate) {
            conditions.push(`created_at >= $${paramIndex++}`);
            values.push(startDate);
        }

        if (endDate) {
            conditions.push(`created_at <= $${paramIndex++}`);
            values.push(endDate);
        }

        const whereClause = conditions.join(' AND ');

        // Requête pour les données
        const dataQuery = `
      SELECT 
        al.*,
        CASE al.severity
          WHEN 'critical' THEN '🔴'
          WHEN 'warning' THEN '🟡'
          WHEN 'info' THEN '🟢'
          WHEN 'debug' THEN 'ℹ️'
        END as severity_icon,
        CASE al.category
          WHEN 'auth' THEN '🔐'
          WHEN 'enrollment' THEN '📋'
          WHEN 'attendance' THEN '📅'
          WHEN 'document' THEN '📄'
          WHEN 'account' THEN '👤'
          WHEN 'system' THEN '⚙️'
          WHEN 'security' THEN '🔒'
          WHEN 'contact' THEN '📞'
          WHEN 'child' THEN '👶'
          WHEN 'payment' THEN '💰'
          ELSE '📝'
        END as category_icon
      FROM activity_logs al
      WHERE ${whereClause}
      ORDER BY al.created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex}
    `;

        values.push(limit, offset);

        // Requête pour le total
        const countQuery = `
      SELECT COUNT(*) as total
      FROM activity_logs al
      WHERE ${whereClause}
    `;

        try {
            const [dataResult, countResult] = await Promise.all([
                db.query(dataQuery, values),
                db.query(countQuery, values.slice(0, -2))
            ]);

            return {
                logs: dataResult.rows,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: parseInt(countResult.rows[0].total),
                    totalPages: Math.ceil(countResult.rows[0].total / limit)
                }
            };
        } catch (error) {
            console.error('❌ Erreur récupération activity logs:', error);
            throw error;
        }
    },

    /**
     * Récupérer un log par ID
     */
    async getById(id) {
        try {
            const result = await db.query(`
        SELECT * FROM activity_logs WHERE id = $1
      `, [id]);
            return result.rows[0] || null;
        } catch (error) {
            console.error('❌ Erreur récupération activity log:', error);
            throw error;
        }
    },

    /**
     * Obtenir les statistiques
     */
    async getStats(params = {}) {
        const { startDate = null, endDate = null, period = 'today' } = params;

        let dateFilter = '';
        const values = [];

        if (startDate && endDate) {
            dateFilter = 'AND created_at BETWEEN $1 AND $2';
            values.push(startDate, endDate);
        } else {
            switch (period) {
                case 'today':
                    dateFilter = "AND DATE(created_at) = CURRENT_DATE";
                    break;
                case 'week':
                    dateFilter = "AND created_at >= CURRENT_DATE - INTERVAL '7 days'";
                    break;
                case 'month':
                    dateFilter = "AND created_at >= CURRENT_DATE - INTERVAL '30 days'";
                    break;
                default:
                    dateFilter = "AND DATE(created_at) = CURRENT_DATE";
            }
        }

        try {
            const result = await db.query(`
        SELECT 
          COUNT(*) as total_activities,
          COUNT(*) FILTER (WHERE action = 'login_success') as logins_success,
          COUNT(*) FILTER (WHERE action = 'login_failed') as logins_failed,
          COUNT(*) FILTER (WHERE action = 'enrollment_created') as new_enrollments,
          COUNT(*) FILTER (WHERE action = 'enrollment_approved') as enrollments_approved,
          COUNT(*) FILTER (WHERE action = 'enrollment_rejected') as enrollments_rejected,
          COUNT(*) FILTER (WHERE category = 'document') as document_activities,
          COUNT(*) FILTER (WHERE severity = 'critical') as critical_events,
          COUNT(*) FILTER (WHERE severity = 'warning') as warning_events,
          COUNT(*) FILTER (WHERE category = 'attendance') as attendance_activities,
          COUNT(DISTINCT user_id) as unique_users
        FROM activity_logs
        WHERE is_archived = FALSE ${dateFilter}
      `, values);

            // Statistiques par catégorie
            const categoryStats = await db.query(`
        SELECT category, COUNT(*) as count
        FROM activity_logs
        WHERE is_archived = FALSE ${dateFilter}
        GROUP BY category
        ORDER BY count DESC
      `, values);

            // Statistiques par heure (pour aujourd'hui)
            const hourlyStats = await db.query(`
        SELECT 
          EXTRACT(HOUR FROM created_at) as hour,
          COUNT(*) as count
        FROM activity_logs
        WHERE is_archived = FALSE AND DATE(created_at) = CURRENT_DATE
        GROUP BY EXTRACT(HOUR FROM created_at)
        ORDER BY hour
      `);

            // Activités récentes importantes
            const recentImportant = await db.query(`
        SELECT id, action, category, severity, title, description, user_name, created_at
        FROM activity_logs
        WHERE is_archived = FALSE AND severity IN ('critical', 'warning')
        ORDER BY created_at DESC
        LIMIT 10
      `);

            return {
                summary: result.rows[0],
                byCategory: categoryStats.rows,
                byHour: hourlyStats.rows,
                recentImportant: recentImportant.rows
            };
        } catch (error) {
            console.error('❌ Erreur statistiques activity logs:', error);
            throw error;
        }
    },

    /**
     * Obtenir les actions disponibles pour les filtres
     */
    async getAvailableActions() {
        try {
            const result = await db.query(`
        SELECT DISTINCT action, category
        FROM activity_logs
        WHERE is_archived = FALSE
        ORDER BY category, action
      `);
            return result.rows;
        } catch (error) {
            console.error('❌ Erreur récupération actions:', error);
            throw error;
        }
    },

    /**
     * Vérifier et créer une alerte si nécessaire
     */
    async checkAndCreateAlert(log) {
        const alertService = require('./alertService');

        // Règles d'alerte automatique
        const alertRules = [
            {
                condition: log.action === 'multiple_login_failures',
                type: 'security',
                title: '🔒 Alerte Sécurité',
                message: `Plusieurs tentatives de connexion échouées détectées pour ${log.user_email || 'un utilisateur'}`
            },
            {
                condition: log.action === 'system_error',
                type: 'system',
                title: '⚠️ Erreur Système',
                message: log.description || 'Une erreur système a été détectée'
            },
            {
                condition: log.action === 'unauthorized_access',
                type: 'security',
                title: '🚨 Accès Non Autorisé',
                message: `Tentative d'accès non autorisé: ${log.description || 'Détails non disponibles'}`
            },
            {
                condition: log.action === 'email_failed' && log.severity === 'critical',
                type: 'system',
                title: '📧 Échec Email Critique',
                message: `Impossible d'envoyer un email important: ${log.description || ''}`
            }
        ];

        for (const rule of alertRules) {
            if (rule.condition) {
                try {
                    await alertService.create({
                        type: rule.type,
                        severity: log.severity,
                        title: rule.title,
                        message: rule.message,
                        activityLogId: log.id,
                        targetUserId: log.user_id,
                        metadata: { sourceLog: log.id }
                    });
                } catch (error) {
                    console.error('❌ Erreur création alerte automatique:', error);
                }
                break; // Une seule alerte par log
            }
        }
    },

    /**
     * Archiver les anciens logs
     */
    async archiveOldLogs() {
        try {
            const result = await db.query('SELECT archive_old_activity_logs()');
            const archivedCount = result.rows[0].archive_old_activity_logs;
            console.log(`📦 ${archivedCount} logs archivés`);
            return archivedCount;
        } catch (error) {
            console.error('❌ Erreur archivage logs:', error);
            throw error;
        }
    },

    /**
     * Nettoyer les archives anciennes
     */
    async cleanupOldArchives() {
        try {
            const result = await db.query('SELECT cleanup_old_archives()');
            const deletedCount = result.rows[0].cleanup_old_archives;
            console.log(`🗑️ ${deletedCount} archives supprimées`);
            return deletedCount;
        } catch (error) {
            console.error('❌ Erreur nettoyage archives:', error);
            throw error;
        }
    },

    /**
     * Recherche dans les archives
     */
    async searchArchive(params = {}) {
        const { search, startDate, endDate, limit = 100 } = params;

        const conditions = ['1=1'];
        const values = [];
        let paramIndex = 1;

        if (search) {
            conditions.push(`(title ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`);
            values.push(`%${search}%`);
            paramIndex++;
        }

        if (startDate) {
            conditions.push(`created_at >= $${paramIndex++}`);
            values.push(startDate);
        }

        if (endDate) {
            conditions.push(`created_at <= $${paramIndex++}`);
            values.push(endDate);
        }

        values.push(limit);

        try {
            const result = await db.query(`
        SELECT * FROM activity_logs_archive
        WHERE ${conditions.join(' AND ')}
        ORDER BY created_at DESC
        LIMIT $${paramIndex}
      `, values);

            return result.rows;
        } catch (error) {
            console.error('❌ Erreur recherche archives:', error);
            throw error;
        }
    }
};

// Exporter les constantes pour utilisation externe
activityLogService.CATEGORIES = CATEGORIES;
activityLogService.SEVERITY = SEVERITY;
activityLogService.ACTIONS = ACTIONS;

module.exports = activityLogService;
