/**
 * ChildMedicalPage - Gestion des données médicales d'un enfant
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft,
    Stethoscope,
    AlertTriangle,
    Pill,
    Heart,
    Plus,
    X,
    Save,
    Trash2,
    Edit
} from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import useIsMobile from '../../hooks/useIsMobile';
import MobileNavigation from '../../components/mobile/MobileNavigation';
import AddTreatmentModal from '../../components/modals/AddTreatmentModal';
import api from '../../services/api';
import toast from 'react-hot-toast';

const ChildMedicalPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isRTL } = useLanguage();
    const isMobile = useIsMobile();
    const [child, setChild] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [treatments, setTreatments] = useState([]);
    const [showTreatmentModal, setShowTreatmentModal] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [modalType, setModalType] = useState(null); // 'allergy', 'condition'
    const [formData, setFormData] = useState({ name: '', description: '', severity: 'low' });
    const [medicalData, setMedicalData] = useState({
        allergies: [],
        medications: [],
        conditions: [],
        blood_type: '',
        doctor_name: '',
        doctor_phone: '',
        notes: ''
    });

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        loadData();
    }, [id]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [childRes, medicalRes, treatmentsRes] = await Promise.all([
                api.get(`/api/children/${id}`),
                api.get(`/api/children/${id}/medical`).catch(() => ({ data: null })),
                api.get(`/api/treatments/my-children?child_id=${id}`).catch(() => ({ data: { treatments: [] } }))
            ]);

            if (childRes.data) {
                setChild(childRes.data.child || childRes.data);
            }

            if (medicalRes.data) {
                setMedicalData(prev => ({
                    ...prev,
                    ...medicalRes.data
                }));
            }

            if (treatmentsRes.data?.treatments) {
                setTreatments(treatmentsRes.data.treatments);
            }
        } catch (err) {
            console.error('Erreur chargement:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            await api.put(`/api/children/${id}/medical`, medicalData);
            toast.success(isRTL ? 'تم حفظ البيانات بنجاح' : 'Données médicales enregistrées');
        } catch (err) {
            console.error('Erreur sauvegarde:', err);
            toast.error(isRTL ? 'خطأ أثناء الحفظ' : 'Erreur lors de la sauvegarde');
        } finally {
            setSaving(false);
        }
    };

    const handleCancelTreatment = async (treatmentId) => {
        if (!window.confirm(isRTL ? 'هل تريد إلغاء هذا العلاج فعلاً؟' : 'Voulez-vous vraiment annuler ce traitement ?')) {
            return;
        }
        try {
            await api.delete(`/api/treatments/${treatmentId}`);
            toast.success(isRTL ? 'تم إلغاء العلاج' : 'Traitement annulé');
            loadData();
        } catch (error) {
            console.error('Erreur annulation traitement:', error);
            toast.error(isRTL ? 'خطأ أثناء الإلغاء' : 'Erreur lors de l\'annulation');
        }
    };

    const getTimingLabel = (type, hours) => {
        switch (type) {
            case 'before_meal': return isRTL ? 'قبل الوجبات' : 'Avant repas';
            case 'after_meal': return isRTL ? 'بعد الوجبات' : 'Après repas';
            case 'interval': return isRTL ? `كل ${hours} ساعات` : `Toutes les ${hours}h`;
            case 'specific_times': return isRTL ? 'أوقات محددة' : 'Heures fixes';
            default: return type;
        }
    };

    const handleAddItem = () => {
        if (!formData.name.trim()) return;

        const newItem = {
            id: Date.now(),
            name: formData.name,
            description: formData.description,
            severity: formData.severity
        };

        setMedicalData(prev => ({
            ...prev,
            [modalType === 'allergy' ? 'allergies' : 'conditions']: [
                ...prev[modalType === 'allergy' ? 'allergies' : 'conditions'],
                newItem
            ]
        }));

        setFormData({ name: '', description: '', severity: 'low' });
        setShowAddModal(false);
    };

    const handleRemoveItem = (type, itemId) => {
        const key = type === 'allergy' ? 'allergies' : 'conditions';
        setMedicalData(prev => ({
            ...prev,
            [key]: prev[key].filter(item => item.id !== itemId)
        }));
    };

    const openAddModal = (type) => {
        setModalType(type);
        setFormData({ name: '', description: '', severity: 'low' });
        setShowAddModal(true);
    };

    const getSeverityColor = (severity) => {
        switch (severity) {
            case 'high': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
            case 'medium': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
            default: return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
        }
    };

    if (loading) {
        return (
            <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center ${isMobile ? 'pb-24' : ''}`}>
                <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 ${isMobile ? 'pb-24' : ''}`}>
            <div className="max-w-2xl mx-auto px-4 py-6">
                {/* Header */}
                {!isMobile && (
                    <button
                        onClick={() => navigate('/mon-espace')}
                        className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span>{isRTL ? 'العودة' : 'Retour'}</span>
                    </button>
                )}

                {/* Titre */}
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                        <Stethoscope className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                            {isRTL ? 'البيانات الطبية' : 'Données médicales'}
                        </h1>
                        {child && (
                            <p className="text-gray-500">
                                {child.first_name} {child.last_name}
                            </p>
                        )}
                    </div>
                </div>

                {/* Allergies */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 mb-4"
                >
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-orange-500" />
                            {isRTL ? 'الحساسية' : 'Allergies'}
                        </h2>
                        <button
                            onClick={() => openAddModal('allergy')}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                        >
                            <Plus className="w-5 h-5 text-primary-600" />
                        </button>
                    </div>

                    {medicalData.allergies.length === 0 ? (
                        <p className="text-gray-500 text-sm text-center py-4">
                            {isRTL ? 'لا توجد حساسية مسجلة' : 'Aucune allergie enregistrée'}
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {medicalData.allergies.map(allergy => (
                                <div key={allergy.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(allergy.severity)}`}>
                                            {allergy.severity === 'high' ? '!' : allergy.severity === 'medium' ? '~' : '•'}
                                        </span>
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-white">{allergy.name}</p>
                                            {allergy.description && (
                                                <p className="text-sm text-gray-500">{allergy.description}</p>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleRemoveItem('allergy', allergy.id)}
                                        className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </motion.div>

                {/* Médicaments & Traitements */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 mb-4"
                >
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            <Pill className="w-5 h-5 text-blue-500" />
                            {isRTL ? 'الأدوية والعلاجات' : 'Médicaments & Traitements'}
                        </h2>
                        <button
                            onClick={() => setShowTreatmentModal(true)}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-primary-600"
                            title={isRTL ? 'إضافة علاج / دواء' : 'Ajouter un traitement / médicament'}
                        >
                            <Plus className="w-5 h-5" />
                        </button>
                    </div>

                    {treatments.length === 0 ? (
                        <p className="text-gray-500 text-sm text-center py-4">
                            {isRTL ? 'لا توجد أدوية أو علاجات مسجلة' : 'Aucun médicament ou traitement enregistré'}
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {treatments.map(t => (
                                <div key={t.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg flex flex-col gap-2">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-white">{t.medication_name}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                {t.dose} • {getTimingLabel(t.timing_type, t.interval_hours)}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                                t.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                t.status === 'completed' ? 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' :
                                                'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                            }`}>
                                                {t.status === 'active' ? (isRTL ? 'نشط' : 'Actif') :
                                                 t.status === 'completed' ? (isRTL ? 'مكتمل' : 'Terminé') :
                                                 (isRTL ? 'ملغى' : 'Annulé')}
                                            </span>
                                            {t.status === 'active' && (
                                                <button
                                                    onClick={() => handleCancelTreatment(t.id)}
                                                    className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                                    title={isRTL ? 'إلغاء' : 'Annuler'}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    {t.notes && (
                                        <p className="text-xs text-gray-500 italic">📝 {t.notes}</p>
                                    )}
                                    <div className="text-[11px] text-gray-400 flex items-center gap-1">
                                        <span>📅 {new Date(t.start_date).toLocaleDateString('fr-FR')} → {new Date(t.end_date).toLocaleDateString('fr-FR')}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </motion.div>

                {/* Conditions médicales */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 mb-4"
                >
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            <Heart className="w-5 h-5 text-red-500" />
                            {isRTL ? 'الحالات الطبية' : 'Conditions médicales'}
                        </h2>
                        <button
                            onClick={() => openAddModal('condition')}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                        >
                            <Plus className="w-5 h-5 text-primary-600" />
                        </button>
                    </div>

                    {medicalData.conditions.length === 0 ? (
                        <p className="text-gray-500 text-sm text-center py-4">
                            {isRTL ? 'لا توجد حالات طبية' : 'Aucune condition médicale'}
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {medicalData.conditions.map(cond => (
                                <div key={cond.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                    <div>
                                        <p className="font-medium text-gray-900 dark:text-white">{cond.name}</p>
                                        {cond.description && (
                                            <p className="text-sm text-gray-500">{cond.description}</p>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => handleRemoveItem('condition', cond.id)}
                                        className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </motion.div>

                {/* Notes médicales */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 mb-6"
                >
                    <h2 className="font-semibold text-gray-900 dark:text-white mb-3">
                        {isRTL ? 'ملاحظات طبية' : 'Notes médicales'}
                    </h2>
                    <textarea
                        value={medicalData.notes}
                        onChange={(e) => setMedicalData(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder={isRTL ? 'أضف ملاحظات...' : 'Ajouter des notes...'}
                        className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                        rows={3}
                    />
                </motion.div>

                {/* Bouton sauvegarder */}
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                >
                    <Save className="w-5 h-5" />
                    {saving ? (isRTL ? 'جاري الحفظ...' : 'Enregistrement...') : (isRTL ? 'حفظ التغييرات' : 'Enregistrer')}
                </button>
            </div>

            {/* Modal Ajout */}
            <AnimatePresence>
                {showAddModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
                        onClick={() => setShowAddModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-gray-900 dark:text-white">
                                    {modalType === 'allergy' ? (isRTL ? 'إضافة حساسية' : 'Ajouter une allergie') :
                                        (isRTL ? 'إضافة حالة طبية' : 'Ajouter une condition')}
                                </h3>
                                <button onClick={() => setShowAddModal(false)}>
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        {isRTL ? 'الاسم' : 'Nom'} *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                        className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        placeholder={modalType === 'allergy' ? 'Ex: Arachides' : 'Ex: Asthme'}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        {isRTL ? 'الوصف' : 'Description'}
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.description}
                                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                        className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        placeholder={isRTL ? 'تفاصيل إضافية...' : 'Détails supplémentaires...'}
                                    />
                                </div>

                                {modalType === 'allergy' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            {isRTL ? 'الخطورة' : 'Sévérité'}
                                        </label>
                                        <select
                                            value={formData.severity}
                                            onChange={(e) => setFormData(prev => ({ ...prev, severity: e.target.value }))}
                                            className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        >
                                            <option value="low">{isRTL ? 'منخفضة' : 'Faible'}</option>
                                            <option value="medium">{isRTL ? 'متوسطة' : 'Moyenne'}</option>
                                            <option value="high">{isRTL ? 'عالية' : 'Élevée'}</option>
                                        </select>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl font-medium"
                                >
                                    {isRTL ? 'إلغاء' : 'Annuler'}
                                </button>
                                <button
                                    onClick={handleAddItem}
                                    className="flex-1 py-3 bg-primary-600 text-white rounded-xl font-medium"
                                >
                                    {isRTL ? 'إضافة' : 'Ajouter'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Modal Universel Traitement / Médicament */}
            <AddTreatmentModal
                isOpen={showTreatmentModal}
                onClose={() => setShowTreatmentModal(false)}
                onSuccess={() => loadData()}
                initialChildId={id ? parseInt(id, 10) : null}
                childrenList={child ? [child] : []}
            />

            {isMobile && <MobileNavigation />}
        </div>
    );
};

export default ChildMedicalPage;
