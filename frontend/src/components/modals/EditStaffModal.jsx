/**
 * Modal de modification d'un membre du personnel
 * Avec logique de genre pour les intitulés de poste (masculin/féminin)
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    User,
    Mail,
    Phone,
    Briefcase,
    Save,
    AlertCircle
} from 'lucide-react';
import { Button } from '../ui/Button';
import api from '../../services/api';

const EditStaffModal = ({ isOpen, onClose, staff, onSuccess, isRTL }) => {
    console.log('🔧 EditStaffModal rendu - isOpen:', isOpen, 'staff:', staff);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        gender: '',
        staff_position: '',
        is_active: true
    });

    // Options de poste avec logique de genre
    const getStaffPositions = (gender) => {
        const positions = {
            director: {
                male: { fr: 'Directeur', ar: 'مدير' },
                female: { fr: 'Directrice', ar: 'مديرة' }
            },
            educator: {
                male: { fr: 'Éducateur', ar: 'مربي' },
                female: { fr: 'Éducatrice', ar: 'مربية' }
            },
            assistant_educator: {
                male: { fr: 'Assistant éducateur', ar: 'مساعد مربي' },
                female: { fr: 'Assistante éducatrice', ar: 'مساعدة مربية' }
            },
            nurse: {
                male: { fr: 'Infirmier', ar: 'ممرض' },
                female: { fr: 'Infirmière', ar: 'ممرضة' }
            },
            psychologist: {
                male: { fr: 'Psychologue', ar: 'أخصائي نفسي' },
                female: { fr: 'Psychologue', ar: 'أخصائية نفسية' }
            },
            cook: {
                male: { fr: 'Cuisinier', ar: 'طباخ' },
                female: { fr: 'Cuisinière', ar: 'طباخة' }
            },
            cleaning: {
                male: { fr: 'Agent d\'entretien', ar: 'عامل نظافة' },
                female: { fr: 'Agente d\'entretien', ar: 'عاملة نظافة' }
            },
            security: {
                male: { fr: 'Agent de sécurité', ar: 'حارس أمن' },
                female: { fr: 'Agente de sécurité', ar: 'حارسة أمن' }
            },
            receptionist: {
                male: { fr: 'Réceptionniste', ar: 'موظف استقبال' },
                female: { fr: 'Réceptionniste', ar: 'موظفة استقبال' }
            },
            driver: {
                male: { fr: 'Chauffeur', ar: 'سائق' },
                female: { fr: 'Chauffeuse', ar: 'سائقة' }
            },
            other: {
                male: { fr: 'Autre', ar: 'آخر' },
                female: { fr: 'Autre', ar: 'أخرى' }
            }
        };

        return Object.entries(positions).map(([value, labels]) => {
            const genderKey = gender === 'female' ? 'female' : 'male';
            const label = isRTL ? labels[genderKey].ar : labels[genderKey].fr;
            return { value, label };
        });
    };

    // Obtenir le label du poste selon le genre
    const getPositionLabel = (position, gender) => {
        const positions = {
            director: { male: { fr: 'Directeur', ar: 'مدير' }, female: { fr: 'Directrice', ar: 'مديرة' } },
            educator: { male: { fr: 'Éducateur', ar: 'مربي' }, female: { fr: 'Éducatrice', ar: 'مربية' } },
            assistant_educator: { male: { fr: 'Assistant éducateur', ar: 'مساعد مربي' }, female: { fr: 'Assistante éducatrice', ar: 'مساعدة مربية' } },
            nurse: { male: { fr: 'Infirmier', ar: 'ممرض' }, female: { fr: 'Infirmière', ar: 'ممرضة' } },
            psychologist: { male: { fr: 'Psychologue', ar: 'أخصائي نفسي' }, female: { fr: 'Psychologue', ar: 'أخصائية نفسية' } },
            cook: { male: { fr: 'Cuisinier', ar: 'طباخ' }, female: { fr: 'Cuisinière', ar: 'طباخة' } },
            cleaning: { male: { fr: 'Agent d\'entretien', ar: 'عامل نظافة' }, female: { fr: 'Agente d\'entretien', ar: 'عاملة نظافة' } },
            security: { male: { fr: 'Agent de sécurité', ar: 'حارس أمن' }, female: { fr: 'Agente de sécurité', ar: 'حارسة أمن' } },
            receptionist: { male: { fr: 'Réceptionniste', ar: 'موظف استقبال' }, female: { fr: 'Réceptionniste', ar: 'موظفة استقبال' } },
            driver: { male: { fr: 'Chauffeur', ar: 'سائق' }, female: { fr: 'Chauffeuse', ar: 'سائقة' } },
            other: { male: { fr: 'Autre', ar: 'آخر' }, female: { fr: 'Autre', ar: 'أخرى' } }
        };

        if (!positions[position]) return position;
        const genderKey = gender === 'female' ? 'female' : 'male';
        return isRTL ? positions[position][genderKey].ar : positions[position][genderKey].fr;
    };

    // Charger les données du staff quand le modal s'ouvre
    useEffect(() => {
        if (staff && isOpen) {
            setFormData({
                first_name: staff.first_name || '',
                last_name: staff.last_name || '',
                email: staff.email || '',
                phone: staff.phone || '',
                gender: staff.gender || '',
                staff_position: staff.staff_position || '',
                is_active: staff.status === 'active' || staff.is_active !== false
            });
            setErrors({});
        }
    }, [staff, isOpen]);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.first_name.trim()) {
            newErrors.first_name = isRTL ? 'الاسم الأول مطلوب' : 'Le prénom est requis';
        }

        if (!formData.last_name.trim()) {
            newErrors.last_name = isRTL ? 'اسم العائلة مطلوب' : 'Le nom est requis';
        }

        if (!formData.email.trim()) {
            newErrors.email = isRTL ? 'البريد الإلكتروني مطلوب' : 'L\'email est requis';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = isRTL ? 'البريد الإلكتروني غير صحيح' : 'Format d\'email invalide';
        }

        if (!formData.phone.trim()) {
            newErrors.phone = isRTL ? 'رقم الهاتف مطلوب' : 'Le téléphone est requis';
        }

        if (!formData.gender) {
            newErrors.gender = isRTL ? 'الجنس مطلوب' : 'Le sexe est requis';
        }

        if (!formData.staff_position) {
            newErrors.staff_position = isRTL ? 'المنصب مطلوب' : 'Le poste est requis';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        setLoading(true);

        try {
            const response = await api.put(`/api/users/${staff.id}`, {
                first_name: formData.first_name,
                last_name: formData.last_name,
                email: formData.email,
                phone: formData.phone,
                gender: formData.gender,
                staff_position: formData.staff_position,
                is_active: formData.is_active
            });

            if (response.data.success) {
                onSuccess({
                    ...staff,
                    ...formData,
                    status: formData.is_active ? 'active' : 'inactive'
                });
                onClose();
            }
        } catch (error) {
            console.error('Erreur modification:', error);
            const errorMessage = error.response?.data?.error ||
                (isRTL ? 'خطأ في التعديل' : 'Erreur lors de la modification');
            setErrors({ submit: errorMessage });
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg my-8"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                                <User className="w-5 h-5 mr-2 rtl:mr-0 rtl:ml-2 text-primary-500" />
                                {isRTL ? 'تعديل معلومات الموظف' : 'Modifier le personnel'}
                            </h2>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="p-4 space-y-4">
                            {/* Erreur globale */}
                            {errors.submit && (
                                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                                    <p className="text-red-600 dark:text-red-400 text-sm flex items-center">
                                        <AlertCircle className="w-4 h-4 mr-2" />
                                        {errors.submit}
                                    </p>
                                </div>
                            )}

                            {/* Nom et prénom */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        {isRTL ? 'الاسم الأول' : 'Prénom'} *
                                    </label>
                                    <input
                                        type="text"
                                        name="first_name"
                                        value={formData.first_name}
                                        onChange={handleInputChange}
                                        className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${errors.first_name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                                            }`}
                                    />
                                    {errors.first_name && (
                                        <p className="text-red-500 text-xs mt-1">{errors.first_name}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        {isRTL ? 'اسم العائلة' : 'Nom'} *
                                    </label>
                                    <input
                                        type="text"
                                        name="last_name"
                                        value={formData.last_name}
                                        onChange={handleInputChange}
                                        className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${errors.last_name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                                            }`}
                                    />
                                    {errors.last_name && (
                                        <p className="text-red-500 text-xs mt-1">{errors.last_name}</p>
                                    )}
                                </div>
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    {isRTL ? 'البريد الإلكتروني' : 'Email'} *
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        className={`w-full pl-10 rtl:pl-3 rtl:pr-10 pr-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                                            }`}
                                    />
                                </div>
                                {errors.email && (
                                    <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                                )}
                            </div>

                            {/* Téléphone */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    {isRTL ? 'رقم الهاتف' : 'Téléphone'} *
                                </label>
                                <div className="relative">
                                    <Phone className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        dir="ltr"
                                        className={`w-full pl-10 rtl:pl-3 rtl:pr-10 pr-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${errors.phone ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                                            }`}
                                    />
                                </div>
                                {errors.phone && (
                                    <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
                                )}
                            </div>

                            {/* Sexe */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    {isRTL ? 'الجنس' : 'Sexe'} *
                                </label>
                                <div className="flex gap-4">
                                    <label className="flex items-center cursor-pointer">
                                        <input
                                            type="radio"
                                            name="gender"
                                            value="male"
                                            checked={formData.gender === 'male'}
                                            onChange={handleInputChange}
                                            className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2 text-primary-600 bg-gray-100 border-gray-300 focus:ring-primary-500 dark:bg-gray-600 dark:border-gray-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800"
                                        />
                                        <span className="text-gray-700 dark:text-gray-300">
                                            {isRTL ? 'ذكر' : 'Homme'}
                                        </span>
                                    </label>
                                    <label className="flex items-center cursor-pointer">
                                        <input
                                            type="radio"
                                            name="gender"
                                            value="female"
                                            checked={formData.gender === 'female'}
                                            onChange={handleInputChange}
                                            className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2 text-primary-600 bg-gray-100 border-gray-300 focus:ring-primary-500 dark:bg-gray-600 dark:border-gray-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800"
                                        />
                                        <span className="text-gray-700 dark:text-gray-300">
                                            {isRTL ? 'أنثى' : 'Femme'}
                                        </span>
                                    </label>
                                </div>
                                {errors.gender && (
                                    <p className="text-red-500 text-xs mt-1">{errors.gender}</p>
                                )}
                            </div>

                            {/* Poste */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    <Briefcase className="w-4 h-4 inline mr-1 rtl:mr-0 rtl:ml-1" />
                                    {isRTL ? 'المنصب' : 'Poste'} *
                                </label>
                                <select
                                    name="staff_position"
                                    value={formData.staff_position}
                                    onChange={handleInputChange}
                                    className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${errors.staff_position ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                                        }`}
                                >
                                    <option value="">{isRTL ? 'اختر المنصب' : 'Sélectionner le poste'}</option>
                                    {getStaffPositions(formData.gender).map(pos => (
                                        <option key={pos.value} value={pos.value}>{pos.label}</option>
                                    ))}
                                </select>
                                {errors.staff_position && (
                                    <p className="text-red-500 text-xs mt-1">{errors.staff_position}</p>
                                )}
                                {formData.gender && formData.staff_position && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        {isRTL ? 'العنوان:' : 'Intitulé :'} {getPositionLabel(formData.staff_position, formData.gender)}
                                    </p>
                                )}
                            </div>

                            {/* Statut actif */}
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    name="is_active"
                                    id="is_active"
                                    checked={formData.is_active}
                                    onChange={handleInputChange}
                                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                                />
                                <label htmlFor="is_active" className="ml-2 rtl:ml-0 rtl:mr-2 text-sm text-gray-700 dark:text-gray-300">
                                    {isRTL ? 'حساب نشط' : 'Compte actif'}
                                </label>
                            </div>

                            {/* Boutons */}
                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={onClose}
                                    disabled={loading}
                                >
                                    {isRTL ? 'إلغاء' : 'Annuler'}
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="bg-primary-600 hover:bg-primary-700"
                                >
                                    {loading ? (
                                        <span className="flex items-center">
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                                            {isRTL ? 'جاري الحفظ...' : 'Enregistrement...'}
                                        </span>
                                    ) : (
                                        <span className="flex items-center">
                                            <Save className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
                                            {isRTL ? 'حفظ التعديلات' : 'Enregistrer'}
                                        </span>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default EditStaffModal;
