import { useState, useRef, useEffect } from 'react'
import { Camera, Upload, X, User } from 'lucide-react'
import { useLanguage } from '../../hooks/useLanguage'
import LoadingSpinner from './LoadingSpinner'
import toast from 'react-hot-toast'
import { uploadService } from '../../services/uploadService'

const ProfilePictureUpload = ({ 
  currentImage, 
  onImageChange, 
  size = 'lg',
  disabled = false 
}) => {
  const { isRTL } = useLanguage()
  const [isUploading, setIsUploading] = useState(false)
  const [previewImage, setPreviewImage] = useState(
    currentImage ? uploadService.getFileUrl(currentImage) : null
  )
  const fileInputRef = useRef(null)

  // Mettre à jour l'image de prévisualisation quand currentImage change
  useEffect(() => {
    setPreviewImage(currentImage ? uploadService.getFileUrl(currentImage) : null)
  }, [currentImage])

  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
    xl: 'w-40 h-40'
  }

  const handleFileSelect = (event) => {
    const file = event.target.files[0]
    if (!file) return

    // Validation du fichier
    if (!file.type.startsWith('image/')) {
      toast.error(isRTL ? 'يرجى اختيار صورة صالحة' : 'Veuillez sélectionner une image valide')
      return
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB
      toast.error(isRTL ? 'حجم الصورة يجب أن يكون أقل من 5 ميجابايت' : 'La taille de l\'image doit être inférieure à 5MB')
      return
    }

    // Créer un aperçu
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreviewImage(e.target.result)
    }
    reader.readAsDataURL(file)

    // Appeler la fonction de callback
    if (onImageChange) {
      setIsUploading(true)
      onImageChange(file)
        .then(() => {
          toast.success(isRTL ? 'تم تحديث الصورة بنجاح' : 'Photo mise à jour avec succès')
        })
        .catch((error) => {
          console.error('Erreur upload:', error)
          toast.error(isRTL ? 'خطأ في تحميل الصورة' : 'Erreur lors du téléchargement')
          setPreviewImage(currentImage ? uploadService.getFileUrl(currentImage) : null) // Revenir à l'image précédente
        })
        .finally(() => {
          setIsUploading(false)
        })
    }
  }

  const handleRemoveImage = () => {
    setPreviewImage(null)
    if (onImageChange) {
      onImageChange(null)
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const triggerFileInput = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Image de profil */}
      <div className={`relative ${sizeClasses[size]} rounded-full overflow-hidden bg-gray-100 border-4 border-white shadow-lg`}>
        {previewImage ? (
          <img
            src={previewImage}
            alt="Photo de profil"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-200">
            <User className="w-1/2 h-1/2 text-gray-400" />
          </div>
        )}

        {/* Overlay de chargement */}
        {isUploading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <LoadingSpinner size="sm" color="white" />
          </div>
        )}

        {/* Bouton caméra */}
        {!disabled && (
          <button
            type="button"
            onClick={triggerFileInput}
            className="absolute bottom-0 right-0 bg-primary-600 hover:bg-primary-700 text-white p-2 rounded-full shadow-lg transition-colors"
            disabled={isUploading}
          >
            <Camera className="w-4 h-4" />
          </button>
        )}

        {/* Bouton supprimer */}
        {previewImage && !disabled && (
          <button
            type="button"
            onClick={handleRemoveImage}
            className="absolute top-0 right-0 bg-red-600 hover:bg-red-700 text-white p-1 rounded-full shadow-lg transition-colors"
            disabled={isUploading}
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Input file caché */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || isUploading}
      />

      {/* Bouton d'upload alternatif */}
      {!disabled && (
        <button
          type="button"
          onClick={triggerFileInput}
          className="flex items-center space-x-2 rtl:space-x-reverse text-sm text-primary-600 hover:text-primary-700 transition-colors"
          disabled={isUploading}
        >
          <Upload className="w-4 h-4" />
          <span>
            {isRTL ? 'تحميل صورة' : 'Télécharger une photo'}
          </span>
        </button>
      )}

      {/* Instructions */}
      <p className="text-xs text-gray-500 text-center max-w-xs">
        {isRTL 
          ? 'صيغ مدعومة: JPG, PNG, GIF. حد أقصى: 5 ميجابايت'
          : 'Formats supportés : JPG, PNG, GIF. Taille max : 5MB'
        }
      </p>
    </div>
  )
}

export default ProfilePictureUpload
