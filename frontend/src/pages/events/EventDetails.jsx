import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Calendar, Clock, User, MapPin, AlertCircle,
  Edit, Trash2, MessageSquare, Send, ArrowLeft,
  CheckCircle, X, FileText
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

const EventDetails = () => {
  const { id } = useParams();
  const { isRTL } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [sendingComment, setSendingComment] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Déterminer si l'utilisateur est un parent
  const isParent = user?.role === 'parent';
  const isAdmin = user?.role === 'admin';
  const isStaff = user?.role === 'staff';

  useEffect(() => {
    loadEvent();
  }, [id]);

  const loadEvent = async () => {
    try {
      console.log('🔄 EventDetails - Chargement événement ID:', id);
      setLoading(true);
      const response = await api.get(`/api/events/${id}`);
      console.log('✅ EventDetails - Réponse:', response.data);

      if (response.data.success) {
        setEvent(response.data.event);
      }
    } catch (error) {
      console.error('❌ EventDetails - Erreur chargement événement:', error);
      console.error('❌ EventDetails - Détails:', error.response?.data);
      toast.error(isRTL ? 'خطأ في تحميل الحدث' : 'Erreur lors du chargement');
      // Rediriger selon le rôle
      navigate(isParent ? '/mon-espace/calendar' : '/dashboard/events/calendar');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      const response = await api.patch(`/api/events/${id}/status`, {
        status: newStatus
      });

      if (response.data.success) {
        setEvent(prev => ({ ...prev, status: newStatus }));
        toast.success(isRTL ? 'تم تحديث الحالة' : 'Statut mis à jour');
      }
    } catch (error) {
      console.error('Erreur mise à jour statut:', error);
      toast.error(isRTL ? 'خطأ في تحديث الحالة' : 'Erreur lors de la mise à jour');
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();

    if (!newComment.trim()) return;

    try {
      setSendingComment(true);
      const response = await api.post(`/api/events/${id}/comments`, {
        comment: newComment
      });

      if (response.data.success) {
        setEvent(prev => ({
          ...prev,
          comments: [...(prev.comments || []), response.data.comment]
        }));
        setNewComment('');
        toast.success(isRTL ? 'تم إضافة التعليق' : 'Commentaire ajouté');
      }
    } catch (error) {
      console.error('Erreur ajout commentaire:', error);
      toast.error(isRTL ? 'خطأ في إضافة التعليق' : 'Erreur lors de l\'ajout');
    } finally {
      setSendingComment(false);
    }
  };

  const handleDelete = async () => {
    try {
      const response = await api.delete(`/api/events/${id}`);

      if (response.data.success) {
        toast.success(isRTL ? 'تم حذف الحدث' : 'Événement supprimé');
        navigate('/dashboard/events/list');
      }
    } catch (error) {
      console.error('Erreur suppression événement:', error);
      toast.error(isRTL ? 'خطأ في حذف الحدث' : 'Erreur lors de la suppression');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCommentDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return isRTL ? 'الآن' : 'À l\'instant';
    if (diffMins < 60) return isRTL ? `منذ ${diffMins} دقيقة` : `Il y a ${diffMins} min`;
    if (diffHours < 24) return isRTL ? `منذ ${diffHours} ساعة` : `Il y a ${diffHours}h`;
    if (diffDays < 7) return isRTL ? `منذ ${diffDays} يوم` : `Il y a ${diffDays}j`;

    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400">
            {isRTL ? 'جاري التحميل...' : 'Chargement...'}
          </p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <p className="text-gray-500 dark:text-gray-400 text-lg">
          {isRTL ? 'الحدث غير موجود' : 'Événement introuvable'}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(isParent ? '/mon-espace/calendar' : '/dashboard/events/calendar')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>{isRTL ? 'رجوع' : 'Retour au calendrier'}</span>
          </button>
        </div>

        {/* Event Details */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          {/* Header with icon and title */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-start gap-4">
              <div className="text-5xl">
                {EVENT_TYPE_ICONS[event.type] || '📌'}
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {event.title}
                  </h1>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${STATUS_COLORS[event.status]}`}>
                      {getStatusLabel(event.status)}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${PRIORITY_COLORS[event.priority]}`}>
                      {getPriorityLabel(event.priority)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                    {getTypeLabel(event.type)}
                  </span>
                  <span>•</span>
                  <span>{isRTL ? 'تم الإنشاء' : 'Créé le'} {formatDate(event.created_at)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Description */}
            {event.description && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                  {isRTL ? 'الوصف' : 'Description'}
                </h3>
                <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
                  {event.description}
                </p>
              </div>
            )}

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Date */}
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {isRTL ? 'التاريخ' : 'Date'}
                  </p>
                  <p className="text-gray-900 dark:text-white">
                    {formatDate(event.start_date)}
                    {event.end_date && event.end_date !== event.start_date && (
                      <span> → {formatDate(event.end_date)}</span>
                    )}
                  </p>
                  {event.all_day && (
                    <span className="text-xs text-gray-500">
                      {isRTL ? 'طوال اليوم' : 'Toute la journée'}
                    </span>
                  )}
                </div>
              </div>

              {/* Assigned to */}
              {event.assigned_to_name && (
                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      {isRTL ? 'مسند إلى' : 'Assigné à'}
                    </p>
                    <p className="text-gray-900 dark:text-white">
                      {event.assigned_to_name}
                    </p>
                  </div>
                </div>
              )}

              {/* Location */}
              {event.location && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      {isRTL ? 'الموقع' : 'Lieu'}
                    </p>
                    <p className="text-gray-900 dark:text-white">
                      {event.location}
                    </p>
                  </div>
                </div>
              )}

              {/* Child */}
              {event.child_name && (
                <div className="flex items-start gap-3">
                  <span className="text-xl mt-0.5">👶</span>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      {isRTL ? 'الطفل' : 'Enfant'}
                    </p>
                    <p className="text-gray-900 dark:text-white">
                      {event.child_name}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Status Actions */}
            {event.status !== 'completed' && event.status !== 'cancelled' && (
              <div className="flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {isRTL ? 'تغيير الحالة:' : 'Changer le statut:'}
                </p>
                <div className="flex gap-2">
                  {event.status !== 'in_progress' && (
                    <button
                      onClick={() => handleStatusChange('in_progress')}
                      className="px-3 py-1 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800 text-blue-700 dark:text-blue-300 rounded-lg text-sm transition-colors"
                    >
                      {isRTL ? 'قيد التنفيذ' : 'En cours'}
                    </button>
                  )}
                  <button
                    onClick={() => handleStatusChange('completed')}
                    className="px-3 py-1 bg-green-100 hover:bg-green-200 dark:bg-green-900 dark:hover:bg-green-800 text-green-700 dark:text-green-300 rounded-lg text-sm transition-colors"
                  >
                    <CheckCircle className="w-4 h-4 inline mr-1" />
                    {isRTL ? 'مكتمل' : 'Complété'}
                  </button>
                  <button
                    onClick={() => handleStatusChange('cancelled')}
                    className="px-3 py-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm transition-colors"
                  >
                    {isRTL ? 'إلغاء' : 'Annuler'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bouton Annuler pour les RDV */}
        {event.type === 'rdv' && event.status !== 'cancelled' && (
          <div className="flex justify-end">
            <button
              onClick={() => handleStatusChange('cancelled')}
              className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
            >
              <X className="w-5 h-5" />
              <span>{isRTL ? 'إلغاء الموعد' : 'Annuler le rendez-vous'}</span>
            </button>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                  <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {isRTL ? 'تأكيد الحذف' : 'Confirmer la suppression'}
                </h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {isRTL
                  ? 'هل أنت متأكد من حذف هذا الحدث؟ لا يمكن التراجع عن هذا الإجراء.'
                  : 'Êtes-vous sûr de vouloir supprimer cet événement ? Cette action ne peut pas être annulée.'}
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
                >
                  {isRTL ? 'إلغاء' : 'Annuler'}
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  {isRTL ? 'حذف' : 'Supprimer'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventDetails;
