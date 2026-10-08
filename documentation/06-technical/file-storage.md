# Stockage des fichiers

| Mode | Détail |
|---|---|
| **Cloudinary** | `services/cloudinaryService.js` ; signature d'upload direct `POST /api/cloudinary/signature` ; explorateur admin/developer `/api/cloudinary-explorer/*` (stats, dossiers, ressources, recherche, suppression, déplacement, copie, création, renommage) |
| **Disque local** | `backend/uploads` via multer, 5 Mo ; types jpeg/png/webp/pdf/doc/docx ; images seulement pour les champs profile/image/photo ; nom `fieldname-timestamp-random.ext` |
| Service HTTP | `/uploads`, `/public` publics (sans authentification) |

## Risques
- Dossier de destination construit depuis `req.body.category` non assaini (traversée de chemin).
- ~36 PDF (actes de naissance, carnets/certificats médicaux) et ~25 images de profil **versionnés dans Git**.
- Disque éphémère (Render/Fly) : perte des fichiers locaux.
- Le front appelle `/api/uploads` et `/api/uploads/multiple` : **routes non montées**.

Sources : `backend/routes_postgres/documents.js`, `profile.js`, `cloudinary.js`, `middleware/` (multer).
