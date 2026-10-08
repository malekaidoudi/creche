# Entité : Enfant

**Description** : enfant accueilli ou en cours d'inscription.

| Attribut | Remarque |
|---|---|
| id, first_name, last_name, birth_date, gender | obligatoires : prénom, nom, date de naissance |
| parent_id | parent principal (peut être NULL → « orphelin ») |
| medical_info, allergies, medications, conditions, blood_type, doctor_name/phone, notes | infos médicales (colonnes exactes **À vérifier**) |
| emergency_contact_name/phone, contacts d'urgence | |
| photo_url, photo_shared_with_staff | |
| is_active | désactivation logique |

**Relations** : N–1 parent ; 1–1 inscription ; 1–N présences, rapports, fournitures, traitements, absences.
**Cycle de vie** : créé à l'approbation d'une inscription ou par le personnel → actif → désactivé/supprimé (admin, `childLifecycleService`).
**Accès** : parent concerné, personnel, admin (`requireChildAccess`). Création : personnel/admin ; suppression : admin.
**Règles** : téléphone/e-mail parent masqués pour le personnel sans permission.
**API** : `/api/children/*`, `/api/user/children*`.
**Sources** : `backend/routes_postgres/children.js`, `services/childLifecycleService.js`.
