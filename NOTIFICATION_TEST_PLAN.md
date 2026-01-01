# 📋 Plan de Test - Système de Notifications

## 🎯 Objectif
Vérifier que toutes les notifications fonctionnent correctement sur le web et l'app mobile.

---

## 1. 📅 Jours Fériés et Vacances

### Test 1.1: Activation d'un jour férié
**Actions:**
1. Se connecter en tant qu'admin sur le web
2. Aller dans Paramètres → Gestion des Jours Fériés
3. Activer un jour férié (toggle vert)

**Résultats attendus:**
- [ ] Le toggle passe au vert
- [ ] Toast de confirmation affiché
- [ ] Notification créée pour tous les parents et staff
- [ ] Widget "Nouveautés" affiche la notification
- [ ] App mobile: notification reçue avec icône calendrier vert

### Test 1.2: Désactivation d'un jour férié
**Actions:**
1. Désactiver un jour férié (toggle rouge)

**Résultats attendus:**
- [ ] Le toggle passe au rouge
- [ ] Notification créée pour tous les parents et staff
- [ ] Widget "Nouveautés" affiche la notification
- [ ] App mobile: notification reçue avec icône calendrier rouge

### Test 1.3: Navigation depuis notification
**Actions:**
1. Cliquer sur une notification de jour férié

**Résultats attendus:**
- [ ] Web: Navigation vers la section jours fériés
- [ ] Mobile: Retour à l'écran d'accueil

---

## 2. 💬 Messages

### Test 2.1: Message staff → admin
**Actions:**
1. Se connecter en tant que staff
2. Envoyer un message à l'admin

**Résultats attendus:**
- [ ] Notification créée pour l'admin
- [ ] Push notification envoyée
- [ ] Clic sur notification ouvre la conversation

### Test 2.2: Message admin → staff
**Actions:**
1. Se connecter en tant qu'admin
2. Envoyer un message à un staff

**Résultats attendus:**
- [ ] Notification créée pour le staff
- [ ] Push notification envoyée
- [ ] Clic sur notification ouvre la conversation

---

## 3. 🎂 Anniversaires

### Test 3.1: Rappel anniversaire (3 jours avant)
**Prérequis:** Un enfant avec anniversaire dans 3 jours

**Résultats attendus:**
- [ ] Notification créée pour le parent
- [ ] Message suggérant de contacter la crèche
- [ ] Widget "Nouveautés" affiche la notification

---

## 4. 📅 Rendez-vous

### Test 4.1: Nouveau rendez-vous proposé
**Actions:**
1. Admin propose un rendez-vous à un parent

**Résultats attendus:**
- [ ] Notification créée pour le parent
- [ ] Clic ouvre les détails du RDV

### Test 4.2: Rendez-vous confirmé
**Actions:**
1. Parent confirme un rendez-vous

**Résultats attendus:**
- [ ] Notification créée pour l'admin
- [ ] Statut mis à jour

### Test 4.3: Rendez-vous annulé
**Actions:**
1. Annuler un rendez-vous

**Résultats attendus:**
- [ ] Notification créée pour l'autre partie
- [ ] Icône rouge dans la notification

---

## 5. 📋 Tâches (Staff)

### Test 5.1: Tâche assignée
**Actions:**
1. Admin assigne une tâche à un staff

**Résultats attendus:**
- [ ] Notification créée pour le staff assigné
- [ ] Titre et priorité affichés
- [ ] Clic ouvre la liste des tâches

---

## 6. ⏰ Changements Paramètres Crèche

### Test 6.1: Changement horaires
**Actions:**
1. Admin modifie les horaires d'ouverture/fermeture

**Résultats attendus:**
- [ ] Notification créée pour tous les parents et staff
- [ ] Nouveaux horaires affichés dans le message

### Test 6.2: Changement samedi
**Actions:**
1. Admin active/désactive le travail le samedi

**Résultats attendus:**
- [ ] Notification créée pour tous
- [ ] Message clair sur l'ouverture/fermeture samedi

### Test 6.3: Changement numéro téléphone
**Actions:**
1. Admin modifie le numéro de téléphone

**Résultats attendus:**
- [ ] Notification créée pour tous
- [ ] Nouveau numéro affiché

---

## 7. 📢 Annonces

### Test 7.1: Nouvelle annonce publiée
**Actions:**
1. Admin crée et publie une annonce

**Résultats attendus:**
- [ ] Notification créée pour les parents ciblés
- [ ] Widget "Nouveautés" affiche l'annonce
- [ ] Clic ouvre la page des annonces

---

## 8. 🎨 Activités

### Test 8.1: Activité publiée
**Actions:**
1. Staff/Admin publie une activité

**Résultats attendus:**
- [ ] Notification créée pour tous (sauf l'auteur)
- [ ] Clic ouvre la galerie d'activités

---

## 9. 💰 Alertes Paiement

### Test 9.1: Alerte paiement envoyée
**Actions:**
1. Admin envoie une alerte de paiement à un parent

**Résultats attendus:**
- [ ] Notification créée pour le parent
- [ ] Montant et nom de l'enfant affichés
- [ ] Icône rouge (alerte)

---

## 10. 🔔 Widget Nouveautés

### Test 10.1: Affichage widget
**Vérifier:**
- [ ] Widget visible dans l'espace parent
- [ ] Widget visible dans le dashboard staff
- [ ] Notifications triées par date (récentes en premier)
- [ ] Icônes et couleurs correctes selon le type

### Test 10.2: Masquer une nouveauté
**Actions:**
1. Cliquer sur le X d'une nouveauté

**Résultats attendus:**
- [ ] Nouveauté disparaît
- [ ] Reste masquée après rafraîchissement
- [ ] Stockée dans localStorage

### Test 10.3: Navigation depuis widget
**Actions:**
1. Cliquer sur une nouveauté

**Résultats attendus:**
- [ ] Navigation vers la section appropriée
- [ ] Focus sur l'élément concerné si applicable

---

## 11. 📱 App Mobile

### Test 11.1: Réception notifications push
**Vérifier:**
- [ ] Notifications push reçues en arrière-plan
- [ ] Badge de notification mis à jour
- [ ] Son de notification

### Test 11.2: Liste des notifications
**Vérifier:**
- [ ] Toutes les notifications affichées
- [ ] Icônes correctes pour chaque type
- [ ] Filtres "Toutes" / "Non lues" fonctionnels

### Test 11.3: Marquer comme lu
**Actions:**
1. Cliquer sur une notification non lue

**Résultats attendus:**
- [ ] Notification marquée comme lue
- [ ] Point bleu disparaît
- [ ] Compteur mis à jour

### Test 11.4: Marquer tout comme lu
**Actions:**
1. Cliquer sur "Tout lire"

**Résultats attendus:**
- [ ] Toutes les notifications marquées comme lues
- [ ] Compteur à 0

---

## 12. 🔄 Tests de Régression

### Test 12.1: Performance
- [ ] Chargement des notifications < 2s
- [ ] Pas de lag lors du scroll
- [ ] Widget ne bloque pas l'interface

### Test 12.2: Multilingue
- [ ] Notifications en français
- [ ] Notifications en arabe (RTL)
- [ ] Dates formatées correctement

### Test 12.3: Thème sombre
- [ ] Couleurs correctes en mode sombre
- [ ] Icônes visibles
- [ ] Contraste suffisant

---

## 📝 Notes de Test

| Date | Testeur | Version | Résultat | Commentaires |
|------|---------|---------|----------|--------------|
|      |         |         |          |              |

---

## 🐛 Bugs Trouvés

| # | Description | Sévérité | Statut |
|---|-------------|----------|--------|
|   |             |          |        |

---

*Dernière mise à jour: Décembre 2025*
