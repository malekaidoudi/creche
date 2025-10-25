const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const uploadController = require('../controllers/uploadController');
const { authenticateToken } = require('../middleware/auth');

// Upload photo de profil
router.post('/profile', authenticateToken, upload.single('profile'), uploadController.uploadProfile);

// Upload document
router.post('/document', authenticateToken, upload.single('document'), uploadController.uploadDocument);

// Lister les fichiers d'un enfant
router.get('/child/:childId', authenticateToken, uploadController.getChildFiles);

// Voir un fichier (affichage dans le navigateur)
router.get('/view/:fileId', authenticateToken, uploadController.viewFile);

// Télécharger un fichier
router.get('/download/:fileId', authenticateToken, uploadController.downloadFile);

module.exports = router;
