/**
 * Controller pour les logs d'activité
 * Crèche Mima El Ghalia - Journal d'Activité
 */

const activityLogService = require('../services/activityLogService');
const alertService = require('../services/alertService');
const reportService = require('../services/reportService');

const activityLogController = {
    /**
     * GET /api/activity-logs
     * Récupérer les logs avec filtres et pagination
     */
    async getAll(req, res) {
        try {
            const {
                page = 1,
                limit = 50,
                category,
                severity,
                action,
                userId,
                targetType,
                targetId,
                search,
                startDate,
                endDate,
                includeArchived
            } = req.query;

            const result = await activityLogService.getAll({
                page: parseInt(page),
                limit: parseInt(limit),
                category,
                severity,
                action,
                userId: userId ? parseInt(userId) : null,
                targetType,
                targetId: targetId ? parseInt(targetId) : null,
                search,
                startDate,
                endDate,
                includeArchived: includeArchived === 'true'
            });

            res.json({
                success: true,
                ...result
            });
        } catch (error) {
            console.error('❌ Erreur getAll activity logs:', error);
            res.status(500).json({
                success: false,
                error: 'Erreur lors de la récupération des logs',
                details: error.message
            });
        }
    },

    /**
     * GET /api/activity-logs/stats
     * Récupérer les statistiques
     */
    async getStats(req, res) {
        try {
            const { startDate, endDate, period = 'today' } = req.query;

            const stats = await activityLogService.getStats({
                startDate,
                endDate,
                period
            });

            res.json({
                success: true,
                stats
            });
        } catch (error) {
            console.error('❌ Erreur getStats activity logs:', error);
            res.status(500).json({
                success: false,
                error: 'Erreur lors de la récupération des statistiques',
                details: error.message
            });
        }
    },

    /**
     * GET /api/activity-logs/actions
     * Récupérer les actions disponibles pour les filtres
     */
    async getAvailableActions(req, res) {
        try {
            const actions = await activityLogService.getAvailableActions();

            // Ajouter les actions prédéfinies
            const predefinedActions = Object.entries(activityLogService.ACTIONS).map(([key, value]) => ({
                key,
                action: value.action,
                category: value.category,
                title: value.title
            }));

            res.json({
                success: true,
                actions,
                predefinedActions,
                categories: Object.values(activityLogService.CATEGORIES),
                severities: Object.values(activityLogService.SEVERITY)
            });
        } catch (error) {
            console.error('❌ Erreur getAvailableActions:', error);
            res.status(500).json({
                success: false,
                error: 'Erreur lors de la récupération des actions',
                details: error.message
            });
        }
    },

    /**
     * GET /api/activity-logs/:id
     * Récupérer un log par ID
     */
    async getById(req, res) {
        try {
            const { id } = req.params;
            const log = await activityLogService.getById(parseInt(id));

            if (!log) {
                return res.status(404).json({
                    success: false,
                    error: 'Log non trouvé'
                });
            }

            res.json({
                success: true,
                log
            });
        } catch (error) {
            console.error('❌ Erreur getById activity log:', error);
            res.status(500).json({
                success: false,
                error: 'Erreur lors de la récupération du log',
                details: error.message
            });
        }
    },

    /**
     * POST /api/activity-logs
     * Créer un nouveau log (usage interne principalement)
     */
    async create(req, res) {
        try {
            const logData = {
                ...req.body,
                userId: req.body.userId || req.user?.id,
                ipAddress: req.ip,
                userAgent: req.get('User-Agent')
            };

            const log = await activityLogService.create(logData);

            res.status(201).json({
                success: true,
                log
            });
        } catch (error) {
            console.error('❌ Erreur create activity log:', error);
            res.status(500).json({
                success: false,
                error: 'Erreur lors de la création du log',
                details: error.message
            });
        }
    },

    /**
     * GET /api/activity-logs/archive
     * Rechercher dans les archives
     */
    async searchArchive(req, res) {
        try {
            const { search, startDate, endDate, limit = 100 } = req.query;

            const results = await activityLogService.searchArchive({
                search,
                startDate,
                endDate,
                limit: parseInt(limit)
            });

            res.json({
                success: true,
                logs: results,
                count: results.length
            });
        } catch (error) {
            console.error('❌ Erreur searchArchive:', error);
            res.status(500).json({
                success: false,
                error: 'Erreur lors de la recherche dans les archives',
                details: error.message
            });
        }
    },

    /**
     * POST /api/activity-logs/archive
     * Déclencher l'archivage manuel
     */
    async triggerArchive(req, res) {
        try {
            const archivedCount = await activityLogService.archiveOldLogs();

            // Logger cette action
            await activityLogService.logAction('SYSTEM_WARNING', {
                description: `Archivage manuel déclenché: ${archivedCount} logs archivés`,
                userId: req.user?.id,
                userName: req.user?.firstName + ' ' + req.user?.lastName
            });

            res.json({
                success: true,
                message: `${archivedCount} logs archivés avec succès`,
                archivedCount
            });
        } catch (error) {
            console.error('❌ Erreur triggerArchive:', error);
            res.status(500).json({
                success: false,
                error: 'Erreur lors de l\'archivage',
                details: error.message
            });
        }
    },

    /**
     * DELETE /api/activity-logs/cleanup
     * Nettoyer les anciennes archives
     */
    async cleanup(req, res) {
        try {
            const deletedCount = await activityLogService.cleanupOldArchives();

            await activityLogService.logAction('SYSTEM_WARNING', {
                description: `Nettoyage archives: ${deletedCount} entrées supprimées`,
                userId: req.user?.id,
                userName: req.user?.firstName + ' ' + req.user?.lastName
            });

            res.json({
                success: true,
                message: `${deletedCount} archives supprimées`,
                deletedCount
            });
        } catch (error) {
            console.error('❌ Erreur cleanup:', error);
            res.status(500).json({
                success: false,
                error: 'Erreur lors du nettoyage',
                details: error.message
            });
        }
    },

    // ==================== ALERTES ====================

    /**
     * GET /api/activity-logs/alerts
     * Récupérer toutes les alertes
     */
    async getAlerts(req, res) {
        try {
            const {
                page = 1,
                limit = 50,
                status,
                severity,
                type,
                startDate,
                endDate
            } = req.query;

            const result = await alertService.getAll({
                page: parseInt(page),
                limit: parseInt(limit),
                status,
                severity,
                type,
                startDate,
                endDate
            });

            res.json({
                success: true,
                ...result
            });
        } catch (error) {
            console.error('❌ Erreur getAlerts:', error);
            res.status(500).json({
                success: false,
                error: 'Erreur lors de la récupération des alertes',
                details: error.message
            });
        }
    },

    /**
     * GET /api/activity-logs/alerts/active
     * Récupérer les alertes actives
     */
    async getActiveAlerts(req, res) {
        try {
            const alerts = await alertService.getActive();

            res.json({
                success: true,
                alerts,
                count: alerts.length
            });
        } catch (error) {
            console.error('❌ Erreur getActiveAlerts:', error);
            res.status(500).json({
                success: false,
                error: 'Erreur lors de la récupération des alertes actives',
                details: error.message
            });
        }
    },

    /**
     * GET /api/activity-logs/alerts/stats
     * Statistiques des alertes
     */
    async getAlertStats(req, res) {
        try {
            const stats = await alertService.getStats();

            res.json({
                success: true,
                stats
            });
        } catch (error) {
            console.error('❌ Erreur getAlertStats:', error);
            res.status(500).json({
                success: false,
                error: 'Erreur lors de la récupération des statistiques d\'alertes',
                details: error.message
            });
        }
    },

    /**
     * GET /api/activity-logs/alerts/:id
     * Récupérer une alerte par ID
     */
    async getAlertById(req, res) {
        try {
            const { id } = req.params;
            const alert = await alertService.getById(parseInt(id));

            if (!alert) {
                return res.status(404).json({
                    success: false,
                    error: 'Alerte non trouvée'
                });
            }

            res.json({
                success: true,
                alert
            });
        } catch (error) {
            console.error('❌ Erreur getAlertById:', error);
            res.status(500).json({
                success: false,
                error: 'Erreur lors de la récupération de l\'alerte',
                details: error.message
            });
        }
    },

    /**
     * PUT /api/activity-logs/alerts/:id/acknowledge
     * Marquer une alerte comme vue
     */
    async acknowledgeAlert(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user?.id;

            const alert = await alertService.acknowledge(parseInt(id), userId);

            res.json({
                success: true,
                alert
            });
        } catch (error) {
            console.error('❌ Erreur acknowledgeAlert:', error);
            res.status(500).json({
                success: false,
                error: 'Erreur lors de l\'acknowledgement de l\'alerte',
                details: error.message
            });
        }
    },

    /**
     * PUT /api/activity-logs/alerts/:id/resolve
     * Résoudre une alerte
     */
    async resolveAlert(req, res) {
        try {
            const { id } = req.params;
            const { resolution } = req.body;
            const userId = req.user?.id;

            const alert = await alertService.resolve(parseInt(id), userId, resolution);

            res.json({
                success: true,
                alert
            });
        } catch (error) {
            console.error('❌ Erreur resolveAlert:', error);
            res.status(500).json({
                success: false,
                error: 'Erreur lors de la résolution de l\'alerte',
                details: error.message
            });
        }
    },

    /**
     * PUT /api/activity-logs/alerts/:id/dismiss
     * Ignorer une alerte
     */
    async dismissAlert(req, res) {
        try {
            const { id } = req.params;
            const { reason } = req.body;
            const userId = req.user?.id;

            const alert = await alertService.dismiss(parseInt(id), userId, reason);

            res.json({
                success: true,
                alert
            });
        } catch (error) {
            console.error('❌ Erreur dismissAlert:', error);
            res.status(500).json({
                success: false,
                error: 'Erreur lors du dismiss de l\'alerte',
                details: error.message
            });
        }
    },

    // ==================== RAPPORTS ====================

    /**
     * GET /api/activity-logs/reports/daily
     * Générer un rapport quotidien
     */
    async getDailyReport(req, res) {
        try {
            const { date } = req.query;
            const report = await reportService.generateDailyReport(date ? new Date(date) : new Date());

            res.json({
                success: true,
                report
            });
        } catch (error) {
            console.error('❌ Erreur getDailyReport:', error);
            res.status(500).json({
                success: false,
                error: 'Erreur lors de la génération du rapport quotidien',
                details: error.message
            });
        }
    },

    /**
     * GET /api/activity-logs/reports/weekly
     * Générer un rapport hebdomadaire
     */
    async getWeeklyReport(req, res) {
        try {
            const { startDate } = req.query;
            const report = await reportService.generateWeeklyReport(startDate ? new Date(startDate) : null);

            res.json({
                success: true,
                report
            });
        } catch (error) {
            console.error('❌ Erreur getWeeklyReport:', error);
            res.status(500).json({
                success: false,
                error: 'Erreur lors de la génération du rapport hebdomadaire',
                details: error.message
            });
        }
    },

    /**
     * GET /api/activity-logs/reports/monthly
     * Générer un rapport mensuel
     */
    async getMonthlyReport(req, res) {
        try {
            const { year, month } = req.query;
            const report = await reportService.generateMonthlyReport(
                year ? parseInt(year) : null,
                month !== undefined ? parseInt(month) : null
            );

            res.json({
                success: true,
                report
            });
        } catch (error) {
            console.error('❌ Erreur getMonthlyReport:', error);
            res.status(500).json({
                success: false,
                error: 'Erreur lors de la génération du rapport mensuel',
                details: error.message
            });
        }
    },

    /**
     * GET /api/activity-logs/reports/history
     * Historique des rapports
     */
    async getReportHistory(req, res) {
        try {
            const { type, limit = 20, page = 1 } = req.query;
            const history = await reportService.getHistory({
                type,
                limit: parseInt(limit),
                page: parseInt(page)
            });

            res.json({
                success: true,
                reports: history
            });
        } catch (error) {
            console.error('❌ Erreur getReportHistory:', error);
            res.status(500).json({
                success: false,
                error: 'Erreur lors de la récupération de l\'historique',
                details: error.message
            });
        }
    },

    /**
     * GET /api/activity-logs/reports/:id
     * Récupérer un rapport par ID
     */
    async getReportById(req, res) {
        try {
            const { id } = req.params;
            const report = await reportService.getById(parseInt(id));

            if (!report) {
                return res.status(404).json({
                    success: false,
                    error: 'Rapport non trouvé'
                });
            }

            res.json({
                success: true,
                report
            });
        } catch (error) {
            console.error('❌ Erreur getReportById:', error);
            res.status(500).json({
                success: false,
                error: 'Erreur lors de la récupération du rapport',
                details: error.message
            });
        }
    },

    /**
     * GET /api/activity-logs/reports/:type/export/:format
     * Exporter un rapport
     */
    async exportReport(req, res) {
        try {
            const { type, format } = req.params;
            const { date, startDate, year, month } = req.query;

            let report;
            switch (type) {
                case 'daily':
                    report = await reportService.generateDailyReport(date ? new Date(date) : new Date());
                    break;
                case 'weekly':
                    report = await reportService.generateWeeklyReport(startDate ? new Date(startDate) : null);
                    break;
                case 'monthly':
                    report = await reportService.generateMonthlyReport(
                        year ? parseInt(year) : null,
                        month !== undefined ? parseInt(month) : null
                    );
                    break;
                default:
                    return res.status(400).json({
                        success: false,
                        error: 'Type de rapport invalide'
                    });
            }

            const filename = `rapport_${type}_${new Date().toISOString().split('T')[0]}`;

            switch (format) {
                case 'excel':
                    const excelBuffer = await reportService.exportToExcel(report);
                    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                    res.setHeader('Content-Disposition', `attachment; filename="${filename}.xlsx"`);
                    res.send(excelBuffer);
                    break;

                case 'pdf':
                    const pdfBuffer = await reportService.exportToPDF(report);
                    res.setHeader('Content-Type', 'application/pdf');
                    res.setHeader('Content-Disposition', `attachment; filename="${filename}.pdf"`);
                    res.send(pdfBuffer);
                    break;

                case 'json':
                    res.setHeader('Content-Type', 'application/json');
                    res.setHeader('Content-Disposition', `attachment; filename="${filename}.json"`);
                    res.send(reportService.exportToJSON(report));
                    break;

                default:
                    return res.status(400).json({
                        success: false,
                        error: 'Format d\'export invalide'
                    });
            }
        } catch (error) {
            console.error('❌ Erreur exportReport:', error);
            res.status(500).json({
                success: false,
                error: 'Erreur lors de l\'export du rapport',
                details: error.message
            });
        }
    },

    // ==================== DASHBOARD ====================

    /**
     * GET /api/activity-logs/dashboard
     * Données pour le tableau de bord
     */
    async getDashboard(req, res) {
        try {
            const [stats, activeAlerts, alertStats] = await Promise.all([
                activityLogService.getStats({ period: 'today' }),
                alertService.getActive(),
                alertService.getStats()
            ]);

            // Activités récentes
            const recentActivities = await activityLogService.getAll({
                limit: 20,
                page: 1
            });

            res.json({
                success: true,
                dashboard: {
                    stats: stats.summary,
                    byCategory: stats.byCategory,
                    byHour: stats.byHour,
                    recentImportant: stats.recentImportant,
                    activeAlerts,
                    alertStats: alertStats.summary,
                    recentActivities: recentActivities.logs
                }
            });
        } catch (error) {
            console.error('❌ Erreur getDashboard:', error);
            res.status(500).json({
                success: false,
                error: 'Erreur lors de la récupération du tableau de bord',
                details: error.message
            });
        }
    }
};

module.exports = activityLogController;
