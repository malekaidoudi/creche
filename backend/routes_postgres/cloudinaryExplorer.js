/**
 * Routes API pour l'explorateur Cloudinary
 * Permet de visualiser et gérer les fichiers stockés sur Cloudinary
 */

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const cloudinaryService = require('../services/cloudinaryService');

/**
 * GET /api/cloudinary-explorer/stats
 * Récupérer les statistiques d'utilisation Cloudinary
 */
router.get('/stats', auth.authenticateToken, auth.requireRole('admin'), async (req, res) => {
    try {
        const result = await cloudinaryService.getUsageStats();

        if (!result.success) {
            return res.status(500).json(result);
        }

        res.json(result);
    } catch (error) {
        console.error('❌ Erreur GET /api/cloudinary-explorer/stats:', error);
        res.status(500).json({ success: false, error: 'Erreur serveur' });
    }
});

/**
 * GET /api/cloudinary-explorer/folders
 * Lister les dossiers racine
 */
router.get('/folders', auth.authenticateToken, auth.requireRole('admin'), async (req, res) => {
    try {
        const result = await cloudinaryService.listFolders();

        if (!result.success) {
            return res.status(500).json(result);
        }

        res.json(result);
    } catch (error) {
        console.error('❌ Erreur GET /api/cloudinary-explorer/folders:', error);
        res.status(500).json({ success: false, error: 'Erreur serveur' });
    }
});

/**
 * GET /api/cloudinary-explorer/folders/:path
 * Lister les sous-dossiers d'un dossier
 */
router.get('/folders/:path(*)', auth.authenticateToken, auth.requireRole('admin'), async (req, res) => {
    try {
        const { path } = req.params;
        const result = await cloudinaryService.listSubFolders(path);

        res.json(result);
    } catch (error) {
        console.error('❌ Erreur GET /api/cloudinary-explorer/folders/:path:', error);
        res.status(500).json({ success: false, error: 'Erreur serveur' });
    }
});

/**
 * GET /api/cloudinary-explorer/resources
 * Lister les ressources (fichiers)
 */
router.get('/resources', auth.authenticateToken, auth.requireRole('admin'), async (req, res) => {
    try {
        const { folder, type, max_results, next_cursor } = req.query;

        const result = await cloudinaryService.listResources(
            folder || '',
            type || 'image',
            parseInt(max_results) || 50,
            next_cursor || null
        );

        res.json(result);
    } catch (error) {
        console.error('❌ Erreur GET /api/cloudinary-explorer/resources:', error);
        res.status(500).json({ success: false, error: 'Erreur serveur' });
    }
});

/**
 * GET /api/cloudinary-explorer/all-resources
 * Lister toutes les ressources (images + vidéos + raw)
 */
router.get('/all-resources', auth.authenticateToken, auth.requireRole('admin'), async (req, res) => {
    try {
        const { folder, max_results } = req.query;
        const maxRes = parseInt(max_results) || 500; // Augmenté à 500 pour voir plus de fichiers

        // Récupérer les 3 types de ressources en parallèle
        const [images, videos, raw] = await Promise.all([
            cloudinaryService.listResources(folder || '', 'image', maxRes),
            cloudinaryService.listResources(folder || '', 'video', maxRes),
            cloudinaryService.listResources(folder || '', 'raw', maxRes)
        ]);

        // Combiner et trier par date de création
        const allResources = [
            ...(images.resources || []),
            ...(videos.resources || []),
            ...(raw.resources || [])
        ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        res.json({
            success: true,
            resources: allResources,
            counts: {
                images: images.resources?.length || 0,
                videos: videos.resources?.length || 0,
                raw: raw.resources?.length || 0,
                total: allResources.length
            }
        });
    } catch (error) {
        console.error('❌ Erreur GET /api/cloudinary-explorer/all-resources:', error);
        res.status(500).json({ success: false, error: 'Erreur serveur' });
    }
});

/**
 * GET /api/cloudinary-explorer/search
 * Rechercher des ressources
 */
router.get('/search', auth.authenticateToken, auth.requireRole('admin'), async (req, res) => {
    try {
        const { q, max_results } = req.query;

        if (!q) {
            return res.status(400).json({ success: false, error: 'Paramètre de recherche requis' });
        }

        const result = await cloudinaryService.searchResources(q, parseInt(max_results) || 50);

        res.json(result);
    } catch (error) {
        console.error('❌ Erreur GET /api/cloudinary-explorer/search:', error);
        res.status(500).json({ success: false, error: 'Erreur serveur' });
    }
});

/**
 * DELETE /api/cloudinary-explorer/resource/:publicId
 * Supprimer une ressource
 */
router.delete('/resource/:publicId(*)', auth.authenticateToken, auth.requireRole('admin'), async (req, res) => {
    try {
        const { publicId } = req.params;

        const result = await cloudinaryService.deleteFile(publicId);

        if (!result.success) {
            return res.status(500).json(result);
        }

        res.json({ success: true, message: 'Ressource supprimée' });
    } catch (error) {
        console.error('❌ Erreur DELETE /api/cloudinary-explorer/resource:', error);
        res.status(500).json({ success: false, error: 'Erreur serveur' });
    }
});

/**
 * DELETE /api/cloudinary-explorer/folder/:path
 * Supprimer un dossier et son contenu
 */
router.delete('/folder/:path(*)', auth.authenticateToken, auth.requireRole('admin'), async (req, res) => {
    try {
        const { path } = req.params;

        const result = await cloudinaryService.deleteFolder(path);

        if (!result.success) {
            return res.status(500).json(result);
        }

        res.json({ success: true, message: 'Dossier supprimé' });
    } catch (error) {
        console.error('❌ Erreur DELETE /api/cloudinary-explorer/folder:', error);
        res.status(500).json({ success: false, error: 'Erreur serveur' });
    }
});

/**
 * POST /api/cloudinary-explorer/move
 * Déplacer un fichier vers un autre dossier
 */
router.post('/move', auth.authenticateToken, auth.requireRole('admin'), async (req, res) => {
    try {
        const { publicId, targetFolder } = req.body;

        if (!publicId) {
            return res.status(400).json({ success: false, error: 'publicId requis' });
        }

        const result = await cloudinaryService.moveFile(publicId, targetFolder || '');

        if (!result.success) {
            return res.status(500).json(result);
        }

        res.json({ success: true, message: 'Fichier déplacé', newPublicId: result.newPublicId });
    } catch (error) {
        console.error('❌ Erreur POST /api/cloudinary-explorer/move:', error);
        res.status(500).json({ success: false, error: 'Erreur serveur' });
    }
});

/**
 * POST /api/cloudinary-explorer/copy
 * Copier un fichier vers un autre dossier
 */
router.post('/copy', auth.authenticateToken, auth.requireRole('admin'), async (req, res) => {
    try {
        const { publicId, targetFolder } = req.body;

        if (!publicId) {
            return res.status(400).json({ success: false, error: 'publicId requis' });
        }

        const result = await cloudinaryService.copyFile(publicId, targetFolder || '');

        if (!result.success) {
            return res.status(500).json(result);
        }

        res.json({ success: true, message: 'Fichier copié', newPublicId: result.newPublicId });
    } catch (error) {
        console.error('❌ Erreur POST /api/cloudinary-explorer/copy:', error);
        res.status(500).json({ success: false, error: 'Erreur serveur' });
    }
});

/**
 * POST /api/cloudinary-explorer/create-folder
 * Créer un nouveau dossier
 */
router.post('/create-folder', auth.authenticateToken, auth.requireRole('admin'), async (req, res) => {
    try {
        const { folderPath } = req.body;

        if (!folderPath) {
            return res.status(400).json({ success: false, error: 'Chemin du dossier requis' });
        }

        const result = await cloudinaryService.createFolder(folderPath);

        if (!result.success) {
            return res.status(500).json(result);
        }

        res.json({ success: true, message: 'Dossier créé', folder: result.folder });
    } catch (error) {
        console.error('❌ Erreur POST /api/cloudinary-explorer/create-folder:', error);
        res.status(500).json({ success: false, error: 'Erreur serveur' });
    }
});

/**
 * PUT /api/cloudinary-explorer/rename
 * Renommer un fichier
 */
router.put('/rename', auth.authenticateToken, auth.requireRole('admin'), async (req, res) => {
    try {
        const { publicId, newName } = req.body;

        if (!publicId || !newName) {
            return res.status(400).json({ success: false, error: 'publicId et newName requis' });
        }

        const result = await cloudinaryService.renameFile(publicId, newName);

        if (!result.success) {
            return res.status(500).json(result);
        }

        res.json({ success: true, message: 'Fichier renommé', newPublicId: result.newPublicId });
    } catch (error) {
        console.error('❌ Erreur PUT /api/cloudinary-explorer/rename:', error);
        res.status(500).json({ success: false, error: 'Erreur serveur' });
    }
});

module.exports = router;
