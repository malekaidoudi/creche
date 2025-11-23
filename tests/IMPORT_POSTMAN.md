# 📥 Comment Importer la Collection Postman

## 🎯 Fichier à Importer

**Fichier**: `Creche_API.postman_collection.json`  
**Emplacement**: `/Volumes/Works/Windsurf/creche-site/tests/`

---

## 📋 Étapes d'Import

### 1. Ouvrir Postman
- Télécharger depuis https://www.postman.com/downloads/ si pas installé
- Lancer l'application

### 2. Importer la Collection

#### Option A: Glisser-Déposer
1. Ouvrir Postman
2. Glisser le fichier `Creche_API.postman_collection.json` dans Postman
3. La collection apparaît dans la barre latérale

#### Option B: Menu Import
1. Cliquer sur **"Import"** en haut à gauche
2. Cliquer sur **"Upload Files"**
3. Sélectionner `Creche_API.postman_collection.json`
4. Cliquer sur **"Import"**

### 3. Vérifier l'Import
✅ Vous devriez voir "Crèche Mima Elghalia API" dans vos collections  
✅ Elle contient 9 dossiers (Authentication, Children, etc.)  
✅ Elle contient environ 15 requêtes

---

## ⚙️ Configuration des Variables

### Variables Incluses
La collection contient déjà ces variables :
- `baseUrl`: http://localhost:3003
- `token`: (vide, sera rempli automatiquement)
- `userId`: (vide, sera rempli automatiquement)
- `childId`: (à définir manuellement si besoin)
- `enrollmentId`: (à définir manuellement si besoin)

### Modifier les Variables (si nécessaire)
1. Cliquer sur la collection "Crèche Mima Elghalia API"
2. Aller dans l'onglet **"Variables"**
3. Modifier `baseUrl` si votre backend est sur un autre port
4. Sauvegarder

---

## 🚀 Utilisation

### 1. Tester l'Authentification

#### A. Login Admin
1. Ouvrir **Authentication** > **Login Admin**
2. Cliquer sur **"Send"**
3. Vérifier la réponse (status 200)
4. Le `token` est automatiquement sauvegardé dans les variables ✨

#### B. Vérifier le Token
1. Cliquer sur la collection
2. Onglet **"Variables"**
3. Voir que `token` et `userId` sont remplis

### 2. Tester les Autres Endpoints

Maintenant que vous êtes authentifié, testez :

#### Children
- **Get All Children** - Liste de tous les enfants
- **Get Child Summary** - Résumé des enfants de l'utilisateur

#### Enrollments
- **Get All Enrollments** - Toutes les inscriptions
- **Get Pending Enrollments** - Inscriptions en attente

#### Attendance
- **Get Today Attendance** - Présences du jour

#### Events
- **Get All Events** - Tous les événements

#### Tasks
- **Get All Tasks** - Toutes les tâches
- **Get My Tasks** - Mes tâches

#### Appointments
- **Get All Appointments** - Tous les rendez-vous

#### Notifications
- **Get All Notifications** - Toutes les notifications
- **Get Unread Notifications** - Notifications non lues

#### Settings
- **Get Contact Info** - Infos de contact (public)
- **Get Settings** - Paramètres (authentifié)

---

## 🔄 Tester avec Différents Rôles

### Admin
```
Email: crechemimaelghalia@gmail.com
Password: password
```
1. Utiliser **Login Admin**
2. Tester tous les endpoints

### Staff
```
Email: staff@mimaelghalia.tn
Password: password
```
1. Utiliser **Login Staff**
2. Tester les endpoints accessibles au staff

### Parent
```
Email: parent1@example.com
Password: password
```
1. Utiliser **Login Parent**
2. Tester les endpoints accessibles aux parents

---

## 💡 Astuces Postman

### 1. Organiser les Tests
- Créer un dossier "Tests Admin"
- Créer un dossier "Tests Staff"
- Créer un dossier "Tests Parent"
- Dupliquer les requêtes dans chaque dossier

### 2. Sauvegarder les Réponses
- Cliquer sur **"Save Response"** après chaque test
- Comparer les réponses entre les versions

### 3. Utiliser les Tests Automatiques
La requête "Login Admin" a déjà un test automatique qui :
- Vérifie le code 200
- Sauvegarde le token automatiquement
- Sauvegarde le userId automatiquement

### 4. Créer des Environnements
Pour tester sur différents serveurs :

1. Cliquer sur **"Environments"**
2. Créer "Local"
   ```
   baseUrl: http://localhost:3003
   ```
3. Créer "Production"
   ```
   baseUrl: https://votre-backend.com
   ```
4. Basculer entre les environnements

---

## 📊 Vérifier les Réponses

### Réponse Réussie (200)
```json
{
  "success": true,
  "data": {...}
}
```

### Réponse d'Erreur (400/401/500)
```json
{
  "success": false,
  "message": "Message d'erreur"
}
```

---

## 🐛 Problèmes Courants

### "Could not get any response"
❌ **Problème**: Le backend n'est pas démarré  
✅ **Solution**: 
```bash
cd backend
npm start
```

### "401 Unauthorized"
❌ **Problème**: Token expiré ou invalide  
✅ **Solution**: Refaire le login pour obtenir un nouveau token

### "404 Not Found"
❌ **Problème**: L'endpoint n'existe pas  
✅ **Solution**: Vérifier l'URL et la route dans le backend

### "500 Internal Server Error"
❌ **Problème**: Erreur côté serveur  
✅ **Solution**: Vérifier les logs du backend

---

## 📝 Ajouter Plus de Requêtes

### Créer une Nouvelle Requête

1. Cliquer droit sur un dossier (ex: "Children")
2. **"Add Request"**
3. Nommer la requête (ex: "Create Child")
4. Configurer:
   - **Method**: POST
   - **URL**: `{{baseUrl}}/api/children`
   - **Headers**: 
     - Authorization: `Bearer {{token}}`
     - Content-Type: `application/json`
   - **Body** (raw JSON):
     ```json
     {
       "first_name": "Test",
       "last_name": "Enfant",
       "date_of_birth": "2021-05-15",
       "gender": "M"
     }
     ```
5. **"Save"**
6. **"Send"** pour tester

---

## ✅ Checklist de Test

### Avant de Commencer
- [ ] Postman installé
- [ ] Collection importée
- [ ] Backend démarré (http://localhost:3003)
- [ ] Frontend démarré (http://localhost:5173)

### Tests de Base
- [ ] Login Admin réussi
- [ ] Token sauvegardé automatiquement
- [ ] Get Current User fonctionne
- [ ] Get All Children fonctionne
- [ ] Get All Events fonctionne

### Tests Avancés
- [ ] Login avec chaque rôle (Admin, Staff, Parent)
- [ ] Tester tous les GET endpoints
- [ ] Tester les POST/PUT/DELETE (à ajouter)
- [ ] Vérifier les codes de réponse
- [ ] Vérifier les données retournées

---

## 🎯 Prochaines Étapes

1. ✅ Importer la collection
2. ✅ Tester l'authentification
3. ✅ Tester tous les GET endpoints
4. 📝 Ajouter les POST/PUT/DELETE endpoints
5. 📝 Créer des tests automatiques
6. 📝 Documenter les résultats

---

## 📞 Besoin d'Aide ?

### Documentation Postman
- https://learning.postman.com/docs/getting-started/introduction/

### Vidéos Tutoriels
- https://www.youtube.com/c/postman

### Documentation API Complète
- Voir `POSTMAN_COLLECTION.md` pour tous les endpoints détaillés

---

**Bon test ! 🚀**
