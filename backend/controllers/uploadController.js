const db = require('../config/database');
const path = require('path');

const uploadController = {
  // Upload de photo de profil
  uploadProfile: async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Aucun fichier fourni' });
      }

      const userId = req.user.id;
      const file = req.file;
      
      // Construire le chemin relatif pour la DB
      const relativePath = `/media/${path.relative(path.join(__dirname, '../uploads'), file.path).replace(/\\/g, '/')}`;
      
      // Enregistrer dans la table uploads
      const [uploadResult] = await db.execute(
        `INSERT INTO uploads (filename, original_name, mime_type, size, path, uploaded_by, category) 
         VALUES (?, ?, ?, ?, ?, ?, 'profile')`,
        [file.filename, file.originalname, file.mimetype, file.size, relativePath, userId]
      );

      // Mettre à jour le profil utilisateur
      await db.execute(
        'UPDATE users SET profile_image = ? WHERE id = ?',
        [relativePath, userId]
      );

      res.json({
        message: 'Photo de profil uploadée avec succès',
        file: {
          id: uploadResult.insertId,
          filename: file.filename,
          originalName: file.originalname,
          path: relativePath,
          size: file.size
        }
      });
    } catch (error) {
      console.error('Erreur upload profil:', error);
      res.status(500).json({ error: 'Erreur lors de l\'upload' });
    }
  },

  // Upload de document
  uploadDocument: async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Aucun fichier fourni' });
      }

      const userId = req.user.id;
      const file = req.file;
      const { child_id, category = 'document' } = req.body;
      
      // Construire le chemin relatif pour la DB
      const relativePath = `/media/${path.relative(path.join(__dirname, '../uploads'), file.path).replace(/\\/g, '/')}`;
      
      // Enregistrer dans la table uploads
      const [uploadResult] = await db.execute(
        `INSERT INTO uploads (filename, original_name, mime_type, size, path, uploaded_by, child_id, category) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [file.filename, file.originalname, file.mimetype, file.size, relativePath, userId, child_id || null, category]
      );

      res.json({
        message: 'Document uploadé avec succès',
        file: {
          id: uploadResult.insertId,
          filename: file.filename,
          originalName: file.originalname,
          path: relativePath,
          size: file.size,
          category
        }
      });
    } catch (error) {
      console.error('Erreur upload document:', error);
      res.status(500).json({ error: 'Erreur lors de l\'upload' });
    }
  },

  // Lister les fichiers d'un enfant
  getChildFiles: async (req, res) => {
    try {
      const { childId } = req.params;
      
      const [files] = await db.execute(
        `SELECT u.*, CONCAT(us.first_name, ' ', us.last_name) as uploaded_by_name
         FROM uploads u
         LEFT JOIN users us ON u.uploaded_by = us.id
         WHERE u.child_id = ?
         ORDER BY u.created_at DESC`,
        [childId]
      );

      res.json(files);
    } catch (error) {
      console.error('Erreur récupération fichiers:', error);
      res.status(500).json({ error: 'Erreur lors de la récupération des fichiers' });
    }
  },

  // Voir un fichier (affichage dans le navigateur)
  viewFile: async (req, res) => {
    try {
      const { fileId } = req.params;
      
      const [files] = await db.execute(
        'SELECT * FROM uploads WHERE id = ?',
        [fileId]
      );

      if (files.length === 0) {
        return res.status(404).json({ error: 'Fichier non trouvé' });
      }

      const file = files[0];
      const filePath = path.join(__dirname, '..', file.file_path);
      
      // Vérifier que le fichier existe
      const fs = require('fs');
      if (!fs.existsSync(filePath)) {
        console.log('Fichier non trouvé:', filePath);
        return res.status(404).json({ error: 'Fichier physique non trouvé' });
      }

      // Définir les headers pour l'affichage
      res.setHeader('Content-Type', file.mime_type);
      res.setHeader('Content-Disposition', `inline; filename="${file.original_name}"`);
      
      // Envoyer le fichier
      res.sendFile(path.resolve(filePath));
    } catch (error) {
      console.error('Erreur affichage:', error);
      res.status(500).json({ error: 'Erreur lors de l\'affichage' });
    }
  },

  // Télécharger un fichier
  downloadFile: async (req, res) => {
    try {
      const { fileId } = req.params;
      
      const [files] = await db.execute(
        'SELECT * FROM uploads WHERE id = ?',
        [fileId]
      );

      if (files.length === 0) {
        return res.status(404).json({ error: 'Fichier non trouvé' });
      }

      const file = files[0];
      const filePath = path.join(__dirname, '..', file.file_path);
      
      // Vérifier que le fichier existe
      const fs = require('fs');
      if (!fs.existsSync(filePath)) {
        console.log('Fichier non trouvé:', filePath);
        return res.status(404).json({ error: 'Fichier physique non trouvé' });
      }

      // Définir les headers pour le téléchargement
      res.setHeader('Content-Disposition', `attachment; filename="${file.original_name}"`);
      res.setHeader('Content-Type', file.mime_type);
      
      // Envoyer le fichier
      res.sendFile(path.resolve(filePath));
    } catch (error) {
      console.error('Erreur téléchargement:', error);
      res.status(500).json({ error: 'Erreur lors du téléchargement' });
    }
  }
};

module.exports = uploadController;
