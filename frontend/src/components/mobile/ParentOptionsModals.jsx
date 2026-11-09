/**
 * ParentOptionsModals - Modales pour les options du menu Plus (Espace Parent)
 * 
 * Contient :
 * - Jours de fermeture (calendrier des congés / jours fériés)
 * - Nouveautés (annonces & guide d'installation PWA)
 * - Partagez votre avis (soumission de témoignage)
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CalendarX,
    X,
    MessageCircle,
    Bell
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';
import { useDialogContext } from '../../contexts/DialogContext';
import api from '../../services/api';

const ParentOptionsModals = ({
    showHolidays,
    onCloseHolidays,
    showNews,
    onCloseNews,
    showFeedback,
    onCloseFeedback
}) => {
    const { user } = useAuth();
    const { isRTL } = useLanguage();
    const dialog = useDialogContext?.() || { success: () => {}, error: () => {} };

    // États pour Jours de fermeture
    const [holidays, setHolidays] = useState([]);
    const [loadingHolidays, setLoadingHolidays] = useState(false);

    // États pour Nouveautés
    const [news, setNews] = useState([]);

    // États pour Témoignage
    const [feedbackForm, setFeedbackForm] = useState({ name: '', message: '', rating: 5 });
    const [submittingFeedback, setSubmittingFeedback] = useState(false);

    // Charger les jours de fermeture
    useEffect(() => {
        if (!showHolidays) return;
        const loadHolidays = async () => {
            setLoadingHolidays(true);
            try {
                const res = await api.get('/api/holidays?effective=true');
                if (res.data?.holidays) {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const futureHolidays = res.data.holidays.filter(h => new Date(h.date) >= today);
                    setHolidays(futureHolidays);
                }
            } catch (e) {
                console.error('Erreur chargement jours fériés:', e);
            } finally {
                setLoadingHolidays(false);
            }
        };
        loadHolidays();
    }, [showHolidays]);

    // Charger les nouveautés
    useEffect(() => {
        if (!showNews) return;
        const loadNews = async () => {
            try {
                const res = await api.get('/api/announcements?limit=5');
                if (res.data?.announcements) {
                    setNews(res.data.announcements);
                }
            } catch (e) {
                // Ignorer erreurs
            }
        };
        loadNews();
    }, [showNews]);

    // Soumettre le témoignage
    const handleSubmitFeedback = async () => {
        if (!feedbackForm.message.trim()) return;

        setSubmittingFeedback(true);
        try {
            await api.post('/api/testimonials', {
                name: feedbackForm.name || user?.first_name || 'Parent',
                message: feedbackForm.message,
                rating: feedbackForm.rating
            });
            dialog.success(isRTL ? 'تم إرسال تقييمك بنجاح!' : 'Votre avis a été envoyé avec succès !');
            setFeedbackForm({ name: '', message: '', rating: 5 });
            onCloseFeedback();
        } catch (e) {
            console.error('Erreur soumission témoignage:', e);
            dialog.error(isRTL ? 'فشل إرسال التقييم' : "Erreur lors de l'envoi de votre avis");
        } finally {
            setSubmittingFeedback(false);
        }
    };

    return (
        <>
            {/* Modal Jours de fermeture */}
            <AnimatePresence>
                {showHolidays && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm"
                        onClick={onCloseHolidays}
                    >
                        <motion.div
                            initial={{ y: 100, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 100, opacity: 0 }}
                            className="bg-white dark:bg-gray-800 rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md overflow-hidden max-h-[80vh] flex flex-col"
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="p-5 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 shrink-0">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center">
                                            <CalendarX className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                                        </div>
                                        <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                                            {isRTL ? 'أيام الإغلاق' : 'Jours de fermeture'}
                                        </h3>
                                    </div>
                                    <button
                                        onClick={onCloseHolidays}
                                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Liste des jours fériés */}
                            <div className="p-4 overflow-y-auto max-h-[60vh] flex-1">
                                {loadingHolidays ? (
                                    <div className="text-center py-8">
                                        <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            {isRTL ? 'جاري التحميل...' : 'Chargement...'}
                                        </p>
                                    </div>
                                ) : holidays.length === 0 ? (
                                    <div className="text-center py-8">
                                        <CalendarX className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                        <p className="text-gray-500 dark:text-gray-400">
                                            {isRTL ? 'لا توجد أيام إغلاق مسجلة' : 'Aucun jour de fermeture enregistré'}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {holidays.map((holiday, index) => (
                                            <div
                                                key={holiday.id || index}
                                                className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl"
                                            >
                                                <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex flex-col items-center justify-center shrink-0">
                                                    <span className="text-xs text-orange-600 dark:text-orange-400 font-medium">
                                                        {new Date(holiday.date).toLocaleDateString(isRTL ? 'ar-TN' : 'fr-FR', { month: 'short' })}
                                                    </span>
                                                    <span className="text-lg font-bold text-orange-600 dark:text-orange-400">
                                                        {new Date(holiday.date).getDate()}
                                                    </span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-gray-900 dark:text-white truncate">
                                                        {holiday.name}
                                                    </p>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                                        {new Date(holiday.date).toLocaleDateString(isRTL ? 'ar-TN' : 'fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Bouton fermer */}
                            <div className="p-4 border-t border-gray-200 dark:border-gray-700 shrink-0">
                                <button
                                    onClick={onCloseHolidays}
                                    className="w-full py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-xl font-medium transition-colors"
                                >
                                    {isRTL ? 'إغلاق' : 'Fermer'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Modal Nouveautés */}
            <AnimatePresence>
                {showNews && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm"
                        onClick={onCloseNews}
                    >
                        <motion.div
                            initial={{ y: 100, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 100, opacity: 0 }}
                            className="bg-white dark:bg-gray-800 rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md overflow-hidden max-h-[80vh] flex flex-col"
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="p-5 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 shrink-0">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                                            <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                                            {isRTL ? 'الجديد' : 'Nouveautés'}
                                        </h3>
                                    </div>
                                    <button
                                        onClick={onCloseNews}
                                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Contenu */}
                            <div className="p-4 overflow-y-auto max-h-[60vh] flex-1">
                                {news.length === 0 ? (
                                    <div className="text-center py-8">
                                        <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                        <p className="text-gray-500 dark:text-gray-400">
                                            {isRTL ? 'لا توجد أخبار جديدة' : 'Aucune nouveauté pour le moment'}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {news.map((item, index) => (
                                            <div
                                                key={item.id || index}
                                                className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl"
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                                                        <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium text-gray-900 dark:text-white">
                                                            {item.title}
                                                        </p>
                                                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                                                            {item.content || item.message}
                                                        </p>
                                                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                                                            {new Date(item.created_at).toLocaleDateString(isRTL ? 'ar-TN' : 'fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Bouton fermer */}
                            <div className="p-4 border-t border-gray-200 dark:border-gray-700 shrink-0">
                                <button
                                    onClick={onCloseNews}
                                    className="w-full py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-xl font-medium transition-colors"
                                >
                                    {isRTL ? 'إغلاق' : 'Fermer'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Modal Partagez votre avis (Témoignage) */}
            <AnimatePresence>
                {showFeedback && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm"
                        onClick={onCloseFeedback}
                    >
                        <motion.div
                            initial={{ y: 100, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 100, opacity: 0 }}
                            className="bg-white dark:bg-gray-800 rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md overflow-hidden flex flex-col"
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="p-5 border-b border-gray-200 dark:border-gray-700 shrink-0">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center">
                                            <MessageCircle className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                        </div>
                                        <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                                            {isRTL ? 'شارك رأيك' : 'Partagez votre avis'}
                                        </h3>
                                    </div>
                                    <button
                                        onClick={onCloseFeedback}
                                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Formulaire */}
                            <div className="p-4 space-y-4 flex-1 overflow-y-auto">
                                <p className="text-gray-600 dark:text-gray-400 text-sm">
                                    {isRTL ? 'نحن نقدر رأيك! شاركنا تجربتك مع حضانتنا.' : 'Nous apprécions votre avis ! Partagez votre expérience avec notre crèche.'}
                                </p>

                                {/* Nom */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        {isRTL ? 'الاسم (اختياري)' : 'Nom (optionnel)'}
                                    </label>
                                    <input
                                        type="text"
                                        value={feedbackForm.name}
                                        onChange={(e) => setFeedbackForm({ ...feedbackForm, name: e.target.value })}
                                        placeholder={user?.first_name || (isRTL ? 'اسمك' : 'Votre nom')}
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
                                    />
                                </div>

                                {/* Note */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        {isRTL ? 'التقييم' : 'Note'}
                                    </label>
                                    <div className="flex gap-2">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                type="button"
                                                onClick={() => setFeedbackForm({ ...feedbackForm, rating: star })}
                                                className={`text-2xl transition-colors ${star <= feedbackForm.rating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'
                                                    }`}
                                            >
                                                ★
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Message */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        {isRTL ? 'رسالتك' : 'Votre message'}
                                    </label>
                                    <textarea
                                        value={feedbackForm.message}
                                        onChange={(e) => setFeedbackForm({ ...feedbackForm, message: e.target.value })}
                                        placeholder={isRTL ? 'شاركنا تجربتك...' : 'Partagez votre expérience...'}
                                        rows={4}
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 resize-none"
                                    />
                                </div>
                            </div>

                            {/* Boutons */}
                            <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex gap-3 shrink-0">
                                <button
                                    type="button"
                                    onClick={onCloseFeedback}
                                    className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-xl font-medium transition-colors"
                                >
                                    {isRTL ? 'إلغاء' : 'Annuler'}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSubmitFeedback}
                                    disabled={!feedbackForm.message.trim() || submittingFeedback}
                                    className="flex-1 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors"
                                >
                                    {submittingFeedback ? (isRTL ? 'جاري الإرسال...' : 'Envoi...') : (isRTL ? 'إرسال' : 'Envoyer')}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default ParentOptionsModals;
