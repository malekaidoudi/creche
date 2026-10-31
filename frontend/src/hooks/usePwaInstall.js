import { useState, useEffect, useCallback } from 'react';

const DISMISS_KEY = 'mima_pwa_dismissed_at';
const DISMISS_DURATION_DAYS = 7;

/**
 * usePwaInstall - Hook centralisé pour la gestion de l'installation PWA
 * 
 * - Détecte le mode standalone (si l'app est déjà installée sur l'écran d'accueil)
 * - Détecte l'OS (iOS vs Android vs Desktop) et le navigateur (Safari vs Chrome)
 * - Capture l'événement natif `beforeinstallprompt` pour l'installation 1-clic (Android & Desktop)
 * - Gère la fermeture temporaire de la bannière (7 jours)
 */
export const usePwaInstall = () => {
    // Vérification du mode standalone (déjà installé)
    const [isStandalone, setIsStandalone] = useState(() => {
        if (typeof window === 'undefined') return false;
        return (
            window.matchMedia('(display-mode: standalone)').matches ||
            window.navigator.standalone === true ||
            document.referrer.includes('android-app://')
        );
    });

    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [isDismissed, setIsDismissed] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);

    // Détection de l'appareil et du navigateur
    const [platform, setPlatform] = useState(() => {
        if (typeof window === 'undefined') {
            return { isIOS: false, isAndroid: false, isChrome: false, isSafari: false, isMobile: false };
        }

        const ua = window.navigator.userAgent || '';
        const isIOS = /iPad|iPhone|iPod/i.test(ua) && !window.MSStream;
        const isAndroid = /Android/i.test(ua);
        const isChrome = /CriOS|Chrome/i.test(ua) && !/Edge|Edg/i.test(ua);
        const isSafari = isIOS && /Safari/i.test(ua) && !/CriOS/i.test(ua);
        const isMobile = isIOS || isAndroid || window.innerWidth < 1024;

        return { isIOS, isAndroid, isChrome, isSafari, isMobile };
    });

    // Vérifier si l'utilisateur a fermé la bannière récemment (localStorage)
    useEffect(() => {
        try {
            const dismissedAt = localStorage.getItem(DISMISS_KEY);
            if (dismissedAt) {
                const elapsedDays = (Date.now() - parseInt(dismissedAt, 10)) / (1000 * 60 * 60 * 24);
                if (elapsedDays < DISMISS_DURATION_DAYS) {
                    setIsDismissed(true);
                } else {
                    localStorage.removeItem(DISMISS_KEY);
                }
            }
        } catch (e) {
            // Ignorer si localStorage est bloqué
        }
    }, []);

    // Écouter les changements de mode d'affichage et l'événement beforeinstallprompt
    useEffect(() => {
        if (typeof window === 'undefined') return;

        // Détection via mediaQuery en temps réel
        const mql = window.matchMedia('(display-mode: standalone)');
        const handleDisplayModeChange = (e) => {
            setIsStandalone(e.matches);
        };

        if (mql.addEventListener) {
            mql.addEventListener('change', handleDisplayModeChange);
        } else {
            mql.addListener(handleDisplayModeChange);
        }

        // Capture de beforeinstallprompt pour Chrome / Android / Desktop
        const handleBeforeInstallPrompt = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };

        // Détection quand l'app vient d'être installée
        const handleAppInstalled = () => {
            setIsInstalled(true);
            setIsStandalone(true);
            setDeferredPrompt(null);
            try {
                localStorage.removeItem(DISMISS_KEY);
            } catch (err) { }
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', handleAppInstalled);

        return () => {
            if (mql.removeEventListener) {
                mql.removeEventListener('change', handleDisplayModeChange);
            } else {
                mql.removeListener(handleDisplayModeChange);
            }
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    // Déclencher l'installation native 1-clic (Android & Desktop)
    const installPwa = useCallback(async () => {
        if (!deferredPrompt) {
            return false;
        }

        try {
            await deferredPrompt.prompt();
            const choiceResult = await deferredPrompt.userChoice;
            if (choiceResult.outcome === 'accepted') {
                setIsInstalled(true);
                setIsStandalone(true);
                setDeferredPrompt(null);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Erreur lors de l\'installation PWA:', error);
            return false;
        }
    }, [deferredPrompt]);

    // Fermer temporairement la bannière (7 jours)
    const dismissPrompt = useCallback(() => {
        setIsDismissed(true);
        try {
            localStorage.setItem(DISMISS_KEY, Date.now().toString());
        } catch (e) { }
    }, []);

    // Réinitialiser (pour tester ou réafficher manuellement)
    const resetDismiss = useCallback(() => {
        setIsDismissed(false);
        try {
            localStorage.removeItem(DISMISS_KEY);
        } catch (e) { }
    }, []);

    // Doit-on afficher la bannière d'installation sur mobile ?
    // Ne JAMAIS afficher si :
    // 1. Déjà en mode autonome / installée
    // 2. Déjà fermée par l'utilisateur
    // 3. Pas sur mobile
    const canPromptMobile = !isStandalone && !isDismissed && platform.isMobile;

    return {
        isStandalone,
        isInstalled,
        isDismissed,
        canPromptMobile,
        supportsNativeInstall: Boolean(deferredPrompt),
        isIOS: platform.isIOS,
        isAndroid: platform.isAndroid,
        isChrome: platform.isChrome,
        isSafari: platform.isSafari,
        isMobile: platform.isMobile,
        installPwa,
        dismissPrompt,
        resetDismiss
    };
};

export default usePwaInstall;
