/**
 * Page du fil d'activités
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiRefreshCw, FiPlus, FiX, FiLoader, FiImage } from 'react-icons/fi';
import ActivityCard from '../../components/activities/ActivityCard';
import ActivityForm from '../../components/activities/ActivityForm';
import useActivities from '../../hooks/useActivities';
import { useAuth } from '../../contexts/AuthContext';

const ActivitiesPage = () => {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [isRTL, setIsRTL] = useState(false);
  const observerRef = useRef(null);
  const loadMoreRef = useRef(null);

  const {
    activities,
    loading,
    error,
    hasMore,
    total,
    loadMore,
    refresh,
    createActivity,
    deleteActivity,
    toggleReaction
  } = useActivities(1, 10);

  const canCreate = user?.role === 'admin' || user?.role === 'staff';

  // Détection RTL
  useEffect(() => {
    const lang = localStorage.getItem('language') || 'fr';
    setIsRTL(lang === 'ar');
  }, []);

  // Infinite scroll
  useEffect(() => {
    if (loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    observerRef.current = observer;

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loading, hasMore, loadMore]);

  const handleCreate = async (formData) => {
    try {
      await createActivity(formData);
      setShowForm(false);
    } catch (err) {
      throw err;
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm(isRTL ? 'هل أنت متأكد من الحذف؟' : 'Êtes-vous sûr de vouloir supprimer cette activité ?')) {
      try {
        await deleteActivity(id);
      } catch (err) {
        console.error('Erreur suppression:', err);
      }
    }
  };

  const t = {
    title: isRTL ? 'أنشطة الروضة' : 'Activités de la crèche',
    subtitle: isRTL ? 'اكتشف آخر أنشطة أطفالكم' : 'Découvrez les dernières activités de vos enfants',
    newActivity: isRTL ? 'نشاط جديد' : 'Nouvelle activité',
    noActivities: isRTL ? 'لا توجد أنشطة بعد' : 'Aucune activité pour le moment',
    noActivitiesDesc: isRTL ? 'سيتم نشر الأنشطة هنا قريباً' : 'Les activités seront publiées ici prochainement',
    loading: isRTL ? 'جاري التحميل...' : 'Chargement...',
    loadingMore: isRTL ? 'تحميل المزيد...' : 'Chargement...',
    error: isRTL ? 'حدث خطأ' : 'Une erreur est survenue',
    retry: isRTL ? 'إعادة المحاولة' : 'Réessayer'
  };

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">{t.title}</h1>
              <p className="text-white/80 mt-1">{t.subtitle}</p>
            </div>
            <button
              onClick={refresh}
              disabled={loading}
              className="p-3 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
            >
              <FiRefreshCw className={loading ? 'animate-spin' : ''} size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="max-w-2xl mx-auto px-4 py-6 -mt-4">
        {/* Bouton créer (Admin/Staff) */}
        {canCreate && !showForm && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => setShowForm(true)}
            className="w-full mb-6 p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-3 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white">
              <FiPlus size={20} />
            </div>
            <span>{t.newActivity}</span>
          </motion.button>
        )}

        {/* Formulaire de création */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6"
            >
              <ActivityForm
                onSubmit={handleCreate}
                onClose={() => setShowForm(false)}
                isRTL={isRTL}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Erreur */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 flex items-center justify-between">
            <span>{t.error}: {error}</span>
            <button onClick={refresh} className="text-sm underline">{t.retry}</button>
          </div>
        )}

        {/* Liste des activités */}
        {loading && activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <FiLoader className="animate-spin text-blue-500 mb-4" size={40} />
            <p className="text-gray-500">{t.loading}</p>
          </div>
        ) : activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-24 h-24 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
              <FiImage className="text-gray-400" size={40} />
            </div>
            <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">{t.noActivities}</h3>
            <p className="text-gray-500 dark:text-gray-400">{t.noActivitiesDesc}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {activities.map((activity) => (
              <ActivityCard
                key={activity.id}
                activity={activity}
                onReact={toggleReaction}
                onDelete={handleDelete}
                isRTL={isRTL}
              />
            ))}

            {/* Loader pour infinite scroll */}
            <div ref={loadMoreRef} className="py-4">
              {hasMore && (
                <div className="flex justify-center">
                  <FiLoader className="animate-spin text-blue-500" size={24} />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivitiesPage;

