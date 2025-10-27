import { Globe } from 'lucide-react'
import { useLanguage } from '../../hooks/useLanguage'

const LanguageToggle = ({ className = '' }) => {
  const { currentLanguage, toggleLanguage, getAvailableLanguages } = useLanguage()
  const languages = getAvailableLanguages()

  return (
    <button
      onClick={toggleLanguage}
      className={`flex items-center space-x-2 rtl:space-x-reverse px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary-600 transition-colors duration-200 ${className}`}
      title="Changer de langue / تغيير اللغة"
    >
      <Globe className="w-4 h-4" />
      <span className="uppercase font-semibold">
        {currentLanguage?.toUpperCase() || 'FR'}
      </span>
    </button>
  )
}

export default LanguageToggle
