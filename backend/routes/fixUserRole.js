const express = require('express');
const router = express.Router();
const db = require('../config/database');
const jwt = require('jsonwebtoken');
const { authenticateToken } = require('../middleware/auth');

// Route pour corriger le rôle utilisateur - ADMIN SEULEMENT
router.post('/fix-admin-role', authenticateToken, async (req, res) => {
  try {
    console.log('🔧 Tentative de correction du rôle admin...');
    console.log('👤 Utilisateur demandeur:', req.user);
    
    const { email } = req.body;
    const targetEmail = email || req.user.email;
    
    console.log('📧 Email cible:', targetEmail);
    
    // Vérifier que l'utilisateur existe
    const [users] = await db.execute(
      'SELECT id, email, role FROM users WHERE email = ?',
      [targetEmail]
    );
    
    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Utilisateur non trouvé'
      });
    }
    
    const user = users[0];
    console.log('👤 Utilisateur trouvé:', user);
    
    // Mettre à jour le rôle
    const [result] = await db.execute(
      'UPDATE users SET role = ? WHERE email = ?',
      ['admin', targetEmail]
    );
    
    console.log('📊 Résultat mise à jour:', result);
    
    if (result.affectedRows > 0) {
      // Récupérer l'utilisateur mis à jour
      const [updatedUsers] = await db.execute(
        'SELECT id, email, first_name, last_name, role FROM users WHERE email = ?',
        [targetEmail]
      );
      
      const updatedUser = updatedUsers[0];
      console.log('✅ Utilisateur mis à jour:', updatedUser);
      
      // Générer un nouveau token JWT avec le nouveau rôle
      const newToken = jwt.sign(
        { 
          id: updatedUser.id, 
          email: updatedUser.email, 
          role: updatedUser.role 
        },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      );
      
      console.log('🔑 Nouveau token généré avec rôle:', updatedUser.role);
      
      res.json({
        success: true,
        message: 'Rôle admin attribué avec succès',
        user: updatedUser,
        token: newToken
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Aucune mise à jour effectuée'
      });
    }
    
  } catch (error) {
    console.error('❌ Erreur correction rôle:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la correction du rôle'
    });
  }
});

// Route pour vérifier le rôle actuel
router.get('/check-role', authenticateToken, async (req, res) => {
  try {
    const [users] = await db.execute(
      'SELECT id, email, first_name, last_name, role FROM users WHERE id = ?',
      [req.user.id]
    );
    
    if (users.length > 0) {
      res.json({
        success: true,
        user: users[0]
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Utilisateur non trouvé'
      });
    }
  } catch (error) {
    console.error('❌ Erreur vérification rôle:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
});

module.exports = router;
