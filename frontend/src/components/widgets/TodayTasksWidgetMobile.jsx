import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Clock, ClipboardCheck, User, Phone, CalendarPlus, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useDialogContext } from '../../contexts/DialogContext';
import { useLanguage } from '../../hooks/useLanguage';
import api from '../../services/api';
import LoadingSpinner from '../ui/LoadingSpinner';
import TaskDetailModal from '../modals/TaskDetailModal';
import AppointmentActionModal from '../modals/AppointmentActionModal';

/**
 * Composant de carte mobile unifié pour toutes les tâches
 * Design compact adapté aux petits écrans
 */
const MobileTaskCard = ({ task, index, isRTL, onTaskClick, onValidate, onComplete }) => {
    // Couleurs selon le type
    const getTypeConfig = () => {
        switch (task.type) {
            case 'appointment':
                return task.metadata?.is_inscription
                    ? { border: 'border-blue-500', badge: 'bg-blue-500', icon: '📋', label: isRTL ? 'تسجيل' : 'Inscription' }
                    : { border: 'border-green-500', badge: 'bg-green-500', icon: '📅', label: isRTL ? 'موعد' : 'RDV' };
            case 'birthday':
                return { border: 'border-pink-500', badge: 'bg-pink-500', icon: '🎂', label: isRTL ? 'عيد ميلاد' : 'Anniv.' };
            case 'memo':
                return { border: 'border-purple-500', badge: 'bg-purple-500', icon: '📝', label: isRTL ? 'مذكرة' : 'Mémo' };
            case 'task':
                return { border: 'border-orange-500', badge: 'bg-orange-500', icon: '✅', label: isRTL ? 'مهمة' : 'Tâche' };
            case 'event':
            case 'meeting':
                return { border: 'border-cyan-500', badge: 'bg-cyan-500', icon: '📢', label: isRTL ? 'حدث' : 'Événement' };
            default:
                return { border: 'border-gray-400', badge: 'bg-gray-500', icon: '📌', label: 'Autre' };
        }
    };

    const config = getTypeConfig();
    const time = task.start_date ? new Date(task.start_date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: index * 0.03 }}
        >
            <div
                onClick={() => onTaskClick(task)}
                className={`relative bg-white dark:bg-gray-800 border-l-4 ${config.border} rounded-lg p-3 shadow-sm active:scale-[0.98] transition-transform`}
            >
                {/* Header: Badge type + Heure */}
                <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${config.badge} text-white font-medium`}>
                        {config.icon} {config.label}
                    </span>
                    {time && task.type !== 'birthday' && (
                        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                            <Clock className="w-3 h-3" />
                            {time}
                        </div>
                    )}
                </div>

                {/* Badge URGENT */}
                {task.metadata?.is_urgent_appointment && (
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 font-bold mb-2">
                        🚨 URGENT
                    </span>
                )}

                {/* Titre */}
                <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-1 line-clamp-1">
                    {task.title}
                </h4>

                {/* Infos parent pour RDV */}
                {task.type === 'appointment' && task.metadata?.parent_name && (
                    <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400 mb-2">
                        <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            <span className="truncate max-w-[100px]">{task.metadata.parent_name}</span>
                        </div>
                        {task.metadata?.parent_phone && (
                            <div className="flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                <span dir="ltr">{task.metadata.parent_phone}</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Description pour autres types */}
                {task.type !== 'appointment' && task.description && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mb-2">
                        {task.description}
                    </p>
                )}

                {/* Boutons d'action */}
                <div className="flex items-center gap-2 mt-2">
                    {/* Bouton Valider pour RDV inscription */}
                    {task.type === 'appointment' && task.metadata?.is_inscription && task.status !== 'completed' && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onValidate(task); }}
                            className="flex items-center gap-1 px-2.5 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium rounded-md transition-colors"
                        >
                            <ClipboardCheck className="w-3 h-3" />
                            {isRTL ? 'تحقق' : 'Valider'}
                        </button>
                    )}

                    {/* Bouton Terminer pour autres types */}
                    {task.type !== 'birthday' && task.status !== 'completed' && !(task.type === 'appointment' && task.metadata?.is_inscription) && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onComplete(task); }}
                            className="flex items-center gap-1 px-2.5 py-1 bg-green-500 hover:bg-green-600 text-white text-xs font-medium rounded-md transition-colors"
                        >
                            <CheckCircle className="w-3 h-3" />
                            {isRTL ? 'إنهاء' : 'Terminer'}
                        </button>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

const TodayTasksWidgetMobile = () => {
    const { isRTL } = useLanguage();
    const dialog = useDialogContext();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [showActionModal, setShowActionModal] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState(null);

    useEffect(() => {
        loadTodayTasks();

        const handleTaskUpdate = () => {
            loadTodayTasks();
        };

        window.addEventListener('taskUpdated', handleTaskUpdate);

        return () => {
            window.removeEventListener('taskUpdated', handleTaskUpdate);
        };
    }, []);

    const loadTodayTasks = async () => {
        try {
            setLoading(true);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const eventsResponse = await api.get('/api/events', {
                params: { limit: 50 }
            });

            // NE PAS charger les RDV - ils ont leur propre widget

            if (eventsResponse.data.success) {
                // Filtrer STRICTEMENT pour aujourd'hui et exclure les tâches en retard
                const filtered = (eventsResponse.data.events || []).filter(event => {
                    if (!['task', 'memo', 'event', 'meeting'].includes(event.type)) return false;

                    if (event.metadata && typeof event.metadata === 'object') {
                        if (event.metadata.from_staff === true) return false;
                    }
                    if (event.metadata && typeof event.metadata === 'string') {
                        try {
                            const meta = JSON.parse(event.metadata);
                            if (meta.from_staff === true) return false;
                        } catch (e) { }
                    }

                    if (event.status === 'completed' || event.status === 'cancelled') return false;

                    // Mémos créés aujourd'hui uniquement
                    if (event.type === 'memo') {
                        const createdDate = new Date(event.created_at);
                        createdDate.setHours(0, 0, 0, 0);
                        return createdDate.getTime() === today.getTime();
                    }

                    // Autres types: STRICTEMENT aujourd'hui (pas en retard)
                    const eventDate = new Date(event.start_date);
                    eventDate.setHours(0, 0, 0, 0);

                    return eventDate.getTime() === today.getTime();
                });

                // NE PAS inclure les RDV - ils ont leur propre widget
                // const appointmentTasks = [...];

                // Charger les anniversaires du jour
                let birthdays = [];
                try {
                    const childrenResponse = await api.get('/api/children');
                    if (childrenResponse.data.success) {
                        const todayMonth = today.getMonth() + 1;
                        const todayDay = today.getDate();
                        const todayStr = today.toISOString().split('T')[0];

                        birthdays = (childrenResponse.data.children || [])
                            .filter(child => {
                                if (!child.date_of_birth) return false;
                                const birthDate = new Date(child.date_of_birth);
                                return birthDate.getMonth() + 1 === todayMonth && birthDate.getDate() === todayDay;
                            })
                            .map(child => ({
                                id: `birthday-${child.id}`,
                                type: 'birthday',
                                title: `🎂 Anniversaire de ${child.first_name} ${child.last_name}`,
                                description: `${child.first_name} fête son anniversaire aujourd'hui !`,
                                start_date: todayStr,
                                priority: 'medium',
                                status: 'pending',
                                metadata: { child_id: child.id, child_name: `${child.first_name} ${child.last_name}` }
                            }));
                    }
                } catch (error) {
                    console.log('Erreur chargement anniversaires:', error.message);
                }

                // Combiner SANS les RDV (ils ont leur propre widget)
                const combined = [...filtered, ...birthdays];

                combined.sort((a, b) => {
                    // Par priorité puis par heure
                    const priorityOrder = { high: 0, medium: 1, low: 2 };
                    const priorityDiff = (priorityOrder[a.priority] || 1) - (priorityOrder[b.priority] || 1);
                    if (priorityDiff !== 0) return priorityDiff;
                    return new Date(a.start_date) - new Date(b.start_date);
                });

                setTasks(combined.slice(0, 10));
            }
        } catch (error) {
            console.error('Erreur chargement tâches du jour:', error);
        } finally {
            setLoading(false);
        }
    };

    // Handler pour cliquer sur une tâche
    const handleTaskClick = (task) => {
        setSelectedTask(task);
        setShowDetailModal(true);
    };

    // Handler pour valider un RDV d'inscription
    const handleValidate = (task) => {
        const apptId = task.metadata?.appointment_id || task.id.replace('appt-', '');
        setSelectedAppointment({
            id: parseInt(apptId),
            child_name: task.metadata?.child_name || task.title,
            parent_name: task.metadata?.parent_name,
            parent_phone: task.metadata?.parent_phone,
            parent_email: task.metadata?.parent_email,
            proposed_date: task.start_date,
            appointment_type: 'inscription',
            enrollment_id: task.metadata?.enrollment_id
        });
        setShowActionModal(true);
    };

    // Handler pour terminer une tâche
    const handleComplete = async (task) => {
        try {
            if (task.type === 'appointment') {
                const apptId = task.metadata?.appointment_id || task.id.replace('appt-', '');
                await api.patch(`/api/appointments/${apptId}/status`, { status: 'completed' });
            } else {
                await api.patch(`/api/events/${task.id}/status`, { status: 'completed' });
            }
            dialog.success(isRTL ? 'تم الإنهاء' : 'Terminé !');
            loadTodayTasks();
        } catch (error) {
            console.error('Erreur:', error);
            dialog.error(error.response?.data?.error || (isRTL ? 'خطأ' : 'Erreur'));
        }
    };

    // Handler pour compléter depuis le modal de détails
    const handleCompleteFromModal = async (taskId) => {
        const task = tasks.find(t => t.id === taskId);
        if (task) {
            await handleComplete(task);
        }
        setShowDetailModal(false);
        setSelectedTask(null);
    };

    if (loading) {
        return (
            <div className="flex justify-center py-8">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <div className="p-3">
            {tasks.length === 0 ? (
                <div className="text-center py-6">
                    <Calendar className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                        {isRTL ? 'لا توجد مهام اليوم' : 'Aucune tâche aujourd\'hui'}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        {isRTL ? '🎉 استمتع بيومك!' : 'Profitez de cette journée ! 🎉'}
                    </p>
                </div>
            ) : (
                <div className="space-y-2">
                    {tasks.map((task, index) => (
                        <MobileTaskCard
                            key={task.id}
                            task={task}
                            index={index}
                            isRTL={isRTL}
                            onTaskClick={handleTaskClick}
                            onValidate={handleValidate}
                            onComplete={handleComplete}
                        />
                    ))}

                    {/* Lien voir planning */}
                    <Link
                        to="/dashboard/planning"
                        className="block text-center text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium mt-3 py-2"
                    >
                        {isRTL ? 'عرض التخطيط ←' : 'Voir le planning →'}
                    </Link>
                </div>
            )}

            {/* Modal de détails de tâche */}
            <TaskDetailModal
                isOpen={showDetailModal}
                onClose={() => {
                    setShowDetailModal(false);
                    setSelectedTask(null);
                }}
                task={selectedTask}
                onComplete={handleCompleteFromModal}
            />

            {/* Modal action RDV d'inscription */}
            <AppointmentActionModal
                isOpen={showActionModal}
                onClose={() => {
                    setShowActionModal(false);
                    setSelectedAppointment(null);
                }}
                appointment={selectedAppointment}
                onSuccess={() => {
                    loadTodayTasks();
                    window.dispatchEvent(new Event('taskUpdated'));
                }}
            />
        </div>
    );
};

export default TodayTasksWidgetMobile;
