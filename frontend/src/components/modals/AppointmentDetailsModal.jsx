import React, { useState } from 'react';
import { X, Calendar, Clock, MapPin, User, FileText, Check, CalendarX2 } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import { useDialogContext } from '../../contexts/DialogContext';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';
import DatePicker from '../ui/DatePicker';
import { convertToISO } from '../../utils/dateUtils';

/**
 * Modal d'affichage des détails d'un rendez-vous
 * Permet de valider ou proposer une autre date
 * Compatible tous rôles (admin, staff, parent)
 */
const AppointmentDetailsModal = ({ isOpen, onClose, appointment, onSuccess }) => {
    const { isRTL } = useLanguage();
    const dialog = useDialogContext();
    const { user } = useAuth();
    const [showReschedule, setShowReschedule] = useState(false);
    const [newDate, setNewDate] = useState('');
    const [newTime, setNewTime] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen || !appointment) return null;

    // Formater la date et l'heure
    const formatDateTime = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const dateStr = date.toLocaleDateString('fr-FR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        const timeStr = date.toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit'
        });
        return { dateStr, timeStr };
    };

    const { dateStr, timeStr } = formatDateTime(appointment.proposed_date);

    // Valider le rendez-vous
    const handleValidate = async () => {
        try {
            setLoading(true);
            const response = await api.patch(`/api/appointments/${appointment.id}/confirm`);

            if (response.data.success) {
                dialog.success(isRTL ? 'تم تأكيد الموعد بنجاح' : 'Rendez-vous confirmé avec succès');
                onSuccess?.();
                onClose();
            }
        } catch (error) {
            console.error('Erreur validation RDV:', error);
            dialog.error(isRTL ? 'خطأ في تأكيد الموعد' : 'Erreur lors de la confirmation');
        } finally {
            setLoading(false);
        }
    };

    // Proposer une autre date (utilise counter-propose pour tous les rôles)
    const handleReschedule = async () => {
        if (!newDate || !newTime) {
            dialog.error(isRTL ? 'يرجى اختيار تاريخ ووقت' : 'Veuillez sélectionner une date et une heure');
            return;
        }

        try {
            setLoading(true);

            // Convertir la date dd/mm/yyyy en yyyy-mm-dd
            const isoDate = convertToISO(newDate);
            if (!isoDate) {
                dialog.error(isRTL ? 'تنسيق التاريخ غير صحيح' : 'Format de date invalide');
                setLoading(false);
                return;
            }

            const proposedDateTime = `${isoDate}T${newTime}:00`;

            // Utiliser la nouvelle route counter-propose pour tous les rôles
            const response = await api.patch(`/api/appointments/${appointment.id}/counter-propose`, {
                proposed_date: proposedDateTime
            });

            if (response.data.success) {
                dialog.success(isRTL ? 'تم اقتراح تاريخ جديد بنجاح' : 'Nouvelle date proposée avec succès');
                onSuccess?.();
                onClose();
            }
        } catch (error) {
            console.error('Erreur proposition date:', error);
            dialog.error(isRTL ? 'خطأ في اقتراح التاريخ' : 'Erreur lors de la proposition');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setShowReschedule(false);
        setNewDate('');
        setNewTime('');
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 sm:px-6 py-4 flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-lg">
                            <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                        </div>
                        <h3 className="text-lg sm:text-xl font-semibold text-white">
                            {isRTL ? 'تفاصيل الموعد' : 'Détails du rendez-vous'}
                        </h3>
                    </div>
                    <button
                        onClick={handleClose}
                        className="text-white hover:bg-white/20 rounded-lg p-1.5 transition-colors"
                        aria-label={isRTL ? 'إغلاق' : 'Fermer'}
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                    {!showReschedule ? (
                        <div className="space-y-4">
                            {/* Objet */}
                            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                    <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-1">
                                            {isRTL ? 'الموضوع' : 'Objet'}
                                        </p>
                                        <p className="text-base font-semibold text-blue-700 dark:text-blue-200 break-words">
                                            {appointment.subject}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Date et heure */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Calendar className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                            {isRTL ? 'التاريخ' : 'Date'}
                                        </p>
                                    </div>
                                    <p className="text-sm font-semibold text-gray-900 dark:text-white capitalize break-words">
                                        {dateStr}
                                    </p>
                                </div>

                                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Clock className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                            {isRTL ? 'الوقت' : 'Heure'}
                                        </p>
                                    </div>
                                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                        {timeStr}
                                    </p>
                                </div>
                            </div>

                            {/* Lieu */}
                            {appointment.location && (
                                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <MapPin className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                            {isRTL ? 'المكان' : 'Lieu'}
                                        </p>
                                    </div>
                                    <p className="text-sm font-semibold text-gray-900 dark:text-white break-words">
                                        {appointment.location}
                                    </p>
                                </div>
                            )}

                            {/* Description */}
                            {appointment.description && (
                                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                                        {isRTL ? 'الوصف' : 'Description'}
                                    </p>
                                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">
                                        {appointment.description}
                                    </p>
                                </div>
                            )}

                            {/* Statut */}
                            {appointment.status && (
                                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                                        {isRTL ? 'الحالة' : 'Statut'}
                                    </p>
                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${appointment.status === 'confirmed'
                                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                        : appointment.status === 'proposed'
                                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                                            : appointment.status === 'counter_proposed'
                                                ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
                                                : appointment.status === 'cancelled'
                                                    ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                                    : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                                        }`}>
                                        {appointment.status === 'confirmed' && (isRTL ? 'مؤكد' : 'Confirmé')}
                                        {appointment.status === 'proposed' && (isRTL ? 'مقترح' : 'Proposé')}
                                        {appointment.status === 'counter_proposed' && (isRTL ? 'تاريخ جديد مقترح' : 'Contre-proposition')}
                                        {appointment.status === 'cancelled' && (isRTL ? 'ملغى' : 'Annulé')}
                                        {appointment.status === 'completed' && (isRTL ? 'مكتمل' : 'Terminé')}
                                    </span>
                                    {appointment.pending_response_from && (
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                            {appointment.pending_response_from === 'admin'
                                                ? (isRTL ? 'في انتظار رد الإدارة' : 'En attente de réponse de l\'administration')
                                                : (isRTL ? 'في انتظار ردك' : 'En attente de votre réponse')
                                            }
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : (
                        /* Formulaire proposition nouvelle date */
                        <div className="space-y-4">
                            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                                <p className="text-sm text-blue-800 dark:text-blue-300">
                                    {isRTL
                                        ? 'اقترح تاريخًا ووقتًا جديدين للموعد'
                                        : 'Proposez une nouvelle date et heure pour le rendez-vous'
                                    }
                                </p>
                            </div>

                            <DatePicker
                                label={isRTL ? 'التاريخ الجديد' : 'Nouvelle date'}
                                required
                                value={newDate}
                                onChange={setNewDate}
                            />

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    <Clock className="w-4 h-4 inline mr-1" />
                                    {isRTL ? 'الوقت الجديد' : 'Nouvelle heure'} <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="time"
                                    value={newTime}
                                    onChange={(e) => setNewTime(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                    required
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 px-4 sm:px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex-shrink-0">
                    {/* RDV dans un état final - afficher seulement le bouton Fermer */}
                    {['confirmed', 'completed', 'cancelled', 'failed', 'no_show'].includes(appointment.status) ? (
                        <button
                            onClick={onClose}
                            className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            <span className="text-sm sm:text-base">{isRTL ? 'إغلاق' : 'Fermer'}</span>
                        </button>
                    ) : !showReschedule ? (
                        <>
                            <button
                                onClick={() => setShowReschedule(true)}
                                disabled={loading}
                                className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 order-2 sm:order-1"
                            >
                                <CalendarX2 className="w-4 h-4" />
                                <span className="text-sm sm:text-base">{isRTL ? 'تاريخ آخر' : 'Autre date'}</span>
                            </button>
                            <button
                                onClick={handleValidate}
                                disabled={loading}
                                className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 order-1 sm:order-2"
                            >
                                {loading ? (
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <Check className="w-4 h-4" />
                                )}
                                <span className="text-sm sm:text-base font-medium">
                                    {isRTL ? 'تأكيد' : 'Valider'}
                                </span>
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={() => setShowReschedule(false)}
                                disabled={loading}
                                className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed order-2 sm:order-1"
                            >
                                <span className="text-sm sm:text-base">{isRTL ? 'إلغاء' : 'Annuler'}</span>
                            </button>
                            <button
                                onClick={handleReschedule}
                                disabled={loading}
                                className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 order-1 sm:order-2"
                            >
                                {loading ? (
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <Calendar className="w-4 h-4" />
                                )}
                                <span className="text-sm sm:text-base font-medium">
                                    {isRTL ? 'اقتراح' : 'Proposer'}
                                </span>
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AppointmentDetailsModal;
