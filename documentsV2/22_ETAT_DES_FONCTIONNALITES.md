# 22 — État des fonctionnalités

## Objectif
Synthèse transversale de la maturité de chaque grande fonctionnalité, en consolidant les constats des autres documents.

| Fonctionnalité | Statut | Confiance | Détail |
|---|---|---|---|
| Authentification JWT + révocation serveur | Implémentée | Élevée | [10](./10_AUTHENTIFICATION.md) |
| Inscription publique (workflow complet 4 phases) | Implémentée | Élevée | [21](./21_FLUX_METIER.md) |
| Permissions granulaires du personnel | Implémentée | Élevée | [11](./11_AUTORISATION_ET_PERMISSIONS.md) |
| Présences quotidiennes | Implémentée | Élevée | [21](./21_FLUX_METIER.md) |
| Bilans journaliers | Implémentée | Élevée | [13](./13_DICTIONNAIRE_DONNEES.md) |
| Traitements médicaux | Implémentée | Élevée | [21](./21_FLUX_METIER.md) |
| Messagerie interne parent/personnel | Implémentée | Moyenne (contrôle d'accès par permission incomplet côté backend, voir [17](./17_MESSAGERIE_ET_NOTIFICATIONS.md)) | — |
| Notifications in-app | Implémentée | Moyenne (événements déclencheurs non tous audités) | [17](./17_MESSAGERIE_ET_NOTIFICATIONS.md) |
| E-mails transactionnels (Resend/SMTP) | Implémentée | Élevée | [17](./17_MESSAGERIE_ET_NOTIFICATIONS.md) |
| Stockage de fichiers Cloudinary | Implémentée | Élevée, avec réserve sur l'usage résiduel du stockage disque local | [16](./16_STOCKAGE_FICHIERS.md) |
| Fil d'activités pédagogiques | Implémentée | Page protégée par `ProtectedRoute` depuis correction du 11/10/2026 (`corrections.md`, Fiche 58), cohérente avec l'API | [07](./07_CATALOGUE_FONCTIONNALITES.md) |
| Témoignages avec modération | Implémentée | Élevée | [13](./13_DICTIONNAIRE_DONNEES.md) |
| Gestion des permissions individuelles (UI admin) | Implémentée | Élevée | [04](./04_GUIDE_PERSONNEL.md), [05](./05_GUIDE_ADMINISTRATEUR.md) |
| Sauvegardes automatiques + manuelles | Implémentée | Moyenne (contenu exact du job non audité en détail) | [19](./19_TESTS_DEPLOIEMENT_MAINTENANCE.md) |
| Récupération d'urgence par clé | Implémentée | Moyenne (sécurité de la clé non auditée en profondeur) | [19](./19_TESTS_DEPLOIEMENT_MAINTENANCE.md) |
| Journal d'activité technique + alertes | Implémentée | Élevée (routes et catégories confirmées), contenu exact des règles d'alerte non audité | [14](./14_API_REST.md) |
| Internationalisation FR/AR + RTL | Implémentée | Élevée | [01](./01_PRESENTATION_PROJET.md) |
| Thème clair/sombre | Implémentée | Élevée | [01](./01_PRESENTATION_PROJET.md) |
| Multi-tenant (plusieurs crèches) | **Absente** | — | Document de planification uniquement (`docs/MULTI_TENANT_PLAN.md`) |
| Connexion sociale (OAuth) | **Absente** | — | Document de planification uniquement (`docs/PRD_OAUTH_SOCIAL_LOGIN.md`) |
| Application mobile native | **Absente** | — | Adaptation responsive web uniquement (`components/mobile/`) |
| Renouvellement automatique de session (refresh token) | **Absente** | — | [10](./10_AUTHENTIFICATION.md) |
| Nettoyage des tables/colonnes obsolètes (`contacts`, `documents`, `uploads`, colonnes `enrollments`/`tasks` signalées) | **Non réalisé** | L'audit interne (`DB_AUDIT_REPORT.md`) recommande un nettoyage non exécuté à ce jour | [12](./12_MODELE_DONNEES.md) |
| Tests automatisés couvrant les parcours métier principaux | Partiellement implémentée | Couverture Jest/Vitest limitée à quelques modules | [19](./19_TESTS_DEPLOIEMENT_MAINTENANCE.md) |
| Pipeline CI de tests avant déploiement | **Absente** | Le seul workflow GitHub Actions trouvé déploie sans exécuter de tests | [19](./19_TESTS_DEPLOIEMENT_MAINTENANCE.md) |

## Légende de confiance
- **Élevée** : code lu et recoupé avec au moins deux sources (route + table, ou route + frontend).
- **Moyenne** : fonctionnalité confirmée mais certains détails internes non audités ligne à ligne.
- **—** : non applicable (fonctionnalité absente).
