import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Smartphone, X, CheckCircle2 } from 'lucide-react';
import usePwaInstall from '../../hooks/usePwaInstall';
import IphoneInstallModal from './IphoneInstallModal';
import { useLanguage } from '../../hooks/useLanguage';

const PwaMobileBar = ({ bottomOffsetClass = 'bottom-16' }) => {
    const { isRTL } = useLanguage();
    const {
        canPromptMobile,
        isIOS,
        isChrome,
        installPwa,
        dismissPrompt,
        supportsNativeInstall
    } = usePwaInstall();

    const [showIphoneModal, setShowIphoneModal] = useState(false);
    const [installSuccess, setInstallSuccess] = useState(false);

    // Synchronisation de la visibilité de la bannière pour adapter les boutons flottants (ex: Centre d'aide)
    React.useEffect(() => {
        if (canPromptMobile) {
            document.body.classList.add('has-pwa-bar');
            window.dispatchEvent(new CustomEvent('pwa-bar-change', { detail: { visible: true } }));
        } else {
            document.body.classList.remove('has-pwa-bar');
            window.dispatchEvent(new CustomEvent('pwa-bar-change', { detail: { visible: false } }));
        }
        return () => {
            document.body.classList.remove('has-pwa-bar');
            window.dispatchEvent(new CustomEvent('pwa-bar-change', { detail: { visible: false } }));
        };
    }, [canPromptMobile]);

    // Ne rien afficher si l'app est déjà en standalone, si c'est desktop, ou si l'utilisateur a fermé
    if (!canPromptMobile) {
        return null;
    }

    const handleActionClick = async () => {
        if (isIOS) {
            setShowIphoneModal(true);
        } else {
            // Android ou navigateur supportant beforeinstallprompt
            const installed = await installPwa();
            if (installed) {
                setInstallSuccess(true);
                setTimeout(() => {
                    dismissPrompt();
                }, 3000);
            } else {
                // Fallback si prompt indisponible : ouvrir le guide
                setShowIphoneModal(true);
            }
        }
    };

    return (
        <>
            <AnimatePresence>
                <motion.div
                    initial={{ y: 80, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 80, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className={`fixed ${bottomOffsetClass} left-0 right-0 z-40 px-3 pb-2 pt-1 pointer-events-none lg:hidden`}
                >
                    <div className="max-w-md mx-auto pointer-events-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-indigo-100 dark:border-indigo-900/40 rounded-2xl p-2.5 sm:p-3 shadow-xl shadow-indigo-950/15 flex items-center justify-between gap-2.5">
                        {/* Icône & Textes */}
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white shrink-0 shadow-md shadow-indigo-500/25">
                                {isIOS ? (
                                    <Smartphone className="w-5 h-5" />
                                ) : (
                                    <Download className="w-5 h-5" />
                                )}
                            </div>

                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                    <h4 className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white truncate">
                                        {isRTL ? 'تطبيق ميما الغالية' : 'Mima Elghalia'}
                                    </h4>
                                    <span className="hidden xs:inline-flex px-1.5 py-0.2 text-[10px] font-extrabold uppercase rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                                        PWA
                                    </span>
                                </div>
                                <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                                    {isIOS
                                        ? (isRTL ? 'أضف إلى شاشتك الرئيسية' : 'Sur votre écran d\'accueil')
                                        : (isRTL ? 'تثبيت سريع بنقرة واحدة' : 'Accès rapide sur téléphone')}
                                </p>
                            </div>
                        </div>

                        {/* Actions : Bouton Principal & Fermer */}
                        <div className="flex items-center gap-1.5 shrink-0">
                            <button
                                type="button"
                                onClick={handleActionClick}
                                className="flex items-center justify-center gap-1 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-indigo-600/30 whitespace-nowrap shrink-0 transition-all"
                            >
                                {isIOS ? (
                                    <span>{isRTL ? 'تثبيت' : 'Installer'}</span>
                                ) : (
                                    <span>{isRTL ? 'تثبيت ⚡' : 'Installer ⚡'}</span>
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={dismissPrompt}
                                className="w-8 h-8 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800 flex items-center justify-center shrink-0 transition-colors"
                                aria-label="Fermer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Modal Guide pour iPhone */}
            <IphoneInstallModal
                isOpen={showIphoneModal}
                onClose={() => setShowIphoneModal(false)}
                defaultBrowser={isChrome ? 'chrome' : 'safari'}
            />

            {/* Notification de succès pour Android */}
            <AnimatePresence>
                {installSuccess && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        className="fixed bottom-20 left-4 right-4 z-50 max-w-sm mx-auto bg-emerald-600 text-white rounded-2xl p-3 shadow-2xl flex items-center gap-3 text-xs sm:text-sm font-bold"
                    >
                        <CheckCircle2 className="w-5 h-5 shrink-0" />
                        <span>
                            {isRTL
                                ? 'تم تثبيت التطبيق بنجاح على شاشتك الرئيسية !'
                                : 'Application installée avec succès sur votre écran d\'accueil !'}
                        </span>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default PwaMobileBar;
