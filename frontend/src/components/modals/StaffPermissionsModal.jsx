/**
 * Modal de gestion des accès (permissions) d'un membre du personnel
 *
 * Permet à l'administrateur d'activer/désactiver individuellement chaque
 * fonctionnalité pour une éducatrice donnée (contacts parents, messagerie,
 * documents, etc.). Les permissions "communes" (accordées par défaut à
 * tout le staff) restent modifiables ici aussi si besoin.
 */

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldCheck, Save, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '../ui/Button';
import ToggleSwitch from '../ui/ToggleSwitch';
import api from '../../services/api';

const MODULE_LABELS = {
  medical: { fr: 'Santé des enfants', ar: 'صحة الأطفال' },
  messaging: { fr: 'Communication', ar: 'التواصل' },
  daily: { fr: 'Suivi quotidien', ar: 'التتبع اليومي' },
  organisation: { fr: 'Organisation du travail', ar: 'تنظيم العمل' },
  families: { fr: 'Informations sur les familles', ar: 'معلومات عن الأسر' }
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

  const groupedCatalog = useMemo(() => {
    const groups = {};
    catalog.forEach((perm) => {
      if (!groups[perm.module]) groups[perm.module] = [];
      groups[perm.module].push(perm);
    });
    return groups;
  }, [catalog]);

  const togglePermission = (code) => {
    setCatalog((prev) =>
      prev.map((perm) => (perm.code === code ? { ...perm, granted: !perm.granted } : perm))
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg my-8"
            dir={isRTL ? 'rtl' : 'ltr'}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <ShieldCheck className="w-5 h-5 mr-2 rtl:mr-0 rtl:ml-2 text-primary-500" />
                {isRTL ? 'إدارة صلاحيات' : 'Gérer les accès de'} {staff.first_name} {staff.last_name}
              </h2>
              <button
                onClick={() => onClose(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-5 max-h-[65vh] overflow-y-auto">
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-red-600 dark:text-red-400 text-sm flex items-center">
                    <AlertCircle className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2 flex-shrink-0" />
                    {error}
                  </p>
                </div>
              )}

              {loading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
                </div>
              ) : (
                Object.entries(groupedCatalog).map(([moduleKey, perms]) => (
                  <div key={moduleKey}>
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      {MODULE_LABELS[moduleKey]?.[lang] || moduleKey}
                    </h3>
                    <div className="space-y-2">
                      {perms.map((perm) => (
                        <div
                          key={perm.code}
                          className="flex items-center justify-between gap-3 py-2 px-3 rounded-lg bg-gray-50 dark:bg-gray-900/40"
                        >
                          <span className="text-sm text-gray-700 dark:text-gray-200 flex-1">
                            {perm.label[lang] || perm.label.fr}
                            {perm.isCommon && (
                              <span className="ml-2 rtl:ml-0 rtl:mr-2 text-[10px] uppercase text-primary-500 font-medium">
                                {isRTL ? 'شائع' : 'commun'}
                              </span>
                            )}
                          </span>
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
                ))
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-200 dark:border-gray-700">
              <Button variant="outline" onClick={() => onClose(false)} disabled={saving}>
                {isRTL ? 'إلغاء' : 'Annuler'}
              </Button>
              <Button onClick={handleSave} disabled={loading || saving} className="flex items-center gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {isRTL ? 'حفظ' : 'Enregistrer'}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default StaffPermissionsModal;
