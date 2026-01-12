import { Link } from 'react-router-dom';
import { Home, ArrowLeft, Search, HelpCircle } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import { motion } from 'framer-motion';

const NotFoundPage = () => {
    const { isRTL } = useLanguage();

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-950 flex items-center justify-center p-4">
            <div className="max-w-2xl w-full text-center">
                {/* Animated 404 */}
                <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5, type: "spring" }}
                    className="relative"
                >
                    <h1 className="text-[150px] sm:text-[200px] font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400 leading-none select-none">
                        404
                    </h1>

                    {/* Floating elements */}
                    <motion.div
                        animate={{ y: [-10, 10, -10] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute top-1/4 left-1/4 w-8 h-8 bg-blue-500/20 rounded-full blur-sm"
                    />
                    <motion.div
                        animate={{ y: [10, -10, 10] }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute top-1/3 right-1/4 w-6 h-6 bg-purple-500/20 rounded-full blur-sm"
                    />
                    <motion.div
                        animate={{ y: [-5, 15, -5] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute bottom-1/4 left-1/3 w-10 h-10 bg-indigo-500/20 rounded-full blur-sm"
                    />
                </motion.div>

                {/* Message */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className="mt-4"
                >
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white mb-4">
                        {isRTL ? 'عذراً، الصفحة غير موجودة' : 'Oups ! Page introuvable'}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 text-lg mb-8 max-w-md mx-auto">
                        {isRTL
                            ? 'الصفحة التي تبحث عنها غير موجودة أو تم نقلها أو حذفها.'
                            : 'La page que vous recherchez n\'existe pas, a été déplacée ou supprimée.'}
                    </p>
                </motion.div>

                {/* Search suggestion */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className="flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400 mb-8"
                >
                    <Search className="w-5 h-5" />
                    <span className="text-sm">
                        {isRTL ? 'تحقق من عنوان URL أو جرب البحث' : 'Vérifiez l\'URL ou essayez de naviguer'}
                    </span>
                </motion.div>

                {/* Action buttons */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                    className="flex flex-col sm:flex-row items-center justify-center gap-4"
                >
                    <Link
                        to="/"
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300 transform hover:scale-105"
                    >
                        <Home className="w-5 h-5" />
                        {isRTL ? 'العودة للرئيسية' : 'Retour à l\'accueil'}
                    </Link>

                    <button
                        onClick={() => window.history.back()}
                        className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300"
                    >
                        <ArrowLeft className="w-5 h-5 rtl:rotate-180" />
                        {isRTL ? 'الصفحة السابقة' : 'Page précédente'}
                    </button>
                </motion.div>

                {/* Help link */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6, duration: 0.5 }}
                    className="mt-12"
                >
                    <Link
                        to="/contact"
                        className="inline-flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                        <HelpCircle className="w-4 h-4" />
                        <span className="text-sm">
                            {isRTL ? 'هل تحتاج مساعدة؟ تواصل معنا' : 'Besoin d\'aide ? Contactez-nous'}
                        </span>
                    </Link>
                </motion.div>
            </div>
        </div>
    );
};

export default NotFoundPage;
