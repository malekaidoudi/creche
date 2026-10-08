# Incohérences et Divergences Identifiées

Ce document répertorie les contradictions observées entre la documentation historique, les différentes portions du code source et les modèles de données.

---

## 1. Documentation Historique vs Réalité du Code

| Sujet | Documentation Existante (Ancienne) | Réalité Analysée dans le Code |
|---|---|---|
| **Base de données** | Fichiers mentionnant MySQL / MariaDB (`db_mysql.js`) | PostgreSQL managé Serverless (Neon) via `db_postgres.js` |
| **Hébergement Frontend** | Déclaré sur GitHub Pages ou Netlify | Configurations Vercel, Fly.io et Netlify présentes simultanément |
| **Point d'entrée serveur** | `server.js` à la racine | `server.js` à la racine est **vide (0 octet)** ; le point d'entrée réel est `backend/server.js` |
| **Version de l'API** | Variantes v1.0 / v2.0 selon les fichiers markdown | Version 2.1.0 déclarée dans `backend/server.js` |
| **Documentation Workflow** | `docs/ENROLLMENT_WORKFLOW.md` référence `/backend/services/emailService.js` | Le fichier réel est `backend/emails/emailService.js` |

---

## 2. Incohérences au sein du Backend

### A. Doublons de Routes dans `attendance.js`
Le fichier `backend/routes_postgres/attendance.js` déclare deux séries de routes pour les mêmes chemins d'URL :
- Série 1 (haut du fichier) : `GET /today`, `GET /stats`, `GET /currently-present` (avec authentification).
- Série 2 (bas du fichier) : `GET /today`, `GET /stats`, `GET /currently-present`, `POST /`, `PUT /:id`, `DELETE /:id` (sans authentification).
Bien qu'Express sélectionne la première route correspondante dans l'ordre de déclaration, la présence de ces doublons non protégés en fin de fichier constitue une anomalie grave.

### B. Contrôle de Rôle `direction` Fantôme
Dans `backend/routes_postgres/treatments.js` :
```javascript
router.get('/today', AUTH, requireRole('staff', 'admin', 'direction'), ...);
```
Le rôle `direction` n'existe nulle part dans le système (seuls `parent`, `staff`, `admin` et `developer` sont reconnus).

### C. Statuts de Rendez-vous Incohérents
- Le service `appointmentService.js` gère les statuts : `proposed`, `counter_proposed`, `confirmed`, `rescheduled`, `cancelled`, `completed`.
- Le contrôleur `appointmentsController.js` manipule en plus des statuts `no_show` et `failed` qui ne sont pas référencés dans la validation du service.

### D. Inadéquation de la table `nursery_settings`
- Créée par `backend/init_database.js` : colonnes `(id, setting_key, setting_value, created_at, updated_at)`.
- Requêtée par `backend/routes_postgres/nurserySettings.js` : colonnes `(setting_key, value_fr, value_ar, category, is_active)`.
L'exécution de `init_database.js` sur une base vierge produirait ainsi une erreur SQL immédiate lors de l'accès aux paramètres bilingues.
