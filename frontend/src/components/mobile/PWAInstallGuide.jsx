/**
 * PWAInstallGuide - Guide d'installation de l'application (PWA)
 *
 * Explique pas à pas comment ajouter l'app à l'écran d'accueil (iOS/Android/
 * Desktop) et comment activer les notifications une fois installée.
 * Affiché comme un second "onglet" du widget Nouveautés (MobileParentSpace).
 */

import { useEffect, useState } from 'react';
import { Share2, PlusSquare, MoreVertical, Download, Smartphone, CheckCircle2, MonitorSmartphone } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import PushNotificationCard from '../notifications/PushNotificationCard';

const isIos = () => /iphone|ipad|ipod/i.test(window.navigator.userAgent);
const isAndroid = () => /android/i.test(window.navigator.userAgent);
const isStandalone = () =>
    window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;

// Sur iOS, seule Safari peut installer une PWA (cf. usePushNotifications.js)
const isIosNonSafariBrowser = () => isIos() && /crios|fxios|edgios|opios|mercury/i.test(window.navigator.userAgent);

const StepNumber = ({ n }) => (
    <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-semibold text-[11px] flex-shrink-0">
        {n}
    </span>
);

const PWAInstallGuide = () => {
    const { isRTL } = useLanguage();
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [installed, setInstalled] = useState(isStandalone());

    useEffect(() => {
        const handleBeforeInstallPrompt = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };
        const handleAppInstalled = () => {
            setInstalled(true);
            setDeferredPrompt(null);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', handleAppInstalled);
        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') setInstalled(true);
        setDeferredPrompt(null);
    };

    if (installed) {
        return (
            <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                    <p className="text-sm text-emerald-800 dark:text-emerald-300 font-medium">
                        {isRTL ? 'التطبيق مثبت بالفعل على جهازك 🎉' : "L'application est déjà installée sur votre appareil 🎉"}
                    </p>
                </div>

                {/* Activation des notifications, toujours utile même app déjà installée */}
                <div>
                    <p className="font-medium text-gray-900 dark:text-white text-sm mb-2 flex items-center gap-1.5">
                        <Smartphone className="w-4 h-4" />
                        {isRTL ? 'فعّل الإشعارات' : 'Activez les notifications'}
                    </p>
                    <PushNotificationCard />
                </div>
            </div>
        );
    }

    const ios = isIos();
    const iosNonSafari = isIosNonSafariBrowser();
    const android = isAndroid();

    return (
        <div className="space-y-4">
            {/* Intro */}
            <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <MonitorSmartphone className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">
                        {isRTL ? 'ثبّت التطبيق على هاتفك' : "Installez l'application sur votre téléphone"}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 leading-relaxed">
                        {isRTL
                            ? 'استمتع بتجربة أسرع وأيقونة على شاشتك الرئيسية، وفعّل الإشعارات الفورية.'
                            : "Profitez d'un accès plus rapide, d'une icône sur votre écran d'accueil et des notifications en temps réel."}
                    </p>
                </div>
            </div>

            {/* Bouton d'installation natif (Android/Chrome avec prompt disponible) */}
            {deferredPrompt && (
                <button
                    onClick={handleInstallClick}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
                >
                    <Download className="w-5 h-5" />
                    {isRTL ? 'تثبيت التطبيق الآن' : "Installer l'application maintenant"}
                </button>
            )}

            {/* Instructions iOS */}
            {ios && (
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 space-y-3">
                    <p className="font-medium text-gray-900 dark:text-white text-sm">
                        {isRTL ? '📱 على iPhone / iPad' : '📱 Sur iPhone / iPad'}
                    </p>
                    {iosNonSafari ? (
                        <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                            {isRTL
                                ? 'يجب فتح هذا الموقع في متصفح Safari أولاً (التثبيت غير ممكن من متصفحات أخرى على iOS).'
                                : "Ouvrez d'abord ce site dans le navigateur Safari (l'installation n'est possible depuis aucun autre navigateur sur iOS)."}
                        </p>
                    ) : (
                        <ol className="space-y-2.5 text-xs text-gray-600 dark:text-gray-400">
                            <li className="flex items-center gap-2.5">
                                <StepNumber n={1} />
                                <span className="flex items-center gap-1.5">
                                    {isRTL ? 'اضغط على زر المشاركة' : 'Touchez le bouton Partager'}
                                    <Share2 className="w-3.5 h-3.5" />
                                </span>
                            </li>
                            <li className="flex items-center gap-2.5">
                                <StepNumber n={2} />
                                <span className="flex items-center gap-1.5">
                                    {isRTL ? 'اختر "إضافة إلى الشاشة الرئيسية"' : "Sélectionnez \"Sur l'écran d'accueil\""}
                                    <PlusSquare className="w-3.5 h-3.5" />
                                </span>
                            </li>
                            <li className="flex items-center gap-2.5">
                                <StepNumber n={3} />
                                <span>
                                    {isRTL
                                        ? 'اضغط "إضافة" ثم افتح التطبيق من الشاشة الرئيسية'
                                        : 'Appuyez sur "Ajouter", puis ouvrez l\'app depuis l\'écran d\'accueil'}
                                </span>
                            </li>
                        </ol>
                    )}
                </div>
            )}

            {/* Instructions Android (fallback si pas de prompt natif) */}
            {android && !deferredPrompt && (
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 space-y-3">
                    <p className="font-medium text-gray-900 dark:text-white text-sm">
                        {isRTL ? '🤖 على Android' : '🤖 Sur Android'}
                    </p>
                    <ol className="space-y-2.5 text-xs text-gray-600 dark:text-gray-400">
                        <li className="flex items-center gap-2.5">
                            <StepNumber n={1} />
                            <span className="flex items-center gap-1.5">
                                {isRTL ? 'اضغط على قائمة المتصفح' : 'Touchez le menu du navigateur'}
                                <MoreVertical className="w-3.5 h-3.5" />
                            </span>
                        </li>
                        <li className="flex items-center gap-2.5">
                            <StepNumber n={2} />
                            <span>
                                {isRTL
                                    ? 'اختر "تثبيت التطبيق" أو "إضافة إلى الشاشة الرئيسية"'
                                    : 'Sélectionnez "Installer l\'application" ou "Ajouter à l\'écran d\'accueil"'}
                            </span>
                        </li>
                        <li className="flex items-center gap-2.5">
                            <StepNumber n={3} />
                            <span>{isRTL ? 'أكّد التثبيت' : "Confirmez l'installation"}</span>
                        </li>
                    </ol>
                </div>
            )}

            {/* Desktop (ni iOS ni Android) */}
            {!ios && !android && (
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 space-y-2">
                    <p className="font-medium text-gray-900 dark:text-white text-sm">
                        {isRTL ? '💻 على الكمبيوتر' : '💻 Sur ordinateur'}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                        {isRTL
                            ? 'انقر على أيقونة التثبيت ⤓ في شريط عنوان المتصفح (Chrome/Edge)، ثم اختر "تثبيت".'
                            : "Cliquez sur l'icône d'installation ⤓ dans la barre d'adresse (Chrome/Edge), puis choisissez \"Installer\"."}
                    </p>
                </div>
            )}

            {/* Activation des notifications, une fois l'app installée */}
            <div>
                <p className="font-medium text-gray-900 dark:text-white text-sm mb-2 flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4" />
                    {isRTL ? 'بعد التثبيت، فعّل الإشعارات' : 'Une fois installée, activez les notifications'}
                </p>
                <PushNotificationCard />
            </div>
        </div>
    );
};

export default PWAInstallGuide;
