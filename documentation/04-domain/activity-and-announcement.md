# Entités : Activité, annonce, témoignage

| Entité | Tables | Cycle | Accès |
|---|---|---|---|
| Activité (publication) | `activities`, `activity_comments`, `activity_reactions` | publiée → supprimée | publier : permission `activities.photos.publish` / admin ; réagir/commenter : authentifié |
| Annonce | `announcements` | créée → publiée | admin ; lecture `GET /my` |
| Témoignage | `testimonials` | soumis → approuvé/rejeté → mis en avant | dépôt : authentifié ; modération : admin/developer ; lecture publique des approuvés |

**API** : `/api/activities`, `/api/announcements`, `/api/testimonials`, `/api/activity-feed` (journal admin, ≠ activités).
**Attention** : « activity-feed » = journal des actions utilisateurs, « activities » = fil de publications pour les parents.
