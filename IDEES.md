# 💡 Idées & Améliorations futures

Liste des idées à implémenter plus tard. Ajoutez chaque nouvelle idée dans la catégorie correspondante, cochez quand c'est fait.

Format suggéré : `- [ ] Description de l'idée` (laisser `[ ]`, passer à `[x]` une fois terminé)

---

## � Urgent — Bugs en production

- [x] **Rapports Journaliers (`/dashboard/daily-reports`) — Remplacement de « Nourriture/Lait » dans « Fournitures apportées » par les Produits Consommables & Hygiène (Lingettes, Crème, Mouchoirs, Vêtements, Sérum phy., Autre) & Catégories Standards de Repas** (`DailyReportsPage.jsx`, `MobileDailyReportsPage.jsx`, `ChildDailyReportsPage.jsx`, `suppliesController.js`, `dailyReportsController.js`, `supplies.js`, `020_consumable_supplies_and_meals.js`) :
  - **Demande client & Problèmes résolus** :
    1. Dans `/dashboard/daily-reports`, le client ne souhaite plus déclarer les nourritures apportées par l'enfant (yaourt, couscous, compote...) dans la section « 🎒 Fournitures apportées », mais souhaite à la place pouvoir déclarer les produits consommables apportés (lingettes, crème, mouchoirs, vêtements de rechange, sérum physiologique ou autre produit consommable).
    2. La section « 🍽️ Repas » dépendait auparavant de ces nourritures déclarées dans les fournitures.
  - **Modifications appliquées** :
    1. Remplacement du bloc « 🍼 Nourriture/Lait » par **« 🧴 Produits consommables & Hygiène »** avec **boutons rapides cliquables** (`+ 🧻 Lingettes`, `+ 🧴 Crème`, `+ 🤧 Mouchoirs`, `+ 👕 Vêtements`, `+ 💧 Sérum phy.`) + **champ libre « Autre produit... »** sur Desktop et Mobile.
    2. Proposition de **catégories standards dans la section « 🍽️ Repas »** (`🍼 Biberon / Lait`, `🍲 Repas du jour`, `🥣 Compote / Yaourt`, `🍎 Fruit / Goûter`, `📝 Autre`) + champ de description libre optionnel.
    3. Affichage adapté côté Parent (`ChildDailyReportsPage.jsx`), suppression de la route morte `/food-options` et migration PostgreSQL `020_consumable_supplies_and_meals.js`.
- [x] **Règle Facturation Enfant Suspendu, Remise Strictement Ponctuelle dans Règlement Familial (suppression récurrence, désactivée par défaut, pas de 10 DT), Correction Arriérés Cumulés & Purge Badge Confus « Encaissé ce mois »** (`billingService.js`, `BillingManagementModal.jsx`) :
  - **Symptômes & Problèmes résolus** :
    1. Un enfant suspendu/inactif continuait à être facturé et affiché dans les listes des mois ultérieurs.
    2. La case « Appliquer aussi aux mois futurs » dans le modal de règlement créait une confusion avec la fiche enfant (lieu unique de la remise récurrente).
    3. La remise était activée par défaut au lieu de laisser l'initiative à l'admin.
    4. L'ascenseur de remise avançait de 1 en 1 au lieu de tranches de 10 DT (`step="10"`).
    5. Le badge vert `💰 Encaissé ce mois : 100 DT` s'affichait sur une facture impayée (`À régler : 200 DT`, avec Arriéré +100 DT) à cause des paiements calendaires globaux, faisant croire à un encaissement déjà perçu sur la mensualité en cours.
    6. Formule d'arriérés en cascade cumulant les `total_due` passés.
  - **Corrections appliquées** :
    1. Condition stricte sur `departure_date` : si l'enfant est suspendu avant le 1er du mois ciblé, aucune facture n'est générée et il n'apparaît plus dans la liste ; s'il est suspendu en cours de mois ($\ge 1$ jour actif), il est facturé pour le mois en cours uniquement.
    2. Suppression intégrale de la case « Appliquer aux mois futurs » dans le modal ; la remise du modal est strictement ponctuelle et ne s'applique qu'au mois 1.
    3. Remise non cochée par défaut (`enabled: false`).
    4. Stepper configuré à `step="10"`.
    5. Retrait définitif du badge trompeur `💰 Encaissé ce mois` sur les cartes familles impayées.
    6. Calcul rigoureux des arriérés : somme des charges nettes passées moins somme des paiements passés.

- [x] **Refonte des Tâches Automatiques Système : Boutons d'Action Métier Contextuels, Auto-Complétion à la Sauvegarde, Exclusion Mobile du Dossier Express, Suppression de la Tâche #3 Obsolète & Zéro `#ID` Technique** (`userWorkflow.js`, `children.js`, `enrollmentsController.js`, `enrollments.js`, `appointmentsController.js`, `taskService.js`, `taskHelpers.js`, `ChildrenPage.jsx`, `PendingEnrollmentsPage.jsx`, `TodayTasksWidget.jsx`, `TodayTasksWidgetMobile.jsx`, `OverdueTasksWidget.jsx`, `MobileDashboardComplete.jsx`, `TaskDetailModal.jsx`, `TasksPage.jsx`) :
  - **Symptômes & Problèmes résolus** :
    1. La tâche automatique `📋 Compléter dossier admin & cotisation : [Nom Enfant]` créée lors d'une inscription Express Mobile n'avait pas de bouton pour éditer directement les détails de l'enfant concerné, affichait un bouton générique `Terminer` dénué de sens métier, et s'affichait sur mobile alors qu'elle ne doit être traitée que sur Desktop.
    2. Les autres tâches automatiques affichaient également un bouton `Terminer` générique ou exposaient des identifiants techniques (`#30`, `(ID: XX)`).
    3. La tâche automatique #3 (`📄 Compléter le dossier de [Nom]`) n'était plus utile.
  - **Corrections appliquées** :
    1. Remplacement du bouton `Terminer` par **`✏️ Compléter la fiche enfant`** (ouvrant directement la modale d'édition de l'enfant dans `/dashboard/children`), auto-complétion de la tâche dès la sauvegarde (`PUT /api/children/:id`), et masquage strict de cette tâche sur tous les écrans mobiles.
    2. Remplacement du bouton `Terminer` sur les demandes d'inscription par **`📋 Examiner le dossier`** (ciblant `/dashboard/pending-enrollments`), intitulé propre avec le nom de l'enfant (`📋 Demande d'inscription : [Nom Enfant]`, zéro `#ID`), et auto-complétion dès l'approbation ou le rejet du dossier.
    3. Suppression définitive de la tâche #3 (`📄 Compléter le dossier de ...`) et nettoyage automatique des entrées existantes.
    4. Harmonisation des boutons d'action sur toutes les cartes et modales (Desktop, Mobile, Tâches en retard, `TaskDetailModal`, `TasksPage`) : le bouton `✅ Terminer` est désormais réservé exclusivement aux tâches manuelles et aux mémos personnels.
- [x] **Intégration Native & Élégante de la Remise dans le Règlement Familial, Élimination de la Modale Secondaire d'Ajustement, Suppression du Bouton Retour Inutile sur la Liste des Contacts & Isolation Plein Écran Chat Conversation** (`BillingManagementModal.jsx`, `billingService.js`, `billing.js`, `MessagesPage.jsx`, `PublicLayout.jsx`) :
  - **Symptômes & Problèmes résolus** :
    1. Le bouton popup `[ 🎛️ Remise ]` ouvrait une deuxième modale par-dessus « Règlement Familial » (« Ajuster la facture & Remises ») jugée encombrante et source de collisions visuelles.
    2. Dans la messagerie mobile, la liste des contacts affichait un bouton retour inutile `←` à gauche (« ça sert à rien ») en doublon de la barre de navigation mobile persistante, tandis que la conversation ouverte manquait d'un en-tête accessible avec retour à la liste.
  - **Corrections appliquées** :
    1. Suppression intégrale de la modale secondaire `{adjustingInvoice && ...}` et de ses boutons d'ouverture.
    2. Intégration d'une zone dédiée sous chaque enfant sélectionné dans le Règlement Familial : `🏷️ Remise ce mois : [ input ] DT` avec case à cocher `Appliquer aussi aux mois futurs`.
    3. Recalcul dynamique immédiat du montant net de l'enfant et du total de la famille (`familyComputedTotal` et `familyAmountGiven`), avec prise en charge backend complète dans `recordFamilyPayment` (`POST /api/billing/family-pay`).
    4. Suppression du bouton retour superflu dans la liste des contacts de messagerie, isolation plein écran du chat via `createPortal` (`z-[100]`) avec en-tête dédié, bouton retour tactile `←` et geste tactile de swipe pour refermer la conversation.
- [x] **Correction de bug : Crash `ReferenceError: Cannot access 'isPersonal' before initialization` sur `dashboard/add-child`** (`AddChildPage.jsx`) :
  - **Symptôme** : Écran blanc d'erreur au chargement de `/dashboard/add-child` empêchant le rendu du composant en raison d'un accès prématuré à `isPersonal` en amont de son instruction `const`.
  - **Correction** : Déplacement de l'initialisation de `isPersonal` avant le hook `useEffect` de redirection unifiée vers l'inscription express.
- [x] **Module Financier & Mobile — Bouton Remise Ponctuelle Visible en Direct (Règlement Familial & Pied de Carte), Portals `document.body` Modales Mobile (Contacts d'urgence), Isolation Plein Écran Chat Conversation (`z-[100]`) & Compactage Cartes Rapports** (`BillingManagementModal.jsx`, `MobileParentSpace.jsx`, `MessagesPage.jsx`, `ChildDailyReportsPage.jsx`) :
  - **Problèmes résolus** :
    1. Dans la modale de paiement « Règlement Familial » (`payingFamily`), chaque ligne d'enfant (ex: Houda Zamouri 160 DT) ne disposait d'aucun bouton pour appliquer immédiatement une remise (ex: déduire 60 DT d'assurance déjà payée). De même, sur les cartes familles fermées, l'action était inaccessible.
    2. Sur mobile (iPhone SE 375x667), la modale « Contacts d'urgence » et les options enfants étaient recouvertes par la barre de navigation inférieure (`MobileNavigation`), coupant le bouton « Gérer les contacts ».
    3. Dans la messagerie mobile (`MessagesPage.jsx`), l'en-tête de l'application publique (`PublicHeader` `z-50`) recouvrait le haut de la discussion, cachant le bouton retour `←`, l'avatar et le nom du contact, tandis que le geste de swipe quittait brutalement vers le dashboard.
    4. Sur `ChildDailyReportsPage.jsx`, la carte d'état vide « Pas de rapport pour ce jour » débordait sous la barre de navigation en raison d'un padding vertical excessif (`py-16`).
  - **Corrections appliquées** :
    1. Bouton direct `[ 🎛️ Remise ]` ajouté à côté de chaque total enfant dans le Règlement Familial et sur le pied des cartes familles.
    2. Suppression de 221 lignes de code mort obsolète (`{false && (...) }`) dans `BillingManagementModal.jsx`.
    3. Montage via `createPortal(..., document.body)` avec `z-[100]` des modales d'actions et de contacts d'urgence dans `MobileParentSpace.jsx` au-dessus de `MobileNavigation`.
    4. Montage par portail de la conversation active en plein écran (`z-[100]`) avec en-tête dégagé, bouton retour spacieux `←` et synchronisation URL `?contactId=ID`.
    5. Compactage des cartes d'états vides de `ChildDailyReportsPage.jsx` (`py-8 sm:py-12` et icône `w-12 h-12`) pour un affichage parfaitement calé.
- [x] **Module Financier — Gestion des Remises Ponctuelles (`child_invoices.discount_amount`) vs Récurrentes (`children.monthly_discount`), Bouton Explicite « Remise / Ajuster », Élévation `z-[80]` Modales Mobiles et Anti-Troncature Rapports (`pb-36`)** (`BillingManagementModal.jsx`, `billingService.js`, `MobileParentSpace.jsx`, `ParentOptionsModals.jsx`, `ChildDailyReportsPage.jsx`, `MessagesPage.jsx`) :
  - **Symptômes & Problèmes résolus** :
    1. Dans le nouveau design de gestion financière, l'accès à la remise ponctuelle était masqué sous une minuscule icône sans libellé.
    2. Besoin d'éclaircir et de synchroniser au choix la remise ponctuelle (uniquement pour le mois en cours, ex: 60 DT pour déduire l'assurance papier déjà réglée) et la remise récurrente (`children.monthly_discount`, pour tous les mois futurs).
    3. Sur mobile, la modale Contacts d'urgence et les modales de l'Espace Parent s'affichaient sous la barre de navigation inférieure (`MobileNavigation`), coupant le bouton « Gérer les contacts ».
    4. Sur `ChildDailyReportsPage.jsx`, la carte d'état vide « Pas de rapport pour ce jour » était coupée en bas par la barre de navigation.
    5. Dans la messagerie mobile (`MessagesPage.jsx`), l'en-tête de conversation active est maintenant sécurisé à `z-[80]` avec bouton de retour dédié et geste de swipe pour revenir à la liste sans quitter la messagerie.
  - **Corrections appliquées** :
    1. Ajout du bouton explicite `<Sliders /> Remise / Ajuster` sur chaque ligne d'enfant dans `BillingManagementModal.jsx`.
    2. Sous-modale d'ajustement complète : détail de la facture (base, assurance, samedi, arriérés), champ « Remise pour ce mois (DT) », case à cocher « Appliquer aussi cette remise pour tous les mois futurs », recalcul en temps réel du net dû, et champ motif.
    3. Prise en charge backend dans `billingService.js` (`adjustInvoice`).
    4. Élévation à `z-[80]` des modales de `MobileParentSpace.jsx` et `ParentOptionsModals.jsx` avec marge basse sécurisée.
    5. Ajout de `pb-36` sur le conteneur principal de `ChildDailyReportsPage.jsx`.
    6. Suppression du code mort orphelin `PWAInstallGuide.jsx` et neutralisation des logs de `testAuthListener.js`.
    7. Mention explicite de l'option Samedi dans le Règlement Familial (`payingFamily`) avec montant `+ Samedi (+XX DT)` pour une transparence totale du calcul du total dû.
- [x] **Décrémentation répétée du stock de couches lors de l'édition d'un rapport journalier (`dailyReportsController.js`)** :
  - **Symptôme** : Lorsqu'une éducatrice modifie un rapport journalier déjà existant (pour corriger une observation, une heure de sieste ou une faute de frappe), chaque enregistrement relance la requête `UPDATE child_supplies SET quantity = GREATEST(0, quantity - $2)` sans réintégrer les couches déjà décomptées auparavant.
  - **Impact** : Corriger un rapport draine artificiellement le stock de couches de l'enfant et déclenche de fausses alertes de stock bas aux parents.
  - **Solution préconisée** : Calculer le différentiel ($\Delta = N_{nouveau} - N_{ancien}$) par rapport aux `daily_diaper_changes` déjà enregistrés pour ce jour, et n'appliquer que cet écart sur `child_supplies`.
- [x] **Module Financier — Déblocage Paiement Multi-mois avec Dettes/Arriérés, Toggle & Recalcul Instantané de la Remise (Ponctuelle & Récurrente), Élimination Superposition Badges & Conditionnement Quittance au 1er du Mois** (`BillingManagementModal.jsx`, `billingService.js`, `ParentBillingPage.jsx`, `MySpacePage.jsx`) :
  - **Problèmes résolus** :
    1. Déblocage complet des paiements d'avance (2 ou 3 mois) même lorsqu'une famille a des arriérés : imputation chronologique stricte (dettes et mois en cours soldés en priorité, le reste alloué aux mois suivants ou en avoir sur `credit_balance`).
    2. Case à cocher toggle `[✓] Remise ce mois` permettant d'activer (déduction immédiate) ou désactiver (remise = 0 DT) la remise en un clic avec recalcul instantané des montants enfant et famille.
    3. Option récurrente `Appliquer aussi aux mois futurs` prise en compte dans le calcul multi-mois et le payload d'enregistrement.
    4. Refonte aérée en badges distincts (Base, Samedi, Assurance, Arriéré, Remise) empêchant toute superposition ou troncature de texte.
    5. Mention de la date réelle d'encaissement anticipé dans la vue admin.
    6. Affichage des mois futurs réglés d'avance dans l'espace parent avec mention `Quittance disponible le 01/MM/AAAA` (bouton PDF activé automatiquement à partir du 1er du mois).
- [x] **Upload document administratif impossible en production** — la page `dashboard/documents` ne permet pas d'ajouter un document sur le site en prod (fonctionne en local ?). Vérifier : config Cloudinary prod, `CORS` des origines Render, limite taille multer, variables `CLOUDINARY_*` sur Render
- [x] **Correction de bug : Page blanche lors de la consultation des détails d'un parent sans email (`ParentsPage.jsx`)** :
  - **Symptôme** : Lorsqu'un parent a été créé sans adresse email (ou avec `email` null/vide) et que l'administrateur clique sur "Voir les détails" (icône œil) dans `/dashboard/parents`, l'application plante et affiche un écran blanc.
  - **Causes identifiées** :
    1. Définition trop stricte de `isNoEmail(email)` dans `ParentsPage.jsx` (`email && email.endsWith('@creche.local')`) qui renvoie `false` si `email` est `null` ou `undefined`, provoquant un crash sur `parentEmailDisplay.toLowerCase()` (`TypeError: Cannot read properties of null (reading 'toLowerCase')`).
    2. Absence de garde sur `selectedParent.children.map(...)` (crash si `children` est undefined/null).
    3. Absence de vérification sur `selectedParent.last_login` passé directement dans `new Date()`.
    4. Tentative d'affichage des boutons de réinitialisation/envoi de lien de mot de passe alors que le parent ne possède pas d'email valide.
  - **Solutions préconisées** : Harmoniser le helper `isNoEmail` (`!email || email.includes('@creche.local') || email.includes('noemail')`), sécuriser les chaînes de recherche avec `|| ''`, sécuriser le mapping des enfants `(selectedParent.children || [])`, et afficher un état propre "Parent sans compte numérique".
- [x] **Correction de bug : Erreur 500 lors du refus d'une demande d'anniversaire par l'admin, affichage des dates de la demande & suppression des anniversaires auto-générés sans demande parent (`birthdays.js`, `childLifecycleService.js`, `TaskDetailModal.jsx`, `BirthdayEventPage.jsx`, `TodayTasksWidget.jsx`)** :
  - **Symptômes** : Erreur HTTP 500 (`POST /api/birthdays/child/:id/admin-action`) au clic sur « Refuser la demande », impossibilité pour l'admin de voir quel jour le parent a soumis la demande ni pour quelle date la fête est souhaitée, apparition de tâches/événements d'anniversaire auto-générés par l'ancien code alors que le parent ne s'est pas connecté depuis le 29/10 et n'a fait aucune demande, et erreur 404 sur `/staff-messages/unread`.
  - **Corrections appliquées** : Résolution du conflit de type PostgreSQL `42P08` sur `$1` (`$1::varchar` et `$2::boolean`), désactivation de `createBirthdayEvent` automatique dans `childLifecycleService.js`, suppression de la synthèse automatique `birthday-${child.id}` dans `TodayTasksWidget` et les calendriers, affichage explicite de « ⏳ Aucune demande envoyée par le parent » (et masquage des boutons Accepter/Refuser tant que `decision_status !== 'yes'`), affichage de « 🕒 Demande faite par le parent le » et « 🎂 Date demandée pour la fête », et normalisation du suffixe `/api` sur `VITE_API_URL`.
- [x] **Correction de bug & Ergonomie Mobile : Accès Cotisations Admin, Protection Anti-Coupure Monétaire Stricte (`nowrap-dt` & `\u00A0DT`) et Filtrage des Mois Futurs Non Échus (Fix Mohamed Trabelsi)** (`MobileNavigation.jsx`, `ParentBillingPage.jsx`, `MySpacePage.jsx`, `BillingManagementModal.jsx`, `billingService.js`, `index.css`) :
  - **Symptômes** :
    1. Sur smartphone, l'administrateur n'avait aucun bouton dans le menu « Plus » pour ouvrir la modale de gestion des cotisations et dépenses.
    2. Sur petits écrans mobiles (375-390px), les montants monétaires (`+190 DT`, `190 DT`, `+20 DT`, `160 DT`) cassaient leur ligne, affichant le chiffre sur une première ligne et l'unité `DT` en dessous sur une seconde ligne.
    3. Le compte parent de Mohamed Trabelsi affichait prématurément le mois 12/2026 (Décembre) avec 1 040 DT de cotisations et 680 DT de faux arriérés alors que nous sommes en Novembre 2026.
  - **Corrections appliquées** :
    1. Ajout de l'entrée « Cotisations & Dépenses » (`المالية، الاشتراكات والمصاريف`) dans `moreMenuItems` de `MobileNavigation.jsx` avec ouverture directe de `<BillingManagementModal />` pour les rôles `admin` et `developer`.
    2. Protection stricte anti-coupure : classe utilitaire `.nowrap-dt` (`white-space: nowrap !important; flex-shrink: 0 !important;`) ajoutée dans `index.css`, application systématique de `nowrap-dt whitespace-nowrap shrink-0` avec espaces insécables `\u00A0DT` et conteneurs de gauche protégés par `min-w-0` dans `ParentBillingPage.jsx`, `MySpacePage.jsx` et `BillingManagementModal.jsx`.
    3. Purge en base Neon des 16 factures orphelines de test de Décembre 2026 (`amount_paid = 0`), et ajout d'un garde-fou backend SQL dans `billingService.js` (`getInvoices`) garantissant qu'un parent ne verra JAMAIS de mois futur non échu sauf s'il a été préalablement soldé par avance (`amount_paid > 0`). Mohamed Trabelsi ne voit plus Décembre et n'a plus que son solde légitime de 140 DT de Septembre.
- [x] **Point Courant Espace Parent, Exclusion Stricte des Mois Futurs du Reste à Payer, Historique Chronologique des Versements Réels (`PaymentsHistoryModal.jsx` & `/api/billing/my-payments`) et Fix Responsive Mobile Admin (`BillingManagementModal.jsx`)** (`ParentBillingPage.jsx`, `MySpacePage.jsx`, `PaymentsHistoryModal.jsx`, `BillingManagementModal.jsx`, `billing.js`) :
  - **Symptômes** :
    1. Sur l'espace parent, le versement d'une avance sur un mois futur (ex: Inès Issa versant 270 DT : 150 DT pour Nov. et 120 DT d'acompte sur Déc.) créait un faux impayé de 30 DT en alerte rouge anxiogène tout en propulsant Décembre en première carte au lieu du mois courant.
    2. Absence d'un écran dédié pour consulter chronologiquement ses versements réels en espèces avec dates, montants nets et reçus PDF.
    3. Sur smartphone (< 390px), le sélecteur de période de la modale admin comprimait le bouton d'action (`Génér...`), et le bouton de dépense affichait un `+` en doublon (`(+) + Nouvelle Dépense`).
  - **Corrections appliquées** :
    1. Repère temporel Point Courant : le mois en cours (Novembre 2026) s'affiche en vedette avec badge vert « Point courant ».
    2. Exclusion stricte des mois futurs du calcul de `totalRemainingDue` : zéro fausse dette, le compte d'Inès Issa affiche « ✓ À jour ». Les versements futurs sont valorisés en badge turquoise « ✓ Règlement anticipé ».
    3. Création de la modale `PaymentsHistoryModal.jsx` et de l'endpoint `GET /api/billing/my-payments` (reçus d'espèces réels avec date, montant total net, mode de règlement et bouton de reçu PDF).
    4. Boutons admin responsive compacts (`Générer` / `Dépense` sur mobile, `Générer ce mois` / `Nouvelle Dépense` dès `sm`), et suppression du `+` dupliqué.
- [x] **Ajustements Visuels & Mobiles Critiques : Safe-Area iOS Notch, Footer Cartes Famille Responsive 2 Lignes (Anti-Boutons Masqués/Coupés), Suppression Switch Famille/Enfant, et Exclusion Absolue Cartes Futures Espace Parent** (`BillingManagementModal.jsx`, `ParentBillingPage.jsx`, `MySpacePage.jsx`, `billingService.js`) :
  - **Symptômes identifiés avec photos d'audit** :
    1. Photo 1 : En-tête de la modale admin chevauchant la Dynamic Island / barre d'état iOS.
    2. Photo 2 : Bouton `Reçu PDF` masqué/repoussé hors écran sur cartes avec paiement partiel sur smartphone.
    3. Photo 3 : Bouton vert `Encaisser XXX DT` tronqué sur le bord droit sur mobile.
    4. Photo 4 : Switch d'onglets `Vue par Famille` / `Vue par Enfant` redondant et encombrant la barre d'outils.
    5. Photo 5 & Vue Mohamed Trabelsi : Présence indésirable de la carte Décembre 2026 sur l'espace parent avec débordement de texte hors conteneur.
  - **Corrections appliquées** :
    1. En-tête sécurisé avec `pt-[max(calc(env(safe-area-inset-top)+0.75rem),2.75rem)]` (zéro chevauchement encoche iOS).
    2. Pied de carte famille en 2 lignes mobiles : Ligne 1 avec Détail + Reçu PDF + Rappel + Annuler, Ligne 2 dédiée au CTA principal `Encaisser` / `Régler` pleine largeur (jamais masqué ni coupé).
    3. Suppression des onglets `Vue par Enfant` au profit d'une expérience unifiée centrée sur la famille.
    4. Filtrage strict `isFuture` et `status !== 'cancelled'` sur l'espace parent.
- [x] **Élimination Définitive des Rayures Flottantes Modales (Bordures Natives CSS), Anti-Débordement Ligne d'Actions Mobile, Z-Index Sub-modales (`z-[70]`) & Réconciliation Finale Trabelsi** (`index.css`, `BillingManagementModal.jsx`, `MySpacePage.jsx`, `ParentBillingPage.jsx`, `reconcile_trabelsi_billing.js`) :
  - **Symptômes identifiés avec photos d'audit** :
    1. Bandes verticales colorées (bleu, vert, jaune, rouge) transperçant les modales secondaires (ex: modale « Enregistrer une Dépense »).
    2. Débordement du bouton « Annuler » hors de la carte sur écran étroit mobile.
    3. Présence de boutons vierges / incompréhensibles sur la ligne d'action mobile.
    4. Fausse dette historique de la famille Trabelsi (factures indues pour Samir avant sa date d'admission en novembre 2026).
  - **Corrections appliquées** :
    1. Remplacement de tous les pseudo-éléments `::before` par des bordures natives `border-left-width: 4px !important;` dans `index.css`.
    2. Remplacement de la classe invalide `z-60` par `z-[70]` et `style={{ zIndex: 70 }}` sur les 6 sous-modales de `BillingManagementModal.jsx`, avec ajout d'un bouton de fermeture `X` et normalisation des champs.
    3. Limitation stricte à 2 boutons sur la ligne mobile 1 (`Reçu PDF` + `Rappel`), report de l'action d'annulation dans l'accordéon « Détail » (`Annuler l'encaissement (droit à l'erreur)`).
    4. Exécution du script de réconciliation Neon : Samir admis au 01/11/2026, factures indues supprimées, Septembre soldé pour Youssef, 100 DT d'avoir crédités au parent, et solde restant dû ramené à 0 DT.
    3. Suppression totale du switch Famille/Enfant (vue famille épurée exclusive).
    4. Filtrage strict `!isFuturePeriod` à la source éliminant toute carte future de l'espace parent et suppression des débordements de texte.

## �👤 Rôles & Permissions

- [ ] **Ajouter un rôle `doctor`** — médecin conventionné de la crèche (accès dossiers médicaux des enfants, traitements, rapports santé)
- [ ] **Adresse parent/enfant dans la fiche enfant** — afficher l'adresse dans les détails d'un enfant, visible uniquement avec une permission dédiée (ex: `child.view_address` — admin/directrice uniquement)

## 🎨 Design / UI

- [ ] **Modifier le skin du site** — nouveau thème/charte graphique

## ⚙️ Fonctionnalités

- [ ] **Gestion de stock de la crèche** — inventaire des fournitures avec 2 stocks distincts :
  - **Stock crèche** — fournitures de l'établissement (matériel, consommables communs) — *non fait*
  - **Stock enfants** — ✅ FAIT : tables `child_supplies` + `daily_supplies_brought`, routes `supplies.js` (`refill`, `use`, `daily-brought`) avec alerte de seuil bas
  - *Reste à faire : le stock crèche (matériel/entretien) + éventuelle refonte UI*
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
- [x] **Remplacer "Assistance au déjeuner" par "Présence le samedi" dans le formulaire d'inscription** :
  - Le champ `enrollments.lunch_assistance` n'était utilisé nulle part côté métier : la valeur n'était même pas envoyée au backend par les formulaires (`EnrollmentPage.jsx`, `AddChildPage.jsx` dashboard), jamais transférée vers `children`, jamais affichée côté staff/admin.
  - Renommé en `saturday_attendance` sur `enrollments`/`enrollments_archive` (migration `009_saturday_attendance`) + nouvelle colonne durable `children.saturday_attendance` (survit à l'archivage de l'inscription, modifiable dans le temps).
  - Transféré correctement lors de l'approbation (`childLifecycleService.createChild`, `appointmentsController.completeAppointment`), exposé en lecture/écriture sur `PUT /api/children/:id`, affiché et éditable dans `ChildrenPage.jsx` (modal enfant), visible pour l'admin dans `PendingEnrollmentsPage.jsx`, et mis en avant le samedi dans l'écran de pointage (`TodaySection.jsx` : tri + badge "attendu aujourd'hui").
  - Voir `corrections.md` Fiche 60 (nettoyage préalable du code mort) et Fiche 61 (implémentation complète).
- [x] **Clôture automatique des présences à l'heure de fermeture & arrêt automatique des compteurs** :
  - Détection automatique des sorties non pointées par le personnel à l'heure officielle de fermeture (`nursery_settings.closing_time`, ex: 18h00 en semaine / 13h00 le samedi).
  - Backend : `attendanceAutoCheckoutService.js` clôture automatiquement en base tout enregistrement non terminé (`check_out_time = date + closing_time`) avec note d'audit `[Départ automatique - fermeture de la crèche]`.
  - Exécution double : automatique à chaque consultation des présences (`/today`, `/currently-present`, `/stats`, `/date/:date`) + cron planifié `attendanceJob.js` (13h/18h et sécurité à 20h).
- [x] **Unification Profil & Préférences personnelles ("Mon Compte") pour Staff et Parents (Fin de l'erreur 403 sur Paramètres)** :
  - Centralisation dans `UnifiedProfilePage.jsx` (`/profile`) : Photo, coordonnées personnelles, changement de mot de passe, thème Clair/Sombre, langue de l'interface (Français/العربية), activation des notifications Push PWA sur l'appareil et rappel matinal de pointage pour le staff.
  - Redirection automatique intelligente de `/dashboard/settings` vers `/profile` pour les non-admins (Staff et Parents), éliminant définitivement les erreurs 403 Forbidden.
  - Mise à jour de la navigation mobile et desktop pour un ciblage clair : "Paramètres crèche" pour Admin/Dev et "Mon Compte & Préférences" pour Staff/Parents.
- [x] **Widget unifié de présence en direct et fil d'activité pour la Direction & Développeur** :
  - Réservé exclusivement à `admin` et `developer` (bloqué côté backend et masqué côté frontend).
  - Rôle `developer` strictement masqué des listes et badges de présence utilisateur.
  - Deux colonnes sur grand écran : Activités récentes des enfants et de l'équipe | Présence en direct avec filtres Connectés, Équipe, Parents, Tous sans troncature de texte.
  - Remontée en temps réel des tâches créées et complétées par le personnel dans le flux d'activité du tableau de bord.
- [x] **Notifications & Rétroaction en temps réel des Tâches** :
  - Notification Push et in-app instantanée à l'éducatrice lors de l'assignation d'une tâche.
  - Notification in-app et Push à la direction lors de la complétion d'une tâche par une éducatrice.
  - Correction du routage d'API de complétion de tâche (`/api/tasks/:id/status` avec repli de sécurité sur `/api/events/:id/status`).
  - Redirection immédiate de la bannière d'alerte des tâches en retard du mobile vers la modale des tâches en retard (`openFocusMode('overdue')`) plutôt que vers le planning général.
- [x] **Système de Tarification, Régimes d'accueil (Journée / Demi-journée 13h) & Gestion des Paiements / Alertes** : ✅ **Implémenté** (migration `015_billing_and_care_schedule.js` : `child_invoices` + `nursery_expenses` + `care_schedule` + `monthly_discount` ; `billing.js` : settings, génération factures, paiement espèces, ajustement, rappels, reçu PDF, dépenses CRUD ; `GET /billing/summary` bilan recettes/dépenses ; `GET /billing/my-invoices` espace parent ; `BillingManagementModal.jsx` ; auto-checkout 13h pour `half_day`)
  - **Contexte & Règles métier validées** :
    - La crèche accueille des enfants selon 2 formules :
      - **Journée complète** (garde toute la journée jusqu'à la fermeture normale, ex: 18h).
      - **Demi-journée** (garde matinale uniquement, départ au plus tard à 13h00).
    - Grille tarifaire paramétrable et indexable par l'administration (tarifs de référence pour l'année en cours) :
      - Formule Journée complète : **130 DT / mois**
      - Formule Demi-journée : **100 DT / mois**
      - Option Présence le Samedi : **20 DT / mois** (s'appuie sur `saturday_attendance`, prise d'effet le mois suivant si modifiée en cours de route)
      - Frais d'assurance annuelle : **60 DT / an** par **année scolaire** (exigible à l'inscription initiale, puis renouvelable à chaque rentrée scolaire de septembre)
    - **Remise exceptionnelle fixe (DT)** : Possibilité pour l'administrateur d'accorder une remise fixe en dinars tunisiens (montant fixe, non basé sur un pourcentage) dès l'inscription ou ultérieurement sur la fiche enfant.
    - **Prorata en cours de mois** : Calcul automatique suggéré au prorata des jours ouvrés restants pour une inscription en cours de mois, tout en laissant l'administrateur libre d'ajuster ou valider le montant final.
    - **Encaissement** : Principalement géré en **espèces** avec émission et traçabilité d'un reçu d'encaissement.
  - **Transparence des prix vs Gestion comptable (Feature Flag)** :
    - **Affichage des tarifs dans le formulaire d'inscription** : Les tarifs de la crèche (Journée complète, Demi-journée, Samedi, Assurance) sont **toujours affichés de manière transparente pour les parents**, que la gestion comptable soit activée ou non par l'administration.
    - **Interrupteur d'activation Admin (`nursery_settings.billing_enabled`)** : Active la *gestion active des paiements* (génération des échéances mensuelles, historique des règlements espèces, remises fixes, alertes de paiement ciblées et espace cotisations parent).
  - **Décorticage du workflow & Gestion des données** :
    1. **Configuration Admin (`/dashboard/settings`)** :
       - Interrupteur d'activation de la gestion comptable : `billing_enabled` (booléen).
       - Grille tarifaire annuelle : `tariff_full_day_monthly` (130 DT), `tariff_half_day_monthly` (100 DT), `tariff_saturday_monthly` (20 DT), `tariff_insurance_annual` (60 DT), `billing_due_day` (ex: le 5 du mois).
    2. **Inscription (`EnrollmentPage.jsx` public & `AddChildPage.jsx` dashboard)** :
       - Sélection obligatoire du régime d'accueil : `Journée complète` ou `Demi-journée (départ max 13h)`.
       - Option Samedi déjà existante (`saturday_attendance`) affichant clairement le supplément (+20 DT/mois).
       - Récapitulatif tarifaire automatique et instantané pour les parents (Mensualité + Assurance annuelle 60 DT).
       - Côté admin : champ optionnel pour renseigner une remise exceptionnelle fixe en DT dès l'inscription.
    3. **Persistance & Cycle de vie (`children`, `enrollments`, `enrollments_archive`)** :
       - Nouvelles colonnes durables : `care_schedule` (`full_day` | `half_day`) et `monthly_discount` (NUMERIC DEFAULT 0).
       - Prise en charge par `childLifecycleService.createChild` lors de la validation du dossier.
       - Édition souple dans la modale enfant (`ChildrenPage.jsx`).
    4. **Refonte intégrale du système d'alerte et suivi des paiements (Zéro code mort)** :
       - *Élimination des bugs et du code orphelin existant* :
         - Remplacement de l'ancienne route tronquée `paymentAlerts.js` (qui plantait avec `deleted_at`) et de la modale manuelle `PaymentAlertModal.jsx`.
       - *Table dédiée de suivi financier (`child_bills` / `payments`)* :
         - Historise chaque mois dû : `child_id`, `parent_id`, `period_month`, `period_year`, `school_year`, `base_amount`, `saturday_amount`, `insurance_amount`, `discount_amount`, `total_due`, `amount_paid`, `status` (`pending`, `paid`, `overdue`), `paid_at`, `payment_method` (`cash`), `receipt_number`.
         - Interface Admin : Tableau de bord des cotisations, validation des encaissements en espèces en 1 clic avec génération du reçu.
         - Relances et alertes ciblées : Envoi d'alerte de paiement Push & in-app pré-remplie avec le montant réel calculé pour l'enfant.
         - Espace Parent (`/mon-espace`) : Consultation claire des cotisations réglées en espèces et du solde à payer.
    5. **Impact direct sur les présences (`attendanceAutoCheckoutService.js`)** :
       - Pour les enfants en formule `half_day`, la clôture automatique en semaine se déclenche dès **13h00** s'ils n'ont pas été pointés en sortie par l'éducatrice. Les enfants en `full_day` restent jusqu'à l'heure normale (18h00).
    6. **Évolutivité future garantie : Module Trésorerie & Dépenses de la crèche** :
       - **Architecture pensée en double volet dès la conception** :
         - *Volet Recettes* : Cotisations des enfants, options samedi, assurances annuelles (`child_invoices`).
         - *Volet Dépenses* (extension future immédiate) : Table `nursery_expenses` catégorisée (salaires, loyer, électricité STEG / eau SONEDE, alimentation/goûters, matériel pédagogique, entretien).
         - *Bilan & Rentabilité* : Agrégation mensuelle et annuelle automatisée : `Total Recettes encaissées - Total Dépenses = Bénéfice net / Solde de trésorerie` de la crèche.
       - **Modularité** : Le module backend et le schéma DB sont structurés sous le domaine `finance` pour accueillir le volet dépenses sans jamais devoir refactoriser ou casser la facturation des enfants.
- [ ] **Badge d'horaires et de moments de la journée en direct dynamique (Site public & Mobile)** :
  - **Remplacement du programme statique en dur (`NURSERY_SCHEDULE`)** par un moteur dynamique et contextuel capable de détecter l'état réel de la crèche à chaque instant :
    1. **Détection automatique des fermetures** :
       - Fermeture hebdomadaire le **Dimanche** (`🔴 Fermé — Dimanche`).
       - Détection des **jours fériés tunisiens** (fixes et mobiles/fêtes religieuses) et congés annuels configurés dans les paramètres (`🔴 Fermé — Jour férié / Vacances`).
       - En dehors des heures d'ouverture : affichage de l'heure de réouverture (`🌙 Fermé — Ouvre demain à 07:00`).
    2. **Gestion des événements spéciaux & Visites médicales (priorité sur la routine)** :
       - **Événements sur toute la journée** (ex: *Journée Portes Ouvertes*, *Fête de fin d'année*, *Carnaval*).
       - **Événements ponctuels sur plage horaire** (ex: *Spectacle ou Goûter à 15h30*).
       - **Visite médicale pédiatrique (🩺)** : créneau dédié affiché en direct sur le badge (*"Visite médicale en cours"*).
         - *Phase 1 (Actuelle)* : Planification et saisie **manuelle** par la directrice/admin dans les paramètres/planning.
         - *Phase 2 (Évolution)* : Génération automatique lors de la planification d'interventions par le futur rôle `doctor` (médecin conventionné).
    3. **Programme standard de routine (Lundi - Samedi)** :
       - Plages habituelles (Accueil, Petit-déjeuner, Activités d'éveil, Repas, Sieste, Goûter, Départs) configurables directement depuis les paramètres crèche (`DashboardSettingsPage`) avec prise en compte du samedi matin (08:00 - 13:00 si activé).
  - Intégration sur le Header mobile, Navbar publique, Page Contact et Espace Parent.
- [ ] **Espace Co-parentalité — Ajout du 2ème parent par lien d'invitation sécurisé (Option B - WhatsApp / SMS)** :
  - **Invitation fluide en 1 clic par le parent connecté** :
    - Depuis `/mon-espace` ou `/profile`, le parent principal (père ou mère) clique sur *"Inviter l'autre parent (Conjoint)"*.
    - Renseignement du lien de parenté (*Mère*, *Père*, *Tuteur légal*) et génération instantanée d'un **lien d'invitation sécurisé (Magic Link)** avec jeton unique à durée limitée (ex: 48h / 7 jours).
    - Boutons d'action rapide : **"Partager sur WhatsApp"** avec message prérempli d'invitation au dossier de l'enfant, ou **"Copier le lien"** (SMS / email).
  - **Parcours d'acceptation simplifié pour le 2ème parent** :
    - Page d'accueil dédiée au clic sur le lien : saisie rapide du mot de passe (et coordonnées) sans formulaire complexe d'inscription.
    - Rattachement automatique et instantané à tous les enfants du dossier familial via la table existante `parent_children` (colonnes `relationship`: *father/mother*, `is_primary: false`).
  - **Expérience partagée et synchronisée** :
    - Accès indépendant avec ses propres identifiants (chacun son compte sur son smartphone).
    - Consultation commune du fil d'activité, photos, bilans journaliers (repas, siestes, changes), présences en direct et carnet de liaison.
  - **Suivi et sécurité** :
    - Tableau de bord du parent émetteur affichant l'état de l'invitation (*En attente*, *Acceptée*, ou *Révoquer le lien*).
    - Contrôle administratif préservé : visibilité des deux parents sur la fiche enfant pour l'administration et verrou de dissociation réservé à la direction en cas de litige familial.
- [x] **Gestion des Cotisations par Foyer / Famille, Paiements Multi-Mois & Gestion des Avoirs (Crédits d'avance)** :
  - **1. Vue consolidée par Parent / Famille (`BillingManagementModal.jsx`)** :
    - Regroupement des cotisations par foyer (nom du parent, téléphone, liste des enfants rattachés, total dû global du foyer).
    - Possibilité d'alterner en 1 clic entre la vue *Par Famille* (naturelle pour l'accueil) et la vue *Par Enfant* (détail analytique).
  - **2. Fenêtre d'encaissement modulaire avec sélection des enfants** :
    - Cases à cocher par enfant pour régler soit un seul enfant (paiement échelonné de la fratrie), soit l'ensemble de la fratrie en une seule transaction.
    - Mise à jour dynamique du montant à percevoir et adaptation automatique du reçu selon les enfants cochés.
  - **3. Paiements d'avance Multi-mois (1 mois, 2 mois, Trimestre / 3 mois)** :
    - Sélecteur de durée permettant d'encaisser plusieurs mois d'un coup (ex: Novembre + Décembre, ou trimestre complet).
    - Génération et validation automatique des factures futures en statut `paid`, avec suspension automatique des relances pour les mois déjà couverts.
    - Émission d'un reçu officiel unique et traçable mentionnant l'ensemble des mois acquittés.
  - **4. Transparence des arriérés & Gestion des Avoirs / Trop-perçu** :
    - Décomposition textuelle explicite des montants sur l'Espace Parent et sur l'interface admin (ex: *100 DT forfait + 20 DT arriéré d'octobre*).
    - Gestion du surplus monétaire (trop-perçu) sous forme d'avoir / crédit familial reporté automatiquement en déduction de l'échéance suivante.
- [ ] **Droit à l'erreur & Résilience aux fautes de frappe — Audit et sécurisation des fonctionnalités transverses** :
  - [x] **1. Facturation & Encaissements (`billing.js` & `BillingManagementModal.jsx`)** :
    - Route et action d'annulation d'un encaissement validé par erreur :
      - Vue Enfant (`POST /api/billing/invoices/:id/void-payment`) : remise de la facture en statut `pending`, reset de l'encaissement et marquage du reçu comme annulé sans briser la traçabilité.
      - Vue par Famille (`POST /api/billing/family-void-payment`) : annulation atomique complète de toute la transaction familiale (même sur paiements d'avance multi-mois), purge propre des factures futures générées d'avance, réinitialisation à `pending`, et restitution/annulation des avoirs (`credit_balance`) pour rétablir la situation comme si aucun paiement n'avait eu lieu.
    - Épuration & alignement strict de la « Vue par Famille » : suppression des étiquettes d'enfants pour un affichage uniforme et épuré avec numéro de téléphone direct (`📞 Téléphone`).
    - **Harmonisation visuelle & Calibrage strict des boutons en Vue par Famille & Enfant** :
      - Déplacement du reste dû sous forme d'un badge arrondi sur la 2ème ligne (`⏳ Reste dû : XX DT`, calqué sur `💰 Avoir disponible`) à côté du téléphone.
      - En Vue par Enfant : positionnement des badges d'arriéré (`[ Arriéré : +XX DT ]`) et de remise (`[ Remise : -XX DT ]`) directement sur la 1ère ligne.
      - Intégration directe des montants dans le bouton d'action : `Encaisser {total} DT` (calibré en `w-44` / 176 px) pour les impayés et `Régler {reste} DT` (calibré en `w-36` / 144 px) pour les paiements partiels, avec alignement vertical strict sur toute la liste.
      - Maintien rigoureux de l'affichage du montant et de la mention `Soldé (Espèces)` lorsque le dossier est totalement payé.
      - Espace Parent (`/mon-espace`) : respect strict du mode sombre (résolution de `dark:bg-gray-750`), cartes en `dark:bg-gray-900/60`, bannière rouge dynamique pour le reste total dû du foyer (`Reste à payer sur votre compte famille`), et **unification 100% miroir des cartes de cotisations individuelles et fratries** (numéro de reçu en haut après le mois `Mois MM/YYYY • N° Reçu: REC-...`, mention du régime `(☀️ Journée complète)` / `(🌤️ Demi-journée)` avec icône entre parenthèses à côté du nom de l'enfant, et footer épuré avec bouton PDF isolé).
      - **Ergonomie des Cotisations & Reçus (Desktop & Mobile)** :
        - Application de la **Proposition 1** : affichage par défaut des impayés + des 3 derniers mois entièrement soldés, complété par un bouton accordéon `📂 Voir l'historique des mois précédents (X)` / `Masquer l'historique` pour ne pas encombrer l'écran au fil de l'année scolaire.
        - Création de la **page mobile dédiée** ([`ParentBillingPage.jsx`](file:///Volumes/Data/Works/Windsurf/creche/frontend/src/pages/parent/ParentBillingPage.jsx) sur `/mon-espace/cotisations`) avec design mobile-first soigné, indicateurs synthétiques, actualisation rapide, bannières dynamiques d'avoirs/arriérés et téléchargement immédiat des reçus PDF.
        - Intégration du lien d'accès direct **« Mes Cotisations & Reçus »** (pastille verte émeraude `CreditCard`) dans le menu **« Plus »** de la barre de navigation mobile ([`MobileNavigation.jsx`](file:///Volumes/Data/Works/Windsurf/creche/frontend/src/components/mobile/MobileNavigation.jsx)).
    - CRUD complet des dépenses de la crèche : implémentation de `PUT /api/billing/expenses/:id` et `DELETE /api/billing/expenses/:id` pour corriger les fautes de frappe sur les montants ou les dates de factures fournisseurs.
    - **Filtre Mensuel Universel & Dépenses Indépendantes (`BillingManagementModal.jsx` & `billingService.js`)** :
      - Sélecteur de période universel (mois & année avec menus déroulants bilingues FR/AR, chevrons de navigation et bouton `[Ce mois]`).
      - Alignement strict sur la même ligne (`flex-nowrap`, `shrink-0`) du sélecteur de période, du bouton `[Ce mois]` et du bouton d'action `Générer ce mois` / `Nouvelle Dépense`.
      - Élargissement de la modale (`max-w-6xl xl:max-w-7xl 2xl:max-w-[88rem]`) garantissant la visibilité intégrale de l'onglet « Alerte Rapide Personnalisée » sans troncature.
      - Filtrage temporel fidèle des enfants inscrits (`c.created_at <= endOfTargetMonth`) lors de la consultation ou de la génération d'un mois passé (les enfants inscrits ultérieurement n'apparaissent plus dans l'historique antérieur).
      - Synchronisation directe des onglets « Cotisations du Mois » et « Dépenses & Trésorerie » ainsi que du bandeau financier synthétique.
      - Calcul strictement indépendant des dépenses et de la trésorerie nette de chaque mois (aucune accumulation ou report artificiel entre les mois).
      - Pré-remplissage intelligent de la date sur le mois consulté lors de l'ajout d'une dépense passée ou future.
      - Dynamisation du bouton de génération (`Générer ce mois` vs `Générer [Mois] [Année]`).
    - **Perfectionnement Visuel & Mode Sombre (Photo 1 & Photo 2)** :
      - Résolution du mode sombre sur les cartes de cotisations parents (`bg-white dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700/80 shadow-xs`), éliminant définitivement le fond gris délavé.
      - Intégration en première ligne de chaque carte des badges arrondis avec bordures franches : `[ Arriéré : +XX DT ]` (rose) et `[ Remise : -XX DT ]` (émeraude).
    - [x] **Affichage des Flux Réels Encaissés & Comptabilisation de Caisse Réelle (Multi-mois & Anticipation)** :
      - Affichage explicite du montant physiquement encaissé par parent pour le mois consulté (ex: « Total encaissé ce mois : 500 DT » en vert bien visible).
      - Décomposition claire en un coup d'œil sur la fiche du parent : Forfait du mois en cours + Forfait(s) futur(s) réglé(s) d'avance + N° de reçu unique.
      - Règle de trésorerie réelle : Tout encaissement perçu physiquement au cours d'un mois M (y compris les avances sur les mois M+1, M+2) est rattaché aux recettes de caisse du mois M pour correspondre fidèlement à l'argent liquide disponible pour payer les charges du mois M.
      - Traitement du mois d'avance (M+1) : Affiche son forfait attendu mais avec la mention « Déjà réglé par anticipation le [date] », reste à percevoir = 0 DT, et nouvel encaissement attendu = 0 DT (évite toute fausse prévision d'entrée d'argent).
    - [x] **Correction 110 — Audit et stabilisation comptable & ergonomique iOS** :
      - Verrouillage strict du moteur de facturation sur la date d'admission (`c.admission_date`, `e.enrollment_date`) : aucun enfant ne peut être facturé ni généré avant son admission officielle.
      - Élimination des mois de vacances fermées à 0 DT (Août) de la vue parents, et conditionnement strict de l'assurance scolaire (`itemInsurance > 0 && itemDue > 0`).
      - Réconciliation financière complète du foyer Mohamed Trabelsi : purge des factures prématurées de Samir (Sept/Oct), réaffectation des 140 DT à Youssef (Septembre soldé), Samir intégré à partir de Novembre, solde d'avoir de 100 DT inscrit et dette totale ramenée à 0 DT.
      - Modale d'administration : protection Safe Area iOS / Dynamic Island (`.modal-ios-safe-header`), défilement anti-coupure (`.modal-ios-safe-scroll`), boutons responsives sans débordement ni masquage (`flex-1 sm:flex-initial`), et suppression définitive des onglets résiduels de la 'Vue par Enfant' au profit d'une vue par famille fluide.
      - Espace Parent : pied de carte dédié stylisé dans un conteneur délimité (`-mx-4 -mb-4 px-4 py-3 rounded-b-xl bg-gray-50/70 border-t`) avec date de règlement (`Le DD/MM/YYYY`) et accès direct à l'historique chronologique des versements réels (`PaymentsHistoryModal`).
      - Option de régularisation des mois historiques antérieurs (Septembre/Octobre) déjà payés en espèces avant l'informatisation.
    - [x] **Correction 111 — Boutons Inconnus/Vides (Rappel & Annulation), Respect du Mode Clair Carte Héro Trésorerie & Anti-Troncature En-tête** :
      - Libellés explicites avec icônes contrastées pour les boutons « Rappel » (`Bell` ambre) et « Annuler » (`RotateCcw` rose) évitant l'effet de rectangles blancs vides.
      - Fiabilisation du rappel avec `invoiceId` garanti (fin de l'erreur `undefined/remind`), confirmation par toast vert.
      - Adaptation de la carte Héro Trésorerie Nette au mode clair (`bg-gradient-to-r from-emerald-50/90 to-white` en light vs `dark:from-[#0F172A]` en dark).
      - Recalibrage du sous-titre de l'en-tête (« Recettes, charges & reçus PDF ») sans aucune coupure `...`.
    - [x] **Règles Financières Métier Strictes (FIFO, Verrouillage Avances si Dettes, Fermeture Annuelle Août 0 DT) & Responsive Style C Mobile (`BillingManagementModal.jsx` & `billingService.js`)** :
      - **Principe FIFO Strict** : Tout règlement partiel ou multi-mois comble d'abord à 100% le mois le plus ancien avant d'attribuer le moindre dinar au mois futur (rectification Inès Issa : Novembre soldé à 150 DT, Décembre partiel à 120 DT).
      - **Verrouillage des Avances en Cas d'Arriérés** : Les boutons 2 mois et 3 mois d'avance sont désactivés avec cadenas 🔒 et message d'avertissement si la famille traîne des dettes antérieures (obligation de solder les arriérés en priorité).
      - **Neutralisation de la Fermeture Annuelle d'Août** : Le mois d'Août (mois 8) est reconnu par défaut comme congé annuel de la crèche (forfait 0 DT, statut annulé, et purge des dettes fantômes en base de données).
      - **Filtre Strict d'Inscription dans l'Historique** : Seuls les enfants inscrits au plus tard pendant le mois sélectionné (`c.created_at <= FinDuMois`) apparaissent dans les listes de cotisations passées (élimination des apparitions indûment anticipées).
      - **Style C Mobile 100% Conforme (`maquette_cotisation.html`)** : Refonte visuelle et structurelle intégrale — bandeau d'en-tête émeraude dégradé, onglets 50/50 avec compteurs, sélecteur de période en pilule `< Mois Année >` sans troncature avec bouton contextuel `Générer ce mois` / `+ Nouvelle Dépense`, carte Héro Trésorerie Nette nuit (`bg-[#0F172A]`) avec icône banque `Landmark`, grille 2x2 des 4 KPI avec bandelettes d'accent gauche, barre d'outils (switch Vue Famille/Enfant, recherche, filtres statut), cartes Style C avec liseré de couleur 4px (`border-l-4`), avatar 2 lettres en dégradé, prix en haut à droite avec statut pill dessous, accordéon dépliable par fratrie avec forfaits individuels, boutons d'action formatés, règle anti-coupure stricte `.nowrap-dt`, et allègement du menu Plus mobile (suppression d'Activité récentes).
      - **Header Desktop Universel Sans Troncature** : Adaptation responsive fluide (`xl:flex-row`, dialogue soigné `max-w-[96vw] 2xl:max-w-[1440px]`) éliminant définitivement la troncature de l'onglet et le débordement des boutons sur tous les formats d'écrans.
    - Garde-fous UX : modale de confirmation récapitulative avant encaissement et alerte si le montant saisi dépasse le solde restant.
    - Suivi de l'assurance scolaire annuelle par enfant (`children.insurance_paid_school_year`) : rétroactivité automatique pour les enfants déjà inscrits (évite le doublon indu de 60 DT lors du déploiement en prod), première facture à +60 DT réservée aux nouvelles inscriptions en cours d'année, et renouvellement automatisé à chaque rentrée de septembre.
  - [x] **2. Pointage & Présences — Mode Forfaitaire / Horaire, Correction Rétrospective & Samedi strict (`attendance.js`, `TodaySection.jsx`, `MobileAttendance.jsx` & `attendanceAutoCheckoutService.js`)** :
    - **Calcul d'heures optionnel (`hourly = true / false`)** configurable depuis les paramètres crèche :
      - Si `hourly = true` : mode réel conservé tel quel (pointage arrivée et départ horodatés à la minute exacte du clic).
      - Si `hourly = false` : mode journalier simplifié en 1 seul clic par enfant. Le système applique automatiquement les plages horaires forfaitaires contractuelles sans exiger de double pointage :
        - Enfant en journée complète (`care_schedule = 'full_day'`) : forfait `07:00 - 18:00`.
        - Enfant en demi-journée (`care_schedule = 'half_day'`) : forfait `07:00 - 13:00`.
        - Le samedi : toujours `07:00 - 13:00` pour tous les présents.
    - **UX Mobile fluide et sans toast intrusif (`MobileAttendance.jsx`)** :
      - 1er clic sur un enfant absent : marquage immédiat en **Présent** (vert) sans aucun toast bloquant pour permettre le pointage rapide à la chaîne le matin.
      - 2ème clic sur un enfant déjà présent : dialogue de confirmation obligatoire (*« Êtes-vous sûr(e) de marquer cet enfant absent aujourd'hui ? »*) pour éviter tout dépointage accidentel.
    - **Clôture automatique avec 1h de battement (`attendanceAutoCheckoutService.js` & `attendanceJob.js`)** :
      - Clôture demi-journée à **14h00** (au lieu de 13h00, 1h après la fermeture).
      - Clôture journée complète à **19h00** (au lieu de 18h00, 1h après la fermeture).
      - Samedi à **14h00** (au lieu de 13h00).
      - L'heure de sortie enregistrée dans la base reste l'heure contractuelle de fermeture (`13:00` ou `18:00`).
    - **Tableau de correction rétrospective par date (`HistorySection.jsx`)** :
      - Sélecteur de date passée avec tableau interactif de tous les enfants pour ajuster / corriger les oublis.
      - **Heure non obligatoire lors de la correction** (même si `hourly = true`) : bascule directe Présent / Absent avec repli forfaitaire automatique si aucune heure n'est renseignée, ou champs d'heures optionnels pour ajustement fin.
      - Routes backend dédiées : `PUT /api/attendance/:id` (mise à jour) et `DELETE /api/attendance/:id` (annulation).
    - **Samedi strict & Accueil exceptionnel notifié** :
      - Filtrage strict le samedi dans `TodaySection.jsx` et `MobileAttendance.jsx` : n'affiche que les enfants inscrits au samedi (`saturday_attendance = true`).
      - Bouton d'action **« + Accueil exceptionnel samedi »** pour pointer un enfant non inscrit ce jour-là.
      - Notification push PWA et in-app immédiate envoyée au parent : *« Votre enfant [Prénom] a été accueilli exceptionnellement aujourd'hui (Samedi). »*.
    - **Statistiques temps réel rigoureuses (Total, Présents, Absents, Terminé)** :
      - Prise en compte stricte du samedi : l'effectif Total attendu est égal au nombre d'enfants inscrits le samedi (`saturday_attendance = true`) augmenté des accueils exceptionnels de la date cible.
      - Calcul exact des absents (`Total - Présents - Terminé`) et synchronisation réactive instantanée sur desktop et mobile (correction de l'affichage `Total: 0` ou `Absents: 0`).
      - Clarté des libellés et séparation stricte des widgets de présence (`TodaySection.jsx`) :
        - **Widget Haut (« Enfants présents aujourd'hui »)** : regroupe tous les enfants pointés du jour (en cours ou clôturés/partis). Affichage de l'arrivée, départ, durée, badge de clôture automatique et bouton **« ✏️ Rectifier les heures »** pour ajuster les horaires directement depuis la section.
        - **Widget Bas (« Enregistrement rapide (Non encore pointés) »)** : restreint rigoureusement aux enfants n'ayant aucun pointage aujourd'hui (ou marqués absents). Tout enfant pointé quitte définitivement cette section.
        - **Pointage tardif / Rattrapage (crèche fermée)** : détection automatique de la fermeture de la crèche (`isCrecheClosed`). En mode horaire, le clic sur « Marquer présent » pour un enfant non pointé en soirée déclenche une modale de rattrapage dédiée préremplie avec les horaires contractuels standards (07h00 - 13h00 / 18h00), éditables par l'administrateur. En mode forfaitaire journalier, le pointage s'effectue directement en 1 clic.
        - **Correction affichage des boutons d'actions dans l'Historique (`HistorySection.jsx`)** : correction de l'invisibilité des boutons d'actions dans la colonne « Actions / Correction » (en modes dark et light) causée par l'écrasement CSS du bouton ghost (`min-height: 44px; padding: 0.75rem 1rem;`) par des boutons stylisés avec classes d'isolation `compact-btn icon-only`, dimensionnés à `w-8 h-8` avec bordures et arrière-plans contrastés et dialogue de confirmation non-natif `dialog.confirm`.
  - **3. Santé, Traitements & Mesures corporelles (`treatments.js` & `children.js`)** :
    - Déclaration d'erreur de saisie pour une administration médicamenteuse (`POST /api/treatments/administrations/:id/cancel` avec note explicative) pour éviter toute confusion parent/personnel.
    - Bornage physiologique strict lors de la saisie du poids (`2.0 - 35.0 kg`) et de la taille (`45 - 130 cm`) avec alerte visuelle si anomalie par rapport à l'âge.
    - Possibilité de supprimer une mesure aberrante dans l'historique de croissance (`DELETE /api/children/:id/growth/:recordId`).
  - **4. Workflow Inscriptions & Sécurisation des Rendez-vous (`appointmentsController.js` & `enrollments.js`)** :
    - Remplacement de la suppression destructrice en cascade lors de l'annulation d'un RDV d'inscription (`DELETE FROM users`, `DELETE FROM enrollments`) par un archivage réversible avec option de réactivation par la direction.
    - Route `PUT /api/enrollments/:id` pour permettre l'édition administrative des données d'un candidat avant ou après son rendez-vous (correction d'une faute de frappe dans l'email ou le téléphone).
  - **5. Fournitures & Consommables (`supplies.js` & `dailyReportsController.js`)** :
    - Mode "Ajustement d'inventaire direct" sur `child_supplies` pour redéfinir la quantité réelle en cas de saisie erronée d'un réapprovisionnement.
    - Correction du calcul différentiel des couches lors de l'édition d'un rapport journalier (évitant de vider le stock en cas d'éditions successives).
  - **6. Fil d'Activité, Alertes & Communication (`activities.js`, `paymentAlerts.js` & `announcements.js`)** :
    - Route d'édition `PUT /api/activities/:id` pour corriger une faute de frappe ou un tag d'enfant sans devoir détruire la publication et ses photos.
    - Écran de prévisualisation et confirmation chiffrée avant diffusion d'une alerte de paiement collective aux parents.
    - Édition des annonces générales de la crèche (`PUT /api/announcements/:id`).
- [x] **Dégagement Barre de Tâches Mobile (Rapports enfants, Contacts d'urgence), En-tête Conversation Messagerie & Accès Direct Remises Règlement Familial** :
  - **Dégagement complet rapports enfants (`ChildDailyReportsPage`)** : padding `pb-44`, densification de la carte d'état vide (`py-5 sm:py-10`) et du sélecteur de date pour éliminer tout chevauchement sous la barre `MobileNavigation`.
  - **Sécurisation modales iPhone SE (`MobileParentSpace`)** : élévation des modales enfant et contacts d'urgence en `z-[120]` montées sur `document.body` via `createPortal`, padding inférieur de sécurité `pb-[max(1.5rem,calc(env(safe-area-inset-bottom)+1.5rem))]` et compacité de l'état vide pour garantir une visibilité totale des boutons « Gérer les contacts » et « Fermer ».
  - **En-tête de chat mobile dégagé (`PublicLayout` & `MessagesPage`)** : masquage de `PublicHeader` sur mobile (`hidden lg:block`) sur la route `/mon-espace/messages`, restaurant l'affichage plein écran de l'en-tête de conversation avec son bouton de retour spacieux `←` sans bouton superflu sur la liste des contacts.
  - **Bouton Remise dans Règlement Familial (`BillingManagementModal`)** : découplage sémantique du `<label>` parent en `<div>` et mise en valeur du bouton `[ 🎛️ Remise ]` stylisé en ambre pour chaque enfant à régler avec élévation du modal de remise en `z-[85]`.
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

## � SaaS / Monétisation

- [ ] **Grille tarifaire SaaS en 3 plans (Essentiel / Pro / Premium) avec feature flags par tenant** :
  - **Modèle hybride** : forfait mensuel par palier + quotas inclus (nb enfants, nb staff) + supplément par tranche au-delà ; add-on multi-site au palier Premium pour les réseaux de crèches.
  - **Essentiel** (mono-crèche, quotas réduits) : inscriptions en ligne, fiches enfant/parent/contacts, présences avec clôture auto, bilans journaliers, fil d'activités (1 photo/post), messagerie interne, annonces/calendrier/jours fériés, les 14 permissions granulaires, notifications in-app, stockage Cloudinary réduit, sauvegardes courtes (7 j).
  - **Pro** (le plus vendu) : tout l'Essentiel + **facturation/cotisations** (`nursery_settings.billing_enabled`, `billingService.js`), traitements médicaux, suivi de croissance, photos multiples/carrousel, gestion des absences & tâches, témoignages publics, statistiques générales/rapport de présence consolidé, stockage moyen, sauvegardes 30 j.
  - **Premium** (réseau / haut de gamme) : tout le Pro + Assistant IA (Gemini, `aiAssistantService.js`), sauvegardes avancées (restauration 1 clic), stockage étendu, support prioritaire, add-on multi-site (nécessite la Phase 6 du plan multi-tenant), API/webhooks à construire.
  - **Jamais vendu, outils internes plateforme** : `/dashboard/activity-logs` et `/dashboard/storage` (Cloudinary Explorer) restent réservés au rôle `developer`/`super_admin`, quel que soit le plan du client.
  - **Implémentation technique suggérée** : table `tenant_features` (ou JSONB `tenants.feature_flags`) + middleware `requireFeature(code)` sur le même modèle que `requirePermission(code)` (`permissionsService.js`), lu au niveau tenant (en plus des permissions individuelles déjà existantes par membre du staff).
  - Documentation détaillée : voir `documentsV2/26_PLANS_SAAS_ET_FEATURE_FLAGS.md`.

## �📱 Mobile / PWA

- [x] **Bannière d'alerte contextuelle mobile** : le clic sur "Voir" pour les tâches en retard ouvre directement la modale dédiée aux tâches en souffrance sans quitter le tableau de bord ni renvoyer inutilement vers le planning.
- [x] **Navigation tactile & Bottom Navigation bar** : intégration du raccourci "Mon Compte & Préférences" dans le tiroir Plus pour tous les profils (parents et éducatrices).
- [x] **Épuration des En-têtes Mobiles & Navigation Intuitive** : suppression des boutons/flèches retour redondants sur les écrans de premier niveau (Catégorie 1 : annonces, pointages parent, absences parent, facturation parent, absences staff, tâches, planning mensuel/hebdomadaire et fil d'activités) au profit de la Bottom Navigation Bar permanente, avec en-têtes légers et pastilles d'icônes stylisées.
- [x] **Navigation Mobile Étape 2 (Sous-écrans & Drill-down)** : harmonisation et modernisation des boutons de retour contextuels sur les écrans de second niveau (fiches enfants parent/staff, formulaires d'inscription/ajout, consultations médicales, contacts d'urgence, journal quotidien) pour garantir un retour précis vers la vue parente avec espacement de confort.
- [x] **Navigation Mobile Étape 3 (Formulaires de Saisie & Inscription Express)** : remplacement des flèches retour ambiguës par un bouton de fermeture explicite [✕] en en-tête et bouton [Annuler] en pied de formulaire (`StaffMemoForm.jsx`, `AddUserPage.jsx`), intégration de la Bottom Navigation bar tactile (`pb-24`), et redirection systématique de `AddChildPage.jsx` (admin) vers l'inscription express unifiée (`AddUserPage.jsx?role=parent`).
- [x] **Audit Global & Assainissement Mobile** : élimination de 100% des imports et codes orphelins sur les 21 écrans mobiles (analyse AST Babel), généralisation de la Bottom Navigation (`MobileNavigation`) et calibrage des marges tactiles (`pb-24`) sans aucun chevauchement.
- [x] **Déblocage Navigation Paramètres & Stats, Modales iPhone SE & Standardisation Globale du Bouton Retour** :
  - **Déblocage complet** de `/dashboard/general-stats` et `/dashboard/settings` sur smartphone : ajout du bouton retour vers `/dashboard` et de la barre de navigation tactile persistante `MobileNavigation`.
  - **Fiabilisation des modales sur petit écran (iPhone SE 375x667)** : élévation des overlays en `z-[60]`, conteneur `flex-col` avec zone de contenu `overflow-y-auto` et boutons d'action d'urgence (`Gérer les contacts` / `Fermer`) 100% visibles et tapables au-dessus de la barre de navigation avec padding de sécurité `pb-[max(1rem,calc(env(safe-area-inset-bottom)+1rem))]`.
  - **Harmonisation stricte et universelle du bouton Retour** : remplacement de tous les symboles hétérogènes (`<`, `<-`, `< Retour`) par le bouton pilule tactile standardisé `p-2 rounded-xl bg-gray-100 dark:bg-gray-800` avec `<ArrowLeft className="w-5 h-5 rtl:rotate-180" />` sur 100% des sous-écrans (`ChildDailyReportsPage`, `ChildDetailsPage`, `ChildMedicalPage`, `ChildEmergencyContactsPage`, `StaffChildDetailPage`, `TreatmentsPage` parent & staff, `MobileDailyReportsPage`).
  - **Marges de confort anti-troncature** : extension du padding inférieur à `pb-32` et `pb-36` sur les rapports journaliers pour éliminer toute coupure des cartes ou états vides par la barre d'onglets.
- [x] **Messagerie Mobile : En-tête de Conversation Dégagé (`z-[60]`), Retour par Swipe et Historique Navigateur Sécurisé (`MessagesPage.jsx`)** :
  - **Dégagement de l'en-tête** : élévation de `MessagesPage` à `z-[60]` pour passer au-dessus de `PublicHeader` (`z-50`), affichant l'en-tête complet de discussion (avatar, nom, statut en ligne et bouton de retour standardisé `p-2 rounded-xl`).
  - **Gestion de l'historique & synchronisation URL** : l'ouverture d'un contact alimente `?contactId=ID`, permettant au swipe retour natif iOS/Android et au bouton retour du téléphone de refermer la conversation vers la liste de contacts sans éjecter l'utilisateur sur le dashboard.
  - **Geste tactile Swipe-to-close intégré** : possibilité de fermer la conversation d'un simple glissement horizontal du doigt sur l'écran.
- [x] **Retour Contextuel vers Menu Enfant Ouvert (`?openChild=ID`), Suppression Flèche Retour Redondante Contacts Messages, Purge Onglet "Installer App" Modale Nouveautés & Fix `ReferenceError childId`** :
  - **Retour contextuel direct** : le bouton retour des 4 pages enfants (Fiche d'enfant, Contacts d'urgence, Données médicales, Rapports journaliers) redirige vers `/mon-espace?openChild=ID` ; `MobileParentSpace.jsx` et `MySpacePage.jsx` interceptent ce paramètre pour réouvrir instantanément le menu d'actions de l'enfant concerné.
  - **Épuration de la messagerie** : suppression du bouton retour superflue dans l'en-tête de la liste de contacts (inutile grâce à la présence de la barre d'onglets persistante en bas d'écran).
  - **Épuration de la modale Nouveautés** : suppression de l'onglet et du composant "Installer l'app" pour ne conserver qu'un affichage direct et clair des actualités de la crèche.
  - **Correction du crash console** : résolution de l'erreur `ReferenceError: childId is not defined` au clic sur le bouton retour (`targetChildId = id || child?.id`).
- [x] **Dégagement Barre de Tâches Mobile (Rapports enfants, Contacts d'urgence), En-tête Conversation Messagerie & Accès Direct Remises Règlement Familial** :
  - **Dégagement complet rapports enfants (`ChildDailyReportsPage`)** : padding `pb-44`, densification de la carte d'état vide (`py-5 sm:py-10`) et du sélecteur de date pour éliminer tout chevauchement sous la barre `MobileNavigation`.
  - **Sécurisation modales iPhone SE (`MobileParentSpace`)** : élévation des modales enfant et contacts d'urgence en `z-[120]` montées sur `document.body` via `createPortal`, padding inférieur de sécurité `pb-[max(1.5rem,calc(env(safe-area-inset-bottom)+1.5rem))]` et compacité de l'état vide pour garantir une visibilité totale des boutons « Gérer les contacts » et « Fermer ».
  - **En-tête de chat mobile dégagé (`PublicLayout` & `MessagesPage`)** : masquage de `PublicHeader` sur mobile (`hidden lg:block`) sur la route `/mon-espace/messages`, restaurant l'affichage plein écran de l'en-tête de conversation avec son bouton de retour spacieux `←` sans bouton superflu sur la liste des contacts.
  - **Bouton Remise dans Règlement Familial (`BillingManagementModal`)** : découplage sémantique du `<label>` parent en `<div>` et mise en valeur du bouton `[ 🎛️ Remise ]` stylisé en ambre pour chaque enfant à régler avec élévation du modal de remise en `z-[85]`.
- [ ] *(ajouter ici)*

---

> ✏️ Astuce : quand une idée est réalisée, cochez `[x]` puis archivez-la en bas de fichier ou supprimez-la.
