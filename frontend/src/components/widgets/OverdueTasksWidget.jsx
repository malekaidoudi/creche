import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle, ChevronRight, Clock, RefreshCw, MessageSquare } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../hooks/useLanguage';
import { useAuth } from '../../hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import api from '../../services/api';
import { useDialogContext } from '../../contexts/DialogContext';
import TaskDetailModal from '../modals/TaskDetailModal';

const OverdueTasksWidget = () => {
  const { isRTL } = useLanguage();
  const { user, isAdmin } = useAuth();
  const dialog = useDialogContext();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Ouvrir la conversation avec le staff assigné
  const openStaffConversation = (task) => {
    if (task.assigned_to) {
      navigate(`/dashboard/messages?user=${task.assigned_to}`);
    }
  };

  // Déterminer les actions disponibles pour une tâche
  // - Tâche assignée au directeur (admin) -> bouton Terminé
  // - Tâche assignée à un staff -> bouton Message (pour admin uniquement)
  const getTaskActions = (task) => {
    // Si l'utilisateur actuel est admin
    if (isAdmin()) {
      // Tâche assignée à un staff (pas admin) -> bouton message seulement
      if (task.assigned_to && task.assigned_to_role === 'staff') {
        return { showMessage: true, showComplete: false };
      }
      // Tâche assignée au directeur ou non assignée -> bouton terminé
      return { showMessage: false, showComplete: true };
    }
    // Pour les autres rôles, pas d'actions (ne devrait pas arriver car widget admin only)
    return { showMessage: false, showComplete: false };
  };

  useEffect(() => {
    loadOverdueTasks();
  }, []);

  const loadOverdueTasks = async (showToast = false) => {
    try {
      if (showToast) setRefreshing(true);
      else setLoading(true);

      const response = await api.get('/api/events/views/overdue');

      if (response.data.success) {
        setTasks((response.data.events || []).slice(0, 10)); // Limiter à 10
      } else {
        setTasks([]);
      }
    } catch (error) {
      console.error('Erreur chargement tâches en retard:', error);
      setTasks([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setShowDetailModal(true);
  };

  const handleTaskUpdate = () => {
    loadOverdueTasks();
    setShowDetailModal(false);
  };

  const getDaysOverdue = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now - date;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return isRTL ? 'اليوم' : 'Aujourd\'hui';
    } else if (diffDays === 1) {
      return isRTL ? 'يوم واحد' : '1 jour';
    } else if (diffDays === 2) {
      return isRTL ? 'يومين' : '2 jours';
    } else if (diffDays < 11) {
      return isRTL ? `${diffDays} أيام` : `${diffDays} jours`;
    } else {
      return isRTL ? `${diffDays} يوم` : `${diffDays} jours`;
    }
  };

  const markAsCompleted = async (taskId) => {
    try {
      setProcessingId(taskId);

      const response = await api.patch(`/api/events/${taskId}/status`, {
        status: 'completed'
      });

      if (response.data.success) {
        dialog.success(isRTL ? 'تم إكمال المهمة' : 'Tâche complétée');
        setTasks(tasks.filter(t => t.id !== taskId));
      }
    } catch (error) {
      console.error('Erreur marquage tâche:', error);
      dialog.error(isRTL ? 'خطأ في تحديث المهمة' : 'Erreur lors de la mise à jour');
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            {isRTL ? 'المهام المتأخرة' : 'Tâches en Retard'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse h-14 bg-gray-100 dark:bg-gray-700 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="h-full">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              {isRTL ? 'المهام المتأخرة' : 'Tâches en Retard'}
              {tasks.length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-xs font-bold rounded-full">
                  {tasks.length}
                </span>
              )}
            </CardTitle>
            <button
              onClick={() => loadOverdueTasks(true)}
              disabled={refreshing}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <RefreshCw className={`w-4 h-4 text-gray-500 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </CardHeader>
        <CardContent>
          {tasks.length === 0 ? (
            <div className="text-center py-6">
              <CheckCircle className="w-10 h-10 mx-auto text-green-500 mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                {isRTL ? 'رائع! لا توجد مهام متأخرة' : 'Aucune tâche en retard'}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                {isRTL ? 'استمر في العمل الجيد' : 'Continuez comme ça !'}
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[280px] overflow-y-auto">
              {tasks.map((task, index) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleTaskClick(task)}
                  className="group p-3 rounded-lg border-l-4 border-red-500 bg-red-50 dark:bg-red-900/20 cursor-pointer transition-all hover:shadow-sm hover:bg-red-100 dark:hover:bg-red-900/30"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      {/* Titre */}
                      <h4 className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                        {task.title}
                      </h4>

                      {/* Retard */}
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-red-500 text-white font-medium">
                          ⏰ {getDaysOverdue(task.end_date || task.start_date)}
                        </span>
                        {task.assigned_to_name && (
                          <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            👤 {task.assigned_to_name}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions selon l'assignation */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {(() => {
                        const actions = getTaskActions(task);
                        return (
                          <>
                            {/* Bouton message si tâche assignée à un staff */}
                            {actions.showMessage && (
                              <button
                                onClick={(e) => { e.stopPropagation(); openStaffConversation(task); }}
                                className="p-1.5 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/50 dark:hover:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-lg transition-colors"
                                title={isRTL ? 'مراسلة' : `Contacter ${task.assigned_to_name || 'le staff'}`}
                              >
                                <MessageSquare className="w-4 h-4" />
                              </button>
                            )}
                            {/* Bouton compléter si tâche assignée au directeur ou non assignée */}
                            {actions.showComplete && (
                              <button
                                onClick={(e) => { e.stopPropagation(); markAsCompleted(task.id); }}
                                disabled={processingId === task.id}
                                className="p-1.5 bg-green-100 hover:bg-green-200 dark:bg-green-900/50 dark:hover:bg-green-900 text-green-600 dark:text-green-400 rounded-lg transition-colors"
                                title={isRTL ? 'إكمال' : 'Terminer'}
                              >
                                {processingId === task.id ? (
                                  <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <CheckCircle className="w-4 h-4" />
                                )}
                              </button>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de détails */}
      {showDetailModal && selectedTask && (
        <TaskDetailModal
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          task={selectedTask}
          onUpdate={handleTaskUpdate}
        />
      )}
    </>
  );
};

export default OverdueTasksWidget;
