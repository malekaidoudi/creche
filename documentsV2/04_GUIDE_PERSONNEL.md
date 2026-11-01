# 04 — Guide du Personnel (éducatrice/staff)

## Objectif
Décrire ce qu'un membre du personnel (rôle `staff`) peut faire, en distinguant ce qui est **commun à tout le personnel** et ce qui dépend des **permissions individuelles** activées par la direction.

## 1. Votre mission
Assurer le suivi quotidien des enfants qui vous sont confiés : présences, bilans journaliers, santé, communication avec les familles, selon les droits qui vous ont été accordés par la direction.

## 2. Comprendre vos permissions
Votre compte dispose automatiquement, dès sa création, des **permissions communes** (voir tableau ci-dessous). Les permissions supplémentaires doivent être **activées individuellement par un administrateur** (page de gestion du personnel, modale de permissions). Vous pouvez consulter vos propres droits : ils déterminent les boutons et sections visibles dans votre interface.

| Permission | Accordée par défaut ? | Ce qu'elle vous permet |
|---|---|---|
| Consulter le dossier médical | ✅ Oui | Voir allergies, médecin, groupe sanguin d'un enfant |
| Administrer les traitements | ❌ Non | Confirmer l'administration d'un médicament prescrit |
| Enregistrer les présences | ✅ Oui | Pointer les arrivées/départs |
| Rédiger les bilans journaliers & fournitures | ✅ Oui | Remplir le bilan du jour d'un enfant, suivre les stocks de couches/lingettes |
| Publier des activités & photos | ✅ Oui | Partager une publication sur le fil pédagogique |
| Modifier la photo de profil d'un enfant | ❌ Non | Mettre à jour la photo d'un enfant |
| Voir les téléphones des parents | ❌ Non | Afficher les numéros de téléphone |
| Voir les e-mails des parents | ❌ Non | Afficher les adresses e-mail |
| Consulter les documents administratifs de l'enfant | ❌ Non | Voir actes de naissance, certificats, etc. |
| Échanger des messages avec les parents | ❌ Non | Ouvrir une conversation avec un parent |
| Consulter les annonces internes | ✅ Oui | Lire les communications officielles |
| Consulter le planning de l'équipe | ✅ Oui | Voir le planning/répartition |
| Traiter les signalements d'absence | ❌ Non | Accepter/rejeter une déclaration d'absence |
| Gérer les tâches internes | ❌ Non | Créer/modifier/supprimer des tâches d'équipe |

Si une action vous semble manquante, demandez à un administrateur de l'activer pour votre compte — **n'essayez pas de contourner via l'API directement** : certaines routes backend imposent déjà le contrôle serveur correspondant (voir [11_AUTORISATION_ET_PERMISSIONS.md](./11_AUTORISATION_ET_PERMISSIONS.md) pour les cas où ce n'est pas encore le cas).

## 3. Opérations quotidiennes communes

### 3.1 Enregistrer une présence
`/dashboard/attendance` → sélectionner l'enfant → « Enregistrer l'arrivée » / « Enregistrer le départ ». Nécessite la permission « Enregistrer les présences ».

### 3.2 Rédiger le bilan journalier d'un enfant
`/dashboard/daily-reports` → sélectionner l'enfant et la date → renseigner repas, sommeil, changes, observations, température si besoin → enregistrer (brouillon ou finalisé). Visible ensuite par le parent concerné.

### 3.3 Administrer un traitement médical
`/dashboard/treatments` → liste des traitements du jour → confirmer l'administration (heure, notes). Nécessite le rôle `staff` **et** la permission « Administrer les traitements ».

### 3.4 Gérer les absences signalées
`/dashboard/absence-management` → consulter les demandes des parents → accepter/rejeter avec note. Nécessite la permission « Traiter les signalements d'absence ».

### 3.5 Publier une activité
`/dashboard/activities` → créer une publication (texte + photos/vidéos, jusqu'à plusieurs fichiers). Nécessite la permission « Publier des activités & photos ».

### 3.6 Consulter le planning
`/dashboard/planning*` : vue hebdomadaire ou mensuelle, accessible à tout le personnel.

### 3.7 Gérer vos tâches personnelles
`/dashboard/tasks` : consultation de vos tâches assignées toujours possible ; création/modification réservée aux détenteurs de la permission « Gérer les tâches internes ».

### 3.8 Communiquer avec un parent
`/dashboard/messages`, `/dashboard/staff/send-message` : nécessite la permission « Échanger des messages avec les parents ».

### 3.9 Préparer une célébration d'anniversaire & Déposer les photos souvenirs
1. **Accès et suivi** :
   - Fiche dédiée accessible depuis le calendrier de la crèche, les alertes dashboard ou l'URL `/dashboard/children/:id/birthday` (badge distinctif « 👩‍🏫 VUE STAFF ASSIGNÉ À LA PRÉPARATION »).
   - Une tâche interne d'organisation vous est automatiquement attribuée par la direction dès que les parents confirment la fête (contenant prénom, âge fêté, numéro de contact parent, heure du goûter 15h30).
2. **Vérification sanitaire et allergies** :
   - Avant de couper ou de servir le gâteau apporté par la famille, consultation obligatoire des fiches médicales et allergies signalées pour tous les enfants de la section.
3. **Gestion du statut de la tâche** :
   - Une fois la fête d'anniversaire terminée et rangée, vous pouvez valider la tâche via le bouton « Terminer ».
4. **Dépôt des photos souvenirs (Jour J)** :
   - Le formulaire de dépôt de photos est activé le Jour J de la célébration (sécurisé contre les dépôts anticipés).
   - Vous pouvez sélectionner plusieurs photos simultanément (JPG, PNG, WebP), vérifier leur prévisualisation et ajouter une légende festive (ex: « Omar souffle ses 4 bougies 🎂 »).
   - Les photos déposées alimentent instantanément le **Diaporama Souvenir (actif 30 jours)** de la famille et peuvent être publiées d'un clic dans le fil d'activités pédagogiques de la crèche (`/activites`).

## 4. Ce qui vous est interdit (par rôle, indépendamment des permissions)
- Créer, approuver ou rejeter une inscription.
- Créer un compte utilisateur (parent ou personnel) ou modifier les permissions d'un collègue.
- Accéder aux pages de paramètres de la crèche, aux statistiques générales, à la liste des parents/du personnel, aux sauvegardes.
- Accéder au journal d'activité technique ou à l'explorateur de stockage (réservés au rôle `developer`).

## 5. Restrictions sur les données
Même avec toutes les permissions activées, vous ne pouvez pas :
- Modifier le rôle d'un utilisateur.
- Supprimer définitivement un enfant ou un dossier d'inscription (réservé `admin`).
- Voir les informations d'un enfant si vous n'avez pas la permission correspondante (ex. téléphone, documents), même si vous avez accès à sa fiche générale.

## 6. Différences avec la direction (`admin`/`developer`)
La direction possède **toutes** les permissions implicitement et accède en plus à la gestion des utilisateurs, des paramètres, des sauvegardes et des statistiques globales. Voir [05_GUIDE_ADMINISTRATEUR.md](./05_GUIDE_ADMINISTRATEUR.md).

## 7. Limites connues
- L'activation d'une permission individuelle prend effet rapidement mais un cache de courte durée (quelques secondes) côté serveur peut retarder légèrement sa prise en compte (voir [11_AUTORISATION_ET_PERMISSIONS.md](./11_AUTORISATION_ET_PERMISSIONS.md)).
