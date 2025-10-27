/**
 * 🏗️ SERVICE CENTRALISÉ POUR LA GESTION DES PARAMÈTRES
 * 
 * Ce service centralise tous les accès aux paramètres de la crèche
 * et implémente un système de cache intelligent pour optimiser les performances.
 * 
 * @author Ingénieur Full Stack Senior
 * @version 1.0.0
 */

const NodeCache = require('node-cache');

class SettingsService {
  constructor() {
    // Cache avec TTL de 5 minutes (300 secondes)
    this.cache = new NodeCache({ 
      stdTTL: 300, 
      checkperiod: 60,
      useClones: false // Améliore les performances
    });
    
    // Clés de cache standardisées
    this.CACHE_KEYS = {
      ALL_SETTINGS: 'all_settings',
      CONTACT_DATA: 'contact_data',
      FOOTER_DATA: 'footer_data',
      PUBLIC_SETTINGS: 'public_settings'
    };
    
    console.log('🚀 SettingsService initialisé avec cache TTL=300s');
  }

  /**
   * 📊 MÉTHODE PRINCIPALE - Récupère tous les paramètres avec cache
   */
  async getAllSettings(forceRefresh = false) {
    const cacheKey = this.CACHE_KEYS.ALL_SETTINGS;
    
    // Vérifier le cache d'abord
    if (!forceRefresh) {
      const cached = this.cache.get(cacheKey);
      if (cached) {
        console.log('✅ Settings récupérés depuis le cache');
        return cached;
      }
    }
    
    try {
      const db = require('../config/db_postgres');
      console.log('🔄 Récupération settings depuis la DB...');
      
      // Requête unique optimisée
      const result = await db.query(`
        SELECT setting_key, value_fr, value_ar, category, is_active, updated_at
        FROM nursery_settings 
        WHERE is_active = TRUE
        ORDER BY category, setting_key
      `);
      
      // Organiser les données de manière optimale
      const settings = {};
      const metadata = {
        total: result.rows.length,
        categories: new Set(),
        lastUpdated: new Date().toISOString()
      };
      
      result.rows.forEach(row => {
        settings[row.setting_key] = {
          fr: row.value_fr,
          ar: row.value_ar,
          value: row.value_fr, // Compatibilité
          category: row.category,
          updated_at: row.updated_at
        };
        metadata.categories.add(row.category);
      });
      
      metadata.categories = Array.from(metadata.categories);
      
      const settingsData = { settings, metadata };
      
      // Mettre en cache
      this.cache.set(cacheKey, settingsData);
      console.log(`📦 ${result.rows.length} settings mis en cache`);
      
      return settingsData;
      
    } catch (error) {
      console.error('❌ Erreur récupération settings:', error);
      throw error;
    }
  }

  /**
   * 🏢 DONNÉES CONTACT OPTIMISÉES
   */
  async getContactData(language = 'fr') {
    const cacheKey = `${this.CACHE_KEYS.CONTACT_DATA}_${language}`;
    
    // Vérifier le cache
    const cached = this.cache.get(cacheKey);
    if (cached) {
      console.log('✅ Contact data depuis le cache');
      return cached;
    }
    
    try {
      const { settings } = await this.getAllSettings();
      
      // Clés nécessaires pour le contact
      const contactKeys = [
        'address', 'phone', 'email', 'nursery_name',
        'working_hours_weekdays', 'working_hours_saturday', 
        'saturday_open', 'working_days'
      ];
      
      // Construire les heures d'ouverture intelligemment
      const weekdaysHours = settings.working_hours_weekdays?.fr || '07:00-18:00';
      const saturdayHours = settings.working_hours_saturday?.fr || '08:00-12:00';
      const saturdayOpen = settings.saturday_open?.fr === 'true';
      
      // Formatage des heures selon la langue
      const hours = this._formatOpeningHours(weekdaysHours, saturdayHours, saturdayOpen, language);
      
      const contactData = {
        success: true,
        contact: {
          address: language === 'ar' ? settings.address?.ar : settings.address?.fr,
          phone: settings.phone?.fr || '+216 25 95 35 32',
          email: settings.email?.fr || 'contact@mimaelghalia.tn',
          nursery_name: language === 'ar' ? 'حضانة ميما الغالية' : 'Crèche Mima Elghalia',
          hours: hours,
          hours_fr: this._formatOpeningHours(weekdaysHours, saturdayHours, saturdayOpen, 'fr'),
          hours_ar: this._formatOpeningHours(weekdaysHours, saturdayHours, saturdayOpen, 'ar')
        },
        metadata: {
          cached: true,
          generated_at: new Date().toISOString()
        }
      };
      
      // Mettre en cache pour 10 minutes (données publiques)
      this.cache.set(cacheKey, contactData, 600);
      console.log('📦 Contact data mis en cache');
      
      return contactData;
      
    } catch (error) {
      console.error('❌ Erreur génération contact data:', error);
      throw error;
    }
  }

  /**
   * 🦶 DONNÉES FOOTER OPTIMISÉES
   */
  async getFooterData(language = 'fr') {
    const cacheKey = `${this.CACHE_KEYS.FOOTER_DATA}_${language}`;
    
    const cached = this.cache.get(cacheKey);
    if (cached) {
      console.log('✅ Footer data depuis le cache');
      return cached;
    }
    
    try {
      const { settings } = await this.getAllSettings();
      
      // Format compatible avec l'ancien système
      const footerData = {};
      Object.keys(settings).forEach(key => {
        footerData[key] = {
          value: language === 'ar' ? settings[key].ar : settings[key].fr,
          fr: settings[key].fr,
          ar: settings[key].ar
        };
      });
      
      // Cache pour 15 minutes (données publiques statiques)
      this.cache.set(cacheKey, footerData, 900);
      console.log('📦 Footer data mis en cache');
      
      return footerData;
      
    } catch (error) {
      console.error('❌ Erreur génération footer data:', error);
      throw error;
    }
  }

  /**
   * 🔄 MISE À JOUR D'UN PARAMÈTRE
   */
  async updateSetting(key, valueFr, valueAr = null, category = 'general') {
    try {
      const db = require('../config/db_postgres');
      
      // Vérifier si le paramètre existe
      const existing = await db.query(
        'SELECT id FROM nursery_settings WHERE setting_key = $1',
        [key]
      );
      
      if (existing.rows.length > 0) {
        // Mettre à jour
        await db.query(
          `UPDATE nursery_settings 
           SET value_fr = $1, value_ar = $2, category = $3, updated_at = CURRENT_TIMESTAMP
           WHERE setting_key = $4`,
          [valueFr, valueAr || valueFr, category, key]
        );
      } else {
        // Créer nouveau
        await db.query(
          `INSERT INTO nursery_settings (setting_key, value_fr, value_ar, category, is_active) 
           VALUES ($1, $2, $3, $4, TRUE)`,
          [key, valueFr, valueAr || valueFr, category]
        );
      }
      
      // Invalider le cache
      this._invalidateCache();
      console.log(`✅ Paramètre ${key} mis à jour et cache invalidé`);
      
      return true;
      
    } catch (error) {
      console.error(`❌ Erreur mise à jour ${key}:`, error);
      throw error;
    }
  }

  /**
   * 🔄 MISE À JOUR MULTIPLE
   */
  async updateMultipleSettings(settingsMap) {
    try {
      const db = require('../config/db_postgres');
      
      // Transaction pour garantir la cohérence
      await db.query('BEGIN');
      
      for (const [key, data] of Object.entries(settingsMap)) {
        const { value_fr, value_ar, category = 'general' } = data;
        
        const existing = await db.query(
          'SELECT id FROM nursery_settings WHERE setting_key = $1',
          [key]
        );
        
        if (existing.rows.length > 0) {
          await db.query(
            `UPDATE nursery_settings 
             SET value_fr = $1, value_ar = $2, category = $3, updated_at = CURRENT_TIMESTAMP
             WHERE setting_key = $4`,
            [value_fr, value_ar || value_fr, category, key]
          );
        } else {
          await db.query(
            `INSERT INTO nursery_settings (setting_key, value_fr, value_ar, category, is_active) 
             VALUES ($1, $2, $3, $4, TRUE)`,
            [key, value_fr, value_ar || value_fr, category]
          );
        }
      }
      
      await db.query('COMMIT');
      
      // Invalider le cache
      this._invalidateCache();
      console.log(`✅ ${Object.keys(settingsMap).length} paramètres mis à jour`);
      
      return true;
      
    } catch (error) {
      await db.query('ROLLBACK');
      console.error('❌ Erreur mise à jour multiple:', error);
      throw error;
    }
  }

  /**
   * 🕒 FORMATAGE DES HEURES D'OUVERTURE
   */
  _formatOpeningHours(weekdaysHours, saturdayHours, saturdayOpen, language) {
    const isArabic = language === 'ar';
    
    let hours = [];
    
    if (isArabic) {
      hours.push(`الإثنين-الجمعة: ${weekdaysHours}`);
      if (saturdayOpen && saturdayHours) {
        hours.push(`السبت: ${saturdayHours}`);
      }
    } else {
      hours.push(`Lun-Ven: ${weekdaysHours}`);
      if (saturdayOpen && saturdayHours) {
        hours.push(`Sam: ${saturdayHours}`);
      }
    }
    
    return hours.join(' | ');
  }

  /**
   * 🗑️ INVALIDATION DU CACHE
   */
  _invalidateCache() {
    this.cache.flushAll();
    console.log('🗑️ Cache complètement invalidé');
  }

  /**
   * 📊 STATISTIQUES DU CACHE
   */
  getCacheStats() {
    const stats = this.cache.getStats();
    return {
      keys: this.cache.keys().length,
      hits: stats.hits,
      misses: stats.misses,
      hitRate: stats.hits / (stats.hits + stats.misses) || 0
    };
  }
}

// Export singleton
module.exports = new SettingsService();
