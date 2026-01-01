/**
 * Routes pour les rapports journaliers (daily_reports)
 * Suivi quotidien des enfants par les éducatrices
 */

const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');
const dailyReportsController = require('../controllers/dailyReportsController');

// ============================================
// ROUTES STAFF/ADMIN (création et gestion)
// ============================================

// Liste des enfants à remplir aujourd'hui
router.get('/children/today',
    authenticateToken,
    requireRole('admin', 'staff'),
    dailyReportsController.getChildrenForToday
);

// Créer ou mettre à jour un rapport
router.post('/',
    authenticateToken,
    requireRole('admin', 'staff'),
    dailyReportsController.createOrUpdateReport
);

// Changer le statut d'un rapport
router.patch('/:id/status',
    authenticateToken,
    requireRole('admin', 'staff'),
    dailyReportsController.updateReportStatus
);

// Supprimer un rapport
router.delete('/:id',
    authenticateToken,
    requireRole('admin', 'staff'),
    dailyReportsController.deleteReport
);

// ============================================
// ROUTES PARENT (consultation)
// ============================================

// Rapports des enfants d'un parent
router.get('/parent/my-children',
    authenticateToken,
    requireRole('parent', 'admin', 'staff'),
    dailyReportsController.getParentChildrenReports
);

// ============================================
// ROUTES COMMUNES (lecture)
// ============================================

// Historique des rapports d'un enfant
router.get('/:childId/history',
    authenticateToken,
    dailyReportsController.getReportHistory
);

// Récupérer un rapport spécifique par enfant et date
router.get('/:childId/:date',
    authenticateToken,
    dailyReportsController.getReport
);

module.exports = router;
