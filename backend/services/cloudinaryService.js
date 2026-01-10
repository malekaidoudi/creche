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
   * ═══════════════════════════════════════════════════════════════════════════
   * MÉTHODE UNIFIÉE D'UPLOAD DE DOCUMENTS ENFANT
   * ═══════════════════════════════════════════════════════════════════════════
   * Structure: enrollments/child_{childId}/{documentType}_{timestamp}
   * Utilisée par: inscription parent ET ajout admin
   * 
   * @param {string|Buffer} filePathOrBuffer - Chemin local ou buffer du fichier
   * @param {number} childId - ID de l'enfant
   * @param {string} documentType - Type de document (carnet_medical, acte_naissance, certificat_medical)
   * @param {Object} options - Options supplémentaires
   * @returns {Promise<Object>} - Résultat de l'upload avec URL
   */
  uploadChildDocument: async (filePathOrBuffer, childId, documentType, options = {}) => {
    try {
      if (!cloudinaryService.isConfigured()) {
        console.warn('⚠️  Cloudinary non configuré, fichier non uploadé');
        return { success: false, error: 'Cloudinary non configuré' };
      }

      const timestamp = Date.now();
      const folder = `enrollments/child_${childId}`;
      const publicId = `${documentType}_${timestamp}`;

      const uploadOptions = {
        folder: folder,
        public_id: publicId,
        resource_type: 'auto',
        use_filename: false,
        unique_filename: false,
        overwrite: options.overwrite || false
      };

      console.log(`☁️  Upload document enfant #${childId}:`, documentType);

      let result;
      if (Buffer.isBuffer(filePathOrBuffer)) {
        // Upload depuis un buffer
        result = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(uploadOptions, (error, uploadResult) => {
            if (error) reject(error);
            else resolve(uploadResult);
          });
          uploadStream.end(filePathOrBuffer);
        });
      } else {
        // Upload depuis un chemin de fichier
        result = await cloudinary.uploader.upload(filePathOrBuffer, uploadOptions);
      }

      console.log('✅ Document uploadé:', result.secure_url);

      return {
        success: true,
        url: result.secure_url,
        publicId: result.public_id,
        format: result.format,
        resourceType: result.resource_type,
        bytes: result.bytes,
        folder: folder
      };

    } catch (error) {
      console.error('❌ Erreur upload document enfant:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Renommer/Archiver le dossier d'un enfant sur Cloudinary
   * Ajoute le préfixe "archived_" au dossier
   * @param {number} childId - ID de l'enfant
   * @returns {Promise<Object>} - Résultat de l'archivage
   */
  archiveChildFolder: async (childId) => {
    try {
      if (!cloudinaryService.isConfigured()) {
        return { success: false, error: 'Cloudinary non configuré' };
      }

      const sourceFolder = `enrollments/child_${childId}`;
      const targetFolder = `enrollments/archived_child_${childId}`;

      console.log(`📦 Archivage dossier enfant #${childId}...`);

      // Lister tous les fichiers du dossier source
      const resources = await cloudinary.api.resources({
        type: 'upload',
        prefix: sourceFolder,
        max_results: 100,
        resource_type: 'image'
      });

      if (resources.resources.length === 0) {
        console.log(`⚠️ Aucun fichier à archiver pour enfant #${childId}`);
        return { success: true, message: 'Aucun fichier à archiver', archivedCount: 0 };
      }

      let archivedCount = 0;
      const archivedFiles = [];

      // Renommer chaque fichier vers le dossier archived
      for (const resource of resources.resources) {
        const oldPublicId = resource.public_id;
        const newPublicId = oldPublicId.replace(sourceFolder, targetFolder);

        try {
          await cloudinary.uploader.rename(oldPublicId, newPublicId);
          archivedCount++;
          archivedFiles.push({ old: oldPublicId, new: newPublicId });
          console.log(`  ✅ Archivé: ${oldPublicId} → ${newPublicId}`);
        } catch (renameError) {
          console.error(`  ❌ Erreur archivage ${oldPublicId}:`, renameError.message);
        }
      }

      console.log(`✅ Archivage terminé: ${archivedCount}/${resources.resources.length} fichiers`);

      return {
        success: true,
        archivedCount,
        archivedFiles,
        sourceFolder,
        targetFolder
      };

    } catch (error) {
      console.error('❌ Erreur archivage dossier enfant:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Supprimer tous les fichiers d'un dossier sur Cloudinary
   * Utilisé quand une inscription est rejetée (autre raison que dossier incomplet)
   * @param {number} id - ID de l'enfant ou enrollment
   * @param {string} folderType - 'child' ou 'enrollment'
   * @returns {Promise<Object>} - Résultat de la suppression
   */
  deleteFolder: async (id, folderType = 'child') => {
    try {
      if (!cloudinaryService.isConfigured()) {
        return { success: false, error: 'Cloudinary non configuré' };
      }

      const folder = folderType === 'child'
        ? `enrollments/child_${id}`
        : `enrollments/enrollment_${id}`;

      console.log(`🗑️ Suppression dossier ${folder}...`);

      // Lister tous les fichiers du dossier (images et raw)
      let allResources = [];

      for (const resourceType of ['image', 'raw']) {
        try {
          const resources = await cloudinary.api.resources({
            type: 'upload',
            prefix: folder,
            max_results: 100,
            resource_type: resourceType
          });
          allResources = allResources.concat(resources.resources || []);
        } catch (e) {
          // Ignorer les erreurs si pas de ressources de ce type
        }
      }

      if (allResources.length === 0) {
        console.log(`⚠️ Aucun fichier à supprimer dans ${folder}`);
        return { success: true, message: 'Aucun fichier à supprimer', deletedCount: 0 };
      }

      let deletedCount = 0;

      // Supprimer chaque fichier
      for (const resource of allResources) {
        try {
          await cloudinary.uploader.destroy(resource.public_id, { resource_type: resource.resource_type });
          deletedCount++;
          console.log(`  ✅ Supprimé: ${resource.public_id}`);
        } catch (deleteError) {
          console.error(`  ❌ Erreur suppression ${resource.public_id}:`, deleteError.message);
        }
      }

      console.log(`✅ Suppression terminée: ${deletedCount}/${allResources.length} fichiers`);

      return {
        success: true,
        deletedCount,
        folder
      };

    } catch (error) {
      console.error('❌ Erreur suppression dossier:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * ═══════════════════════════════════════════════════════════════════════════
   * UPLOAD DOCUMENT POUR INSCRIPTION (avant validation)
   * ═══════════════════════════════════════════════════════════════════════════
   * Structure: enrollments/enrollment_{enrollmentId}/{documentType}_{timestamp}
   * 
   * @param {string|Buffer} filePathOrBuffer - Chemin local ou buffer du fichier
   * @param {number} enrollmentId - ID de l'inscription
   * @param {string} documentType - Type de document
   * @returns {Promise<Object>} - Résultat de l'upload avec URL
   */
  uploadEnrollmentDocument: async (filePathOrBuffer, enrollmentId, documentType) => {
    try {
      if (!cloudinaryService.isConfigured()) {
        console.warn('⚠️  Cloudinary non configuré, fichier non uploadé');
        return { success: false, error: 'Cloudinary non configuré' };
      }

      const timestamp = Date.now();
      const folder = `enrollments/enrollment_${enrollmentId}`;
      const publicId = `${documentType}_${timestamp}`;

      const uploadOptions = {
        folder: folder,
        public_id: publicId,
        resource_type: 'auto',
        use_filename: false,
        unique_filename: false
      };

      console.log(`☁️  Upload document inscription #${enrollmentId}:`, documentType);

      let result;
      if (Buffer.isBuffer(filePathOrBuffer)) {
        result = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(uploadOptions, (error, uploadResult) => {
            if (error) reject(error);
            else resolve(uploadResult);
          });
          uploadStream.end(filePathOrBuffer);
        });
      } else {
        result = await cloudinary.uploader.upload(filePathOrBuffer, uploadOptions);
      }

      console.log('✅ Document uploadé:', result.secure_url);

      return {
        success: true,
        url: result.secure_url,
        publicId: result.public_id,
        format: result.format,
        resourceType: result.resource_type,
        bytes: result.bytes,
        folder: folder
      };

    } catch (error) {
      console.error('❌ Erreur upload document inscription:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * ═══════════════════════════════════════════════════════════════════════════
   * MIGRER DOCUMENTS D'INSCRIPTION VERS DOSSIER ENFANT
   * ═══════════════════════════════════════════════════════════════════════════
   * Renomme les fichiers de enrollments/enrollment_{id}/ vers enrollments/child_{childId}/
   * Appelé après validation de l'inscription
   * 
   * @param {number} enrollmentId - ID de l'inscription
   * @param {number} childId - ID de l'enfant créé
   * @returns {Promise<Object>} - Résultat de la migration avec nouvelles URLs
   */
  migrateEnrollmentToChild: async (enrollmentId, childId) => {
    try {
      if (!cloudinaryService.isConfigured()) {
        return { success: false, error: 'Cloudinary non configuré' };
      }

      const sourceFolder = `enrollments/enrollment_${enrollmentId}`;
      const targetFolder = `enrollments/child_${childId}`;

      console.log(`📦 Migration documents inscription #${enrollmentId} → enfant #${childId}...`);

      // Lister tous les fichiers du dossier source
      let allResources = [];
      for (const resourceType of ['image', 'raw']) {
        try {
          const resources = await cloudinary.api.resources({
            type: 'upload',
            prefix: sourceFolder,
            max_results: 100,
            resource_type: resourceType
          });
          allResources = allResources.concat(resources.resources || []);
        } catch (e) {
          // Ignorer
        }
      }

      if (allResources.length === 0) {
        console.log(`⚠️ Aucun fichier à migrer pour inscription #${enrollmentId}`);
        return { success: true, message: 'Aucun fichier à migrer', migratedCount: 0, migratedFiles: [] };
      }

      let migratedCount = 0;
      const migratedFiles = [];

      // Renommer chaque fichier vers le dossier enfant
      for (const resource of allResources) {
        const oldPublicId = resource.public_id;
        const newPublicId = oldPublicId.replace(sourceFolder, targetFolder);

        try {
          await cloudinary.uploader.rename(oldPublicId, newPublicId);
          migratedCount++;

          // Construire la nouvelle URL
          const newUrl = resource.secure_url.replace(
            `/${sourceFolder}/`,
            `/${targetFolder}/`
          );

          migratedFiles.push({
            oldPublicId,
            newPublicId,
            oldUrl: resource.secure_url,
            newUrl
          });
          console.log(`  ✅ Migré: ${oldPublicId} → ${newPublicId}`);
        } catch (renameError) {
          console.error(`  ❌ Erreur migration ${oldPublicId}:`, renameError.message);
        }
      }

      console.log(`✅ Migration terminée: ${migratedCount}/${allResources.length} fichiers`);

      return {
        success: true,
        migratedCount,
        migratedFiles,
        sourceFolder,
        targetFolder
      };

    } catch (error) {
      console.error('❌ Erreur migration documents:', error);
      return { success: false, error: error.message };
    }
  },

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
        resource_type: 'auto', // Laisser Cloudinary détecter le type
        use_filename: true,
        unique_filename: true
      };

      // Options spécifiques pour les vidéos - qualité maximale
      if (isVideo) {
        options.resource_type = 'video';
        // Ne pas utiliser eager pour les vidéos volumineuses (cause l'erreur)
        // Cloudinary traitera la vidéo de manière asynchrone automatiquement
        options.timeout = 600000;
        // Chunk size de 20 MB pour upload plus rapide (max recommandé)
        options.chunk_size = 20000000;
      }

      if (publicId) {
        options.public_id = publicId;
      }

      console.log('☁️  Upload vers Cloudinary:', filePath, isVideo ? '(vidéo volumineuse - upload_large)' : '');

      let result;
      if (isVideo) {
        // Utiliser upload_large pour les vidéos volumineuses (> 100 MB supporté)
        // upload_large retourne une Promise qui doit être attendue correctement
        result = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload_large(filePath, options, (error, uploadResult) => {
            if (error) {
              reject(error);
            } else {
              resolve(uploadResult);
            }
          });
        });
      } else {
        result = await cloudinary.uploader.upload(filePath, options);
      }

      console.log('✅ Fichier uploadé sur Cloudinary:', result.secure_url);
      console.log('📊 Détails upload:', { publicId: result.public_id, format: result.format, bytes: result.bytes });

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
   * Obtenir une URL signée avec expiration pour télécharger un fichier (PDF, documents)
   * @param {string} publicId - ID public du fichier
   * @param {Object} options - Options (resource_type, format, expiresIn en secondes)
   * @returns {string} - URL signée avec expiration
   */
  getSignedUrl: (publicId, options = {}) => {
    if (!process.env.CLOUDINARY_CLOUD_NAME) {
      return null;
    }

    // Expiration par défaut: 1 heure (3600 secondes)
    const expiresIn = options.expiresIn || 3600;
    const expiresAt = Math.floor(Date.now() / 1000) + expiresIn;

    const urlOptions = {
      sign_url: true,
      secure: true,
      resource_type: options.resource_type || 'image',
      type: 'authenticated', // Type authenticated pour les URLs avec expiration
      expires_at: expiresAt
    };

    if (options.format) {
      urlOptions.format = options.format;
    }

    if (options.flags) {
      urlOptions.flags = options.flags;
    }

    return cloudinary.url(publicId, urlOptions);
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
  },

  /**
   * Récupérer les statistiques d'utilisation Cloudinary
   * @returns {Promise<Object>} - Statistiques de stockage
   */
  getUsageStats: async () => {
    try {
      if (!cloudinaryService.isConfigured()) {
        return { success: false, error: 'Cloudinary non configuré' };
      }

      const result = await cloudinary.api.usage();

      // Limites du plan gratuit Cloudinary
      const FREE_PLAN_LIMITS = {
        storage: 25 * 1024 * 1024 * 1024, // 25 GB
        bandwidth: 25 * 1024 * 1024 * 1024, // 25 GB/mois
        transformations: 25000, // 25,000 transformations/mois
        credits: 25 // 25 crédits/mois
      };

      return {
        success: true,
        usage: {
          storage: {
            used: result.storage?.usage || 0,
            limit: FREE_PLAN_LIMITS.storage,
            percentage: ((result.storage?.usage || 0) / FREE_PLAN_LIMITS.storage * 100).toFixed(2)
          },
          bandwidth: {
            used: result.bandwidth?.usage || 0,
            limit: FREE_PLAN_LIMITS.bandwidth,
            percentage: ((result.bandwidth?.usage || 0) / FREE_PLAN_LIMITS.bandwidth * 100).toFixed(2)
          },
          transformations: {
            used: result.transformations?.usage || 0,
            limit: FREE_PLAN_LIMITS.transformations,
            percentage: ((result.transformations?.usage || 0) / FREE_PLAN_LIMITS.transformations * 100).toFixed(2)
          },
          credits: {
            used: result.credits?.usage || 0,
            limit: FREE_PLAN_LIMITS.credits,
            percentage: ((result.credits?.usage || 0) / FREE_PLAN_LIMITS.credits * 100).toFixed(2)
          },
          resources: result.resources || 0,
          derived_resources: result.derived_resources || 0
        },
        plan: result.plan || 'Free',
        lastUpdated: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Erreur récupération stats Cloudinary:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Lister les dossiers racine dans Cloudinary
   * @returns {Promise<Object>} - Liste des dossiers
   */
  listFolders: async (path = '') => {
    try {
      if (!cloudinaryService.isConfigured()) {
        return { success: false, error: 'Cloudinary non configuré' };
      }

      const result = await cloudinary.api.root_folders();

      return {
        success: true,
        folders: result.folders || []
      };

    } catch (error) {
      console.error('❌ Erreur listing dossiers Cloudinary:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Lister les sous-dossiers d'un dossier
   * @param {string} folder - Chemin du dossier parent
   * @returns {Promise<Object>} - Liste des sous-dossiers
   */
  listSubFolders: async (folder) => {
    try {
      if (!cloudinaryService.isConfigured()) {
        return { success: false, error: 'Cloudinary non configuré' };
      }

      // Toujours extraire les sous-dossiers depuis les fichiers existants
      // Car l'API sub_folders ne retourne que les dossiers "réels", pas les virtuels
      const subFolders = new Set();
      const folderPrefix = folder ? folder + '/' : '';

      for (const resourceType of ['image', 'video', 'raw']) {
        try {
          const resources = await cloudinary.api.resources({
            type: 'upload',
            prefix: folder,
            max_results: 500,
            resource_type: resourceType
          });

          (resources.resources || []).forEach(r => {
            const relativePath = r.public_id.substring(folderPrefix.length);
            const parts = relativePath.split('/');
            if (parts.length > 1) {
              subFolders.add(parts[0]);
            }
          });
        } catch (typeError) {
          // Ignorer les erreurs pour certains types
        }
      }

      const folders = Array.from(subFolders).map(name => ({
        name: name,
        path: folder ? `${folder}/${name}` : name
      }));

      return {
        success: true,
        folders: folders
      };

    } catch (error) {
      console.error('❌ Erreur listing sous-dossiers Cloudinary:', error);
      return {
        success: false,
        error: error.message,
        folders: []
      };
    }
  },

  /**
   * Lister les ressources (fichiers) dans un dossier
   * @param {string} folder - Chemin du dossier (optionnel)
   * @param {string} resourceType - Type de ressource (image, video, raw)
   * @param {number} maxResults - Nombre max de résultats
   * @param {string} nextCursor - Curseur pour pagination
   * @returns {Promise<Object>} - Liste des ressources
   */
  listResources: async (folder = '', resourceType = 'image', maxResults = 50, nextCursor = null) => {
    try {
      if (!cloudinaryService.isConfigured()) {
        return { success: false, error: 'Cloudinary non configuré' };
      }

      const options = {
        type: 'upload',
        max_results: maxResults,
        resource_type: resourceType
      };

      if (folder) {
        options.prefix = folder;
      }

      if (nextCursor) {
        options.next_cursor = nextCursor;
      }

      const result = await cloudinary.api.resources(options);

      return {
        success: true,
        resources: (result.resources || []).map(r => ({
          publicId: r.public_id,
          format: r.format,
          resourceType: r.resource_type,
          type: r.type,
          createdAt: r.created_at,
          bytes: r.bytes,
          width: r.width,
          height: r.height,
          url: r.secure_url,
          folder: r.folder || r.public_id.split('/').slice(0, -1).join('/'),
          filename: r.public_id.split('/').pop(),
          duration: r.duration || null
        })),
        nextCursor: result.next_cursor || null,
        totalCount: result.total_count || result.resources?.length || 0
      };

    } catch (error) {
      console.error('❌ Erreur listing ressources Cloudinary:', error);
      return {
        success: false,
        error: error.message,
        resources: []
      };
    }
  },

  /**
   * Rechercher des ressources par expression
   * @param {string} expression - Expression de recherche
   * @param {number} maxResults - Nombre max de résultats
   * @returns {Promise<Object>} - Résultats de recherche
   */
  searchResources: async (expression, maxResults = 50) => {
    try {
      if (!cloudinaryService.isConfigured()) {
        return { success: false, error: 'Cloudinary non configuré' };
      }

      const result = await cloudinary.search
        .expression(expression)
        .max_results(maxResults)
        .execute();

      return {
        success: true,
        resources: (result.resources || []).map(r => ({
          publicId: r.public_id,
          format: r.format,
          resourceType: r.resource_type,
          createdAt: r.created_at,
          bytes: r.bytes,
          width: r.width,
          height: r.height,
          url: r.secure_url,
          folder: r.folder || r.public_id.split('/').slice(0, -1).join('/'),
          filename: r.public_id.split('/').pop()
        })),
        totalCount: result.total_count || 0
      };

    } catch (error) {
      console.error('❌ Erreur recherche Cloudinary:', error);
      return {
        success: false,
        error: error.message,
        resources: []
      };
    }
  },

  /**
   * Supprimer un dossier et son contenu
   * @param {string} folder - Chemin du dossier
   * @returns {Promise<Object>} - Résultat de la suppression
   */
  deleteFolder: async (folder) => {
    try {
      if (!cloudinaryService.isConfigured()) {
        return { success: false, error: 'Cloudinary non configuré' };
      }

      // D'abord supprimer toutes les ressources du dossier
      await cloudinary.api.delete_resources_by_prefix(folder);

      // Puis supprimer le dossier vide
      const result = await cloudinary.api.delete_folder(folder);

      return {
        success: true,
        result: result
      };

    } catch (error) {
      console.error('❌ Erreur suppression dossier Cloudinary:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
};

module.exports = cloudinaryService;
