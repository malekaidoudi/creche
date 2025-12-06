import { useState } from 'react';
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
    Tag,
    Phone,
    Mail,
    ClipboardCheck,
    Baby
} from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import { useDialogContext } from '../../contexts/DialogContext';
import api from '../../services/api';
import AppointmentActionModal from './AppointmentActionModal';

/**
 * Modal de détails d'une tâche/mémo/RDV/événement
 * Permet de voir les détails, marquer comme terminé ou accéder au planning
 */
const TaskDetailModal = ({ isOpen, onClose, task, onComplete }) => {
    const { isRTL } = useLanguage();
    const navigate = useNavigate();
    const dialog = useDialogContext();
    const [completing, setCompleting] = useState(false);
    const [showActionModal, setShowActionModal] = useState(false);

    // Vérifier si c'est un RDV d'inscription
    const isInscriptionAppointment = task?.type === 'appointment' && task?.metadata?.is_inscription;

    if (!isOpen || !task) return null;

    // Formater la date
    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
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
        return date.toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Obtenir l'icône selon le type
    const getTypeIcon = () => {
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
        switch (task.type) {
            case 'appointment':
                return isRTL ? 'موعد' : 'Rendez-vous';
            case 'event':
            case 'meeting':
                return isRTL ? 'حدث' : 'Événement';
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
            } else {
                // Pour les autres types
                await api.patch(`/api/events/${task.id}/status`, {
                    status: 'completed'
                });
            }

            dialog.success(isRTL ? 'تم الإنهاء بنجاح' : 'Terminé avec succès');
            onComplete && onComplete(task.id);
            onClose();
        } catch (error) {
            console.error('Erreur:', error);
            dialog.error(error.response?.data?.error || (isRTL ? 'خطأ' : 'Erreur lors de la mise à jour'));
        } finally {
            setCompleting(false);
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
                            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header avec type et icône */}
                            <div className="bg-gradient-to-r from-primary-500 to-primary-600 p-6 text-white">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-white/20 rounded-lg">
                                            {getTypeIcon()}
                                        </div>
                                        <div>
                                            <span className="text-sm opacity-80">{getTypeLabel()}</span>
                                            <h2 className="text-xl font-bold">{task.title}</h2>
                                        </div>
                                    </div>
                                    <button
                                        onClick={onClose}
                                        className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Contenu */}
                            <div className="p-6 space-y-4">
                                {/* Description */}
                                {task.description && (
                                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                                        <p className="text-gray-700 dark:text-gray-300">
                                            {task.description}
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

                                    {/* Heure */}
                                    {task.start_date && (
                                        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                            <Clock className="w-5 h-5 text-primary-500" />
                                            <div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    {isRTL ? 'الوقت' : 'Heure'}
                                                </p>
                                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {formatTime(task.start_date)}
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
                            </div>

                            {/* Actions */}
                            <div className="p-6 pt-0 flex gap-3">
                                {/* Bouton spécial pour RDV d'inscription */}
                                {isInscriptionAppointment ? (
                                    <button
                                        onClick={() => setShowActionModal(true)}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-medium rounded-xl transition-all hover:shadow-lg"
                                    >
                                        <ClipboardCheck className="w-5 h-5" />
                                        {isRTL ? 'التحقق من الموعد' : 'Valider le RDV'}
                                    </button>
                                ) : (
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
                                    {isRTL ? 'عرض التخطيط' : 'Voir le planning'}
                                </button>
                            </div>
                        </div>
                    </motion.div>

                    {/* Modal d'action pour RDV d'inscription */}
                    {showActionModal && isInscriptionAppointment && (
                        <AppointmentActionModal
                            isOpen={showActionModal}
                            onClose={() => setShowActionModal(false)}
                            appointment={{
                                id: parseInt(task.metadata?.appointment_id || task.id.replace('appt-', '')),
                                child_name: task.metadata?.child_name || task.title,
                                parent_name: task.metadata?.parent_name,
                                parent_phone: task.metadata?.parent_phone,
                                parent_email: task.metadata?.parent_email,
                                proposed_date: task.start_date,
                                appointment_type: 'inscription',
                                enrollment_id: task.metadata?.enrollment_id
                            }}
                            onSuccess={() => {
                                onComplete && onComplete(task.id);
                                onClose();
                            }}
                        />
                    )}
                </>
            )}
        </AnimatePresence>
    );
};

export default TaskDetailModal;
