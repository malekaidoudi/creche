# Autorisation

## Middlewares (`backend/middleware/auth.js`)
`authenticateToken`, `requireRole(...roles)` (developer ≡ admin), `requireAdmin` (admin, developer), `requireDeveloper`, `requireStaff`, `requireParent`, `requirePermission(code)`, `requireChildAccess`, `requireEnrollmentAccess`, `requireAttendanceAccess`, `requireDocumentAccess`, `rateLimitPublic` (jamais utilisé).

## Permissions
Tables `permissions`, `user_permissions` ; admin/developer : toutes ; staff : droits communs auto-attribués ; cache 10 s ; `PUT /api/staff-permissions/:userId` transactionnel. Catalogue détaillé : [permissions-matrix](../02-users-and-roles/permissions-matrix.md).
**Appliquées côté API : 6 sur 19** (`messages.parents`, `attendance.manage`, `activities.photos.publish`, `children.photos.manage`, `parents.phone.view`, `parents.email.view`).

## Frontend
`ProtectedRoute` (comparaison stricte du rôle), filtrage du menu par rôle, `useAccess`/`Can` pour 4 features. **Les pages sans garde dépendent uniquement du menu.**

## Routes API sans authentification (vérifiées)
`/api/users` : `GET /:id`, `POST /`, `PUT /:id`, `DELETE /:id`, `PUT /:id/password`, `GET /has-children` (doublon factice) · `/api/nursery-settings` (toutes les écritures) · `/api/notifications` (`POST /`, `/broadcast`, `PUT /read-all`, `/user/:id/read-all`, `DELETE /:id`, `GET /user/:id/unread-count`, `/stats/overview`) · `/api/children` (`/stats`, `/stats/overview`, `/birthdays/month`, `/unassociated`) · `/api/holidays` (`POST /init`) · `/api/setup/create-admin`, `/check-users` · `/api/contacts` (`GET /`, `/test-smtp`).
Détail : [security-findings](../09-audit/security-findings.md).
