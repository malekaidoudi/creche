# Administration de la crèche

## Comptes
- **Créer un parent / un membre du personnel** : Utilisateurs → Ajouter. Un e-mail contenant un lien (7 jours) est envoyé. « Renvoyer le lien » si expiré.
- **Droits du personnel** : Paramètres du personnel → cocher les droits (voir [permissions-matrix](../02-users-and-roles/permissions-matrix.md)).
- **Affectations** : bébés / enfants / les deux.

## Paramètres de la crèche
Informations bilingues FR/AR (clé, valeur FR, valeur AR, catégorie), vacances annuelles (activation + dates).

## Jours fériés
Liste, création, modification, suppression, synchronisation, jours fériés tunisiens initialisables.

## Statistiques
Tableau de bord (`/api/dashboard/stats`, `/overview`), statistiques générales, rapport de présence, statistiques d'enfants.

## Alertes de paiement
Envoi d'un rappel aux parents + historique (`/api/payment-alerts`) — interface **À vérifier**.

## Sauvegardes
API de création, liste, téléchargement, suppression, restauration + tâche quotidienne (02:00 Tunis). Voir [backup-system](../06-technical/backup-system.md) — **restauration risquée**.

## Journal d'activité
Admin : fil d'activité (`/dashboard/activity-feed`). Développeur : journal technique.
