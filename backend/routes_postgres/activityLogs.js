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

// Middleware pour vérifier les rôles admin/staff
const requireAdminOrStaff = auth.requireRole('admin', 'staff');

// ==================== DASHBOARD ====================

/**
 * @route GET /api/activity-logs/dashboard
 * @desc Données complètes pour le tableau de bord
 * @access Admin, Staff
 */
router.get('/dashboard', requireAdminOrStaff, activityLogController.getDashboard);

// ==================== LOGS ====================

/**
 * @route GET /api/activity-logs
 * @desc Récupérer les logs avec filtres et pagination
 * @access Admin, Staff
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
router.get('/', requireAdminOrStaff, activityLogController.getAll);

/**
 * @route GET /api/activity-logs/stats
 * @desc Statistiques des activités
 * @access Admin, Staff
 * @query {string} period - today, week, month
 * @query {string} startDate - Date de début personnalisée
 * @query {string} endDate - Date de fin personnalisée
 */
router.get('/stats', requireAdminOrStaff, activityLogController.getStats);

/**
 * @route GET /api/activity-logs/actions
 * @desc Liste des actions disponibles pour les filtres
 * @access Admin, Staff
 */
router.get('/actions', requireAdminOrStaff, activityLogController.getAvailableActions);

/**
 * @route GET /api/activity-logs/archive
 * @desc Rechercher dans les archives
 * @access Admin
 */
router.get('/archive', auth.requireRole('admin'), activityLogController.searchArchive);

/**
 * @route POST /api/activity-logs/archive
 * @desc Déclencher l'archivage manuel
 * @access Admin
 */
router.post('/archive', auth.requireRole('admin'), activityLogController.triggerArchive);

/**
 * @route DELETE /api/activity-logs/cleanup
 * @desc Nettoyer les anciennes archives
 * @access Admin
 */
router.delete('/cleanup', auth.requireRole('admin'), activityLogController.cleanup);

/**
 * @route POST /api/activity-logs
 * @desc Créer un log manuellement (usage interne)
 * @access Admin
 */
router.post('/', auth.requireRole('admin'), activityLogController.create);

// ==================== ALERTES ====================

/**
 * @route GET /api/activity-logs/alerts
 * @desc Récupérer toutes les alertes
 * @access Admin, Staff
 */
router.get('/alerts', requireAdminOrStaff, activityLogController.getAlerts);

/**
 * @route GET /api/activity-logs/alerts/active
 * @desc Récupérer les alertes actives uniquement
 * @access Admin, Staff
 */
router.get('/alerts/active', requireAdminOrStaff, activityLogController.getActiveAlerts);

/**
 * @route GET /api/activity-logs/alerts/stats
 * @desc Statistiques des alertes
 * @access Admin, Staff
 */
router.get('/alerts/stats', requireAdminOrStaff, activityLogController.getAlertStats);

/**
 * @route GET /api/activity-logs/alerts/:id
 * @desc Récupérer une alerte par ID
 * @access Admin, Staff
 */
router.get('/alerts/:id', requireAdminOrStaff, activityLogController.getAlertById);

/**
 * @route PUT /api/activity-logs/alerts/:id/acknowledge
 * @desc Marquer une alerte comme vue
 * @access Admin, Staff
 */
router.put('/alerts/:id/acknowledge', requireAdminOrStaff, activityLogController.acknowledgeAlert);

/**
 * @route PUT /api/activity-logs/alerts/:id/resolve
 * @desc Résoudre une alerte
 * @access Admin, Staff
 */
router.put('/alerts/:id/resolve', requireAdminOrStaff, activityLogController.resolveAlert);

/**
 * @route PUT /api/activity-logs/alerts/:id/dismiss
 * @desc Ignorer une alerte
 * @access Admin, Staff
 */
router.put('/alerts/:id/dismiss', requireAdminOrStaff, activityLogController.dismissAlert);

// ==================== RAPPORTS ====================

/**
 * @route GET /api/activity-logs/reports/daily
 * @desc Générer un rapport quotidien
 * @access Admin, Staff
 * @query {string} date - Date du rapport (défaut: aujourd'hui)
 */
router.get('/reports/daily', requireAdminOrStaff, activityLogController.getDailyReport);

/**
 * @route GET /api/activity-logs/reports/weekly
 * @desc Générer un rapport hebdomadaire
 * @access Admin, Staff
 * @query {string} startDate - Date de début de la semaine
 */
router.get('/reports/weekly', requireAdminOrStaff, activityLogController.getWeeklyReport);

/**
 * @route GET /api/activity-logs/reports/monthly
 * @desc Générer un rapport mensuel
 * @access Admin, Staff
 * @query {number} year - Année
 * @query {number} month - Mois (0-11)
 */
router.get('/reports/monthly', requireAdminOrStaff, activityLogController.getMonthlyReport);

/**
 * @route GET /api/activity-logs/reports/history
 * @desc Historique des rapports générés
 * @access Admin, Staff
 */
router.get('/reports/history', requireAdminOrStaff, activityLogController.getReportHistory);

/**
 * @route GET /api/activity-logs/reports/:id
 * @desc Récupérer un rapport par ID
 * @access Admin, Staff
 */
router.get('/reports/:id', requireAdminOrStaff, activityLogController.getReportById);

/**
 * @route GET /api/activity-logs/reports/:type/export/:format
 * @desc Exporter un rapport
 * @access Admin, Staff
 * @param {string} type - daily, weekly, monthly
 * @param {string} format - excel, pdf, json
 */
router.get('/reports/:type/export/:format', requireAdminOrStaff, activityLogController.exportReport);

// ==================== ROUTE DYNAMIQUE (doit être en dernier) ====================

/**
 * @route GET /api/activity-logs/:id
 * @desc Récupérer un log par ID
 * @access Admin, Staff
 * @note Cette route DOIT être en dernier car :id capture tout
 */
router.get('/:id', requireAdminOrStaff, activityLogController.getById);

module.exports = router;
