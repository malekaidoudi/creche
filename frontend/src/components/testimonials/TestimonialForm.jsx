/**
 * Formulaire de soumission de témoignage pour les parents
 */

import { useState } from 'react';
import { X, Star, Send, AlertCircle, CheckCircle, User } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';

const TestimonialForm = ({ isOpen, onClose, onSuccess, userName }) => {
    const { isRTL } = useLanguage();
    const { isDark } = useTheme();
    const { user } = useAuth();

    // Utiliser le userName passé en prop ou construire depuis user
    const displayName = userName || `${user?.first_name || ''} ${user?.last_name || ''}`.trim();

    const [formData, setFormData] = useState({
        content: '',
        rating: 5,
        child_name: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [hoveredRating, setHoveredRating] = useState(0);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await api.post('/api/testimonials', formData);
            if (response.data.success) {
                setSuccess(true);
                setTimeout(() => {
                    onSuccess?.();
                    onClose();
                    setFormData({ content: '', rating: 5, child_name: '' });
                    setSuccess(false);
                }, 2000);
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Une erreur est survenue');
        } finally {
            setLoading(false);
        }
    };

    const handleRatingClick = (rating) => {
        setFormData({ ...formData, rating });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div
                className={`relative w-full max-w-lg rounded-2xl shadow-2xl ${isDark ? 'bg-gray-800' : 'bg-white'
                    }`}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        {isRTL ? 'شاركنا رأيك' : 'Partagez votre avis'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    </button>
                </div>

                {/* Content */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Success message */}
                    {success && (
                        <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/30 rounded-xl">
                            <CheckCircle className="w-6 h-6 text-green-500" />
                            <div>
                                <p className="font-medium text-green-800 dark:text-green-200">
                                    {isRTL ? 'تم إرسال تقييمك بنجاح!' : 'Votre témoignage a été envoyé !'}
                                </p>
                                <p className="text-sm text-green-600 dark:text-green-300">
                                    {isRTL
                                        ? 'سيتم نشره بعد المراجعة'
                                        : 'Il sera publié après validation'}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Error message */}
                    {error && (
                        <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/30 rounded-xl">
                            <AlertCircle className="w-6 h-6 text-red-500" />
                            <p className="text-red-800 dark:text-red-200">{error}</p>
                        </div>
                    )}

                    {!success && (
                        <>
                            {/* Nom du parent (lecture seule) */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    {isRTL ? 'الاسم الكامل' : 'Nom complet'}
                                </label>
                                <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${isDark
                                    ? 'bg-gray-700/50 border-gray-600 text-gray-300'
                                    : 'bg-gray-100 border-gray-200 text-gray-700'
                                    }`}>
                                    <User className="w-5 h-5 text-gray-400" />
                                    <span className="font-medium">{displayName || (isRTL ? 'غير محدد' : 'Non défini')}</span>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    {isRTL ? 'سيظهر هذا الاسم مع تقييمك' : 'Ce nom apparaîtra avec votre témoignage'}
                                </p>
                            </div>

                            {/* Rating */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    {isRTL ? 'تقييمك' : 'Votre note'}
                                </label>
                                <div className="flex gap-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            type="button"
                                            onClick={() => handleRatingClick(star)}
                                            onMouseEnter={() => setHoveredRating(star)}
                                            onMouseLeave={() => setHoveredRating(0)}
                                            className="p-1 transition-transform hover:scale-110"
                                        >
                                            <Star
                                                className={`w-8 h-8 transition-colors ${star <= (hoveredRating || formData.rating)
                                                    ? 'text-yellow-400 fill-yellow-400'
                                                    : 'text-gray-300 dark:text-gray-600'
                                                    }`}
                                            />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Child name (optional) */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    {isRTL ? 'اسم طفلك (اختياري)' : 'Prénom de votre enfant (optionnel)'}
                                </label>
                                <input
                                    type="text"
                                    value={formData.child_name}
                                    onChange={(e) => setFormData({ ...formData, child_name: e.target.value })}
                                    placeholder={isRTL ? 'مثال: أحمد' : 'Ex: Mohamed'}
                                    className={`w-full px-4 py-3 rounded-xl border transition-colors ${isDark
                                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500'
                                        : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-500'
                                        } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                                />
                            </div>

                            {/* Content */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    {isRTL ? 'رأيك' : 'Votre témoignage'} *
                                </label>
                                <textarea
                                    value={formData.content}
                                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                    placeholder={isRTL
                                        ? 'شاركنا تجربتك مع حضانة ميما الغالية...'
                                        : 'Partagez votre expérience avec la crèche Mima Elghalia...'}
                                    rows={4}
                                    maxLength={1000}
                                    required
                                    className={`w-full px-4 py-3 rounded-xl border transition-colors resize-none ${isDark
                                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500'
                                        : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-500'
                                        } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                                />
                                <div className="flex justify-between mt-1">
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {isRTL ? 'الحد الأدنى 10 أحرف' : 'Minimum 10 caractères'}
                                    </p>
                                    <p className={`text-xs ${formData.content.length > 900
                                        ? 'text-orange-500'
                                        : 'text-gray-500 dark:text-gray-400'
                                        }`}>
                                        {formData.content.length}/1000
                                    </p>
                                </div>
                            </div>

                            {/* Submit button */}
                            <button
                                type="submit"
                                disabled={loading || formData.content.length < 10}
                                className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${loading || formData.content.length < 10
                                    ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 shadow-lg hover:shadow-xl'
                                    }`}
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <Send className="w-5 h-5" />
                                        {isRTL ? 'إرسال التقييم' : 'Envoyer mon témoignage'}
                                    </>
                                )}
                            </button>

                            <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                                {isRTL
                                    ? 'سيتم نشر تقييمك بعد مراجعته من قبل الإدارة'
                                    : 'Votre témoignage sera publié après validation par l\'administration'}
                            </p>
                        </>
                    )}
                </form>
            </div>
        </div>
    );
};

export default TestimonialForm;
