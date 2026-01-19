import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useLanguage } from '../../hooks/useLanguage'
import { useTheme } from '../../hooks/useTheme'
import { useAuth } from '../../hooks/useAuth'
import { Lock, Eye, EyeOff, ArrowLeft, CheckCircle, AlertCircle, KeyRound } from 'lucide-react'
import { motion } from 'framer-motion'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3003/api'

const ResetPasswordPage = () => {
    const { token } = useParams()
    const navigate = useNavigate()
    const { isRTL } = useLanguage()
    const { isDark } = useTheme()
    const { setAuthData } = useAuth()

    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [verifying, setVerifying] = useState(true)
    const [tokenValid, setTokenValid] = useState(false)
    const [userInfo, setUserInfo] = useState(null)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState('')

    // Vérifier le token au chargement
    useEffect(() => {
        const verifyToken = async () => {
            try {
                const response = await fetch(`${API_BASE}/auth/verify-reset-token/${token}`)
                const data = await response.json()

                if (data.valid) {
                    setTokenValid(true)
                    setUserInfo(data)
                } else {
                    setError(data.error || (isRTL ? 'رابط غير صالح' : 'Lien invalide'))
                }
            } catch (err) {
                console.error('Erreur vérification token:', err)
                setError(isRTL ? 'خطأ في التحقق من الرابط' : 'Erreur de vérification du lien')
            } finally {
                setVerifying(false)
            }
        }

        if (token) {
            verifyToken()
        } else {
            setVerifying(false)
            setError(isRTL ? 'رابط غير صالح' : 'Lien invalide')
        }
    }, [token, isRTL])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')

        // Validation
        if (password.length < 6) {
            setError(isRTL ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' : 'Le mot de passe doit contenir au moins 6 caractères')
            return
        }

        if (password !== confirmPassword) {
            setError(isRTL ? 'كلمات المرور غير متطابقة' : 'Les mots de passe ne correspondent pas')
            return
        }

        setLoading(true)

        try {
            const response = await fetch(`${API_BASE}/auth/reset-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ token, password })
            })

            const data = await response.json()

            if (data.success) {
                setSuccess(true)

                // Connexion automatique après 2 secondes
                setTimeout(() => {
                    if (data.token && data.user) {
                        setAuthData(data.token, data.user)

                        // Redirection selon le rôle
                        if (data.user.role === 'admin' || data.user.role === 'staff' || data.user.role === 'developer') {
                            navigate('/dashboard', { replace: true })
                        } else if (data.user.role === 'parent') {
                            navigate('/mon-espace', { replace: true })
                        } else {
                            navigate('/', { replace: true })
                        }
                    } else {
                        navigate('/', { replace: true })
                    }
                }, 2000)
            } else {
                setError(data.error || (isRTL ? 'حدث خطأ' : 'Une erreur est survenue'))
            }
        } catch (err) {
            console.error('Erreur reset-password:', err)
            setError(isRTL ? 'خطأ في الاتصال بالخادم' : 'Erreur de connexion au serveur')
        } finally {
            setLoading(false)
        }
    }

    // Loading state
    if (verifying) {
        return (
            <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50'}`}>
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className={isDark ? 'text-gray-300' : 'text-gray-600'}>
                        {isRTL ? 'جاري التحقق...' : 'Vérification en cours...'}
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className={`min-h-screen flex items-center justify-center p-4 ${isDark ? 'bg-gray-900' : 'bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50'}`}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className={`w-full max-w-md ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-xl p-8`}
            >
                {/* Back link */}
                <Link
                    to="/"
                    className={`inline-flex items-center text-sm ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} mb-6 transition-colors`}
                >
                    <ArrowLeft className={`w-4 h-4 ${isRTL ? 'ml-2 rotate-180' : 'mr-2'}`} />
                    {isRTL ? 'العودة إلى الصفحة الرئيسية' : 'Retour à l\'accueil'}
                </Link>

                {success ? (
                    // Success state
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center"
                    >
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full mb-6">
                            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                        </div>
                        <h2 className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {isRTL ? 'تم تغيير كلمة المرور!' : 'Mot de passe modifié !'}
                        </h2>
                        <p className={`mb-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                            {isRTL
                                ? 'تم تحديث كلمة المرور بنجاح. جاري تسجيل الدخول...'
                                : 'Votre mot de passe a été mis à jour avec succès. Connexion en cours...'}
                        </p>
                        <div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto" />
                    </motion.div>
                ) : !tokenValid ? (
                    // Invalid token state
                    <div className="text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full mb-6">
                            <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
                        </div>
                        <h2 className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {isRTL ? 'رابط غير صالح' : 'Lien invalide'}
                        </h2>
                        <p className={`mb-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                            {error || (isRTL
                                ? 'هذا الرابط غير صالح أو منتهي الصلاحية.'
                                : 'Ce lien est invalide ou a expiré.')}
                        </p>
                        <Link
                            to="/forgot-password"
                            className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                        >
                            {isRTL ? 'طلب رابط جديد' : 'Demander un nouveau lien'}
                        </Link>
                    </div>
                ) : (
                    // Form state
                    <>
                        <div className="text-center mb-8">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl mb-4 shadow-lg">
                                <KeyRound className="w-8 h-8 text-white" />
                            </div>
                            <h2 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {isRTL ? 'إعادة تعيين كلمة المرور' : 'Nouveau mot de passe'}
                            </h2>
                            {userInfo?.first_name && (
                                <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                                    {isRTL ? `مرحباً ${userInfo.first_name}` : `Bonjour ${userInfo.first_name}`}
                                </p>
                            )}
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* New Password */}
                            <div>
                                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                    {isRTL ? 'كلمة المرور الجديدة' : 'Nouveau mot de passe'}
                                </label>
                                <div className="relative">
                                    <div className={`absolute inset-y-0 ${isRTL ? 'right-0 pr-3' : 'left-0 pl-3'} flex items-center pointer-events-none`}>
                                        <Lock className="w-5 h-5 text-gray-400" />
                                    </div>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        minLength={6}
                                        className={`block w-full ${isRTL ? 'pr-10 pl-12' : 'pl-10 pr-12'} py-3 border rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all ${isDark
                                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                                            }`}
                                        placeholder={isRTL ? 'أدخل كلمة المرور الجديدة' : 'Votre nouveau mot de passe'}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className={`absolute inset-y-0 ${isRTL ? 'left-0 pl-3' : 'right-0 pr-3'} flex items-center`}
                                    >
                                        {showPassword ? (
                                            <EyeOff className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                                        ) : (
                                            <Eye className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                                        )}
                                    </button>
                                </div>
                                <p className={`mt-1 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                    {isRTL ? 'الحد الأدنى 6 أحرف' : 'Minimum 6 caractères'}
                                </p>
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                    {isRTL ? 'تأكيد كلمة المرور' : 'Confirmer le mot de passe'}
                                </label>
                                <div className="relative">
                                    <div className={`absolute inset-y-0 ${isRTL ? 'right-0 pr-3' : 'left-0 pl-3'} flex items-center pointer-events-none`}>
                                        <Lock className="w-5 h-5 text-gray-400" />
                                    </div>
                                    <input
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        className={`block w-full ${isRTL ? 'pr-10 pl-12' : 'pl-10 pr-12'} py-3 border rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all ${isDark
                                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                                            }`}
                                        placeholder={isRTL ? 'أعد إدخال كلمة المرور' : 'Confirmez le mot de passe'}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className={`absolute inset-y-0 ${isRTL ? 'left-0 pl-3' : 'right-0 pr-3'} flex items-center`}
                                    >
                                        {showConfirmPassword ? (
                                            <EyeOff className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                                        ) : (
                                            <Eye className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            {error && (
                                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm">
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3 px-6 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                            >
                                {loading ? (
                                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <KeyRound className={`w-5 h-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                                        {isRTL ? 'تحديث كلمة المرور' : 'Mettre à jour le mot de passe'}
                                    </>
                                )}
                            </button>
                        </form>
                    </>
                )}
            </motion.div>
        </div>
    )
}

export default ResetPasswordPage
