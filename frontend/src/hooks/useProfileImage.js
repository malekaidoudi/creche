import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import API_CONFIG from '../config/api';

export const useProfileImage = () => {
  const { user } = useAuth();
  const [imageKey, setImageKey] = useState(Date.now());

  // Fonction pour forcer le rechargement de l'image
  const refreshImage = () => {
    setImageKey(Date.now());
  };

  // Fonction pour obtenir l'URL de l'image avec cache-busting
  const getImageUrl = (customImageKey = null) => {
    if (!user?.profile_image && !user?.photo_url) {
      return null;
    }
    
    const imageUrl = user.profile_image || user.photo_url;
    
    // Si l'URL est déjà complète (Cloudinary), la retourner directement
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      const timestamp = customImageKey || imageKey;
      return `${imageUrl}?t=${timestamp}`;
    }
    
    // Sinon, ajouter le BASE_URL (pour compatibilité avec anciennes images locales)
    const timestamp = customImageKey || imageKey;
    return `${API_CONFIG.BASE_URL}${imageUrl}?t=${timestamp}`;
  };

  // Fonction pour vérifier si l'utilisateur a une image
  const hasImage = () => {
    return !!(user?.profile_image || user?.photo_url);
  };

  return {
    imageKey,
    refreshImage,
    getImageUrl,
    hasImage,
    user
  };
};

export default useProfileImage;
