# 📋 Liste complète des URLs - Mima El Ghalia

## 📄 Pages Publiques (5)

| URL | Nom | Description | Auth |
|-----|-----|-------------|------|
| `/` | Accueil | Page d'accueil du site | ❌ |
| `/articles` | Articles | Liste des articles/actualités | ❌ |
| `/articles/:id` | Détail Article | Page d'un article spécifique | ❌ |
| `/inscription` | Inscription | Formulaire d'inscription enfant | ❌ |
| `/contact` | Contact | Page de contact | ❌ |
| `/visite-virtuelle` | Visite Virtuelle | Visite virtuelle de la crèche | ❌ |

---

## 🔐 Pages Authentifiées - Tous Rôles (2)

| URL | Nom | Description | Rôles |
|-----|-----|-------------|-------|
| `/profile` | Profil | Page profil utilisateur | Admin, Staff, Parent |
| `/mon-espace` | Mon Espace | Espace parent principal | Admin, Staff, Parent |

---

## 👨‍👩‍👧 Pages Parent (5)

| URL | Nom | Description | Rôles |
|-----|-----|-------------|-------|
| `/mon-espace/messages` | Messages | Messagerie parent | Parent |
| `/mon-espace/announcements` | Annonces | Annonces de la crèche | Parent |
| `/mon-espace/calendar` | Calendrier | Calendrier événements | Parent |
| `/mon-espace/attendance-report` | Présences | Rapport de présences enfant | Parent |
| `/mon-espace/events/:id` | Détail Événement | Détail d'un événement | Parent |
| `/attendance-parent` | Présences (alt) | Alternative présences | Parent |
| `/absence-request` | Demande Absence | Formulaire demande absence | Parent |

---

## 📊 Dashboard Admin/Staff (30+)

### Dashboard Principal
| URL | Nom | Description | Rôles |
|-----|-----|-------------|-------|
| `/dashboard` | Dashboard Home | Page d'accueil dashboard | Admin, Staff |

### Gestion Enfants
| URL | Nom | Description | Rôles |
|-----|-----|-------------|-------|
| `/dashboard/children` | Enfants | Liste des enfants | Admin, Staff |
| `/dashboard/children/add` | Ajouter Enfant | Formulaire ajout enfant | Admin, Staff |

### Gestion Inscriptions
| URL | Nom | Description | Rôles |
|-----|-----|-------------|-------|
| `/dashboard/enrollments` | Demandes | Demandes d'inscription | Admin, Staff |
| `/dashboard/pending-enrollments` | En Attente | Demandes en attente | Admin, Staff |
| `/dashboard/enrollments/today` | Aujourd'hui | Demandes du jour | Admin, Staff |
| `/dashboard/enrollments/history` | Historique | Historique demandes | Admin, Staff |
| `/dashboard/enrollments/stats` | Statistiques | Stats inscriptions | Admin, Staff |

### Gestion Présences
| URL | Nom | Description | Rôles |
|-----|-----|-------------|-------|
| `/dashboard/attendance` | Présences | Gestion présences | Admin, Staff |
| `/dashboard/attendance/today` | Aujourd'hui | Présences du jour | Admin, Staff |
| `/dashboard/attendance/history` | Historique | Historique présences | Admin, Staff |
| `/dashboard/attendance/stats` | Statistiques | Stats présences | Admin, Staff |
| `/dashboard/absence-management` | Absences | Gestion des absences | Admin, Staff |

### Documents
| URL | Nom | Description | Rôles |
|-----|-----|-------------|-------|
| `/dashboard/documents` | Documents | Gestion documents | Admin, Staff |
| `/dashboard/documents/download` | Télécharger | Téléchargement docs | Admin, Staff |
| `/dashboard/documents/uploaded` | Uploadés | Documents uploadés | Admin, Staff |

### Événements
| URL | Nom | Description | Rôles |
|-----|-----|-------------|-------|
| `/dashboard/events/calendar` | Calendrier | Calendrier événements | Admin, Staff |
| `/dashboard/events/:id` | Détail Événement | Détail événement | Admin, Staff |

### Communication
| URL | Nom | Description | Rôles |
|-----|-----|-------------|-------|
| `/dashboard/messages` | Messages | Messagerie | Admin, Staff, Parent |
| `/dashboard/announcements` | Annonces | Gestion annonces | Parent |
| `/dashboard/tasks` | Tâches | Gestion tâches | Admin, Staff |
| `/dashboard/staff/send-message` | Envoyer Mémo | Formulaire mémo/tâche | Staff |

### Gestion Utilisateurs
| URL | Nom | Description | Rôles |
|-----|-----|-------------|-------|
| `/dashboard/parents` | Parents | Liste des parents | Admin, Staff |
| `/dashboard/staff` | Personnel | Liste du personnel | Admin, Staff |
| `/dashboard/add-user` | Ajouter Utilisateur | Formulaire ajout user | Admin |

### Statistiques & Rapports
| URL | Nom | Description | Rôles |
|-----|-----|-------------|-------|
| `/dashboard/general-stats` | Statistiques | Stats générales | Admin, Staff |
| `/dashboard/attendance-report` | Rapport Présences | Rapport présences | Admin, Staff |

### Paramètres
| URL | Nom | Description | Rôles |
|-----|-----|-------------|-------|
| `/dashboard/settings` | Paramètres | Paramètres généraux | Admin, Staff |
| `/dashboard/staff-settings` | Paramètres Staff | Paramètres personnel | Admin, Staff |

---

## 🔑 Pages Workflow Inscription (2)

| URL | Nom | Description | Auth |
|-----|-----|-------------|------|
| `/create-password` | Créer Mot de Passe | Création mot de passe | ❌ |
| `/upload-documents` | Upload Documents | Upload documents requis | ❌ |

---

## 🔐 Pages Authentification (1)

| URL | Nom | Description | Auth |
|-----|-----|-------------|------|
| `/register` | Inscription | Page d'inscription compte | ❌ |

---

## 📊 Résumé

### Par Catégorie:
- **Pages Publiques:** 6 pages
- **Pages Authentifiées (tous):** 2 pages
- **Pages Parent:** 7 pages
- **Dashboard Admin/Staff:** 30+ pages
- **Workflow Inscription:** 2 pages
- **Authentification:** 1 page

### Total: **48+ pages**

---

## 🎯 Pages Prioritaires pour Tests Responsive

### Critiques (Mobile obligatoire):
1. ✅ `/` - Accueil
2. ✅ `/inscription` - Inscription
3. ✅ `/contact` - Contact
4. ✅ `/mon-espace` - Mon Espace
5. ✅ `/dashboard` - Dashboard Home
6. ✅ `/dashboard/children` - Enfants
7. ✅ `/dashboard/attendance` - Présences
8. ✅ `/profile` - Profil

### Importantes (Tablet + Desktop):
9. `/dashboard/enrollments` - Demandes
10. `/dashboard/staff` - Personnel
11. `/dashboard/parents` - Parents
12. `/dashboard/messages` - Messages
13. `/dashboard/settings` - Paramètres

### Secondaires:
- Toutes les autres pages dashboard
- Pages de statistiques
- Pages de rapports

---

## 📱 Viewports de Test

### Ajouté dans l'interface de test:
1. **iPhone SE** - 375x667
2. **iPhone 12/13** - 390x844 ✨ **NOUVEAU**
3. **iPhone 11** - 414x896
4. **iPad** - 768x1024
5. **iPad Landscape** - 1024x768
6. **Desktop** - 1366x768
7. **Desktop Large** - 1920x1080

---

## 🔄 Mise à jour Interface de Test

### Modifications apportées:
- ✅ Ajout viewport iPhone 12/13 (390x844)
- ✅ Organisation par catégories (Publiques, Authentifiées, Dashboard)
- ✅ Ajout de toutes les pages manquantes
- ✅ Total: 30+ pages testables

### Fichier modifié:
`tests/manual-responsive-test.html`

---

**Interface de test mise à jour avec toutes les pages et le viewport iPhone 12/13 ! 🎉**
