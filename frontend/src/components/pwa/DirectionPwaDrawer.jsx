import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    Laptop,
    Smartphone,
    HelpCircle,
    Zap,
    ExternalLink,
    Check,
    Download,
    BookOpen,
    CheckCircle2
} from 'lucide-react';
import usePwaInstall from '../../hooks/usePwaInstall';
import IphoneInstallModal from './IphoneInstallModal';
import { useLanguage } from '../../hooks/useLanguage';

const DirectionPwaDrawer = ({ isOpen, onClose }) => {
    const { isRTL } = useLanguage();
    const {
        isStandalone,
        supportsNativeInstall,
        installPwa
    } = usePwaInstall();

    const [showIphoneModal, setShowIphoneModal] = useState(false);
    const [desktopInstallSuccess, setDesktopInstallSuccess] = useState(false);

    const handleDesktopInstall = async () => {
        const success = await installPwa();
        if (success) {
            setDesktopInstallSuccess(true);
            setTimeout(() => {
                setDesktopInstallSuccess(false);
            }, 4000);
        }
    };

    return (
        <>
            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-[9990] flex justify-end">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={onClose}
                        />

                        {/* Drawer Panel */}
                        <motion.aside
                            initial={{ x: isRTL ? '-100%' : '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: isRTL ? '-100%' : '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 280 }}
                            className="relative w-full max-w-md bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col z-10 border-l border-gray-100 dark:border-slate-800"
                        >
                            {/* Drawer Header */}
                            <div className="p-5 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between bg-indigo-50/50 dark:bg-slate-800/50">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-md shadow-indigo-600/30">
                                        💡
                                    </div>
                                    <div>
                                        <h3 className="font-extrabold text-base text-gray-900 dark:text-white">
                                            {isRTL ? 'دليل ونصائح الإدارة' : 'Guide & Astuces Direction'}
                                        </h3>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {isRTL ? 'إدارة سريعة ومساعدة الأولياء' : 'Productivité & Support aux parents'}
                                        </p>
                                    </div>
                                </div>

                                <button
                                    onClick={onClose}
                                    className="w-9 h-9 rounded-xl bg-white dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center justify-center text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-slate-700 transition-colors"
                                    aria-label="Fermer"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Drawer Body */}
                            <div className="flex-1 overflow-y-auto p-5 space-y-5">
                                {/* 1. INSTALLER SUR PC / MAC */}
                                <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50/50 dark:from-slate-800/80 dark:to-slate-800/40 border border-indigo-100 dark:border-indigo-900/40">
                                    <div className="flex items-center gap-2.5 mb-2">
                                        <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                                            <Laptop className="w-4 h-4" />
                                        </div>
                                        <h4 className="font-bold text-sm text-gray-900 dark:text-white">
                                            {isRTL ? 'تثبيت على هذا الحاسوب (PC / Mac)' : 'Installer sur cet ordinateur (PC / Mac)'}
                                        </h4>
                                    </div>
                                    <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed mb-3">
                                        {isRTL
                                            ? 'استخدم ميما الغالية كتطبيق مستقل بدون شريط المتصفح، مع إمكانية الوصول من شريط المهام.'
                                            : 'Lancez Mima Elghalia depuis votre bureau ou barre des tâches comme un vrai logiciel de gestion, sans onglets de navigateur distrayants.'}
                                    </p>

                                    {isStandalone ? (
                                        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs bg-emerald-50 dark:bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800">
                                            <Check className="w-4 h-4" />
                                            <span>
                                                {isRTL
                                                    ? 'التطبيق مثبت بالفعل على هذا الجهاز'
                                                    : 'Application déjà installée sur cet ordinateur !'}
                                            </span>
                                        </div>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={handleDesktopInstall}
                                            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-indigo-600/25 transition-all"
                                        >
                                            <Download className="w-4 h-4" />
                                            <span>
                                                {isRTL
                                                    ? 'تثبيت البرنامج بنقرة واحدة ⚡'
                                                    : 'Installer sur cet ordinateur en 1 clic ⚡'}
                                            </span>
                                        </button>
                                    )}

                                    {desktopInstallSuccess && (
                                        <div className="mt-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center gap-1.5 animate-fadeIn">
                                            <CheckCircle2 className="w-4 h-4" />
                                            <span>Installation réussie !</span>
                                        </div>
                                    )}
                                </div>

                                {/* 2. GUIDER UN PARENT & TABLETTES DE SECTION */}
                                <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 shadow-sm">
                                    <div className="flex items-center gap-2.5 mb-2">
                                        <div className="w-8 h-8 rounded-lg bg-pink-600 text-white flex items-center justify-center">
                                            <Smartphone className="w-4 h-4" />
                                        </div>
                                        <h4 className="font-bold text-sm text-gray-900 dark:text-white">
                                            {isRTL ? 'مساعدة الأولياء والأجهزة اللوحية' : 'Guider un parent ou équiper une tablette'}
                                        </h4>
                                    </div>
                                    <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed mb-3">
                                        {isRTL
                                            ? 'أظهر للأولياء الدليل المصور خطوة بخطوة لتثبيت التطبيق على هواتفهم، أو ثبته على لوحات الأقسام.'
                                            : 'Un parent vous demande de l\'aide à l\'accueil ? Ouvrez le guide visuel étape par étape pour lui montrer comment installer l\'application sur son iPhone ou Android en 10 secondes.'}
                                    </p>

                                    <button
                                        type="button"
                                        onClick={() => setShowIphoneModal(true)}
                                        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-900 dark:text-white font-bold text-xs rounded-xl transition-colors"
                                    >
                                        <span>📱</span>
                                        <span>{isRTL ? 'عرض الدليل المصور للأولياء' : 'Ouvrir le guide visuel (iPhone / Android)'}</span>
                                    </button>
                                </div>

                                {/* 3. CENTRE D'AIDE & FONCTIONNALITÉS */}
                                <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 shadow-sm">
                                    <div className="flex items-center gap-2.5 mb-2">
                                        <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                                            <BookOpen className="w-4 h-4" />
                                        </div>
                                        <h4 className="font-bold text-sm text-gray-900 dark:text-white">
                                            {isRTL ? 'مركز المساعدة والوثائق' : 'Centre d\'aide & Prise en main'}
                                        </h4>
                                    </div>
                                    <ul className="text-xs text-gray-600 dark:text-gray-300 space-y-2 mb-3">
                                        <li className="flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                            <span><b>Pointage groupé :</b> Enregistrez les arrivées de section en un clic.</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                            <span><b>Transmissions du soir :</b> Utilisez les modèles prédéfinis de repas/siestes.</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                            <span><b>Contacts d'urgence :</b> Accès immédiat aux numéros des parents et médecins.</span>
                                        </li>
                                    </ul>
                                </div>

                                {/* 4. ASTUCE PRODUCTIVITÉ */}
                                <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
                                    <Zap className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-bold">Astuce de pointage :</p>
                                        <p className="mt-0.5 opacity-90 leading-relaxed">
                                            Les raccourcis sur tablette permettent de valider les sorties en direct quand les parents arrivent le soir.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </motion.aside>
                    </div>
                )}
            </AnimatePresence>

            {/* Modal Guide pour la Direction */}
            <IphoneInstallModal
                isOpen={showIphoneModal}
                onClose={() => setShowIphoneModal(false)}
            />
        </>
    );
};

export default DirectionPwaDrawer;
