import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Save, Calendar, Clock, User, MapPin, AlertCircle } from 'lucide-react';
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

const EventForm = () => {
  const { id } = useParams();
  const { isRTL } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const isEdit = !!id;
  const initialDate = location.state?.date || new Date().toISOString().split('T')[0];
  
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [users, setUsers] = useState([]);
  const [children, setChildren] = useState([]);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'memo',
    status: 'pending',
    priority: 'medium',
    start_date: initialDate,
    start_time: '09:00',
    end_date: '',
    end_time: '',
    all_day: false,
    location: '',
    assigned_to: '',
    child_id: '',
    color: '#3B82F6',
    reminder_enabled: true,
    reminder_offset: 60 // 1 heure avant
  });
  
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadUsers();
    loadChildren();
    
    if (isEdit) {
      loadEvent();
    }
  }, [id]);

  const loadUsers = async () => {
    try {
      const response = await api.get('/api/users');
      if (response.data.success && response.data.users) {
        setUsers(response.data.users.filter(u => u.role !== 'parent'));
      } else {
        setUsers([]);
      }
    } catch (error) {
      console.error('Erreur chargement utilisateurs:', error);
      setUsers([]);
    }
  };

  const loadChildren = async () => {
    try {
      const response = await api.get('/api/children');
      if (response.data.success && response.data.children) {
        setChildren(response.data.children);
      } else {
        setChildren([]);
      }
    } catch (error) {
      console.error('Erreur chargement enfants:', error);
      setChildren([]);
    }
  };

  const loadEvent = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/events/${id}`);
      
      if (response.data.success) {
        const event = response.data.event;
        const startDate = new Date(event.start_date);
        const endDate = event.end_date ? new Date(event.end_date) : null;
        
        setFormData({
          title: event.title || '',
          description: event.description || '',
          type: event.type || 'memo',
          status: event.status || 'pending',
          priority: event.priority || 'medium',
          start_date: startDate.toISOString().split('T')[0],
          start_time: event.all_day ? '09:00' : startDate.toTimeString().slice(0, 5),
          end_date: endDate ? endDate.toISOString().split('T')[0] : '',
          end_time: endDate && !event.all_day ? endDate.toTimeString().slice(0, 5) : '',
          all_day: event.all_day || false,
          location: event.location || '',
          assigned_to: event.assigned_to || '',
          child_id: event.child_id || '',
          color: event.color || '#3B82F6',
          reminder_enabled: event.reminder_enabled || false,
          reminder_offset: 60
        });
      }
    } catch (error) {
      console.error('Erreur chargement événement:', error);
      toast.error(isRTL ? 'خطأ في تحميل الحدث' : 'Erreur lors du chargement');
      navigate('/dashboard/events/list');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = isRTL ? 'العنوان مطلوب' : 'Le titre est requis';
    }
    
    if (!formData.start_date) {
      newErrors.start_date = isRTL ? 'تاريخ البدء مطلوب' : 'La date de début est requise';
    }
    
    if (formData.end_date && formData.end_date < formData.start_date) {
      newErrors.end_date = isRTL ? 'تاريخ النهاية يجب أن يكون بعد تاريخ البدء' : 'La date de fin doit être après la date de début';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) {
      toast.error(isRTL ? 'يرجى تصحيح الأخطاء' : 'Veuillez corriger les erreurs');
      return;
    }
    
    try {
      setSaving(true);
      
      // Construire les dates complètes
      const startDateTime = formData.all_day
        ? `${formData.start_date}T00:00:00`
        : `${formData.start_date}T${formData.start_time}:00`;
      
      const endDateTime = formData.end_date
        ? formData.all_day
          ? `${formData.end_date}T23:59:59`
          : `${formData.end_date}T${formData.end_time || formData.start_time}:00`
        : null;
      
      const payload = {
        title: formData.title,
        description: formData.description,
        type: formData.type,
        status: formData.status,
        priority: formData.priority,
        start_date: startDateTime,
        end_date: endDateTime,
        all_day: formData.all_day,
        location: formData.location,
        assigned_to: formData.assigned_to || null,
        child_id: formData.child_id || null,
        color: formData.color,
        reminder_enabled: formData.reminder_enabled,
        reminder_offset: formData.reminder_enabled ? formData.reminder_offset : null
      };
      
      let response;
      if (isEdit) {
        response = await api.put(`/api/events/${id}`, payload);
      } else {
        response = await api.post('/api/events', payload);
      }
      
      if (response.data.success) {
        toast.success(
          isEdit
            ? (isRTL ? 'تم تحديث الحدث' : 'Événement mis à jour')
            : (isRTL ? 'تم إنشاء الحدث' : 'Événement créé')
        );
        navigate(`/dashboard/events/${response.data.event.id}`);
      }
    } catch (error) {
      console.error('Erreur sauvegarde événement:', error);
      toast.error(isRTL ? 'خطأ في الحفظ' : 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/dashboard/events/list')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>{isRTL ? 'رجوع' : 'Retour'}</span>
        </button>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {isEdit
            ? (isRTL ? 'تعديل الحدث' : 'Modifier l\'Événement')
            : (isRTL ? 'حدث جديد' : 'Nouvel Événement')}
        </h1>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {isRTL ? 'العنوان' : 'Titre'} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 ${
                errors.title ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder={isRTL ? 'أدخل عنوان الحدث' : 'Entrez le titre de l\'événement'}
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-500">{errors.title}</p>
            )}
          </div>

          {/* Type and Priority */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {isRTL ? 'النوع' : 'Type'}
              </label>
              <select
                value={formData.type}
                onChange={(e) => handleChange('type', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                {Object.keys(EVENT_TYPE_ICONS).map(type => (
                  <option key={type} value={type}>
                    {EVENT_TYPE_ICONS[type]} {getTypeLabel(type)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {isRTL ? 'الأولوية' : 'Priorité'}
              </label>
              <select
                value={formData.priority}
                onChange={(e) => handleChange('priority', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">{isRTL ? 'منخفضة' : 'Basse'}</option>
                <option value="medium">{isRTL ? 'متوسطة' : 'Moyenne'}</option>
                <option value="high">{isRTL ? 'عالية' : 'Haute'}</option>
                <option value="urgent">{isRTL ? 'عاجلة' : 'Urgente'}</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {isRTL ? 'الوصف' : 'Description'}
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              placeholder={isRTL ? 'أدخل وصف الحدث' : 'Entrez la description de l\'événement'}
            />
          </div>

          {/* All Day Checkbox */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="all_day"
              checked={formData.all_day}
              onChange={(e) => handleChange('all_day', e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="all_day" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {isRTL ? 'طوال اليوم' : 'Toute la journée'}
            </label>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {isRTL ? 'تاريخ البدء' : 'Date de début'} <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => handleChange('start_date', e.target.value)}
                  className={`px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 ${
                    errors.start_date ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                />
                {!formData.all_day && (
                  <input
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => handleChange('start_time', e.target.value)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                )}
              </div>
              {errors.start_date && (
                <p className="mt-1 text-sm text-red-500">{errors.start_date}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {isRTL ? 'تاريخ النهاية' : 'Date de fin'}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => handleChange('end_date', e.target.value)}
                  className={`px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 ${
                    errors.end_date ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                />
                {!formData.all_day && formData.end_date && (
                  <input
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => handleChange('end_time', e.target.value)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                )}
              </div>
              {errors.end_date && (
                <p className="mt-1 text-sm text-red-500">{errors.end_date}</p>
              )}
            </div>
          </div>

          {/* Location, Assigned To, Child */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {isRTL ? 'الموقع' : 'Lieu'}
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => handleChange('location', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                placeholder={isRTL ? 'أدخل الموقع' : 'Entrez le lieu'}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {isRTL ? 'مسند إلى' : 'Assigné à'}
              </label>
              <select
                value={formData.assigned_to}
                onChange={(e) => handleChange('assigned_to', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="">{isRTL ? 'اختر مستخدم' : 'Sélectionner un utilisateur'}</option>
                {users && users.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.first_name} {u.last_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {isRTL ? 'الطفل' : 'Enfant'}
              </label>
              <select
                value={formData.child_id}
                onChange={(e) => handleChange('child_id', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="">{isRTL ? 'اختر طفل' : 'Sélectionner un enfant'}</option>
                {children && children.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.first_name} {c.last_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Reminder */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <div className="flex items-center gap-2 mb-4">
              <input
                type="checkbox"
                id="reminder_enabled"
                checked={formData.reminder_enabled}
                onChange={(e) => handleChange('reminder_enabled', e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="reminder_enabled" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {isRTL ? 'تفعيل التذكير' : 'Activer le rappel'}
              </label>
            </div>

            {formData.reminder_enabled && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {isRTL ? 'إرسال التذكير قبل' : 'Envoyer le rappel'}
                </label>
                <select
                  value={formData.reminder_offset}
                  onChange={(e) => handleChange('reminder_offset', parseInt(e.target.value))}
                  className="w-full md:w-64 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value={15}>{isRTL ? '15 دقيقة قبل' : '15 minutes avant'}</option>
                  <option value={30}>{isRTL ? '30 دقيقة قبل' : '30 minutes avant'}</option>
                  <option value={60}>{isRTL ? '1 ساعة قبل' : '1 heure avant'}</option>
                  <option value={120}>{isRTL ? '2 ساعة قبل' : '2 heures avant'}</option>
                  <option value={1440}>{isRTL ? '1 يوم قبل' : '1 jour avant'}</option>
                  <option value={10080}>{isRTL ? '1 أسبوع قبل' : '1 semaine avant'}</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 rounded-b-lg flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/dashboard/events/list')}
            className="px-6 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
            disabled={saving}
          >
            {isRTL ? 'إلغاء' : 'Annuler'}
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>{isRTL ? 'جاري الحفظ...' : 'Enregistrement...'}</span>
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>{isRTL ? 'حفظ' : 'Enregistrer'}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EventForm;
