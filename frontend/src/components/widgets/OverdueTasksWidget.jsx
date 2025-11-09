import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

const OverdueTasksWidget = () => {
  const { isRTL } = useLanguage();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    loadOverdueTasks();
  }, []);

  const loadOverdueTasks = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/events/views/overdue');
      
      if (response.data.success) {
        setTasks(response.data.events || []);
      } else {
        setTasks([]);
      }
    } catch (error) {
      console.error('Erreur chargement tâches en retard:', error);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const getDaysOverdue = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now - date;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return isRTL ? 'اليوم' : 'Aujourd\'hui';
    } else if (diffDays === 1) {
      return isRTL ? 'منذ يوم واحد' : 'Depuis 1 jour';
    } else {
      return isRTL ? `منذ ${diffDays} أيام` : `Depuis ${diffDays} jours`;
    }
  };

  const markAsCompleted = async (taskId) => {
    try {
      setProcessingId(taskId);
      
      const response = await api.patch(`/api/events/${taskId}/status`, {
        status: 'completed'
      });
      
      if (response.data.success) {
        toast.success(isRTL ? 'تم إكمال المهمة' : 'Tâche complétée');
        setTasks(tasks.filter(t => t.id !== taskId));
      }
    } catch (error) {
      console.error('Erreur marquage tâche:', error);
      toast.error(isRTL ? 'خطأ في تحديث المهمة' : 'Erreur lors de la mise à jour');
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {isRTL ? 'المهام المتأخرة' : 'Tâches en Retard'}
          </h3>
        </div>
        <div className="space-y-3">
          {[1, 2].map(i => (
            <div key={i} className="animate-pulse">
              <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {isRTL ? 'المهام المتأخرة' : 'Tâches en Retard'}
              </h3>
              {tasks.length > 0 && (
                <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                  {tasks.length} {isRTL ? 'مهمة متأخرة' : `tâche${tasks.length > 1 ? 's' : ''} en retard`}
                </p>
              )}
            </div>
          </div>
          
          {tasks.length > 0 && (
            <button
              onClick={() => navigate('/dashboard/tasks/kanban')}
              className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium flex items-center gap-1"
            >
              {isRTL ? 'عرض الكل' : 'Voir tout'}
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Tasks List */}
      <div className="p-6">
        {tasks.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400 font-medium">
              {isRTL ? 'رائع! لا توجد مهام متأخرة' : 'Super ! Aucune tâche en retard'}
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              {isRTL ? 'استمر في العمل الجيد' : 'Continuez comme ça'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="relative overflow-hidden rounded-lg border-2 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4 hover:shadow-md transition-shadow"
              >
                {/* Warning stripe */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 to-orange-500"></div>
                
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className="flex-shrink-0 mt-1">
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 
                        className="font-medium text-gray-900 dark:text-white cursor-pointer hover:text-red-600 dark:hover:text-red-400"
                        onClick={() => navigate(`/dashboard/events/${task.id}`)}
                      >
                        {task.title}
                      </h4>
                    </div>

                    {task.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                        {task.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1 text-red-600 dark:text-red-400 font-medium">
                        <span>⏰</span>
                        <span>{getDaysOverdue(task.end_date || task.start_date)}</span>
                      </div>

                      {task.assigned_to_name && (
                        <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                          <span>👤</span>
                          <span className="truncate">{task.assigned_to_name}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={() => markAsCompleted(task.id)}
                    disabled={processingId === task.id}
                    className="flex-shrink-0 p-2 bg-green-100 hover:bg-green-200 dark:bg-green-900 dark:hover:bg-green-800 text-green-600 dark:text-green-400 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title={isRTL ? 'وضع علامة كمكتمل' : 'Marquer comme complété'}
                  >
                    {processingId === task.id ? (
                      <div className="w-5 h-5 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <CheckCircle className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {tasks.length > 0 && (
        <div className="px-6 py-3 bg-red-50 dark:bg-red-900/20 border-t border-red-200 dark:border-red-800 rounded-b-lg">
          <button
            onClick={() => navigate('/dashboard/tasks/kanban')}
            className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium w-full text-center"
          >
            {isRTL ? 'إدارة جميع المهام' : 'Gérer toutes les tâches'}
          </button>
        </div>
      )}
    </div>
  );
};

export default OverdueTasksWidget;
