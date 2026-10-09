/**
 * ChildEmergencyContactsPage - Gestion des contacts et des personnes de confiance
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft,
    Phone,
    User,
    Plus,
    X,
    Save,
    Trash2,
    Edit,
    UserCheck,
    AlertCircle,
    ShieldCheck,
    Users,
    AlertTriangle
} from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import useIsMobile from '../../hooks/useIsMobile';
import MobileNavigation from '../../components/mobile/MobileNavigation';
import { useDialogContext } from '../../contexts/DialogContext';
import api from '../../services/api';

const ChildEmergencyContactsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isRTL } = useLanguage();
    const isMobile = useIsMobile();
    const dialog = useDialogContext();

    const [child, setChild] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Coordonnées parents
    const [parentPhone, setParentPhone] = useState('');
    const [parentGender, setParentGender] = useState('male');
    const [secondParentName, setSecondParentName] = useState('');
    const [secondParentPhone, setSecondParentPhone] = useState('');

    // Contact d'urgence
    const [emergencyChoice, setEmergencyChoice] = useState('custom'); // 'father' | 'mother' | 'custom'
    const [emergencyName, setEmergencyName] = useState('');
    const [emergencyPhone, setEmergencyPhone] = useState('');

    // Personnes de confiance (max 2)
    const [trustedContacts, setTrustedContacts] = useState([]);
    const [showTrustedModal, setShowTrustedModal] = useState(false);
    const [editingTrustedIndex, setEditingTrustedIndex] = useState(null);
    const [trustedFormData, setTrustedFormData] = useState({
        name: '',
        phone: '',
        relation: ''
    });

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        loadData();
    }, [id]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [childRes, contactsRes] = await Promise.all([
                api.get(`/api/children/${id}`),
                api.get(`/api/children/${id}/emergency-contacts`).catch(() => ({ data: {} }))
            ]);

            if (childRes.data) {
                setChild(childRes.data.child || childRes.data);
            }

            const cData = contactsRes.data || {};
            setParentPhone(cData.parent_phone || childRes.data?.parent_phone || '');
            setParentGender(cData.parent_gender || childRes.data?.parent_gender || 'male');
            setSecondParentName(cData.second_parent_name || childRes.data?.second_parent_name || '');
            setSecondParentPhone(cData.second_parent_phone || childRes.data?.second_parent_phone || '');

            setEmergencyChoice(cData.emergency_contact_choice || childRes.data?.emergency_contact_choice || 'custom');
            setEmergencyName(cData.emergency_contact_name || childRes.data?.emergency_contact_name || '');
            setEmergencyPhone(cData.emergency_contact_phone || childRes.data?.emergency_contact_phone || '');

            const trusted = Array.isArray(cData.trusted_contacts) 
                ? cData.trusted_contacts 
                : (Array.isArray(childRes.data?.trusted_contacts) ? childRes.data.trusted_contacts : []);
            setTrustedContacts(trusted);
        } catch (err) {
            console.error('Erreur chargement:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveAll = async () => {
        try {
            setSaving(true);
            const payload = {
                parent_phone: parentPhone.trim(),
                second_parent_name: secondParentName.trim(),
                second_parent_phone: secondParentPhone.trim(),
                emergency_contact_choice: emergencyChoice,
                emergency_contact_name: emergencyChoice === 'custom' ? emergencyName.trim() : '',
                emergency_contact_phone: emergencyChoice === 'custom' ? emergencyPhone.trim() : '',
                trusted_contacts: trustedContacts.slice(0, 2)
            };

            await api.put(`/api/children/${id}/emergency-contacts`, payload);
            dialog.success(
                isRTL
                    ? 'تم حفظ وسائل الاتصال وجهات الثقة بنجاح'
                    : 'Coordonnées et personnes de confiance enregistrées avec succès'
            );
        } catch (err) {
            console.error('Erreur sauvegarde:', err);
            dialog.error(
                err.response?.data?.error || 
                (isRTL ? 'خطأ أثناء حفظ البيانات' : 'Erreur lors de l\'enregistrement')
            );
        } finally {
            setSaving(false);
        }
    };

    // Gestion du modal personne de confiance
    const handleOpenAddTrusted = () => {
        if (trustedContacts.length >= 2) {
            dialog.info(
                isRTL
                    ? 'الحد الأقصى هو شخصين موثوقين فقط. يرجى حذف شخص لإضافة غيره.'
                    : 'Le maximum autorisé est de 2 personnes de confiance. Veuillez en supprimer une pour en ajouter une autre.'
            );
            return;
        }
        setTrustedFormData({ name: '', phone: '', relation: '' });
        setEditingTrustedIndex(null);
        setShowTrustedModal(true);
    };

    const handleOpenEditTrusted = (contact, index) => {
        setTrustedFormData({
            name: typeof contact === 'string' ? contact : (contact.name || ''),
            phone: typeof contact === 'object' ? (contact.phone || '') : '',
            relation: typeof contact === 'object' ? (contact.relation || '') : ''
        });
        setEditingTrustedIndex(index);
        setShowTrustedModal(true);
    };

    const handleSaveTrustedContact = () => {
        if (!trustedFormData.name.trim()) return;

        const newContact = {
            id: editingTrustedIndex !== null ? (trustedContacts[editingTrustedIndex]?.id || Date.now()) : Date.now(),
            name: trustedFormData.name.trim(),
            phone: trustedFormData.phone.trim(),
            relation: trustedFormData.relation.trim()
        };

        if (editingTrustedIndex !== null) {
            setTrustedContacts(prev => prev.map((c, i) => i === editingTrustedIndex ? newContact : c));
        } else {
            if (trustedContacts.length >= 2) return;
            setTrustedContacts(prev => [...prev, newContact]);
        }

        setShowTrustedModal(false);
        setEditingTrustedIndex(null);
        setTrustedFormData({ name: '', phone: '', relation: '' });
    };

    const handleRemoveTrusted = (index) => {
        setTrustedContacts(prev => prev.filter((_, i) => i !== index));
    };

    if (loading) {
        return (
            <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center ${isMobile ? 'pb-24' : ''}`}>
                <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const isFather = parentGender === 'male';
    const firstParentLabel = isFather ? (isRTL ? 'الأب (حسابك)' : 'Père (Votre compte)') : (isRTL ? 'الأم (حسابك)' : 'Mère (Votre compte)');
    const secondParentLabel = isFather ? (isRTL ? 'الأم (الطرف الثاني)' : 'Mère (2ème parent)') : (isRTL ? 'الأب (الطرف الثاني)' : 'Père (2ème parent)');

    return (
        <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 ${isMobile ? 'pb-28' : 'pb-16'}`}>
            <div className="max-w-2xl mx-auto px-4 py-6">
                {/* Header */}
                {!isMobile && (
                    <button
                        onClick={() => navigate('/mon-espace')}
                        className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 rtl:rotate-180" />
                        <span>{isRTL ? 'العودة إلى فضاء الولي' : 'Retour à mon espace'}</span>
                    </button>
                )}

                {/* Titre */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 shadow-sm">
                            <Users className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                                {isRTL ? 'الاتصال وجهات الثقة' : 'Contacts & Personnes de confiance'}
                            </h1>
                            {child && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                    {child.first_name} {child.last_name}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Avertissement général */}
                <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 rounded-2xl p-4 mb-6">
                    <div className="flex gap-3">
                        <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                        <p className="text-xs sm:text-sm text-blue-800 dark:text-blue-300 leading-relaxed">
                            {isRTL
                                ? 'هذه البيانات تتيح لفريق الحضانة الاتصال بكم في حالات الطوارئ وتحديد الأشخاص المخولين قانونياً باستلام طفلكم عند انتهاء اليوم (شخصين كحد أقصى).'
                                : 'Ces informations permettent à la crèche de vous joindre immédiatement en cas d\'urgence et d\'autoriser jusqu\'à 2 personnes de confiance à récupérer votre enfant le soir.'
                            }
                        </p>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* SECTION 1 : TÉLÉPHONES DES PARENTS */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
                        <h2 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4 pb-2 border-b border-gray-100 dark:border-gray-700">
                            <Phone className="w-4 h-4 text-green-500" />
                            {isRTL ? 'أرقام هواتف الأولياء' : 'Téléphones des parents'}
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    {firstParentLabel} *
                                </label>
                                <input
                                    type="tel"
                                    value={parentPhone}
                                    onChange={(e) => setParentPhone(e.target.value)}
                                    placeholder="+216 00 000 000"
                                    className="w-full p-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    dir="ltr"
                                />
                            </div>

                            <div className="pt-2 border-t border-gray-100 dark:border-gray-700/60">
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    {secondParentLabel} ({isRTL ? 'اختياري' : 'Optionnel'})
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <input
                                        type="text"
                                        value={secondParentName}
                                        onChange={(e) => setSecondParentName(e.target.value)}
                                        placeholder={isRTL ? 'الاسم واللقب' : 'Nom et prénom'}
                                        className="w-full p-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    />
                                    <input
                                        type="tel"
                                        value={secondParentPhone}
                                        onChange={(e) => setSecondParentPhone(e.target.value)}
                                        placeholder="+216 00 000 000"
                                        className="w-full p-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                        dir="ltr"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SECTION 2 : PRIORITÉ ET CONTACT D'URGENCE */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
                        <h2 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-3 pb-2 border-b border-gray-100 dark:border-gray-700">
                            <AlertTriangle className="w-4 h-4 text-orange-500" />
                            {isRTL ? 'جهة الاتصال في حالات الطوارئ' : 'Contact prioritaire d\'urgence'}
                        </h2>

                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                            {isRTL
                                ? 'في حال حدوث طارئ صحي أو استعجالي، من يتصل به الفريق أولاً؟'
                                : 'Qui doit être contacté en priorité absolue en cas d\'urgence ?'
                            }
                        </p>

                        <div className="grid grid-cols-3 gap-2.5 mb-4">
                            <button
                                type="button"
                                onClick={() => setEmergencyChoice('father')}
                                className={`p-3 rounded-xl border text-xs font-medium text-center transition-all ${
                                    emergencyChoice === 'father'
                                        ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-950/40 dark:text-primary-300 font-semibold ring-2 ring-primary-500/20'
                                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300'
                                }`}
                            >
                                {isRTL ? 'الأب' : 'Le Père'}
                            </button>
                            <button
                                type="button"
                                onClick={() => setEmergencyChoice('mother')}
                                className={`p-3 rounded-xl border text-xs font-medium text-center transition-all ${
                                    emergencyChoice === 'mother'
                                        ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-950/40 dark:text-primary-300 font-semibold ring-2 ring-primary-500/20'
                                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300'
                                }`}
                            >
                                {isRTL ? 'الأم' : 'La Mère'}
                            </button>
                            <button
                                type="button"
                                onClick={() => setEmergencyChoice('custom')}
                                className={`p-3 rounded-xl border text-xs font-medium text-center transition-all ${
                                    emergencyChoice === 'custom'
                                        ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-950/40 dark:text-primary-300 font-semibold ring-2 ring-primary-500/20'
                                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300'
                                }`}
                            >
                                {isRTL ? 'شخص آخر' : 'Autre tiers'}
                            </button>
                        </div>

                        {emergencyChoice === 'custom' && (
                            <div className="bg-orange-50/60 dark:bg-orange-950/20 p-4 rounded-xl border border-orange-200/70 dark:border-orange-900/40 space-y-3">
                                <div>
                                    <label className="block text-xs font-medium text-orange-950 dark:text-orange-200 mb-1">
                                        {isRTL ? 'الاسم الكامل لجهة الاتصال' : 'Nom complet du contact d\'urgence'} *
                                    </label>
                                    <input
                                        type="text"
                                        value={emergencyName}
                                        onChange={(e) => setEmergencyName(e.target.value)}
                                        placeholder={isRTL ? 'مثال: الجد، العمة...' : 'Ex: Grand-mère, Oncle...'}
                                        className="w-full p-2.5 text-sm border border-orange-200 dark:border-orange-800 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-orange-950 dark:text-orange-200 mb-1">
                                        {isRTL ? 'رقم الهاتف' : 'Numéro de téléphone'} *
                                    </label>
                                    <input
                                        type="tel"
                                        value={emergencyPhone}
                                        onChange={(e) => setEmergencyPhone(e.target.value)}
                                        placeholder="+216 00 000 000"
                                        className="w-full p-2.5 text-sm border border-orange-200 dark:border-orange-800 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                        dir="ltr"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* SECTION 3 : PERSONNES DE CONFIANCE (MAX 2) */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100 dark:border-gray-700">
                            <div>
                                <h2 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                    <UserCheck className="w-4 h-4 text-emerald-600" />
                                    {isRTL ? 'أشخاص الثقة لاستلام الطفل' : 'Personnes de confiance (Sortie le soir)'}
                                </h2>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                    {isRTL ? '2 كحد أقصى (بخلاف الأولياء)' : '2 personnes autorisées maximum (hors parents)'}
                                </p>
                            </div>
                            <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                                {trustedContacts.length} / 2
                            </span>
                        </div>

                        {trustedContacts.length === 0 ? (
                            <div className="text-center py-6 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50/50 dark:bg-gray-900/30">
                                <UserCheck className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                                    {isRTL
                                        ? 'لم يتم تسجيل أي شخص ثقة بعد. الأولياء فقط مخولون باستلام الطفل.'
                                        : 'Aucune personne de confiance enregistrée. Seuls les parents sont autorisés.'
                                    }
                                </p>
                                <button
                                    type="button"
                                    onClick={handleOpenAddTrusted}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 rounded-lg transition-colors border border-emerald-200 dark:border-emerald-800"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    {isRTL ? 'إضافة شخص ثقة' : 'Ajouter une personne'}
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-2.5 mb-3">
                                {trustedContacts.slice(0, 2).map((contact, index) => {
                                    const cName = typeof contact === 'string' ? contact : (contact.name || '');
                                    const cPhone = typeof contact === 'object' ? contact.phone : '';
                                    const cRelation = typeof contact === 'object' ? contact.relation : '';

                                    return (
                                        <div
                                            key={index}
                                            className="flex items-center justify-between p-3.5 rounded-xl border border-emerald-200/80 dark:border-emerald-900/40 bg-emerald-50/30 dark:bg-emerald-950/10"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 flex-shrink-0">
                                                    <ShieldCheck className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                                                            {cName}
                                                        </h4>
                                                        {cRelation && (
                                                            <span className="text-[11px] text-gray-500 dark:text-gray-400">
                                                                ({cRelation})
                                                            </span>
                                                        )}
                                                    </div>
                                                    {cPhone && (
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5" dir="ltr">
                                                            {cPhone}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() => handleOpenEditTrusted(contact, index)}
                                                    className="p-1.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg"
                                                    title={isRTL ? 'تعديل' : 'Modifier'}
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveTrusted(index)}
                                                    className="p-1.5 text-red-500 hover:text-red-700 dark:hover:text-red-400 rounded-lg"
                                                    title={isRTL ? 'حذف' : 'Supprimer'}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}

                                {trustedContacts.length < 2 && (
                                    <button
                                        type="button"
                                        onClick={handleOpenAddTrusted}
                                        className="w-full py-2.5 border border-dashed border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 rounded-xl text-xs font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center justify-center gap-1.5"
                                    >
                                        <Plus className="w-4 h-4" />
                                        {isRTL ? 'إضافة الشخص الثاني (الأخير)' : 'Ajouter la 2ème personne autorisée'}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* BOUTON ENREGISTRER */}
                    <div className="sticky bottom-4 z-20">
                        <button
                            type="button"
                            onClick={handleSaveAll}
                            disabled={saving}
                            className="w-full py-3.5 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            <Save className="w-5 h-5" />
                            {saving 
                                ? (isRTL ? 'جاري الحفظ...' : 'Enregistrement...') 
                                : (isRTL ? 'حفظ كافة التغييرات' : 'Enregistrer les modifications')
                            }
                        </button>
                    </div>
                </div>
            </div>

            {/* Modal Ajout/Modification personne de confiance */}
            <AnimatePresence>
                {showTrustedModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                        onClick={() => setShowTrustedModal(false)}
                    >
                        <motion.div
                            initial={{ y: 50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 50, opacity: 0 }}
                            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full sm:max-w-md overflow-hidden"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="p-5">
                                <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-100 dark:border-gray-700">
                                    <h3 className="font-bold text-base text-gray-900 dark:text-white flex items-center gap-2">
                                        <ShieldCheck className="w-5 h-5 text-emerald-600" />
                                        {editingTrustedIndex !== null
                                            ? (isRTL ? 'تعديل شخص الثقة' : 'Modifier la personne de confiance')
                                            : (isRTL ? 'إضافة شخص ثقة جديد' : 'Ajouter une personne de confiance')
                                        }
                                    </h3>
                                    <button 
                                        type="button"
                                        onClick={() => setShowTrustedModal(false)}
                                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="space-y-3.5">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            {isRTL ? 'الاسم واللقب' : 'Nom et prénom'} *
                                        </label>
                                        <input
                                            type="text"
                                            value={trustedFormData.name}
                                            onChange={(e) => setTrustedFormData(prev => ({ ...prev, name: e.target.value }))}
                                            className="w-full p-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                            placeholder="Ex: Marie Dupont"
                                            autoFocus
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            {isRTL ? 'صلة القرابة / العلاقة' : 'Relation / Lien avec l\'enfant'}
                                        </label>
                                        <input
                                            type="text"
                                            value={trustedFormData.relation}
                                            onChange={(e) => setTrustedFormData(prev => ({ ...prev, relation: e.target.value }))}
                                            className="w-full p-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                            placeholder="Ex: Grand-mère, Voisine, Nounou..."
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            {isRTL ? 'رقم الهاتف' : 'Numéro de téléphone'}
                                        </label>
                                        <input
                                            type="tel"
                                            value={trustedFormData.phone}
                                            onChange={(e) => setTrustedFormData(prev => ({ ...prev, phone: e.target.value }))}
                                            className="w-full p-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                            placeholder="+216 00 000 000"
                                            dir="ltr"
                                        />
                                    </div>

                                    <div className="bg-emerald-50 dark:bg-emerald-950/30 p-3 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2">
                                        <ShieldCheck className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-600" />
                                        <span>
                                            {isRTL
                                                ? 'بتسجيل هذا الشخص، أنت تفوضه رسمياً لاستلام طفلك من الحضانة.'
                                                : 'En ajoutant cette personne, vous l\'autorisez formellement à venir chercher votre enfant le soir.'
                                            }
                                        </span>
                                    </div>
                                </div>

                                <div className="flex gap-2.5 mt-5">
                                    <button
                                        type="button"
                                        onClick={() => setShowTrustedModal(false)}
                                        className="flex-1 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-xl text-xs font-medium"
                                    >
                                        {isRTL ? 'إلغاء' : 'Annuler'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleSaveTrustedContact}
                                        disabled={!trustedFormData.name.trim()}
                                        className="flex-1 py-2.5 bg-primary-600 text-white rounded-xl text-xs font-semibold disabled:opacity-50"
                                    >
                                        {editingTrustedIndex !== null
                                            ? (isRTL ? 'تعديل' : 'Modifier')
                                            : (isRTL ? 'إضافة' : 'Ajouter')
                                        }
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {isMobile && <MobileNavigation />}
        </div>
    );
};

export default ChildEmergencyContactsPage;
