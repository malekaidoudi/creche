# 💾 Guide de Sauvegarde - Crèche Mima Elghalia

## 📋 Vue d'ensemble

Le système de backup protège vos données contre les pertes accidentelles. Il offre :
- **Backup automatique** quotidien à 2h du matin
- **Backup manuel** via commande ou API
- **Restauration** facile depuis n'importe quel backup
- **Nettoyage automatique** des anciens backups

---

## 🚀 Commandes rapides

### Créer un backup maintenant
```bash
npm run backup
```

### Lister les backups disponibles
```bash
npm run backup:list
```

### Restaurer depuis un backup
```bash
npm run backup:restore backup_2025-12-27_08-30-00.json
```

---

## 📁 Emplacement des backups

Les fichiers de backup sont stockés dans :
```
backend/backups/data/
```

Chaque backup est un fichier JSON contenant toutes les données des tables.

---

## 🔄 Backup automatique

Le serveur effectue automatiquement un backup :
- **Fréquence** : Tous les jours à 02:00 (heure de Tunis)
- **Rétention** : 30 derniers backups conservés
- **Format** : `backup_auto_YYYY-MM-DD_HH-MM-SS.json`

Le job démarre automatiquement avec le serveur.

---

## 🌐 API de Backup (Admin uniquement)

### Lister les backups
```http
GET /api/backup
Authorization: Bearer <token_admin>
```

### Créer un backup
```http
POST /api/backup
Authorization: Bearer <token_admin>
```

### Télécharger un backup
```http
GET /api/backup/download/:filename
Authorization: Bearer <token_admin>
```

### Supprimer un backup
```http
DELETE /api/backup/:filename
Authorization: Bearer <token_admin>
```

### Statut du système
```http
GET /api/backup/status
Authorization: Bearer <token_admin>
```

---

## 📊 Tables sauvegardées

| Table | Description |
|-------|-------------|
| `users` | Comptes utilisateurs |
| `children` | Informations enfants |
| `enrollments` | Inscriptions |
| `attendance` | Présences |
| `holidays` | Jours fériés |
| `holiday_policies` | Politiques jours fériés |
| `nursery_settings` | Paramètres crèche |
| `notifications` | Notifications |
| `events` | Événements |
| `tasks` | Tâches |
| `announcements` | Annonces |
| `appointments` | Rendez-vous |
| `activities` | Activités |
| `activity_logs` | Journal d'activité |

---

## 🔧 Restauration manuelle

### 1. Lister les backups disponibles
```bash
npm run backup:list
```

### 2. Choisir le backup à restaurer
Notez le nom du fichier (ex: `backup_2025-12-27_08-30-00.json`)

### 3. Restaurer
```bash
node backend/scripts/backup.js --restore backup_2025-12-27_08-30-00.json
```

⚠️ **ATTENTION** : La restauration **remplace** toutes les données existantes !

---

## 🛡️ Bonnes pratiques

### Avant une mise à jour majeure
```bash
npm run backup
```

### Avant de modifier la base de données
```bash
npm run backup
```

### Télécharger régulièrement les backups
Utilisez l'API ou copiez les fichiers depuis `backend/backups/data/`

### Stocker les backups hors site
- Google Drive
- Dropbox
- Serveur externe

---

## 🆘 Récupération d'Urgence (Sans connexion admin)

### Accès à la page de récupération

Si vous ne pouvez plus vous connecter à l'application (base de données inaccessible, compte admin perdu, etc.), utilisez la **page de récupération d'urgence** :

```
https://votre-site.com/recovery?key=VOTRE_CLE_DE_RECUPERATION
```

### Où trouver la clé de récupération ?

La clé se trouve dans le fichier `.env` du serveur :
```
RECOVERY_KEY=6711f119f2b2f1f8f9759cebde41fcddc0db730e9b66ceacb58b046682fe85a0
```

⚠️ **IMPORTANT** : Notez cette clé dans un endroit sûr (gestionnaire de mots de passe, coffre-fort, etc.)

### Fonctionnalités de la page de récupération

| Fonction | Description |
|----------|-------------|
| **Vérifier l'état de la DB** | Voir si la base de données est accessible |
| **Lister les backups** | Voir tous les backups disponibles |
| **Télécharger un backup** | Sauvegarder un backup sur votre ordinateur |
| **Restaurer** | Remettre le système à un état précédent |

### API de récupération (sans token JWT)

```http
# Vérifier la clé
GET /api/recovery/verify?key=VOTRE_CLE

# Lister les backups
GET /api/recovery/backups?key=VOTRE_CLE

# État du système
GET /api/recovery/status?key=VOTRE_CLE

# Restaurer un backup
POST /api/recovery/restore/:filename?key=VOTRE_CLE

# Télécharger un backup
GET /api/recovery/download/:filename?key=VOTRE_CLE
```

### Sécurité

- **Rate limiting** : 5 tentatives par heure maximum
- **Clé unique** : 64 caractères hexadécimaux
- **Pas de stockage** : La clé n'est jamais stockée en base de données

---

## 🆘 En cas de problème

### Les données ont disparu ?

1. **Vérifier les backups locaux**
   ```bash
   npm run backup:list
   ```

2. **Restaurer le dernier backup**
   ```bash
   npm run backup:restore <fichier_backup>
   ```

3. **Utiliser Neon Point-in-Time Recovery**
   - Aller sur https://console.neon.tech
   - Sélectionner le projet
   - Branches → Create branch from history
   - Choisir une date avant la perte

### Le backup échoue ?

1. Vérifier la connexion à la base de données
2. Vérifier l'espace disque disponible
3. Consulter les logs du serveur

---

## 📝 Structure d'un fichier backup

```json
{
  "metadata": {
    "created_at": "2025-12-27T08:30:00.000Z",
    "database": "mima_elghalia_db",
    "version": "1.0.0"
  },
  "tables": {
    "users": [...],
    "children": [...],
    "enrollments": [...],
    ...
  }
}
```

---

## ⚙️ Configuration

### Modifier la fréquence des backups auto

Éditer `backend/jobs/backupJob.js` :
```javascript
// Backup tous les jours à 2h du matin
cron.schedule('0 2 * * *', ...)

// Exemples :
// '0 */6 * * *'  = Toutes les 6 heures
// '0 2,14 * * *' = À 2h et 14h
// '0 2 * * 1'    = Tous les lundis à 2h
```

### Modifier le nombre de backups conservés

Éditer `backend/jobs/backupJob.js` :
```javascript
cleanOldBackups(30); // Garder les 30 derniers
```

---

## 📞 Support

En cas de problème critique de données :
1. **Ne pas paniquer**
2. Vérifier les backups locaux
3. Utiliser Neon PITR si nécessaire
4. Contacter le support technique

---

*Dernière mise à jour : Décembre 2025*
