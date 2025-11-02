# 🗄️ APPLIQUER LA MIGRATION SQL

## **MÉTHODE 1 : Via Render Dashboard (Recommandé)**

1. **Allez sur Render Dashboard** :
   - https://dashboard.render.com/
   - Sélectionnez votre service `creche-backend`

2. **Ouvrez le Shell** :
   - Cliquez sur l'onglet "Shell" dans le menu de gauche
   - Ou cliquez sur le bouton "Shell" en haut à droite

3. **Exécutez la migration** :
   ```bash
   psql $DATABASE_URL -f backend/migrations/add_enrollment_workflow_fields.sql
   ```

4. **Vérifiez le résultat** :
   - Vous devriez voir des messages "ALTER TABLE" et "CREATE INDEX"
   - Si erreur "column already exists", c'est normal (migration déjà appliquée)

---

## **MÉTHODE 2 : Via Neon Console**

1. **Allez sur Neon Console** :
   - https://console.neon.tech/
   - Sélectionnez votre projet

2. **Ouvrez SQL Editor** :
   - Cliquez sur "SQL Editor" dans le menu de gauche

3. **Copiez-collez le contenu** de `backend/migrations/add_enrollment_workflow_fields.sql`

4. **Exécutez** :
   - Cliquez sur "Run" ou appuyez sur Ctrl+Enter

---

## **MÉTHODE 3 : Via ligne de commande locale**

Si vous avez accès à la base de données depuis votre machine :

```bash
# Remplacez par votre URL de connexion
psql "postgresql://neondb_owner:npg_ioMNXW9K2sbw@ep-lucky-math-agxmasfs-pooler.c-2.eu-central-1.aws.neon.tech:5432/mima_elghalia_db?sslmode=require" -f backend/migrations/add_enrollment_workflow_fields.sql
```

---

## **VÉRIFICATION**

Pour vérifier que la migration a été appliquée :

```sql
-- Vérifier les nouvelles colonnes
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'enrollments' 
AND column_name IN (
  'appointment_date', 
  'password_token', 
  'password_token_expires',
  'rejection_type',
  'rejection_reason',
  'processed_by',
  'processed_at',
  'parent_chose_rdv',
  'parent_rdv_choice_date'
);
```

Vous devriez voir 9 lignes.

---

## **EN CAS D'ERREUR**

### **Erreur : "column already exists"**
✅ C'est normal ! La migration a déjà été appliquée.

### **Erreur : "relation does not exist"**
❌ La table `enrollments` n'existe pas. Vérifiez que vous êtes sur la bonne base de données.

### **Erreur : "permission denied"**
❌ Vous n'avez pas les droits. Utilisez un compte avec privilèges admin.

---

## **APRÈS LA MIGRATION**

1. **Redémarrez le backend** sur Render (si nécessaire)
2. **Testez les endpoints** :
   - POST /api/enrollments (création)
   - POST /api/enrollments/:id/approve (approbation)
   - PUT /api/enrollments/:id/reject (rejet)
   - POST /api/auth/create-password (création MDP)

3. **Vérifiez les emails** :
   - Créez une inscription test
   - Vérifiez que l'email de confirmation est envoyé

---

**Date** : 2025-11-02
**Statut** : ✅ Migration prête à être appliquée
