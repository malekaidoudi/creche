# 📧 CONFIGURATION EMAIL SUR RENDER

## 🚨 PROBLÈME
La configuration email est perdue à chaque redémarrage du serveur sur Render car elle n'est pas dans les variables d'environnement.

## ✅ SOLUTION : AJOUTER LES VARIABLES D'ENVIRONNEMENT SUR RENDER

### 📋 **ÉTAPES À SUIVRE**

1. **Allez sur le dashboard Render** :
   - https://dashboard.render.com/
   - Sélectionnez votre service `creche-backend`

2. **Accédez aux variables d'environnement** :
   - Cliquez sur l'onglet **"Environment"** dans le menu de gauche
   - Ou allez directement sur : https://dashboard.render.com/web/YOUR_SERVICE_ID/env

3. **Ajoutez les variables email** :

```bash
# Email Configuration (Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=crechemimaelghalia@gmail.com
SMTP_PASSWORD=qeyp kwpf yhhe voax
EMAIL_FROM=crechemimaelghalia@gmail.com
```

### 🔑 **VARIABLES COMPLÈTES À AJOUTER**

Voici toutes les variables d'environnement nécessaires :

```bash
# Base de données PostgreSQL Neon
DB_HOST=ep-lucky-math-agxmasfs-pooler.c-2.eu-central-1.aws.neon.tech
DB_PORT=5432
DB_USER=neondb_owner
DB_PASSWORD=npg_ioMNXW9K2sbw
DB_NAME=mima_elghalia_db
DB_SSL=require
DATABASE_URL=postgresql://neondb_owner:npg_ioMNXW9K2sbw@ep-lucky-math-agxmasfs-pooler.c-2.eu-central-1.aws.neon.tech:5432/mima_elghalia_db?sslmode=require

# JWT
JWT_SECRET=your-super-secret-jwt-key-here-change-in-production

# Email Configuration (Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=crechemimaelghalia@gmail.com
SMTP_PASSWORD=qeyp kwpf yhhe voax
EMAIL_FROM=crechemimaelghalia@gmail.com

# Environnement
NODE_ENV=production
PORT=3003
```

### 📸 **CAPTURE D'ÉCRAN DES ÉTAPES**

1. **Dashboard Render** → Sélectionnez `creche-backend`
2. **Menu gauche** → Cliquez sur "Environment"
3. **Bouton "Add Environment Variable"** → Ajoutez chaque variable
4. **Format** :
   - **Key** : `SMTP_HOST`
   - **Value** : `smtp.gmail.com`
5. **Sauvegarde** : Cliquez sur "Save Changes"

### 🔄 **REDÉMARRAGE AUTOMATIQUE**

Après avoir ajouté les variables :
- Render redémarrera automatiquement le service
- Les variables seront persistées
- La configuration email sera conservée après chaque redémarrage

### ✅ **VÉRIFICATION**

Pour vérifier que les variables sont bien configurées :

1. **Allez dans les logs Render** :
   ```
   https://dashboard.render.com/web/YOUR_SERVICE_ID/logs
   ```

2. **Cherchez les logs de démarrage** :
   ```
   ✅ Configuration email chargée
   📧 SMTP Host: smtp.gmail.com
   📧 SMTP Port: 587
   📧 Email From: crechemimaelghalia@gmail.com
   ```

3. **Testez l'envoi d'email** :
   - Créez une inscription sur le frontend
   - Vérifiez que l'email de confirmation est envoyé

### 🚀 **RÉSULTAT**

✅ Configuration email persistée sur Render
✅ Emails envoyés automatiquement après chaque inscription
✅ Plus de perte de configuration après redémarrage

---

## 📚 **DOCUMENTATION RENDER**

- [Environment Variables](https://render.com/docs/environment-variables)
- [Web Services](https://render.com/docs/web-services)

---

**Date** : 2025-11-02
**Statut** : ✅ Configuration requise
