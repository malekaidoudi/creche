# 📦 Migration des Documents vers Cloudinary

## 🎯 Objectif

Ce script migre tous les documents d'inscription stockés localement vers Cloudinary et met à jour la base de données avec les nouvelles URLs.

---

## ⚙️ Prérequis

### 1. Variables d'Environnement

Assurez-vous que votre fichier `.env` contient :

```env
# Cloudinary
CLOUDINARY_CLOUD_NAME=duacvppbf
CLOUDINARY_API_KEY=926449142625133
CLOUDINARY_API_SECRET=UkkJ4yYEhEPQMvMe1Kzkf3tdGWk

# PostgreSQL
DATABASE_URL=your_database_url
```

### 2. Dépendances

Les packages nécessaires sont déjà installés :
- `cloudinary`
- `pg`
- `dotenv`

---

## 🚀 Utilisation

### Lancer la Migration

```bash
cd backend
node scripts/migrate-documents-to-cloudinary.js
```

---

## 📊 Ce que fait le Script

1. **Connexion à la base de données**
   - Récupère tous les documents sans `cloudinary_url`

2. **Pour chaque document**:
   - Vérifie si le fichier existe localement
   - Upload le fichier vers Cloudinary
   - Met à jour la base de données avec l'URL Cloudinary
   - Ajoute le `cloudinary_public_id`

3. **Affiche les statistiques**:
   - Nombre total de documents
   - Nombre de succès
   - Nombre d'échecs
   - Liste des erreurs

---

## 📝 Exemple de Sortie

```
🚀 Démarrage de la migration des documents vers Cloudinary...

✅ Configuration Cloudinary OK
   Cloud Name: duacvppbf
✅ Connexion PostgreSQL OK

📊 3 documents à migrer

📄 Document #1 - photo_bedroom.jpg
   Type: carnet_medical
   Chemin: /uploads/enrollments/photo_bedroom.jpg
   ⬆️  Upload vers Cloudinary...
   ✅ Upload réussi: https://res.cloudinary.com/duacvppbf/...
   💾 Mise à jour de la base de données...
   ✅ Base de données mise à jour

📄 Document #2 - photo_salle1.jpg
   Type: acte_naissance
   Chemin: /uploads/enrollments/photo_salle1.jpg
   ⬆️  Upload vers Cloudinary...
   ✅ Upload réussi: https://res.cloudinary.com/duacvppbf/...
   💾 Mise à jour de la base de données...
   ✅ Base de données mise à jour

📄 Document #3 - photo_bathroom.jpg
   Type: certificat_medical
   Chemin: /uploads/enrollments/photo_bathroom.jpg
   ⬆️  Upload vers Cloudinary...
   ✅ Upload réussi: https://res.cloudinary.com/duacvppbf/...
   💾 Mise à jour de la base de données...
   ✅ Base de données mise à jour


============================================================
📊 STATISTIQUES DE MIGRATION
============================================================
Total de documents:     3
✅ Migrés avec succès:  3
❌ Échecs:              0
⚠️  Ignorés:             0
============================================================
```

---

## ⚠️ Gestion des Erreurs

### Fichier Non Trouvé

Si un document est dans la base de données mais le fichier n'existe pas localement :

```
📄 Document #5 - missing_file.jpg
   ⚠️  Fichier non trouvé localement, passage au suivant
```

**Solution**: Le document est ignoré. Vous devrez le ré-uploader manuellement.

### Erreur Upload Cloudinary

Si l'upload vers Cloudinary échoue :

```
📄 Document #6 - large_file.pdf
   ❌ Échec de l'upload: File size too large
```

**Solution**: Vérifier la taille du fichier ou les limites de votre compte Cloudinary.

### Erreur Base de Données

Si la mise à jour de la base de données échoue :

```
📄 Document #7 - document.jpg
   ✅ Upload réussi: https://...
   ❌ Échec de la mise à jour BDD: Connection timeout
```

**Solution**: Le fichier est sur Cloudinary mais pas dans la BDD. Relancer le script (il ne ré-uploadera pas les fichiers déjà migrés).

---

## 🔄 Relancer le Script

Le script est **idempotent** : vous pouvez le relancer plusieurs fois sans problème.

- Les documents déjà migrés (avec `cloudinary_url`) sont **ignorés**
- Seuls les documents sans URL Cloudinary sont traités

---

## 🧪 Test Avant Migration

Pour tester sans modifier la base de données, vous pouvez commenter la ligne de mise à jour :

```javascript
// const updateResult = await updateDatabase(doc.id, uploadResult.url, uploadResult.publicId);
```

---

## 📂 Structure des Fichiers

### Avant Migration

```
backend/
└── uploads/
    └── enrollments/
        ├── photo_bedroom.jpg
        ├── photo_salle1.jpg
        └── photo_bathroom.jpg
```

### Après Migration

Les fichiers restent localement, mais la base de données contient maintenant les URLs Cloudinary :

```sql
SELECT id, filename, cloudinary_url FROM enrollment_documents;

 id |      filename       |                cloudinary_url                
----+--------------------+---------------------------------------------
  1 | photo_bedroom.jpg  | https://res.cloudinary.com/duacvppbf/...
  2 | photo_salle1.jpg   | https://res.cloudinary.com/duacvppbf/...
  3 | photo_bathroom.jpg | https://res.cloudinary.com/duacvppbf/...
```

---

## 🗑️ Nettoyage Post-Migration (Optionnel)

Une fois la migration réussie et vérifiée, vous pouvez supprimer les fichiers locaux :

```bash
# ⚠️ ATTENTION : Assurez-vous que tous les fichiers sont bien sur Cloudinary !
rm -rf backend/uploads/enrollments/*
```

**Recommandation** : Gardez une sauvegarde des fichiers locaux pendant quelques jours avant de les supprimer.

---

## 🔍 Vérification Post-Migration

### 1. Vérifier dans la Base de Données

```sql
-- Compter les documents sans URL Cloudinary
SELECT COUNT(*) FROM enrollment_documents WHERE cloudinary_url IS NULL;
-- Devrait retourner 0

-- Voir tous les documents avec URL
SELECT id, filename, cloudinary_url FROM enrollment_documents;
```

### 2. Tester dans l'Application

1. Se connecter en tant qu'admin
2. Aller sur "Inscriptions"
3. Cliquer sur "Voir les documents" d'une inscription
4. Cliquer sur "Télécharger" un document
5. ✅ Le document devrait s'ouvrir depuis Cloudinary

---

## 📞 Support

### Erreurs Courantes

| Erreur | Cause | Solution |
|--------|-------|----------|
| `Configuration Cloudinary manquante` | Variables d'environnement non définies | Vérifier le fichier `.env` |
| `File not found` | Fichier supprimé ou déplacé | Ignorer ou ré-uploader manuellement |
| `File size too large` | Fichier trop volumineux | Vérifier les limites Cloudinary |
| `Connection timeout` | Problème réseau ou BDD | Relancer le script |

---

## ✅ Checklist

Avant de lancer la migration :

- [ ] Variables d'environnement Cloudinary configurées
- [ ] Connexion à la base de données fonctionnelle
- [ ] Fichiers locaux présents dans `uploads/enrollments/`
- [ ] Sauvegarde de la base de données effectuée (recommandé)

Après la migration :

- [ ] Vérifier les statistiques (0 échecs)
- [ ] Tester le téléchargement dans l'application
- [ ] Vérifier quelques URLs Cloudinary dans un navigateur
- [ ] (Optionnel) Supprimer les fichiers locaux après quelques jours

---

**Bonne migration ! 🚀**
