import React, { createContext, useContext, useState, useEffect } from 'react';
import { settingsService } from '../services/settingsService';

const SettingsContext = createContext();

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({
    // Paramètres par défaut
    nursery_name: 'Mima Elghalia',
    nursery_name_ar: 'ميما الغالية',
    nursery_logo: '/images/logo.png',
    director_name: 'Mme Fatima Ben Ali',
    nursery_address: '123 Rue de la Paix, 1000 Tunis, Tunisie',
    nursery_address_ar: '123 شارع السلام، 1000 تونس، تونس',
    nursery_phone: '+216 71 123 456',
    nursery_email: 'contact@mimaelghalia.tn',
    nursery_website: 'https://mimaelghalia.tn',
    total_capacity: 30,
    available_spots: 5,
    min_age_months: 3,
    max_age_months: 48,
    staff_count: 8,
    opening_year: 2019,
    map_address: '123 Rue de la Paix, 1000 Tunis, Tunisie',
    welcome_message_fr: 'Bienvenue à la crèche Mima Elghalia',
    welcome_message_ar: 'مرحباً بكم في حضانة ميما الغالية',
    about_description_fr: 'Notre crèche offre un environnement éducatif stimulant',
    about_description_ar: 'توفر حضانتنا بيئة تعليمية محفزة',
    site_theme: 'light',
    primary_color: '#3B82F6',
    secondary_color: '#8B5CF6',
    accent_color: '#F59E0B',
    opening_hours: {
      monday: { open: '07:00', close: '18:00', closed: false },
      tuesday: { open: '07:00', close: '18:00', closed: false },
      wednesday: { open: '07:00', close: '18:00', closed: false },
      thursday: { open: '07:00', close: '18:00', closed: false },
      friday: { open: '07:00', close: '18:00', closed: false },
      saturday: { open: '08:00', close: '12:00', closed: false },
      sunday: { open: '00:00', close: '00:00', closed: true }
    }
  });

  const [loading, setLoading] = useState(true);

  // Charger les paramètres au démarrage
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      console.log('🔄 Chargement des paramètres depuis l\'API...');
      
      // Charger depuis l'API backend
      const response = await settingsService.getPublicSettings();
      
      if (response.success) {
        console.log('✅ Paramètres chargés depuis l\'API:', Object.keys(response.data));
        setSettings(prev => ({
          ...prev,
          ...response.data
        }));
        
        // Sauvegarder en cache dans localStorage
        localStorage.setItem('creche_settings', JSON.stringify(response.data));
      } else {
        throw new Error(response.message || 'Erreur API');
      }
    } catch (error) {
      console.error('❌ Erreur lors du chargement depuis l\'API:', error);
      
      // Fallback: essayer de charger depuis localStorage
      try {
        const stored = localStorage.getItem('creche_settings');
        if (stored) {
          const parsedSettings = JSON.parse(stored);
          console.log('📦 Utilisation du cache localStorage:', Object.keys(parsedSettings));
          setSettings(prev => ({
            ...prev,
            ...parsedSettings
          }));
        } else {
          console.log('📝 Aucune donnée en cache, utilisation des valeurs par défaut');
        }
      } catch (cacheError) {
        console.error('❌ Erreur cache localStorage:', cacheError);
      }
    } finally {
      setLoading(false);
    }
  };

  // Obtenir une valeur de paramètre avec fallback
  const getSetting = (key, fallback = null) => {
    return settings[key] !== undefined ? settings[key] : fallback;
  };

  // Obtenir les informations de la crèche
  const getNurseryInfo = () => {
    return {
      name: getSetting('nursery_name', 'Mima Elghalia'),
      nameAr: getSetting('nursery_name_ar', 'ميما الغالية'),
      logo: getSetting('nursery_logo', '/images/logo.png'),
      director: getSetting('director_name', 'Mme Fatima Ben Ali'),
      address: getSetting('nursery_address', '123 Rue de la Paix, 1000 Tunis, Tunisie'),
      addressAr: getSetting('nursery_address_ar', '123 شارع السلام، 1000 تونس، تونس'),
      phone: getSetting('nursery_phone', '+216 71 123 456'),
      email: getSetting('nursery_email', 'contact@mimaelghalia.tn'),
      website: getSetting('nursery_website', 'https://mimaelghalia.tn')
    };
  };

  // Obtenir les statistiques
  const getStatistics = () => {
    const openingYear = getSetting('opening_year', 2019);
    const currentYear = new Date().getFullYear();
    const yearsOfExperience = currentYear - openingYear;

    return {
      totalCapacity: getSetting('total_capacity', 30),
      availableSpots: getSetting('available_spots', 5),
      staffCount: getSetting('staff_count', 8),
      openingYear: openingYear,
      yearsOfExperience: yearsOfExperience
    };
  };

  // Obtenir l'adresse pour la carte
  const getMapAddress = () => {
    return getSetting('map_address', getSetting('nursery_address', '123 Rue de la Paix, 1000 Tunis, Tunisie'));
  };

  // Formater les horaires d'ouverture
  const getFormattedOpeningHours = (isRTL = false) => {
    const hours = getSetting('opening_hours', {
      monday: { open: '07:00', close: '18:00', closed: false },
      tuesday: { open: '07:00', close: '18:00', closed: false },
      wednesday: { open: '07:00', close: '18:00', closed: false },
      thursday: { open: '07:00', close: '18:00', closed: false },
      friday: { open: '07:00', close: '18:00', closed: false },
      saturday: { open: '08:00', close: '12:00', closed: false },
      sunday: { open: '00:00', close: '00:00', closed: true }
    });

    if (isRTL) {
      return 'الإثنين - الجمعة: 7:00 - 18:00، السبت: 8:00 - 12:00';
    } else {
      return 'Lun - Ven: 7h00 - 18h00, Sam: 8h00 - 12h00';
    }
  };

  // Rafraîchir les paramètres
  const refreshSettings = async () => {
    await loadSettings();
  };

  // Mettre à jour un paramètre local
  const updateLocalSetting = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Mettre à jour plusieurs paramètres locaux
  const updateLocalSettings = (newSettings) => {
    setSettings(prev => ({
      ...prev,
      ...newSettings
    }));
  };

  // Sauvegarder les paramètres via l'API
  const saveSettings = async (settingsToSave) => {
    try {
      setLoading(true);
      console.log('💾 Sauvegarde des paramètres via API:', settingsToSave);
      
      // S'assurer qu'on a un token admin
      if (!localStorage.getItem('token')) {
        console.log('🔑 Aucun token trouvé, configuration du token admin...');
        await settingsService.loginAdmin();
      }
      
      // Préparer les données pour l'API (format attendu par le backend)
      const formattedSettings = {};
      Object.keys(settingsToSave).forEach(key => {
        const value = settingsToSave[key];
        let type = 'string';
        
        // Déterminer le type automatiquement
        if (typeof value === 'number') {
          type = 'number';
        } else if (typeof value === 'boolean') {
          type = 'boolean';
        } else if (typeof value === 'object' && value !== null) {
          type = 'json';
        } else if (key.includes('logo') || key.includes('image')) {
          type = 'image';
        }
        
        // Vérifier la taille des données avant envoi
        const valueStr = typeof value === 'object' ? JSON.stringify(value) : String(value);
        if (valueStr.length > 65000) {
          console.warn(`⚠️ Valeur trop longue pour ${key}: ${valueStr.length} caractères, ignorée`);
          return; // Ignorer ce champ
        }
        
        formattedSettings[key] = { value, type };
      });
      
      // Envoyer à l'API
      const response = await settingsService.updateMultiple(formattedSettings);
      
      if (response.success) {
        console.log('✅ Paramètres sauvegardés via API avec succès');
        
        // Mettre à jour le state local
        setSettings(prev => ({
          ...prev,
          ...settingsToSave
        }));
        
        // Mettre à jour le cache localStorage
        const newSettings = { ...settings, ...settingsToSave };
        localStorage.setItem('creche_settings', JSON.stringify(newSettings));
        
        return { success: true };
      } else {
        throw new Error(response.message || 'Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde via API:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const value = {
    settings,
    loading,
    getSetting,
    getNurseryInfo,
    getStatistics,
    getMapAddress,
    getFormattedOpeningHours,
    refreshSettings,
    updateLocalSetting,
    updateLocalSettings,
    saveSettings
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

export default SettingsContext;
