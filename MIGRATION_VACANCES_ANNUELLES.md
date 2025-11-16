# 🔧 MIGRATION VACANCES ANNUELLES

## ⚠️ ERREUR DÉTECTÉE

**Message d'erreur:** "Erreur lors de la création de l'annonce"

**Cause:** Les colonnes `annual_vacation_*` n'existent pas encore dans la table `nursery_settings`.

---

## ✅ SOLUTION: Exécuter la Migration SQL

### **Méthode 1: Via psql (Recommandé)**

```bash
# Se connecter à la base de données
psql "postgresql://neondb_owner:npg_yiWmUxvDDSfJ@ep-lucky-math-agxmasfs-pooler.c-2.eu-central-1.aws.neon.tech/mima_elghalia_db?sslmode=require"

# Exécuter la migration
\i /Volumes/Works/Windsurf/creche-site/backend/database/migrations/add_annual_vacation.sql

# Vérifier que les colonnes ont été ajoutées
\d nursery_settings

# Quitter
\q
```

### **Méthode 2: Copier-Coller le SQL**

1. **Se connecter à Neon Dashboard:**
   - Aller sur https://console.neon.tech
   - Sélectionner le projet
   - Aller dans "SQL Editor"

2. **Copier le contenu du fichier:**
   ```sql
   -- Contenu de add_annual_vacation.sql
   ALTER TABLE nursery_settings 
   ADD COLUMN IF NOT EXISTS annual_vacation_enabled BOOLEAN DEFAULT FALSE,
   ADD COLUMN IF NOT EXISTS annual_vacation_start_date DATE,
   ADD COLUMN IF NOT EXISTS annual_vacation_end_date DATE;

   CREATE INDEX IF NOT EXISTS idx_nursery_settings_annual_vacation 
   ON nursery_settings(annual_vacation_enabled);

   INSERT INTO nursery_settings (
       setting_key, value_fr, value_ar, category, 
       annual_vacation_enabled, annual_vacation_start_date, annual_vacation_end_date
   ) VALUES (
       'annual_vacation',
       'Vacances annuelles de la crèche',
       'العطلة السنوية للحضانة',
       'schedule', FALSE, NULL, NULL
   ) ON CONFLICT (setting_key) DO NOTHING;

   COMMENT ON COLUMN nursery_settings.annual_vacation_enabled IS 'Activer/désactiver les vacances annuelles';
   COMMENT ON COLUMN nursery_settings.annual_vacation_start_date IS 'Date de début des vacances annuelles';
   COMMENT ON COLUMN nursery_settings.annual_vacation_end_date IS 'Date de fin des vacances annuelles';
   ```

3. **Exécuter dans SQL Editor**

### **Méthode 3: Via Script Node.js**

Créer un fichier `run-migration.js` :

```javascript
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function runMigration() {
  try {
    console.log('🔄 Exécution de la migration...');
    
    await pool.query(`
      ALTER TABLE nursery_settings 
      ADD COLUMN IF NOT EXISTS annual_vacation_enabled BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS annual_vacation_start_date DATE,
      ADD COLUMN IF NOT EXISTS annual_vacation_end_date DATE;
    `);
    
    console.log('✅ Colonnes ajoutées');
    
    await pool.query(`
      INSERT INTO nursery_settings (
        setting_key, value_fr, value_ar, category, 
        annual_vacation_enabled, annual_vacation_start_date, annual_vacation_end_date
      ) VALUES (
        'annual_vacation',
        'Vacances annuelles de la crèche',
        'العطلة السنوية للحضانة',
        'schedule', FALSE, NULL, NULL
      ) ON CONFLICT (setting_key) DO NOTHING;
    `);
    
    console.log('✅ Entrée par défaut créée');
    console.log('🎉 Migration terminée avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await pool.end();
  }
}

runMigration();
```

Puis exécuter :
```bash
node backend/database/migrations/run-migration.js
```

---

## 🧪 VÉRIFICATION

Après avoir exécuté la migration, vérifier que tout fonctionne :

### **1. Vérifier les Colonnes**
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'nursery_settings' 
  AND column_name LIKE 'annual_vacation%';
```

**Résultat attendu:**
```
column_name                    | data_type
-------------------------------|----------
annual_vacation_enabled        | boolean
annual_vacation_start_date     | date
annual_vacation_end_date       | date
```

### **2. Tester la Sauvegarde**

1. Redémarrer le serveur
2. Aller dans Paramètres → Informations Crèche
3. Activer "Vacances Annuelles"
4. Sélectionner dates: 2025-08-01 à 2025-08-31
5. Cliquer "Sauvegarder"
6. ✅ Devrait afficher "Paramètres sauvegardés avec succès"

### **3. Vérifier dans la Base**
```sql
SELECT * FROM nursery_settings WHERE setting_key = 'annual_vacation';
```

**Résultat attendu:**
```
setting_key      | annual_vacation_enabled | annual_vacation_start_date | annual_vacation_end_date
-----------------|-------------------------|----------------------------|-------------------------
annual_vacation  | true                    | 2025-08-01                 | 2025-08-31
```

---

## 🎯 APRÈS LA MIGRATION

Une fois la migration exécutée :

1. ✅ Les vacances annuelles se sauvegardent correctement
2. ✅ Elles apparaissent dans le calendrier (orange)
3. ✅ Plus d'erreur "Erreur lors de la création de l'annonce"

---

## 📋 COMMANDE RAPIDE

**Pour exécuter rapidement via psql:**

```bash
psql "postgresql://neondb_owner:npg_yiWmUxvDDSfJ@ep-lucky-math-agxmasfs-pooler.c-2.eu-central-1.aws.neon.tech/mima_elghalia_db?sslmode=require" -f backend/database/migrations/add_annual_vacation.sql
```

---

## ⚠️ IMPORTANT

**Cette migration est nécessaire pour:**
- ✅ Sauvegarder les vacances annuelles
- ✅ Afficher les vacances dans le calendrier
- ✅ Éviter l'erreur de sauvegarde

**Sans cette migration:**
- ❌ Erreur lors de la sauvegarde
- ❌ Vacances non affichées
- ❌ Fonctionnalité inutilisable

---

## 🚀 EXÉCUTION MAINTENANT

**Choisissez une méthode et exécutez la migration !**
