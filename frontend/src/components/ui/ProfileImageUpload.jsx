import { useState } from 'react';
import { Camera, User } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import LoadingSpinner from './LoadingSpinner';
import API_CONFIG from '../../config/api';
import toast from 'react-hot-toast';

const ProfileImageUpload = ({ 
  currentImage, 
  onImageUpdate, 
  size = 'large',
  showButton = true 
}) => {
  const { isRTL } = useLanguage();
  const [uploading, setUploading] = useState(false);
  const [imageError, setImageError] = useState(false);

  const sizeClasses = {
    small: 'w-8 h-8',
    medium: 'w-10 h-10', 
    large: 'w-32 h-32'
  };

  const iconSizes = {
    small: 'w-5 h-5',
    medium: 'w-6 h-6',
    large: 'w-16 h-16'
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    event.target.value = ''; // Reset pour permettre re-sélection
    
    if (!file) return;

    // Validation
    if (!file.type.startsWith('image/')) {
      toast.error(isRTL ? 'يرجى اختيار صورة صالحة' : 'Veuillez sélectionner une image valide');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error(isRTL ? 'حجم الصورة كبير جداً (الحد الأقصى 5 ميجابايت)' : 'Image trop volumineuse (5MB max)');
      return;
    }

    setUploading(true);
    setImageError(false);

    try {
      const formData = new FormData();
      formData.append('profile_image', file);

      const token = localStorage.getItem('token');
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/users/profile/image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (data.success && data.profile_image) {
        onImageUpdate(data.profile_image, data.user);
        toast.success(isRTL ? 'تم تحديث صورة الملف الشخصي بنجاح' : 'Photo de profil mise à jour avec succès');
      } else {
        throw new Error(data.error || 'Erreur upload');
      }
    } catch (error) {
      console.error('Erreur upload image:', error);
      toast.error(error.message || (isRTL ? 'خطأ في رفع الصورة' : 'Erreur lors de l\'upload'));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="text-center">
      {/* Image container */}
      <div className={`${sizeClasses[size]} mx-auto rounded-full overflow-hidden bg-primary-100 dark:bg-primary-900 flex items-center justify-center relative`}>
        {currentImage && !imageError ? (
          <img
            key={currentImage}
            src={`${API_CONFIG.BASE_URL}${currentImage}`}
            alt="Photo de profil"
            className="w-full h-full object-cover"
            onLoad={() => setImageError(false)}
            onError={() => {
              console.error('Erreur chargement image:', currentImage);
              setImageError(true);
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <User className={`${iconSizes[size]} text-primary-600 dark:text-primary-400`} />
          </div>
        )}

        {/* Loading overlay */}
        {uploading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <LoadingSpinner size="sm" />
          </div>
        )}
      </div>

      {/* Upload button */}
      {showButton && (
        <div className="mt-4">
          <label className="inline-flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg cursor-pointer transition-colors disabled:opacity-50">
            <Camera className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
            {uploading 
              ? (isRTL ? 'جاري الرفع...' : 'Upload...') 
              : (isRTL ? 'تغيير الصورة' : 'Changer la photo')
            }
            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
              onChange={handleImageUpload}
              className="hidden"
              disabled={uploading}
            />
          </label>
        </div>
      )}
    </div>
  );
};

export default ProfileImageUpload;
