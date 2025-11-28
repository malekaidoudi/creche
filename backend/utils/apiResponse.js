/**
 * Helper pour standardiser les réponses API
 * 
 * Format uniforme:
 * {
 *   success: boolean,
 *   data?: any,
 *   message?: string,
 *   error?: string,
 *   code?: string,
 *   meta?: { page, limit, total, totalPages }
 * }
 */

const logger = require('./logger');

const apiResponse = {
  /**
   * Réponse de succès
   */
  success: (res, data = null, message = null, statusCode = 200) => {
    const response = {
      success: true
    };

    if (data !== null) {
      response.data = data;
    }

    if (message) {
      response.message = message;
    }

    return res.status(statusCode).json(response);
  },

  /**
   * Réponse de succès avec pagination
   */
  paginated: (res, data, pagination, message = null) => {
    const { page = 1, limit = 20, total = 0 } = pagination;
    const totalPages = Math.ceil(total / limit);

    const response = {
      success: true,
      data,
      meta: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages
      }
    };

    if (message) {
      response.message = message;
    }

    return res.status(200).json(response);
  },

  /**
   * Réponse de création réussie (201)
   */
  created: (res, data = null, message = 'Ressource créée avec succès') => {
    return apiResponse.success(res, data, message, 201);
  },

  /**
   * Réponse d'erreur générique
   */
  error: (res, message = 'Une erreur est survenue', statusCode = 500, code = null, details = null) => {
    const response = {
      success: false,
      error: message
    };

    if (code) {
      response.code = code;
    }

    if (details) {
      response.details = details;
    }

    return res.status(statusCode).json(response);
  },

  /**
   * Erreur 400 - Requête invalide
   */
  badRequest: (res, message = 'Requête invalide', details = null) => {
    return apiResponse.error(res, message, 400, 'BAD_REQUEST', details);
  },

  /**
   * Erreur 401 - Non authentifié
   */
  unauthorized: (res, message = 'Authentification requise') => {
    return apiResponse.error(res, message, 401, 'UNAUTHORIZED');
  },

  /**
   * Erreur 403 - Accès interdit
   */
  forbidden: (res, message = 'Accès non autorisé') => {
    return apiResponse.error(res, message, 403, 'FORBIDDEN');
  },

  /**
   * Erreur 404 - Ressource non trouvée
   */
  notFound: (res, resource = 'Ressource') => {
    return apiResponse.error(res, `${resource} non trouvé(e)`, 404, 'NOT_FOUND');
  },

  /**
   * Erreur 409 - Conflit
   */
  conflict: (res, message = 'Conflit avec une ressource existante') => {
    return apiResponse.error(res, message, 409, 'CONFLICT');
  },

  /**
   * Erreur 422 - Données non traitables
   */
  unprocessable: (res, message = 'Données invalides', details = null) => {
    return apiResponse.error(res, message, 422, 'UNPROCESSABLE_ENTITY', details);
  },

  /**
   * Erreur 500 - Erreur serveur interne
   */
  serverError: (res, error = null, message = 'Erreur interne du serveur') => {
    if (error) {
      logger.error('Erreur serveur:', error.message || error);
    }
    return apiResponse.error(res, message, 500, 'INTERNAL_ERROR');
  },

  /**
   * Erreur de validation
   */
  validationError: (res, errors) => {
    return apiResponse.error(res, 'Erreurs de validation', 400, 'VALIDATION_ERROR', errors);
  }
};

module.exports = apiResponse;

