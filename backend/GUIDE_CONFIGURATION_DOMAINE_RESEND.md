# 🌐 Guide de Configuration du Domaine Resend

## 📋 Situation Actuelle

- ✅ **Resend fonctionne** avec `onboarding@resend.dev`
- ⚠️  **Domaine `mima-elghalia.com` NON configuré** dans Resend
- 🎯 **Objectif** : Envoyer des emails depuis `inscription@mima-elghalia.com`

---

## 🚀 Étapes de Configuration

### 1️⃣ Ajouter le Domaine dans Resend

1. **Connectez-vous** à https://resend.com
2. Allez dans **Domains** : https://resend.com/domains
3. Cliquez sur **Add Domain**
4. Entrez : `mima-elghalia.com`
5. Cliquez sur **Add**

### 2️⃣ Configurer les Enregistrements DNS

Resend vous donnera **3 enregistrements DNS** à ajouter :

#### A. Enregistrement SPF (TXT)
```
Type: TXT
Nom: @ (ou mima-elghalia.com)
Valeur: v=spf1 include:_spf.resend.com ~all
```

#### B. Enregistrement DKIM (TXT)
```
Type: TXT
Nom: resend._domainkey
Valeur: [Fourni par Resend - copier exactement]
```

#### C. Enregistrement DMARC (TXT)
```
Type: TXT
Nom: _dmarc
Valeur: v=DMARC1; p=none; rua=mailto:dmarc@mima-elghalia.com
```

### 3️⃣ Ajouter les Enregistrements chez votre Hébergeur DNS

**Où ajouter ces enregistrements ?**
- Si vous utilisez **Cloudflare** : https://dash.cloudflare.com
- Si vous utilisez **OVH** : https://www.ovh.com/manager/
- Si vous utilisez **GoDaddy** : https://dcc.godaddy.com/
- Autre hébergeur : Consultez leur documentation DNS

**Comment ajouter ?**
1. Allez dans la section **DNS** de votre domaine
2. Cliquez sur **Ajouter un enregistrement**
3. Copiez-collez les valeurs fournies par Resend
4. Sauvegardez

### 4️⃣ Vérifier le Domaine

1. Retournez sur https://resend.com/domains
2. Cliquez sur **Verify** à côté de `mima-elghalia.com`
3. Attendez quelques minutes (la propagation DNS peut prendre jusqu'à 24h)
4. Le statut devrait passer à ✅ **Verified**

---

## 🧪 Test Après Vérification

Une fois le domaine vérifié :

### 1. Mettre à jour `.env`

```env
EMAIL_FROM=Crèche Mima Elghalia <inscription@mima-elghalia.com>
CONTACT_EMAIL=inscription@mima-elghalia.com
```

### 2. Redémarrer le serveur

```bash
npm start
```

### 3. Tester l'envoi

```bash
node scripts/test-resend-real.js
```

Entrez n'importe quelle adresse email (ex: `aidoudimalek@yahoo.com`)

---

## ⚡ Configuration Temporaire (En Attendant)

**Fichier** : `backend/.env`

```env
# Configuration temporaire avec domaine de test Resend
EMAIL_FROM=Crèche Mima Elghalia <onboarding@resend.dev>
CONTACT_EMAIL=aidoudimalek@yahoo.com
```

**Limitations** :
- ❌ Vous ne pouvez envoyer qu'à `aidoudimalek@yahoo.com`
- ❌ Les emails viennent de `@resend.dev` (pas professionnel)
- ✅ Fonctionne pour les tests

---

## 🔍 Vérifier la Configuration

```bash
node scripts/check-resend-config.js
```

Ce script affiche :
- ✅ Les domaines configurés
- ✅ Le statut de vérification
- ✅ La configuration EMAIL_FROM

---

## 📊 Statut Actuel

| Élément | Statut | Action |
|---------|--------|--------|
| Clé API Resend | ✅ Valide | Aucune |
| Domaine de test | ✅ Fonctionne | Temporaire |
| Domaine `mima-elghalia.com` | ❌ Non configuré | **À configurer** |
| Envoi d'emails | ⚠️ Limité | Après config domaine |

---

## 💡 Recommandations

1. **Configurez le domaine dès que possible** pour :
   - Envoyer à n'importe quelle adresse
   - Avoir des emails professionnels
   - Améliorer la délivrabilité

2. **En attendant**, utilisez `onboarding@resend.dev` pour :
   - Tester le système
   - Développer les fonctionnalités
   - Valider le flux d'emails

3. **Une fois configuré**, changez immédiatement dans `.env` :
   ```env
   EMAIL_FROM=Crèche Mima Elghalia <inscription@mima-elghalia.com>
   ```

---

## 🆘 Besoin d'Aide ?

- **Documentation Resend** : https://resend.com/docs/dashboard/domains/introduction
- **Support Resend** : https://resend.com/support
- **Vérifier DNS** : https://mxtoolbox.com/SuperTool.aspx

---

**Une fois le domaine vérifié, vous pourrez envoyer des emails professionnels depuis `inscription@mima-elghalia.com` ! 🚀**
