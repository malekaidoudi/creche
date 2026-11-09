import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    X,
    Calendar,
    Clock,
    User,
    CheckCircle,
    CalendarDays,
    FileText,
    StickyNote,
    CalendarCheck,
    AlertCircle,
    Phone,
    Mail,
    ClipboardCheck,
    Baby,
    Cake,
    UserCheck,
    MessageCircle,
    ExternalLink,
    XCircle,
    Edit,
    Eye
} from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import { useAuth } from '../../hooks/useAuth';
import { useDialogContext } from '../../contexts/DialogContext';
import api from '../../services/api';
import {
    getTaskAutoKind,
    cleanTaskTitle,
    cleanTaskDescription,
    resolveExpressChildTarget,
    resolveEnrollmentTarget
} from '../../utils/taskHelpers';

const cleanTaskDescriptionText = (rawText) => cleanTaskDescription(rawText);

/**
 * Modal de détails d'une tâche/mémo/RDV/événement
 * Permet de voir les détails, marquer comme terminé ou exécuter directement les actions métier (ex: Anniversaire, RDV)
 */
const TaskDetailModal = ({ isOpen, onClose, task, onComplete, onStartAdmission }) => {
    const { isRTL } = useLanguage();
    const { user } = useAuth();
    const navigate = useNavigate();
    const dialog = useDialogContext();
    const [completing, setCompleting] = useState(false);

    // État spécifique aux tâches d'anniversaire
    const [birthdayChildId, setBirthdayChildId] = useState(null);
    const [birthdayData, setBirthdayData] = useState(null);
    const [loadingBirthday, setLoadingBirthday] = useState(false);
    const [selectedStaffId, setSelectedStaffId] = useState('');
    const [celebrationDateInput, setCelebrationDateInput] = useState('');
    const [staffTaskNotesInput, setStaffTaskNotesInput] = useState('');
    const [submittingBirthdayAction, setSubmittingBirthdayAction] = useState(false);

    // Vérifier si c'est un RDV d'inscription
    const isInscriptionAppointment = task?.type === 'appointment' && task?.metadata?.is_inscription;

    // Vérifier si c'est une tâche liée à un anniversaire
    const isBirthdayTask = Boolean(
        task?.type === 'birthday' ||
            task?.birthday_child_id ||
            /anniversaire/i.test(task?.title || '') ||
            /\/anniversaire\/\d+/.test(task?.description || '')
    );
    const isStaffPreparationTask =
        /préparer l'anniversaire/i.test(task?.title || '') || user?.role === 'staff';

    // Résoudre l'ID de l'enfant et charger les données d'anniversaire
    useEffect(() => {
        if (!isOpen || !task || !isBirthdayTask) {
            setBirthdayChildId(null);
            setBirthdayData(null);
            return;
        }

        let cancelled = false;

        const loadBirthdayContext = async () => {
            setLoadingBirthday(true);
            try {
                // 1. Chercher l'ID dans task.birthday_child_id, metadata.child_id ou 🔗 Lien: /anniversaire/:id
                let cId = task.birthday_child_id || task.metadata?.child_id || null;
                if (!cId && task.description) {
                    const match = task.description.match(/\/anniversaire\/(\d+)/);
                    if (match) cId = Number(match[1]);
                }

                // 2. Fallback si ancienne tâche sans lien : chercher par le nom de l'enfant dans le titre
                if (!cId && task.title) {
                    const childrenRes = await api.get('/api/children');
                    const childrenList = childrenRes.data?.children || [];
                    const titleLower = task.title.toLowerCase();
                    const found = childrenList.find((c) => {
                        const full = `${c.first_name || ''} ${c.last_name || ''}`.trim().toLowerCase();
                        return (full && titleLower.includes(full)) || (c.first_name && titleLower.includes(c.first_name.toLowerCase()));
                    });
                    if (found) cId = found.id;
                }

                if (!cId || cancelled) {
                    setLoadingBirthday(false);
                    return;
                }

                setBirthdayChildId(cId);
                const detailRes = await api.get(`/api/birthdays/child/${cId}`);
                if (!cancelled && detailRes.data?.success) {
                    const d = detailRes.data.data || detailRes.data;
                    setBirthdayData(d);

                    const defaultDay = d.celebration?.celebration_date
                        ? String(d.celebration.celebration_date).slice(0, 10)
                        : d.suggested_days?.[0]?.date || d.birthday?.this_year_date || '';
                    setCelebrationDateInput(defaultDay);

                    if (d.staff_list?.length > 0) {
                        setSelectedStaffId(
                            d.celebration?.assigned_staff_id
                                ? String(d.celebration.assigned_staff_id)
                                : String(d.staff_list[0].id)
                        );
                    }

                    const selectedDayLabel =
                        d.suggested_days?.find((s) => s.date === defaultDay)?.label || defaultDay;
                    const coAdminNote =
                        d.co_birthdays?.length > 0
                            ? ` Co-anniversaire possible avec ${d.co_birthdays.map((c) => c.first_name).join(', ')}.`
                            : '';
                    const cleanedSaved = cleanTaskDescriptionText(d.celebration?.admin_task_notes);
                    setStaffTaskNotesInput(
                        cleanedSaved ||
                            `🎂 Préparer l'anniversaire de ${d.child?.first_name} (${d.birthday?.turning_age} ans) prévu le ${selectedDayLabel}.${coAdminNote} Prévoir décoration, couronne, musique et prendre 3-4 belles photos souvenirs pour le diaporama parent.`
                    );
                }
            } catch (err) {
                console.error('Erreur chargement contexte anniversaire dans modal:', err);
            } finally {
                if (!cancelled) setLoadingBirthday(false);
            }
        };

        loadBirthdayContext();
        return () => {
            cancelled = true;
        };
    }, [isOpen, task, isBirthdayTask]);

    if (!isOpen || !task) return null;

    // Exécuter une action anniversaire (assign_staff, accept, reject, complete_staff_task) directement depuis le modal
    const handleBirthdayModalAction = async (actionType) => {
        if (!birthdayChildId) return;
        try {
            setSubmittingBirthdayAction(true);
            const res = await api.post(`/api/birthdays/child/${birthdayChildId}/admin-action`, {
                action: actionType,
                assigned_staff_id: selectedStaffId ? Number(selectedStaffId) : null,
                celebration_date: celebrationDateInput,
                admin_task_notes: staffTaskNotesInput
            });

            if (res.data?.success) {
                // Si c'est une tâche de la table tasks et qu'on assigne le staff ou termine la préparation, marquer aussi la tâche courante comme complétée
                if (
                    (actionType === 'assign_staff' || actionType === 'reject' || actionType === 'complete_staff_task') &&
                    (task.source === 'tasks' || task.type === 'task') &&
                    typeof task.id === 'number'
                ) {
                    try {
                        await api.patch(`/api/tasks/${task.id}/status`, { status: 'completed' });
                    } catch (_) {
                        // Déjà mis à jour côté backend si liée à task_id
                    }
                }

                dialog.success(res.data.message || 'Action enregistrée avec succès !');
                onComplete && onComplete(task.id);
                window.dispatchEvent(new CustomEvent('taskUpdated'));
                onClose();
            }
        } catch (err) {
            console.error('Erreur action anniversaire depuis modal:', err);
            dialog.error(err.response?.data?.error || 'Erreur lors du traitement de la tâche anniversaire');
        } finally {
            setSubmittingBirthdayAction(false);
        }
    };

    // Formater la date
    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString(isRTL ? 'ar-TN' : 'fr-FR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    // Formater l'heure
    const formatTime = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleTimeString(isRTL ? 'ar-TN' : 'fr-FR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Obtenir l'icône selon le type
    const getTypeIcon = () => {
        if (isBirthdayTask) {
            return <Cake className="w-6 h-6 text-rose-100" />;
        }
        switch (task.type) {
            case 'appointment':
                return <CalendarCheck className="w-6 h-6 text-green-600" />;
            case 'event':
            case 'meeting':
                return <Calendar className="w-6 h-6 text-orange-600" />;
            case 'memo':
                return <StickyNote className="w-6 h-6 text-purple-600" />;
            case 'task':
            default:
                return <FileText className="w-6 h-6 text-blue-600" />;
        }
    };

    // Obtenir le label du type
    const getTypeLabel = () => {
        if (isBirthdayTask) {
            return isStaffPreparationTask
                ? (isRTL ? 'تحضير عيد ميلاد' : 'Préparation Anniversaire (Staff)')
                : (isRTL ? 'تنظيم عيد ميلاد' : 'Organisation Anniversaire (Direction)');
        }
        switch (task.type) {
            case 'appointment':
                return isRTL ? 'موعد' : 'Rendez-vous';
            case 'event':
            case 'meeting':
                return isRTL ? 'مناسبة' : 'Événement';
            case 'memo':
                return isRTL ? 'مذكرة' : 'Mémo';
            case 'task':
            default:
                return isRTL ? 'مهمة' : 'Tâche';
        }
    };

    // Obtenir la couleur de priorité
    const getPriorityStyle = () => {
        switch (task.priority) {
            case 'urgent':
            case 'high':
                return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
            case 'medium':
                return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
            case 'low':
                return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
            default:
                return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
        }
    };

    // Obtenir le label de priorité
    const getPriorityLabel = () => {
        switch (task.priority) {
            case 'urgent':
                return isRTL ? 'عاجلة جداً' : 'Urgente';
            case 'high':
                return isRTL ? 'عالية' : 'Haute';
            case 'medium':
                return isRTL ? 'متوسطة' : 'Moyenne';
            case 'low':
                return isRTL ? 'منخفضة' : 'Basse';
            default:
                return isRTL ? 'عادية' : 'Normal';
        }
    };

    // Marquer comme terminé
    const handleComplete = async () => {
        setCompleting(true);
        try {
            if (task.type === 'appointment') {
                // Pour les RDV, marquer comme completed
                const appointmentId = task.metadata?.appointment_id || task.id.replace('appt-', '');
                await api.patch(`/api/appointments/${appointmentId}/status`, {
                    status: 'completed'
                });
            } else if (task.source === 'personal_memos' || task.type === 'memo') {
                // Pour les mémos personnels
                const memoId = task.id.toString().replace('memo-', '');
                await api.patch(`/api/personal-memos/${memoId}/complete`);
            } else if (task.source === 'tasks' || task.type === 'task') {
                // Pour les tâches de la table tasks
                await api.patch(`/api/tasks/${task.id}/status`, {
                    status: 'completed'
                });
            } else {
                // Pour les autres types (events)
                await api.patch(`/api/events/${task.id}/status`, {
                    status: 'completed'
                });
            }

            dialog.success(isRTL ? 'تم الإنهاء بنجاح' : 'Terminé avec succès');
            onComplete && onComplete(task.id);
            onClose();
            // Émettre un événement pour rafraîchir les widgets
            window.dispatchEvent(new CustomEvent('taskUpdated'));
            window.dispatchEvent(new CustomEvent('memoUpdated'));
        } catch (error) {
            console.error('Erreur:', error);
            dialog.error(error.response?.data?.error || (isRTL ? 'خطأ' : 'Erreur lors de la mise à jour'));
        } finally {
            setCompleting(false);
        }
    };

    // Extraire le lien de la description si présent (ou construire /dashboard/children/:id/birthday)
    const extractLinkFromDescription = () => {
        if (birthdayChildId) return `/dashboard/children/${birthdayChildId}/birthday`;
        if (!task.description) return null;
        const linkMatch = task.description.match(/🔗 Lien: (\/[^\s]+)/);
        if (linkMatch) {
            const raw = linkMatch[1];
            const annivMatch = raw.match(/^\/anniversaire\/(\d+)$/);
            if (annivMatch) return `/dashboard/children/${annivMatch[1]}/birthday`;
            return raw;
        }
        return null;
    };

    const taskLink = extractLinkFromDescription();
    const autoKind = getTaskAutoKind(task);
    const cleanedModalDescription = cleanTaskDescriptionText(task.description);
    const cleanedModalTitle = cleanTaskTitle(task, isRTL);
    const formattedTaskTime = task.start_date ? formatTime(task.start_date) : '';
    const showTaskTime =
        Boolean(formattedTaskTime) &&
        task.source !== 'tasks' &&
        task.type !== 'birthday' &&
        formattedTaskTime !== '00:00' &&
        formattedTaskTime !== '01:00';

    // Naviguer vers la page liée
    const handleNavigateToLink = () => {
        if (autoKind === 'express_child') {
            const { childId, childName } = resolveExpressChildTarget(task);
            onClose();
            navigate('/dashboard/children', { state: { editChildId: childId, editChildName: childName } });
            return;
        }
        if (autoKind === 'enrollment_review') {
            const { enrollmentId, childName } = resolveEnrollmentTarget(task);
            onClose();
            navigate('/dashboard/pending-enrollments', { state: { highlightId: enrollmentId, highlightChildName: childName } });
            return;
        }
        if (taskLink) {
            onClose();
            navigate(taskLink);
        }
    };

    // Naviguer vers le planning
    const handleViewPlanning = () => {
        onClose();
        navigate('/dashboard/planning');
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    >
                        <div
                            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header avec type et icône */}
                            <div
                                className={`p-5 text-white shrink-0 ${
                                    isBirthdayTask
                                        ? 'bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500'
                                        : 'bg-gradient-to-r from-primary-500 to-primary-600'
                                }`}
                            >
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="p-2 bg-white/20 rounded-xl shrink-0">
                                            {getTypeIcon()}
                                        </div>
                                        <div className="min-w-0">
                                            <span className="text-xs font-semibold uppercase tracking-wider opacity-90 block">
                                                {getTypeLabel()}
                                            </span>
                                            <h2 className="text-lg sm:text-xl font-bold truncate">
                                                {isRTL && isInscriptionAppointment
                                                    ? `📋 موعد تسجيل : ${task.metadata?.child_name || task.metadata?.child_first_name || ''}`
                                                    : isRTL && isBirthdayTask && cleanedModalTitle
                                                    ? cleanedModalTitle
                                                        .replace(/^Organisation\s+Anniversaire\s*—\s*/i, 'تنظيم عيد ميلاد — ')
                                                        .replace(/^Préparer\s+l'anniversaire\s+de\s*/i, 'تحضير عيد ميلاد ')
                                                        .replace(/\s*\((\d+)\s*ans\)/i, ' ($1 سنوات)')
                                                    : cleanedModalTitle}
                                            </h2>
                                        </div>
                                    </div>
                                    <button
                                        onClick={onClose}
                                        className="p-2 hover:bg-white/20 rounded-lg transition-colors shrink-0"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Contenu scrollable */}
                            <div className="p-5 space-y-4 overflow-y-auto flex-1">
                                {/* ==================== CAS SPÉCIAL : TÂCHE D'ANNIVERSAIRE ==================== */}
                                {isBirthdayTask ? (
                                    <div className="space-y-4">
                                        {/* Résumé de la demande ou instructions */}
                                        {cleanedModalDescription && (
                                            <div className="bg-rose-50/70 dark:bg-gray-700/50 border border-rose-200/80 rounded-xl p-3.5 text-xs sm:text-sm text-gray-800 dark:text-gray-200 whitespace-pre-line leading-relaxed">
                                                {isRTL
                                                    ? cleanedModalDescription
                                                        .replace(/Parent\s*:\s*/gi, 'الولي : ')
                                                        .replace(/Jour souhaité\s*:\s*/gi, 'اليوم المحدد : ')
                                                        .replace(/Événement partagé avec tous les parents de la crèche/gi, 'مناسبة مشتركة مع كافة أولياء الروضة')
                                                        .replace(/Événement privé réservé au parent concerné/gi, 'مناسبة خاصة بالولي المعني')
                                                        .replace(/Message\s*:\s*/gi, 'الرسالة : ')
                                                    : cleanedModalDescription}
                                            </div>
                                        )}

                                        {loadingBirthday ? (
                                            <div className="text-center py-4 text-xs text-gray-500">
                                                {isRTL ? 'جارٍ تحميل تفاصيل عيد الميلاد...' : 'Chargement des détails de l\'anniversaire...'}
                                            </div>
                                        ) : birthdayData ? (
                                            <>
                                                {/* Alerte si annulé par le parent */}
                                                {birthdayData.celebration?.decision_status === 'no' ? (
                                                    <div className="rounded-xl bg-rose-50 border-2 border-rose-300 p-4 space-y-1.5 text-rose-950">
                                                        <div className="flex items-center gap-2 font-bold text-sm">
                                                            <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                                                            <span>
                                                                {isRTL
                                                                    ? '🚫 تم إلغاء الحفل من قِبل الولي (احتفال عائلي فقط)'
                                                                    : '🚫 Fête annulée par le parent (Fête uniquement en famille)'}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs leading-relaxed">
                                                            {isRTL
                                                                ? 'قام الولي بإلغاء تنظيم الحفل في الروضة. لا توجد أي تحضيرات مطلوبة.'
                                                                : 'Le parent a annulé l\'organisation de la fête à la crèche. Aucune préparation n\'est requise.'}
                                                        </p>
                                                    </div>
                                                ) : isStaffPreparationTask ? (
                                                    /* ---- VUE STAFF DANS LE MODAL : Instructions & Validation préparation ---- */
                                                    <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 space-y-3">
                                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                                            <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-800">
                                                                {isRTL ? '👩‍🏫 مهمة التحضير الموكلة للموظف' : '👩‍🏫 Tâche de préparation Staff'}
                                                            </span>
                                                            <span className="px-2.5 py-0.5 rounded-full bg-white text-emerald-800 border border-emerald-200 text-xs font-bold">
                                                                {isRTL ? '📅 موعد الحفل المقرّر : ' : '📅 Fête prévue le : '}
                                                                {celebrationDateInput || birthdayData.birthday?.this_year_date}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs sm:text-sm text-gray-800 bg-white rounded-lg p-3 border border-emerald-200">
                                                            {staffTaskNotesInput}
                                                        </p>
                                                    </div>
                                                ) : (
                                                    /* ---- VUE ADMIN DANS LE MODAL : Détails dates + Contacter Parent + Accepter/Refuser + Assigner Staff ---- */
                                                    <div className="space-y-4">
                                                        {/* Carte récapitulative claire : Quand la demande a été faite & Pour quelle date */}
                                                        <div className="rounded-xl bg-amber-50/70 dark:bg-gray-700/60 border border-amber-200 dark:border-gray-600 p-3.5 space-y-2.5 text-xs">
                                                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-200/70 pb-2">
                                                                <span className="font-extrabold uppercase tracking-wider text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                                                                    <CalendarDays className="w-4 h-4 text-rose-500" />
                                                                    <span>
                                                                        {isRTL ? 'تفاصيل تواريخ الطلب' : 'Détails & Dates de la demande'}
                                                                    </span>
                                                                </span>
                                                                <span
                                                                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                                                        birthdayData.celebration?.decision_status !== 'yes'
                                                                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                                                            : birthdayData.celebration?.admin_approval_status === 'rejected'
                                                                            ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                                                            : birthdayData.celebration?.admin_approval_status === 'accepted'
                                                                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                                                            : 'bg-amber-100 text-amber-900 border border-amber-300'
                                                                    }`}
                                                                >
                                                                    {birthdayData.celebration?.decision_status !== 'yes'
                                                                        ? (isRTL ? '⏳ بدون طلب من الولي' : '⏳ Aucune demande du parent')
                                                                        : birthdayData.celebration?.admin_approval_status === 'rejected'
                                                                        ? (isRTL ? '❌ مرفوض من الإدارة' : '❌ Refusée par la direction')
                                                                        : birthdayData.celebration?.admin_approval_status === 'accepted'
                                                                        ? (isRTL ? '✅ مقبول' : '✅ Acceptée')
                                                                        : (isRTL ? '⏳ في انتظار التأكيد' : '⏳ En attente de validation')}
                                                                </span>
                                                            </div>

                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                                                <div className="bg-white dark:bg-gray-800 rounded-lg p-2.5 border border-amber-200/80 dark:border-gray-700">
                                                                    <span className="text-gray-500 dark:text-gray-400 block text-[11px] font-semibold">
                                                                        {isRTL ? '🕒 تاريخ إرسال الطلب من الولي :' : '🕒 Demande faite par le parent le :'}
                                                                    </span>
                                                                    <strong className="text-gray-900 dark:text-white text-xs sm:text-sm block mt-0.5 capitalize">
                                                                        {(() => {
                                                                            if (birthdayData.celebration?.decision_status !== 'yes' && birthdayData.celebration?.decision_status !== 'no') {
                                                                                return isRTL ? 'لم يرسل الولي أي طلب' : 'Aucune demande envoyée par le parent';
                                                                            }
                                                                            const rawReqDate =
                                                                                birthdayData.celebration?.requested_at ||
                                                                                birthdayData.celebration?.decided_at ||
                                                                                birthdayData.celebration?.updated_at ||
                                                                                task?.created_at ||
                                                                                task?.start_date;
                                                                            if (!rawReqDate) {
                                                                                return isRTL ? 'اليوم (عند إنشاء المهمة)' : "Aujourd'hui (lors de la création)";
                                                                            }
                                                                            const dObj = new Date(rawReqDate);
                                                                            if (isNaN(dObj.getTime())) return String(rawReqDate);
                                                                            const dStr = dObj.toLocaleDateString(isRTL ? 'ar-TN' : 'fr-FR', {
                                                                                weekday: 'long',
                                                                                day: 'numeric',
                                                                                month: 'long',
                                                                                year: 'numeric'
                                                                            });
                                                                            const tStr = dObj.toLocaleTimeString(isRTL ? 'ar-TN' : 'fr-FR', {
                                                                                hour: '2-digit',
                                                                                minute: '2-digit'
                                                                            });
                                                                            return tStr && tStr !== '00:00' ? `${dStr} à ${tStr}` : dStr;
                                                                        })()}
                                                                    </strong>
                                                                </div>

                                                                <div className="bg-white dark:bg-gray-800 rounded-lg p-2.5 border border-rose-200 dark:border-gray-700">
                                                                    <span className="text-gray-500 dark:text-gray-400 block text-[11px] font-semibold">
                                                                        {isRTL ? '🎂 التاريخ المطلوب للاحتفال في الروضة :' : '🎂 Date demandée pour la fête :'}
                                                                    </span>
                                                                    <strong className="text-rose-600 dark:text-rose-400 text-xs sm:text-sm block mt-0.5 capitalize">
                                                                        {(() => {
                                                                            if (birthdayData.celebration?.decision_status !== 'yes') {
                                                                                return isRTL ? 'لا يوجد تاريخ مطلوب' : 'Aucune date demandée (pas de demande)';
                                                                            }
                                                                            const iso =
                                                                                birthdayData.celebration?.celebration_date ||
                                                                                celebrationDateInput ||
                                                                                birthdayData.birthday?.this_year_date;
                                                                            if (birthdayData.celebration?.celebration_date_label) {
                                                                                return `${birthdayData.celebration.celebration_date_label}${
                                                                                    iso ? ` (${String(iso).slice(0, 10)})` : ''
                                                                                }`;
                                                                            }
                                                                            if (iso && /^\d{4}-\d{2}-\d{2}/.test(String(iso))) {
                                                                                const cleanIso = String(iso).slice(0, 10);
                                                                                const dObj = new Date(`${cleanIso}T12:00:00`);
                                                                                if (!isNaN(dObj.getTime())) {
                                                                                    const fmt = dObj.toLocaleDateString(
                                                                                        isRTL ? 'ar-TN' : 'fr-FR',
                                                                                        {
                                                                                            weekday: 'long',
                                                                                            day: 'numeric',
                                                                                            month: 'long',
                                                                                            year: 'numeric'
                                                                                        }
                                                                                    );
                                                                                    return `${fmt} (${cleanIso})`;
                                                                                }
                                                                            }
                                                                            return birthdayData.celebration?.preferred_date || iso || (isRTL ? 'غير محدد' : 'À définir');
                                                                        })()}
                                                                    </strong>
                                                                </div>
                                                            </div>

                                                            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-gray-600 dark:text-gray-300">
                                                                <span>
                                                                    {isRTL ? '🎈 تاريخ الميلاد الفعلي :' : '🎈 Date d’anniversaire réelle :'}{' '}
                                                                    <strong className="text-gray-900 dark:text-white capitalize">
                                                                        {birthdayData.birthday?.target_birthday_label || birthdayData.birthday?.this_year_date} (
                                                                        {birthdayData.birthday?.turning_age} {isRTL ? 'سنوات' : 'ans'})
                                                                    </strong>
                                                                </span>
                                                                {birthdayData.celebration?.parent_notes && (
                                                                    <span className="italic text-gray-700 dark:text-gray-200">
                                                                        💬 « {birthdayData.celebration.parent_notes} »
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Actions rapides de contact Parent */}
                                                        <div className="flex flex-wrap items-center justify-between gap-2 bg-gray-50 dark:bg-gray-700/40 p-3 rounded-xl border border-gray-200 dark:border-gray-700">
                                                            <div className="text-xs">
                                                                <span className="text-gray-500 block">
                                                                    {isRTL ? `ولي ${birthdayData.child?.first_name} :` : `Parent de ${birthdayData.child?.first_name} :`}
                                                                </span>
                                                                <strong className="text-gray-900 dark:text-white text-sm">
                                                                    {birthdayData.child?.parent_first_name || (isRTL ? 'الولي' : 'Parent')}{' '}
                                                                    {birthdayData.child?.parent_last_name || ''}
                                                                </strong>
                                                                <span className="block text-[11px] text-emerald-700 font-semibold mt-0.5">
                                                                    {birthdayData.celebration?.notify_other_parents
                                                                        ? (isRTL ? '🌍 مناسبة مشتركة مع كافة الأولياء' : '🌍 Événement partagé avec tous les parents')
                                                                        : (isRTL ? '🔒 مناسبة ظاهرة للولي + الفريق + الإدارة' : '🔒 Événement visible par Parent + Staff + Admin')}
                                                                </span>
                                                            </div>
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <a
                                                                    href={`tel:${birthdayData.child?.parent_phone || '+21622334455'}`}
                                                                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition"
                                                                >
                                                                    <Phone className="w-3.5 h-3.5" />
                                                                    <span>{isRTL ? 'اتصال' : 'Appeler'}</span>
                                                                </a>
                                                                <a
                                                                    href={`https://wa.me/${(birthdayData.child?.parent_phone || '+21622334455').replace(/[^0-9]/g, '')}`}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#25D366] hover:bg-[#1ebe57] text-white text-xs font-bold shadow-sm transition"
                                                                >
                                                                    <MessageCircle className="w-3.5 h-3.5" />
                                                                    <span>WhatsApp</span>
                                                                </a>
                                                            </div>
                                                        </div>

                                                        {birthdayData.celebration?.decision_status !== 'yes' ? (
                                                            <div className="rounded-xl bg-amber-50 border border-amber-300 p-3.5 text-xs text-amber-950">
                                                                <strong>
                                                                    {isRTL
                                                                        ? 'ℹ️ لم يرسل الولي أي طلب للاحتفال في الروضة'
                                                                        : "ℹ️ Aucune demande d'organisation envoyée par le parent"}
                                                                </strong>
                                                                <p className="mt-1">
                                                                    {isRTL
                                                                        ? 'لا يوجد أي طلب لقبوله أو رفضه حالياً.'
                                                                        : "Le parent n'ayant soumis aucune demande de fête à la crèche, vous n'avez aucune demande à accepter ou refuser."}
                                                                </p>
                                                            </div>
                                                        ) : (
                                                            <>
                                                                {/* Décision Direction : Accepter / Refuser la demande */}
                                                                <div className="rounded-xl bg-amber-50 border border-amber-300 p-3.5 space-y-2.5">
                                                                    <div className="text-xs font-bold text-amber-950">
                                                                        {birthdayData.birthday?.is_late_window || birthdayData.celebration?.is_late_request
                                                                            ? (isRTL
                                                                                ? `⚠️ طلب متأخر (ي-${birthdayData.birthday?.days_until}) — قرار الإدارة :`
                                                                                : `⚠️ Demande tardive (J-${birthdayData.birthday?.days_until}) — Décision Direction :`)
                                                                            : (isRTL
                                                                                ? '📋 قرار الإدارة بخصوص الطلب :'
                                                                                : '📋 Décision de la Direction sur la demande :')}
                                                                    </div>
                                                                    <div className="flex flex-wrap gap-2">
                                                                        <button
                                                                            type="button"
                                                                            disabled={submittingBirthdayAction}
                                                                            onClick={() => handleBirthdayModalAction('accept')}
                                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition disabled:opacity-50"
                                                                        >
                                                                            <CheckCircle className="w-3.5 h-3.5" />
                                                                            <span>{isRTL ? 'قبول الطلب' : 'Accepter la demande'}</span>
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            disabled={submittingBirthdayAction}
                                                                            onClick={() => handleBirthdayModalAction('reject')}
                                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition disabled:opacity-50"
                                                                        >
                                                                            <XCircle className="w-3.5 h-3.5" />
                                                                            <span>{isRTL ? 'رفض الطلب' : 'Refuser la demande'}</span>
                                                                        </button>
                                                                    </div>
                                                                </div>

                                                                {/* Assigner directement au Staff depuis le modal */}
                                                                <div className="rounded-xl border border-rose-200 bg-rose-50/40 p-3.5 space-y-3">
                                                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                                                        <h4 className="text-xs sm:text-sm font-extrabold text-gray-900 flex items-center gap-1.5">
                                                                            <UserCheck className="w-4 h-4 text-rose-500" />
                                                                            <span>
                                                                                {isRTL
                                                                                    ? 'إسناد التحضير إلى موظف'
                                                                                    : 'Assigner la préparation à un membre du staff'}
                                                                            </span>
                                                                        </h4>
                                                                        {birthdayData.celebration?.assigned_staff_first_name && (
                                                                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                                                                                {isRTL
                                                                                    ? `✅ مسند إلى ${birthdayData.celebration.assigned_staff_first_name}`
                                                                                    : `✅ Assigné à ${birthdayData.celebration.assigned_staff_first_name}`}
                                                                            </span>
                                                                        )}
                                                                    </div>

                                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                                                        <div>
                                                                            <label className="block text-[11px] font-bold text-gray-600 mb-1">
                                                                                {isRTL ? 'المربي / الموظف :' : 'Éducateur / Staff :'}
                                                                            </label>
                                                                            <select
                                                                                value={selectedStaffId}
                                                                                onChange={(e) => setSelectedStaffId(e.target.value)}
                                                                                className="w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-800"
                                                                            >
                                                                                {(birthdayData.staff_list || []).map((s) => (
                                                                                    <option key={s.id} value={s.id}>
                                                                                        {s.first_name} {s.last_name} ({s.role})
                                                                                    </option>
                                                                                ))}
                                                                            </select>
                                                                        </div>
                                                                        <div>
                                                                            <label className="block text-[11px] font-bold text-gray-600 mb-1">
                                                                                {isRTL ? 'اليوم المعتمد للحفل :' : 'Jour retenu pour la fête :'}
                                                                            </label>
                                                                            <input
                                                                                type="date"
                                                                                value={celebrationDateInput}
                                                                                onChange={(e) => setCelebrationDateInput(e.target.value)}
                                                                                className="w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-800"
                                                                            />
                                                                        </div>
                                                                    </div>

                                                                    <div>
                                                                        <label className="block text-[11px] font-bold text-gray-600 mb-1">
                                                                            {isRTL ? 'تعليمات للموظف :' : 'Instructions pour le staff :'}
                                                                        </label>
                                                                        <textarea
                                                                            rows={2}
                                                                            value={staffTaskNotesInput}
                                                                            onChange={(e) => setStaffTaskNotesInput(e.target.value)}
                                                                            className="w-full rounded-lg border border-gray-300 bg-white p-2 text-xs text-gray-800"
                                                                        />
                                                                    </div>

                                                                    <button
                                                                        type="button"
                                                                        disabled={submittingBirthdayAction}
                                                                        onClick={() => handleBirthdayModalAction('assign_staff')}
                                                                        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:opacity-95 text-white font-bold text-xs sm:text-sm shadow transition disabled:opacity-50"
                                                                    >
                                                                        <UserCheck className="w-4 h-4" />
                                                                        <span>
                                                                            {submittingBirthdayAction
                                                                                ? (isRTL ? 'جارٍ الإسناد...' : 'Assignation en cours...')
                                                                                : (isRTL ? '✅ إسناد للموظف وتأكيد التنظيم' : '✅ Assigner au staff & Valider l’organisation')}
                                                                        </span>
                                                                    </button>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                )}
                                            </>
                                        ) : null}
                                    </div>
                                ) : (
                                    /* ==================== CAS STANDARD (AUTRES TÂCHES / RDV / MÉMOS) ==================== */
                                    <>
                                        {/* Description */}
                                        {cleanedModalDescription && (
                                            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                                                <p className="text-gray-700 dark:text-gray-300 text-sm whitespace-pre-line">
                                                    {isRTL && (task.description === "Validation du dossier d'inscription" || isInscriptionAppointment)
                                                        ? 'استكمال وتثبيت ملف التسجيل والقبول'
                                                        : cleanedModalDescription}
                                                </p>
                                            </div>
                                        )}

                                        {/* Informations */}
                                        <div className="grid grid-cols-2 gap-4">
                                            {/* Date */}
                                            {task.start_date && (
                                                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                                    <Calendar className="w-5 h-5 text-primary-500" />
                                                    <div>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                                            {isRTL ? 'التاريخ' : 'Date'}
                                                        </p>
                                                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                            {formatDate(task.start_date)}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Heure (masquée si tâche de la table tasks à 00:00) */}
                                            {showTaskTime && (
                                                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                                    <Clock className="w-5 h-5 text-primary-500" />
                                                    <div>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                                            {isRTL ? 'الوقت' : 'Heure'}
                                                        </p>
                                                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                            {formattedTaskTime}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Priorité */}
                                            {task.priority && (
                                                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                                    <AlertCircle className="w-5 h-5 text-primary-500" />
                                                    <div>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                                            {isRTL ? 'الأولوية' : 'Priorité'}
                                                        </p>
                                                        <span className={`inline-block text-xs px-2 py-1 rounded-full font-medium ${getPriorityStyle()}`}>
                                                            {getPriorityLabel()}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Personne concernée */}
                                            {(task.metadata?.parent_name || task.assigned_to_name) && (
                                                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                                    <User className="w-5 h-5 text-primary-500" />
                                                    <div>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                                            {task.type === 'appointment'
                                                                ? (isRTL ? 'الولي' : 'Parent')
                                                                : (isRTL ? 'مُكلَّف' : 'Assigné à')
                                                            }
                                                        </p>
                                                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                            {task.metadata?.parent_name || task.assigned_to_name}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Informations spécifiques aux RDV d'inscription */}
                                        {isInscriptionAppointment && (
                                            <div className="space-y-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                                                <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 font-medium">
                                                    <ClipboardCheck className="w-5 h-5" />
                                                    <span>{isRTL ? 'موعد تسجيل' : 'RDV Inscription'}</span>
                                                </div>

                                                {/* Nom de l'enfant */}
                                                {task.metadata?.child_name && (
                                                    <div className="flex items-center gap-3">
                                                        <Baby className="w-4 h-4 text-blue-500" />
                                                        <div>
                                                            <span className="text-xs text-gray-500 dark:text-gray-400">{isRTL ? 'الطفل' : 'Enfant'}: </span>
                                                            <span className="text-sm font-medium text-gray-900 dark:text-white">{task.metadata.child_name}</span>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Téléphone parent */}
                                                {task.metadata?.parent_phone && (
                                                    <div className="flex items-center gap-3">
                                                        <Phone className="w-4 h-4 text-blue-500" />
                                                        <a
                                                            href={`tel:${task.metadata.parent_phone}`}
                                                            className="text-sm text-blue-600 hover:underline"
                                                            dir="ltr"
                                                        >
                                                            {task.metadata.parent_phone}
                                                        </a>
                                                    </div>
                                                )}

                                                {/* Email parent */}
                                                {task.metadata?.parent_email && (
                                                    <div className="flex items-center gap-3">
                                                        <Mail className="w-4 h-4 text-blue-500" />
                                                        <a
                                                            href={`mailto:${task.metadata.parent_email}`}
                                                            className="text-sm text-blue-600 hover:underline"
                                                        >
                                                            {task.metadata.parent_email}
                                                        </a>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Badge URGENT */}
                                        {task.metadata?.is_urgent_appointment && (
                                            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                                                <AlertCircle className="w-5 h-5 text-red-600" />
                                                <span className="text-sm font-medium text-red-700 dark:text-red-400">
                                                    {isRTL ? '🚨 موعد عاجل' : '🚨 Rendez-vous urgent'}
                                                </span>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                            {/* Actions de pied de modal */}
                            <div className="p-5 pt-3 border-t border-gray-100 dark:border-gray-700 flex flex-col gap-2.5 shrink-0 bg-gray-50/50 dark:bg-gray-800">
                                {isBirthdayTask ? (
                                    <div className="flex flex-wrap gap-2.5">
                                        {isStaffPreparationTask && birthdayChildId && (
                                            <button
                                                type="button"
                                                disabled={submittingBirthdayAction || completing}
                                                onClick={() => handleBirthdayModalAction('complete_staff_task')}
                                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white text-xs sm:text-sm font-bold rounded-xl transition-all shadow-sm disabled:opacity-50"
                                            >
                                                <CheckCircle className="w-4 h-4" />
                                                <span>{isRTL ? '✅ تأكيد انتهاء التحضير' : '✅ Marquer la préparation comme terminée'}</span>
                                            </button>
                                        )}

                                        {taskLink && (
                                            <button
                                                type="button"
                                                onClick={handleNavigateToLink}
                                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-rose-50 text-rose-700 border border-rose-300 text-xs sm:text-sm font-bold rounded-xl transition-all"
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                                <span>{isRTL ? '🎂 فتح ملف عيد الميلاد' : '🎂 Ouvrir la fiche d\'anniversaire'}</span>
                                            </button>
                                        )}
                                    </div>
                                ) : autoKind === 'express_child' ? (
                                    <div className="flex gap-3">
                                        <button
                                            onClick={handleNavigateToLink}
                                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold rounded-xl transition-all hover:shadow-lg"
                                        >
                                            <Edit className="w-5 h-5" />
                                            {isRTL ? 'استكمال ملف الطفل' : 'Compléter la fiche enfant'}
                                        </button>
                                    </div>
                                ) : autoKind === 'enrollment_review' ? (
                                    <div className="flex gap-3">
                                        <button
                                            onClick={handleNavigateToLink}
                                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl transition-all hover:shadow-lg"
                                        >
                                            <Eye className="w-5 h-5" />
                                            {isRTL ? 'فحص الملف' : 'Examiner le dossier'}
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        {/* Bouton pour naviguer vers la page liée (si lien présent) */}
                                        {taskLink && (
                                            <button
                                                onClick={handleNavigateToLink}
                                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-medium rounded-xl transition-all hover:shadow-lg"
                                            >
                                                <FileText className="w-5 h-5" />
                                                {isRTL ? 'الذهاب إلى الصفحة' : 'Aller à la page'}
                                            </button>
                                        )}

                                        <div className="flex gap-3">
                                            {/* Bouton spécial pour RDV d'inscription */}
                                            {isInscriptionAppointment && onStartAdmission && (
                                                <button
                                                    onClick={() => {
                                                        onClose();
                                                        onStartAdmission(task);
                                                    }}
                                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-medium rounded-xl transition-all hover:shadow-lg"
                                                >
                                                    <ClipboardCheck className="w-5 h-5" />
                                                    {isRTL ? 'بدء مقابلة القبول' : 'Entretien d\'admission'}
                                                </button>
                                            )}

                                            {/* Bouton Terminer UNIQUEMENT pour les tâches manuelles et mémos */}
                                            {autoKind === 'manual' && task.status !== 'completed' && (
                                                <button
                                                    onClick={handleComplete}
                                                    disabled={completing}
                                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-medium rounded-xl transition-all hover:shadow-lg disabled:opacity-50"
                                                >
                                                    <CheckCircle className="w-5 h-5" />
                                                    {completing
                                                        ? (isRTL ? 'جارٍ...' : 'En cours...')
                                                        : (isRTL ? 'إنهاء' : 'Terminer')
                                                    }
                                                </button>
                                            )}

                                            <button
                                                onClick={handleViewPlanning}
                                                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-primary-500 to-purple-500 hover:from-primary-600 hover:to-purple-600 text-white font-medium rounded-xl transition-all hover:shadow-lg"
                                            >
                                                <CalendarDays className="w-5 h-5" />
                                                {isRTL ? 'جدول المواعيد' : 'Voir le planning'}
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default TaskDetailModal;
