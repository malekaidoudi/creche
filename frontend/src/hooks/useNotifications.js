import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import api from '../services/api';

// Cache mémoire pour éviter le flash du badge 0 -> N
let cachedNotifications = [];
let cachedUnreadCount = 0;

export const useNotifications = () => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(() => cachedUnreadCount);
  const [notifications, setNotifications] = useState(() => cachedNotifications);
  const [loading, setLoading] = useState(false);

  const loadNotifications = async () => {
    if (!user || (user.role !== 'admin' && user.role !== 'staff' && user.role !== 'developer')) {
      return;
    }

    try {
      setLoading(true);

      const response = await api.get('/api/notifications');

      if (response.data.success) {
        const notifs = response.data.notifications || [];
        const count = response.data.unread_count || 0;
        cachedNotifications = notifs;
        cachedUnreadCount = count;
        setNotifications(notifs);
        setUnreadCount(count);
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
