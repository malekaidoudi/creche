import React, { useState } from 'react';
import { Bell, Smartphone, Send, AlertTriangle, CheckCircle2, Info, Loader2 } from 'lucide-react';
import { usePushNotifications } from '../../hooks/usePushNotifications';
import { useLanguage } from '../../hooks/useLanguage';
import { useDialogContext } from '../../contexts/DialogContext';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import ToggleSwitch from '../ui/ToggleSwitch';
import { Button } from '../ui/Button';

const PushNotificationCard = ({ className = '' }) => {
  const { isRTL } = useLanguage();
  const dialog = useDialogContext();
  const {
    isSupported,
    needsInstall,
    needsSafari,
    permission,
    isSubscribed,
    loading,
    subscribe,
    unsubscribe,
    sendTestNotification
  } = usePushNotifications();

  const [testSending, setTestSending] = useState(false);

  const handleToggle = async (checked) => {
    const success = checked ? await subscribe() : await unsubscribe();

    if (success) {
      dialog.showToast(
        checked
          ? (isRTL ? 'تم تفعيل إشعارات الهاتف بنجاح' : 'Notifications sur cet appareil activées avec succès')
          : (isRTL ? 'تم إلغاء تفعيل إشعارات الهاتف' : 'Notifications sur cet appareil désactivées'),
        'success'
      );
    } else if (checked && permission === 'denied') {
      dialog.showToast(
        isRTL
          ? 'الإذن مرفوض : يرجى تفعيله من إعدادات المتصفح'
          : 'Permission refusée : veuillez l\'autoriser dans les paramètres du navigateur',
        'error'
      );
    }
  };

  const handleTest = async () => {
    setTestSending(true);
    try {
      const ok = await sendTestNotification();
      if (ok) {
        dialog.showToast(
          isRTL
            ? 'تم إرسال إشعار تجريبي، تفقد هاتفك !'
            : 'Notification de test envoyée, vérifiez votre appareil !',
          'success'
        );
      } else {
        dialog.showToast(
          isRTL
            ? 'فشل إرسال الإشعار التجريبي'
            : 'Échec de l\'envoi de la notification de test',
          'error'
        );
      }
    } finally {
      setTestSending(false);
    }
  };

  return (
    <Card className={`border border-gray-200 dark:border-gray-700 shadow-sm ${className}`}>
      <CardHeader className="pb-3 border-b border-gray-100 dark:border-gray-700/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                {isRTL ? 'إشعارات الهاتف (Web Push)' : 'Notifications sur cet appareil'}
              </CardTitle>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {isRTL
                  ? 'تلقي تنبيهات فورية (التقارير اليومية، الإعلانات، الطوارئ) حتى عند إغلاق التطبيق'
                  : 'Alertes en direct (rapports, annonces, urgences), même lorsque l\'application est fermée'}
              </p>
            </div>
          </div>

          <ToggleSwitch
            checked={isSubscribed}
            disabled={!isSupported || needsInstall || needsSafari || loading}
            onChange={handleToggle}
            size="md"
            ariaLabel={isRTL ? 'إشعارات الهاتف' : 'Notifications sur l\'appareil'}
          />
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-3">
        {/* Statut actuel */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/60 text-sm">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <span className="text-gray-700 dark:text-gray-300">
              {isRTL ? 'حالة التفعيل على هذا الجهاز :' : 'État sur cet appareil :'}
            </span>
          </div>

          {isSubscribed ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {isRTL ? 'مفعلة' : 'Active'}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
              {isRTL ? 'معطلة' : 'Inactive'}
            </span>
          )}
        </div>

        {/* Bouton de test si abonné */}
        {isSubscribed && (
          <div className="pt-1 flex items-center justify-between flex-wrap gap-2">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {isRTL
                ? 'يمكنك إرسال إشعار تجريبي للتأكد من وصوله لهاتفك.'
                : 'Testez la réception immédiate d\'un push sur cet écran.'}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={testSending}
              onClick={handleTest}
              className="flex items-center gap-1.5 text-xs h-8"
            >
              {testSending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" />
              )}
              {isRTL ? 'إرسال إشعار تجريبي' : 'Tester la notification'}
            </Button>
          </div>
        )}

        {/* Messages d'aide contextuels iOS / Navigateurs */}
        {needsSafari && (
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
            <div>
              <p className="font-medium">
                {isRTL ? 'تنبيه لمستخدمي iPhone / iPad :' : 'Spécificité Apple iOS :'}
              </p>
              <p className="mt-0.5 leading-relaxed">
                {isRTL
                  ? 'على iOS، افتح هذا الموقع في متصفح Safari، ثم اضغط على زر المشاركة وافتر "إضافة إلى الشاشة الرئيسية" لتتمكن من تفعيل الإشعارات.'
                  : 'Sur iPhone/iPad, Apple restreint le Web Push : ouvrez ce site dans Safari, puis ajoutez-le à l\'écran d\'accueil pour activer les alertes.'}
              </p>
            </div>
          </div>
        )}

        {needsInstall && !needsSafari && (
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800 text-xs text-sky-800 dark:text-sky-300">
            <Info className="w-4 h-4 shrink-0 mt-0.5 text-sky-600 dark:text-sky-400" />
            <div>
              <p className="font-medium">
                {isRTL ? 'إضافة التطبيق للشاشة الرئيسية مطلوبة :' : 'Installation requise sur iOS :'}
              </p>
              <p className="mt-0.5 leading-relaxed">
                {isRTL
                  ? 'اضغط على زر المشاركة في Safari (مربع مع سهم لأعلى) ثم "إضافة إلى الشاشة الرئيسية". افتح التطبيق من هناك لتفعيل الإشعارات.'
                  : 'Dans Safari, touchez le bouton Partager ⎋ puis "Sur l\'écran d\'accueil". Lancez l\'app installée pour activer les notifications.'}
              </p>
            </div>
          </div>
        )}

        {!isSupported && !needsSafari && !needsInstall && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-gray-100 dark:bg-gray-800 text-xs text-gray-600 dark:text-gray-400">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <p>
              {isRTL
                ? 'هذا المتصفح لا يدعم تقنية Web Push. يرجى استخدام متصفح حديث (Chrome, Edge, Safari).'
                : 'Ce navigateur ne gère pas le Web Push. Utilisez un navigateur récent (Chrome, Edge, Safari PWA).'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PushNotificationCard;
