import { apiRequest } from './api'

export const documentService = {
  // Types de documents acceptés
  documentTypes: {
    CARNET_MEDICAL: 'carnet_medical',
    ACTE_NAISSANCE: 'acte_naissance', 
    CERTIFICAT_MEDICAL: 'certificat_medical'
  },

  // Extensions de fichiers acceptées
  allowedExtensions: ['pdf', 'jpg', 'jpeg', 'png'],

  // Taille maximale (5MB)
  maxFileSize: 5 * 1024 * 1024,

  // Valider un fichier
  validateFile: (file, documentType) => {
    const errors = []

    // Vérifier si le fichier existe
    if (!file) {
      errors.push('Aucun fichier sélectionné')
      return { isValid: false, errors }
    }

    // Vérifier la taille
    if (file.size > documentService.maxFileSize) {
      errors.push('Le fichier ne doit pas dépasser 5MB')
    }

    // Vérifier l'extension
    const extension = file.name.split('.').pop().toLowerCase()
    if (!documentService.allowedExtensions.includes(extension)) {
      errors.push('Format non supporté. Utilisez: PDF, JPG, PNG')
    }

    // Vérifications spécifiques par type de document
    switch (documentType) {
      case documentService.documentTypes.CARNET_MEDICAL:
        if (!file.name.toLowerCase().includes('carnet') && !file.name.toLowerCase().includes('medical')) {
          errors.push('Le nom du fichier devrait contenir "carnet" ou "medical"')
        }
        break
      case documentService.documentTypes.ACTE_NAISSANCE:
        if (!file.name.toLowerCase().includes('naissance') && !file.name.toLowerCase().includes('acte')) {
          errors.push('Le nom du fichier devrait contenir "naissance" ou "acte"')
        }
        break
      case documentService.documentTypes.CERTIFICAT_MEDICAL:
        if (!file.name.toLowerCase().includes('certificat') && !file.name.toLowerCase().includes('medical')) {
          errors.push('Le nom du fichier devrait contenir "certificat" ou "medical"')
        }
        break
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  },

  // Upload d'un document
  uploadDocument: async (file, documentType, childId = null) => {
    try {
      const formData = new FormData()
      formData.append('document', file)
      formData.append('documentType', documentType)
      if (childId) {
        formData.append('childId', childId)
      }

      const response = await apiRequest.post('/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      return response.data
    } catch (error) {
      console.error('Erreur upload document:', error)
      throw error
    }
  },

  // Télécharger le règlement intérieur
  downloadReglement: () => {
    try {
      const link = document.createElement('a')
      // Chemin corrigé pour Vite
      link.href = '/documents/reg-interne-mimaelghalia.pdf'
      link.download = 'reglement-interne-mimaelghalia.pdf'
      link.target = '_blank'
      link.rel = 'noopener noreferrer'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      console.log('📥 Téléchargement du règlement initié')
    } catch (error) {
      console.error('Erreur lors du téléchargement du règlement:', error)
      // Fallback: ouvrir dans un nouvel onglet
      window.open('/documents/reg-interne-mimaelghalia.pdf', '_blank')
    }
  },

  // Obtenir l'URL du règlement
  getReglementUrl: () => {
    return '/documents/reg-interne-mimaelghalia.pdf'
  },

  // Obtenir les documents d'un enfant
  getChildDocuments: async (childId) => {
    try {
      const response = await apiRequest.get(`/documents/child/${childId}`)
      return response.data
    } catch (error) {
      console.error('Erreur récupération documents:', error)
      throw error
    }
  },

  // Supprimer un document
  deleteDocument: async (documentId) => {
    try {
      const response = await apiRequest.delete(`/documents/${documentId}`)
      return response.data
    } catch (error) {
      console.error('Erreur suppression document:', error)
      throw error
    }
  }
}
