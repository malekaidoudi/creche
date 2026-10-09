/**
 * Modal de gestion des accès (permissions) d'un membre du personnel
 *
 * Permet à l'administrateur d'activer/désactiver individuellement chaque
 * fonctionnalité pour une éducatrice donnée (contacts parents, messagerie,
 * documents, soins médicaux, etc.).
 *
 * Structuré en 5 pôles métier modernes avec tri canonique et actions rapides.
 */

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ShieldCheck,
  Save,
  AlertCircle,
  Loader2,
  Stethoscope,
  Baby,
  Users,
  MessageSquare,
  Calendar,
  RotateCcw,
  CheckCircle2,
  Lock,
  Sparkles
} from 'lucide-react';
import { Button } from '../ui/Button';
import ToggleSwitch from '../ui/ToggleSwitch';
import api from '../../services/api';

const MODULE_CONFIG = {
  medical: {
    order: 1,
    title: { fr: 'Santé & Soins médicaux', ar: 'صحة ورعاية الأطفال' },
    desc: {
      fr: 'Dossier de santé, allergies, antécédents et administration des traitements',
      ar: 'الملف الطبي، الحساسية، التاريخ الصحي وإعطاء العلاجات'
    },
    icon: Stethoscope,
    badgeColor: 'text-rose-700 bg-rose-50 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/50',
    iconBg: 'bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400',
    borderAccent: 'border-rose-100 dark:border-rose-900/30'
  },
  daily: {
    order: 2,
    title: { fr: 'Suivi & Vie quotidienne de l\'enfant', ar: 'التتبع والحياة اليومية للطفل' },
    desc: {
      fr: 'Pointage des présences, bilans journaliers, ateliers et fournitures de garde',
      ar: 'تسجيل الحضور، التقارير اليومية، الأنشطة ولوازم الطفل'
    },
    icon: Baby,
    badgeColor: 'text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/50',
    iconBg: 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400',
    borderAccent: 'border-amber-100 dark:border-amber-900/30'
  },
  families: {
    order: 3,
    title: { fr: 'Familles & Données confidentielles', ar: 'الأسر والبيانات الحساسة' },
    desc: {
      fr: 'Protection des coordonnées parents, contacts d\'urgence et pièces administratives',
      ar: 'حماية بيانات الاتصال بالأولياء والطوارئ والوثائق الإدارية'
    },
    icon: Users,
    badgeColor: 'text-purple-700 bg-purple-50 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-900/50',
    iconBg: 'bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400',
    borderAccent: 'border-purple-100 dark:border-purple-900/30'
  },
  messaging: {
    order: 4,
    title: { fr: 'Communication', ar: 'التواصل والمراسلات' },
    desc: {
      fr: 'Échanges directs avec les parents et accès aux annonces de l\'établissement',
      ar: 'التواصل المباشر مع الأولياء والاطلاع على الإعلانات الرسمية'
    },
    icon: MessageSquare,
    badgeColor: 'text-blue-700 bg-blue-50 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/50',
    iconBg: 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400',
    borderAccent: 'border-blue-100 dark:border-blue-900/30'
  },
  organisation: {
    order: 5,
    title: { fr: 'Organisation & Planning interne', ar: 'التنظيم والجدول الداخلي' },
    desc: {
      fr: 'Consultation du planning d\'équipe, traitement des absences et tâches d\'équipe',
      ar: 'الاطلاع على جدول الفريق، معالجة الغيابات ومهام العمل'
    },
    icon: Calendar,
    badgeColor: 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/50',
    iconBg: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400',
    borderAccent: 'border-emerald-100 dark:border-emerald-900/30'
  }
};

const StaffPermissionsModal = ({ isOpen, onClose, staff, isRTL }) => {
  const lang = isRTL ? 'ar' : 'fr';
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen || !staff) return;

    const loadCatalog = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.get(`/api/staff-permissions/${staff.id}`);
        setCatalog(res.data?.catalog || []);
      } catch (err) {
        console.error('Erreur chargement permissions:', err);
        setError(isRTL ? 'خطأ في تحميل الصلاحيات' : 'Erreur lors du chargement des accès');
      } finally {
        setLoading(false);
      }
    };

    loadCatalog();
  }, [isOpen, staff, isRTL]);

  // Grouper et trier les modules selon l'ordre canonique défini
  const sortedGroupedCatalog = useMemo(() => {
    const groups = {};
    catalog.forEach((perm) => {
      const moduleKey = perm.module || 'daily';
      if (!groups[moduleKey]) groups[moduleKey] = [];
      groups[moduleKey].push(perm);
    });

    return Object.entries(groups).sort(([modA], [modB]) => {
      const orderA = MODULE_CONFIG[modA]?.order || 99;
      const orderB = MODULE_CONFIG[modB]?.order || 99;
      return orderA - orderB;
    });
  }, [catalog]);

  // Statistiques d'autorisations accordées
  const stats = useMemo(() => {
    const total = catalog.length;
    const granted = catalog.filter((p) => p.granted).length;
    return { total, granted };
  }, [catalog]);

  const togglePermission = (code) => {
    setCatalog((prev) =>
      prev.map((perm) => (perm.code === code ? { ...perm, granted: !perm.granted } : perm))
    );
  };

  // Actions rapides
  const handleResetToDefaults = () => {
    setCatalog((prev) =>
      prev.map((perm) => ({
        ...perm,
        granted: !!perm.isCommon
      }))
    );
  };

  const handleToggleAll = (grantAll) => {
    setCatalog((prev) =>
      prev.map((perm) => ({
        ...perm,
        granted: grantAll
      }))
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const codes = catalog.filter((p) => p.granted).map((p) => p.code);
      await api.put(`/api/staff-permissions/${staff.id}`, { codes });
      onClose(true);
    } catch (err) {
      console.error('Erreur enregistrement permissions:', err);
      setError(isRTL ? 'خطأ في حفظ الصلاحيات' : 'Erreur lors de l\'enregistrement des accès');
    } finally {
      setSaving(false);
    }
  };

  if (!staff) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ duration: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl my-6 flex flex-col max-h-[90vh] border border-gray-100 dark:border-gray-700/60"
            dir={isRTL ? 'rtl' : 'ltr'}
          >
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-gray-700/70 bg-gradient-to-r from-gray-50/80 via-white to-gray-50/50 dark:from-gray-800 dark:via-gray-800 dark:to-gray-800/80 rounded-t-2xl">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 flex items-center justify-center font-bold text-base shadow-sm">
                    {staff.first_name ? staff.first_name[0].toUpperCase() : 'S'}
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-primary-500 flex-shrink-0" />
                      <span>
                        {isRTL ? 'صلاحيات' : 'Accès & Permissions :'} {staff.first_name} {staff.last_name}
                      </span>
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-2">
                      <span className="font-medium text-primary-600 dark:text-primary-400">
                        {staff.role === 'staff' ? (isRTL ? 'فريق العمل' : 'Personnel / Éducatrice') : staff.role}
                      </span>
                      <span>•</span>
                      <span>
                        {isRTL
                          ? `${stats.granted} من ${stats.total} مفعلة`
                          : `${stats.granted} sur ${stats.total} activée${stats.granted > 1 ? 's' : ''}`}
                      </span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => onClose(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700/60 dark:hover:text-gray-200 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Barre d'actions rapides */}
              {!loading && catalog.length > 0 && (
                <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-gray-200/60 dark:border-gray-700/60 text-xs">
                  <span className="text-gray-500 dark:text-gray-400 font-medium hidden sm:inline">
                    {isRTL ? 'إجراءات سريعة:' : 'Préréglages rapides :'}
                  </span>
                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <button
                      type="button"
                      onClick={handleResetToDefaults}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-200/60 dark:hover:bg-gray-700/60 transition-colors font-medium"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-gray-500" />
                      <span>{isRTL ? 'الإعداد الافتراضي' : 'Par défaut'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleAll(true)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950/40 transition-colors font-medium"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{isRTL ? 'تفعيل الكل' : 'Tout activer'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleAll(false)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/40 transition-colors"
                    >
                      <span>{isRTL ? 'تعطيل الكل' : 'Tout désactiver'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Content Body */}
            <div className="p-4 sm:p-5 space-y-5 overflow-y-auto flex-1">
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                  <p className="text-red-600 dark:text-red-400 text-xs sm:text-sm flex items-center">
                    <AlertCircle className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2 flex-shrink-0" />
                    {error}
                  </p>
                </div>
              )}

              {loading ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-primary-600 dark:text-primary-400" />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {isRTL ? 'جاري تحميل الصلاحيات...' : 'Chargement des autorisations...'}
                  </p>
                </div>
              ) : (
                sortedGroupedCatalog.map(([moduleKey, perms]) => {
                  const conf = MODULE_CONFIG[moduleKey] || {
                    title: { fr: moduleKey, ar: moduleKey },
                    desc: { fr: '', ar: '' },
                    icon: ShieldCheck,
                    badgeColor: 'text-gray-700 bg-gray-50 border-gray-200',
                    iconBg: 'bg-gray-100 text-gray-600',
                    borderAccent: 'border-gray-100'
                  };
                  const Icon = conf.icon;
                  const grantedInModule = perms.filter((p) => p.granted).length;

                  return (
                    <div
                      key={moduleKey}
                      className={`rounded-xl border ${conf.borderAccent} bg-white dark:bg-gray-800/80 shadow-sm p-3.5 sm:p-4 transition-all`}
                    >
                      {/* Module Header */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2.5">
                          <div className={`p-2 rounded-lg ${conf.iconBg}`}>
                            <Icon className="w-4 h-4 sm:w-4.5 sm:h-4.5 flex-shrink-0" />
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                              {conf.title[lang] || conf.title.fr}
                            </h3>
                            {conf.desc[lang] && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">
                                {conf.desc[lang]}
                              </p>
                            )}
                          </div>
                        </div>
                        <span
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${conf.badgeColor} flex-shrink-0`}
                        >
                          {grantedInModule}/{perms.length}
                        </span>
                      </div>

                      {/* Permissions List */}
                      <div className="space-y-2 mt-2">
                        {perms.map((perm) => (
                          <div
                            key={perm.code}
                            className={`flex items-center justify-between gap-3 p-2.5 rounded-lg border transition-colors ${
                              perm.granted
                                ? 'bg-primary-50/40 dark:bg-primary-950/20 border-primary-100 dark:border-primary-900/40'
                                : 'bg-gray-50/70 dark:bg-gray-900/40 border-gray-100 dark:border-gray-800'
                            }`}
                          >
                            <div className="flex-1 min-w-0 pr-2 rtl:pr-0 rtl:pl-2">
                              <p className="text-xs sm:text-sm font-medium text-gray-800 dark:text-gray-200">
                                {perm.label[lang] || perm.label.fr}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                {perm.isCommon ? (
                                  <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                    <Sparkles className="w-2.5 h-2.5" />
                                    {isRTL ? 'افتراضي' : 'Par défaut crèche'}
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-gray-400 dark:text-gray-500 flex items-center gap-1">
                                    <Lock className="w-2.5 h-2.5" />
                                    {isRTL ? 'خاص' : 'Accès spécifique'}
                                  </span>
                                )}
                              </div>
                            </div>
                            <ToggleSwitch
                              checked={perm.granted}
                              onChange={() => togglePermission(perm.code)}
                              size="sm"
                              ariaLabel={perm.label[lang] || perm.label.fr}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="p-3.5 sm:p-4 border-t border-gray-100 dark:border-gray-700/70 bg-gray-50/60 dark:bg-gray-800/80 rounded-b-2xl flex items-center justify-between gap-3">
              <span className="text-xs text-gray-500 dark:text-gray-400 hidden sm:inline">
                {isRTL ? 'سيتم تطبيق التعديلات فور الحفظ' : 'Modifications actives immédiatement après validation'}
              </span>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <Button variant="outline" size="sm" onClick={() => onClose(false)} disabled={saving}>
                  {isRTL ? 'إلغاء' : 'Annuler'}
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={loading || saving}
                  size="sm"
                  className="flex items-center gap-2 shadow-sm"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {isRTL ? 'حفظ الصلاحيات' : 'Enregistrer les accès'}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default StaffPermissionsModal;
