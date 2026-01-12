/**
 * Page Fil d'Activité Simplifié - Direction
 * Crèche Mima El Ghalia
 * 
 * Interface orientée métier pour le directeur
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Activity,
    Calendar,
    ChevronLeft,
    ChevronRight,
    Clock,
    Filter,
    RefreshCw,
    Users,
    UserCheck,
    FileText,
    MessageSquare,
    TrendingUp,
    Baby,
    Shield
} from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import { useTheme } from '../../hooks/useTheme';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import api from '../../services/api';

// Couleurs par rôle
const ROLE_STYLES = {
    admin: {
        bg: 'bg-purple-100 dark:bg-purple-900/30',
        text: 'text-purple-700 dark:text-purple-300',
        border: 'border-purple-300 dark:border-purple-700',
        badge: 'bg-purple-500'
    },
    staff: {
        bg: 'bg-blue-100 dark:bg-blue-900/30',
        text: 'text-blue-700 dark:text-blue-300',
        border: 'border-blue-300 dark:border-blue-700',
        badge: 'bg-blue-500'
    },
    parent: {
        bg: 'bg-green-100 dark:bg-green-900/30',
        text: 'text-green-700 dark:text-green-300',
        border: 'border-green-300 dark:border-green-700',
        badge: 'bg-green-500'
    },
    system: {
        bg: 'bg-gray-100 dark:bg-gray-800',
        text: 'text-gray-700 dark:text-gray-300',
        border: 'border-gray-300 dark:border-gray-600',
        badge: 'bg-gray-500'
    }
};

const ROLE_ICONS = {
    admin: Shield,
    staff: UserCheck,
    parent: Users,
    system: Activity
};

const ActivityFeedPage = () => {
    const { t, isRTL } = useLanguage();
    const { isDark } = useTheme();

    // États
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('feed');
    const [feed, setFeed] = useState([]);
    const [summary, setSummary] = useState(null);
    const [calendarData, setCalendarData] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, limit: 30, total: 0 });
    const [selectedRole, setSelectedRole] = useState('');
    const [selectedDate, setSelectedDate] = useState(null);

    // État calendrier
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

    // Chargement initial
    useEffect(() => {
        loadFeed();
        loadSummary();
    }, []);

    // Charger le calendrier quand on change d'onglet
    useEffect(() => {
        if (activeTab === 'calendar') {
            loadCalendar();
        }
    }, [activeTab, currentMonth, currentYear]);

    // Recharger le feed quand les filtres changent
    useEffect(() => {
        loadFeed();
    }, [selectedRole, selectedDate, pagination.page]);

    const loadFeed = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: pagination.page,
                limit: pagination.limit
            });

            if (selectedRole) params.append('role', selectedRole);
            if (selectedDate) params.append('date', selectedDate);

            const response = await api.get(`/api/activity-feed?${params}`);

            if (response.data.success) {
                setFeed(response.data.feed);
                setPagination(prev => ({
                    ...prev,
                    total: response.data.pagination.total,
                    totalPages: response.data.pagination.totalPages
                }));
            }
        } catch (error) {
            console.error('Erreur chargement feed:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadSummary = async (date = null) => {
        try {
            const params = date ? `?date=${date}` : '';
            const response = await api.get(`/api/activity-feed/summary${params}`);

            if (response.data.success) {
                setSummary(response.data.summary);
            }
        } catch (error) {
            console.error('Erreur chargement résumé:', error);
        }
    };

    const loadCalendar = async () => {
        try {
            const response = await api.get(`/api/activity-feed/calendar/${currentYear}/${currentMonth}`);

            if (response.data.success) {
                setCalendarData(response.data.calendar);
            }
        } catch (error) {
            console.error('Erreur chargement calendrier:', error);
        }
    };

    const handleDateClick = (date) => {
        setSelectedDate(date);
        loadSummary(date);
        setActiveTab('feed');
    };

    const handlePrevMonth = () => {
        if (currentMonth === 1) {
            setCurrentMonth(12);
            setCurrentYear(prev => prev - 1);
        } else {
            setCurrentMonth(prev => prev - 1);
        }
    };

    const handleNextMonth = () => {
        if (currentMonth === 12) {
            setCurrentMonth(1);
            setCurrentYear(prev => prev + 1);
        } else {
            setCurrentMonth(prev => prev + 1);
        }
    };

    const clearFilters = () => {
        setSelectedRole('');
        setSelectedDate(null);
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    // Rendu du résumé du jour
    const renderSummary = () => {
        if (!summary) return null;

        const stats = summary.stats || {};

        return (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-green-100 text-xs">Parents actifs</p>
                                <p className="text-2xl font-bold">{stats.active_parents || 0}</p>
                            </div>
                            <Users className="w-8 h-8 text-green-200" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-blue-100 text-xs">Staff actif</p>
                                <p className="text-2xl font-bold">{stats.active_staff || 0}</p>
                            </div>
                            <UserCheck className="w-8 h-8 text-blue-200" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-amber-100 text-xs">Inscriptions</p>
                                <p className="text-2xl font-bold">{stats.new_enrollments || 0}</p>
                            </div>
                            <FileText className="w-8 h-8 text-amber-200" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-pink-500 to-pink-600 text-white">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-pink-100 text-xs">Messages</p>
                                <p className="text-2xl font-bold">{stats.messages_received || 0}</p>
                            </div>
                            <MessageSquare className="w-8 h-8 text-pink-200" />
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    };

    // Rendu d'un élément du fil
    const renderFeedItem = (item) => {
        const roleStyle = ROLE_STYLES[item.userRole] || ROLE_STYLES.system;
        const RoleIcon = ROLE_ICONS[item.userRole] || Activity;

        return (
            <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-xl border ${roleStyle.border} ${roleStyle.bg} mb-3`}
            >
                <div className="flex items-start gap-3">
                    {/* Avatar avec icône de rôle */}
                    <div className={`w-10 h-10 rounded-full ${roleStyle.badge} flex items-center justify-center text-white flex-shrink-0`}>
                        <RoleIcon className="w-5 h-5" />
                    </div>

                    {/* Contenu */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className={`font-semibold ${roleStyle.text}`}>
                                {item.userName}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${roleStyle.badge} text-white`}>
                                {item.userRoleLabel}
                            </span>
                        </div>

                        <p className="text-gray-700 dark:text-gray-300 mt-1">
                            <span className="text-xl mr-2">{item.icon}</span>
                            {item.message}
                        </p>

                        <div className="flex items-center gap-2 mt-2 text-xs text-gray-500 dark:text-gray-400">
                            <Clock className="w-3 h-3" />
                            <span>{item.timeAgo}</span>
                        </div>
                    </div>
                </div>
            </motion.div>
        );
    };

    // Rendu du fil d'activité
    const renderFeed = () => (
        <div>
            {/* Filtres */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
                <select
                    value={selectedRole}
                    onChange={(e) => {
                        setSelectedRole(e.target.value);
                        setPagination(prev => ({ ...prev, page: 1 }));
                    }}
                    className="px-3 py-2 text-sm border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                >
                    <option value="">Tous les rôles</option>
                    <option value="admin">👑 Direction</option>
                    <option value="staff">👩‍💼 Staff</option>
                    <option value="parent">👨‍👩‍👧 Parents</option>
                </select>

                {selectedDate && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-sm">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(selectedDate).toLocaleDateString('fr-FR')}</span>
                        <button
                            onClick={() => setSelectedDate(null)}
                            className="ml-1 text-red-500 hover:text-red-700"
                        >
                            ×
                        </button>
                    </div>
                )}

                {(selectedRole || selectedDate) && (
                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                        Effacer filtres
                    </Button>
                )}

                <div className="flex-1" />

                <Button variant="outline" size="sm" onClick={loadFeed}>
                    <RefreshCw className="w-4 h-4 mr-1" />
                    Actualiser
                </Button>
            </div>

            {/* Liste */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <LoadingSpinner />
                </div>
            ) : feed.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                    <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Aucune activité pour le moment</p>
                </div>
            ) : (
                <>
                    <div className="space-y-1">
                        {feed.map(item => renderFeedItem(item))}
                    </div>

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className="flex items-center justify-center gap-3 mt-6">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={pagination.page === 1}
                                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                            >
                                Précédent
                            </Button>
                            <span className="text-sm text-gray-500">
                                Page {pagination.page} / {pagination.totalPages}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={pagination.page === pagination.totalPages}
                                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                            >
                                Suivant
                            </Button>
                        </div>
                    )}
                </>
            )}
        </div>
    );

    // Rendu du calendrier
    const renderCalendar = () => {
        const monthNames = [
            'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
            'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
        ];

        const daysOfWeek = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

        // Calculer les jours du mois
        const firstDay = new Date(currentYear, currentMonth - 1, 1);
        const lastDay = new Date(currentYear, currentMonth, 0);
        const daysInMonth = lastDay.getDate();
        const startDayOfWeek = (firstDay.getDay() + 6) % 7; // Lundi = 0

        const days = [];

        // Jours vides avant le premier jour
        for (let i = 0; i < startDayOfWeek; i++) {
            days.push(null);
        }

        // Jours du mois
        for (let i = 1; i <= daysInMonth; i++) {
            const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            const dayData = calendarData.find(d => d.date === dateStr);
            days.push({
                day: i,
                date: dateStr,
                data: dayData
            });
        }

        return (
            <Card>
                <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                        <Button variant="ghost" size="sm" onClick={handlePrevMonth}>
                            <ChevronLeft className="w-5 h-5" />
                        </Button>
                        <CardTitle className="text-lg">
                            {monthNames[currentMonth - 1]} {currentYear}
                        </CardTitle>
                        <Button variant="ghost" size="sm" onClick={handleNextMonth}>
                            <ChevronRight className="w-5 h-5" />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {/* En-têtes des jours */}
                    <div className="grid grid-cols-7 gap-1 mb-2">
                        {daysOfWeek.map(day => (
                            <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Grille des jours */}
                    <div className="grid grid-cols-7 gap-1">
                        {days.map((dayInfo, index) => {
                            if (!dayInfo) {
                                return <div key={`empty-${index}`} className="aspect-square" />;
                            }

                            const hasActivity = dayInfo.data && dayInfo.data.totalActions > 0;
                            const isToday = dayInfo.date === new Date().toISOString().split('T')[0];
                            const isSelected = dayInfo.date === selectedDate;

                            return (
                                <button
                                    key={dayInfo.date}
                                    onClick={() => handleDateClick(dayInfo.date)}
                                    className={`
                    aspect-square rounded-lg flex flex-col items-center justify-center text-sm
                    transition-all hover:scale-105
                    ${isToday ? 'ring-2 ring-blue-500' : ''}
                    ${isSelected ? 'bg-blue-500 text-white' : ''}
                    ${hasActivity && !isSelected ? 'bg-green-100 dark:bg-green-900/30' : ''}
                    ${!hasActivity && !isSelected ? 'hover:bg-gray-100 dark:hover:bg-gray-800' : ''}
                  `}
                                >
                                    <span className={`font-medium ${isSelected ? 'text-white' : ''}`}>
                                        {dayInfo.day}
                                    </span>
                                    {hasActivity && !isSelected && (
                                        <div className="flex gap-0.5 mt-0.5">
                                            {dayInfo.data.parentActions > 0 && (
                                                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                            )}
                                            {dayInfo.data.staffActions > 0 && (
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                            )}
                                            {dayInfo.data.adminActions > 0 && (
                                                <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                                            )}
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Légende */}
                    <div className="flex items-center justify-center gap-4 mt-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-green-500" />
                            <span>Parents</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-blue-500" />
                            <span>Staff</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-purple-500" />
                            <span>Direction</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    };

    return (
        <div className={`p-4 md:p-6 ${isRTL ? 'rtl' : ''}`}>
            {/* En-tête */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Activity className="w-7 h-7 text-blue-500" />
                    Fil d'Activité
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                    Suivez les actions des parents, du staff et de la direction
                </p>
            </div>

            {/* Résumé du jour */}
            {renderSummary()}

            {/* Onglets */}
            <div className="flex gap-2 mb-4 border-b dark:border-gray-700">
                <button
                    onClick={() => setActiveTab('feed')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'feed'
                            ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <Activity className="w-4 h-4 inline mr-1" />
                    Fil d'activité
                </button>
                <button
                    onClick={() => setActiveTab('calendar')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'calendar'
                            ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Calendrier
                </button>
            </div>

            {/* Contenu */}
            <AnimatePresence mode="wait">
                {activeTab === 'feed' && (
                    <motion.div
                        key="feed"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        {renderFeed()}
                    </motion.div>
                )}
                {activeTab === 'calendar' && (
                    <motion.div
                        key="calendar"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        {renderCalendar()}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ActivityFeedPage;
