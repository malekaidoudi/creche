# Entité : Utilisateur

**Description** : toute personne ayant un compte (parent, personnel, admin, développeur).

| Attribut | Remarque |
|---|---|
| id, email (unique), password (hash bcrypt) | |
| first_name, last_name, phone, gender | |
| role | `parent`, `staff`, `admin` (CHECK initial) ; `developer` utilisé par le code |
| staff_position | poste du personnel |
| is_active, password_set, last_active | |
| password_token(+_expires) | création de mot de passe, 7 jours |
| reset_token(+_expires) | réinitialisation, 1 h |
| profile_image, cloudinary_public_id, push_token | |
| created_at, updated_at | |

**Relations** : 1–N enfants (`children.parent_id`) ; N–N permissions (`user_permissions`) ; 1–N notifications, messages ; affectation d'âge (`staff_age_assignments`).

**Cycle de vie** : créé par inscription approuvée / création admin (`user-workflow`) → mot de passe défini → actif → désactivé (`is_active`) ou supprimé.

| Action | Qui |
|---|---|
| Créer | admin (`/user-workflow/*`) ; inscription approuvée ; **`/auth/register` public** ⚠️ |
| Modifier / supprimer | prévu admin ; **routes `PUT/DELETE /api/users/:id` non protégées** ⚠️ |
| Se modifier | l'utilisateur (`/profile`, `/change-password`) |

**Règles** : e-mail unique ; mot de passe ≥ 6 caractères ; permissions staff cachées 10 s.
**API** : `/api/auth/*`, `/api/users/*`, `/api/user-workflow/*`, `/api/staff-permissions/*`, `/api/profile`.
**Sources** : `backend/routes_postgres/users.js`, `auth.js`, `userWorkflow.js`, `backend/services/permissionsService.js`.
