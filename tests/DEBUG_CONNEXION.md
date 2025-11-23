# 🐛 Guide de Débogage - Connexion Test

## ✅ Corrections appliquées

### Problème:
Les boutons de connexion ne changent rien dans l'aperçu, l'utilisateur reste non connecté.

### Causes possibles:
1. ❌ Le listener ne reçoit pas les messages (origine bloquée)
2. ❌ L'iframe n'est pas chargée au moment du clic
3. ❌ Le rechargement ne se fait pas
4. ❌ Le localStorage n'est pas accessible

### Solutions appliquées:
1. ✅ Accepter tous les messages en développement (y compris `file://` et `null`)
2. ✅ Vérifier que l'iframe est chargée avant d'envoyer
3. ✅ Augmenter le délai de rechargement (100ms → 500ms)
4. ✅ Ajouter des logs de débogage détaillés

---

## 🔍 Comment déboguer

### 1. Ouvrir la console du navigateur

**Chrome/Edge:**
- Mac: `Cmd + Option + J`
- Windows: `Ctrl + Shift + J`

**Firefox:**
- Mac: `Cmd + Option + K`
- Windows: `Ctrl + Shift + K`

---

### 2. Rafraîchir l'application

```bash
# Si l'application ne tourne pas:
npm start

# Si elle tourne déjà:
# Ctrl+C puis npm start
```

---

### 3. Ouvrir l'interface de test

```bash
open tests/manual-responsive-test.html
```

---

### 4. Tester la connexion avec logs

#### Étape 1: Vérifier l'initialisation
Dans la console de l'iframe (pas la page parent), vous devriez voir:
```
🧪 Test Auth Listener: Initialisation...
✅ Test Auth Listener initialisé
```

**Si vous ne voyez pas ces logs:**
- L'application n'a pas chargé le listener
- Vérifiez que `frontend/src/main.jsx` importe bien le listener
- Redémarrez l'application

---

#### Étape 2: Cliquer sur un bouton de connexion
Dans la console de la page parent, vous devriez voir:
```
🔐 Connexion en tant que: admin {email: "...", role: "admin", ...}
📤 Envoi du message: {type: "SET_AUTH", token: "...", user: {...}}
✅ Statut mis à jour
🔄 Rechargement de l'iframe...
```

**Si vous ne voyez pas ces logs:**
- Le bouton ne fonctionne pas
- Vérifiez qu'il n'y a pas d'erreur JavaScript
- Rafraîchissez la page de test

---

#### Étape 3: Vérifier la réception du message
Dans la console de l'iframe, vous devriez voir:
```
📨 Message reçu: null {type: "SET_AUTH", token: "...", user: {...}}
✅ Message d'authentification valide: SET_AUTH
🔒 Test Auth: Utilisateur connecté {email: "...", role: "admin", ...}
```

**Si vous ne voyez pas ces logs:**
- Le message n'arrive pas à l'iframe
- Problème de postMessage
- Voir section "Problèmes courants" ci-dessous

---

#### Étape 4: Vérifier le localStorage
Dans la console de l'iframe, tapez:
```javascript
localStorage.getItem('token')
localStorage.getItem('user')
```

**Résultat attendu:**
```
"mock_token_admin"
"{"email":"crechemimaelghalia@gmail.com","role":"admin",...}"
```

**Si c'est null:**
- Le localStorage n'a pas été mis à jour
- Le message n'a pas été reçu ou traité

---

### 5. Vérifier l'authentification

Après rechargement, dans la console de l'iframe:
```javascript
// Vérifier le token
localStorage.getItem('token')

// Vérifier l'utilisateur
JSON.parse(localStorage.getItem('user'))
```

---

## 🚨 Problèmes courants

### Problème 1: "Iframe non chargée"
**Symptôme:** Alert "L'iframe n'est pas chargée"

**Solution:**
1. Attendre 2-3 secondes après l'ouverture de la page
2. Rafraîchir la page de test (F5)
3. Vérifier que l'application tourne sur `http://localhost:5173`

---

### Problème 2: Pas de logs dans l'iframe
**Symptôme:** Aucun log "Test Auth Listener" dans la console de l'iframe

**Solution:**
1. Vérifier que vous regardez la bonne console (celle de l'iframe, pas la page parent)
2. Redémarrer l'application:
   ```bash
   # Ctrl+C
   npm start
   ```
3. Vérifier que le fichier `frontend/src/main.jsx` contient:
   ```javascript
   import { initTestAuthListener } from './utils/testAuthListener.js'
   initTestAuthListener()
   ```

---

### Problème 3: Message non reçu
**Symptôme:** Logs d'envoi OK mais pas de réception

**Solution:**
1. Vérifier que l'iframe pointe bien vers `http://localhost:5173`
2. Attendre que l'iframe soit complètement chargée
3. Essayer d'augmenter le délai avant rechargement dans le HTML:
   ```javascript
   setTimeout(() => {
     iframe.src = iframe.src;
   }, 1000); // Au lieu de 500
   ```

---

### Problème 4: localStorage vide après rechargement
**Symptôme:** Token présent puis disparaît après rechargement

**Solution:**
1. Vérifier que le navigateur autorise le localStorage
2. Désactiver le mode navigation privée
3. Vérifier qu'il n'y a pas de code qui nettoie le localStorage au chargement

---

### Problème 5: L'utilisateur reste "Non connecté"
**Symptôme:** Token dans localStorage mais l'app ne reconnaît pas l'utilisateur

**Solution:**
1. Vérifier que le `AuthContext` lit bien le localStorage au démarrage
2. Vérifier le format du token et de l'utilisateur
3. Regarder les logs du `useAuth` hook

---

## 🔧 Tests manuels

### Test 1: Connexion Admin
```
1. Ouvrir la console (F12)
2. Cliquer sur "🔐 Admin"
3. Vérifier les logs:
   ✅ "Connexion en tant que: admin"
   ✅ "Envoi du message"
   ✅ "Message reçu"
   ✅ "Utilisateur connecté"
4. Attendre le rechargement
5. Dans la console de l'iframe:
   localStorage.getItem('token')
   // Doit retourner: "mock_token_admin"
```

---

### Test 2: Vérifier l'authentification
```
1. Se connecter en Admin
2. Aller sur /dashboard
3. Vérifier que la page s'affiche (pas de redirection)
4. Vérifier le nom d'utilisateur dans le header
```

---

### Test 3: Déconnexion
```
1. Se connecter en Admin
2. Cliquer sur "🔓 Déconnexion"
3. Vérifier les logs:
   ✅ "Utilisateur déconnecté"
4. Dans la console de l'iframe:
   localStorage.getItem('token')
   // Doit retourner: null
5. Aller sur /dashboard
6. Vérifier la redirection vers /
```

---

## 📊 Checklist de vérification

Avant de signaler un bug, vérifier:

- [ ] L'application tourne sur `http://localhost:5173`
- [ ] Le fichier `testAuthListener.js` existe
- [ ] Le listener est importé dans `main.jsx`
- [ ] La console ne montre pas d'erreurs JavaScript
- [ ] L'iframe est bien chargée (pas d'erreur 404)
- [ ] Le localStorage est autorisé dans le navigateur
- [ ] Vous regardez la bonne console (iframe vs parent)
- [ ] Vous avez attendu 2-3 secondes après l'ouverture

---

## 🆘 Si rien ne fonctionne

### Solution de secours: Connexion manuelle

1. Ouvrir `http://localhost:5173` dans un nouvel onglet
2. Ouvrir la console (F12)
3. Taper:
   ```javascript
   localStorage.setItem('token', 'mock_token_admin');
   localStorage.setItem('user', JSON.stringify({
     email: 'crechemimaelghalia@gmail.com',
     role: 'admin',
     first_name: 'Admin',
     last_name: 'Système',
     id: 1
   }));
   location.reload();
   ```
4. Vous êtes maintenant connecté en Admin

---

## 📝 Logs attendus (complet)

### Page parent (tests/manual-responsive-test.html):
```
🔐 Connexion en tant que: admin {email: "crechemimaelghalia@gmail.com", ...}
📤 Envoi du message: {type: "SET_AUTH", token: "mock_token_admin", user: {...}}
✅ Statut mis à jour
🔄 Rechargement de l'iframe...
```

### Iframe (http://localhost:5173):
```
🧪 Test Auth Listener: Initialisation...
✅ Test Auth Listener initialisé
📨 Message reçu: null {type: "SET_AUTH", token: "mock_token_admin", user: {...}}
✅ Message d'authentification valide: SET_AUTH
🔒 Test Auth: Utilisateur connecté {email: "crechemimaelghalia@gmail.com", ...}
[Rechargement de la page]
```

---

**Si vous voyez tous ces logs, la connexion fonctionne ! 🎉**
