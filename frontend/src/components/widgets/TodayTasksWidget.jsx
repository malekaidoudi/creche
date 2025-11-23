import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, CheckCircle, Clock, AlertCircle, ChevronRight, CalendarPlus, Plus, FileText, StickyNote } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useDialogContext } from '../../contexts/DialogContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { useLanguage } from '../../hooks/useLanguage';
import api from '../../services/api';
import CreateAppointmentModal from '../modals/CreateAppointmentModal';
import LoadingSpinner from '../ui/LoadingSpinner';

const TodayTasksWidget = ({ onOpenMemoModal, onOpenTaskModal, onOpenAppointmentModal, isMobileView = false }) => {
  const { isRTL } = useLanguage();
  const dialog = useDialogContext();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  useEffect(() => {
    loadTodayTasks();

    // Écouter les événements de mise à jour des tâches
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

      // Charger les tâches, mémos et événements
      // Note: Les mémos seront automatiquement filtrés par utilisateur côté backend
      const eventsResponse = await api.get('/api/events', {
        params: {
          limit: 50
        }
      });

      // Charger aussi les RDV confirmés du jour
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

        // Filtrer pour ne garder que les tâches, mémos et événements actifs
        const filtered = (eventsResponse.data.events || []).filter(event => {
          // Seulement tâches, mémos et événements
          if (!['task', 'memo', 'event', 'meeting'].includes(event.type)) return false;

          // Exclure les messages du staff (ils vont dans le widget Messages Staff)
          if (event.metadata && typeof event.metadata === 'object') {
            if (event.metadata.from_staff === true) return false;
          }
          if (event.metadata && typeof event.metadata === 'string') {
            try {
              const meta = JSON.parse(event.metadata);
              if (meta.from_staff === true) return false;
            } catch (e) { }
          }

          // Exclure les complétés et annulés
          if (event.status === 'completed' || event.status === 'cancelled') return false;

          // Pour les mémos : toujours inclure (pas de date)
          if (event.type === 'memo') return true;

          // Pour les autres : inclure UNIQUEMENT si c'est aujourd'hui (pas les retards)
          const eventDate = new Date(event.start_date);
          eventDate.setHours(0, 0, 0, 0);

          return eventDate.getTime() === now.getTime();
        });

        // Convertir les RDV en format tâche
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

        // Combiner tâches et RDV
        const combined = [...filtered, ...appointmentTasks];

        // Trier par priorité puis date
        combined.sort((a, b) => {
          const priorityOrder = { high: 0, medium: 1, low: 2 };
          const priorityDiff = (priorityOrder[a.priority] || 1) - (priorityOrder[b.priority] || 1);
          if (priorityDiff !== 0) return priorityDiff;
          return new Date(a.start_date) - new Date(b.start_date);
        });

        setTasks(combined.slice(0, 10)); // Limiter à 10
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
        return 'text-red-600 bg-red-50 dark:bg-red-900/20';
      case 'medium':
        return 'text-orange-600 bg-orange-50 dark:bg-orange-900/20';
      case 'low':
        return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20';
      default:
        return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'in_progress':
        return <Clock className="w-4 h-4 text-blue-600" />;
      case 'pending':
        return <AlertCircle className="w-4 h-4 text-orange-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getPriorityLabel = (priority) => {
    switch (priority) {
      case 'high':
        return 'Haute';
      case 'medium':
        return 'Moyenne';
      case 'low':
        return 'Basse';
      default:
        return 'Normal';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Tâches d'aujourd'hui
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      {/* Header masqué en mode mobile (géré par CollapsibleCard) */}
      {!isMobileView && (
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between mb-2">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              <span>Tâches d'aujourd'hui</span>
              <span className="text-sm font-normal text-gray-500">
                ({tasks.length})
              </span>
            </CardTitle>
            <div className="flex items-center gap-1">
              {onOpenMemoModal && (
                <button
                  onClick={onOpenMemoModal}
                  className="flex flex-col items-center gap-0.5 px-2 py-1 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                >
                  <StickyNote className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span className="text-[10px] text-purple-600 dark:text-purple-400 font-medium">Mémo</span>
                </button>
              )}
              {onOpenTaskModal && (
                <button
                  onClick={onOpenTaskModal}
                  className="flex flex-col items-center gap-0.5 px-2 py-1 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                >
                  <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">Tâche</span>
                </button>
              )}
              {onOpenAppointmentModal && (
                <button
                  onClick={onOpenAppointmentModal}
                  className="flex flex-col items-center gap-0.5 px-2 py-1 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                >
                  <CalendarPlus className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <span className="text-[10px] text-green-600 dark:text-green-400 font-medium">RDV</span>
                </button>
              )}
            </div>
          </div>
        </CardHeader>
      )}
      <CardContent className={isMobileView ? 'p-0' : ''}>
        {tasks.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-gray-500 dark:text-gray-400">
              Aucune tâche prévue aujourd'hui
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              Profitez de cette journée tranquille ! 🎉
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((task, index) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Link
                  to={`/dashboard/events/${task.id}`}
                  className="block p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600 hover:shadow-md transition-all bg-white dark:bg-gray-800"
                >
                  <div className="flex items-start space-x-3">
                    <div className="mt-0.5">
                      {getStatusIcon(task.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      {/* Badge URGENT si tâche de RDV */}
                      {task.metadata?.is_urgent_appointment && (
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 font-bold mb-2">
                          🚨 URGENT
                        </span>
                      )}

                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 dark:text-white truncate">
                            {task.title}
                          </h4>
                          {task.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mt-1">
                              {task.description}
                            </p>
                          )}
                        </div>

                        {/* Bouton Terminer intégré pour mémos et tâches */}
                        {(task.type === 'memo' || task.type === 'task') && task.status === 'pending' && (
                          <button
                            onClick={async (e) => {
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
                            }}
                            className="flex-shrink-0 px-3 py-1.5 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white text-xs font-medium rounded-md transition-all hover:shadow-md flex items-center gap-1.5"
                            title="Marquer comme terminé"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            Terminer
                          </button>
                        )}
                      </div>

                      <div className="flex items-center space-x-3 mt-3">
                        {task.type === 'appointment' ? (
                          <>
                            <span className="text-xs px-2 py-1 rounded-full bg-green-50 text-green-600 dark:bg-green-900/20 font-medium">
                              📅 Rendez-vous
                            </span>
                            {task.metadata?.parent_name && (
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                👤 {task.metadata.parent_name}
                              </span>
                            )}
                          </>
                        ) : task.type === 'event' || task.type === 'meeting' ? (
                          <span className="text-xs px-2 py-1 rounded-full bg-orange-50 text-orange-600 dark:bg-orange-900/20 font-medium">
                            📢 Événement
                          </span>
                        ) : (
                          <>
                            <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(task.priority)}`}>
                              {getPriorityLabel(task.priority)}
                            </span>
                            {task.assigned_to_name && (
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                👤 {task.assigned_to_name}
                              </span>
                            )}
                          </>
                        )}
                      </div>

                      {/* Bouton Fixer une date pour tâches urgentes RDV */}
                      {task.metadata?.is_urgent_appointment && (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setSelectedTask(task);
                            setShowAppointmentModal(true);
                          }}
                          className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                          <CalendarPlus className="w-4 h-4" />
                          Fixer une date
                        </button>
                      )}
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}

            {tasks.length > 0 && (
              <Link
                to="/dashboard/events/calendar?filter=tasks"
                className="block text-center text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium mt-4 py-2"
              >
                Voir toutes les tâches →
              </Link>
            )}
          </div>
        )}
      </CardContent>

      {/* Modal création RDV pour tâches urgentes */}
      {showAppointmentModal && selectedTask && (
        <CreateAppointmentModal
          isOpen={showAppointmentModal}
          onClose={() => {
            setShowAppointmentModal(false);
            setSelectedTask(null);
          }}
          prefilledParentId={selectedTask.metadata?.parent_id}
          prefilledDate={selectedTask.metadata?.proposed_date}
          onSuccess={() => {
            loadTodayTasks(); // Recharger pour enlever la tâche
          }}
        />
      )}
    </Card>
  );
};

export default TodayTasksWidget;
