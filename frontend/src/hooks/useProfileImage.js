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
    
    const timestamp = customImageKey || imageKey;
    return `${API_CONFIG.BASE_URL}${user.profile_image || user.photo_url}?t=${timestamp}`;
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
