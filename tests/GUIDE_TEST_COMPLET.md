# Guide de Test Complet - Crèche Mima Elghalia

## 📋 Table des Matières
1. [Préparation](#préparation)
2. [Tests par Rôle](#tests-par-rôle)
3. [Scénarios de Test](#scénarios-de-test)
4. [Checklist Complète](#checklist-complète)

---

## 🔧 Préparation

### Prérequis
- ✅ Backend démarré sur `http://localhost:3003`
- ✅ Frontend démarré sur `http://localhost:5173`
- ✅ Base de données PostgreSQL opérationnelle
- ✅ Postman installé (ou utiliser les tests manuels)

### Comptes de Test
```
Admin:
  Email: crechemimaelghalia@gmail.com
  Password: password

Staff:
  Email: staff@mimaelghalia.tn
  Password: password

Parent 1:
  Email: parent1@example.com
  Password: password
  Enfants: Youssef (3 ans), Lina (2 ans)

Parent 2:
  Email: parent2@example.com
  Password: password
  Enfants: Adam (3 ans), Salma (2 ans)

Parent 3:
  Email: parent3@example.com
  Password: password
  Enfants: Omar (3 ans), Nour (2 ans)
```

---

## 👤 Tests par Rôle

### 🔴 ADMIN - Tests Complets

#### 1. Authentification
- [x] Login avec email/password correct
- [x] Login avec mot de passe incorrect (doit échouer)
- [x] Logout
- [x] Accès au dashboard après login

#### 2. Gestion des Inscriptions
- [x] Voir toutes les inscriptions
- [x] Filtrer par statut (pending, approved, rejected)
- [x] Voir les détails d'une inscription
- [x] Télécharger les documents d'inscription (Cloudinary)
- [x] Approuver une inscription
- [x] Rejeter une inscription avec raison

#### 3. Gestion des Enfants
- [x] Voir la liste de tous les enfants (uniquement inscrits)
- [x] Rechercher un enfant par nom (fluide - 300ms)
- [x] Filtrer par âge (2-11 mois, 1-2 ans, 2-3 ans)
- [x] Voir le profil complet d'un enfant
- [x] Modifier les informations d'un enfant
- [x] Voir l'historique de présence d'un enfant
- [x] Voir les documents d'un enfant

#### 4. Gestion des Utilisateurs
- [ ] Voir la liste des utilisateurs (admin, staff, parents)
- [ ] Créer un nouvel utilisateur staff
- [ ] Créer un nouveau parent
- [ ] Modifier un utilisateur
- [ ] Désactiver un utilisateur
- [ ] Réinitialiser le mot de passe d'un utilisateur

#### 5. Gestion des Présences
- [ ] Voir les présences du jour
- [ ] Marquer un enfant présent
- [ ] Marquer un enfant absent
- [ ] Marquer un enfant en retard
- [ ] Enregistrer l'heure d'arrivée
- [ ] Enregistrer l'heure de départ
- [ ] Voir l'historique des présences
- [ ] Exporter le rapport de présences

#### 6. Gestion des Événements
- [ ] Voir le calendrier des événements
- [ ] Créer un nouvel événement
- [ ] Modifier un événement
- [ ] Supprimer un événement
- [ ] Voir les participants à un événement
- [ ] Envoyer des notifications pour un événement

#### 7. Gestion des Tâches
- [ ] Voir toutes les tâches
- [ ] Créer une nouvelle tâche
- [ ] Assigner une tâche à un staff
- [ ] Modifier une tâche
- [ ] Marquer une tâche comme terminée
- [ ] Supprimer une tâche
- [ ] Voir les tâches en retard

#### 8. Gestion des Rendez-vous
- [ ] Voir tous les rendez-vous
- [ ] Approuver une demande de rendez-vous
- [ ] Rejeter une demande de rendez-vous
- [ ] Proposer une nouvelle date
- [ ] Marquer un rendez-vous comme terminé
- [ ] Annuler un rendez-vous

#### 9. Gestion des Absences
- [ ] Voir toutes les demandes d'absence
- [ ] Approuver une demande d'absence
- [ ] Rejeter une demande d'absence
- [ ] Voir l'historique des absences par enfant

#### 10. Paramètres
- [ ] Modifier les informations de la crèche
- [ ] Modifier les horaires d'ouverture
- [ ] Modifier les tarifs
- [ ] Gérer les jours fériés
- [ ] Configurer les notifications
- [ ] Modifier le logo de la crèche

#### 11. Rapports et Statistiques
- [ ] Voir les statistiques générales
- [ ] Exporter le rapport de présences mensuel
- [ ] Exporter le rapport des inscriptions
- [ ] Voir le taux d'occupation
- [ ] Voir les statistiques de présence

#### 12. Notifications
- [ ] Voir toutes les notifications
- [ ] Marquer une notification comme lue
- [ ] Marquer toutes les notifications comme lues
- [ ] Supprimer une notification

---

### 🟡 STAFF - Tests Complets

#### 1. Authentification
- [ ] Login avec email/password correct
- [ ] Logout
- [ ] Accès au dashboard staff

#### 2. Gestion des Présences
- [ ] Voir les présences du jour
- [ ] Marquer un enfant présent
- [ ] Marquer un enfant absent
- [ ] Enregistrer l'heure d'arrivée
- [ ] Enregistrer l'heure de départ
- [ ] Ajouter des notes sur une présence

#### 3. Mes Tâches
- [ ] Voir mes tâches assignées
- [ ] Voir les tâches du jour
- [ ] Marquer une tâche comme terminée
- [ ] Ajouter un commentaire sur une tâche
- [ ] Voir les tâches en retard

#### 4. Gestion des Événements
- [ ] Voir le calendrier des événements
- [ ] Créer un événement (si autorisé)
- [ ] Voir les détails d'un événement

#### 5. Gestion des Rendez-vous
- [ ] Voir les rendez-vous du jour
- [ ] Voir tous les rendez-vous
- [ ] Marquer un rendez-vous comme terminé

#### 6. Gestion des Absences
- [ ] Voir les demandes d'absence
- [ ] Approuver/Rejeter une demande (si autorisé)

#### 7. Mémos et Notes
- [ ] Créer un mémo
- [ ] Voir les mémos du jour
- [ ] Modifier un mémo
- [ ] Supprimer un mémo

#### 8. Profil
- [ ] Voir mon profil
- [ ] Modifier mes informations
- [ ] Changer mon mot de passe
- [ ] Modifier ma photo de profil

---

### 🟢 PARENT - Tests Complets

#### 1. Authentification
- [ ] Login avec email/password correct
- [ ] Créer un compte (inscription)
- [ ] Réinitialiser le mot de passe
- [ ] Logout

#### 2. Mon Espace
- [ ] Voir le tableau de bord parent
- [ ] Voir les informations de mes enfants
- [ ] Voir les prochains événements
- [ ] Voir mes rendez-vous
- [ ] Voir les notifications

#### 3. Inscription
- [ ] Remplir le formulaire d'inscription
- [ ] Télécharger les documents requis
- [ ] Soumettre l'inscription
- [ ] Voir le statut de mon inscription

#### 4. Mes Enfants
- [ ] Voir la liste de mes enfants
- [ ] Voir le profil d'un enfant
- [ ] Voir l'historique de présence
- [ ] Voir les documents de l'enfant
- [ ] Télécharger un document

#### 5. Présences
- [ ] Voir les présences de mes enfants
- [ ] Voir l'historique mensuel
- [ ] Filtrer par enfant
- [ ] Voir les statistiques de présence

#### 6. Demandes d'Absence
- [ ] Créer une demande d'absence
- [ ] Voir mes demandes d'absence
- [ ] Voir le statut d'une demande
- [ ] Annuler une demande (si pending)

#### 7. Rendez-vous
- [ ] Demander un rendez-vous
- [ ] Voir mes rendez-vous
- [ ] Proposer une nouvelle date
- [ ] Annuler un rendez-vous

#### 8. Événements
- [ ] Voir le calendrier des événements
- [ ] Voir les détails d'un événement
- [ ] S'inscrire à un événement (si applicable)

#### 9. Annonces
- [ ] Voir les annonces de la crèche
- [ ] Filtrer les annonces par catégorie
- [ ] Marquer une annonce comme lue

#### 10. Messages
- [ ] Envoyer un message à l'administration
- [ ] Voir mes messages
- [ ] Répondre à un message

#### 11. Profil
- [ ] Voir mon profil
- [ ] Modifier mes informations
- [ ] Changer mon mot de passe
- [ ] Modifier ma photo de profil
- [ ] Mettre à jour mes coordonnées

---

## 🎯 Scénarios de Test

### Scénario 1: Inscription Complète d'un Nouvel Enfant

**Objectif**: Tester le flux complet d'inscription

1. **Parent** - Créer un compte
2. **Parent** - Remplir le formulaire d'inscription
3. **Parent** - Télécharger les documents requis
4. **Parent** - Soumettre l'inscription
5. **Admin** - Recevoir une notification
6. **Admin** - Voir la nouvelle inscription
7. **Admin** - Vérifier les documents
8. **Admin** - Approuver l'inscription
9. **Parent** - Recevoir une notification d'approbation
10. **Admin** - Créer le compte enfant
11. **Parent** - Voir l'enfant dans "Mes Enfants"

**Résultat attendu**: ✅ Inscription complète et enfant visible dans le système

---

### Scénario 2: Gestion Quotidienne des Présences

**Objectif**: Tester le flux de gestion des présences

1. **Staff** - Se connecter le matin
2. **Staff** - Ouvrir la page des présences
3. **Staff** - Marquer les enfants présents à leur arrivée
4. **Staff** - Enregistrer l'heure d'arrivée
5. **Staff** - Marquer un enfant en retard
6. **Staff** - Ajouter une note pour un enfant absent
7. **Parent** - Voir la présence de son enfant en temps réel
8. **Staff** - Enregistrer l'heure de départ en fin de journée
9. **Admin** - Voir le rapport de présences du jour

**Résultat attendu**: ✅ Présences correctement enregistrées et visibles

---

### Scénario 3: Demande et Approbation d'Absence

**Objectif**: Tester le flux de demande d'absence

1. **Parent** - Créer une demande d'absence
2. **Parent** - Spécifier les dates et la raison
3. **Parent** - Soumettre la demande
4. **Admin/Staff** - Recevoir une notification
5. **Admin/Staff** - Voir la demande dans la liste
6. **Admin/Staff** - Approuver la demande
7. **Parent** - Recevoir une notification d'approbation
8. **System** - Marquer automatiquement l'enfant absent aux dates spécifiées

**Résultat attendu**: ✅ Absence approuvée et enfant marqué absent

---

### Scénario 4: Création et Gestion d'un Événement

**Objectif**: Tester le flux de création d'événement

1. **Admin** - Créer un nouvel événement
2. **Admin** - Définir date, heure, lieu, description
3. **Admin** - Publier l'événement
4. **System** - Envoyer des notifications aux parents
5. **Parent** - Voir l'événement dans le calendrier
6. **Parent** - Voir les détails de l'événement
7. **Admin** - Modifier l'événement (changement d'heure)
8. **System** - Notifier les parents du changement

**Résultat attendu**: ✅ Événement créé et visible par tous

---

### Scénario 5: Demande de Rendez-vous

**Objectif**: Tester le flux de demande de rendez-vous

1. **Parent** - Demander un rendez-vous
2. **Parent** - Spécifier la raison et les disponibilités
3. **Parent** - Soumettre la demande
4. **Admin** - Recevoir une notification
5. **Admin** - Voir la demande
6. **Admin** - Approuver avec une date/heure
7. **Parent** - Recevoir une confirmation
8. **Admin** - Marquer le rendez-vous comme terminé après la rencontre

**Résultat attendu**: ✅ Rendez-vous planifié et complété

---

## ✅ Checklist Complète

### Interface Utilisateur

#### Pages Publiques
- [ ] Page d'accueil
- [ ] Page de contact
- [ ] Page d'inscription
- [ ] Page de connexion
- [ ] Page de réinitialisation de mot de passe
- [ ] Page de création de mot de passe
- [ ] Footer avec informations de contact

#### Dashboard Admin
- [ ] Vue d'ensemble avec statistiques
- [ ] Gestion des inscriptions
- [ ] Gestion des enfants
- [ ] Gestion des utilisateurs
- [ ] Gestion des présences
- [ ] Gestion des événements
- [ ] Gestion des tâches
- [ ] Gestion des rendez-vous
- [ ] Gestion des absences
- [ ] Paramètres
- [ ] Rapports

#### Dashboard Staff
- [ ] Vue d'ensemble
- [ ] Présences du jour
- [ ] Mes tâches
- [ ] Événements
- [ ] Rendez-vous
- [ ] Mémos

#### Espace Parent
- [ ] Mon espace (dashboard)
- [ ] Mes enfants
- [ ] Présences
- [ ] Demandes d'absence
- [ ] Rendez-vous
- [ ] Événements
- [ ] Annonces
- [ ] Messages
- [ ] Mon profil

### Fonctionnalités

#### Authentification
- [ ] Login
- [ ] Logout
- [ ] Inscription
- [ ] Réinitialisation de mot de passe
- [ ] Création de mot de passe
- [ ] Protection des routes
- [ ] Gestion des sessions
- [ ] Tokens JWT

#### Dialogs (remplacement de toast)
- [ ] Dialog de succès
- [ ] Dialog d'erreur
- [ ] Dialog d'avertissement
- [ ] Dialog d'information
- [ ] Dialog de confirmation
- [ ] Fermeture automatique
- [ ] Fermeture manuelle

#### Notifications
- [ ] Notifications en temps réel
- [ ] Badge de compteur
- [ ] Marquer comme lu
- [ ] Marquer tout comme lu
- [ ] Filtrer par type
- [ ] Supprimer une notification

#### Multilingue
- [ ] Français
- [ ] Arabe (RTL)
- [ ] Changement de langue
- [ ] Persistance du choix

#### Responsive Design
- [ ] Desktop (>1024px)
- [ ] Tablet (768px-1024px)
- [ ] Mobile (<768px)
- [ ] Menu mobile
- [ ] Navigation adaptative

### Performance

- [ ] Temps de chargement < 3s
- [ ] Pas de console.log en production
- [ ] Images optimisées
- [ ] Code minifié
- [ ] Cache navigateur
- [ ] Lazy loading des composants

### Sécurité

- [ ] Protection CSRF
- [ ] Validation des entrées
- [ ] Sanitization des données
- [ ] Protection XSS
- [ ] Headers de sécurité
- [ ] HTTPS (en production)
- [ ] Gestion des erreurs sans fuite d'info

### Accessibilité

- [ ] Navigation au clavier
- [ ] Labels ARIA
- [ ] Contraste des couleurs
- [ ] Taille de police lisible
- [ ] Focus visible
- [ ] Messages d'erreur clairs

---

## 📊 Rapport de Test

### Template de Rapport

```markdown
# Rapport de Test - [Date]

## Testeur
- Nom: [Votre nom]
- Rôle testé: [Admin/Staff/Parent]

## Environnement
- OS: [macOS/Windows/Linux]
- Navigateur: [Chrome/Firefox/Safari] - Version
- Résolution: [1920x1080/etc]

## Tests Effectués
- Total: X
- Réussis: X
- Échoués: X
- Bloquants: X

## Bugs Trouvés

### Bug #1
- **Sévérité**: [Critique/Majeur/Mineur]
- **Page**: [Nom de la page]
- **Description**: [Description détaillée]
- **Étapes pour reproduire**:
  1. Étape 1
  2. Étape 2
  3. Étape 3
- **Résultat attendu**: [Ce qui devrait se passer]
- **Résultat obtenu**: [Ce qui se passe réellement]
- **Capture d'écran**: [Si applicable]

## Recommandations
- [Liste des améliorations suggérées]

## Conclusion
[Résumé général de la session de test]
```

---

## 🚀 Prochaines Étapes

1. **Nettoyer les console.log** - Supprimer tous les logs de debug
2. **Tests API avec Postman** - Utiliser la collection fournie
3. **Tests manuels** - Suivre ce guide étape par étape
4. **Tests automatisés** - Implémenter des tests E2E (optionnel)
5. **Documentation** - Compléter la documentation utilisateur
6. **Déploiement** - Préparer pour la production

---

**Bonne chance avec les tests ! 🎉**
