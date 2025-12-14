/**
 * MobileAttendance - Gestion des présences optimisée mobile
 * 
 * Interface tactile avec gros boutons pour check-in/out rapide,
 * liste des enfants présents/absents et stats du jour.
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    UserCheck,
    UserX,
    Search,
    Filter,
    Clock,
    Users,
    CheckCircle,
    XCircle,
    Baby,
    ChevronDown,
    RefreshCw
} from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import MobileHeader from './MobileHeader';
import MobileCard from './MobileCard';
import MobileStatCard from './MobileStatCard';

const MobileAttendance = ({
    children = [],
    attendance = {},
    stats = {},
    loading = false,
    onCheckIn,
    onCheckOut,
    onRefresh,
    selectedDate = new Date()
}) => {
    const { isRTL } = useLanguage();
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState('all'); // all, present, absent
    const [showFilters, setShowFilters] = useState(false);
    const [processingId, setProcessingId] = useState(null);

    // Filtrer les enfants
    const filteredChildren = useMemo(() => {
        return children.filter(child => {
            // Filtre de recherche
            const matchesSearch = searchQuery === '' ||
                `${child.first_name} ${child.last_name}`.toLowerCase().includes(searchQuery.toLowerCase());

            // Filtre de statut
            const childAttendance = attendance[child.id];
            const isPresent = childAttendance?.check_in && !childAttendance?.check_out;

            if (filter === 'present' && !isPresent) return false;
            if (filter === 'absent' && isPresent) return false;

            return matchesSearch;
        });
    }, [children, searchQuery, filter, attendance]);

    const handleCheckIn = async (childId) => {
        setProcessingId(childId);
        try {
            await onCheckIn?.(childId);
        } finally {
            setProcessingId(null);
        }
    };

    const handleCheckOut = async (childId) => {
        setProcessingId(childId);
        try {
            await onCheckOut?.(childId);
        } finally {
            setProcessingId(null);
        }
    };

    const getAttendanceStatus = (childId) => {
        const record = attendance[childId];
        if (!record) return 'absent';
        if (record.check_in && !record.check_out) return 'present';
        if (record.check_in && record.check_out) return 'left';
        return 'absent';
    };

    const formatTime = (timeString) => {
        if (!timeString) return '-';
        const date = new Date(timeString);
        return date.toLocaleTimeString(isRTL ? 'ar-TN' : 'fr-FR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.05 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
            {/* Header */}
            <MobileHeader
                title={isRTL ? 'الحضور' : 'Présences'}
                subtitle={selectedDate.toLocaleDateString(isRTL ? 'ar-TN' : 'fr-FR', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long'
                })}
                showSearch={true}
                onSearch={setSearchQuery}
                searchPlaceholder={isRTL ? 'بحث عن طفل...' : 'Rechercher un enfant...'}
                actions={[
                    { icon: RefreshCw, onClick: onRefresh, label: 'Rafraîchir' },
                    { icon: Filter, onClick: () => setShowFilters(!showFilters), label: 'Filtrer' }
                ]}
            />

            <div className="p-4 space-y-4">
                {/* Stats du jour */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-3 gap-3"
                >
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-3 text-center">
                        <div className="flex items-center justify-center gap-1 text-green-600 mb-1">
                            <UserCheck className="w-4 h-4" />
                        </div>
                        <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                            {stats.present || 0}
                        </p>
                        <p className="text-xs text-green-600 dark:text-green-500">
                            {isRTL ? 'حاضر' : 'Présents'}
                        </p>
                    </div>

                    <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-3 text-center">
                        <div className="flex items-center justify-center gap-1 text-orange-600 mb-1">
                            <UserX className="w-4 h-4" />
                        </div>
                        <p className="text-2xl font-bold text-orange-700 dark:text-orange-400">
                            {stats.absent || 0}
                        </p>
                        <p className="text-xs text-orange-600 dark:text-orange-500">
                            {isRTL ? 'غائب' : 'Absents'}
                        </p>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 text-center">
                        <div className="flex items-center justify-center gap-1 text-blue-600 mb-1">
                            <Users className="w-4 h-4" />
                        </div>
                        <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                            {stats.total || children.length}
                        </p>
                        <p className="text-xs text-blue-600 dark:text-blue-500">
                            {isRTL ? 'المجموع' : 'Total'}
                        </p>
                    </div>
                </motion.div>

                {/* Filtres */}
                <AnimatePresence>
                    {showFilters && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="flex gap-2 overflow-x-auto pb-2"
                        >
                            {[
                                { value: 'all', label: isRTL ? 'الكل' : 'Tous' },
                                { value: 'present', label: isRTL ? 'حاضر' : 'Présents' },
                                { value: 'absent', label: isRTL ? 'غائب' : 'Absents' }
                            ].map((f) => (
                                <button
                                    key={f.value}
                                    onClick={() => setFilter(f.value)}
                                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${filter === f.value
                                            ? 'bg-primary-600 text-white'
                                            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                                        }`}
                                >
                                    {f.label}
                                </button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Liste des enfants */}
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : filteredChildren.length === 0 ? (
                    <div className="text-center py-12">
                        <Baby className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 dark:text-gray-400">
                            {searchQuery
                                ? (isRTL ? 'لا توجد نتائج' : 'Aucun résultat')
                                : (isRTL ? 'لا يوجد أطفال' : 'Aucun enfant')}
                        </p>
                    </div>
                ) : (
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="space-y-3"
                    >
                        {filteredChildren.map((child) => {
                            const status = getAttendanceStatus(child.id);
                            const record = attendance[child.id];
                            const isProcessing = processingId === child.id;

                            return (
                                <motion.div
                                    key={child.id}
                                    variants={itemVariants}
                                    className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm"
                                >
                                    <div className="flex items-center gap-3">
                                        {/* Avatar */}
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${status === 'present'
                                                ? 'bg-green-100 dark:bg-green-900/30'
                                                : status === 'left'
                                                    ? 'bg-gray-100 dark:bg-gray-700'
                                                    : 'bg-orange-100 dark:bg-orange-900/30'
                                            }`}>
                                            {child.photo_url ? (
                                                <img
                                                    src={child.photo_url}
                                                    alt={child.first_name}
                                                    className="w-full h-full rounded-full object-cover"
                                                />
                                            ) : (
                                                <Baby className={`w-6 h-6 ${status === 'present'
                                                        ? 'text-green-600'
                                                        : status === 'left'
                                                            ? 'text-gray-500'
                                                            : 'text-orange-600'
                                                    }`} />
                                            )}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                                                {child.first_name} {child.last_name}
                                            </h3>
                                            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                                {status === 'present' && record?.check_in && (
                                                    <>
                                                        <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                                                        <span>{isRTL ? 'دخول:' : 'Entrée:'} {formatTime(record.check_in)}</span>
                                                    </>
                                                )}
                                                {status === 'left' && (
                                                    <>
                                                        <XCircle className="w-3.5 h-3.5 text-gray-400" />
                                                        <span>{isRTL ? 'خروج:' : 'Sorti à'} {formatTime(record?.check_out)}</span>
                                                    </>
                                                )}
                                                {status === 'absent' && (
                                                    <span className="text-orange-500">{isRTL ? 'غائب' : 'Non pointé'}</span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex gap-2">
                                            {status === 'absent' && (
                                                <button
                                                    onClick={() => handleCheckIn(child.id)}
                                                    disabled={isProcessing}
                                                    className="w-14 h-14 rounded-xl bg-green-500 hover:bg-green-600 active:scale-95 text-white flex items-center justify-center transition-all disabled:opacity-50"
                                                >
                                                    {isProcessing ? (
                                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                    ) : (
                                                        <UserCheck className="w-6 h-6" />
                                                    )}
                                                </button>
                                            )}
                                            {status === 'present' && (
                                                <button
                                                    onClick={() => handleCheckOut(child.id)}
                                                    disabled={isProcessing}
                                                    className="w-14 h-14 rounded-xl bg-orange-500 hover:bg-orange-600 active:scale-95 text-white flex items-center justify-center transition-all disabled:opacity-50"
                                                >
                                                    {isProcessing ? (
                                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                    ) : (
                                                        <UserX className="w-6 h-6" />
                                                    )}
                                                </button>
                                            )}
                                            {status === 'left' && (
                                                <div className="w-14 h-14 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                                                    <CheckCircle className="w-6 h-6 text-gray-400" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default MobileAttendance;
