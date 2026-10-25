/**
 * MobileNavigation - Bottom Navigation Bar pour mobile
 * 
 * Navigation fixe en bas de l'écran avec 5 éléments maximum.
 * Affichée uniquement sur mobile/tablette (< 1024px).
 * 
 * @usage
 * import MobileNavigation from '@/components/mobile/MobileNavigation';
 * <MobileNavigation />
 */

import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Home,
    Users,
    ClipboardCheck,
    MessageCircle,
    MoreHorizontal,
    Calendar,
    FileText,
    Settings,
    UserPlus,
    BarChart3,
    X,
    LogOut,
    User,
    Bell,
    Clock,
    CalendarX,
    Image,
    Pill
} from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import { useAuth } from '../../contexts/AuthContext';
import { useProfileImage } from '../../hooks/useProfileImage';
import { useAccess } from '../../access';

const MobileNavigation = ({ hideSpacer = false }) => {
    const { isRTL } = useLanguage();
    const { user, logout } = useAuth();
    const { getImageUrl, hasImage } = useProfileImage();
    const { can } = useAccess();
    const navigate = useNavigate();
    const location = useLocation();
    const [showMore, setShowMore] = useState(false);

    // Navigation principale (5 éléments) : Accueil, Enfant, Inscription, Soins, Plus
    const mainNavItems = [
        {
            id: 'home',
            icon: Home,
            label: isRTL ? 'الرئيسية' : 'Accueil',
            path: '/dashboard',
            roles: ['admin', 'staff', 'developer']
        },
        {
            id: 'children',
            icon: Users,
            label: isRTL ? 'الأطفال' : 'Enfant',
            path: '/dashboard/children',
            roles: ['admin', 'staff', 'developer']
        },
        {
            id: 'enrollments',
            icon: UserPlus,
            label: isRTL ? 'التسجيل' : 'Inscription',
            path: '/dashboard/enrollments',
            roles: ['admin', 'staff', 'developer']
        },
        {
            id: 'treatments',
            icon: Pill,
            label: isRTL ? 'العلاجات' : 'Soins',
            path: '/dashboard/treatments',
            roles: ['admin', 'staff', 'developer']
        },
        {
            id: 'more',
            icon: MoreHorizontal,
            label: isRTL ? 'المزيد' : 'Plus',
            action: () => setShowMore(true),
            roles: ['admin', 'staff', 'developer']
        }
    ];

    // Navigation parent spécifique (5 items max)
    const parentNavItems = [
        {
            id: 'home',
            icon: Home,
            label: isRTL ? 'الرئيسية' : 'Accueil',
            path: '/mon-espace',
            roles: ['parent']
        },
        {
            id: 'attendance',
            icon: ClipboardCheck,
            label: isRTL ? 'الحضور' : 'Présence',
            path: '/mon-espace/attendance-report',
            roles: ['parent']
        },
        {
            id: 'absence',
            icon: CalendarX,
            label: isRTL ? 'غياب' : 'Absence',
            path: '/mon-espace/absence-request',
            roles: ['parent']
        },
        {
            id: 'announcements',
            icon: Bell,
            label: isRTL ? 'إعلانات' : 'Annonces',
            path: '/mon-espace/announcements',
            roles: ['parent']
        },
        {
            id: 'more',
            icon: MoreHorizontal,
            label: isRTL ? 'المزيد' : 'Plus',
            action: () => setShowMore(true),
            roles: ['parent']
        }
    ];

    // Menu étendu "Plus" : Planning, Statistiques, Activité récentes, Paramètres
    const moreMenuItems = [
        {
            icon: Calendar,
            label: isRTL ? 'التخطيط' : 'Planning',
            path: '/dashboard/planning',
            roles: ['admin', 'staff', 'developer']
        },
        {
            icon: BarChart3,
            label: isRTL ? 'الإحصائيات' : 'Statistiques',
            path: '/dashboard/general-stats',
            roles: ['admin', 'staff', 'developer']
        },
        {
            icon: Clock,
            label: isRTL ? 'الأنشطة الأخيرة' : 'Activité récentes',
            path: '/dashboard/activities',
            roles: ['admin', 'staff', 'developer']
        },
        {
            icon: Settings,
            label: isRTL ? 'الإعدادات' : 'Paramètres',
            path: '/dashboard/settings',
            roles: ['admin', 'staff', 'developer']
        }
    ];

    // Le rôle "developer" a les mêmes accès que "admin" partout ailleurs dans l'app
    // (voir AuthContext.isAdmin()/isStaff() et DashboardSidebar.hasAccess) : on applique
    // la même équivalence ici, sinon un compte developer se retrouve avec une barre de
    // navigation mobile totalement vide (aucun item ne correspond à son rôle réel).
    const effectiveRole = user?.role === 'developer' ? 'admin' : (user?.role || 'parent');

    // Sélectionner la navigation en fonction du rôle
    const navItems = effectiveRole === 'parent' ? parentNavItems : mainNavItems;

    // Filtrer les éléments selon le rôle et, si précisée, la fonctionnalité (FEATURES)
    const filteredNavItems = navItems.filter(item => {
        const roleMatches = item.roles.includes(effectiveRole) || item.roles.includes(user?.role);
        if (!roleMatches) return false;
        if (!item.feature || effectiveRole === 'admin') return true;
        return can(item.feature);
    });

    const filteredMoreItems = moreMenuItems.filter(item => {
        const roleMatches = item.roles.includes(effectiveRole) || item.roles.includes(user?.role);
        if (!roleMatches) return false;
        if (!item.feature || effectiveRole === 'admin') return true;
        return can(item.feature);
    });

    const isActive = (path) => {
        if (path === '/dashboard' && location.pathname === '/dashboard') return true;
        if (path !== '/dashboard' && location.pathname.startsWith(path)) return true;
        return false;
    };

    const handleNavClick = (item) => {
        if (item.action) {
            item.action();
        } else if (item.path) {
            navigate(item.path);
        }
    };

    const handleLogout = () => {
        setShowMore(false);
        logout();
        navigate('/');
    };

    return (
        <>
            {/* Bottom Navigation Bar */}
            <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 safe-area-inset-bottom">
                <div className="flex justify-around items-center h-16">
                    {filteredNavItems.map((item) => {
                        const Icon = item.icon;
                        const active = item.path ? isActive(item.path) : false;

                        return (
                            <button
                                key={item.id}
                                onClick={() => handleNavClick(item)}
                                className={`relative flex flex-col items-center justify-center w-full h-full px-1 select-none ${active
                                    ? 'text-primary-600 dark:text-primary-400 font-semibold'
                                    : 'text-gray-500 dark:text-gray-400'
                                    }`}
                            >
                                <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                                <span className={`text-[10px] sm:text-xs mt-0.5 font-medium whitespace-nowrap text-center ${active ? 'font-bold' : ''}`}>
                                    {item.label}
                                </span>
                                {active && (
                                    <span
                                        className="absolute bottom-1 w-7 h-0.5 bg-primary-600 dark:bg-primary-400 rounded-full"
                                    />
                                )}
                            </button>
                        );
                    })}
                </div>
            </nav>

            {/* Menu "Plus" - Bottom Sheet */}
            <AnimatePresence>
                {showMore && (
                    <>
                        {/* Overlay */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="lg:hidden fixed inset-0 z-50 bg-black/50"
                            onClick={() => setShowMore(false)}
                        />

                        {/* Bottom Sheet */}
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 rounded-t-3xl max-h-[80vh] overflow-y-auto safe-area-inset-bottom"
                        >
                            {/* Handle */}
                            <div className="flex justify-center pt-3 pb-2">
                                <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full" />
                            </div>

                            {/* Header */}
                            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    {isRTL ? 'المزيد من الخيارات' : 'Plus d\'options'}
                                </h3>
                                <button
                                    onClick={() => setShowMore(false)}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                                >
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>

                            {/* User Info - Accès unique pour modifier le profil */}
                            {user && (
                                <div
                                    onClick={() => {
                                        setShowMore(false);
                                        navigate('/profile');
                                    }}
                                    className="px-4 py-4 border-b border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors flex items-center justify-between group"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/30 overflow-hidden flex items-center justify-center shrink-0">
                                            {hasImage() ? (
                                                <img
                                                    src={getImageUrl()}
                                                    alt="Profile"
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <User className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-semibold text-gray-900 dark:text-white truncate">
                                                {user.first_name} {user.last_name}
                                            </p>
                                            <p className="text-xs text-primary-600 dark:text-primary-400 font-medium flex items-center gap-1 mt-0.5">
                                                {isRTL ? 'تعديل الملف الشخصي' : 'Modifier le profil'}
                                                <span className="text-[10px]">→</span>
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 group-hover:bg-primary-100 transition-colors shrink-0">
                                        {isRTL ? 'تعديل' : 'Gérer'}
                                    </span>
                                </div>
                            )}

                            {/* Menu Items */}
                            <div className="p-4 space-y-1">
                                {filteredMoreItems.map((item, index) => {
                                    const Icon = item.icon;
                                    return (
                                        <button
                                            key={index}
                                            onClick={() => {
                                                setShowMore(false);
                                                navigate(item.path);
                                            }}
                                            className="w-full flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                        >
                                            <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                                                <Icon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                                            </div>
                                            <span className="text-gray-900 dark:text-white font-medium">
                                                {item.label}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Logout Button */}
                            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                >
                                    <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                                        <LogOut className="w-5 h-5" />
                                    </div>
                                    <span className="font-medium">
                                        {isRTL ? 'تسجيل الخروج' : 'Déconnexion'}
                                    </span>
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Spacer pour éviter que le contenu soit caché sous la nav */}
            {!hideSpacer && <div className="lg:hidden h-16" />}
        </>
    );
};

export default MobileNavigation;
