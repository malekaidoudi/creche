import { useState, useEffect } from 'react'
import { Bell, X, Check, Info, AlertTriangle, AlertCircle } from 'lucide-react'
import { useLanguage } from '../../hooks/useLanguage'
import { useAuth } from '../../hooks/useAuth'

const NotificationCenter = () => {
  const { isRTL } = useLanguage()
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  // Simuler des notifications (à remplacer par une vraie API)
  useEffect(() => {
    const mockNotifications = [
      {
        id: 1,
        type: 'info',
        title: isRTL ? 'مرحباً بك' : 'Bienvenue',
        message: isRTL 
          ? 'مرحباً بك في نظام إدارة حضانة ميما الغالية'
          : 'Bienvenue dans le système de gestion de la crèche Mima Elghalia',
        timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
        read: false
      },
      {
        id: 2,
        type: 'success',
        title: isRTL ? 'تم التحديث' : 'Mise à jour',
        message: isRTL 
          ? 'تم تحديث ملفك الشخصي بنجاح'
          : 'Votre profil a été mis à jour avec succès',
        timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        read: false
      },
      {
        id: 3,
        type: 'warning',
        title: isRTL ? 'تذكير' : 'Rappel',
        message: isRTL 
          ? 'لا تنسوا تحديث معلومات الاتصال الطارئ'
          : 'N\'oubliez pas de mettre à jour vos informations de contact d\'urgence',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        read: true
      }
    ]

    setNotifications(mockNotifications)
    setUnreadCount(mockNotifications.filter(n => !n.read).length)
  }, [isRTL])

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success':
        return <Check className="w-5 h-5 text-green-600" />
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-600" />
      default:
        return <Info className="w-5 h-5 text-blue-600" />
    }
  }

  const getNotificationBgColor = (type) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200'
      case 'error':
        return 'bg-red-50 border-red-200'
      default:
        return 'bg-blue-50 border-blue-200'
    }
  }

  const formatTimestamp = (timestamp) => {
    const now = new Date()
    const diff = now - timestamp
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (minutes < 1) {
      return isRTL ? 'الآن' : 'Maintenant'
    } else if (minutes < 60) {
      return isRTL ? `منذ ${minutes} دقيقة` : `Il y a ${minutes} min`
    } else if (hours < 24) {
      return isRTL ? `منذ ${hours} ساعة` : `Il y a ${hours}h`
    } else {
      return isRTL ? `منذ ${days} يوم` : `Il y a ${days}j`
    }
  }

  const markAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true }
          : notification
      )
    )
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    )
    setUnreadCount(0)
  }

  const removeNotification = (notificationId) => {
    const notification = notifications.find(n => n.id === notificationId)
    setNotifications(prev => prev.filter(n => n.id !== notificationId))
    if (!notification?.read) {
      setUnreadCount(prev => Math.max(0, prev - 1))
    }
  }

  return (
    <div className="relative">
      {/* Bouton de notification */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-lg transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Panel de notifications */}
      {isOpen && (
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Panel */}
          <div className={`absolute top-full mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 ${
            isRTL ? 'left-0' : 'right-0'
          }`}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {isRTL ? 'الإشعارات' : 'Notifications'}
              </h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  {isRTL ? 'تحديد الكل كمقروء' : 'Tout marquer comme lu'}
                </button>
              )}
            </div>

            {/* Liste des notifications */}
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>{isRTL ? 'لا توجد إشعارات' : 'Aucune notification'}</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                      !notification.read ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3 rtl:space-x-reverse">
                      {/* Icône */}
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>

                      {/* Contenu */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">
                              {notification.title}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-400 mt-2">
                              {formatTimestamp(notification.timestamp)}
                            </p>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center space-x-1 rtl:space-x-reverse ml-2 rtl:ml-0 rtl:mr-2">
                            {!notification.read && (
                              <button
                                onClick={() => markAsRead(notification.id)}
                                className="p-1 text-gray-400 hover:text-gray-600 rounded"
                                title={isRTL ? 'تحديد كمقروء' : 'Marquer comme lu'}
                              >
                                <Check className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => removeNotification(notification.id)}
                              className="p-1 text-gray-400 hover:text-red-600 rounded"
                              title={isRTL ? 'حذف' : 'Supprimer'}
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Indicateur non lu */}
                        {!notification.read && (
                          <div className="absolute left-2 rtl:left-auto rtl:right-2 top-4 w-2 h-2 bg-primary-500 rounded-full"></div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-3 border-t border-gray-200 text-center">
                <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                  {isRTL ? 'عرض جميع الإشعارات' : 'Voir toutes les notifications'}
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default NotificationCenter
