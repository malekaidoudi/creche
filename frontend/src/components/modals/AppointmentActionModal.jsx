import React, { useState, useEffect } from 'react';
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
    Trash2,
    Stethoscope,
    Users,
    Smile,
    FileText,
    CheckCircle2,
    Plus,
    Ruler,
    CreditCard,
    Check,
    Receipt,
    Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../hooks/useLanguage';
import { useDialogContext } from '../../contexts/DialogContext';
import DatePicker from '../ui/DatePicker';
import api from '../../services/api';
import BillingManagementModal from './BillingManagementModal';

/**
 * Modal pour gérer les actions sur un RDV
 * - RDV Inscription: Valider / Échoué (reprogrammer ou abandonner)
 * - RDV Normal: Terminer / Reprogrammer / Annuler
 */
const AppointmentActionModal = ({
    isOpen,
    onClose,
    appointment,
    onSuccess,
    defaultAction = null
}) => {
    const { isRTL } = useLanguage();
    const dialog = useDialogContext();
    const navigate = useNavigate();

    // Résultat du succès d'admission pour l'écran de synthèse (Option 1)
    const [successData, setSuccessData] = useState(null);
    const [showBillingModal, setShowBillingModal] = useState(false);

    // Déterminer si c'est un RDV d'inscription
    const isInscriptionAppointment = !!(appointment?.enrollment_id || appointment?.appointment_type === 'inscription');

    // Pour un RDV d'inscription, l'action est 'validate' dès le premier frame de rendu (zéro clignotement)
    const [action, setAction] = useState(defaultAction);
    const effectiveAction = isInscriptionAppointment
        ? (action === 'failed' ? 'failed' : 'validate')
        : (action || defaultAction);

    const [outcome, setOutcome] = useState(null); // 'reschedule', 'abandon'
    const [newDate, setNewDate] = useState('');
    const [newTime, setNewTime] = useState('10:00');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);

    // Données d'admission enrichie pour le jour J
    const [doctorName, setDoctorName] = useState('');
    const [doctorPhone, setDoctorPhone] = useState('');
    const [allergies, setAllergies] = useState('');
    const [habitsNotes, setHabitsNotes] = useState('');
    const [weightKg, setWeightKg] = useState('');
    const [heightCm, setHeightCm] = useState('');
    const [trustedContacts, setTrustedContacts] = useState([]);
    const [careSchedule, setCareSchedule] = useState('full_day');
    const [saturdayAttendance, setSaturdayAttendance] = useState(false);
    const [monthlyDiscount, setMonthlyDiscount] = useState(0);
    const [enrollmentDate, setEnrollmentDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [uploadedDocs, setUploadedDocs] = useState([]);
    const [admissionTab, setAdmissionTab] = useState('health');

    // Ajout d'une personne de confiance pendant l'entretien
    const [newContactName, setNewContactName] = useState('');
    const [newContactRelation, setNewContactRelation] = useState('');
    const [newContactPhone, setNewContactPhone] = useState('');
    const [showAddContact, setShowAddContact] = useState(false);

    useEffect(() => {
        if (appointment?.enrollment_id && isOpen) {
            api.get(`/api/enrollments/${appointment.enrollment_id}`)
                .then(res => {
                    const enr = res.data?.enrollment || res.data;
                    if (enr) {
                        setDoctorName(enr.doctor_name || '');
                        setDoctorPhone(enr.doctor_phone || '');
                        setAllergies(enr.allergies || '');
                        setHabitsNotes(enr.habits_notes || '');
                        setWeightKg(enr.weight_kg != null ? String(enr.weight_kg) : '');
                        setHeightCm(enr.height_cm != null ? String(enr.height_cm) : '');
                        setCareSchedule(enr.care_schedule || 'full_day');
                        setSaturdayAttendance(!!enr.saturday_attendance);
                        setMonthlyDiscount(enr.monthly_discount || 0);
                        if (enr.enrollment_date) {
                            try {
                                setEnrollmentDate(new Date(enr.enrollment_date).toISOString().split('T')[0]);
                            } catch {}
                        }

                        let tc = [];
                        if (Array.isArray(enr.trusted_contacts)) {
                            tc = enr.trusted_contacts;
                        } else if (typeof enr.trusted_contacts === 'string') {
                            try { tc = JSON.parse(enr.trusted_contacts); } catch {}
                        }
                        setTrustedContacts(tc);
                        setUploadedDocs(res.data?.documents || []);
                    }
                })
                .catch(err => console.warn('Info dossier inscription non chargé:', err.message));
        }
    }, [appointment?.enrollment_id, isOpen]);

    useEffect(() => {
        if (!isOpen) {
            setAction(null);
            setOutcome(null);
        }
    }, [isOpen]);

    const resetState = () => {
        setAction(null);
        setOutcome(null);
        setNewDate('');
        setNewTime('10:00');
        setNotes('');
        setLoading(false);
        setSuccessData(null);
        setShowBillingModal(false);
    };

    const handleClose = () => {
        resetState();
        onClose();
    };

    const handleValidate = async () => {
        setLoading(true);
        try {
            const payload = {
                staff_notes: notes,
                notes: notes,
                doctor_name: doctorName.trim(),
                doctor_phone: doctorPhone.trim(),
                allergies: allergies.trim(),
                habits_notes: habitsNotes.trim(),
                weight_kg: weightKg ? parseFloat(weightKg) : null,
                height_cm: heightCm ? parseFloat(heightCm) : null,
                trusted_contacts: trustedContacts,
                care_schedule: careSchedule,
                saturday_attendance: saturdayAttendance,
                monthly_discount: parseFloat(monthlyDiscount) || 0,
                enrollment_date: enrollmentDate
            };

            const response = await api.patch(`/api/appointments/${appointment.id}/complete`, payload);
            const data = response.data;

            if (data.success) {
                if (isInscriptionAppointment) {
                    setSuccessData(data);
                    onSuccess?.();
                } else {
                    dialog.success(isRTL ? 'تم تأكيد الموعد بنجاح !' : 'Rendez-vous validé avec succès !');
                    onSuccess?.();
                    handleClose();
                }
            } else {
                dialog.error(data.error || (isRTL ? 'خطأ' : 'Erreur'));
            }
        } catch (error) {
            console.error('Erreur validation RDV:', error);
            const msg = error.response?.data?.error || (isRTL ? 'خطأ في التحقق' : 'Erreur lors de la validation');
            dialog.error(msg);
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className={`bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-h-[92vh] overflow-y-auto ${
                    successData ? 'max-w-2xl' : (effectiveAction === 'validate' ? 'max-w-3xl' : 'max-w-lg')
                }`}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        {successData
                            ? (isRTL ? 'تأكيد القبول والتسجيل' : 'Admission validée avec succès')
                            : isInscriptionAppointment 
                                ? (effectiveAction === 'validate' 
                                    ? (isRTL ? 'استمارة القبول والتسجيل النهائي' : 'Fiche d\'admission & Inscription') 
                                    : (isRTL ? 'إدارة الموعد' : 'Gestion du rendez-vous'))
                                : (isRTL ? 'إدارة الموعد' : 'Gestion du rendez-vous')}
                    </h2>
                    <button
                        onClick={handleClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Appointment Info (masqué lors de l'écran de synthèse) */}
                {!successData && (
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
                                            <a
                                                href={`tel:${appointment.parent_phone}`}
                                                dir="ltr"
                                                className="hover:underline font-medium text-gray-800 dark:text-gray-200"
                                            >
                                                {appointment.parent_phone}
                                            </a>
                                        </div>
                                    )}
                                    {appointment.parent_email && (
                                        <div className="flex items-center gap-2">
                                            <Mail className="w-4 h-4" />
                                            <a
                                                href={`mailto:${appointment.parent_email}`}
                                                dir="ltr"
                                                className="hover:underline text-gray-700 dark:text-gray-300"
                                            >
                                                {appointment.parent_email}
                                            </a>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4" />
                                        <span>
                                            {new Date(appointment.proposed_date || appointment.appointment_date).toLocaleDateString(isRTL ? 'ar-TN' : 'fr-FR', {
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
                )}

                {/* Content */}
                <div className="p-6">
                    {successData ? (
                        /* Option 1: Écran de synthèse et de confirmation immédiat */
                        <div className="space-y-6 py-2">
                            {/* En-tête festif / Succès */}
                            <div className="text-center space-y-2">
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 ring-8 ring-emerald-50 dark:ring-emerald-900/20 mb-2">
                                    <CheckCircle2 className="w-10 h-10 animate-pulse" />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {isRTL ? 'تم تأكيد القبول وتسجيل الطفل بنجاح !' : 'Admission validée avec succès !'}
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-300 max-w-md mx-auto">
                                    {isRTL 
                                        ? `تم إدراج الطفل ${successData.child?.first_name || appointment.child_first_name} رسمياً في سجلات الروضة وإنشاء ملفه الكامل.` 
                                        : `L'enfant ${successData.child?.first_name || appointment.child_first_name} est désormais officiellement inscrit à la crèche et sa fiche complète a été créée.`}
                                </p>
                            </div>

                            {/* Grille récapitulative */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Carte 1 : Profil Enfant & Rentrée */}
                                <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/50 dark:bg-emerald-950/20 space-y-3">
                                    <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-semibold border-b border-emerald-200/60 dark:border-emerald-800/40 pb-2">
                                        <User className="w-4 h-4" />
                                        <span>{isRTL ? 'بيانات الطفل والتسجيل' : 'Profil & Rentrée'}</span>
                                    </div>
                                    <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-500 dark:text-gray-400">{isRTL ? 'الاسم الكامل:' : 'Enfant :'}</span>
                                            <span className="font-bold text-gray-900 dark:text-white">
                                                {successData.child?.first_name || appointment.child_first_name} {successData.child?.last_name || appointment.child_last_name || ''}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-500 dark:text-gray-400">{isRTL ? 'الولي:' : 'Parent :'}</span>
                                            <span className="font-medium text-gray-800 dark:text-gray-200">
                                                {appointment.parent_name || `${appointment.parent_first_name || ''} ${appointment.parent_last_name || ''}`.trim() || appointment.applicant_first_name}
                                            </span>
                                        </div>
                                        {appointment.parent_phone && (
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-500 dark:text-gray-400">{isRTL ? 'الهاتف:' : 'Téléphone :'}</span>
                                                <span dir="ltr" className="font-medium text-gray-800 dark:text-gray-200">
                                                    {appointment.parent_phone}
                                                </span>
                                            </div>
                                        )}
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-500 dark:text-gray-400">{isRTL ? 'النظام:' : 'Formule :'}</span>
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200">
                                                {careSchedule === 'full_day' 
                                                    ? (isRTL ? 'يوم كامل' : 'Journée complète') 
                                                    : (isRTL ? 'نصف يوم' : 'Demi-journée')}
                                                {saturdayAttendance && (isRTL ? ' + السبت' : ' + Samedi')}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-500 dark:text-gray-400">{isRTL ? 'تاريخ الدخول:' : 'Date d\'effet :'}</span>
                                            <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                                                {enrollmentDate}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Carte 2 : 1ère Cotisation Émise */}
                                <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-800/60 bg-blue-50/50 dark:bg-blue-950/20 space-y-3">
                                    <div className="flex items-center justify-between border-b border-blue-200/60 dark:border-blue-800/40 pb-2">
                                        <div className="flex items-center gap-2 text-blue-800 dark:text-blue-300 font-semibold">
                                            <Receipt className="w-4 h-4" />
                                            <span>{isRTL ? 'الاشتراك الأول (الفاتورة)' : '1ère Cotisation émise'}</span>
                                        </div>
                                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300">
                                            {isRTL ? 'غير مدفوع' : 'À encaisser'}
                                        </span>
                                    </div>
                                    {successData.invoice ? (
                                        <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-500 dark:text-gray-400">{isRTL ? 'رقم الفاتورة:' : 'N° Facture :'}</span>
                                                <span className="font-mono font-medium text-gray-900 dark:text-white text-xs bg-white dark:bg-gray-800 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-700">
                                                    {successData.invoice.invoice_number}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-500 dark:text-gray-400">{isRTL ? 'معلوم الشهر:' : 'Mensualité :'}</span>
                                                <span>{parseFloat(successData.invoice.base_price || 0).toFixed(2)} DT</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-500 dark:text-gray-400">{isRTL ? 'التأمين السنوي:' : 'Assurance annuelle :'}</span>
                                                <span>{parseFloat(successData.invoice.insurance_price || 60).toFixed(2)} DT</span>
                                            </div>
                                            {parseFloat(successData.invoice.discount_amount || 0) > 0 && (
                                                <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400">
                                                    <span>{isRTL ? 'تخفيض شهري:' : 'Remise mensuelle :'}</span>
                                                    <span>-{parseFloat(successData.invoice.discount_amount).toFixed(2)} DT</span>
                                                </div>
                                            )}
                                            <div className="border-t border-blue-200/60 dark:border-blue-800/40 pt-2 flex justify-between items-center font-bold text-blue-900 dark:text-blue-200">
                                                <span>{isRTL ? 'المجموع المستحق:' : 'Total dû :'}</span>
                                                <span className="text-base text-blue-700 dark:text-blue-300">
                                                    {parseFloat(successData.invoice.total_amount || successData.invoice.total_due || 0).toFixed(2)} DT
                                                </span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="py-4 text-center text-xs text-gray-500 dark:text-gray-400">
                                            {isRTL 
                                                ? 'تم احتساب الاشتراك وإدراجه في النظام المالي للروضة.' 
                                                : 'Cotisation initiale calculée et enregistrée dans le module financier.'}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Boutons d'actions */}
                            <div className="space-y-3 pt-3">
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            handleClose();
                                            navigate('/dashboard/children');
                                        }}
                                        className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition-all shadow-sm hover:shadow"
                                    >
                                        <User className="w-5 h-5" />
                                        <span>{isRTL ? 'عرض ملف الطفل في القائمة' : 'Voir la fiche de l\'enfant'}</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setShowBillingModal(true)}
                                        className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all shadow-sm hover:shadow"
                                    >
                                        <CreditCard className="w-5 h-5" />
                                        <span>{isRTL ? 'استخلاص أول دفعة الآن' : 'Encaisser le premier règlement'}</span>
                                    </button>
                                </div>

                                <button
                                    type="button"
                                    onClick={handleClose}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium transition-colors"
                                >
                                    <Check className="w-4 h-4" />
                                    <span>{isRTL ? 'إغلاق والعودة للوحة التحكم' : 'Fermer / Retour au tableau de bord'}</span>
                                </button>
                            </div>
                        </div>
                    ) : !effectiveAction ? (
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
                                            className="w-full flex items-center gap-4 p-4 bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-200 dark:border-emerald-800 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors"
                                        >
                                            <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center">
                                                <CheckCircle className="w-6 h-6 text-white" />
                                            </div>
                                            <div className="text-left rtl:text-right">
                                                <h4 className="font-bold text-emerald-800 dark:text-emerald-300">
                                                    {isRTL ? 'قبول التسجيل' : 'Entretien favorable'}
                                                </h4>
                                                <p className="text-sm text-emerald-600 dark:text-emerald-400">
                                                    {isRTL ? 'إكمال البيانات وتأكيد القبول النهائي' : 'Compléter la fiche et valider l\'admission'}
                                                </p>
                                            </div>
                                        </button>

                                        <button
                                            onClick={() => setAction('failed')}
                                            className="w-full flex items-center gap-4 p-4 bg-rose-50 dark:bg-rose-900/20 border-2 border-rose-200 dark:border-rose-800 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-colors"
                                        >
                                            <div className="w-12 h-12 bg-rose-500 rounded-full flex items-center justify-center">
                                                <XCircle className="w-6 h-6 text-white" />
                                            </div>
                                            <div className="text-left rtl:text-right">
                                                <h4 className="font-bold text-rose-800 dark:text-rose-300">
                                                    {isRTL ? 'عدم إتمام المقابلة' : 'Rendez-vous non abouti'}
                                                </h4>
                                                <p className="text-sm text-rose-600 dark:text-rose-400">
                                                    {isRTL ? 'غياب الولي، طلب تأجيل أو عدم توافق' : 'Parent absent, report ou désistement'}
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
                        ) : effectiveAction === 'complete' ? (
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
                        ) : effectiveAction === 'reschedule' ? (
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
                        ) : effectiveAction === 'cancel' ? (
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
                        ) : effectiveAction === 'validate' ? (
                            // Step 2a: Fiche d'admission enrichie & confirmation le Jour J
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                                            <CheckCircle2 className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-emerald-900 dark:text-emerald-200 text-base">
                                                {isRTL ? 'تأكيد القبول وتسجيل الطفل' : 'Entretien d\'admission & Finalisation'}
                                            </h4>
                                            <p className="text-xs text-emerald-700 dark:text-emerald-300">
                                                {isRTL
                                                    ? 'تحقق من البيانات وتثبيت المعطيات المالية للطفل'
                                                    : 'Vérifiez les données et contractualisez l\'admission de l\'enfant'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Sous-onglets d'admission */}
                                <div className="flex gap-1.5 p-1 bg-gray-100 dark:bg-gray-700/60 rounded-xl text-xs font-semibold overflow-x-auto">
                                    <button
                                        type="button"
                                        onClick={() => setAdmissionTab('health')}
                                        className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                                            admissionTab === 'health'
                                                ? 'bg-white dark:bg-gray-800 text-primary-600 dark:text-primary-400 shadow-sm'
                                                : 'text-gray-600 dark:text-gray-300'
                                        }`}
                                    >
                                        <Stethoscope className="w-3.5 h-3.5" />
                                        <span>{isRTL ? 'الصحة والنمو' : 'Santé & Pédiatre'}</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setAdmissionTab('contacts')}
                                        className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                                            admissionTab === 'contacts'
                                                ? 'bg-white dark:bg-gray-800 text-primary-600 dark:text-primary-400 shadow-sm'
                                                : 'text-gray-600 dark:text-gray-300'
                                        }`}
                                    >
                                        <Users className="w-3.5 h-3.5" />
                                        <span>{isRTL ? 'الأشخاص الموثوقون' : 'Personnes de confiance'}</span>
                                        {trustedContacts.length > 0 && (
                                            <span className="w-4 h-4 rounded-full bg-primary-100 text-primary-700 text-[10px] flex items-center justify-center font-bold">
                                                {trustedContacts.length}
                                            </span>
                                        )}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setAdmissionTab('billing')}
                                        className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                                            admissionTab === 'billing'
                                                ? 'bg-white dark:bg-gray-800 text-primary-600 dark:text-primary-400 shadow-sm'
                                                : 'text-gray-600 dark:text-gray-300'
                                        }`}
                                    >
                                        <CreditCard className="w-3.5 h-3.5" />
                                        <span>{isRTL ? 'الاشتراك والدخول' : 'Tarifs & Rentrée'}</span>
                                    </button>
                                    {uploadedDocs.length > 0 && (
                                        <button
                                            type="button"
                                            onClick={() => setAdmissionTab('docs')}
                                            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                                                admissionTab === 'docs'
                                                    ? 'bg-white dark:bg-gray-800 text-primary-600 dark:text-primary-400 shadow-sm'
                                                    : 'text-gray-600 dark:text-gray-300'
                                            }`}
                                        >
                                            <FileText className="w-3.5 h-3.5" />
                                            <span>{isRTL ? 'الوثائق' : 'Photos'}</span>
                                            <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 text-[10px] flex items-center justify-center font-bold">
                                                {uploadedDocs.length}
                                            </span>
                                        </button>
                                    )}
                                </div>

                                {/* Contenu de l'onglet actif */}
                                {admissionTab === 'health' && (
                                    <div className="space-y-3 p-1 text-xs">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <div>
                                                <label className="block font-semibold mb-1">
                                                    {isRTL ? 'اسم طبيب الأطفال' : 'Pédiatre / Médecin traitant'}
                                                </label>
                                                <input
                                                    type="text"
                                                    value={doctorName}
                                                    onChange={(e) => setDoctorName(e.target.value)}
                                                    placeholder="Dr. ..."
                                                    className="w-full px-3 py-2 rounded-lg border dark:bg-gray-700 dark:border-gray-600 text-xs"
                                                />
                                            </div>
                                            <div>
                                                <label className="block font-semibold mb-1">
                                                    {isRTL ? 'هاتف الطبيب' : 'Téléphone Médecin'}
                                                </label>
                                                <input
                                                    type="tel"
                                                    value={doctorPhone}
                                                    onChange={(e) => setDoctorPhone(e.target.value)}
                                                    placeholder="98 xxx xxx"
                                                    dir="ltr"
                                                    className="w-full px-3 py-2 rounded-lg border dark:bg-gray-700 dark:border-gray-600 text-xs"
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block font-semibold mb-1">
                                                    {isRTL ? 'الوزن (كلغ)' : 'Poids (kg)'}
                                                </label>
                                                <input
                                                    type="number"
                                                    step="0.1"
                                                    value={weightKg}
                                                    onChange={(e) => setWeightKg(e.target.value)}
                                                    placeholder="Ex: 10.2"
                                                    className="w-full px-3 py-2 rounded-lg border dark:bg-gray-700 dark:border-gray-600 text-xs"
                                                />
                                            </div>
                                            <div>
                                                <label className="block font-semibold mb-1">
                                                    {isRTL ? 'الطول (صم)' : 'Taille (cm)'}
                                                </label>
                                                <input
                                                    type="number"
                                                    step="0.5"
                                                    value={heightCm}
                                                    onChange={(e) => setHeightCm(e.target.value)}
                                                    placeholder="Ex: 80"
                                                    className="w-full px-3 py-2 rounded-lg border dark:bg-gray-700 dark:border-gray-600 text-xs"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block font-semibold mb-1">
                                                {isRTL ? 'الحساسيات والاحتياطات' : 'Allergies & particularités'}
                                            </label>
                                            <input
                                                type="text"
                                                value={allergies}
                                                onChange={(e) => setAllergies(e.target.value)}
                                                placeholder={isRTL ? 'لا توجد، حساسية حليب...' : 'Rien à signaler, intolérance...'}
                                                className="w-full px-3 py-2 rounded-lg border dark:bg-gray-700 dark:border-gray-600 text-xs"
                                            />
                                        </div>
                                        <div>
                                            <label className="block font-semibold mb-1">
                                                {isRTL ? 'عادات الطفل (النوم، المصاصة، الأكل)' : 'Rituels & Habitudes (sommeil, doudou)'}
                                            </label>
                                            <textarea
                                                rows="2"
                                                value={habitsNotes}
                                                onChange={(e) => setHabitsNotes(e.target.value)}
                                                placeholder="Doudou, tétine, habitudes d'endormissement..."
                                                className="w-full px-3 py-2 rounded-lg border dark:bg-gray-700 dark:border-gray-600 text-xs"
                                            />
                                        </div>
                                    </div>
                                )}

                                {admissionTab === 'contacts' && (
                                    <div className="space-y-3 p-1 text-xs">
                                        <p className="text-gray-500">
                                            {isRTL
                                                ? 'الأشخاص المفوضون لاستلام الطفل من الروضة (حتى شخصين) :'
                                                : 'Personnes autorisées à récupérer l\'enfant à la sortie (max 2) :'}
                                        </p>
                                        <div className="space-y-2">
                                            {trustedContacts.map((c, i) => (
                                                <div
                                                    key={i}
                                                    className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 dark:bg-gray-700 border dark:border-gray-600"
                                                >
                                                    <div>
                                                        <span className="font-bold text-gray-900 dark:text-white">{c.name}</span>
                                                        <span className="text-gray-500 text-[11px] block">{c.relation} • <span dir="ltr">{c.phone}</span></span>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => setTrustedContacts(trustedContacts.filter((_, idx) => idx !== i))}
                                                        className="text-red-500 hover:text-red-700 p-1"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                            {trustedContacts.length === 0 && !showAddContact && (
                                                <p className="text-center py-4 text-gray-400">
                                                    {isRTL ? 'لم يتم تحديد أشخاص بعد' : 'Aucune personne de confiance enregistrée.'}
                                                </p>
                                            )}
                                        </div>

                                        {showAddContact ? (
                                            <div className="p-3 rounded-lg border border-primary-200 dark:border-primary-800 bg-primary-50/30 space-y-2">
                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                                    <input
                                                        type="text"
                                                        placeholder={isRTL ? 'الاسم' : 'Nom'}
                                                        value={newContactName}
                                                        onChange={(e) => setNewContactName(e.target.value)}
                                                        className="px-2.5 py-1.5 rounded border text-xs"
                                                    />
                                                    <input
                                                        type="text"
                                                        placeholder={isRTL ? 'القرابة' : 'Lien (ex: Mamie)'}
                                                        value={newContactRelation}
                                                        onChange={(e) => setNewContactRelation(e.target.value)}
                                                        className="px-2.5 py-1.5 rounded border text-xs"
                                                    />
                                                    <input
                                                        type="tel"
                                                        placeholder={isRTL ? 'الهاتف' : 'Tél'}
                                                        value={newContactPhone}
                                                        onChange={(e) => setNewContactPhone(e.target.value)}
                                                        dir="ltr"
                                                        className="px-2.5 py-1.5 rounded border text-xs"
                                                    />
                                                </div>
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowAddContact(false)}
                                                        className="px-3 py-1 text-gray-500 text-xs"
                                                    >
                                                        {isRTL ? 'إلغاء' : 'Annuler'}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            if (newContactName && newContactPhone) {
                                                                setTrustedContacts([
                                                                    ...trustedContacts,
                                                                    { name: newContactName.trim(), relation: newContactRelation.trim() || 'Proche', phone: newContactPhone.trim() }
                                                                ]);
                                                                setNewContactName('');
                                                                setNewContactRelation('');
                                                                setNewContactPhone('');
                                                                setShowAddContact(false);
                                                            }
                                                        }}
                                                        className="px-3 py-1 bg-primary-600 text-white rounded text-xs font-semibold"
                                                    >
                                                        {isRTL ? 'إضافة' : 'Ajouter'}
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            trustedContacts.length < 2 && (
                                                <button
                                                    type="button"
                                                    onClick={() => setShowAddContact(true)}
                                                    className="w-full py-2 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 text-primary-600 dark:text-primary-400 font-semibold flex items-center justify-center gap-1.5"
                                                >
                                                    <Plus className="w-3.5 h-3.5" />
                                                    <span>{isRTL ? 'إضافة شخص موثوق' : 'Ajouter une personne'}</span>
                                                </button>
                                            )
                                        )}
                                    </div>
                                )}

                                {admissionTab === 'billing' && (
                                    <div className="space-y-3.5 p-1 text-xs">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <div>
                                                <label className="block font-semibold mb-1">
                                                    {isRTL ? 'نظام الحضور' : 'Régime d\'accueil'}
                                                </label>
                                                <select
                                                    value={careSchedule}
                                                    onChange={(e) => setCareSchedule(e.target.value)}
                                                    className="w-full px-3 py-2 rounded-lg border dark:bg-gray-700 dark:border-gray-600 text-xs font-medium"
                                                >
                                                    <option value="full_day">{isRTL ? 'يوم كامل (130 د.ت/شهر)' : 'Temps plein (130 DT/mois)'}</option>
                                                    <option value="half_day">{isRTL ? 'نصف يوم (100 د.ت/شهر)' : 'Demi-journée (100 DT/mois)'}</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block font-semibold mb-1">
                                                    {isRTL ? 'تاريخ الدخول الفعلي للروضة' : 'Date de début effective'}
                                                </label>
                                                <input
                                                    type="date"
                                                    value={enrollmentDate}
                                                    onChange={(e) => setEnrollmentDate(e.target.value)}
                                                    className="w-full px-3 py-2 rounded-lg border dark:bg-gray-700 dark:border-gray-600 text-xs"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                                            <label className="flex items-center gap-2 p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={saturdayAttendance}
                                                    onChange={(e) => setSaturdayAttendance(e.target.checked)}
                                                    className="w-4 h-4 rounded text-primary-600"
                                                />
                                                <span className="font-medium text-xs">
                                                    {isRTL ? 'حضور يوم السبت (+20 د.ت/شهر)' : 'Garde le samedi (+20 DT/mois)'}
                                                </span>
                                            </label>

                                            <div>
                                                <label className="block font-semibold mb-1">
                                                    {isRTL ? 'تخفيض شهري متفق عليه (د.ت)' : 'Remise mensuelle convenue (DT)'}
                                                </label>
                                                <input
                                                    type="number"
                                                    step="5"
                                                    value={monthlyDiscount}
                                                    onChange={(e) => setMonthlyDiscount(e.target.value)}
                                                    placeholder="0.00"
                                                    className="w-full px-3 py-2 rounded-lg border dark:bg-gray-700 dark:border-gray-600 text-xs"
                                                />
                                            </div>
                                        </div>

                                        {/* Estimation de la 1ère facture */}
                                        <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 flex items-center justify-between">
                                            <div>
                                                <p className="font-bold text-xs">
                                                    {isRTL ? 'المبلغ التقديري للوصل الأول عند الدخول :' : 'Total initial estimé (1er mois + Assurance) :'}
                                                </p>
                                                <p className="text-[11px] text-amber-700 dark:text-amber-300">
                                                    {isRTL
                                                        ? 'يشمل معلوم التأمين السنوي الإجباري (60 د.ت) + معلوم الشهر الأول'
                                                        : 'Inclut l\'assurance annuelle obligatoire (60 DT) + mensualité'}
                                                </p>
                                            </div>
                                            <span className="text-base font-extrabold text-amber-800 dark:text-amber-300 shrink-0">
                                                {Math.max(
                                                    0,
                                                    (careSchedule === 'half_day' ? 100 : 130) +
                                                    (saturdayAttendance ? 20 : 0) -
                                                    (parseFloat(monthlyDiscount) || 0)
                                                ) + 60} DT
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {admissionTab === 'docs' && (
                                    <div className="space-y-2 p-1 text-xs">
                                        <p className="text-gray-500">
                                            {isRTL
                                                ? 'الصور والوثائق المرفوعة مسبقاً من طرف الوالد :'
                                                : 'Documents et photos pré-téléversés par le parent :'}
                                        </p>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            {uploadedDocs.map((d, i) => (
                                                <a
                                                    key={i}
                                                    href={d.cloudinary_url || `/uploads/enrollments/${d.filename}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-primary-50 dark:hover:bg-primary-900/20 border border-gray-200 dark:border-gray-600 transition-colors"
                                                >
                                                    <FileText className="w-4 h-4 text-primary-600 shrink-0" />
                                                    <span className="truncate font-medium">{d.original_filename || d.filename}</span>
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-xs font-semibold mb-1">
                                        {isRTL ? 'ملاحظات إدارية عن المقابلة' : 'Notes d\'entretien / Remarques'}
                                    </label>
                                    <textarea
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        rows={2}
                                        className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-xs"
                                        placeholder={isRTL ? 'ملاحظات عن المقابلة والتأقلم...' : 'Remarques sur l\'entretien, période d\'adaptation...'}
                                    />
                                </div>

                                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                                    <button
                                        type="button"
                                        onClick={handleClose}
                                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-xs font-medium text-gray-700 dark:text-gray-300"
                                    >
                                        {isRTL ? 'إلغاء' : 'Fermer'}
                                    </button>

                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setAction('failed')}
                                            className="px-3.5 py-2.5 border border-rose-200 dark:border-rose-800 bg-rose-50/70 hover:bg-rose-100 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 rounded-xl transition-all text-xs font-semibold flex items-center gap-1.5"
                                        >
                                            <XCircle className="w-4 h-4 text-rose-500" />
                                            <span>{isRTL ? 'عدم إتمام المقابلة / تأجيل' : 'RDV non abouti / Reporter'}</span>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={handleValidate}
                                            disabled={loading}
                                            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-xs font-bold"
                                        >
                                            {loading ? (
                                                <RefreshCw className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <CheckCircle2 className="w-4 h-4" />
                                            )}
                                            <span>{isRTL ? 'تأكيد التسجيل وإدماج الطفل' : 'Valider l\'admission et intégrer l\'enfant'}</span>
                                        </button>
                                    </div>
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
                                                    {isRTL ? 'عدم إتمام المقابلة' : 'Rendez-vous non abouti'}
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
                                            onClick={() => setAction(isInscriptionAppointment ? 'validate' : null)}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors mt-4 text-xs font-medium"
                                        >
                                            {isRTL ? 'الرجوع إلى استمارة القبول' : 'Retour à la fiche d\'admission'}
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

                {/* Modale d'encaissement direct du premier règlement */}
                <BillingManagementModal
                    isOpen={showBillingModal}
                    onClose={() => setShowBillingModal(false)}
                    onSuccess={() => {
                        setShowBillingModal(false);
                        onSuccess?.();
                    }}
                />
            </div>
    );
};

export default AppointmentActionModal;
