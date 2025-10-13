import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Baby, Calendar, FileText, Settings, Bell } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import api from '../../config/api';

const ParentSpacePage = () => {
  const { user, updateUser } = useAuth();
  const { isRTL } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [children, setChildren] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    profile_image: null
  });
  const [editLoading, setEditLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Récupérer les enfants du parent
      const childrenResponse = await api.get(`/children/parent/${user.id}`);
      setChildren(childrenResponse.data.children || []);

      // Récupérer les demandes d'inscription
      const enrollmentsResponse = await api.get(`/enrollments/parent/${user.id}`);
      setEnrollments(enrollmentsResponse.data || []);
    } catch (error) {
      console.error('Erreur récupération données:', error);
      toast.error(isRTL ? 'خطأ في تحميل البيانات' : 'Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleEditProfile = () => {
    setEditFormData({
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      phone: user?.phone || '',
      profile_image: null
    });
    setShowEditModal(true);
  };

  const handleSaveProfile = async () => {
    try {
      setEditLoading(true);
      
      const formData = new FormData();
      formData.append('first_name', editFormData.first_name);
      formData.append('last_name', editFormData.last_name);
      formData.append('phone', editFormData.phone);
      
      if (editFormData.profile_image) {
        formData.append('profile_image', editFormData.profile_image);
      }

      const response = await api.put(`/users/profile`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        updateUser(response.data.user);
        toast.success(isRTL ? 'تم تحديث الملف الشخصي بنجاح' : 'Profil mis à jour avec succès');
        setShowEditModal(false);
      }
    } catch (error) {
      console.error('Erreur mise à jour profil:', error);
      toast.error(isRTL ? 'خطأ في تحديث الملف الشخصي' : 'Erreur lors de la mise à jour du profil');
    } finally {
      setEditLoading(false);
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {isRTL ? 'مرحباً' : 'Bienvenue'} {user?.first_name}
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            {isRTL ? 'مساحتك الشخصية لمتابعة أطفالك' : 'Votre espace personnel pour suivre vos enfants'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Informations du profil */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="w-5 h-5 mr-2 rtl:mr-0 rtl:ml-2" />
                  {isRTL ? 'ملفي الشخصي' : 'Mon Profil'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center mb-4">
                    {(user?.profile_image || user?.photo_url) ? (
                      <img
                        src={`${import.meta.env.VITE_API_URL}${user.profile_image || user.photo_url}`}
                        alt="Profile"
                        className="w-full h-full rounded-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <User 
                      className={`w-10 h-10 text-primary-600 dark:text-primary-400 ${(user?.profile_image || user?.photo_url) ? 'hidden' : 'block'}`} 
                    />
                  </div>
                  <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                    {user?.first_name} {user?.last_name}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">{user?.email}</p>
                  {user?.phone && (
                    <p className="text-gray-600 dark:text-gray-300" dir="ltr" style={{ textAlign: isRTL ? 'right' : 'left' }}>
                      {user?.phone}
                    </p>
                  )}
                </div>
                <Button variant="outline" className="w-full" onClick={handleEditProfile}>
                  <Settings className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
                  {isRTL ? 'تعديل الملف الشخصي' : 'Modifier le profil'}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Contenu principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Mes enfants */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Baby className="w-5 h-5 mr-2 rtl:mr-0 rtl:ml-2" />
                  {isRTL ? 'أطفالي' : 'Mes Enfants'}
                </CardTitle>
                <CardDescription>
                  {isRTL ? 'قائمة الأطفال المسجلين' : 'Liste de vos enfants inscrits'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {children.length === 0 ? (
                  <div className="text-center py-8">
                    <Baby className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">
                      {isRTL ? 'لا توجد أطفال مسجلين' : 'Aucun enfant inscrit'}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {children.map((child) => (
                      <motion.div
                        key={child.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                      >
                        <div className="flex items-center space-x-3 rtl:space-x-reverse">
                          <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                            <Baby className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900 dark:text-white">
                              {child.first_name} {child.last_name}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              {child.age}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Demandes d'inscription */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="w-5 h-5 mr-2 rtl:mr-0 rtl:ml-2" />
                  {isRTL ? 'طلبات التسجيل' : 'Demandes d\'inscription'}
                </CardTitle>
                <CardDescription>
                  {isRTL ? 'حالة طلبات التسجيل الخاصة بك' : 'Statut de vos demandes d\'inscription'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {enrollments.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">
                      {isRTL ? 'لا توجد طلبات تسجيل' : 'Aucune demande d\'inscription'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {enrollments.map((enrollment) => (
                      <div
                        key={enrollment.id}
                        className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold text-gray-900 dark:text-white">
                              {enrollment.child_first_name} {enrollment.child_last_name}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              {isRTL ? 'تاريخ الطلب:' : 'Demande du :'} {new Date(enrollment.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            enrollment.status === 'approved' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                              : enrollment.status === 'rejected'
                              ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'
                          }`}>
                            {enrollment.status === 'approved' 
                              ? (isRTL ? 'مقبول' : 'Approuvé')
                              : enrollment.status === 'rejected'
                              ? (isRTL ? 'مرفوض' : 'Rejeté')
                              : (isRTL ? 'في الانتظار' : 'En attente')
                            }
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actions rapides */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bell className="w-5 h-5 mr-2 rtl:mr-0 rtl:ml-2" />
                  {isRTL ? 'إجراءات سريعة' : 'Actions rapides'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button variant="outline" className="h-auto p-4">
                    <div className="text-center">
                      <Calendar className="w-8 h-8 mx-auto mb-2 text-primary-600" />
                      <div className="font-medium">
                        {isRTL ? 'عرض الحضور' : 'Voir les présences'}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        {isRTL ? 'تتبع حضور أطفالك' : 'Suivez la présence de vos enfants'}
                      </div>
                    </div>
                  </Button>
                  <Button variant="outline" className="h-auto p-4">
                    <div className="text-center">
                      <FileText className="w-8 h-8 mx-auto mb-2 text-primary-600" />
                      <div className="font-medium">
                        {isRTL ? 'الوثائق' : 'Documents'}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        {isRTL ? 'إدارة الوثائق' : 'Gérer les documents'}
                      </div>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Modal de modification du profil */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              {isRTL ? 'تعديل الملف الشخصي' : 'Modifier le profil'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {isRTL ? 'الاسم الأول' : 'Prénom'}
                </label>
                <input
                  type="text"
                  value={editFormData.first_name}
                  onChange={(e) => setEditFormData({...editFormData, first_name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {isRTL ? 'اسم العائلة' : 'Nom de famille'}
                </label>
                <input
                  type="text"
                  value={editFormData.last_name}
                  onChange={(e) => setEditFormData({...editFormData, last_name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {isRTL ? 'رقم الهاتف' : 'Téléphone'}
                </label>
                <input
                  type="tel"
                  value={editFormData.phone}
                  onChange={(e) => setEditFormData({...editFormData, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  dir="ltr"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {isRTL ? 'صورة الملف الشخصي' : 'Photo de profil'}
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setEditFormData({...editFormData, profile_image: e.target.files[0]})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <Button 
                onClick={handleSaveProfile}
                disabled={editLoading}
                className="flex-1"
              >
                {editLoading ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  isRTL ? 'حفظ' : 'Enregistrer'
                )}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowEditModal(false)}
                className="flex-1"
              >
                {isRTL ? 'إلغاء' : 'Annuler'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParentSpacePage;
