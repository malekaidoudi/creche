import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Eye, EyeOff, LogIn, ArrowLeft } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useLanguage } from '../../hooks/useLanguage'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import DemoAccountsInfo from '../../components/demo/DemoAccountsInfo'
import LanguageToggle from '../../components/ui/LanguageToggle'
import { testDemoAccounts } from '../../utils/testAuth'

const LoginPage = () => {
  const { t } = useTranslation()
  const { login, loading } = useAuth()
  const { isRTL } = useLanguage()
  const navigate = useNavigate()
  const location = useLocation()
  const [showPassword, setShowPassword] = useState(false)
  const from = location.state?.from?.pathname || '/dashboard'

  // Test des comptes de démo au chargement
  useEffect(() => {
    if (import.meta.env.PROD) {
      testDemoAccounts()
    }
  }, [])

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    reset
  } = useForm()

  const onSubmit = async (data) => {
    try {
      await login(data)
      reset()
      navigate(from, { replace: true })
    } catch (error) {
      if (error.response?.data?.details) {
        // Erreurs de validation
        error.response.data.details.forEach((detail) => {
          setError(detail.param, {
            type: 'server',
            message: detail.msg
          })
        })
      }
    }
  }

  return (
    <div className={`min-h-screen flex ${isRTL ? 'font-arabic' : 'font-sans'}`}>
      {/* Côté gauche - Formulaire */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          {/* Header */}
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center mb-6">
              <div className="w-12 h-12 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">C</span>
              </div>
              <span className="ml-3 rtl:ml-0 rtl:mr-3 text-2xl font-bold text-gray-900">
                {isRTL ? 'حضانة' : 'Crèche'}
              </span>
            </Link>
            
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {t('auth.login')}
            </h2>
            <p className="text-gray-600">
              {isRTL 
                ? 'مرحباً بعودتك! يرجى تسجيل الدخول إلى حسابك'
                : 'Bon retour ! Veuillez vous connecter à votre compte'
              }
            </p>
          </div>

          {/* Comptes de démonstration */}
          {import.meta.env.PROD && (
            <DemoAccountsInfo 
              onFillForm={(email, password) => {
                setValue('email', email, { shouldValidate: true })
                setValue('password', password, { shouldValidate: true })
              }}
            />
          )}

          {/* Bouton de test direct (uniquement en production) */}
          {import.meta.env.PROD && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="font-medium text-yellow-800 mb-2">🧪 Test Direct</h4>
              <button
                type="button"
                onClick={async () => {
                  console.log('🚀 TEST DIRECT CONNEXION ADMIN')
                  try {
                    await login({ email: 'admin@mimaelghalia.tn', password: 'admin123' })
                    console.log('✅ Test réussi !')
                  } catch (error) {
                    console.error('❌ Test échoué:', error)
                  }
                }}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
              >
                Tester connexion admin directement
              </button>
            </div>
          )}

          {/* Formulaire */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Email */}
            <div className="form-group">
              <label htmlFor="email" className="form-label">
                {t('auth.email')}
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                className={`form-input ${errors.email ? 'border-error-500 focus:border-error-500 focus:ring-error-500' : ''}`}
                placeholder={isRTL ? 'أدخل بريدك الإلكتروني' : 'Entrez votre email'}
                {...register('email', {
                  required: t('auth.emailRequired'),
                  pattern: {
                    value: /^\S+@\S+$/i,
                    message: t('validation.email')
                  }
                })}
              />
              {errors.email && (
                <p className="form-error">{errors.email.message}</p>
              )}
            </div>

            {/* Mot de passe */}
            <div className="form-group">
              <label htmlFor="password" className="form-label">
                {t('auth.password')}
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className={`form-input pr-10 rtl:pr-3 rtl:pl-10 ${errors.password ? 'border-error-500 focus:border-error-500 focus:ring-error-500' : ''}`}
                  placeholder={isRTL ? 'أدخل كلمة المرور' : 'Entrez votre mot de passe'}
                  {...register('password', {
                    required: t('auth.passwordRequired'),
                    minLength: {
                      value: 6,
                      message: t('auth.passwordMinLength')
                    }
                  })}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 rtl:right-auto rtl:left-0 pr-3 rtl:pr-0 rtl:pl-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="form-error">{errors.password.message}</p>
              )}
            </div>

            {/* Options */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 rtl:ml-0 rtl:mr-2 block text-sm text-gray-900">
                  {isRTL ? 'تذكرني' : 'Se souvenir de moi'}
                </label>
              </div>

              <div className="text-sm">
                <Link
                  to="/forgot-password"
                  className="font-medium text-primary-600 hover:text-primary-500"
                >
                  {t('auth.forgotPassword')}
                </Link>
              </div>
            </div>

            {/* Bouton de connexion */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex justify-center items-center"
            >
              {loading ? (
                <LoadingSpinner size="sm" color="white" />
              ) : (
                <>
                  <LogIn className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  {t('auth.loginButton')}
                </>
              )}
            </button>
          </form>

          {/* Lien d'inscription */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              {t('auth.noAccount')}{' '}
              <Link
                to="/register"
                className="font-medium text-primary-600 hover:text-primary-500"
              >
                {t('auth.registerButton')}
              </Link>
            </p>
          </div>

          {/* Retour à l'accueil */}
          <div className="mt-8 text-center">
            <Link
              to="/"
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              ← {isRTL ? 'العودة إلى الرئيسية' : 'Retour à l\'accueil'}
            </Link>
          </div>
        </div>
      </div>

      {/* Côté droit - Image/Info */}
      <div className="hidden lg:block relative w-0 flex-1">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600 to-primary-800">
          <div className="absolute inset-0 bg-black opacity-20"></div>
          <img
            className="absolute inset-0 h-full w-full object-cover mix-blend-multiply"
            src="https://placehold.co/800x600/0ea5e9/ffffff?text=Crèche+Login"
            alt="Crèche"
          />
          <div className="absolute inset-0 flex flex-col justify-center items-center text-white p-12">
            <div className="text-center space-y-6">
              <h3 className="text-3xl font-bold">
                {isRTL ? 'مرحباً بعودتك' : 'Bon retour parmi nous'}
              </h3>
              <p className="text-xl opacity-90">
                {isRTL 
                  ? 'نحن سعداء لرؤيتك مرة أخرى'
                  : 'Nous sommes heureux de vous revoir'
                }
              </p>
              <div className="flex justify-center space-x-4 rtl:space-x-reverse">
                <div className="w-2 h-2 bg-white rounded-full opacity-50"></div>
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <div className="w-2 h-2 bg-white rounded-full opacity-50"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toggle de langue */}
      <div className="absolute top-4 right-4 rtl:right-auto rtl:left-4">
        <LanguageToggle />
      </div>
    </div>
  )
}

export default LoginPage
