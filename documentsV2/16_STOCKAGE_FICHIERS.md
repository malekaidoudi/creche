# 16 — Gestion et stockage des fichiers

## Objectif
Décrire comment les fichiers (documents d'inscription, photos d'enfants, médias d'activités, documents administratifs) sont stockés, validés et sécurisés.

## 1. Deux mécanismes de stockage coexistent

### 1.1 Cloudinary (mécanisme principal, confirmé actif)
`backend/services/cloudinaryService.js` configure le SDK `cloudinary` avec `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` (variables d'environnement, voir [18_CONFIGURATION_ENVIRONNEMENT.md](./18_CONFIGURATION_ENVIRONNEMENT.md)). Fonctions principales :
- `uploadChildDocument(file, childId, documentType)` → dossier `children/child_{childId}/`.
- `uploadEnrollmentDocument(file, enrollmentId, documentType)` → dossier `enrollments/enrollment_{enrollmentId}/` (avant approbation, le candidat n'a pas encore d'enfant créé).
- `migrateEnrollmentToChild(enrollmentId, childId)` → renomme (côté Cloudinary) tous les fichiers du dossier d'inscription vers le dossier de l'enfant créé, appelé après approbation (voir [21_FLUX_METIER.md](./21_FLUX_METIER.md)).
- `archiveChildFolder(childId)` → renomme `children/child_{id}` en `archives/child_{id}` (utilisé en cas de suspension/désactivation d'un dossier enfant plutôt qu'une suppression physique).
- `deleteFolder(id, folderType)` → suppression définitive de tous les fichiers d'un dossier (`enrollment`, `child` ou `archive`), utilisée en cas de rejet définitif d'une inscription.
- `uploadFile(filePath, folder, publicId, isVideo)` → upload générique, avec `upload_large` (chunk 20 Mo, timeout 10 min) pour les vidéos volumineuses des activités.
- `uploadFileWithOverwrite(filePath, folder, publicId)` → upload avec écrasement, utilisé pour les photos de profil (un seul fichier par utilisateur/enfant, invalide le cache CDN via `invalidate: true`).
- `getSignedUrl(publicId, options)` → génère une URL signée avec expiration (par défaut 1h) pour les téléchargements de documents sensibles (`type: 'authenticated'`).
- `isConfigured()` → vérifie la présence des 3 variables d'environnement ; en leur absence, chaque fonction d'upload renvoie `{ success: false, error: 'Cloudinary non configuré' }` sans lever d'exception (dégradation silencieuse).

### 1.2 Stockage disque local (`multer`, mécanisme secondaire/historique)
`backend/middleware/upload.js` configure `multer.diskStorage` vers `backend/uploads/` (sous-dossiers `profiles/`, `documents/`, `activities/`, `enrollments/`, `temp/`, organisés par `req.body.category` ou le nom du champ de formulaire). Limite : **5 Mo par fichier**. Filtre de type : images uniquement pour `profile`/`image`/`photo` ; pour les autres champs, liste blanche `image/jpeg, image/jpg, image/png, image/webp, application/pdf, application/msword, .docx`.
Ces fichiers sont ensuite servis statiquement par Express (`app.use('/uploads', express.static(...))`, `backend/server.js` ligne 233) — **accès public sans contrôle d'authentification sur le chemin `/uploads/*`** dès lors que le nom de fichier est connu (sécurité par obscurité du nom généré, pas par autorisation).

**Coexistence confirmée** : le dossier `backend/uploads/` contient des sous-dossiers actifs (`profiles`, `documents`, `enrollments`, `activities`, `temp`) et au moins un fichier image réel (`image-1761423221781-63453557.jpeg`), ce qui prouve que la voie disque local est encore utilisée en parallèle de Cloudinary dans certains flux (probablement comme stockage temporaire avant upload Cloudinary, ou résiduel d'anciens flux non migrés). **À vérifier module par module** lequel des deux chemins est actif pour chaque type d'upload (le code de `routes_postgres/documents.js`, `children.js`, `activities.js` mélange parfois `multer` en entrée puis relai vers Cloudinary).

## 2. Validation des fichiers
- Côté `multer` : type MIME + taille (5 Mo).
- Côté Cloudinary : `resource_type: 'auto'` laisse le service détecter lui-même le type ; aucune validation de taille explicite côté code pour les uploads Cloudinary directs (dépend des limites du plan Cloudinary).
- Côté frontend : la bibliothèque `react-dropzone` est présente dans les dépendances (`frontend/package.json`), suggérant un contrôle de type/taille à la sélection — **à vérifier** dans les composants d'upload (non audités en détail dans ce document).

## 3. URLs et accès
- **Fichiers publics** : documents administratifs marqués `is_public = true` dans `admin_documents` (ex. règlement intérieur, `GET /api/documents/public/reglement`), images de la visite virtuelle (`/api/virtual-tour/images`), médias d'activités publiées (le fil d'activités est visible sur le site public).
- **Fichiers privés avec contrôle d'accès applicatif** : documents d'inscription et documents d'enfant, protégés par les middlewares `requireDocumentAccess`, `requireChildDocumentAccess`, `requireSingleChildDocumentAccess` (voir [11_AUTORISATION_ET_PERMISSIONS.md](./11_AUTORISATION_ET_PERMISSIONS.md)) — mais une fois l'URL Cloudinary (publique par défaut, `type: upload`) obtenue par un utilisateur autorisé, **rien n'empêche techniquement sa redistribution**, sauf pour les documents utilisant explicitement `getSignedUrl` (`type: 'authenticated'`, expiration temporelle).
- **À vérifier** : tous les documents sensibles (ex. `enrollment_documents`, `children_documents`) n'utilisent pas nécessairement une URL signée/expirante — le code de `cloudinaryService.uploadChildDocument`/`uploadEnrollmentDocument` utilise des options d'upload standard (pas de `type: 'authenticated'` par défaut), ce qui suggère que l'URL `secure_url` renvoyée est une URL Cloudinary publique classique, protégée uniquement par le caractère peu devinable du `public_id`. C'est un point de sécurité à clarifier (voir [20_SECURITE_ET_JOURNALISATION.md](./20_SECURITE_ET_JOURNALISATION.md)).

## 4. Suppression et remplacement
- **Remplacement** : photos de profil (utilisateur, enfant) utilisent `uploadFileWithOverwrite` avec un `public_id` fixe → la nouvelle image écrase l'ancienne, cache CDN invalidé.
- **Suppression** : `deleteFile(publicId)` (fichier unique) et `deleteFolder(id, folderType)` (dossier complet) sont utilisés lors du rejet définitif d'une inscription ou de la suppression d'un document. Aucune purge automatique planifiée des fichiers orphelins n'a été identifiée (pas de job dédié dans `backend/jobs/`).

## 5. Gestion des erreurs
Toutes les fonctions de `cloudinaryService.js` suivent le même patron : `try/catch` local, retour `{ success: false, error }` plutôt que levée d'exception, ce qui oblige chaque appelant à vérifier explicitement `result.success`. Les échecs d'upload ne sont pas systématiquement journalisés dans `activity_logs` (contrairement aux échecs d'envoi d'e-mail, voir [17_MESSAGERIE_ET_NOTIFICATIONS.md](./17_MESSAGERIE_ET_NOTIFICATIONS.md)).

## 6. Statistiques de stockage
`cloudinaryService.getUsageStats()` (début de fonction visible en fin de fichier lu) et les routes `/api/cloudinary-explorer/*` (réservées `admin`/`developer`) permettent de consulter l'usage Cloudinary (quota, dossiers, ressources) directement depuis le tableau de bord (page `CloudinaryExplorerPage.jsx`, route `/dashboard/storage`, réservée au rôle `developer` côté frontend — voir [11_AUTORISATION_ET_PERMISSIONS.md](./11_AUTORISATION_ET_PERMISSIONS.md)).

## 7. Limites et points à vérifier
- Répartition exacte des flux encore gérés par le stockage disque local (`multer`/`backend/uploads/`) par rapport à Cloudinary, module par module.
- Utilisation réelle ou non d'URLs signées (`getSignedUrl`) pour les documents d'inscription/enfant sensibles.
- Existence d'un mécanisme de purge des fichiers orphelins (non trouvé).
- Validation précise côté frontend (`react-dropzone`) — composants non audités en détail.
