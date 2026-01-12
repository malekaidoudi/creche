/**
 * Middleware de logging automatique des activités
 * Crèche Mima El Ghalia
 * 
 * Ce middleware intercepte les requêtes et enregistre automatiquement
 * les activités importantes dans le journal.
 */

const activityLogService = require('../services/activityLogService');

const { CATEGORIES, SEVERITY, ACTIONS } = activityLogService;

/**
 * Configuration des routes à logger automatiquement
 */
const ROUTE_CONFIG = {
    // Authentification
    'POST /api/auth/login': {
        action: 'login_attempt',
        category: CATEGORIES.AUTH,
        getTitle: (req, res) => res.statusCode === 200 ? 'Connexion réussie' : 'Échec de connexion',
        getSeverity: (req, res) => res.statusCode === 200 ? SEVERITY.INFO : SEVERITY.WARNING
    },
    'POST /api/auth/logout': {
        action: 'logout',
        category: CATEGORIES.AUTH,
        title: 'Déconnexion',
        severity: SEVERITY.DEBUG
    },
    'POST /api/auth/register': {
        action: 'account_created',
        category: CATEGORIES.ACCOUNT,
        title: 'Nouveau compte créé',
        severity: SEVERITY.INFO
    },
    'POST /api/auth/forgot-password': {
        action: 'password_reset_requested',
        category: CATEGORIES.AUTH,
        title: 'Réinitialisation mot de passe demandée',
        severity: SEVERITY.INFO
    },
    'POST /api/auth/reset-password': {
        action: 'password_reset',
        category: CATEGORIES.AUTH,
        title: 'Mot de passe réinitialisé',
        severity: SEVERITY.INFO
    },

    // Inscriptions
    'POST /api/enrollments': {
        action: 'enrollment_created',
        category: CATEGORIES.ENROLLMENT,
        title: 'Nouvelle inscription',
        severity: SEVERITY.INFO,
        getTargetInfo: (req) => ({
            targetType: 'enrollment',
            targetName: `${req.body.child_first_name} ${req.body.child_last_name}`
        })
    },
    'PUT /api/enrollments/:id/approve': {
        action: 'enrollment_approved',
        category: CATEGORIES.ENROLLMENT,
        title: 'Inscription validée',
        severity: SEVERITY.INFO,
        getTargetInfo: (req) => ({
            targetType: 'enrollment',
            targetId: parseInt(req.params.id)
        })
    },
    'PUT /api/enrollments/:id/reject': {
        action: 'enrollment_rejected',
        category: CATEGORIES.ENROLLMENT,
        title: 'Inscription refusée',
        severity: SEVERITY.WARNING,
        getTargetInfo: (req) => ({
            targetType: 'enrollment',
            targetId: parseInt(req.params.id)
        })
    },
    'DELETE /api/enrollments/:id': {
        action: 'enrollment_deleted',
        category: CATEGORIES.ENROLLMENT,
        title: 'Inscription supprimée',
        severity: SEVERITY.WARNING,
        getTargetInfo: (req) => ({
            targetType: 'enrollment',
            targetId: parseInt(req.params.id)
        })
    },

    // Présences
    'POST /api/attendance': {
        action: 'attendance_recorded',
        category: CATEGORIES.ATTENDANCE,
        title: 'Présence enregistrée',
        severity: SEVERITY.INFO
    },
    'PUT /api/attendance/:id': {
        action: 'attendance_updated',
        category: CATEGORIES.ATTENDANCE,
        title: 'Présence modifiée',
        severity: SEVERITY.INFO
    },

    // Documents
    'POST /api/documents': {
        action: 'document_uploaded',
        category: CATEGORIES.DOCUMENT,
        title: 'Document téléversé',
        severity: SEVERITY.INFO
    },
    'DELETE /api/documents/:id': {
        action: 'document_deleted',
        category: CATEGORIES.DOCUMENT,
        title: 'Document supprimé',
        severity: SEVERITY.WARNING
    },

    // Utilisateurs
    'POST /api/users': {
        action: 'user_created',
        category: CATEGORIES.ACCOUNT,
        title: 'Utilisateur créé',
        severity: SEVERITY.INFO
    },
    'PUT /api/users/:id': {
        action: 'user_updated',
        category: CATEGORIES.ACCOUNT,
        title: 'Utilisateur modifié',
        severity: SEVERITY.INFO
    },
    'DELETE /api/users/:id': {
        action: 'user_deleted',
        category: CATEGORIES.ACCOUNT,
        title: 'Utilisateur supprimé',
        severity: SEVERITY.WARNING
    },

    // Enfants
    'POST /api/children': {
        action: 'child_created',
        category: CATEGORIES.CHILD,
        title: 'Enfant ajouté',
        severity: SEVERITY.INFO
    },
    'PUT /api/children/:id': {
        action: 'child_updated',
        category: CATEGORIES.CHILD,
        title: 'Informations enfant modifiées',
        severity: SEVERITY.INFO
    },
    'DELETE /api/children/:id': {
        action: 'child_deleted',
        category: CATEGORIES.CHILD,
        title: 'Enfant supprimé',
        severity: SEVERITY.WARNING
    },

    // Contacts
    'POST /api/contacts': {
        action: 'contact_received',
        category: CATEGORIES.CONTACT,
        title: 'Message de contact reçu',
        severity: SEVERITY.INFO
    }
};

/**
 * Routes à exclure du logging
 */
const EXCLUDED_ROUTES = [
    'GET /api/health',
    'GET /api/activity-logs',
    'GET /api/notifications',
    'OPTIONS'
];

/**
 * Middleware principal de logging
 */
const activityLogger = (options = {}) => {
    const {
        logAllRequests = false,
        logErrors = true,
        excludeRoutes = []
    } = options;

    return async (req, res, next) => {
        // Sauvegarder le temps de début
        const startTime = Date.now();

        // Capturer la réponse originale
        const originalSend = res.send;
        let responseBody;

        res.send = function (body) {
            responseBody = body;
            return originalSend.call(this, body);
        };

        // Continuer le traitement
        res.on('finish', async () => {
            try {
                const routeKey = `${req.method} ${req.route?.path || req.path}`;
                const genericRouteKey = routeKey.replace(/\/\d+/g, '/:id');

                // Vérifier si la route est exclue
                const isExcluded = EXCLUDED_ROUTES.some(r =>
                    routeKey.startsWith(r) || genericRouteKey.startsWith(r)
                ) || excludeRoutes.some(r => routeKey.includes(r));

                if (isExcluded && !logAllRequests) {
                    return;
                }

                // Exclure les actions du rôle developer (compte invisible)
                if (req.user?.role === 'developer') {
                    return;
                }

                // Chercher la configuration de la route
                const config = ROUTE_CONFIG[genericRouteKey] || ROUTE_CONFIG[routeKey];

                // Logger uniquement si configuré ou si c'est une erreur
                if (!config && !logAllRequests && !(logErrors && res.statusCode >= 400)) {
                    return;
                }

                // Construire les données du log
                const logData = {
                    action: config?.action || `${req.method.toLowerCase()}_${req.path.replace(/\//g, '_')}`,
                    category: config?.category || CATEGORIES.OTHER,
                    severity: config?.getSeverity ? config.getSeverity(req, res) : (config?.severity || SEVERITY.INFO),
                    title: config?.getTitle ? config.getTitle(req, res) : (config?.title || `${req.method} ${req.path}`),
                    description: config?.getDescription ? config.getDescription(req, res) : null,
                    userId: req.user?.id || req.user?.userId,
                    userEmail: req.user?.email,
                    userName: req.user ? `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() : null,
                    userRole: req.user?.role,
                    ipAddress: req.ip || req.connection?.remoteAddress,
                    userAgent: req.get('User-Agent'),
                    requestPath: req.originalUrl || req.path,
                    requestMethod: req.method,
                    responseStatus: res.statusCode,
                    metadata: {
                        duration: Date.now() - startTime,
                        query: Object.keys(req.query).length > 0 ? req.query : undefined,
                        params: Object.keys(req.params).length > 0 ? req.params : undefined
                    }
                };

                // Ajouter les informations de cible si disponibles
                if (config?.getTargetInfo) {
                    const targetInfo = config.getTargetInfo(req);
                    Object.assign(logData, targetInfo);
                }

                // Logger les erreurs avec plus de détails
                if (res.statusCode >= 400) {
                    logData.severity = res.statusCode >= 500 ? SEVERITY.CRITICAL : SEVERITY.WARNING;
                    logData.metadata.error = true;
                    logData.metadata.statusCode = res.statusCode;

                    // Essayer de parser le body de réponse pour l'erreur
                    try {
                        const parsedBody = typeof responseBody === 'string' ? JSON.parse(responseBody) : responseBody;
                        if (parsedBody?.error) {
                            logData.description = parsedBody.error;
                        }
                    } catch (e) {
                        // Ignorer les erreurs de parsing
                    }
                }

                // Créer le log de manière asynchrone (ne pas bloquer la réponse)
                activityLogService.create(logData).catch(err => {
                    console.error('❌ Erreur logging activité:', err.message);
                });

            } catch (error) {
                console.error('❌ Erreur middleware activityLogger:', error);
            }
        });

        next();
    };
};

/**
 * Helper pour logger une action spécifique
 */
const logActivity = async (actionKey, params = {}) => {
    return activityLogService.logAction(actionKey, params);
};

/**
 * Helper pour logger une connexion réussie
 */
const logLoginSuccess = async (user, req) => {
    const firstName = user.firstName || user.first_name || '';
    const lastName = user.lastName || user.last_name || '';
    const fullName = `${firstName} ${lastName}`.trim() || user.email;

    return activityLogService.create({
        action: 'login_success',
        category: CATEGORIES.AUTH,
        severity: SEVERITY.INFO,
        title: 'Connexion réussie',
        description: `${fullName} s'est connecté(e)`,
        userId: user.id,
        userEmail: user.email,
        userName: fullName,
        userRole: user.role,
        ipAddress: req?.ip,
        userAgent: req?.get('User-Agent'),
        metadata: { loginMethod: 'email' }
    });
};

/**
 * Helper pour logger un échec de connexion
 */
const logLoginFailed = async (email, reason, req) => {
    return activityLogService.create({
        action: 'login_failed',
        category: CATEGORIES.AUTH,
        severity: SEVERITY.WARNING,
        title: 'Échec de connexion',
        description: `Tentative de connexion échouée pour ${email}: ${reason}`,
        userEmail: email,
        ipAddress: req?.ip,
        userAgent: req?.get('User-Agent'),
        metadata: { reason, email }
    });
};

/**
 * Helper pour logger une erreur système
 */
const logSystemError = async (error, context = {}) => {
    return activityLogService.create({
        action: 'system_error',
        category: CATEGORIES.SYSTEM,
        severity: SEVERITY.CRITICAL,
        title: 'Erreur système',
        description: error.message || String(error),
        metadata: {
            stack: error.stack,
            ...context
        }
    });
};

module.exports = {
    activityLogger,
    logActivity,
    logLoginSuccess,
    logLoginFailed,
    logSystemError,
    ROUTE_CONFIG
};
