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
  const allowedImages = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const allowedVideos = ['video/mp4', 'video/webm', 'video/quicktime'];

  if (allowedImages.includes(file.mimetype) || allowedVideos.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Type de fichier non autorisé'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 100 * 1024 * 1024 } // 100 MB max
});

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
  upload.single('media'),
  async (req, res) => {
    try {
      const { title, description, isPinned } = req.body;

      if (!title) {
        return res.status(400).json({ success: false, error: 'Titre requis' });
      }

      let mediaData = { mediaType: 'none', mediaUrl: null, mediaThumbnailUrl: null, cloudinaryPublicId: null };

      // Upload du média si présent
      if (req.file) {
        const isVideo = req.file.mimetype.startsWith('video/');

        // Upload vers Cloudinary avec qualité optimisée pour les vidéos
        const uploadResult = await cloudinaryService.uploadFile(
          req.file.path,
          'activities',
          null,
          isVideo // Passer le flag isVideo pour qualité maximale
        );

        if (uploadResult.success) {
          // Pour les vidéos, générer une thumbnail JPG à partir de la première frame
          let thumbnailUrl = null;
          if (isVideo) {
            // Transformer l'URL vidéo en URL d'image (première frame)
            // Format: /video/upload/ -> /video/upload/so_0,w_800,h_450,c_fill,f_jpg/
            thumbnailUrl = uploadResult.url
              .replace('/video/upload/', '/video/upload/so_0,w_800,h_450,c_fill,f_jpg/')
              .replace(/\.(mp4|webm|mov|avi)$/i, '.jpg');
          } else {
            // Pour les images, simple redimensionnement
            thumbnailUrl = uploadResult.url.replace('/upload/', '/upload/w_800,h_450,c_fill,q_auto:best/');
          }

          mediaData = {
            mediaType: isVideo ? 'video' : 'image',
            mediaUrl: uploadResult.url,
            mediaThumbnailUrl: thumbnailUrl,
            cloudinaryPublicId: uploadResult.publicId
          };
        }

        // Supprimer le fichier local
        fs.unlink(req.file.path, (err) => {
          if (err) console.error('Erreur suppression fichier local:', err);
        });
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

