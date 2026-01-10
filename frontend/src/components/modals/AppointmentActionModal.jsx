import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    CheckCircle,
    XCircle,
    Calendar,
    AlertTriangle,
    User,
    Phone,
    Mail,
    Clock,
    RefreshCw,
    Trash2
} from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import { useDialogContext } from '../../contexts/DialogContext';
import DatePicker from '../ui/DatePicker';
import api from '../../services/api';

/**
 * Modal pour gérer les actions sur un RDV
 * - RDV Inscription: Valider / Échoué (reprogrammer ou abandonner)
 * - RDV Normal: Terminer / Reprogrammer / Annuler
 */
const AppointmentActionModal = ({
    isOpen,
    onClose,
    appointment,
    onSuccess
}) => {
    const { isRTL } = useLanguage();
    const dialog = useDialogContext();

    const [action, setAction] = useState(null); // 'validate', 'failed', 'complete', 'reschedule', 'cancel'
    const [outcome, setOutcome] = useState(null); // 'reschedule', 'abandon'
    const [newDate, setNewDate] = useState('');
    const [newTime, setNewTime] = useState('10:00');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);

    // Déterminer si c'est un RDV d'inscription
    const isInscriptionAppointment = appointment?.enrollment_id || appointment?.appointment_type === 'inscription';

    const resetState = () => {
        setAction(null);
        setOutcome(null);
        setNewDate('');
        setNewTime('10:00');
        setNotes('');
        setLoading(false);
    };

    const handleClose = () => {
        resetState();
        onClose();
    };

    const handleValidate = async () => {
        setLoading(true);
        try {
            const response = await api.post(`/api/appointments/${appointment.id}/validate`, {
                staff_notes: notes
            });

            const data = response.data;

            if (data.success) {
                dialog.success(isRTL ? 'تم التحقق من الموعد بنجاح' : 'RDV validé - Inscription finalisée');
                onSuccess?.();
                handleClose();
            } else {
                dialog.error(data.error || (isRTL ? 'خطأ' : 'Erreur'));
            }
        } catch (error) {
            console.error('Erreur validation RDV:', error);
            dialog.error(isRTL ? 'خطأ في التحقق' : 'Erreur lors de la validation');
        } finally {
            setLoading(false);
        }
    };

    const handleFailed = async () => {
        if (outcome === 'reschedule' && (!newDate || !newTime)) {
            dialog.error(isRTL ? 'يرجى تحديد تاريخ ووقت جديد' : 'Veuillez sélectionner une nouvelle date et heure');
            return;
        }

        setLoading(true);
        try {
            // Combiner date et heure pour la reprogrammation
            let appointmentDateTime = null;
            if (outcome === 'reschedule' && newDate && newTime) {
                // newDate est au format dd/mm/yyyy
                const [day, month, year] = newDate.split('/');
                const [hours, minutes] = newTime.split(':');
                const dateObj = new Date(year, month - 1, day, hours, minutes);
                appointmentDateTime = dateObj.toISOString();
            }

            const response = await api.post(`/api/appointments/${appointment.id}/failed`, {
                outcome,
                staff_notes: notes,
                new_appointment_date: appointmentDateTime
            });

            const data = response.data;

            if (data.success) {
                if (outcome === 'reschedule') {
                    dialog.success(isRTL ? 'تم إعادة جدولة الموعد' : 'Nouveau RDV programmé');
                } else {
                    dialog.success(
                        data.parent_deleted
                            ? (isRTL ? 'تم إلغاء التسجيل وحذف حساب الوالد' : 'Inscription abandonnée - Compte parent supprimé')
                            : (isRTL ? 'تم إلغاء التسجيل' : 'Inscription abandonnée')
                    );
                }
                onSuccess?.();
                handleClose();
            } else {
                dialog.error(data.error || (isRTL ? 'خطأ' : 'Erreur'));
            }
        } catch (error) {
            console.error('Erreur marquage échec RDV:', error);
            dialog.error(isRTL ? 'خطأ' : 'Erreur lors du traitement');
        } finally {
            setLoading(false);
        }
    };

    // Handler pour terminer un RDV normal
    const handleComplete = async () => {
        setLoading(true);
        try {
            const response = await api.post(`/api/appointments/${appointment.id}/complete`, {
                staff_notes: notes
            });

            const data = response.data;

            if (data.success) {
                dialog.success(isRTL ? 'تم إنهاء الموعد' : 'RDV terminé');
                onSuccess?.();
                handleClose();
            } else {
                dialog.error(data.error || (isRTL ? 'خطأ' : 'Erreur'));
            }
        } catch (error) {
            console.error('Erreur completion RDV:', error);
            dialog.error(isRTL ? 'خطأ' : 'Erreur lors du traitement');
        } finally {
            setLoading(false);
        }
    };

    // Handler pour reprogrammer un RDV normal
    const handleReschedule = async () => {
        if (!newDate || !newTime) {
            dialog.error(isRTL ? 'يرجى تحديد تاريخ ووقت جديد' : 'Veuillez sélectionner une nouvelle date et heure');
            return;
        }

        setLoading(true);
        try {
            const [day, month, year] = newDate.split('/');
            const [hours, minutes] = newTime.split(':');
            const dateObj = new Date(year, month - 1, day, hours, minutes);
            const appointmentDateTime = dateObj.toISOString();

            const token = localStorage.getItem('token');
            const response = await fetch(`/api/appointments/${appointment.id}/reschedule`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    new_date: appointmentDateTime,
                    staff_notes: notes
                })
            });

            const data = await response.json();

            if (data.success) {
                dialog.success(isRTL ? 'تم إعادة جدولة الموعد' : 'RDV reprogrammé');
                onSuccess?.();
                handleClose();
            } else {
                dialog.error(data.error || (isRTL ? 'خطأ' : 'Erreur'));
            }
        } catch (error) {
            console.error('Erreur reprogrammation RDV:', error);
            dialog.error(isRTL ? 'خطأ' : 'Erreur lors du traitement');
        } finally {
            setLoading(false);
        }
    };

    // Handler pour annuler un RDV normal
    const handleCancel = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/appointments/${appointment.id}/cancel`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ staff_notes: notes })
            });

            const data = await response.json();

            if (data.success) {
                dialog.success(isRTL ? 'تم إلغاء الموعد' : 'RDV annulé');
                onSuccess?.();
                handleClose();
            } else {
                dialog.error(data.error || (isRTL ? 'خطأ' : 'Erreur'));
            }
        } catch (error) {
            console.error('Erreur annulation RDV:', error);
            dialog.error(isRTL ? 'خطأ' : 'Erreur lors du traitement');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !appointment) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b dark:border-gray-700">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                            {isRTL ? 'إجراءات الموعد' : 'Actions sur le RDV'}
                        </h2>
                        <button
                            onClick={handleClose}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Appointment Info */}
                    <div className="p-6 bg-gray-50 dark:bg-gray-900/50 border-b dark:border-gray-700">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                                <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-gray-900 dark:text-white">
                                    {appointment.child_name || appointment.child_first_name}
                                </h3>
                                <div className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                                    <div className="flex items-center gap-2">
                                        <User className="w-4 h-4" />
                                        <span>{appointment.parent_name || `${appointment.parent_first_name} ${appointment.parent_last_name}`}</span>
                                    </div>
                                    {appointment.parent_phone && (
                                        <div className="flex items-center gap-2">
                                            <Phone className="w-4 h-4" />
                                            <span>{appointment.parent_phone}</span>
                                        </div>
                                    )}
                                    {appointment.parent_email && (
                                        <div className="flex items-center gap-2">
                                            <Mail className="w-4 h-4" />
                                            <span>{appointment.parent_email}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4" />
                                        <span>
                                            {new Date(appointment.proposed_date || appointment.appointment_date).toLocaleDateString('fr-FR', {
                                                weekday: 'long',
                                                day: 'numeric',
                                                month: 'long',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        {!action ? (
                            // Step 1: Choose action - différent selon le type de RDV
                            <div className="space-y-4">
                                <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
                                    {isRTL ? 'ما هي نتيجة هذا الموعد؟' : 'Quel est le résultat de ce rendez-vous ?'}
                                </p>

                                {isInscriptionAppointment ? (
                                    // Actions pour RDV d'inscription
                                    <>
                                        <button
                                            onClick={() => setAction('validate')}
                                            className="w-full flex items-center gap-4 p-4 bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 rounded-xl hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                                        >
                                            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                                                <CheckCircle className="w-6 h-6 text-white" />
                                            </div>
                                            <div className="text-left">
                                                <h4 className="font-bold text-green-800 dark:text-green-300">
                                                    {isRTL ? 'تم بنجاح' : 'RDV réussi'}
                                                </h4>
                                                <p className="text-sm text-green-600 dark:text-green-400">
                                                    {isRTL ? 'تأكيد التسجيل' : 'Valider l\'inscription définitivement'}
                                                </p>
                                            </div>
                                        </button>

                                        <button
                                            onClick={() => setAction('failed')}
                                            className="w-full flex items-center gap-4 p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                                        >
                                            <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
                                                <XCircle className="w-6 h-6 text-white" />
                                            </div>
                                            <div className="text-left">
                                                <h4 className="font-bold text-red-800 dark:text-red-300">
                                                    {isRTL ? 'فشل الموعد' : 'RDV échoué'}
                                                </h4>
                                                <p className="text-sm text-red-600 dark:text-red-400">
                                                    {isRTL ? 'الوالد غائب أو مشكلة أخرى' : 'Parent absent ou autre problème'}
                                                </p>
                                            </div>
                                        </button>
                                    </>
                                ) : (
                                    // Actions pour RDV normal (non-inscription)
                                    <>
                                        <button
                                            onClick={() => setAction('complete')}
                                            className="w-full flex items-center gap-4 p-4 bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 rounded-xl hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                                        >
                                            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                                                <CheckCircle className="w-6 h-6 text-white" />
                                            </div>
                                            <div className="text-left">
                                                <h4 className="font-bold text-green-800 dark:text-green-300">
                                                    {isRTL ? 'إنهاء' : 'Terminer'}
                                                </h4>
                                                <p className="text-sm text-green-600 dark:text-green-400">
                                                    {isRTL ? 'تم إنجاز الموعد بنجاح' : 'Le rendez-vous s\'est bien passé'}
                                                </p>
                                            </div>
                                        </button>

                                        <button
                                            onClick={() => setAction('reschedule')}
                                            className="w-full flex items-center gap-4 p-4 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                                        >
                                            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                                                <Calendar className="w-6 h-6 text-white" />
                                            </div>
                                            <div className="text-left">
                                                <h4 className="font-bold text-blue-800 dark:text-blue-300">
                                                    {isRTL ? 'إعادة جدولة' : 'Reprogrammer'}
                                                </h4>
                                                <p className="text-sm text-blue-600 dark:text-blue-400">
                                                    {isRTL ? 'تحديد موعد جديد' : 'Fixer une nouvelle date'}
                                                </p>
                                            </div>
                                        </button>

                                        <button
                                            onClick={() => setAction('cancel')}
                                            className="w-full flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900/50 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                        >
                                            <div className="w-12 h-12 bg-gray-500 rounded-full flex items-center justify-center">
                                                <XCircle className="w-6 h-6 text-white" />
                                            </div>
                                            <div className="text-left">
                                                <h4 className="font-bold text-gray-800 dark:text-gray-300">
                                                    {isRTL ? 'إلغاء' : 'Annuler'}
                                                </h4>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                    {isRTL ? 'إلغاء هذا الموعد' : 'Annuler ce rendez-vous'}
                                                </p>
                                            </div>
                                        </button>
                                    </>
                                )}
                            </div>
                        ) : action === 'complete' ? (
                            // Terminer un RDV normal
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                                    <CheckCircle className="w-8 h-8 text-green-500" />
                                    <div>
                                        <h4 className="font-bold text-green-800 dark:text-green-300">
                                            {isRTL ? 'إنهاء الموعد' : 'Terminer le RDV'}
                                        </h4>
                                        <p className="text-sm text-green-600 dark:text-green-400">
                                            {isRTL ? 'تأكيد إنجاز الموعد' : 'Confirmer que le RDV est terminé'}
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        {isRTL ? 'ملاحظات (اختياري)' : 'Notes (optionnel)'}
                                    </label>
                                    <textarea
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        rows={3}
                                        className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                                        placeholder={isRTL ? 'أضف ملاحظات...' : 'Ajouter des notes...'}
                                    />
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        onClick={() => setAction(null)}
                                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        {isRTL ? 'رجوع' : 'Retour'}
                                    </button>
                                    <button
                                        onClick={handleComplete}
                                        disabled={loading}
                                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {loading ? (
                                            <RefreshCw className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <CheckCircle className="w-4 h-4" />
                                        )}
                                        {isRTL ? 'تأكيد' : 'Terminer'}
                                    </button>
                                </div>
                            </div>
                        ) : action === 'reschedule' ? (
                            // Reprogrammer un RDV normal
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                                    <Calendar className="w-8 h-8 text-blue-500" />
                                    <div>
                                        <h4 className="font-bold text-blue-800 dark:text-blue-300">
                                            {isRTL ? 'إعادة جدولة الموعد' : 'Reprogrammer le RDV'}
                                        </h4>
                                        <p className="text-sm text-blue-600 dark:text-blue-400">
                                            {isRTL ? 'اختر تاريخًا جديدًا' : 'Choisissez une nouvelle date'}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            {isRTL ? 'التاريخ الجديد' : 'Nouvelle date'} *
                                        </label>
                                        <DatePicker
                                            value={newDate}
                                            onChange={setNewDate}
                                            minDate={new Date().toISOString().split('T')[0]}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            {isRTL ? 'الوقت' : 'Heure'} *
                                        </label>
                                        <input
                                            type="time"
                                            value={newTime}
                                            onChange={(e) => setNewTime(e.target.value)}
                                            className="w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-white"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        {isRTL ? 'ملاحظات' : 'Notes'}
                                    </label>
                                    <textarea
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        rows={2}
                                        className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                                        placeholder={isRTL ? 'سبب إعادة الجدولة...' : 'Raison du report...'}
                                    />
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        onClick={() => setAction(null)}
                                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        {isRTL ? 'رجوع' : 'Retour'}
                                    </button>
                                    <button
                                        onClick={handleReschedule}
                                        disabled={loading || !newDate || !newTime}
                                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {loading ? (
                                            <RefreshCw className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Calendar className="w-4 h-4" />
                                        )}
                                        {isRTL ? 'تأكيد' : 'Confirmer'}
                                    </button>
                                </div>
                            </div>
                        ) : action === 'cancel' ? (
                            // Annuler un RDV normal
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
                                    <XCircle className="w-8 h-8 text-gray-500" />
                                    <div>
                                        <h4 className="font-bold text-gray-800 dark:text-gray-300">
                                            {isRTL ? 'إلغاء الموعد' : 'Annuler le RDV'}
                                        </h4>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            {isRTL ? 'تأكيد إلغاء الموعد' : 'Confirmer l\'annulation'}
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        {isRTL ? 'سبب الإلغاء (اختياري)' : 'Raison de l\'annulation (optionnel)'}
                                    </label>
                                    <textarea
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        rows={3}
                                        className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                                        placeholder={isRTL ? 'سبب الإلغاء...' : 'Raison de l\'annulation...'}
                                    />
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        onClick={() => setAction(null)}
                                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        {isRTL ? 'رجوع' : 'Retour'}
                                    </button>
                                    <button
                                        onClick={handleCancel}
                                        disabled={loading}
                                        className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {loading ? (
                                            <RefreshCw className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <XCircle className="w-4 h-4" />
                                        )}
                                        {isRTL ? 'تأكيد الإلغاء' : 'Confirmer'}
                                    </button>
                                </div>
                            </div>
                        ) : action === 'validate' ? (
                            // Step 2a: Validate confirmation
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                                    <CheckCircle className="w-8 h-8 text-green-500" />
                                    <div>
                                        <h4 className="font-bold text-green-800 dark:text-green-300">
                                            {isRTL ? 'تأكيد التسجيل' : 'Confirmer l\'inscription'}
                                        </h4>
                                        <p className="text-sm text-green-600 dark:text-green-400">
                                            {isRTL ? 'سيتم تفعيل حساب الوالد' : 'Le compte parent sera activé'}
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        {isRTL ? 'ملاحظات (اختياري)' : 'Notes (optionnel)'}
                                    </label>
                                    <textarea
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        rows={3}
                                        className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                                        placeholder={isRTL ? 'أضف ملاحظات...' : 'Ajouter des notes...'}
                                    />
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        onClick={() => setAction(null)}
                                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        {isRTL ? 'رجوع' : 'Retour'}
                                    </button>
                                    <button
                                        onClick={handleValidate}
                                        disabled={loading}
                                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {loading ? (
                                            <RefreshCw className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <CheckCircle className="w-4 h-4" />
                                        )}
                                        {isRTL ? 'تأكيد' : 'Valider'}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            // Step 2b: Failed - choose outcome
                            <div className="space-y-4">
                                {!outcome ? (
                                    <>
                                        <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl mb-4">
                                            <AlertTriangle className="w-8 h-8 text-red-500" />
                                            <div>
                                                <h4 className="font-bold text-red-800 dark:text-red-300">
                                                    {isRTL ? 'فشل الموعد' : 'RDV échoué'}
                                                </h4>
                                                <p className="text-sm text-red-600 dark:text-red-400">
                                                    {isRTL ? 'اختر الإجراء التالي' : 'Choisissez la suite à donner'}
                                                </p>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => setOutcome('reschedule')}
                                            className="w-full flex items-center gap-4 p-4 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                                        >
                                            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                                                <Calendar className="w-5 h-5 text-white" />
                                            </div>
                                            <div className="text-left">
                                                <h4 className="font-bold text-blue-800 dark:text-blue-300">
                                                    {isRTL ? 'إعادة جدولة' : 'Reprogrammer'}
                                                </h4>
                                                <p className="text-sm text-blue-600 dark:text-blue-400">
                                                    {isRTL ? 'تحديد موعد جديد' : 'Fixer un nouveau rendez-vous'}
                                                </p>
                                            </div>
                                        </button>

                                        <button
                                            onClick={() => setOutcome('abandon')}
                                            className="w-full flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900/50 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                        >
                                            <div className="w-10 h-10 bg-gray-500 rounded-full flex items-center justify-center">
                                                <Trash2 className="w-5 h-5 text-white" />
                                            </div>
                                            <div className="text-left">
                                                <h4 className="font-bold text-gray-800 dark:text-gray-300">
                                                    {isRTL ? 'إلغاء التسجيل' : 'Abandonner'}
                                                </h4>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                    {isRTL ? 'إلغاء التسجيل وحذف الحساب' : 'Annuler l\'inscription et supprimer le compte'}
                                                </p>
                                            </div>
                                        </button>

                                        <button
                                            onClick={() => setAction(null)}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors mt-4"
                                        >
                                            {isRTL ? 'رجوع' : 'Retour'}
                                        </button>
                                    </>
                                ) : outcome === 'reschedule' ? (
                                    // Reschedule form
                                    <>
                                        <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                                            <Calendar className="w-8 h-8 text-blue-500" />
                                            <div>
                                                <h4 className="font-bold text-blue-800 dark:text-blue-300">
                                                    {isRTL ? 'إعادة جدولة الموعد' : 'Reprogrammer le RDV'}
                                                </h4>
                                                <p className="text-sm text-blue-600 dark:text-blue-400">
                                                    {isRTL ? 'اختر تاريخًا جديدًا' : 'Choisissez une nouvelle date'}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    {isRTL ? 'التاريخ الجديد' : 'Nouvelle date'} *
                                                </label>
                                                <DatePicker
                                                    value={newDate}
                                                    onChange={setNewDate}
                                                    minDate={new Date().toISOString().split('T')[0]}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    {isRTL ? 'الوقت' : 'Heure'} *
                                                </label>
                                                <input
                                                    type="time"
                                                    value={newTime}
                                                    onChange={(e) => setNewTime(e.target.value)}
                                                    className="w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-white"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                {isRTL ? 'ملاحظات' : 'Notes'}
                                            </label>
                                            <textarea
                                                value={notes}
                                                onChange={(e) => setNotes(e.target.value)}
                                                rows={2}
                                                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                                                placeholder={isRTL ? 'سبب إعادة الجدولة...' : 'Raison du report...'}
                                            />
                                        </div>

                                        <div className="flex gap-3 pt-4">
                                            <button
                                                onClick={() => setOutcome(null)}
                                                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                            >
                                                {isRTL ? 'رجوع' : 'Retour'}
                                            </button>
                                            <button
                                                onClick={handleFailed}
                                                disabled={loading || !newDate || !newTime}
                                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                            >
                                                {loading ? (
                                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <Calendar className="w-4 h-4" />
                                                )}
                                                {isRTL ? 'تأكيد' : 'Confirmer'}
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    // Abandon confirmation
                                    <>
                                        <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl">
                                            <AlertTriangle className="w-8 h-8 text-red-500" />
                                            <div>
                                                <h4 className="font-bold text-red-800 dark:text-red-300">
                                                    {isRTL ? 'تأكيد الإلغاء' : 'Confirmer l\'abandon'}
                                                </h4>
                                                <p className="text-sm text-red-600 dark:text-red-400">
                                                    {isRTL ? 'هذا الإجراء لا رجعة فيه' : 'Cette action est irréversible'}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                                            <p className="text-sm text-yellow-800 dark:text-yellow-300">
                                                <strong>{isRTL ? 'تحذير:' : 'Attention :'}</strong>{' '}
                                                {isRTL
                                                    ? 'سيتم حذف حساب الوالد إذا تم إنشاؤه.'
                                                    : 'Le compte parent sera supprimé s\'il a été créé.'
                                                }
                                            </p>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                {isRTL ? 'سبب الإلغاء' : 'Raison de l\'abandon'}
                                            </label>
                                            <textarea
                                                value={notes}
                                                onChange={(e) => setNotes(e.target.value)}
                                                rows={2}
                                                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                                                placeholder={isRTL ? 'سبب الإلغاء...' : 'Raison de l\'abandon...'}
                                            />
                                        </div>

                                        <div className="flex gap-3 pt-4">
                                            <button
                                                onClick={() => setOutcome(null)}
                                                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                            >
                                                {isRTL ? 'رجوع' : 'Retour'}
                                            </button>
                                            <button
                                                onClick={handleFailed}
                                                disabled={loading}
                                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                            >
                                                {loading ? (
                                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <Trash2 className="w-4 h-4" />
                                                )}
                                                {isRTL ? 'تأكيد الإلغاء' : 'Confirmer l\'abandon'}
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default AppointmentActionModal;
