# Entité : Document

| Type | Table | Stockage | API |
|---|---|---|---|
| Document d'inscription | `enrollment_documents` | local `backend/uploads/documents` (**À vérifier** si Cloudinary) | `/api/enrollments/:id/documents` |
| Document d'enfant | `children_documents` | idem | `/api/documents/children/:childId` |
| Document administratif | `admin_documents` (migration `db_postgres.js`) | idem | `/api/documents/admin` |

**Formats** : jpeg, png, webp, pdf, doc, docx ; 5 Mo.
**Règles d'accès** : upload/suppression admin documents : admin ; téléchargement : authentifié.
**Limites** : fichiers tracés dans Git ; non sauvegardés par la sauvegarde JSON.
