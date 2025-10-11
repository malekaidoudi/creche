const db = require('../config/database');
const path = require('path');
const fs = require('fs').promises;

const documentsController = {
  // Obtenir tous les documents
  getAllDocuments: async (req, res) => {
    try {
      const { page = 1, limit = 20, type = 'all' } = req.query;
      const offset = (page - 1) * limit;

      let whereClause = '1=1';
      let params = [];

      // Filtrage par type de document
      if (type !== 'all') {
        whereClause += ' AND document_type = ?';
        params.push(type);
      }

      const query = `
        SELECT 
          d.*,
          u.first_name as uploaded_by_name,
          u.last_name as uploaded_by_lastname
        FROM documents d
        LEFT JOIN users u ON d.uploaded_by = u.id
        WHERE ${whereClause}
        ORDER BY d.created_at DESC
        LIMIT ? OFFSET ?
      `;

      const [documents] = await db.execute(query, [...params, parseInt(limit), offset]);

      // Compter le total pour la pagination
      const countQuery = `SELECT COUNT(*) as total FROM documents WHERE ${whereClause}`;
      const [countResult] = await db.execute(countQuery, params);
      const total = countResult[0].total;

      res.json({
        success: true,
        data: {
          documents,
          total,
          totalPages: Math.ceil(total / limit),
          currentPage: parseInt(page),
          limit: parseInt(limit)
        }
      });
    } catch (error) {
      console.error('Erreur récupération documents:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  },

  // Obtenir un document par ID
  getDocumentById: async (req, res) => {
    try {
      const { id } = req.params;

      const [documents] = await db.execute(`
        SELECT 
          d.*,
          u.first_name as uploaded_by_name,
          u.last_name as uploaded_by_lastname
        FROM documents d
        LEFT JOIN users u ON d.uploaded_by = u.id
        WHERE d.id = ?
      `, [id]);

      if (documents.length === 0) {
        return res.status(404).json({ error: 'Document non trouvé' });
      }

      res.json({
        success: true,
        document: documents[0]
      });
    } catch (error) {
      console.error('Erreur récupération document:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  },

  // Upload d'un nouveau document
  uploadDocument: async (req, res) => {
    try {
      const { title, description, document_type = 'general', is_public = false } = req.body;
      const userId = req.user.id;

      if (!req.file) {
        return res.status(400).json({ error: 'Aucun fichier fourni' });
      }

      // Construire le chemin du fichier
      const filePath = `/uploads/documents/${req.file.filename}`;

      // Insérer en base de données
      const [result] = await db.execute(`
        INSERT INTO documents (
          title, description, document_type, file_path, 
          original_filename, file_size, mime_type, 
          is_public, uploaded_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        title,
        description,
        document_type,
        filePath,
        req.file.originalname,
        req.file.size,
        req.file.mimetype,
        is_public,
        userId
      ]);

      // Récupérer le document créé
      const [newDocument] = await db.execute(`
        SELECT 
          d.*,
          u.first_name as uploaded_by_name,
          u.last_name as uploaded_by_lastname
        FROM documents d
        LEFT JOIN users u ON d.uploaded_by = u.id
        WHERE d.id = ?
      `, [result.insertId]);

      res.status(201).json({
        success: true,
        message: 'Document uploadé avec succès',
        document: newDocument[0]
      });
    } catch (error) {
      console.error('Erreur upload document:', error);
      
      // Supprimer le fichier en cas d'erreur
      if (req.file) {
        try {
          await fs.unlink(req.file.path);
        } catch (unlinkError) {
          console.error('Erreur suppression fichier:', unlinkError);
        }
      }
      
      res.status(500).json({ error: 'Erreur lors de l\'upload' });
    }
  },

  // Mettre à jour un document
  updateDocument: async (req, res) => {
    try {
      const { id } = req.params;
      const { title, description, document_type, is_public } = req.body;

      // Vérifier que le document existe
      const [existingDocs] = await db.execute('SELECT id FROM documents WHERE id = ?', [id]);
      if (existingDocs.length === 0) {
        return res.status(404).json({ error: 'Document non trouvé' });
      }

      // Mettre à jour
      await db.execute(`
        UPDATE documents 
        SET title = ?, description = ?, document_type = ?, is_public = ?, updated_at = NOW()
        WHERE id = ?
      `, [title, description, document_type, is_public, id]);

      // Récupérer le document mis à jour
      const [updatedDoc] = await db.execute(`
        SELECT 
          d.*,
          u.first_name as uploaded_by_name,
          u.last_name as uploaded_by_lastname
        FROM documents d
        LEFT JOIN users u ON d.uploaded_by = u.id
        WHERE d.id = ?
      `, [id]);

      res.json({
        success: true,
        message: 'Document mis à jour avec succès',
        document: updatedDoc[0]
      });
    } catch (error) {
      console.error('Erreur mise à jour document:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  },

  // Supprimer un document
  deleteDocument: async (req, res) => {
    try {
      const { id } = req.params;

      // Récupérer le document pour obtenir le chemin du fichier
      const [documents] = await db.execute('SELECT file_path FROM documents WHERE id = ?', [id]);
      
      if (documents.length === 0) {
        return res.status(404).json({ error: 'Document non trouvé' });
      }

      const document = documents[0];

      // Supprimer le fichier
      if (document.file_path) {
        const fullPath = path.join(__dirname, '..', document.file_path);
        try {
          await fs.unlink(fullPath);
        } catch (error) {
          console.log('Fichier déjà supprimé ou introuvable:', error.message);
        }
      }

      // Supprimer de la base de données
      await db.execute('DELETE FROM documents WHERE id = ?', [id]);

      res.json({
        success: true,
        message: 'Document supprimé avec succès'
      });
    } catch (error) {
      console.error('Erreur suppression document:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  },

  // Télécharger un document
  downloadDocument: async (req, res) => {
    try {
      const { id } = req.params;

      // Récupérer le document
      const [documents] = await db.execute(`
        SELECT file_path, original_filename, mime_type, is_public 
        FROM documents 
        WHERE id = ?
      `, [id]);

      if (documents.length === 0) {
        return res.status(404).json({ error: 'Document non trouvé' });
      }

      const document = documents[0];

      // Vérifier les permissions (si le document n'est pas public)
      if (!document.is_public && (!req.user || (req.user.role !== 'admin' && req.user.role !== 'staff'))) {
        return res.status(403).json({ error: 'Accès non autorisé' });
      }

      const fullPath = path.join(__dirname, '..', document.file_path);
      
      // Vérifier que le fichier existe
      try {
        await fs.access(fullPath);
      } catch (error) {
        return res.status(404).json({ error: 'Fichier non trouvé' });
      }

      // Définir les en-têtes pour le téléchargement
      res.setHeader('Content-Disposition', `attachment; filename="${document.original_filename}"`);
      res.setHeader('Content-Type', document.mime_type);

      // Envoyer le fichier
      res.sendFile(fullPath);
    } catch (error) {
      console.error('Erreur téléchargement document:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
};

module.exports = documentsController;
