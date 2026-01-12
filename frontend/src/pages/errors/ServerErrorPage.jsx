import { Link } from 'react-router-dom';
import { Home, RefreshCw, AlertTriangle, Server, Wrench } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import { motion } from 'framer-motion';

const ServerErrorPage = () => {
    const { isRTL } = useLanguage();

    const handleRefresh = () => {
        window.location.reload();
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-pink-100 dark:from-gray-900 dark:via-gray-800 dark:to-purple-950 flex items-center justify-center p-4">
            <div className="max-w-2xl w-full text-center">
                <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5, type: "spring" }}
                    className="relative"
                >
                    <motion.div
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                        className="absolute -top-8 left-1/2 transform -translate-x-1/2"
                    >
                        <div className="relative">
                            <Server className="w-20 h-20 text-purple-500 dark:text-purple-400" />
                            <motion.div
                                animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.2, 0.5] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="absolute inset-0 bg-purple-500/30 rounded-full blur-xl"
                            />
                            <motion.div
                                animate={{ scale: [1, 1.1, 1] }}
                                transition={{ duration: 1, repeat: Infinity }}
                                className="absolute -top-2 -right-2 bg-yellow-500 rounded-full p-1"
                            >
                                <AlertTriangle className="w-4 h-4 text-white" />
                            </motion.div>
                        </div>
                    </motion.div>

                    <h1 className="text-[150px] sm:text-[200px] font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 dark:from-purple-400 dark:via-pink-400 dark:to-red-400 leading-none select-none mt-12">
                        500
                    </h1>

                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                        className="absolute top-1/3 left-1/6 text-purple-400/20"
                    >
                        <Wrench className="w-10 h-10" />
                    </motion.div>
                    <motion.div
                        animate={{ rotate: -360 }}
                        transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                        className="absolute top-1/2 right-1/6 text-pink-400/20"
                    >
                        <Wrench className="w-8 h-8" />
                    </motion.div>
                </motion.div>

                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className="mt-4"
                >
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white mb-4">
                        {isRTL ? 'خطأ في الخادم' : 'Erreur serveur'}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 text-lg mb-8 max-w-md mx-auto">
                        {isRTL
                            ? 'حدث خطأ غير متوقع. فريقنا التقني يعمل على حل المشكلة.'
                            : 'Une erreur inattendue s\'est produite. Notre équipe technique travaille à résoudre le problème.'}
                    </p>
                </motion.div>

                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 mb-8 max-w-md mx-auto border border-gray-200 dark:border-gray-700"
                >
                    <h3 className="font-semibold text-gray-800 dark:text-white mb-3">
                        {isRTL ? 'ما يمكنك فعله:' : 'Ce que vous pouvez faire :'}
                    </h3>
                    <ul className="text-left rtl:text-right text-sm text-gray-600 dark:text-gray-400 space-y-2">
                        <li className="flex items-start gap-2">
                            <span className="text-purple-500 mt-1">•</span>
                            {isRTL ? 'حاول تحديث الصفحة' : 'Essayez de rafraîchir la page'}
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-purple-500 mt-1">•</span>
                            {isRTL ? 'انتظر بضع دقائق ثم حاول مرة أخرى' : 'Attendez quelques minutes et réessayez'}
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-purple-500 mt-1">•</span>
                            {isRTL ? 'تواصل معنا إذا استمرت المشكلة' : 'Contactez-nous si le problème persiste'}
                        </li>
                    </ul>
                </motion.div>

                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                    className="flex flex-col sm:flex-row items-center justify-center gap-4"
                >
                    <button
                        onClick={handleRefresh}
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-300 transform hover:scale-105"
                    >
                        <RefreshCw className="w-5 h-5" />
                        {isRTL ? 'تحديث الصفحة' : 'Rafraîchir la page'}
                    </button>

                    <Link
                        to="/"
                        className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-purple-500 dark:hover:border-purple-500 hover:text-purple-600 dark:hover:text-purple-400 transition-all duration-300"
                    >
                        <Home className="w-5 h-5" />
                        {isRTL ? 'العودة للرئيسية' : 'Retour à l\'accueil'}
                    </Link>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6, duration: 0.5 }}
                    className="mt-12 text-sm text-gray-500 dark:text-gray-400"
                >
                    <p>
                        {isRTL ? 'رمز الخطأ: 500 - خطأ داخلي في الخادم' : 'Code erreur : 500 - Internal Server Error'}
                    </p>
                </motion.div>
            </div>
        </div>
    );
};

export default ServerErrorPage;
