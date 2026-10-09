/**
 * Page de création d'utilisateur (Parent/Staff)
 * 
 * Workflow Parent:
 * 1. Admin sélectionne le rôle "Parent"
 * 2. Admin saisit les informations du parent
 * 3. Admin sélectionne un enfant orphelin
 * 4. Email envoyé au parent avec lien de création de mot de passe
 * 
 * Workflow Staff:
 * 1. Admin sélectionne le rôle "Personnel"
 * 2. Admin saisit les informations + poste
 * 3. Email envoyé au personnel avec lien de création de mot de passe
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    UserPlus,
    Users,
    Shield,
    Mail,
    Phone,
    User,
    Check,
    AlertCircle,
    Baby,
    Send,
    CheckCircle,
    Briefcase
} from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import { useAuth } from '../../hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useDialogContext } from '../../contexts/DialogContext';
import userWorkflowService from '../../services/userWorkflowService';

const AddUserPage = () => {
    const { isRTL } = useLanguage();
    const dialog = useDialogContext();
    const navigate = useNavigate();
    const location = useLocation();
    const { isAdmin } = useAuth();

    // État du formulaire
    const [selectedRole, setSelectedRole] = useState('parent');
    const [loading, setLoading] = useState(false);
    const [loadingChildren, setLoadingChildren] = useState(false);
    const [orphanChildren, setOrphanChildren] = useState([]);
    const [selectedChildren, setSelectedChildren] = useState([]);
    const [showSuccess, setShowSuccess] = useState(false);
    const [createdUser, setCreatedUser] = useState(null);
    const [noEmail, setNoEmail] = useState(false);

    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        gender: '',
        staff_position: '',
        emergency_contact_name: '',
        emergency_contact_phone: ''
    });

    const [errors, setErrors] = useState({});

    // Pré-sélectionner un enfant et/ou rôle si passé via navigation
    useEffect(() => {
        if (location.state?.preselectedChild) {
            const child = location.state.preselectedChild;
            setSelectedChildren([child]);
            if (child.last_name) {
                setFormData(prev => ({
                    ...prev,
                    last_name: prev.last_name || child.last_name
                }));
            }
        } else if (location.state?.prefilledLastName) {
            setFormData(prev => ({
                ...prev,
                last_name: prev.last_name || location.state.prefilledLastName
            }));
        }
        if (location.state?.preselectedRole) {
            setSelectedRole(location.state.preselectedRole);
        }
    }, [location.state]);

    // Charger les enfants orphelins (fonction réutilisable)
    const fetchOrphanChildren = useCallback(async (ignoreState = false) => {
        if (selectedRole !== 'parent') return;

        setLoadingChildren(true);
        try {
            const response = await userWorkflowService.getOrphanChildren();
            if (response.success) {
                let children = response.children || [];
                // N'injecter l'enfant du location.state que si on n'a pas explicitement demandé de l'ignorer
                if (!ignoreState && location.state?.preselectedChild) {
                    const preChild = location.state.preselectedChild;
                    if (!children.some(c => c.id === preChild.id)) {
                        children = [preChild, ...children];
                    }
                }
                setOrphanChildren(children);
            }
        } catch (error) {
            console.error('Erreur chargement enfants orphelins:', error);
            setOrphanChildren(!ignoreState && location.state?.preselectedChild ? [location.state.preselectedChild] : []);
        } finally {
            setLoadingChildren(false);
        }
    }, [selectedRole, location.state]);

    useEffect(() => {
        fetchOrphanChildren();
    }, [fetchOrphanChildren]);

    // Options de rôle
    const roleOptions = [
        {
            value: 'parent',
            label: isRTL ? 'ولي أمر' : 'Parent',
            description: isRTL
                ? 'إنشاء حساب ولي أمر وربطه بطفل مسجل'
                : 'Créer un compte parent et l\'associer à un enfant inscrit',
            icon: Users,
            color: 'text-blue-600',
            bgColor: 'bg-blue-100 dark:bg-blue-900/20'
        },
        {
            value: 'staff',
            label: isRTL ? 'موظف' : 'Personnel',
            description: isRTL
                ? 'إنشاء حساب موظف (مربية، صحة، نظافة...)'
                : 'Créer un compte personnel (éducateur, santé, entretien...)',
            icon: Briefcase,
            color: 'text-green-600',
            bgColor: 'bg-green-100 dark:bg-green-900/20'
        }
    ];

    // Option admin supprimée - les comptes directeur sont créés manuellement

    // Options de poste pour le personnel
    const staffPositions = [
        { value: 'director', label: isRTL ? 'مدير/مديرة' : 'Directeur/Directrice' },
        { value: 'educator', label: isRTL ? 'مربي/مربية' : 'Éducateur/Éducatrice' },
        { value: 'health', label: isRTL ? 'طبيب متعاقد' : 'Médecin conventionné' },
        { value: 'cleaning', label: isRTL ? 'موظف نظافة' : 'Personnel d\'entretien' },
        { value: 'security', label: isRTL ? 'حارس أمن' : 'Agent de sécurité' },
        { value: 'kitchen', label: isRTL ? 'موظف مطبخ' : 'Personnel de cuisine' },
        { value: 'other', label: isRTL ? 'آخر' : 'Autre' }
    ];

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleRoleSelect = (role) => {
        setSelectedRole(role);
        setSelectedChildren([]);
        setFormData(prev => ({
            ...prev,
            staff_position: role === 'parent' ? '' : prev.staff_position
        }));
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.first_name.trim()) {
            newErrors.first_name = isRTL ? 'الاسم الأول مطلوب' : 'Le prénom est requis';
        }

        if (!formData.last_name.trim()) {
            newErrors.last_name = isRTL ? 'اسم العائلة مطلوب' : 'Le nom est requis';
        }

        // Email : obligatoire pour le personnel, optionnel pour le parent
        if (selectedRole === 'parent') {
            if (formData.email.trim() && !/\S+@\S+\.\S+/.test(formData.email.trim())) {
                newErrors.email = isRTL ? 'البريد الإلكتروني غير صحيح' : 'Format d\'email invalide';
            }
        } else {
            if (!formData.email.trim()) {
                newErrors.email = isRTL ? 'البريد الإلكتروني مطلوب' : 'L\'email est requis';
            } else if (!/\S+@\S+\.\S+/.test(formData.email.trim())) {
                newErrors.email = isRTL ? 'البريد الإلكتروني غير صحيح' : 'Format d\'email invalide';
            }
        }

        if (!formData.phone.trim()) {
            newErrors.phone = isRTL ? 'رقم الهاتف مطلوب' : 'Le téléphone est requis';
        }

        if (!formData.gender) {
            newErrors.gender = isRTL ? 'الجنس مطلوب' : 'Le sexe est requis';
        }

        // Validation spécifique au rôle
        if (selectedRole === 'parent') {
            if (selectedChildren.length === 0) {
                newErrors.child = isRTL ? 'يجب اختيار طفل واحد على الأقل' : 'Vous devez sélectionner au moins un enfant';
            }
        } else if (selectedRole === 'staff' || selectedRole === 'admin') {
            if (!formData.staff_position) {
                newErrors.staff_position = isRTL ? 'المنصب مطلوب' : 'Le poste est requis';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setLoading(true);

        try {
            let response;

            if (selectedRole === 'parent') {
                // Créer un compte parent
                response = await userWorkflowService.createParent({
                    first_name: formData.first_name,
                    last_name: formData.last_name,
                    email: formData.email,
                    phone: formData.phone,
                    gender: formData.gender,
                    child_ids: selectedChildren.map(c => c.id)
                });
            } else {
                // Créer un compte personnel
                response = await userWorkflowService.createStaff({
                    first_name: formData.first_name,
                    last_name: formData.last_name,
                    email: formData.email,
                    phone: formData.phone,
                    gender: formData.gender,
                    staff_position: formData.staff_position
                });
            }

            if (response.success) {
                // Retirer immédiatement les enfants associés de la liste locale des orphelins
                if (selectedRole === 'parent' && selectedChildren.length > 0) {
                    const associatedIds = selectedChildren.map(c => c.id);
                    setOrphanChildren(prev => prev.filter(c => !associatedIds.includes(c.id)));
                }

                setCreatedUser(response.user);
                setShowSuccess(true);
                dialog.success(
                    selectedRole === 'parent'
                        ? (isRTL ? 'تم إنشاء حساب ولي الأمر بنجاح' : 'Compte parent créé avec succès')
                        : (isRTL ? 'تم إنشاء حساب الموظف بنجاح' : 'Compte personnel créé avec succès')
                );
            }
        } catch (error) {
            console.error('Erreur création utilisateur:', error);
            dialog.error(error.error || (isRTL ? 'خطأ في إنشاء الحساب' : 'Erreur lors de la création'));
        } finally {
            setLoading(false);
        }
    };

    const handleResetForAnotherUser = () => {
        setShowSuccess(false);
        setCreatedUser(null);
        setSelectedChildren([]);
        setNoEmail(false);
        setFormData({
            first_name: '',
            last_name: '',
            email: '',
            phone: '',
            gender: '',
            staff_position: '',
            emergency_contact_name: '',
            emergency_contact_phone: ''
        });
        setErrors({});
        // Purgation de l'état de navigation pour ne plus injecter l'enfant précédent
        navigate('/dashboard/users/add', { replace: true, state: {} });
        // Recharger immédiatement la liste fraîche des enfants orphelins depuis l'API
        fetchOrphanChildren(true);
    };

    // Écran de succès
    if (showSuccess && createdUser) {
        const isNoEmailUser = !createdUser.email || createdUser.email.includes('@creche.local');

        return (
            <div className="space-y-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-2xl mx-auto"
                >
                    <Card className="border-green-200 dark:border-green-800">
                        <CardContent className="pt-6">
                            <div className="text-center mb-6">
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
                                    <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {isRTL ? 'تم إنشاء الحساب بنجاح!' : 'Compte créé avec succès !'}
                                </h2>
                                <p className="text-gray-600 dark:text-gray-400 mt-2">
                                    <strong>{createdUser.first_name} {createdUser.last_name}</strong>
                                </p>
                            </div>

                            {/* Statut Email */}
                            {isNoEmailUser ? (
                                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-6">
                                    <div className="flex items-start gap-3">
                                        <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                                        <div>
                                            <h3 className="font-semibold text-amber-800 dark:text-amber-300">
                                                {isRTL ? 'ولي أمر مسجل بدون بريد إلكتروني' : 'Parent enregistré sans adresse email'}
                                            </h3>
                                            <p className="text-amber-700 dark:text-amber-400 text-sm mt-1">
                                                {isRTL
                                                    ? 'لم يتم إرسال رابط دعوة. تم ربط الطفل بالولي بنجاح، ويمكنك إضافة بريد إلكتروني لاحقاً لتفعيل حسابه.'
                                                    : 'Aucun lien de création de mot de passe n\'a été envoyé. L\'enfant est bien associé, et vous pourrez ajouter un email ultérieurement pour activer son compte.'
                                                }
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6">
                                    <div className="flex items-start gap-3">
                                        <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                                        <div>
                                            <h3 className="font-semibold text-blue-800 dark:text-blue-300">
                                                {isRTL ? 'تم إرسال البريد الإلكتروني' : 'Email envoyé'}
                                            </h3>
                                            <p className="text-blue-700 dark:text-blue-400 text-sm mt-1">
                                                {isRTL
                                                    ? `تم إرسال رابط إنشاء كلمة المرور إلى ${createdUser.email}`
                                                    : `Un lien de création de mot de passe a été envoyé à ${createdUser.email}`
                                                }
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Info enfants associés (pour parent) */}
                            {selectedRole === 'parent' && selectedChildren.length > 0 && (
                                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 mb-6">
                                    <div className="flex items-start gap-3">
                                        <Baby className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
                                        <div>
                                            <h3 className="font-semibold text-green-800 dark:text-green-300">
                                                {isRTL ? 'الأطفال المرتبطون' : 'Enfant(s) associé(s)'}
                                            </h3>
                                            <p className="text-green-700 dark:text-green-400 text-sm mt-1">
                                                {selectedChildren.map(c => `${c.first_name} ${c.last_name}`).join(', ')}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex flex-col sm:flex-row gap-3">
                                <Button
                                    onClick={handleResetForAnotherUser}
                                    className="flex-1"
                                >
                                    <UserPlus className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
                                    {isRTL ? 'إضافة مستخدم آخر' : 'Ajouter un autre utilisateur'}
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        if (selectedRole === 'parent' && createdUser) {
                                            const params = new URLSearchParams();
                                            if (createdUser.id) params.set('parentId', createdUser.id);
                                            if (createdUser.last_name) params.set('lastName', createdUser.last_name);
                                            navigate(`/dashboard/add-child?${params.toString()}`);
                                        } else {
                                            navigate('/dashboard/add-child');
                                        }
                                    }}
                                    className="flex-1 border-primary-200 dark:border-primary-800 text-primary-700 dark:text-primary-300 hover:bg-primary-50 dark:hover:bg-primary-900/20"
                                >
                                    <Baby className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
                                    {isRTL ? 'إضافة طفل' : 'Ajouter un enfant'}
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => navigate('/dashboard')}
                                    className="flex-1"
                                >
                                    {isRTL ? 'العودة للوحة التحكم' : 'Retour au dashboard'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* En-tête */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {isRTL ? 'إضافة مستخدم جديد' : 'Ajouter un utilisateur'}
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                    {isRTL
                        ? 'سيتم إرسال رابط إنشاء كلمة المرور عبر البريد الإلكتروني'
                        : 'Un lien de création de mot de passe sera envoyé par email'
                    }
                </p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Sélection du rôle */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center text-base">
                                <Shield className="w-5 h-5 mr-2 rtl:mr-0 rtl:ml-2" />
                                {isRTL ? 'نوع الحساب' : 'Type de compte'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {roleOptions.map((option) => (
                                <div
                                    key={option.value}
                                    onClick={() => handleRoleSelect(option.value)}
                                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${selectedRole === option.value
                                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                                        }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={`p-2 rounded-lg ${option.bgColor}`}>
                                            <option.icon className={`w-5 h-5 ${option.color}`} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-medium text-gray-900 dark:text-white">
                                                {option.label}
                                            </h3>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                {option.description}
                                            </p>
                                        </div>
                                        {selectedRole === option.value && (
                                            <Check className="w-5 h-5 text-primary-500 flex-shrink-0" />
                                        )}
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Formulaire */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="lg:col-span-2"
                >
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center text-base">
                                <UserPlus className="w-5 h-5 mr-2 rtl:mr-0 rtl:ml-2" />
                                {isRTL ? 'معلومات المستخدم' : 'Informations utilisateur'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Nom et prénom */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            {isRTL ? 'الاسم الأول' : 'Prénom'} *
                                        </label>
                                        <input
                                            type="text"
                                            name="first_name"
                                            value={formData.first_name}
                                            onChange={handleInputChange}
                                            className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${errors.first_name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                                                }`}
                                            placeholder={isRTL ? 'أدخل الاسم الأول' : 'Entrez le prénom'}
                                        />
                                        {errors.first_name && (
                                            <p className="text-red-500 text-sm mt-1 flex items-center">
                                                <AlertCircle className="w-4 h-4 mr-1" />
                                                {errors.first_name}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            {isRTL ? 'اسم العائلة' : 'Nom'} *
                                        </label>
                                        <input
                                            type="text"
                                            name="last_name"
                                            value={formData.last_name}
                                            onChange={handleInputChange}
                                            className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${errors.last_name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                                                }`}
                                            placeholder={isRTL ? 'أدخل اسم العائلة' : 'Entrez le nom'}
                                        />
                                        {errors.last_name && (
                                            <p className="text-red-500 text-sm mt-1 flex items-center">
                                                <AlertCircle className="w-4 h-4 mr-1" />
                                                {errors.last_name}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Email et téléphone */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            {isRTL ? 'البريد الإلكتروني' : 'Email'} {selectedRole === 'parent' ? (
                                                <span className="text-gray-400 font-normal text-xs">({isRTL ? 'اختياري' : 'optionnel'})</span>
                                            ) : '*'}
                                        </label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                            <input
                                                type="email"
                                                name="email"
                                                value={formData.email}
                                                disabled={noEmail}
                                                onChange={handleInputChange}
                                                className={`w-full pl-10 rtl:pl-3 rtl:pr-10 pr-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-100 disabled:dark:bg-gray-800 disabled:text-gray-400 ${errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                                                    }`}
                                                placeholder={noEmail
                                                    ? (isRTL ? 'بدون بريد إلكتروني' : 'Sans adresse email')
                                                    : (isRTL ? 'أدخل البريد الإلكتروني' : 'Entrez l\'email')
                                                }
                                            />
                                        </div>
                                        {errors.email && (
                                            <p className="text-red-500 text-sm mt-1 flex items-center">
                                                <AlertCircle className="w-4 h-4 mr-1" />
                                                {errors.email}
                                            </p>
                                        )}

                                        {/* Option parent sans email */}
                                        {selectedRole === 'parent' && (
                                            <div className="mt-2">
                                                <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 cursor-pointer select-none">
                                                    <input
                                                        type="checkbox"
                                                        checked={noEmail}
                                                        onChange={(e) => {
                                                            setNoEmail(e.target.checked);
                                                            if (e.target.checked) {
                                                                setFormData(prev => ({ ...prev, email: '' }));
                                                                if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
                                                            }
                                                        }}
                                                        className="w-4 h-4 rounded text-primary-600 border-gray-300 focus:ring-primary-500"
                                                    />
                                                    <span>{isRTL ? 'ولي الأمر ليس لديه بريد إلكتروني حالياً' : 'Le parent n\'a pas d\'adresse email actuellement'}</span>
                                                </label>

                                                
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            {isRTL ? 'رقم الهاتف' : 'Téléphone'} *
                                        </label>
                                        <div className="relative">
                                            <Phone className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                            <input
                                                type="tel"
                                                name="phone"
                                                value={formData.phone}
                                                onChange={handleInputChange}
                                                className={`w-full pl-10 rtl:pl-3 rtl:pr-10 pr-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${errors.phone ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                                                    }`}
                                                placeholder={isRTL ? 'أدخل رقم الهاتف' : 'Entrez le téléphone'}
                                                dir="ltr"
                                            />
                                        </div>
                                        {errors.phone && (
                                            <p className="text-red-500 text-sm mt-1 flex items-center">
                                                <AlertCircle className="w-4 h-4 mr-1" />
                                                {errors.phone}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Sexe */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        {isRTL ? 'الجنس' : 'Sexe'} *
                                    </label>
                                    <div className="flex gap-4">
                                        <label className="flex items-center">
                                            <input
                                                type="radio"
                                                name="gender"
                                                value="male"
                                                checked={formData.gender === 'male'}
                                                onChange={handleInputChange}
                                                className="mr-2 rtl:mr-0 rtl:ml-2"
                                            />
                                            {isRTL ? 'ذكر' : 'Homme'}
                                        </label>
                                        <label className="flex items-center">
                                            <input
                                                type="radio"
                                                name="gender"
                                                value="female"
                                                checked={formData.gender === 'female'}
                                                onChange={handleInputChange}
                                                className="mr-2 rtl:mr-0 rtl:ml-2"
                                            />
                                            {isRTL ? 'أنثى' : 'Femme'}
                                        </label>
                                    </div>
                                    {errors.gender && (
                                        <p className="text-red-500 text-sm mt-1 flex items-center">
                                            <AlertCircle className="w-4 h-4 mr-1" />
                                            {errors.gender}
                                        </p>
                                    )}
                                </div>

                                {/* Poste (pour staff/admin) */}
                                {(selectedRole === 'staff' || selectedRole === 'admin') && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                                            {staffPositions.map(pos => (
                                                <option key={pos.value} value={pos.value}>{pos.label}</option>
                                            ))}
                                        </select>
                                        {errors.staff_position && (
                                            <p className="text-red-500 text-sm mt-1 flex items-center">
                                                <AlertCircle className="w-4 h-4 mr-1" />
                                                {errors.staff_position}
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* Sélection enfant (pour parent) */}
                                {selectedRole === 'parent' && (
                                    <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                                            <Baby className="w-5 h-5 mr-2 rtl:mr-0 rtl:ml-2" />
                                            {isRTL ? 'اختيار الطفل' : 'Sélectionner l\'enfant'} *
                                        </h3>

                                        {loadingChildren ? (
                                            <div className="text-center py-8 text-gray-500">
                                                {isRTL ? 'جاري التحميل...' : 'Chargement...'}
                                            </div>
                                        ) : orphanChildren.length === 0 ? (
                                            <div className="text-center py-8 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                                <Baby className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                                <p>{isRTL ? 'لا يوجد أطفال بدون ولي أمر' : 'Aucun enfant sans parent'}</p>
                                                <p className="text-sm mt-2">
                                                    {isRTL
                                                        ? 'يجب أولاً تسجيل طفل قبل إنشاء حساب ولي الأمر'
                                                        : 'Vous devez d\'abord inscrire un enfant avant de créer un compte parent'
                                                    }
                                                </p>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={() => navigate('/dashboard/add-child')}
                                                    className="mt-4"
                                                >
                                                    {isRTL ? 'تسجيل طفل' : 'Inscrire un enfant'}
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                {orphanChildren.map(child => {
                                                    const isSelected = selectedChildren.some(c => c.id === child.id);
                                                    return (
                                                        <div
                                                            key={child.id}
                                                            onClick={() => {
                                                                if (isSelected) {
                                                                    setSelectedChildren(prev => prev.filter(c => c.id !== child.id));
                                                                } else {
                                                                    setSelectedChildren(prev => [...prev, child]);
                                                                }
                                                            }}
                                                            className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${isSelected
                                                                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                                                : 'border-gray-200 dark:border-gray-700 hover:border-primary-300'
                                                                }`}
                                                        >
                                                            <div className="flex items-center justify-between">
                                                                <div>
                                                                    <p className="font-medium text-gray-900 dark:text-white">
                                                                        {child.first_name} {child.last_name}
                                                                    </p>
                                                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                                                        {child.age_display || `${child.age_years || 0} ans`}
                                                                    </p>
                                                                </div>
                                                                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center ${isSelected
                                                                    ? 'border-primary-500 bg-primary-500'
                                                                    : 'border-gray-300'
                                                                    }`}>
                                                                    {isSelected && (
                                                                        <Check className="w-3 h-3 text-white" />
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {errors.child && (
                                            <p className="text-red-500 text-sm mt-2 flex items-center">
                                                <AlertCircle className="w-4 h-4 mr-1" />
                                                {errors.child}
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* Contact d'urgence (optionnel pour parent) */}
                                {selectedRole === 'parent' && (
                                    <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                                            {isRTL ? 'جهة اتصال الطوارئ (اختياري)' : 'Contact d\'urgence (optionnel)'}
                                        </h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                                            {isRTL
                                                ? 'إذا تركت هذه الحقول فارغة، سيتم استخدام معلومات الوالد كجهة اتصال للطوارئ'
                                                : 'Si vous laissez ces champs vides, les informations du parent seront utilisées comme contact d\'urgence'
                                            }
                                        </p>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    {isRTL ? 'اسم جهة الاتصال' : 'Nom du contact'}
                                                </label>
                                                <input
                                                    type="text"
                                                    name="emergency_contact_name"
                                                    value={formData.emergency_contact_name}
                                                    onChange={handleInputChange}
                                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                    placeholder={isRTL ? 'اسم جهة الاتصال' : 'Nom du contact'}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    {isRTL ? 'هاتف جهة الاتصال' : 'Téléphone du contact'}
                                                </label>
                                                <input
                                                    type="tel"
                                                    name="emergency_contact_phone"
                                                    value={formData.emergency_contact_phone}
                                                    onChange={handleInputChange}
                                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                    placeholder={isRTL ? 'رقم الهاتف' : 'Numéro de téléphone'}
                                                    dir="ltr"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Boutons */}
                                <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => navigate('/dashboard')}
                                    >
                                        {isRTL ? 'إلغاء' : 'Annuler'}
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={loading || (selectedRole === 'parent' && orphanChildren.length === 0)}
                                        className="bg-primary-600 hover:bg-primary-700"
                                    >
                                        {loading ? (
                                            <span className="flex items-center">
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                                                {isRTL ? 'جاري الإنشاء...' : 'Création...'}
                                            </span>
                                        ) : (
                                            <span className="flex items-center">
                                                {noEmail ? (
                                                    <>
                                                        <UserPlus className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
                                                        {isRTL ? 'إنشاء' : 'Créer'}
                                                    </>
                                                ) : (
                                                    <>
                                                        <Send className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
                                                        {isRTL ? 'إنشاء وإرسال الدعوة' : 'Créer et envoyer l\'invitation'}
                                                    </>
                                                )}
                                            </span>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </div>
    );
};

export default AddUserPage;
