import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users,
    UserCheck,
    Search,
    Shield
} from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import API_CONFIG from '../../config/api';
import { formatRelativeTime } from './RecentActivitiesWidget';

const OnlineUsersWidget = ({
    users = [],
    onlineCount = 0,
    currentUserId,
    currentUser,
    isMobile = false,
    embedded = false,
    defaultTab = 'online'
}) => {
    const { isRTL } = useLanguage();
    // 4 filtres demandés : 'online' (Connectés), 'team' (Équipe), 'parents' (Parents), 'all' (Tous)
    const [selectedTab, setSelectedTab] = useState(defaultTab);
    const [searchQuery, setSearchQuery] = useState('');

    const normalizedCurrentId = String(currentUserId || '');

    // Filtrer STRICTEMENT les développeurs (le rôle 'developer' est toujours caché)
    const sanitizedUsers = useMemo(() => {
        let list = (users || []).filter(u => u.role !== 'developer');

        // S'assurer que l'utilisateur actuel est dans la liste s'il n'est pas développeur
        if (currentUser && currentUser.role !== 'developer') {
            const hasMe = list.some(u => String(u.id) === normalizedCurrentId);
            if (!hasMe && normalizedCurrentId) {
                list.unshift({
                    id: currentUser.id || currentUser.userId,
                    first_name: currentUser.first_name || currentUser.name || 'Moi',
                    last_name: currentUser.last_name || '',
                    role: currentUser.role || 'admin',
                    profile_image: currentUser.profile_image || null,
                    last_active: new Date().toISOString(),
                    is_online: true
                });
            } else if (hasMe) {
                // S'assurer que l'utilisateur actuel connecté a is_online = true
                list = list.map(u => String(u.id) === normalizedCurrentId ? { ...u, is_online: true } : u);
            }
        }

        // Tri : En premier les connectés (avec l'utilisateur actuel tout en tête), puis par last_active décroissant
        return list.slice().sort((a, b) => {
            const aIsMe = String(a.id) === normalizedCurrentId;
            const bIsMe = String(b.id) === normalizedCurrentId;
            if (aIsMe) return -1;
            if (bIsMe) return 1;

            const aOnline = Boolean(a.is_online);
            const bOnline = Boolean(b.is_online);
            if (aOnline !== bOnline) return aOnline ? -1 : 1;

            if (a.last_active && b.last_active) {
                return new Date(b.last_active) - new Date(a.last_active);
            }
            if (a.last_active) return -1;
            if (b.last_active) return 1;

            return (a.first_name || '').localeCompare(b.first_name || '');
        });
    }, [users, currentUser, normalizedCurrentId]);

    // Décompte par catégorie pour les 4 onglets
    const counts = useMemo(() => {
        const team = sanitizedUsers.filter(u => u.role === 'admin' || u.role === 'staff').length;
        const parents = sanitizedUsers.filter(u => u.role === 'parent').length;
        const realOnline = sanitizedUsers.filter(u => Boolean(u.is_online)).length;
        return { 
            total: sanitizedUsers.length, 
            team, 
            parents, 
            online: realOnline || onlineCount 
        };
    }, [sanitizedUsers, onlineCount]);

    // Filtrage par onglet (4 options : Connectés, Équipe, Parents, Tous) et recherche
    const filteredUsers = useMemo(() => {
        return sanitizedUsers.filter(u => {
            // Filtre par onglet
            if (selectedTab === 'online') {
                if (!u.is_online) return false;
            } else if (selectedTab === 'team') {
                if (u.role !== 'admin' && u.role !== 'staff') return false;
            } else if (selectedTab === 'parents') {
                if (u.role !== 'parent') return false;
            }
            // 'all' inclut tout le monde

            // Filtre de recherche
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const fullName = `${u.first_name || ''} ${u.last_name || ''}`.toLowerCase();
                const email = (u.email || '').toLowerCase();
                return fullName.includes(q) || email.includes(q);
            }

            return true;
        });
    }, [sanitizedUsers, selectedTab, searchQuery]);

    const getRoleBadge = (role) => {
        switch (role) {
            case 'admin':
                return {
                    label: isRTL ? 'إدارة' : 'Direction',
                    color: 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-400/25'
                };
            case 'staff':
                return {
                    label: isRTL ? 'فريق العمل' : 'Personnel',
                    color: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-400/25'
                };
            default:
                return {
                    label: isRTL ? 'ولي أمر' : 'Parent',
                    color: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-400/25'
                };
        }
    };

    const tabsConfig = [
        {
            id: 'online',
            label: isRTL ? 'متصل' : 'Connectés',
            count: counts.online,
            activeColor: 'bg-white dark:bg-gray-700 text-emerald-700 dark:text-emerald-300 shadow-xs'
        },
        {
            id: 'team',
            label: isRTL ? 'الفريق' : 'Équipe',
            count: counts.team,
            activeColor: 'bg-white dark:bg-gray-700 text-cyan-700 dark:text-cyan-300 shadow-xs'
        },
        {
            id: 'parents',
            label: isRTL ? 'الأولياء' : 'Parents',
            count: counts.parents,
            activeColor: 'bg-white dark:bg-gray-700 text-purple-700 dark:text-purple-300 shadow-xs'
        },
        {
            id: 'all',
            label: isRTL ? 'الكل' : 'Tous',
            count: counts.total,
            activeColor: 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-xs'
        }
    ];

    const containerClasses = embedded || isMobile
        ? 'flex flex-col h-full bg-transparent'
        : 'bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/80 dark:border-gray-700/80 overflow-hidden shadow-xs flex flex-col h-full';

    return (
        <div className={containerClasses}>
            {/* Header autonome uniquement si non embedded et non mobile */}
            {!isMobile && !embedded && (
                <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700/60 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-800/80">
                    <div className="flex items-center space-x-3 rtl:space-x-reverse">
                        <div className="w-9 h-9 rounded-xl bg-cyan-50 dark:bg-cyan-900/30 border border-cyan-200/50 dark:border-cyan-700/50 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
                            <Users className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 dark:text-white text-base flex items-center gap-2">
                                <span>{isRTL ? 'المستخدمون المتصلون' : 'Utilisateurs connectés'}</span>
                                {counts.online > 0 && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                        {counts.online} {isRTL ? 'متصل الآن' : 'en ligne'}
                                    </span>
                                )}
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                {isRTL ? 'متابعة نشاط وتواجد الفريق والأولياء' : 'Présence en direct et dernière activité de l\'équipe et des parents'}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Barre de 4 onglets (Connectés | Équipe | Parents | Tous) */}
            <div className={`${embedded ? 'p-0 pb-2' : 'p-3 pb-2'} border-b border-gray-100 dark:border-gray-700/60 space-y-2`}>
                <div className="flex items-center gap-1 bg-gray-100/90 dark:bg-gray-750 p-1 rounded-xl text-xs font-semibold overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                    {tabsConfig.map((tab) => {
                        const isActive = selectedTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setSelectedTab(tab.id)}
                                className={`flex-1 min-w-fit py-1.5 px-2 sm:px-2.5 rounded-lg text-center transition-all flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 ${
                                    isActive
                                        ? tab.activeColor
                                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                                }`}
                            >
                                <span className="font-semibold text-xs tracking-tight">{tab.label}</span>
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                                    isActive 
                                        ? 'bg-gray-100 dark:bg-gray-600/80 text-gray-800 dark:text-gray-200' 
                                        : 'bg-gray-200/50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400'
                                }`}>
                                    {tab.count}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Barre de recherche */}
                <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 rtl:left-auto rtl:right-3 pointer-events-none" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={isRTL ? 'بحث بالاسم...' : 'Rechercher un membre...'}
                        className="w-full pl-8 pr-3 rtl:pl-3 rtl:pr-8 py-1.5 text-xs rounded-lg bg-gray-50 dark:bg-gray-750 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-colors"
                    />
                </div>
            </div>

            {/* Liste scrollable des utilisateurs */}
            <div className={`${embedded ? 'p-0 pt-2' : 'p-3'} space-y-2 max-h-[380px] overflow-y-auto flex-1`}>
                {filteredUsers.length > 0 ? (
                    filteredUsers.map((u, index) => {
                        const isMe = String(u.id) === normalizedCurrentId;
                        const roleBadge = getRoleBadge(u.role);
                        const fullName = `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email || 'Utilisateur';
                        const isOnline = Boolean(u.is_online);
                        const relativeTime = formatRelativeTime(u.last_active, isRTL);

                        let avatarSrc = null;
                        if (u.profile_image) {
                            avatarSrc = u.profile_image.startsWith('http')
                                ? u.profile_image
                                : `${API_CONFIG.BASE_URL}${u.profile_image.startsWith('/') ? '' : '/'}${u.profile_image}`;
                        }

                        return (
                            <motion.div
                                key={u.id || index}
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.02 }}
                                className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                                    isMe
                                        ? 'bg-cyan-50/70 dark:bg-cyan-950/20 border-cyan-200/80 dark:border-cyan-800/50 shadow-xs'
                                        : isOnline
                                        ? 'bg-emerald-50/30 dark:bg-emerald-950/10 border-emerald-100 dark:border-emerald-900/40'
                                        : 'bg-gray-50/70 dark:bg-gray-800/60 border-gray-100 dark:border-gray-700/60'
                                }`}
                            >
                                <div className="flex items-center gap-2.5 min-w-0">
                                    {/* Avatar avec point d'état */}
                                    <div className="relative shrink-0">
                                        {avatarSrc ? (
                                            <img
                                                src={avatarSrc}
                                                alt={fullName}
                                                className="w-9 h-9 rounded-full object-cover border border-cyan-300/40"
                                                onError={(e) => {
                                                    e.currentTarget.style.display = 'none';
                                                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                                }}
                                            />
                                        ) : null}
                                        <div
                                            className={`w-9 h-9 rounded-full font-bold text-xs flex items-center justify-center shadow-xs text-white ${
                                                u.role === 'admin'
                                                    ? 'bg-gradient-to-br from-cyan-500 to-blue-600'
                                                    : u.role === 'staff'
                                                    ? 'bg-gradient-to-br from-blue-500 to-indigo-600'
                                                    : 'bg-gradient-to-br from-purple-500 to-pink-600'
                                            } ${avatarSrc ? 'hidden' : ''}`}
                                        >
                                            {(u.first_name?.[0] || fullName[0] || 'U').toUpperCase()}
                                        </div>

                                        {/* Point de présence en ligne */}
                                        <span
                                            className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-white dark:ring-gray-800 ${
                                                isOnline
                                                    ? 'bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.9)]'
                                                    : 'bg-gray-400 opacity-50'
                                            }`}
                                        />
                                    </div>

                                    {/* Nom & Statut / Horodatage relatif */}
                                    <div className="min-w-0">
                                        <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                                            {fullName}{' '}
                                            {isMe && (
                                                <span className="text-cyan-600 dark:text-cyan-400 font-semibold">
                                                    ({isRTL ? 'أنت' : 'Moi'})
                                                </span>
                                            )}
                                        </p>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            {isOnline ? (
                                                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                                                    {isMe
                                                        ? (isRTL ? 'متصل الآن (أنت)' : 'Connecté maintenant')
                                                        : (isRTL ? 'متصل الآن' : 'En ligne')
                                                    }
                                                </span>
                                            ) : (
                                                <span className="text-[10px] text-gray-400 dark:text-gray-400">
                                                    {relativeTime}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Badge de rôle */}
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${roleBadge.color} shrink-0`}>
                                    {roleBadge.label}
                                </span>
                            </motion.div>
                        );
                    })
                ) : (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-xs">
                        <Users className="w-8 h-8 mx-auto mb-2 opacity-30 text-cyan-500" />
                        <p className="font-medium text-gray-700 dark:text-gray-300">
                            {selectedTab === 'online'
                                ? (isRTL ? 'لا يوجد مستخدمون متصلون حالياً' : 'Aucun utilisateur connecté pour le moment')
                                : (isRTL ? 'لا يوجد مستخدمون مطابقون' : 'Aucun membre trouvé')
                            }
                        </p>
                        {selectedTab === 'online' && counts.total > 0 && (
                            <button
                                type="button"
                                onClick={() => setSelectedTab('all')}
                                className="mt-2 text-xs font-semibold text-cyan-600 dark:text-cyan-400 hover:underline"
                            >
                                {isRTL ? 'عرض جميع المستخدمين' : 'Afficher tous les membres'} ({counts.total})
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default OnlineUsersWidget;
