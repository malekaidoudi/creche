# 💡 Idées & Améliorations futures

Liste des idées à implémenter plus tard. Ajoutez chaque nouvelle idée dans la catégorie correspondante, cochez quand c'est fait.

Format suggéré : `- [ ] Description de l'idée` (laisser `[ ]`, passer à `[x]` une fois terminé)

---

## � Urgent — Bugs en production

- [ ] **Upload document administratif impossible en production** — la page `dashboard/documents` ne permet pas d'ajouter un document sur le site en prod (fonctionne en local ?). Vérifier : config Cloudinary prod, `CORS` des origines Render, limite taille multer, variables `CLOUDINARY_*` sur Render

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
