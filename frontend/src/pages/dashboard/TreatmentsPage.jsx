import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
    Pill,
    Clock,
    User,
    Check,
    AlertCircle,
    Baby,
    Phone,
    Calendar,
    CheckCircle,
    XCircle,
    RefreshCw,
    ArrowLeft,
    X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';
import { useTheme } from '../../hooks/useTheme';
import useIsMobile from '../../hooks/useIsMobile';
import { useAccess } from '../../access';
import api from '../../services/api';
import { Button } from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { toast } from 'react-hot-toast';

const TreatmentsPage = () => {
    const { user } = useAuth();
    const { isRTL } = useLanguage();
    const { isDark } = useTheme();
    const isMobile = useIsMobile();
    const navigate = useNavigate();
    const { can, loading: accessLoading } = useAccess();

    useEffect(() => {
        if (!accessLoading && !can('TREATMENTS_MANAGE')) {
            toast.error(isRTL ? 'ليس لديك صلاحية الوصول إلى العلاجات الطبية' : 'Accès non autorisé aux traitements médicaux');
            navigate('/dashboard', { replace: true });
        }
    }, [accessLoading, can, navigate, isRTL]);

    // Couleurs style direction (comme app mobile)
    const dirColors = {
        background: '#0F172A',
        card: '#1E293B',
        cardLight: '#334155',
        text: '#F8FAFC',
        textSecondary: '#94A3B8',
        primary: '#8B5CF6',
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
    };

    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('today'); // 'today' | 'pending'
    const [treatments, setTreatments] = useState([]);
    const [pendingTreatments, setPendingTreatments] = useState([]);
    const [staffMembers, setStaffMembers] = useState([]);
    const [assignedStaffMap, setAssignedStaffMap] = useState({});
    const [administering, setAdministering] = useState(null);
    const [approvingId, setApprovingId] = useState(null);
    const [rejectingId, setRejectingId] = useState(null);
    const [rejectReason, setRejectReason] = useState('');
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [notes, setNotes] = useState('');
    const [showNotesModal, setShowNotesModal] = useState(false);
    const [selectedTreatment, setSelectedTreatment] = useState(null);

    const isAdmin = user?.role === 'admin' || user?.role === 'developer';

    const loadTreatments = useCallback(async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/treatments/today');
            if (response.data?.success) {
                setTreatments(response.data.treatments || []);
            }
        } catch (error) {
            console.error('Erreur chargement traitements:', error);
            toast.error('Erreur lors du chargement des traitements');
        } finally {
            setLoading(false);
        }
    }, []);

    const loadPendingTreatments = useCallback(async () => {
        if (!isAdmin) return;
        try {
            const res = await api.get('/api/treatments/pending');
            if (res.data?.success) {
                setPendingTreatments(res.data.pending_treatments || []);
            }
        } catch (err) {
            console.error('Erreur chargement demandes en attente:', err);
        }
    }, [isAdmin]);

    const loadStaffMembers = useCallback(async () => {
        if (!isAdmin) return;
        try {
            const res = await api.get('/api/users?role=staff');
            if (res.data?.success) {
                const members = (res.data.users || []).filter(u => u.role === 'staff' || u.role === 'admin');
                setStaffMembers(members);
            }
        } catch (err) {
            console.error('Erreur chargement staff:', err);
        }
    }, [isAdmin]);

    useEffect(() => {
        loadTreatments();
        loadPendingTreatments();
        loadStaffMembers();
        const interval = setInterval(() => {
            loadTreatments();
            loadPendingTreatments();
        }, 60000);
        return () => clearInterval(interval);
    }, [loadTreatments, loadPendingTreatments, loadStaffMembers]);

    const handleApprove = async (treatmentId) => {
        const staffId = assignedStaffMap[treatmentId];
        if (!staffId) {
            toast.error(isRTL ? 'يرجى اختيار مربية من الفريق' : 'Veuillez sélectionner un membre du staff');
            return;
        }

        try {
            setApprovingId(treatmentId);
            const res = await api.put(`/api/treatments/${treatmentId}/approve`, {
                assigned_staff_id: staffId
            });
            if (res.data?.success) {
                toast.success(isRTL ? 'تم قبول العلاج وتعيين المهمة بنجاح' : 'Traitement validé et assigné avec succès !');
                loadPendingTreatments();
                loadTreatments();
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Erreur lors de la validation');
        } finally {
            setApprovingId(null);
        }
    };

    const handleReject = async () => {
        if (!rejectingId) return;
        try {
            const res = await api.put(`/api/treatments/${rejectingId}/reject`, {
                rejection_reason: rejectReason || (isRTL ? 'طلب غير مستوفي للشروط' : 'Demande non conforme')
            });
            if (res.data?.success) {
                toast.success(isRTL ? 'تم رفض الطلب وإعلام الولي' : 'Demande refusée et parent notifié');
                setShowRejectModal(false);
                setRejectingId(null);
                setRejectReason('');
                loadPendingTreatments();
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Erreur lors du refus');
        }
    };

    const handleAdminister = async (treatmentId, scheduledTime = null) => {
        try {
            setAdministering(treatmentId);
            const response = await api.post(`/api/treatments/${treatmentId}/administer`, {
                notes: notes || null,
                scheduled_time: scheduledTime
            });

            if (response.data?.success) {
                toast.success('Traitement administré avec succès');
                setNotes('');
                setShowNotesModal(false);
                loadTreatments();
            }
        } catch (error) {
            console.error('Erreur administration:', error);
            toast.error(error.response?.data?.message || 'Erreur lors de l\'administration');
        } finally {
            setAdministering(null);
        }
    };

    const openNotesModal = (treatment) => {
        setSelectedTreatment(treatment);
        setNotes('');
        setShowNotesModal(true);
    };

    const getTimingLabel = (type, hours) => {
        switch (type) {
            case 'before_meal': return isRTL ? 'قبل الوجبات' : 'Avant les repas';
            case 'after_meal': return isRTL ? 'بعد الوجبات' : 'Après les repas';
            case 'interval': return isRTL ? `كل ${hours} ساعات` : `Toutes les ${hours}h`;
            case 'specific_times': return isRTL ? 'أوقات محددة' : 'Heures fixes';
            default: return type;
        }
    };

    if (loading) {
        return (
            <div
                className="flex items-center justify-center min-h-screen"
                style={isMobile ? { backgroundColor: dirColors.background } : {}}
            >
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    // VERSION MOBILE - Style identique à l'app mobile
    if (isMobile) {
        return (
            <div style={{ backgroundColor: dirColors.background, minHeight: '100vh' }}>
                {/* Header style app mobile */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 16px',
                        borderBottom: `1px solid ${dirColors.card}`,
                        position: 'sticky',
                        top: 0,
                        backgroundColor: dirColors.background,
                        zIndex: 10
                    }}
                >
                    <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                        <ArrowLeft size={24} color={dirColors.text} />
                    </button>
                    <span style={{ fontSize: 18, fontWeight: 600, color: dirColors.text }}>
                        💊 Traitements Médicaux
                    </span>
                    <button onClick={() => { loadTreatments(); loadPendingTreatments(); }} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                        <RefreshCw size={24} color={dirColors.text} />
                    </button>
                </div>

                {/* Onglets Direction / Staff */}
                {isAdmin && (
                    <div style={{ display: 'flex', padding: '8px 16px', gap: 8, backgroundColor: dirColors.card }}>
                        <button
                            onClick={() => setActiveTab('today')}
                            style={{
                                flex: 1,
                                padding: '8px 12px',
                                borderRadius: 10,
                                border: 'none',
                                fontSize: 13,
                                fontWeight: 600,
                                backgroundColor: activeTab === 'today' ? dirColors.primary : dirColors.cardLight,
                                color: dirColors.text,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 6
                            }}
                        >
                            <span>💊 Du jour</span>
                            <span style={{ fontSize: 11, padding: '2px 6px', borderRadius: 8, backgroundColor: 'rgba(0,0,0,0.2)' }}>
                                {treatments.length}
                            </span>
                        </button>
                        <button
                            onClick={() => setActiveTab('pending')}
                            style={{
                                flex: 1,
                                padding: '8px 12px',
                                borderRadius: 10,
                                border: 'none',
                                fontSize: 13,
                                fontWeight: 600,
                                backgroundColor: activeTab === 'pending' ? dirColors.warning : dirColors.cardLight,
                                color: activeTab === 'pending' ? '#000' : dirColors.text,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 6
                            }}
                        >
                            <span>📋 À valider</span>
                            {pendingTreatments.length > 0 && (
                                <span style={{
                                    fontSize: 11,
                                    padding: '2px 6px',
                                    borderRadius: 8,
                                    backgroundColor: activeTab === 'pending' ? '#000' : dirColors.warning,
                                    color: activeTab === 'pending' ? '#fff' : '#000',
                                    fontWeight: 700
                                }}>
                                    {pendingTreatments.length}
                                </span>
                            )}
                        </button>
                    </div>
                )}

                {/* Contenu */}
                <div style={{ padding: 16, paddingBottom: 100 }}>
                    {activeTab === 'pending' ? (
                        /* VUE DEMANDES EN ATTENTE (POUR L'ADMIN LE MATIN) */
                        pendingTreatments.length === 0 ? (
                            <div style={{ textAlign: 'center', paddingTop: 60, paddingBottom: 60 }}>
                                <CheckCircle size={64} color={dirColors.success} style={{ margin: '0 auto' }} />
                                <p style={{ fontSize: 18, fontWeight: 600, color: dirColors.text, marginTop: 16 }}>
                                    Aucune demande en attente
                                </p>
                                <p style={{ fontSize: 14, color: dirColors.textSecondary, marginTop: 8 }}>
                                    Toutes les demandes de médicaments des parents ont été traitées.
                                </p>
                            </div>
                        ) : (
                            pendingTreatments.map((t) => (
                                <div
                                    key={t.id}
                                    style={{
                                        backgroundColor: dirColors.card,
                                        borderRadius: 16,
                                        padding: 16,
                                        marginBottom: 16,
                                        border: `1px solid ${dirColors.warning}40`
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                                        <div style={{
                                            width: 44,
                                            height: 44,
                                            borderRadius: 22,
                                            backgroundColor: dirColors.warning + '25',
                                            display: 'flex',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            marginRight: 10,
                                        }}>
                                            <Baby size={22} color={dirColors.warning} />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <p style={{ fontSize: 16, fontWeight: 700, color: dirColors.text, margin: 0 }}>
                                                {t.child_first_name} {t.child_last_name}
                                            </p>
                                            <p style={{ fontSize: 12, color: dirColors.textSecondary, margin: 0 }}>
                                                Parent: {t.parent_first_name} {t.parent_last_name} {t.parent_phone ? `(${t.parent_phone})` : ''}
                                            </p>
                                        </div>
                                        <span style={{
                                            backgroundColor: dirColors.warning + '20',
                                            color: dirColors.warning,
                                            padding: '4px 8px',
                                            borderRadius: 8,
                                            fontSize: 11,
                                            fontWeight: 600
                                        }}>
                                            En attente
                                        </span>
                                    </div>

                                    {/* Infos médicament */}
                                    <div style={{ backgroundColor: dirColors.cardLight, borderRadius: 10, padding: 12, marginBottom: 12 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                            <span style={{ fontSize: 15, fontWeight: 700, color: dirColors.text }}>
                                                💊 {t.medication_name}
                                            </span>
                                            <span style={{ fontSize: 14, fontWeight: 600, color: dirColors.primary }}>
                                                {t.dose}
                                            </span>
                                        </div>
                                        <p style={{ fontSize: 12, color: dirColors.textSecondary, margin: '2px 0' }}>
                                            Période: {new Date(t.start_date).toLocaleDateString()} au {new Date(t.end_date).toLocaleDateString()} ({t.duration_days} jours)
                                        </p>
                                        {t.notes && (
                                            <p style={{ fontSize: 12, color: '#CBD5E1', marginTop: 4, fontStyle: 'italic' }}>
                                                Note parent: "{t.notes}"
                                            </p>
                                        )}
                                    </div>

                                    {/* Sélecteur de staff */}
                                    <div style={{ marginBottom: 12 }}>
                                        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: dirColors.textSecondary, marginBottom: 6 }}>
                                            👩‍🏫 Assigner à une éducatrice :
                                        </label>
                                        <select
                                            value={assignedStaffMap[t.id] || ''}
                                            onChange={(e) => setAssignedStaffMap({ ...assignedStaffMap, [t.id]: e.target.value })}
                                            style={{
                                                width: '100%',
                                                padding: '10px 12px',
                                                borderRadius: 10,
                                                backgroundColor: dirColors.cardLight,
                                                color: dirColors.text,
                                                border: `1px solid ${assignedStaffMap[t.id] ? dirColors.primary : '#475569'}`,
                                                fontSize: 14,
                                                outline: 'none'
                                            }}
                                        >
                                            <option value="">-- Choisir un membre de l'équipe --</option>
                                            {staffMembers.map((s) => (
                                                <option key={s.id} value={s.id}>
                                                    {s.first_name} {s.last_name} ({s.staff_position || (s.role === 'admin' ? 'Direction' : 'Éducatrice')})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Boutons d'action */}
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <button
                                            onClick={() => {
                                                setRejectingId(t.id);
                                                setShowRejectModal(true);
                                            }}
                                            style={{
                                                flex: 1,
                                                padding: '10px',
                                                borderRadius: 10,
                                                border: 'none',
                                                backgroundColor: '#EF444420',
                                                color: '#EF4444',
                                                fontWeight: 600,
                                                fontSize: 13,
                                                cursor: 'pointer'
                                            }}
                                        >
                                            Refuser
                                        </button>
                                        <button
                                            onClick={() => handleApprove(t.id)}
                                            disabled={approvingId === t.id}
                                            style={{
                                                flex: 2,
                                                padding: '10px',
                                                borderRadius: 10,
                                                border: 'none',
                                                backgroundColor: dirColors.success,
                                                color: '#fff',
                                                fontWeight: 700,
                                                fontSize: 13,
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: 6
                                            }}
                                        >
                                            {approvingId === t.id ? (
                                                <LoadingSpinner size="sm" />
                                            ) : (
                                                <>
                                                    <Check size={16} />
                                                    Valider & Assigner
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            ))
                        )
                    ) : treatments.length === 0 ? (
                        <div style={{ textAlign: 'center', paddingTop: 60, paddingBottom: 60 }}>
                            <CheckCircle size={64} color={dirColors.success} style={{ margin: '0 auto' }} />
                            <p style={{ fontSize: 18, fontWeight: 600, color: dirColors.text, marginTop: 16 }}>
                                Aucun traitement aujourd'hui
                            </p>
                            <p style={{ fontSize: 14, color: dirColors.textSecondary, marginTop: 8 }}>
                                Tous les enfants présents n'ont pas de traitement en cours
                            </p>
                        </div>
                    ) : (
                        treatments.map((treatment) => {
                            const todayGiven = treatment.today_administrations?.length || 0;
                            const nextDose = treatment.schedule?.find(s => !s.passed);

                            return (
                                <div
                                    key={treatment.id}
                                    style={{
                                        backgroundColor: dirColors.card,
                                        borderRadius: 16,
                                        padding: 16,
                                        marginBottom: 16,
                                    }}
                                >
                                    {/* Header enfant */}
                                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
                                        <div style={{
                                            width: 50,
                                            height: 50,
                                            borderRadius: 25,
                                            backgroundColor: dirColors.primary + '30',
                                            display: 'flex',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            marginRight: 12,
                                        }}>
                                            <Baby size={24} color={dirColors.primary} />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <p style={{ fontSize: 18, fontWeight: 600, color: dirColors.text, margin: 0 }}>
                                                {treatment.child_first_name} {treatment.child_last_name}
                                            </p>
                                            <p style={{ fontSize: 13, color: dirColors.textSecondary, margin: 0 }}>
                                                Parent: {treatment.parent_first_name} {treatment.parent_last_name}
                                            </p>
                                        </div>
                                        {treatment.check_in_time && (
                                            <span style={{
                                                backgroundColor: dirColors.success + '20',
                                                color: dirColors.success,
                                                padding: '4px 8px',
                                                borderRadius: 8,
                                                fontSize: 12,
                                            }}>
                                                Présent
                                            </span>
                                        )}
                                    </div>

                                    {/* Détails médicament */}
                                    <div style={{
                                        backgroundColor: dirColors.cardLight,
                                        borderRadius: 12,
                                        padding: 14,
                                        marginBottom: 12,
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                                            <span style={{ fontSize: 24, marginRight: 10 }}>💊</span>
                                            <div style={{ flex: 1 }}>
                                                <p style={{ fontSize: 18, fontWeight: 700, color: dirColors.text, margin: 0 }}>
                                                    {treatment.medication_name}
                                                </p>
                                                <p style={{ fontSize: 15, color: dirColors.primary, fontWeight: 600, margin: 0 }}>
                                                    {treatment.dose}
                                                </p>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                            <span style={{
                                                backgroundColor: '#3B82F630',
                                                color: '#60A5FA',
                                                padding: '4px 10px',
                                                borderRadius: 12,
                                                fontSize: 13,
                                            }}>
                                                {getTimingLabel(treatment.timing_type, treatment.interval_hours)}
                                            </span>
                                            <span style={{
                                                backgroundColor: todayGiven > 0 ? dirColors.success + '30' : dirColors.warning + '30',
                                                color: todayGiven > 0 ? dirColors.success : dirColors.warning,
                                                padding: '4px 10px',
                                                borderRadius: 12,
                                                fontSize: 13,
                                            }}>
                                                {todayGiven} dose{todayGiven > 1 ? 's' : ''} aujourd'hui
                                            </span>
                                        </div>
                                        {treatment.notes && (
                                            <p style={{ fontSize: 13, color: dirColors.textSecondary, marginTop: 10, fontStyle: 'italic' }}>
                                                📝 {treatment.notes}
                                            </p>
                                        )}
                                    </div>

                                    {/* Planning des doses */}
                                    {treatment.schedule && treatment.schedule.length > 0 && (
                                        <div style={{ marginBottom: 12 }}>
                                            <p style={{ fontSize: 13, color: dirColors.textSecondary, marginBottom: 8 }}>
                                                Planning des doses :
                                            </p>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                                {treatment.schedule.map((slot, idx) => (
                                                    <span
                                                        key={idx}
                                                        style={{
                                                            backgroundColor: slot.passed ? dirColors.success + '30' : dirColors.card,
                                                            color: slot.passed ? dirColors.success : dirColors.text,
                                                            padding: '6px 12px',
                                                            borderRadius: 8,
                                                            fontSize: 13,
                                                            fontWeight: 500,
                                                            border: slot.passed ? 'none' : `1px solid ${dirColors.cardLight}`,
                                                        }}
                                                    >
                                                        {slot.passed ? '✓ ' : ''}{slot.time}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Contact parent */}
                                    {treatment.parent_phone && (
                                        <a
                                            href={`tel:${treatment.parent_phone}`}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 8,
                                                color: '#60A5FA',
                                                fontSize: 14,
                                                marginBottom: 12,
                                                textDecoration: 'none',
                                            }}
                                        >
                                            <Phone size={16} />
                                            {treatment.parent_phone}
                                        </a>
                                    )}

                                    {/* Bouton administrer */}
                                    <button
                                        onClick={() => openNotesModal(treatment)}
                                        disabled={administering === treatment.id}
                                        style={{
                                            width: '100%',
                                            backgroundColor: dirColors.primary,
                                            color: 'white',
                                            padding: '14px 20px',
                                            borderRadius: 12,
                                            border: 'none',
                                            fontSize: 16,
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: 8,
                                        }}
                                    >
                                        {administering === treatment.id ? (
                                            <LoadingSpinner size="sm" />
                                        ) : (
                                            <>
                                                <Check size={20} />
                                                Confirmer l'administration
                                            </>
                                        )}
                                    </button>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Modal notes - style mobile */}
                {showNotesModal && selectedTreatment && (
                    <div style={{
                        position: 'fixed',
                        inset: 0,
                        backgroundColor: 'rgba(0,0,0,0.7)',
                        display: 'flex',
                        alignItems: 'flex-end',
                        zIndex: 50,
                    }}>
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            style={{
                                width: '100%',
                                backgroundColor: dirColors.card,
                                borderTopLeftRadius: 24,
                                borderTopRightRadius: 24,
                                padding: 20,
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                <h3 style={{ fontSize: 18, fontWeight: 600, color: dirColors.text, margin: 0 }}>
                                    Confirmer l'administration
                                </h3>
                                <button
                                    onClick={() => setShowNotesModal(false)}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                                >
                                    <X size={24} color={dirColors.textSecondary} />
                                </button>
                            </div>

                            <div style={{
                                backgroundColor: dirColors.cardLight,
                                borderRadius: 12,
                                padding: 12,
                                marginBottom: 16,
                            }}>
                                <p style={{ fontWeight: 600, color: dirColors.text, margin: 0 }}>
                                    {selectedTreatment.child_first_name} {selectedTreatment.child_last_name}
                                </p>
                                <p style={{ fontSize: 14, color: dirColors.textSecondary, margin: '4px 0 0' }}>
                                    {selectedTreatment.medication_name} - {selectedTreatment.dose}
                                </p>
                            </div>

                            <div style={{ marginBottom: 16 }}>
                                <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: dirColors.textSecondary, marginBottom: 8 }}>
                                    Notes (optionnel)
                                </label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Observations éventuelles..."
                                    rows={3}
                                    style={{
                                        width: '100%',
                                        backgroundColor: dirColors.cardLight,
                                        border: `1px solid ${dirColors.cardLight}`,
                                        borderRadius: 12,
                                        padding: 12,
                                        color: dirColors.text,
                                        fontSize: 16,
                                        resize: 'none',
                                    }}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: 12 }}>
                                <button
                                    onClick={() => setShowNotesModal(false)}
                                    style={{
                                        flex: 1,
                                        backgroundColor: dirColors.cardLight,
                                        color: dirColors.text,
                                        padding: '14px 20px',
                                        borderRadius: 12,
                                        border: 'none',
                                        fontSize: 16,
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                    }}
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={() => handleAdminister(selectedTreatment.id)}
                                    disabled={administering === selectedTreatment.id}
                                    style={{
                                        flex: 1,
                                        backgroundColor: dirColors.success,
                                        color: 'white',
                                        padding: '14px 20px',
                                        borderRadius: 12,
                                        border: 'none',
                                        fontSize: 16,
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: 8,
                                    }}
                                >
                                    {administering === selectedTreatment.id ? (
                                        <LoadingSpinner size="sm" />
                                    ) : (
                                        <>
                                            <Check size={20} />
                                            Confirmer
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* Modal refus - style mobile */}
                {showRejectModal && (
                    <div style={{
                        position: 'fixed',
                        inset: 0,
                        backgroundColor: 'rgba(0,0,0,0.7)',
                        display: 'flex',
                        alignItems: 'flex-end',
                        zIndex: 55,
                    }}>
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            style={{
                                width: '100%',
                                backgroundColor: dirColors.card,
                                borderTopLeftRadius: 24,
                                borderTopRightRadius: 24,
                                padding: 20,
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                <h3 style={{ fontSize: 18, fontWeight: 700, color: dirColors.danger, margin: 0 }}>
                                    Refuser la demande de médicament
                                </h3>
                                <button
                                    onClick={() => setShowRejectModal(false)}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                                >
                                    <X size={20} color={dirColors.textSecondary} />
                                </button>
                            </div>

                            <p style={{ fontSize: 13, color: dirColors.textSecondary, marginBottom: 12 }}>
                                Veuillez indiquer au parent le motif du refus (ex: ordonnance manquante, posologie non claire...) :
                            </p>

                            <textarea
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                placeholder="Motif du refus..."
                                rows={3}
                                style={{
                                    width: '100%',
                                    backgroundColor: dirColors.cardLight,
                                    border: `1px solid ${dirColors.cardLight}`,
                                    borderRadius: 12,
                                    padding: 12,
                                    color: dirColors.text,
                                    fontSize: 15,
                                    resize: 'none',
                                    marginBottom: 16
                                }}
                            />

                            <div style={{ display: 'flex', gap: 12 }}>
                                <button
                                    onClick={() => setShowRejectModal(false)}
                                    style={{
                                        flex: 1,
                                        backgroundColor: dirColors.cardLight,
                                        color: dirColors.text,
                                        padding: '14px',
                                        borderRadius: 12,
                                        border: 'none',
                                        fontSize: 15,
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                    }}
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={handleReject}
                                    style={{
                                        flex: 1,
                                        backgroundColor: dirColors.danger,
                                        color: 'white',
                                        padding: '14px',
                                        borderRadius: 12,
                                        border: 'none',
                                        fontSize: 15,
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                    }}
                                >
                                    Confirmer le refus
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </div>
        );
    }

    // VERSION DESKTOP - Design original
    return (
        <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'} p-4 md:p-6`}>
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            💊 {isRTL ? 'العلاجات الطبية اليوم' : 'Traitements médicaux du jour'}
                        </h1>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            {isRTL ? 'إدارة علاجات الأطفال الحاضرين' : 'Administrer les traitements des enfants présents'}
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        onClick={loadTreatments}
                        className="flex items-center gap-2"
                    >
                        <RefreshCw className="w-4 h-4" />
                        {isRTL ? 'تحديث' : 'Actualiser'}
                    </Button>
                </div>

                {/* Liste des traitements */}
                {treatments.length === 0 ? (
                    <Card className={isDark ? 'bg-gray-800 border-gray-700' : ''}>
                        <CardContent className="py-12 text-center">
                            <CheckCircle className={`w-16 h-16 mx-auto mb-4 text-green-500`} />
                            <h3 className={`text-lg font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                {isRTL ? 'لا توجد علاجات لإعطائها' : 'Aucun traitement à administrer'}
                            </h3>
                            <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                                {isRTL ? 'جميع الأطفال الحاضرين ليس لديهم علاجات نشطة' : 'Tous les enfants présents n\'ont pas de traitements actifs'}
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {treatments.map((treatment) => {
                            const todayGiven = treatment.today_administrations?.length || 0;
                            const nextDose = treatment.schedule?.find(s => !s.passed);

                            return (
                                <motion.div
                                    key={treatment.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                >
                                    <Card className={`${isDark ? 'bg-gray-800 border-gray-700' : ''} overflow-hidden h-full`}>
                                        {/* Header enfant */}
                                        <div className={`p-4 ${isDark ? 'bg-gray-900' : 'bg-purple-50'}`}>
                                            <div className="flex items-center gap-3">
                                                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isDark ? 'bg-purple-900/50' : 'bg-purple-200'}`}>
                                                    <Baby className="w-6 h-6 text-purple-600" />
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                        {treatment.child_first_name} {treatment.child_last_name}
                                                    </h3>
                                                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                                        Parent: {treatment.parent_first_name} {treatment.parent_last_name}
                                                    </p>
                                                </div>
                                                {treatment.check_in_time && (
                                                    <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full dark:bg-green-900/30 dark:text-green-400">
                                                        {isRTL ? 'حاضر' : 'Présent'}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <CardContent className="p-4">
                                            {/* Médicament */}
                                            <div className={`p-3 rounded-lg mb-4 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Pill className="w-5 h-5 text-purple-600" />
                                                    <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                        {treatment.medication_name}
                                                    </span>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2 text-sm">
                                                    <div>
                                                        <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>Dose:</span>
                                                        <span className={`ml-1 font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                                            {treatment.dose}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>Timing:</span>
                                                        <span className={`ml-1 font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                                            {getTimingLabel(treatment.timing_type, treatment.interval_hours)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Notes du parent */}
                                            {treatment.notes && (
                                                <div className={`p-2 rounded mb-4 text-sm ${isDark ? 'bg-yellow-900/20 text-yellow-300' : 'bg-yellow-50 text-yellow-800'}`}>
                                                    <AlertCircle className="w-4 h-4 inline mr-1" />
                                                    {treatment.notes}
                                                </div>
                                            )}

                                            {/* Prochaine dose */}
                                            {nextDose && (
                                                <div className={`flex items-center gap-2 mb-4 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                                    <Clock className="w-4 h-4" />
                                                    <span>{isRTL ? 'الجرعة التالية:' : 'Prochaine dose:'}</span>
                                                    <span className="font-medium text-purple-600">{nextDose.time}</span>
                                                </div>
                                            )}

                                            {/* Administrations du jour */}
                                            {todayGiven > 0 && (
                                                <div className="mb-4">
                                                    <p className={`text-xs mb-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                                        {isRTL ? 'الجرعات المعطاة اليوم:' : 'Doses données aujourd\'hui:'}
                                                    </p>
                                                    <div className="flex flex-wrap gap-1">
                                                        {treatment.today_administrations.map((admin, idx) => (
                                                            <span
                                                                key={idx}
                                                                className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded dark:bg-green-900/30 dark:text-green-400"
                                                            >
                                                                {new Date(admin.administered_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Contact parent */}
                                            {treatment.parent_phone && (
                                                <a
                                                    href={`tel:${treatment.parent_phone}`}
                                                    className={`flex items-center gap-2 text-sm mb-4 ${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}
                                                >
                                                    <Phone className="w-4 h-4" />
                                                    {treatment.parent_phone}
                                                </a>
                                            )}

                                            {/* Bouton administrer */}
                                            <Button
                                                onClick={() => openNotesModal(treatment)}
                                                disabled={administering === treatment.id}
                                                className="w-full"
                                            >
                                                {administering === treatment.id ? (
                                                    <LoadingSpinner size="sm" />
                                                ) : (
                                                    <>
                                                        <Check className="w-4 h-4 mr-2" />
                                                        {isRTL ? 'تأكيد الإعطاء' : 'Confirmer l\'administration'}
                                                    </>
                                                )}
                                            </Button>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            );
                        })}
                    </div>
                )}

                {/* Modal notes */}
                {showNotesModal && selectedTreatment && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className={`w-full max-w-md mx-4 rounded-xl shadow-xl p-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}
                        >
                            <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {isRTL ? 'تأكيد إعطاء الدواء' : 'Confirmer l\'administration'}
                            </h3>

                            <div className={`p-3 rounded-lg mb-4 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
                                <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                    {selectedTreatment.child_first_name} {selectedTreatment.child_last_name}
                                </p>
                                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {selectedTreatment.medication_name} - {selectedTreatment.dose}
                                </p>
                            </div>

                            <div className="mb-4">
                                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                    {isRTL ? 'ملاحظات (اختياري)' : 'Notes (optionnel)'}
                                </label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder={isRTL ? 'أي ملاحظات...' : 'Observations éventuelles...'}
                                    rows={3}
                                    className={`w-full px-3 py-2 rounded-lg border ${isDark
                                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                                        }`}
                                />
                            </div>

                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    onClick={() => setShowNotesModal(false)}
                                    className="flex-1"
                                >
                                    {isRTL ? 'إلغاء' : 'Annuler'}
                                </Button>
                                <Button
                                    onClick={() => handleAdminister(selectedTreatment.id)}
                                    disabled={administering === selectedTreatment.id}
                                    className="flex-1"
                                >
                                    {administering === selectedTreatment.id ? (
                                        <LoadingSpinner size="sm" />
                                    ) : (
                                        <>
                                            <Check className="w-4 h-4 mr-2" />
                                            {isRTL ? 'تأكيد' : 'Confirmer'}
                                        </>
                                    )}
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TreatmentsPage;
