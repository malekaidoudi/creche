const express = require('express');
const router = express.Router();
const documentsController = require('../controllers/documentsController');
const { authenticateToken, requireStaff } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Routes pour la gestion des documents

// Obtenir tous les documents (Admin/Staff seulement)
router.get('/', authenticateToken, requireStaff, documentsController.getAllDocuments);

// Obtenir un document par ID
router.get('/:id', authenticateToken, documentsController.getDocumentById);

// Télécharger un document
router.get('/:id/download', documentsController.downloadDocument);

// Upload d'un nouveau document (Admin/Staff seulement)
router.post('/', 
  authenticateToken, 
  requireStaff, 
  upload.single('document'), 
  documentsController.uploadDocument
);

// Mettre à jour un document (Admin/Staff seulement)
router.put('/:id', authenticateToken, requireStaff, documentsController.updateDocument);

// Supprimer un document (Admin/Staff seulement)
router.delete('/:id', authenticateToken, requireStaff, documentsController.deleteDocument);

module.exports = router;
