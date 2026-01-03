/**
 * Routes pour la gestion des images de visite virtuelle
 * Les images sont stockées sur Cloudinary pour persistance
 * Fichier JSON local pour mapper les vues aux URLs Cloudinary
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const os = require('os');
const cloudinaryService = require('../services/cloudinaryService');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Dimensions cibles pour les images (ratio 16:9)
const TARGET_WIDTH = 1920;
const TARGET_HEIGHT = 1080;

// Dossier Cloudinary pour les images de visite virtuelle
const CLOUDINARY_FOLDER = 'virtual-tour';

// Fichier JSON pour stocker les URLs des images (persistance locale)
const DATA_DIR = path.join(__dirname, '../data');
const IMAGES_JSON_PATH = path.join(DATA_DIR, 'virtual-tour-images.json');

// Créer le dossier data s'il n'existe pas
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    console.log('📁 Dossier data créé:', DATA_DIR);
}

// Charger les images depuis le fichier JSON
const loadImagesFromJson = () => {
    try {
        if (fs.existsSync(IMAGES_JSON_PATH)) {
            const data = fs.readFileSync(IMAGES_JSON_PATH, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Erreur lecture fichier JSON images:', error);
    }
    return {};
};

// Sauvegarder les images dans le fichier JSON
const saveImagesToJson = (images) => {
    try {
        fs.writeFileSync(IMAGES_JSON_PATH, JSON.stringify(images, null, 2), 'utf8');
        console.log('💾 Images visite virtuelle sauvegardées dans JSON');
    } catch (error) {
        console.error('Erreur sauvegarde fichier JSON images:', error);
    }
};

// Liste des vues disponibles (IDs fixes)
const VALID_VIEWS = ['entrance', 'classroom', 'playground', 'dining', 'nap', 'garden'];

// Configuration Multer pour l'upload (stockage en mémoire)
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
 * Les URLs sont stockées dans un fichier JSON local, les images sur Cloudinary
 */
router.get('/images', (req, res) => {
    try {
        // Charger les images depuis le fichier JSON
        const storedImages = loadImagesFromJson();
        const images = {};

        VALID_VIEWS.forEach(viewId => {
            images[viewId] = storedImages[viewId]?.url || null;
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

        // Charger depuis le fichier JSON
        const storedImages = loadImagesFromJson();
        const imageData = storedImages[viewId];

        res.json({
            success: true,
            viewId,
            image: imageData?.url || null
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
 * L'image est automatiquement redimensionnée au ratio 16:9 (1920x1080) et uploadée sur Cloudinary
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

    // Procéder à l'upload
    upload.single('image')(req, res, async (err) => {
        if (err) {
            console.error('Erreur upload:', err);
            if (err instanceof multer.MulterError) {
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return res.status(400).json({
                        success: false,
                        message: 'Fichier trop volumineux. Maximum 15MB.'
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
            // Créer un fichier temporaire pour sharp
            const tempFilePath = path.join(os.tmpdir(), `virtual-tour-${viewId}-${Date.now()}.jpg`);

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
                .toFile(tempFilePath);

            console.log(`📐 Image redimensionnée: ${viewId} (${TARGET_WIDTH}x${TARGET_HEIGHT})`);

            // Supprimer l'ancienne image de Cloudinary si elle existe
            const storedImages = loadImagesFromJson();
            if (storedImages[viewId]?.publicId) {
                console.log(`🗑️ Suppression ancienne image Cloudinary: ${storedImages[viewId].publicId}`);
                await cloudinaryService.deleteFile(storedImages[viewId].publicId);
            }

            // Uploader vers Cloudinary avec overwrite
            const cloudinaryResult = await cloudinaryService.uploadFileWithOverwrite(
                tempFilePath,
                CLOUDINARY_FOLDER,
                viewId // public_id fixe pour chaque vue
            );

            // Supprimer le fichier temporaire
            if (fs.existsSync(tempFilePath)) {
                fs.unlinkSync(tempFilePath);
            }

            if (!cloudinaryResult.success) {
                return res.status(500).json({
                    success: false,
                    message: 'Erreur lors de l\'upload vers Cloudinary: ' + cloudinaryResult.error
                });
            }

            // Sauvegarder l'URL dans le fichier JSON
            storedImages[viewId] = {
                url: cloudinaryResult.url,
                publicId: cloudinaryResult.publicId,
                uploadedAt: new Date().toISOString()
            };
            saveImagesToJson(storedImages);

            console.log(`✅ Image visite virtuelle uploadée sur Cloudinary: ${viewId} -> ${cloudinaryResult.url}`);

            res.json({
                success: true,
                message: 'Image uploadée et optimisée avec succès sur Cloudinary',
                viewId,
                image: cloudinaryResult.url,
                publicId: cloudinaryResult.publicId,
                dimensions: { width: TARGET_WIDTH, height: TARGET_HEIGHT }
            });
        } catch (error) {
            console.error('Erreur traitement/upload image:', error);
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
 * Supprime de Cloudinary et du fichier JSON local
 */
router.delete('/images/:viewId', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        const { viewId } = req.params;

        if (!VALID_VIEWS.includes(viewId)) {
            return res.status(400).json({
                success: false,
                message: `Vue invalide. Vues disponibles: ${VALID_VIEWS.join(', ')}`
            });
        }

        // Charger les images depuis le fichier JSON
        const storedImages = loadImagesFromJson();
        const imageData = storedImages[viewId];

        if (!imageData) {
            return res.status(404).json({
                success: false,
                message: 'Aucune image trouvée pour cette vue'
            });
        }

        // Supprimer de Cloudinary
        if (imageData.publicId) {
            console.log(`🗑️ Suppression image Cloudinary: ${imageData.publicId}`);
            await cloudinaryService.deleteFile(imageData.publicId);
        }

        // Supprimer du fichier JSON
        delete storedImages[viewId];
        saveImagesToJson(storedImages);

        console.log(`✅ Image visite virtuelle supprimée: ${viewId}`);

        res.json({
            success: true,
            message: 'Image supprimée avec succès de Cloudinary',
            viewId
        });
    } catch (error) {
        console.error('Erreur suppression image:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la suppression de l\'image'
        });
    }
});

module.exports = router;
