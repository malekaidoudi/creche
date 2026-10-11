# 05 — Guide de l'Administrateur (Direction)

## Objectif
Décrire les opérations de gestion et de configuration disponibles pour le rôle `admin`, en plus de tout ce qui est accessible au personnel (voir [04_GUIDE_PERSONNEL.md](./04_GUIDE_PERSONNEL.md), dont vous héritez implicitement toutes les permissions).

## 1. Votre mission
Piloter l'établissement : décider des inscriptions, gérer les comptes (parents et personnel), configurer les paramètres généraux, superviser l'activité et les sauvegardes.

## 2. Gérer les inscriptions
1. `/dashboard/pending-enrollments` ou `/dashboard/enrollments` : liste des dossiers reçus.
2. Ouvrir un dossier pour consulter les informations du candidat, de l'enfant et les documents fournis.
3. **Approuver** (`/dashboard/enrollments` → action « Approuver ») : proposer une date de rendez-vous. Le système crée automatiquement le compte parent et déclenche l'envoi d'un e-mail avec lien de création de mot de passe.
4. **Rejeter** : choisir un motif parmi : âge dépassé, maladie contagieuse, dossier incomplet, places complètes, autre (avec raison personnalisée). Un e-mail explicatif est envoyé au candidat.
5. **Demander des documents manquants** : déclenche un e-mail avec lien de téléversement dédié.
6. Historique et statistiques des inscriptions : `/dashboard/enrollments/history`, `/stats`.

## 3. Gérer les comptes utilisateurs
- **Créer un parent** ou **créer un membre du personnel** : `/dashboard/add-user`. La création d'un compte `staff` déclenche automatiquement l'attribution des permissions communes.
- **Lister les parents** (`/dashboard/parents`) / **le personnel** (`/dashboard/staff`).
- **Modifier/suspendre/réactiver** un enfant : via la fiche enfant (`/dashboard/children`), actions réservées à l'administrateur pour la suspension/réactivation d'un dossier.
- **Supprimer un utilisateur** : action irréversible, réservée `admin`/`developer`.
- **Gérer les permissions individuelles du personnel** : depuis la fiche d'un membre du personnel, ouvrir la gestion des accès (modale dédiée) et cocher/décocher chaque permission du catalogue.

## 4. Paramétrer la crèche
`/dashboard/settings` : nom, adresse, téléphone, e-mail de contact, horaires d'ouverture (y compris le samedi), capacité, période de vacances annuelle — toutes les valeurs sont bilingues (français/arabe).

## 5. Superviser l'activité
- **Statistiques générales** (`/dashboard/general-stats`) et **rapport de présence** (`/dashboard/attendance-report`).
- **Fil d'activité agrégé** (`/dashboard/activity-feed`) : vue consolidée des actions récentes.
- **Boîte de réception des messages de contact** (`/dashboard/mailbox`) : répondre aux messages envoyés via le formulaire public, changer leur statut.
- **Modération des témoignages** (`/dashboard/testimonials`) : approuver, rejeter, mettre en avant un témoignage parent.

## 6. Sauvegardes
Depuis les paramètres (gestionnaire de sauvegarde) : déclencher une sauvegarde manuelle, lister les sauvegardes existantes, télécharger ou restaurer une sauvegarde. Une sauvegarde automatique a lieu chaque nuit à 02h00, sans action de votre part.

## 7. Ce que vous ne pouvez PAS faire (réservé au rôle `developer`)
- Accéder au **journal d'activité technique** (`/dashboard/activity-logs`) : traçabilité détaillée, alertes de sécurité, rapports périodiques.
- Accéder à l'**explorateur de stockage Cloudinary** (`/dashboard/storage`).

Ces deux restrictions sont une particularité confirmée du système : même en tant qu'administrateur, ces deux pages précises vous resteront inaccessibles si votre compte n'a pas le rôle technique `developer` (voir [11_AUTORISATION_ET_PERMISSIONS.md](./11_AUTORISATION_ET_PERMISSIONS.md)).

## 8. Restrictions sur les données
Vous avez accès à l'ensemble des données de tous les enfants et parents (pas de restriction de propriété comme pour un parent). Cet accès large doit être exercé avec discernement : toute action de modification/suppression est tracée dans le journal d'activité technique.

## 9. Différences avec le personnel
Contrairement au personnel, vous n'avez pas besoin d'activer de permission individuelle : vous en disposez automatiquement de toutes. Vous seul (avec le développeur) pouvez créer des comptes, gérer les paramètres globaux, approuver/rejeter une inscription, et gérer les sauvegardes.

## 10. Parcours utilisateur courant (exemple)
1. Connexion → Tableau de bord → consultation des nouvelles inscriptions en attente.
2. Étude d'un dossier, vérification des documents.
3. Approbation avec proposition de rendez-vous.
4. Suivi du rendez-vous (confirmé/reprogrammé par le parent).
5. Après le rendez-vous : clôture du rendez-vous, l'enfant apparaît dans la liste des enfants actifs.

## 11. Limites connues
- La suppression d'un enfant ou d'un utilisateur entraîne, au niveau de la base de données, la suppression en cascade de son historique associé (présences, rapports, documents) — à utiliser avec prudence (voir [12_MODELE_DONNEES.md](./12_MODELE_DONNEES.md) §6).
- Certaines tables historiques signalées obsolètes par un audit interne (`contacts`, `documents`, `uploads`) restent présentes en base sans impact direct sur votre usage quotidien de l'interface.
