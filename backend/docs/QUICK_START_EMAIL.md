# 🚀 Guide Rapide - Système d'E-mails

## ⚡ Démarrage en 5 minutes

### 1. Configuration Resend (2 min)

1. Créer un compte sur [resend.com](https://resend.com)
2. Aller dans **API Keys** → Créer une nouvelle clé
3. Copier la clé (commence par `re_`)

### 2. Configuration des variables (1 min)

Ajouter dans `.env` :

```env
RESEND_API_KEY=re_votre_cle_api_ici
EMAIL_FROM=Crèche Mima Elghalia <noreply@mima-elghalia.com>
CONTACT_EMAIL=crechemimaelghalia@gmail.com
FRONTEND_URL=https://malekaidoudi.github.io/creche
```

### 3. Migrations de base de données (1 min)

```bash
# Créer les tables nécessaires
node scripts/migrate-email-logs.js
node scripts/migrate-contact-messages.js
```

### 4. Test du système (1 min)

```bash
# Remplacer par votre e-mail
node scripts/test-email-system.js votre-email@example.com
```

Vous devriez recevoir 5 e-mails de test ! 📧

---

## 📝 Utilisation Basique

### Envoyer un e-mail de confirmation

```javascript
const emailService = require('./emails/emailService');

await emailService.sendRegistrationConfirmation({
  id: 123,
  applicant_email: 'parent@example.com',
  applicant_first_name: 'Ahmed',
  child_first_name: 'Sara'
});
```

### Envoyer un e-mail d'acceptation

```javascript
await emailService.sendAcceptedEmail(
  enrollmentData,
  '2025-01-15T10:00:00',
  'https://site.com/create-password?token=xxx'
);
```

### Envoyer un message de contact

```javascript
await emailService.sendContactMessage({
  name: 'Ahmed Ben Ali',
  email: 'ahmed@example.com',
  phone: '+216 XX XXX XXX',
  subject: 'Question',
  message: 'Bonjour, je voudrais savoir...'
});
```

---

## 🔍 Vérification

### Consulter les logs

```sql
SELECT * FROM email_logs 
ORDER BY created_at DESC 
LIMIT 10;
```

### Dashboard Resend

Aller sur [resend.com/emails](https://resend.com/emails) pour voir :
- E-mails envoyés
- Taux de délivrabilité
- Statistiques

---

## ⚠️ Problèmes Courants

### E-mails non reçus ?

1. ✅ Vérifier les spams
2. ✅ Vérifier `RESEND_API_KEY` dans `.env`
3. ✅ Consulter les logs : `SELECT * FROM email_logs WHERE status = 'failed'`
4. ✅ Vérifier le dashboard Resend

### Erreur "Domain not verified" ?

Le domaine `mima-elghalia.com` doit être vérifié dans Resend :
1. Aller sur [resend.com/domains](https://resend.com/domains)
2. Ajouter le domaine
3. Configurer les DNS (SPF, DKIM)
4. Attendre la vérification

**En attendant :** Utiliser `onboarding@resend.dev` comme expéditeur pour les tests.

---

## 📚 Documentation Complète

Pour plus de détails, consulter [EMAIL_SYSTEM.md](./EMAIL_SYSTEM.md)

---

## 🆘 Aide

- **Documentation Resend :** [resend.com/docs](https://resend.com/docs)
- **Support :** Consulter les logs en base de données
- **Tests :** `node scripts/test-email-system.js`

---

**C'est tout ! Vous êtes prêt à envoyer des e-mails ! 🎉**
