/**
 * MobileDashboard - Dashboard optimisé mobile
 * 
 * Version simplifiée du dashboard avec les KPIs essentiels,
 * actions rapides et aperçu des activités.
 * 
 * @usage
 * import MobileDashboard from '@/components/mobile/MobileDashboard';
 * <MobileDashboard />
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Users,
    ClipboardCheck,
    Calendar,
    AlertCircle,
    Bell,
    UserPlus,
    ChevronRight,
    Clock,
    TrendingUp,
    Baby,
    FileText,
    CalendarPlus,
    CreditCard,
    Plus
} from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import { useAuth } from '../../contexts/AuthContext';
import MobileHeader from './MobileHeader';
import MobileStatCard from './MobileStatCard';
import MobileCard from './MobileCard';

const MobileDashboard = ({ stats, recentActivity, pendingItems, onRefresh }) => {
    const { isRTL } = useLanguage();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [greeting, setGreeting] = useState('');

    useEffect(() => {
        const hour = new Date().getHours();
        if (hour < 12) {
            setGreeting(isRTL ? 'صباح الخير' : 'Bonjour');
        } else if (hour < 18) {
            setGreeting(isRTL ? 'مساء الخير' : 'Bon après-midi');
        } else {
            setGreeting(isRTL ? 'مساء الخير' : 'Bonsoir');
        }
    }, [isRTL]);

    // Actions rapides selon le rôle
    const quickActions = user?.role === 'parent' ? [
        {
            icon: ClipboardCheck,
            label: isRTL ? 'طلب غياب' : 'Déclarer absence',
            path: '/parent/absence-request',
            color: 'orange'
        },
        {
            icon: Calendar,
            label: isRTL ? 'التقويم' : 'Calendrier',
            path: '/parent/calendar',
            color: 'blue'
        },
        {
            icon: Bell,
            label: isRTL ? 'الإعلانات' : 'Annonces',
            path: '/parent/announcements',
            color: 'purple'
        }
    ] : [
        {
            icon: ClipboardCheck,
            label: isRTL ? 'الحضور' : 'Présences',
            path: '/dashboard/attendance',
            color: 'green'
        },
        {
            icon: UserPlus,
            label: isRTL ? 'تسجيل' : 'Inscription',
            path: '/dashboard/enrollments',
            color: 'blue'
        },
        {
            icon: CalendarPlus,
            label: isRTL ? 'حدث' : 'Événement',
            path: '/dashboard/events/new',
            color: 'purple'
        },
        {
            icon: CreditCard,
            label: isRTL ? 'دفع' : 'Paiement',
            path: '/dashboard/payments/alert',
            color: 'orange'
        }
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <MobileHeader
                title={`${greeting}, ${user?.first_name || ''}`}
                subtitle={new Date().toLocaleDateString(isRTL ? 'ar-TN' : 'fr-FR', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long'
                })}
                showNotifications={true}
            />

            <motion.div
                className="p-4 space-y-6"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {/* Quick Actions */}
                <motion.div variants={itemVariants}>
                    <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                        {isRTL ? 'الإجراءات السريعة' : 'Actions rapides'}
                    </h2>
                    <div className="grid grid-cols-4 gap-3">
                        {quickActions.map((action, index) => {
                            const Icon = action.icon;
                            const colorClasses = {
                                green: 'bg-green-100 dark:bg-green-900/30 text-green-600',
                                blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600',
                                purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600',
                                orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600'
                            };
                            return (
                                <button
                                    key={index}
                                    onClick={() => navigate(action.path)}
                                    className="flex flex-col items-center p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm active:scale-95 transition-transform"
                                >
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 ${colorClasses[action.color]}`}>
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <span className="text-xs text-gray-700 dark:text-gray-300 text-center line-clamp-1">
                                        {action.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </motion.div>

                {/* Stats Cards */}
                <motion.div variants={itemVariants}>
                    <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                        {isRTL ? 'نظرة عامة' : 'Aperçu'}
                    </h2>
                    <div className="grid grid-cols-2 gap-3">
                        <MobileStatCard
                            title={isRTL ? 'الحاضرون اليوم' : 'Présents aujourd\'hui'}
                            value={stats?.presentToday ?? '-'}
                            change={stats?.presenceChange}
                            trend={stats?.presenceTrend || 'neutral'}
                            icon={Users}
                            color="green"
                            onClick={() => navigate('/dashboard/attendance')}
                        />
                        <MobileStatCard
                            title={isRTL ? 'إجمالي الأطفال' : 'Total enfants'}
                            value={stats?.totalChildren ?? '-'}
                            icon={Baby}
                            color="blue"
                            onClick={() => navigate('/dashboard/children')}
                        />
                        {user?.role !== 'parent' && (
                            <>
                                <MobileStatCard
                                    title={isRTL ? 'في انتظار' : 'En attente'}
                                    value={stats?.pendingEnrollments ?? '0'}
                                    icon={Clock}
                                    color="orange"
                                    onClick={() => navigate('/dashboard/enrollments/pending')}
                                />
                                <MobileStatCard
                                    title={isRTL ? 'معدل الحضور' : 'Taux présence'}
                                    value={stats?.attendanceRate ? `${stats.attendanceRate}%` : '-'}
                                    trend={stats?.attendanceRate > 80 ? 'up' : 'down'}
                                    icon={TrendingUp}
                                    color="purple"
                                />
                            </>
                        )}
                    </div>
                </motion.div>

                {/* Pending Items / Alerts */}
                {pendingItems && pendingItems.length > 0 && (
                    <motion.div variants={itemVariants}>
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                {isRTL ? 'يتطلب الاهتمام' : 'À traiter'}
                            </h2>
                            <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-medium rounded-full">
                                {pendingItems.length}
                            </span>
                        </div>
                        <div className="space-y-2">
                            {pendingItems.slice(0, 3).map((item, index) => (
                                <MobileCard
                                    key={index}
                                    title={item.title}
                                    subtitle={item.subtitle}
                                    icon={AlertCircle}
                                    iconColor="orange"
                                    onClick={() => navigate(item.path)}
                                    showChevron
                                />
                            ))}
                            {pendingItems.length > 3 && (
                                <button
                                    onClick={() => navigate('/dashboard/pending')}
                                    className="w-full py-2 text-sm text-primary-600 dark:text-primary-400 font-medium"
                                >
                                    {isRTL ? `عرض الكل (${pendingItems.length})` : `Voir tout (${pendingItems.length})`}
                                </button>
                            )}
                        </div>
                    </motion.div>
                )}

                {/* Recent Activity */}
                {recentActivity && recentActivity.length > 0 && (
                    <motion.div variants={itemVariants}>
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                {isRTL ? 'النشاط الأخير' : 'Activité récente'}
                            </h2>
                            <button
                                onClick={() => navigate('/dashboard/activity')}
                                className="text-sm text-primary-600 dark:text-primary-400 font-medium flex items-center"
                            >
                                {isRTL ? 'الكل' : 'Tout voir'}
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-xl divide-y divide-gray-100 dark:divide-gray-700">
                            {recentActivity.slice(0, 5).map((activity, index) => (
                                <div key={index} className="p-3 flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${activity.type === 'check-in' ? 'bg-green-100 dark:bg-green-900/30 text-green-600' :
                                        activity.type === 'check-out' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600' :
                                            'bg-blue-100 dark:bg-blue-900/30 text-blue-600'
                                        }`}>
                                        {activity.icon ? <activity.icon className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-gray-900 dark:text-white truncate">
                                            {activity.message}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {activity.time}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </motion.div>
        </div>
    );
};

export default MobileDashboard;
