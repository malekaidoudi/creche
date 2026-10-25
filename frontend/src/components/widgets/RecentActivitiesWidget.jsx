import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    Sparkles,
    UserCheck,
    UserX,
    ClipboardList,
    AlertCircle,
    CheckCircle,
    CheckSquare,
    Clock,
    RefreshCw
} from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import api from '../../services/api';
import API_CONFIG from '../../config/api';

const ICONS_MAP = {
    check_in: UserCheck,
    check_out: UserX,
    daily_report: ClipboardList,
    activity: Sparkles,
    absence: AlertCircle,
    enrollment: CheckCircle,
    task_completed: CheckSquare,
    task_assigned: ClipboardList,
    default: Clock
};

export const formatRelativeTime = (timestamp, isRTL = false) => {
    if (!timestamp) return isRTL ? 'غير معروف' : 'Récemment';

    const now = new Date();
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return isRTL ? 'غير معروف' : 'Récemment';

    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const timeStr = `${hours}:${minutes}`;

    if (diffMins < 1) return isRTL ? 'الآن' : 'à l\'instant';
    if (diffMins < 60) return isRTL ? `منذ ${diffMins} د` : `il y a ${diffMins} min`;
    if (diffHours < 24 && date.getDate() === now.getDate()) {
        return isRTL ? `اليوم ${timeStr}` : `Aujourd'hui à ${timeStr}`;
    }
    if (diffDays === 1 || (diffHours < 48 && date.getDate() === now.getDate() - 1)) {
        return isRTL ? `أمس ${timeStr}` : `Hier à ${timeStr}`;
    }
    if (diffDays < 7) return isRTL ? `منذ ${diffDays} أيام` : `il y a ${diffDays} jours`;

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return isRTL ? `${day}/${month}` : `le ${day}/${month}`;
};

const RecentActivitiesWidget = ({
    activities: propActivities,
    isMobile = false,
    embedded = false,
    maxItems
}) => {
    const { isRTL } = useLanguage();
    const navigate = useNavigate();
    const [activities, setActivities] = useState(propActivities || []);
    const [loading, setLoading] = useState(!propActivities);

    const loadActivities = async () => {
        try {
            setLoading(true);
            const res = await api.get('/api/dashboard/recent-activities');
            if (res.data?.success && res.data.activities) {
                setActivities(res.data.activities);
            }
        } catch (err) {
            console.warn('Erreur chargement recent-activities:', err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!propActivities) {
            loadActivities();
        } else {
            setActivities(propActivities);
            setLoading(false);
        }
    }, [propActivities]);

    const limit = maxItems || (isMobile ? 8 : 12);
    const displayActivities = activities.slice(0, limit);

    const containerClasses = embedded || isMobile
        ? 'flex flex-col h-full bg-transparent'
        : 'bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/80 dark:border-gray-700/80 overflow-hidden shadow-xs flex flex-col h-full';

    return (
        <div className={containerClasses}>
            {/* Header affiché seulement si standalone (non embedded et non mobile) */}
            {!isMobile && !embedded && (
                <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700/60 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-800/80">
                    <div className="flex items-center space-x-3 rtl:space-x-reverse">
                        <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-900/30 border border-purple-200/50 dark:border-purple-700/50 flex items-center justify-center text-purple-600 dark:text-purple-400">
                            <Clock className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 dark:text-white text-base">
                                {isRTL ? 'الأنشطة الأخيرة' : 'Activités récentes'}
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                {isRTL ? 'متابعة حية ليوميات الأطفال والفريق' : 'Fil en direct des enfants et de l\'équipe'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={loadActivities}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        title={isRTL ? 'تحديث' : 'Actualiser'}
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            )}

            {/* Content List */}
            <div className={`${embedded ? 'p-0 pt-1' : 'p-3'} space-y-2 max-h-[380px] overflow-y-auto flex-1`}>
                {displayActivities.length > 0 ? (
                    displayActivities.map((act, index) => {
                        const Icon = ICONS_MAP[act.type] || ICONS_MAP.default;
                        const timeAgo = formatRelativeTime(act.timestamp, isRTL);
                        const message = isRTL ? (act.messageAr || act.message) : act.message;
                        const title = isRTL ? (act.titleAr || act.title) : act.title;

                        let photoSrc = null;
                        if (act.photoUrl) {
                            photoSrc = act.photoUrl.startsWith('http')
                                ? act.photoUrl
                                : `${API_CONFIG.BASE_URL}${act.photoUrl.startsWith('/') ? '' : '/'}${act.photoUrl}`;
                        }

                        return (
                            <motion.div
                                key={act.id || index}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.03 }}
                                onClick={() => act.link && navigate(act.link)}
                                className={`flex items-start gap-3 p-2.5 rounded-xl border border-gray-100 dark:border-gray-700/60 hover:border-cyan-300 dark:hover:border-cyan-600/50 bg-gray-50/70 dark:bg-gray-800/60 hover:bg-white dark:hover:bg-gray-750 transition-all ${act.link ? 'cursor-pointer' : ''}`}
                            >
                                {/* Icône / Photo */}
                                <div className="relative shrink-0 mt-0.5">
                                    {photoSrc ? (
                                        <img
                                            src={photoSrc}
                                            alt=""
                                            className="w-9 h-9 rounded-xl object-cover border border-gray-200 dark:border-gray-700"
                                            onError={(e) => {
                                                e.currentTarget.style.display = 'none';
                                                e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                            }}
                                        />
                                    ) : null}
                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center border shadow-xs ${act.color || 'bg-gray-100 text-gray-600'} ${photoSrc ? 'hidden' : ''}`}>
                                        <Icon className="w-4 h-4" />
                                    </div>
                                </div>

                                {/* Texte & Détails */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-1.5 mb-0.5">
                                        <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                            {title}
                                        </span>
                                        <span className="text-[10px] text-gray-400 dark:text-gray-400 whitespace-nowrap">
                                            {timeAgo}
                                        </span>
                                    </div>
                                    <p className="text-xs font-medium text-gray-900 dark:text-gray-100 leading-snug line-clamp-2">
                                        {message}
                                    </p>
                                </div>
                            </motion.div>
                        );
                    })
                ) : (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <Clock className="w-10 h-10 mx-auto mb-2 opacity-30 text-purple-500" />
                        <p className="text-xs font-medium">
                            {isRTL ? 'لا توجد أنشطة مسجلة لليوم حتى الآن' : 'Aucune activité récente enregistrée pour le moment.'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RecentActivitiesWidget;
