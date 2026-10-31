import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Check, Compass, Globe } from 'lucide-react';

const CHROME_STEPS = [
    {
        title: "1. Appuyez sur l'icône Partager 📤",
        desc: "Dans Google Chrome sur votre iPhone, appuyez sur l'icône de partage située directement à droite dans la barre d'adresse.",
        image: "/guide-pwa/iphone-chrome-step1.png?v=2",
        x: 79.7,
        y: 9.7,
        badge: "Partager"
    },
    {
        title: "2. Touchez 'En voir plus' ∨",
        desc: "Dans la rangée d'actions, appuyez sur le bouton rond 'En voir plus' pour faire apparaître toutes les options.",
        image: "/guide-pwa/safari-step3-sharesheet.png?v=4",
        x: 83.2,
        y: 86.3,
        badge: "En voir plus ∨"
    },
    {
        title: "3. Choisissez 'Sur l'écran d'accueil' ➕",
        desc: "Dans la liste d'actions, appuyez sur la ligne avec l'icône carrée '➕ Sur l'écran d'accueil'.",
        image: "/guide-pwa/iphone-step2-sharesheet.png?v=2",
        x: 35.0,
        y: 73.2,
        badge: "Sur l'écran d'accueil"
    },
    {
        title: "4. Confirmez en touchant 'Ajouter'",
        desc: "En haut à droite, touchez 'Ajouter'. L'icône de la crèche Mima Elghalia apparaît immédiatement sur votre écran d'accueil !",
        image: "/guide-pwa/iphone-step3-confirm.png?v=2",
        x: 84.4,
        y: 12.5,
        badge: "Ajouter"
    }
];

const SAFARI_STEPS = [
    {
        title: "1. Touchez le bouton des options en bas",
        desc: "Dans Safari, appuyez sur le bouton des options (trois petits points) à droite dans la barre d'adresse flottante en bas de l'écran.",
        image: "/guide-pwa/iphone-safari-step1.png?v=2",
        x: 85.2,
        y: 93.2,
        badge: "Options (...)"
    },
    {
        title: "2. Touchez 'Partager' 📤",
        desc: "Dans le menu Safari qui vient de s'ouvrir, appuyez sur la toute première ligne 'Partager' avec la flèche vers le haut.",
        image: "/guide-pwa/safari-step2-menu.png?v=2",
        x: 52.1,
        y: 61.2,
        badge: "Partager"
    },
    {
        title: "3. Touchez 'En voir plus' ∨",
        desc: "Dans la rangée d'actions, appuyez sur le bouton rond 'En voir plus' pour afficher la suite des options d'installation.",
        image: "/guide-pwa/safari-step3-sharesheet.png?v=4",
        x: 83.2,
        y: 86.3,
        badge: "En voir plus ∨"
    },
    {
        title: "4. Choisissez 'Sur l'écran d'accueil' ➕",
        desc: "Dans la liste d'actions, appuyez sur la ligne '➕ Sur l'écran d'accueil'.",
        image: "/guide-pwa/iphone-step2-sharesheet.png?v=2",
        x: 35.0,
        y: 73.2,
        badge: "Sur l'écran d'accueil"
    },
    {
        title: "5. Touchez 'Ajouter' en haut à droite",
        desc: "Validez en touchant 'Ajouter' en haut à droite. L'application Mima Elghalia est installée sur votre iPhone !",
        image: "/guide-pwa/iphone-step3-confirm.png?v=2",
        x: 84.4,
        y: 12.5,
        badge: "Ajouter"
    }
];

const IphoneInstallModal = ({ isOpen, onClose, defaultBrowser }) => {
    // Détection automatique du navigateur actif (plus besoin d'onglets manuels)
    const browser = (() => {
        if (defaultBrowser === 'chrome' || defaultBrowser === 'safari') return defaultBrowser;
        if (typeof window === 'undefined') return 'safari';
        const ua = window.navigator.userAgent || '';
        return /CriOS|Chrome/i.test(ua) ? 'chrome' : 'safari';
    })();

    const [currentStep, setCurrentStep] = useState(0);
    const scrollContainerRef = useRef(null);

    const steps = browser === 'chrome' ? CHROME_STEPS : SAFARI_STEPS;
    const totalSteps = steps.length;
    const step = steps[currentStep] || steps[0];

    useEffect(() => {
        if (isOpen) {
            setCurrentStep(0);
        }
    }, [isOpen]);

    const handleNext = () => {
        if (currentStep < totalSteps - 1) {
            setCurrentStep((prev) => prev + 1);
        } else {
            onClose();
        }
    };

    const handlePrev = () => {
        if (currentStep > 0) {
            setCurrentStep((prev) => prev - 1);
        }
    };

    // Auto-scroll pour cadrer la cible rouge dès qu'on change d'étape
    useEffect(() => {
        if (!isOpen || !scrollContainerRef.current) return;
        const container = scrollContainerRef.current;
        if (step.y > 60) {
            // Cible en bas (ex: barre Safari ou Sur l'écran d'accueil)
            container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
        } else if (step.y < 35) {
            // Cible en haut (ex: barre Chrome ou Ajouter)
            container.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            // Cible au milieu (ex: En voir plus)
            container.scrollTo({ top: container.scrollHeight * 0.35, behavior: 'smooth' });
        }
    }, [currentStep, browser, step.y, isOpen]);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md">
                    {/* Backdrop click to close */}
                    <div className="absolute inset-0" onClick={onClose} />

                    {/* Modal Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 40, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 40, scale: 0.96 }}
                        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[94vh] sm:h-auto sm:max-h-[92vh] z-10"
                    >
                        {/* Drag Handle on mobile sheet */}
                        <div className="sm:hidden w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mt-2 mb-1 shrink-0" />

                        {/* Stories Progress Bar */}
                        <div className="flex gap-1.5 px-4 pt-2 pb-1.5 shrink-0">
                            {steps.map((_, idx) => (
                                <div
                                    key={idx}
                                    className={`flex-1 h-1 rounded-full transition-colors duration-200 ${
                                        idx <= currentStep
                                            ? 'bg-indigo-600 dark:bg-indigo-400'
                                            : 'bg-gray-200 dark:bg-slate-700'
                                    }`}
                                />
                            ))}
                        </div>

                        {/* Modal Header avec indicateur automatique du navigateur */}
                        <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 dark:border-slate-800 shrink-0">
                            <div className="flex items-center gap-2">
                                <span className="text-xl">📲</span>
                                <div className="flex items-center gap-2">
                                    <h3 className="font-bold text-sm sm:text-base text-gray-900 dark:text-white">
                                        Installer sur iPhone
                                    </h3>
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400">
                                        {browser === 'chrome' ? (
                                            <>
                                                <Globe className="w-3 h-3 text-emerald-500" />
                                                <span>Chrome</span>
                                            </>
                                        ) : (
                                            <>
                                                <Compass className="w-3 h-3 text-blue-500" />
                                                <span>Safari</span>
                                            </>
                                        )}
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 flex items-center justify-center text-gray-500 transition-colors"
                                aria-label="Fermer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Zone Visuelle Smartphone avec la vraie capture */}
                        <div
                            ref={scrollContainerRef}
                            className="flex-1 min-h-0 bg-slate-950 p-3 sm:p-4 overflow-y-auto overscroll-contain flex flex-col items-center select-none"
                        >
                            {/* Cadre Téléphone - Agrandit à 285px pour une netteté et lisibilité parfaite */}
                            <div
                                className="relative w-[285px] sm:w-[310px] max-w-[90vw] aspect-[472/1024] rounded-[26px] overflow-hidden shadow-2xl bg-black border-2 border-slate-700/80 my-auto shrink-0"
                            >
                                <img
                                    src={step.image}
                                    alt={step.title}
                                    className="w-full h-full object-contain block pointer-events-none"
                                />

                                {/* Cercle rouge clignotant au pixel exact avec pointeur */}
                                <div
                                    className="absolute pointer-events-none"
                                    style={{
                                        left: `${step.x}%`,
                                        top: `${step.y}%`,
                                        transform: 'translate(-50%, -50%)',
                                    }}
                                >
                                    {/* Onde d'impulsion */}
                                    <div className="absolute inset-0 -m-3 rounded-full bg-red-500/35 animate-ping" />
                                    
                                    {/* Anneau lumineux rouge */}
                                    <div className="relative w-9 h-9 rounded-full border-[3px] border-red-500 bg-red-500/25 shadow-[0_0_18px_rgba(239,68,68,0.95)] flex items-center justify-center">
                                        <div className="w-2.5 h-2.5 rounded-full bg-white shadow-sm" />
                                    </div>

                                    {/* Badge indicatif 'Touchez ici' */}
                                    <div className={`absolute ${step.y > 60 ? '-top-8' : '-bottom-8'} left-1/2 -translate-x-1/2 whitespace-nowrap bg-red-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-xl flex items-center gap-1`}>
                                        <span>👆 {step.badge || 'Touchez ici'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Boîte Textuelle d'Instruction */}
                        <div className="p-3 sm:p-4 text-center bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800 shrink-0">
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 mb-1">
                                Étape {currentStep + 1} sur {totalSteps}
                            </span>
                            <h4 className="text-xs sm:text-sm font-extrabold text-gray-900 dark:text-white mb-0.5">
                                {step.title}
                            </h4>
                            <p className="text-[11px] sm:text-xs text-gray-600 dark:text-gray-300 max-w-sm mx-auto leading-relaxed">
                                {step.desc}
                            </p>
                        </div>

                        {/* Navigation Footer (Précédent / Suivant) */}
                        <div className="flex items-center justify-between p-2.5 px-4 bg-gray-50 dark:bg-slate-800/80 border-t border-gray-100 dark:border-slate-800 shrink-0">
                            <button
                                type="button"
                                onClick={handlePrev}
                                disabled={currentStep === 0}
                                className="flex items-center gap-1 px-3.5 py-1.5 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-300 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                            >
                                <ChevronLeft className="w-3.5 h-3.5" />
                                <span>Précédent</span>
                            </button>

                            <button
                                type="button"
                                onClick={handleNext}
                                className="flex items-center gap-1 px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/30 active:scale-95 transition-all"
                            >
                                {currentStep === totalSteps - 1 ? (
                                    <>
                                        <Check className="w-3.5 h-3.5" />
                                        <span>Compris !</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Suivant</span>
                                        <ChevronRight className="w-3.5 h-3.5" />
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default IphoneInstallModal;
