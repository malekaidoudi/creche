# 02 — Guide utilisateur général

## Objectif
Guide de prise en main commun à tous les utilisateurs de l'application, avant de consulter le guide spécifique à votre rôle : [03 Parent](./03_GUIDE_PARENT.md), [04 Personnel](./04_GUIDE_PERSONNEL.md), [05 Administrateur](./05_GUIDE_ADMINISTRATEUR.md), [06 Développeur](./06_GUIDE_DEVELOPPEUR_UTILISATEUR.md).

## 1. Accéder à l'application
L'application est une page web unique, accessible depuis un navigateur (ordinateur, tablette ou téléphone), à l'adresse de production du site (ex. `mima-elghalia.com` ou `mimaelghalia.tn` selon la configuration active, voir [01_PRESENTATION_PROJET.md](./01_PRESENTATION_PROJET.md)). Aucune installation n'est nécessaire.

## 2. Créer un compte / se connecter

| Situation | Comment faire |
|---|---|
| Je suis un parent et je souhaite inscrire mon enfant pour la première fois | Utiliser le formulaire **« Inscription »** accessible depuis la page d'accueil (sans compte au préalable). Après étude et acceptation de votre dossier par la direction, vous recevrez un e-mail avec un lien pour **créer votre mot de passe** et accéder à votre espace. |
| Je suis un parent et j'ai déjà un dossier approuvé | Utiliser le bouton **« Connexion »**, avec l'e-mail renseigné lors de l'inscription et le mot de passe que vous avez créé. |
| Je suis un parent et je veux créer un compte sans passer par une inscription d'enfant | Une page « Inscription » de compte libre existe (`/register`) — **à confirmer avec la direction** si ce parcours est actif pour votre usage, le parcours recommandé restant le formulaire d'inscription d'enfant. |
| Je suis un membre du personnel ou de la direction | Votre compte est créé par un administrateur. Vous recevrez vos identifiants (ou un lien de création de mot de passe) directement de la direction. |
| J'ai oublié mon mot de passe | Cliquer sur **« Mot de passe oublié »** sur l'écran de connexion, renseigner votre e-mail. Si un compte existe, vous recevrez un lien de réinitialisation valable **1 heure**. |

## 3. Se déconnecter
Utiliser le bouton de déconnexion dans le menu du profil (en-tête de l'application). La déconnexion est effective immédiatement côté serveur (le jeton de session est révoqué, pas seulement supprimé du navigateur) — voir [10_AUTHENTIFICATION.md](./10_AUTHENTIFICATION.md).

**Durée de session** : votre connexion reste valide 7 jours par défaut. Passé ce délai, vous serez automatiquement redirigé vers la page d'accueil avec un message « Session expirée » et devrez vous reconnecter. Il n'existe pas de renouvellement automatique silencieux.

## 4. Navigation générale
- **Site public et « Mon Espace »** partagent le même en-tête/pied de page (menu public).
- **Tableau de bord** (personnel/direction) dispose d'un menu latéral dédié, qui peut être réduit ou déplié, et d'une version adaptée pour mobile.
- Un indicateur de chargement (icône animée) s'affiche pendant le chargement d'une page ou d'une donnée.

## 5. Langue et affichage
- **Changer de langue** : sélecteur de langue dans l'en-tête (français / arabe). Le site bascule automatiquement en écriture de droite à gauche (RTL) pour l'arabe. Votre choix est mémorisé pour vos prochaines visites.
- **Changer de thème** : un bouton bascule entre thème clair et thème sombre. Par défaut, l'application utilise la préférence de votre système d'exploitation/navigateur si vous ne l'avez jamais modifiée. Votre choix est mémorisé.

## 6. Recherche et filtres
Les listes principales du tableau de bord (enfants, inscriptions, présences, utilisateurs) disposent de champs de recherche et de filtres (par date, par statut...) directement dans la page concernée. Le détail précis de chaque filtre est documenté dans le guide de votre rôle lorsque pertinent.

## 7. Gestion des erreurs courantes

| Message observé | Signification | Action recommandée |
|---|---|---|
| « Vous n'avez pas les autorisations nécessaires pour accéder à cette fonctionnalité » | Votre rôle ou vos permissions ne couvrent pas cette action | Contacter un administrateur si vous pensez qu'il s'agit d'une erreur |
| « Session expirée, veuillez vous reconnecter » | Votre jeton de connexion a expiré ou a été invalidé | Se reconnecter |
| « Trop de requêtes. Veuillez patienter... » | Un nombre inhabituel de requêtes a été détecté depuis votre connexion | Patienter le délai indiqué puis réessayer |
| « Erreur serveur, veuillez réessayer plus tard » | Problème technique côté serveur | Réessayer plus tard ; signaler au support si persistant |
| « Erreur de connexion, vérifiez votre connexion internet » | Le navigateur n'a pas pu joindre le serveur | Vérifier votre connexion internet |
| Page « 403 » après un clic dans le menu | Vous êtes connecté mais votre rôle ne permet pas cette page | Fonctionnement normal du contrôle d'accès, pas une erreur technique |

## 8. Bonnes pratiques de sécurité pour l'utilisateur
- Ne partagez jamais votre mot de passe ni le lien de création/réinitialisation de mot de passe reçu par e-mail (il est à usage personnel et expire).
- Déconnectez-vous sur un ordinateur partagé.
- En cas de doute sur un e-mail reçu (phishing), vérifiez qu'il provient bien du domaine officiel de la crèche avant de cliquer sur un lien.

## 9. Limites connues
- Pas de renouvellement automatique de session : une déconnexion après 7 jours d'inactivité maximale est normale.
- Pas de connexion via un compte Google/Facebook/autre (fonctionnalité non implémentée à ce jour, voir [07_CATALOGUE_FONCTIONNALITES.md](./07_CATALOGUE_FONCTIONNALITES.md) §E).
