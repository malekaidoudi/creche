/**
 * Routes API pour les activités (fil d'actualités)
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const activityService = require('../services/activityService');
const cloudinaryService = require('../services/cloudinaryService');
const auth = require('../middleware/auth');

// Configuration Multer pour l'upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/activities');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'activity-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Accepter toutes les images et vidéos courantes
  if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new Error(`Type de fichier non autorisé (${file.mimetype}). Seules les photos et vidéos sont acceptées.`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 100 * 1024 * 1024 } // 100 MB max
});

// Middleware Multer avec capture d'erreur explicite
const handleActivityUpload = (req, res, next) => {
  upload.array('media', 10)(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ success: false, error: 'Fichier trop volumineux (max 100 MB)' });
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return res.status(400).json({ success: false, error: 'Trop de fichiers ou champ média incorrect' });
        }
        return res.status(400).json({ success: false, error: `Erreur d'envoi des fichiers: ${err.message}` });
      }
      return res.status(400).json({ success: false, error: err.message || 'Erreur lors du traitement des fichiers' });
    }
    next();
  });
};

// =====================================================
// GET /api/activities - Liste des activités
// =====================================================
router.get('/', auth.authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const result = await activityService.getActivities({
      page: parseInt(page),
      limit: parseInt(limit),
      userId: req.user.userId
    });

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('❌ GET /api/activities:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

// =====================================================
// GET /api/activities/:id - Détail d'une activité
// =====================================================
router.get('/:id', auth.authenticateToken, async (req, res) => {
  try {
    const result = await activityService.getActivityById(req.params.id, req.user.userId);

    if (result.success) {
      res.json(result);
    } else {
      res.status(404).json(result);
    }
  } catch (error) {
    console.error('❌ GET /api/activities/:id:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

// =====================================================
// POST /api/activities - Créer une activité (Admin/Staff)
// =====================================================
router.post('/',
  auth.authenticateToken,
  auth.requireRole('admin', 'staff'),
  auth.requirePermission('activities.photos.publish'),
  handleActivityUpload,
  async (req, res) => {
    try {
      const {
        title,
        description,
        isPinned,
        mediaUrl,
        mediaThumbnailUrl,
        cloudinaryPublicId,
        mediaType: directMediaType,
        mediaUrls: directMediaUrls
      } = req.body;

      if (!title) {
        return res.status(400).json({ success: false, error: 'Titre requis' });
      }

      let mediaData = {
        mediaType: 'none',
        mediaUrl: null,
        mediaThumbnailUrl: null,
        cloudinaryPublicId: null,
        mediaUrls: []
      };

      // Cas 1: Direct Cloudinary (ex: vidéo ou liste multiple envoyée en direct)
      if (directMediaUrls) {
        let parsed = [];
        try {
          parsed = typeof directMediaUrls === 'string' ? JSON.parse(directMediaUrls) : directMediaUrls;
        } catch {
          parsed = [];
        }
        if (Array.isArray(parsed) && parsed.length > 0) {
          mediaData = {
            mediaType: parsed.length > 1 ? 'images' : (parsed[0].type || 'image'),
            mediaUrl: parsed[0].url,
            mediaThumbnailUrl: parsed[0].thumbnailUrl || null,
            cloudinaryPublicId: parsed[0].publicId || null,
            mediaUrls: parsed
          };
        }
      } else if (mediaUrl && directMediaType) {
        mediaData = {
          mediaType: directMediaType,
          mediaUrl: mediaUrl,
          mediaThumbnailUrl: mediaThumbnailUrl || null,
          cloudinaryPublicId: cloudinaryPublicId || null,
          mediaUrls: [{
            url: mediaUrl,
            thumbnailUrl: mediaThumbnailUrl || null,
            publicId: cloudinaryPublicId || null,
            type: directMediaType
          }]
        };
      }
      // Cas 2: Upload classique via backend (fichiers reçus dans req.files ou req.file)
      else if (req.files && req.files.length > 0) {
        console.log(`📁 ${req.files.length} fichier(s) reçu(s)`);

        const firstFile = req.files[0];
        const isVideo = firstFile.mimetype.startsWith('video/');

        if (isVideo) {
          // Vidéo unique
          const uploadResult = await cloudinaryService.uploadFile(
            firstFile.path,
            'activities',
            null,
            true
          );

          let thumbnailUrl = null;
          if (uploadResult.success) {
            thumbnailUrl = uploadResult.url
              .replace('/video/upload/', '/video/upload/so_0,w_800,h_450,c_fill,f_jpg/')
              .replace(/\.(mp4|webm|mov|avi)$/i, '.jpg');

            mediaData = {
              mediaType: 'video',
              mediaUrl: uploadResult.url,
              mediaThumbnailUrl: thumbnailUrl,
              cloudinaryPublicId: uploadResult.publicId,
              mediaUrls: [{
                url: uploadResult.url,
                thumbnailUrl,
                publicId: uploadResult.publicId,
                type: 'video'
              }]
            };
          }

          fs.unlink(firstFile.path, () => {});
        } else {
          // Traitement des images (1 ou plusieurs)
          const uploadedMedia = [];

          for (const file of req.files) {
            try {
              const uploadResult = await cloudinaryService.uploadFile(
                file.path,
                'activities',
                null,
                false
              );

              if (uploadResult.success) {
                const thumb = uploadResult.url.replace('/upload/', '/upload/w_800,h_800,c_fill,q_auto:best/');
                uploadedMedia.push({
                  url: uploadResult.url,
                  thumbnailUrl: thumb,
                  publicId: uploadResult.publicId,
                  type: 'image'
                });
              }
            } catch (err) {
              console.error(`❌ Échec upload image ${file.originalname}:`, err);
            } finally {
              fs.unlink(file.path, () => {});
            }
          }

          if (uploadedMedia.length > 0) {
            mediaData = {
              mediaType: uploadedMedia.length > 1 ? 'images' : 'image',
              mediaUrl: uploadedMedia[0].url,
              mediaThumbnailUrl: uploadedMedia[0].thumbnailUrl,
              cloudinaryPublicId: uploadedMedia[0].publicId,
              mediaUrls: uploadedMedia
            };
          }
        }
      }

      const activityData = {
        title,
        description,
        isPinned: isPinned === 'true' || isPinned === true,
        ...mediaData
      };

      const result = await activityService.createActivity(activityData, req.user.userId);

      if (result.success) {
        // Notifier les parents
        await activityService.notifyParentsNewActivity(result.activity);
        res.status(201).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('❌ POST /api/activities:', error);
      res.status(500).json({ success: false, error: 'Erreur serveur' });
    }
  }
);



// =====================================================
// DELETE /api/activities/:id - Supprimer une activité
// =====================================================
router.delete('/:id', auth.authenticateToken, async (req, res) => {
  try {
    const result = await activityService.deleteActivity(
      req.params.id,
      req.user.userId,
      req.user.role
    );

    if (result.success) {
      res.json(result);
    } else {
      res.status(result.error === 'Non autorisé' ? 403 : 400).json(result);
    }
  } catch (error) {
    console.error('❌ DELETE /api/activities/:id:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

// =====================================================
// POST /api/activities/:id/reactions - Ajouter/Toggle réaction
// =====================================================
router.post('/:id/reactions', auth.authenticateToken, async (req, res) => {
  try {
    const { reactionType } = req.body;

    if (!reactionType) {
      return res.status(400).json({ success: false, error: 'Type de réaction requis' });
    }

    const result = await activityService.toggleReaction(
      req.params.id,
      req.user.userId,
      reactionType
    );

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('❌ POST /api/activities/:id/reactions:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

// =====================================================
// GET /api/activities/:id/reactions/details - Détails des réactions
// =====================================================
router.get('/:id/reactions/details', auth.authenticateToken, async (req, res) => {
  try {
    const result = await activityService.getReactionDetails(req.params.id);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('❌ GET /api/activities/:id/reactions/details:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

// =====================================================
// GET /api/activities/:id/comments - Liste des commentaires
// =====================================================
router.get('/:id/comments', auth.authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const result = await activityService.getComments(
      req.params.id,
      parseInt(page),
      parseInt(limit)
    );

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('❌ GET /api/activities/:id/comments:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

// =====================================================
// POST /api/activities/:id/comments - Ajouter un commentaire
// =====================================================
router.post('/:id/comments', auth.authenticateToken, async (req, res) => {
  try {
    const { content, parentCommentId } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Contenu requis' });
    }

    const result = await activityService.addComment(
      req.params.id,
      req.user.userId,
      content.trim(),
      parentCommentId || null
    );

    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('❌ POST /api/activities/:id/comments:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

// =====================================================
// DELETE /api/activities/:id/comments/:commentId
// =====================================================
router.delete('/:id/comments/:commentId', auth.authenticateToken, async (req, res) => {
  try {
    const result = await activityService.deleteComment(
      req.params.commentId,
      req.user.userId,
      req.user.role
    );

    if (result.success) {
      res.json(result);
    } else {
      res.status(result.error === 'Non autorisé' ? 403 : 400).json(result);
    }
  } catch (error) {
    console.error('❌ DELETE /api/activities/:id/comments/:commentId:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

module.exports = router;

