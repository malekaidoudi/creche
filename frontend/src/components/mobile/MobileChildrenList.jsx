/**
 * MobileChildrenList - Liste des enfants optimisée mobile
 * 
 * Liste avec fiches compactes, recherche, filtres et swipe actions.
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Baby,
    Search,
    Filter,
    Plus,
    Eye,
    Edit,
    Trash2,
    ChevronRight,
    Users,
    Calendar,
    Phone
} from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import MobileHeader from './MobileHeader';
import MobileCard from './MobileCard';
import MobileList from './MobileList';

const MobileChildrenList = ({
    children = [],
    groups = [],
    loading = false,
    onViewChild,
    onEditChild,
    onDeleteChild,
    onAddChild,
    onRefresh
}) => {
    const { isRTL } = useLanguage();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedGroup, setSelectedGroup] = useState('all');
    const [showFilters, setShowFilters] = useState(false);

    // Filtrer les enfants
    const filteredChildren = useMemo(() => {
        return children.filter(child => {
            const matchesSearch = searchQuery === '' ||
                `${child.first_name} ${child.last_name}`.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesGroup = selectedGroup === 'all' ||
                child.group_id === selectedGroup ||
                child.group_name === selectedGroup;

            return matchesSearch && matchesGroup;
        });
    }, [children, searchQuery, selectedGroup]);

    // Stats
    const stats = useMemo(() => ({
        total: children.length,
        active: children.filter(c => c.is_active).length,
        byGroup: groups.map(g => ({
            ...g,
            count: children.filter(c => c.group_id === g.id).length
        }))
    }), [children, groups]);

    const getStatusBadge = (child) => {
        if (!child.is_active) {
            return { text: isRTL ? 'غير نشط' : 'Inactif', color: 'gray' };
        }
        if (child.enrollment_status === 'enrolled' || child.enrollment_status === 'approved') {
            return { text: isRTL ? 'مسجل' : 'Inscrit', color: 'green' };
        }
        if (child.enrollment_status === 'pending') {
            return { text: isRTL ? 'في الانتظار' : 'En attente', color: 'orange' };
        }
        return null;
    };

    const calculateAge = (birthDate) => {
        if (!birthDate) return '';
        const birth = new Date(birthDate);
        const now = new Date();
        const years = now.getFullYear() - birth.getFullYear();
        const months = now.getMonth() - birth.getMonth();

        if (years > 0) {
            return `${years} ${isRTL ? 'سنة' : 'an'}${years > 1 && !isRTL ? 's' : ''}`;
        }
        return `${months} ${isRTL ? 'شهر' : 'mois'}`;
    };

    const swipeActions = [
        {
            icon: Eye,
            label: isRTL ? 'عرض' : 'Voir',
            color: 'blue',
            onClick: (child) => onViewChild?.(child)
        },
        {
            icon: Edit,
            label: isRTL ? 'تعديل' : 'Modifier',
            color: 'green',
            onClick: (child) => onEditChild?.(child)
        }
    ];

    const renderChild = (child) => (
        <MobileCard
            title={`${child.first_name} ${child.last_name}`}
            subtitle={child.group_name || (isRTL ? 'غير محدد' : 'Non assigné')}
            icon={Baby}
            iconColor={child.gender === 'male' ? 'blue' : child.gender === 'female' ? 'purple' : 'gray'}
            image={child.photo_url}
            badge={getStatusBadge(child)}
            onClick={() => onViewChild?.(child)}
            showChevron
        >
            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mt-2">
                {child.birth_date && (
                    <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{calculateAge(child.birth_date)}</span>
                    </div>
                )}
                {child.parent_name && (
                    <div className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        <span className="truncate max-w-[120px]">{child.parent_name}</span>
                    </div>
                )}
            </div>
        </MobileCard>
    );

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
            {/* Header */}
            <MobileHeader
                title={isRTL ? 'الأطفال' : 'Enfants'}
                subtitle={`${stats.total} ${isRTL ? 'طفل' : 'enfant(s)'}`}
                showSearch={true}
                onSearch={setSearchQuery}
                searchPlaceholder={isRTL ? 'بحث...' : 'Rechercher...'}
                actions={[
                    { icon: Filter, onClick: () => setShowFilters(!showFilters), label: 'Filtrer' },
                    { icon: Plus, onClick: onAddChild, label: 'Ajouter' }
                ]}
            />

            <div className="p-4 space-y-4">
                {/* Stats rapides */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4"
                >
                    <div className="flex-shrink-0 bg-white dark:bg-gray-800 rounded-xl px-4 py-3 min-w-[100px] text-center shadow-sm">
                        <p className="text-2xl font-bold text-primary-600">{stats.total}</p>
                        <p className="text-xs text-gray-500">{isRTL ? 'المجموع' : 'Total'}</p>
                    </div>
                    {stats.byGroup.slice(0, 3).map((group) => (
                        <button
                            key={group.id}
                            onClick={() => setSelectedGroup(selectedGroup === group.id ? 'all' : group.id)}
                            className={`flex-shrink-0 rounded-xl px-4 py-3 min-w-[100px] text-center shadow-sm transition-colors ${selectedGroup === group.id
                                    ? 'bg-primary-600 text-white'
                                    : 'bg-white dark:bg-gray-800'
                                }`}
                        >
                            <p className={`text-2xl font-bold ${selectedGroup === group.id ? '' : 'text-gray-900 dark:text-white'}`}>
                                {group.count}
                            </p>
                            <p className={`text-xs truncate ${selectedGroup === group.id ? 'text-primary-100' : 'text-gray-500'}`}>
                                {group.name}
                            </p>
                        </button>
                    ))}
                </motion.div>

                {/* Filtres */}
                <AnimatePresence>
                    {showFilters && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-white dark:bg-gray-800 rounded-xl p-4 space-y-3"
                        >
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {isRTL ? 'تصفية حسب المجموعة' : 'Filtrer par groupe'}
                            </p>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => setSelectedGroup('all')}
                                    className={`px-3 py-1.5 rounded-full text-sm ${selectedGroup === 'all'
                                            ? 'bg-primary-600 text-white'
                                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                                        }`}
                                >
                                    {isRTL ? 'الكل' : 'Tous'}
                                </button>
                                {groups.map((group) => (
                                    <button
                                        key={group.id}
                                        onClick={() => setSelectedGroup(group.id)}
                                        className={`px-3 py-1.5 rounded-full text-sm ${selectedGroup === group.id
                                                ? 'bg-primary-600 text-white'
                                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                                            }`}
                                    >
                                        {group.name}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Liste */}
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : (
                    <MobileList
                        items={filteredChildren}
                        renderItem={renderChild}
                        keyExtractor={(child) => child.id}
                        swipeActions={swipeActions}
                        emptyMessage={
                            searchQuery
                                ? (isRTL ? 'لا توجد نتائج' : 'Aucun résultat')
                                : (isRTL ? 'لا يوجد أطفال' : 'Aucun enfant inscrit')
                        }
                        emptyIcon={Baby}
                    />
                )}

                {/* Bouton flottant d'ajout */}
                {onAddChild && (
                    <motion.button
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={onAddChild}
                        className="fixed bottom-24 right-4 rtl:right-auto rtl:left-4 w-14 h-14 bg-primary-600 hover:bg-primary-700 text-white rounded-full shadow-lg flex items-center justify-center z-40"
                    >
                        <Plus className="w-6 h-6" />
                    </motion.button>
                )}
            </div>
        </div>
    );
};

export default MobileChildrenList;
