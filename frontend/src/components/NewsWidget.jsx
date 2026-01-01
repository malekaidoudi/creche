/**
 * Widget Nouveautés - Affiche les dernières nouvelles de la crèche
 * (jours fériés, vacances, événements, annonces, anniversaires, etc.)
 * Visible dans l'espace parent et le dashboard staff
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Newspaper,
    Calendar,
    PartyPopper,
    Megaphone,
    Clock,
    Phone,
    X,
    Bell,
    Gift,
    Users,
    CalendarOff,
    CalendarCheck
} from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import { useTheme } from '../hooks/useTheme';
import api from '../services/api';
import WidgetCard, { WidgetEmptyState } from './ui/WidgetCard';

const NewsWidget = ({ onNavigate, focusId = null }) => {
    const { isRTL } = useLanguage();
    const { isDark } = useTheme();
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [hiddenNews, setHiddenNews] = useState(() => {
        const saved = localStorage.getItem('hiddenNews');
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(() => {
        fetchNews();
    }, []);

    // Scroll vers l'élément focusé si focusId est défini
    useEffect(() => {
        if (focusId && news.length > 0) {
            const element = document.getElementById(`news-item-${focusId}`);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                element.classList.add('ring-2', 'ring-primary-500');
                setTimeout(() => {
                    element.classList.remove('ring-2', 'ring-primary-500');
                }, 3000);
            }
        }
    }, [focusId, news]);

    const fetchNews = async () => {
        try {
            setLoading(true);

            // Récupérer les notifications de type "nouveauté"
            const response = await api.get('/api/notifications', {
                params: {
                    type: 'holiday_added,holiday_removed,vacation_added,vacation_removed,announcement,event,schedule_changed,saturday_changed,phone_changed,birthday_reminder',
                    limit: 20
                }
            });

            if (response.data.success) {
                // Filtrer les news masquées
                const filteredNews = response.data.notifications.filter(
                    n => !hiddenNews.includes(n.id)
                );
                setNews(filteredNews);
            }
        } catch (error) {
            console.error('Erreur chargement nouveautés:', error);
        } finally {
            setLoading(false);
        }
    };

    const hideNews = (newsId) => {
        const newHiddenNews = [...hiddenNews, newsId];
        setHiddenNews(newHiddenNews);
        localStorage.setItem('hiddenNews', JSON.stringify(newHiddenNews));
        setNews(news.filter(n => n.id !== newsId));
    };

    const getNewsIcon = (type) => {
        switch (type) {
            case 'holiday_added':
            case 'vacation_added':
                return <CalendarCheck className="w-5 h-5 text-green-500" />;
            case 'holiday_removed':
            case 'vacation_removed':
                return <CalendarOff className="w-5 h-5 text-red-500" />;
            case 'announcement':
                return <Megaphone className="w-5 h-5 text-blue-500" />;
            case 'event':
                return <PartyPopper className="w-5 h-5 text-purple-500" />;
            case 'schedule_changed':
                return <Clock className="w-5 h-5 text-orange-500" />;
            case 'saturday_changed':
                return <Calendar className="w-5 h-5 text-cyan-500" />;
            case 'phone_changed':
                return <Phone className="w-5 h-5 text-indigo-500" />;
            case 'birthday_reminder':
                return <Gift className="w-5 h-5 text-pink-500" />;
            default:
                return <Bell className="w-5 h-5 text-gray-500" />;
        }
    };

    const getNewsColor = (type) => {
        switch (type) {
            case 'holiday_added':
            case 'vacation_added':
                return isDark ? 'bg-green-900/30 border-green-700' : 'bg-green-50 border-green-200';
            case 'holiday_removed':
            case 'vacation_removed':
                return isDark ? 'bg-red-900/30 border-red-700' : 'bg-red-50 border-red-200';
            case 'announcement':
                return isDark ? 'bg-blue-900/30 border-blue-700' : 'bg-blue-50 border-blue-200';
            case 'event':
                return isDark ? 'bg-purple-900/30 border-purple-700' : 'bg-purple-50 border-purple-200';
            case 'birthday_reminder':
                return isDark ? 'bg-pink-900/30 border-pink-700' : 'bg-pink-50 border-pink-200';
            default:
                return isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200';
        }
    };

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return isRTL ? 'الآن' : 'À l\'instant';
        if (diffMins < 60) return isRTL ? `منذ ${diffMins} دقيقة` : `Il y a ${diffMins} min`;
        if (diffHours < 24) return isRTL ? `منذ ${diffHours} ساعة` : `Il y a ${diffHours}h`;
        if (diffDays < 7) return isRTL ? `منذ ${diffDays} يوم` : `Il y a ${diffDays}j`;

        return date.toLocaleDateString(isRTL ? 'ar-TN' : 'fr-FR', {
            day: 'numeric',
            month: 'short'
        });
    };

    const handleNewsClick = (newsItem) => {
        // Naviguer vers la section appropriée
        if (onNavigate) {
            switch (newsItem.type) {
                case 'holiday_added':
                case 'holiday_removed':
                case 'vacation_added':
                case 'vacation_removed':
                    onNavigate('/dashboard/settings', 'holidays');
                    break;
                case 'announcement':
                    onNavigate('/annonces', newsItem.related_id);
                    break;
                case 'event':
                    onNavigate('/evenements', newsItem.related_id);
                    break;
                case 'birthday_reminder':
                    onNavigate('/mon-espace');
                    break;
                default:
                    break;
            }
        }
    };

    return (
        <WidgetCard
            icon={Newspaper}
            title={isRTL ? 'آخر الأخبار' : 'Nouveautés'}
            badge={news.length}
            iconColor="primary"
            loading={loading}
            noPadding
        >
            {news.length === 0 ? (
                <WidgetEmptyState
                    icon={Bell}
                    message={isRTL ? 'لا توجد أخبار جديدة' : 'Aucune nouveauté pour le moment'}
                />
            ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    <AnimatePresence>
                        {news.map((item, index) => (
                            <motion.div
                                key={item.id}
                                id={`news-item-${item.id}`}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ delay: index * 0.05 }}
                                className={`p-3 ${getNewsColor(item.type)} border-l-4 transition-all ${!item.is_read ? 'ring-1 ring-primary-300' : ''}`}
                            >
                                <div className="flex items-start gap-3">
                                    <div className="flex-shrink-0 mt-0.5">
                                        {getNewsIcon(item.type)}
                                        {!item.is_read && (
                                            <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary-500 rounded-full"></span>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm ${!item.is_read ? 'font-bold' : 'font-medium'} ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                            {item.title}
                                        </p>
                                        <p className={`text-xs mt-0.5 ${!item.is_read ? 'font-semibold' : ''} ${isDark ? 'text-gray-400' : 'text-gray-600'} line-clamp-2`}>
                                            {item.message}
                                        </p>
                                        <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                            {formatDate(item.created_at)}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => hideNews(item.id)}
                                        className={`p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors`}
                                        title={isRTL ? 'إخفاء' : 'Masquer'}
                                    >
                                        <X className="w-4 h-4 text-gray-400" />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </WidgetCard>
    );
};

export default NewsWidget;
