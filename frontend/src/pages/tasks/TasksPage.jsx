import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckSquare,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Plus,
  Edit2,
  Trash2,
  User,
  Filter
} from 'lucide-react';
import axios from 'axios';
import { useLanguage } from '../../hooks/useLanguage';
import api from '../../services/api';
import { useDialogContext } from '../../contexts/DialogContext';
import TaskModal from '../../components/modals/TaskModal';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3003/api';

export default function TasksPage() {
  const { isRTL } = useLanguage();
  const dialog = useDialogContext();
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, in_progress, completed
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [assignedFilter, setAssignedFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all'); // all, today, week, overdue
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  useEffect(() => {
    loadTasks();
    loadUsers();
  }, []);

  const loadTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/events?type=task&limit=100`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        console.log('✅ Tâches chargées:', response.data.events?.length || 0);
        setTasks(response.data.events || []);
      }
    } catch (error) {
      console.error('❌ Erreur chargement tâches:', error);
      dialog.error('Erreur lors du chargement des tâches');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/users?limit=100`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        const staffAndAdmin = response.data.users.filter(
          u => (u.role === 'staff' || u.role === 'admin') && u.is_active
        );
        setUsers(staffAndAdmin);
      }
    } catch (error) {
      console.error('❌ Erreur chargement utilisateurs:', error);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.patch(
        `${API_URL}/events/${taskId}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        dialog.success('Statut mis à jour');
        loadTasks();
      }
    } catch (error) {
      console.error('❌ Erreur mise à jour statut:', error);
      dialog.error('Erreur lors de la mise à jour');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(`${API_URL}/events/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        dialog.success('Tâche supprimée');
        loadTasks();
      }
    } catch (error) {
      console.error('❌ Erreur suppression tâche:', error);
      dialog.error('Erreur lors de la suppression');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'in_progress':
        return <Clock className="w-5 h-5 text-blue-600" />;
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-orange-600" />;
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-orange-100 text-orange-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'En attente',
      in_progress: 'En cours',
      completed: 'Terminée',
      cancelled: 'Annulée'
    };
    return labels[status] || status;
  };

  const getPriorityBadge = (priority) => {
    const badges = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800'
    };
    return badges[priority] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityLabel = (priority) => {
    const labels = {
      high: 'Haute',
      medium: 'Moyenne',
      low: 'Basse'
    };
    return labels[priority] || priority;
  };

  const filteredTasks = tasks.filter(task => {
    // Filtre par statut
    if (filter !== 'all' && task.status !== filter) return false;

    // Filtre par priorité
    if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false;

    // Filtre par assigné
    if (assignedFilter !== 'all' && task.assigned_to !== parseInt(assignedFilter)) return false;

    // Filtre par date
    if (dateFilter !== 'all') {
      const now = new Date();
      const taskDate = task.end_date ? new Date(task.end_date) : null;

      if (dateFilter === 'today') {
        if (!taskDate || taskDate.toDateString() !== now.toDateString()) return false;
      } else if (dateFilter === 'week') {
        if (!taskDate) return false;
        const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        if (taskDate > weekFromNow) return false;
      } else if (dateFilter === 'overdue') {
        if (!taskDate || taskDate >= now || task.status === 'completed' || task.status === 'cancelled') return false;
      }
    }

    return true;
  });

  const isOverdue = (task) => {
    if (task.status === 'completed' || task.status === 'cancelled') return false;
    if (!task.end_date) return false;
    return new Date(task.end_date) < new Date();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        {/* Bouton retour pour dashboard */}
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Retour au Dashboard</span>
        </button>

        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <CheckSquare className="w-8 h-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900">Tâches</h1>
            </div>
            <p className="text-gray-600">
              Gérez et suivez vos tâches quotidiennes
            </p>
          </div>

          {user?.role === 'admin' && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
              Nouvelle tâche
            </button>
          )}
        </div>
      </div>

      {/* Filtres principaux */}
      <div className="mb-6">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
          >
            Toutes ({tasks.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'pending'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
          >
            En attente ({tasks.filter(t => t.status === 'pending').length})
          </button>
          <button
            onClick={() => setFilter('in_progress')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'in_progress'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
          >
            En cours ({tasks.filter(t => t.status === 'in_progress').length})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'completed'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
          >
            Terminées ({tasks.filter(t => t.status === 'completed').length})
          </button>

          {/* Bouton filtres avancés */}
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={`ml-auto flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${showAdvancedFilters
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
          >
            <Filter className="w-4 h-4" />
            Filtres avancés
          </button>
        </div>

        {/* Filtres avancés */}
        {showAdvancedFilters && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Filtre priorité */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priorité
                </label>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Toutes les priorités</option>
                  <option value="high">🔴 Haute</option>
                  <option value="medium">🟡 Moyenne</option>
                  <option value="low">🟢 Basse</option>
                </select>
              </div>

              {/* Filtre assigné */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assigné à
                </label>
                <select
                  value={assignedFilter}
                  onChange={(e) => setAssignedFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Tous les membres</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.first_name} {u.last_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filtre date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Échéance
                </label>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Toutes les dates</option>
                  <option value="today">Aujourd'hui</option>
                  <option value="week">Cette semaine</option>
                  <option value="overdue">En retard</option>
                </select>
              </div>
            </div>

            {/* Bouton réinitialiser */}
            {(priorityFilter !== 'all' || assignedFilter !== 'all' || dateFilter !== 'all') && (
              <button
                onClick={() => {
                  setPriorityFilter('all');
                  setAssignedFilter('all');
                  setDateFilter('all');
                }}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Réinitialiser les filtres
              </button>
            )}
          </div>
        )}
      </div>

      {/* Liste des tâches */}
      {filteredTasks.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <CheckSquare className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600 text-lg">Aucune tâche pour le moment</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTasks.map((task) => {
            const overdue = isOverdue(task);

            return (
              <div
                key={task.id}
                className={`bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow ${overdue ? 'border-l-4 border-red-500' : ''
                  }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3 flex-1">
                    {getStatusIcon(task.status)}
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {task.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(task.status)}`}>
                          {getStatusLabel(task.status)}
                        </span>
                        {task.priority && (
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityBadge(task.priority)}`}>
                            {getPriorityLabel(task.priority)}
                          </span>
                        )}
                        {overdue && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            ⚠️ En retard
                          </span>
                        )}
                        {task.assigned_to_name && (
                          <span className="flex items-center gap-1 text-sm text-gray-600">
                            <User className="w-4 h-4" />
                            {task.assigned_to_name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {task.status !== 'completed' && task.status !== 'cancelled' && (
                      <>
                        {task.status === 'pending' && (
                          <button
                            onClick={() => handleStatusChange(task.id, 'in_progress')}
                            className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 text-sm rounded-lg transition-colors"
                          >
                            Commencer
                          </button>
                        )}
                        {task.status === 'in_progress' && (
                          <button
                            onClick={() => handleStatusChange(task.id, 'completed')}
                            className="px-3 py-1 bg-green-100 hover:bg-green-200 text-green-700 text-sm rounded-lg transition-colors"
                          >
                            Terminer
                          </button>
                        )}
                      </>
                    )}
                    {user?.role === 'admin' && (
                      <>
                        <button
                          onClick={() => setEditingTask(task)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Modifier"
                        >
                          <Edit2 className="w-4 h-4 text-gray-600" />
                        </button>
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Description */}
                {task.description && (
                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed mb-4">
                    {task.description}
                  </p>
                )}

                {/* Dates */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                  {task.start_date && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      Début: {new Date(task.start_date).toLocaleDateString('fr-FR')}
                    </div>
                  )}
                  {task.end_date && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      Échéance: {new Date(task.end_date).toLocaleDateString('fr-FR')}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <TaskModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={loadTasks}
      />

      <TaskModal
        isOpen={!!editingTask}
        onClose={() => setEditingTask(null)}
        task={editingTask}
        onSuccess={loadTasks}
      />
    </div>
  );
}
