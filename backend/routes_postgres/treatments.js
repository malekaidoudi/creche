/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ROUTES TRAITEMENTS MÉDICAUX - CRÈCHE MIMA ELGHALIA
 * ═══════════════════════════════════════════════════════════════════════════
 */

const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole, requirePermission } = require('../middleware/auth');
const treatmentsController = require('../controllers/treatmentsController');

// ═══════════════════════════════════════════════════════════════════════════
// ROUTES PARENT
// ═══════════════════════════════════════════════════════════════════════════

// Créer un nouveau traitement
router.post('/', authenticateToken, treatmentsController.createTreatment);

// Récupérer les traitements de mes enfants
router.get('/my-children', authenticateToken, treatmentsController.getMyChildrenTreatments);

// Modifier un traitement
router.put('/:id', authenticateToken, treatmentsController.updateTreatment);

// Annuler un traitement
router.delete('/:id', authenticateToken, treatmentsController.cancelTreatment);

// ═══════════════════════════════════════════════════════════════════════════
// ROUTES DIRECTION / ADMIN (Approbation & Assignation)
// ═══════════════════════════════════════════════════════════════════════════

// Récupérer les demandes en attente de validation
router.get('/pending', authenticateToken, requireRole('admin', 'developer'), treatmentsController.getPendingTreatments);

// Valider une demande et assigner à un membre du staff
router.put('/:id/approve', authenticateToken, requireRole('admin', 'developer'), treatmentsController.approveTreatment);

// Refuser une demande de traitement
router.put('/:id/reject', authenticateToken, requireRole('admin', 'developer'), treatmentsController.rejectTreatment);

// ═══════════════════════════════════════════════════════════════════════════
// ROUTES STAFF
// ═══════════════════════════════════════════════════════════════════════════

// Récupérer les traitements à administrer aujourd'hui
router.get('/today', authenticateToken, requireRole('staff', 'admin', 'developer'), requirePermission('medical.treatments.manage'), treatmentsController.getTodayTreatments);

// Confirmer l'administration d'un traitement
router.post('/:id/administer', authenticateToken, requireRole('staff', 'admin', 'developer'), requirePermission('medical.treatments.manage'), treatmentsController.administerTreatment);

// Récupérer l'historique des administrations
router.get('/:id/history', authenticateToken, treatmentsController.getTreatmentHistory);

// Récupérer les traitements d'un enfant pour le rapport journalier
router.get('/child/:childId/today', authenticateToken, treatmentsController.getChildTodayTreatments);

// ═══════════════════════════════════════════════════════════════════════════
// ROUTE CRON (interne)
// ═══════════════════════════════════════════════════════════════════════════

// Vérifier et envoyer les notifications (appelé par le cron)
router.post('/check-notifications', async (req, res) => {
    // Vérifier le secret pour les appels cron
    const cronSecret = req.headers['x-cron-secret'];
    if (cronSecret !== process.env.CRON_SECRET && process.env.NODE_ENV === 'production') {
        return res.status(401).json({ success: false, message: 'Non autorisé' });
    }

    const result = await treatmentsController.checkAndNotifyTreatments();
    res.json({ success: true, ...result });
});

module.exports = router;
