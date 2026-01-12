import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import api from '../services/api';

export const useNotifications = () => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadNotifications = async () => {
    if (!user || (user.role !== 'admin' && user.role !== 'staff' && user.role !== 'developer')) {
      console.log('🚫 Chargement notifications ignoré - utilisateur non autorisé:', user?.role);
      return;
    }

    try {
      setLoading(true);
      console.log('📬 Chargement notifications pour:', user.email);

      const response = await api.get('/api/notifications');

      console.log('📨 Réponse notifications:', response.data);

      if (response.data.success) {
        setNotifications(response.data.notifications || []);
        setUnreadCount(response.data.unread_count || 0);
        console.log('✅ Notifications chargées:', response.data.notifications?.length || 0);
      } else {
        console.log('⚠️ Réponse notifications non réussie:', response.data);
      }
    } catch (error) {
      console.error('❌ Erreur chargement notifications:', error);
      // Ne pas afficher d'erreur à l'utilisateur pour éviter le spam
      // En cas d'erreur, garder les valeurs par défaut
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
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
      }
    } catch (error) {
      console.error('Erreur marquage toutes notifications:', error);
    }
  };

  // Charger les notifications au montage du composant
  useEffect(() => {
    loadNotifications();
  }, [user]);

  // Polling pour les nouvelles notifications (toutes les 30 secondes)
  useEffect(() => {
    if (!user || (user.role !== 'admin' && user.role !== 'staff')) {
      return;
    }

    const interval = setInterval(() => {
      loadNotifications();
    }, 30000); // 30 secondes

    return () => clearInterval(interval);
  }, [user]);

  return {
    notifications,
    unreadCount,
    loading,
    loadNotifications,
    markAsRead,
    markAllAsRead
  };
};
