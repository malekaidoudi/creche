const db = require('../config/database');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

const userController = {
  // Obtenir le profil utilisateur
  getProfile: async (req, res) => {
    try {
      const userId = req.user.id;
      
      const [users] = await db.execute(
        'SELECT id, first_name, last_name, email, phone, role, profile_image, created_at FROM users WHERE id = ?',
        [userId]
      );

      if (users.length === 0) {
        return res.status(404).json({ error: 'Utilisateur non trouvé' });
      }

      res.json({ user: users[0] });
    } catch (error) {
      console.error('Erreur récupération profil:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  },

  // Mettre à jour le profil utilisateur
  updateProfile: async (req, res) => {
    try {
      const userId = req.user.id;
      const { first_name, last_name, email, phone } = req.body;

      // Vérifier si l'email est déjà utilisé par un autre utilisateur
      if (email) {
        const [existingUsers] = await db.execute(
          'SELECT id FROM users WHERE email = ? AND id != ?',
          [email, userId]
        );

        if (existingUsers.length > 0) {
          return res.status(400).json({ error: 'Cet email est déjà utilisé' });
        }
      }

      // Mettre à jour les informations
      const [result] = await db.execute(
        `UPDATE users 
         SET first_name = ?, last_name = ?, email = ?, phone = ?, updated_at = NOW()
         WHERE id = ?`,
        [first_name, last_name, email, phone, userId]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Utilisateur non trouvé' });
      }

      // Récupérer les données mises à jour
      const [updatedUsers] = await db.execute(
        'SELECT id, first_name, last_name, email, phone, role, profile_image, created_at FROM users WHERE id = ?',
        [userId]
      );

      res.json({ 
        message: 'Profil mis à jour avec succès',
        user: updatedUsers[0] 
      });
    } catch (error) {
      console.error('Erreur mise à jour profil:', error);
      res.status(500).json({ error: 'Erreur lors de la mise à jour' });
    }
  },

  // Changer le mot de passe
  changePassword: async (req, res) => {
    try {
      const userId = req.user.id;
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Mot de passe actuel et nouveau mot de passe requis' });
      }

      // Vérifier le mot de passe actuel
      const [users] = await db.execute(
        'SELECT password FROM users WHERE id = ?',
        [userId]
      );

      if (users.length === 0) {
        return res.status(404).json({ error: 'Utilisateur non trouvé' });
      }

      const isValidPassword = await bcrypt.compare(currentPassword, users[0].password);
      if (!isValidPassword) {
        return res.status(400).json({ error: 'Mot de passe actuel incorrect' });
      }

      // Hasher le nouveau mot de passe
      const saltRounds = 10;
      const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

      // Mettre à jour le mot de passe
      await db.execute(
        'UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?',
        [hashedNewPassword, userId]
      );

      res.json({ message: 'Mot de passe changé avec succès' });
    } catch (error) {
      console.error('Erreur changement mot de passe:', error);
      res.status(500).json({ error: 'Erreur lors du changement de mot de passe' });
    }
  },

  // Lister tous les utilisateurs (admin seulement)
  getAllUsers: async (req, res) => {
    try {
      // Vérifier que l'utilisateur est admin
      if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Accès non autorisé' });
      }

      const [users] = await db.execute(
        `SELECT id, first_name, last_name, email, phone, role, profile_image, is_active, created_at 
         FROM users 
         ORDER BY created_at DESC`
      );

      res.json({ users });
    } catch (error) {
      console.error('Erreur récupération utilisateurs:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  },

  // Obtenir un utilisateur par ID (admin/staff)
  getUserById: async (req, res) => {
    try {
      const { id } = req.params;

      // Vérifier les permissions
      if (req.user.role !== 'admin' && req.user.role !== 'staff' && req.user.id !== parseInt(id)) {
        return res.status(403).json({ error: 'Accès non autorisé' });
      }

      const [users] = await db.execute(
        'SELECT id, first_name, last_name, email, phone, role, profile_image, is_active, created_at FROM users WHERE id = ?',
        [id]
      );

      if (users.length === 0) {
        return res.status(404).json({ error: 'Utilisateur non trouvé' });
      }

      res.json({ user: users[0] });
    } catch (error) {
      console.error('Erreur récupération utilisateur:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  },

  // Désactiver/Activer un utilisateur (admin seulement)
  toggleUserStatus: async (req, res) => {
    try {
      const { id } = req.params;

      // Vérifier que l'utilisateur est admin
      if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Accès non autorisé' });
      }

      // Ne pas permettre de se désactiver soi-même
      if (req.user.id === parseInt(id)) {
        return res.status(400).json({ error: 'Vous ne pouvez pas désactiver votre propre compte' });
      }

      // Basculer le statut
      const [result] = await db.execute(
        'UPDATE users SET is_active = NOT is_active, updated_at = NOW() WHERE id = ?',
        [id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Utilisateur non trouvé' });
      }

      // Récupérer le statut mis à jour
      const [users] = await db.execute(
        'SELECT id, first_name, last_name, is_active FROM users WHERE id = ?',
        [id]
      );

      res.json({ 
        message: `Utilisateur ${users[0].is_active ? 'activé' : 'désactivé'} avec succès`,
        user: users[0]
      });
    } catch (error) {
      console.error('Erreur changement statut utilisateur:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  },

  // Upload photo de profil
  uploadProfileImage: async (req, res) => {
    try {
      const userId = req.user.id;

      if (!req.file) {
        return res.status(400).json({ error: 'Aucun fichier fourni' });
      }

      // Récupérer l'ancienne image de profil pour la supprimer
      const [currentUser] = await db.execute(
        'SELECT profile_image FROM users WHERE id = ?',
        [userId]
      );

      // Supprimer l'ancienne image si elle existe
      if (currentUser.length > 0 && currentUser[0].profile_image) {
        const oldImagePath = path.join(__dirname, '..', currentUser[0].profile_image);
        try {
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
            console.log('✅ Ancienne image supprimée:', oldImagePath);
          }
        } catch (deleteError) {
          console.warn('⚠️ Impossible de supprimer l\'ancienne image:', deleteError.message);
        }
      }

      // Construire le chemin de la nouvelle image
      const imagePath = `/uploads/${req.file.filename}`;

      // Mettre à jour le profil avec la nouvelle image
      const [result] = await db.execute(
        'UPDATE users SET profile_image = ?, updated_at = NOW() WHERE id = ?',
        [imagePath, userId]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Utilisateur non trouvé' });
      }

      // Récupérer les informations mises à jour
      const [users] = await db.execute(
        'SELECT id, first_name, last_name, email, phone, role, profile_image FROM users WHERE id = ?',
        [userId]
      );

      res.json({
        success: true,
        message: 'Photo de profil mise à jour avec succès',
        user: users[0],
        profile_image: imagePath
      });
    } catch (error) {
      console.error('Erreur upload photo profil:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
};

module.exports = userController;
