/**
 * MobilePlanning - Planning optimisé mobile
 * 
 * Vue calendrier simplifiée avec liste des événements du jour,
 * navigation par swipe entre les jours.
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Calendar,
    ChevronLeft,
    ChevronRight,
    Plus,
    Clock,
    MapPin,
    Users,
    Tag,
    Filter,
    List,
    Grid3X3
} from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import MobileHeader from './MobileHeader';
import MobileCard from './MobileCard';

const MobilePlanning = ({
    events = [],
    loading = false,
    onAddEvent,
    onEventClick,
    onDateChange
}) => {
    const { isRTL } = useLanguage();
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [viewMode, setViewMode] = useState('list'); // list, calendar
    const [currentMonth, setCurrentMonth] = useState(new Date());

    // Jours de la semaine
    const weekDays = isRTL
        ? ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت']
        : ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

    // Obtenir les jours du mois
    const calendarDays = useMemo(() => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const days = [];

        // Jours du mois précédent pour compléter la première semaine
        const startPadding = firstDay.getDay();
        for (let i = startPadding - 1; i >= 0; i--) {
            const day = new Date(year, month, -i);
            days.push({ date: day, isCurrentMonth: false });
        }

        // Jours du mois courant
        for (let i = 1; i <= lastDay.getDate(); i++) {
            days.push({ date: new Date(year, month, i), isCurrentMonth: true });
        }

        // Jours du mois suivant pour compléter
        const remaining = 42 - days.length;
        for (let i = 1; i <= remaining; i++) {
            days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
        }

        return days;
    }, [currentMonth]);

    // Événements du jour sélectionné
    const dayEvents = useMemo(() => {
        return events.filter(event => {
            const eventDate = new Date(event.start_date || event.date);
            return eventDate.toDateString() === selectedDate.toDateString();
        }).sort((a, b) => {
            const timeA = new Date(a.start_date || a.date).getTime();
            const timeB = new Date(b.start_date || b.date).getTime();
            return timeA - timeB;
        });
    }, [events, selectedDate]);

    // Vérifier si un jour a des événements
    const hasEvents = (date) => {
        return events.some(event => {
            const eventDate = new Date(event.start_date || event.date);
            return eventDate.toDateString() === date.toDateString();
        });
    };

    // Navigation mois
    const goToPrevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
    };

    const goToNextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
    };

    const goToToday = () => {
        const today = new Date();
        setSelectedDate(today);
        setCurrentMonth(today);
        onDateChange?.(today);
    };

    const selectDate = (date) => {
        setSelectedDate(date);
        onDateChange?.(date);
    };

    const isToday = (date) => {
        return date.toDateString() === new Date().toDateString();
    };

    const isSelected = (date) => {
        return date.toDateString() === selectedDate.toDateString();
    };

    const formatEventTime = (event) => {
        const start = new Date(event.start_date || event.date);
        return start.toLocaleTimeString(isRTL ? 'ar-TN' : 'fr-FR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getEventColor = (event) => {
        const colors = {
            event: 'blue',
            meeting: 'purple',
            activity: 'green',
            holiday: 'red',
            reminder: 'orange'
        };
        return colors[event.type] || 'gray';
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
            {/* Header */}
            <MobileHeader
                title={isRTL ? 'التخطيط' : 'Planning'}
                subtitle={currentMonth.toLocaleDateString(isRTL ? 'ar-TN' : 'fr-FR', {
                    month: 'long',
                    year: 'numeric'
                })}
                actions={[
                    {
                        icon: viewMode === 'list' ? Grid3X3 : List,
                        onClick: () => setViewMode(viewMode === 'list' ? 'calendar' : 'list'),
                        label: 'Vue'
                    },
                    { icon: Plus, onClick: onAddEvent, label: 'Ajouter' }
                ]}
            />

            <div className="p-4 space-y-4">
                {/* Navigation rapide */}
                <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-xl p-3">
                    <button
                        onClick={goToPrevMonth}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                    >
                        <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </button>

                    <button
                        onClick={goToToday}
                        className="px-4 py-2 text-sm font-medium text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg"
                    >
                        {isRTL ? 'اليوم' : "Aujourd'hui"}
                    </button>

                    <button
                        onClick={goToNextMonth}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                    >
                        <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </button>
                </div>

                {/* Mini calendrier */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4">
                    {/* Jours de la semaine */}
                    <div className="grid grid-cols-7 gap-1 mb-2">
                        {weekDays.map((day, index) => (
                            <div
                                key={index}
                                className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-2"
                            >
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Grille des jours */}
                    <div className="grid grid-cols-7 gap-1">
                        {calendarDays.map((day, index) => (
                            <button
                                key={index}
                                onClick={() => selectDate(day.date)}
                                className={`relative aspect-square flex items-center justify-center rounded-lg text-sm transition-colors ${!day.isCurrentMonth
                                        ? 'text-gray-300 dark:text-gray-600'
                                        : isSelected(day.date)
                                            ? 'bg-primary-600 text-white font-bold'
                                            : isToday(day.date)
                                                ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 font-semibold'
                                                : 'text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}
                            >
                                {day.date.getDate()}
                                {hasEvents(day.date) && !isSelected(day.date) && (
                                    <span className="absolute bottom-1 w-1 h-1 bg-primary-500 rounded-full" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Événements du jour */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {selectedDate.toLocaleDateString(isRTL ? 'ar-TN' : 'fr-FR', {
                                weekday: 'long',
                                day: 'numeric',
                                month: 'long'
                            })}
                        </h2>
                        <span className="text-sm text-gray-500">
                            {dayEvents.length} {isRTL ? 'حدث' : 'événement(s)'}
                        </span>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : dayEvents.length === 0 ? (
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center">
                            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500 dark:text-gray-400 mb-4">
                                {isRTL ? 'لا توجد أحداث في هذا اليوم' : 'Aucun événement ce jour'}
                            </p>
                            <button
                                onClick={onAddEvent}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium"
                            >
                                <Plus className="w-4 h-4" />
                                {isRTL ? 'إضافة حدث' : 'Ajouter un événement'}
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {dayEvents.map((event) => (
                                <MobileCard
                                    key={event.id}
                                    title={event.title || event.name}
                                    subtitle={formatEventTime(event)}
                                    icon={Calendar}
                                    iconColor={getEventColor(event)}
                                    badge={event.type ? { text: event.type, color: getEventColor(event) } : null}
                                    onClick={() => onEventClick?.(event)}
                                    showChevron
                                >
                                    <div className="flex flex-wrap gap-3 text-sm text-gray-500 dark:text-gray-400 mt-2">
                                        {event.location && (
                                            <div className="flex items-center gap-1">
                                                <MapPin className="w-3.5 h-3.5" />
                                                <span className="truncate max-w-[150px]">{event.location}</span>
                                            </div>
                                        )}
                                        {event.participants_count && (
                                            <div className="flex items-center gap-1">
                                                <Users className="w-3.5 h-3.5" />
                                                <span>{event.participants_count}</span>
                                            </div>
                                        )}
                                    </div>
                                </MobileCard>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* FAB pour ajouter */}
            {onAddEvent && (
                <motion.button
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={onAddEvent}
                    className="fixed bottom-24 right-4 rtl:right-auto rtl:left-4 w-14 h-14 bg-primary-600 hover:bg-primary-700 text-white rounded-full shadow-lg flex items-center justify-center z-40"
                >
                    <Plus className="w-6 h-6" />
                </motion.button>
            )}
        </div>
    );
};

export default MobilePlanning;
