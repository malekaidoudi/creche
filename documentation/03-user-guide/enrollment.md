# Inscription et approbation

## Demander une inscription (famille)
- **Objectif** : inscrire un enfant.
- **Qui** : toute personne (page publique `/inscription`, sans compte).
- **Prérequis** : informations du parent et de l'enfant ; documents à joindre ensuite.
- **Comment** : remplir le formulaire → l'application vérifie si l'enfant ou l'e-mail existe déjà → envoi. Les documents peuvent être déposés ensuite (page « Déposer des documents »). Le suivi se fait par numéro de dossier + e-mail.
- **Résultat** : dossier « en attente », e-mail de confirmation, tâche créée pour la direction.
- **Erreurs** : doublon enfant/e-mail ; champs obligatoires manquants.

## Traiter un dossier (administration)
- **Qui** : administrateur (et développeur).
- **Comment** : Inscriptions → En attente → ouvrir le dossier → **Approuver** (en proposant une date de rendez-vous) ou **Rejeter**.
- **Approuver** : un compte parent est créé, un e-mail d'acceptation est envoyé avec le lien de création de mot de passe, un rendez-vous est proposé ; statut « en cours ».
- **Rejeter** : motifs prévus : âge dépassé, maladie contagieuse, dossier manquant, autre. E-mail envoyé (« dossier incomplet » ou « refus »).
- **Statuts** : en attente, en cours, approuvé, rejeté (incomplet), rejeté (supprimé), archivé.

## Ajouter un enfant (parent déjà inscrit)
Mon espace → « Ajouter un enfant » (rôle parent uniquement).

## Cas particuliers / limites
- Après échecs répétés de rendez-vous, l'archivage prévu dans le code n'est pas raccordé à une route (**partiel**).
- Pas de paiement en ligne ni de contrat signé électroniquement dans le code analysé.

Voir [workflows](../05-workflows/workflows-overview.md), [appointments](appointments.md).
