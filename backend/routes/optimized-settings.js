/**
 * 🚀 ROUTES OPTIMISÉES POUR LES PARAMÈTRES
 * 
 * Ces routes remplacent les endpoints redondants par des appels
 * au service centralisé avec cache intelligent.
 * 
 * @author Ingénieur Full Stack Senior
 * @version 1.0.0
 */

const express = require('express');
const router = express.Router();
const settingsService = require('../services/SettingsService');
const { authenticateToken, requireRole } = require('../middleware/auth');

/**
 * 🏢 GET /api/settings/contact
 * Remplace: /api/contact
 * Données optimisées pour la page contact et le footer
 */
router.get('/contact', async (req, res) => {
  try {
    const { lang = 'fr' } = req.query;
    
    console.log(`🏢 GET /api/settings/contact (${lang})`);
    
    const contactData = await settingsService.getContactData(lang);
    
    // Headers de cache pour le navigateur
    res.set({
      'Cache-Control': 'public, max-age=300', // 5 minutes
      'ETag': `"contact-${lang}-${Date.now()}"`
    });
    
    res.json(contactData);
    
  } catch (error) {
    console.error('❌ Erreur /api/settings/contact:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des données de contact',
      fallback: {
        contact: {
          address: lang === 'ar' ? '8 شارع بنزرت، مدنين 4100، تونس' : '8 Rue Bizerte, Medenine 4100, Tunisie',
          phone: '+216 25 95 35 32',
          email: 'contact@mimaelghalia.tn',
          nursery_name: lang === 'ar' ? 'حضانة ميما الغالية' : 'Crèche Mima Elghalia',
          hours: lang === 'ar' ? 'الإثنين-الجمعة: 07:00-18:00' : 'Lun-Ven: 07:00-18:00'
        }
      }
    });
  }
});

/**
 * 🦶 GET /api/settings/footer
 * Remplace: /api/nursery-settings/footer
 * Données optimisées pour le footer public
 */
router.get('/footer', async (req, res) => {
  try {
    const { lang = 'fr' } = req.query;
    
    console.log(`🦶 GET /api/settings/footer (${lang})`);
    
    const footerData = await settingsService.getFooterData(lang);
    
    // Headers de cache agressifs (données publiques)
    res.set({
      'Cache-Control': 'public, max-age=900', // 15 minutes
      'ETag': `"footer-${lang}-${Date.now()}"`
    });
    
    res.json({
      success: true,
      settings: footerData,
      language: lang,
      cached: true
    });
    
  } catch (error) {
    console.error('❌ Erreur /api/settings/footer:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des données du footer'
    });
  }
});

/**
 * 📊 GET /api/settings/all
 * Remplace: /api/nursery-settings
 * Tous les paramètres avec authentification
 */
router.get('/all', authenticateToken, async (req, res) => {
  try {
    const { force_refresh = false } = req.query;
    
    console.log(`📊 GET /api/settings/all (force_refresh: ${force_refresh})`);
    
    const { settings, metadata } = await settingsService.getAllSettings(force_refresh === 'true');
    
    // Headers de cache conditionnels
    if (!force_refresh) {
      res.set({
        'Cache-Control': 'private, max-age=300',
        'ETag': `"settings-all-${metadata.lastUpdated}"`
      });
    }
    
    res.json({
      success: true,
      settings: settings,
      metadata: metadata,
      language: 'fr',
      total: metadata.total
    });
    
  } catch (error) {
    console.error('❌ Erreur /api/settings/all:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des paramètres'
    });
  }
});

/**
 * 🔄 PUT /api/settings/update
 * Mise à jour d'un paramètre unique
 */
router.put('/update', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { key, value_fr, value_ar, category } = req.body;
    
    if (!key || !value_fr) {
      return res.status(400).json({
        success: false,
        error: 'Clé et valeur française requises'
      });
    }
    
    console.log(`🔄 PUT /api/settings/update: ${key} = ${value_fr}`);
    
    await settingsService.updateSetting(key, value_fr, value_ar, category);
    
    res.json({
      success: true,
      message: `Paramètre ${key} mis à jour avec succès`,
      updated_at: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Erreur /api/settings/update:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la mise à jour du paramètre'
    });
  }
});

/**
 * 🔄 PUT /api/settings/bulk-update
 * Mise à jour multiple de paramètres
 */
router.put('/bulk-update', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { settings } = req.body;
    
    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Objet settings requis'
      });
    }
    
    console.log(`🔄 PUT /api/settings/bulk-update: ${Object.keys(settings).length} paramètres`);
    
    await settingsService.updateMultipleSettings(settings);
    
    res.json({
      success: true,
      message: `${Object.keys(settings).length} paramètres mis à jour avec succès`,
      updated_count: Object.keys(settings).length,
      updated_at: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Erreur /api/settings/bulk-update:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la mise à jour des paramètres'
    });
  }
});

/**
 * 📈 GET /api/settings/cache-stats
 * Statistiques du cache (admin seulement)
 */
router.get('/cache-stats', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const stats = settingsService.getCacheStats();
    
    res.json({
      success: true,
      cache_stats: stats,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Erreur /api/settings/cache-stats:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des statistiques'
    });
  }
});

/**
 * 🗑️ DELETE /api/settings/cache
 * Vider le cache (admin seulement)
 */
router.delete('/cache', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    settingsService._invalidateCache();
    
    res.json({
      success: true,
      message: 'Cache vidé avec succès',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Erreur /api/settings/cache:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors du vidage du cache'
    });
  }
});

module.exports = router;
