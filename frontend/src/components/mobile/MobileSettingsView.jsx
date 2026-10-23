import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  User,
  Moon,
  Sun,
  Languages,
  Bell,
  Clock,
  Calendar,
  Shield,
  LogOut,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Save,
  Laptop
} from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { usePushNotifications } from '../../hooks/usePushNotifications';
import { useDialogContext } from '../../contexts/DialogContext';
import api from '../../services/api';
import ToggleSwitch from '../ui/ToggleSwitch';
import { Button } from '../ui/Button';

const DAYS_OF_WEEK = [
  { id: 1, labelFr: 'Lun', labelAr: 'إثن' },
  { id: 2, labelFr: 'Mar', labelAr: 'ثلا' },
  { id: 3, labelFr: 'Mer', labelAr: 'أرب' },
  { id: 4, labelFr: 'Jeu', labelAr: 'خمي' },
  { id: 5, labelFr: 'Ven', labelAr: 'جمع' },
  { id: 6, labelFr: 'Sam', labelAr: 'سبت' }
];

const MobileSettingsView = ({ onSwitchToDesktopView }) => {
  const navigate = useNavigate();
  const { isRTL, currentLanguage, toggleLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const dialog = useDialogContext();
  const pushNotifications = usePushNotifications();

  // États des préférences notifications
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [attendanceReminderEnabled, setAttendanceReminderEnabled] = useState(true);
  const [attendanceReminderTime, setAttendanceReminderTime] = useState('08:30');
  const [attendanceReminderDays, setAttendanceReminderDays] = useState([1, 2, 3, 4, 5, 6]);
  const [emailNotifications, setEmailNotifications] = useState(true);

  // Charger les préférences utilisateur
  useEffect(() => {
    const fetchPrefs = async () => {
      try {
        setLoading(true);
        const res = await api.get('/notifications/preferences');
        if (res.data?.success && res.data.preferences) {
          const p = res.data.preferences;
          setAttendanceReminderEnabled(Boolean(p.attendance_reminder_enabled));
          setAttendanceReminderTime(p.attendance_reminder_time || '08:30');
          if (Array.isArray(p.attendance_reminder_days)) {
            setAttendanceReminderDays(p.attendance_reminder_days);
          }
          setEmailNotifications(Boolean(p.email_notifications));
        }
      } catch (err) {
        console.warn('Utilisation des valeurs par défaut pour les préférences:', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPrefs();
  }, []);

  // Sauvegarder les préférences
  const handleSavePreferences = async () => {
    try {
      setSaving(true);
      await api.put('/notifications/preferences', {
        attendance_reminder_enabled: attendanceReminderEnabled,
        attendance_reminder_time: attendanceReminderTime,
        attendance_reminder_days: attendanceReminderDays,
        email_notifications: emailNotifications
      });

      dialog.success(
        isRTL
          ? 'تم حفظ تفضيلات التنبيهات بنجاح!'
          : 'Préférences de rappel enregistrées avec succès !'
      );
    } catch (err) {
      dialog.error(
        isRTL
          ? 'تعذر حفظ التفضيلات'
          : 'Erreur lors de la sauvegarde des préférences'
      );
    } finally {
      setSaving(false);
    }
  };

  // Toggle un jour de la semaine
  const toggleDay = (dayId) => {
    if (attendanceReminderDays.includes(dayId)) {
      if (attendanceReminderDays.length > 1) {
        setAttendanceReminderDays(attendanceReminderDays.filter((d) => d !== dayId));
      }
    } else {
      setAttendanceReminderDays([...attendanceReminderDays, dayId].sort());
    }
  };

  // Déconnexion avec confirmation
  const handleLogout = async () => {
    const confirmed = await dialog.confirm(
      isRTL ? 'هل أنت متأكد من تسجيل الخروج؟' : 'Voulez-vous vraiment vous déconnecter ?',
      {
        title: isRTL ? 'تسجيل الخروج' : 'Déconnexion',
        confirmText: isRTL ? 'تسجيل الخروج' : 'Déconnexion',
        cancelText: isRTL ? 'إلغاء' : 'Annuler',
        type: 'danger'
      }
    );

    if (confirmed) {
      logout();
      navigate('/');
    }
  };

  const getRoleLabel = () => {
    if (user?.role === 'admin' || user?.role === 'developer') {
      return isRTL ? 'الإدارة / المدير' : 'Direction / Admin';
    }
    if (user?.role === 'staff') {
      return isRTL ? 'الفريق التربوي' : 'Équipe Staff';
    }
    return isRTL ? 'ولي أمر' : 'Parent';
  };

  return (
    <div className="pb-24 pt-2 px-3 sm:px-4 max-w-lg mx-auto space-y-4">
      {/* 1. CARTE PROFIL COMPACTE */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700/60"
      >
        <div className="flex items-center space-x-3 rtl:space-x-reverse">
          <div className="relative">
            {user?.profile_image ? (
              <img
                src={user.profile_image}
                alt={user.first_name}
                className="w-14 h-14 rounded-full object-cover ring-2 ring-primary-500/20"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-primary-600 to-indigo-500 text-white flex items-center justify-center font-bold text-xl shadow-inner">
                {user?.first_name?.[0] || 'U'}
              </div>
            )}
            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full" />
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-gray-900 dark:text-white truncate">
              {user?.first_name} {user?.last_name}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {user?.email}
            </p>
            <div className="mt-1">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 border border-primary-200/50 dark:border-primary-800/40">
                {getRoleLabel()}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700/60">
          <button
            onClick={() => navigate('/profile')}
            className="w-full flex items-center justify-center space-x-1.5 rtl:space-x-reverse py-2 px-3 rounded-xl bg-gray-50 dark:bg-gray-700/40 hover:bg-gray-100 dark:hover:bg-gray-700 text-xs font-medium text-gray-700 dark:text-gray-200 transition-colors"
          >
            <User className="w-3.5 h-3.5 text-primary-500" />
            <span>{isRTL ? 'إدارة الملف الشخصي' : 'Voir mon profil complet'}</span>
            <ExternalLink className="w-3 h-3 opacity-60" />
          </button>
        </div>
      </motion.div>

      {/* 2. PRÉFÉRENCES D'AFFICHAGE (Thème & Langue) */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700/60 space-y-4"
      >
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
          {isRTL ? 'تفضيلات العرض' : 'Affichage & Langue'}
        </h3>

        {/* Mode Sombre */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-indigo-950/40 text-amber-600 dark:text-indigo-400">
              {theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {isRTL ? 'المظهر المظلم' : 'Mode sombre'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {theme === 'dark'
                  ? isRTL ? 'المظهر الداكن مفعّل' : 'Thème sombre actif'
                  : isRTL ? 'المظهر الفاتح مفعّل' : 'Thème clair actif'}
              </p>
            </div>
          </div>
          <ToggleSwitch
            checked={theme === 'dark'}
            onChange={toggleTheme}
            ariaLabel={isRTL ? 'المظهر المظلم' : 'Mode sombre'}
          />
        </div>

        {/* Langue Interface */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700/60">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
              <Languages className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {isRTL ? 'اللغة' : 'Langue'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {currentLanguage === 'fr' ? 'Français' : 'العربية (تونس)'}
              </p>
            </div>
          </div>
          <button
            onClick={toggleLanguage}
            className="flex items-center space-x-1.5 rtl:space-x-reverse px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 text-xs font-semibold text-gray-800 dark:text-gray-100 transition-colors"
          >
            <span>{currentLanguage === 'fr' ? '🇹🇳 العربية' : '🇫🇷 Français'}</span>
          </button>
        </div>
      </motion.div>

      {/* 3. ALERTE DE PRÉSENCE PROGRAMMÉE (Fonctionnalité Clé) */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700/60 space-y-4"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                {isRTL ? 'تنبيه تسجيل الحضور' : 'Alerte de présence programmée'}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {isRTL
                  ? 'تنبيه إذا لم يتم تسجيل أي حضور حتى هذا الوقت'
                  : "Notification si aucune présence n'a été saisie"}
              </p>
            </div>
          </div>
          <ToggleSwitch
            checked={attendanceReminderEnabled}
            onChange={(val) => setAttendanceReminderEnabled(val)}
            ariaLabel={isRTL ? 'تفعيل تنبيه الحضور' : 'Alerte présence'}
          />
        </div>

        {attendanceReminderEnabled && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="space-y-3 pt-2 border-t border-gray-100 dark:border-gray-700/60"
          >
            {/* Heure du rappel */}
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                {isRTL ? 'وقت التنبيه (صباحاً)' : 'Heure du rappel (matin)'}
              </label>
              <input
                type="time"
                value={attendanceReminderTime}
                onChange={(e) => setAttendanceReminderTime(e.target.value)}
                className="px-2.5 py-1 text-sm font-semibold rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Jours actifs */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                {isRTL ? 'أيام التنبيه' : 'Jours de rappel'}
              </label>
              <div className="grid grid-cols-6 gap-1">
                {DAYS_OF_WEEK.map((d) => {
                  const isSelected = attendanceReminderDays.includes(d.id);
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => toggleDay(d.id)}
                      className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
                        isSelected
                          ? 'bg-primary-600 text-white shadow-sm'
                          : 'bg-gray-100 dark:bg-gray-700/60 text-gray-500 dark:text-gray-400 hover:bg-gray-200'
                      }`}
                    >
                      {currentLanguage === 'ar' ? d.labelAr : d.labelFr}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bouton Sauvegarder */}
            <div className="pt-2">
              <Button
                onClick={handleSavePreferences}
                disabled={saving}
                className="w-full flex items-center justify-center space-x-1.5 rtl:space-x-reverse py-2 text-xs font-medium rounded-xl"
              >
                <Save className="w-3.5 h-3.5" />
                <span>
                  {saving
                    ? isRTL ? 'جاري الحفظ...' : 'Enregistrement...'
                    : isRTL ? 'حفظ إعدادات التنبيه' : "Enregistrer l'horaire"}
                </span>
              </Button>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* 4. NOTIFICATIONS SYSTÈME (Push & Email) */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700/60 space-y-3"
      >
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
          {isRTL ? 'قنوات الإشعارات' : 'Canaux de notification'}
        </h3>

        {/* Notifications Push */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {isRTL ? 'إشعارات الهاتف (Push)' : 'Notifications Push'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {pushNotifications.isSubscribed
                  ? isRTL ? 'مفعلة على هذا الهاتف ✅' : 'Actives sur ce téléphone ✅'
                  : isRTL ? 'غير مفعلة' : 'Désactivées'}
              </p>
            </div>
          </div>

          {pushNotifications.isSupported ? (
            <button
              onClick={() => {
                if (pushNotifications.isSubscribed) {
                  pushNotifications.unsubscribe();
                } else {
                  pushNotifications.subscribe();
                }
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                pushNotifications.isSubscribed
                  ? 'bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-950/30 dark:text-red-400'
                  : 'bg-primary-600 text-white hover:bg-primary-700'
              }`}
            >
              {pushNotifications.isSubscribed
                ? isRTL ? 'إيقاف' : 'Désactiver'
                : isRTL ? 'تفعيل' : 'Activer'}
            </button>
          ) : (
            <span className="text-[11px] text-gray-400">
              {isRTL ? 'غير مدعوم' : 'Non supporté'}
            </span>
          )}
        </div>
      </motion.div>

      {/* 5. LIEN DISCRET VERS LA CONFIGURATION COMPLÈTE (DESKTOP) */}
      {(user?.role === 'admin' || user?.role === 'developer') && onSwitchToDesktopView && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-r from-gray-50 to-blue-50/40 dark:from-gray-800 dark:to-gray-800/80 rounded-2xl p-4 border border-blue-100/60 dark:border-gray-700"
        >
          <div className="flex items-start space-x-3 rtl:space-x-reverse">
            <div className="p-2 rounded-xl bg-blue-100/70 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
              <Laptop className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h4 className="text-xs font-bold text-gray-900 dark:text-white">
                {isRTL ? 'الإعدادات الكاملة (حاسوب)' : 'Configuration complète crèche'}
              </h4>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
                {isRTL
                  ? 'ساعات العمل، العطل الرسمية، تعيين الموظفين والزيارة الافتراضية متوفرة على الحاسوب أو بالتبديل للوضع الكامل.'
                  : 'Les horaires d’ouverture, jours fériés, affectation du personnel et visite virtuelle sont optimisés pour grand écran.'}
              </p>
              <button
                onClick={onSwitchToDesktopView}
                className="mt-2 text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline flex items-center space-x-1 rtl:space-x-reverse"
              >
                <span>{isRTL ? 'عرض كل الإعدادات على الهاتف' : 'Afficher la version complète'}</span>
                <span>→</span>
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* 6. BOUTON DÉCONNEXION */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="pt-2"
      >
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center space-x-2 rtl:space-x-reverse py-3 px-4 rounded-2xl bg-red-50 hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 font-medium text-sm transition-colors border border-red-200/50 dark:border-red-800/30"
        >
          <LogOut className="w-4 h-4" />
          <span>{isRTL ? 'تسجيل الخروج' : 'Se déconnecter'}</span>
        </button>
      </motion.div>
    </div>
  );
};

export default MobileSettingsView;
