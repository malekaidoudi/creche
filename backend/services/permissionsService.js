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
  // Santé des enfants
  { code: 'medical.view', module: 'medical', isCommon: true,
    label: { fr: 'Voir les informations médicales (allergies, maladies)', ar: 'رؤية المعلومات الطبية (الحساسية، الأمراض)' } },
  { code: 'medical.treatments.manage', module: 'medical', isCommon: true,
    label: { fr: 'Voir et administrer les traitements prescrits', ar: 'رؤية وإعطاء الأدوية الموصوفة' } },
  { code: 'children.documents.view', module: 'medical', isCommon: false,
    label: { fr: 'Voir les documents administratifs de l\'enfant', ar: 'رؤية الوثائق الإدارية للطفل' } },

  // Communication
  { code: 'messages.parents', module: 'messaging', isCommon: false,
    label: { fr: 'Envoyer/recevoir des messages avec les parents', ar: 'إرسال واستقبال الرسائل مع الوالدين' } },
  { code: 'messages.direction', module: 'messaging', isCommon: true,
    label: { fr: 'Envoyer/recevoir des messages avec la direction', ar: 'إرسال واستقبال الرسائل مع الإدارة' } },
  { code: 'announcements.view', module: 'messaging', isCommon: true,
    label: { fr: 'Voir les annonces officielles', ar: 'رؤية الإعلانات الرسمية' } },

  // Suivi quotidien
  { code: 'attendance.manage', module: 'daily', isCommon: true,
    label: { fr: 'Enregistrer les présences (arrivée/départ)', ar: 'تسجيل الحضور (الوصول/المغادرة)' } },
  { code: 'daily_reports.manage', module: 'daily', isCommon: true,
    label: { fr: 'Remplir le rapport journalier', ar: 'تعبئة التقرير اليومي' } },
  { code: 'children.photos.view', module: 'daily', isCommon: true,
    label: { fr: 'Voir les photos des enfants', ar: 'رؤية صور الأطفال' } },
  { code: 'activities.photos.publish', module: 'daily', isCommon: true,
    label: { fr: 'Publier des photos / activités', ar: 'نشر الصور / الأنشطة' } },

  // Organisation du travail
  { code: 'absences.manage', module: 'organisation', isCommon: false,
    label: { fr: 'Voir et traiter les demandes d\'absence', ar: 'رؤية ومعالجة طلبات الغياب' } },
  { code: 'appointments.manage', module: 'organisation', isCommon: false,
    label: { fr: 'Voir et gérer les rendez-vous', ar: 'رؤية وتنظيم المواعيد' } },
  { code: 'staff.planning.view', module: 'organisation', isCommon: true,
    label: { fr: 'Voir le planning / la répartition de l\'équipe', ar: 'رؤية الجدول الزمني / توزيع الفريق' } },
  { code: 'supplies.manage', module: 'organisation', isCommon: true,
    label: { fr: 'Gérer le stock de fournitures', ar: 'إدارة مخزون اللوازم' } },
  { code: 'tasks.manage', module: 'organisation', isCommon: false,
    label: { fr: 'Voir et gérer les tâches internes de l\'équipe', ar: 'رؤية وإدارة المهام الداخلية للفريق' } },

  // Informations sur les familles (les plus sensibles)
  { code: 'parents.phone.view', module: 'families', isCommon: false,
    label: { fr: 'Voir le numéro de téléphone des parents', ar: 'رؤية رقم هاتف الوالدين' } },
  { code: 'parents.email.view', module: 'families', isCommon: false,
    label: { fr: 'Voir l\'adresse email des parents', ar: 'رؤية البريد الإلكتروني للوالدين' } },
  { code: 'payments.alerts.view', module: 'families', isCommon: false,
    label: { fr: 'Voir si une famille n\'a pas payé', ar: 'معرفة ما إذا كانت الأسرة لم تدفع' } }
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

/**
 * Récupère la liste des codes de permissions accordées à un utilisateur.
 */
const getUserPermissionCodes = async (userId) => {
  await ensureSchema();

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
const userHasPermission = async (userId, code) => {
  const codes = await getUserPermissionCodes(userId);
  return codes.has(code);
};

/**
 * Catalogue complet des permissions, avec statut accordé/non pour un utilisateur donné.
 */
const getCatalogForUser = async (userId) => {
  await ensureSchema();
  const granted = userId ? await getUserPermissionCodes(userId) : new Set();

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

    if (Array.isArray(codes) && codes.length > 0) {
      await client.query(`
        INSERT INTO user_permissions (user_id, permission_id, granted_by)
        SELECT $1, p.id, $3 FROM permissions p WHERE p.code = ANY($2::text[])
      `, [userId, codes, grantedBy || null]);
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
