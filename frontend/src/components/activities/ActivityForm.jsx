/**
 * Formulaire de création/édition d'activité (support photos multiples & vidéos)
 */

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiImage, FiVideo, FiX, FiSend, FiLoader, FiCamera, FiPlay, FiVolume2, FiPlus } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import cloudinaryUploadService from '../../services/cloudinaryUploadService';

const MAX_PHOTOS = 10;

const ActivityForm = ({ onSubmit, isRTL = false, onClose }) => {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [mediaFiles, setMediaFiles] = useState([]); // array de Files
  const [mediaPreviews, setMediaPreviews] = useState([]); // array de { url, name, size }
  const [mediaType, setMediaType] = useState(null); // 'image' | 'video' | null
  const [isPinned, setIsPinned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStage, setUploadStage] = useState(''); // 'compression', 'upload', 'saving'
  const [error, setError] = useState('');
  const [videoPlaying, setVideoPlaying] = useState(false);
  const fileInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const videoRef = useRef(null);

  const t = {
    title: isRTL ? 'عنوان النشاط' : 'Titre de l\'activité',
    description: isRTL ? 'وصف (اختياري)' : 'Description (optionnel)',
    addPhotos: isRTL ? 'صور' : 'Photos',
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

  const handlePhotosSelect = (e) => {
    const selected = Array.from(e.target.files || []);
    if (selected.length === 0) return;

    // Si on avait précédemment une vidéo, on la remplace par les photos
    const currentFiles = mediaType === 'image' ? [...mediaFiles] : [];
    const currentPreviews = mediaType === 'image' ? [...mediaPreviews] : [];

    const remainingSlots = MAX_PHOTOS - currentFiles.length;
    if (remainingSlots <= 0) {
      setError(isRTL ? `الحد الأقصى هو ${MAX_PHOTOS} صور لكل منشور` : `Maximum de ${MAX_PHOTOS} photos par publication`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const filesToAdd = selected.slice(0, remainingSlots);
    if (selected.length > remainingSlots) {
      setError(isRTL ? `تم تحديد أول ${remainingSlots} صور فقط (الحد الأقصى ${MAX_PHOTOS})` : `Seules les ${remainingSlots} premières photos ont été ajoutées (max ${MAX_PHOTOS})`);
    } else {
      setError('');
    }

    // Valider chaque fichier
    const validFiles = [];
    const newPreviews = [];
    for (const f of filesToAdd) {
      if (f.size > 20 * 1024 * 1024) {
        setError(isRTL ? `الصورة ${f.name} كبيرة جداً (الحد الأقصى 20 ميجا)` : `L'image ${f.name} est trop volumineuse (max 20 MB)`);
        continue;
      }
      validFiles.push(f);
      newPreviews.push({
        url: URL.createObjectURL(f),
        name: f.name,
        size: (f.size / (1024 * 1024)).toFixed(1)
      });
    }

    if (validFiles.length > 0) {
      setMediaFiles([...currentFiles, ...validFiles]);
      setMediaPreviews([...currentPreviews, ...newPreviews]);
      setMediaType('image');
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleVideoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 100 * 1024 * 1024) {
      setError(isRTL ? 'الفيديو كبير جداً (الحد الأقصى 100 ميجا)' : 'Vidéo trop volumineuse (max 100 MB)');
      return;
    }

    setMediaFiles([file]);
    setMediaPreviews([{
      url: URL.createObjectURL(file),
      name: file.name,
      size: (file.size / (1024 * 1024)).toFixed(1)
    }]);
    setMediaType('video');
    setError('');

    if (videoInputRef.current) videoInputRef.current.value = '';
  };

  const handleCameraSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type.startsWith('video/')) {
      handleVideoSelect(e);
    } else {
      handlePhotosSelect(e);
    }
  };

  // Nettoyage mémoire des Object URLs lors de la suppression individuelle
  const removePhoto = (index) => {
    if (mediaPreviews[index]?.url?.startsWith('blob:')) {
      URL.revokeObjectURL(mediaPreviews[index].url);
    }
    const updatedFiles = mediaFiles.filter((_, i) => i !== index);
    const updatedPreviews = mediaPreviews.filter((_, i) => i !== index);
    setMediaFiles(updatedFiles);
    setMediaPreviews(updatedPreviews);
    if (updatedFiles.length === 0) {
      setMediaType(null);
    }
  };

  // Nettoyage complet de tous les médias et libération mémoire
  const removeAllMedia = () => {
    mediaPreviews.forEach(p => {
      if (p.url?.startsWith('blob:')) {
        URL.revokeObjectURL(p.url);
      }
    });
    setMediaFiles([]);
    setMediaPreviews([]);
    setMediaType(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (videoInputRef.current) videoInputRef.current.value = '';
  };

  // Nettoyage des blob URLs au démontage du composant
  React.useEffect(() => {
    return () => {
      mediaPreviews.forEach(p => {
        if (p.url?.startsWith('blob:')) {
          URL.revokeObjectURL(p.url);
        }
      });
    };
  }, [mediaPreviews]);

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
      // Cas 1: Vidéo volumineuse > 10 MB (Upload direct vers Cloudinary)
      if (mediaType === 'video' && mediaFiles[0] && mediaFiles[0].size > 10 * 1024 * 1024) {
        const videoFile = mediaFiles[0];
        console.log('🚀 Upload direct Cloudinary activé (vidéo > 10 MB)');

        const uploadResult = await cloudinaryUploadService.uploadToCloudinary(videoFile, {
          resourceType: 'video',
          compress: true,
          onProgress: (progress, stage) => {
            setUploadProgress(progress);
            setUploadStage(stage);
          }
        });

        if (!uploadResult.success) {
          throw new Error('Erreur lors de l\'upload de la vidéo');
        }

        setUploadStage('saving');
        setUploadProgress(95);

        const formData = new FormData();
        formData.append('title', title.trim());
        formData.append('description', description.trim());
        formData.append('isPinned', isPinned);
        formData.append('mediaUrl', uploadResult.url);
        formData.append('mediaThumbnailUrl', cloudinaryUploadService.generateVideoThumbnail(uploadResult.url));
        formData.append('cloudinaryPublicId', uploadResult.publicId);
        formData.append('mediaType', 'video');

        await onSubmit(formData);
        setUploadProgress(100);
      }
      // Cas 2: Images (1 ou multiples) ou vidéo légère via backend
      else {
        const formData = new FormData();
        formData.append('title', title.trim());
        formData.append('description', description.trim());
        formData.append('isPinned', isPinned);

        if (mediaFiles && mediaFiles.length > 0) {
          for (const file of mediaFiles) {
            formData.append('media', file);
          }
        }

        await onSubmit(formData);
      }

      // Reset form
      setTitle('');
      setDescription('');
      removeAllMedia();
      setIsPinned(false);
      onClose?.();
    } catch (err) {
      const serverMessage = err.response?.data?.error || err.response?.data?.message || err.message;
      setError(serverMessage || (isRTL ? 'حدث خطأ' : 'Une erreur est survenue'));
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

        {/* Prévisualisation média (Vidéo ou Photos multiples) */}
        <AnimatePresence>
          {mediaPreviews.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="mt-3"
            >
              {/* CAS 1 : VIDÉO */}
              {mediaType === 'video' ? (
                <div className="relative rounded-2xl overflow-hidden bg-gray-900 shadow-lg">
                  <video
                    ref={videoRef}
                    src={mediaPreviews[0]?.url}
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
                  <div className="absolute bottom-3 left-3 flex items-center gap-1 px-2 py-1 bg-black/60 rounded-full text-white text-xs">
                    <FiVolume2 size={12} />
                    <span>{isRTL ? 'مع صوت' : 'Avec son'}</span>
                  </div>
                  <div className="absolute top-3 left-3 rtl:left-auto rtl:right-3 px-2.5 py-1 bg-black/60 rounded-full text-white text-xs font-medium flex items-center gap-1.5">
                    <FiVideo size={12} />
                    <span>VIDÉO</span>
                  </div>
                  <button
                    type="button"
                    onClick={removeAllMedia}
                    className="absolute top-3 right-3 rtl:left-3 rtl:right-auto p-2 bg-red-500/80 hover:bg-red-600 rounded-full text-white transition-colors shadow-lg"
                    title={isRTL ? 'حذف' : 'Supprimer'}
                  >
                    <FiX size={18} />
                  </button>
                  <div className="absolute bottom-3 right-3 rtl:left-3 rtl:right-auto px-2 py-1 bg-black/60 rounded-full text-white text-xs">
                    {mediaPreviews[0]?.size} MB
                  </div>
                </div>
              ) : mediaPreviews.length === 1 ? (
                /* CAS 2 : UNE SEULE PHOTO */
                <div className="relative rounded-2xl overflow-hidden bg-gray-900 shadow-md">
                  <img
                    src={mediaPreviews[0]?.url}
                    alt="Preview"
                    className="w-full max-h-80 object-contain bg-gray-900"
                  />
                  <div className="absolute top-3 left-3 rtl:left-auto rtl:right-3 px-2.5 py-1 bg-black/60 backdrop-blur-sm rounded-full text-white text-xs font-medium flex items-center gap-1.5">
                    <FiImage size={12} />
                    <span>1 {isRTL ? 'صورة' : 'photo'}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removePhoto(0)}
                    className="absolute top-3 right-3 rtl:left-3 rtl:right-auto p-2 bg-red-500/85 hover:bg-red-600 rounded-full text-white transition-colors shadow-lg"
                    title={isRTL ? 'حذف الصورة' : 'Supprimer la photo'}
                  >
                    <FiX size={16} />
                  </button>
                  <div className="absolute bottom-3 right-3 rtl:left-3 rtl:right-auto px-2 py-0.5 bg-black/60 rounded-full text-white text-[11px]">
                    {mediaPreviews[0]?.size} MB
                  </div>
                </div>
              ) : (
                /* CAS 3 : PHOTOS MULTIPLES (GRILLE D'APERÇU) */
                <div className="bg-gray-50/70 dark:bg-gray-900/40 p-3 rounded-2xl border border-gray-200/80 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-2.5 px-1">
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                      <FiImage className="text-green-500" />
                      <span>{mediaPreviews.length} / {MAX_PHOTOS} {isRTL ? 'صور محددة' : 'photos sélectionnées'}</span>
                    </span>
                    <button
                      type="button"
                      onClick={removeAllMedia}
                      className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 font-medium transition-colors"
                    >
                      {isRTL ? 'حذف الكل' : 'Tout supprimer'}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                    {mediaPreviews.map((item, idx) => (
                      <div
                        key={idx}
                        className="relative group rounded-xl overflow-hidden aspect-square bg-gray-900 shadow-sm border border-gray-200 dark:border-gray-700"
                      >
                        <img
                          src={item.url}
                          alt={`Photo ${idx + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                        <div className="absolute top-1.5 left-1.5 rtl:left-auto rtl:right-1.5 w-5 h-5 rounded-full bg-black/65 backdrop-blur-sm text-white text-[10px] font-bold flex items-center justify-center">
                          {idx + 1}
                        </div>
                        <button
                          type="button"
                          onClick={() => removePhoto(idx)}
                          className="absolute top-1.5 right-1.5 rtl:left-1.5 rtl:right-auto p-1 bg-red-500/90 hover:bg-red-600 rounded-full text-white transition-all shadow-md sm:opacity-90 hover:scale-110"
                          title={isRTL ? 'حذف' : 'Supprimer'}
                        >
                          <FiX size={14} />
                        </button>
                        <div className="absolute bottom-1 right-1 rtl:left-1 rtl:right-auto px-1.5 py-0.5 bg-black/65 rounded text-white text-[10px]">
                          {item.size}M
                        </div>
                      </div>
                    ))}
                    {mediaPreviews.length < MAX_PHOTOS && (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="aspect-square rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-green-500 dark:hover:border-green-400 flex flex-col items-center justify-center gap-1.5 text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50/40 dark:hover:bg-green-950/20 transition-all cursor-pointer"
                      >
                        <FiPlus size={24} />
                        <span className="text-xs font-medium">{isRTL ? 'إضافة صور' : 'Ajouter'}</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
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
            {/* Bouton Photos (sélection multiple) */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handlePhotosSelect}
              className="hidden"
              id="photo-input"
            />
            <label
              htmlFor="photo-input"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
            >
              <FiImage className="text-green-500" size={18} />
              <span className="hidden sm:inline">{t.addPhotos}</span>
            </label>

            {/* Bouton Vidéo */}
            <input
              ref={videoInputRef}
              type="file"
              accept="video/*"
              onChange={handleVideoSelect}
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
              onChange={handleCameraSelect}
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
