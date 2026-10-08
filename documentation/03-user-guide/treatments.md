# Traitements médicaux

- **Objectif** : programmer et tracer l'administration de médicaments.
- **Qui** : création/modification/annulation : utilisateurs authentifiés selon contrôles du contrôleur (**À vérifier dans `treatmentsController`**) ; liste du jour et administration : personnel, administration (et rôle `direction` cité dans la route, qui n'existe pas dans les rôles réels) ; parents : traitements de leurs enfants.
- **Comment** : Traitements → créer un traitement (enfant, médicament, dose, horaires) → le personnel voit « Aujourd'hui » → **Administrer** (trace : qui, quand).
- **Résultat** : historique des administrations (`/:id/history`).
- **Automatique** : une tâche planifiée vérifie toutes les 2 h (7h–19h, lundi–samedi, fuseau Tunis) les doses à venir et notifie.
- **Limites** : les tables sont créées par le contrôleur, absentes du schéma central et des sauvegardes.
