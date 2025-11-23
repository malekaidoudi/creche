# ⚡ Démarrage Rapide - Postman (5 minutes)

## 🎯 Objectif
Tester rapidement les API avec Postman

---

## 📥 Étape 1: Importer (1 min)

### Fichier à Importer
📁 `Creche_API.postman_collection.json`

### Comment ?
1. Ouvrir Postman
2. Glisser-déposer le fichier `Creche_API.postman_collection.json`
3. ✅ Collection importée !

---

## 🚀 Étape 2: Démarrer le Backend (30 sec)

```bash
cd backend
npm start
```

✅ Vérifier: http://localhost:3003

---

## 🔐 Étape 3: Se Connecter (1 min)

### Dans Postman
1. Ouvrir la collection **"Crèche Mima Elghalia API"**
2. Cliquer sur **Authentication** > **Login Admin**
3. Cliquer sur **"Send"**
4. ✅ Réponse 200 + Token sauvegardé automatiquement

---

## ✅ Étape 4: Tester les API (2 min)

### Tester Rapidement
1. **Children** > **Get All Children** → Send
2. **Events** > **Get All Events** → Send
3. **Tasks** > **Get My Tasks** → Send
4. **Notifications** > **Get Unread Notifications** → Send

### Résultat Attendu
✅ Toutes les requêtes retournent 200  
✅ Les données sont affichées  

---

## 🎓 Comptes de Test

### Admin (Accès Complet)
```
Email: crechemimaelghalia@gmail.com
Password: password
```

### Staff
```
Email: staff@mimaelghalia.tn
Password: password
```

### Parent
```
Email: parent1@example.com
Password: password
```

---

## 📊 Ce qui est Inclus

### 9 Catégories d'API
1. **Authentication** (4 requêtes)
   - Login Admin/Staff/Parent
   - Get Current User

2. **Children** (2 requêtes)
   - Get All Children
   - Get Child Summary

3. **Enrollments** (2 requêtes)
   - Get All Enrollments
   - Get Pending Enrollments

4. **Attendance** (1 requête)
   - Get Today Attendance

5. **Events** (1 requête)
   - Get All Events

6. **Tasks** (3 requêtes)
   - Get My Tasks
   - Get Today Tasks
   - Get Overdue Tasks (Admin)

7. **Appointments** (1 requête)
   - Get All Appointments

8. **Notifications** (2 requêtes)
   - Get All Notifications
   - Get Unread Notifications

9. **Settings** (2 requêtes)
   - Get Contact Info
   - Get Settings

**Total**: ~16 requêtes prêtes à tester

---

## 💡 Astuces

### Variables Automatiques
- `token` → Rempli automatiquement après login ✨
- `userId` → Rempli automatiquement après login ✨
- `baseUrl` → http://localhost:3003

### Changer de Rôle
1. Utiliser **Login Staff** ou **Login Parent**
2. Le token est mis à jour automatiquement
3. Retester les endpoints

### Vérifier le Token
1. Cliquer sur la collection
2. Onglet **"Variables"**
3. Voir `token` et `userId`

---

## 🐛 Problèmes ?

### "Could not get any response"
```bash
# Démarrer le backend
cd backend
npm start
```

### "401 Unauthorized"
```
Refaire le login pour obtenir un nouveau token
```

---

## 📖 Documentation Complète

Pour plus de détails :
- **Import détaillé**: `IMPORT_POSTMAN.md`
- **Tous les endpoints**: `POSTMAN_COLLECTION.md`
- **Guide complet**: `COMMENT_UTILISER.md`

---

## ✅ Checklist 5 Minutes

- [x] Postman ouvert
- [x] Collection importée
- [x] Backend démarré
- [x] Login Admin réussi
- [x] 4-5 requêtes testées
- [x] Tout fonctionne ! 🎉

---

**C'est tout ! Vous êtes prêt à tester ! 🚀**

Pour aller plus loin, consultez `IMPORT_POSTMAN.md`
