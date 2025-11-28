# 📋 PRD - Fil d'Activités de la Crèche

## 📌 Résumé Exécutif

| Attribut | Valeur |
|----------|--------|
| **Projet** | Crèche Mima Elghalia - Fil d'Activités |
| **Version** | 1.0 |
| **Date** | 28 Novembre 2025 |
| **Auteur** | Équipe Développement |
| **Priorité** | Haute |
| **Effort estimé** | 5-7 jours |

### 🎯 Objectif
Créer un **fil d'actualités social** permettant au staff et aux admins de partager les moments forts de la crèche (photos, vidéos) avec les parents, qui peuvent interagir via des commentaires et des réactions.

### 💡 Vision
> *"Rapprocher les parents de la vie quotidienne de leurs enfants à la crèche"*

### ✨ Bénéfices
- 👨‍👩‍👧 Parents impliqués dans la vie de la crèche
- 📱 Expérience moderne type "réseau social"
- 🔔 Notifications en temps réel
- 📸 Partage facile depuis mobile (caméra/galerie)
- 🌍 Support multilingue (FR/AR)
- 💬 Interaction via commentaires et réactions

---

## 🎯 Personas & Cas d'Utilisation

### 👤 Personas

| Persona | Besoins | Fréquence |
|---------|---------|-----------|
| **Admin** | Publier des activités, modérer les commentaires | Quotidien |
| **Staff** | Partager photos/vidéos rapidement depuis le terrain | Plusieurs fois/jour |
| **Parent** | Voir les activités, commenter, réagir | Plusieurs fois/jour |

### 📖 Cas d'Utilisation

#### UC1 : Publication d'une activité (Staff/Admin)
```
1. Staff ouvre l'app sur son smartphone
2. Clique sur "+" ou "Nouvelle activité"
3. Prend une photo/vidéo OU sélectionne depuis la galerie
4. Ajoute un titre et une description
5. Publie → Notification envoyée à tous les parents
```

#### UC2 : Consultation du fil (Tous)
```
1. Parent ouvre la page "Activités"
2. Voit le fil chronologique (plus récent en haut)
3. Scroll infini pour charger plus
4. Peut filtrer par date ou type
```

#### UC3 : Interaction avec une activité (Tous)
```
1. Utilisateur voit une publication
2. Clique sur une réaction (❤️ 😂 😮 👏 🎉)
3. Ou écrit un commentaire
4. Staff/Admin peuvent supprimer les commentaires inappropriés
```

#### UC4 : Vidéo en direct (Staff/Admin) - Phase 2
```
1. Staff démarre un live depuis l'app
2. Parents reçoivent notification "Live en cours !"
3. Parents rejoignent le stream
4. Live enregistré automatiquement après fin
```

---

## 🏗️ Architecture Technique

### Vue d'ensemble
```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ Activities  │  │ Activity    │  │ Reactions &         │  │
│  │ Page        │  │ Card        │  │ Comments Section    │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
│         │                │                    │              │
│         └────────────────┼────────────────────┘              │
│                          ▼                                   │
│              ┌───────────────────┐                          │
│              │ activityService   │                          │
│              └───────────────────┘                          │
└──────────────────────────┼──────────────────────────────────┘
                           │ REST API
┌──────────────────────────▼──────────────────────────────────┐
│                        BACKEND                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              /api/activities                         │    │
│  │  POST /        → Créer activité                      │    │
│  │  GET  /        → Liste paginée                       │    │
│  │  GET  /:id     → Détail                              │    │
│  │  PUT  /:id     → Modifier                            │    │
│  │  DELETE /:id   → Supprimer                           │    │
│  │  POST /:id/reactions   → Ajouter réaction            │    │
│  │  POST /:id/comments    → Ajouter commentaire         │    │
│  │  DELETE /:id/comments/:cid → Supprimer commentaire   │    │
│  └─────────────────────────────────────────────────────┘    │
│                          │                                   │
│              ┌───────────▼───────────┐                      │
│              │   activityService     │                      │
│              └───────────────────────┘                      │
│                          │                                   │
│         ┌────────────────┼────────────────┐                 │
│         ▼                ▼                ▼                 │
│  ┌────────────┐  ┌────────────┐  ┌────────────────┐        │
│  │ PostgreSQL │  │ Cloudinary │  │ Notifications  │        │
│  └────────────┘  └────────────┘  └────────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

---

## 🗄️ Schéma Base de Données

### Nouvelles Tables

```sql
-- =====================================================
-- TABLE ACTIVITIES (Publications)
-- =====================================================
CREATE TABLE activities (
    id SERIAL PRIMARY KEY,
    author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    media_type VARCHAR(20) CHECK (media_type IN ('image', 'video', 'live', 'none')) DEFAULT 'none',
    media_url VARCHAR(500),
    media_thumbnail_url VARCHAR(500),
    cloudinary_public_id VARCHAR(255),
    is_pinned BOOLEAN DEFAULT FALSE,
    is_visible BOOLEAN DEFAULT TRUE,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_activities_author ON activities(author_id);
CREATE INDEX idx_activities_created ON activities(created_at DESC);


### Script de Migration

```sql
-- Migration: 2025_11_28_add_activities_feature.sql

-- 1. Table des activités
CREATE TABLE IF NOT EXISTS activities (
    id SERIAL PRIMARY KEY,
    author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    media_type VARCHAR(20) DEFAULT 'none',
    media_url VARCHAR(500),
    media_thumbnail_url VARCHAR(500),
    cloudinary_public_id VARCHAR(255),
    is_pinned BOOLEAN DEFAULT FALSE,
    is_visible BOOLEAN DEFAULT TRUE,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Table des réactions
CREATE TABLE IF NOT EXISTS activity_reactions (
    id SERIAL PRIMARY KEY,
    activity_id INTEGER NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reaction_type VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(activity_id, user_id)
);

-- 3. Table des commentaires
CREATE TABLE IF NOT EXISTS activity_comments (
    id SERIAL PRIMARY KEY,
    activity_id INTEGER NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_comment_id INTEGER REFERENCES activity_comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_visible BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Index
CREATE INDEX IF NOT EXISTS idx_activities_created ON activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reactions_activity ON activity_reactions(activity_id);
CREATE INDEX IF NOT EXISTS idx_comments_activity ON activity_comments(activity_id);

-- 5. Ajouter type 'activity' aux notifications
ALTER TABLE notifications
ALTER COLUMN type TYPE VARCHAR(30);
-- Permettre le nouveau type 'activity'
```

---

## 🔧 Backend - Implémentation

### Routes API

| Méthode | Route | Auth | Rôles | Description |
|---------|-------|------|-------|-------------|
| `GET` | `/api/activities` | ✅ | Tous | Liste paginée des activités |
| `GET` | `/api/activities/:id` | ✅ | Tous | Détail d'une activité |
| `POST` | `/api/activities` | ✅ | Admin, Staff | Créer une activité |
| `PUT` | `/api/activities/:id` | ✅ | Auteur, Admin | Modifier une activité |
| `DELETE` | `/api/activities/:id` | ✅ | Auteur, Admin | Supprimer une activité |
| `POST` | `/api/activities/:id/reactions` | ✅ | Tous | Ajouter/modifier réaction |
| `DELETE` | `/api/activities/:id/reactions` | ✅ | Tous | Retirer réaction |
| `GET` | `/api/activities/:id/comments` | ✅ | Tous | Liste des commentaires |
| `POST` | `/api/activities/:id/comments` | ✅ | Tous | Ajouter commentaire |
| `DELETE` | `/api/activities/:id/comments/:cid` | ✅ | Auteur, Admin | Supprimer commentaire |

### Réponse type GET /api/activities

```json
{
  "success": true,
  "activities": [
    {
      "id": 1,
      "author": {
        "id": 2,
        "firstName": "Sarah",
        "lastName": "Martin",
        "role": "staff",
        "profileImage": "https://..."
      },
      "title": "Atelier peinture 🎨",
      "description": "Les enfants ont créé de magnifiques œuvres aujourd'hui !",
      "mediaType": "image",
      "mediaUrl": "https://res.cloudinary.com/...",
      "mediaThumbnailUrl": "https://res.cloudinary.com/.../thumbnail",
      "isPinned": false,
      "createdAt": "2025-11-28T10:30:00Z",
      "reactions": {
        "like": 5,
        "love": 12,
        "laugh": 3,
        "wow": 2,
        "clap": 8,
        "celebrate": 4,
        "total": 34,
        "userReaction": "love"
      },
      "commentsCount": 7,
      "viewCount": 45
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 156,
    "hasMore": true
  }
}
```

---

## 🎨 Frontend - Design System

### Palette de couleurs (Réactions)

| Réaction | Emoji | Couleur | Signification |
|----------|-------|---------|---------------|
| Like | 👍 | `#3B82F6` (blue) | J'aime |
| Love | ❤️ | `#EF4444` (red) | J'adore |
| Laugh | 😂 | `#F59E0B` (amber) | Rigolo |
| Wow | 😮 | `#8B5CF6` (purple) | Impressionnant |
| Clap | 👏 | `#10B981` (green) | Bravo |
| Celebrate | 🎉 | `#EC4899` (pink) | Félicitations |

### Composants UI

```
┌─────────────────────────────────────────────────────────────┐
│ 📌 Activité Épinglée                                        │
├─────────────────────────────────────────────────────────────┤
│ ┌────────────────────────────────────────────────────────┐  │
│ │ 👤 Sarah Martin (Staff) • il y a 2h                    │  │
│ ├────────────────────────────────────────────────────────┤  │
│ │                                                        │  │
│ │                    📸 [IMAGE/VIDEO]                    │  │
│ │                                                        │  │
│ ├────────────────────────────────────────────────────────┤  │
│ │ Atelier peinture 🎨                                    │  │
│ │ Les enfants ont créé de magnifiques œuvres...         │  │
│ ├────────────────────────────────────────────────────────┤  │
│ │ ❤️ 12  😂 3  👏 8  •  💬 7 commentaires               │  │
│ ├────────────────────────────────────────────────────────┤  │
│ │ [👍] [❤️] [😂] [😮] [👏] [🎉]     [💬 Commenter]     │  │
│ └────────────────────────────────────────────────────────┘  │
│                                                             │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ 👤 Ahmed (Admin) • il y a 5h                           │  │
│ │ ...                                                    │  │
│ └────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 📱 Mobile-First Design

### Formulaire de Publication (Mobile)

```
┌─────────────────────────────────────────┐
│ ←  Nouvelle Activité                    │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────────────────┐   │
│  │                                 │   │
│  │     📷  Appuyer pour ajouter    │   │
│  │         photo ou vidéo          │   │
│  │                                 │   │
│  │   [📸 Caméra]  [🖼️ Galerie]    │   │
│  │                                 │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Titre *                                │
│  ┌─────────────────────────────────┐   │
│  │ Ex: Atelier peinture            │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Description                            │
│  ┌─────────────────────────────────┐   │
│  │ Décrivez l'activité...          │   │
│  │                                 │   │
│  │                                 │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ☐ Épingler cette activité             │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │        📤 PUBLIER               │   │
│  └─────────────────────────────────┘   │
│                                         │
└─────────────────────────────────────────┘
```

### Sélection de Média (Mobile)

```javascript
// Utilisation de l'API native du navigateur
const handleMediaSelect = async () => {
  // Sur mobile, ouvre le sélecteur natif (caméra ou galerie)
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*,video/*';
  input.capture = 'environment'; // Caméra arrière par défaut

  input.onchange = (e) => {
    const file = e.target.files[0];
    // Gérer l'upload...
  };

  input.click();
};
```

---

## 🌍 Internationalisation (i18n)

### Clés de traduction

```json
{
  "activities": {
    "title": {
      "fr": "Activités",
      "ar": "الأنشطة"
    },
    "newActivity": {
      "fr": "Nouvelle activité",
      "ar": "نشاط جديد"
    },
    "addPhoto": {
      "fr": "Ajouter photo/vidéo",
      "ar": "إضافة صورة/فيديو"
    },
    "camera": {
      "fr": "Caméra",
      "ar": "الكاميرا"
    },
    "gallery": {
      "fr": "Galerie",
      "ar": "المعرض"
    },
    "publish": {
      "fr": "Publier",
      "ar": "نشر"
    },
    "comments": {
      "fr": "commentaires",
      "ar": "تعليقات"
    },
    "writeComment": {
      "fr": "Écrire un commentaire...",
      "ar": "اكتب تعليقاً..."
    },
    "pin": {
      "fr": "Épingler",
      "ar": "تثبيت"
    },
    "delete": {
      "fr": "Supprimer",
      "ar": "حذف"
    },
    "reactions": {
      "like": { "fr": "J'aime", "ar": "أعجبني" },
      "love": { "fr": "J'adore", "ar": "أحب" },
      "laugh": { "fr": "Haha", "ar": "هههه" },
      "wow": { "fr": "Wow", "ar": "واو" },
      "clap": { "fr": "Bravo", "ar": "برافو" },
      "celebrate": { "fr": "Félicitations", "ar": "تهانينا" }
    },
    "timeAgo": {
      "justNow": { "fr": "À l'instant", "ar": "الآن" },
      "minutesAgo": { "fr": "il y a {n} min", "ar": "منذ {n} دقيقة" },
      "hoursAgo": { "fr": "il y a {n}h", "ar": "منذ {n} ساعة" },
      "daysAgo": { "fr": "il y a {n}j", "ar": "منذ {n} يوم" }
    }
  }
}
```

---

## 🔔 Notifications

### Types de notifications

| Événement | Destinataires | Message (FR) | Message (AR) |
|-----------|---------------|--------------|--------------|
| Nouvelle activité | Tous les parents | "Nouvelle activité : {title}" | "نشاط جديد: {title}" |
| Commentaire reçu | Auteur de l'activité | "{user} a commenté votre publication" | "علّق {user} على منشورك" |
| Réponse commentaire | Auteur du commentaire | "{user} a répondu à votre commentaire" | "ردّ {user} على تعليقك" |

### Implémentation

```javascript
// Backend: Après création d'une activité
const notifyParents = async (activity) => {
  // Récupérer tous les parents actifs
  const parents = await db.query(
    "SELECT id FROM users WHERE role = 'parent' AND is_active = true"
  );

  // Créer les notifications en batch
  const notifications = parents.rows.map(parent => ({
    user_id: parent.id,
    title: 'Nouvelle activité',
    message: activity.title,
    type: 'activity',
    related_id: activity.id
  }));

  await db.query(
    `INSERT INTO notifications (user_id, title, message, type, related_id)
     SELECT * FROM UNNEST($1::int[], $2::text[], $3::text[], $4::text[], $5::int[])`,
    [/* arrays of values */]
  );
};
```

---

## 🔐 Sécurité & Permissions

### Matrice des permissions

| Action | Admin | Staff | Parent |
|--------|-------|-------|--------|
| Voir les activités | ✅ | ✅ | ✅ |
| Créer une activité | ✅ | ✅ | ❌ |
| Modifier une activité | ✅ (toutes) | ✅ (siennes) | ❌ |
| Supprimer une activité | ✅ (toutes) | ✅ (siennes) | ❌ |
| Épingler une activité | ✅ | ❌ | ❌ |
| Réagir | ✅ | ✅ | ✅ |
| Commenter | ✅ | ✅ | ✅ |
| Supprimer un commentaire | ✅ (tous) | ✅ (siens) | ✅ (siens) |

### Validation des uploads

```javascript
const ALLOWED_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  video: ['video/mp4', 'video/webm', 'video/quicktime']
};

const MAX_FILE_SIZE = {
  image: 10 * 1024 * 1024,  // 10 MB
  video: 100 * 1024 * 1024  // 100 MB
};

const validateMedia = (file) => {
  const isImage = ALLOWED_TYPES.image.includes(file.mimetype);
  const isVideo = ALLOWED_TYPES.video.includes(file.mimetype);

  if (!isImage && !isVideo) {
    throw new Error('Type de fichier non autorisé');
  }

  const maxSize = isImage ? MAX_FILE_SIZE.image : MAX_FILE_SIZE.video;
  if (file.size > maxSize) {
    throw new Error(`Fichier trop volumineux (max ${maxSize / 1024 / 1024} MB)`);
  }

  return { type: isImage ? 'image' : 'video' };
};
```

---

## 📊 Métriques & Analytics

### KPIs à suivre

| Métrique | Description | Objectif |
|----------|-------------|----------|
| Publications/jour | Nombre d'activités publiées | > 3/jour |
| Taux d'engagement | (Réactions + Commentaires) / Vues | > 15% |
| Parents actifs | Parents ayant interagi dans les 7 derniers jours | > 80% |
| Temps de réponse | Délai moyen avant premier commentaire | < 30 min |

---

## 📅 Planning d'Implémentation

| Phase | Tâches | Durée | Priorité |
|-------|--------|-------|----------|
| **1. BDD** | Migration, création tables | 2h | P0 |
| **2. Backend** | Routes API, service, tests | 8h | P0 |
| **3. Frontend - Base** | Page, service, composants de base | 8h | P0 |
| **4. Frontend - Interactions** | Réactions, commentaires | 6h | P0 |
| **5. Upload média** | Intégration Cloudinary, camera | 4h | P0 |
| **6. Notifications** | Push notifications parents | 4h | P1 |
| **7. Polish** | Animations, optimisations | 4h | P1 |
| **8. Tests** | Tests E2E, corrections | 4h | P0 |
| **Total** | | **~40h (5-7 jours)** | |

---

## ✅ Checklist de Livraison

### Phase 1 - MVP
- [ ] Tables BDD créées et migrées
- [ ] API CRUD activités fonctionnelle
- [ ] Page activités avec fil d'actualités
- [ ] Upload image depuis mobile
- [ ] Réactions (like, love, etc.)
- [ ] Commentaires basiques
- [ ] Notifications aux parents

### Phase 2 - Améliorations
- [ ] Upload vidéo
- [ ] Réponses aux commentaires (threads)
- [ ] Activités épinglées
- [ ] Filtres (date, type)
- [ ] Mode hors-ligne (PWA)

### Phase 3 - Avancé
- [ ] Vidéo en direct (live streaming)
- [ ] Marquage d'enfants sur les photos
- [ ] Albums thématiques
- [ ] Export PDF des activités

---

## 🧪 Tests Requis

### Tests Unitaires
- [ ] activityService.createActivity()
- [ ] activityService.addReaction()
- [ ] activityService.addComment()
- [ ] Validation des uploads

### Tests d'Intégration
- [ ] Flux complet création → notification
- [ ] Permissions par rôle
- [ ] Upload Cloudinary

### Tests E2E
- [ ] Publication depuis mobile
- [ ] Scroll infini
- [ ] Réactions en temps réel
- [ ] Mode RTL (arabe)

