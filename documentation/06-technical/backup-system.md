# Sauvegarde et restauration

## Fonctionnement
- `jobs/backupJob.js` : quotidien `0 2 * * *` (Africa/Tunis), conserve les 30 dernières sauvegardes automatiques.
- Format : instantanés **JSON** de 20 tables dans `backend/backups/data` (disque local).
- API admin `/api/backup` : liste, création, téléchargement, suppression, restauration, statut.
- API de secours `/api/recovery` (clé `RECOVERY_KEY`, 5 tentatives/heure) : verify, backups, status, restore, download.
- Scripts npm racine : `backup`, `backup:list`, `backup:restore` (→ `backend/scripts/backup.js`, existence **À vérifier**). Guide : `BACKUP_GUIDE.md`.

## Tables sauvegardées
users, children, enrollments, enrollment_documents, attendance, holidays, holiday_policies, nursery_settings, notifications, events, tasks, announcements, appointments, staff_messages, personal_memos, activities, activity_logs, absence_requests, contact_messages, logs.

## Non sauvegardées
children_documents, parent_children, permissions/user_permissions, child_treatments, treatment_administrations, daily_reports(+meals/diapers), child_supplies, testimonials, admin_documents, email_logs, fichiers uploadés.

## Risques
- Restauration : `TRUNCATE … RESTART IDENTITY CASCADE` par table, **non transactionnelle**, insertion ligne à ligne en ignorant les erreurs ; le CASCADE peut effacer des tables non sauvegardées. `backup.js` restaure 17 tables.
- Noms de fichier non assainis (traversée de chemin).
- Comparaison de `RECOVERY_KEY` non à temps constant.
- Les sauvegardes contiennent des hachages de mots de passe, sur le même disque que l'application.
