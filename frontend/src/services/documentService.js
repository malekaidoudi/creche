// Service pour la gestion des documents
export const documentService = {
  // Types de documents
  documentTypes: {
    CARNET_MEDICAL: 'carnet_medical',
    ACTE_NAISSANCE: 'acte_naissance', 
    CERTIFICAT_MEDICAL: 'certificat_medical'
  },

  // Simuler l'upload d'un document
  uploadDocument: async (file, documentType, childId) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log(`Document ${documentType} uploadé pour l'enfant ${childId}:`, file.name)
        resolve({
          success: true,
          documentId: Date.now(),
          filename: file.name,
          type: documentType
        })
      }, 1000)
    })
  },

  // Télécharger le règlement
  downloadReglement: () => {
    // Simuler le téléchargement du règlement
    const link = document.createElement('a')
    link.href = '/documents/reglement-interieur.pdf' // URL fictive
    link.download = 'reglement-interieur-mima-elghalia.pdf'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  },

  // Valider un fichier
  validateFile: (file) => {
    const maxSize = 5 * 1024 * 1024 // 5MB
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']

    if (!file) {
      return { valid: false, error: 'Aucun fichier sélectionné' }
    }

    if (file.size > maxSize) {
      return { valid: false, error: 'Fichier trop volumineux (max 5MB)' }
    }

    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'Type de fichier non supporté (PDF, JPG, PNG uniquement)' }
    }

    return { valid: true }
  }
}
