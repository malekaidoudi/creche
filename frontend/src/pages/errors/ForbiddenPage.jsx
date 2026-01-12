import { Link } from 'react-router-dom';
import { Home, ArrowLeft, ShieldX, Lock, LogIn } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import { useAuth } from '../../hooks/useAuth';
import { motion } from 'framer-motion';

const ForbiddenPage = () => {
    const { isRTL } = useLanguage();
    const { isAuthenticated, user } = useAuth();

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-orange-50 to-red-100 dark:from-gray-900 dark:via-gray-800 dark:to-red-950 flex items-center justify-center p-4">
            <div className="max-w-2xl w-full text-center">
                {/* Animated 403 with Shield */}
                <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5, type: "spring" }}
                    className="relative"
                >
                    {/* Shield icon */}
                    <motion.div
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                        className="absolute -top-8 left-1/2 transform -translate-x-1/2"
                    >
                        <div className="relative">
                            <ShieldX className="w-20 h-20 text-red-500 dark:text-red-400" />
                            <motion.div
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="absolute inset-0 bg-red-500/20 rounded-full blur-xl"
                            />
                        </div>
                    </motion.div>

                    <h1 className="text-[150px] sm:text-[200px] font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 dark:from-orange-400 dark:via-red-400 dark:to-pink-400 leading-none select-none mt-12">
                        403
                    </h1>

                    {/* Floating lock icons */}
                    <motion.div
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute top-1/3 left-1/6 text-red-400/30"
                    >
                        <Lock className="w-8 h-8" />
                    </motion.div>
                    <motion.div
                        animate={{ rotate: [0, -10, 10, 0] }}
                        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute top-1/2 right-1/6 text-orange-400/30"
                    >
                        <Lock className="w-6 h-6" />
                    </motion.div>
                </motion.div>

                {/* Message */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className="mt-4"
                >
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white mb-4">
                        {isRTL ? 'الوصول مرفوض' : 'Accès refusé'}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 text-lg mb-4 max-w-md mx-auto">
                        {isRTL
                            ? 'ليس لديك الصلاحيات اللازمة للوصول إلى هذه الصفحة.'
                            : 'Vous n\'avez pas les permissions nécessaires pour accéder à cette page.'}
                    </p>

                    {/* User info if authenticated */}
                    {isAuthenticated && user && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-full text-sm text-gray-600 dark:text-gray-400 mb-6"
                        >
                            <span>{isRTL ? 'متصل كـ:' : 'Connecté en tant que:'}</span>
                            <span className="font-semibold text-gray-800 dark:text-white">{user.first_name} {user.last_name}</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${user.role === 'admin' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' :
                                    user.role === 'staff' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' :
                                        user.role === 'developer' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300' :
                                            'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                                }`}>
                                {user.role}
                            </span>
                        </motion.div>
                    )}
                </motion.div>

                {/* Explanation */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 mb-8 max-w-md mx-auto border border-gray-200 dark:border-gray-700"
                >
                    <h3 className="font-semibold text-gray-800 dark:text-white mb-3">
                        {isRTL ? 'أسباب محتملة:' : 'Raisons possibles :'}
                    </h3>
                    <ul className="text-left rtl:text-right text-sm text-gray-600 dark:text-gray-400 space-y-2">
                        <li className="flex items-start gap-2">
                            <span className="text-red-500 mt-1">•</span>
                            {isRTL ? 'هذه الصفحة مخصصة لمستخدمين آخرين' : 'Cette page est réservée à d\'autres utilisateurs'}
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-red-500 mt-1">•</span>
                            {isRTL ? 'جلستك قد انتهت' : 'Votre session a peut-être expiré'}
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-red-500 mt-1">•</span>
                            {isRTL ? 'تحتاج إلى صلاحيات إضافية' : 'Vous avez besoin de permissions supplémentaires'}
                        </li>
                    </ul>
                </motion.div>

                {/* Action buttons */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                    className="flex flex-col sm:flex-row items-center justify-center gap-4"
                >
                    {isAuthenticated ? (
                        <>
                            <Link
                                to="/dashboard"
                                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-semibold rounded-xl shadow-lg shadow-red-500/25 hover:shadow-red-500/40 transition-all duration-300 transform hover:scale-105"
                            >
                                <Home className="w-5 h-5" />
                                {isRTL ? 'العودة للوحة التحكم' : 'Retour au dashboard'}
                            </Link>

                            <button
                                onClick={() => window.history.back()}
                                className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-red-500 dark:hover:border-red-500 hover:text-red-600 dark:hover:text-red-400 transition-all duration-300"
                            >
                                <ArrowLeft className="w-5 h-5 rtl:rotate-180" />
                                {isRTL ? 'الصفحة السابقة' : 'Page précédente'}
                            </button>
                        </>
                    ) : (
                        <>
                            <Link
                                to="/login"
                                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-semibold rounded-xl shadow-lg shadow-red-500/25 hover:shadow-red-500/40 transition-all duration-300 transform hover:scale-105"
                            >
                                <LogIn className="w-5 h-5" />
                                {isRTL ? 'تسجيل الدخول' : 'Se connecter'}
                            </Link>

                            <Link
                                to="/"
                                className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-red-500 dark:hover:border-red-500 hover:text-red-600 dark:hover:text-red-400 transition-all duration-300"
                            >
                                <Home className="w-5 h-5" />
                                {isRTL ? 'العودة للرئيسية' : 'Retour à l\'accueil'}
                            </Link>
                        </>
                    )}
                </motion.div>
            </div>
        </div>
    );
};

export default ForbiddenPage;
