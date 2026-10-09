import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    Pill,
    Plus,
    Calendar,
    Clock,
    User,
    ChevronLeft,
    X,
    Check,
    AlertCircle,
    Trash2,
    Edit,
    Baby
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';
import { useTheme } from '../../hooks/useTheme';
import useIsMobile from '../../hooks/useIsMobile';
import api from '../../services/api';
import { Button } from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { toast } from 'react-hot-toast';
import { useDialogContext } from '../../contexts/DialogContext';
import AddTreatmentModal from '../../components/modals/AddTreatmentModal';

const TreatmentsPage = () => {
    const { user } = useAuth();
    const { isRTL, t } = useLanguage();
    const dialog = useDialogContext();
    const { isDark } = useTheme();
    const isMobile = useIsMobile();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [treatments, setTreatments] = useState([]);
    const [children, setChildren] = useState([]);
    const [filter, setFilter] = useState('active');
    const [showModal, setShowModal] = useState(false);

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const [treatmentsRes, childrenRes] = await Promise.all([
                api.get(`/api/treatments/my-children?status=${filter}`),
                api.get('/api/user/children-summary')
            ]);

            if (treatmentsRes.data?.success) {
                setTreatments(treatmentsRes.data.treatments || []);
            }
            if (childrenRes.data?.success) {
                setChildren(childrenRes.data.children || []);
            }
        } catch (error) {
            console.error('Erreur chargement traitements:', error);
            toast.error('Erreur lors du chargement des traitements');
        } finally {
            setLoading(false);
        }
    }, [filter]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleCancel = async (treatmentId) => {
        const confirmed = await dialog.confirm(
            isRTL ? 'هل تريد إلغاء هذا العلاج فعلاً؟' : 'Voulez-vous vraiment annuler ce traitement ?',
            isRTL ? 'تأكيد الإلغاء' : 'Confirmer l\'annulation',
            { type: 'danger', confirmText: isRTL ? 'إلغاء العلاج' : 'Annuler le traitement', cancelText: isRTL ? 'رجوع' : 'Retour' }
        );
        if (!confirmed) return;

        try {
            await api.delete(`/api/treatments/${treatmentId}`);
            toast.success('Traitement annulé');
            loadData();
        } catch (error) {
            toast.error('Erreur lors de l\'annulation');
        }
    };

    const getTimingLabel = (type, hours) => {
        switch (type) {
            case 'before_meal': return isRTL ? 'قبل الوجبات' : 'Avant les repas';
            case 'after_meal': return isRTL ? 'بعد الوجبات' : 'Après les repas';
            case 'interval': return isRTL ? `كل ${hours} ساعات` : `Toutes les ${hours}h`;
            case 'specific_times': return isRTL ? 'أوقات محددة' : 'Heures fixes';
            default: return type;
        }
    };

    const getStatusBadge = (status) => {
        const styles = {
            active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
            completed: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
            cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
        };
        const labels = {
            active: isRTL ? 'نشط' : 'Actif',
            completed: isRTL ? 'مكتمل' : 'Terminé',
            cancelled: isRTL ? 'ملغى' : 'Annulé',
        };
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || styles.active}`}>
                {labels[status] || status}
            </span>
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    return (
        <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'} p-4 md:p-6`}>
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(-1)}
                            className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-200'}`}
                        >
                            <ChevronLeft className={`w-6 h-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`} />
                        </button>
                        <div>
                            <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                💊 {isRTL ? 'العلاجات الطبية' : 'Traitements médicaux'}
                            </h1>
                            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                {isRTL ? 'إدارة علاجات أطفالك' : 'Gérez les traitements de vos enfants'}
                            </p>
                        </div>
                    </div>
                    <Button
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        {isRTL ? 'إضافة علاج' : 'Ajouter'}
                    </Button>
                </div>

                {/* Filtres */}
                <div className="flex gap-2 mb-6">
                    {['active', 'completed', 'all'].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === f
                                    ? 'bg-purple-600 text-white'
                                    : isDark
                                        ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                        : 'bg-white text-gray-700 hover:bg-gray-100'
                                }`}
                        >
                            {f === 'active' ? (isRTL ? 'نشط' : 'Actifs') :
                                f === 'completed' ? (isRTL ? 'مكتمل' : 'Terminés') :
                                    (isRTL ? 'الكل' : 'Tous')}
                        </button>
                    ))}
                </div>

                {/* Liste des traitements */}
                {treatments.length === 0 ? (
                    <Card className={isDark ? 'bg-gray-800 border-gray-700' : ''}>
                        <CardContent className="py-12 text-center">
                            <Pill className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
                            <h3 className={`text-lg font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                {isRTL ? 'لا توجد علاجات' : 'Aucun traitement'}
                            </h3>
                            <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                                {isRTL ? 'أضف علاجًا لطفلك' : 'Ajoutez un traitement pour votre enfant'}
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                        {treatments.map((treatment) => (
                            <motion.div
                                key={treatment.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <Card className={`${isDark ? 'bg-gray-800 border-gray-700' : ''} overflow-hidden`}>
                                    <CardContent className="p-4">
                                        {/* Header */}
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDark ? 'bg-purple-900/30' : 'bg-purple-100'
                                                    }`}>
                                                    <Baby className="w-5 h-5 text-purple-600" />
                                                </div>
                                                <div>
                                                    <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                        {treatment.child_first_name} {treatment.child_last_name}
                                                    </h3>
                                                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                                        {treatment.medication_name}
                                                    </p>
                                                </div>
                                            </div>
                                            {getStatusBadge(treatment.status)}
                                        </div>

                                        {/* Détails */}
                                        <div className={`p-3 rounded-lg mb-3 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
                                            <div className="grid grid-cols-2 gap-3 text-sm">
                                                <div>
                                                    <span className={`${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                                        {isRTL ? 'الجرعة' : 'Dose'}:
                                                    </span>
                                                    <span className={`ml-2 font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                        {treatment.dose}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className={`${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                                        {isRTL ? 'التوقيت' : 'Timing'}:
                                                    </span>
                                                    <span className={`ml-2 font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                        {getTimingLabel(treatment.timing_type, treatment.interval_hours)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Dates */}
                                        <div className="flex items-center gap-4 text-sm mb-3">
                                            <div className="flex items-center gap-1">
                                                <Calendar className={`w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                                                <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                                                    {new Date(treatment.start_date).toLocaleDateString('fr-FR')} → {new Date(treatment.end_date).toLocaleDateString('fr-FR')}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Notes */}
                                        {treatment.notes && (
                                            <p className={`text-sm italic ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                                                📝 {treatment.notes}
                                            </p>
                                        )}

                                        {/* Actions */}
                                        {treatment.status === 'active' && (
                                            <div className="flex justify-end mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                                                <button
                                                    onClick={() => handleCancel(treatment.id)}
                                                    className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                    {isRTL ? 'إلغاء' : 'Annuler'}
                                                </button>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* Modal Universel d'ajout */}
                <AddTreatmentModal
                    isOpen={showModal}
                    onClose={() => setShowModal(false)}
                    onSuccess={() => {
                        setShowModal(false);
                        loadData();
                    }}
                    childrenList={children}
                />
            </div>
        </div>
    );
};

export default TreatmentsPage;
