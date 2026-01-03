/**
 * Routes pour la gestion des images de visite virtuelle
 * Les images sont stockées dans le dossier uploads/virtual-tour/
 * Une seule image par vue (remplacement automatique)
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Dimensions cibles pour les images (ratio 16:9)
const TARGET_WIDTH = 1920;
const TARGET_HEIGHT = 1080;

// Dossier de stockage des images de visite virtuelle
const UPLOAD_DIR = path.join(__dirname, '../uploads/virtual-tour');

// Créer le dossier s'il n'existe pas
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    console.log('📁 Dossier virtual-tour créé:', UPLOAD_DIR);
}

// Liste des vues disponibles (IDs fixes)
const VALID_VIEWS = ['entrance', 'classroom', 'playground', 'dining', 'nap', 'garden'];

// Configuration Multer pour l'upload
// Stockage temporaire en mémoire pour traitement avec sharp
const storage = multer.memoryStorage();

// Filtre pour n'accepter que les images
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Type de fichier non autorisé. Utilisez JPG, PNG ou WebP.'), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 15 * 1024 * 1024 // 15MB max (sera optimisé après upload)
    }
});

/**
 * GET /api/virtual-tour/images
 * Récupérer la liste des images disponibles pour chaque vue
 */
router.get('/images', (req, res) => {
    try {
        const images = {};

        VALID_VIEWS.forEach(viewId => {
            // Chercher une image existante pour cette vue
            const extensions = ['.jpg', '.jpeg', '.png', '.webp'];
            let foundImage = null;

            for (const ext of extensions) {
                const filePath = path.join(UPLOAD_DIR, `${viewId}${ext}`);
                if (fs.existsSync(filePath)) {
                    foundImage = `/uploads/virtual-tour/${viewId}${ext}`;
                    break;
                }
            }

            images[viewId] = foundImage;
        });

        res.json({
            success: true,
            images,
            views: VALID_VIEWS
        });
    } catch (error) {
        console.error('Erreur récupération images visite virtuelle:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des images'
        });
    }
});

/**
 * GET /api/virtual-tour/images/:viewId
 * Récupérer l'image d'une vue spécifique
 */
router.get('/images/:viewId', (req, res) => {
    try {
        const { viewId } = req.params;

        if (!VALID_VIEWS.includes(viewId)) {
            return res.status(400).json({
                success: false,
                message: `Vue invalide. Vues disponibles: ${VALID_VIEWS.join(', ')}`
            });
        }

        // Chercher l'image existante
        const extensions = ['.jpg', '.jpeg', '.png', '.webp'];
        let foundImage = null;

        for (const ext of extensions) {
            const filePath = path.join(UPLOAD_DIR, `${viewId}${ext}`);
            if (fs.existsSync(filePath)) {
                foundImage = `/uploads/virtual-tour/${viewId}${ext}`;
                break;
            }
        }

        res.json({
            success: true,
            viewId,
            image: foundImage
        });
    } catch (error) {
        console.error('Erreur récupération image:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération de l\'image'
        });
    }
});

/**
 * POST /api/virtual-tour/images/:viewId
 * Uploader/Remplacer l'image d'une vue (Admin seulement)
 * L'image est automatiquement redimensionnée au ratio 16:9 (1920x1080) sans perte de qualité
 */
router.post('/images/:viewId', authenticateToken, requireRole('admin'), (req, res) => {
    const { viewId } = req.params;

    // Valider l'ID de la vue
    if (!VALID_VIEWS.includes(viewId)) {
        return res.status(400).json({
            success: false,
            message: `Vue invalide. Vues disponibles: ${VALID_VIEWS.join(', ')}`
        });
    }

    // Supprimer l'ancienne image avant l'upload
    const extensions = ['.jpg', '.jpeg', '.png', '.webp'];
    extensions.forEach(ext => {
        const oldFilePath = path.join(UPLOAD_DIR, `${viewId}${ext}`);
        if (fs.existsSync(oldFilePath)) {
            fs.unlinkSync(oldFilePath);
            console.log(`🗑️ Ancienne image supprimée: ${oldFilePath}`);
        }
    });

    // Procéder à l'upload
    upload.single('image')(req, res, async (err) => {
        if (err) {
            console.error('Erreur upload:', err);
            if (err instanceof multer.MulterError) {
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return res.status(400).json({
                        success: false,
                        message: 'Fichier trop volumineux. Maximum 10MB.'
                    });
                }
            }
            return res.status(400).json({
                success: false,
                message: err.message || 'Erreur lors de l\'upload'
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Aucun fichier fourni'
            });
        }

        try {
            // Nom du fichier de sortie (toujours en .jpg pour optimisation)
            const outputFilename = `${viewId}.jpg`;
            const outputPath = path.join(UPLOAD_DIR, outputFilename);

            // Redimensionner l'image avec sharp
            // - Ratio 16:9 (1920x1080)
            // - Qualité haute (90%)
            // - Cover: remplit le cadre en centrant l'image
            await sharp(req.file.buffer)
                .resize(TARGET_WIDTH, TARGET_HEIGHT, {
                    fit: 'cover',      // Remplit le cadre sans déformation
                    position: 'center' // Centre l'image
                })
                .jpeg({
                    quality: 90,       // Haute qualité
                    mozjpeg: true      // Optimisation supplémentaire
                })
                .toFile(outputPath);

            const imageUrl = `/uploads/virtual-tour/${outputFilename}`;

            console.log(`✅ Image visite virtuelle uploadée et redimensionnée: ${viewId} -> ${outputFilename} (${TARGET_WIDTH}x${TARGET_HEIGHT})`);

            res.json({
                success: true,
                message: 'Image uploadée et optimisée avec succès',
                viewId,
                image: imageUrl,
                filename: outputFilename,
                dimensions: { width: TARGET_WIDTH, height: TARGET_HEIGHT }
            });
        } catch (sharpError) {
            console.error('Erreur traitement image:', sharpError);
            return res.status(500).json({
                success: false,
                message: 'Erreur lors du traitement de l\'image'
            });
        }
    });
});

/**
 * DELETE /api/virtual-tour/images/:viewId
 * Supprimer l'image d'une vue (Admin seulement)
 */
router.delete('/images/:viewId', authenticateToken, requireRole('admin'), (req, res) => {
    try {
        const { viewId } = req.params;

        if (!VALID_VIEWS.includes(viewId)) {
            return res.status(400).json({
                success: false,
                message: `Vue invalide. Vues disponibles: ${VALID_VIEWS.join(', ')}`
            });
        }

        // Supprimer toutes les versions de l'image
        const extensions = ['.jpg', '.jpeg', '.png', '.webp'];
        let deleted = false;

        extensions.forEach(ext => {
            const filePath = path.join(UPLOAD_DIR, `${viewId}${ext}`);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                deleted = true;
                console.log(`🗑️ Image supprimée: ${filePath}`);
            }
        });

        if (deleted) {
            res.json({
                success: true,
                message: 'Image supprimée avec succès',
                viewId
            });
        } else {
            res.status(404).json({
                success: false,
                message: 'Aucune image trouvée pour cette vue'
            });
        }
    } catch (error) {
        console.error('Erreur suppression image:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la suppression de l\'image'
        });
    }
});

module.exports = router;
