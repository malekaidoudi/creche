import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, User, RefreshCw, ChevronRight } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import { useDialogContext } from '../../contexts/DialogContext';
import api from '../../services/api';
import AppointmentActionModal from '../modals/AppointmentActionModal';
import WidgetCard, { WidgetEmptyState } from '../ui/WidgetCard';

/**
 * Widget affichant les rendez-vous d'aujourd'hui
 * Design compact et responsive
 */
const TodayAppointmentsWidget = () => {
    const { isRTL } = useLanguage();
    const dialog = useDialogContext();
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [showActionModal, setShowActionModal] = useState(false);

    const loadAppointments = async (showToast = false) => {
        try {
            if (showToast) setRefreshing(true);

            const response = await api.get('/api/appointments/today');

            if (response.data.success) {
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                // Filtrer strictement pour aujourd'hui
                const todayAppts = (response.data.appointments || []).filter(appt => {
                    const apptDate = new Date(appt.confirmed_date || appt.proposed_date);
                    apptDate.setHours(0, 0, 0, 0);
                    return apptDate.getTime() === today.getTime();
                });

                // Trier par heure
                todayAppts.sort((a, b) => {
                    const timeA = new Date(a.confirmed_date || a.proposed_date).getTime();
                    const timeB = new Date(b.confirmed_date || b.proposed_date).getTime();
                    return timeA - timeB;
                });

                setAppointments(todayAppts);
            }
        } catch (error) {
            console.error('Erreur chargement RDV:', error);
            if (showToast) {
                dialog.error(isRTL ? 'خطأ في تحميل المواعيد' : 'Erreur de chargement');
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadAppointments();

        // Rafraîchir toutes les 5 minutes
        const interval = setInterval(() => loadAppointments(), 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    const handleAppointmentClick = (appt) => {
        setSelectedAppointment({
            id: appt.id,
            enrollment_id: appt.enrollment_id,
            parent_name: appt.parent_name,
            parent_phone: appt.parent_phone,
            parent_email: appt.parent_email,
            child_name: appt.child_name,
            confirmed_date: appt.confirmed_date,
            proposed_date: appt.proposed_date,
            status: appt.status,
            subject: appt.subject,
            description: appt.description,
            appointment_type: appt.appointment_type
        });
        setShowActionModal(true);
    };

    const handleActionSuccess = () => {
        loadAppointments();
        setShowActionModal(false);
    };

    const getTime = (appt) => {
        const date = new Date(appt.confirmed_date || appt.proposed_date);
        return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    };

    const isInscription = (appt) => {
        return appt.appointment_type === 'inscription' || appt.enrollment_id;
    };

    // Bouton de rafraîchissement pour le header
    const headerAction = (
        <button
            onClick={() => loadAppointments(true)}
            disabled={refreshing}
            className="p-1.5 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
            title={isRTL ? 'تحديث' : 'Actualiser'}
        >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
    );

    return (
        <>
            <WidgetCard
                icon={Calendar}
                title={isRTL ? 'مواعيد اليوم' : 'RDV Aujourd\'hui'}
                badge={appointments.length || null}
                headerAction={headerAction}
                iconColor="green"
                loading={loading}
            >
                {appointments.length === 0 ? (
                    <WidgetEmptyState
                        icon={Calendar}
                        message={isRTL ? 'لا توجد مواعيد اليوم' : 'Aucun RDV aujourd\'hui'}
                    />
                ) : (
                    <div className="space-y-2 max-h-[280px] overflow-y-auto">
                        {appointments.map((appt, index) => (
                            <motion.div
                                key={appt.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                onClick={() => handleAppointmentClick(appt)}
                                className={`group p-3 rounded-lg border-l-4 cursor-pointer transition-all hover:shadow-sm ${isInscription(appt)
                                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/30'
                                    : 'bg-green-50 dark:bg-green-900/20 border-green-500 hover:bg-green-100 dark:hover:bg-green-900/30'
                                    }`}
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                        {/* Badge type + heure */}
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isInscription(appt)
                                                ? 'bg-blue-500 text-white'
                                                : 'bg-green-500 text-white'
                                                }`}>
                                                {isInscription(appt) ? '📋' : '📅'} {getTime(appt)}
                                            </span>
                                        </div>

                                        {/* Titre */}
                                        <h4 className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                                            {isInscription(appt)
                                                ? `RDV Inscription: ${appt.child_name || 'Enfant'}`
                                                : (appt.subject || 'Rendez-vous')}
                                        </h4>

                                        {/* Parent */}
                                        {appt.parent_name && (
                                            <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-600 dark:text-gray-400">
                                                <User className="w-3 h-3" />
                                                <span className="truncate">{appt.parent_name}</span>
                                            </div>
                                        )}
                                    </div>

                                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 flex-shrink-0 mt-1" />
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </WidgetCard>

            {/* Modal d'action */}
            {showActionModal && selectedAppointment && (
                <AppointmentActionModal
                    isOpen={showActionModal}
                    onClose={() => setShowActionModal(false)}
                    appointment={selectedAppointment}
                    onSuccess={handleActionSuccess}
                />
            )}
        </>
    );
};

export default TodayAppointmentsWidget;
