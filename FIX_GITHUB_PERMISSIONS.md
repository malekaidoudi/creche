# 🔧 Fix Permissions GitHub Actions

## ❌ **Erreur Identifiée**
```
remote: Permission to malekaidoudi/creche.git denied to github-actions[bot].
fatal: unable to access 'https://github.com/malekaidoudi/creche.git/': The requested URL returned error: 403
```

## ✅ **Solutions à Appliquer**

### **Solution 1 : Permissions Repository (RECOMMANDÉE)**

1. **Aller sur GitHub** : https://github.com/malekaidoudi/creche
2. **Settings** → **Actions** → **General**
3. **Workflow permissions** → Sélectionner **"Read and write permissions"**
4. ✅ **Cocher** : "Allow GitHub Actions to create and approve pull requests"
5. **Save**

### **Solution 2 : Activer GitHub Pages**

1. **Settings** → **Pages**
2. **Source** → Sélectionner **"GitHub Actions"**
3. **Save**

### **Solution 3 : Vérifier la Branche**

1. **Settings** → **Pages**
2. Si "Deploy from branch" est sélectionné :
   - **Branch** → `gh-pages` 
   - **Folder** → `/ (root)`

## 🚀 **Méthode Alternative : Déploiement Manuel**

Si les permissions ne fonctionnent pas, utilisez le déploiement manuel :

```bash
cd frontend
npm run deploy
```

Cette commande utilise `gh-pages` qui utilise vos permissions personnelles.

## 🔄 **Relancer le Déploiement**

Après avoir fixé les permissions :

```bash
# Forcer un nouveau déploiement
git commit --allow-empty -m "🚀 Trigger GitHub Pages deployment"
git push origin version0-vitrine
```

## 📋 **Checklist de Vérification**

### **Permissions Repository**
- [ ] Read and write permissions activées
- [ ] Allow GitHub Actions to create PRs coché
- [ ] Settings sauvegardées

### **GitHub Pages Configuration**
- [ ] Source : GitHub Actions OU Deploy from branch
- [ ] Branch gh-pages sélectionnée (si deploy from branch)
- [ ] Configuration sauvegardée

### **Repository Settings**
- [ ] Repository public OU GitHub Pro/Team
- [ ] Actions activées dans le repository

## 🎯 **Résultat Attendu**

Après avoir appliqué ces corrections :
1. **GitHub Actions** pourra pousser vers `gh-pages`
2. **Déploiement automatique** fonctionnera
3. **Site accessible** sur https://malekaidoudi.github.io/creche-site/

## 🚨 **Si Problème Persiste**

### **Option A : Déploiement Manuel**
```bash
cd frontend
npm run build:github
npm run deploy
```

### **Option B : Personal Access Token**
1. **GitHub** → **Settings** → **Developer settings** → **Personal access tokens**
2. **Generate new token** avec permissions `repo`
3. **Repository Secrets** → Ajouter `PERSONAL_TOKEN`
4. **Modifier le workflow** pour utiliser ce token

## 🔧 **Workflow Alternatif avec Token**

Si nécessaire, je peux créer un workflow qui utilise un token personnel :

```yaml
- name: Deploy to GitHub Pages
  uses: peaceiris/actions-gh-pages@v3
  with:
    personal_token: ${{ secrets.PERSONAL_TOKEN }}
    publish_dir: ./frontend/dist
```

---

## 🎯 **Action Immédiate**

1. **Aller sur GitHub** → Repository Settings
2. **Activer les permissions** Read/Write pour Actions
3. **Configurer GitHub Pages** source
4. **Relancer le déploiement** ou utiliser le déploiement manuel

**Le problème sera résolu en 2 minutes !** ⚡
