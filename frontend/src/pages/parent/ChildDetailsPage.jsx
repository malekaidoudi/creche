/**
 * ChildDetailsPage - Détails complets d'un enfant
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    ArrowLeft,
    Baby,
    Calendar,
    User,
    Phone,
    Mail,
    MapPin,
    Clock,
    CheckCircle,
    AlertCircle
} from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import useIsMobile from '../../hooks/useIsMobile';
import MobileNavigation from '../../components/mobile/MobileNavigation';
import api from '../../services/api';

const ChildDetailsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isRTL } = useLanguage();
    const isMobile = useIsMobile();
    const [child, setChild] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        loadChildDetails();
    }, [id]);

    const loadChildDetails = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/api/children/${id}`);
            if (response.data) {
                setChild(response.data.child || response.data);
            }
        } catch (err) {
            console.error('Erreur chargement enfant:', err);
            setError(isRTL ? 'خطأ في تحميل البيانات' : 'Erreur lors du chargement');
        } finally {
            setLoading(false);
        }
    };

    const calculateAge = (birthDate) => {
        if (!birthDate) return null;
        const today = new Date();
        const birth = new Date(birthDate);
        let years = today.getFullYear() - birth.getFullYear();
        let months = today.getMonth() - birth.getMonth();
        if (months < 0) {
            years--;
            months += 12;
        }
        if (years > 0) {
            return `${years} ${isRTL ? 'سنة' : 'an(s)'} ${months > 0 ? `${months} ${isRTL ? 'شهر' : 'mois'}` : ''}`;
        }
        return `${months} ${isRTL ? 'شهر' : 'mois'}`;
    };

    if (loading) {
        return (
            <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center ${isMobile ? 'pb-24' : ''}`}>
                <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (error || !child) {
        return (
            <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 p-6 ${isMobile ? 'pb-24' : ''}`}>
                <div className="max-w-2xl mx-auto text-center py-12">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        {error || (isRTL ? 'الطفل غير موجود' : 'Enfant non trouvé')}
                    </h2>
                    <button
                        onClick={() => navigate('/mon-espace')}
                        className="mt-4 px-6 py-2 bg-primary-600 text-white rounded-lg"
                    >
                        {isRTL ? 'العودة' : 'Retour'}
                    </button>
                </div>
                {isMobile && <MobileNavigation />}
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

                {/* Profil enfant */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden"
                >
                    {/* En-tête avec avatar */}
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white">
                        <div className="flex items-center gap-4">
                            <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center">
                                <Baby className="w-10 h-10" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold">
                                    {child.first_name} {child.last_name}
                                </h1>
                                {child.birth_date && (
                                    <p className="text-blue-100 mt-1">
                                        {calculateAge(child.birth_date)}
                                    </p>
                                )}
                                {child.group_name && (
                                    <span className="inline-block mt-2 px-3 py-1 bg-white/20 rounded-full text-sm">
                                        {child.group_name}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Informations */}
                    <div className="p-6 space-y-6">
                        {/* Date de naissance */}
                        {child.birth_date && (
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                    <Calendar className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {isRTL ? 'تاريخ الميلاد' : 'Date de naissance'}
                                    </p>
                                    <p className="font-medium text-gray-900 dark:text-white">
                                        {new Date(child.birth_date).toLocaleDateString(isRTL ? 'ar-TN' : 'fr-FR', {
                                            day: 'numeric',
                                            month: 'long',
                                            year: 'numeric'
                                        })}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Genre */}
                        {child.gender && (
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                                    <User className="w-5 h-5 text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {isRTL ? 'الجنس' : 'Genre'}
                                    </p>
                                    <p className="font-medium text-gray-900 dark:text-white">
                                        {child.gender === 'M' ? (isRTL ? 'ذكر' : 'Garçon') : (isRTL ? 'أنثى' : 'Fille')}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Date d'inscription */}
                        {child.enrollment_date && (
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {isRTL ? 'تاريخ التسجيل' : 'Inscrit depuis'}
                                    </p>
                                    <p className="font-medium text-gray-900 dark:text-white">
                                        {new Date(child.enrollment_date).toLocaleDateString(isRTL ? 'ar-TN' : 'fr-FR', {
                                            day: 'numeric',
                                            month: 'long',
                                            year: 'numeric'
                                        })}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Notes */}
                        {child.notes && (
                            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                                <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                                    {isRTL ? 'ملاحظات' : 'Notes'}
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400">
                                    {child.notes}
                                </p>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>

            {isMobile && <MobileNavigation />}
        </div>
    );
};

export default ChildDetailsPage;
