# 🎯 PROGRESSION DES MODIFICATIONS

## ✅ TERMINÉ

### 1. ✅ Jours Fériés
- Traduction anglais → français
- Gestion erreur 409
- Rechargement automatique

### 2. ✅ Vacances Annuelles
- Migration SQL créée (`add_annual_vacation.sql`)
- Routes API backend (`GET` et `PUT /api/nursery-settings/annual-vacation`)
- Widget frontend avec toggle et dates
- Chargement et sauvegarde automatiques

---

## 🔄 EN COURS

### 3. Calendrier - Modifications à faire

#### A. Supprimer les pages
- ❌ `EventsList.jsx`
- ❌ `EventForm.jsx`
- ❌ Routes dans `App.jsx`

#### B. Modal de création
- ❌ Remplacer `dateClick` par modal
- ❌ Choix: Événement / Tâche / RDV
- ❌ Boutons radio

#### C. Boutons à supprimer
- ❌ "Nouvel Événement"
- ❌ "Exporter"

#### D. Afficher dans le calendrier
- ❌ Vacances annuelles (depuis `nursery_settings`)
- ❌ Jours fériés (depuis `holidays`)

---

## 📋 FICHIERS MODIFIÉS

### Backend
- ✅ `backend/database/migrations/add_annual_vacation.sql`
- ✅ `backend/routes_postgres/nurserySettings.js`

### Frontend
- ✅ `frontend/src/pages/dashboard/DashboardSettingsPage.jsx`
- 🔄 `frontend/src/pages/events/EventsCalendar.jsx` (en cours)
- ❌ `frontend/src/App.jsx` (à modifier)

---

## 🚀 PROCHAINES ÉTAPES

1. Supprimer pages EventsList et EventForm
2. Créer modal de création rapide
3. Modifier EventsCalendar pour afficher vacances + jours fériés
4. Tester l'ensemble
