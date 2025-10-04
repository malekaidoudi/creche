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
      }
      if (settings.secondary_color) {
        root.style.setProperty('--color-secondary', settings.secondary_color);
      }
      if (settings.accent_color) {
        root.style.setProperty('--color-accent', settings.accent_color);
      }
    };

    applyTheme();
  }, [settings.site_theme, settings.primary_color, settings.secondary_color, settings.accent_color]);

  // Obtenir une valeur de paramètre avec fallback
  const getSetting = (key, fallback = null) => {
    return settings[key] !== undefined ? settings[key] : fallback;
  };

  // Obtenir les informations de base de la crèche
  const getNurseryInfo = () => {
    return {
      name: getSetting('nursery_name', 'Mima Elghalia'),
      logo: getSetting('nursery_logo', '/images/logo.png'),
      director: getSetting('director_name', 'Mme Fatima Ben Ali'),
      address: getSetting('nursery_address', '123 Rue de la Paix, 1000 Tunis'),
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

  // Rafraîchir les paramètres
  const refreshSettings = () => {
    loadPublicSettings();
  };

  // Mettre à jour un paramètre localement (pour l'admin)
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
    error,
    getSetting,
    getNurseryInfo,
    getCapacityInfo,
    getWelcomeMessages,
    getThemeInfo,
    getOpeningHours,
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
