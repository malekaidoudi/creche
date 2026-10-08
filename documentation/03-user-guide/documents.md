# Documents

- **Documents d'inscription** : déposés par la famille (acte de naissance, carnet/certificat médical — noms observés dans `backend/uploads/documents`). Consultables par l'administration (« Inscriptions → Documents »).
- **Documents des enfants** : liste par enfant, ajout (`POST /api/documents/children/:childId`).
- **Documents administratifs** : upload/suppression par admin ; liste et téléchargement pour tout utilisateur connecté.
- **Règlement intérieur** : téléchargement public (`/api/documents/public/reglement`, URL configurable).
- **Formats** : JPEG, PNG, WebP, PDF, DOC, DOCX ; 5 Mo max pour l'upload local.
- **Limites** : les fichiers locaux sont perdus sur hébergeur à disque éphémère ; des pièces d'identité/médicales sont versionnées dans Git (voir [security-findings](../09-audit/security-findings.md)).
