/**
 * AddTreatmentModal - Modal universel pour ajouter un traitement / médicament
 * Utilisé dans /mon-espace/treatments et /mon-espace/child/:id/medical
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Pill, Clock, Calendar, FileText, Loader2 } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import { useTheme } from '../../hooks/useTheme';
import api from '../../services/api';
import toast from 'react-hot-toast';

const AddTreatmentModal = ({
    isOpen,
    onClose,
    onSuccess,
    initialChildId = null,
    childrenList = []
}) => {
    const { isRTL } = useLanguage();
    const { isDark } = useTheme();

    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        child_id: initialChildId || (childrenList.length === 1 ? childrenList[0].id : null),
        medication_name: '',
        dose: '',
        notes: '',
        timing_type: 'interval',
        interval_hours: 4,
        specific_times: [],
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    });

    useEffect(() => {
        if (isOpen) {
            setFormData({
                child_id: initialChildId || (childrenList.length === 1 ? childrenList[0].id : (childrenList[0]?.id || null)),
                medication_name: '',
                dose: '',
                notes: '',
                timing_type: 'interval',
                interval_hours: 4,
                specific_times: [],
                start_date: new Date().toISOString().split('T')[0],
                end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            });
        }
    }, [isOpen, initialChildId, childrenList]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();

        const selectedChildId = formData.child_id || initialChildId;
        if (!selectedChildId) {
            toast.error(isRTL ? 'يرجى تحديد الطفل' : 'Veuillez sélectionner un enfant');
            return;
        }

        if (!formData.medication_name.trim() || !formData.dose.trim()) {
            toast.error(isRTL ? 'يرجى ملء جميع الحقول المطلوبة' : 'Veuillez remplir le nom du médicament et la dose');
            return;
        }

        try {
            setSaving(true);
            const startDate = new Date(formData.start_date);
            const endDate = new Date(formData.end_date);
            const durationDays = Math.max(1, Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1);

            const payload = {
                ...formData,
                child_id: selectedChildId,
                duration_days: durationDays
            };

            const response = await api.post('/api/treatments', payload);

            if (response.data?.success || response.status === 200 || response.status === 201) {
                toast.success(isRTL ? 'تمت إضافة العلاج بنجاح' : 'Traitement ajouté avec succès');
                if (onSuccess) {
                    onSuccess(response.data);
                }
                onClose();
            }
        } catch (error) {
            console.error('Erreur création traitement:', error);
            const msg = error.response?.data?.message || error.response?.data?.error;
            toast.error(msg || (isRTL ? 'خطأ أثناء إضافة العلاج' : 'Erreur lors de la création du traitement'));
        } finally {
            setSaving(false);
        }
    };

    const timingOptions = [
        { value: 'before_meal', label: isRTL ? 'قبل الوجبات' : 'Avant repas' },
        { value: 'after_meal', label: isRTL ? 'بعد الوجبات' : 'Après repas' },
        { value: 'interval', label: isRTL ? 'كل X ساعات' : 'Intervalle' },
        { value: 'specific_times', label: isRTL ? 'أوقات محددة' : 'Heures fixes' },
    ];

    const specificTimeSlots = [
        '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
        '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
    ];

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="w-full max-w-lg rounded-2xl shadow-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 max-h-[90vh] flex flex-col overflow-hidden"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-100 dark:border-gray-700/60 bg-gray-50/50 dark:bg-gray-800">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                                <Pill className="w-5 h-5" />
                            </div>
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                {isRTL ? 'إضافة دواء / علاج جديد' : 'Nouveau médicament / traitement'}
                            </h2>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Formulaire */}
                    <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
                        {/* Sélection enfant si plusieurs enfants et pas d'enfant fixé */}
                        {childrenList.length > 1 && !initialChildId && (
                            <div>
                                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                    {isRTL ? 'الطفل' : 'Enfant'} *
                                </label>
                                <div className="flex gap-2 flex-wrap">
                                    {childrenList.map((child) => (
                                        <button
                                            key={child.id}
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, child_id: child.id }))}
                                            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors border ${
                                                formData.child_id === child.id
                                                    ? 'bg-purple-600 border-purple-600 text-white shadow-sm'
                                                    : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                            }`}
                                        >
                                            {child.first_name} {child.last_name || ''}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Médicament */}
                        <div>
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                {isRTL ? 'اسم الدواء' : 'Nom du médicament'} *
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.medication_name}
                                onChange={(e) => setFormData(prev => ({ ...prev, medication_name: e.target.value }))}
                                placeholder={isRTL ? 'مثال: دوليبران، شراب...' : 'Ex: Doliprane sirop, Amoxicilline...'}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/60 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm transition-colors"
                            />
                        </div>

                        {/* Dose */}
                        <div>
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                {isRTL ? 'الجرعة' : 'Dose'} *
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.dose}
                                onChange={(e) => setFormData(prev => ({ ...prev, dose: e.target.value }))}
                                placeholder={isRTL ? 'مثال: 5 مل، ملعقة صغيرة...' : 'Ex: 5 ml (selon poids), 1 cuillère...'}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/60 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm transition-colors"
                            />
                        </div>

                        {/* Moment de prise */}
                        <div>
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                {isRTL ? 'وقت الجرعة' : 'Moment de prise'}
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                {timingOptions.map((option) => (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, timing_type: option.value }))}
                                        className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors border ${
                                            formData.timing_type === option.value
                                                ? 'bg-purple-600 border-purple-600 text-white shadow-sm'
                                                : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                        }`}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Intervalle si type = interval */}
                        {formData.timing_type === 'interval' && (
                            <div>
                                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                    {isRTL ? 'كل كم ساعة؟' : 'Toutes les combien d\'heures ?'}
                                </label>
                                <div className="flex gap-2">
                                    {[2, 3, 4, 6, 8].map((h) => (
                                        <button
                                            key={h}
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, interval_hours: h }))}
                                            className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors border ${
                                                formData.interval_hours === h
                                                    ? 'bg-purple-600 border-purple-600 text-white'
                                                    : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                            }`}
                                        >
                                            {h}h
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Heures spécifiques si type = specific_times */}
                        {formData.timing_type === 'specific_times' && (
                            <div>
                                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                    {isRTL ? 'أوقات الجرعات' : 'Heures des doses'}
                                </label>
                                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                                    {specificTimeSlots.map((time) => {
                                        const isSelected = formData.specific_times.includes(time);
                                        return (
                                            <button
                                                key={time}
                                                type="button"
                                                onClick={() => {
                                                    const times = isSelected
                                                        ? formData.specific_times.filter(t => t !== time)
                                                        : [...formData.specific_times, time].sort();
                                                    setFormData(prev => ({ ...prev, specific_times: times }));
                                                }}
                                                className={`py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                                                    isSelected
                                                        ? 'bg-purple-600 border-purple-600 text-white'
                                                        : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                                }`}
                                            >
                                                {time}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Dates début et fin */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                    {isRTL ? 'تاريخ البدء' : 'Date de début'}
                                </label>
                                <input
                                    type="date"
                                    required
                                    value={formData.start_date}
                                    onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/60 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                    {isRTL ? 'تاريخ الانتهاء' : 'Date de fin'}
                                </label>
                                <input
                                    type="date"
                                    required
                                    value={formData.end_date}
                                    onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                                    min={formData.start_date}
                                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/60 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
                                />
                            </div>
                        </div>

                        {/* Instructions / Notes pour le personnel */}
                        <div>
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                {isRTL ? 'ملاحظات وتعليمات للمربيات' : 'Instructions & notes pour le staff'}
                            </label>
                            <textarea
                                value={formData.notes}
                                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                                placeholder={isRTL ? 'تعليمات خاصة، في الثلاجة، مع كوب ماء...' : 'Consignes particulières (au frais, avec un verre d\'eau, etc.)...'}
                                rows={2}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/60 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm transition-colors resize-none"
                            />
                        </div>

                        {/* Boutons d'action */}
                        <div className="pt-2 flex items-center justify-end gap-3 border-t border-gray-100 dark:border-gray-700/60">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={saving}
                                className="px-4 py-2.5 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            >
                                {isRTL ? 'إلغاء' : 'Annuler'}
                            </button>
                            <button
                                type="submit"
                                disabled={saving}
                                className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-purple-600 hover:bg-purple-700 text-white shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50"
                            >
                                {saving ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>{isRTL ? 'جاري الحفظ...' : 'Enregistrement...'}</span>
                                    </>
                                ) : (
                                    <span>{isRTL ? 'إضافة العلاج' : 'Ajouter le traitement'}</span>
                                )}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default AddTreatmentModal;
