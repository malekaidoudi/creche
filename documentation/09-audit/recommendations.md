# Recommandations et Plan d'Action Prioritaire

Ce document présente une feuille de route hiérarchisée pour assainir, sécuriser et fiabiliser l'application de gestion de la crèche.

---

## 1. Actions d'Urgence Immédiate (🔴 Priorité Critique - Bloquant avant toute mise en ligne)

1. **Verrouiller les routes d'API non protégées** :
   - `PUT /api/users/:id/password` : Ajouter `authenticateToken` et exiger le mot de passe actuel.
   - `PUT /api/users/:id` et `DELETE /api/users/:id` : Restreindre strictement aux administrateurs.
   - `POST /api/auth/register` : Supprimer la possibilité de choisir le rôle `admin` dans la requête (forcer `parent`).
   - `POST /api/setup/create-admin` : Supprimer ou désactiver immédiatement cette route en production.
   - `PUT /api/nursery-settings/*` : Restreindre toutes les écritures aux administrateurs.
   - `/api/enrollments` : Protéger la consultation intégrale et les actions de validation par authentification admin.
   - Nettoyer les routes orphelines sans authentification dans `attendance.js` et `dailyReports.js`.

2. **Régénération intégrale des secrets et assainissement Git** :
   - Révoquer et renouveler immédiatement les accès PostgreSQL Neon, Cloudinary, Resend / SMTP et la clé `JWT_SECRET`.
   - Ajouter `*.env`, `backend/uploads/` et `backend/backups/` dans `.gitignore`.
   - Supprimer de l'historique Git les documents et dossiers médicaux des enfants actuellement versionnés dans `backend/uploads/documents/`.

---

## 2. Actions à Court Terme (🟠 Priorité Élevée)

1. **Centralisation et alignement du schéma de base de données** :
   - Mettre en place un outil de migrations formel (ex: Prisma, Knex ou Umzug).
   - Unifier la création des tables dispersées (`child_treatments`, `permissions`, `admin_documents`).
   - Mettre à jour `init_database.js` pour intégrer le rôle `developer` et la structure réelle de `nursery_settings`.
2. **Harmonisation des permissions** :
   - Aligner les 19 permissions du catalogue avec les routes d'API backend réelles (actuellement seules 6 sont appliquées).
3. **Pérennisation du stockage des fichiers** :
   - Basculer l'ensemble des uploads (notamment les documents d'inscription et photos d'enfants) vers Cloudinary ou un stockage objet S3/R2 afin de ne plus dépendre du disque local des conteneurs.
4. **Sécurisation des sauvegardes** :
   - Encadrer les opérations de restauration de base de données dans des transactions SQL complètes (`BEGIN / COMMIT / ROLLBACK`).
   - Exporter les archives de sauvegarde vers un stockage externe sécurisé plutôt que sur le disque local de l'application.

---

## 3. Actions à Moyen Terme (🟡 Améliorations & Qualité)

1. **Suppression du code mort et orphelin** :
   - Supprimer les contrôleurs inutilisés (`uploadController`, `userController`, `settingsController`, etc.).
   - Supprimer le fichier racine `server.js` de 0 octet.
   - Supprimer le mécanisme de contournement de session de développement (`mock_token_*`) dans `AuthContext.jsx`.
2. **Mise en place de tests automatisés** :
   - Étendre la suite de tests Jest sur les routes critiques d'authentification et de gestion des enfants.
   - Ajouter des tests End-to-End (Playwright) pour valider le parcours complet d'inscription.
3. **Mise en place de WebSockets / SSE** :
   - Si une messagerie instantanée ou des notifications en direct sont souhaitées, intégrer Socket.io ou Server-Sent Events pour éviter les rechargements manuels.
