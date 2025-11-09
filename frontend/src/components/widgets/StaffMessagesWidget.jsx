import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, User, Clock, AlertCircle, CheckSquare } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import api from '../../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';

const StaffMessagesWidget = () => {
  const { isRTL } = useLanguage();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStaffMessages();
  }, []);

  const loadStaffMessages = async () => {
    try {
      setLoading(true);
      
      // Charger les événements de type memo/task créés par le staff pour l'admin
      const response = await api.get('/api/events', {
        params: {
          assigned_to: 1, // Admin ID
          status: 'pending',
          limit: 5
        }
      });

      if (response.data.success) {
        // Filtrer pour ne garder que les messages du staff (memo/task)
        const staffMessages = (response.data.events || []).filter(
          event => (event.type === 'memo' || event.type === 'task') && event.created_by !== 1
        );
        setMessages(staffMessages);
      }
    } catch (error) {
      console.error('Erreur chargement messages staff:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type) => {
    return type === 'memo' ? '📝' : '✅';
  };

  const getTypeLabel = (type) => {
    if (type === 'memo') {
      return isRTL ? 'مذكرة' : 'Mémo';
    }
    return isRTL ? 'مهمة' : 'Tâche';
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 dark:text-red-400';
      case 'medium':
        return 'text-orange-600 dark:text-orange-400';
      case 'low':
        return 'text-blue-600 dark:text-blue-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getPriorityLabel = (priority) => {
    const labels = {
      high: isRTL ? 'عالية' : 'Haute',
      medium: isRTL ? 'متوسطة' : 'Moyenne',
      low: isRTL ? 'منخفضة' : 'Basse'
    };
    return labels[priority] || priority;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return isRTL ? 'منذ دقائق' : 'Il y a quelques minutes';
    } else if (diffInHours < 24) {
      return isRTL ? `منذ ${diffInHours} ساعة` : `Il y a ${diffInHours}h`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return isRTL ? `منذ ${diffInDays} يوم` : `Il y a ${diffInDays}j`;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-purple-600" />
            {isRTL ? 'رسائل الموظفين' : 'Messages du Staff'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-purple-600" />
            {isRTL ? 'رسائل الموظفين' : 'Messages du Staff'}
          </CardTitle>
          {messages.length > 0 && (
            <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300 rounded-full text-xs font-bold">
              {messages.length}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              {isRTL ? 'لا توجد رسائل جديدة' : 'Aucun message'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((message) => (
              <Link
                key={message.id}
                to={`/dashboard/events/${message.id}`}
                className="block p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border-l-4 border-purple-500"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-xl flex-shrink-0">{getTypeIcon(message.type)}</span>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 dark:text-white text-sm truncate">
                        {message.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <User className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          {message.created_by_name || 'Staff'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span className={`text-xs font-medium flex-shrink-0 ${getPriorityColor(message.priority)}`}>
                    {getPriorityLabel(message.priority)}
                  </span>
                </div>

                {message.description && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                    {message.description}
                  </p>
                )}

                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{formatDate(message.created_at)}</span>
                  </div>
                  <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300 rounded text-xs">
                    {getTypeLabel(message.type)}
                  </span>
                </div>
              </Link>
            ))}

            {messages.length >= 5 && (
              <Link
                to="/dashboard/events/list?filter=staff-messages"
                className="block text-center text-sm text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 font-medium py-2"
              >
                {isRTL ? 'عرض الكل' : 'Voir tous les messages'} →
              </Link>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StaffMessagesWidget;
