# Guide du rôle Administrateur (direction)

> Public : direction de la crèche. Document non technique.

## Fonctions réservées à l'administration (menu)
| Domaine | Fonctions | Statut |
|---|---|---|
| Inscriptions | Dossiers en attente, tous les dossiers, documents, approuver / rejeter, rendez-vous du jour | ✅ |
| Enfants | Ajouter, modifier, désactiver/supprimer, associer un parent | ✅ |
| Utilisateurs | Liste des parents, du personnel, création de comptes (e-mail avec lien), renvoi du lien | ✅ |
| Droits du personnel | Catalogue et attribution des permissions | ✅ |
| Affectations | Personnel ↔ tranche d'âge (bébés / enfants / les deux) | ✅ |
| Annonces | Créer, publier, supprimer | ✅ |
| Tâches | Créer, assigner, relancer, supprimer | ✅ |
| Rapports | Statistiques générales, rapport de présence | ✅ |
| Fil d'activité | Journal des actions des utilisateurs (`activity-feed`) | ✅ |
| Témoignages | Valider / refuser / mettre en avant | ✅ |
| Paramètres | Informations de la crèche, horaires, vacances annuelles, jours fériés | ✅ |
| Courrier | Messages reçus par le formulaire de contact, réponse par e-mail | ✅ |
| Documents | Documents administratifs, documents des enfants | ✅ |
| Visite virtuelle | Gestion des images | ✅ |
| Alertes de paiement | Envoi + historique (`/api/payment-alerts`) | ⚠️ écran **À vérifier dans le projet** |
| Sauvegardes | API de sauvegarde/restauration | ⚠️ voir [backup-system](../06-technical/backup-system.md) |

Les administrateurs disposent implicitement de **toutes** les permissions.

## Bonnes pratiques recommandées
- Changer immédiatement les mots de passe de comptes de test s'ils existent encore.
- Vérifier que les sauvegardes sont stockées hors du serveur applicatif.
- Lire [security-findings](../09-audit/security-findings.md) avant ouverture au public.
