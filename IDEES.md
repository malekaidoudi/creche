# 💡 Idées & Améliorations futures

Liste des idées à implémenter plus tard. Ajoutez chaque nouvelle idée dans la catégorie correspondante, cochez quand c'est fait.

Format suggéré : `- [ ] Description de l'idée` (laisser `[ ]`, passer à `[x]` une fois terminé)

---

## � Urgent — Bugs en production

- [x] **Upload document administratif impossible en production** — la page `dashboard/documents` ne permet pas d'ajouter un document sur le site en prod (fonctionne en local ?). Vérifier : config Cloudinary prod, `CORS` des origines Render, limite taille multer, variables `CLOUDINARY_*` sur Render
- [x] **Correction de bug : Page blanche lors de la consultation des détails d'un parent sans email (`ParentsPage.jsx`)** :
  - **Symptôme** : Lorsqu'un parent a été créé sans adresse email (ou avec `email` null/vide) et que l'administrateur clique sur "Voir les détails" (icône œil) dans `/dashboard/parents`, l'application plante et affiche un écran blanc.
  - **Causes identifiées** :
    1. Définition trop stricte de `isNoEmail(email)` dans `ParentsPage.jsx` (`email && email.endsWith('@creche.local')`) qui renvoie `false` si `email` est `null` ou `undefined`, provoquant un crash sur `parentEmailDisplay.toLowerCase()` (`TypeError: Cannot read properties of null (reading 'toLowerCase')`).
    2. Absence de garde sur `selectedParent.children.map(...)` (crash si `children` est undefined/null).
    3. Absence de vérification sur `selectedParent.last_login` passé directement dans `new Date()`.
    4. Tentative d'affichage des boutons de réinitialisation/envoi de lien de mot de passe alors que le parent ne possède pas d'email valide.
  - **Solutions préconisées** : Harmoniser le helper `isNoEmail` (`!email || email.includes('@creche.local') || email.includes('noemail')`), sécuriser les chaînes de recherche avec `|| ''`, sécuriser le mapping des enfants `(selectedParent.children || [])`, et afficher un état propre "Parent sans compte numérique".

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
- [x] **Modélisation complète des contacts de l'enfant (Parents, Urgence & Personnes de confiance)** :
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
- [x] **Photos multiples dans une publication du fil d'activité** — permettre à l'utilisateur d'ajouter plusieurs photos dans une seule publication sur la page Activité :
  - Sélection multiple (`input multiple`), jusqu'à 10 photos par publication, aperçu en grille réactive, suppression unitaire avant envoi.
  - Upload groupé vers Cloudinary + stockage d'une liste d'URLs par post (colonne `media_urls JSONB` dans `activities` via migration 007).
  - Affichage en mosaïque/galerie élégante dans `ActivityCard.jsx` (2, 3, 4 et 5+ photos avec overlay `+X`).
  - Carrousel interactif en mode plein écran dans `FullscreenFeed.jsx` avec navigation fléchée (gauche/droite) et touches clavier.
- [x] **Suivi de croissance de l'enfant (poids & taille)** — saisie des mesures corporelles pour analyser la croissance :
  - Schéma (migration 006) : `children.weight_kg NUMERIC(5,2)`, `height_cm NUMERIC(5,1)`, `growth_measured_at` + table `child_growth_records` (historique append-only avec `recorded_by`).
  - Modèle à 2 niveaux : dernier état sur `children` (lecture rapide) + historique complet par relevé pour les futures courbes.
  - Saisie par le parent (`/mon-espace/child/:id/medical`, section "Groupe sanguin & Croissance") et par le staff/admin habilité `medical.view` (modal d'édition enfant).
  - Groupe sanguin déplacé de l'identité vers la carte "Santé & Suivi Médical" ; anti-écrasement via `COALESCE` (une édition sans mesure n'efface rien).
  - Prêt pour le futur rôle `doctor` : `PUT /:id/medical` déjà protégé par `requireChildAccess`, `recorded_by` trace l'auteur de chaque mesure.
- [ ] **Courbes de croissance & percentiles OMS** — exploiter `child_growth_records` :
  - Endpoint `GET /api/children/:id/growth` (relevés triés par `measured_at`) + graphique (Recharts/Chart.js) dans la fiche médicale.
  - Comparaison aux courbes de référence OMS par âge et sexe ; saisie optionnelle de la date de mesure (`measured_at` manuel pour backfill par le médecin).
- [x] **Adresse bilingue (FR/AR) éditable depuis les paramètres** — l'adresse affichée dans le **footer public** (`PublicFooter.jsx`, `OptimizedPublicFooter.jsx`) et la **page Contact** (`ContactPageDynamic.jsx`) provient de `nursery_settings.address` via `GET /api/contact/info`, qui expose `address` (FR) et `address_ar` (AR).
  - Deux champs distincts dans `DashboardSettingsPage.jsx` (FR + AR) avec fallback croisé si l'un est vide et "Non définie" / "غير محددة" si les deux sont vides.
  - Backend `POST /api/nursery-settings/simple-update` accepte `address_ar` et `nursery_name_ar` et synchronise les clés composites d'horaires.
  - Harmonisation complète des fallbacks en dur et des horaires du samedi (fermé par défaut, 08:00-13:00 si activé).
- [x] **Page Contact — Proposition 1 (Split Layout) adoptée avec repère Logo Crèche** :
  - Adresse physique officielle : `9 Rue Latif Ksiksi, Médenine 4100` (FR) / `9 نهج لطيف الكسيكسي, مدنين 4100` (AR).
  - Coordonnées GPS exactes : `33.340592, 10.490699` avec référence Google Maps Plus Code `8FRR+77 Médenine, Tunisie`.
  - Marqueur de carte sur-mesure utilisant le logo officiel de la crèche (`/images/logo.jpg`) ancré géographiquement (Leaflet) : reste solidaire des coordonnées lors du zoom et du déplacement.
  - Vue Satellite Google Hybrid par défaut, zoom rapproché d'entrée (zoom 19), bascule Plan/Satellite et recentrage instantané (`InteractiveNurseryMap.jsx`).
  - Formulaire de contact moderne et cartes d'accès express (Tél 1-clic, Email, Horaires, Itinéraires Google Maps & Waze, capsules dépose-minute/poussettes/sécurité).
- [x] **Clôture automatique des présences à l'heure de fermeture & arrêt automatique des compteurs** :
  - Détection automatique des sorties non pointées par le personnel à l'heure officielle de fermeture (`nursery_settings.closing_time`, ex: 18h00 en semaine / 13h00 le samedi).
  - Backend : `attendanceAutoCheckoutService.js` clôture automatiquement en base tout enregistrement non terminé (`check_out_time = date + closing_time`) avec note d'audit `[Départ automatique - fermeture de la crèche]`.
  - Exécution double : automatique à chaque consultation des présences (`/today`, `/currently-present`, `/stats`, `/date/:date`) + cron planifié `attendanceJob.js` (13h/18h et sécurité à 20h).
  - Frontend : arrêt et plafonnement visuel du compteur en cours dès que l'heure de fermeture est atteinte avec badge `Compteur arrêté à l'heure de fermeture (18:00)`, et pastilles explicatives `Clôture auto à la fermeture` sur desktop (`TodaySection.jsx`) et mobile (`MobileAttendance.jsx`).
- [ ] *(ajouter ici)*

## 🚀 Performance & Technique

- [x] Bouton **"⚡ Accepter (dev)"** sur `EnrollmentsPage` — finalise un dossier `pending`/`in_progress` en un clic (approve → completion RDV → création enfant) sans attendre la date du rendez-vous ; rendu uniquement si `import.meta.env.DEV` (invisible en build prod)
- [x] Cache négatif sur `revoked_tokens` (évite le check DB ~300ms à chaque requête authentifiée)
- [x] Pool PostgreSQL : `min: 1` + `idleTimeoutMillis` plus long (évite de recréer une connexion TLS Neon par requête)
- [x] `cors({ maxAge: 86400 })` pour cacher les preflight OPTIONS
- [x] Merger `SELECT notifications` + `COUNT(*)` en une seule requête (`COUNT(*) OVER()`)
- [x] **Mise en cache automatique navigateur (`localStorage` + Stale-While-Revalidate)** :
  - `cachedGet` dans `api.js` enrichi d'une persistance `localStorage` (`creche_api_cache:*`) avec TTL 5 min pour settings, contact et vacances.
  - Élimination des valeurs de secours en dur obsolètes (ex: résidu "8 Rue Bizerte" supprimé) : en cas d'indisponibilité réseau, le frontend réutilise automatiquement la dernière valeur réelle enregistrée depuis la base de données.
  - Invalidation instantanée : `clearApiCache` purge la mémoire et le stockage local dès la sauvegarde dans le tableau de bord.

## 🏗️ Architecture

- [ ] **Transformer le projet en multi-tenant (SaaS)** — une plateforme pour plusieurs crèches : `tenant_id` sur toutes les tables, JWT avec tenant, scoping des requêtes, rôle super-admin plateforme → voir le plan détaillé : `docs/MULTI_TENANT_PLAN.md`

## 📱 Mobile / PWA

- [ ] *(ajouter ici)*

---

> ✏️ Astuce : quand une idée est réalisée, cochez `[x]` puis archivez-la en bas de fichier ou supprimez-la.
