const cloudinary = require('cloudinary').v2;

// Configuration Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

console.log('☁️  Configuration Cloudinary:', {
  cloudName: process.env.CLOUDINARY_CLOUD_NAME,
  apiKeyPresent: !!process.env.CLOUDINARY_API_KEY,
  apiSecretPresent: !!process.env.CLOUDINARY_API_SECRET
});

const cloudinaryService = {
  /**
   * Uploader un fichier vers Cloudinary
   * @param {string} filePath - Chemin local du fichier
   * @param {string} folder - Dossier dans Cloudinary (ex: 'enrollments')
   * @param {string} publicId - ID public personnalisé (optionnel)
   * @returns {Promise<Object>} - Résultat de l'upload avec URL
   */
  uploadFile: async (filePath, folder = 'enrollments', publicId = null, isVideo = false) => {
    try {
      if (!process.env.CLOUDINARY_CLOUD_NAME) {
        console.warn('⚠️  Cloudinary non configuré, fichier non uploadé');
        return { success: false, error: 'Cloudinary non configuré' };
      }

      const options = {
        folder: folder,
        resource_type: 'auto', // Détecte automatiquement le type (image, pdf, etc.)
        use_filename: true,
        unique_filename: true
      };

      // Options spécifiques pour les vidéos - qualité maximale
      if (isVideo) {
        options.resource_type = 'video';
        options.eager = [
          { quality: 'auto:best', fetch_format: 'auto' }
        ];
        options.eager_async = true;
        // Ne pas appliquer de compression agressive
        options.quality = 'auto:best';
      }

      if (publicId) {
        options.public_id = publicId;
      }

      console.log('☁️  Upload vers Cloudinary:', filePath, isVideo ? '(vidéo)' : '');

      const result = await cloudinary.uploader.upload(filePath, options);

      console.log('✅ Fichier uploadé sur Cloudinary:', result.secure_url);

      return {
        success: true,
        url: result.secure_url,
        publicId: result.public_id,
        format: result.format,
        resourceType: result.resource_type,
        bytes: result.bytes,
        duration: result.duration || null
      };

    } catch (error) {
      console.error('❌ Erreur upload Cloudinary:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Uploader un fichier vers Cloudinary avec écrasement (overwrite)
   * Utilisé pour les photos de profil - un seul fichier par utilisateur
   * @param {string} filePath - Chemin local du fichier
   * @param {string} folder - Dossier dans Cloudinary
   * @param {string} publicId - ID public fixe (obligatoire pour overwrite)
   * @returns {Promise<Object>} - Résultat de l'upload avec URL
   */
  uploadFileWithOverwrite: async (filePath, folder, publicId) => {
    try {
      if (!process.env.CLOUDINARY_CLOUD_NAME) {
        console.warn('⚠️  Cloudinary non configuré, fichier non uploadé');
        return { success: false, error: 'Cloudinary non configuré' };
      }

      if (!publicId) {
        return { success: false, error: 'publicId requis pour overwrite' };
      }

      const options = {
        folder: folder,
        public_id: publicId,
        overwrite: true, // Écrase le fichier existant avec le même public_id
        invalidate: true, // Invalide le cache CDN pour voir la nouvelle image immédiatement
        resource_type: 'image'
      };

      console.log('☁️  Upload avec overwrite vers Cloudinary:', filePath, `(${folder}/${publicId})`);

      const result = await cloudinary.uploader.upload(filePath, options);

      console.log('✅ Fichier uploadé/écrasé sur Cloudinary:', result.secure_url);

      return {
        success: true,
        url: result.secure_url,
        publicId: result.public_id,
        format: result.format,
        resourceType: result.resource_type,
        bytes: result.bytes
      };

    } catch (error) {
      console.error('❌ Erreur upload Cloudinary (overwrite):', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Supprimer un fichier de Cloudinary
   * @param {string} publicId - ID public du fichier
   * @returns {Promise<Object>} - Résultat de la suppression
   */
  deleteFile: async (publicId) => {
    try {
      if (!process.env.CLOUDINARY_CLOUD_NAME) {
        return { success: false, error: 'Cloudinary non configuré' };
      }

      console.log('🗑️  Suppression de Cloudinary:', publicId);
      
      const result = await cloudinary.uploader.destroy(publicId);
      
      console.log('✅ Fichier supprimé de Cloudinary');
      
      return {
        success: true,
        result: result.result
      };

    } catch (error) {
      console.error('❌ Erreur suppression Cloudinary:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Obtenir l'URL d'un fichier avec transformations
   * @param {string} publicId - ID public du fichier
   * @param {Object} transformations - Transformations à appliquer
   * @returns {string} - URL transformée
   */
  getUrl: (publicId, transformations = {}) => {
    if (!process.env.CLOUDINARY_CLOUD_NAME) {
      return null;
    }

    return cloudinary.url(publicId, transformations);
  },

  /**
   * Vérifier si Cloudinary est configuré
   * @returns {boolean}
   */
  isConfigured: () => {
    return !!(
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
    );
  }
};

module.exports = cloudinaryService;
