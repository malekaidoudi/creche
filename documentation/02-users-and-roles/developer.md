# Rôle Développeur

## Description
Le rôle `developer` est traité comme `admin` par le middleware d'autorisation (`requireRole`, `requireAdmin`) et dispose en plus de deux pages techniques.

## Accès supplémentaires
| Page / API | Détail |
|---|---|
| `/dashboard/activity-logs` | Journal d'activité technique, alertes, rapports (`/api/activity-logs/*`, `requireDeveloper`) |
| `/dashboard/storage` | Explorateur Cloudinary (`/api/cloudinary-explorer/*`, admin+developer) |
| `/dashboard/testimonials`, paramètres | Partagés avec admin |

## Points d'attention
- Le front (`ProtectedRoute`) compare le rôle strictement : un développeur ne voit que les pages dont la liste contient `developer`.
- `backend/init_database.js` a une contrainte `CHECK (role IN ('admin','staff','parent'))` qui **exclut `developer`** ; le rôle existe donc en base de production par un autre moyen (**À vérifier dans le projet**).
- Un compte `developer` ne doit pas être créé par `POST /api/auth/register` : voir [security-findings](../09-audit/security-findings.md).

Sources : `backend/middleware/auth.js`, `frontend/src/routes/AppRoutes.jsx`, `frontend/src/components/.../DashboardSidebar.jsx`.
