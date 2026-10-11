# 06 — Guide du Développeur (en tant qu'utilisateur de l'application)

## Objectif
Décrire l'usage du rôle `developer` **du point de vue utilisateur de l'interface** (et non du point de vue codeur du projet — pour cela, voir la section développeur technique, [09](./09_ARCHITECTURE_TECHNIQUE.md) à [24](./24_REFERENCES_CODE.md)).

## 1. Votre mission
Le rôle `developer` combine deux casquettes confirmées par le code :
1. Toutes les capacités de la **direction** (`admin`), puisque le backend traite `developer` comme un alias d'`admin` pour la quasi-totalité des contrôles (voir [11_AUTORISATION_ET_PERMISSIONS.md](./11_AUTORISATION_ET_PERMISSIONS.md)).
2. Un accès à des **pages techniques exclusives**, non accessibles même à un compte `admin` qui n'aurait pas ce rôle.

## 2. Fonctions métier (identiques à l'administrateur)
Voir l'intégralité du [05_GUIDE_ADMINISTRATEUR.md](./05_GUIDE_ADMINISTRATEUR.md) : gestion des inscriptions, des comptes, des paramètres, des sauvegardes, supervision.

## 3. Fonctions techniques exclusives

### 3.1 Journal d'activité technique (`/dashboard/activity-logs`)
- Tableau de bord dédié : nombre d'événements, répartition par catégorie/sévérité.
- Recherche et filtrage de tous les événements tracés (connexions, créations de compte, décisions d'inscription, échecs d'envoi d'e-mail...).
- **Alertes** : consultation, accusé de réception, résolution ou classement sans suite des alertes automatiques (ex. échec critique d'envoi d'e-mail).
- **Rapports périodiques** : génération de rapports journaliers, hebdomadaires, mensuels, exportables, avec historique des rapports déjà générés.
- **Archivage et nettoyage** : ces deux actions spécifiques (`/archive`, `/cleanup`) sont en réalité accessibles à `admin` également côté API (voir [11_AUTORISATION_ET_PERMISSIONS.md](./11_AUTORISATION_ET_PERMISSIONS.md)), mais la page qui les expose n'est, elle, visible que pour `developer`.

### 3.2 Explorateur de stockage (`/dashboard/storage`)
- Statistiques d'usage Cloudinary (quota, volume).
- Navigation dans l'arborescence des dossiers de fichiers stockés (enfants, inscriptions, archives).
- Recherche de ressources, déplacement/copie/renommage de fichiers ou dossiers, suppression.
- **Point de vigilance** : côté API, ce module est accessible à `admin` **et** `developer` (`requireRole('admin', 'developer')` dans `cloudinaryExplorer.js`) ; c'est uniquement la **page** du tableau de bord qui est masquée à un `admin` sans rôle `developer`. Un `admin` techniquement averti pourrait donc appeler ces endpoints directement — point à clarifier avec l'équipe produit si cette asymétrie est volontaire.

## 4. Ce qui reste interdit même au développeur
- Aucune action destructive supplémentaire n'est débloquée par le rôle `developer` au-delà de ce que permet déjà `admin` (pas de suppression de base de données, pas d'accès direct au serveur depuis l'interface).

## 5. Parcours courant
1. Suivi quotidien identique à la direction.
2. Vérification périodique du journal d'activité (alertes actives, anomalies de connexion).
3. Nettoyage/export des rapports de journal selon les besoins de conformité interne.
4. Supervision de l'espace de stockage Cloudinary (quota, organisation des dossiers).

## 6. Limites connues
- Le rôle `developer` tel qu'implémenté est un rôle **opérationnel avec accès technique élargi**, pas un rôle de « super-administrateur système » au sens infrastructure (pas d'accès serveur, base de données ou variables d'environnement depuis l'interface).
