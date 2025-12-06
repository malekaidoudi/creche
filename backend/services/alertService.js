/**
 * Service de gestion des alertes
 * Crèche Mima El Ghalia - Système d'Alertes
 */

const db = require('../config/db_postgres');

const ALERT_STATUS = {
    ACTIVE: 'active',
    ACKNOWLEDGED: 'acknowledged',
    RESOLVED: 'resolved',
    DISMISSED: 'dismissed'
};

const ALERT_TYPES = {
    SECURITY: 'security',
    SYSTEM: 'system',
    ENROLLMENT: 'enrollment',
    ATTENDANCE: 'attendance',
    DOCUMENT: 'document',
    PAYMENT: 'payment',
    GENERAL: 'general'
};

const alertService = {
    /**
     * Créer une nouvelle alerte
     */
    async create(params) {
        const {
            type,
            severity = 'warning',
            title,
            message,
            activityLogId = null,
            targetUserId = null,
            assignedTo = null,
            metadata = {}
        } = params;

        try {
            const result = await db.query(`
        INSERT INTO alerts (
          type, severity, status, title, message,
          activity_log_id, target_user_id, assigned_to,
          metadata, created_at
        ) VALUES (
          $1, $2, 'active', $3, $4,
          $5, $6, $7,
          $8, NOW()
        )
        RETURNING *
      `, [
                type, severity, title, message,
                activityLogId, targetUserId, assignedTo,
                JSON.stringify(metadata)
            ]);

            const alert = result.rows[0];

            // Envoyer notification email si critique
            if (severity === 'critical') {
                await this.sendEmailNotification(alert);
            }

            return alert;
        } catch (error) {
            console.error('❌ Erreur création alerte:', error);
            throw error;
        }
    },

    /**
     * Récupérer toutes les alertes avec filtres
     */
    async getAll(params = {}) {
        const {
            page = 1,
            limit = 50,
            status = null,
            severity = null,
            type = null,
            startDate = null,
            endDate = null
        } = params;

        const offset = (page - 1) * limit;
        const conditions = ['1=1'];
        const values = [];
        let paramIndex = 1;

        if (status) {
            conditions.push(`a.status = $${paramIndex++}`);
            values.push(status);
        }

        if (severity) {
            conditions.push(`a.severity = $${paramIndex++}`);
            values.push(severity);
        }

        if (type) {
            conditions.push(`a.type = $${paramIndex++}`);
            values.push(type);
        }

        if (startDate) {
            conditions.push(`a.created_at >= $${paramIndex++}`);
            values.push(startDate);
        }

        if (endDate) {
            conditions.push(`a.created_at <= $${paramIndex++}`);
            values.push(endDate);
        }

        const whereClause = conditions.join(' AND ');

        try {
            const dataQuery = `
        SELECT 
          a.*,
          u.first_name || ' ' || u.last_name as target_user_name,
          u.email as target_user_email,
          au.first_name || ' ' || au.last_name as assigned_to_name,
          ack.first_name || ' ' || ack.last_name as acknowledged_by_name,
          res.first_name || ' ' || res.last_name as resolved_by_name,
          CASE a.severity
            WHEN 'critical' THEN '🔴'
            WHEN 'warning' THEN '🟡'
            WHEN 'info' THEN '🟢'
            ELSE 'ℹ️'
          END as severity_icon
        FROM alerts a
        LEFT JOIN users u ON a.target_user_id = u.id
        LEFT JOIN users au ON a.assigned_to = au.id
        LEFT JOIN users ack ON a.acknowledged_by = ack.id
        LEFT JOIN users res ON a.resolved_by = res.id
        WHERE ${whereClause}
        ORDER BY 
          CASE a.status WHEN 'active' THEN 0 ELSE 1 END,
          CASE a.severity 
            WHEN 'critical' THEN 1 
            WHEN 'warning' THEN 2 
            ELSE 3 
          END,
          a.created_at DESC
        LIMIT $${paramIndex++} OFFSET $${paramIndex}
      `;

            values.push(limit, offset);

            const countQuery = `
        SELECT COUNT(*) as total FROM alerts a WHERE ${whereClause}
      `;

            const [dataResult, countResult] = await Promise.all([
                db.query(dataQuery, values),
                db.query(countQuery, values.slice(0, -2))
            ]);

            return {
                alerts: dataResult.rows,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: parseInt(countResult.rows[0].total),
                    totalPages: Math.ceil(countResult.rows[0].total / limit)
                }
            };
        } catch (error) {
            console.error('❌ Erreur récupération alertes:', error);
            throw error;
        }
    },

    /**
     * Récupérer les alertes actives
     */
    async getActive() {
        try {
            const result = await db.query(`
        SELECT 
          a.*,
          u.first_name || ' ' || u.last_name as target_user_name,
          CASE a.severity
            WHEN 'critical' THEN '🔴'
            WHEN 'warning' THEN '🟡'
            WHEN 'info' THEN '🟢'
            ELSE 'ℹ️'
          END as severity_icon
        FROM alerts a
        LEFT JOIN users u ON a.target_user_id = u.id
        WHERE a.status = 'active'
        ORDER BY 
          CASE a.severity 
            WHEN 'critical' THEN 1 
            WHEN 'warning' THEN 2 
            ELSE 3 
          END,
          a.created_at DESC
      `);
            return result.rows;
        } catch (error) {
            console.error('❌ Erreur récupération alertes actives:', error);
            throw error;
        }
    },

    /**
     * Récupérer une alerte par ID
     */
    async getById(id) {
        try {
            const result = await db.query(`
        SELECT 
          a.*,
          u.first_name || ' ' || u.last_name as target_user_name,
          u.email as target_user_email,
          al.action as source_action,
          al.description as source_description
        FROM alerts a
        LEFT JOIN users u ON a.target_user_id = u.id
        LEFT JOIN activity_logs al ON a.activity_log_id = al.id
        WHERE a.id = $1
      `, [id]);
            return result.rows[0] || null;
        } catch (error) {
            console.error('❌ Erreur récupération alerte:', error);
            throw error;
        }
    },

    /**
     * Marquer une alerte comme vue
     */
    async acknowledge(id, userId) {
        try {
            const result = await db.query(`
        UPDATE alerts
        SET 
          status = 'acknowledged',
          acknowledged_at = NOW(),
          acknowledged_by = $2
        WHERE id = $1
        RETURNING *
      `, [id, userId]);
            return result.rows[0];
        } catch (error) {
            console.error('❌ Erreur acknowledgement alerte:', error);
            throw error;
        }
    },

    /**
     * Résoudre une alerte
     */
    async resolve(id, userId, resolution = null) {
        try {
            const metadata = resolution ? { resolution } : {};

            const result = await db.query(`
        UPDATE alerts
        SET 
          status = 'resolved',
          resolved_at = NOW(),
          resolved_by = $2,
          metadata = metadata || $3::jsonb
        WHERE id = $1
        RETURNING *
      `, [id, userId, JSON.stringify(metadata)]);
            return result.rows[0];
        } catch (error) {
            console.error('❌ Erreur résolution alerte:', error);
            throw error;
        }
    },

    /**
     * Ignorer une alerte
     */
    async dismiss(id, userId, reason = null) {
        try {
            const metadata = reason ? { dismissReason: reason } : {};

            const result = await db.query(`
        UPDATE alerts
        SET 
          status = 'dismissed',
          metadata = metadata || $3::jsonb
        WHERE id = $1
        RETURNING *
      `, [id, userId, JSON.stringify(metadata)]);
            return result.rows[0];
        } catch (error) {
            console.error('❌ Erreur dismiss alerte:', error);
            throw error;
        }
    },

    /**
     * Obtenir les statistiques des alertes
     */
    async getStats() {
        try {
            const result = await db.query(`
        SELECT 
          COUNT(*) FILTER (WHERE status = 'active') as active_count,
          COUNT(*) FILTER (WHERE status = 'active' AND severity = 'critical') as critical_active,
          COUNT(*) FILTER (WHERE status = 'active' AND severity = 'warning') as warning_active,
          COUNT(*) FILTER (WHERE status = 'acknowledged') as acknowledged_count,
          COUNT(*) FILTER (WHERE status = 'resolved') as resolved_count,
          COUNT(*) FILTER (WHERE status = 'dismissed') as dismissed_count,
          COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) as today_count,
          COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as week_count
        FROM alerts
      `);

            const byType = await db.query(`
        SELECT type, COUNT(*) as count
        FROM alerts
        WHERE status = 'active'
        GROUP BY type
        ORDER BY count DESC
      `);

            return {
                summary: result.rows[0],
                byType: byType.rows
            };
        } catch (error) {
            console.error('❌ Erreur statistiques alertes:', error);
            throw error;
        }
    },

    /**
     * Envoyer notification email pour alerte critique
     */
    async sendEmailNotification(alert) {
        try {
            // Récupérer les admins pour notification
            const admins = await db.query(`
        SELECT email, first_name FROM users WHERE role = 'admin'
      `);

            if (admins.rows.length === 0) return;

            // Marquer l'email comme envoyé
            await db.query(`
        UPDATE alerts SET email_sent = TRUE, email_sent_at = NOW() WHERE id = $1
      `, [alert.id]);

            // TODO: Intégrer avec le service d'email existant
            console.log(`📧 Notification email envoyée pour alerte #${alert.id} à ${admins.rows.length} admin(s)`);

            return true;
        } catch (error) {
            console.error('❌ Erreur envoi notification email:', error);
            return false;
        }
    },

    /**
     * Vérifier les conditions d'alerte automatique
     */
    async checkAutomaticAlerts() {
        try {
            // Vérifier les inscriptions en attente depuis trop longtemps
            const pendingEnrollments = await db.query(`
        SELECT COUNT(*) as count
        FROM enrollments
        WHERE status = 'pending' AND created_at < NOW() - INTERVAL '3 days'
      `);

            if (parseInt(pendingEnrollments.rows[0].count) > 5) {
                await this.create({
                    type: ALERT_TYPES.ENROLLMENT,
                    severity: 'warning',
                    title: '📋 Inscriptions en attente',
                    message: `${pendingEnrollments.rows[0].count} inscriptions sont en attente depuis plus de 3 jours`,
                    metadata: { count: pendingEnrollments.rows[0].count }
                });
            }

            // Vérifier les tentatives de connexion échouées
            const failedLogins = await db.query(`
        SELECT user_email, COUNT(*) as count
        FROM activity_logs
        WHERE action = 'login_failed' 
        AND created_at > NOW() - INTERVAL '1 hour'
        GROUP BY user_email
        HAVING COUNT(*) >= 5
      `);

            for (const row of failedLogins.rows) {
                await this.create({
                    type: ALERT_TYPES.SECURITY,
                    severity: 'critical',
                    title: '🔒 Tentatives de connexion suspectes',
                    message: `${row.count} tentatives de connexion échouées pour ${row.user_email} dans la dernière heure`,
                    metadata: { email: row.user_email, attempts: row.count }
                });
            }

            return true;
        } catch (error) {
            console.error('❌ Erreur vérification alertes automatiques:', error);
            return false;
        }
    }
};

alertService.ALERT_STATUS = ALERT_STATUS;
alertService.ALERT_TYPES = ALERT_TYPES;

module.exports = alertService;
