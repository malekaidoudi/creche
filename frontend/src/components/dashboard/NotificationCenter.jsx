import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  X, 
  Check, 
  Clock, 
  User, 
  Calendar,
  MessageCircle,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import toast from 'react-hot-toast';
import api from '../../services/api';

const NotificationCenter = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { isRTL } = useLanguage();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      console.log('🔄 Chargement notifications NotificationCenter...');
      
      const response = await api.get('/api/notifications');
      
      console.log('📨 Réponse NotificationCenter:', response.data);
      
      if (response.data.success) {
        setNotifications(response.data.notifications || []);
        setUnreadCount(response.data.unread_count || 0);
        console.log('✅ Notifications chargées dans NotificationCenter:', response.data.notifications?.length || 0);
      } else {
        console.log('⚠️ Réponse non réussie NotificationCenter:', response.data);
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('❌ Erreur chargement notifications NotificationCenter:', error);
      // Ne pas afficher de toast d'erreur pour éviter le spam
      // Juste réinitialiser les données
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      setProcessingId(notificationId);
      
      const response = await api.put(`/notifications/${notificationId}/read`);
      
      if (response.data.success) {
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notificationId 
              ? { ...notif, is_read: true }
              : notif
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Erreur marquage notification:', error);
      toast.error(isRTL ? 'خطأ في تحديث الإشعار' : 'Erreur lors de la mise à jour');
    } finally {
      setProcessingId(null);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await api.put('/api/notifications/read-all');
      
      if (response.data.success) {
        setNotifications(prev => 
          prev.map(notif => ({ ...notif, is_read: true }))
        );
        setUnreadCount(0);
        toast.success(isRTL ? 'تم تحديد جميع الإشعارات كمقروءة' : 'Toutes les notifications marquées comme lues');
      }
    } catch (error) {
      console.error('Erreur marquage toutes notifications:', error);
      toast.error(isRTL ? 'خطأ في تحديث الإشعارات' : 'Erreur lors de la mise à jour');
    }
  };

  const acknowledgeAbsenceRequest = async (notificationId, absenceRequestId) => {
    try {
      setProcessingId(notificationId);
      
      const response = await api.put(`/absence-requests/${absenceRequestId}/acknowledge`, {
        admin_notes: 'Demande prise en compte par l\'administration'
      });
      
      if (response.data.success) {
        toast.success(isRTL ? 'تم إرسال إشعار الاستلام' : 'Accusé de réception envoyé');
        
        // Marquer la notification comme lue
        await markAsRead(notificationId);
        
        // Recharger les notifications
        loadNotifications();
      }
    } catch (error) {
      console.error('Erreur accusé de réception:', error);
      toast.error(isRTL ? 'خطأ في إرسال إشعار الاستلام' : 'Erreur lors de l\'accusé de réception');
    } finally {
      setProcessingId(null);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'absence_request':
        return <Calendar className="w-5 h-5 text-blue-500" />;
      case 'enrollment':
        return <User className="w-5 h-5 text-green-500" />;
      default:
        return <MessageCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return isRTL ? 'الآن' : 'Maintenant';
    if (diffMins < 60) return isRTL ? `منذ ${diffMins} دقيقة` : `Il y a ${diffMins} min`;
    if (diffHours < 24) return isRTL ? `منذ ${diffHours} ساعة` : `Il y a ${diffHours}h`;
    if (diffDays < 7) return isRTL ? `منذ ${diffDays} يوم` : `Il y a ${diffDays}j`;
    
    return date.toLocaleDateString(isRTL ? 'ar-TN' : 'fr-FR');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-end p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ x: 400, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 400, opacity: 0 }}
          className={`bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-hidden ${isRTL ? 'rtl' : 'ltr'}`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* En-tête */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <Bell className="w-5 h-5 mr-2 rtl:mr-0 rtl:ml-2 text-gray-600 dark:text-gray-400" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {isRTL ? 'الإشعارات' : 'Notifications'}
              </h2>
              {unreadCount > 0 && (
                <span className="ml-2 rtl:ml-0 rtl:mr-2 px-2 py-1 text-xs bg-red-500 text-white rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={markAllAsRead}
                  className="text-xs"
                >
                  {isRTL ? 'تحديد الكل كمقروء' : 'Tout marquer lu'}
                </Button>
              )}
              <button
                onClick={onClose}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Contenu */}
          <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">
                  {isRTL ? 'لا توجد إشعارات' : 'Aucune notification'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {notifications.map((notification) => {
                  let data = {};
                  try {
                    data = notification.data ? 
                      (typeof notification.data === 'string' ? JSON.parse(notification.data) : notification.data) 
                      : {};
                  } catch (error) {
                    console.error('Erreur parsing data notification:', error);
                    data = {};
                  }
                  const isAbsenceRequest = notification.type === 'absence_request' && data.absence_request_id;
                  
                  return (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                        !notification.is_read ? 'bg-blue-50 dark:bg-blue-900/10' : ''
                      }`}
                    >
                      <div className="flex items-start space-x-3 rtl:space-x-reverse">
                        <div className="flex-shrink-0">
                          {getNotificationIcon(notification.type)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                              {notification.title}
                            </h3>
                            <div className="flex items-center space-x-1 rtl:space-x-reverse">
                              {!notification.is_read && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              )}
                              <span className="text-xs text-gray-500">
                                {formatDate(notification.created_at)}
                              </span>
                            </div>
                          </div>
                          
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {notification.message}
                          </p>
                          
                          {/* Actions pour les demandes d'absence */}
                          {isAbsenceRequest && (user.role === 'admin' || user.role === 'staff') && (
                            <div className="mt-3 flex space-x-2 rtl:space-x-reverse">
                              <Button
                                size="sm"
                                onClick={() => acknowledgeAbsenceRequest(notification.id, data.absence_request_id)}
                                disabled={processingId === notification.id}
                                className="text-xs"
                              >
                                {processingId === notification.id ? (
                                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1 rtl:mr-0 rtl:ml-1"></div>
                                ) : (
                                  <CheckCircle2 className="w-3 h-3 mr-1 rtl:mr-0 rtl:ml-1" />
                                )}
                                {isRTL ? 'تأكيد الاستلام' : 'Accusé de réception'}
                              </Button>
                              
                              {!notification.is_read && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => markAsRead(notification.id)}
                                  disabled={processingId === notification.id}
                                  className="text-xs"
                                >
                                  <Check className="w-3 h-3 mr-1 rtl:mr-0 rtl:ml-1" />
                                  {isRTL ? 'تحديد كمقروء' : 'Marquer lu'}
                                </Button>
                              )}
                            </div>
                          )}
                          
                          {/* Action générale pour marquer comme lu */}
                          {!isAbsenceRequest && !notification.is_read && (
                            <div className="mt-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => markAsRead(notification.id)}
                                disabled={processingId === notification.id}
                                className="text-xs"
                              >
                                <Check className="w-3 h-3 mr-1 rtl:mr-0 rtl:ml-1" />
                                {isRTL ? 'تحديد كمقروء' : 'Marquer comme lu'}
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default NotificationCenter;
