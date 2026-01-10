const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { authenticateToken } = require('../middleware/auth');

/**
 * Générer une signature pour upload direct vers Cloudinary
 * Cette signature permet au frontend d'uploader directement vers Cloudinary
 * de manière sécurisée sans exposer l'API secret
 */
router.post('/signature', authenticateToken, async (req, res) => {
    try {
        const timestamp = Math.round(new Date().getTime() / 1000);
        const folder = 'activities';

        // Paramètres pour l'upload signé (sans upload_preset pour signed uploads)
        const params = {
            folder: folder,
            timestamp: timestamp
        };

        // Générer la signature
        const signature = generateSignature(params);

        console.log('🔐 Signature Cloudinary générée:', {
            timestamp,
            folder,
            signature: signature.substring(0, 20) + '...'
        });

        res.json({
            success: true,
            signature: signature,
            timestamp: timestamp,
            cloudName: process.env.CLOUDINARY_CLOUD_NAME,
            apiKey: process.env.CLOUDINARY_API_KEY,
            folder: folder
        });
    } catch (error) {
        console.error('❌ Erreur génération signature Cloudinary:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la génération de la signature'
        });
    }
});

/**
 * Générer une signature Cloudinary
 * Note: Cloudinary utilise SHA-1 par défaut, pas SHA-256
 */
function generateSignature(params) {
    // Trier les paramètres par ordre alphabétique
    const sortedParams = Object.keys(params)
        .sort()
        .map(key => `${key}=${params[key]}`)
        .join('&');

    const stringToSign = sortedParams + process.env.CLOUDINARY_API_SECRET;

    console.log('🔑 String to sign:', sortedParams);

    // Créer la signature avec SHA-1 (requis par Cloudinary)
    const signature = crypto
        .createHash('sha1')
        .update(stringToSign)
        .digest('hex');

    return signature;
}

module.exports = router;
