/**
 * Validateur et Résolveur de Routes pour l'Application Crèche Mima Elghalia
 * Garantit qu'aucun lien brisé, 404 ou non autorisé ne soit affiché dans le Centre d'Aide
 * ou généré par l'IA (Google Gemini).
 * 
 * Source de vérité : frontend/src/routes/AppRoutes.jsx & documentsV2/25_DICTIONNAIRE_DES_ROUTES_ET_NAVIGATION.md
 */

// 1. Liste exhaustive des routes canoniques et des rôles autorisés
export const CANONICAL_ROUTES = {
  // --- Routes publiques (visiteur, non connecté ou tout rôle) ---
  '/': ['visitor', 'parent', 'staff', 'admin', 'developer'],
  '/inscription': ['visitor', 'parent', 'staff', 'admin', 'developer'],
  '/contact': ['visitor', 'parent', 'staff', 'admin', 'developer'],
  '/visite-virtuelle': ['visitor', 'parent', 'staff', 'admin', 'developer'],
  '/preview-location': ['visitor', 'parent', 'staff', 'admin', 'developer'],
  '/forgot-password': ['visitor', 'parent', 'staff', 'admin', 'developer'],
  '/create-password': ['visitor', 'parent', 'staff', 'admin', 'developer'],
  '/upload-documents': ['visitor', 'parent', 'staff', 'admin', 'developer'],
  '/recovery': ['visitor', 'parent', 'staff', 'admin', 'developer'],

  // --- Espace commun / Activités / Profil ---
  '/activites': ['parent', 'staff', 'admin', 'developer'],
  '/profile': ['parent', 'staff', 'admin', 'developer'],

  // --- Espace Parent (/mon-espace/*) ---
  '/mon-espace': ['parent', 'admin', 'staff'],
  '/mon-espace/messages': ['parent'],
  '/mon-espace/announcements': ['parent'],
  '/mon-espace/calendar': ['parent'],
  '/mon-espace/attendance-report': ['parent'],
  '/mon-espace/absence-request': ['parent'],
  '/mon-espace/activities': ['parent'],
  '/mon-espace/ajouter-enfant': ['parent'],
  '/mon-espace/daily-reports': ['parent', 'admin', 'staff'],
  '/mon-espace/treatments': ['parent'],

  // --- Tableau de bord Staff & Direction (/dashboard/*) ---
  '/dashboard': ['staff', 'admin', 'developer'],
  '/dashboard/children': ['staff', 'admin', 'developer'],
  '/dashboard/attendance': ['staff', 'admin', 'developer'],
  '/dashboard/attendance/today': ['staff', 'admin', 'developer'],
  '/dashboard/attendance/history': ['staff', 'admin', 'developer'],
  '/dashboard/attendance/stats': ['staff', 'admin', 'developer'],
  '/dashboard/documents': ['staff', 'admin', 'developer'],
  '/dashboard/absence-management': ['staff', 'admin', 'developer'],
  '/dashboard/planning': ['staff', 'admin', 'developer'],
  '/dashboard/planning/calendar': ['staff', 'admin', 'developer'],
  '/dashboard/planning/weekly': ['staff', 'admin', 'developer'],
  '/dashboard/events/calendar': ['staff', 'admin', 'developer'],
  '/dashboard/staff/send-message': ['staff', 'admin', 'developer'],
  '/dashboard/messages': ['staff', 'admin', 'developer'],
  '/dashboard/announcements': ['staff', 'admin', 'developer'],
  '/dashboard/tasks': ['staff', 'admin', 'developer'],
  '/dashboard/activities': ['staff', 'admin', 'developer'],
  '/dashboard/treatments': ['staff', 'admin', 'developer'],
  '/dashboard/daily-reports': ['staff', 'admin', 'developer'],
  '/dashboard/staff-settings': ['staff', 'admin', 'developer', 'parent'],

  // --- Modules d'Administration (admin / developer) ---
  '/dashboard/add-child': ['admin', 'developer'],
  '/dashboard/enrollments': ['admin', 'developer'],
  '/dashboard/pending-enrollments': ['admin', 'developer'],
  '/dashboard/enrollments/today': ['admin', 'developer'],
  '/dashboard/enrollments/history': ['admin', 'developer'],
  '/dashboard/enrollments/stats': ['admin', 'developer'],
  '/dashboard/parents': ['admin', 'developer'],
  '/dashboard/staff': ['admin', 'developer'], // Page de gestion du staff ET de la modale des permissions
  '/dashboard/add-user': ['admin', 'developer'],
  '/dashboard/general-stats': ['admin', 'developer'],
  '/dashboard/attendance-report': ['admin', 'developer'],
  '/dashboard/settings': ['admin', 'developer', 'staff', 'parent'], // Paramètres crèche (admin/dev) ou redirection transparente vers profil (staff/parent)
  '/dashboard/activity-feed': ['admin', 'developer'],
  '/dashboard/mailbox': ['admin', 'developer'],
  '/dashboard/testimonials': ['admin', 'developer'],

  // --- Modules Techniques & Administration ---
  '/dashboard/activity-logs': ['admin', 'developer'],
  '/dashboard/storage': ['admin', 'developer'],
};

// 2. Dictionnaire des alias fréquents et résolveur intelligent selon le rôle
const ALIAS_MAP = {
  // Permissions -> Modale de gestion des permissions sur la page Staff
  '/staff-permissions': {
    target: '/dashboard/staff',
    roles: ['admin', 'developer'],
    fallback: '/dashboard'
  },
  '/permissions': {
    target: '/dashboard/staff',
    roles: ['admin', 'developer'],
    fallback: '/dashboard'
  },

  // Présences
  '/attendances': {
    resolve: (role) => (role === 'parent' ? '/mon-espace/attendance-report' : '/dashboard/attendance')
  },
  '/attendance': {
    resolve: (role) => (role === 'parent' ? '/mon-espace/attendance-report' : '/dashboard/attendance')
  },

  // Absences
  '/absences': {
    resolve: (role) => (role === 'parent' ? '/mon-espace/absence-request' : '/dashboard/absence-management')
  },
  '/absence': {
    resolve: (role) => (role === 'parent' ? '/mon-espace/absence-request' : '/dashboard/absence-management')
  },

  // Bilans journaliers
  '/daily-reports': {
    resolve: (role) => (role === 'parent' ? '/mon-espace/daily-reports' : '/dashboard/daily-reports')
  },
  '/bilans': {
    resolve: (role) => (role === 'parent' ? '/mon-espace/daily-reports' : '/dashboard/daily-reports')
  },

  // Traitements médicaux
  '/treatments': {
    resolve: (role) => (role === 'parent' ? '/mon-espace/treatments' : '/dashboard/treatments')
  },
  '/medicaments': {
    resolve: (role) => (role === 'parent' ? '/mon-espace/treatments' : '/dashboard/treatments')
  },

  // Inscriptions & Rendez-vous
  '/rendez-vous': {
    target: '/dashboard/enrollments',
    roles: ['admin', 'developer'],
    fallback: '/dashboard'
  },
  '/appointments': {
    target: '/dashboard/enrollments',
    roles: ['admin', 'developer'],
    fallback: '/dashboard'
  },

  // Jours fériés & Sauvegardes
  '/holidays': {
    target: '/dashboard/settings#section-holidays',
    roles: ['admin', 'developer'],
    fallback: '/dashboard/settings'
  },
  '/jours-feries': {
    target: '/dashboard/settings#section-holidays',
    roles: ['admin', 'developer'],
    fallback: '/dashboard/settings'
  },
  '/backups': {
    target: '/dashboard/settings',
    roles: ['admin', 'developer'],
    fallback: '/dashboard'
  },
  '/sauvegardes': {
    target: '/dashboard/settings',
    roles: ['admin', 'developer'],
    fallback: '/dashboard'
  },

  // Connexion
  '/login': { target: '/' },
  '/connexion': { target: '/' },

  // Activités
  '/activities': {
    resolve: (role) => (role === 'parent' ? '/mon-espace/activities' : '/dashboard/activities')
  },

  // Planning & Messages
  '/planning': {
    resolve: (role) => (role === 'parent' ? '/mon-espace/calendar' : '/dashboard/planning')
  },
  '/messages': {
    resolve: (role) => (role === 'parent' ? '/mon-espace/messages' : '/dashboard/messages')
  },
  '/children': {
    resolve: (role) => (role === 'parent' ? '/mon-espace' : '/dashboard/children')
  }
};

/**
 * Normalise et extrait le chemin de base (sans query ni hash)
 */
function extractBasePath(path) {
  if (!path || typeof path !== 'string') return '';
  const clean = path.trim().split('?')[0].split('#')[0];
  // Conserver la racine "/" sinon enlever le slash final superflu
  return clean.length > 1 && clean.endsWith('/') ? clean.slice(0, -1) : clean;
}

/**
 * Vérifie si un chemin exact ou dynamique est valide dans la liste canonique
 */
export function isValidCanonicalPath(basePath) {
  if (CANONICAL_ROUTES[basePath]) return true;

  // Gestion des routes dynamiques (/mon-espace/child/:id/details, /reset-password/:token)
  if (/^\/mon-espace\/child\/[^/]+\/(details|medical|emergency-contacts)$/.test(basePath)) {
    return true;
  }
  if (/^\/reset-password\/[^/]+$/.test(basePath)) {
    return true;
  }

  return false;
}

/**
 * Vérifie si le rôle donné a la permission d'accéder à la route de base
 */
export function isRouteAllowedForRole(basePath, role = 'visitor') {
  const effectiveRole = role || 'visitor';
  const allowedRoles = CANONICAL_ROUTES[basePath];

  if (!allowedRoles) {
    // Routes dynamiques
    if (/^\/mon-espace\/child\/[^/]+/.test(basePath)) {
      return ['parent', 'admin', 'developer'].includes(effectiveRole);
    }
    if (/^\/reset-password\/[^/]+$/.test(basePath)) {
      return true;
    }
    return false;
  }

  // Developer hérite de tous les accès admin
  if (effectiveRole === 'developer') {
    return true;
  }

  return allowedRoles.includes(effectiveRole);
}

/**
 * Résout un chemin (potentiellement un alias comme /staff-permissions) vers une route canonique certifiée
 * et vérifie les permissions d'accès selon le rôle de l'utilisateur.
 * 
 * @param {string} rawPath - Le chemin brut (ex: '/staff-permissions', '/attendances', '/dashboard/settings#section-holidays')
 * @param {string} role - Le rôle de l'utilisateur ('visitor', 'parent', 'staff', 'admin', 'developer')
 * @returns {string|null} - Le chemin valide résolu, ou null si invalide / non autorisé
 */
export function resolveValidRoute(rawPath, role = 'visitor') {
  if (!rawPath || typeof rawPath !== 'string') return null;

  const trimmed = rawPath.trim();
  const basePath = extractBasePath(trimmed);
  const hashPart = trimmed.includes('#') ? '#' + trimmed.split('#')[1] : '';

  // 1. Vérifier si c'est un alias connu
  if (ALIAS_MAP[basePath]) {
    const aliasDef = ALIAS_MAP[basePath];
    let resolvedPath = '';

    if (typeof aliasDef.resolve === 'function') {
      resolvedPath = aliasDef.resolve(role);
    } else if (aliasDef.target) {
      if (aliasDef.roles && !aliasDef.roles.includes(role) && role !== 'developer') {
        resolvedPath = aliasDef.fallback || null;
      } else {
        resolvedPath = aliasDef.target;
      }
    }

    if (!resolvedPath) return null;

    // Ré-injecter le hash si non déjà présent dans le resolvedPath
    const finalPath = resolvedPath.includes('#') ? resolvedPath : resolvedPath + hashPart;
    const finalBase = extractBasePath(finalPath);

    if (isValidCanonicalPath(finalBase) && isRouteAllowedForRole(finalBase, role)) {
      return finalPath;
    }
    return null;
  }

  // 2. Vérification directe sur le chemin canonique
  if (isValidCanonicalPath(basePath)) {
    if (isRouteAllowedForRole(basePath, role)) {
      return trimmed;
    }
    // Route valide techniquement mais non permise pour ce rôle
    return null;
  }

  // Route inconnue / inexistante
  return null;
}

/**
 * Filtre et résout une liste d'actions suggérées (suggestedActions)
 * Élimine toute action avec un lien mort ou interdit pour l'utilisateur connecté.
 * 
 * @param {Array<{label: string, path: string}>} actions
 * @param {string} role
 * @returns {Array<{label: string, path: string}>} Actions garanties 100% valides
 */
export function filterValidActions(actions, role = 'visitor') {
  if (!Array.isArray(actions) || actions.length === 0) return [];

  const validActions = [];

  for (const act of actions) {
    if (!act || !act.path || !act.label) continue;

    const resolved = resolveValidRoute(act.path, role);
    if (resolved) {
      validActions.push({
        ...act,
        path: resolved
      });
    } else {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`[RouteValidator] Action ignorée car lien invalide ou non autorisé pour rôle "${role}":`, act);
      }
    }
  }

  return validActions;
}
