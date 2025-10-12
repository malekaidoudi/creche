const jwt = require('jsonwebtoken');
const db = require('../config/database');

// Middleware pour vérifier le token JWT
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        error: 'Token d\'accès requis' 
      });
    }

    // Vérifier le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Récupérer l'utilisateur depuis la base de données
    const [users] = await db.execute('SELECT * FROM users WHERE id = ? AND is_active = 1', [decoded.userId]);
    
    if (users.length === 0) {
      return res.status(401).json({ 
        error: 'Utilisateur non trouvé ou compte désactivé' 
      });
    }

    const user = users[0];

    // Ajouter l'utilisateur à la requête
    req.user = user;
    next();
  } catch (error) {
    console.error('Erreur authentification:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Token invalide' 
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expiré' 
      });
    }

    console.error('Erreur d\'authentification:', error);
    return res.status(500).json({ 
      error: 'Erreur interne du serveur' 
    });
  }
};

// Middleware pour vérifier les rôles
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentification requise' 
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Accès refusé - Privilèges insuffisants' 
      });
    }

    next();
  };
};

// Middleware pour vérifier si l'utilisateur est admin
const requireAdmin = requireRole('admin');

// Middleware pour vérifier si l'utilisateur est admin ou staff
const requireStaff = requireRole('admin', 'staff');

// Middleware pour vérifier si l'utilisateur peut accéder à ses propres données ou est admin/staff
const requireOwnershipOrStaff = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      error: 'Authentification requise' 
    });
  }

  const userId = parseInt(req.params.id || req.params.userId);
  const isOwner = req.user.id === userId;
  const isStaff = ['admin', 'staff'].includes(req.user.role);

  if (!isOwner && !isStaff) {
    return res.status(403).json({ 
      error: 'Accès refusé - Vous ne pouvez accéder qu\'à vos propres données' 
    });
  }

  next();
};

// Middleware pour vérifier si l'utilisateur peut accéder aux données d'un enfant
const requireChildAccess = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentification requise' 
      });
    }

    const childId = parseInt(req.params.id || req.params.childId);
    
    // Admin et staff ont accès à tous les enfants
    if (['admin', 'staff'].includes(req.user.role)) {
      return next();
    }

    // Pour les parents, vérifier qu'ils ont accès à cet enfant
    if (req.user.role === 'parent') {
      const sql = `
        SELECT COUNT(*) as count FROM enrollments 
        WHERE parent_id = ? AND child_id = ? AND status = 'approved'
      `;
      
      const [result] = await db.execute(sql, [req.user.id, childId]);
      
      if (result[0].count === 0) {
        return res.status(403).json({ 
          error: 'Accès refusé - Vous n\'avez pas accès à cet enfant' 
        });
      }
    }

    next();
  } catch (error) {
    console.error('Erreur de vérification d\'accès enfant:', error);
    return res.status(500).json({ 
      error: 'Erreur interne du serveur' 
    });
  }
};

// Middleware optionnel pour l'authentification (n'échoue pas si pas de token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const [users] = await db.execute('SELECT * FROM users WHERE id = ? AND is_active = 1', [decoded.userId]);
    
    req.user = users.length > 0 ? users[0] : null;
    next();
  } catch (error) {
    // En cas d'erreur, continuer sans utilisateur
    req.user = null;
    next();
  }
};

module.exports = {
  authenticateToken,
  requireRole,
  requireAdmin,
  requireStaff,
  requireOwnershipOrStaff,
  requireChildAccess,
  optionalAuth
};
