/**
 * Page de gestion des témoignages pour l'admin
 * Permet de modérer, approuver et rejeter les témoignages
 */

import { useState, useEffect } from 'react';
import {
    MessageCircle, Check, X, Star, Clock, CheckCircle,
    XCircle, Trash2, Eye, Filter, RefreshCw, Award
} from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import { useTheme } from '../../hooks/useTheme';
import api from '../../services/api';

const TestimonialsManagementPage = () => {
    const { isRTL } = useLanguage();
    const { isDark } = useTheme();
    const [testimonials, setTestimonials] = useState([]);
    const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0 });
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [selectedTestimonial, setSelectedTestimonial] = useState(null);
    const [actionLoading, setActionLoading] = useState(null);
    const [rejectNotes, setRejectNotes] = useState('');

    useEffect(() => {
        fetchTestimonials();
    }, [filter]);

    const fetchTestimonials = async () => {
        try {
            setLoading(true);
            const params = filter !== 'all' ? `?status=${filter}` : '';
            const response = await api.get(`/api/testimonials/all${params}`);
            if (response.data.success) {
                setTestimonials(response.data.testimonials);
                setStats(response.data.stats);
            }
        } catch (error) {
            console.error('Erreur chargement témoignages:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id, isFeatured = false) => {
        try {
            setActionLoading(id);
            await api.put(`/api/testimonials/${id}/approve`, { is_featured: isFeatured });
            fetchTestimonials();
            setSelectedTestimonial(null);
        } catch (error) {
            console.error('Erreur approbation:', error);
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async (id) => {
        try {
            setActionLoading(id);
            await api.put(`/api/testimonials/${id}/reject`, { admin_notes: rejectNotes });
            fetchTestimonials();
            setSelectedTestimonial(null);
            setRejectNotes('');
        } catch (error) {
            console.error('Erreur rejet:', error);
        } finally {
            setActionLoading(null);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm(isRTL ? 'هل أنت متأكد من الحذف؟' : 'Êtes-vous sûr de vouloir supprimer ?')) {
            return;
        }
        try {
            setActionLoading(id);
            await api.delete(`/api/testimonials/${id}`);
            fetchTestimonials();
        } catch (error) {
            console.error('Erreur suppression:', error);
        } finally {
            setActionLoading(null);
        }
    };

    const handleToggleFeatured = async (id, currentFeatured) => {
        try {
            setActionLoading(id);
            await api.put(`/api/testimonials/${id}/feature`, { is_featured: !currentFeatured });
            fetchTestimonials();
        } catch (error) {
            console.error('Erreur mise en avant:', error);
        } finally {
            setActionLoading(null);
        }
    };

    const renderStars = (rating) => (
        <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
                <Star
                    key={star}
                    className={`w-4 h-4 ${star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                        }`}
                />
            ))}
        </div>
    );

    const getStatusBadge = (status) => {
        const badges = {
            pending: {
                icon: Clock,
                text: isRTL ? 'في الانتظار' : 'En attente',
                color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
            },
            approved: {
                icon: CheckCircle,
                text: isRTL ? 'موافق عليه' : 'Approuvé',
                color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
            },
            rejected: {
                icon: XCircle,
                text: isRTL ? 'مرفوض' : 'Rejeté',
                color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
            }
        };
        const badge = badges[status];
        const Icon = badge.icon;
        return (
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
                <Icon className="w-3 h-3" />
                {badge.text}
            </span>
        );
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString(isRTL ? 'ar-TN' : 'fr-FR', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <MessageCircle className="w-8 h-8 text-blue-500" />
                        {isRTL ? 'إدارة التقييمات' : 'Gestion des témoignages'}
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        {isRTL ? 'مراجعة والموافقة على تقييمات الأولياء' : 'Modérez et approuvez les avis des parents'}
                    </p>
                </div>
                <button
                    onClick={fetchTestimonials}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    {isRTL ? 'تحديث' : 'Actualiser'}
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={`p-4 rounded-xl ${isDark ? 'bg-yellow-900/20' : 'bg-yellow-50'} border border-yellow-200 dark:border-yellow-800`}>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-yellow-500/20 rounded-lg">
                            <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">{stats.pending}</p>
                            <p className="text-sm text-yellow-600 dark:text-yellow-400">
                                {isRTL ? 'في الانتظار' : 'En attente'}
                            </p>
                        </div>
                    </div>
                </div>
                <div className={`p-4 rounded-xl ${isDark ? 'bg-green-900/20' : 'bg-green-50'} border border-green-200 dark:border-green-800`}>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-500/20 rounded-lg">
                            <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-green-700 dark:text-green-300">{stats.approved}</p>
                            <p className="text-sm text-green-600 dark:text-green-400">
                                {isRTL ? 'موافق عليه' : 'Approuvés'}
                            </p>
                        </div>
                    </div>
                </div>
                <div className={`p-4 rounded-xl ${isDark ? 'bg-red-900/20' : 'bg-red-50'} border border-red-200 dark:border-red-800`}>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-500/20 rounded-lg">
                            <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-red-700 dark:text-red-300">{stats.rejected}</p>
                            <p className="text-sm text-red-600 dark:text-red-400">
                                {isRTL ? 'مرفوض' : 'Rejetés'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2 flex-wrap">
                <Filter className="w-5 h-5 text-gray-500" />
                {['all', 'pending', 'approved', 'rejected'].map((status) => (
                    <button
                        key={status}
                        onClick={() => setFilter(status)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === status
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                            }`}
                    >
                        {status === 'all' && (isRTL ? 'الكل' : 'Tous')}
                        {status === 'pending' && (isRTL ? 'في الانتظار' : 'En attente')}
                        {status === 'approved' && (isRTL ? 'موافق عليه' : 'Approuvés')}
                        {status === 'rejected' && (isRTL ? 'مرفوض' : 'Rejetés')}
                    </button>
                ))}
            </div>

            {/* Testimonials List */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : testimonials.length === 0 ? (
                <div className="text-center py-12">
                    <MessageCircle className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">
                        {isRTL ? 'لا توجد تقييمات' : 'Aucun témoignage'}
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {testimonials.map((testimonial) => (
                        <div
                            key={testimonial.id}
                            className={`p-4 rounded-xl border transition-all ${isDark
                                ? 'bg-gray-800 border-gray-700 hover:border-gray-600'
                                : 'bg-white border-gray-200 hover:border-gray-300'
                                } ${testimonial.is_featured ? 'ring-2 ring-blue-500' : ''}`}
                        >
                            <div className="flex flex-col md:flex-row md:items-start gap-4">
                                {/* Avatar */}
                                <div className="flex-shrink-0">
                                    {testimonial.parent_image ? (
                                        <img
                                            src={testimonial.parent_image}
                                            alt={testimonial.parent_name}
                                            className="w-12 h-12 rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                                            {testimonial.parent_name.charAt(0)}
                                        </div>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-2 mb-2">
                                        <h3 className="font-semibold text-gray-900 dark:text-white">
                                            {testimonial.parent_name}
                                        </h3>
                                        {testimonial.child_name && (
                                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                                ({isRTL ? 'والد/ة' : 'Parent de'} {testimonial.child_name})
                                            </span>
                                        )}
                                        {getStatusBadge(testimonial.status)}
                                        {testimonial.is_featured && (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                                                <Award className="w-3 h-3" />
                                                {isRTL ? 'مميز' : 'Mis en avant'}
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2 mb-2">
                                        {renderStars(testimonial.rating)}
                                        <span className="text-sm text-gray-500 dark:text-gray-400">
                                            {formatDate(testimonial.created_at)}
                                        </span>
                                    </div>

                                    <p className="text-gray-700 dark:text-gray-300 mb-3">
                                        "{testimonial.content}"
                                    </p>

                                    {testimonial.admin_notes && (
                                        <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg text-sm text-red-700 dark:text-red-300 mb-3">
                                            <strong>{isRTL ? 'ملاحظة:' : 'Note:'}</strong> {testimonial.admin_notes}
                                        </div>
                                    )}

                                    {/* Actions */}
                                    <div className="flex flex-wrap gap-2">
                                        {testimonial.status === 'pending' && (
                                            <>
                                                <button
                                                    onClick={() => handleApprove(testimonial.id)}
                                                    disabled={actionLoading === testimonial.id}
                                                    className="flex items-center gap-1 px-3 py-1.5 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 transition-colors disabled:opacity-50"
                                                >
                                                    <Check className="w-4 h-4" />
                                                    {isRTL ? 'موافقة' : 'Approuver'}
                                                </button>
                                                <button
                                                    onClick={() => handleApprove(testimonial.id, true)}
                                                    disabled={actionLoading === testimonial.id}
                                                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors disabled:opacity-50"
                                                >
                                                    <Award className="w-4 h-4" />
                                                    {isRTL ? 'موافقة + تمييز' : 'Approuver + Mettre en avant'}
                                                </button>
                                                <button
                                                    onClick={() => setSelectedTestimonial(testimonial)}
                                                    className="flex items-center gap-1 px-3 py-1.5 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition-colors"
                                                >
                                                    <X className="w-4 h-4" />
                                                    {isRTL ? 'رفض' : 'Rejeter'}
                                                </button>
                                            </>
                                        )}
                                        {testimonial.status === 'approved' && (
                                            <button
                                                onClick={() => handleToggleFeatured(testimonial.id, testimonial.is_featured)}
                                                disabled={actionLoading === testimonial.id}
                                                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-colors disabled:opacity-50 ${testimonial.is_featured
                                                    ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                                                    : 'bg-blue-500 text-white hover:bg-blue-600'
                                                    }`}
                                            >
                                                <Award className="w-4 h-4" />
                                                {testimonial.is_featured
                                                    ? (isRTL ? 'إلغاء التمييز' : 'Retirer mise en avant')
                                                    : (isRTL ? 'تمييز' : 'Mettre en avant')
                                                }
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleDelete(testimonial.id)}
                                            disabled={actionLoading === testimonial.id}
                                            className="flex items-center gap-1 px-3 py-1.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            {isRTL ? 'حذف' : 'Supprimer'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Reject Modal */}
            {selectedTestimonial && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className={`w-full max-w-md rounded-xl shadow-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} p-6`}>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                            {isRTL ? 'رفض التقييم' : 'Rejeter le témoignage'}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                            {isRTL
                                ? 'يمكنك إضافة ملاحظة توضح سبب الرفض (اختياري)'
                                : 'Vous pouvez ajouter une note expliquant le motif du rejet (optionnel)'}
                        </p>
                        <textarea
                            value={rejectNotes}
                            onChange={(e) => setRejectNotes(e.target.value)}
                            placeholder={isRTL ? 'سبب الرفض...' : 'Motif du rejet...'}
                            rows={3}
                            className={`w-full px-4 py-3 rounded-xl border mb-4 ${isDark
                                ? 'bg-gray-700 border-gray-600 text-white'
                                : 'bg-gray-50 border-gray-200 text-gray-900'
                                }`}
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setSelectedTestimonial(null);
                                    setRejectNotes('');
                                }}
                                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                            >
                                {isRTL ? 'إلغاء' : 'Annuler'}
                            </button>
                            <button
                                onClick={() => handleReject(selectedTestimonial.id)}
                                disabled={actionLoading === selectedTestimonial.id}
                                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                            >
                                {isRTL ? 'تأكيد الرفض' : 'Confirmer le rejet'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TestimonialsManagementPage;
