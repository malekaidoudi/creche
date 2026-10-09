import React, { useState } from 'react';
import { Camera, User, X, Image as ImageIcon } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import API_CONFIG from '../../config/api';

const CompactImageUpload = ({ 
  currentImage, 
  onImageSelect, 
  selectedFile, 
  imageKey = Date.now(),
  className = "" 
}) => {
  const { isRTL } = useLanguage();
  const [previewUrl, setPreviewUrl] = useState(null);

  const handleFileSelect = (file) => {
    if (file && file.type.startsWith('image/')) {
      onImageSelect(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const clearSelection = (e) => {
    if (e) e.stopPropagation();
    onImageSelect(null);
    setPreviewUrl(null);
  };

  // Résoudre l'URL de l'image de façon robuste (support Cloudinary, HTTP, Blob, et chemins relatifs)
  const resolveImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:') || url.startsWith('data:')) {
      return url;
    }
    return `${API_CONFIG.BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const displayImage = previewUrl || (currentImage ? `${resolveImageUrl(currentImage)}${currentImage.includes('?') ? '&' : '?'}t=${imageKey}` : null);

  const triggerUpload = () => {
    const input = document.getElementById('compact-image-upload');
    if (input) input.click();
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Input file caché */}
      <input
        id="compact-image-upload"
        type="file"
        accept="image/png,image/jpeg,image/webp,image/jpg"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFileSelect(e.target.files[0]);
          }
        }}
        className="hidden"
      />

      {/* Avatar centré avec bouton icône caméra moderne */}
      <div className="flex flex-col items-center">
        <div className="relative inline-block group">
          {/* Cercle Avatar principal */}
          <div 
            onClick={triggerUpload}
            className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden bg-gradient-to-br from-gray-100 via-gray-50 to-gray-200 dark:from-gray-700 dark:via-gray-800 dark:to-gray-900 border-4 border-white dark:border-gray-800 shadow-md ring-2 ring-primary-100 dark:ring-primary-900/40 flex items-center justify-center cursor-pointer transition-all duration-300 group-hover:shadow-xl group-hover:ring-primary-400 dark:group-hover:ring-primary-500 relative"
            title={isRTL ? 'انقر لتغيير الصورة' : 'Cliquer pour changer la photo'}
          >
            {displayImage ? (
              <img
                src={displayImage}
                alt={isRTL ? 'صورة الملف الشخصي' : 'Photo de profil'}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
                <User className="w-12 h-12" />
              </div>
            )}

            {/* Overlay au survol */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center text-white cursor-pointer">
              <Camera className="w-6 h-6 mb-0.5 drop-shadow" strokeWidth={2.2} />
              <span className="text-[10px] font-semibold tracking-wider uppercase drop-shadow">
                {isRTL ? 'تغيير' : 'Changer'}
              </span>
            </div>
          </div>
          
          {/* Badge Icône Caméra moderne flottant en bas à droite */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              triggerUpload();
            }}
            aria-label={isRTL ? 'تغيير الصورة' : 'Modifier la photo'}
            title={isRTL ? 'تغيير الصورة' : 'Modifier la photo'}
            className={`absolute bottom-0 ${isRTL ? '-left-1' : '-right-1'} z-10 w-9 h-9 sm:w-10 sm:h-10 rounded-full aspect-square flex-shrink-0 bg-gradient-to-tr from-primary-600 via-primary-500 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 text-white flex items-center justify-center shadow-lg ring-3 ring-white dark:ring-gray-800 transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer`}
          >
            <Camera className="w-4 h-4 sm:w-5 sm:h-5 text-white drop-shadow-sm" strokeWidth={2.2} />
          </button>
          
          {/* Bouton d'annulation temporaire si un nouveau fichier vient d'être sélectionné */}
          {selectedFile && (
            <button
              type="button"
              onClick={clearSelection}
              aria-label={isRTL ? 'إلغاء' : 'Annuler'}
              title={isRTL ? 'إلغاء الملف المحدد' : 'Annuler la sélection'}
              className={`absolute top-0 ${isRTL ? '-left-1' : '-right-1'} z-10 w-7 h-7 rounded-full aspect-square flex-shrink-0 bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-md ring-2 ring-white dark:ring-gray-800 transition-all duration-150 hover:scale-110 active:scale-95 cursor-pointer`}
            >
              <X className="w-3.5 h-3.5" strokeWidth={2.5} />
            </button>
          )}
        </div>

        {/* Bouton d'action et libellés sous la photo */}
        <div className="text-center mt-3 space-y-1">
          <div>
            <button
              type="button"
              onClick={triggerUpload}
              className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-medium text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-900/30 hover:bg-primary-100 dark:hover:bg-primary-900/60 border border-primary-200 dark:border-primary-800/80 shadow-xs transition-all duration-150 active:scale-95 cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" strokeWidth={2.2} />
              <span>{isRTL ? 'تغيير الصورة' : 'Changer la photo'}</span>
            </button>
          </div>
          <p className="text-[11px] text-gray-500 dark:text-gray-400">
            {isRTL ? 'JPG, PNG أو WEBP حتى 5MB' : 'JPG, PNG ou WEBP jusqu\'à 5MB'}
          </p>
        </div>
      </div>

      {/* Informations sur le fichier sélectionné */}
      {selectedFile && (
        <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-lg p-2.5 shadow-xs">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2 rtl:space-x-reverse min-w-0">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
              <span className="font-medium text-emerald-800 dark:text-emerald-200 truncate max-w-[180px]">
                {selectedFile.name}
              </span>
            </div>
            <span className="text-emerald-600 dark:text-emerald-400 font-mono text-[11px] flex-shrink-0 ml-2 rtl:ml-0 rtl:mr-2">
              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompactImageUpload;
