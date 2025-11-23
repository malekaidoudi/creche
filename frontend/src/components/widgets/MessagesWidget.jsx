import React, { useState, useEffect } from 'react';
import { MessageSquare, ArrowRight, ExternalLink } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '../../hooks/useLanguage';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3003/api';

const MessagesWidget = ({ isMobileView = false }) => {
  const { isRTL } = useLanguage();
  const navigate = useNavigate();
  const [unreadMessages, setUnreadMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUnreadMessages();
  }, []);

  const loadUnreadMessages = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/staff-messages/unread`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success && response.data.messages) {
        // Limiter à 20 messages maximum pour éviter surcharge
        setUnreadMessages(response.data.messages.slice(0, 20));
      } else {
        setUnreadMessages([]);
      }
    } catch (error) {
      console.error('Erreur chargement messages non lus:', error);
      setUnreadMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now - date;
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) {
      return isRTL ? 'الآن' : 'À l\'instant';
    } else if (diffMinutes < 60) {
      return isRTL ? `منذ ${diffMinutes} دقيقة` : `Il y a ${diffMinutes} min`;
    } else if (diffHours < 24) {
      return isRTL ? `منذ ${diffHours} ساعة` : `Il y a ${diffHours}h`;
    } else if (diffDays < 7) {
      return isRTL ? `منذ ${diffDays} يوم` : `Il y a ${diffDays}j`;
    } else {
      return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short'
      });
    }
  };

  const handleMessageClick = async (message) => {
    try {
      // Marquer le message comme lu
      const token = localStorage.getItem('token');
      await axios.patch(
        `${API_URL}/staff-messages/${message.id}/read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Naviguer vers la page messages avec le messageId
      navigate(`/dashboard/messages?messageId=${message.id}`);
    } catch (error) {
      console.error('Erreur marquage message lu:', error);
      // Naviguer quand même même en cas d'erreur
      navigate(`/dashboard/messages?messageId=${message.id}`);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow flex flex-col h-[400px]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {isRTL ? 'الرسائل' : 'Messages'}
          </h3>
        </div>
        <div className="p-4 flex-1 min-h-0 overflow-y-auto space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse">
              <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow flex flex-col h-[400px]">
      {/* Header - Masqué en mode mobile */}
      {!isMobileView && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <MessageSquare className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {isRTL ? 'الرسائل' : 'Messages'}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {unreadMessages.length > 0
                    ? (isRTL ? `${unreadMessages.length} غير مقروءة` : `${unreadMessages.length} non lus`)
                    : (isRTL ? 'لا توجد رسائل جديدة' : 'Aucun nouveau message')
                  }
                </p>
              </div>
            </div>
            <Link
              to="/dashboard/messages"
              className="p-2 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
              title={isRTL ? 'فتح الرسائل' : 'Ouvrir les messages'}
            >
              <ExternalLink className="w-5 h-5 text-green-600 dark:text-green-400" />
            </Link>
          </div>
        </div>
      )}

      {/* Messages List */}
      <div className={`p-4 flex-1 min-h-0 overflow-y-auto ${isMobileView ? 'p-3' : ''}`}>
        {unreadMessages.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">
              {isRTL ? 'لا توجد رسائل غير مقروءة' : 'Aucun message non lu'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {unreadMessages.map((message) => (
              <div
                key={message.id}
                onClick={() => handleMessageClick(message)}
                className="flex items-start gap-2 p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
              >
                {/* Avatar */}
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-blue-400 flex items-center justify-center text-white text-xs font-bold">
                    {message.sender_name?.charAt(0) || '?'}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-0.5">
                    <h4 className="font-medium text-gray-900 dark:text-white text-xs line-clamp-1">
                      {message.sender_name}
                    </h4>
                    <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {formatDate(message.created_at)}
                    </span>
                  </div>

                  <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">
                    {message.content}
                  </p>
                </div>

                {/* Unread indicator */}
                <div className="flex-shrink-0">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagesWidget;
