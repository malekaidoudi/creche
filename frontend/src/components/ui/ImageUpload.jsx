import React, { useState } from 'react';
import { Camera, Upload, User, X } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import API_CONFIG from '../../config/api';

const ImageUpload = ({ 
  currentImage, 
  onImageSelect, 
  selectedFile, 
  imageKey = Date.now(),
  className = "" 
}) => {
  const { isRTL } = useLanguage();
  const [dragOver, setDragOver] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);

  const handleFileSelect = (file) => {
    if (file && file.type.startsWith('image/')) {
      onImageSelect(file);
      
      // Créer une URL de prévisualisation
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    
    const file = e.dataTransfer.files[0];
    handleFileSelect(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const clearSelection = () => {
    onImageSelect(null);
    setPreviewUrl(null);
  };

  // Déterminer quelle image afficher
  const displayImage = previewUrl || (currentImage ? `${API_CONFIG.BASE_URL}${currentImage}?t=${imageKey}` : null);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Zone d'upload principale */}
      <div
        className={`
          relative w-32 h-32 mx-auto border-2 border-dashed rounded-full
          transition-all duration-300 cursor-pointer group
          ${dragOver 
            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' 
            : 'border-gray-300 dark:border-gray-600 hover:border-primary-400'
          }
          ${displayImage ? 'border-solid border-primary-500' : ''}
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => document.getElementById('image-upload').click()}
      >
        {displayImage ? (
          <>
            {/* Image affichée */}
            <img
              src={displayImage}
              alt="Photo de profil"
              className="w-full h-full object-cover rounded-full"
            />
            
            {/* Overlay au hover */}
            <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="w-8 h-8 text-white" />
            </div>
            
            {/* Bouton de suppression */}
            {selectedFile && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  clearSelection();
                }}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </>
        ) : (
          /* Zone d'upload vide */
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
            <Camera className="w-8 h-8 mb-2" />
            <span className="text-xs text-center">
              {isRTL ? 'اختر صورة' : 'Choisir'}
            </span>
          </div>
        )}
      </div>

      {/* Input file caché */}
      <input
        id="image-upload"
        type="file"
        accept="image/*"
        onChange={(e) => handleFileSelect(e.target.files[0])}
        className="hidden"
      />

      {/* Zone de drop alternative */}
      <div
        className={`
          border-2 border-dashed rounded-lg p-4 text-center transition-all duration-300
          ${dragOver 
            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' 
            : 'border-gray-300 dark:border-gray-600 hover:border-primary-400'
          }
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => document.getElementById('image-upload').click()}
      >
        <Upload className="w-6 h-6 mx-auto mb-2 text-gray-400" />
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
          {isRTL 
            ? 'اسحب وأفلت صورة هنا أو انقر للاختيار'
            : 'Glissez-déposez une image ici ou cliquez pour sélectionner'
          }
        </p>
        <p className="text-xs text-gray-500">
          {isRTL ? 'JPG, PNG, GIF حتى 5MB' : 'JPG, PNG, GIF jusqu\'à 5MB'}
        </p>
      </div>

      {/* Informations sur le fichier sélectionné */}
      {selectedFile && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-green-700 dark:text-green-300">
                {selectedFile.name}
              </span>
            </div>
            <span className="text-xs text-green-600 dark:text-green-400">
              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
