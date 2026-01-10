import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Plus, CheckCircle, XCircle, AlertCircle, Check, Phone, Info } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import api from '../../services/api';
import { useDialogContext } from '../../contexts/DialogContext';
import WidgetCard, { WidgetEmptyState } from '../ui/WidgetCard';

const MyAppointmentsWidget = ({ onRequestAppointment, onRescheduleAppointment }) => {
  const { isRTL } = useLanguage();
  const dialog = useDialogContext();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [crechePhone, setCrechePhone] = useState('');

  useEffect(() => {
    loadAppointments();
    loadCrechePhone();
  }, []);

  const loadCrechePhone = async () => {
    try {
      const response = await api.get('/api/nursery-settings');
      if (response.data?.settings?.phone) {
        setCrechePhone(response.data.settings.phone);
      }
    } catch (error) {
      console.error('Erreur chargement téléphone crèche:', error);
    }
  };

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/appointments');

      if (response.data.success) {
        const allAppointments = response.data.appointments || [];

        // Filtrer: exclure les annulés ET les terminés (mais garder les refusés)
        const activeAppointments = allAppointments.filter(apt => {
          // Exclure les RDV annulés et terminés, mais garder les refusés pour que le parent soit informé
          return apt.status !== 'cancelled' && apt.status !== 'completed';
        });

        // Trier par date (plus proches en premier)
        const sorted = activeAppointments.sort((a, b) => {
          const dateA = new Date(a.confirmed_date || a.proposed_date);
          const dateB = new Date(b.confirmed_date || b.proposed_date);
          return dateA - dateB;
        });

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

  const handleConfirmAppointment = async (appointment) => {
    try {
      // Confirmer avec la date proposée
      const response = await api.patch(`/api/appointments/${appointment.id}/confirm`, {
        confirmed_date: appointment.proposed_date
      });
      if (response.data.success) {
        dialog.success(isRTL ? 'تم تأكيد الموعد' : 'Rendez-vous confirmé avec succès');
        loadAppointments();
      }
    } catch (error) {
      console.error('Erreur confirmation RDV:', error);
      dialog.error(isRTL ? 'خطأ في التأكيد' : 'Erreur lors de la confirmation');
    }
  };

  const handleProposeNewDate = (appointment) => {
    // Ouvrir modal de replanification
    onRescheduleAppointment?.(appointment);
  };

  const getStatusConfig = (status) => {
    const configs = {
      proposed: {
        label: isRTL ? 'في انتظار التأكيد' : 'En attente de validation',
        icon: AlertCircle,
        color: 'text-blue-600 dark:text-blue-400',
        bg: 'bg-blue-50 dark:bg-blue-900/20',
        border: 'border-blue-200 dark:border-blue-800'
      },
      confirmed: {
        label: isRTL ? 'مؤكد' : 'Validé',
        icon: CheckCircle,
        color: 'text-green-600 dark:text-green-400',
        bg: 'bg-green-50 dark:bg-green-900/20',
        border: 'border-green-200 dark:border-green-800'
      },
      rescheduled: {
        label: isRTL ? 'في انتظار التأكيد' : 'En attente de validation',
        icon: AlertCircle,
        color: 'text-orange-600 dark:text-orange-400',
        bg: 'bg-orange-50 dark:bg-orange-900/20',
        border: 'border-orange-200 dark:border-orange-800'
      },
      completed: {
        label: isRTL ? 'مكتمل' : 'Terminé',
        icon: CheckCircle,
        color: 'text-gray-600 dark:text-gray-400',
        bg: 'bg-gray-50 dark:bg-gray-900/20',
        border: 'border-gray-200 dark:border-gray-800'
      },
      cancelled: {
        label: isRTL ? 'ملغى' : 'Annulé',
        icon: XCircle,
        color: 'text-red-600 dark:text-red-400',
        bg: 'bg-red-50 dark:bg-red-900/20',
        border: 'border-red-200 dark:border-red-800'
      },
      failed: {
        label: isRTL ? 'فشل' : 'À reprogrammer',
        icon: AlertCircle,
        color: 'text-orange-600 dark:text-orange-400',
        bg: 'bg-orange-50 dark:bg-orange-900/20',
        border: 'border-orange-200 dark:border-orange-800'
      }
    };
    return configs[status] || configs.proposed;
  };

  // Bouton d'action pour le header
  const headerAction = (
    <button
      onClick={onRequestAppointment}
      className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
      title={isRTL ? 'طلب موعد' : 'Demander un rendez-vous'}
    >
      <Plus className="w-4 h-4" />
    </button>
  );

  return (
    <WidgetCard
      icon={Calendar}
      title={isRTL ? 'مواعيدي' : 'Mes Rendez-vous'}
      subtitle={appointments.length > 0 ? `${appointments.length} ${isRTL ? 'موعد' : 'RDV'}` : null}
      badge={appointments.length || null}
      headerAction={headerAction}
      iconColor="blue"
      loading={loading}
    >
      {appointments.length === 0 ? (
        <div className="text-center py-6">
          <WidgetEmptyState
            icon={Calendar}
            message={isRTL ? 'لا توجد مواعيد مجدولة' : 'Aucun rendez-vous programmé'}
          />
          <button
            onClick={onRequestAppointment}
            className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
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
                      {appointment.subject || appointment.title || (isRTL ? 'موعد' : 'Rendez-vous')}
                    </h4>

                    {appointment.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                        {appointment.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(appointment.confirmed_date || appointment.proposed_date)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{formatTime(appointment.confirmed_date || appointment.proposed_date)}</span>
                      </div>
                    </div>

                    {/* Boutons d'action pour RDV proposé */}
                    {appointment.status === 'proposed' && (
                      <div className="flex items-center gap-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleConfirmAppointment(appointment);
                          }}
                          className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded transition-colors"
                        >
                          <Check className="w-3 h-3" />
                          <span>{isRTL ? 'تأكيد' : 'Valider'}</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleProposeNewDate(appointment);
                          }}
                          className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors"
                        >
                          <Calendar className="w-3 h-3" />
                          <span>{isRTL ? 'تاريخ آخر' : 'Autre date'}</span>
                        </button>
                      </div>
                    )}

                    {/* Message pour RDV en attente de validation (rescheduled) */}
                    {appointment.status === 'rescheduled' && (
                      <div className="mt-3 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                        <div className="flex items-start gap-2">
                          <Info className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-sm text-orange-800 dark:text-orange-300 font-medium">
                              {isRTL ? 'موعدك في انتظار التأكيد' : 'Votre RDV est en attente de validation'}
                            </p>
                            <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                              {isRTL
                                ? 'سيتم الرد عليك قريبًا. للاستفسار، اتصل بالحضانة:'
                                : 'Vous serez informé prochainement. Pour toute question, contactez la crèche :'
                              }
                            </p>
                            {crechePhone && (
                              <a
                                href={`tel:${crechePhone}`}
                                className="inline-flex items-center gap-1 mt-2 text-sm font-semibold text-orange-700 dark:text-orange-300 hover:underline"
                              >
                                <Phone className="w-3 h-3" />
                                {crechePhone}
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Message pour RDV failed (à reprogrammer) */}
                    {appointment.status === 'failed' && (
                      <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <div className="flex items-start gap-2">
                          <XCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-sm text-red-800 dark:text-red-300 font-medium">
                              {isRTL ? 'تم رفض موعدك' : 'Votre RDV a été refusé'}
                            </p>
                            <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                              {isRTL
                                ? 'سنقوم بتحديد موعد جديد قريبًا. إذا كنت ترغب في الاتصال بنا:'
                                : 'Nous allons fixer un nouveau RDV bientôt. Si vous souhaitez nous appeler :'
                              }
                            </p>
                            {crechePhone && (
                              <a
                                href={`tel:${crechePhone}`}
                                className="inline-flex items-center gap-1 mt-2 text-sm font-semibold text-red-700 dark:text-red-300 hover:underline"
                              >
                                <Phone className="w-3 h-3" />
                                {crechePhone}
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </WidgetCard>
  );
};

export default MyAppointmentsWidget;
