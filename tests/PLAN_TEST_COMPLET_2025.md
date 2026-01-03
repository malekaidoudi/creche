# 📋 PLAN DE TEST COMPLET - Crèche Mima Elghalia

**Version:** 1.0.0  
**Date:** 03 Janvier 2025  
**Application:** Système de Gestion de Crèche  

---

## 📑 Table des Matières

1. [Environnement de Test](#1-environnement-de-test)
2. [Comptes de Test](#2-comptes-de-test)
3. [Tests d'Authentification](#3-tests-dauthentification)
4. [Tests par Rôle - Admin](#4-tests-par-rôle---admin)
5. [Tests par Rôle - Staff](#5-tests-par-rôle---staff)
6. [Tests par Rôle - Parent](#6-tests-par-rôle---parent)
7. [Tests des Pages Publiques](#7-tests-des-pages-publiques)
8. [Tests d'Interface Utilisateur](#8-tests-dinterface-utilisateur)
9. [Tests API Backend](#9-tests-api-backend)
10. [Tests de Performance](#10-tests-de-performance)
11. [Tests de Sécurité](#11-tests-de-sécurité)
12. [Scénarios de Test E2E](#12-scénarios-de-test-e2e)
13. [Rapport de Bugs](#13-rapport-de-bugs)

---

## 1. Environnement de Test

### 1.1 Prérequis Techniques

| Composant | Configuration |
|-----------|---------------|
| **Backend** | `http://localhost:3003` ou `https://creche-backend.onrender.com` |
| **Frontend** | `http://localhost:5173` ou `https://malekaidoudi.github.io/creche/` |
| **Base de données** | PostgreSQL (Neon) |
| **Node.js** | v22.x |
| **Navigateurs** | Chrome, Firefox, Safari, Edge |

### 1.2 Outils Recommandés

- [ ] **Postman** - Tests API (collection fournie: `POSTMAN_COLLECTION.json`)
- [ ] **Chrome DevTools** - Debugging et performance
- [ ] **Lighthouse** - Audit performance/accessibilité
- [ ] **BrowserStack** - Tests cross-browser (optionnel)

### 1.3 Démarrage des Serveurs

```bash
# Backend
cd backend
npm run dev

# Frontend
cd frontend
npm run dev
```

---

## 2. Comptes de Test

### 2.1 Identifiants

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| **Admin** | `crechemimaelghalia@gmail.com` | `password` |
| **Staff** | `staff@mimaelghalia.tn` | `password` |
| **Parent 1** | `parent1@example.com` | `password` |
| **Parent 2** | `parent2@example.com` | `password` |
| **Parent 3** | `parent3@example.com` | `password` |

### 2.2 Permissions par Rôle

| Fonctionnalité | Admin | Staff | Parent |
|----------------|:-----:|:-----:|:------:|
| Dashboard complet | ✅ | ✅ | ❌ |
| Gestion inscriptions | ✅ | 👁️ | ❌ |
| Gestion enfants | ✅ | ✅ | 👁️ |
| Gestion présences | ✅ | ✅ | 👁️ |
| Gestion utilisateurs | ✅ | ❌ | ❌ |
| Paramètres système | ✅ | ❌ | ❌ |
| Mon espace | ❌ | ❌ | ✅ |
| Demandes d'absence | ✅ | ✅ | ✅ |
| Rapports quotidiens | ✅ | ✅ | 👁️ |

✅ = Accès complet | 👁️ = Lecture seule | ❌ = Pas d'accès

---

## 3. Tests d'Authentification

### 3.1 Connexion (Login)

| # | Test | Étapes | Résultat attendu | ✅/❌ |
|---|------|--------|------------------|------|
| 3.1.1 | Login admin valide | 1. Aller sur `/login` 2. Entrer email admin 3. Entrer mot de passe 4. Cliquer "Connexion" | Redirection vers `/dashboard` | |
| 3.1.2 | Login staff valide | Idem avec compte staff | Redirection vers `/dashboard` | |
| 3.1.3 | Login parent valide | Idem avec compte parent | Redirection vers `/mon-espace` | |
| 3.1.4 | Login mot de passe incorrect | Entrer mauvais mot de passe | Message d'erreur affiché | |
| 3.1.5 | Login email inexistant | Entrer email non enregistré | Message d'erreur affiché | |
| 3.1.6 | Login champs vides | Soumettre formulaire vide | Validation des champs | |

### 3.2 Déconnexion (Logout)

| # | Test | Étapes | Résultat attendu | ✅/❌ |
|---|------|--------|------------------|------|
| 3.2.1 | Logout depuis menu | Cliquer sur avatar → Déconnexion | Redirection vers `/login`, token supprimé | |
| 3.2.2 | Accès protégé après logout | Essayer d'accéder à `/dashboard` | Redirection vers `/login` | |

### 3.3 Récupération de Mot de Passe

| # | Test | Étapes | Résultat attendu | ✅/❌ |
|---|------|--------|------------------|------|
| 3.3.1 | Demande de réinitialisation | 1. Cliquer "Mot de passe oublié" 2. Entrer email 3. Soumettre | Email envoyé avec lien | |
| 3.3.2 | Création nouveau mot de passe | Suivre lien email, créer nouveau mot de passe | Mot de passe modifié, connexion possible | |

### 3.4 Protection des Routes

| # | Test | Étapes | Résultat attendu | ✅/❌ |
|---|------|--------|------------------|------|
| 3.4.1 | Accès admin sans auth | Accéder à `/dashboard/settings` sans connexion | Redirection vers `/login` | |
| 3.4.2 | Accès parent à admin | Connecté parent, accéder à `/dashboard/users` | Redirection ou erreur 403 | |
| 3.4.3 | Token expiré | Attendre expiration token, faire action | Redirection vers `/login` | |

---

## 4. Tests par Rôle - Admin

### 4.1 Dashboard Principal

| # | Test | Étapes | Résultat attendu | ✅/❌ |
|---|------|--------|------------------|------|
| 4.1.1 | Affichage statistiques | Accéder au dashboard | 4 cartes stats visibles (enfants, présences, inscriptions, staff) | |
| 4.1.2 | Cartes uniformes | Vérifier visuellement | Toutes les cartes ont la même hauteur | |
| 4.1.3 | Actions rapides | Cliquer sur chaque action | Navigation correcte | |
| 4.1.4 | Activités récentes | Vérifier la liste | Activités affichées chronologiquement | |

### 4.2 Gestion des Inscriptions

| # | Test | Étapes | Résultat attendu | ✅/❌ |
|---|------|--------|------------------|------|
| 4.2.1 | Liste des inscriptions | Aller sur `/dashboard/enrollments` | Liste affichée avec statuts | |
| 4.2.2 | Filtrer par statut | Cliquer sur filtre "En attente" | Seules les inscriptions pending affichées | |
| 4.2.3 | Voir détails inscription | Cliquer sur une inscription | Modal/page détails ouverte | |
| 4.2.4 | Télécharger documents | Cliquer sur "Télécharger" | Document téléchargé (Cloudinary) | |
| 4.2.5 | Approuver inscription | Cliquer "Approuver" + date RDV | Statut changé, email envoyé | |
| 4.2.6 | Rejeter inscription | Cliquer "Rejeter" + raison | Statut changé, email envoyé | |

### 4.3 Gestion des Enfants

| # | Test | Étapes | Résultat attendu | ✅/❌ |
|---|------|--------|------------------|------|
| 4.3.1 | Liste des enfants | Aller sur `/dashboard/children` | Liste affichée avec photos | |
| 4.3.2 | Recherche par nom | Taper dans la barre de recherche | Résultats filtrés en temps réel (300ms) | |
| 4.3.3 | Filtrer par âge | Sélectionner tranche d'âge | Enfants filtrés correctement | |
| 4.3.4 | Voir profil enfant | Cliquer sur un enfant | Page détails avec infos complètes | |
| 4.3.5 | Modifier enfant | Cliquer "Modifier" | Formulaire pré-rempli, sauvegarde OK | |
| 4.3.6 | Voir historique présence | Onglet "Présences" | Calendrier/liste des présences | |
| 4.3.7 | Ajouter un enfant | Cliquer "Ajouter" | Formulaire, création réussie | |

### 4.4 Gestion des Utilisateurs

| # | Test | Étapes | Résultat attendu | ✅/❌ |
|---|------|--------|------------------|------|
| 4.4.1 | Liste utilisateurs | Aller sur `/dashboard/users` ou `/dashboard/parents` | Liste avec rôles | |
| 4.4.2 | Créer staff | Cliquer "Ajouter" → Staff | Compte créé, email envoyé | |
| 4.4.3 | Créer parent | Cliquer "Ajouter" → Parent | Compte créé | |
| 4.4.4 | Modifier utilisateur | Cliquer "Modifier" | Infos modifiées | |
| 4.4.5 | Désactiver utilisateur | Cliquer "Désactiver" | Compte désactivé, login impossible | |

### 4.5 Gestion des Présences

| # | Test | Étapes | Résultat attendu | ✅/❌ |
|---|------|--------|------------------|------|
| 4.5.1 | Présences du jour | Aller sur `/dashboard/attendance` | Liste enfants avec statut | |
| 4.5.2 | Check-in enfant | Cliquer "Arrivée" | Heure enregistrée, statut "Présent" | |
| 4.5.3 | Check-out enfant | Cliquer "Départ" | Heure enregistrée | |
| 4.5.4 | Marquer absent | Cliquer "Absent" | Statut changé | |
| 4.5.5 | Historique présences | Onglet "Historique" | Filtres par date fonctionnels | |
| 4.5.6 | Statistiques présences | Onglet "Statistiques" | Graphiques affichés | |
| 4.5.7 | Export CSV | Cliquer "Exporter" | Fichier CSV téléchargé | |

### 4.6 Gestion des Tâches

| # | Test | Étapes | Résultat attendu | ✅/❌ |
|---|------|--------|------------------|------|
| 4.6.1 | Voir tâches du jour | Dashboard → Section tâches | Liste des tâches affichée | |
| 4.6.2 | Créer tâche | Cliquer "+" → Remplir formulaire | Tâche créée | |
| 4.6.3 | Assigner tâche | Sélectionner staff | Tâche assignée, notification envoyée | |
| 4.6.4 | Marquer terminée | Cocher la tâche | Statut "completed" | |
| 4.6.5 | Supprimer tâche | Cliquer icône poubelle | Tâche supprimée | |

### 4.7 Paramètres Système

| # | Test | Étapes | Résultat attendu | ✅/❌ |
|---|------|--------|------------------|------|
| 4.7.1 | Modifier infos crèche | Aller sur `/dashboard/settings` | Formulaire éditable | |
| 4.7.2 | Modifier horaires | Changer horaires d'ouverture | Sauvegarde OK | |
| 4.7.3 | Gérer jours fériés | Section jours fériés | 3 filtres: National, Religieux, Scolaire | |
| 4.7.4 | Toggle jour férié | Activer/désactiver un jour | Sauvegarde en DB, toggle persistant | |
| 4.7.5 | Modifier logo | Uploader nouveau logo | Logo mis à jour partout | |

### 4.8 Rapports Quotidiens

| # | Test | Étapes | Résultat attendu | ✅/❌ |
|---|------|--------|------------------|------|
| 4.8.1 | Voir rapports | Aller sur `/dashboard/daily-reports` | Liste des rapports | |
| 4.8.2 | Créer rapport | Sélectionner enfant + remplir | Rapport créé | |
| 4.8.3 | Modifier rapport | Cliquer "Modifier" | Rapport mis à jour | |
| 4.8.4 | Envoyer aux parents | Cliquer "Envoyer" | Notification parent | |

### 4.9 Planning

| # | Test | Étapes | Résultat attendu | ✅/❌ |
|---|------|--------|------------------|------|
| 4.9.1 | Planning hebdomadaire | Aller sur `/dashboard/weekly-planning` | Calendrier semaine | |
| 4.9.2 | Planning mensuel | Aller sur `/dashboard/monthly-planning` | Calendrier mois | |
| 4.9.3 | Ajouter activité | Cliquer sur créneau | Activité ajoutée | |

---

## 5. Tests par Rôle - Staff

### 5.1 Dashboard Staff

| # | Test | Étapes | Résultat attendu | ✅/❌ |
|---|------|--------|------------------|------|
| 5.1.1 | Accès dashboard | Login staff → Dashboard | Vue staff affichée | |
| 5.1.2 | Tâches du jour | Vérifier section tâches | Tâches assignées visibles | |
| 5.1.3 | Jours fériés | Vérifier liste | Jours fériés activés visibles | |

### 5.2 Gestion Présences (Staff)

| # | Test | Étapes | Résultat attendu | ✅/❌ |
|---|------|--------|------------------|------|
| 5.2.1 | Check-in enfant | Marquer arrivée | Heure enregistrée | |
| 5.2.2 | Check-out enfant | Marquer départ | Heure enregistrée | |
| 5.2.3 | Ajouter note | Ajouter commentaire présence | Note sauvegardée | |

### 5.3 Mes Tâches

| # | Test | Étapes | Résultat attendu | ✅/❌ |
|---|------|--------|------------------|------|
| 5.3.1 | Voir mes tâches | Section tâches | Uniquement mes tâches | |
| 5.3.2 | Marquer terminée | Cocher tâche | Statut mis à jour | |
| 5.3.3 | Ajouter commentaire | Cliquer commentaire | Commentaire sauvegardé | |

### 5.4 Profil Staff

| # | Test | Étapes | Résultat attendu | ✅/❌ |
|---|------|--------|------------------|------|
| 5.4.1 | Voir profil | Menu → Profil | Infos affichées | |
| 5.4.2 | Modifier infos | Cliquer "Modifier" | Infos mises à jour | |
| 5.4.3 | Changer photo | Uploader photo | Photo mise à jour | |
| 5.4.4 | Changer mot de passe | Modal mot de passe | Mot de passe changé | |

---

## 6. Tests par Rôle - Parent

### 6.1 Mon Espace

| # | Test | Étapes | Résultat attendu | ✅/❌ |
|---|------|--------|------------------|------|
| 6.1.1 | Accès mon espace | Login parent | Redirection `/mon-espace` | |
| 6.1.2 | Voir mes enfants | Section enfants | Liste enfants avec photos | |
| 6.1.3 | Voir jours fériés | Section vacances | Liste jours fériés activés | |
| 6.1.4 | Actions rapides | Boutons actions | Navigation correcte | |

### 6.2 Présences Parent

| # | Test | Étapes | Résultat attendu | ✅/❌ |
|---|------|--------|------------------|------|
| 6.2.1 | Voir calendrier | Aller sur `/attendance-parent` | Calendrier mensuel | |
| 6.2.2 | Sélectionner enfant | Cliquer sur enfant | Présences de cet enfant | |
| 6.2.3 | Voir légende | Vérifier couleurs | Présent/Absent/Retard distincts | |
| 6.2.4 | Thème sombre | Activer mode sombre | Calendrier lisible | |

### 6.3 Demandes d'Absence

| # | Test | Étapes | Résultat attendu | ✅/❌ |
|---|------|--------|------------------|------|
| 6.3.1 | Créer demande | Aller sur `/absence-request` | Formulaire affiché | |
| 6.3.2 | Sélectionner dates | Choisir période | Dates sélectionnées | |
| 6.3.3 | Soumettre demande | Cliquer "Envoyer" | Demande créée, notification admin | |
| 6.3.4 | Voir statut | Liste demandes | Statut visible (pending/approved/rejected) | |

### 6.4 Rapports Quotidiens Parent

| # | Test | Étapes | Résultat attendu | ✅/❌ |
|---|------|--------|------------------|------|
| 6.4.1 | Voir rapports | Aller sur rapports enfant | Liste des rapports | |
| 6.4.2 | Détails rapport | Cliquer sur rapport | Détails complets (repas, sieste, activités) | |

### 6.5 Profil Parent

| # | Test | Étapes | Résultat attendu | ✅/❌ |
|---|------|--------|------------------|------|
| 6.5.1 | Voir profil | Menu → Profil | Infos affichées | |
| 6.5.2 | Modifier infos | Cliquer "Modifier" | Modal édition, sauvegarde OK | |
| 6.5.3 | Changer photo | Uploader photo | Photo mise à jour | |
| 6.5.4 | Changer mot de passe | Modal mot de passe | Mot de passe changé | |
| 6.5.5 | Thème sombre profil | Activer mode sombre | Tous les textes lisibles | |

---

## 7. Tests des Pages Publiques

### 7.1 Page d'Accueil

| # | Test | Étapes | Résultat attendu | ✅/❌ |
|---|------|--------|------------------|------|
| 7.1.1 | Chargement page | Accéder à `/` | Page affichée < 3s | |
| 7.1.2 | Navigation | Cliquer sur liens menu | Navigation correcte | |
| 7.1.3 | Bouton inscription | Cliquer "S'inscrire" | Redirection `/enrollment` | |
| 7.1.4 | Responsive mobile | Réduire largeur < 768px | Menu hamburger, layout adapté | |

### 7.2 Page d'Inscription

| # | Test | Étapes | Résultat attendu | ✅/❌ |
|---|------|--------|------------------|------|
| 7.2.1 | Formulaire complet | Remplir tous les champs | Validation OK | |
| 7.2.2 | Upload documents | Ajouter fichiers | Upload Cloudinary OK | |
| 7.2.3 | Validation champs | Soumettre champs invalides | Messages d'erreur | |
| 7.2.4 | Soumission | Cliquer "Soumettre" | Inscription créée, email confirmation | |

### 7.3 Page Contact

| # | Test | Étapes | Résultat attendu | ✅/❌ |
|---|------|--------|------------------|------|
| 7.3.1 | Formulaire contact | Remplir et soumettre | Message envoyé | |
| 7.3.2 | Infos crèche | Vérifier adresse, téléphone | Infos correctes depuis paramètres | |
| 7.3.3 | Carte Google Maps | Vérifier affichage | Carte visible et interactive | |

### 7.4 Visite Virtuelle

| # | Test | Étapes | Résultat attendu | ✅/❌ |
|---|------|--------|------------------|------|
| 7.4.1 | Galerie photos | Aller sur `/virtual-tour` | Photos affichées | |
| 7.4.2 | Navigation galerie | Cliquer sur photos | Lightbox/zoom | |

---

## 8. Tests d'Interface Utilisateur

### 8.1 Thème Sombre/Clair

| # | Test | Page | Résultat attendu | ✅/❌ |
|---|------|------|------------------|------|
| 8.1.1 | Toggle thème | Header | Changement immédiat | |
| 8.1.2 | Dashboard sombre | `/dashboard` | Tous textes lisibles | |
| 8.1.3 | Profil parent sombre | `/profile` | Modal édition lisible | |
| 8.1.4 | Calendrier présence sombre | `/attendance-parent` | Jours et légende visibles | |
| 8.1.5 | Paramètres sombre | `/dashboard/settings` | Formulaires lisibles | |
| 8.1.6 | Persistance thème | Recharger page | Thème conservé | |

### 8.2 Support RTL (Arabe)

| # | Test | Étapes | Résultat attendu | ✅/❌ |
|---|------|--------|------------------|------|
| 8.2.1 | Changer langue | Sélecteur → Arabe | Interface en arabe, RTL | |
| 8.2.2 | Sidebar RTL | Vérifier position | Sidebar à droite | |
| 8.2.3 | Formulaires RTL | Vérifier alignement | Texte aligné à droite | |
| 8.2.4 | Numéros téléphone | Vérifier affichage | Numéros LTR dans contexte RTL | |
| 8.2.5 | Persistance langue | Recharger page | Langue conservée | |

### 8.3 Responsive Design

| # | Test | Résolution | Résultat attendu | ✅/❌ |
|---|------|------------|------------------|------|
| 8.3.1 | Desktop | > 1024px | Layout complet, sidebar visible | |
| 8.3.2 | Tablet | 768-1024px | Layout adapté, sidebar collapsible | |
| 8.3.3 | Mobile | < 768px | Menu hamburger, layout vertical | |
| 8.3.4 | Formulaires mobile | < 768px | Champs pleine largeur | |
| 8.3.5 | Tableaux mobile | < 768px | Scroll horizontal ou cards | |

### 8.4 Composants UI

| # | Test | Composant | Résultat attendu | ✅/❌ |
|---|------|-----------|------------------|------|
| 8.4.1 | Modals | Tous les modals | Ouverture/fermeture fluide | |
| 8.4.2 | DatePicker | Sélection date | Calendrier visible, sélection OK | |
| 8.4.3 | Notifications toast | Actions | Toast affiché, auto-hide | |
| 8.4.4 | Boutons loading | Soumission | Spinner pendant chargement | |
| 8.4.5 | Animations | Navigation | Transitions Framer Motion fluides | |

---

## 9. Tests API Backend

### 9.1 Authentification API

| # | Endpoint | Méthode | Test | ✅/❌ |
|---|----------|---------|------|------|
| 9.1.1 | `/api/auth/login` | POST | Login valide → Token JWT | |
| 9.1.2 | `/api/auth/login` | POST | Login invalide → 401 | |
| 9.1.3 | `/api/auth/logout` | POST | Logout → Token invalidé | |
| 9.1.4 | `/api/auth/me` | GET | Token valide → User info | |

### 9.2 Enfants API

| # | Endpoint | Méthode | Test | ✅/❌ |
|---|----------|---------|------|------|
| 9.2.1 | `/api/children` | GET | Liste enfants (admin/staff) | |
| 9.2.2 | `/api/children/:id` | GET | Détails enfant | |
| 9.2.3 | `/api/children` | POST | Créer enfant (admin) | |
| 9.2.4 | `/api/children/:id` | PUT | Modifier enfant | |
| 9.2.5 | `/api/children/:id` | DELETE | Supprimer enfant | |

### 9.3 Inscriptions API

| # | Endpoint | Méthode | Test | ✅/❌ |
|---|----------|---------|------|------|
| 9.3.1 | `/api/enrollments` | GET | Liste inscriptions | |
| 9.3.2 | `/api/enrollments` | POST | Nouvelle inscription | |
| 9.3.3 | `/api/enrollments/:id/approve` | POST | Approuver + date RDV | |
| 9.3.4 | `/api/enrollments/:id/reject` | POST | Rejeter + raison | |
| 9.3.5 | `/api/enrollments/appointments/today` | GET | RDV du jour | |

### 9.4 Présences API

| # | Endpoint | Méthode | Test | ✅/❌ |
|---|----------|---------|------|------|
| 9.4.1 | `/api/attendance` | GET | Présences du jour | |
| 9.4.2 | `/api/attendance/check-in` | POST | Enregistrer arrivée | |
| 9.4.3 | `/api/attendance/check-out` | POST | Enregistrer départ | |
| 9.4.4 | `/api/attendance/history` | GET | Historique avec filtres | |
| 9.4.5 | `/api/attendance/stats` | GET | Statistiques | |

### 9.5 Jours Fériés API

| # | Endpoint | Méthode | Test | ✅/❌ |
|---|----------|---------|------|------|
| 9.5.1 | `/api/holidays` | GET | Liste jours fériés actifs | |
| 9.5.2 | `/api/holidays` | POST | Activer jour férié (admin) | |
| 9.5.3 | `/api/holidays/:id` | DELETE | Désactiver jour férié | |
| 9.5.4 | `/api/holidays/check/:date` | GET | Vérifier si jour férié | |

### 9.6 Tâches API

| # | Endpoint | Méthode | Test | ✅/❌ |
|---|----------|---------|------|------|
| 9.6.1 | `/api/tasks/today` | GET | Tâches du jour | |
| 9.6.2 | `/api/tasks` | POST | Créer tâche | |
| 9.6.3 | `/api/tasks/:id/status` | PATCH | Changer statut | |
| 9.6.4 | `/api/tasks/:id` | DELETE | Supprimer tâche | |

### 9.7 Paramètres API

| # | Endpoint | Méthode | Test | ✅/❌ |
|---|----------|---------|------|------|
| 9.7.1 | `/api/nursery-settings` | GET | Récupérer paramètres | |
| 9.7.2 | `/api/nursery-settings` | PUT | Modifier paramètres (admin) | |

### 9.8 Health Check

| # | Endpoint | Méthode | Test | ✅/❌ |
|---|----------|---------|------|------|
| 9.8.1 | `/api/health` | GET | Status: OK, DB: connected | |

---

## 10. Tests de Performance

### 10.1 Temps de Chargement

| # | Page | Objectif | Résultat | ✅/❌ |
|---|------|----------|----------|------|
| 10.1.1 | Page d'accueil | < 3s | | |
| 10.1.2 | Dashboard | < 2s | | |
| 10.1.3 | Liste enfants | < 2s | | |
| 10.1.4 | Calendrier présences | < 2s | | |

### 10.2 Lighthouse Scores

| # | Métrique | Objectif | Score | ✅/❌ |
|---|----------|----------|-------|------|
| 10.2.1 | Performance | > 80 | | |
| 10.2.2 | Accessibilité | > 90 | | |
| 10.2.3 | Best Practices | > 90 | | |
| 10.2.4 | SEO | > 80 | | |

### 10.3 Optimisations

| # | Test | Vérification | ✅/❌ |
|---|------|--------------|------|
| 10.3.1 | Lazy loading | Images chargées à la demande | |
| 10.3.2 | Code splitting | Bundles séparés par route | |
| 10.3.3 | Cache | Assets mis en cache | |
| 10.3.4 | Minification | JS/CSS minifiés en prod | |

---

## 11. Tests de Sécurité

### 11.1 Authentification

| # | Test | Vérification | ✅/❌ |
|---|------|--------------|------|
| 11.1.1 | Token JWT | Token signé, expiration correcte | |
| 11.1.2 | Mot de passe hashé | bcrypt utilisé en DB | |
| 11.1.3 | Rate limiting | Blocage après X tentatives | |

### 11.2 Autorisation

| # | Test | Vérification | ✅/❌ |
|---|------|--------------|------|
| 11.2.1 | Routes protégées | Middleware auth sur routes privées | |
| 11.2.2 | Vérification rôle | Admin-only routes bloquées pour autres | |
| 11.2.3 | Accès données | Parent voit uniquement ses enfants | |

### 11.3 Validation

| # | Test | Vérification | ✅/❌ |
|---|------|--------------|------|
| 11.3.1 | Validation entrées | express-validator sur toutes routes | |
| 11.3.2 | Sanitization | Données nettoyées avant insertion | |
| 11.3.3 | SQL Injection | Requêtes paramétrées | |
| 11.3.4 | XSS | Échappement des sorties | |

### 11.4 Headers Sécurité

| # | Test | Vérification | ✅/❌ |
|---|------|--------------|------|
| 11.4.1 | CORS | Origins autorisées uniquement | |
| 11.4.2 | Helmet | Headers sécurité activés | |
| 11.4.3 | HTTPS | Redirection HTTP → HTTPS (prod) | |

---

## 12. Scénarios de Test E2E

### 12.1 Scénario: Inscription Complète

**Objectif**: Tester le flux complet d'inscription d'un nouvel enfant

| Étape | Acteur | Action | Résultat attendu | ✅/❌ |
|-------|--------|--------|------------------|------|
| 1 | Parent | Accéder à `/enrollment` | Formulaire affiché | |
| 2 | Parent | Remplir informations enfant | Validation OK | |
| 3 | Parent | Remplir informations parent | Validation OK | |
| 4 | Parent | Uploader documents | Upload Cloudinary OK | |
| 5 | Parent | Soumettre inscription | Confirmation affichée | |
| 6 | Système | Envoyer email confirmation | Email reçu | |
| 7 | Admin | Voir nouvelle inscription | Inscription dans liste | |
| 8 | Admin | Vérifier documents | Documents téléchargeables | |
| 9 | Admin | Approuver + date RDV | Statut changé | |
| 10 | Système | Envoyer email approbation | Email avec date RDV | |
| 11 | Parent | Créer mot de passe | Compte activé | |
| 12 | Parent | Se connecter | Accès mon espace | |
| 13 | Parent | Voir enfant | Enfant dans liste | |

### 12.2 Scénario: Journée Type Présences

**Objectif**: Tester le flux quotidien de gestion des présences

| Étape | Acteur | Action | Résultat attendu | ✅/❌ |
|-------|--------|--------|------------------|------|
| 1 | Staff | Se connecter le matin | Dashboard affiché | |
| 2 | Staff | Ouvrir présences du jour | Liste enfants | |
| 3 | Staff | Check-in enfant 1 (8h30) | Heure enregistrée | |
| 4 | Staff | Check-in enfant 2 (8h45) | Heure enregistrée | |
| 5 | Staff | Marquer enfant 3 absent | Statut "absent" | |
| 6 | Parent | Voir présence enfant | Statut visible en temps réel | |
| 7 | Staff | Check-out enfant 1 (17h00) | Heure départ enregistrée | |
| 8 | Staff | Check-out enfant 2 (17h30) | Heure départ enregistrée | |
| 9 | Admin | Voir rapport du jour | Statistiques correctes | |
| 10 | Admin | Exporter CSV | Fichier téléchargé | |

### 12.3 Scénario: Demande d'Absence

**Objectif**: Tester le flux de demande et approbation d'absence

| Étape | Acteur | Action | Résultat attendu | ✅/❌ |
|-------|--------|--------|------------------|------|
| 1 | Parent | Accéder demande absence | Formulaire affiché | |
| 2 | Parent | Sélectionner enfant | Enfant sélectionné | |
| 3 | Parent | Choisir dates | Période sélectionnée | |
| 4 | Parent | Entrer raison | Texte saisi | |
| 5 | Parent | Soumettre demande | Confirmation affichée | |
| 6 | Admin | Recevoir notification | Notification visible | |
| 7 | Admin | Voir demande | Détails affichés | |
| 8 | Admin | Approuver demande | Statut "approved" | |
| 9 | Parent | Recevoir notification | Notification approbation | |
| 10 | Système | Jours d'absence | Enfant marqué absent auto | |

---

## 13. Rapport de Bugs

### 13.1 Template de Bug

```markdown
## Bug #[NUMERO]

**Sévérité**: [ ] Critique [ ] Majeur [ ] Mineur [ ] Cosmétique

**Page/Fonctionnalité**: [Nom de la page]

**Environnement**:
- OS: [macOS/Windows/Linux]
- Navigateur: [Chrome/Firefox/Safari] v[X.X]
- Résolution: [1920x1080]
- Mode: [Clair/Sombre]
- Langue: [FR/AR]

**Description**:
[Description détaillée du bug]

**Étapes pour reproduire**:
1. [Étape 1]
2. [Étape 2]
3. [Étape 3]

**Résultat attendu**:
[Ce qui devrait se passer]

**Résultat obtenu**:
[Ce qui se passe réellement]

**Capture d'écran**:
[Joindre si applicable]

**Logs console**:
```
[Coller les erreurs console si présentes]
```
```

### 13.2 Liste des Bugs Trouvés

| # | Sévérité | Page | Description | Statut |
|---|----------|------|-------------|--------|
| 1 | | | | |
| 2 | | | | |
| 3 | | | | |

---

## 📊 Résumé des Tests

### Statistiques Globales

| Catégorie | Total | Réussis | Échoués | Non testés |
|-----------|-------|---------|---------|------------|
| Authentification | 12 | | | |
| Admin | 45 | | | |
| Staff | 15 | | | |
| Parent | 25 | | | |
| Pages publiques | 12 | | | |
| Interface UI | 20 | | | |
| API Backend | 30 | | | |
| Performance | 10 | | | |
| Sécurité | 12 | | | |
| **TOTAL** | **181** | | | |

### Conclusion

```
Date du test: _______________
Testeur: _______________
Version testée: _______________

Résumé:
- Tests réussis: _____ / 181
- Bugs critiques: _____
- Bugs majeurs: _____
- Bugs mineurs: _____

Recommandations:
1. _____________________
2. _____________________
3. _____________________

Prêt pour production: [ ] Oui [ ] Non [ ] Avec réserves
```

---

**Bonne session de tests ! 🧪**
