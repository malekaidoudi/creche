/**
 * Routes pour le journal d'activité
 * Crèche Mima El Ghalia
 */

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const activityLogController = require('../controllers/activityLogController');

// ==================== MIDDLEWARE ====================

// Toutes les routes nécessitent une authentification
router.use(auth.authenticateToken);

// Middleware pour autoriser l'administrateur et le rôle développeur système
const requireAdminOrDeveloper = auth.requireRole('admin', 'developer');

// ==================== DASHBOARD ====================

/**
 * @route GET /api/activity-logs/dashboard
 * @desc Données complètes pour le tableau de bord
 * @access Admin, Developer
 */
router.get('/dashboard', requireAdminOrDeveloper, activityLogController.getDashboard);

// ==================== LOGS ====================

/**
 * @route GET /api/activity-logs
 * @desc Récupérer les logs avec filtres et pagination
 * @access Admin, Developer
 * @query {number} page - Numéro de page (défaut: 1)
 * @query {number} limit - Nombre par page (défaut: 50)
 * @query {string} category - Filtrer par catégorie
 * @query {string} severity - Filtrer par sévérité
 * @query {string} action - Filtrer par action
 * @query {number} userId - Filtrer par utilisateur
 * @query {string} search - Recherche textuelle
 * @query {string} startDate - Date de début
 * @query {string} endDate - Date de fin
 */
router.get('/', requireAdminOrDeveloper, activityLogController.getAll);

/**
 * @route GET /api/activity-logs/stats
 * @desc Statistiques des activités
 * @access Admin, Developer
 * @query {string} period - today, week, month
 * @query {string} startDate - Date de début personnalisée
 * @query {string} endDate - Date de fin personnalisée
 */
router.get('/stats', requireAdminOrDeveloper, activityLogController.getStats);

/**
 * @route GET /api/activity-logs/actions
 * @desc Liste des actions disponibles pour les filtres
 * @access Admin, Developer
 */
router.get('/actions', requireAdminOrDeveloper, activityLogController.getAvailableActions);

/**
 * @route GET /api/activity-logs/archive
 * @desc Rechercher dans les archives
 * @access Admin, Developer
 */
router.get('/archive', requireAdminOrDeveloper, activityLogController.searchArchive);

/**
 * @route POST /api/activity-logs/archive
 * @desc Déclencher l'archivage manuel
 * @access Admin, Developer
 */
router.post('/archive', requireAdminOrDeveloper, activityLogController.triggerArchive);

/**
 * @route DELETE /api/activity-logs/cleanup
 * @desc Nettoyer les anciennes archives
 * @access Admin, Developer
 */
router.delete('/cleanup', requireAdminOrDeveloper, activityLogController.cleanup);

/**
 * @route POST /api/activity-logs
 * @desc Créer un log manuellement (usage interne)
 * @access Admin, Developer
 */
router.post('/', requireAdminOrDeveloper, activityLogController.create);

// ==================== ALERTES ====================

/**
 * @route GET /api/activity-logs/alerts
 * @desc Récupérer toutes les alertes
 * @access Admin, Developer
 */
router.get('/alerts', requireAdminOrDeveloper, activityLogController.getAlerts);

/**
 * @route GET /api/activity-logs/alerts/active
 * @desc Récupérer les alertes actives uniquement
 * @access Admin, Developer
 */
router.get('/alerts/active', requireAdminOrDeveloper, activityLogController.getActiveAlerts);

/**
 * @route GET /api/activity-logs/alerts/stats
 * @desc Statistiques des alertes
 * @access Admin, Developer
 */
router.get('/alerts/stats', requireAdminOrDeveloper, activityLogController.getAlertStats);

/**
 * @route GET /api/activity-logs/alerts/:id
 * @desc Récupérer une alerte par ID
 * @access Admin, Developer
 */
router.get('/alerts/:id', requireAdminOrDeveloper, activityLogController.getAlertById);

/**
 * @route PUT /api/activity-logs/alerts/:id/acknowledge
 * @desc Marquer une alerte comme vue
 * @access Admin, Developer
 */
router.put('/alerts/:id/acknowledge', requireAdminOrDeveloper, activityLogController.acknowledgeAlert);

/**
 * @route PUT /api/activity-logs/alerts/:id/resolve
 * @desc Résoudre une alerte
 * @access Admin, Developer
 */
router.put('/alerts/:id/resolve', requireAdminOrDeveloper, activityLogController.resolveAlert);

/**
 * @route PUT /api/activity-logs/alerts/:id/dismiss
 * @desc Ignorer une alerte
 * @access Admin, Developer
 */
router.put('/alerts/:id/dismiss', requireAdminOrDeveloper, activityLogController.dismissAlert);

// ==================== RAPPORTS ====================

/**
 * @route GET /api/activity-logs/reports/daily
 * @desc Générer un rapport quotidien
 * @access Admin, Developer
 * @query {string} date - Date du rapport (défaut: aujourd'hui)
 */
router.get('/reports/daily', requireAdminOrDeveloper, activityLogController.getDailyReport);

/**
 * @route GET /api/activity-logs/reports/weekly
 * @desc Générer un rapport hebdomadaire
 * @access Admin, Developer
 * @query {string} startDate - Date de début de la semaine
 */
router.get('/reports/weekly', requireAdminOrDeveloper, activityLogController.getWeeklyReport);

/**
 * @route GET /api/activity-logs/reports/monthly
 * @desc Générer un rapport mensuel
 * @access Admin, Developer
 * @query {number} year - Année
 * @query {number} month - Mois (0-11)
 */
router.get('/reports/monthly', requireAdminOrDeveloper, activityLogController.getMonthlyReport);

/**
 * @route GET /api/activity-logs/reports/history
 * @desc Historique des rapports générés
 * @access Admin, Developer
 */
router.get('/reports/history', requireAdminOrDeveloper, activityLogController.getReportHistory);

/**
 * @route GET /api/activity-logs/reports/:id
 * @desc Récupérer un rapport par ID
 * @access Admin, Developer
 */
router.get('/reports/:id', requireAdminOrDeveloper, activityLogController.getReportById);

/**
 * @route GET /api/activity-logs/reports/:type/export/:format
 * @desc Exporter un rapport
 * @access Admin, Developer
 * @param {string} type - daily, weekly, monthly
 * @param {string} format - excel, pdf, json
 */
router.get('/reports/:type/export/:format', requireAdminOrDeveloper, activityLogController.exportReport);

// ==================== ROUTE DYNAMIQUE (doit être en dernier) ====================

/**
 * @route GET /api/activity-logs/:id
 * @desc Récupérer un log par ID
 * @access Admin, Developer
 * @note Cette route DOIT être en dernier car :id capture tout
 */
router.get('/:id', requireAdminOrDeveloper, activityLogController.getById);

module.exports = router;
