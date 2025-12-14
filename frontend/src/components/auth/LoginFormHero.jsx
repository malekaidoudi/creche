import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useLanguage } from '../../hooks/useLanguage'
import { useDialogContext } from '../../contexts/DialogContext'
import { Mail, Lock, Eye, EyeOff, LogIn, UserPlus, AlertCircle } from 'lucide-react'
import JoinUsModal from '../ui/JoinUsModal'

const LoginFormHero = () => {
  const { login } = useAuth()
  const { isRTL } = useLanguage()
  const dialog = useDialogContext()
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showJoinModal, setShowJoinModal] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('') // Réinitialiser l'erreur
    setLoading(true)

    try {
      // Connexion
      const response = await login(formData.email, formData.password)

      // Succès - arrêter le loading
      setLoading(false)

      // Redirection selon le rôle
      const userRole = response?.user?.role

      if (userRole === 'admin' || userRole === 'staff') {
        navigate('/dashboard', { replace: true })
      } else if (userRole === 'parent') {
        navigate('/mon-espace', { replace: true })
      } else {
        // Visiteur ou autre rôle → Accueil
        navigate('/', { replace: true })
      }

    } catch (err) {
      // Arrêter le loading
      setLoading(false)

      // Définir le message d'erreur
      let errorMessage = ''

      if (err.response?.status === 401) {
        errorMessage = isRTL ? 'بريد إلكتروني أو كلمة مرور خاطئة' : 'Email ou mot de passe incorrect'
      } else if (err.response?.status === 500) {
        errorMessage = isRTL ? 'خطأ في الخادم' : 'Erreur serveur'
      } else if (err.code === 'ERR_NETWORK') {
        errorMessage = isRTL ? 'لا يوجد اتصال بالخادم' : 'Impossible de se connecter au serveur'
      } else {
        errorMessage = err.response?.data?.message || err.message || (isRTL ? 'خطأ في تسجيل الدخول' : 'Erreur de connexion')
      }

      // Afficher l'erreur
      if (errorMessage) {
        dialog.error(errorMessage)
      }
    } finally {
      // Réinitialiser les champs
      setFormData({
        email: '',
        password: ''
      })
    }
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <div className="w-full h-full bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 flex flex-col justify-center">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl mb-4 shadow-lg">
          <LogIn className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {isRTL ? 'تسجيل الدخول' : 'Connexion'}
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          {isRTL ? 'مرحباً بعودتك!' : 'Bon retour parmi nous !'}
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {isRTL ? 'البريد الإلكتروني' : 'Email'}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 rtl:left-auto rtl:right-0 pl-3 rtl:pl-0 rtl:pr-3 flex items-center pointer-events-none">
              <Mail className="w-5 h-5 text-gray-400" />
            </div>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="block w-full pl-10 rtl:pl-3 rtl:pr-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 transition-all"
              placeholder={isRTL ? 'أدخل بريدك الإلكتروني' : 'Votre email'}
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {isRTL ? 'كلمة المرور' : 'Mot de passe'}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 rtl:left-auto rtl:right-0 pl-3 rtl:pl-0 rtl:pr-3 flex items-center pointer-events-none">
              <Lock className="w-5 h-5 text-gray-400" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="block w-full pl-10 rtl:pl-3 rtl:pr-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 transition-all"
              placeholder={isRTL ? 'أدخل كلمة المرور' : 'Votre mot de passe'}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 rtl:right-auto rtl:left-0 pr-3 rtl:pr-0 rtl:pl-3 flex items-center"
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
              ) : (
                <Eye className="w-5 h-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
              )}
            </button>
          </div>
        </div>

        {/* Message d'erreur */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 px-3 py-2 rounded-xl flex items-start">
            <AlertCircle className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2 flex-shrink-0 mt-0.5" />
            <span className="text-xs sm:text-sm font-medium leading-tight break-words">{error}</span>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white py-3 px-6 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {loading ? (
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <LogIn className={`w-5 h-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
              {isRTL ? 'تسجيل الدخول' : 'Se connecter'}
            </>
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
            {isRTL ? 'أو' : 'ou'}
          </span>
        </div>
      </div>

      {/* Sign up link - ouvre le modal */}
      <button
        type="button"
        onClick={() => setShowJoinModal(true)}
        className="w-full bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-2 border-gray-300 dark:border-gray-600 py-3 px-6 rounded-xl font-semibold text-base sm:text-lg shadow-md hover:shadow-lg transform hover:scale-[1.02] transition-all duration-300 flex items-center justify-center whitespace-nowrap"
      >
        <UserPlus className={`w-5 h-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
        {isRTL ? 'انضم إلينا' : 'Rejoignez-nous'}
      </button>

      {/* Modal de choix */}
      <JoinUsModal isOpen={showJoinModal} onClose={() => setShowJoinModal(false)} />

      {/* Footer */}
      <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
        {isRTL ? 'بالتسجيل، أنت توافق على' : 'En vous connectant, vous acceptez nos'}{' '}
        <Link to="/terms" className="text-blue-600 hover:underline">
          {isRTL ? 'الشروط والأحكام' : 'conditions d\'utilisation'}
        </Link>
      </p>
    </div>
  )
}

export default LoginFormHero
