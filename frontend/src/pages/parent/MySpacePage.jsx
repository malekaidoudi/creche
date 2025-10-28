import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  AlertCircle, 
  Calendar,
  Baby,
  User,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';
import { useTheme } from '../../hooks/useTheme';
import api from '../../services/api';
import { useProfileImage } from '../../hooks/useProfileImage';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import HolidaysList from '../../components/HolidaysList';
import toast from 'react-hot-toast';

const MySpacePage = () => {
  const { user } = useAuth();
  const { isRTL } = useLanguage();
  const { isDark } = useTheme();
  const { getImageUrl, hasImage } = useProfileImage();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [children, setChildren] = useState([]);

  useEffect(() => {
    loadChildren();
  }, []);

  const loadChildren = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/user/children-summary');
      const result = response.data;
      if (result.success) {
        setChildren(result.children || []);
      }
    } catch (error) {
      console.error('Erreur chargement enfants:', error);
      toast.error(isRTL ? 'خطأ في تحميل البيانات' : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      id: 'attendance-report',
      title: isRTL ? 'تقرير الحضور' : 'Rapport de présence',
      description: isRTL ? 'عرض تقرير حضور أطفالك' : 'Consultez le rapport de présence de vos enfants',
      icon: FileText,
      color: 'bg-blue-500',
      hoverColor: 'hover:bg-blue-600',
      path: '/attendance-parent'
    },
    {
      id: 'absence-request',
      title: isRTL ? 'إبلاغ عن غياب' : 'Signaler une absence',
      description: isRTL ? 'أبلغ عن غياب طفلك مسبقاً' : 'Prévenez d\'une absence de votre enfant',
      icon: AlertCircle,
      color: 'bg-orange-500',
      hoverColor: 'hover:bg-orange-600',
      path: '/absence-request'
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-4 md:p-6 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-6xl mx-auto">
        {/* En-tête de bienvenue */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center overflow-hidden">
                {hasImage() ? (
                  <img
                    src={getImageUrl()}
                    alt="Photo de profil"
                    className="w-16 h-16 object-cover rounded-full"
                  />
                ) : (
                  <User className="w-8 h-8" />
                )}
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-2">
                  {isRTL ? `مرحباً ${user?.first_name}` : `Bienvenue ${user?.first_name}`}
                </h1>
                <p className="text-blue-100">
                  {isRTL ? 'مساحتك الشخصية لمتابعة أطفالك' : 'Votre espace personnel pour suivre vos enfants'}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Résumé des enfants */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Baby className="w-5 h-5" />
                {isRTL ? 'أطفالي' : 'Mes enfants'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {children.length === 0 ? (
                <div className="text-center py-8">
                  <Baby className={`w-12 h-12 mx-auto mb-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                  <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {isRTL ? 'لا توجد أطفال مسجلون' : 'Aucun enfant inscrit'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {children.map((child) => (
                    <div
                      key={child.id}
                      className={`p-4 rounded-lg border ${
                        isDark 
                          ? 'bg-gray-800 border-gray-600' 
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Baby className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {child.first_name} {child.last_name}
                          </h3>
                          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            {child.enrollment_status === 'approved' 
                              ? (isRTL ? 'مقبول' : 'Approuvé')
                              : child.enrollment_status === 'pending'
                              ? (isRTL ? 'في الانتظار' : 'En attente')
                              : (isRTL ? 'غير محدد' : 'Non défini')
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Actions rapides */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                {isRTL ? 'الإجراءات السريعة' : 'Actions rapides'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {quickActions.map((action) => (
                  <motion.div
                    key={action.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="cursor-pointer"
                    onClick={() => navigate(action.path)}
                  >
                    <div className={`${action.color} ${action.hoverColor} rounded-xl p-6 text-white transition-colors`}>
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                          <action.icon className="w-6 h-6" />
                        </div>
                        <ArrowRight className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
                      </div>
                      
                      <h3 className="text-xl font-semibold mb-2">
                        {action.title}
                      </h3>
                      
                      <p className="text-white/80 text-sm">
                        {action.description}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>


        {/* Liste des jours fériés et vacances */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <HolidaysList userRole="parent" />
        </motion.div>
      </div>
    </div>
  );
};

export default MySpacePage;
