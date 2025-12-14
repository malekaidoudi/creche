/**
 * MobileHeader - Header contextuel pour mobile
 * 
 * Header adapté au mobile avec titre, actions rapides et recherche.
 * Affiche le bouton retour si nécessaire.
 * 
 * @usage
 * import MobileHeader from '@/components/mobile/MobileHeader';
 * <MobileHeader 
 *   title="Présences" 
 *   showBack={true}
 *   actions={[{ icon: Filter, onClick: handleFilter }]}
 * />
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft,
    ArrowRight,
    Search,
    Bell,
    X,
    Menu
} from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';

const MobileHeader = ({
    title,
    subtitle,
    showBack = false,
    showSearch = false,
    showNotifications = true,
    actions = [],
    onMenuClick,
    onSearch,
    searchPlaceholder
}) => {
    const { isRTL } = useLanguage();
    const navigate = useNavigate();
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const BackIcon = isRTL ? ArrowRight : ArrowLeft;

    const handleSearch = (e) => {
        e.preventDefault();
        if (onSearch && searchQuery.trim()) {
            onSearch(searchQuery);
        }
    };

    return (
        <header className="lg:hidden sticky top-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 safe-area-inset-top">
            <div className="flex items-center justify-between h-14 px-4">
                {/* Left side */}
                <div className="flex items-center gap-2">
                    {showBack ? (
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                            aria-label={isRTL ? 'رجوع' : 'Retour'}
                        >
                            <BackIcon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                        </button>
                    ) : onMenuClick ? (
                        <button
                            onClick={onMenuClick}
                            className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                            aria-label="Menu"
                        >
                            <Menu className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                        </button>
                    ) : null}

                    <div>
                        <h1 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-1">
                            {title}
                        </h1>
                        {subtitle && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                                {subtitle}
                            </p>
                        )}
                    </div>
                </div>

                {/* Right side - Actions */}
                <div className="flex items-center gap-1">
                    {showSearch && (
                        <button
                            onClick={() => setSearchOpen(true)}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                            aria-label={isRTL ? 'بحث' : 'Rechercher'}
                        >
                            <Search className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        </button>
                    )}

                    {actions.map((action, index) => {
                        const Icon = action.icon;
                        return (
                            <button
                                key={index}
                                onClick={action.onClick}
                                className={`p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors ${action.className || ''}`}
                                aria-label={action.label}
                            >
                                <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                {action.badge && (
                                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                                        {action.badge}
                                    </span>
                                )}
                            </button>
                        );
                    })}

                    {showNotifications && (
                        <button
                            onClick={() => navigate('/notifications')}
                            className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                            aria-label={isRTL ? 'الإشعارات' : 'Notifications'}
                        >
                            <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                            {/* Badge notification - à connecter avec le contexte */}
                            {/* <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" /> */}
                        </button>
                    )}
                </div>
            </div>

            {/* Search Overlay */}
            <AnimatePresence>
                {searchOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-0 left-0 right-0 bg-white dark:bg-gray-800 z-50 p-3"
                    >
                        <form onSubmit={handleSearch} className="flex items-center gap-2">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder={searchPlaceholder || (isRTL ? 'بحث...' : 'Rechercher...')}
                                    className="w-full pl-10 rtl:pl-4 rtl:pr-10 pr-4 py-2.5 bg-gray-100 dark:bg-gray-700 border-0 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500"
                                    autoFocus
                                />
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setSearchOpen(false);
                                    setSearchQuery('');
                                }}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
};

export default MobileHeader;
