# Workflow & Module Anniversaires

Ce document détaille le fonctionnement complet, les règles métier et les autorisations par rôle du module Anniversaires de la crèche Mima Elghalia.

---

## 1. Vue d'ensemble & Chronologie

Le cycle de vie d'un anniversaire s'articule autour de 4 phases temporelles :

```
[ J-30 à J-5 ]          [ J-5 à J-1 23:59 ]          [ Jour J ]                 [ J+1 à J+30 ]
Ouverture du choix      Délai limite choix/modif     Fête à la crèche           Diaporama souvenirs
Bannière interactive    Demande tardive si après J-5   Accueil, couronne, photos   Partage Activités
```

1. **J-30 à J-5 (Fenêtre standard)** :
   - Une bannière festive dynamique s'affiche dans **Mon Espace** pour le parent concerné.
   - Le parent accède à l'assistant (Wizard) : Choix (*Oui / Non*) ➔ Validation & options ➔ Confirmation / WhatsApp.
2. **J-5 à J-1 23:59 (Verrouillage du refus)** :
   - Si le parent a choisi « Rien à prévoir » (Non), ce choix devient définitif à J-5 pour permettre à l'équipe d'organiser le planning.
   - Les modifications d'organisation (date, message) restent possibles jusqu'à la veille à 23:59.
3. **Jour J (La Célébration)** :
   - L'éducatrice assignée prépare la décoration, la couronne, accueille le gâteau/jus et prend les photos de la fête.
4. **J+1 à J+30 (Souvenirs & Partage)** :
   - Les photos prises sont automatiquement compilées en diaporama souvenir interactif visible pendant 30 jours pour le parent.
   - Les photos sont publiées dans la page **Activités** de la crèche.
   - L'année suivante, les photos réapparaissent comme « Souvenirs de l'an dernier ».

---

## 2. Règles Métier & Droits par Rôle

### A. Parent Concerné
- **Accès** : Reçoit la bannière personnalisée et accède à `/mon-espace/child/:id/birthday`.
- **Droit de publication exclusif** : Le parent concerné est **le seul habilité** à cocher l'option *« Informer les autres parents de la crèche »*.
- **Confidentialité par défaut** : Si l'option n'est pas cochée, l'événement calendrier n'est visible que par le parent concerné, le personnel et la direction.
- **Accompagnement** : Bouton direct vers WhatsApp pour échanger avec la crèche.

### B. Parents Non Concernés
- **Ne voient JAMAIS** les données privées, les tâches de préparation, ni les échanges administratifs.
- **Calendrier** : Ne voient l'événement d'anniversaire dans leur calendrier que si le parent concerné a expressément activé le partage public.
- **Activités** : Voient le diaporama de l'événement dans le fil d'activités à partir de J+1 si publié.

### C. Personnel (Staff)
- **Staff Assigné** :
  - Reçoit une tâche prioritaire dans son widget **« Tâches d'aujourd'hui »** : `🎂 Préparer l'anniversaire de [Enfant]`.
  - Reçoit une notification système instantanée.
  - Accède à la fiche pour consulter les instructions (couronne, décoration) et déposer les photos de la fête.
  - Marque la préparation comme terminée une fois la fête prête.
- **Staff Non Assigné** :
  - Voit l'événement au calendrier de la section pour information.
  - Ne reçoit pas de tâche d'action obligatoire dans sa liste personnelle.

### D. Direction / Administrateur
- **Supervision** : Reçoit une tâche `🎂 Organisation Anniversaire — [Enfant]` dès qu'un parent confirme son souhait de célébrer.
- **Assignation** : Valide la date retenue, sélectionne le membre du staff en charge et personnalise les consignes.
- **Respect du choix parent** : L'administrateur **ne peut pas modifier unilatéralement** le choix de publication aux autres parents (réservé au responsable légal de l'enfant).

---

## 3. Architecture Technique

- **Routes Backend** :
  - `backend/routes_postgres/birthdays.js` : API REST dédiée (`/api/birthdays/my-children`, `/api/birthdays/child/:childId`, `/api/birthdays/child/:childId/decision`, `/api/birthdays/child/:childId/admin-action`, `/api/birthdays/child/:childId/photos`).
- **Tables PostgreSQL (Neon)** :
  - `birthday_celebrations` : Stocke le choix (`yes`/`no`), la date retenue, l'assignation staff, les statuts d'approbation et les liaisons `event_id`, `task_id`, `activity_id`.
  - `birthday_memories` : Stocke les photos souvenirs uploadées, les légendes et l'année de célébration.
  - `tasks` & `events` : Synchronisation automatique bidirectionnelle avec le calendrier et le gestionnaire de tâches.
- **Composants Frontend** :
  - `frontend/src/pages/BirthdayEventPage.jsx` : Page maîtresse avec adaptation dynamique selon le rôle (Parent, Staff, Admin).
  - `frontend/src/components/widgets/ParentBirthdayBanner.jsx` : Bannière festive animée dans Mon Espace.
  - `frontend/src/components/widgets/TodayTasksWidget.jsx` & `TodayTasksWidgetMobile.jsx` : Actions dédiées `🎂 Organiser & Assigner` et `🎀 Voir & Préparer`.

