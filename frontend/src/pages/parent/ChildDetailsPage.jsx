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

    const loadChildDetails = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/api/children/${id}`);
            if (response.data) {
                const childData = response.data.child || response.data;
                setChild(childData);
                setPhotoShared(childData.photo_shared_with_staff || false);
                setMedicalForm({
                    allergies: childData.allergies || '',
                    medical_notes: childData.medical_notes || '',
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
            await api.put(`/api/children/${id}`, medicalForm);
            setChild({ ...child, ...medicalForm });
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
                        className="mt-4 px-6 py-2 bg-primary-600 text-white rounded-lg"
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
        <div className={`min-h-screen bg-gray-900 ${isMobile ? 'pb-24' : ''}`}>
            {/* Header */}
            <div className="sticky top-0 z-10 bg-gray-900 border-b border-gray-800">
                <div className="flex items-center justify-between px-4 py-4">
                    <button
                        onClick={() => navigate('/mon-espace')}
                        className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-6 h-6 text-white" />
                    </button>
                    <h1 className="text-lg font-semibold text-white">
                        {isRTL ? 'بطاقة الطفل' : 'Fiche enfant'}
                    </h1>
                    <div className="w-10" />
                </div>
            </div>

            <div className="max-w-2xl mx-auto">
                {/* Section Profil avec Photo */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gray-800 rounded-b-3xl px-6 py-8 text-center"
                >
                    {/* Photo avec bouton caméra */}
                    <div className="relative inline-block mb-4">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handlePhotoUpload}
                            accept="image/*"
                            className="hidden"
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploadingPhoto}
                            className="relative"
                        >
                            {photoUrl ? (
                                <img
                                    src={photoUrl}
                                    alt={child.first_name}
                                    className="w-28 h-28 rounded-full object-cover border-4 border-gray-700"
                                />
                            ) : (
                                <div className="w-28 h-28 rounded-full bg-primary-600 flex items-center justify-center border-4 border-gray-700">
                                    <span className="text-3xl font-bold text-white">{initials}</span>
                                </div>
                            )}
                            <div className="absolute bottom-0 right-0 w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center border-2 border-gray-800">
                                {uploadingPhoto ? (
                                    <Loader2 className="w-4 h-4 text-white animate-spin" />
                                ) : (
                                    <Camera className="w-4 h-4 text-white" />
                                )}
                            </div>
                        </button>
                    </div>

                    <p className="text-gray-400 text-sm mb-3">
                        {isRTL ? 'اضغط لتغيير الصورة' : 'Appuyez pour modifier la photo'}
                    </p>

                    {/* Toggle Partager la photo */}
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <span className="text-gray-300 text-sm">
                            {isRTL ? 'مشاركة الصورة' : 'Partager la photo'}
                        </span>
                        <button
                            onClick={togglePhotoSharing}
                            className={`relative w-12 h-6 rounded-full transition-colors ${photoShared ? 'bg-primary-600' : 'bg-gray-600'
                                }`}
                        >
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${photoShared ? 'left-7' : 'left-1'
                                }`} />
                        </button>
                    </div>

                    {/* Nom */}
                    <h2 className="text-2xl font-bold text-white mb-2">
                        {child.first_name} {child.last_name}
                    </h2>

                    {/* Badge âge */}
                    {age && (
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600/20 rounded-full">
                            <Calendar className="w-4 h-4 text-primary-400" />
                            <span className="text-primary-300 font-medium">{age}</span>
                        </div>
                    )}
                </motion.div>

                {/* Section Informations */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="px-4 mt-6"
                >
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                        {isRTL ? 'المعلومات' : 'INFORMATIONS'}
                    </h3>
                    <div className="bg-gray-800 rounded-2xl overflow-hidden">
                        {/* Date de naissance */}
                        <div className="flex items-center gap-4 p-4">
                            <div className="w-10 h-10 rounded-xl bg-primary-600/20 flex items-center justify-center">
                                <Calendar className="w-5 h-5 text-primary-400" />
                            </div>
                            <div className="flex-1">
                                <p className="text-gray-400 text-sm">{isRTL ? 'تاريخ الميلاد' : 'Date de naissance'}</p>
                            </div>
                            <p className="text-white font-medium">
                                {formatDate(child.birth_date || child.date_of_birth)}
                            </p>
                        </div>

                        <div className="h-px bg-gray-700 mx-4" />

                        {/* Genre */}
                        <div className="flex items-center gap-4 p-4">
                            <div className="w-10 h-10 rounded-xl bg-pink-600/20 flex items-center justify-center">
                                <User className="w-5 h-5 text-pink-400" />
                            </div>
                            <div className="flex-1">
                                <p className="text-gray-400 text-sm">{isRTL ? 'الجنس' : 'Genre'}</p>
                            </div>
                            <p className="text-white font-medium">{getGender()}</p>
                        </div>

                        <div className="h-px bg-gray-700 mx-4" />

                        {/* Inscrit depuis */}
                        <div className="flex items-center gap-4 p-4">
                            <div className="w-10 h-10 rounded-xl bg-green-600/20 flex items-center justify-center">
                                <Clock className="w-5 h-5 text-green-400" />
                            </div>
                            <div className="flex-1">
                                <p className="text-gray-400 text-sm">{isRTL ? 'مسجل منذ' : 'Inscrit depuis'}</p>
                            </div>
                            <p className="text-white font-medium">
                                {enrollmentDuration || (isRTL ? 'غير محدد' : 'Non renseigné')}
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* Section Informations Médicales */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="px-4 mt-6 pb-8"
                >
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                            {isRTL ? 'المعلومات الطبية' : 'INFORMATIONS MÉDICALES'}
                        </h3>
                        <button
                            onClick={() => editing ? handleSaveMedical() : setEditing(true)}
                            disabled={saving}
                            className="flex items-center gap-1 text-primary-400 hover:text-primary-300 text-sm font-medium"
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

                    <div className="bg-gray-800 rounded-2xl overflow-hidden">
                        {editing ? (
                            <div className="p-4 space-y-4">
                                {/* Allergies */}
                                <div>
                                    <label className="block text-gray-400 text-sm mb-2">
                                        {isRTL ? 'الحساسية' : 'Allergies'}
                                    </label>
                                    <input
                                        type="text"
                                        value={medicalForm.allergies}
                                        onChange={(e) => setMedicalForm({ ...medicalForm, allergies: e.target.value })}
                                        placeholder={isRTL ? 'لا توجد حساسية معروفة' : 'Aucune allergie connue'}
                                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
                                    />
                                </div>

                                {/* Notes médicales */}
                                <div>
                                    <label className="block text-gray-400 text-sm mb-2">
                                        {isRTL ? 'ملاحظات طبية' : 'Notes médicales'}
                                    </label>
                                    <textarea
                                        value={medicalForm.medical_notes}
                                        onChange={(e) => setMedicalForm({ ...medicalForm, medical_notes: e.target.value })}
                                        placeholder={isRTL ? 'معلومات طبية أخرى...' : 'Autres informations médicales...'}
                                        rows={3}
                                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 resize-none"
                                    />
                                </div>

                                {/* Médecin */}
                                <div>
                                    <label className="block text-gray-400 text-sm mb-2">
                                        {isRTL ? 'اسم الطبيب' : 'Nom du médecin'}
                                    </label>
                                    <input
                                        type="text"
                                        value={medicalForm.doctor_name}
                                        onChange={(e) => setMedicalForm({ ...medicalForm, doctor_name: e.target.value })}
                                        placeholder="Dr. Martin"
                                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
                                    />
                                </div>

                                {/* Téléphone médecin */}
                                <div>
                                    <label className="block text-gray-400 text-sm mb-2">
                                        {isRTL ? 'هاتف الطبيب' : 'Téléphone du médecin'}
                                    </label>
                                    <input
                                        type="tel"
                                        value={medicalForm.doctor_phone}
                                        onChange={(e) => setMedicalForm({ ...medicalForm, doctor_phone: e.target.value })}
                                        placeholder="+216 XX XXX XXX"
                                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
                                    />
                                </div>

                                {/* Bouton Annuler */}
                                <button
                                    onClick={() => {
                                        setEditing(false);
                                        setMedicalForm({
                                            allergies: child.allergies || '',
                                            medical_notes: child.medical_notes || '',
                                            doctor_name: child.doctor_name || '',
                                            doctor_phone: child.doctor_phone || ''
                                        });
                                    }}
                                    className="w-full py-3 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-xl font-medium transition-colors"
                                >
                                    {isRTL ? 'إلغاء' : 'Annuler'}
                                </button>
                            </div>
                        ) : (
                            <>
                                {/* Allergies */}
                                <div className="flex items-start gap-4 p-4">
                                    <div className="w-10 h-10 rounded-xl bg-red-600/20 flex items-center justify-center flex-shrink-0">
                                        <AlertTriangle className="w-5 h-5 text-red-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-white font-medium">{isRTL ? 'الحساسية' : 'Allergies'}</p>
                                        <p className="text-gray-400 text-sm mt-1">
                                            {child.allergies || (isRTL ? 'لا توجد حساسية معروفة' : 'Aucune allergie connue')}
                                        </p>
                                    </div>
                                </div>

                                <div className="h-px bg-gray-700 mx-4" />

                                {/* Notes médicales */}
                                <div className="flex items-start gap-4 p-4">
                                    <div className="w-10 h-10 rounded-xl bg-yellow-600/20 flex items-center justify-center flex-shrink-0">
                                        <FileText className="w-5 h-5 text-yellow-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-white font-medium">{isRTL ? 'ملاحظات طبية' : 'Notes médicales'}</p>
                                        <p className="text-gray-400 text-sm mt-1">
                                            {child.medical_notes || (isRTL ? 'لا توجد ملاحظات' : 'Aucune note')}
                                        </p>
                                    </div>
                                </div>

                                <div className="h-px bg-gray-700 mx-4" />

                                {/* Médecin traitant */}
                                <div className="flex items-start gap-4 p-4">
                                    <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center flex-shrink-0">
                                        <Stethoscope className="w-5 h-5 text-blue-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-white font-medium">{isRTL ? 'الطبيب المعالج' : 'Médecin traitant'}</p>
                                        <p className="text-gray-400 text-sm mt-1">
                                            {child.doctor_name || (isRTL ? 'غير محدد' : 'Non renseigné')}
                                        </p>
                                        {child.doctor_phone && (
                                            <a
                                                href={`tel:${child.doctor_phone}`}
                                                className="flex items-center gap-1 text-primary-400 text-sm mt-1"
                                            >
                                                <Phone className="w-3 h-3" />
                                                {child.doctor_phone}
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
