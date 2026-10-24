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
  LogOut,
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
        const res = await api.get('/api/notifications/preferences');
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
  const handleSavePreferences = async (overrides = {}) => {
    try {
      setSaving(true);
      const userTz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Africa/Tunis';
      const payload = {
        attendance_reminder_enabled:
          overrides.attendance_reminder_enabled !== undefined
            ? overrides.attendance_reminder_enabled
            : attendanceReminderEnabled,
        attendance_reminder_time: overrides.attendance_reminder_time || attendanceReminderTime,
        attendance_reminder_days: overrides.attendance_reminder_days || attendanceReminderDays,
        email_notifications:
          overrides.email_notifications !== undefined
            ? overrides.email_notifications
            : emailNotifications,
        timezone: userTz
      };

      await api.put('/api/notifications/preferences', payload);

      dialog.success(
        isRTL
          ? 'تم حفظ تفضيلات التنبيهات بنجاح!'
          : 'Préférences de rappel enregistrées avec succès !'
      );
    } catch (err) {
      console.error('Erreur sauvegarde préférences:', err);
      dialog.error(
        isRTL
          ? 'تعذر حفظ التفضيلات'
          : 'Erreur lors de la sauvegarde des préférences'
      );
    } finally {
      setSaving(false);
    }
  };

  // Toggle activation avec sauvegarde automatique
  const handleToggleAttendance = async (val) => {
    setAttendanceReminderEnabled(val);
    await handleSavePreferences({ attendance_reminder_enabled: val });
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
    <div className="pb-24 pt-[max(1rem,calc(env(safe-area-inset-top,0px)+0.75rem))] px-3 sm:px-4 max-w-md mx-auto space-y-3.5">
      {/* 1. CARTE PROFIL (iOS Inset - Palette Centre d'Aide) */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-2xl p-3.5 border border-cyan-500/20 dark:border-cyan-500/25 shadow-sm flex items-center gap-3"
      >
        <div className="relative shrink-0">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 via-sky-500 to-blue-600 p-0.5 shadow-md shadow-cyan-950/40">
            {user?.profile_image ? (
              <img
                src={user.profile_image}
                alt={user.first_name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <div className="w-full h-full rounded-full bg-slate-900 dark:bg-slate-950 flex items-center justify-center font-bold text-white text-sm">
                {user?.first_name?.[0] || 'U'}
              </div>
            )}
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 rtl:-right-auto rtl:-left-0.5 w-3.5 h-3.5 rounded-full bg-cyan-400 ring-2 ring-white dark:ring-slate-900 shadow-[0_0_6px_rgba(34,211,238,0.9)]" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white truncate">
              {user?.first_name} {user?.last_name}
            </h2>
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-cyan-500/15 border border-cyan-400/25 text-cyan-700 dark:text-cyan-200">
              {getRoleLabel()}
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-slate-400 truncate mt-0.5">
            {user?.email}
          </p>
        </div>

        <button
          onClick={() => navigate('/profile')}
          className="p-2 rounded-xl bg-gray-100 dark:bg-slate-800/80 hover:bg-gray-200 dark:hover:bg-slate-800 text-gray-500 dark:text-cyan-300 transition-colors shrink-0"
          title={isRTL ? 'إدارة الملف الشخصي' : 'Voir mon profil complet'}
        >
          <User className="w-4 h-4" />
        </button>
      </motion.div>

      {/* 2. PRÉFÉRENCES D'AFFICHAGE (iOS Inset Group) */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-2xl border border-gray-200/70 dark:border-slate-800/80 overflow-hidden shadow-sm divide-y divide-gray-100 dark:divide-slate-800/60"
      >
        {/* Mode Sombre */}
        <div className="p-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/15 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 flex items-center justify-center text-sm shadow-xs">
              {theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-900 dark:text-slate-200">
                {isRTL ? 'المظهر المظلم' : 'Mode sombre'}
              </p>
              <p className="text-[10px] text-gray-500 dark:text-slate-400">
                {theme === 'dark'
                  ? isRTL ? 'المظهر الداكن مفعّل' : 'Thème sombre actif'
                  : isRTL ? 'المظهر الفاتح مفعّل' : 'Thème clair actif'}
              </p>
            </div>
          </div>
          <ToggleSwitch
            checked={theme === 'dark'}
            onChange={toggleTheme}
            activeColor="peer-checked:bg-gradient-to-r peer-checked:from-cyan-500 peer-checked:to-blue-600"
            inactiveColor="bg-gray-200 dark:bg-slate-700"
            ariaLabel={isRTL ? 'المظهر المظلم' : 'Mode sombre'}
          />
        </div>

        {/* Langue Interface */}
        <div className="p-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/15 text-cyan-600 dark:text-cyan-300 flex items-center justify-center text-sm shadow-xs">
              <Languages className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-900 dark:text-slate-200">
                {isRTL ? 'اللغة' : 'Langue'}
              </p>
              <p className="text-[10px] text-gray-500 dark:text-slate-400">
                {currentLanguage === 'fr' ? 'Français' : 'العربية (تونس)'}
              </p>
            </div>
          </div>
          <button
            onClick={toggleLanguage}
            className="px-2.5 py-1.5 rounded-xl bg-gray-100 dark:bg-slate-800 text-xs font-semibold text-gray-700 dark:text-slate-200 border border-gray-200 dark:border-slate-700 hover:border-cyan-500/40 transition-colors shadow-xs"
          >
            {currentLanguage === 'fr' ? '🇹🇳 العربية' : '🇫🇷 Français'}
          </button>
        </div>
      </motion.div>

      {/* 3. ALERTE DE PRÉSENCE PROGRAMMÉE (Palette Centre d'Aide - Sans bouton test) */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-2xl border border-cyan-500/25 p-3.5 shadow-sm space-y-3"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-400/20 to-blue-500/20 border border-cyan-400/30 text-cyan-600 dark:text-cyan-300 flex items-center justify-center text-sm shrink-0 shadow-xs">
              <Clock className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="text-xs font-bold text-gray-900 dark:text-white truncate">
                  {isRTL ? 'تنبيه تسجيل الحضور' : 'Alerte de présence programmée'}
                </h3>
                <span
                  className={`px-1.5 py-0.5 text-[9px] font-bold rounded-full ${
                    attendanceReminderEnabled
                      ? 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-400/25'
                      : 'bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-slate-400'
                  }`}
                >
                  {attendanceReminderEnabled
                    ? isRTL ? 'مفعل' : 'Actif'
                    : isRTL ? 'معطل' : 'Inactif'}
                </span>
              </div>
              <p className="text-[10px] text-gray-500 dark:text-cyan-100/70 truncate mt-0.5">
                {isRTL ? 'إشعار صباحي إذا لم يسجل أي حضور' : 'Rappel automatique si aucun pointage'}
              </p>
            </div>
          </div>
          <ToggleSwitch
            checked={attendanceReminderEnabled}
            onChange={handleToggleAttendance}
            activeColor="peer-checked:bg-gradient-to-r peer-checked:from-cyan-500 peer-checked:to-blue-600"
            inactiveColor="bg-gray-200 dark:bg-slate-700"
            ariaLabel={isRTL ? 'تفعيل تنبيه الحضور' : 'Alerte présence'}
          />
        </div>

        {attendanceReminderEnabled ? (
          <div className="pt-3 border-t border-gray-100 dark:border-slate-800/80 space-y-3">
            {/* Heure (Capsule iOS Cyan) */}
            <div className="flex items-center justify-between bg-gray-50 dark:bg-slate-950/70 p-2.5 rounded-xl border border-cyan-500/30">
              <span className="text-xs text-gray-700 dark:text-slate-300 font-medium">
                {isRTL ? 'وقت التنبيه' : 'Heure de notification'}
              </span>
              <input
                type="time"
                value={attendanceReminderTime}
                onChange={(e) => setAttendanceReminderTime(e.target.value)}
                className="bg-white dark:bg-slate-900 border border-cyan-500/40 text-cyan-600 dark:text-cyan-300 font-bold text-xs px-2.5 py-1 rounded-lg outline-none cursor-pointer focus:ring-2 focus:ring-cyan-500 shadow-inner"
              />
            </div>

            {/* Jours actifs (Pilules Cyan & Saphir) */}
            <div className="space-y-1.5">
              <span className="text-[11px] text-gray-500 dark:text-slate-400 font-medium">
                {isRTL ? 'أيام التفعيل' : 'Jours actifs'}
              </span>
              <div className="grid grid-cols-6 gap-1.5">
                {DAYS_OF_WEEK.map((d) => {
                  const isSelected = attendanceReminderDays.includes(d.id);
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => toggleDay(d.id)}
                      className={`py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-950/50 border border-cyan-400/40 scale-[1.02]'
                          : 'bg-gray-100 dark:bg-slate-800/80 text-gray-500 dark:text-slate-400 border border-gray-200 dark:border-slate-700/60 hover:text-gray-900 dark:hover:text-slate-200'
                      }`}
                    >
                      {currentLanguage === 'ar' ? d.labelAr : d.labelFr}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Action Unique : Enregistrer l'horaire (Bouton de test supprimé) */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => handleSavePreferences()}
                disabled={saving}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs transition-all shadow-md shadow-cyan-950/40 active:scale-[0.99] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>
                  {saving
                    ? isRTL ? 'جاري الحفظ...' : 'Enregistrement...'
                    : isRTL ? 'حفظ الإعدادات' : "Enregistrer l'horaire"}
                </span>
              </button>
            </div>
          </div>
        ) : (
          <p className="text-[11px] text-gray-400 dark:text-slate-500 italic pt-1">
            {isRTL ? 'التنبيه متوقف حالياً' : 'Le rappel matinal est actuellement désactivé.'}
          </p>
        )}
      </motion.div>

      {/* 4. NOTIFICATIONS SYSTÈME (Push) */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-2xl border border-gray-200/70 dark:border-slate-800/80 p-3.5 shadow-sm flex items-center justify-between"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-cyan-500/15 text-cyan-600 dark:text-cyan-300 flex items-center justify-center text-xs">
            <Bell className="w-3.5 h-3.5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-900 dark:text-slate-200">
              {isRTL ? 'إشعارات الهاتف (Web Push)' : 'Notifications Push'}
            </p>
            <p className="text-[10px] text-cyan-600 dark:text-cyan-300/80">
              {pushNotifications.isSubscribed
                ? isRTL ? 'مفعلة على هذا الهاتف' : 'Actives sur ce téléphone'
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
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              pushNotifications.isSubscribed
                ? 'bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-950/30 dark:text-red-400 border border-red-200/40 dark:border-red-900/30'
                : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-xs'
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
      </motion.div>

      {/* 5. LIEN CONFIGURATION COMPLÈTE (DESKTOP) */}
      {(user?.role === 'admin' || user?.role === 'developer') && onSwitchToDesktopView && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md rounded-2xl border border-gray-200/70 dark:border-slate-800/70 p-3 flex items-center justify-between text-xs text-gray-700 dark:text-slate-300"
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Laptop className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <span className="font-semibold block truncate">
                {isRTL ? 'الإعدادات الكاملة (حاسوب)' : 'Configuration complète (PC)'}
              </span>
              <span className="text-[10px] text-gray-500 dark:text-slate-400 block truncate">
                {isRTL ? 'ساعات العمل، العطل وتعيين الموظفين' : 'Horaires, jours fériés et gestion avancée'}
              </span>
            </div>
          </div>
          <button
            onClick={onSwitchToDesktopView}
            className="text-cyan-600 dark:text-cyan-400 font-bold hover:underline shrink-0 px-2 py-1"
          >
            {isRTL ? '← فتح' : 'Ouvrir →'}
          </button>
        </motion.div>
      )}

      {/* 6. DÉCONNEXION */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="pt-1"
      >
        <button
          onClick={handleLogout}
          className="w-full py-2.5 rounded-2xl bg-red-50 hover:bg-red-100 dark:bg-red-950/25 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200/50 dark:border-red-900/30 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>{isRTL ? 'تسجيل الخروج' : 'Se déconnecter'}</span>
        </button>
      </motion.div>
    </div>
  );
};

export default MobileSettingsView;
