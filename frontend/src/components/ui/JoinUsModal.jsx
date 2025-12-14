/**
 * Modal de choix pour "Rejoignez-nous"
 * Permet de choisir entre:
 * - Mon enfant est déjà inscrit → /inscription?mode=parent
 * - Je souhaite inscrire mon enfant → /inscription?mode=new
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Baby, User, ArrowRight } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';

const JoinUsModal = ({ isOpen, onClose }) => {
    const { isRTL } = useLanguage();
    const navigate = useNavigate();

    const handleChoice = (mode) => {
        onClose();
        if (mode === 'parent') {
            // Enfant déjà inscrit → page inscription avec mode parent
            navigate('/inscription?mode=parent');
        } else {
            // Nouvelle inscription enfant
            navigate('/inscription?mode=new');
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
                {/* Overlay */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                    onClick={onClose}
                />

                {/* Modal - Full width on mobile, centered on desktop */}
                <motion.div
                    initial={{ opacity: 0, y: 100 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 100 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="relative bg-white dark:bg-gray-800 w-full sm:max-w-md sm:rounded-2xl rounded-t-3xl shadow-2xl z-10 max-h-[90vh] overflow-y-auto"
                >
                    {/* Handle bar for mobile */}
                    <div className="sm:hidden flex justify-center pt-3 pb-1">
                        <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full" />
                    </div>

                    <div className="p-5 sm:p-6">
                        {/* Bouton fermer - hidden on mobile, visible on desktop */}
                        <button
                            onClick={onClose}
                            className="hidden sm:block absolute top-4 right-4 rtl:right-auto rtl:left-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        {/* Titre */}
                        <div className="text-center mb-5 sm:mb-6">
                            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                                {isRTL ? 'انضم إلينا' : 'Rejoignez-nous'}
                            </h2>
                            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1.5 sm:mt-2">
                                {isRTL ? 'اختر الخيار المناسب لحالتك' : 'Choisissez l\'option qui correspond'}
                            </p>
                        </div>

                        {/* Options */}
                        <div className="space-y-3">
                            {/* Option 1: Enfant déjà inscrit */}
                            <button
                                onClick={() => handleChoice('parent')}
                                className="w-full p-3 sm:p-4 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 active:scale-[0.98] transition-all group"
                            >
                                <div className="flex items-center gap-3 sm:gap-4">
                                    <div className="p-2.5 sm:p-3 rounded-full bg-green-100 dark:bg-green-900/30 group-hover:bg-green-200 dark:group-hover:bg-green-800/40 transition-colors flex-shrink-0">
                                        <Baby className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400" />
                                    </div>
                                    <div className="flex-1 text-left rtl:text-right min-w-0">
                                        <h3 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base truncate">
                                            {isRTL ? 'طفلي مسجل بالفعل' : 'Mon enfant est déjà inscrit'}
                                        </h3>
                                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">
                                            {isRTL ? 'أريد إنشاء حسابي' : 'Je souhaite créer mon compte'}
                                        </p>
                                    </div>
                                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-hover:text-green-500 transition-colors flex-shrink-0" />
                                </div>
                            </button>

                            {/* Option 2: Nouvelle inscription */}
                            <button
                                onClick={() => handleChoice('new')}
                                className="w-full p-3 sm:p-4 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 active:scale-[0.98] transition-all group"
                            >
                                <div className="flex items-center gap-3 sm:gap-4">
                                    <div className="p-2.5 sm:p-3 rounded-full bg-blue-100 dark:bg-blue-900/30 group-hover:bg-blue-200 dark:group-hover:bg-blue-800/40 transition-colors flex-shrink-0">
                                        <User className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div className="flex-1 text-left rtl:text-right min-w-0">
                                        <h3 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base truncate">
                                            {isRTL ? 'أريد تسجيل طفلي' : 'Inscrire mon enfant'}
                                        </h3>
                                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">
                                            {isRTL ? 'تسجيل جديد في الحضانة' : 'Nouvelle inscription'}
                                        </p>
                                    </div>
                                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-hover:text-blue-500 transition-colors flex-shrink-0" />
                                </div>
                            </button>
                        </div>

                        {/* Footer */}
                        <div className="mt-5 sm:mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <p className="text-center text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                                {isRTL ? 'لديك حساب بالفعل؟' : 'Vous avez déjà un compte ?'}{' '}
                                <button
                                    onClick={() => { onClose(); navigate('/login'); }}
                                    className="text-primary-600 hover:underline font-medium"
                                >
                                    {isRTL ? 'تسجيل الدخول' : 'Se connecter'}
                                </button>
                            </p>
                        </div>

                        {/* Bouton annuler mobile */}
                        <button
                            onClick={onClose}
                            className="sm:hidden w-full mt-4 py-3 text-gray-600 dark:text-gray-400 font-medium text-sm"
                        >
                            {isRTL ? 'إلغاء' : 'Annuler'}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default JoinUsModal;
