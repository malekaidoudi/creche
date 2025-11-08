# 📧 Système d'Envoi d'E-mails - Crèche Mima Elghalia

## 🎯 Vue d'ensemble

Système complet d'envoi d'e-mails transactionnels utilisant **Resend** avec templates HTML professionnels, logging en base de données PostgreSQL, et gestion automatique selon le workflow d'inscription.

---

## 📁 Structure du Projet

```
backend/
├── emails/
│   ├── templates/
│   │   ├── registration.html      # Confirmation d'inscription
│   │   ├── accepted.html          # Dossier accepté avec RDV
│   │   ├── missing-docs.html      # Documents manquants
│   │   ├── rejected.html          # Dossier rejeté
│   │   └── contact.html           # Message de contact
│   ├── emailService.js            # Service principal
│   └── emailTypes.js              # Configuration des types d'e-mails
├── database/
│   └── migrations/
│       ├── create_email_logs.sql
│       └── create_contact_messages.sql
└── scripts/
    ├── migrate-email-logs.js
    └── migrate-contact-messages.js
```

---

## 🔧 Configuration

### 1. Variables d'environnement

Ajouter dans le fichier `.env` :

```env
# Resend API
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# E-mails d'expédition
EMAIL_FROM=Crèche Mima Elghalia <noreply@mima-elghalia.com>
CONTACT_EMAIL=crechemimaelghalia@gmail.com

# Frontend URL (pour les liens)
FRONTEND_URL=https://malekaidoudi.github.io/creche
```

### 2. Configuration Resend

1. Créer un compte sur [resend.com](https://resend.com)
2. Ajouter et vérifier le domaine `mima-elghalia.com`
3. Créer une clé API
4. Configurer les adresses d'expédition :
   - `contact@mima-elghalia.com` → Messages généraux
   - `noreply@mima-elghalia.com` → Notifications automatiques
   - `inscription@mima-elghalia.com` → Suivi des inscriptions

### 3. Migrations de base de données

Exécuter les migrations pour créer les tables nécessaires :

```bash
# Table email_logs
node scripts/migrate-email-logs.js

# Table contact_messages
node scripts/migrate-contact-messages.js
```

---

## 📨 Types d'E-mails

### 1️⃣ Confirmation d'inscription

**Déclencheur :** Nouvelle demande d'inscription  
**Expéditeur :** `inscription@mima-elghalia.com`  
**Template :** `registration.html`

**Contenu :**
- Confirmation de réception
- Numéro de dossier
- Délai de traitement (48h)
- Prochaines étapes

**Utilisation :**
```javascript
await emailService.sendRegistrationConfirmation({
  id: enrollmentId,
  applicant_email: 'parent@example.com',
  applicant_first_name: 'Ahmed',
  child_first_name: 'Sara'
});
```

---

### 2️⃣ Dossier accepté

**Déclencheur :** Approbation par admin/staff  
**Expéditeur :** `inscription@mima-elghalia.com`  
**Template :** `accepted.html`

**Contenu :**
- Félicitations
- Date et heure du rendez-vous
- Documents à apporter
- Lien de création de mot de passe (valide 48h)
- Note sur activation du compte après RDV

**Utilisation :**
```javascript
await emailService.sendAcceptedEmail(
  enrollmentData,
  '2025-01-15T10:00:00',
  'https://site.com/create-password?token=xxx'
);
```

---

### 3️⃣ Documents manquants

**Déclencheur :** Rejet avec type `dossier_manquant`  
**Expéditeur :** `inscription@mima-elghalia.com`  
**Template :** `missing-docs.html`

**Contenu :**
- Liste des documents manquants
- Date de RDV (si fixé)
- **Option 1 :** Lien pour télécharger les documents en ligne
- **Option 2 :** Apporter les documents au RDV
- Note : Upload en ligne = nouvelle demande

**Utilisation :**
```javascript
await emailService.sendMissingDocsEmail(
  enrollmentData,
  ['Carnet de santé', 'Acte de naissance'],
  '2025-01-15T10:00:00', // optionnel
  'https://site.com/upload-documents?token=xxx'
);
```

---

### 4️⃣ Dossier rejeté

**Déclencheur :** Rejet définitif  
**Expéditeur :** `noreply@mima-elghalia.com`  
**Template :** `rejected.html`

**Contenu :**
- Message de rejet poli
- Raison du rejet (personnalisable)
- Facteurs possibles (capacité, critères, etc.)
- Invitation à contacter pour plus d'infos

**Utilisation :**
```javascript
await emailService.sendRejectionEmail(
  enrollmentData,
  'Places complètes pour cette tranche d\'âge'
);
```

---

### 5️⃣ Message de contact

**Déclencheur :** Formulaire de contact du site  
**Expéditeur :** `contact@mima-elghalia.com`  
**Template :** `contact.html`  
**Destinataire :** Équipe de la crèche

**Contenu :**
- Informations de l'expéditeur
- Sujet du message
- Contenu du message
- Bouton de réponse rapide
- Horodatage

**Utilisation :**
```javascript
await emailService.sendContactMessage({
  name: 'Ahmed Ben Ali',
  email: 'ahmed@example.com',
  phone: '+216 XX XXX XXX',
  subject: 'Question sur les horaires',
  message: 'Bonjour, je voudrais savoir...'
});
```

---

## 🔌 Intégration dans les Contrôleurs

### Contrôleur d'inscriptions

```javascript
const emailService = require('../emails/emailService');

// Nouvelle inscription
async createEnrollment(req, res) {
  // ... création du dossier ...
  
  await emailService.sendRegistrationConfirmation({
    id: enrollment.id,
    applicant_email,
    applicant_first_name,
    child_first_name
  }).catch(err => console.error('❌ Erreur envoi email:', err));
}

// Approbation
async approveEnrollment(req, res) {
  // ... mise à jour du dossier ...
  
  const passwordLink = `${frontendUrl}/create-password?token=${token}`;
  
  await emailService.sendAcceptedEmail(
    enrollment,
    appointment_date,
    passwordLink
  ).catch(err => console.error('❌ Erreur envoi email:', err));
}

// Rejet
async rejectEnrollment(req, res) {
  // ... mise à jour du dossier ...
  
  if (rejection_type === 'dossier_manquant') {
    const uploadLink = `${frontendUrl}/upload-documents?token=${token}`;
    
    await emailService.sendMissingDocsEmail(
      enrollment,
      missingDocs,
      appointment_date,
      uploadLink
    );
  } else {
    await emailService.sendRejectionEmail(
      enrollment,
      custom_reason
    );
  }
}
```

### Route de contact

```javascript
const emailService = require('../emails/emailService');

router.post('/api/contacts', async (req, res) => {
  const { name, email, phone, subject, message } = req.body;
  
  // Enregistrer en DB (optionnel)
  await db.query(`
    INSERT INTO contact_messages (name, email, phone, subject, message)
    VALUES ($1, $2, $3, $4, $5)
  `, [name, email, phone, subject, message]);
  
  // Envoyer l'e-mail
  const result = await emailService.sendContactMessage({
    name, email, phone, subject, message
  });
  
  res.json({ success: result.success });
});
```

---

## 🗄️ Base de Données

### Table `email_logs`

Stocke l'historique de tous les e-mails envoyés.

**Colonnes :**
- `id` - Identifiant unique
- `email_type` - Type d'e-mail (registration_confirmation, enrollment_accepted, etc.)
- `recipient_email` - Destinataire
- `sender_email` - Expéditeur
- `subject` - Sujet
- `status` - Statut (pending, sent, failed, bounced)
- `resend_id` - ID Resend
- `error_message` - Message d'erreur (si échec)
- `metadata` - Données supplémentaires (JSON)
- `created_at` - Date de création
- `updated_at` - Date de mise à jour

**Requêtes utiles :**

```sql
-- E-mails envoyés aujourd'hui
SELECT * FROM email_logs 
WHERE DATE(created_at) = CURRENT_DATE
ORDER BY created_at DESC;

-- E-mails échoués
SELECT * FROM email_logs 
WHERE status = 'failed'
ORDER BY created_at DESC;

-- Statistiques par type
SELECT 
  email_type, 
  COUNT(*) as total,
  SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent,
  SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
FROM email_logs
GROUP BY email_type;
```

### Table `contact_messages`

Stocke les messages du formulaire de contact.

**Colonnes :**
- `id` - Identifiant unique
- `name` - Nom de l'expéditeur
- `email` - E-mail de l'expéditeur
- `phone` - Téléphone (optionnel)
- `subject` - Sujet
- `message` - Contenu
- `status` - Statut (new, read, responded)
- `responded_at` - Date de réponse
- `responded_by` - ID utilisateur qui a répondu
- `created_at` - Date de création

---

## 🎨 Personnalisation des Templates

Les templates utilisent un système de variables simple :

### Variables simples
```html
<p>Bonjour {{applicant_first_name}},</p>
```

### Conditions
```html
{{#if appointment_date}}
  <p>Votre rendez-vous : {{appointment_date}}</p>
{{/if}}
```

### Boucles
```html
<ul>
  {{#each missing_documents}}
    <li>{{this}}</li>
  {{/each}}
</ul>
```

### Ajouter un nouveau template

1. Créer le fichier HTML dans `/emails/templates/`
2. Ajouter le type dans `/emails/emailTypes.js` :

```javascript
NEW_EMAIL_TYPE: {
  type: 'new_email_type',
  from: 'noreply@mima-elghalia.com',
  template: 'new-template.html',
  subject: 'Sujet de l\'e-mail'
}
```

3. Ajouter une méthode dans `/emails/emailService.js` :

```javascript
async sendNewEmail(data) {
  return this.sendEmail('NEW_EMAIL_TYPE', data.email, {
    variable1: data.value1,
    variable2: data.value2
  });
}
```

---

## 🧪 Tests

### Test manuel avec curl

```bash
# Test formulaire de contact
curl -X POST http://localhost:3000/api/contacts \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "phone": "+216 XX XXX XXX",
    "subject": "Test",
    "message": "Ceci est un test"
  }'
```

### Test avec Postman

1. **POST** `/api/enrollments` - Créer une inscription
2. **POST** `/api/enrollments/:id/approve` - Tester l'e-mail d'approbation
3. **PUT** `/api/enrollments/:id/reject` - Tester les e-mails de rejet
4. **POST** `/api/contacts` - Tester le formulaire de contact

### Vérifier les logs

```javascript
// Dans le code
const logs = await db.query(`
  SELECT * FROM email_logs 
  WHERE recipient_email = $1 
  ORDER BY created_at DESC
`, ['test@example.com']);

console.log(logs.rows);
```

---

## 🚀 Déploiement sur Render

### 1. Variables d'environnement

Dans le dashboard Render, ajouter :

```
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=Crèche Mima Elghalia <noreply@mima-elghalia.com>
CONTACT_EMAIL=crechemimaelghalia@gmail.com
FRONTEND_URL=https://malekaidoudi.github.io/creche
```

### 2. Vérification DNS

S'assurer que le domaine `mima-elghalia.com` est configuré dans Resend avec les enregistrements DNS appropriés.

### 3. Test en production

Après déploiement, tester avec une vraie inscription pour vérifier :
- ✅ E-mail de confirmation reçu
- ✅ Logs enregistrés en base de données
- ✅ Templates affichés correctement
- ✅ Liens fonctionnels

---

## 🔍 Monitoring et Debugging

### Logs dans la console

Le service affiche des logs détaillés :

```
📧 Envoi email registration_confirmation vers parent@example.com...
✅ Email envoyé avec succès (ID: abc123)
```

En cas d'erreur :

```
❌ Erreur envoi email registration_confirmation: API Key invalide
```

### Dashboard Resend

Accéder au dashboard Resend pour :
- Voir les e-mails envoyés
- Statistiques de délivrabilité
- Taux d'ouverture
- Bounces et plaintes

### Requêtes de monitoring

```sql
-- E-mails des dernières 24h
SELECT 
  email_type,
  status,
  COUNT(*) as count
FROM email_logs
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY email_type, status;

-- Taux de succès
SELECT 
  ROUND(
    100.0 * SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) / COUNT(*),
    2
  ) as success_rate
FROM email_logs
WHERE created_at > NOW() - INTERVAL '7 days';
```

---

## 🛠️ Dépannage

### Problème : E-mails non reçus

**Vérifications :**
1. ✅ `RESEND_API_KEY` configurée correctement
2. ✅ Domaine vérifié dans Resend
3. ✅ Vérifier les spams
4. ✅ Consulter les logs dans `email_logs`
5. ✅ Vérifier le dashboard Resend

### Problème : Erreur "Template not found"

**Solution :**
```bash
# Vérifier que les templates existent
ls -la backend/emails/templates/

# Vérifier les permissions
chmod 644 backend/emails/templates/*.html
```

### Problème : Variables non remplacées

**Cause :** Nom de variable incorrect dans le template

**Solution :**
```javascript
// Vérifier que les noms correspondent
emailService.sendEmail('TYPE', email, {
  applicant_first_name: 'Ahmed'  // Doit correspondre à {{applicant_first_name}}
});
```

---

## 📊 Statistiques et Métriques

### Métriques importantes

- **Taux de délivrabilité** : % d'e-mails envoyés avec succès
- **Temps de traitement** : Délai entre création et envoi
- **Taux d'ouverture** : Via Resend dashboard
- **Taux de rebond** : E-mails invalides

### Requête de statistiques

```sql
SELECT 
  DATE(created_at) as date,
  email_type,
  COUNT(*) as total,
  SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent,
  SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
  ROUND(
    100.0 * SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) / COUNT(*),
    2
  ) as success_rate
FROM email_logs
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at), email_type
ORDER BY date DESC, email_type;
```

---

## 🔐 Sécurité

### Bonnes pratiques

1. ✅ Ne jamais exposer `RESEND_API_KEY`
2. ✅ Valider tous les e-mails avant envoi
3. ✅ Limiter le taux d'envoi (rate limiting)
4. ✅ Sanitiser les données utilisateur
5. ✅ Logger tous les envois
6. ✅ Utiliser HTTPS pour tous les liens

### Rate limiting

```javascript
// Exemple avec express-rate-limit
const rateLimit = require('express-rate-limit');

const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // 3 messages max
  message: 'Trop de messages envoyés, réessayez plus tard'
});

router.post('/api/contacts', contactLimiter, async (req, res) => {
  // ...
});
```

---

## 📚 Ressources

- [Documentation Resend](https://resend.com/docs)
- [API Reference Resend](https://resend.com/docs/api-reference)
- [Templates HTML Email](https://github.com/leemunroe/responsive-html-email-template)
- [Can I Email](https://www.caniemail.com/) - Compatibilité CSS

---

## ✅ Checklist de Mise en Production

- [ ] Clé API Resend configurée
- [ ] Domaine vérifié dans Resend
- [ ] Variables d'environnement configurées
- [ ] Migrations exécutées
- [ ] Templates testés
- [ ] Logs fonctionnels
- [ ] E-mails de test envoyés et reçus
- [ ] Liens dans les e-mails fonctionnels
- [ ] Rate limiting configuré
- [ ] Monitoring en place
- [ ] Documentation à jour

---

## 🆘 Support

Pour toute question ou problème :

1. Consulter les logs : `SELECT * FROM email_logs ORDER BY created_at DESC LIMIT 50`
2. Vérifier le dashboard Resend
3. Consulter cette documentation
4. Contacter l'équipe de développement

---

**Version :** 1.0.0  
**Dernière mise à jour :** 08/01/2025  
**Auteur :** Équipe Crèche Mima Elghalia
