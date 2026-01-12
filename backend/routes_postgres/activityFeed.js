/**
 * Routes pour le Fil d'Activité Simplifié
 * Crèche Mima El Ghalia
 */

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const activityFeedService = require('../services/activityFeedService');

// Toutes les routes nécessitent une authentification
router.use(auth.authenticateToken);

// Middleware pour vérifier le rôle admin uniquement
const requireAdmin = auth.requireRole('admin');

/**
 * GET /api/activity-feed
 * Récupérer le fil d'activité
 */
router.get('/', requireAdmin, async (req, res) => {
    try {
        const { page, limit, role, date, userId } = req.query;

        const result = await activityFeedService.getFeed({
            page: parseInt(page) || 1,
            limit: parseInt(limit) || 30,
            role: role || null,
            date: date || null,
            userId: userId ? parseInt(userId) : null
        });

        res.json({
            success: true,
            ...result
        });
    } catch (error) {
        console.error('❌ Erreur récupération feed:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la récupération du fil d\'activité'
        });
    }
});

/**
 * GET /api/activity-feed/summary
 * Résumé du jour
 */
router.get('/summary', requireAdmin, async (req, res) => {
    try {
        const { date } = req.query;
        const summary = await activityFeedService.getDailySummary(date || null);

        res.json({
            success: true,
            summary
        });
    } catch (error) {
        console.error('❌ Erreur résumé:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la récupération du résumé'
        });
    }
});

/**
 * GET /api/activity-feed/calendar/:year/:month
 * Données pour le calendrier
 */
router.get('/calendar/:year/:month', requireAdmin, async (req, res) => {
    try {
        const { year, month } = req.params;
        const calendarData = await activityFeedService.getCalendarData(
            parseInt(year),
            parseInt(month)
        );

        res.json({
            success: true,
            calendar: calendarData
        });
    } catch (error) {
        console.error('❌ Erreur calendrier:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la récupération des données calendrier'
        });
    }
});

/**
 * GET /api/activity-feed/user/:userId
 * Activités d'un utilisateur spécifique
 */
router.get('/user/:userId', requireAdmin, async (req, res) => {
    try {
        const { userId } = req.params;
        const { limit } = req.query;

        const activities = await activityFeedService.getUserActivity(
            parseInt(userId),
            parseInt(limit) || 20
        );

        res.json({
            success: true,
            activities
        });
    } catch (error) {
        console.error('❌ Erreur activité utilisateur:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la récupération des activités utilisateur'
        });
    }
});

module.exports = router;
