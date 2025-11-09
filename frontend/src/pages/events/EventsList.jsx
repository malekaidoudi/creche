import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  List, Plus, Filter, Search, Calendar, 
  Clock, User, AlertCircle, CheckCircle, X 
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

const EVENT_TYPE_ICONS = {
  memo: '📝',
  task: '✅',
  rdv: '📅',
  birthday: '🎂',
  vacation_reminder: '🏖️',
  medical: '🏥',
  meeting: '👥',
  custom: '⭐'
};

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  in_progress: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
  overdue: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
};

const PRIORITY_COLORS = {
  low: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  medium: 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400',
  high: 'bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-400',
  urgent: 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400'
};

const EventsList = () => {
  const { isRTL } = useLanguage();
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  
  // Filtres
  const [filters, setFilters] = useState({
    search: '',
    type: '',
    status: '',
    priority: '',
    start_date: '',
    end_date: ''
  });

  useEffect(() => {
    loadEvents();
  }, [filters]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      
      const response = await api.get(`/api/events?${params}`);
      
      if (response.data.success) {
        setEvents(response.data.events);
      }
    } catch (error) {
      console.error('Erreur chargement événements:', error);
      toast.error(isRTL ? 'خطأ في تحميل الأحداث' : 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      type: '',
      status: '',
      priority: '',
      start_date: '',
      end_date: ''
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: isRTL ? 'قيد الانتظار' : 'En attente',
      in_progress: isRTL ? 'قيد التنفيذ' : 'En cours',
      completed: isRTL ? 'مكتمل' : 'Complété',
      cancelled: isRTL ? 'ملغى' : 'Annulé',
      overdue: isRTL ? 'متأخر' : 'En retard'
    };
    return labels[status] || status;
  };

  const getPriorityLabel = (priority) => {
    const labels = {
      low: isRTL ? 'منخفضة' : 'Basse',
      medium: isRTL ? 'متوسطة' : 'Moyenne',
      high: isRTL ? 'عالية' : 'Haute',
      urgent: isRTL ? 'عاجلة' : 'Urgente'
    };
    return labels[priority] || priority;
  };

  const getTypeLabel = (type) => {
    const labels = {
      memo: isRTL ? 'مذكرة' : 'Mémo',
      task: isRTL ? 'مهمة' : 'Tâche',
      rdv: isRTL ? 'موعد' : 'RDV',
      birthday: isRTL ? 'عيد ميلاد' : 'Anniversaire',
      vacation_reminder: isRTL ? 'تذكير عطلة' : 'Rappel Vacances',
      medical: isRTL ? 'موعد طبي' : 'RDV Médical',
      meeting: isRTL ? 'اجتماع' : 'Réunion',
      custom: isRTL ? 'مخصص' : 'Personnalisé'
    };
    return labels[type] || type;
  };

  const activeFiltersCount = Object.values(filters).filter(v => v).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
            <List className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {isRTL ? 'قائمة الأحداث' : 'Liste des Événements'}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {events.length} {isRTL ? 'حدث' : 'événement(s)'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              showFilters
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span>{isRTL ? 'فلاتر' : 'Filtres'}</span>
            {activeFiltersCount > 0 && (
              <span className="px-2 py-0.5 bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 rounded-full text-xs font-bold">
                {activeFiltersCount}
              </span>
            )}
          </button>

          {isAdmin() && (
            <button
              onClick={() => navigate('/dashboard/events/new')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>{isRTL ? 'حدث جديد' : 'Nouvel Événement'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {isRTL ? 'بحث' : 'Recherche'}
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  placeholder={isRTL ? 'ابحث عن حدث...' : 'Rechercher un événement...'}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {isRTL ? 'النوع' : 'Type'}
              </label>
              <select
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="">{isRTL ? 'الكل' : 'Tous'}</option>
                <option value="memo">{getTypeLabel('memo')}</option>
                <option value="task">{getTypeLabel('task')}</option>
                <option value="rdv">{getTypeLabel('rdv')}</option>
                <option value="birthday">{getTypeLabel('birthday')}</option>
                <option value="vacation_reminder">{getTypeLabel('vacation_reminder')}</option>
                <option value="medical">{getTypeLabel('medical')}</option>
                <option value="meeting">{getTypeLabel('meeting')}</option>
                <option value="custom">{getTypeLabel('custom')}</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {isRTL ? 'الحالة' : 'Statut'}
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="">{isRTL ? 'الكل' : 'Tous'}</option>
                <option value="pending">{getStatusLabel('pending')}</option>
                <option value="in_progress">{getStatusLabel('in_progress')}</option>
                <option value="completed">{getStatusLabel('completed')}</option>
                <option value="cancelled">{getStatusLabel('cancelled')}</option>
                <option value="overdue">{getStatusLabel('overdue')}</option>
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {isRTL ? 'الأولوية' : 'Priorité'}
              </label>
              <select
                value={filters.priority}
                onChange={(e) => handleFilterChange('priority', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="">{isRTL ? 'الكل' : 'Toutes'}</option>
                <option value="low">{getPriorityLabel('low')}</option>
                <option value="medium">{getPriorityLabel('medium')}</option>
                <option value="high">{getPriorityLabel('high')}</option>
                <option value="urgent">{getPriorityLabel('urgent')}</option>
              </select>
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {isRTL ? 'من تاريخ' : 'Date début'}
              </label>
              <input
                type="date"
                value={filters.start_date}
                onChange={(e) => handleFilterChange('start_date', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* End Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {isRTL ? 'إلى تاريخ' : 'Date fin'}
              </label>
              <input
                type="date"
                value={filters.end_date}
                onChange={(e) => handleFilterChange('end_date', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {activeFiltersCount > 0 && (
            <div className="mt-4 flex justify-end">
              <button
                onClick={clearFilters}
                className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
              >
                <X className="w-4 h-4" />
                <span>{isRTL ? 'مسح الفلاتر' : 'Effacer les filtres'}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Events List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-500 dark:text-gray-400">
                {isRTL ? 'جاري التحميل...' : 'Chargement...'}
              </p>
            </div>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 text-lg font-medium mb-2">
              {isRTL ? 'لا توجد أحداث' : 'Aucun événement'}
            </p>
            <p className="text-gray-400 dark:text-gray-500 text-sm">
              {isRTL ? 'جرب تغيير الفلاتر أو إنشاء حدث جديد' : 'Essayez de modifier les filtres ou créez un nouvel événement'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {events.map((event) => (
              <div
                key={event.id}
                onClick={() => navigate(`/dashboard/events/${event.id}`)}
                className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="text-3xl flex-shrink-0">
                    {EVENT_TYPE_ICONS[event.type] || '📌'}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                          {event.title}
                        </h3>
                        {event.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                            {event.description}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[event.status]}`}>
                          {getStatusLabel(event.status)}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${PRIORITY_COLORS[event.priority]}`}>
                          {getPriorityLabel(event.priority)}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{formatDate(event.start_date)}</span>
                      </div>

                      {event.assigned_to_name && (
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          <span>{event.assigned_to_name}</span>
                        </div>
                      )}

                      {event.location && (
                        <div className="flex items-center gap-1">
                          <span>📍</span>
                          <span>{event.location}</span>
                        </div>
                      )}

                      {event.child_name && (
                        <div className="flex items-center gap-1">
                          <span>👶</span>
                          <span>{event.child_name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EventsList;
