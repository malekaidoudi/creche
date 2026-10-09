/**
 * Registre central des fonctionnalités protégées par une permission.
 *
 * C'est la SEULE source de vérité côté frontend pour savoir quelle
 * permission backend contrôle quelle fonctionnalité de l'UI. Un composant
 * ne doit JAMAIS écrire un code de permission en dur ("attendance.manage"...) :
 * il référence toujours une clé de FEATURES via useAccess()/`<Can>`.
 *
 * ⚠️ Ces codes doivent rester synchronisés avec le catalogue canonique
 * défini côté backend dans `backend/services/permissionsService.js`
 * (PERMISSIONS_CATALOG). C'est ce fichier backend qui fait foi.
 *
 * Pas de champ `roles` ici volontairement : le backend accorde déjà
 * implicitement TOUTES les permissions à un compte admin/developer
 * (voir permissionsService.getUserPermissionCodes). Le frontend n'a donc
 * jamais besoin de raisonner en rôle pour ces fonctionnalités, seulement
 * en permission.
 *
 * Note: certaines restrictions de l'app restent volontairement basées sur
 * le rôle (ex: seul un admin peut créer un événement, accéder aux pages
 * d'administration globale...). Ce ne sont pas des "permissions" au sens
 * de ce catalogue (pas assignables individuellement à un membre du staff) :
 * ces cas continuent d'utiliser isAdmin()/ProtectedRoute roles={...}, ce
 * qui est la bonne couche pour une distinction purement catégorielle.
 */
export const FEATURES = {
  // 1. Santé & Soins médicaux
  MEDICAL_VIEW: { permission: 'medical.view' },
  TREATMENTS_MANAGE: { permission: 'medical.treatments.manage' },

  // 2. Suivi & Vie quotidienne de l'enfant
  ATTENDANCE_TODAY: { permission: 'attendance.manage' },
  DAILY_REPORTS_MANAGE: { permission: 'daily_reports.manage' },
  ACTIVITIES_PUBLISH: { permission: 'activities.photos.publish' },
  CHILDREN_PHOTOS_MANAGE: { permission: 'children.photos.manage' },
  CHILD_SUPPLIES_MANAGE: { permission: 'daily_reports.manage' }, // Fusionné avec le bilan journalier (même formulaire)

  // 3. Familles & Données confidentielles
  PARENTS_PHONE_VIEW: { permission: 'parents.phone.view' },
  PARENTS_EMAIL_VIEW: { permission: 'parents.email.view' },
  CHILDREN_DOCUMENTS_VIEW: { permission: 'children.documents.view' },

  // 4. Communication
  MESSAGES_PARENTS: { permission: 'messages.parents' },
  ANNOUNCEMENTS_VIEW: { permission: 'announcements.view' },

  // 5. Organisation & Planning interne
  STAFF_PLANNING_VIEW: { permission: 'staff.planning.view' },
  ABSENCES_MANAGE: { permission: 'absences.manage' },
  TASKS_MANAGE: { permission: 'tasks.manage' },
};

export default FEATURES;
