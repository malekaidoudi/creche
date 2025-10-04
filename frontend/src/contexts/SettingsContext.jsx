import { createContext, useContext, useState, useEffect } from 'react'
import { settingsService } from '../services/settingsService'

const SettingsContext = createContext()

export const useSettings = () => {
  const context = useContext(SettingsContext)
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
}

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await settingsService.getAllSettings()
      setSettings(response.data)
    } catch (err) {
      console.error('Erreur lors du chargement des paramètres:', err)
      setError(err)
      // Fallback avec des données par défaut
      setSettings(getDefaultSettings())
    } finally {
      setLoading(false)
    }
  }

  const getDefaultSettings = () => ({
    name: {
      fr: 'Mima Elghalia',
      ar: 'ميما الغالية'
    },
    description: {
      fr: 'Une crèche moderne offrant un environnement sûr et stimulant',
      ar: 'حضانة عصرية توفر بيئة آمنة ومحفزة'
    },
    address: {
      fr: '123 Avenue Habib Bourguiba, Tunis',
      ar: 'شارع الحبيب بورقيبة، تونس العاصمة'
    },
    phone: '+216 71 123 456',
    email: 'contact@mimaelghalia.tn',
    website: 'https://mimaelghalia.tn',
    director: {
      name: {
        fr: 'Mme. Fatima Ahmed',
        ar: 'السيدة فاطمة أحمد'
      },
      title: {
        fr: 'Directrice',
        ar: 'المديرة'
      }
    },
    capacity: 30,
    ageRange: {
      min: 2,
      max: 36
    },
    hours: {
      open: '07:00',
      close: '18:00',
      days: {
        fr: 'Lundi - Vendredi',
        ar: 'الإثنين - الجمعة'
      }
    },
    theme: {
      primaryColor: '#0ea5e9',
      secondaryColor: '#d946ef',
      logo: '/images/logo_creche.jpg',
      favicon: '/images/favicon.ico'
    },
    social: {
      facebook: 'https://facebook.com/mimaelghalia',
      instagram: 'https://instagram.com/mimaelghalia',
      linkedin: 'https://linkedin.com/company/mimaelghalia'
    },
    services: [],
    features: [],
    stats: []
  })

  const getLocalizedValue = (value, language = 'fr') => {
    if (typeof value === 'object' && value !== null) {
      return value[language] || value.fr || value.ar || ''
    }
    return value || ''
  }

  const refreshSettings = () => {
    loadSettings()
  }

  const value = {
    settings,
    loading,
    error,
    getLocalizedValue,
    refreshSettings
  }

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  )
}
