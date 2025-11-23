# 🚀 Migration des Documents vers Cloudinary - Guide Rapide

## ⚡ Démarrage Rapide (2 minutes)

### 1. Vérifier la Configuration

Assurez-vous que votre `.env` contient :

```env
CLOUDINARY_CLOUD_NAME=duacvppbf
CLOUDINARY_API_KEY=926449142625133
CLOUDINARY_API_SECRET=UkkJ4yYEhEPQMvMe1Kzkf3tdGWk
```

### 2. Lancer la Migration

```bash
cd backend
npm run migrate:cloudinary
```

### 3. Vérifier le Résultat

Le script affichera :
- ✅ Nombre de documents migrés avec succès
- ❌ Nombre d'échecs (si applicable)
- 📊 Statistiques détaillées

---

## 📊 Exemple de Sortie

```
🚀 Démarrage de la migration des documents vers Cloudinary...

✅ Configuration Cloudinary OK
✅ Connexion PostgreSQL OK

📊 3 documents à migrer

📄 Document #1 - photo_bedroom.jpg
   ✅ Upload réussi
   ✅ Base de données mise à jour

📄 Document #2 - photo_salle1.jpg
   ✅ Upload réussi
   ✅ Base de données mise à jour

📄 Document #3 - photo_bathroom.jpg
   ✅ Upload réussi
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

## ✅ Après la Migration

### Tester dans l'Application

1. Se connecter en tant qu'admin
2. Aller sur **"Inscriptions"**
3. Cliquer sur **"Voir les documents"** d'une inscription
4. Cliquer sur **"Télécharger"** un document
5. ✅ Le document s'ouvre depuis Cloudinary !

---

## 🔄 Relancer si Nécessaire

Le script est **idempotent** : vous pouvez le relancer sans problème.
- Les documents déjà migrés sont ignorés
- Seuls les nouveaux documents sont traités

---

## 📚 Documentation Complète

Pour plus de détails, consultez :
- `backend/scripts/README_MIGRATION.md` - Guide complet
- `backend/scripts/migrate-documents-to-cloudinary.js` - Code source

---

## 🐛 Problèmes ?

### "Configuration Cloudinary manquante"
➡️ Vérifier le fichier `.env`

### "File not found"
➡️ Fichiers locaux supprimés, ignorer ou ré-uploader

### "Connection timeout"
➡️ Problème réseau, relancer le script

---

**C'est tout ! La migration est simple et rapide. 🎉**
