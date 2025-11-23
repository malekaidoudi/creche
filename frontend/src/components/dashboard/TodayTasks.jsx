import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Clock,
  Plus,
  CheckCircle2,
  Circle,
  Phone,
  Mail,
  User,
  RefreshCw,
  Trash2,
  AlertCircle,
  Flag,
  X
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';
import api from '../../services/api';
import { useDialogContext } from '../../contexts/DialogContext';

const TodayTasks = () => {
  const { isRTL } = useLanguage();
  const dialog = useDialogContext();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    task_time: '',
    priority: 'normal'
  });

  useEffect(() => {
    fetchTasks();

    // Rafraîchir toutes les 5 minutes
    const interval = setInterval(fetchTasks, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await api.get('/api/tasks/today');
      if (response.data.success) {
        setTasks(response.data.tasks);
      }
    } catch (error) {
      console.error('Erreur chargement tâches:', error);
      dialog.error(isRTL ? 'خطأ في تحميل المهام' : 'Erreur lors du chargement des tâches');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();

    if (!newTask.title.trim()) {
      dialog.error(isRTL ? 'يرجى إدخال عنوان المهمة' : 'Veuillez entrer un titre');
      return;
    }

    try {
      const today = new Date().toISOString().split('T')[0];

      const response = await api.post('/api/tasks', {
        title: newTask.title,
        description: newTask.description,
        task_date: today,
        task_time: newTask.task_time || null,
        priority: newTask.priority
      });

      if (response.data.success) {
        dialog.success(isRTL ? 'تم إضافة المهمة بنجاح' : 'Tâche ajoutée avec succès');
        setShowAddModal(false);
        setNewTask({ title: '', description: '', task_time: '', priority: 'normal' });
        fetchTasks();
      }
    } catch (error) {
      console.error('Erreur ajout tâche:', error);
      dialog.error(isRTL ? 'خطأ في إضافة المهمة' : 'Erreur lors de l\'ajout');
    }
  };

  const handleToggleStatus = async (task) => {
    if (task.type === 'appointment') return; // Ne pas modifier les RDV

    const newStatus = task.status === 'completed' ? 'pending' : 'completed';

    try {
      const response = await api.patch(`/api/tasks/${task.id}/status`, {
        status: newStatus
      });

      if (response.data.success) {
        dialog.success(isRTL ? 'تم التحديث' : 'Statut mis à jour');
        fetchTasks();
      }
    } catch (error) {
      console.error('Erreur mise à jour:', error);
      dialog.error(isRTL ? 'خطأ في تحميل المهام' : 'Erreur lors du chargement des tâches');
    }
  };

  const handleDeleteTask = async (taskId) => {
    const confirmed = await dialog.confirm(
      isRTL ? 'هل أنت متأكد من حذف هذه المهمة؟' : 'Êtes-vous sûr de vouloir supprimer cette tâche ?',
      isRTL ? 'تأكيد الحذف' : 'Confirmer la suppression',
      { type: 'danger', confirmText: isRTL ? 'حذف' : 'Supprimer', cancelText: isRTL ? 'إلغاء' : 'Annuler' }
    );

    if (!confirmed) return;

    try {
      const response = await api.delete(`/api/tasks/${taskId}`);
      if (response.data.success) {
        dialog.success(isRTL ? 'تم حذف المهمة' : 'Tâche supprimée');
        fetchTasks();
      }
    } catch (error) {
      console.error('Erreur suppression:', error);
      dialog.error(isRTL ? 'خطأ في الحذف' : 'Erreur lors de la suppression');
    }
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'text-gray-500 bg-gray-100',
      normal: 'text-blue-500 bg-blue-100',
      high: 'text-orange-500 bg-orange-100',
      urgent: 'text-red-500 bg-red-100'
    };
    return colors[priority] || colors.normal;
  };

  const getPriorityLabel = (priority) => {
    const labels = {
      low: isRTL ? 'منخفضة' : 'Basse',
      normal: isRTL ? 'عادية' : 'Normale',
      high: isRTL ? 'عالية' : 'Haute',
      urgent: isRTL ? 'عاجلة' : 'Urgente'
    };
    return labels[priority] || labels.normal;
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-center">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {isRTL ? 'مهام اليوم' : 'Les tâches d\'aujourd\'hui'}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {new Date().toLocaleDateString('fr-FR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long'
              })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchTasks}
            className="p-2 hover:bg-white/50 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title={isRTL ? 'تحديث' : 'Actualiser'}
          >
            <RefreshCw className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg"
          >
            <Plus className="w-5 h-5" />
            <span className="font-medium">{isRTL ? 'إضافة مهمة' : 'Ajouter'}</span>
          </button>
        </div>
      </div>

      {/* Liste des tâches */}
      {tasks.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            {isRTL ? 'لا توجد مهام اليوم' : 'Aucune tâche pour aujourd\'hui'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {tasks.map((task, index) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className={`bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm hover:shadow-md transition-all ${task.status === 'completed' ? 'opacity-60' : ''
                  }`}
              >
                <div className="flex items-start gap-4">
                  {/* Checkbox / Status */}
                  <button
                    onClick={() => handleToggleStatus(task)}
                    disabled={task.type === 'appointment'}
                    className={`mt-1 ${task.type === 'appointment' ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    {task.status === 'completed' ? (
                      <CheckCircle2 className="w-6 h-6 text-green-500" />
                    ) : (
                      <Circle className="w-6 h-6 text-gray-300 hover:text-blue-500 transition-colors" />
                    )}
                  </button>

                  {/* Contenu */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1">
                        <h3 className={`font-semibold text-gray-900 dark:text-white ${task.status === 'completed' ? 'line-through' : ''
                          }`}>
                          {task.title}
                        </h3>
                        {task.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {task.description}
                          </p>
                        )}
                      </div>

                      {/* Heure */}
                      {task.time && (
                        <div className="flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-semibold whitespace-nowrap">
                          <Clock className="w-4 h-4" />
                          <span>{task.time}</span>
                        </div>
                      )}
                    </div>

                    {/* Badges et actions */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Type */}
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${task.type === 'appointment'
                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                        }`}>
                        {task.type === 'appointment' ? (
                          <>
                            <User className="w-3 h-3" />
                            {isRTL ? 'موعد' : 'RDV'}
                          </>
                        ) : (
                          <>
                            <Flag className="w-3 h-3" />
                            {getPriorityLabel(task.priority)}
                          </>
                        )}
                      </span>

                      {/* Contact pour RDV */}
                      {task.type === 'appointment' && task.contact && (
                        <>
                          {task.contact.phone && (
                            <a
                              href={`tel:${task.contact.phone}`}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 rounded-full text-xs font-medium hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                            >
                              <Phone className="w-3 h-3" />
                              {task.contact.phone}
                            </a>
                          )}
                          {task.contact.email && (
                            <a
                              href={`mailto:${task.contact.email}`}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded-full text-xs font-medium hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                            >
                              <Mail className="w-3 h-3" />
                              {task.contact.email}
                            </a>
                          )}
                        </>
                      )}

                      {/* Bouton supprimer pour tâches personnalisées */}
                      {task.type === 'custom' && (
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="ml-auto p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                          title={isRTL ? 'حذف' : 'Supprimer'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Modal Ajout Tâche */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {isRTL ? 'إضافة مهمة جديدة' : 'Nouvelle tâche'}
                </h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddTask} className="space-y-4">
                {/* Titre */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {isRTL ? 'العنوان' : 'Titre'} *
                  </label>
                  <input
                    type="text"
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={isRTL ? 'مثال: اتصال بولي الأمر' : 'Ex: Appeler un parent'}
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {isRTL ? 'الوصف' : 'Description'}
                  </label>
                  <textarea
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={isRTL ? 'تفاصيل إضافية...' : 'Détails supplémentaires...'}
                  />
                </div>

                {/* Heure */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {isRTL ? 'الوقت' : 'Heure'}
                  </label>
                  <input
                    type="time"
                    value={newTask.task_time}
                    onChange={(e) => setNewTask({ ...newTask, task_time: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Priorité */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {isRTL ? 'الأولوية' : 'Priorité'}
                  </label>
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="low">{isRTL ? 'منخفضة' : 'Basse'}</option>
                    <option value="normal">{isRTL ? 'عادية' : 'Normale'}</option>
                    <option value="high">{isRTL ? 'عالية' : 'Haute'}</option>
                    <option value="urgent">{isRTL ? 'عاجلة' : 'Urgente'}</option>
                  </select>
                </div>

                {/* Boutons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    {isRTL ? 'إلغاء' : 'Annuler'}
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg"
                  >
                    {isRTL ? 'إضافة' : 'Ajouter'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TodayTasks;
