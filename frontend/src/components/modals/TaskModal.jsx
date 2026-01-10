import { useState, useEffect, useRef } from 'react';
import { X, Calendar, Clock, User, AlertCircle, FileText } from 'lucide-react';
import api from '../../services/api';
import { useDialogContext } from '../../contexts/DialogContext';
import DatePicker from '../ui/DatePicker';
import { convertToISO, convertFromISO } from '../../utils/dateUtils';

export default function TaskModal({ isOpen, onClose, onSuccess, task = null }) {
  const dialog = useDialogContext();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const firstInputRef = useRef(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    assigned_to: '',
    start_date: '',
    end_date: ''
  });

  const isEditMode = !!task;

  useEffect(() => {
    if (isOpen) {
      loadUsers();
      if (task) {
        // Pré-remplir le formulaire en mode édition
        setFormData({
          title: task.title || '',
          description: task.description || '',
          priority: task.priority || 'medium',
          assigned_to: task.assigned_to || '',
          start_date: task.start_date ? convertFromISO(task.start_date.split('T')[0]) : '',
          end_date: task.end_date ? convertFromISO(task.end_date.split('T')[0]) : ''
        });
      } else {
        // Réinitialiser en mode création
        setFormData({
          title: '',
          description: '',
          priority: 'medium',
          assigned_to: '',
          start_date: '',
          end_date: ''
        });
      }
      setTimeout(() => firstInputRef.current?.focus(), 100);
    }
  }, [isOpen, task]);

  const loadUsers = async () => {
    try {
      const response = await api.get('/api/users?limit=100');

      if (response.data.success) {
        // Filtrer uniquement staff et admin
        const staffAndAdmin = response.data.users.filter(
          u => (u.role === 'staff' || u.role === 'admin') && u.is_active
        );
        setUsers(staffAndAdmin);
      }
    } catch (error) {
      console.error('❌ Erreur chargement utilisateurs:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.title.trim()) {
      dialog.error('Le titre est requis');
      return;
    }

    if (!formData.assigned_to) {
      dialog.error('Veuillez assigner la tâche à quelqu\'un');
      return;
    }

    try {
      setLoading(true);

      // Utiliser la table TASKS (pas events) pour les tâches
      const payload = {
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        assigned_to: parseInt(formData.assigned_to),
        due_date: formData.start_date ? `${convertToISO(formData.start_date)}T00:00:00` : new Date().toISOString()
      };

      let response;
      if (isEditMode) {
        // Modification - utiliser /api/tasks/:id
        response = await api.patch(`/api/tasks/${task.id}`, payload);
      } else {
        // Création - utiliser /api/tasks
        response = await api.post('/api/tasks', payload);
      }

      if (response.data.success) {
        dialog.success(isEditMode ? 'Tâche modifiée avec succès' : 'Tâche créée avec succès');
        // Émettre un événement pour rafraîchir les widgets
        window.dispatchEvent(new CustomEvent('taskUpdated'));
        onSuccess?.();
        onClose();
      }
    } catch (error) {
      console.error('❌ Erreur:', error);
      dialog.error(error.response?.data?.error || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isEditMode ? 'Modifier la tâche' : 'Nouvelle tâche'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-900 dark:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Titre */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <FileText className="w-4 h-4" />
              Titre *
            </label>
            <input
              ref={firstInputRef}
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ex: Préparer la réunion, Contacter les parents..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <FileText className="w-4 h-4" />
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Détails de la tâche..."
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Priorité */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <AlertCircle className="w-4 h-4" />
              Priorité *
            </label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="low">🟢 Basse</option>
              <option value="medium">🟡 Moyenne</option>
              <option value="high">🔴 Haute</option>
            </select>
          </div>

          {/* Assigné à */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <User className="w-4 h-4" />
              Assigner à *
            </label>
            <select
              value={formData.assigned_to}
              onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Sélectionner un membre</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.first_name} {user.last_name} ({user.role === 'admin' ? 'Directeur' : 'Personnel'})
                </option>
              ))}
            </select>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DatePicker
              label="Date de début"
              value={formData.start_date}
              onChange={(value) => setFormData({ ...formData, start_date: value })}
            />
            <DatePicker
              label="Date d'échéance"
              value={formData.end_date}
              onChange={(value) => setFormData({ ...formData, end_date: value })}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Enregistrement...
                </>
              ) : (
                isEditMode ? 'Modifier' : 'Créer la tâche'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
