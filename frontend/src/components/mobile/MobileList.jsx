/**
 * MobileList - Liste optimisée mobile avec support swipe
 * 
 * Liste d'éléments avec actions révélées par swipe,
 * pull-to-refresh et infinite scroll.
 * 
 * @usage
 * import MobileList from '@/components/mobile/MobileList';
 * <MobileList 
 *   items={children}
 *   renderItem={(child) => (
 *     <MobileCard title={child.name} />
 *   )}
 *   onRefresh={handleRefresh}
 *   swipeActions={[
 *     { icon: Edit, label: 'Modifier', color: 'blue', onClick: (item) => edit(item) },
 *     { icon: Trash, label: 'Supprimer', color: 'red', onClick: (item) => delete(item) }
 *   ]}
 * />
 */

import { useState, useRef, useCallback } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';

const MobileList = ({
    items = [],
    renderItem,
    keyExtractor = (item) => item.id,
    onRefresh,
    isRefreshing = false,
    swipeActions = [],
    emptyMessage,
    emptyIcon: EmptyIcon,
    className = '',
    gap = 'md', // sm, md, lg
    showDividers = false
}) => {
    const { isRTL } = useLanguage();
    const [activeSwipeId, setActiveSwipeId] = useState(null);

    const gapClasses = {
        sm: 'space-y-2',
        md: 'space-y-3',
        lg: 'space-y-4'
    };

    if (items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                {EmptyIcon && (
                    <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                        <EmptyIcon className="w-8 h-8 text-gray-400" />
                    </div>
                )}
                <p className="text-gray-500 dark:text-gray-400">
                    {emptyMessage || (isRTL ? 'لا توجد عناصر' : 'Aucun élément')}
                </p>
            </div>
        );
    }

    return (
        <div className={`${gapClasses[gap]} ${className}`}>
            {/* Pull to refresh indicator */}
            {onRefresh && isRefreshing && (
                <div className="flex items-center justify-center py-4">
                    <RefreshCw className="w-5 h-5 text-primary-600 animate-spin" />
                </div>
            )}

            {items.map((item, index) => (
                <SwipeableListItem
                    key={keyExtractor(item)}
                    item={item}
                    renderItem={renderItem}
                    swipeActions={swipeActions}
                    isRTL={isRTL}
                    isActive={activeSwipeId === keyExtractor(item)}
                    onSwipeOpen={() => setActiveSwipeId(keyExtractor(item))}
                    onSwipeClose={() => setActiveSwipeId(null)}
                    showDivider={showDividers && index < items.length - 1}
                />
            ))}
        </div>
    );
};

const SwipeableListItem = ({
    item,
    renderItem,
    swipeActions,
    isRTL,
    isActive,
    onSwipeOpen,
    onSwipeClose,
    showDivider
}) => {
    const x = useMotionValue(0);
    const containerRef = useRef(null);

    const actionWidth = swipeActions.length * 70; // 70px par action

    // Transformer la position pour révéler les actions
    const actionsOpacity = useTransform(
        x,
        isRTL ? [0, actionWidth] : [-actionWidth, 0],
        [1, 0]
    );

    const handleDragEnd = useCallback((event, info) => {
        const threshold = actionWidth / 2;
        const offset = info.offset.x;

        if (isRTL) {
            if (offset > threshold) {
                x.set(actionWidth);
                onSwipeOpen();
            } else {
                x.set(0);
                onSwipeClose();
            }
        } else {
            if (offset < -threshold) {
                x.set(-actionWidth);
                onSwipeOpen();
            } else {
                x.set(0);
                onSwipeClose();
            }
        }
    }, [actionWidth, isRTL, x, onSwipeOpen, onSwipeClose]);

    const handleActionClick = (action) => {
        x.set(0);
        onSwipeClose();
        if (action.onClick) {
            action.onClick(item);
        }
    };

    const actionColors = {
        blue: 'bg-blue-500',
        red: 'bg-red-500',
        green: 'bg-green-500',
        orange: 'bg-orange-500',
        gray: 'bg-gray-500'
    };

    if (swipeActions.length === 0) {
        return (
            <>
                {renderItem(item)}
                {showDivider && <div className="border-b border-gray-100 dark:border-gray-700" />}
            </>
        );
    }

    return (
        <div className="relative overflow-hidden rounded-xl">
            {/* Actions visible quand swipe actif */}
            <div
                className={`absolute inset-y-0 ${isRTL ? 'left-0' : 'right-0'} flex items-center ${isActive ? 'z-30' : 'z-10'}`}
                style={{
                    opacity: isActive ? 1 : 0,
                    pointerEvents: isActive ? 'auto' : 'none'
                }}
            >
                {swipeActions.map((action, index) => {
                    const Icon = action.icon;
                    return (
                        <button
                            key={index}
                            onClick={(e) => {
                                e.stopPropagation();
                                handleActionClick(action);
                            }}
                            className={`h-full w-[70px] flex flex-col items-center justify-center text-white ${actionColors[action.color || 'gray']} active:opacity-80 transition-opacity`}
                        >
                            <Icon className="w-5 h-5 mb-1" />
                            <span className="text-xs">{action.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* Swipeable content */}
            <motion.div
                ref={containerRef}
                drag="x"
                dragConstraints={{
                    left: isRTL ? 0 : -actionWidth,
                    right: isRTL ? actionWidth : 0
                }}
                dragElastic={0.1}
                onDragEnd={handleDragEnd}
                style={{ x }}
                className="relative bg-white dark:bg-gray-800 rounded-xl z-20"
                onClick={() => {
                    if (isActive) {
                        x.set(0);
                        onSwipeClose();
                    }
                }}
            >
                {renderItem(item)}
            </motion.div>

            {showDivider && <div className="border-b border-gray-100 dark:border-gray-700 mt-3" />}
        </div>
    );
};

export default MobileList;
