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
    Clock
} from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import { useAuth } from '../../contexts/AuthContext';
import { useProfileImage } from '../../hooks/useProfileImage';

const MobileNavigation = () => {
    const { isRTL } = useLanguage();
    const { user, logout } = useAuth();
    const { getImageUrl, hasImage } = useProfileImage();
    const navigate = useNavigate();
    const location = useLocation();
    const [showMore, setShowMore] = useState(false);

    // Navigation principale (5 éléments max)
    const mainNavItems = [
        {
            id: 'home',
            icon: Home,
            label: isRTL ? 'الرئيسية' : 'Accueil',
            path: '/dashboard',
            roles: ['admin', 'staff']
        },
        {
            id: 'attendance',
            icon: ClipboardCheck,
            label: isRTL ? 'الحضور' : 'Présences',
            path: '/dashboard/attendance/today',
            roles: ['admin', 'staff']
        },
        {
            id: 'children',
            icon: Users,
            label: isRTL ? 'الأطفال' : 'Enfants',
            path: '/dashboard/children',
            roles: ['admin', 'staff']
        },
        {
            id: 'messages',
            icon: MessageCircle,
            label: isRTL ? 'الرسائل' : 'Messages',
            path: '/dashboard/messages',
            roles: ['admin', 'staff']
        },
        {
            id: 'more',
            icon: MoreHorizontal,
            label: isRTL ? 'المزيد' : 'Plus',
            action: () => setShowMore(true),
            roles: ['admin', 'staff']
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
            label: isRTL ? 'الحضور' : 'Présences',
            path: '/mon-espace/attendance-report',
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
            id: 'documents',
            icon: FileText,
            label: isRTL ? 'وثائق' : 'Documents',
            path: '/mon-espace/activities',
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

    // Menu étendu "Plus"
    const moreMenuItems = [
        // Items Admin/Staff
        {
            icon: Calendar,
            label: isRTL ? 'التخطيط' : 'Planning',
            path: '/dashboard/planning',
            roles: ['admin', 'staff']
        },
        {
            icon: FileText,
            label: isRTL ? 'الوثائق' : 'Documents',
            path: '/dashboard/documents',
            roles: ['admin', 'staff']
        },
        {
            icon: UserPlus,
            label: isRTL ? 'التسجيلات' : 'Inscriptions',
            path: '/dashboard/enrollments',
            roles: ['admin', 'staff']
        },
        {
            icon: BarChart3,
            label: isRTL ? 'الإحصائيات' : 'Statistiques',
            path: '/dashboard/general-stats',
            roles: ['admin']
        },
        {
            icon: Settings,
            label: isRTL ? 'الإعدادات' : 'Paramètres',
            path: '/dashboard/settings',
            roles: ['admin']
        },
        // Profil pour tous (Calendrier, Messages, Absence déjà dans quickActions)
        {
            icon: User,
            label: isRTL ? 'الملف الشخصي' : 'Profil',
            path: '/profile',
            roles: ['admin', 'staff', 'parent']
        }
    ];

    // Sélectionner la navigation en fonction du rôle
    const navItems = user?.role === 'parent' ? parentNavItems : mainNavItems;

    // Filtrer les éléments selon le rôle
    const filteredNavItems = navItems.filter(item =>
        item.roles.includes(user?.role || 'parent')
    );

    const filteredMoreItems = moreMenuItems.filter(item =>
        item.roles.includes(user?.role || 'parent')
    );

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
                                className={`flex flex-col items-center justify-center w-full h-full px-2 transition-colors ${active
                                    ? 'text-primary-600 dark:text-primary-400'
                                    : 'text-gray-500 dark:text-gray-400'
                                    }`}
                            >
                                <Icon className={`w-6 h-6 ${active ? 'scale-110' : ''} transition-transform`} />
                                <span className={`text-xs mt-1 font-medium truncate max-w-[60px] ${active ? 'font-semibold' : ''}`}>
                                    {item.label}
                                </span>
                                {active && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="absolute bottom-0 w-12 h-0.5 bg-primary-600 dark:bg-primary-400 rounded-full"
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

                            {/* User Info */}
                            {user && (
                                <div className="px-4 py-4 border-b border-gray-200 dark:border-gray-700">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/30 overflow-hidden flex items-center justify-center">
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
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-white">
                                                {user.first_name} {user.last_name}
                                            </p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                {user.role === 'admin' ? (isRTL ? 'مدير' : 'Administrateur') :
                                                    user.role === 'staff' ? (isRTL ? 'موظف' : 'Personnel') :
                                                        (isRTL ? 'ولي أمر' : 'Parent')}
                                            </p>
                                        </div>
                                    </div>
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
            <div className="lg:hidden h-16" />
        </>
    );
};

export default MobileNavigation;
