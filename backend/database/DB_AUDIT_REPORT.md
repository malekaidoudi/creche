# 📊 RAPPORT D'AUDIT BASE DE DONNÉES
**Crèche Mima Elghalia**  
**Date:** 30 Novembre 2025

---

## 📋 RÉSUMÉ

| Métrique | Valeur |
|----------|--------|
| **Tables en DB** | 28 |
| **Tables utilisées dans le code** | ~25 |
| **Tables potentiellement inutilisées** | 3-5 |
| **Colonnes totales** | ~350 |

---

## 🔴 TABLES POTENTIELLEMENT À SUPPRIMER

Ces tables existent en base de données mais ne semblent pas être utilisées dans le code:

### 1. `contacts` (DOUBLON)
- **Raison:** Duplique `contact_messages`
- **Colonnes:** id, first_name, last_name, email, subject, message, status, created_at
- **Recommandation:** ⚠️ SUPPRIMER si `contact_messages` suffit

### 2. `documents` 
- **Raison:** Non utilisé dans le code, remplacé par `enrollment_documents` et `children_documents`
- **Colonnes:** id, name, file_path, category, uploaded_by, created_at
- **Recommandation:** ⚠️ SUPPRIMER

### 3. `uploads`
- **Raison:** Non utilisé, le système utilise Cloudinary
- **Colonnes:** id, original_name, filename, file_path, file_size, mime_type, uploaded_by, created_at
- **Recommandation:** ⚠️ SUPPRIMER

### 4. `enrollments_archive`
- **Raison:** Table d'archive non utilisée activement
- **Colonnes:** Copie de `enrollments` avec colonnes anciennes
- **Recommandation:** ⚠️ Vérifier si utilisé pour archivage, sinon SUPPRIMER

---

## 🟠 COLONNES OBSOLÈTES À SUPPRIMER

### Table `enrollments`
Les colonnes suivantes sont obsolètes car les RDV sont maintenant dans `appointments`:

| Colonne | Raison | Action |
|---------|--------|--------|
| `appointment_date` | Migré vers `appointments.proposed_date` | 🗑️ SUPPRIMER |
| `appointment_time` | Non utilisé | 🗑️ SUPPRIMER |
| `parent_chose_rdv` | Remplacé par `appointments.status` | 🗑️ SUPPRIMER |
| `parent_rdv_choice_date` | Remplacé par `appointments.confirmed_date` | 🗑️ SUPPRIMER |

### Table `tasks`
Colonnes qui font doublon avec `appointments`:

| Colonne | Raison | Action |
|---------|--------|--------|
| `parent_name` | Info dénormalisée non utilisée | ⚠️ Vérifier |
| `parent_email` | Info dénormalisée non utilisée | ⚠️ Vérifier |
| `parent_phone` | Info dénormalisée non utilisée | ⚠️ Vérifier |
| `child_name` | Info dénormalisée non utilisée | ⚠️ Vérifier |
| `is_confirmed` | Non utilisé | 🗑️ SUPPRIMER |
| `confirmed_at` | Non utilisé | 🗑️ SUPPRIMER |
| `original_date` | Non utilisé | 🗑️ SUPPRIMER |
| `reschedule_count` | Non utilisé | 🗑️ SUPPRIMER |

---

## ✅ TABLES ACTIVES ET UTILISÉES

### Tables Principales (Critiques)
1. **`users`** - Utilisateurs (admin, staff, parent)
2. **`children`** - Enfants inscrits
3. **`enrollments`** - Dossiers d'inscription
4. **`appointments`** - Rendez-vous (nouvelle table principale)
5. **`attendance`** - Présences quotidiennes
6. **`enrollment_documents`** - Documents d'inscription

### Tables Secondaires (Fonctionnelles)
7. **`activities`** - Publications/Actualités
8. **`activity_comments`** - Commentaires sur activités
9. **`activity_reactions`** - Réactions (likes)
10. **`holidays`** - Jours fériés
11. **`nursery_settings`** - Paramètres crèche
12. **`tasks`** - Tâches quotidiennes
13. **`logs`** - Journal d'activité
14. **`notifications`** - Notifications utilisateurs

### Tables Communication
15. **`contact_messages`** - Messages du formulaire contact
16. **`email_logs`** - Historique emails envoyés
17. **`absence_requests`** - Demandes d'absence
18. **`announcements`** - Annonces/Événements

### Tables Avancées (Événements)
19. **`events`** - Système d'événements
20. **`event_comments`** - Commentaires événements
21. **`event_history`** - Historique modifications
22. **`event_reminders`** - Rappels événements
23. **`personal_memos`** - Mémos personnels
24. **`staff_messages`** - Messages internes staff
25. **`payment_reminders`** - Rappels de paiement

---

## 🔧 SCRIPT DE NETTOYAGE

```sql
-- ============================================================
-- SCRIPT DE NETTOYAGE BASE DE DONNÉES
-- ⚠️ EXÉCUTER AVEC PRÉCAUTION - FAIRE UN BACKUP AVANT
-- ============================================================

-- 1. SUPPRIMER LES TABLES INUTILISÉES
DROP TABLE IF EXISTS contacts CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS uploads CASCADE;
-- DROP TABLE IF EXISTS enrollments_archive CASCADE; -- Décommenter si confirmé

-- 2. SUPPRIMER LES COLONNES OBSOLÈTES DE enrollments
ALTER TABLE enrollments DROP COLUMN IF EXISTS appointment_date;
ALTER TABLE enrollments DROP COLUMN IF EXISTS appointment_time;
ALTER TABLE enrollments DROP COLUMN IF EXISTS parent_chose_rdv;
ALTER TABLE enrollments DROP COLUMN IF EXISTS parent_rdv_choice_date;

-- 3. SUPPRIMER LES COLONNES INUTILISÉES DE tasks
ALTER TABLE tasks DROP COLUMN IF EXISTS parent_name;
ALTER TABLE tasks DROP COLUMN IF EXISTS parent_email;
ALTER TABLE tasks DROP COLUMN IF EXISTS parent_phone;
ALTER TABLE tasks DROP COLUMN IF EXISTS child_name;
ALTER TABLE tasks DROP COLUMN IF EXISTS is_confirmed;
ALTER TABLE tasks DROP COLUMN IF EXISTS confirmed_at;
ALTER TABLE tasks DROP COLUMN IF EXISTS original_date;
ALTER TABLE tasks DROP COLUMN IF EXISTS reschedule_count;

-- 4. VÉRIFICATION
SELECT table_name, COUNT(*) as column_count
FROM information_schema.columns
WHERE table_schema = 'public'
GROUP BY table_name
ORDER BY table_name;
```

---

## 📊 STRUCTURE RECOMMANDÉE

### Après Nettoyage: 24-25 tables au lieu de 28

```
TABLES PRINCIPALES:
├── users (13 colonnes)
├── children (13 colonnes)
├── enrollments (~25 colonnes après nettoyage)
├── appointments (27 colonnes)
├── attendance (8 colonnes)
└── enrollment_documents (16 colonnes)

GESTION QUOTIDIENNE:
├── tasks (~12 colonnes après nettoyage)
├── holidays (6 colonnes)
├── logs (5 colonnes)
├── notifications (8 colonnes)
└── nursery_settings (11 colonnes)

ACTIVITÉS/COMMUNICATION:
├── activities (13 colonnes)
├── activity_comments (8 colonnes)
├── activity_reactions (5 colonnes)
├── announcements (11 colonnes)
├── contact_messages (10 colonnes)
├── email_logs (10 colonnes)
└── absence_requests (11 colonnes)

ÉVÉNEMENTS AVANCÉS:
├── events (29 colonnes)
├── event_comments (8 colonnes)
├── event_history (9 colonnes)
├── event_reminders (10 colonnes)
├── personal_memos (8 colonnes)
├── staff_messages (9 colonnes)
└── payment_reminders (10 colonnes)

DOCUMENTS:
├── enrollment_documents (16 colonnes)
└── children_documents (12 colonnes)
```

---

## ⚠️ AVANT DE SUPPRIMER

1. **FAIRE UN BACKUP COMPLET** de la base de données
2. Vérifier que les données dans les tables à supprimer ne sont pas nécessaires
3. Tester le script sur un environnement de développement d'abord
4. Vérifier que l'application fonctionne après chaque modification

---

## 📝 NOTES

- Le script d'audit peut avoir des faux positifs pour les colonnes utilisées dynamiquement
- Certaines tables peuvent être utilisées pour des fonctionnalités futures
- La table `enrollments_archive` peut être utile pour l'historique - vérifier avant suppression
