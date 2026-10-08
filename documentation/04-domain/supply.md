# Entité : Fournitures

**Tables** : `child_supplies` (UNIQUE enfant + type ; types diapers, wipes, cream, other ; `alert_threshold`), `daily_supplies_brought`.
**Cycle** : réapprovisionnement (+) → utilisation (−) → alerte sous seuil.
**API** : `/api/supplies` (`/child/:childId`, `/refill`, `/use`, `/history`, `/daily-brought`, `/today/:childId`, `/food-options`).
**Sources** : `routes_postgres/supplies.js`, `init_database.js`.
