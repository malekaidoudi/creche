import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Baby, 
  FileText, 
  Calendar, 
  Clock, 
  Phone, 
  Mail, 
  MapPin,
  Edit,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

const ParentSpacePage = () => {
  const { user } = useAuth();
  const { isRTL } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('children');
  const [enrollments, setEnrollments] = useState([]);
  const [children, setChildren] = useState([]);

  useEffect(() => {
    // Simuler le chargement des données
    // TODO: Remplacer par de vrais appels API
    setTimeout(() => {
      setEnrollments([
        {
          id: 1,
          child: {
            id: 1,
            first_name: 'Sara',
            last_name: 'Ahmed',
            birth_date: '2021-03-15',
            gender: 'F'
          },
          status: 'approved',
          enrollment_date: '2024-01-15',
          appointment_date: '2024-01-20',
          appointment_time: '10:00',
          documents: [
            {
              id: 1,
              type: 'Formulaire d\'inscription',
              filename: 'formulaire_sara.pdf',
              status: 'approved',
              upload_date: '2024-01-15'
            },
            {
              id: 2,
              type: 'Fiche médicale',
              filename: 'fiche_medicale_sara.pdf',
              status: 'pending',
              upload_date: '2024-01-16'
            }
          ]
        }
      ]);
      
      setChildren([
        {
          id: 1,
          first_name: 'Sara',
          last_name: 'Ahmed',
          birth_date: '2021-03-15',
          gender: 'F',
          enrollment_status: 'approved',
          attendance_today: {
            check_in: '08:30',
            check_out: null,
            status: 'present'
          }
        }
      ]);
      
      setLoading(false);
    }, 1000);
  }, []);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'pending':
      default:
        return <AlertCircle className="w-5 h-5 text-orange-600" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'approved':
        return isRTL ? 'مقبول' : 'Approuvé';
      case 'rejected':
        return isRTL ? 'مرفوض' : 'Rejeté';
      case 'pending':
      default:
        return isRTL ? 'في الانتظار' : 'En attente';
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'pending':
      default:
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
    }
  };

  const calculateAge = (birthDate) => {
    const today = new Date();
    const birth = new Date(birthDate);
    const ageInMonths = (today.getFullYear() - birth.getFullYear()) * 12 + (today.getMonth() - birth.getMonth());
    
    if (ageInMonths < 12) {
      return isRTL ? `${ageInMonths} أشهر` : `${ageInMonths} mois`;
    } else {
      const years = Math.floor(ageInMonths / 12);
      const months = ageInMonths % 12;
      if (months === 0) {
        return isRTL ? `${years} سنة` : `${years} an${years > 1 ? 's' : ''}`;
      }
      return isRTL ? `${years} سنة و ${months} أشهر` : `${years} an${years > 1 ? 's' : ''} et ${months} mois`;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* En-tête */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl p-6 text-white">
            <div className="flex items-center space-x-4 rtl:space-x-reverse">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <User className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">
                  {isRTL ? `مرحباً، ${user?.first_name}` : `Bonjour, ${user?.first_name}`}
                </h1>
                <p className="text-primary-100">
                  {isRTL ? 'مساحتك الشخصية لمتابعة أطفالك' : 'Votre espace personnel pour suivre vos enfants'}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Onglets */}
        <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
          <nav className="-mb-px flex space-x-8 rtl:space-x-reverse">
            <button
              onClick={() => setActiveTab('children')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'children'
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <Baby className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2 inline" />
              {isRTL ? 'أطفالي' : 'Mes enfants'}
            </button>
            <button
              onClick={() => setActiveTab('enrollments')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'enrollments'
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <FileText className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2 inline" />
              {isRTL ? 'طلبات التسجيل' : 'Demandes d\'inscription'}
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'profile'
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <User className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2 inline" />
              {isRTL ? 'ملفي الشخصي' : 'Mon profil'}
            </button>
          </nav>
        </div>

        {/* Contenu des onglets */}
        {activeTab === 'children' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {children.map((child) => (
              <Card key={child.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 rtl:space-x-reverse">
                      <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                        <Baby className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          {child.first_name} {child.last_name}
                        </CardTitle>
                        <CardDescription>
                          {calculateAge(child.birth_date)} • {child.gender === 'M' ? (isRTL ? 'ذكر' : 'Garçon') : (isRTL ? 'أنثى' : 'Fille')}
                        </CardDescription>
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(child.enrollment_status)}`}>
                      {getStatusIcon(child.enrollment_status)}
                      <span className="ml-1 rtl:ml-0 rtl:mr-1">{getStatusText(child.enrollment_status)}</span>
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Présence aujourd'hui */}
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                        {isRTL ? 'الحضور اليوم' : 'Présence aujourd\'hui'}
                      </h4>
                      {child.attendance_today ? (
                        <div className="flex items-center space-x-4 rtl:space-x-reverse">
                          <div className="flex items-center space-x-2 rtl:space-x-reverse">
                            <Clock className="w-4 h-4 text-green-600" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {isRTL ? 'الوصول:' : 'Arrivée:'} {child.attendance_today.check_in}
                            </span>
                          </div>
                          {child.attendance_today.check_out ? (
                            <div className="flex items-center space-x-2 rtl:space-x-reverse">
                              <Clock className="w-4 h-4 text-orange-600" />
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                {isRTL ? 'المغادرة:' : 'Départ:'} {child.attendance_today.check_out}
                              </span>
                            </div>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                              {isRTL ? 'حاضر' : 'Présent'}
                            </span>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {isRTL ? 'لم يحضر اليوم' : 'Absent aujourd\'hui'}
                        </p>
                      )}
                    </div>

                    {/* Informations */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">
                          {isRTL ? 'تاريخ الميلاد:' : 'Date de naissance:'}
                        </span>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {new Date(child.birth_date).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">
                          {isRTL ? 'حالة التسجيل:' : 'Statut inscription:'}
                        </span>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {getStatusText(child.enrollment_status)}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </motion.div>
        )}

        {activeTab === 'enrollments' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {enrollments.map((enrollment) => (
              <Card key={enrollment.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>
                        {isRTL ? 'طلب تسجيل' : 'Demande d\'inscription'} - {enrollment.child.first_name} {enrollment.child.last_name}
                      </CardTitle>
                      <CardDescription>
                        {isRTL ? 'تاريخ الطلب:' : 'Date de demande:'} {new Date(enrollment.enrollment_date).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeColor(enrollment.status)}`}>
                      {getStatusIcon(enrollment.status)}
                      <span className="ml-2 rtl:ml-0 rtl:mr-2">{getStatusText(enrollment.status)}</span>
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Rendez-vous */}
                    {enrollment.status === 'approved' && enrollment.appointment_date && (
                      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                        <div className="flex items-center space-x-2 rtl:space-x-reverse">
                          <Calendar className="w-5 h-5 text-green-600" />
                          <h4 className="font-medium text-green-800 dark:text-green-200">
                            {isRTL ? 'موعد في الحضانة' : 'Rendez-vous à la crèche'}
                          </h4>
                        </div>
                        <p className="text-green-700 dark:text-green-300 mt-2">
                          {isRTL ? 'التاريخ:' : 'Date:'} {new Date(enrollment.appointment_date).toLocaleDateString()}
                          {enrollment.appointment_time && (
                            <span> - {isRTL ? 'الوقت:' : 'Heure:'} {enrollment.appointment_time}</span>
                          )}
                        </p>
                      </div>
                    )}

                    {/* Documents */}
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                        {isRTL ? 'الوثائق المرفقة' : 'Documents joints'}
                      </h4>
                      <div className="space-y-2">
                        {enrollment.documents.map((doc) => (
                          <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <div className="flex items-center space-x-3 rtl:space-x-reverse">
                              <FileText className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white">
                                  {doc.type}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  {isRTL ? 'تاريخ الرفع:' : 'Uploadé le:'} {new Date(doc.upload_date).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2 rtl:space-x-reverse">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(doc.status)}`}>
                                {getStatusText(doc.status)}
                              </span>
                              <Button size="sm" variant="outline">
                                <Eye className="w-4 h-4 mr-1 rtl:mr-0 rtl:ml-1" />
                                {isRTL ? 'عرض' : 'Voir'}
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </motion.div>
        )}

        {activeTab === 'profile' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>
                  {isRTL ? 'المعلومات الشخصية' : 'Informations personnelles'}
                </CardTitle>
                <CardDescription>
                  {isRTL ? 'يمكنك تعديل معلوماتك الشخصية هنا' : 'Vous pouvez modifier vos informations personnelles ici'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {isRTL ? 'الاسم الأول' : 'Prénom'}
                      </label>
                      <input
                        type="text"
                        defaultValue={user?.first_name}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {isRTL ? 'اسم العائلة' : 'Nom'}
                      </label>
                      <input
                        type="text"
                        defaultValue={user?.last_name}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {isRTL ? 'البريد الإلكتروني' : 'Email'}
                    </label>
                    <input
                      type="email"
                      defaultValue={user?.email}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {isRTL ? 'رقم الهاتف' : 'Téléphone'}
                    </label>
                    <input
                      type="tel"
                      defaultValue={user?.phone}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div className="flex justify-end space-x-3 rtl:space-x-reverse">
                    <Button variant="outline">
                      {isRTL ? 'إلغاء' : 'Annuler'}
                    </Button>
                    <Button>
                      <Edit className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
                      {isRTL ? 'حفظ التغييرات' : 'Sauvegarder'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ParentSpacePage;
