const jwt = require('jsonwebtoken');
const db = require('../config/db_postgres');
const logger = require('../utils/logger');
const permissionsService = require('../services/permissionsService');
const tokenBlacklistService = require('../services/tokenBlacklistService');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

const auth = {

  // Middleware de vérification d'une permission granulaire.
  // Toute la logique (y compris le fait qu'un admin/developer possède
  // implicitement toutes les permissions) vit dans permissionsService :
  // ce middleware ne fait que lui déléguer la décision, il ne connaît pas
  // les rôles lui-même.
  requirePermission: (permissionCode) => {
    return async (req, res, next) => {
      try {
        if (!req.user) {
          return res.status(401).json({
            success: false,
            error: 'Authentification requise',
            code: 'NOT_AUTHENTICATED'
          });
        }

        const userId = req.user.id || req.user.userId;
        const hasAccess = await permissionsService.userHasPermission(userId, permissionCode, req.user.role);

        if (!hasAccess) {
          logger.security('PERMISSION_DENIED', {
            userId,
            role: req.user.role,
            requiredPermission: permissionCode
          });
          return res.status(403).json({
            success: false,
            error: 'Accès non autorisé pour cette fonctionnalité',
            required_permission: permissionCode,
            code: 'PERMISSION_DENIED'
          });
        }

        next();
      } catch (error) {
        logger.error('❌ Erreur vérification permission:', error.message);
        res.status(500).json({
          success: false,
          error: 'Erreur lors de la vérification des permissions'
        });
      }
    };
  },

  // Middleware d'authentification JWT
  authenticateToken: async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Token d\'accès requis',
        code: 'NO_TOKEN'
      });
    }

    // Vérification de révocation (déconnexion côté serveur)
    try {
      const isRevoked = await tokenBlacklistService.isTokenRevoked(token);
      if (isRevoked) {
        logger.security('REVOKED_TOKEN_USED', { ip: req.ip });
        return res.status(401).json({
          success: false,
          error: 'Session terminée. Veuillez vous reconnecter.',
          code: 'TOKEN_REVOKED'
        });
      }
    } catch (blacklistErr) {
      logger.error('Erreur vérification blacklist token:', blacklistErr.message);
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) {
        logger.security('TOKEN_VERIFICATION_FAILED', { error: err.message });
        return res.status(403).json({
          success: false,
          error: 'Token invalide ou expiré',
          code: 'INVALID_TOKEN'
        });
      }

      // 🔧 Normaliser userId → id pour compatibilité
      if (user.userId && !user.id) {
        user.id = user.userId;
      }
      // Aussi normaliser dans l'autre sens
      if (user.id && !user.userId) {
        user.userId = user.id;
      }

      // Log sensible uniquement en dev (après normalisation)
      logger.sensitive('🔐 Token décodé - user:', { id: user.id, userId: user.userId, role: user.role });

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

      // Le rôle developer a automatiquement les mêmes accès que admin
      const effectiveRole = req.user.role === 'developer' ? 'admin' : req.user.role;
      const hasAccess = allowedRoles.includes(req.user.role) || allowedRoles.includes(effectiveRole);

      if (!hasAccess) {
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

        // Admin, developer et staff ont accès à tout
        if (['admin', 'developer', 'staff'].includes(userRole)) {
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
              // Vérifier si l'enfant appartient au parent.
              // On croise les 3 sources possibles de la relation parent-enfant
              // (children.parent_id est la source canonique, les autres sont
              // des relais historiques/complémentaires) pour éviter les faux
              // négatifs si l'une des tables n'a pas été synchronisée.
              const childId = req.params.id || req.params.childId;
              const childCheck = await db.query(`
                SELECT 1 FROM children c
                WHERE c.id = $1 AND (
                  c.parent_id = $2
                  OR EXISTS (
                    SELECT 1 FROM parent_children pc
                    WHERE pc.child_id = c.id AND pc.parent_id = $2
                  )
                  OR EXISTS (
                    SELECT 1 FROM enrollments e
                    WHERE e.child_id = c.id AND e.parent_id = $2 AND e.status = 'approved'
                  )
                )
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

      // Admin, developer et staff ont accès à tous les documents
      if (['admin', 'developer', 'staff'].includes(userRole)) {
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
auth.requireAdmin = auth.requireRole('admin', 'developer');
auth.requireDeveloper = auth.requireRole('developer');
auth.requireStaff = auth.requireRole('admin', 'developer', 'staff');
auth.requireParent = auth.requireRole('admin', 'developer', 'staff', 'parent');

// Middlewares de propriété spécialisés
auth.requireEnrollmentAccess = auth.requireOwnershipOrStaff('enrollment');
auth.requireChildAccess = auth.requireOwnershipOrStaff('child');
auth.requireAttendanceAccess = auth.requireOwnershipOrStaff('attendance');

module.exports = auth;
