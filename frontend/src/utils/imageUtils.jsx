// Utilitaires pour la gestion des images
export const getImageUrl = (imagePath) => {
  if (!imagePath) return null
  
  // Si c'est déjà une URL complète (http/https), la retourner
  if (imagePath.startsWith('http')) return imagePath
  
  // Si c'est un Blob URL, le retourner tel quel
  if (imagePath.startsWith('blob:')) return imagePath
  
  // Si c'est du Base64, le retourner tel quel
  if (imagePath.startsWith('data:')) return imagePath
  
  // Pour GitHub Pages, utiliser le BASE_URL
  const baseUrl = import.meta.env.BASE_URL || '/'
  
  // Nettoyer le chemin
  const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath
  
  return `${baseUrl}${cleanPath}`
}

// Images par défaut pour les fallbacks
export const defaultImages = {
  logo: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiByeD0iOCIgZmlsbD0iIzM3MzNkYyIvPgo8dGV4dCB4PSIyMCIgeT0iMjYiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5NPC90ZXh0Pgo8L3N2Zz4K',
  
  placeholder: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjZjNmNGY2Ii8+CjxwYXRoIGQ9Ik0yMDAgMTUwTDE3MCAyMDBIMjMwTDIwMCAxNTBaIiBmaWxsPSIjZDFkNWRiIi8+CjxjaXJjbGUgY3g9IjE1MCIgY3k9IjEwMCIgcj0iMjAiIGZpbGw9IiNkMWQ1ZGIiLz4KPHRleHQgeD0iMjAwIiB5PSIyNjAiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzZiNzI4MCIgdGV4dC1hbmNob3I9Im1pZGRsZSI+SW1hZ2UgZGUgZMOpbW9uc3RyYXRpb248L3RleHQ+Cjwvc3ZnPgo='
}

// Composant Image avec fallback
export const ImageWithFallback = ({ 
  src, 
  alt, 
  fallback = defaultImages.placeholder, 
  className = '',
  onLoad,
  onError,
  ...props 
}) => {
  const handleError = (e) => {
    console.error('❌ ImageWithFallback: Erreur chargement image:', {
      originalSrc: src,
      processedSrc: e.target.src,
      fallback: fallback,
      error: e
    });
    
    if (e.target.src !== fallback) {
      console.log('🔄 ImageWithFallback: Basculement vers fallback');
      e.target.src = fallback;
    }
    
    // Appeler le onError personnalisé s'il existe
    if (onError) onError(e);
  }

  const handleLoad = (e) => {
    console.log('✅ ImageWithFallback: Image chargée avec succès:', {
      src: e.target.src,
      originalSrc: src
    });
    
    // Appeler le onLoad personnalisé s'il existe
    if (onLoad) onLoad(e);
  }

  const imageUrl = getImageUrl(src) || fallback;
  
  console.log('🖼️ ImageWithFallback: Traitement image:', {
    originalSrc: src,
    processedUrl: imageUrl,
    srcType: src ? (src.startsWith('blob:') ? 'Blob URL' : src.startsWith('data:') ? 'Base64' : 'Chemin') : 'undefined'
  });

  return (
    <img
      src={imageUrl}
      alt={alt}
      className={className}
      onError={handleError}
      onLoad={handleLoad}
      {...props}
    />
  )
}
