/**
 * Page de création d'utilisateur (Parent / Personnel)
 * 
 * Version Unifiée & Mobile-First:
 * - Assistant interactif étape par étape sur smartphone (Wizard tactile)
 * - Vue ergonomique et complète sur grand écran / desktop
 * - Civilité adaptative: Mme / M. pour le personnel ; Mère / Père pour les parents
 * - Onboarding sans email avec pseudo unique vérifié en temps réel
 * - Association enfant flexible: Enfant orphelin, Inscription express en 20s, ou Associer plus tard
 * - Envoi instantané d'invitation par WhatsApp (wa.me) sans surcoût d'API
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    UserPlus,
    Users,
    Mail,
    Phone,
    Check,
    AlertCircle,
    Baby,
    Send,
    CheckCircle,
    Briefcase,
    ArrowRight,
    ArrowLeft,
    Sparkles,
    Copy,
    MessageCircle,
    Smartphone,
    Clock,
    X
} from 'lucide-react';
import MobileNavigation from '../../components/mobile/MobileNavigation';
import { useLanguage } from '../../hooks/useLanguage';
import ToggleSwitch from '../../components/ui/ToggleSwitch';
import { Button } from '../../components/ui/Button';
import { useDialogContext } from '../../contexts/DialogContext';
import userWorkflowService from '../../services/userWorkflowService';

const AddUserPage = () => {
    const { isRTL } = useLanguage();
    const dialog = useDialogContext();
    const navigate = useNavigate();
    const location = useLocation();

    // Détection écran mobile / tactile
    const [isMobileScreen, setIsMobileScreen] = useState(
        typeof window !== 'undefined' ? window.innerWidth < 768 : false
    );

    useEffect(() => {
        const handleResize = () => setIsMobileScreen(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // État du formulaire
    const [currentStep, setCurrentStep] = useState(1); // Pour le wizard mobile: 1=Profil, 2=Contact/Pseudo, 3=Enfant/Poste
    const [selectedRole, setSelectedRole] = useState('parent');
    const [loading, setLoading] = useState(false);
    const [loadingChildren, setLoadingChildren] = useState(false);
    const [orphanChildren, setOrphanChildren] = useState([]);
    const [selectedChildren, setSelectedChildren] = useState([]);
    const [showSuccess, setShowSuccess] = useState(false);
    const [createdUser, setCreatedUser] = useState(null);
    const [noEmail, setNoEmail] = useState(false);
    const [copiedLink, setCopiedLink] = useState(false);

    // Mode enfant pour parent: 'existing' | 'express' | 'later'
    const [childMode, setChildMode] = useState('existing');
    const [expressChild, setExpressChild] = useState({
        first_name: '',
        birth_date: '',
        gender: 'female',
        regime: 'journee'
    });

    // Données formulaire
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        username: '',
        civility: 'female', // Civilité / Lien (parent: female=Mère, male=Père; staff: female=Mme, male=M.)
        staff_position: '',
        spouse_name: '',
        spouse_phone: '',
        emergency_contact_choice: 'custom',
        emergency_contact_name: '',
        emergency_contact_phone: ''
    });

    const [usernameStatus, setUsernameStatus] = useState({ checking: false, available: null, message: '' });
    const [errors, setErrors] = useState({});

    // Initialisation depuis l'URL ou l'état de navigation
    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const queryRole = searchParams.get('role');
        if (queryRole && ['parent', 'staff'].includes(queryRole)) {
            setSelectedRole(queryRole);
        }

        if (location.state?.preselectedChild) {
            const child = location.state.preselectedChild;
            setSelectedChildren([child]);
            setChildMode('existing');
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
    }, [location.state, location.search]);

    // Chargement des enfants orphelins
    const fetchOrphanChildren = useCallback(async (ignoreState = false) => {
        if (selectedRole !== 'parent') return;

        setLoadingChildren(true);
        try {
            const response = await userWorkflowService.getOrphanChildren();
            if (response.success) {
                let children = response.children || [];
                if (!ignoreState && location.state?.preselectedChild) {
                    const preChild = location.state.preselectedChild;
                    if (!children.some(c => c.id === preChild.id)) {
                        children = [preChild, ...children];
                    }
                }
                setOrphanChildren(children);
                if (children.length === 0 && childMode === 'existing') {
                    setChildMode('express');
                }
            }
        } catch (error) {
            console.error('Erreur chargement enfants orphelins:', error);
            setOrphanChildren(!ignoreState && location.state?.preselectedChild ? [location.state.preselectedChild] : []);
        } finally {
            setLoadingChildren(false);
        }
    }, [selectedRole, location.state, childMode]);

    useEffect(() => {
        fetchOrphanChildren();
    }, [fetchOrphanChildren]);

    // Suggestion et vérification de pseudo unique (uniquement comptes actifs)
    const handleUsernameCheck = useCallback(async (candidate) => {
        const clean = candidate?.trim().toLowerCase();
        if (!clean || clean.length < 3) {
            setUsernameStatus({ checking: false, available: null, message: '' });
            return;
        }

        setUsernameStatus({ checking: true, available: null, message: 'Vérification...' });
        try {
            const res = await userWorkflowService.checkUsername(clean);
            if (res.available) {
                setUsernameStatus({
                    checking: false,
                    available: true,
                    message: isRTL ? 'اسم المستخدم متاح' : 'Pseudo disponible'
                });
            } else {
                setUsernameStatus({
                    checking: false,
                    available: false,
                    message: res.message || (isRTL ? 'اسم المستخدم مستخدم بالفعل' : 'Ce pseudo est déjà utilisé')
                });
            }
        } catch (e) {
            setUsernameStatus({ checking: false, available: null, message: '' });
        }
    }, [isRTL]);

    // Auto-suggérer un pseudo dès la saisie du prénom et nom
    useEffect(() => {
        if (!formData.username && formData.first_name && formData.last_name) {
            const autoSuggested = `${formData.first_name.trim().toLowerCase()}.${formData.last_name.trim().toLowerCase()}`
                .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                .replace(/[^a-z0-9._]/g, '');
            if (autoSuggested.length >= 3) {
                setFormData(prev => ({ ...prev, username: autoSuggested }));
                handleUsernameCheck(autoSuggested);
            }
        }
    }, [formData.first_name, formData.last_name, formData.username, handleUsernameCheck]);

    // Changement de champs
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }

        if (name === 'username') {
            handleUsernameCheck(value);
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

    // Validation
    const validateStep = (step) => {
        const newErrors = {};

        if (step === 1) {
            if (!formData.first_name.trim()) {
                newErrors.first_name = isRTL ? 'الاسم الأول مطلوب' : 'Le prénom est requis';
            }
            if (!formData.last_name.trim()) {
                newErrors.last_name = isRTL ? 'اسم العائلة مطلوب' : 'Le nom est requis';
            }
            if (!formData.civility) {
                newErrors.civility = isRTL ? 'يرجى اختيار الصفة' : 'La civilité est requise';
            }
        }

        if (step === 2) {
            if (!formData.phone.trim()) {
                newErrors.phone = isRTL ? 'رقم الهاتف مطلوب' : 'Le numéro de téléphone est requis';
            }

            if (!noEmail) {
                if (!formData.email.trim()) {
                    newErrors.email = isRTL ? 'البريد الإلكتروني مطلوب' : 'L\'email est requis';
                } else if (formData.email.trim() && !/\S+@\S+\.\S+/.test(formData.email.trim())) {
                    newErrors.email = isRTL ? 'بريد إلكتروني غير صالح' : 'Format d\'email invalide';
                }
            }

            if (usernameStatus.available === false) {
                newErrors.username = isRTL ? 'اسم المستخدم مستخدم بالفعل' : 'Pseudo déjà utilisé';
            }
        }

        if (step === 3) {
            if (selectedRole === 'parent') {
                if (childMode === 'existing' && selectedChildren.length === 0) {
                    newErrors.child = isRTL ? 'يرجى اختيار طفل مسجل' : 'Veuillez sélectionner au moins un enfant';
                }
                if (childMode === 'express') {
                    if (!expressChild.first_name.trim()) {
                        newErrors.express_first_name = isRTL ? 'اسم الطفل مطلوب' : 'Le prénom de l\'enfant est requis';
                    }
                    if (!expressChild.birth_date) {
                        newErrors.express_birth_date = isRTL ? 'تاريخ الميلاد مطلوب' : 'La date de naissance est requise';
                    }
                }
            } else if (selectedRole === 'staff') {
                if (!formData.staff_position) {
                    newErrors.staff_position = isRTL ? 'المنصب مطلوب' : 'Le poste est requis';
                }
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNextStep = () => {
        if (validateStep(currentStep)) {
            setCurrentStep(prev => Math.min(prev + 1, 3));
        }
    };

    const handlePrevStep = () => {
        setCurrentStep(prev => Math.max(prev - 1, 1));
    };

    // Soumission du formulaire
    const handleSubmit = async (e) => {
        if (e) e.preventDefault();

        if (!validateStep(1) || !validateStep(2) || !validateStep(3)) {
            dialog.error(isRTL ? 'يرجى تصحيح الأخطاء في النموذج' : 'Veuillez corriger les champs requis');
            return;
        }

        setLoading(true);

        try {
            let response;

            if (selectedRole === 'parent') {
                const payload = {
                    first_name: formData.first_name.trim(),
                    last_name: formData.last_name.trim(),
                    email: noEmail ? '' : formData.email.trim(),
                    phone: formData.phone.trim(),
                    username: formData.username.trim() || undefined,
                    gender: formData.civility === 'male' ? 'male' : 'female',
                    child_ids: childMode === 'existing' ? selectedChildren.map(c => c.id) : [],
                    express_child: childMode === 'express' ? {
                        first_name: expressChild.first_name.trim(),
                        birth_date: expressChild.birth_date,
                        gender: expressChild.gender,
                        regime: expressChild.regime
                    } : null,
                    spouse_name: formData.spouse_name?.trim() || '',
                    spouse_phone: formData.spouse_phone?.trim() || '',
                    emergency_contact_choice: formData.emergency_contact_choice || 'custom',
                    emergency_contact_name: formData.emergency_contact_choice === 'custom' ? (formData.emergency_contact_name?.trim() || '') : '',
                    emergency_contact_phone: formData.emergency_contact_choice === 'custom' ? (formData.emergency_contact_phone?.trim() || '') : ''
                };

                response = await userWorkflowService.createParent(payload);
            } else {
                response = await userWorkflowService.createStaff({
                    first_name: formData.first_name.trim(),
                    last_name: formData.last_name.trim(),
                    email: noEmail ? '' : formData.email.trim(),
                    phone: formData.phone.trim(),
                    username: formData.username.trim() || undefined,
                    gender: formData.civility === 'male' ? 'male' : 'female',
                    staff_position: formData.staff_position
                });
            }

            if (response.user || response.success) {
                const userObj = response.user || {};
                setCreatedUser({
                    ...userObj,
                    password_link: response.passwordLink || response.password_link || response.activation_url
                });
                setShowSuccess(true);
                dialog.success(
                    selectedRole === 'parent'
                        ? (isRTL ? 'تم إنشاء حساب ولي الأمر بنجاح' : 'Compte parent créé avec succès')
                        : (isRTL ? 'تم إنشاء حساب الموظف بنجاح' : 'Compte personnel créé avec succès')
                );
            }
        } catch (error) {
            console.error('Erreur création utilisateur:', error);
            dialog.error(error.error || error.message || (isRTL ? 'خطأ في إنشاء الحساب' : 'Erreur lors de la création'));
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setShowSuccess(false);
        setCreatedUser(null);
        setSelectedChildren([]);
        setNoEmail(false);
        setCurrentStep(1);
        setChildMode('existing');
        setExpressChild({ first_name: '', birth_date: '', gender: 'female', regime: 'journee' });
        setFormData({
            first_name: '',
            last_name: '',
            email: '',
            phone: '',
            username: '',
            civility: 'female',
            staff_position: '',
            spouse_name: '',
            spouse_phone: '',
            emergency_contact_choice: 'custom',
            emergency_contact_name: '',
            emergency_contact_phone: ''
        });
        setErrors({});
        fetchOrphanChildren(true);
    };

    // Lien d'activation et envoi WhatsApp / SMS
    const activationLink = useMemo(() => {
        if (!createdUser) return '';
        const link = createdUser.password_link || createdUser.activation_url || `${window.location.origin}/create-password`;
        // Ensure it has a protocol so WhatsApp renders it as a link
        if (link.startsWith('http')) return link;
        return `${window.location.origin}${link.startsWith('/') ? '' : '/'}${link}`;
    }, [createdUser]);

    // Formatage international E.164 sans zéro pour wa.me (évite que WhatsApp prenne le numéro pour un @pseudo)
    const whatsAppPhone = useMemo(() => {
        const raw = (createdUser?.phone || formData.phone || '').trim();
        if (!raw) return '';
        let digits = raw.replace(/[^0-9]/g, '');

        // Retirer 00 initial si présent
        if (digits.startsWith('00')) {
            digits = digits.slice(2);
        }

        // 1. Tunisie (8 chiffres, ex: 98123456, 20123456, 50123456) -> ajouter 216
        if (/^\d{8}$/.test(digits)) {
            return `216${digits}`;
        }
        // 2. Tunisie déjà avec 216
        if (/^216\d{8}$/.test(digits)) {
            return digits;
        }

        // 3. France (10 chiffres commençant par 06 ou 07, ex: 0623446036) -> remplacer le 0 par 33
        if (/^0[67]\d{8}$/.test(digits)) {
            return `33${digits.slice(1)}`;
        }
        // 4. France déjà avec 33
        if (/^33[67]\d{8}$/.test(digits)) {
            return digits;
        }

        // 5. Tout numéro commençant par 0 : retirer le 0 pour éviter le bug WhatsApp "@pseudo"
        if (digits.startsWith('0')) {
            digits = digits.slice(1);
        }

        return digits;
    }, [createdUser, formData.phone]);

    const whatsAppMessage = useMemo(() => {
        if (!createdUser) return '';
        const name = createdUser.first_name || '';
        return isRTL
            ? `مرحباً ${name}،\n\nأهلاً بكم في الحضانة! 🎈\nتم إنشاء حسابكم بنجاح.\n\nيرجى الضغط على الرابط أدناه لتعيين كلمة المرور وتفعيل حسابكم بشكل آمن:\n\n🔗 ${activationLink}\n\nنحن سعداء بانضمامكم إلينا! 🌟`
            : `Bonjour ${name},\n\nBienvenue à la crèche ! 🎈\nVotre compte a été créé avec succès.\n\nVeuillez cliquer sur le lien ci-dessous pour définir votre mot de passe et activer votre accès sécurisé :\n\n🔗 ${activationLink}\n\nNous sommes ravis de vous compter parmi nous ! 🌟`;
    }, [createdUser, activationLink, isRTL]);

    const handleCopyActivationLink = () => {
        if (activationLink) {
            navigator.clipboard.writeText(activationLink);
            setCopiedLink(true);
            dialog.success(isRTL ? 'تم نسخ الرابط' : 'Lien copié dans le presse-papiers');
            setTimeout(() => setCopiedLink(false), 2500);
        }
    };

    const handleSendWhatsApp = () => {
        if (!whatsAppPhone) {
            dialog.error(isRTL ? 'رقم الهاتف غير متوفر' : 'Numéro de téléphone non renseigné');
            return;
        }
        const waUrl = `https://wa.me/${whatsAppPhone}?text=${encodeURIComponent(whatsAppMessage)}`;
        window.open(waUrl, '_blank');
    };

    const handleSendSms = () => {
        if (!whatsAppPhone) return;
        const smsUrl = `sms:${whatsAppPhone}?body=${encodeURIComponent(whatsAppMessage)}`;
        window.location.href = smsUrl;
    };

    // Options de poste staff
    const staffPositions = [
        { value: 'director', label: isRTL ? 'مدير/مديرة' : 'Directeur/Directrice' },
        { value: 'educator', label: isRTL ? 'مربي/مربية' : 'Éducateur/Éducatrice' },
        { value: 'health', label: isRTL ? 'طبيب متعاقد' : 'Médecin conventionné' },
        { value: 'cleaning', label: isRTL ? 'موظف نظافة' : 'Personnel d\'entretien' },
        { value: 'security', label: isRTL ? 'حارس أمن' : 'Agent de sécurité' },
        { value: 'kitchen', label: isRTL ? 'موظف مطبخ' : 'Personnel de cuisine' },
        { value: 'other', label: isRTL ? 'آخر' : 'Autre' }
    ];

    // ==========================================
    // ÉCRAN DE SUCCÈS (Mobile & Desktop)
    // ==========================================
    if (showSuccess && createdUser) {
        return (
            <div className="max-w-xl mx-auto px-4 py-6">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white dark:bg-gray-800 rounded-3xl p-6 sm:p-8 shadow-2xl border border-gray-100 dark:border-gray-700 text-center"
                >
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-inner">
                        <CheckCircle className="w-10 h-10 sm:w-12 sm:h-12" />
                    </div>

                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1">
                        {isRTL ? 'تم إنشاء الحساب بنجاح!' : 'Compte créé avec succès !'}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-300 font-medium text-lg">
                        {createdUser.first_name} {createdUser.last_name}
                    </p>
                    {createdUser.username && (
                        <p className="text-xs text-primary-600 dark:text-primary-400 font-mono mt-1">
                            @{createdUser.username}
                        </p>
                    )}

                    {/* Bloc invitation WhatsApp Instantanée */}
                    <div className="mt-6 p-4 sm:p-5 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/10 border-2 border-green-200 dark:border-green-800 rounded-2xl text-left rtl:text-right">
                        <div className="flex items-center gap-2 mb-2 text-green-800 dark:text-green-300 font-bold text-sm">
                            <MessageCircle className="w-4 h-4 text-green-600" />
                            <span>{isRTL ? 'دعوة فورية للوالد' : 'Invitation instantanée'}</span>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
                            {isRTL
                                ? 'يمكنك إرسال رابط التفعيل مباشرة للوالد عبر تطبيق واتساب أو الرسائل القصيرة بلمسة واحدة.'
                                : 'Envoyez immédiatement le lien d\'activation au parent via WhatsApp ou SMS en un seul clic.'}
                        </p>

                        <div className="flex flex-col sm:flex-row gap-2.5">
                            <button
                                type="button"
                                onClick={handleSendWhatsApp}
                                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-xl font-semibold shadow-md transition-all"
                            >
                                <MessageCircle className="w-5 h-5" />
                                <span>{isRTL ? 'إرسال عبر واتساب' : 'Envoyer via WhatsApp'}</span>
                            </button>
                            <button
                                type="button"
                                onClick={handleSendSms}
                                className="flex items-center justify-center gap-2 py-3 px-4 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-xl font-medium transition-all"
                            >
                                <Smartphone className="w-4 h-4" />
                                <span>SMS</span>
                            </button>
                        </div>
                    </div>

                    {/* Lien d'activation direct */}
                    <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center gap-2 text-left rtl:text-right">
                        <span className="text-xs text-gray-500 font-mono truncate flex-1 select-all">
                            {activationLink}
                        </span>
                        <button
                            type="button"
                            onClick={handleCopyActivationLink}
                            className="p-2 text-gray-600 dark:text-gray-300 hover:text-primary-600 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors shrink-0"
                            title="Copier le lien"
                        >
                            {copiedLink ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                        </button>
                    </div>

                    {/* Actions de navigation */}
                    <div className="mt-6 flex flex-col gap-2.5">
                        <Button
                            onClick={handleReset}
                            className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium"
                        >
                            <UserPlus className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
                            {isRTL ? 'إضافة مستخدم آخر' : 'Ajouter un autre utilisateur'}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => navigate('/dashboard')}
                            className="w-full py-3 rounded-xl"
                        >
                            {isRTL ? 'العودة للوحة التحكم' : 'Retour au dashboard'}
                        </Button>
                    </div>
                </motion.div>
            </div>
        );
    }

    // ==========================================
    // RENDU DU FORMULAIRE (WIZARD OU DESKTOP)
    // ==========================================
    return (
        <div className={`max-w-4xl mx-auto px-4 py-4 sm:py-6 space-y-6 ${isMobileScreen ? 'pb-24' : ''}`}>
            {/* En-tête */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                        {isRTL ? 'إضافة مستخدم جديد' : 'Nouvel utilisateur'}
                    </h1>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        {isRTL
                            ? 'تسجيل ولي أمر أو موظف مع دعوة فورية عبر واتساب'
                            : 'Enregistrement express avec invitation WhatsApp sans surcoût'}
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => navigate('/dashboard')}
                    className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    title={isRTL ? 'إلغاء وإغلاق' : 'Annuler et quitter'}
                >
                    <X className="w-6 h-6" />
                </button>
            </div>

            {/* Stepper Wizard (Particulièrement fluide sur smartphone) */}
            <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-2xl p-2.5 sm:p-4 shadow-sm border border-gray-100 dark:border-gray-700">
                {[
                    { step: 1, label: isRTL ? 'الملف' : 'Profil', icon: Users },
                    { step: 2, label: isRTL ? 'الاتصال' : 'Contact & Pseudo', icon: Phone },
                    { step: 3, label: selectedRole === 'parent' ? (isRTL ? 'الطفل' : 'Enfant') : (isRTL ? 'المنصب' : 'Poste'), icon: selectedRole === 'parent' ? Baby : Briefcase }
                ].map(({ step, label, icon: StepIcon }) => {
                    const isActive = currentStep === step;
                    const isPassed = currentStep > step;
                    return (
                        <div
                            key={step}
                            onClick={() => {
                                if (step < currentStep) setCurrentStep(step);
                                else if (step === currentStep + 1 && validateStep(currentStep)) setCurrentStep(step);
                            }}
                            className={`flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer transition-all ${
                                isActive
                                    ? 'bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 font-semibold shadow-sm'
                                    : isPassed
                                    ? 'text-green-600 dark:text-green-400 font-medium'
                                    : 'text-gray-400 dark:text-gray-500'
                            }`}
                        >
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                                isActive
                                    ? 'bg-primary-600 text-white'
                                    : isPassed
                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-500'
                            }`}>
                                {isPassed ? <Check className="w-4 h-4" /> : step}
                            </div>
                            <span className="text-xs sm:text-sm hidden sm:inline">{label}</span>
                        </div>
                    );
                })}
            </div>

            {/* Contenu de l'étape active */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-5 sm:p-8 shadow-xl border border-gray-100 dark:border-gray-700">
                <AnimatePresence mode="wait">
                    {/* ==========================================
                        ÉTAPE 1 : RÔLE & IDENTITÉ (CIVILITÉ ADAPTATIVE)
                    ========================================== */}
                    {currentStep === 1 && (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            {/* Choix du rôle */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                                    {isRTL ? 'نوع الحساب' : 'Type de compte'}
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { value: 'parent', label: isRTL ? 'ولي أمر' : 'Parent', icon: Users, color: 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/10' },
                                        { value: 'staff', label: isRTL ? 'موظف' : 'Personnel', icon: Briefcase, color: 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/10' }
                                    ].map(r => (
                                        <div
                                            key={r.value}
                                            onClick={() => handleRoleSelect(r.value)}
                                            className={`p-4 rounded-2xl border-2 cursor-pointer flex flex-col items-center justify-center gap-2 transition-all ${
                                                selectedRole === r.value
                                                    ? `${r.color} border-primary-600 shadow-sm font-bold text-gray-900 dark:text-white`
                                                    : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:border-gray-300'
                                            }`}
                                        >
                                            <r.icon className={`w-6 h-6 ${selectedRole === r.value ? 'text-primary-600' : 'text-gray-400'}`} />
                                            <span className="text-sm">{r.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Civilité Adaptative (Règle métier stricte: Mme/M. pour staff; Mère/Père pour parent) */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                                    {selectedRole === 'parent'
                                        ? (isRTL ? 'صلة القرابة بالطفل' : 'Lien avec l\'enfant (Civilité)')
                                        : (isRTL ? 'اللقب والصفة' : 'Civilité')} *
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                                    {selectedRole === 'parent' ? (
                                        <>
                                            {[
                                                { value: 'female', label: isRTL ? 'الأم (ماما)' : 'Mère (Maman)', emoji: '👩' },
                                                { value: 'male', label: isRTL ? 'الأب (بابا)' : 'Père (Papa)', emoji: '👨' }
                                            ].map(c => (
                                                <button
                                                    key={c.value}
                                                    type="button"
                                                    onClick={() => setFormData(p => ({ ...p, civility: c.value }))}
                                                    className={`py-3 px-3 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                                                        formData.civility === c.value
                                                            ? 'border-primary-600 bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 ring-2 ring-primary-500/20'
                                                            : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50'
                                                    }`}
                                                >
                                                    <span>{c.emoji}</span>
                                                    <span>{c.label}</span>
                                                </button>
                                            ))}
                                        </>
                                    ) : (
                                        <>
                                            {[
                                                { value: 'female', label: isRTL ? 'سيدة (Mme)' : 'Madame (Mme)', emoji: '👩' },
                                                { value: 'male', label: isRTL ? 'سيد (M.)' : 'Monsieur (M.)', emoji: '👨' }
                                            ].map(c => (
                                                <button
                                                    key={c.value}
                                                    type="button"
                                                    onClick={() => setFormData(p => ({ ...p, civility: c.value }))}
                                                    className={`py-3 px-3 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                                                        formData.civility === c.value
                                                            ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/20'
                                                            : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50'
                                                    }`}
                                                >
                                                    <span>{c.emoji}</span>
                                                    <span>{c.label}</span>
                                                </button>
                                            ))}
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Prénom et Nom */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                        {isRTL ? 'الاسم الأول' : 'Prénom'} *
                                    </label>
                                    <input
                                        type="text"
                                        name="first_name"
                                        value={formData.first_name}
                                        onChange={handleInputChange}
                                        placeholder={isRTL ? 'مثال: سارة' : 'Ex: Sarah'}
                                        className={`w-full px-4 py-3 border rounded-xl bg-gray-50/50 dark:bg-gray-700 text-gray-900 dark:text-white transition-all text-base ${
                                            errors.first_name ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-primary-500'
                                        }`}
                                    />
                                    {errors.first_name && <p className="text-red-500 text-xs mt-1">{errors.first_name}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                        {isRTL ? 'اسم العائلة' : 'Nom de famille'} *
                                    </label>
                                    <input
                                        type="text"
                                        name="last_name"
                                        value={formData.last_name}
                                        onChange={handleInputChange}
                                        placeholder={isRTL ? 'مثال: بن علي' : 'Ex: Ben Ali'}
                                        className={`w-full px-4 py-3 border rounded-xl bg-gray-50/50 dark:bg-gray-700 text-gray-900 dark:text-white transition-all text-base ${
                                            errors.last_name ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-primary-500'
                                        }`}
                                    />
                                    {errors.last_name && <p className="text-red-500 text-xs mt-1">{errors.last_name}</p>}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* ==========================================
                        ÉTAPE 2 : CONTACT & IDENTIFIANTS (SANS EMAIL / PSEUDO UNIQUE)
                    ========================================== */}
                    {currentStep === 2 && (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            {/* Téléphone (obligatoire) */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                    {isRTL ? 'رقم الهاتف (الأساسي لتسجيل الدخول وواتساب)' : 'Numéro de téléphone (WhatsApp & Login)'} *
                                </label>
                                <div className="relative">
                                    <Phone className="absolute left-3.5 rtl:left-auto rtl:right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        placeholder="Ex: 98 123 456 / +216 98 123 456"
                                        dir="ltr"
                                        className={`w-full pl-11 rtl:pl-4 rtl:pr-11 pr-4 py-3 border rounded-xl bg-gray-50/50 dark:bg-gray-700 text-gray-900 dark:text-white text-base font-mono ${
                                            errors.phone ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-primary-500'
                                        }`}
                                    />
                                </div>
                                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                            </div>

                            {/* Option sans email (toggle switch) */}
                            <div className="p-4 bg-gray-50 dark:bg-gray-900/40 rounded-2xl border border-gray-200 dark:border-gray-700 flex items-center justify-between">
                                <div className="flex-1 pr-4 rtl:pr-0 rtl:pl-4">
                                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                        {isRTL ? 'بدون بريد إلكتروني' : 'Pas d\'adresse e-mail'}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {isRTL
                                            ? 'سيتمكن المستخدم من تسجيل الدخول برقم هاتفه أو اسمه المستعار'
                                            : 'L\'utilisateur se connectera avec son téléphone ou son pseudo'}
                                    </p>
                                </div>
                                <ToggleSwitch 
                                    checked={noEmail} 
                                    onChange={(checked) => {
                                        setNoEmail(checked);
                                        if (checked) setFormData(p => ({ ...p, email: '' }));
                                    }} 
                                    size="md" 
                                />
                            </div>

                            {/* Email si activé */}
                            {!noEmail && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                        {isRTL ? 'البريد الإلكتروني' : 'Adresse e-mail'} <span className="text-gray-400 font-normal">({isRTL ? 'اختياري' : 'optionnel'})</span>
                                    </label>
                                    <div className="relative">
                                        <Mail className="absolute left-3.5 rtl:left-auto rtl:right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            placeholder="contact@exemple.com"
                                            className={`w-full pl-11 rtl:pl-4 rtl:pr-11 pr-4 py-3 border rounded-xl bg-gray-50/50 dark:bg-gray-700 text-gray-900 dark:text-white text-base ${
                                                errors.email ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-primary-500'
                                            }`}
                                        />
                                    </div>
                                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                                </div>
                            )}

                            {/* Pseudo / Nom d'utilisateur unique */}
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        {isRTL ? 'اسم المستخدم / اللقب (تسجيل دخول سريع)' : 'Pseudo de connexion'}
                                    </label>
                                    {usernameStatus.checking ? (
                                        <span className="text-xs text-gray-400 animate-pulse">Vérification...</span>
                                    ) : usernameStatus.available === true ? (
                                        <span className="text-xs text-green-600 font-semibold flex items-center gap-1">
                                            <Check className="w-3.5 h-3.5" /> {isRTL ? 'متاح' : 'Disponible'}
                                        </span>
                                    ) : usernameStatus.available === false ? (
                                        <span className="text-xs text-red-500 font-semibold flex items-center gap-1">
                                            <AlertCircle className="w-3.5 h-3.5" /> {usernameStatus.message}
                                        </span>
                                    ) : null}
                                </div>
                                <div className="relative">
                                    <span className="absolute left-3.5 rtl:left-auto rtl:right-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold">@</span>
                                    <input
                                        type="text"
                                        name="username"
                                        value={formData.username}
                                        onChange={handleInputChange}
                                        autoCapitalize="none"
                                        placeholder="sarah.b"
                                        className={`w-full pl-9 rtl:pl-4 rtl:pr-9 pr-4 py-3 border rounded-xl bg-gray-50/50 dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-base ${
                                            usernameStatus.available === false ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-primary-500'
                                        }`}
                                    />
                                </div>
                                <p className="text-xs text-gray-400 mt-1">
                                    {isRTL
                                        ? 'يسمح بالاتصال بدون بريد إلكتروني (يتم التحقق من الحسابات النشطة فقط)'
                                        : 'Permet la connexion sans e-mail (vérifié parmi les comptes actifs uniquement)'}
                                </p>
                            </div>
                        </motion.div>
                    )}

                    {/* ==========================================
                        ÉTAPE 3 : ASSOCIATION ENFANT OU POSTE STAFF
                    ========================================== */}
                    {currentStep === 3 && (
                        <motion.div
                            key="step3"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            {selectedRole === 'parent' ? (
                                <>
                                    {/* Onglets des 3 modes enfant */}
                                    <div className="grid grid-cols-3 gap-2 p-1.5 bg-gray-100 dark:bg-gray-900/60 rounded-2xl">
                                        {[
                                            { id: 'existing', label: isRTL ? 'طفل مسجل' : 'Enfant existant', icon: Baby },
                                            { id: 'express', label: isRTL ? 'تسجيل سريع' : 'Express (20s)', icon: Sparkles },
                                            { id: 'later', label: isRTL ? 'لاحقاً' : 'Associer plus tard', icon: Clock }
                                        ].map(tab => (
                                            <button
                                                key={tab.id}
                                                type="button"
                                                onClick={() => setChildMode(tab.id)}
                                                className={`py-2.5 px-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition-all ${
                                                    childMode === tab.id
                                                        ? 'bg-white dark:bg-gray-800 text-primary-600 dark:text-primary-400 shadow-sm'
                                                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-800'
                                                }`}
                                            >
                                                <tab.icon className="w-4 h-4" />
                                                <span className="whitespace-normal text-center leading-tight sm:truncate">{tab.label}</span>
                                            </button>
                                        ))}
                                    </div>

                                    {/* Mode 1: Enfant orphelin existant */}
                                    {childMode === 'existing' && (
                                        <div className="space-y-3">
                                            {loadingChildren ? (
                                                <div className="py-8 text-center text-gray-400">Chargement...</div>
                                            ) : orphanChildren.length === 0 ? (
                                                <div className="text-center py-6 bg-gray-50 dark:bg-gray-900/40 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                                                    <Baby className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                                        {isRTL ? 'لا يوجد أطفال بدون أولياء حالياً' : 'Aucun enfant sans parent actuellement'}
                                                    </p>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        {isRTL
                                                            ? 'استخدم التسجيل السريع لإنشاء ملف الطفل في 20 ثانية'
                                                            : 'Utilisez le mode "Express" pour créer l\'enfant instantanément.'}
                                                    </p>
                                                    <button
                                                        type="button"
                                                        onClick={() => setChildMode('express')}
                                                        className="mt-3 px-4 py-2 bg-primary-50 text-primary-700 dark:bg-primary-950/40 dark:text-primary-300 rounded-xl text-xs font-bold"
                                                    >
                                                        Passer en mode Express (20s)
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                                    {orphanChildren.map(child => {
                                                        const isSelected = selectedChildren.some(c => c.id === child.id);
                                                        return (
                                                            <div
                                                                key={child.id}
                                                                onClick={() => {
                                                                    setSelectedChildren(prev =>
                                                                        isSelected ? prev.filter(c => c.id !== child.id) : [...prev, child]
                                                                    );
                                                                }}
                                                                className={`p-3.5 rounded-2xl border-2 cursor-pointer flex items-center justify-between transition-all ${
                                                                    isSelected
                                                                        ? 'border-primary-600 bg-primary-50/50 dark:bg-primary-950/30'
                                                                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                                                                }`}
                                                            >
                                                                <div>
                                                                    <p className="font-bold text-gray-900 dark:text-white text-sm">
                                                                        {child.first_name} {child.last_name}
                                                                    </p>
                                                                    <p className="text-xs text-gray-500">
                                                                        {child.age_display || 'Enfant inscrit'}
                                                                    </p>
                                                                </div>
                                                                <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                                                                    isSelected ? 'bg-primary-600 text-white' : 'border border-gray-300'
                                                                }`}>
                                                                    {isSelected && <Check className="w-4 h-4" />}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                            {errors.child && <p className="text-red-500 text-xs">{errors.child}</p>}
                                        </div>
                                    )}

                                    {/* Mode 2: Inscription express 20s */}
                                    {childMode === 'express' && (
                                        <div className="p-4 bg-primary-50/40 dark:bg-primary-950/20 rounded-2xl border border-primary-100 dark:border-primary-900/40 space-y-4">
                                            <div className="flex items-center gap-2 text-primary-700 dark:text-primary-300 font-bold text-sm">
                                                <Sparkles className="w-4 h-4" />
                                                <span>{isRTL ? 'تسجيل طفل فوري' : 'Fiche express de l\'enfant'}</span>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                        {isRTL ? 'اسم الطفل' : 'Prénom de l\'enfant'} *
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={expressChild.first_name}
                                                        onChange={(e) => setExpressChild(p => ({ ...p, first_name: e.target.value }))}
                                                        placeholder={isRTL ? 'مثال: يوسف' : 'Ex: Youssef'}
                                                        className="w-full px-3 py-2.5 border rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm border-gray-200"
                                                    />
                                                    {errors.express_first_name && <p className="text-red-500 text-xs mt-1">{errors.express_first_name}</p>}
                                                </div>

                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                        {isRTL ? 'تاريخ الميلاد' : 'Date de naissance'} *
                                                    </label>
                                                    <input
                                                        type="date"
                                                        value={expressChild.birth_date}
                                                        onChange={(e) => setExpressChild(p => ({ ...p, birth_date: e.target.value }))}
                                                        className="w-full px-3 py-2.5 border rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm border-gray-200"
                                                    />
                                                    {errors.express_birth_date && <p className="text-red-500 text-xs mt-1">{errors.express_birth_date}</p>}
                                                </div>
                                            </div>

                                            {/* Ajout du régime */}
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                    {isRTL ? 'نظام الحضانة' : 'Régime de garde'} *
                                                </label>
                                                <div className="flex gap-3">
                                                    <button
                                                        type="button"
                                                        onClick={() => setExpressChild(p => ({ ...p, regime: 'journee' }))}
                                                        className={`flex-1 py-2 rounded-xl text-sm font-medium border ${expressChild.regime === 'journee' ? 'bg-primary-600 text-white border-primary-600' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700'}`}
                                                    >
                                                        {isRTL ? 'يوم كامل' : 'Journée complète'}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setExpressChild(p => ({ ...p, regime: 'demi' }))}
                                                        className={`flex-1 py-2 rounded-xl text-sm font-medium border ${expressChild.regime === 'demi' ? 'bg-primary-600 text-white border-primary-600' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700'}`}
                                                    >
                                                        {isRTL ? 'نصف يوم' : 'Demi-journée'}
                                                    </button>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                    {isRTL ? 'الجنس' : 'Sexe de l\'enfant'}
                                                </label>
                                                <div className="flex gap-3">
                                                    {[
                                                        { value: 'female', label: isRTL ? 'بنت' : 'Fille', emoji: '👧' },
                                                        { value: 'male', label: isRTL ? 'ولد' : 'Garçon', emoji: '👦' }
                                                    ].map(g => (
                                                        <button
                                                            key={g.value}
                                                            type="button"
                                                            onClick={() => setExpressChild(p => ({ ...p, gender: g.value }))}
                                                            className={`flex-1 py-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 ${
                                                                expressChild.gender === g.value
                                                                    ? 'bg-white dark:bg-gray-700 border-primary-600 text-primary-700 dark:text-primary-300 ring-1 ring-primary-500'
                                                                    : 'border-gray-200 text-gray-500'
                                                            }`}
                                                        >
                                                            <span>{g.emoji}</span>
                                                            <span>{g.label}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Mode 3: Associer plus tard */}
                                    {childMode === 'later' && (
                                        <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-2xl border border-amber-200 dark:border-amber-800 text-center space-y-2">
                                            <Clock className="w-8 h-8 text-amber-600 mx-auto" />
                                            <p className="text-sm font-bold text-amber-900 dark:text-amber-200">
                                                {isRTL ? 'سيتم ربط الطفل لاحقاً' : 'Association ultérieure'}
                                            </p>
                                            <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                                                {isRTL
                                                    ? 'سيتم تفعيل حساب الولي فوراً وتوليد مهمة إدارية لإكمال ملف الطفل لاحقاً.'
                                                    : 'Le compte du parent sera créé immédiatement. Une tâche automatique de haute priorité sera créée sur le tableau de bord de la direction pour compléter le dossier.'}
                                            </p>
                                        </div>
                                    )}
                                </>
                            ) : (
                                /* Rôle Personnel : Sélection du poste */
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        {isRTL ? 'المنصب الوظيفي' : 'Poste dans la crèche'} *
                                    </label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                        {staffPositions.map(pos => {
                                            const isSelected = formData.staff_position === pos.value;
                                            return (
                                                <button
                                                    key={pos.value}
                                                    type="button"
                                                    onClick={() => setFormData(p => ({ ...p, staff_position: pos.value }))}
                                                    className={`p-3.5 rounded-xl border text-sm font-semibold flex items-center justify-between transition-all ${
                                                        isSelected
                                                            ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/20'
                                                            : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50'
                                                    }`}
                                                >
                                                    <span>{pos.label}</span>
                                                    {isSelected && <Check className="w-4 h-4 text-emerald-600" />}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    {errors.staff_position && <p className="text-red-500 text-xs mt-1.5">{errors.staff_position}</p>}
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Boutons de navigation Wizard */}
                <div className="flex items-center justify-between pt-6 mt-6 border-t border-gray-100 dark:border-gray-700">
                    {currentStep > 1 ? (
                        <button
                            type="button"
                            onClick={handlePrevStep}
                            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all"
                        >
                            <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
                            <span>{isRTL ? 'السابق' : 'Précédent'}</span>
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={() => navigate('/dashboard')}
                            className="px-4 py-2.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                        >
                            {isRTL ? 'إلغاء' : 'Annuler'}
                        </button>
                    )}

                    {currentStep < 3 ? (
                        <button
                            type="button"
                            onClick={handleNextStep}
                            className="flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 active:scale-98 text-white rounded-xl font-semibold shadow-md transition-all text-sm"
                        >
                            <span>{isRTL ? 'التالي' : 'Suivant'}</span>
                            <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={loading}
                            className="flex items-center gap-2 px-7 py-3 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 active:scale-98 text-white rounded-xl font-bold shadow-lg shadow-green-600/20 transition-all text-sm disabled:opacity-50"
                        >
                            {loading ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                            ) : (
                                <Send className="w-4 h-4" />
                            )}
                            <span>{isRTL ? 'إنشاء وتجهيز الدعوة' : 'Créer & Générer invitation'}</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Navigation mobile */}
            {isMobileScreen && <MobileNavigation />}
        </div>
    );
};

export default AddUserPage;
