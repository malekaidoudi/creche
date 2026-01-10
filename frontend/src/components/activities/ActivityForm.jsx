/**
 * Formulaire de création/édition d'activité
 */

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiImage, FiVideo, FiX, FiSend, FiLoader, FiCamera, FiPlay, FiVolume2 } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import cloudinaryUploadService from '../../services/cloudinaryUploadService';

const ActivityForm = ({ onSubmit, isRTL = false, onClose }) => {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [media, setMedia] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [mediaType, setMediaType] = useState(null);
  const [isPinned, setIsPinned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStage, setUploadStage] = useState(''); // 'compression', 'upload', 'saving'
  const [error, setError] = useState('');
  const [videoPlaying, setVideoPlaying] = useState(false);
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);

  const t = {
    title: isRTL ? 'عنوان النشاط' : 'Titre de l\'activité',
    description: isRTL ? 'وصف (اختياري)' : 'Description (optionnel)',
    addPhoto: isRTL ? 'صورة' : 'Photo',
    addVideo: isRTL ? 'فيديو' : 'Vidéo',
    pin: isRTL ? 'تثبيت' : 'Épingler',
    publish: isRTL ? 'نشر' : 'Publier',
    publishing: isRTL ? 'جاري النشر...' : 'Publication...',
    uploading: isRTL ? 'جاري الرفع...' : 'Téléchargement...',
    compressing: isRTL ? 'جاري الضغط...' : 'Compression...',
    saving: isRTL ? 'جاري الحفظ...' : 'Enregistrement...',
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
    setUploadProgress(0);
    setUploadStage('');
    setError('');

    try {
      let mediaUrl = null;
      let mediaThumbnailUrl = null;
      let cloudinaryPublicId = null;
      let finalMediaType = 'none';

      // Upload direct vers Cloudinary pour les vidéos volumineuses (> 10 MB)
      if (media && mediaType === 'video' && media.size > 10 * 1024 * 1024) {
        console.log('🚀 Upload direct Cloudinary activé (vidéo > 10 MB)');

        const uploadResult = await cloudinaryUploadService.uploadToCloudinary(media, {
          resourceType: 'video',
          compress: true,
          onProgress: (progress, stage) => {
            setUploadProgress(progress);
            setUploadStage(stage);
          }
        });

        if (uploadResult.success) {
          mediaUrl = uploadResult.url;
          cloudinaryPublicId = uploadResult.publicId;
          mediaThumbnailUrl = cloudinaryUploadService.generateVideoThumbnail(uploadResult.url);
          finalMediaType = 'video';
          console.log('✅ Upload Cloudinary réussi:', mediaUrl);
        } else {
          throw new Error('Erreur lors de l\'upload de la vidéo');
        }

        // Enregistrer l'activité avec l'URL Cloudinary
        setUploadStage('saving');
        setUploadProgress(95);

        const formData = new FormData();
        formData.append('title', title.trim());
        formData.append('description', description.trim());
        formData.append('isPinned', isPinned);
        formData.append('mediaUrl', mediaUrl);
        formData.append('mediaThumbnailUrl', mediaThumbnailUrl);
        formData.append('cloudinaryPublicId', cloudinaryPublicId);
        formData.append('mediaType', finalMediaType);

        await onSubmit(formData);
        setUploadProgress(100);
      } else {
        // Upload classique via backend pour les petits fichiers
        const formData = new FormData();
        formData.append('title', title.trim());
        formData.append('description', description.trim());
        formData.append('isPinned', isPinned);
        if (media) {
          formData.append('media', media);
        }
        await onSubmit(formData);
      }

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

        {/* Prévisualisation média améliorée */}
        <AnimatePresence>
          {mediaPreview && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative mt-4 rounded-2xl overflow-hidden bg-gray-900 shadow-lg"
            >
              {mediaType === 'image' ? (
                <img
                  src={mediaPreview}
                  alt="Preview"
                  className="w-full max-h-80 object-contain bg-gray-900"
                />
              ) : (
                <div className="relative">
                  <video
                    ref={videoRef}
                    src={mediaPreview}
                    className="w-full max-h-80 object-contain bg-gray-900"
                    playsInline
                    muted={false}
                    onClick={() => {
                      if (videoRef.current) {
                        if (videoRef.current.paused) {
                          videoRef.current.play();
                          setVideoPlaying(true);
                        } else {
                          videoRef.current.pause();
                          setVideoPlaying(false);
                        }
                      }
                    }}
                  />
                  {/* Overlay de lecture */}
                  {!videoPlaying && (
                    <div
                      className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer"
                      onClick={() => {
                        if (videoRef.current) {
                          videoRef.current.play();
                          setVideoPlaying(true);
                        }
                      }}
                    >
                      <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                        <FiPlay className="text-gray-900 ml-1" size={28} />
                      </div>
                    </div>
                  )}
                  {/* Indicateur audio */}
                  <div className="absolute bottom-3 left-3 flex items-center gap-1 px-2 py-1 bg-black/60 rounded-full text-white text-xs">
                    <FiVolume2 size={12} />
                    <span>{isRTL ? 'مع صوت' : 'Avec son'}</span>
                  </div>
                </div>
              )}
              {/* Badge type de fichier */}
              <div className="absolute top-3 left-3 rtl:left-auto rtl:right-3 px-2 py-1 bg-black/60 rounded-full text-white text-xs font-medium flex items-center gap-1">
                {mediaType === 'image' ? <FiImage size={12} /> : <FiVideo size={12} />}
                {media?.name?.split('.').pop()?.toUpperCase()}
              </div>
              {/* Bouton supprimer */}
              <button
                type="button"
                onClick={removeMedia}
                className="absolute top-3 right-3 rtl:left-3 rtl:right-auto p-2 bg-red-500/80 hover:bg-red-600 rounded-full text-white transition-colors shadow-lg"
              >
                <FiX size={18} />
              </button>
              {/* Taille du fichier */}
              <div className="absolute bottom-3 right-3 rtl:left-3 rtl:right-auto px-2 py-1 bg-black/60 rounded-full text-white text-xs">
                {media && (media.size / (1024 * 1024)).toFixed(1)} MB
              </div>
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
                <span className="hidden sm:inline">
                  {uploadStage === 'compression' && `${t.compressing} ${uploadProgress}%`}
                  {uploadStage === 'upload' && `${t.uploading} ${uploadProgress}%`}
                  {uploadStage === 'saving' && t.saving}
                  {!uploadStage && t.publishing}
                </span>
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

