/**
 * Formulaire de création/édition d'activité
 */

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiImage, FiVideo, FiX, FiSend, FiLoader, FiCamera } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';

const ActivityForm = ({ onSubmit, isRTL = false, onClose }) => {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [media, setMedia] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [mediaType, setMediaType] = useState(null);
  const [isPinned, setIsPinned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const t = {
    title: isRTL ? 'عنوان النشاط' : 'Titre de l\'activité',
    description: isRTL ? 'وصف (اختياري)' : 'Description (optionnel)',
    addPhoto: isRTL ? 'صورة' : 'Photo',
    addVideo: isRTL ? 'فيديو' : 'Vidéo',
    pin: isRTL ? 'تثبيت' : 'Épingler',
    publish: isRTL ? 'نشر' : 'Publier',
    publishing: isRTL ? 'جاري النشر...' : 'Publication...',
    cancel: isRTL ? 'إلغاء' : 'Annuler',
    titleRequired: isRTL ? 'العنوان مطلوب' : 'Le titre est requis',
    shareActivity: isRTL ? 'شارك نشاطاً مع الأولياء...' : 'Partagez une activité avec les parents...'
  };

  const handleFileSelect = (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Vérifier la taille (100 MB max)
    if (file.size > 100 * 1024 * 1024) {
      setError(isRTL ? 'الملف كبير جداً (الحد الأقصى 100 ميجا)' : 'Fichier trop volumineux (max 100 MB)');
      return;
    }

    setMedia(file);
    setMediaType(type);
    setError('');

    // Créer la prévisualisation
    const reader = new FileReader();
    reader.onload = (e) => setMediaPreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const removeMedia = () => {
    setMedia(null);
    setMediaPreview(null);
    setMediaType(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title.trim()) {
      setError(t.titleRequired);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('isPinned', isPinned);
      if (media) {
        formData.append('media', media);
      }

      await onSubmit(formData);
      
      // Reset form
      setTitle('');
      setDescription('');
      removeMedia();
      setIsPinned(false);
      onClose?.();
    } catch (err) {
      setError(err.message || (isRTL ? 'حدث خطأ' : 'Une erreur est survenue'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4"
    >
      <form onSubmit={handleSubmit}>
        {/* Titre */}
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t.title}
          className="w-full px-4 py-3 text-lg font-medium bg-transparent border-none focus:ring-0 placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-white"
          disabled={loading}
        />

        {/* Description */}
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t.description}
          rows={3}
          className="w-full px-4 py-2 bg-transparent border-none focus:ring-0 placeholder-gray-400 dark:placeholder-gray-500 text-gray-700 dark:text-gray-300 resize-none"
          disabled={loading}
        />

        {/* Prévisualisation média */}
        <AnimatePresence>
          {mediaPreview && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative mt-3 rounded-xl overflow-hidden"
            >
              {mediaType === 'image' ? (
                <img src={mediaPreview} alt="Preview" className="w-full max-h-64 object-cover" />
              ) : (
                <video src={mediaPreview} controls className="w-full max-h-64" />
              )}
              <button
                type="button"
                onClick={removeMedia}
                className="absolute top-2 right-2 rtl:left-2 rtl:right-auto p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
              >
                <FiX size={18} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Erreur */}
        {error && (
          <p className="text-red-500 text-sm mt-2 px-4">{error}</p>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2">
            {/* Bouton Photo */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => handleFileSelect(e, 'image')}
              className="hidden"
              id="photo-input"
            />
            <label
              htmlFor="photo-input"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
            >
              <FiImage className="text-green-500" size={18} />
              <span className="hidden sm:inline">{t.addPhoto}</span>
            </label>

            {/* Bouton Vidéo */}
            <input
              type="file"
              accept="video/*"
              onChange={(e) => handleFileSelect(e, 'video')}
              className="hidden"
              id="video-input"
            />
            <label
              htmlFor="video-input"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
            >
              <FiVideo className="text-blue-500" size={18} />
              <span className="hidden sm:inline">{t.addVideo}</span>
            </label>

            {/* Bouton Caméra (mobile) */}
            <input
              type="file"
              accept="image/*,video/*"
              capture="environment"
              onChange={(e) => handleFileSelect(e, e.target.files?.[0]?.type.startsWith('video') ? 'video' : 'image')}
              className="hidden"
              id="camera-input"
            />
            <label
              htmlFor="camera-input"
              className="sm:hidden flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
            >
              <FiCamera className="text-purple-500" size={18} />
            </label>

            {/* Épingler (admin only) */}
            {user?.role === 'admin' && (
              <button
                type="button"
                onClick={() => setIsPinned(!isPinned)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                  ${isPinned
                    ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
              >
                📌 <span className="hidden sm:inline">{t.pin}</span>
              </button>
            )}
          </div>

          {/* Bouton Publier */}
          <button
            type="submit"
            disabled={loading || !title.trim()}
            className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all"
          >
            {loading ? (
              <>
                <FiLoader className="animate-spin" size={18} />
                <span className="hidden sm:inline">{t.publishing}</span>
              </>
            ) : (
              <>
                <FiSend size={18} />
                <span className="hidden sm:inline">{t.publish}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default ActivityForm;

