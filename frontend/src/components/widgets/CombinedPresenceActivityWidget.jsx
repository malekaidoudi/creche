import { Clock, Users, Activity, RefreshCw } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import RecentActivitiesWidget from './RecentActivitiesWidget';
import OnlineUsersWidget from './OnlineUsersWidget';

/**
 * Widget unifié Desktop combinant en 2 colonnes :
 * - Colonne 1 : Activités récentes (enfants et équipe)
 * - Colonne 2 : Présence en direct et utilisateurs avec 4 filtres (Connectés, Équipe, Parents, Tous)
 */
const CombinedPresenceActivityWidget = ({
    activities = [],
    users = [],
    onlineCount = 0,
    currentUserId,
    currentUser,
    onRefresh,
    loading = false
}) => {
    const { isRTL } = useLanguage();

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/80 dark:border-gray-700/80 shadow-xs overflow-hidden">
            {/* Header unifié principal */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:px-6 border-b border-gray-100 dark:border-gray-700/60 bg-gradient-to-r from-gray-50/80 via-white to-gray-50/50 dark:from-gray-800 dark:via-gray-800 dark:to-gray-800/80 gap-3">
                <div className="flex items-center space-x-3 rtl:space-x-reverse min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-white shadow-xs shrink-0">
                        <Activity className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2.5 flex-wrap">
                            <h3 className="font-bold text-gray-900 dark:text-white text-base md:text-lg leading-tight">
                                {isRTL
                                    ? 'التواجد المباشر وآخر أنشطة الفريق والأولياء'
                                    : 'Présence en direct et dernière activité de l\'équipe et des parents'
                                }
                            </h3>
                            {onlineCount > 0 && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                    {onlineCount} {isRTL ? 'متصل الآن' : 'en ligne'}
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {isRTL
                                ? 'متابعة حية ليوميات الأطفال ونشاط وتواجد المستخدمين'
                                : 'Fil d\'actualité des enfants et statut de connexion des membres en temps réel'
                            }
                        </p>
                    </div>
                </div>

                {/* Bouton d'actualisation global */}
                {onRefresh && (
                    <button
                        onClick={onRefresh}
                        disabled={loading}
                        className="inline-flex items-center gap-1.5 self-start sm:self-auto px-3 py-1.5 rounded-xl text-xs font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 shadow-2xs transition-all disabled:opacity-50"
                        title={isRTL ? 'تحديث البيانات' : 'Actualiser les données'}
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-600 dark:text-cyan-400' : ''}`} />
                        <span>{isRTL ? 'تحديث' : 'Actualiser'}</span>
                    </button>
                )}
            </div>

            {/* Corps du widget en 2 colonnes sur grand écran */}
            <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x dark:divide-gray-700/60 rtl:lg:divide-x-reverse">
                {/* Colonne 1 : Activités récentes */}
                <div className="p-4 sm:p-5 flex flex-col min-w-0">
                    <div className="flex items-center justify-between pb-3 mb-2 border-b border-gray-100 dark:border-gray-700/50">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-900/30 border border-purple-200/50 dark:border-purple-700/50 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
                                <Clock className="w-4 h-4" />
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900 dark:text-white text-sm">
                                    {isRTL ? 'الأنشطة الأخيرة' : 'Activités récentes'}
                                </h4>
                                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                                    {isRTL ? 'Fil direct des enfants et de l\'équipe' : 'Fil en direct des enfants et de l\'équipe'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <RecentActivitiesWidget
                        activities={activities}
                        embedded={true}
                        isMobile={false}
                        maxItems={12}
                    />
                </div>

                {/* Colonne 2 : Utilisateurs et Présence */}
                <div className="p-4 sm:p-5 flex flex-col min-w-0">
                    <div className="flex items-center justify-between pb-3 mb-2 border-b border-gray-100 dark:border-gray-700/50">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-cyan-50 dark:bg-cyan-900/30 border border-cyan-200/50 dark:border-cyan-700/50 flex items-center justify-center text-cyan-600 dark:text-cyan-400 shrink-0">
                                <Users className="w-4 h-4" />
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900 dark:text-white text-sm">
                                    {isRTL ? 'المستخدمون والتواجد' : 'Membres & Présence'}
                                </h4>
                                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                                    {isRTL ? 'متابعة التواجد والنشاط المباشر' : 'Statut en ligne et dernière connexion'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <OnlineUsersWidget
                        users={users}
                        onlineCount={onlineCount}
                        currentUserId={currentUserId}
                        currentUser={currentUser}
                        embedded={true}
                        defaultTab="online"
                    />
                </div>
            </div>
        </div>
    );
};

export default CombinedPresenceActivityWidget;
