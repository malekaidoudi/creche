# Entité : Traitement médical

**Tables** : `child_treatments`, `treatment_administrations` (créées par `treatmentsController`).
**Attributs** : enfant, médicament, dose, fréquence/horaires, dates, statut (annulé par `DELETE /:id`), administrations (qui, quand) — colonnes exactes **À vérifier**.
**Cycle** : créé → actif → administré (n fois) → annulé/terminé.
**Qui** : lecture du jour/administration : staff/admin ; parents : `my-children`.
**Automatique** : cron toutes les 2 h (7h–19h, lun–sam, Africa/Tunis) → `POST /check-notifications` (route de vérification manuelle).
**API** : `/api/treatments/*`.
**Limites** : hors schéma central et hors sauvegardes.
