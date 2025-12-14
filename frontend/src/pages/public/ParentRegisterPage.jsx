/**
 * Page d'inscription Parent (Self-Service)
 * Permet à un parent de créer son compte si son enfant est déjà inscrit
 */

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    User, Mail, Phone, Lock, Eye, EyeOff, Baby,
    AlertCircle, ArrowRight, CheckCircle, Search, X
} from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import userWorkflowService from '../../services/userWorkflowService';

const ParentRegisterPage = () => {
    const { isRTL } = useLanguage();
    const navigate = useNavigate();

    const [step, setStep] = useState(1);
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [searchLoading, setSearchLoading] = useState(false);
    const [selectedChild, setSelectedChild] = useState(null);
    const [searchResults, setSearchResults] = useState([]);
    const [childSearchQuery, setChildSearchQuery] = useState('');
    const [childSearchError, setChildSearchError] = useState('');
    const [createdUser, setCreatedUser] = useState(null);

    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        password: '',
        confirm_password: ''
    });

    const [errors, setErrors] = useState({});

    const handleSearchChild = async () => {
        if (!childSearchQuery.trim()) {
            setChildSearchError(isRTL ? 'أدخل اسم طفلك' : 'Entrez le nom de votre enfant');
            return;
        }

        setSearchLoading(true);
        setChildSearchError('');
        setSelectedChild(null);
        setSearchResults([]);

        try {
            const response = await userWorkflowService.getOrphanChildren(childSearchQuery.trim());

            if (response.success && response.children && response.children.length > 0) {
                if (response.children.length === 1) {
                    // Un seul résultat → sélection automatique
                    setSelectedChild(response.children[0]);
                } else {
                    // Plusieurs résultats → afficher la liste pour choix
                    setSearchResults(response.children);
                }
            } else {
                setChildSearchError(
                    isRTL
                        ? 'لم يتم العثور على طفلك. تأكد من أن طفلك مسجل في الحضانة أو اتصل بالإدارة.'
                        : 'Votre enfant n\'a pas été trouvé. Vérifiez que votre enfant est bien inscrit à la crèche ou contactez l\'administration.'
                );
            }
        } catch (error) {
            console.error('Erreur recherche enfant:', error);
            setChildSearchError(isRTL ? 'خطأ في البحث. حاول مرة أخرى.' : 'Erreur lors de la recherche.');
        } finally {
            setSearchLoading(false);
        }
    };

    const handleSelectChild = (child) => {
        setSelectedChild(child);
        setSearchResults([]);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.first_name.trim()) newErrors.first_name = isRTL ? 'الاسم الأول مطلوب' : 'Le prénom est requis';
        if (!formData.last_name.trim()) newErrors.last_name = isRTL ? 'اسم العائلة مطلوب' : 'Le nom est requis';
        if (!formData.email.trim()) {
            newErrors.email = isRTL ? 'البريد الإلكتروني مطلوب' : 'L\'email est requis';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = isRTL ? 'البريد الإلكتروني غير صحيح' : 'Format d\'email invalide';
        }
        if (!formData.phone.trim()) newErrors.phone = isRTL ? 'رقم الهاتف مطلوب' : 'Le téléphone est requis';
        if (!formData.password) {
            newErrors.password = isRTL ? 'كلمة المرور مطلوبة' : 'Le mot de passe est requis';
        } else if (formData.password.length < 6) {
            newErrors.password = isRTL ? '6 أحرف على الأقل' : 'Minimum 6 caractères';
        }
        if (formData.password !== formData.confirm_password) {
            newErrors.confirm_password = isRTL ? 'كلمات المرور غير متطابقة' : 'Les mots de passe ne correspondent pas';
        }
        if (!selectedChild) {
            newErrors.child = isRTL ? 'يجب البحث عن طفلك' : 'Vous devez rechercher votre enfant';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setLoading(true);
        try {
            const response = await userWorkflowService.registerParent({
                first_name: formData.first_name,
                last_name: formData.last_name,
                email: formData.email,
                phone: formData.phone,
                password: formData.password,
                child_already_enrolled: true,
                child_id: selectedChild.id
            });

            if (response.success) {
                setCreatedUser(response.user);
                setStep(3);
            }
        } catch (error) {
            console.error('Erreur inscription:', error);
            setErrors({ submit: error.error || (isRTL ? 'خطأ في التسجيل' : 'Erreur lors de l\'inscription') });
        } finally {
            setLoading(false);
        }
    };

    // Étape 1: Choix
    if (step === 1) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-lg mx-auto">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                            {isRTL ? 'إنشاء حساب ولي أمر' : 'Créer un compte parent'}
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-2">
                            {isRTL ? 'اختر الخيار المناسب' : 'Choisissez l\'option qui correspond à votre situation'}
                        </p>
                    </div>

                    <div className="space-y-4">
                        <Card className="cursor-pointer transition-all hover:shadow-lg hover:ring-2 hover:ring-primary-300" onClick={() => setStep(2)}>
                            <CardContent className="p-6">
                                <div className="flex items-start gap-4">
                                    <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30">
                                        <Baby className="w-6 h-6 text-green-600 dark:text-green-400" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                            {isRTL ? 'طفلي مسجل بالفعل' : 'Mon enfant est déjà inscrit'}
                                        </h3>
                                        <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                                            {isRTL ? 'تم تسجيل طفلي وأريد إنشاء حسابي' : 'Mon enfant a été inscrit et je souhaite créer mon compte'}
                                        </p>
                                    </div>
                                    <ArrowRight className="w-5 h-5 text-gray-400" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="cursor-pointer transition-all hover:shadow-lg hover:ring-2 hover:ring-blue-300" onClick={() => navigate('/inscription')}>
                            <CardContent className="p-6">
                                <div className="flex items-start gap-4">
                                    <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30">
                                        <User className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                            {isRTL ? 'أريد تسجيل طفلي' : 'Je souhaite inscrire mon enfant'}
                                        </h3>
                                        <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                                            {isRTL ? 'طفلي غير مسجل بعد' : 'Mon enfant n\'est pas encore inscrit'}
                                        </p>
                                    </div>
                                    <ArrowRight className="w-5 h-5 text-gray-400" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
                        {isRTL ? 'لديك حساب؟' : 'Vous avez déjà un compte ?'}{' '}
                        <Link to="/login" className="text-primary-600 hover:underline font-medium">
                            {isRTL ? 'تسجيل الدخول' : 'Se connecter'}
                        </Link>
                    </p>
                </motion.div>
            </div>
        );
    }

    // Étape 3: Succès
    if (step === 3 && createdUser) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-lg mx-auto">
                    <Card>
                        <CardContent className="pt-8 pb-6 text-center">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-6">
                                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                {isRTL ? 'تم إنشاء حسابك بنجاح!' : 'Compte créé avec succès !'}
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400 mb-6">
                                {isRTL ? `مرحباً ${createdUser.first_name}` : `Bienvenue ${createdUser.first_name}`}
                            </p>
                            {selectedChild && (
                                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 mb-6">
                                    <p className="text-green-800 dark:text-green-300 text-sm">
                                        {isRTL ? `تم ربط حسابك بـ ${selectedChild.first_name} ${selectedChild.last_name}` : `Compte associé à ${selectedChild.first_name} ${selectedChild.last_name}`}
                                    </p>
                                </div>
                            )}
                            <Button onClick={() => navigate('/')} className="w-full bg-primary-600 hover:bg-primary-700">
                                {isRTL ? 'العودة للصفحة الرئيسية' : 'Retour à l\'accueil'}
                            </Button>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        );
    }

    // Étape 2: Formulaire
    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-lg mx-auto">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        {isRTL ? 'إنشاء حساب ولي أمر' : 'Créer un compte parent'}
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">
                        {isRTL ? 'ابحث عن طفلك وأدخل معلوماتك' : 'Recherchez votre enfant et entrez vos informations'}
                    </p>
                </div>

                <Card>
                    <CardContent className="pt-6">
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Recherche enfant */}
                            <div className="bg-green-50 dark:bg-green-900/10 rounded-xl p-4 border border-green-200 dark:border-green-800">
                                <h3 className="font-semibold text-green-800 dark:text-green-300 mb-3 flex items-center gap-2">
                                    <Baby className="w-5 h-5" />
                                    {isRTL ? 'البحث عن طفلك' : 'Rechercher votre enfant'}
                                </h3>

                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                        <input
                                            type="text"
                                            value={childSearchQuery}
                                            onChange={(e) => { setChildSearchQuery(e.target.value); setChildSearchError(''); }}
                                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearchChild())}
                                            placeholder={isRTL ? 'اسم الطفل...' : 'Nom de l\'enfant...'}
                                            className="w-full pl-10 rtl:pl-3 rtl:pr-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        />
                                    </div>
                                    <Button type="button" onClick={handleSearchChild} disabled={searchLoading} className="bg-green-600 hover:bg-green-700">
                                        {searchLoading ? '...' : (isRTL ? 'بحث' : 'Rechercher')}
                                    </Button>
                                </div>

                                {childSearchError && (
                                    <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                                        <p className="text-red-600 dark:text-red-400 text-sm flex items-start gap-2">
                                            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                            {childSearchError}
                                        </p>
                                    </div>
                                )}

                                {/* Liste de résultats multiples */}
                                {searchResults.length > 0 && !selectedChild && (
                                    <div className="mt-3 space-y-2">
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            {isRTL ? 'عدة نتائج، اختر طفلك:' : 'Plusieurs résultats, sélectionnez votre enfant :'}
                                        </p>
                                        {searchResults.map(child => (
                                            <div
                                                key={child.id}
                                                onClick={() => handleSelectChild(child)}
                                                className="p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all"
                                            >
                                                <p className="font-medium text-gray-900 dark:text-white">{child.first_name} {child.last_name}</p>
                                                <p className="text-xs text-gray-500">{child.age_display || `${child.age_years || 0} ans`}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Enfant sélectionné */}
                                {selectedChild && (
                                    <div className="mt-3 p-3 bg-white dark:bg-gray-800 border-2 border-green-500 rounded-lg">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-medium text-gray-900 dark:text-white">{selectedChild.first_name} {selectedChild.last_name}</p>
                                                <p className="text-xs text-gray-500">{selectedChild.age_display || `${selectedChild.age_years || 0} ans`}</p>
                                            </div>
                                            <button type="button" onClick={() => { setSelectedChild(null); setChildSearchQuery(''); setSearchResults([]); }} className="text-gray-400 hover:text-red-500">
                                                <X className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {errors.child && !selectedChild && (
                                    <p className="text-red-500 text-xs mt-2 flex items-center"><AlertCircle className="w-3 h-3 mr-1" />{errors.child}</p>
                                )}
                            </div>

                            {/* Informations parent */}
                            <div className="border-t border-gray-200 dark:border-gray-700 pt-5">
                                <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                                    <User className="w-5 h-5" />
                                    {isRTL ? 'معلوماتك' : 'Vos informations'}
                                </h3>

                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{isRTL ? 'الاسم الأول' : 'Prénom'} *</label>
                                        <input type="text" name="first_name" value={formData.first_name} onChange={handleInputChange}
                                            className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${errors.first_name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`} />
                                        {errors.first_name && <p className="text-red-500 text-xs mt-1">{errors.first_name}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{isRTL ? 'اسم العائلة' : 'Nom'} *</label>
                                        <input type="text" name="last_name" value={formData.last_name} onChange={handleInputChange}
                                            className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${errors.last_name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`} />
                                        {errors.last_name && <p className="text-red-500 text-xs mt-1">{errors.last_name}</p>}
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{isRTL ? 'البريد الإلكتروني' : 'Email'} *</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                        <input type="email" name="email" value={formData.email} onChange={handleInputChange}
                                            className={`w-full pl-10 rtl:pl-3 rtl:pr-10 pr-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`} />
                                    </div>
                                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{isRTL ? 'رقم الهاتف' : 'Téléphone'} *</label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                        <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} dir="ltr"
                                            className={`w-full pl-10 rtl:pl-3 rtl:pr-10 pr-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${errors.phone ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`} />
                                    </div>
                                    {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{isRTL ? 'كلمة المرور' : 'Mot de passe'} *</label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                            <input type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleInputChange}
                                                className={`w-full pl-10 rtl:pl-3 rtl:pr-10 pr-10 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${errors.password ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`} />
                                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 rtl:right-auto rtl:left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                        {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{isRTL ? 'تأكيد' : 'Confirmer'} *</label>
                                        <input type={showPassword ? 'text' : 'password'} name="confirm_password" value={formData.confirm_password} onChange={handleInputChange}
                                            className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${errors.confirm_password ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`} />
                                        {errors.confirm_password && <p className="text-red-500 text-xs mt-1">{errors.confirm_password}</p>}
                                    </div>
                                </div>
                            </div>

                            {errors.submit && (
                                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                                    <p className="text-red-600 dark:text-red-400 text-sm flex items-center"><AlertCircle className="w-4 h-4 mr-2" />{errors.submit}</p>
                                </div>
                            )}

                            <div className="flex gap-3 pt-2">
                                <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1">
                                    {isRTL ? 'رجوع' : 'Retour'}
                                </Button>
                                <Button type="submit" disabled={loading} className="flex-1 bg-primary-600 hover:bg-primary-700">
                                    {loading ? (isRTL ? 'جاري...' : 'Création...') : (isRTL ? 'إنشاء الحساب' : 'Créer mon compte')}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
                    {isRTL ? 'لديك حساب؟' : 'Vous avez déjà un compte ?'}{' '}
                    <Link to="/login" className="text-primary-600 hover:underline font-medium">{isRTL ? 'تسجيل الدخول' : 'Se connecter'}</Link>
                </p>
            </motion.div>
        </div>
    );
};

export default ParentRegisterPage;
