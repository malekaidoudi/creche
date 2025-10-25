const express = require('express');
const router = express.Router();
const db = require('../config/database');
const bcrypt = require('bcryptjs');
const { authenticateToken } = require('../middleware/auth');
const upload = require('../middleware/upload');

// PUT /api/profile - Mettre à jour le profil utilisateur (version unifiée)
router.put('/', authenticateToken, async (req, res) => {
  try {
    console.log('🔄 Mise à jour profil utilisateur:', req.user.id);
    console.log('📝 Données reçues:', req.body);

    const userId = req.user.id;
    const { first_name, last_name, email, phone, current_password, new_password } = req.body;

    // Validation de base
    if (!first_name || !last_name || !email) {
      return res.status(400).json({
        success: false,
        error: 'Les champs prénom, nom et email sont requis'
      });
    }

    // Si changement de mot de passe demandé
    if (new_password) {
      if (!current_password) {
        return res.status(400).json({
          success: false,
          error: 'Mot de passe actuel requis pour changer le mot de passe'
        });
      }

      // Vérifier le mot de passe actuel
      const [users] = await db.execute('SELECT password FROM users WHERE id = ?', [userId]);
      if (users.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Utilisateur non trouvé'
        });
      }

      const isCurrentPasswordValid = await bcrypt.compare(current_password, users[0].password);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({
          success: false,
          error: 'Mot de passe actuel incorrect'
        });
      }

      if (new_password.length < 6) {
        return res.status(400).json({
          success: false,
          error: 'Le nouveau mot de passe doit contenir au moins 6 caractères'
        });
      }
    }

    // Vérifier si l'email existe déjà (sauf pour l'utilisateur actuel)
    const [existingUsers] = await db.execute(
      'SELECT id FROM users WHERE email = ? AND id != ?',
      [email, userId]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cet email est déjà utilisé par un autre utilisateur'
      });
    }

    // Préparer les données à mettre à jour
    const updateFields = ['first_name = ?', 'last_name = ?', 'email = ?'];
    const updateValues = [first_name, last_name, email];

    if (phone) {
      updateFields.push('phone = ?');
      updateValues.push(phone);
    }

    // Si changement de mot de passe
    if (new_password) {
      const hashedPassword = await bcrypt.hash(new_password, 10);
      updateFields.push('password = ?');
      updateValues.push(hashedPassword);
    }

    // Ajouter la date de mise à jour
    updateFields.push('updated_at = NOW()');
    updateValues.push(userId);

    // Construire et exécuter la requête
    const sql = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;
    
    console.log('🔍 Requête SQL:', sql);

    const [result] = await db.execute(sql, updateValues);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: 'Utilisateur non trouvé'
      });
    }

    // Récupérer l'utilisateur mis à jour
    const [updatedUsers] = await db.execute('SELECT * FROM users WHERE id = ?', [userId]);
    const updatedUser = updatedUsers[0];

    // Supprimer le mot de passe de la réponse
    delete updatedUser.password;

    console.log('✅ Profil mis à jour avec succès');

    res.json({
      success: true,
      message: 'Profil mis à jour avec succès',
      user: updatedUser
    });

  } catch (error) {
    console.error('❌ Erreur mise à jour profil:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur',
      details: error.message
    });
  }
});

// POST /api/profile/upload - Upload photo de profil
router.post('/upload', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    console.log('📸 Upload photo profil pour utilisateur:', req.user.id);
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Aucun fichier fourni'
      });
    }

    const userId = req.user.id;
    const profileImagePath = `/uploads/profiles/${req.file.filename}`;

    // Mettre à jour la photo de profil dans la base
    await db.execute(
      'UPDATE users SET profile_image = ?, updated_at = NOW() WHERE id = ?',
      [profileImagePath, userId]
    );

    console.log('✅ Photo de profil mise à jour:', profileImagePath);

    res.json({
      success: true,
      message: 'Photo de profil mise à jour avec succès',
      imageUrl: profileImagePath
    });

  } catch (error) {
    console.error('❌ Erreur upload photo profil:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur',
      details: error.message
    });
  }
});

// PUT /api/profile/change-password - Changer le mot de passe
router.put('/change-password', authenticateToken, async (req, res) => {
  try {
    console.log('🔐 Changement de mot de passe pour utilisateur:', req.user.id);
    
    const userId = req.user.id;
    const { currentPassword, newPassword, confirmPassword } = req.body;
    
    // Validation des données
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        error: 'Tous les champs sont requis'
      });
    }
    
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        error: 'Les nouveaux mots de passe ne correspondent pas'
      });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Le nouveau mot de passe doit contenir au moins 6 caractères'
      });
    }
    
    // Récupérer l'utilisateur actuel avec son mot de passe
    const [users] = await db.execute(
      'SELECT id, email, password FROM users WHERE id = ?',
      [userId]
    );
    
    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Utilisateur non trouvé'
      });
    }
    
    const user = users[0];
    
    // Vérifier le mot de passe actuel
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        error: 'Mot de passe actuel incorrect'
      });
    }
    
    // Hacher le nouveau mot de passe
    const saltRounds = 10;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);
    
    // Mettre à jour le mot de passe dans la base de données
    await db.execute(
      'UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?',
      [hashedNewPassword, userId]
    );
    
    console.log('✅ Mot de passe changé avec succès pour utilisateur:', userId);
    
    res.json({
      success: true,
      message: 'Mot de passe changé avec succès'
    });
    
  } catch (error) {
    console.error('❌ Erreur changement mot de passe:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur',
      details: error.message
    });
  }
});

module.exports = router;
