const jwt = require('jsonwebtoken');
const db = require('../config/db_postgres');
const logger = require('../utils/logger');

const auth = {

  // Middleware d'authentification JWT
  authenticateToken: (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Token d\'accès requis',
        code: 'NO_TOKEN'
      });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        logger.security('TOKEN_VERIFICATION_FAILED', { error: err.message });
        return res.status(403).json({
          success: false,
          error: 'Token invalide ou expiré',
          code: 'INVALID_TOKEN'
        });
      }

      // Log sensible uniquement en dev
      logger.sensitive('🔐 Token décodé - user:', { id: user.id, role: user.role });

      // 🔧 Normaliser userId → id pour compatibilité
      if (user.userId && !user.id) {
        user.id = user.userId;
      }

      req.user = user;
      next();
    });
  },

  // Middleware de vérification des rôles
  requireRole: (...allowedRoles) => {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentification requise',
          code: 'NOT_AUTHENTICATED'
        });
      }

      if (!allowedRoles.includes(req.user.role)) {
        logger.security('ACCESS_DENIED', {
          userId: req.user.id,
          role: req.user.role,
          requiredRoles: allowedRoles
        });
        return res.status(403).json({
          success: false,
          error: 'Privilèges insuffisants',
          required_roles: allowedRoles,
          user_role: req.user.role,
          code: 'INSUFFICIENT_PRIVILEGES'
        });
      }

      next();
    };
  },

  // Middleware pour vérifier la propriété d'une ressource OU staff/admin
  requireOwnershipOrStaff: (resourceType) => {
    return async (req, res, next) => {
      try {
        const userId = req.user.id;
        const userRole = req.user.role;

        // Admin et staff ont accès à tout
        if (['admin', 'staff'].includes(userRole)) {
          return next();
        }

        // Pour les parents, vérifier la propriété selon le type de ressource
        if (userRole === 'parent') {
          let hasAccess = false;

          switch (resourceType) {
            case 'enrollment':
              // Vérifier si l'enrollment appartient au parent
              const enrollmentId = req.params.id;
              const enrollmentCheck = await db.query(`
                SELECT 1 FROM enrollments 
                WHERE id = $1 AND (
                  parent_id = $2 OR 
                  applicant_email = (SELECT email FROM users WHERE id = $2)
                )
              `, [enrollmentId, userId]);
              hasAccess = enrollmentCheck.rows.length > 0;
              break;

            case 'child':
              // Vérifier si l'enfant appartient au parent via enrollment
              const childId = req.params.id || req.params.childId;
              const childCheck = await db.query(`
                SELECT 1 FROM enrollments e
                JOIN users u ON e.parent_id = u.id
                WHERE e.child_id = $1 AND u.id = $2 AND e.status = 'approved'
              `, [childId, userId]);
              hasAccess = childCheck.rows.length > 0;
              break;

            case 'attendance':
              // Vérifier si la présence concerne un enfant du parent
              const attendanceChildId = req.params.childId || req.body.child_id;
              const attendanceCheck = await db.query(`
                SELECT 1 FROM enrollments e
                JOIN users u ON e.parent_id = u.id
                WHERE e.child_id = $1 AND u.id = $2 AND e.status = 'approved'
              `, [attendanceChildId, userId]);
              hasAccess = attendanceCheck.rows.length > 0;
              break;

            default:
              hasAccess = false;
          }

          if (hasAccess) {
            return next();
          }
        }

        return res.status(403).json({
          success: false,
          error: 'Accès refusé - Ressource non autorisée',
          resource_type: resourceType,
          user_role: userRole,
          code: 'RESOURCE_ACCESS_DENIED'
        });

      } catch (error) {
        logger.error('❌ Erreur vérification propriété:', error.message);
        return res.status(500).json({
          success: false,
          error: 'Erreur lors de la vérification des permissions'
        });
      }
    };
  },

  // Middleware pour vérifier l'accès aux documents
  requireDocumentAccess: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const userRole = req.user.role;
      const documentId = req.params.docId || req.params.id;

      // Admin et staff ont accès à tous les documents
      if (['admin', 'staff'].includes(userRole)) {
        return next();
      }

      // Pour les parents, vérifier l'accès selon le type de document
      if (userRole === 'parent') {
        // Vérifier accès aux documents d'enrollment
        const enrollmentDocCheck = await db.query(`
          SELECT 1 FROM enrollment_documents ed
          JOIN enrollments e ON ed.enrollment_id = e.id
          WHERE ed.id = $1 AND (
            e.parent_id = $2 OR 
            e.applicant_email = (SELECT email FROM users WHERE id = $2)
          )
        `, [documentId, userId]);

        if (enrollmentDocCheck.rows.length > 0) {
          return next();
        }

        // Vérifier accès aux documents d'enfant
        const childDocCheck = await db.query(`
          SELECT 1 FROM children_documents cd
          JOIN enrollments e ON cd.child_id = e.child_id
          WHERE cd.id = $1 AND e.parent_id = $2 AND e.status = 'approved'
        `, [documentId, userId]);

        if (childDocCheck.rows.length > 0) {
          return next();
        }
      }

      return res.status(403).json({
        success: false,
        error: 'Accès refusé - Document non autorisé',
        code: 'DOCUMENT_ACCESS_DENIED'
      });

    } catch (error) {
      logger.error('❌ Erreur vérification accès document:', error.message);
      return res.status(500).json({
        success: false,
        error: 'Erreur lors de la vérification des permissions'
      });
    }
  },

  // Middleware pour les endpoints publics avec limitation
  rateLimitPublic: (maxRequests = 10, windowMs = 15 * 60 * 1000) => {
    const requests = new Map();

    return (req, res, next) => {
      const ip = req.ip || req.connection.remoteAddress;
      const now = Date.now();

      // Nettoyer les anciennes entrées
      for (const [key, data] of requests.entries()) {
        if (now - data.firstRequest > windowMs) {
          requests.delete(key);
        }
      }

      const userRequests = requests.get(ip);

      if (!userRequests) {
        requests.set(ip, { count: 1, firstRequest: now });
        return next();
      }

      if (userRequests.count >= maxRequests) {
        return res.status(429).json({
          success: false,
          error: 'Trop de requêtes - Veuillez patienter',
          retry_after: Math.ceil((userRequests.firstRequest + windowMs - now) / 1000),
          code: 'RATE_LIMIT_EXCEEDED'
        });
      }

      userRequests.count++;
      next();
    };
  }
};

// Middlewares prédéfinis pour faciliter l'utilisation
auth.requireAdmin = auth.requireRole('admin');
auth.requireStaff = auth.requireRole('admin', 'staff');
auth.requireParent = auth.requireRole('admin', 'staff', 'parent');

// Middlewares de propriété spécialisés
auth.requireEnrollmentAccess = auth.requireOwnershipOrStaff('enrollment');
auth.requireChildAccess = auth.requireOwnershipOrStaff('child');
auth.requireAttendanceAccess = auth.requireOwnershipOrStaff('attendance');

module.exports = auth;
