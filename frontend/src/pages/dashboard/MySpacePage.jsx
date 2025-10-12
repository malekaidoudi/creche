import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Baby, 
  Calendar,
  Phone,
  Mail,
  MapPin,
  Heart,
  Clock,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import childrenService from '../../services/childrenService';
import toast from 'react-hot-toast';

const MySpacePage = () => {
  const { user } = useAuth();
  const { isRTL } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [myChildren, setMyChildren] = useState([]);

  // Charger les enfants associés à l'utilisateur connecté
  useEffect(() => {
    loadMyChildren();
  }, []);

  const loadMyChildren = async () => {
    try {
      setLoading(true);
      // Récupérer tous les enfants et filtrer ceux associés à l'utilisateur
      const response = await childrenService.getAllChildren();
      
      if (response.success) {
        // Filtrer les enfants où parent_id correspond à l'utilisateur connecté
        const userChildren = response.data.children.filter(child => 
          child.parent_id === user.id
        );
        setMyChildren(userChildren);
      }
    } catch (error) {
      console.error('Erreur chargement enfants:', error);
      toast.error(isRTL ? 'خطأ في تحميل الأطفال' : 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  // Calculer l'âge
  const calculateAge = (birthDate) => {
    if (!birthDate) return '';
    const today = new Date();
    const birth = new Date(birthDate);
    const ageInMonths = (today.getFullYear() - birth.getFullYear()) * 12 + (today.getMonth() - birth.getMonth());
    
    if (ageInMonths < 12) {
      return `${ageInMonths} ${isRTL ? 'شهر' : 'mois'}`;
    } else {
      const years = Math.floor(ageInMonths / 12);
      const months = ageInMonths % 12;
      return `${years} ${isRTL ? 'سنة' : 'an'}${years > 1 ? 's' : ''} ${months > 0 ? `${months} ${isRTL ? 'شهر' : 'mois'}` : ''}`;
    }
  };

  // Badge de statut
  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: {
        color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
        text: isRTL ? 'في الانتظار' : 'En attente'
      },
      approved: {
        color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
        text: isRTL ? 'مقبول' : 'Approuvé'
      },
      rejected: {
        color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
        text: isRTL ? 'مرفوض' : 'Rejeté'
      }
    };

    const config = statusConfig[status] || statusConfig.pending;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isRTL ? 'مساحتي الشخصية' : 'Mon Espace'}
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            {isRTL ? 'معلوماتي وأطفالي في الحضانة' : 'Mes informations et mes enfants à la crèche'}
          </p>
        </div>
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
            <User className="w-6 h-6 text-primary-600 dark:text-primary-400" />
          </div>
        </div>
      </motion.div>

      {/* Informations personnelles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="w-5 h-5 mr-2 rtl:mr-0 rtl:ml-2" />
            {isRTL ? 'معلوماتي الشخصية' : 'Mes informations'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3 rtl:space-x-reverse">
                <User className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {isRTL ? 'الاسم الكامل' : 'Nom complet'}
                  </p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {user.first_name} {user.last_name}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 rtl:space-x-reverse">
                <Mail className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {isRTL ? 'البريد الإلكتروني' : 'Email'}
                  </p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {user.email}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-3 rtl:space-x-reverse">
                <Phone className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {isRTL ? 'رقم الهاتف' : 'Téléphone'}
                  </p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {user.phone || (isRTL ? 'غير محدد' : 'Non renseigné')}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 rtl:space-x-reverse">
                <AlertCircle className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {isRTL ? 'الدور' : 'Rôle'}
                  </p>
                  <p className="font-medium text-gray-900 dark:text-white capitalize">
                    {user.role === 'admin' ? (isRTL ? 'مدير' : 'Administrateur') :
                     user.role === 'staff' ? (isRTL ? 'موظف' : 'Personnel') :
                     (isRTL ? 'ولي أمر' : 'Parent')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mes enfants */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Baby className="w-5 h-5 mr-2 rtl:mr-0 rtl:ml-2" />
            {isRTL ? 'أطفالي في الحضانة' : 'Mes enfants à la crèche'}
            <span className="ml-2 rtl:ml-0 rtl:mr-2 bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 px-2 py-1 rounded-full text-sm">
              {myChildren.length}
            </span>
          </CardTitle>
          <CardDescription>
            {myChildren.length === 0 
              ? (isRTL ? 'لا يوجد أطفال مسجلين حالياً' : 'Aucun enfant enregistré actuellement')
              : (isRTL ? 'قائمة الأطفال المسجلين باسمي' : 'Liste des enfants enregistrés à mon nom')
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {myChildren.length === 0 ? (
            <div className="text-center py-8">
              <Baby className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                {isRTL ? 'لا يوجد أطفال مسجلين حالياً' : 'Aucun enfant enregistré pour le moment'}
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                {isRTL ? 'يمكن للمدير ربط الأطفال بحسابك' : 'Un administrateur peut associer des enfants à votre compte'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myChildren.map((child) => (
                <motion.div
                  key={child.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3 rtl:space-x-reverse">
                      <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                        <Baby className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {child.first_name} {child.last_name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {calculateAge(child.birth_date)}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(child.status)}
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center space-x-2 rtl:space-x-reverse text-gray-600 dark:text-gray-300">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {new Date(child.birth_date).toLocaleDateString(isRTL ? 'ar-TN' : 'fr-FR')}
                      </span>
                    </div>
                    
                    {child.medical_info && (
                      <div className="flex items-start space-x-2 rtl:space-x-reverse text-gray-600 dark:text-gray-300">
                        <Heart className="w-4 h-4 mt-0.5" />
                        <span className="text-xs">{child.medical_info}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-2 rtl:space-x-reverse text-gray-500 dark:text-gray-400">
                      <Clock className="w-4 h-4" />
                      <span className="text-xs">
                        {isRTL ? 'مسجل منذ' : 'Inscrit le'} {new Date(child.created_at).toLocaleDateString(isRTL ? 'ar-TN' : 'fr-FR')}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MySpacePage;
