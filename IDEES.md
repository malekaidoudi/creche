# 💡 Idées & Améliorations futures

Liste des idées à implémenter plus tard. Ajoutez chaque nouvelle idée dans la catégorie correspondante, cochez quand c'est fait.

Format suggéré : `- [ ] Description de l'idée` (laisser `[ ]`, passer à `[x]` une fois terminé)

---

## � Urgent — Bugs en production

- [x] **Upload document administratif impossible en production** — la page `dashboard/documents` ne permet pas d'ajouter un document sur le site en prod (fonctionne en local ?). Vérifier : config Cloudinary prod, `CORS` des origines Render, limite taille multer, variables `CLOUDINARY_*` sur Render

## �👤 Rôles & Permissions

- [ ] **Ajouter un rôle `doctor`** — médecin conventionné de la crèche (accès dossiers médicaux des enfants, traitements, rapports santé)
- [ ] **Adresse parent/enfant dans la fiche enfant** — afficher l'adresse dans les détails d'un enfant, visible uniquement avec une permission dédiée (ex: `child.view_address` — admin/directrice uniquement)

## 🎨 Design / UI

- [ ] **Modifier le skin du site** — nouveau thème/charte graphique

## ⚙️ Fonctionnalités

- [ ] **Gestion de stock de la crèche** — inventaire des fournitures avec 2 stocks distincts :
  - **Stock crèche** — fournitures de l'établissement (matériel, consommables communs)
  - **Stock enfants** — fournitures individuelles par enfant (couches, lingettes, lait...) avec alerte de seuil bas et notification aux parents quand réapprovisionnement nécessaire
  - *Base existante : tables `child_supplies` + `daily_supplies_brought` déjà en DB*
- [ ] **Module génération de documents PDF (admin)** — formulaire pour générer :
  - **Contrats de travail** selon le type (CDI, CDD, stage, remplacement...)
  - **Procès-verbaux** de différents types
  - Le formulaire affiche : type de document, personnel concerné, date, + **champs dynamiques selon le type de document** (chaque PV a ses propres champs à remplir)
  - Basé sur des **modèles enregistrés dans Cloudinary** → génération PDF à partir des templates
- [ ] **Numérisation pédagogique** — dématérialiser les documents pédagogiques papier :
  - **Préparation quotidienne de l'éducatrice** — saisie/consultation digitale de la préparation du jour (activités, objectifs, matériel), remplace le cahier papier ; suivi possible par la direction
  - **Programme annuel du directeur** — planification annuelle des activités/thèmes pédagogiques visible par les éducatrices et parents
- [x] **Flux d'inscription enfant → Création parent avec préremplissage automatique** :
  - Dès qu'un enfant est inscrit avec succès et que le message s'affiche (*"Enfant inscrit avec succès !"*), en cliquant sur le bouton *"Créer un compte parent"*, préremplir automatiquement le **nom de famille** (ex: `Othmani`) dans le formulaire du nouveau parent.
  - Optionnellement : pré-associer l'enfant au compte parent en cours de création.
- [x] **Création de compte parent sans email obligatoire** :
  - Pouvoir ajouter un compte parent même si celui-ci ne possède pas d'adresse email au moment de l'inscription.
  - Possibilité de renseigner ou compléter l'adresse email ultérieurement (authentification alternative via téléphone ou identifiant temporaire). Le parent sans email ne dispose pas de compte actif jusqu'à ajout d'un email réel.
- [x] **Correction du champ date d'inscription (bug de saisie datepicker)** :
  - Par défaut la date d'inscription est celle d'aujourd'hui, mais la modification manuelle ou via le picker bloque ou corrompt l'année (ex: affichage erroné `11/02/0262`).
  - Corriger le composant datepicker / input date pour garantir un formatage `JJ/MM/AAAA` (ou `AAAA-MM-JJ`) fiable, souple et sans corruption d'année.
- [ ] **Modélisation complète des contacts de l'enfant (Parents, Urgence & Personnes de confiance)** :
  - **Filiation parents** :
    - Saisie distincte : Nom, prénom et téléphone du **Père** + Nom, prénom et téléphone de la **Mère**.
    - Le titulaire du compte parent sur la plateforme doit être l'un des parents (père ou mère).
  - **Contact d'urgence** :
    - Personne à contacter en priorité absolue en cas d'urgence médicale ou imprévu grave.
  - **Contacts de confiance (Autorisation de sortie / Récupération de l'enfant)** :
    - Liste des personnes autorisées à récupérer l'enfant à la fin de la journée.
    - **Contrôle strict du personnel** : L'éducatrice ou la directrice doit obligatoirement vérifier cette liste avant de confier l'enfant.
    - **Composition par défaut** : Cette liste contient **par défaut les deux parents et le contact d'urgence**.
    - **Flexibilité de saisie** : D'autres contacts de confiance (grands-parents, oncle/tante, nounou...) peuvent être saisis lors de l'inscription ou ajoutés/modifiés ultérieurement par le parent directement depuis son espace (`/mon-espace`).
- [ ] *(ajouter ici)*

## 🚀 Performance & Technique

- [x] Cache négatif sur `revoked_tokens` (évite le check DB ~300ms à chaque requête authentifiée)
- [x] Pool PostgreSQL : `min: 1` + `idleTimeoutMillis` plus long (évite de recréer une connexion TLS Neon par requête)
- [x] `cors({ maxAge: 86400 })` pour cacher les preflight OPTIONS
- [x] Merger `SELECT notifications` + `COUNT(*)` en une seule requête (`COUNT(*) OVER()`)

## 🏗️ Architecture

- [ ] **Transformer le projet en multi-tenant (SaaS)** — une plateforme pour plusieurs crèches : `tenant_id` sur toutes les tables, JWT avec tenant, scoping des requêtes, rôle super-admin plateforme → voir le plan détaillé : `docs/MULTI_TENANT_PLAN.md`

## 📱 Mobile / PWA

- [ ] *(ajouter ici)*

---

> ✏️ Astuce : quand une idée est réalisée, cochez `[x]` puis archivez-la en bas de fichier ou supprimez-la.
