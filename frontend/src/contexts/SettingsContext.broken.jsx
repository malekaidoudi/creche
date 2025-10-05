import React, { createContext, useContext, useState, useEffect } from 'react';
import { settingsService } from '../services/staticSettingsService';

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
    nursery_logo: '/images/logo.png',
    director_name: 'Mme Fatima Ben Ali',
    nursery_address: '123 Rue de la Paix, 1000 Tunis, Tunisie',
    nursery_phone: '+216 71 123 456',
    nursery_email: 'contact@mimaelghalia.tn',
    nursery_website: 'https://mimaelghalia.tn',
    total_capacity: 30,
    available_spots: 5,
    min_age_months: 3,
    max_age_months: 48,
    welcome_message_fr: 'Bienvenue à la crèche Mima Elghalia',
    welcome_message_ar: 'مرحباً بكم في حضانة ميما الغالية',
    site_theme: 'light',
    primary_color: '#3B82F6',
    secondary_color: '#8B5CF6',
    accent_color: '#F59E0B'
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Charger les paramètres publics au démarrage
  useEffect(() => {
    loadPublicSettings();
  }, []);

  const loadPublicSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await settingsService.getPublicSettings();
      
      if (response.success) {
        setSettings(prev => ({
          ...prev,
          ...response.data
        }));
      }
    } catch (error) {
      console.error('Erreur lors du chargement des paramètres:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Appliquer le thème CSS
  useEffect(() => {
    const applyTheme = () => {
      const root = document.documentElement;
      const theme = settings.site_theme;
      
      // Appliquer le thème
      if (theme === 'dark') {
        root.classList.add('dark');
      } else if (theme === 'light') {
        root.classList.remove('dark');
      } else if (theme === 'auto') {
        // Détecter la préférence système
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDark) {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
      }
      
      // Appliquer les couleurs personnalisées
      if (settings.primary_color) {
        root.style.setProperty('--color-primary', settings.primary_color);
        // Convertir hex en RGB pour les classes Tailwind avec opacité
        const hexToRgb = (hex) => {
          const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
          return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
          } : null;
        };
        
        const primaryRgb = hexToRgb(settings.primary_color);
        if (primaryRgb) {
          root.style.setProperty('--color-primary-rgb', `${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}`);
        }
      }
      if (settings.secondary_color) {
        root.style.setProperty('--color-secondary', settings.secondary_color);
        const hexToRgb = (hex) => {
          const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
          return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
          } : null;
        };
        
        const secondaryRgb = hexToRgb(settings.secondary_color);
        if (secondaryRgb) {
          root.style.setProperty('--color-secondary-rgb', `${secondaryRgb.r}, ${secondaryRgb.g}, ${secondaryRgb.b}`);
        }
      }
      if (settings.accent_color) {
        root.style.setProperty('--color-accent', settings.accent_color);
        const hexToRgb = (hex) => {
          const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
          return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
          } : null;
        };
        
        const accentRgb = hexToRgb(settings.accent_color);
        if (accentRgb) {
          root.style.setProperty('--color-accent-rgb', `${accentRgb.r}, ${accentRgb.g}, ${accentRgb.b}`);
        }
      }
    };

    applyTheme();
  }, [settings.site_theme, settings.primary_color, settings.secondary_color, settings.accent_color]);
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
  // Obtenir les informations de capacité
  const getCapacityInfo = () => {
    return {
      total: getSetting('total_capacity', 30),
      available: getSetting('available_spots', 5),
      minAge: getSetting('min_age_months', 3),
      maxAge: getSetting('max_age_months', 48)
    };
  };

  // Obtenir les messages de bienvenue
  const getWelcomeMessages = () => {
    return {
      fr: getSetting('welcome_message_fr', 'Bienvenue à la crèche Mima Elghalia'),
      ar: getSetting('welcome_message_ar', 'مرحباً بكم في حضانة ميما الغالية')
    };
  };

  // Obtenir les informations de thème
  const getThemeInfo = () => {
    return {
      theme: getSetting('site_theme', 'light'),
      primaryColor: getSetting('primary_color', '#3B82F6'),
      secondaryColor: getSetting('secondary_color', '#8B5CF6'),
      accentColor: getSetting('accent_color', '#F59E0B')
    };
  };

  // Obtenir les horaires d'ouverture
  const getOpeningHours = () => {
    const hours = getSetting('opening_hours', {});
    return typeof hours === 'string' ? JSON.parse(hours) : hours;
  };

  // Obtenir les statistiques pour la page d'accueil
  const getStatistics = () => {
    const openingYear = getSetting('opening_year', 2019);
    const currentYear = new Date().getFullYear();
    const yearsOfExperience = currentYear - openingYear;
    
    return {
      totalCapacity: getSetting('total_capacity', 30),
      availableSpots: getSetting('available_spots', 5),
      staffCount: getSetting('staff_count', 8),
      openingYear: openingYear,
      yearsOfExperience: yearsOfExperience,
      experienceText: yearsOfExperience > 5 ? `+${yearsOfExperience} ans d'expérience` : `Ouvert depuis ${openingYear}`
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
      // Format arabe
      const weekdays = [];
      const weekend = [];
      
      // Jours de semaine (Lun-Ven)
      if (!hours.monday?.closed && !hours.friday?.closed && 
          hours.monday?.open === hours.friday?.open && 
          hours.monday?.close === hours.friday?.close) {
        weekdays.push(`الإثنين - الجمعة: ${hours.monday.open} - ${hours.monday.close}`);
      }
      
      // Samedi
      if (!hours.saturday?.closed) {
        weekend.push(`السبت: ${hours.saturday.open} - ${hours.saturday.close}`);
      }
      
      return [...weekdays, ...weekend].join('، ');
    } else {
      // Format français
      const weekdays = [];
      const weekend = [];
      
      // Jours de semaine (Lun-Ven)
      if (!hours.monday?.closed && !hours.friday?.closed && 
          hours.monday?.open === hours.friday?.open && 
          hours.monday?.close === hours.friday?.close) {
        weekdays.push(`Lun - Ven: ${hours.monday.open.replace(':', 'h')} - ${hours.monday.close.replace(':', 'h')}`);
      }
      
      // Samedi
      if (!hours.saturday?.closed) {
        weekend.push(`Sam: ${hours.saturday.open.replace(':', 'h')} - ${hours.saturday.close.replace(':', 'h')}`);
      }
      
      return [...weekdays, ...weekend].join(', ');
    }
  };

  // Mettre à jour un paramètre localement
  const updateLocalSetting = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Mettre à jour plusieurs paramètres localement
  const updateLocalSettings = (newSettings) => {
    setSettings(prev => ({
      ...prev,
      ...newSettings
    }));
  };

  const value = {
    settings,
    loading,
    getSetting,
    getNurseryInfo,
    getCapacityInfo,
    getStatistics,
    getMapAddress,
    getFormattedOpeningHours,
    refreshSettings,
    updateLocalSetting,
    updateLocalSettings
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};
