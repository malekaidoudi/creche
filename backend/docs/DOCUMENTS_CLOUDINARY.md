# 📄 Système de Gestion des Documents avec Cloudinary

## 🎯 Vue d'ensemble

Le système de gestion des documents d'inscription utilise **Cloudinary** pour le stockage cloud des fichiers (PDF, images). Cela garantit la persistance des fichiers même sur des environnements éphémères comme Render.

---

## ☁️ Cloudinary - Avantages

✅ **Stockage cloud permanent** (pas de perte de fichiers)  
✅ **URLs directes** pour visualisation/téléchargement  
✅ **Transformations automatiques** (redimensionnement, optimisation)  
✅ **CDN global** (chargement rapide partout)  
✅ **Gestion automatique** des types de fichiers (PDF, JPEG, PNG)  
✅ **Sécurité** (URLs signées disponibles si besoin)

---

## 🔧 Configuration

### Variables d'environnement requises

```env
CLOUDINARY_CLOUD_NAME=votre_cloud_name
CLOUDINARY_API_KEY=votre_api_key
CLOUDINARY_API_SECRET=votre_api_secret
```

### Vérifier la configuration

```javascript
const cloudinaryService = require('./services/cloudinaryService');

if (cloudinaryService.isConfigured()) {
  console.log('✅ Cloudinary configuré');
} else {
  console.log('❌ Cloudinary non configuré');
}
```

---

## 📤 Upload de Documents

### Processus d'upload

1. **Fichier reçu** via multipart/form-data
2. **Sauvegarde temporaire** locale (multer)
3. **Upload vers Cloudinary** (cloudinaryService)
4. **Enregistrement en DB** (URL Cloudinary + metadata)
5. **Suppression fichier local** (nettoyage)

### Exemple d'upload

```javascript
POST /api/enrollments/:id/documents
Content-Type: multipart/form-data

Fields:
- carnet_medical: File
- acte_naissance: File
- certificat_medical: File
```

### Réponse

```json
{
  "success": true,
  "message": "Documents téléchargés avec succès",
  "documents": [
    {
      "id": 123,
      "document_type": "carnet_medical",
      "original_filename": "carnet_sante.pdf",
      "cloudinary_url": "https://res.cloudinary.com/xxx/image/upload/v123/enrollments/doc.pdf"
    }
  ]
}
```

---

## 📥 Récupération des Documents

### 1️⃣ Liste des documents d'un dossier

```http
GET /api/enrollments/:id/documents
Authorization: Bearer <token>
```

**Réponse:**

```json
{
  "success": true,
  "count": 3,
  "documents": [
    {
      "id": 123,
      "type": "carnet_medical",
      "filename": "carnet_sante.pdf",
      "size": 245678,
      "mime_type": "application/pdf",
      "is_verified": false,
      "uploaded_at": "2025-01-08T19:30:00Z",
      
      "cloudinary_url": "https://res.cloudinary.com/xxx/raw/upload/v123/enrollments/doc.pdf",
      "cloudinary_public_id": "enrollments/enrollment_123_carnet_medical_1704739800",
      
      "view_url": "https://res.cloudinary.com/xxx/raw/upload/v123/enrollments/doc.pdf",
      "download_url": "https://res.cloudinary.com/xxx/raw/upload/fl_attachment/v123/enrollments/doc.pdf",
      "api_url": "/api/enrollments/456/documents/123"
    }
  ]
}
```

### 2️⃣ Détails d'un document spécifique

```http
GET /api/enrollments/:id/documents/:docId
Authorization: Bearer <token>
```

**Réponse:**

```json
{
  "success": true,
  "document": {
    "id": 123,
    "type": "carnet_medical",
    "filename": "carnet_sante.pdf",
    "url": "https://res.cloudinary.com/xxx/raw/upload/v123/enrollments/doc.pdf",
    "publicId": "enrollments/enrollment_123_carnet_medical_1704739800",
    "size": 245678,
    "mime_type": "application/pdf",
    "uploaded_at": "2025-01-08T19:30:00Z",
    "is_verified": false,
    
    "view_url": "https://res.cloudinary.com/xxx/raw/upload/v123/enrollments/doc.pdf",
    "download_url": "https://res.cloudinary.com/xxx/raw/upload/fl_attachment/v123/enrollments/doc.pdf"
  }
}
```

---

## 🖼️ Visualisation et Téléchargement

### URLs Cloudinary

Cloudinary génère 2 types d'URLs :

#### 1. **URL de visualisation** (`view_url`)
```
https://res.cloudinary.com/xxx/raw/upload/v123/enrollments/doc.pdf
```
- Ouvre le document **dans le navigateur**
- PDF affichés inline
- Images affichées directement

#### 2. **URL de téléchargement** (`download_url`)
```
https://res.cloudinary.com/xxx/raw/upload/fl_attachment/v123/enrollments/doc.pdf
```
- **Force le téléchargement** du fichier
- Utilise le flag `fl_attachment`
- Nom de fichier original préservé

### Utilisation dans le Frontend

```javascript
// Visualiser un document
const viewDocument = (doc) => {
  window.open(doc.view_url, '_blank');
};

// Télécharger un document
const downloadDocument = (doc) => {
  window.open(doc.download_url, '_blank');
  // ou
  const link = document.createElement('a');
  link.href = doc.download_url;
  link.download = doc.filename;
  link.click();
};

// Afficher une image
<img src={doc.cloudinary_url} alt={doc.filename} />

// Afficher un PDF dans un iframe
<iframe src={doc.view_url} width="100%" height="600px" />
```

---

## 🔄 Transformations Cloudinary

Cloudinary permet des transformations d'URL pour optimiser les fichiers :

### Images

```javascript
// Redimensionner
https://res.cloudinary.com/xxx/image/upload/w_500,h_500,c_fit/v123/doc.jpg

// Miniature
https://res.cloudinary.com/xxx/image/upload/w_150,h_150,c_thumb/v123/doc.jpg

// Optimisation automatique
https://res.cloudinary.com/xxx/image/upload/q_auto,f_auto/v123/doc.jpg
```

### PDF

```javascript
// Première page en image
https://res.cloudinary.com/xxx/image/upload/pg_1/v123/doc.pdf

// Miniature de la première page
https://res.cloudinary.com/xxx/image/upload/w_200,h_300,c_fit,pg_1/v123/doc.pdf
```

---

## 🗑️ Suppression de Documents

### Supprimer de Cloudinary

```javascript
const cloudinaryService = require('./services/cloudinaryService');

// Supprimer un fichier
const result = await cloudinaryService.deleteFile(publicId);

if (result.success) {
  console.log('✅ Fichier supprimé de Cloudinary');
  // Supprimer aussi de la base de données
  await db.query('DELETE FROM enrollment_documents WHERE id = $1', [docId]);
}
```

### Route de suppression (à implémenter)

```http
DELETE /api/enrollments/:id/documents/:docId
Authorization: Bearer <token>
```

---

## 📊 Structure de la Table `enrollment_documents`

```sql
CREATE TABLE enrollment_documents (
  id SERIAL PRIMARY KEY,
  enrollment_id INTEGER REFERENCES enrollments(id),
  document_type VARCHAR(50) NOT NULL,
  filename VARCHAR(255) NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  file_path TEXT,
  file_size INTEGER,
  mime_type VARCHAR(100),
  
  -- Cloudinary
  cloudinary_url TEXT,
  cloudinary_public_id TEXT,
  
  is_verified BOOLEAN DEFAULT FALSE,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Colonnes importantes

- **`cloudinary_url`**: URL complète du fichier sur Cloudinary
- **`cloudinary_public_id`**: ID unique pour manipuler le fichier
- **`file_path`**: Chemin local (backup, généralement vide si Cloudinary)
- **`is_verified`**: Document vérifié par un admin

---

## 🔐 Sécurité

### URLs signées (optionnel)

Pour des documents sensibles, Cloudinary peut générer des URLs signées avec expiration :

```javascript
const cloudinary = require('cloudinary').v2;

const signedUrl = cloudinary.url(publicId, {
  sign_url: true,
  type: 'authenticated',
  expires_at: Math.floor(Date.now() / 1000) + 3600 // 1 heure
});
```

### Contrôle d'accès

- Routes protégées par authentification JWT
- Vérification du rôle (staff/admin uniquement)
- Vérification que le document appartient au dossier demandé

---

## 🧪 Tests

### Test d'upload

```bash
curl -X POST http://localhost:3000/api/enrollments/123/documents \
  -H "Authorization: Bearer <token>" \
  -F "carnet_medical=@/path/to/document.pdf"
```

### Test de récupération

```bash
# Liste des documents
curl http://localhost:3000/api/enrollments/123/documents \
  -H "Authorization: Bearer <token>"

# Document spécifique
curl http://localhost:3000/api/enrollments/123/documents/456 \
  -H "Authorization: Bearer <token>"
```

---

## 📝 Exemple Complet Frontend

```jsx
import React, { useState, useEffect } from 'react';

const DocumentsList = ({ enrollmentId }) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDocuments();
  }, [enrollmentId]);

  const fetchDocuments = async () => {
    try {
      const response = await fetch(
        `/api/enrollments/${enrollmentId}/documents`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      const data = await response.json();
      if (data.success) {
        setDocuments(data.documents);
      }
    } catch (error) {
      console.error('Erreur chargement documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const viewDocument = (doc) => {
    window.open(doc.view_url, '_blank');
  };

  const downloadDocument = (doc) => {
    const link = document.createElement('a');
    link.href = doc.download_url;
    link.download = doc.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return <div>Chargement...</div>;

  return (
    <div className="documents-list">
      <h3>Documents ({documents.length})</h3>
      {documents.map(doc => (
        <div key={doc.id} className="document-item">
          <div className="doc-info">
            <strong>{doc.filename}</strong>
            <span>{(doc.size / 1024).toFixed(2)} KB</span>
            {doc.is_verified && <span className="verified">✓ Vérifié</span>}
          </div>
          <div className="doc-actions">
            <button onClick={() => viewDocument(doc)}>
              👁️ Visualiser
            </button>
            <button onClick={() => downloadDocument(doc)}>
              ⬇️ Télécharger
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DocumentsList;
```

---

## 🚀 Déploiement

### Configuration Render

Dans le dashboard Render, ajouter les variables d'environnement :

```
CLOUDINARY_CLOUD_NAME=votre_cloud_name
CLOUDINARY_API_KEY=votre_api_key
CLOUDINARY_API_SECRET=votre_api_secret
```

### Vérification

```bash
# Vérifier que Cloudinary est configuré
curl http://votre-app.onrender.com/api/health

# Devrait retourner cloudinary_configured: true
```

---

## 📚 Ressources

- **Dashboard Cloudinary**: https://cloudinary.com/console
- **Documentation API**: https://cloudinary.com/documentation
- **Transformations**: https://cloudinary.com/documentation/image_transformations
- **Upload Widget**: https://cloudinary.com/documentation/upload_widget

---

## ✅ Checklist

- [ ] Variables Cloudinary configurées
- [ ] Service cloudinaryService.js testé
- [ ] Upload de documents fonctionnel
- [ ] URLs Cloudinary générées correctement
- [ ] Visualisation documents OK
- [ ] Téléchargement documents OK
- [ ] Frontend intégré
- [ ] Tests en production

---

**Version:** 1.0.0  
**Dernière mise à jour:** 08/01/2025  
**Système:** Cloudinary + PostgreSQL + Node.js
