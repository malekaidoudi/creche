import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Plus, CheckCircle, XCircle, AlertCircle, Check, X } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import api from '../../services/api';
import toast from 'react-hot-toast';

const MyAppointmentsWidget = ({ onRequestAppointment }) => {
  const { isRTL } = useLanguage();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/appointments');
      
      if (response.data.success) {
        // Trier par date (plus récents en premier)
        const sorted = (response.data.appointments || []).sort((a, b) => 
          new Date(b.scheduled_date) - new Date(a.scheduled_date)
        );
        // Limiter aux 5 prochains RDV
        setAppointments(sorted.slice(0, 5));
      } else {
        setAppointments([]);
      }
    } catch (error) {
      console.error('Erreur chargement rendez-vous:', error);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const handleConfirmAppointment = async (appointmentId) => {
    try {
      const response = await api.patch(`/api/appointments/${appointmentId}/confirm`);
      if (response.data.success) {
        toast.success(isRTL ? 'تم تأكيد الموعد' : 'Rendez-vous confirmé');
        loadAppointments();
      }
    } catch (error) {
      console.error('Erreur confirmation RDV:', error);
      toast.error(isRTL ? 'خطأ في التأكيد' : 'Erreur lors de la confirmation');
    }
  };

  const handleProposeNewDate = (appointmentId) => {
    // Ouvrir modal avec appointmentId pour proposer nouvelle date
    onRequestAppointment(appointmentId);
  };

  const getStatusConfig = (status) => {
    const configs = {
      pending: {
        label: isRTL ? 'قيد الانتظار' : 'En attente',
        icon: AlertCircle,
        color: 'text-yellow-600 dark:text-yellow-400',
        bg: 'bg-yellow-50 dark:bg-yellow-900/20',
        border: 'border-yellow-200 dark:border-yellow-800'
      },
      confirmed: {
        label: isRTL ? 'مؤكد' : 'Confirmé',
        icon: CheckCircle,
        color: 'text-green-600 dark:text-green-400',
        bg: 'bg-green-50 dark:bg-green-900/20',
        border: 'border-green-200 dark:border-green-800'
      },
      cancelled: {
        label: isRTL ? 'ملغى' : 'Annulé',
        icon: XCircle,
        color: 'text-red-600 dark:text-red-400',
        bg: 'bg-red-50 dark:bg-red-900/20',
        border: 'border-red-200 dark:border-red-800'
      },
      completed: {
        label: isRTL ? 'مكتمل' : 'Terminé',
        icon: CheckCircle,
        color: 'text-gray-600 dark:text-gray-400',
        bg: 'bg-gray-50 dark:bg-gray-900/20',
        border: 'border-gray-200 dark:border-gray-800'
      }
    };
    return configs[status] || configs.pending;
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
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
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {isRTL ? 'مواعيدي' : 'Mes Rendez-vous'}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {appointments.length > 0 
                  ? `${appointments.length} ${isRTL ? 'موعد' : 'rendez-vous'}`
                  : isRTL ? 'لا توجد مواعيد' : 'Aucun rendez-vous'
                }
              </p>
            </div>
          </div>
          
          <button
            onClick={onRequestAppointment}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            <span>{isRTL ? 'طلب موعد' : 'Demander un RDV'}</span>
          </button>
        </div>
      </div>

      {/* Appointments List */}
      <div className="p-6">
        {appointments.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {isRTL ? 'لا توجد مواعيد مجدولة' : 'Aucun rendez-vous programmé'}
            </p>
            <button
              onClick={onRequestAppointment}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>{isRTL ? 'طلب موعد' : 'Demander un rendez-vous'}</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {appointments.map((appointment) => {
              const statusConfig = getStatusConfig(appointment.status);
              const StatusIcon = statusConfig.icon;
              
              return (
                <div
                  key={appointment.id}
                  className={`p-4 rounded-lg border-2 ${statusConfig.border} ${statusConfig.bg} transition-all hover:shadow-md`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <StatusIcon className={`w-4 h-4 ${statusConfig.color}`} />
                        <span className={`text-xs font-medium ${statusConfig.color}`}>
                          {statusConfig.label}
                        </span>
                      </div>
                      
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                        {appointment.title || (isRTL ? 'موعد' : 'Rendez-vous')}
                      </h4>
                      
                      {appointment.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                          {appointment.description}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(appointment.scheduled_date)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{formatTime(appointment.scheduled_date)}</span>
                        </div>
                      </div>

                      {/* Boutons d'action pour RDV confirmé */}
                      {appointment.status === 'confirmed' && (
                        <div className="flex items-center gap-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleConfirmAppointment(appointment.id);
                            }}
                            className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded transition-colors"
                          >
                            <Check className="w-3 h-3" />
                            <span>{isRTL ? 'تأكيد' : 'Valider'}</span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleProposeNewDate(appointment.id);
                            }}
                            className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors"
                          >
                            <Calendar className="w-3 h-3" />
                            <span>{isRTL ? 'تاريخ آخر' : 'Autre date'}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyAppointmentsWidget;
