/**
 * Service de génération de rapports
 * Crèche Mima El Ghalia - Rapports d'Activité
 */

const db = require('../config/db_postgres');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const REPORT_TYPES = {
    DAILY: 'daily',
    WEEKLY: 'weekly',
    MONTHLY: 'monthly'
};

const reportService = {
    /**
     * Générer un rapport quotidien
     */
    async generateDailyReport(date = new Date()) {
        const targetDate = new Date(date);
        targetDate.setHours(0, 0, 0, 0);

        const nextDate = new Date(targetDate);
        nextDate.setDate(nextDate.getDate() + 1);

        try {
            // Statistiques du jour
            const stats = await db.query(`
        SELECT 
          COUNT(*) as total_activities,
          COUNT(*) FILTER (WHERE action = 'login_success') as logins_success,
          COUNT(*) FILTER (WHERE action = 'login_failed') as logins_failed,
          COUNT(*) FILTER (WHERE action = 'enrollment_created') as new_enrollments,
          COUNT(*) FILTER (WHERE action = 'enrollment_approved') as enrollments_approved,
          COUNT(*) FILTER (WHERE action = 'enrollment_rejected') as enrollments_rejected,
          COUNT(*) FILTER (WHERE category = 'document') as documents,
          COUNT(*) FILTER (WHERE severity = 'critical') as critical_events,
          COUNT(*) FILTER (WHERE severity = 'warning') as warnings,
          COUNT(DISTINCT user_id) as unique_users
        FROM activity_logs
        WHERE created_at >= $1 AND created_at < $2
      `, [targetDate.toISOString(), nextDate.toISOString()]);

            // Activités par catégorie
            const byCategory = await db.query(`
        SELECT category, COUNT(*) as count
        FROM activity_logs
        WHERE created_at >= $1 AND created_at < $2
        GROUP BY category
        ORDER BY count DESC
      `, [targetDate.toISOString(), nextDate.toISOString()]);

            // Activités par heure
            const byHour = await db.query(`
        SELECT 
          EXTRACT(HOUR FROM created_at) as hour,
          COUNT(*) as count
        FROM activity_logs
        WHERE created_at >= $1 AND created_at < $2
        GROUP BY EXTRACT(HOUR FROM created_at)
        ORDER BY hour
      `, [targetDate.toISOString(), nextDate.toISOString()]);

            // Événements importants
            const importantEvents = await db.query(`
        SELECT id, action, category, severity, title, description, user_name, created_at
        FROM activity_logs
        WHERE created_at >= $1 AND created_at < $2
        AND severity IN ('critical', 'warning')
        ORDER BY 
          CASE severity WHEN 'critical' THEN 1 ELSE 2 END,
          created_at DESC
        LIMIT 20
      `, [targetDate.toISOString(), nextDate.toISOString()]);

            // Alertes du jour
            const alerts = await db.query(`
        SELECT id, type, severity, title, message, status, created_at
        FROM alerts
        WHERE created_at >= $1 AND created_at < $2
        ORDER BY created_at DESC
      `, [targetDate.toISOString(), nextDate.toISOString()]);

            const report = {
                type: REPORT_TYPES.DAILY,
                periodStart: targetDate,
                periodEnd: nextDate,
                title: `Rapport Quotidien - ${targetDate.toLocaleDateString('fr-FR')}`,
                generatedAt: new Date(),
                statistics: {
                    summary: stats.rows[0],
                    byCategory: byCategory.rows,
                    byHour: byHour.rows
                },
                importantEvents: importantEvents.rows,
                alerts: alerts.rows
            };

            // Sauvegarder dans l'historique
            await this.saveReportHistory(report);

            return report;
        } catch (error) {
            console.error('❌ Erreur génération rapport quotidien:', error);
            throw error;
        }
    },

    /**
     * Générer un rapport hebdomadaire
     */
    async generateWeeklyReport(startDate = null) {
        const endDate = startDate ? new Date(startDate) : new Date();
        endDate.setHours(23, 59, 59, 999);

        const start = new Date(endDate);
        start.setDate(start.getDate() - 7);
        start.setHours(0, 0, 0, 0);

        try {
            // Statistiques de la semaine
            const stats = await db.query(`
        SELECT 
          COUNT(*) as total_activities,
          COUNT(*) FILTER (WHERE action = 'login_success') as logins_success,
          COUNT(*) FILTER (WHERE action = 'login_failed') as logins_failed,
          COUNT(*) FILTER (WHERE action = 'enrollment_created') as new_enrollments,
          COUNT(*) FILTER (WHERE action = 'enrollment_approved') as enrollments_approved,
          COUNT(*) FILTER (WHERE action = 'enrollment_rejected') as enrollments_rejected,
          COUNT(*) FILTER (WHERE category = 'document') as documents,
          COUNT(*) FILTER (WHERE severity = 'critical') as critical_events,
          COUNT(*) FILTER (WHERE severity = 'warning') as warnings,
          COUNT(DISTINCT user_id) as unique_users,
          COUNT(DISTINCT DATE(created_at)) as active_days
        FROM activity_logs
        WHERE created_at >= $1 AND created_at <= $2
      `, [start.toISOString(), endDate.toISOString()]);

            // Évolution par jour
            const byDay = await db.query(`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE action = 'login_success') as logins,
          COUNT(*) FILTER (WHERE category = 'enrollment') as enrollments
        FROM activity_logs
        WHERE created_at >= $1 AND created_at <= $2
        GROUP BY DATE(created_at)
        ORDER BY date
      `, [start.toISOString(), endDate.toISOString()]);

            // Top utilisateurs actifs
            const topUsers = await db.query(`
        SELECT 
          user_id,
          user_name,
          user_email,
          COUNT(*) as activity_count
        FROM activity_logs
        WHERE created_at >= $1 AND created_at <= $2
        AND user_id IS NOT NULL
        GROUP BY user_id, user_name, user_email
        ORDER BY activity_count DESC
        LIMIT 10
      `, [start.toISOString(), endDate.toISOString()]);

            // Problèmes récurrents
            const issues = await db.query(`
        SELECT 
          action,
          title,
          COUNT(*) as occurrences
        FROM activity_logs
        WHERE created_at >= $1 AND created_at <= $2
        AND severity IN ('critical', 'warning')
        GROUP BY action, title
        HAVING COUNT(*) > 1
        ORDER BY occurrences DESC
        LIMIT 10
      `, [start.toISOString(), endDate.toISOString()]);

            // Comparaison avec la semaine précédente
            const prevStart = new Date(start);
            prevStart.setDate(prevStart.getDate() - 7);
            const prevEnd = new Date(start);
            prevEnd.setMilliseconds(-1);

            const prevStats = await db.query(`
        SELECT 
          COUNT(*) as total_activities,
          COUNT(*) FILTER (WHERE action = 'login_success') as logins_success,
          COUNT(*) FILTER (WHERE action = 'enrollment_created') as new_enrollments
        FROM activity_logs
        WHERE created_at >= $1 AND created_at <= $2
      `, [prevStart.toISOString(), prevEnd.toISOString()]);

            const report = {
                type: REPORT_TYPES.WEEKLY,
                periodStart: start,
                periodEnd: endDate,
                title: `Rapport Hebdomadaire - Semaine du ${start.toLocaleDateString('fr-FR')}`,
                generatedAt: new Date(),
                statistics: {
                    summary: stats.rows[0],
                    byDay: byDay.rows,
                    topUsers: topUsers.rows,
                    recurringIssues: issues.rows,
                    comparison: {
                        current: stats.rows[0],
                        previous: prevStats.rows[0],
                        trends: {
                            activities: this.calculateTrend(
                                parseInt(stats.rows[0].total_activities),
                                parseInt(prevStats.rows[0].total_activities)
                            ),
                            logins: this.calculateTrend(
                                parseInt(stats.rows[0].logins_success),
                                parseInt(prevStats.rows[0].logins_success)
                            ),
                            enrollments: this.calculateTrend(
                                parseInt(stats.rows[0].new_enrollments),
                                parseInt(prevStats.rows[0].new_enrollments)
                            )
                        }
                    }
                }
            };

            await this.saveReportHistory(report);
            return report;
        } catch (error) {
            console.error('❌ Erreur génération rapport hebdomadaire:', error);
            throw error;
        }
    },

    /**
     * Générer un rapport mensuel
     */
    async generateMonthlyReport(year = null, month = null) {
        const now = new Date();
        const targetYear = year || now.getFullYear();
        const targetMonth = month !== null ? month : now.getMonth();

        const start = new Date(targetYear, targetMonth, 1);
        const end = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999);

        try {
            // Statistiques du mois
            const stats = await db.query(`
        SELECT 
          COUNT(*) as total_activities,
          COUNT(*) FILTER (WHERE action = 'login_success') as logins_success,
          COUNT(*) FILTER (WHERE action = 'login_failed') as logins_failed,
          COUNT(*) FILTER (WHERE action = 'enrollment_created') as new_enrollments,
          COUNT(*) FILTER (WHERE action = 'enrollment_approved') as enrollments_approved,
          COUNT(*) FILTER (WHERE action = 'enrollment_rejected') as enrollments_rejected,
          COUNT(*) FILTER (WHERE category = 'document') as documents,
          COUNT(*) FILTER (WHERE severity = 'critical') as critical_events,
          COUNT(*) FILTER (WHERE severity = 'warning') as warnings,
          COUNT(DISTINCT user_id) as unique_users,
          COUNT(DISTINCT DATE(created_at)) as active_days
        FROM activity_logs
        WHERE created_at >= $1 AND created_at <= $2
      `, [start.toISOString(), end.toISOString()]);

            // Évolution par semaine
            const byWeek = await db.query(`
        SELECT 
          EXTRACT(WEEK FROM created_at) as week_number,
          MIN(DATE(created_at)) as week_start,
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE action = 'login_success') as logins,
          COUNT(*) FILTER (WHERE category = 'enrollment') as enrollments
        FROM activity_logs
        WHERE created_at >= $1 AND created_at <= $2
        GROUP BY EXTRACT(WEEK FROM created_at)
        ORDER BY week_number
      `, [start.toISOString(), end.toISOString()]);

            // Par catégorie
            const byCategory = await db.query(`
        SELECT category, COUNT(*) as count
        FROM activity_logs
        WHERE created_at >= $1 AND created_at <= $2
        GROUP BY category
        ORDER BY count DESC
      `, [start.toISOString(), end.toISOString()]);

            // Alertes du mois
            const alertStats = await db.query(`
        SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE severity = 'critical') as critical,
          COUNT(*) FILTER (WHERE severity = 'warning') as warning,
          COUNT(*) FILTER (WHERE status = 'resolved') as resolved
        FROM alerts
        WHERE created_at >= $1 AND created_at <= $2
      `, [start.toISOString(), end.toISOString()]);

            // Comparaison avec le mois précédent
            const prevStart = new Date(targetYear, targetMonth - 1, 1);
            const prevEnd = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999);

            const prevStats = await db.query(`
        SELECT 
          COUNT(*) as total_activities,
          COUNT(*) FILTER (WHERE action = 'login_success') as logins_success,
          COUNT(*) FILTER (WHERE action = 'enrollment_created') as new_enrollments
        FROM activity_logs
        WHERE created_at >= $1 AND created_at <= $2
      `, [prevStart.toISOString(), prevEnd.toISOString()]);

            const monthNames = [
                'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
                'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
            ];

            const report = {
                type: REPORT_TYPES.MONTHLY,
                periodStart: start,
                periodEnd: end,
                title: `Rapport Mensuel - ${monthNames[targetMonth]} ${targetYear}`,
                generatedAt: new Date(),
                statistics: {
                    summary: stats.rows[0],
                    byWeek: byWeek.rows,
                    byCategory: byCategory.rows,
                    alerts: alertStats.rows[0],
                    comparison: {
                        current: stats.rows[0],
                        previous: prevStats.rows[0],
                        trends: {
                            activities: this.calculateTrend(
                                parseInt(stats.rows[0].total_activities),
                                parseInt(prevStats.rows[0].total_activities)
                            ),
                            logins: this.calculateTrend(
                                parseInt(stats.rows[0].logins_success),
                                parseInt(prevStats.rows[0].logins_success)
                            ),
                            enrollments: this.calculateTrend(
                                parseInt(stats.rows[0].new_enrollments),
                                parseInt(prevStats.rows[0].new_enrollments)
                            )
                        }
                    }
                }
            };

            await this.saveReportHistory(report);
            return report;
        } catch (error) {
            console.error('❌ Erreur génération rapport mensuel:', error);
            throw error;
        }
    },

    /**
     * Calculer la tendance entre deux valeurs
     */
    calculateTrend(current, previous) {
        if (previous === 0) return current > 0 ? 100 : 0;
        return Math.round(((current - previous) / previous) * 100);
    },

    /**
     * Sauvegarder le rapport dans l'historique
     */
    async saveReportHistory(report, userId = null) {
        try {
            const result = await db.query(`
        INSERT INTO reports_history (
          report_type, period_start, period_end, title, summary,
          statistics, generated_by, generated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, NOW()
        )
        RETURNING id
      `, [
                report.type,
                report.periodStart,
                report.periodEnd,
                report.title,
                report.summary || null,
                JSON.stringify(report.statistics),
                userId
            ]);
            return result.rows[0].id;
        } catch (error) {
            console.error('❌ Erreur sauvegarde historique rapport:', error);
            // Ne pas bloquer si l'historique échoue
            return null;
        }
    },

    /**
     * Récupérer l'historique des rapports
     */
    async getHistory(params = {}) {
        const { type = null, limit = 20, page = 1 } = params;
        const offset = (page - 1) * limit;

        try {
            let query = `
        SELECT 
          rh.*,
          u.first_name || ' ' || u.last_name as generated_by_name
        FROM reports_history rh
        LEFT JOIN users u ON rh.generated_by = u.id
      `;

            const values = [];
            if (type) {
                query += ' WHERE rh.report_type = $1';
                values.push(type);
            }

            query += ` ORDER BY rh.generated_at DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
            values.push(limit, offset);

            const result = await db.query(query, values);
            return result.rows;
        } catch (error) {
            console.error('❌ Erreur récupération historique rapports:', error);
            throw error;
        }
    },

    /**
     * Récupérer un rapport par ID
     */
    async getById(id) {
        try {
            const result = await db.query(`
        SELECT * FROM reports_history WHERE id = $1
      `, [id]);
            return result.rows[0] || null;
        } catch (error) {
            console.error('❌ Erreur récupération rapport:', error);
            throw error;
        }
    },

    /**
     * Exporter en Excel
     */
    async exportToExcel(report) {
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'Crèche Mima El Ghalia';
        workbook.created = new Date();

        // Feuille Résumé
        const summarySheet = workbook.addWorksheet('Résumé');
        summarySheet.columns = [
            { header: 'Métrique', key: 'metric', width: 30 },
            { header: 'Valeur', key: 'value', width: 15 }
        ];

        const summary = report.statistics.summary;
        summarySheet.addRows([
            { metric: 'Total activités', value: summary.total_activities },
            { metric: 'Connexions réussies', value: summary.logins_success },
            { metric: 'Connexions échouées', value: summary.logins_failed },
            { metric: 'Nouvelles inscriptions', value: summary.new_enrollments },
            { metric: 'Inscriptions validées', value: summary.enrollments_approved },
            { metric: 'Documents traités', value: summary.documents },
            { metric: 'Événements critiques', value: summary.critical_events },
            { metric: 'Avertissements', value: summary.warnings },
            { metric: 'Utilisateurs uniques', value: summary.unique_users }
        ]);

        // Style header
        summarySheet.getRow(1).font = { bold: true };
        summarySheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF4472C4' }
        };
        summarySheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };

        // Feuille par catégorie
        if (report.statistics.byCategory) {
            const categorySheet = workbook.addWorksheet('Par Catégorie');
            categorySheet.columns = [
                { header: 'Catégorie', key: 'category', width: 20 },
                { header: 'Nombre', key: 'count', width: 15 }
            ];
            categorySheet.addRows(report.statistics.byCategory);
            categorySheet.getRow(1).font = { bold: true };
        }

        // Générer le buffer
        const buffer = await workbook.xlsx.writeBuffer();
        return buffer;
    },

    /**
     * Exporter en PDF
     */
    async exportToPDF(report) {
        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({ margin: 50 });
            const chunks = [];

            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            // En-tête
            doc.fontSize(20).text('Crèche Mima El Ghalia', { align: 'center' });
            doc.fontSize(16).text(report.title, { align: 'center' });
            doc.moveDown();
            doc.fontSize(10).text(`Généré le: ${new Date().toLocaleDateString('fr-FR')}`, { align: 'right' });
            doc.moveDown(2);

            // Résumé
            doc.fontSize(14).text('Résumé', { underline: true });
            doc.moveDown();

            const summary = report.statistics.summary;
            doc.fontSize(10);
            doc.text(`• Total activités: ${summary.total_activities}`);
            doc.text(`• Connexions réussies: ${summary.logins_success}`);
            doc.text(`• Connexions échouées: ${summary.logins_failed}`);
            doc.text(`• Nouvelles inscriptions: ${summary.new_enrollments}`);
            doc.text(`• Inscriptions validées: ${summary.enrollments_approved}`);
            doc.text(`• Documents traités: ${summary.documents}`);
            doc.text(`• Événements critiques: ${summary.critical_events}`);
            doc.text(`• Avertissements: ${summary.warnings}`);
            doc.text(`• Utilisateurs uniques: ${summary.unique_users}`);

            // Événements importants
            if (report.importantEvents && report.importantEvents.length > 0) {
                doc.moveDown(2);
                doc.fontSize(14).text('Événements Importants', { underline: true });
                doc.moveDown();
                doc.fontSize(9);

                report.importantEvents.slice(0, 10).forEach(event => {
                    const severity = event.severity === 'critical' ? '🔴' : '🟡';
                    doc.text(`${severity} ${event.title} - ${event.user_name || 'Système'}`);
                });
            }

            doc.end();
        });
    },

    /**
     * Exporter en JSON
     */
    exportToJSON(report) {
        return JSON.stringify(report, null, 2);
    }
};

reportService.REPORT_TYPES = REPORT_TYPES;

module.exports = reportService;
