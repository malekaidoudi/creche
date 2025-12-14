/**
 * MobileCard - Composant carte universel pour mobile
 * 
 * Carte optimisée pour l'affichage mobile avec support des actions,
 * badges, et contenu flexible.
 * 
 * @usage
 * import MobileCard from '@/components/mobile/MobileCard';
 * <MobileCard 
 *   title="Ahmed Bennani"
 *   subtitle="3 ans - Groupe Papillons"
 *   badge={{ text: "Présent", color: "green" }}
 *   actions={[
 *     { icon: Eye, onClick: () => viewDetails(id) },
 *     { icon: Edit, onClick: () => edit(id) }
 *   ]}
 *   onClick={() => navigate(`/child/${id}`)}
 * >
 *   <p>Contenu additionnel</p>
 * </MobileCard>
 */

import { motion } from 'framer-motion';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';

const MobileCard = ({
    title,
    subtitle,
    description,
    icon: Icon,
    iconColor = 'primary',
    image,
    badge,
    badges = [],
    actions = [],
    onClick,
    children,
    variant = 'default', // default, outlined, elevated
    className = '',
    showChevron = false,
    disabled = false
}) => {
    const { isRTL } = useLanguage();

    const iconColors = {
        primary: 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400',
        green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
        blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
        orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
        red: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
        purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
        gray: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
    };

    const badgeColors = {
        green: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
        red: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
        blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
        orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
        yellow: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
        purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
        gray: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400'
    };

    const variantClasses = {
        default: 'bg-white dark:bg-gray-800 shadow-sm',
        outlined: 'bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700',
        elevated: 'bg-white dark:bg-gray-800 shadow-md'
    };

    const ChevronIcon = isRTL ? ChevronLeft : ChevronRight;

    const CardWrapper = onClick ? motion.button : motion.div;

    return (
        <CardWrapper
            onClick={!disabled ? onClick : undefined}
            disabled={disabled}
            className={`w-full rounded-xl p-4 ${variantClasses[variant]} ${onClick ? 'text-left rtl:text-right cursor-pointer active:scale-[0.98]' : ''} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
            whileTap={onClick && !disabled ? { scale: 0.98 } : undefined}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        >
            <div className="flex items-start gap-3">
                {/* Icon ou Image */}
                {(Icon || image) && (
                    <div className="flex-shrink-0">
                        {image ? (
                            <img
                                src={image}
                                alt={title}
                                className="w-12 h-12 rounded-xl object-cover"
                            />
                        ) : Icon ? (
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${iconColors[iconColor]}`}>
                                <Icon className="w-6 h-6" />
                            </div>
                        ) : null}
                    </div>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                    {/* Header row */}
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                                {title}
                            </h3>
                            {subtitle && (
                                <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-0.5">
                                    {subtitle}
                                </p>
                            )}
                        </div>

                        {/* Badge unique */}
                        {badge && (
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${badgeColors[badge.color || 'gray']}`}>
                                {badge.text}
                            </span>
                        )}
                    </div>

                    {/* Description */}
                    {description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
                            {description}
                        </p>
                    )}

                    {/* Multiple badges */}
                    {badges.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                            {badges.map((b, i) => (
                                <span
                                    key={i}
                                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${badgeColors[b.color || 'gray']}`}
                                >
                                    {b.text}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Children content */}
                    {children && (
                        <div className="mt-3">
                            {children}
                        </div>
                    )}

                    {/* Actions */}
                    {actions.length > 0 && (
                        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                            {actions.map((action, index) => {
                                const ActionIcon = action.icon;
                                return (
                                    <button
                                        key={index}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            action.onClick();
                                        }}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${action.variant === 'primary'
                                                ? 'bg-primary-600 text-white hover:bg-primary-700'
                                                : action.variant === 'danger'
                                                    ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'
                                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                                            }`}
                                    >
                                        {ActionIcon && <ActionIcon className="w-4 h-4" />}
                                        {action.label}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Chevron for clickable cards */}
                {showChevron && onClick && (
                    <ChevronIcon className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" />
                )}
            </div>
        </CardWrapper>
    );
};

export default MobileCard;
