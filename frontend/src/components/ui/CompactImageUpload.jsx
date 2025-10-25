import React, { useState } from 'react';
import { Camera, Upload, User, X } from 'lucide-react';
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
      
      // Créer une URL de prévisualisation
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const clearSelection = () => {
    onImageSelect(null);
    setPreviewUrl(null);
  };

  // Déterminer quelle image afficher
  const displayImage = previewUrl || (currentImage ? `${API_CONFIG.BASE_URL}${currentImage}?t=${imageKey}` : null);

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Avatar centré avec bouton de changement */}
      <div className="flex flex-col items-center space-y-3">
        {/* Avatar actuel */}
        <div className="relative">
          <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center overflow-hidden border-2 border-gray-200 dark:border-gray-600 cursor-pointer hover:border-primary-400 transition-colors"
               onClick={() => document.getElementById('compact-image-upload').click()}>
            {displayImage ? (
              <img
                src={displayImage}
                alt="Photo de profil"
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-10 h-10 text-gray-400" />
            )}
          </div>
          
          {/* Bouton caméra en overlay */}
          <button
            onClick={() => document.getElementById('compact-image-upload').click()}
            className="absolute -bottom-1 -right-1 w-7 h-7 bg-primary-500 text-white rounded-full flex items-center justify-center hover:bg-primary-600 transition-colors shadow-lg"
          >
            <Camera className="w-4 h-4" />
          </button>
          
          {/* Bouton de suppression si fichier sélectionné */}
          {selectedFile && (
            <button
              onClick={clearSelection}
              className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Informations centrées */}
        <div className="text-center">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {isRTL ? 'صورة الملف الشخصي' : 'Photo de profil'}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {isRTL ? 'انقر للتغيير • JPG, PNG حتى 5MB' : 'Cliquer pour changer • JPG, PNG jusqu\'à 5MB'}
          </p>
        </div>
      </div>

      {/* Input file caché */}
      <input
        id="compact-image-upload"
        type="file"
        accept="image/*"
        onChange={(e) => handleFileSelect(e.target.files[0])}
        className="hidden"
      />

      {/* Informations sur le fichier sélectionné */}
      {selectedFile && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
              <span className="text-xs text-green-700 dark:text-green-300 truncate max-w-32">
                {selectedFile.name}
              </span>
            </div>
            <span className="text-xs text-green-600 dark:text-green-400">
              {(selectedFile.size / 1024 / 1024).toFixed(1)} MB
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompactImageUpload;
