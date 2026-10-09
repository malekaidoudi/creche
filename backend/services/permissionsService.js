/**
 * SERVICE DE PERMISSIONS GRANULAIRES PAR MEMBRE DU STAFF
 *
 * Basé sur le questionnaire rempli par la direction :
 * - Les permissions "communes" sont accordées automatiquement à tout le
 *   personnel (staff) dès leur création / dès la première initialisation.
 * - Les permissions "non communes" restent désactivées par défaut ; c'est
 *   à l'administrateur de les activer au cas par cas pour qui il souhaite.
 *
 * Migration additive uniquement (CREATE TABLE IF NOT EXISTS) : aucune table
 * existante n'est modifiée, aucun accès actuel n'est cassé au déploiement.
 */

const db = require('../config/db_postgres');

// Catalogue complet des permissions, basé sur les réponses du questionnaire.
// `isCommon: true`  => accordée automatiquement à tout le staff par défaut
// `isCommon: false` => désactivée par défaut, à activer manuellement par l'admin
const PERMISSIONS_CATALOG = [
  // 1. Santé & Soins médicaux (module: 'medical')
  {
    code: 'medical.view',
    module: 'medical',
    isCommon: true,
    label: {
      fr: 'Consulter le dossier médical (allergies, médecin, groupe sanguin)',
      ar: 'الاطلاع على الملف الطبي (الحساسية، الطبيب، فصيلة الدم)'
    }
  },
  {
    code: 'medical.treatments.manage',
    module: 'medical',
    isCommon: false,
    label: {
      fr: 'Administrer les médicaments & traitements prescrits',
      ar: 'إعطاء الأدوية والعلاجات الموصوفة'
    }
  },

  // 2. Suivi & Vie quotidienne de l'enfant (module: 'daily')
  {
    code: 'attendance.manage',
    module: 'daily',
    isCommon: true,
    label: {
      fr: 'Enregistrer les arrivées & départs (pointage des présences)',
      ar: 'تسجيل الحضور والغياب (الوصول/المغادرة)'
    }
  },
  {
    code: 'daily_reports.manage',
    module: 'daily',
    isCommon: true,
    label: {
      fr: 'Rédiger les bilans journaliers & gérer les affaires/fournitures de l\'enfant (repas, siestes, couches, changes)',
      ar: 'تعبئة التقرير اليومي ومتابعة لوازم الطفل (الوجبات، القيلولة، الحفاظات، الملابس)'
    }
  },
  {
    code: 'activities.photos.publish',
    module: 'daily',
    isCommon: true,
    label: {
      fr: 'Publier les activités & photos pédagogiques',
      ar: 'نشر الأنشطة والصور التربوية'
    }
  },
  {
    code: 'children.photos.manage',
    module: 'daily',
    isCommon: false,
    label: {
      fr: 'Mettre à jour la photo de profil de l\'enfant',
      ar: 'تحديث صورة الملف الشخصي للطفل'
    }
  },

  // 3. Familles & Données confidentielles (module: 'families')
  {
    code: 'parents.phone.view',
    module: 'families',
    isCommon: false,
    label: {
      fr: 'Voir les numéros de téléphone (parents & contact d\'urgence)',
      ar: 'رؤية أرقام هواتف الأولياء وجهات اتصال الطوارئ'
    }
  },
  {
    code: 'parents.email.view',
    module: 'families',
    isCommon: false,
    label: {
      fr: 'Voir les adresses email des parents',
      ar: 'رؤية البريد الإلكتروني للأولياء'
    }
  },
  {
    code: 'children.documents.view',
    module: 'families',
    isCommon: false,
    label: {
      fr: 'Consulter les documents administratifs de l\'enfant (actes, justificatifs)',
      ar: 'الاطلاع على الوثائق الإدارية للطفل'
    }
  },

  // 4. Communication (module: 'messaging')
  {
    code: 'messages.parents',
    module: 'messaging',
    isCommon: false,
    label: {
      fr: 'Échanger des messages avec les parents',
      ar: 'تبادل الرسائل والتواصل مع الأولياء'
    }
  },
  {
    code: 'announcements.view',
    module: 'messaging',
    isCommon: true,
    label: {
      fr: 'Consulter les annonces internes de la crèche',
      ar: 'الاطلاع على الإعلانات الرسمية للحضانة'
    }
  },

  // 5. Organisation & Planning interne (module: 'organisation')
  {
    code: 'staff.planning.view',
    module: 'organisation',
    isCommon: true,
    label: {
      fr: 'Consulter le planning et la répartition de l\'équipe',
      ar: 'الاطلاع على جدول عمل الفريق'
    }
  },
  {
    code: 'absences.manage',
    module: 'organisation',
    isCommon: false,
    label: {
      fr: 'Traiter les signalements d\'absence des enfants',
      ar: 'معالجة إشعارات وطلبات الغياب للأطفال'
    }
  },
  {
    code: 'tasks.manage',
    module: 'organisation',
    isCommon: false,
    label: {
      fr: 'Gérer les tâches internes de l\'équipe',
      ar: 'متابعة وإدارة مهام الفريق الداخلية'
    }
  }
];

let schemaReady = false;

// Petit cache mémoire (10s) pour éviter une requête DB à chaque appel de middleware
const userPermissionsCache = new Map(); // userId -> { codes: Set, expiresAt }
const CACHE_TTL_MS = 10_000;

/**
 * Crée les tables si nécessaire, seed le catalogue de permissions et
 * accorde automatiquement les permissions "communes" à tout le staff
 * existant qui ne les a pas encore (idempotent, sans danger pour la prod).
 */
const ensureSchema = async () => {
  if (schemaReady) return;

  await db.query(`
    CREATE TABLE IF NOT EXISTS permissions (
      id SERIAL PRIMARY KEY,
      code VARCHAR(100) UNIQUE NOT NULL,
      module VARCHAR(50) NOT NULL,
      label_fr VARCHAR(255) NOT NULL,
      label_ar VARCHAR(255),
      is_common BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS user_permissions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
      granted_by INTEGER REFERENCES users(id),
      granted_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(user_id, permission_id)
    )
  `);

  // Seed / mise à jour du catalogue (idempotent)
  for (const perm of PERMISSIONS_CATALOG) {
    await db.query(
      `INSERT INTO permissions (code, module, label_fr, label_ar, is_common)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (code) DO UPDATE SET
         module = EXCLUDED.module,
         label_fr = EXCLUDED.label_fr,
         label_ar = EXCLUDED.label_ar,
         is_common = EXCLUDED.is_common`,
      [perm.code, perm.module, perm.label.fr, perm.label.ar, perm.isCommon]
    );
  }

  // Migration / Fusion idempotente : transférer tout droit existant de 'supplies.manage' vers 'daily_reports.manage'
  await db.query(`
    INSERT INTO user_permissions (user_id, permission_id)
    SELECT up.user_id, p_target.id
    FROM user_permissions up
    JOIN permissions p_source ON p_source.id = up.permission_id AND p_source.code = 'supplies.manage'
    JOIN permissions p_target ON p_target.code = 'daily_reports.manage'
    ON CONFLICT (user_id, permission_id) DO NOTHING
  `);

  // Purger les anciennes permissions retirées du catalogue
  const validCodes = PERMISSIONS_CATALOG.map((p) => p.code);
  await db.query(
    `DELETE FROM permissions WHERE code NOT IN (${validCodes.map((_, i) => '$' + (i + 1)).join(', ')})`,
    validCodes
  );

  // Backfill : accorder les permissions communes à tout le staff qui ne les a pas encore
  await db.query(`
    INSERT INTO user_permissions (user_id, permission_id)
    SELECT u.id, p.id
    FROM users u
    JOIN permissions p ON p.is_common = true
    WHERE u.role = 'staff'
      AND NOT EXISTS (
        SELECT 1 FROM user_permissions up
        WHERE up.user_id = u.id AND up.permission_id = p.id
      )
    ON CONFLICT (user_id, permission_id) DO NOTHING
  `);

  schemaReady = true;
};

/**
 * Accorde les permissions communes à un utilisateur staff donné
 * (à appeler juste après la création d'un nouveau compte staff).
 */
const grantCommonPermissionsToUser = async (userId) => {
  await ensureSchema();
  await db.query(`
    INSERT INTO user_permissions (user_id, permission_id)
    SELECT $1, p.id FROM permissions p WHERE p.is_common = true
    ON CONFLICT (user_id, permission_id) DO NOTHING
  `, [userId]);
  userPermissionsCache.delete(userId);
};

// Cache du catalogue complet des codes (statique pour la durée de vie du process,
// comme `schemaReady` : le catalogue ne change qu'au déploiement).
let allPermissionCodesCache = null;
const getAllPermissionCodes = async () => {
  await ensureSchema();
  if (allPermissionCodesCache) return allPermissionCodesCache;
  const result = await db.query('SELECT code FROM permissions');
  allPermissionCodesCache = new Set(result.rows.map((r) => r.code));
  return allPermissionCodesCache;
};

/**
 * Résout le rôle effectif d'un utilisateur (developer == admin), en le
 * récupérant en base si on ne l'a pas déjà sous la main.
 */
const resolveEffectiveRole = async (userId, role) => {
  let effectiveRole = role;
  if (!effectiveRole) {
    const userResult = await db.query('SELECT role FROM users WHERE id = $1', [userId]);
    effectiveRole = userResult.rows[0]?.role;
  }
  return effectiveRole === 'developer' ? 'admin' : effectiveRole;
};

/**
 * Récupère la liste des codes de permissions accordées à un utilisateur.
 *
 * ⚠️ Point central du système : un admin (ou developer) possède ICI,
 * implicitement, TOUTES les permissions du catalogue. C'est la SEULE
 * fonction qui connaît cette règle — aucun autre module (middleware,
 * route, frontend) ne doit ré-implémenter un bypass "si admin alors ok".
 * Il suffit d'appeler `userHasPermission`/`getUserPermissionCodes` et de
 * raisonner uniquement en permissions, jamais en rôle.
 */
const getUserPermissionCodes = async (userId, role = null) => {
  await ensureSchema();

  const effectiveRole = await resolveEffectiveRole(userId, role);
  if (effectiveRole === 'admin') {
    return getAllPermissionCodes();
  }

  const cached = userPermissionsCache.get(userId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.codes;
  }

  const result = await db.query(`
    SELECT p.code FROM user_permissions up
    JOIN permissions p ON p.id = up.permission_id
    WHERE up.user_id = $1
  `, [userId]);

  const codes = new Set(result.rows.map((r) => r.code));
  userPermissionsCache.set(userId, { codes, expiresAt: Date.now() + CACHE_TTL_MS });
  return codes;
};

/**
 * Vérifie si un utilisateur possède une permission donnée.
 */
const userHasPermission = async (userId, code, role = null) => {
  const codes = await getUserPermissionCodes(userId, role);
  // Alias de rétrocompatibilité : supplies.manage est désormais unifié avec daily_reports.manage
  if (code === 'supplies.manage') {
    return codes.has('daily_reports.manage') || codes.has('supplies.manage');
  }
  return codes.has(code);
};

/**
 * Catalogue complet des permissions, avec statut accordé/non pour un utilisateur donné.
 */
const getCatalogForUser = async (userId, role = null) => {
  await ensureSchema();
  const granted = userId ? await getUserPermissionCodes(userId, role) : new Set();

  const result = await db.query('SELECT code, module, label_fr, label_ar, is_common FROM permissions ORDER BY module, code');
  return result.rows.map((row) => ({
    code: row.code,
    module: row.module,
    label: { fr: row.label_fr, ar: row.label_ar },
    isCommon: row.is_common,
    granted: granted.has(row.code)
  }));
};

/**
 * Remplace entièrement la liste des permissions accordées à un utilisateur.
 */
const setUserPermissions = async (userId, codes, grantedBy) => {
  await ensureSchema();

  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

    await client.query('DELETE FROM user_permissions WHERE user_id = $1', [userId]);

    const normalizedCodes = Array.isArray(codes)
      ? Array.from(new Set(codes.map((c) => (c === 'supplies.manage' ? 'daily_reports.manage' : c))))
      : [];

    if (normalizedCodes.length > 0) {
      await client.query(`
        INSERT INTO user_permissions (user_id, permission_id, granted_by)
        SELECT $1, p.id, $3 FROM permissions p WHERE p.code = ANY($2::text[])
      `, [userId, normalizedCodes, grantedBy || null]);
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }

  userPermissionsCache.delete(userId);
  return getCatalogForUser(userId);
};

module.exports = {
  PERMISSIONS_CATALOG,
  ensureSchema,
  grantCommonPermissionsToUser,
  getUserPermissionCodes,
  userHasPermission,
  getCatalogForUser,
  setUserPermissions
};
