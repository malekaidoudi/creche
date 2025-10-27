import { createContext, useContext, useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

const LanguageContext = createContext()

const LANGUAGES = {
  fr: {
    code: 'fr',
    name: 'Français',
    nativeName: 'Français',
    direction: 'ltr',
    flag: '🇫🇷'
  },
  ar: {
    code: 'ar',
    name: 'Arabic',
    nativeName: 'العربية',
    direction: 'rtl',
    flag: '🇲🇦'
  }
}

export function LanguageProvider({ children }) {
  const { i18n } = useTranslation()
  const [currentLanguage, setCurrentLanguage] = useState(() => {
    return localStorage.getItem('language') || 'fr'
  })

  // Changer la langue
  const changeLanguage = async (languageCode) => {
    if (LANGUAGES[languageCode]) {
      try {
        await i18n.changeLanguage(languageCode)
        setCurrentLanguage(languageCode)
        localStorage.setItem('language', languageCode)
        // Mettre à jour le titre de la page si nécessaire
        if (languageCode === 'ar') {
          document.title = 'نظام إدارة الحضانة'
        } else {
          document.title = 'Système de Gestion de Crèche'
        }
      } catch (error) {
        console.error('Erreur lors du changement de langue:', error)
      }
    }
  }

  // Initialiser la langue au chargement
  useEffect(() => {
    const initLanguage = async () => {
      try {
        await i18n.changeLanguage(currentLanguage)
        document.documentElement.lang = currentLanguage
        document.documentElement.dir = LANGUAGES[currentLanguage].direction
      } catch (error) {
        console.error('Erreur lors de l\'initialisation de la langue:', error)
      }
    }

    initLanguage()
  }, [i18n, currentLanguage])

  // Obtenir les informations de la langue courante
  const getCurrentLanguageInfo = () => {
    const langCode = typeof currentLanguage === 'string' ? currentLanguage : 'fr'
    return LANGUAGES[langCode] || LANGUAGES.fr
  }

  // Vérifier si c'est une langue RTL
  const isRTL = () => {
    return getCurrentLanguageInfo().direction === 'rtl'
  }

  // Obtenir la direction du texte
  const getDirection = () => {
    return getCurrentLanguageInfo().direction
  }

  // Obtenir toutes les langues disponibles
  const getAvailableLanguages = () => {
    return Object.values(LANGUAGES)
  }

  // Basculer entre les langues
  const toggleLanguage = () => {
    const currentCode = typeof currentLanguage === 'string' ? currentLanguage : 'fr'
    const newLanguage = currentCode === 'fr' ? 'ar' : 'fr'
    changeLanguage(newLanguage)
  }

  // Formater un texte selon la langue (pour les nombres, dates, etc.)
  const formatText = (text, options = {}) => {
    if (!text) return ''
    
    // Pour l'arabe, on peut ajouter des transformations spécifiques
    if (currentLanguage === 'ar') {
      // Convertir les chiffres en chiffres arabes si demandé
      if (options.arabicNumerals) {
        const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩']
        return text.replace(/\d/g, (digit) => arabicNumerals[parseInt(digit)])
      }
    }
    
    return text
  }

  // Obtenir le texte dans la langue courante depuis un objet multilingue
  const getLocalizedText = (textObject, fallback = '') => {
    if (!textObject) return fallback
    
    if (typeof textObject === 'string') return textObject
    
    // Essayer d'obtenir le texte dans la langue courante
    const currentText = textObject[`${currentLanguage === 'fr' ? 'fr' : 'ar'}`]
    
    if (currentText) return currentText
    
    // Fallback vers l'autre langue
    const fallbackText = textObject[`${currentLanguage === 'fr' ? 'ar' : 'fr'}`]
    
    return fallbackText || fallback
  }

  // Obtenir les classes CSS pour la direction
  const getDirectionClasses = () => {
    const direction = getDirection()
    return {
      'text-right': direction === 'rtl',
      'text-left': direction === 'ltr',
    }
  }

  const value = {
    // État
    currentLanguage,
    language: currentLanguage,
    direction: getDirection(),
    isRTL: isRTL(),
    languageInfo: getCurrentLanguageInfo(),
    
    // Actions
    changeLanguage,
    toggleLanguage,
    
    // Utilitaires
    getAvailableLanguages,
    formatText,
    getLocalizedText,
    getDirectionClasses,
    
    // Constantes
    LANGUAGES,
  }

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  
  return context
}
