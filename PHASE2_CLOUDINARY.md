# Phase 2 : Intégration Cloudinary pour Upload d'Images

## 🎯 Objectif
Préparer l'upload d'images via Cloudinary pour l'hébergement futur du site.

## 📋 Étapes d'Implémentation

### 1. Configuration Cloudinary
```bash
# Installer le SDK Cloudinary
npm install cloudinary-react

# Variables d'environnement à ajouter
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=your_upload_preset
```

### 2. Créer le Service Cloudinary
```javascript
// src/services/cloudinaryService.js
import { Cloudinary } from 'cloudinary-react';

const cloudinary = new Cloudinary({
  cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
});

export const uploadToCloudinary = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);
  
  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
    {
      method: 'POST',
      body: formData
    }
  );
  
  return response.json();
};
```

### 3. Modifier handleImageUpload
```javascript
// Dans SettingsPageSimple.jsx
const handleImageUpload = async (key, file) => {
  if (!file) return;
  
  try {
    // Upload vers Cloudinary
    const result = await uploadToCloudinary(file);
    
    if (result.secure_url) {
      // Mettre à jour avec l'URL Cloudinary
      handleFieldChange(key, result.secure_url);
      toast.success('Image uploadée avec succès');
    }
  } catch (error) {
    toast.error('Erreur lors de l\'upload');
  }
};
```

### 4. Avantages Cloudinary
- ✅ **Gratuit** : 25 crédits/mois
- ✅ **CDN** : Livraison rapide mondiale
- ✅ **Optimisation** : Compression automatique
- ✅ **Responsive** : Redimensionnement automatique
- ✅ **Sécurité** : Upload sécurisé
- ✅ **Compatible** : Fonctionne partout

### 5. Configuration Cloudinary (À faire)
1. Créer un compte sur cloudinary.com
2. Obtenir le Cloud Name
3. Créer un Upload Preset (unsigned)
4. Configurer les variables d'environnement

## 🚀 Déploiement Futur
Cette solution sera prête pour :
- Vercel
- Netlify  
- VPS/Serveur dédié
- Tout hébergement web

## 📞 Prochaines Étapes
Quand vous serez prêt pour l'hébergement :
1. Configurer Cloudinary
2. Activer l'upload
3. Tester en production
4. Déployer sur le serveur final
