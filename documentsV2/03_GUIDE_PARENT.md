# 03 — Guide du Parent

## Objectif
Décrire, étape par étape, ce qu'un parent peut faire dans l'application, en se basant sur les routes et composants réellement implémentés (`frontend/src/pages/parent/`, `frontend/src/routes/AppRoutes.jsx`).

## 1. Votre mission dans l'application
Suivre la vie de votre/vos enfant(s) à la crèche : présence, bilans journaliers, santé, communication avec le personnel, et gérer les démarches liées à leur inscription.

## 2. Votre périmètre d'accès
Vous accédez uniquement :
- à votre propre profil (`/profile`) ;
- aux enfants qui vous sont rattachés (en tant que parent approuvé) ;
- à l'espace « Mon Espace » (`/mon-espace/*`).
Vous **n'avez pas accès** au tableau de bord (`/dashboard/*`), réservé au personnel et à la direction. Si vous tentez d'accéder à une URL du tableau de bord directement, une page « Accès interdit » s'affiche (voir [11_AUTORISATION_ET_PERMISSIONS.md](./11_AUTORISATION_ET_PERMISSIONS.md)).

## 3. Inscrire un enfant

### 3.1 Première inscription (sans compte)
1. Depuis la page d'accueil, ouvrir **« Inscription »** (`/inscription`).
2. Renseigner vos informations (candidat) et celles de l'enfant (prénom, nom, date de naissance, sexe, informations médicales, contact d'urgence).
3. Le formulaire vérifie en temps réel si un dossier existe déjà pour un enfant portant le même nom/prénom/date de naissance, pour éviter les doublons.
4. Téléverser les documents requis (carnet médical, acte de naissance, certificat médical).
5. Accepter le règlement intérieur si demandé.
6. Valider la soumission : un e-mail de confirmation de réception est envoyé à l'adresse indiquée.
7. La direction étudie le dossier et peut : l'approuver (avec proposition de rendez-vous), demander des documents manquants, ou le rejeter (avec motif).
8. **Si approuvé** : vous recevez un e-mail avec un lien pour créer votre mot de passe (`/create-password`) et accéder à votre espace.
9. **Si documents manquants** : un e-mail vous invite à les téléverser via un lien dédié (`/upload-documents`).
10. **Si rejeté** : un e-mail vous informe du motif.

### 3.2 Ajouter un deuxième enfant à un compte déjà existant
Depuis « Mon Espace », menu **« Ajouter un enfant »** (`/mon-espace/ajouter-enfant`).

## 4. Consulter les informations de votre enfant
- **Détails de l'enfant** : `/mon-espace/child/:id/details`.
- **Fiche médicale** : `/mon-espace/child/:id/medical` — allergies, médecin traitant, groupe sanguin, traitements en cours.
- **Contacts d'urgence** : `/mon-espace/child/:id/emergency-contacts` — personnes autorisées à récupérer votre enfant.
- **Bilans journaliers** : `/mon-espace/daily-reports` — repas, sommeil, changes, observations du jour rédigés par le personnel.
- **Présences** : `/mon-espace/attendance-report` — historique des arrivées/départs.

**Confidentialité** : seules les informations de vos propres enfants vous sont accessibles ; les données d'autres familles ne sont jamais exposées à votre compte (contrôle vérifié côté serveur, pas seulement côté affichage — voir [11_AUTORISATION_ET_PERMISSIONS.md](./11_AUTORISATION_ET_PERMISSIONS.md)).

## 5. Déclarer une absence
1. « Mon Espace » → **« Déclarer une absence »** (`/mon-espace/absence-request`).
2. Indiquer la période (date de début/fin) et le motif.
3. Le personnel traite votre demande (acceptée/rejetée) ; vous êtes notifié du résultat.

## 6. Gérer les traitements médicaux de votre enfant
1. « Mon Espace » → **« Traitements »** (`/mon-espace/treatments`).
2. Créer un traitement : nom du médicament, dose, planning (intervalle régulier ou heures précises), dates de début/fin.
3. Le personnel habilité administre le traitement selon le planning et confirme chaque administration.
4. Vous pouvez modifier ou annuler un traitement tant qu'il est actif.

## 7. Communiquer avec la crèche
- **Messagerie** (`/mon-espace/messages`) : échanger directement avec un membre du personnel ou la direction.
- **Annonces** (`/mon-espace/announcements`) : consulter les communications officielles de la crèche.
- **Formulaire de contact public** (`/contact`) : pour une question générale, sans connexion nécessaire.

## 8. Fil d'activités et vie de la crèche
`/mon-espace/activities` : consulter les photos/vidéos et publications partagées par le personnel sur les activités pédagogiques. Vous pouvez réagir et commenter.

## 9. Calendrier
`/mon-espace/calendar` : vue calendrier des événements/rendez-vous concernant votre enfant.

## 10. Gérer votre profil
`/profile` : modifier vos informations personnelles, votre mot de passe, votre photo de profil.

## 11. Témoignage
Vous pouvez soumettre un témoignage sur votre expérience à la crèche ; il sera publié sur le site public après modération par la direction.

## 12. Ce qui vous est interdit
- Modifier les informations d'un enfant qui ne vous est pas rattaché.
- Accéder au tableau de bord du personnel/direction.
- Voir les coordonnées (téléphone/e-mail) d'autres parents ou les permissions internes du personnel.
- Approuver/rejeter vous-même une inscription (y compris la vôtre) ou modifier le statut de présence directement (saisi par le personnel).

## 13. Limites connues et cas particuliers
- Le parcours exact entre « inscription libre » (`/register`) et « inscription via dossier enfant » (`/inscription`) peut prêter à confusion : privilégiez le formulaire d'inscription d'enfant pour toute nouvelle demande, qui est le parcours métier principal observé dans le code (voir [10_AUTHENTIFICATION.md](./10_AUTHENTIFICATION.md) §4).
- En cas de documents manquants, veillez à utiliser le lien reçu par e-mail avant son expiration.
