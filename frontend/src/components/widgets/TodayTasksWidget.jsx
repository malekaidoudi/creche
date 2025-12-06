import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, CheckCircle, Clock, AlertCircle, ChevronRight, CalendarPlus, Plus, FileText, StickyNote, Cake, ClipboardCheck, User, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useDialogContext } from '../../contexts/DialogContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { useLanguage } from '../../hooks/useLanguage';
import api from '../../services/api';
import CreateAppointmentModal from '../modals/CreateAppointmentModal';
import TaskDetailModal from '../modals/TaskDetailModal';
import AppointmentActionModal from '../modals/AppointmentActionModal';
import LoadingSpinner from '../ui/LoadingSpinner';

/**
 * Composant de carte unifié pour toutes les tâches
 * Design inspiré des cartes de RDV avec bordure colorée à gauche
 */
const TaskCard = ({ task, index, isRTL, onTaskClick, onValidate, onComplete, onSchedule }) => {
  // Couleurs selon le type
  const getTypeConfig = () => {
    switch (task.type) {
      case 'appointment':
        return task.metadata?.is_inscription
          ? { bg: 'from-blue-50 to-indigo-50', border: 'border-blue-500', badge: 'bg-blue-500', icon: '📋', label: isRTL ? 'موعد تسجيل' : 'RDV Inscription' }
          : { bg: 'from-green-50 to-emerald-50', border: 'border-green-500', badge: 'bg-green-500', icon: '📅', label: isRTL ? 'موعد' : 'Rendez-vous' };
      case 'birthday':
        return { bg: 'from-pink-50 to-rose-50', border: 'border-pink-500', badge: 'bg-pink-500', icon: '🎂', label: isRTL ? 'عيد ميلاد' : 'Anniversaire' };
      case 'memo':
        return { bg: 'from-purple-50 to-violet-50', border: 'border-purple-500', badge: 'bg-purple-500', icon: '📝', label: isRTL ? 'مذكرة' : 'Mémo' };
      case 'task':
        return { bg: 'from-orange-50 to-amber-50', border: 'border-orange-500', badge: 'bg-orange-500', icon: '✅', label: isRTL ? 'مهمة' : 'Tâche' };
      case 'event':
      case 'meeting':
        return { bg: 'from-cyan-50 to-teal-50', border: 'border-cyan-500', badge: 'bg-cyan-500', icon: '📢', label: isRTL ? 'حدث' : 'Événement' };
      default:
        return { bg: 'from-gray-50 to-slate-50', border: 'border-gray-400', badge: 'bg-gray-500', icon: '📌', label: 'Autre' };
    }
  };

  const config = getTypeConfig();
  const time = task.start_date ? new Date(task.start_date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : null;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <div
        onClick={() => onTaskClick(task)}
        className={`group relative bg-gradient-to-r ${config.bg} dark:from-gray-800 dark:to-gray-750 border-l-4 ${config.border} rounded-xl p-4 hover:shadow-md transition-all cursor-pointer`}
      >
        {/* Badge heure en haut à droite */}
        {time && task.type !== 'birthday' && (
          <div className="absolute top-3 right-3">
            <div className={`flex items-center gap-1 px-2.5 py-1 ${config.badge} text-white text-xs font-bold rounded-full shadow`}>
              <Clock className="w-3 h-3" />
              {time}
            </div>
          </div>
        )}

        {/* Contenu principal */}
        <div className={time && task.type !== 'birthday' ? 'pr-20' : ''}>
          {/* Badge URGENT */}
          {task.metadata?.is_urgent_appointment && (
            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 font-bold mb-2">
              🚨 URGENT
            </span>
          )}

          {/* Type badge */}
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-xs px-2 py-0.5 rounded-full ${config.badge} text-white font-medium`}>
              {config.icon} {config.label}
            </span>
          </div>

          {/* Titre */}
          <h4 className="font-bold text-gray-900 dark:text-white text-base mb-1">
            {task.title}
          </h4>

          {/* Description ou infos parent */}
          {task.type === 'appointment' && task.metadata?.parent_name ? (
            <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-gray-400" />
                <span>{task.metadata.parent_name}</span>
              </div>
              {task.metadata?.parent_phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-gray-400" />
                  <span>{task.metadata.parent_phone}</span>
                </div>
              )}
            </div>
          ) : task.description ? (
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
              {task.description}
            </p>
          ) : null}

          {/* Boutons d'action */}
          <div className="flex items-center gap-2 mt-3">
            {/* Bouton Valider pour RDV inscription */}
            {task.type === 'appointment' && task.metadata?.is_inscription && task.status !== 'completed' && (
              <button
                onClick={(e) => { e.stopPropagation(); onValidate(task); }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white text-xs font-medium rounded-lg transition-all shadow-sm hover:shadow"
              >
                <ClipboardCheck className="w-3.5 h-3.5" />
                {isRTL ? 'التحقق' : 'Valider'}
              </button>
            )}

            {/* Bouton Terminer pour autres types */}
            {task.type !== 'birthday' && task.status !== 'completed' && !(task.type === 'appointment' && task.metadata?.is_inscription) && (
              <button
                onClick={(e) => { e.stopPropagation(); onComplete(task); }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white text-xs font-medium rounded-lg transition-all shadow-sm hover:shadow"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                {isRTL ? 'إنهاء' : 'Terminer'}
              </button>
            )}

            {/* Bouton Fixer date pour RDV urgents */}
            {task.metadata?.is_urgent_appointment && (
              <button
                onClick={(e) => { e.stopPropagation(); onSchedule(task); }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white text-xs font-medium rounded-lg transition-all shadow-sm hover:shadow"
              >
                <CalendarPlus className="w-3.5 h-3.5" />
                {isRTL ? 'تحديد موعد' : 'Fixer date'}
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const TodayTasksWidget = ({ onOpenMemoModal, onOpenTaskModal, onOpenAppointmentModal, isMobileView = false }) => {
  const { isRTL } = useLanguage();
  const dialog = useDialogContext();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);

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
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      today.setHours(0, 0, 0, 0);

      // Charger les tâches, mémos et événements
      const eventsResponse = await api.get('/api/events', {
        params: { limit: 50 }
      });

      // Charger les RDV du jour uniquement
      let appointments = [];
      try {
        const apptResponse = await api.get('/api/appointments/today');
        if (apptResponse.data.success) {
          // Filtrer strictement pour aujourd'hui
          appointments = (apptResponse.data.appointments || []).filter(appt => {
            const apptDate = new Date(appt.confirmed_date || appt.proposed_date);
            apptDate.setHours(0, 0, 0, 0);
            return apptDate.getTime() === today.getTime();
          });
        }
      } catch (error) {
        console.log('Pas de RDV aujourd\'hui:', error.message);
      }

      // Charger les anniversaires du jour
      let birthdays = [];
      try {
        const childrenResponse = await api.get('/api/children');
        if (childrenResponse.data.success) {
          const todayMonth = today.getMonth() + 1;
          const todayDay = today.getDate();

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

      if (eventsResponse.data.success) {
        // Filtrer STRICTEMENT pour aujourd'hui
        const filtered = (eventsResponse.data.events || []).filter(event => {
          // Types acceptés
          if (!['task', 'memo', 'event', 'meeting'].includes(event.type)) return false;

          // Exclure messages staff
          const metadata = typeof event.metadata === 'string'
            ? JSON.parse(event.metadata || '{}')
            : (event.metadata || {});
          if (metadata.from_staff === true) return false;

          // Exclure complétés et annulés
          if (event.status === 'completed' || event.status === 'cancelled') return false;

          // Mémos : inclure les non-complétés créés aujourd'hui
          if (event.type === 'memo') {
            const createdDate = new Date(event.created_at);
            createdDate.setHours(0, 0, 0, 0);
            return createdDate.getTime() === today.getTime();
          }

          // Autres : STRICTEMENT aujourd'hui
          const eventDate = new Date(event.start_date);
          eventDate.setHours(0, 0, 0, 0);
          return eventDate.getTime() === today.getTime();
        });

        // Convertir les RDV
        const appointmentTasks = appointments.map(appt => {
          const isInscription = appt.appointment_type === 'inscription' || appt.enrollment_id;
          return {
            id: `appt-${appt.id}`,
            type: 'appointment',
            title: isInscription
              ? `📋 RDV Inscription: ${appt.child_name || 'Enfant'}`
              : (appt.subject || (isRTL ? 'موعد' : 'Rendez-vous')),
            description: isInscription
              ? `Validation du dossier d'inscription`
              : appt.description,
            start_date: appt.confirmed_date || appt.proposed_date,
            priority: 'high',
            status: appt.status,
            metadata: {
              parent_name: appt.parent_name,
              parent_phone: appt.parent_phone,
              parent_email: appt.parent_email,
              child_name: appt.child_name,
              appointment_id: appt.id,
              enrollment_id: appt.enrollment_id,
              is_inscription: isInscription,
              appointment_type: appt.appointment_type
            }
          };
        });

        // Combiner tout SAUF les RDV (ils ont leur propre widget maintenant)
        const combined = [...filtered, ...birthdays];

        // Trier par heure puis priorité
        combined.sort((a, b) => {
          const timeA = new Date(a.start_date).getTime();
          const timeB = new Date(b.start_date).getTime();
          if (timeA !== timeB) return timeA - timeB;

          const priorityOrder = { high: 0, medium: 1, low: 2 };
          return (priorityOrder[a.priority] || 1) - (priorityOrder[b.priority] || 1);
        });

        setTasks(combined.slice(0, 15)); // Limiter à 15
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

  const getStatusIcon = (status, type) => {
    if (type === 'birthday') {
      return <Cake className="w-4 h-4 text-pink-500" />;
    }
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

  // Ouvrir le modal de détails
  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setShowDetailModal(true);
  };

  // Marquer comme terminé
  const handleCompleteTask = async (taskId) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
    loadTodayTasks();
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
              <TaskCard
                key={task.id}
                task={task}
                index={index}
                isRTL={isRTL}
                onTaskClick={handleTaskClick}
                onValidate={(t) => {
                  const apptId = t.metadata?.appointment_id || t.id.replace('appt-', '');
                  setSelectedAppointment({
                    id: parseInt(apptId),
                    child_name: t.metadata?.child_name || t.title,
                    parent_name: t.metadata?.parent_name,
                    parent_phone: t.metadata?.parent_phone,
                    parent_email: t.metadata?.parent_email,
                    proposed_date: t.start_date,
                    appointment_type: 'inscription',
                    enrollment_id: t.metadata?.enrollment_id
                  });
                  setShowActionModal(true);
                }}
                onComplete={async (t) => {
                  try {
                    if (t.type === 'appointment') {
                      const apptId = t.metadata?.appointment_id || t.id.replace('appt-', '');
                      await api.patch(`/api/appointments/${apptId}/status`, { status: 'completed' });
                    } else {
                      await api.patch(`/api/events/${t.id}/status`, { status: 'completed' });
                    }
                    dialog.success(isRTL ? 'تم الإنهاء' : 'Terminé !');
                    loadTodayTasks();
                  } catch (error) {
                    console.error('Erreur:', error);
                    dialog.error(error.response?.data?.error || (isRTL ? 'خطأ' : 'Erreur'));
                  }
                }}
                onSchedule={(t) => {
                  setSelectedTask(t);
                  setShowAppointmentModal(true);
                }}
              />
            ))}

            {tasks.length > 0 && (
              <Link
                to="/dashboard/planning"
                className="block text-center text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium mt-4 py-2"
              >
                {isRTL ? 'عرض التخطيط الأسبوعي ←' : 'Voir le planning hebdomadaire →'}
              </Link>
            )}
          </div>
        )}
      </CardContent>

      {/* Modal de détails de tâche */}
      <TaskDetailModal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedTask(null);
        }}
        task={selectedTask}
        onComplete={handleCompleteTask}
      />

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
            loadTodayTasks();
          }}
        />
      )}

      {/* Modal action RDV d'inscription (valider/échouer) */}
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
    </Card>
  );
};

export default TodayTasksWidget;
