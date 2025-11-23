import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Circle, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useDialogContext } from '../../contexts/DialogContext';
import { useLanguage } from '../../hooks/useLanguage';
import api from '../../services/api';
import LoadingSpinner from '../ui/LoadingSpinner';

const TodayTasksWidgetMobile = () => {
    const { isRTL } = useLanguage();
    const dialog = useDialogContext();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);

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
            const today = new Date().toISOString().split('T')[0];

            const eventsResponse = await api.get('/api/events', {
                params: { limit: 50 }
            });

            let appointments = [];
            try {
                const apptResponse = await api.get('/api/appointments/today');
                if (apptResponse.data.success) {
                    appointments = apptResponse.data.appointments || [];
                }
            } catch (error) {
                console.log('Pas de RDV aujourd\'hui ou erreur:', error.message);
            }

            if (eventsResponse.data.success) {
                const now = new Date();
                now.setHours(0, 0, 0, 0);

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

                    if (event.type === 'memo') return true;

                    const eventDate = new Date(event.start_date);
                    eventDate.setHours(0, 0, 0, 0);

                    return eventDate.getTime() === now.getTime();
                });

                const appointmentTasks = appointments.map(appt => ({
                    id: `appt-${appt.id}`,
                    type: 'appointment',
                    title: appt.subject || 'Rendez-vous',
                    description: appt.description,
                    start_date: appt.confirmed_date || appt.proposed_date,
                    priority: 'high',
                    status: appt.status,
                    metadata: {
                        parent_name: appt.parent_name,
                        appointment_id: appt.id
                    }
                }));

                const combined = [...filtered, ...appointmentTasks];

                combined.sort((a, b) => {
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

    const getPriorityColor = (priority) => {
        switch (priority) {
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

    const getPriorityLabel = (priority) => {
        switch (priority) {
            case 'high':
                return 'Urgent';
            case 'medium':
                return 'Moyen';
            case 'low':
                return 'Bas';
            default:
                return 'Normal';
        }
    };

    const handleCompleteTask = async (task, e) => {
        e.preventDefault();
        e.stopPropagation();
        try {
            await api.patch(`/api/events/${task.id}/status`, {
                status: 'completed'
            });
            dialog.success(task.type === 'memo' ? 'Mémo terminé' : 'Tâche terminée');
            loadTodayTasks();
        } catch (error) {
            console.error('Erreur complète:', error);
            dialog.error(error.response?.data?.error || 'Erreur lors de la mise à jour');
        }
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
                <div className="text-center py-8">
                    <Clock className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                        Aucune tâche prévue aujourd'hui
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        Profitez de cette journée tranquille ! 🎉
                    </p>
                </div>
            ) : (
                <div className="space-y-2">
                    {tasks.map((task, index) => (
                        <motion.div
                            key={task.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                        >
                            <Link
                                to={`/dashboard/events/${task.id}`}
                                className="block"
                            >
                                {/* Style Checklist moderne */}
                                <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors active:scale-[0.98]">
                                    {/* Checkbox/Circle */}
                                    <div className="flex-shrink-0 mt-0.5">
                                        {task.status === 'completed' ? (
                                            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                                        ) : (
                                            <Circle className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                                        )}
                                    </div>

                                    {/* Contenu */}
                                    <div className="flex-1 min-w-0">
                                        {/* Titre */}
                                        <h4 className="font-medium text-gray-900 dark:text-white text-sm line-clamp-2 mb-1">
                                            {task.title}
                                        </h4>

                                        {/* Description */}
                                        {task.description && (
                                            <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1 mb-2">
                                                {task.description}
                                            </p>
                                        )}

                                        {/* Badges */}
                                        <div className="flex items-center gap-2 flex-wrap">
                                            {/* Badge priorité */}
                                            {task.type !== 'appointment' && (
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                                                    {getPriorityLabel(task.priority)}
                                                </span>
                                            )}

                                            {/* Badge type */}
                                            {task.type === 'appointment' && (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                                    📅 RDV
                                                </span>
                                            )}

                                            {task.type === 'event' && (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                                                    📢 Événement
                                                </span>
                                            )}

                                            {/* Nom assigné */}
                                            {task.assigned_to_name && (
                                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                                    👤 {task.assigned_to_name}
                                                </span>
                                            )}

                                            {task.metadata?.parent_name && (
                                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                                    👤 {task.metadata.parent_name}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Bouton Terminer */}
                                    {(task.type === 'memo' || task.type === 'task') && task.status === 'pending' && (
                                        <button
                                            onClick={(e) => handleCompleteTask(task, e)}
                                            className="flex-shrink-0 px-2.5 py-1.5 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white text-xs font-medium rounded-md transition-all hover:shadow-md flex items-center gap-1"
                                            title="Marquer comme terminé"
                                        >
                                            <CheckCircle className="w-3.5 h-3.5" />
                                            <span className="hidden xs:inline">Terminer</span>
                                        </button>
                                    )}
                                </div>
                            </Link>
                        </motion.div>
                    ))}

                    {/* Lien voir toutes */}
                    {tasks.length > 0 && (
                        <Link
                            to="/dashboard/events/calendar?filter=tasks"
                            className="block text-center text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium mt-3 py-2"
                        >
                            Voir toutes les tâches →
                        </Link>
                    )}
                </div>
            )}
        </div>
    );
};

export default TodayTasksWidgetMobile;
