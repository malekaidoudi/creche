# Workflow d'Inscription avec RDV

## Vue d'ensemble

Ce document décrit le workflow complet d'inscription à la crèche, depuis la soumission du dossier jusqu'à la finalisation.

**IMPORTANT**: Les inscriptions finalisées (validées ou abandonnées) sont archivées dans `enrollments_archive` puis supprimées de `enrollments`.

## Diagramme du Workflow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         WORKFLOW INSCRIPTION                             │
└─────────────────────────────────────────────────────────────────────────┘

    ┌──────────────┐
    │  Inscription │
    │   soumise    │
    └──────┬───────┘
           │
           ▼
    ┌──────────────┐
    │   PENDING    │  ← Status initial
    │  En attente  │
    └──────┬───────┘
           │
           │ Admin approuve le dossier
           │ + Propose une date de RDV
           ▼
    ┌──────────────┐
    │ IN_PROGRESS  │  ← Dossier approuvé, RDV en attente
    │ RDV en cours │
    └──────┬───────┘
           │
           │ Le jour du RDV arrive
           │
           ├─────────────────────────────────────────┐
           │                                         │
           ▼                                         ▼
    ┌──────────────┐                         ┌──────────────┐
    │  RDV RÉUSSI  │                         │  RDV ÉCHOUÉ  │
    │   (validé)   │                         │   (failed)   │
    └──────┬───────┘                         └──────┬───────┘
           │                                        │
           ▼                                        ├─────────────────┐
    ┌──────────────┐                               │                 │
    │   APPROVED   │  ← Inscription finalisée      ▼                 ▼
    │  Finalisée   │                        ┌─────────────┐   ┌─────────────┐
    └──────────────┘                        │ RESCHEDULE  │   │   ABANDON   │
                                            │ Reprogrammer│   │  Supprimer  │
                                            └──────┬──────┘   └──────┬──────┘
                                                   │                 │
                                                   ▼                 ▼
                                            ┌─────────────┐   ┌─────────────┐
                                            │ IN_PROGRESS │   │  REJECTED   │
                                            │ Nouveau RDV │   │  _DELETED   │
                                            └─────────────┘   └─────────────┘
                                                                     │
                                                                     ▼
                                                              ┌─────────────┐
                                                              │   Compte    │
                                                              │   parent    │
                                                              │   supprimé  │
                                                              └─────────────┘
```

## Statuts des Inscriptions (enrollments.status)

| Status | Description | Actions possibles |
|--------|-------------|-------------------|
| `pending` | Dossier soumis, en attente de traitement | Approuver, Rejeter |
| `in_progress` | Dossier approuvé, RDV programmé | Valider RDV, Marquer échec |
| `approved` | Inscription finalisée (RDV validé) | - |
| `rejected_incomplete` | Rejeté (documents manquants) | - |
| `rejected_deleted` | Abandonné/Supprimé | - |
| `archived` | Archivé | - |

## Statuts des RDV (appointments.status)

| Status | Description |
|--------|-------------|
| `proposed` | RDV proposé par la crèche |
| `confirmed` | RDV confirmé par le parent |
| `rescheduled` | RDV reporté |
| `completed` | RDV effectué avec succès |
| `failed` | RDV échoué |
| `cancelled` | RDV annulé |

## Endpoints API

### Approbation d'un dossier
```
POST /api/enrollments/:id/approve
Body: { appointment_date: "2024-01-15T10:00:00" }

Résultat:
- enrollment.status → 'in_progress'
- Création d'un RDV dans appointments
- Envoi email au parent avec lien création mot de passe
```

### Validation d'un RDV (succès)
```
POST /api/appointments/:id/validate
Body: { staff_notes: "RDV effectué avec succès" }

Résultat:
- appointment.status → 'completed'
- appointment.appointment_outcome → 'success'
- Inscription archivée dans enrollments_archive (status='approved')
- Inscription supprimée de enrollments
```

### Échec d'un RDV avec reprogrammation
```
POST /api/appointments/:id/failed
Body: {
  outcome: "reschedule",
  staff_notes: "Parent absent",
  new_appointment_date: "2024-01-20T14:00:00"
}

Résultat:
- appointment.status → 'failed'
- appointment.appointment_outcome → 'reschedule'
- Création d'un nouveau RDV avec la nouvelle date
- enrollment.failed_appointments_count += 1
- enrollment.active_appointment_id → nouveau RDV
- Inscription RESTE dans enrollments (pas d'archivage)
```

### Échec d'un RDV avec abandon
```
POST /api/appointments/:id/failed
Body: {
  outcome: "abandon",
  staff_notes: "Parent ne répond plus"
}

Résultat:
- appointment.status → 'failed'
- appointment.appointment_outcome → 'abandon'
- Inscription archivée dans enrollments_archive (status='rejected_deleted')
- Inscription supprimée de enrollments
- Suppression du compte parent (si créé)
```

## Colonnes ajoutées

### Table `enrollments`
- `failed_appointments_count` (INTEGER) - Nombre de RDV échoués
- `created_parent_user_id` (INTEGER) - ID du compte parent créé
- `finalized_at` (TIMESTAMP) - Date de finalisation
- `active_appointment_id` (INTEGER) - ID du RDV actif

### Table `appointments`
- `appointment_outcome` (VARCHAR) - Résultat: success, reschedule, abandon

## Frontend

### Composants modifiés
- `EnrollmentsPage.jsx` - Ajout du statut 'in_progress' avec badge bleu
- `TodayAppointments.jsx` - Ajout du bouton d'action pour les RDV d'inscription

### Nouveau composant
- `AppointmentActionModal.jsx` - Modal pour valider/échouer un RDV

## Tests

Pour tester le workflow:

1. **Créer une inscription** via le formulaire public
2. **Approuver le dossier** avec une date de RDV → Status passe à 'in_progress'
3. **Le jour du RDV**, cliquer sur le bouton d'action
4. **Choisir le résultat**:
   - ✅ RDV réussi → Status passe à 'approved'
   - ❌ RDV échoué → Reprogrammer ou Abandonner
