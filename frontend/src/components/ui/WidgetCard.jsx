/**
 * WidgetCard - Composant de carte widget unifié
 * Style cohérent pour tous les widgets de l'application
 */

import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * @param {Object} props
 * @param {React.ReactNode} props.icon - Icône du header (composant Lucide)
 * @param {string} props.title - Titre du widget
 * @param {string} [props.subtitle] - Sous-titre optionnel
 * @param {React.ReactNode} [props.badge] - Badge optionnel (compteur, etc.)
 * @param {React.ReactNode} [props.headerAction] - Action dans le header (bouton, etc.)
 * @param {React.ReactNode} props.children - Contenu du widget
 * @param {boolean} [props.loading] - État de chargement
 * @param {string} [props.iconColor] - Couleur de l'icône (défaut: blue)
 * @param {string} [props.className] - Classes CSS additionnelles
 * @param {boolean} [props.noPadding] - Désactiver le padding du contenu
 * @param {number} [props.maxItems] - Nombre max d'items visibles avant scroll (défaut: 4)
 * @param {number} [props.itemHeight] - Hauteur approximative d'un item en px (défaut: 60)
 */
const WidgetCard = ({
    icon: Icon,
    title,
    subtitle,
    badge,
    headerAction,
    children,
    loading = false,
    iconColor = 'blue',
    className = '',
    noPadding = false,
    maxItems = 4,
    itemHeight = 60
}) => {
    // Calculer la hauteur max du contenu (4 items par défaut, scroll à partir du 5ème)
    const maxContentHeight = maxItems * itemHeight;
    // Couleurs d'icône disponibles
    const iconColors = {
        blue: 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30',
        green: 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30',
        purple: 'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30',
        orange: 'text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30',
        red: 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30',
        pink: 'text-pink-600 dark:text-pink-400 bg-pink-100 dark:bg-pink-900/30',
        indigo: 'text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/30',
        gray: 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/30',
        primary: 'text-primary-600 dark:text-primary-400 bg-primary-100 dark:bg-primary-900/30'
    };

    const iconColorClass = iconColors[iconColor] || iconColors.blue;

    if (loading) {
        return (
            <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 h-full flex flex-col ${className}`}>
                {/* Header skeleton */}
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
                        <div className="flex-1">
                            <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                            {subtitle && <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mt-1"></div>}
                        </div>
                    </div>
                </div>
                {/* Content skeleton */}
                <div className="flex-1 p-4">
                    <div className="flex items-center justify-center h-full">
                        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 h-full flex flex-col overflow-hidden ${className}`}>
            {/* Header unifié */}
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {/* Icône avec fond coloré */}
                        {Icon && (
                            <div className={`p-2 rounded-lg ${iconColorClass}`}>
                                <Icon className="w-5 h-5" />
                            </div>
                        )}
                        {/* Titre et sous-titre */}
                        <div>
                            <h3 className="text-base font-semibold text-gray-900 dark:text-white leading-tight">
                                {title}
                            </h3>
                            {subtitle && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                    {subtitle}
                                </p>
                            )}
                        </div>
                    </div>
                    {/* Badge ou action */}
                    <div className="flex items-center gap-2">
                        {badge && (
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                                {badge}
                            </span>
                        )}
                        {headerAction}
                    </div>
                </div>
            </div>

            {/* Contenu avec hauteur fixe et scroll si > maxItems */}
            <div
                className={`overflow-y-auto ${noPadding ? '' : 'p-4'}`}
                style={{ height: `${maxContentHeight}px`, minHeight: `${maxContentHeight}px` }}
            >
                {children}
            </div>
        </div>
    );
};

/**
 * WidgetEmptyState - État vide unifié pour les widgets
 */
export const WidgetEmptyState = ({ icon: Icon, message }) => (
    <div className="flex flex-col items-center justify-center py-8 text-center">
        {Icon && <Icon className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-3" />}
        <p className="text-sm text-gray-500 dark:text-gray-400">{message}</p>
    </div>
);

/**
 * WidgetItem - Élément de liste unifié pour les widgets
 */
export const WidgetItem = ({
    icon: Icon,
    iconColor = 'gray',
    title,
    subtitle,
    badge,
    badgeColor = 'gray',
    onClick,
    className = ''
}) => {
    const iconColors = {
        blue: 'text-blue-500',
        green: 'text-green-500',
        purple: 'text-purple-500',
        orange: 'text-orange-500',
        red: 'text-red-500',
        pink: 'text-pink-500',
        gray: 'text-gray-400'
    };

    const badgeColors = {
        blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
        green: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
        purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
        orange: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
        red: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
        gray: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
    };

    const Component = onClick ? 'button' : 'div';

    return (
        <Component
            onClick={onClick}
            className={`w-full flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 
        ${onClick ? 'hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors' : ''} 
        ${className}`}
        >
            {Icon && (
                <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-600 ${iconColors[iconColor]}`}>
                    <Icon className="w-4 h-4" />
                </div>
            )}
            <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{title}</p>
                {subtitle && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{subtitle}</p>
                )}
            </div>
            {badge && (
                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${badgeColors[badgeColor]}`}>
                    {badge}
                </span>
            )}
        </Component>
    );
};

export default WidgetCard;
