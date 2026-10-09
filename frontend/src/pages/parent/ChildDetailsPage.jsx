/**
 * ChildDetailsPage - Fiche enfant complète (style app mobile)
 */

import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    ArrowLeft,
    Calendar,
    User,
    Clock,
    AlertCircle,
    AlertTriangle,
    FileText,
    Stethoscope,
    Phone,
    Camera,
    Edit,
    Save,
    X,
    Loader2
} from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import { useTheme } from '../../hooks/useTheme';
import useIsMobile from '../../hooks/useIsMobile';
import MobileNavigation from '../../components/mobile/MobileNavigation';
import ToggleSwitch from '../../components/ui/ToggleSwitch';
import api from '../../services/api';
import API_CONFIG from '../../config/api';
import toast from 'react-hot-toast';

// Fonction pour construire l'URL complète de la photo
const getChildPhotoUrl = (photoUrl) => {
    if (!photoUrl) return null;
    if (photoUrl.startsWith('http')) return photoUrl;
    if (photoUrl.startsWith('blob:')) return photoUrl;
    if (photoUrl.startsWith('data:')) return photoUrl;
    return `${API_CONFIG.BASE_URL}${photoUrl.startsWith('/') ? '' : '/'}${photoUrl}`;
};

const ChildDetailsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isRTL } = useLanguage();
    const { isDark } = useTheme();
    const isMobile = useIsMobile();
    const fileInputRef = useRef(null);

    const [child, setChild] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [photoShared, setPhotoShared] = useState(false);

    const [medicalForm, setMedicalForm] = useState({
        allergies: '',
        medical_notes: '',
        doctor_name: '',
        doctor_phone: ''
    });

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        loadChildDetails();
    }, [id]);

    const parseAllergiesToString = (val) => {
        if (!val) return '';
        if (typeof val === 'string') {
            try {
                const parsed = JSON.parse(val);
                if (Array.isArray(parsed)) {
                    return parsed.map(item => (typeof item === 'string' ? item : item?.name || item?.label || '')).filter(Boolean).join(', ');
                }
            } catch (_) {}
            return val;
        }
        if (Array.isArray(val)) {
            return val.map(item => (typeof item === 'string' ? item : item?.name || item?.label || '')).filter(Boolean).join(', ');
        }
        return '';
    };

    const loadChildDetails = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/api/children/${id}`);
            if (response.data) {
                const childData = response.data.child || response.data;
                setChild(childData);
                setPhotoShared(childData.photo_shared_with_staff || false);
                setMedicalForm({
                    allergies: parseAllergiesToString(childData.allergies),
                    medical_notes: childData.medical_notes || childData.medical_info || '',
                    doctor_name: childData.doctor_name || '',
                    doctor_phone: childData.doctor_phone || ''
                });
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
            return `${years} ${isRTL ? 'سنة' : 'an'}${years > 1 && !isRTL ? 's' : ''} ${months > 0 ? `et ${months} ${isRTL ? 'شهر' : 'mois'}` : ''}`;
        }
        return `${months} ${isRTL ? 'شهر' : 'mois'}`;
    };

    const getEnrollmentDuration = () => {
        const enrollmentDate = child?.enrollment_date || child?.created_at;
        if (!enrollmentDate) return null;

        const enrollment = new Date(enrollmentDate);
        const today = new Date();
        const diffMs = today.getTime() - enrollment.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays < 1) return isRTL ? 'اليوم' : "Aujourd'hui";
        if (diffDays < 30) return `${diffDays} ${isRTL ? 'يوم' : 'jour'}${diffDays > 1 && !isRTL ? 's' : ''}`;
        if (diffDays < 365) {
            const months = Math.floor(diffDays / 30);
            return `${months} ${isRTL ? 'شهر' : 'mois'}`;
        }
        const years = Math.floor(diffDays / 365);
        return `${years} ${isRTL ? 'سنة' : 'an'}${years > 1 && !isRTL ? 's' : ''}`;
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return isRTL ? 'غير محدد' : 'Non renseigné';
        const date = new Date(dateStr);
        return date.toLocaleDateString(isRTL ? 'ar-TN' : 'fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    const getGender = () => {
        const gender = child?.gender || child?.sex;
        if (gender === 'M' || gender === 'male' || gender === 'Masculin') {
            return isRTL ? 'ذكر' : 'Garçon';
        }
        if (gender === 'F' || gender === 'female' || gender === 'Féminin') {
            return isRTL ? 'أنثى' : 'Fille';
        }
        return isRTL ? 'غير محدد' : 'Non renseigné';
    };

    const handlePhotoUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingPhoto(true);
        try {
            const formData = new FormData();
            formData.append('photo', file);

            const response = await api.post(`/api/children/${id}/photo`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (response.data?.photo_url) {
                setChild({ ...child, photo_url: response.data.photo_url });
                toast.success(isRTL ? 'تم تحديث الصورة' : 'Photo mise à jour');
            }
        } catch (err) {
            console.error('Erreur upload photo:', err);
            toast.error(isRTL ? 'خطأ في تحميل الصورة' : 'Erreur lors du téléchargement');
        } finally {
            setUploadingPhoto(false);
        }
    };

    const togglePhotoSharing = async () => {
        try {
            const newStatus = !photoShared;
            await api.put(`/api/children/${id}`, { photo_shared_with_staff: newStatus });
            setPhotoShared(newStatus);
            toast.success(newStatus
                ? (isRTL ? 'تم تفعيل مشاركة الصورة' : 'Partage de photo activé')
                : (isRTL ? 'تم إلغاء مشاركة الصورة' : 'Partage de photo désactivé')
            );
        } catch (err) {
            console.error('Erreur toggle photo:', err);
        }
    };

    const handleSaveMedical = async () => {
        setSaving(true);
        try {
            const payload = {
                ...medicalForm,
                medical_info: medicalForm.medical_notes
            };
            await api.put(`/api/children/${id}`, payload);
            setChild(prev => ({ ...prev, ...payload }));
            setEditing(false);
            toast.success(isRTL ? 'تم حفظ المعلومات الطبية' : 'Informations médicales sauvegardées');
        } catch (err) {
            console.error('Erreur sauvegarde:', err);
            toast.error(isRTL ? 'خطأ في الحفظ' : 'Erreur lors de la sauvegarde');
        } finally {
            setSaving(false);
        }
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
                        className="mt-4 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                    >
                        {isRTL ? 'العودة' : 'Retour'}
                    </button>
                </div>
                {isMobile && <MobileNavigation />}
            </div>
        );
    }

    const photoUrl = getChildPhotoUrl(child.photo_url);
    const initials = `${child.first_name?.charAt(0) || ''}${child.last_name?.charAt(0) || ''}`.toUpperCase();
    const age = calculateAge(child.birth_date || child.date_of_birth);
    const enrollmentDuration = getEnrollmentDuration();

    return (
        <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors ${isMobile ? 'pb-24' : ''}`}>
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white/95 dark:bg-gray-900/95 backdrop-blur border-b border-gray-200 dark:border-gray-800 shadow-sm transition-colors">
                <div className="flex items-center justify-between px-4 py-3.5 max-w-2xl mx-auto">
                    <button
                        onClick={() => navigate('/mon-espace')}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors text-gray-700 dark:text-gray-200"
                        title={isRTL ? 'رجوع' : 'Retour'}
                    >
                        <ArrowLeft className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
                    </button>
                    <h1 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                        {isRTL ? 'بطاقة الطفل' : 'Fiche enfant'}
                    </h1>
                    <div className="w-9" />
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
                {/* Section Profil avec Photo */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-gray-800 rounded-3xl p-6 sm:p-8 text-center shadow-sm border border-gray-200/80 dark:border-gray-700/60 transition-colors"
                >
                    {/* Photo avec bouton caméra moderne */}
                    <div className="flex flex-col items-center mb-4">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handlePhotoUpload}
                            accept="image/png,image/jpeg,image/webp,image/jpg"
                            className="hidden"
                        />
                        <div className="relative inline-block group">
                            {/* Cercle Avatar principal */}
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden bg-gradient-to-br from-gray-100 via-gray-50 to-gray-200 dark:from-gray-700 dark:via-gray-800 dark:to-gray-900 border-4 border-white dark:border-gray-800 shadow-md ring-2 ring-primary-100 dark:ring-primary-900/40 flex items-center justify-center cursor-pointer transition-all duration-300 group-hover:shadow-xl group-hover:ring-primary-400 dark:group-hover:ring-primary-500 relative"
                                title={isRTL ? 'انقر لتغيير الصورة' : 'Cliquer pour changer la photo'}
                            >
                                {photoUrl ? (
                                    <img
                                        src={photoUrl}
                                        alt={child.first_name}
                                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-tr from-primary-600 to-indigo-600 flex items-center justify-center">
                                        <span className="text-3xl font-bold text-white">{initials}</span>
                                    </div>
                                )}

                                {/* Overlay au survol */}
                                <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center text-white cursor-pointer">
                                    <Camera className="w-6 h-6 sm:w-7 sm:h-7 mb-0.5 drop-shadow" strokeWidth={2.2} />
                                    <span className="text-[10px] font-semibold tracking-wider uppercase drop-shadow">
                                        {isRTL ? 'تغيير' : 'Changer'}
                                    </span>
                                </div>
                            </div>

                            {/* Badge Icône Caméra moderne flottant en bas */}
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    fileInputRef.current?.click();
                                }}
                                disabled={uploadingPhoto}
                                aria-label={isRTL ? 'تغيير الصورة' : 'Modifier la photo'}
                                title={isRTL ? 'تغيير الصورة' : 'Modifier la photo'}
                                className={`absolute bottom-0 ${isRTL ? '-left-1' : '-right-1'} z-10 w-9 h-9 sm:w-10 sm:h-10 rounded-full aspect-square flex-shrink-0 bg-gradient-to-tr from-primary-600 via-primary-500 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 text-white flex items-center justify-center shadow-lg ring-3 ring-white dark:ring-gray-800 transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer disabled:opacity-50`}
                            >
                                {uploadingPhoto ? (
                                    <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin text-white" />
                                ) : (
                                    <Camera className="w-4 h-4 sm:w-5 sm:h-5 text-white drop-shadow-sm" strokeWidth={2.2} />
                                )}
                            </button>
                        </div>

                        {/* Bouton d'action et libellés sous la photo */}
                        <div className="text-center mt-3 space-y-1">
                            <div>
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploadingPhoto}
                                    className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-medium text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-900/30 hover:bg-primary-100 dark:hover:bg-primary-900/60 border border-primary-200 dark:border-primary-800/80 shadow-xs transition-all duration-150 active:scale-95 cursor-pointer disabled:opacity-50"
                                >
                                    <Camera className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" strokeWidth={2.2} />
                                    <span>{isRTL ? 'تغيير الصورة' : 'Changer la photo'}</span>
                                </button>
                            </div>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400">
                                {isRTL ? 'JPG, PNG أو WEBP حتى 5MB' : 'JPG, PNG ou WEBP jusqu\'à 5MB'}
                            </p>
                        </div>
                    </div>

                    {/* Toggle Partager la photo */}
                    <div className="inline-flex items-center gap-3 mb-4 px-4 py-2 bg-gray-50 dark:bg-gray-700/50 rounded-full border border-gray-200/60 dark:border-gray-600/60">
                        <span className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm font-medium">
                            {isRTL ? 'مشاركة الصورة مع الفريق' : 'Partager la photo avec l\'équipe'}
                        </span>
                        <ToggleSwitch
                            checked={photoShared}
                            onChange={togglePhotoSharing}
                            size="md"
                            ariaLabel={isRTL ? 'مشاركة الصورة مع الفريق' : 'Partager la photo avec l\'équipe'}
                        />
                    </div>

                    {/* Nom */}
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        {child.first_name} {child.last_name}
                    </h2>

                    {/* Badge âge */}
                    {age && (
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-sm font-medium">
                            <Calendar className="w-4 h-4" />
                            <span>{age}</span>
                        </div>
                    )}
                </motion.div>

                {/* Section Informations */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2.5 px-1">
                        {isRTL ? 'المعلومات العامة' : 'Informations Générales'}
                    </h3>
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/80 dark:border-gray-700/60 shadow-sm overflow-hidden transition-colors">
                        {/* Date de naissance */}
                        <div className="flex items-center gap-4 p-4">
                            <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 flex items-center justify-center shrink-0">
                                <Calendar className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">{isRTL ? 'تاريخ الميلاد' : 'Date de naissance'}</p>
                                <p className="text-gray-900 dark:text-white font-semibold mt-0.5">
                                    {formatDate(child.birth_date || child.date_of_birth)}
                                </p>
                            </div>
                        </div>

                        <div className="h-px bg-gray-100 dark:bg-gray-700/60 mx-4" />

                        {/* Genre */}
                        <div className="flex items-center gap-4 p-4">
                            <div className="w-10 h-10 rounded-xl bg-pink-50 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 flex items-center justify-center shrink-0">
                                <User className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">{isRTL ? 'الجنس' : 'Genre'}</p>
                                <p className="text-gray-900 dark:text-white font-semibold mt-0.5">{getGender()}</p>
                            </div>
                        </div>

                        <div className="h-px bg-gray-100 dark:bg-gray-700/60 mx-4" />

                        {/* Inscrit depuis */}
                        <div className="flex items-center gap-4 p-4">
                            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                                <Clock className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">{isRTL ? 'مسجل منذ' : 'Inscrit depuis'}</p>
                                <p className="text-gray-900 dark:text-white font-semibold mt-0.5">
                                    {enrollmentDuration || (isRTL ? 'غير محدد' : 'Non renseigné')}
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Section Informations Médicales */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <div className="flex items-center justify-between mb-2.5 px-1">
                        <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            {isRTL ? 'المعلومات الطبية' : 'Informations Médicales'}
                        </h3>
                        <button
                            onClick={() => editing ? handleSaveMedical() : setEditing(true)}
                            disabled={saving}
                            className="flex items-center gap-1.5 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-xs sm:text-sm font-semibold px-3 py-1.5 rounded-lg bg-primary-50 dark:bg-primary-900/30 transition-colors"
                        >
                            {saving ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : editing ? (
                                <>
                                    <Save className="w-4 h-4" />
                                    <span>{isRTL ? 'حفظ' : 'Enregistrer'}</span>
                                </>
                            ) : (
                                <>
                                    <Edit className="w-4 h-4" />
                                    <span>{isRTL ? 'تعديل' : 'Modifier'}</span>
                                </>
                            )}
                        </button>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/80 dark:border-gray-700/60 shadow-sm overflow-hidden transition-colors">
                        {editing ? (
                            <div className="p-4 sm:p-5 space-y-4">
                                {/* Allergies */}
                                <div>
                                    <label className="block text-gray-700 dark:text-gray-300 text-xs sm:text-sm font-medium mb-1.5">
                                        {isRTL ? 'الحساسية' : 'Allergies'}
                                    </label>
                                    <input
                                        type="text"
                                        value={medicalForm.allergies}
                                        onChange={(e) => setMedicalForm({ ...medicalForm, allergies: e.target.value })}
                                        placeholder={isRTL ? 'لا توجد حساسية معروفة' : 'Aucune allergie connue'}
                                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700/60 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white dark:focus:bg-gray-700 transition-colors text-sm"
                                    />
                                </div>

                                {/* Notes médicales */}
                                <div>
                                    <label className="block text-gray-700 dark:text-gray-300 text-xs sm:text-sm font-medium mb-1.5">
                                        {isRTL ? 'ملاحظات طبية' : 'Notes médicales'}
                                    </label>
                                    <textarea
                                        value={medicalForm.medical_notes}
                                        onChange={(e) => setMedicalForm({ ...medicalForm, medical_notes: e.target.value })}
                                        placeholder={isRTL ? 'معلومات طبية أخرى...' : 'Autres informations médicales...'}
                                        rows={3}
                                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700/60 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white dark:focus:bg-gray-700 transition-colors text-sm resize-none"
                                    />
                                </div>

                                {/* Médecin */}
                                <div>
                                    <label className="block text-gray-700 dark:text-gray-300 text-xs sm:text-sm font-medium mb-1.5">
                                        {isRTL ? 'اسم الطبيب' : 'Nom du médecin'}
                                    </label>
                                    <input
                                        type="text"
                                        value={medicalForm.doctor_name}
                                        onChange={(e) => setMedicalForm({ ...medicalForm, doctor_name: e.target.value })}
                                        placeholder="Dr. Martin"
                                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700/60 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white dark:focus:bg-gray-700 transition-colors text-sm"
                                    />
                                </div>

                                {/* Téléphone médecin */}
                                <div>
                                    <label className="block text-gray-700 dark:text-gray-300 text-xs sm:text-sm font-medium mb-1.5">
                                        {isRTL ? 'هاتف الطبيب' : 'Téléphone du médecin'}
                                    </label>
                                    <input
                                        type="tel"
                                        value={medicalForm.doctor_phone}
                                        onChange={(e) => setMedicalForm({ ...medicalForm, doctor_phone: e.target.value })}
                                        placeholder="+216 XX XXX XXX"
                                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700/60 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white dark:focus:bg-gray-700 transition-colors text-sm"
                                    />
                                </div>

                                {/* Bouton Annuler */}
                                <button
                                    onClick={() => {
                                        setEditing(false);
                                        setMedicalForm({
                                            allergies: child.allergies || '',
                                            medical_notes: child.medical_notes || child.medical_info || '',
                                            doctor_name: child.doctor_name || '',
                                            doctor_phone: child.doctor_phone || ''
                                        });
                                    }}
                                    className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-xl font-medium transition-colors text-sm"
                                >
                                    {isRTL ? 'إلغاء' : 'Annuler'}
                                </button>
                            </div>
                        ) : (
                            <>
                                {/* Allergies */}
                                <div className="flex items-start gap-4 p-4 sm:p-5">
                                    <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                                        <AlertTriangle className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-gray-900 dark:text-white font-semibold text-sm">{isRTL ? 'الحساسية' : 'Allergies'}</p>
                                        <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">
                                            {parseAllergiesToString(child.allergies) || (isRTL ? 'لا توجد حساسية معروفة' : 'Aucune allergie connue')}
                                        </p>
                                    </div>
                                </div>

                                <div className="h-px bg-gray-100 dark:bg-gray-700/60 mx-4" />

                                {/* Notes médicales */}
                                <div className="flex items-start gap-4 p-4 sm:p-5">
                                    <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                                        <FileText className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-gray-900 dark:text-white font-semibold text-sm">{isRTL ? 'ملاحظات طبية' : 'Notes médicales'}</p>
                                        <p className="text-gray-600 dark:text-gray-300 text-sm mt-1 whitespace-pre-line">
                                            {child.medical_notes || child.medical_info || (isRTL ? 'لا توجد ملاحظات' : 'Aucune note')}
                                        </p>
                                    </div>
                                </div>

                                <div className="h-px bg-gray-100 dark:bg-gray-700/60 mx-4" />

                                {/* Médecin traitant */}
                                <div className="flex items-start gap-4 p-4 sm:p-5">
                                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                                        <Stethoscope className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-gray-900 dark:text-white font-semibold text-sm">{isRTL ? 'الطبيب المعالج' : 'Médecin traitant'}</p>
                                        <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">
                                            {child.doctor_name || (isRTL ? 'غير محدد' : 'Non renseigné')}
                                        </p>
                                        {child.doctor_phone && (
                                            <a
                                                href={`tel:${child.doctor_phone}`}
                                                className="inline-flex items-center gap-1.5 text-primary-600 dark:text-primary-400 font-semibold text-sm mt-1.5 hover:underline"
                                            >
                                                <Phone className="w-3.5 h-3.5" />
                                                <span>{child.doctor_phone}</span>
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </motion.div>
            </div>

            {isMobile && <MobileNavigation />}
        </div>
    );
};

export default ChildDetailsPage;
