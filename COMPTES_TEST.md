# 👥 COMPTES DE TEST

## 🔐 Identifiants de connexion

### Admin
```
Email: crechemimaelghalia@gmail.com
Password: password
Role: admin
```

### Staff
```
Email: staff@mimaelghalia.tn
Password: password
Role: staff
```

### Parents

#### Parent 1
```
Email: parent1@example.com
Password: password
Role: parent
Nom: Mohamed Trabelsi
```

#### Parent 2
```
Email: parent2@example.com
Password: password
Role: parent
Nom: Amira Gharbi
```

#### Parent 3
```
Email: parent3@example.com
Password: password
Role: parent
Nom: Karim Mansour
```

---

## 📝 Utilisation dans Postman

1. **Login Admin** → Token sauvegardé dans `{{admin_token}}`
2. **Login Staff** → Token sauvegardé dans `{{staff_token}}`
3. **Login Parent** → Token sauvegardé dans `{{parent_token}}`

Les tokens sont automatiquement utilisés dans les requêtes suivantes.

---

## 🎯 Permissions par rôle

### Admin
- ✅ Créer/modifier/supprimer tâches
- ✅ Voir toutes les tâches
- ✅ Envoyer rappels
- ✅ Créer/publier annonces
- ✅ Créer rendez-vous
- ✅ Voir tous les messages
- ✅ Gérer tout le système

### Staff
- ✅ Voir ses tâches
- ✅ Changer statut de ses tâches
- ✅ Envoyer messages à admin
- ✅ Créer mémos personnels

### Parent
- ✅ Voir annonces qui le concernent
- ✅ Voir ses rendez-vous
- ✅ Confirmer/replanifier rendez-vous
- ✅ Envoyer messages à admin/staff
- ✅ Voir statut messages (lus/non lus)

---

## 🔄 Changer les mots de passe

Pour changer les mots de passe en production :

```sql
-- Hasher le nouveau mot de passe avec bcrypt
-- Puis mettre à jour dans la base
UPDATE users 
SET password = 'nouveau_hash_bcrypt' 
WHERE email = 'email@example.com';
```

**Note:** Les mots de passe actuels sont hashés avec bcrypt (10 rounds).
