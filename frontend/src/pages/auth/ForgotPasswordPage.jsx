import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../../hooks/useLanguage'
import { useTheme } from '../../hooks/useTheme'
import { Mail, ArrowLeft, Send, CheckCircle } from 'lucide-react'
import { motion } from 'framer-motion'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3003'

const ForgotPasswordPage = () => {
    const { isRTL } = useLanguage()
    const { isDark } = useTheme()

    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email })
            })

            const data = await response.json()

            if (data.success) {
                setSuccess(true)
            } else {
                setError(data.error || (isRTL ? 'حدث خطأ' : 'Une erreur est survenue'))
            }
        } catch (err) {
            console.error('Erreur forgot-password:', err)
            setError(isRTL ? 'خطأ في الاتصال بالخادم' : 'Erreur de connexion au serveur')
        } finally {
            setLoading(false)
        }
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
                            {isRTL ? 'تم إرسال البريد الإلكتروني!' : 'Email envoyé !'}
                        </h2>
                        <p className={`mb-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                            {isRTL
                                ? 'إذا كان هذا البريد الإلكتروني موجودًا في نظامنا، ستتلقى رابطًا لإعادة تعيين كلمة المرور.'
                                : 'Si cet email existe dans notre système, vous recevrez un lien pour réinitialiser votre mot de passe.'}
                        </p>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            {isRTL
                                ? 'تحقق من صندوق الوارد الخاص بك (ومجلد الرسائل غير المرغوب فيها).'
                                : 'Vérifiez votre boîte de réception (et vos spams).'}
                        </p>
                        <Link
                            to="/"
                            className="inline-flex items-center justify-center mt-8 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                        >
                            {isRTL ? 'العودة إلى تسجيل الدخول' : 'Retour à la connexion'}
                        </Link>
                    </motion.div>
                ) : (
                    // Form state
                    <>
                        <div className="text-center mb-8">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl mb-4 shadow-lg">
                                <Mail className="w-8 h-8 text-white" />
                            </div>
                            <h2 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {isRTL ? 'نسيت كلمة المرور؟' : 'Mot de passe oublié ?'}
                            </h2>
                            <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                                {isRTL
                                    ? 'أدخل بريدك الإلكتروني وسنرسل لك رابطًا لإعادة تعيين كلمة المرور.'
                                    : 'Entrez votre email et nous vous enverrons un lien pour réinitialiser votre mot de passe.'}
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                    {isRTL ? 'البريد الإلكتروني' : 'Email'}
                                </label>
                                <div className="relative">
                                    <div className={`absolute inset-y-0 ${isRTL ? 'right-0 pr-3' : 'left-0 pl-3'} flex items-center pointer-events-none`}>
                                        <Mail className="w-5 h-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className={`block w-full ${isRTL ? 'pr-10 pl-3' : 'pl-10 pr-3'} py-3 border rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all ${isDark
                                                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                                                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                                            }`}
                                        placeholder={isRTL ? 'أدخل بريدك الإلكتروني' : 'Votre email'}
                                    />
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
                                        <Send className={`w-5 h-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                                        {isRTL ? 'إرسال رابط إعادة التعيين' : 'Envoyer le lien'}
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="mt-6 text-center">
                            <Link
                                to="/"
                                className={`text-sm ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors`}
                            >
                                {isRTL ? 'تذكرت كلمة المرور؟ تسجيل الدخول' : 'Vous vous souvenez ? Se connecter'}
                            </Link>
                        </div>
                    </>
                )}
            </motion.div>
        </div>
    )
}

export default ForgotPasswordPage
