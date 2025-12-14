/**
 * MobileStatCard - Carte de statistique optimisée mobile
 * 
 * Affiche un KPI avec icône, valeur, label et tendance.
 * 
 * @usage
 * import MobileStatCard from '@/components/mobile/MobileStatCard';
 * <MobileStatCard 
 *   title="Enfants présents"
 *   value="18/24"
 *   change="+2 cette semaine"
 *   trend="up"
 *   icon={Users}
 *   color="blue"
 * />
 */

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const MobileStatCard = ({
    title,
    value,
    change,
    trend = 'neutral', // up, down, neutral
    icon: Icon,
    color = 'primary',
    onClick,
    className = ''
}) => {
    const colorClasses = {
        primary: {
            bg: 'bg-primary-50 dark:bg-primary-900/20',
            icon: 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400',
            text: 'text-primary-600 dark:text-primary-400'
        },
        blue: {
            bg: 'bg-blue-50 dark:bg-blue-900/20',
            icon: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
            text: 'text-blue-600 dark:text-blue-400'
        },
        green: {
            bg: 'bg-green-50 dark:bg-green-900/20',
            icon: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
            text: 'text-green-600 dark:text-green-400'
        },
        orange: {
            bg: 'bg-orange-50 dark:bg-orange-900/20',
            icon: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
            text: 'text-orange-600 dark:text-orange-400'
        },
        red: {
            bg: 'bg-red-50 dark:bg-red-900/20',
            icon: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
            text: 'text-red-600 dark:text-red-400'
        },
        purple: {
            bg: 'bg-purple-50 dark:bg-purple-900/20',
            icon: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
            text: 'text-purple-600 dark:text-purple-400'
        }
    };

    const trendColors = {
        up: 'text-green-600 dark:text-green-400',
        down: 'text-red-600 dark:text-red-400',
        neutral: 'text-gray-500 dark:text-gray-400'
    };

    const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;

    const colors = colorClasses[color] || colorClasses.primary;

    const Wrapper = onClick ? 'button' : 'div';

    return (
        <Wrapper
            onClick={onClick}
            className={`w-full p-4 rounded-xl ${colors.bg} ${onClick ? 'active:scale-[0.98] transition-transform cursor-pointer' : ''} ${className}`}
        >
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        {title}
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {value}
                    </p>
                    {change && (
                        <div className={`flex items-center gap-1 mt-2 text-sm ${trendColors[trend]}`}>
                            <TrendIcon className="w-4 h-4" />
                            <span>{change}</span>
                        </div>
                    )}
                </div>
                {Icon && (
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colors.icon}`}>
                        <Icon className="w-6 h-6" />
                    </div>
                )}
            </div>
        </Wrapper>
    );
};

export default MobileStatCard;
