# Règles du Projet — Crèche

> [!IMPORTANT]
> Ce fichier définit les règles de gouvernance et de travail obligatoires pour tout assistant intervenant sur ce projet.

---

## 1. 💡 Gestion des Idées & Nouvelles Features (`IDEES.md`)

- **Demande systématique** : À chaque fois qu'une **nouvelle feature** ou une **nouvelle idée** est discutée, conçue ou réalisée ensemble, l'assistant **DOIT OBLIGATOIREMENT demander à l'utilisateur** :
  > *"Est-ce qu'on ajoute cette idée / feature au fichier `IDEES.md` ?"*
- **Validation d'une tâche** : Dès qu'une idée ou feature présente dans [`IDEES.md`](file:///Volumes/Data/Works/Windsurf/creche/IDEES.md) est réalisée, elle doit être cochée `[x]` immédiatement dans le fichier.
- **Vérification préalable** : Consulter `IDEES.md` avant de déclarer une fonctionnalité comme inexistante ou non implémentée (certaines tâches peuvent déjà avoir été réalisées ou être en cours).

---

## 2. 🛠️ Traçabilité des Corrections (`IDEES.md` & `corrections.md`)

Pour **CHAQUE correction** (bugfix, régression, ajustement technique ou fonctionnel) effectuée sur le projet, deux mises à jour sont **OBLIGATOIRES** :

1. **Journal d'Audit des Corrections** ([`documentation/09-audit/corrections.md`](file:///Volumes/Data/Works/Windsurf/creche/documentation/09-audit/corrections.md)) :
   - Ajouter une entrée numérotée dans le *Tableau de Synthèse des Corrections* (numéro incrémenté, date, fichiers impactés, nature de l'intervention, statut `✅ Validé & Appliqué`).
   - Rédiger la fiche détaillée correspondante (Contexte / Symptôme, Cause racine, Solution appliquée, Fichiers modifiés).
2. **Fichier des Idées** ([`IDEES.md`](file:///Volumes/Data/Works/Windsurf/creche/IDEES.md)) :
   - Répercuter la correction dans `IDEES.md` : cocher `[x]` si l'item existait déjà, ou ajouter la mention de la correction sous la section appropriée (ex: *Bugs en production* ou catégorie métier).

---

## 3. 📚 Documentation des Nouvelles Features (`documentsV2/`)

- Pour **CHAQUE nouvelle fonctionnalité** ajoutée au projet, le dossier [`documentsV2/`](file:///Volumes/Data/Works/Windsurf/creche/documentsV2) **DOIT ÊTRE ALIMENTÉ**.
- Mettre à jour les documents de référence concernés selon la nature de la feature :
  - `07_CATALOGUE_FONCTIONNALITES.md` : description fonctionnelle et rôle utilisateur associé.
  - `14_API_REST.md` : nouveaux endpoints, méthodes HTTP, paramètres et réponses.
  - `15_FRONTEND_ET_INTERFACE.md` : nouveaux écrans, modales ou composants majeurs.
  - `21_FLUX_METIER.md` : nouveaux workflows opérationnels.
  - `25_DICTIONNAIRE_DES_ROUTES_ET_NAVIGATION.md` : nouvelles routes React / Express.
  - `12_MODELE_DONNEES.md` / `13_DICTIONNAIRE_DONNEES.md` : si des tables ou colonnes ont été créées/modifiées.

---

## 4. ⚙️ Standards Techniques & Architecture

- **Stack** : Node.js 22, Vite (React JavaScript pur, **pas de TypeScript**), PostgreSQL (pg-pool).
- **Architecture** : Modulaire claire (`/routes_postgres`, `/controllers`, `/services`, `/middlewares`).
- **Sécurité** : Requêtes SQL paramétrées strictes, validation des entrées, protection des routes sensibles via JWT et permissions granulaires (`auth.authenticateToken`, `auth.requireRole`, etc.).
- **Code & Style** : Code propre, documenté avec JSDoc si besoin, logs structurés sans bruit en production.

---

## 5. 🧹 Nettoyage Post-Intervention & Hygiène du Code (OBLIGATOIRE)

**Principe fondamental :** Après chaque intervention sur le projet, qu'il s'agisse d'une correction de bug, d'un refactoring, d'une optimisation ou de l'implémentation d'une nouvelle fonctionnalité, tu dois systématiquement effectuer une phase de nettoyage et de contrôle qualité avant de considérer le travail comme terminé.

Le code livré doit être propre, cohérent, maintenable, optimisé et exempt de résidus liés à l'intervention.

#### 1. Suppression du code mort et inutilisé
- Supprimer les imports, variables, constantes, fonctions, composants et paramètres inutilisés.
- Supprimer les états React orphelins (`useState`, `useEffect`, `useMemo`, etc.), handlers et callbacks devenus inutiles.
- Supprimer les props obsolètes, les interfaces, types et déclarations qui ne sont plus utilisés.
- Éliminer les blocs de code commentés, les anciennes implémentations et les doublons.
- Supprimer les dépendances devenues inutiles uniquement après vérification de leur utilisation dans l'ensemble du projet.

#### 2. Élimination des résidus de développement
- Supprimer les `console.log`, `debugger`, traces de diagnostic et autres outils de débogage temporaires.
- Retirer les données mockées, fixtures temporaires et valeurs codées en dur introduites uniquement pour le développement.
- Supprimer les `TODO`, `FIXME` et `HACK` résolus.
- Éliminer les fichiers temporaires, scripts de test ponctuels et artefacts générés inutilement.
- Vérifier qu'aucune information sensible, clé API, token ou donnée confidentielle n'a été exposée pendant l'intervention.

#### 3. Nettoyage de l'ancienne logique
- Identifier et supprimer les anciennes logiques remplacées par la nouvelle implémentation.
- Éliminer les conditions devenues inutiles, les branches inaccessibles et les traitements redondants.
- Supprimer les anciens composants, hooks, services, endpoints ou utilitaires devenus obsolètes.
- Vérifier qu'aucune référence résiduelle ne pointe vers l'ancienne implémentation.
- Éviter de conserver deux mécanismes qui remplissent désormais la même fonction.

#### 4. Cohérence architecturale et qualité du code
- Respecter strictement l'architecture, les conventions et les patterns déjà établis dans le projet.
- Éviter la duplication de logique (DRY) et privilégier la réutilisation des composants, hooks et fonctions existants lorsqu'elle est pertinente.
- Vérifier la cohérence des types, interfaces, contrats API, validations et gestion des erreurs.
- Éviter les abstractions inutiles, les sur-architectures et les dépendances superflues.
- Vérifier que chaque modification reste limitée au périmètre fonctionnel concerné.
- Ne pas modifier ou reformater massivement des fichiers sans nécessité.

#### 5. Vérification des régressions et intégrité fonctionnelle
- Vérifier que la nouvelle implémentation ne casse aucune fonctionnalité existante.
- Contrôler les interactions entre les composants, les appels API, les états et les flux de données impactés.
- Vérifier les cas limites, les états de chargement, les erreurs et les comportements inattendus.
- Exécuter les tests pertinents disponibles dans le projet.
- Vérifier le lint, le type-check et le build lorsque les scripts correspondants sont disponibles.
- Corriger les problèmes introduits par l'intervention avant de la considérer comme terminée.

#### 6. Vérification finale obligatoire
Avant de terminer chaque intervention, effectuer une dernière revue du diff pour identifier :
- Les modifications accidentelles ou hors périmètre.
- Les fichiers modifiés inutilement.
- Les imports, variables ou fonctions devenus inutiles.
- Les incohérences introduites par les changements.
- Les éventuels résidus de développement.
- Les problèmes de sécurité ou de qualité évidents.

#### 7. Règles de sécurité du nettoyage
- Ne jamais supprimer un élément sans avoir vérifié qu'il n'est plus utilisé ou nécessaire.
- Ne jamais supprimer du code simplement parce qu'il semble inutilisé localement : vérifier ses usages dynamiques, indirects, ses exports publics et ses dépendances.
- Ne jamais modifier le comportement métier dans le seul but de simplifier le code.
- Ne jamais supprimer des tests, configurations, commentaires documentaires ou mécanismes de compatibilité encore utiles.
- Ne jamais masquer une erreur en désactivant une règle de lint, un test ou une vérification.
- Si un nettoyage présente un risque de régression, le signaler plutôt que de procéder à une suppression hasardeuse.

### Règle de clôture

**Une intervention n'est considérée comme terminée que lorsque son implémentation est fonctionnelle, que son périmètre a été nettoyé et que les vérifications pertinentes ont été effectuées.**

Ne te contente jamais de faire fonctionner le code : laisse systématiquement derrière toi une base de code aussi propre, voire plus propre, qu'avant ton intervention.

À la fin de chaque intervention, fournis un bref compte rendu indiquant :
1. Les modifications fonctionnelles réalisées.
2. Les éléments inutilisés ou obsolètes supprimés.
3. Les optimisations et nettoyages effectués.
4. Les vérifications exécutées et leurs résultats.
5. Les éventuels problèmes restants ou vérifications impossibles à effectuer.

Ne prétends jamais qu'un test, un build ou une vérification a réussi s'il n'a pas réellement été exécuté.


