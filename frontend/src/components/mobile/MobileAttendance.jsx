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
    Filter,
    Users,
    CheckCircle,
    XCircle,
    Baby,
    RefreshCw,
    PlusCircle,
    Calendar,
    AlertTriangle,
    X,
    Search,
    Undo2
} from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import MobileHeader from './MobileHeader';

const MobileAttendance = ({
    children = [],
    attendance = {},
    stats = {},
    loading = false,
    attendanceMode = 'hourly',
    onCheckIn,
    onCheckOut,
    onTogglePresence,
    onCancelAttendance,
    onRecordExceptionalSaturday,
    onRefresh,
    selectedDate = new Date(),
    canManage = true
}) => {
    const { isRTL } = useLanguage();
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState('all'); // all, present, absent
    const [showFilters, setShowFilters] = useState(false);
    const [processingId, setProcessingId] = useState(null);

    // Modal de confirmation pour marquer absent (garde-fou 2ème clic)
    const [confirmAbsentChild, setConfirmAbsentChild] = useState(null);

    // Modal d'accueil exceptionnel le samedi
    const [showExceptionalModal, setShowExceptionalModal] = useState(false);
    const [exceptionalSearch, setExceptionalSearch] = useState('');

    const isDailyMode = attendanceMode === 'daily';
    const isSaturday = selectedDate.getDay() === 6;

    // Le samedi : filtrer strictement sur saturday_attendance === true ou déjà pointé
    const eligibleChildren = useMemo(() => {
        if (!isSaturday) return children;
        return children.filter(child => child.saturday_attendance || attendance[child.id]);
    }, [children, isSaturday, attendance]);

    // Enfants non inscrits le samedi pour l'accueil exceptionnel
    const nonSaturdayChildren = useMemo(() => {
        if (!isSaturday) return [];
        return children.filter(child => !child.saturday_attendance && !attendance[child.id]);
    }, [children, isSaturday, attendance]);

    // Filtrer les enfants affichés
    const filteredChildren = useMemo(() => {
        return eligibleChildren.filter(child => {
            const matchesSearch = searchQuery === '' ||
                `${child.first_name} ${child.last_name}`.toLowerCase().includes(searchQuery.toLowerCase());

            const childAttendance = attendance[child.id];
            const isPresent = childAttendance?.status === 'present' || (childAttendance?.check_in && (!childAttendance?.check_out || isDailyMode));

            if (filter === 'present' && !isPresent) return false;
            if (filter === 'absent' && isPresent) return false;

            return matchesSearch;
        });
    }, [eligibleChildren, searchQuery, filter, attendance, isDailyMode]);

    // 1er clic : marquer présent immédiatement
    const handleFirstClick = async (child) => {
        setProcessingId(child.id);
        try {
            if (isDailyMode) {
                await onTogglePresence?.(child.id, { target_status: 'present' });
            } else {
                await onCheckIn?.(child.id);
            }
        } finally {
            setProcessingId(null);
        }
    };

    // 2ème clic (sur enfant présent) : déclenche la confirmation pour marquer absent
    const handleRequestAbsent = (child) => {
        setConfirmAbsentChild(child);
    };

    const handleConfirmAbsent = async () => {
        if (!confirmAbsentChild) return;
        const childId = confirmAbsentChild.id;
        setProcessingId(childId);
        try {
            const record = attendance[childId];
            if (record?.id && onCancelAttendance) {
                await onCancelAttendance(record.id);
            } else if (onTogglePresence) {
                await onTogglePresence(childId, { target_status: 'absent' });
            }
        } finally {
            setProcessingId(null);
            setConfirmAbsentChild(null);
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

    const handleAddExceptional = async (child) => {
        setProcessingId(child.id);
        try {
            await onRecordExceptionalSaturday?.(child.id);
            setShowExceptionalModal(false);
        } finally {
            setProcessingId(null);
        }
    };

    const getAttendanceStatus = (childId) => {
        const record = attendance[childId];
        if (!record) return 'absent';
        if (isDailyMode) {
            return (record.status === 'present' || record.check_in) ? 'present' : 'absent';
        }
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
                            {stats.total !== undefined ? stats.total : eligibleChildren.length}
                        </p>
                        <p className="text-xs text-blue-600 dark:text-blue-500">
                            {isRTL ? 'المجموع' : 'Total'}
                        </p>
                    </div>
                </motion.div>

                {/* Bandeau Samedi & Accueil exceptionnel */}
                {isSaturday && (
                    <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/60 rounded-xl p-3 flex items-center justify-between gap-2 shadow-sm"
                    >
                        <div className="min-w-0">
                            <p className="text-xs font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                                <span>{isRTL ? 'يوم السبت — المسجلون فقط' : 'Pointage Samedi — Inscrits uniquement'}</span>
                            </p>
                            <p className="text-[11px] text-amber-600 dark:text-amber-400 truncate">
                                {eligibleChildren.length} {isRTL ? 'أطفال مؤهلين' : 'enfants éligibles au samedi'}
                            </p>
                        </div>
                        {canManage && nonSaturdayChildren.length > 0 && (
                            <button
                                onClick={() => setShowExceptionalModal(true)}
                                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white text-xs font-semibold rounded-lg flex items-center gap-1 flex-shrink-0 shadow-sm transition-all"
                            >
                                <PlusCircle className="w-3.5 h-3.5" />
                                <span>{isRTL ? 'استثناء' : 'Exception'}</span>
                            </button>
                        )}
                    </motion.div>
                )}

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
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                                                    {child.first_name} {child.last_name}
                                                </h3>
                                                {record?.is_exceptional_saturday && (
                                                    <span className="text-[10px] bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 px-1.5 py-0.5 rounded font-medium">
                                                        {isRTL ? 'استثنائي' : 'Exceptionnel'}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                                                {status === 'present' && (
                                                    <>
                                                        <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                                                        <span>
                                                            {isDailyMode
                                                                ? (isRTL ? 'حاضر اليوم' : 'Présent aujourd\'hui')
                                                                : `${isRTL ? 'دخول:' : 'Entrée:'} ${formatTime(record?.check_in)}`}
                                                        </span>
                                                    </>
                                                )}
                                                {status === 'left' && (
                                                    <>
                                                        <XCircle className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                                        <span className="flex items-center gap-1">
                                                            {isRTL ? 'خروج:' : 'Sorti à'} {formatTime(record?.check_out)}
                                                            {record?.notes?.includes('[Départ automatique') && (
                                                                <span className="text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded font-medium">
                                                                    {isRTL ? 'تلقائي' : 'auto'}
                                                                </span>
                                                            )}
                                                        </span>
                                                    </>
                                                )}
                                                {status === 'absent' && (
                                                    <span className="text-orange-500 font-medium">
                                                        {isRTL ? 'غير مسجل' : 'Non pointé'}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        {canManage && (
                                            <div className="flex items-center gap-2">
                                                {status === 'absent' && (
                                                    <button
                                                        onClick={() => handleFirstClick(child)}
                                                        disabled={isProcessing}
                                                        title={isRTL ? 'تسجيل الحضور' : 'Marquer présent'}
                                                        className="w-14 h-14 rounded-xl bg-green-500 hover:bg-green-600 active:scale-95 text-white flex items-center justify-center transition-all disabled:opacity-50 shadow-sm"
                                                    >
                                                        {isProcessing ? (
                                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                        ) : (
                                                            <UserCheck className="w-6 h-6" />
                                                        )}
                                                    </button>
                                                )}

                                                {status === 'present' && (
                                                    isDailyMode ? (
                                                        <button
                                                            onClick={() => handleRequestAbsent(child)}
                                                            disabled={isProcessing}
                                                            title={isRTL ? 'تأكيد الغياب' : 'Cliquer pour marquer absent'}
                                                            className="w-14 h-14 rounded-xl bg-green-600 hover:bg-red-500 active:scale-95 text-white flex flex-col items-center justify-center transition-all disabled:opacity-50 shadow-sm group"
                                                        >
                                                            {isProcessing ? (
                                                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                            ) : (
                                                                <>
                                                                    <CheckCircle className="w-6 h-6 group-hover:hidden" />
                                                                    <UserX className="w-6 h-6 hidden group-hover:block" />
                                                                    <span className="text-[9px] mt-0.5 leading-none">
                                                                        {isRTL ? 'حاضر' : 'Présent'}
                                                                    </span>
                                                                </>
                                                            )}
                                                        </button>
                                                    ) : (
                                                        <div className="flex items-center gap-1.5">
                                                            <button
                                                                onClick={() => handleRequestAbsent(child)}
                                                                disabled={isProcessing}
                                                                title={isRTL ? 'إلغاء' : 'Annuler'}
                                                                className="w-10 h-14 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 text-gray-500 flex items-center justify-center transition-all"
                                                            >
                                                                <Undo2 className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleCheckOut(child.id)}
                                                                disabled={isProcessing}
                                                                title={isRTL ? 'تسجيل الخروج' : 'Marquer départ'}
                                                                className="w-14 h-14 rounded-xl bg-orange-500 hover:bg-orange-600 active:scale-95 text-white flex items-center justify-center transition-all disabled:opacity-50 shadow-sm"
                                                            >
                                                                {isProcessing ? (
                                                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                                ) : (
                                                                    <UserX className="w-6 h-6" />
                                                                )}
                                                            </button>
                                                        </div>
                                                    )
                                                )}

                                                {status === 'left' && (
                                                    <div className="flex items-center gap-1.5">
                                                        <button
                                                            onClick={() => handleRequestAbsent(child)}
                                                            disabled={isProcessing}
                                                            title={isRTL ? 'إلغاء' : 'Annuler'}
                                                            className="w-10 h-14 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 text-gray-500 flex items-center justify-center transition-all"
                                                        >
                                                            <Undo2 className="w-4 h-4" />
                                                        </button>
                                                        <div className="w-14 h-14 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                                                            <CheckCircle className="w-6 h-6 text-gray-400" />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                )}
            </div>

            {/* Modal de confirmation : marquer absent (2ème clic) */}
            <AnimatePresence>
                {confirmAbsentChild && (
                    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-sm p-5 shadow-2xl border border-gray-100 dark:border-gray-700 space-y-4"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-11 h-11 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0 text-amber-600 dark:text-amber-400">
                                        <AlertTriangle className="w-6 h-6" />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="text-base font-bold text-gray-900 dark:text-white leading-tight">
                                            {isRTL ? 'إلغاء تسجيل الحضور ؟' : 'Annuler la présence ?'}
                                        </h3>
                                        <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate mt-0.5">
                                            {confirmAbsentChild.first_name} {confirmAbsentChild.last_name}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setConfirmAbsentChild(null)}
                                    className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/60 rounded-xl space-y-1.5">
                                <div className="flex items-center gap-1.5 text-xs font-medium text-amber-800 dark:text-amber-300">
                                    <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                                    <span>{isRTL ? 'الحالة الحالية: مسجل كحاضر' : 'Statut actuel : noté Présent'}</span>
                                </div>
                                <p className="text-xs text-amber-700 dark:text-amber-300/90 leading-relaxed">
                                    {isRTL
                                        ? `هل تريد إلغاء نقطة حضور ${confirmAbsentChild.first_name} وتغيير حالته إلى غائب اليوم ؟`
                                        : `Voulez-vous annuler le pointage de ${confirmAbsentChild.first_name} et le repasser en absent pour aujourd'hui ?`}
                                </p>
                            </div>

                            <div className="flex gap-2.5 pt-1">
                                <button
                                    type="button"
                                    onClick={() => setConfirmAbsentChild(null)}
                                    className="flex-1 py-2.5 px-3 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold text-xs hover:bg-gray-50 dark:hover:bg-gray-700 active:scale-95 transition-all text-center"
                                >
                                    {isRTL ? 'لا، إبقاء الحضور' : 'Non, laisser présent'}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleConfirmAbsent}
                                    disabled={processingId === confirmAbsentChild.id}
                                    className="flex-1 py-2.5 px-3 rounded-xl bg-red-600 hover:bg-red-700 active:scale-95 text-white font-semibold text-xs transition-all shadow-sm disabled:opacity-50 text-center"
                                >
                                    {processingId === confirmAbsentChild.id ? (
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
                                    ) : (
                                        (isRTL ? 'نعم، تحويل لغائب' : 'Oui, marquer absent')
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Modal Accueil Exceptionnel le Samedi */}
            <AnimatePresence>
                {showExceptionalModal && (
                    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md max-h-[85vh] flex flex-col shadow-2xl border border-gray-100 dark:border-gray-700"
                        >
                            <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600">
                                        <Calendar className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 dark:text-white text-sm">
                                            {isRTL ? 'استقبال استثنائي يوم السبت' : 'Accueil exceptionnel le Samedi'}
                                        </h3>
                                        <p className="text-[11px] text-gray-500">
                                            {isRTL ? 'إشعار الولي تلقائياً' : 'Le parent recevra une notification'}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowExceptionalModal(false)}
                                    className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-3 border-b border-gray-100 dark:border-gray-700">
                                <div className="relative">
                                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        value={exceptionalSearch}
                                        onChange={(e) => setExceptionalSearch(e.target.value)}
                                        placeholder={isRTL ? 'بحث عن طفل...' : 'Rechercher un enfant non inscrit...'}
                                        className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                                    />
                                </div>
                            </div>

                            <div className="p-3 overflow-y-auto space-y-2 flex-1">
                                {nonSaturdayChildren
                                    .filter(c => `${c.first_name} ${c.last_name}`.toLowerCase().includes(exceptionalSearch.toLowerCase()))
                                    .map(child => (
                                        <div
                                            key={child.id}
                                            className="p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 flex items-center justify-between gap-3 hover:border-amber-400 transition-colors"
                                        >
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <div className="w-9 h-9 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-700 font-semibold text-xs flex-shrink-0">
                                                    {child.first_name?.[0]}{child.last_name?.[0]}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-semibold text-xs text-gray-900 dark:text-white truncate">
                                                        {child.first_name} {child.last_name}
                                                    </p>
                                                    <p className="text-[10px] text-gray-500">
                                                        {child.care_schedule === 'half_day' ? 'Mi-journée' : 'Journée complète'}
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleAddExceptional(child)}
                                                disabled={processingId === child.id}
                                                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-medium flex items-center gap-1 active:scale-95 disabled:opacity-50 transition-all flex-shrink-0"
                                            >
                                                {processingId === child.id ? (
                                                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                ) : (
                                                    <>
                                                        <PlusCircle className="w-3.5 h-3.5" />
                                                        <span>{isRTL ? 'تسجيل' : 'Accueillir'}</span>
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    ))}

                                {nonSaturdayChildren.filter(c => `${c.first_name} ${c.last_name}`.toLowerCase().includes(exceptionalSearch.toLowerCase())).length === 0 && (
                                    <p className="text-center text-xs text-gray-400 py-6">
                                        {isRTL ? 'لا يوجد أطفال' : 'Aucun enfant non inscrit trouvé'}
                                    </p>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default MobileAttendance;
