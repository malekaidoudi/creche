import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  Users,
  CheckCircle,
  AlertTriangle,
  Phone,
  User,
  Mail,
  Save,
  Check,
  RefreshCw,
  Sparkles,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { Button } from '../ui/Button';
import { useDialogContext } from '../../contexts/DialogContext';
import api from '../../services/api';
import API_CONFIG from '../../config/api';

const getPhotoUrl = (photoUrl) => {
  if (!photoUrl) return null;
  if (photoUrl.startsWith('http') || photoUrl.startsWith('blob:') || photoUrl.startsWith('data:')) return photoUrl;
  return `${API_CONFIG.BASE_URL}${photoUrl.startsWith('/') ? '' : '/'}${photoUrl}`;
};

const isChildComplete = (child) => {
  const hasFather = Boolean(child.father_name?.trim() && child.father_phone?.trim());
  const hasMother = Boolean(child.mother_name?.trim() && child.mother_phone?.trim());
  const hasEmergency = Boolean(child.emergency_contact_phone?.trim());
  return hasFather && hasMother && hasEmergency;
};

// Carte de saisie individuelle par enfant
const ChildParentRow = ({ child, onSaveSuccess, isRTL }) => {
  const dialog = useDialogContext();
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  const [formData, setFormData] = useState({
    father_name: child.father_name || '',
    father_phone: child.father_phone || '',
    mother_name: child.mother_name || '',
    mother_phone: child.mother_phone || '',
    account_holder: child.account_holder || (child.parent_gender === 'female' ? 'mother' : 'father'),
    emergency_contact_name: child.emergency_contact_name || '',
    emergency_contact_phone: child.emergency_contact_phone || '',
    parent_email: child.parent_email || ''
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setJustSaved(false);
  };

  const handleCopyFatherToEmergency = () => {
    if (formData.father_name || formData.father_phone) {
      setFormData(prev => ({
        ...prev,
        emergency_contact_name: prev.father_name || (isRTL ? 'الأب' : 'Le père'),
        emergency_contact_phone: prev.father_phone || ''
      }));
      setJustSaved(false);
    }
  };

  const handleCopyMotherToEmergency = () => {
    if (formData.mother_name || formData.mother_phone) {
      setFormData(prev => ({
        ...prev,
        emergency_contact_name: prev.mother_name || (isRTL ? 'الأم' : 'La mère'),
        emergency_contact_phone: prev.mother_phone || ''
      }));
      setJustSaved(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const payload = {
        father_name: formData.father_name.trim(),
        father_phone: formData.father_phone.trim(),
        mother_name: formData.mother_name.trim(),
        mother_phone: formData.mother_phone.trim(),
        account_holder: formData.account_holder,
        emergency_contact_name: formData.emergency_contact_name.trim(),
        emergency_contact_phone: formData.emergency_contact_phone.trim(),
        second_parent_name: formData.account_holder === 'father' ? formData.mother_name.trim() : formData.father_name.trim(),
        second_parent_phone: formData.account_holder === 'father' ? formData.mother_phone.trim() : formData.father_phone.trim(),
        parent_phone: formData.account_holder === 'mother' ? formData.mother_phone.trim() : formData.father_phone.trim()
      };

      const res = await api.put(`/api/children/${child.id}`, payload);
      if (res.data?.success) {
        setJustSaved(true);
        if (onSaveSuccess) {
          onSaveSuccess(child.id, res.data.child || payload);
        }
        dialog.success(
          isRTL
            ? `تم تحديث بيانات الوالدين للطفل ${child.first_name}`
            : `Coordonnées des parents enregistrées pour ${child.first_name} ${child.last_name}`
        );
      }
    } catch (err) {
      console.error('Erreur sauvegarde parents enfant:', err);
      dialog.error(
        err.response?.data?.error ||
        (isRTL ? 'حدث خطأ أثناء الحفظ' : 'Erreur lors de l\'enregistrement')
      );
    } finally {
      setSaving(false);
    }
  };

  const isComplete = Boolean(
    formData.father_name?.trim() &&
    formData.father_phone?.trim() &&
    formData.mother_name?.trim() &&
    formData.mother_phone?.trim() &&
    formData.emergency_contact_phone?.trim()
  );

  const photo = getPhotoUrl(child.photo_url);

  return (
    <div className={`p-4 sm:p-5 rounded-2xl border transition-all duration-200 ${
      isComplete 
        ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/50' 
        : 'bg-white dark:bg-gray-800/90 border-slate-200 dark:border-gray-700 shadow-sm'
    }`}>
      {/* En-tête Enfant */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-4 border-b border-gray-100 dark:border-gray-700/60">
        <div className="flex items-center gap-3">
          <div className="relative">
            {photo ? (
              <img
                src={photo}
                alt={`${child.first_name} ${child.last_name}`}
                className="w-12 h-12 rounded-full object-cover border-2 border-white dark:border-gray-700 shadow-sm"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-500 to-primary-500 flex items-center justify-center text-white font-bold text-base shadow-sm">
                {child.first_name?.[0] || 'E'}
              </div>
            )}
            <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center text-[9px] ${
              child.gender === 'female' ? 'bg-pink-500 text-white' : 'bg-blue-500 text-white'
            }`}>
              {child.gender === 'female' ? '♀' : '♂'}
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-bold text-gray-900 dark:text-white text-base">
                {child.first_name} {child.last_name}
              </h4>
              {child.age !== undefined && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-medium">
                  {child.age} {isRTL ? 'سنوات' : 'ans'}
                </span>
              )}
            </div>

            {/* Email de connexion du compte parent si existant */}
            <div className="flex items-center gap-2 mt-1">
              {child.parent_email && !child.parent_email.includes('@noemail.') ? (
                <span className="inline-flex items-center gap-1 text-xs text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-md font-mono" dir="ltr">
                  <Mail className="w-3 h-3 text-indigo-500" />
                  {child.parent_email}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md">
                  {isRTL ? 'بدون بريد إلكتروني مسجل' : 'Sans email de connexion'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Badge d'état de la fiche */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          {isComplete ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              {isRTL ? 'بيانات كاملة' : 'Complet'}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              {isRTL ? 'بيانات غير مكتملة' : 'À compléter'}
            </span>
          )}
        </div>
      </div>

      {/* Choix du titulaire du compte (pour les parents qui ont un compte email) */}
      <div className="mb-4 bg-slate-50 dark:bg-gray-900/60 p-3 rounded-xl border border-slate-200/80 dark:border-gray-700/60">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            {isRTL ? 'صاحب الحساب الرئيسي للاتصال والدخول :' : 'Titulaire du compte de connexion :'}
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleChange('account_holder', 'father')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                formData.account_holder === 'father'
                  ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-500/20'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-100'
              }`}
            >
              <span>👨</span>
              <span>{isRTL ? 'الأب' : 'Le Père'}</span>
              {formData.account_holder === 'father' && <Check className="w-3 h-3" />}
            </button>
            <button
              type="button"
              onClick={() => handleChange('account_holder', 'mother')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                formData.account_holder === 'mother'
                  ? 'bg-pink-600 text-white shadow-sm ring-2 ring-pink-500/20'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-100'
              }`}
            >
              <span>👩</span>
              <span>{isRTL ? 'الأم' : 'La Mère'}</span>
              {formData.account_holder === 'mother' && <Check className="w-3 h-3" />}
            </button>
          </div>
        </div>
      </div>

      {/* Grille : Père / Mère / Contact d'urgence */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
        {/* BLOC 1 : PÈRE */}
        <div className={`p-3.5 rounded-xl border transition-all ${
          formData.account_holder === 'father'
            ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/50'
            : 'bg-gray-50/70 dark:bg-gray-900/40 border-gray-200/70 dark:border-gray-700/60'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-blue-800 dark:text-blue-300 flex items-center gap-1">
              <span>👨</span>
              <span>{isRTL ? 'بيانات الأب' : 'Coordonnées du Père'}</span>
            </span>
            {formData.account_holder === 'father' && (
              <span className="text-[10px] font-semibold text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/50 px-1.5 py-0.5 rounded">
                {isRTL ? 'صاحب الحساب' : 'Titulaire'}
              </span>
            )}
          </div>
          <div className="space-y-2">
            <div>
              <label className="block text-[11px] font-medium text-gray-600 dark:text-gray-400 mb-0.5">
                {isRTL ? 'الاسم الكامل للأب' : 'Nom complet du père'}
              </label>
              <input
                type="text"
                value={formData.father_name}
                onChange={(e) => handleChange('father_name', e.target.value)}
                placeholder={isRTL ? 'الاسم واللقب' : 'Prénom et nom'}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-gray-600 dark:text-gray-400 mb-0.5">
                {isRTL ? 'رقم هاتف الأب' : 'Téléphone père'}
              </label>
              <div className="relative">
                <Phone className="w-3 h-3 absolute left-2.5 top-2.5 text-gray-400" />
                <input
                  type="tel"
                  dir="ltr"
                  value={formData.father_phone}
                  onChange={(e) => handleChange('father_phone', e.target.value)}
                  placeholder="+216 00 000 000"
                  className="w-full pl-7 pr-2.5 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500 font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* BLOC 2 : MÈRE */}
        <div className={`p-3.5 rounded-xl border transition-all ${
          formData.account_holder === 'mother'
            ? 'bg-pink-50/50 dark:bg-pink-950/20 border-pink-200 dark:border-pink-900/50'
            : 'bg-gray-50/70 dark:bg-gray-900/40 border-gray-200/70 dark:border-gray-700/60'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-pink-800 dark:text-pink-300 flex items-center gap-1">
              <span>👩</span>
              <span>{isRTL ? 'بيانات الأم' : 'Coordonnées de la Mère'}</span>
            </span>
            {formData.account_holder === 'mother' && (
              <span className="text-[10px] font-semibold text-pink-700 dark:text-pink-300 bg-pink-100 dark:bg-pink-900/50 px-1.5 py-0.5 rounded">
                {isRTL ? 'صاحبة الحساب' : 'Titulaire'}
              </span>
            )}
          </div>
          <div className="space-y-2">
            <div>
              <label className="block text-[11px] font-medium text-gray-600 dark:text-gray-400 mb-0.5">
                {isRTL ? 'الاسم الكامل للأم' : 'Nom complet de la mère'}
              </label>
              <input
                type="text"
                value={formData.mother_name}
                onChange={(e) => handleChange('mother_name', e.target.value)}
                placeholder={isRTL ? 'الاسم واللقب' : 'Prénom et nom'}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-1 focus:ring-pink-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-gray-600 dark:text-gray-400 mb-0.5">
                {isRTL ? 'رقم هاتف الأم' : 'Téléphone mère'}
              </label>
              <div className="relative">
                <Phone className="w-3 h-3 absolute left-2.5 top-2.5 text-gray-400" />
                <input
                  type="tel"
                  dir="ltr"
                  value={formData.mother_phone}
                  onChange={(e) => handleChange('mother_phone', e.target.value)}
                  placeholder="+216 00 000 000"
                  className="w-full pl-7 pr-2.5 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-1 focus:ring-pink-500 font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* BLOC 3 : CONTACT D'URGENCE */}
        <div className="p-3.5 rounded-xl border bg-orange-50/40 dark:bg-orange-950/20 border-orange-200/70 dark:border-orange-900/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-orange-800 dark:text-orange-300 flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5 text-orange-600" />
              <span>{isRTL ? 'جهة اتصال الطوارئ' : 'Contact d\'Urgence'}</span>
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleCopyFatherToEmergency}
                title={isRTL ? 'نسخ من الأب' : 'Copier depuis le Père'}
                className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 font-medium"
              >
                {isRTL ? 'الأب' : 'Père'}
              </button>
              <button
                type="button"
                onClick={handleCopyMotherToEmergency}
                title={isRTL ? 'نسخ من الأم' : 'Copier depuis la Mère'}
                className="text-[10px] px-1.5 py-0.5 rounded bg-pink-100 hover:bg-pink-200 dark:bg-pink-900/40 text-pink-800 dark:text-pink-200 font-medium"
              >
                {isRTL ? 'الأم' : 'Mère'}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <div>
              <label className="block text-[11px] font-medium text-gray-600 dark:text-gray-400 mb-0.5">
                {isRTL ? 'اسم جهة الطوارئ' : 'Nom du contact'}
              </label>
              <input
                type="text"
                value={formData.emergency_contact_name}
                onChange={(e) => handleChange('emergency_contact_name', e.target.value)}
                placeholder={isRTL ? 'الاسم أو القرابة' : 'Ex: Grand-mère, Père...'}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-1 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-gray-600 dark:text-gray-400 mb-0.5">
                {isRTL ? 'هاتف الطوارئ' : 'Téléphone urgence'}
              </label>
              <div className="relative">
                <Phone className="w-3 h-3 absolute left-2.5 top-2.5 text-gray-400" />
                <input
                  type="tel"
                  dir="ltr"
                  value={formData.emergency_contact_phone}
                  onChange={(e) => handleChange('emergency_contact_phone', e.target.value)}
                  placeholder="+216 00 000 000"
                  className="w-full pl-7 pr-2.5 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-1 focus:ring-orange-500 font-mono"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Barre d'action d'enregistrement pour cet enfant */}
      <div className="mt-3.5 pt-3 border-t border-gray-100 dark:border-gray-700/60 flex items-center justify-between">
        <div className="text-[11px] text-gray-500 dark:text-gray-400">
          {justSaved && (
            <span className="text-emerald-600 dark:text-emerald-400 font-medium inline-flex items-center gap-1">
              <Check className="w-3.5 h-3.5" />
              {isRTL ? 'تم حفظ بيانات هذا الطفل بنجاح' : 'Données enregistrées avec succès'}
            </span>
          )}
        </div>

        <Button
          size="sm"
          onClick={handleSave}
          disabled={saving}
          className={`${
            justSaved
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
              : 'bg-primary-600 hover:bg-primary-700 text-white'
          } px-4 text-xs font-semibold shadow-sm`}
        >
          {saving ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5 rtl:mr-0 rtl:ml-1.5" />
          ) : justSaved ? (
            <Check className="w-3.5 h-3.5 mr-1.5 rtl:mr-0 rtl:ml-1.5" />
          ) : (
            <Save className="w-3.5 h-3.5 mr-1.5 rtl:mr-0 rtl:ml-1.5" />
          )}
          <span>
            {saving
              ? (isRTL ? 'جاري الحفظ...' : 'Enregistrement...')
              : justSaved
              ? (isRTL ? 'محفوظ بنجاح' : 'Enregistré')
              : (isRTL ? 'حفظ بيانات الطفل' : 'Enregistrer cet enfant')}
          </span>
        </Button>
      </div>
    </div>
  );
};

export default function QuickParentsModal({
  isOpen,
  onClose,
  childrenList = [],
  onChildUpdated,
  isRTL
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'incomplete', 'complete'

  // Filtrage des enfants
  const filteredChildren = useMemo(() => {
    return childrenList.filter(child => {
      // Filtre texte
      const q = searchTerm.trim().toLowerCase();
      const matchText = !q || (
        (child.first_name || '').toLowerCase().includes(q) ||
        (child.last_name || '').toLowerCase().includes(q) ||
        (child.father_name || '').toLowerCase().includes(q) ||
        (child.mother_name || '').toLowerCase().includes(q) ||
        (child.parent_email || '').toLowerCase().includes(q)
      );

      if (!matchText) return false;

      // Filtre onglet
      const complete = isChildComplete(child);
      if (activeTab === 'incomplete') return !complete;
      if (activeTab === 'complete') return complete;
      return true;
    });
  }, [childrenList, searchTerm, activeTab]);

  const stats = useMemo(() => {
    const total = childrenList.length;
    const complete = childrenList.filter(isChildComplete).length;
    const incomplete = total - complete;
    const percent = total > 0 ? Math.round((complete / total) * 100) : 0;
    return { total, complete, incomplete, percent };
  }, [childrenList]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div 
        className="max-w-5xl w-full max-h-[92vh] flex flex-col bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* En-tête de la modale */}
        <div className="px-5 py-4 bg-gradient-to-r from-indigo-600 via-indigo-700 to-primary-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-white/10 rounded-xl backdrop-blur-sm">
              <Users className="w-5 h-5 text-white" />
            </span>
            <div>
              <h3 className="font-bold text-lg sm:text-xl text-white flex items-center gap-2">
                <span>{isRTL ? 'تحديث سريع للأولياء والطوارئ' : '⚡ Saisie rapide Parents & Urgences'}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-white/20 text-white font-normal">
                  {stats.complete}/{stats.total} {isRTL ? 'مكتمل' : 'complétés'}
                </span>
              </h3>
              <p className="text-xs text-indigo-100 mt-0.5">
                {isRTL
                  ? 'إضافة الأب، الأم، أرقام الهواتف، صاحب الحساب وجهة الطوارئ لجميع الأطفال المسجلين'
                  : 'Renseignez facilement le père, la mère, les téléphones, le titulaire du compte et les contacts d\'urgence.'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barre de progression et contrôles */}
        <div className="p-4 bg-slate-50 dark:bg-gray-900/60 border-b border-gray-200 dark:border-gray-700 space-y-3">
          {/* Progression */}
          <div className="flex items-center justify-between text-xs font-semibold text-gray-700 dark:text-gray-300">
            <span>
              {isRTL ? 'معدل اكتمال بيانات الأطفال :' : 'Taux de complétude des dossiers :'} {stats.percent}%
            </span>
            <span className="text-gray-500 dark:text-gray-400">
              {stats.incomplete > 0 
                ? (isRTL ? `${stats.incomplete} طفل بحاجة للتكميل` : `${stats.incomplete} enfant(s) à compléter`)
                : (isRTL ? 'جميع الأطفال مكتملين !' : 'Tous les enfants sont complets !')}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full transition-all duration-500 rounded-full"
              style={{ width: `${stats.percent}%` }}
            />
          </div>

          {/* Recherche & Onglets */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400 rtl:left-auto rtl:right-3" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={isRTL ? 'البحث عن طفل أو ولي أمر...' : 'Rechercher un enfant, un parent, un email...'}
                className="w-full pl-9 pr-3 rtl:pl-3 rtl:pr-9 py-1.5 text-xs rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center gap-1.5 bg-gray-200/80 dark:bg-gray-800 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'all'
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                }`}
              >
                {isRTL ? 'الكل' : 'Tous'} ({stats.total})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('incomplete')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'incomplete'
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'text-amber-700 dark:text-amber-400 hover:text-amber-800'
                }`}
              >
                {isRTL ? 'بحاجة لتكميل' : 'À compléter'} ({stats.incomplete})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('complete')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'complete'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-emerald-700 dark:text-emerald-400 hover:text-emerald-800'
                }`}
              >
                {isRTL ? 'مكتمل' : 'Complets'} ({stats.complete})
              </button>
            </div>
          </div>
        </div>

        {/* Liste défilante des enfants */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {filteredChildren.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
                {searchTerm
                  ? (isRTL ? 'لا توجد نتائج مطابقة لبحثك' : 'Aucun enfant ne correspond à votre recherche')
                  : activeTab === 'incomplete'
                  ? (isRTL ? 'رائع ! جميع الأطفال لديهم بيانات أولياء مكتملة' : 'Félicitations ! Tous les enfants ont des coordonnées complètes')
                  : (isRTL ? 'لا يوجد أطفال' : 'Aucun enfant')}
              </p>
            </div>
          ) : (
            filteredChildren.map((child) => (
              <ChildParentRow
                key={child.id}
                child={child}
                onSaveSuccess={onChildUpdated}
                isRTL={isRTL}
              />
            ))
          )}
        </div>

        {/* Pied de page de la modale */}
        <div className="px-5 py-3 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {isRTL
              ? 'يتم تحديث ومزامنة حسابات الأولياء وقاعدة البيانات بشكل فوري عند الضغط على حفظ.'
              : 'La synchronisation avec la base de données et les comptes de connexion est immédiate.'}
          </p>
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
            {isRTL ? 'إغلاق' : 'Fermer'}
          </Button>
        </div>
      </div>
    </div>
  );
}
