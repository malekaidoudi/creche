/**
 * StaffChildDetailPage - Fiche enfant détaillée pour le staff (mobile)
 *
 * Remplace le modal desktop (inexploitable sur mobile) par une vraie page,
 * accessible depuis la liste des enfants (MobileChildrenList) via
 * /dashboard/children/:id.
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
  MessageSquare,
  Stethoscope,
  AlertTriangle,
  Edit,
  UserPlus
} from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import { useAuth } from '../../hooks/useAuth';
import useIsMobile from '../../hooks/useIsMobile';
import MobileNavigation from '../../components/mobile/MobileNavigation';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { useAccess } from '../../access';
import api from '../../services/api';
import API_CONFIG from '../../config/api';

const getChildPhotoUrl = (photoUrl) => {
  if (!photoUrl) return null;
  if (photoUrl.startsWith('http') || photoUrl.startsWith('blob:') || photoUrl.startsWith('data:')) return photoUrl;
  return `${API_CONFIG.BASE_URL}${photoUrl.startsWith('/') ? '' : '/'}${photoUrl}`;
};

const StaffChildDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isRTL } = useLanguage();
  const { isAdmin, isStaff } = useAuth();
  const isMobile = useIsMobile();
  const { can, loading: accessLoading } = useAccess();

  const [child, setChild] = useState(null);
  const [medical, setMedical] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    loadChild();
  }, [id]);

  const loadChild = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/api/children/${id}`);
      if (response.data?.success) {
        setChild(response.data.child);
      } else {
        setError(isRTL ? 'الطفل غير موجود' : 'Enfant non trouvé');
      }
    } catch (err) {
      console.error('Erreur chargement enfant:', err);
      setError(
        err.response?.status === 403
          ? (isRTL ? 'غير مصرح لك بالوصول' : 'Accès non autorisé')
          : (isRTL ? 'خطأ في تحميل البيانات' : 'Erreur lors du chargement')
      );
    } finally {
      setLoading(false);
    }
  };

  // Les infos médicales détaillées (allergies, médicaments, médecin...) vivent
  // dans une route dédiée, chargée seulement si la permission est accordée.
  useEffect(() => {
    if (!child || accessLoading || !can('MEDICAL_VIEW')) return;
    api.get(`/api/children/${id}/medical`)
      .then((res) => { if (res.data?.success) setMedical(res.data); })
      .catch((err) => console.error('Erreur chargement médical:', err));
  }, [child, accessLoading, id]); // eslint-disable-line react-hooks/exhaustive-deps

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
      return `${years} ${isRTL ? 'سنة' : 'an'}${years > 1 && !isRTL ? 's' : ''}${months > 0 ? ` ${isRTL ? 'و' : 'et'} ${months} ${isRTL ? 'شهر' : 'mois'}` : ''}`;
    }
    return `${months} ${isRTL ? 'شهر' : 'mois'}`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return isRTL ? 'غير محدد' : 'Non renseigné';
    return new Date(dateStr).toLocaleDateString(isRTL ? 'ar-TN' : 'fr-FR', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${isMobile ? 'pb-24' : ''}`}>
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !child) {
    return (
      <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 p-6 ${isMobile ? 'pb-24' : ''}`}>
        <div className="max-w-2xl mx-auto text-center py-12">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            {error || (isRTL ? 'الطفل غير موجود' : 'Enfant non trouvé')}
          </h2>
          <button
            onClick={() => navigate('/dashboard/children')}
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
  const age = calculateAge(child.birth_date);
  const canViewMedical = can('MEDICAL_VIEW');

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 ${isMobile ? 'pb-24' : ''}`}>
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between px-4 py-4">
          <button
            onClick={() => navigate('/dashboard/children')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft className={`w-6 h-6 text-gray-900 dark:text-white ${isRTL ? 'rotate-180' : ''}`} />
          </button>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
            {isRTL ? 'بطاقة الطفل' : 'Fiche enfant'}
          </h1>
          {(isAdmin() || isStaff()) ? (
            <button
              onClick={() => navigate('/dashboard/children')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title={isRTL ? 'تعديل' : 'Modifier'}
            >
              <Edit className="w-5 h-5 text-gray-900 dark:text-white" />
            </button>
          ) : <div className="w-9" />}
        </div>
      </div>

      <div className="max-w-2xl mx-auto">
        {/* Profil */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 px-6 py-8 text-center border-b border-gray-200 dark:border-gray-700"
        >
          <div className="inline-block mb-4">
            {photoUrl ? (
              <img
                src={photoUrl}
                alt={`${child.first_name} ${child.last_name}`}
                className="w-28 h-28 rounded-full object-cover border-4 border-gray-100 dark:border-gray-700"
              />
            ) : (
              <div className="w-28 h-28 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center border-4 border-gray-100 dark:border-gray-700">
                <Baby className="w-12 h-12 text-primary-600 dark:text-primary-400" />
              </div>
            )}
          </div>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {child.first_name} {child.last_name}
          </h2>

          {age && (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 dark:bg-primary-900/30 rounded-full">
              <Calendar className="w-4 h-4 text-primary-600 dark:text-primary-400" />
              <span className="text-primary-700 dark:text-primary-300 font-medium">{age}</span>
            </div>
          )}
        </motion.div>

        {/* Informations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="px-4 mt-6"
        >
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
            {isRTL ? 'المعلومات' : 'Informations'}
          </h3>
          <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden divide-y divide-gray-100 dark:divide-gray-700">
            <div className="flex items-center gap-4 p-4">
              <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                <Calendar className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              </div>
              <div className="flex-1">
                <p className="text-gray-500 dark:text-gray-400 text-sm">{isRTL ? 'تاريخ الميلاد' : 'Date de naissance'}</p>
                <p className="text-gray-900 dark:text-white font-medium">{formatDate(child.birth_date)}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4">
              <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              </div>
              <div className="flex-1">
                <p className="text-gray-500 dark:text-gray-400 text-sm">{isRTL ? 'الجنس' : 'Genre'}</p>
                <p className="text-gray-900 dark:text-white font-medium">
                  {child.gender === 'male' ? (isRTL ? 'ذكر' : 'Garçon') : (isRTL ? 'أنثى' : 'Fille')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4">
              <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                <Calendar className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              </div>
              <div className="flex-1">
                <p className="text-gray-500 dark:text-gray-400 text-sm">{isRTL ? 'مسجل منذ' : 'Inscrit depuis'}</p>
                <p className="text-gray-900 dark:text-white font-medium">{formatDate(child.created_at)}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Médical (si permission) */}
        {canViewMedical && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="px-4 mt-6"
          >
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
              {isRTL ? 'المعلومات الطبية' : 'Médical'}
            </h3>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 space-y-3">
              {medical?.allergies?.length > 0 ? (
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">{isRTL ? 'الحساسية' : 'Allergies'}</p>
                    <p className="text-gray-900 dark:text-white font-medium">
                      {Array.isArray(medical.allergies) ? medical.allergies.join(', ') : medical.allergies}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    {isRTL ? 'لا توجد حساسية مسجلة' : 'Aucune allergie renseignée'}
                  </p>
                </div>
              )}

              {(medical?.notes || child.medical_info) && (
                <div className="flex items-start gap-3">
                  <Stethoscope className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">{isRTL ? 'ملاحظات طبية' : 'Notes médicales'}</p>
                    <p className="text-gray-900 dark:text-white">{medical?.notes || child.medical_info}</p>
                  </div>
                </div>
              )}

              {medical?.doctor_name && (
                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">{isRTL ? 'الطبيب' : 'Médecin'}</p>
                    <p className="text-gray-900 dark:text-white">
                      {medical.doctor_name}
                      {medical.doctor_phone && (
                        <a href={`tel:${medical.doctor_phone}`} className="text-primary-600 ml-2 rtl:ml-0 rtl:mr-2 underline" dir="ltr">
                          {medical.doctor_phone}
                        </a>
                      )}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Contact d'urgence */}
        {(child.emergency_contact_name || child.emergency_contact_phone) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="px-4 mt-6"
          >
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
              {isRTL ? 'جهة الاتصال للطوارئ' : "Contact d'urgence"}
            </h3>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4">
              <p className="text-gray-900 dark:text-white font-medium">{child.emergency_contact_name}</p>
              {child.emergency_contact_phone && (
                <div className="flex gap-2 mt-2">
                  <a
                    href={`tel:${child.emergency_contact_phone}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg text-sm"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span dir="ltr">{child.emergency_contact_phone}</span>
                  </a>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Parent */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="px-4 mt-6 mb-6"
        >
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
            {isRTL ? 'الولي' : 'Parent'}
          </h3>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4">
            {child.parent_first_name ? (
              <>
                <p className="text-gray-900 dark:text-white font-medium mb-3">
                  {child.parent_first_name} {child.parent_last_name}
                </p>
                <div className="flex flex-wrap gap-2">
                  {child.parent_phone && (
                    <>
                      <a
                        href={`tel:${child.parent_phone}`}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg text-sm"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        {isRTL ? 'اتصال' : 'Appeler'}
                      </a>
                      <a
                        href={`sms:${child.parent_phone}`}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-lg text-sm"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        SMS
                      </a>
                    </>
                  )}
                  {child.parent_email && !child.parent_email.includes('@creche.local') && !child.parent_email.includes('noemail') && (
                    <a
                      href={`mailto:${child.parent_email}`}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg text-sm"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      Email
                    </a>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                <UserPlus className="w-4 h-4" />
                <span>{isRTL ? 'لا يوجد ولي أمر مسجل' : 'Aucun parent associé'}</span>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {isMobile && <MobileNavigation />}
    </div>
  );
};

export default StaffChildDetailPage;
