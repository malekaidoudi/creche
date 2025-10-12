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

  // Récupérer les documents d'un enfant
  getChildDocuments: async (childId) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simuler des documents pour l'enfant
        const documents = [
          {
            id: 1,
            name: 'Acte de naissance',
            type: 'acte_naissance',
            filename: 'acte_naissance.pdf',
            uploadDate: '2025-01-15',
            status: 'approved',
            size: '245 KB'
          },
          {
            id: 2,
            name: 'Carnet médical',
            type: 'carnet_medical',
            filename: 'carnet_medical.pdf',
            uploadDate: '2025-01-16',
            status: 'pending',
            size: '1.2 MB'
          },
          {
            id: 3,
            name: 'Certificat médical',
            type: 'certificat_medical',
            filename: 'certificat_medical.pdf',
            uploadDate: '2025-01-17',
            status: 'approved',
            size: '180 KB'
          }
        ];
        
        resolve({
          success: true,
          documents: documents
        });
      }, 500);
    });
  },

  // Voir un document (ouvre dans un nouvel onglet)
  viewDocument: (document) => {
    // Simuler l'ouverture du document
    const blob = new Blob(['Contenu simulé du document: ' + document.name], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    
    // Nettoyer l'URL après un délai
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    
    return Promise.resolve({ success: true, message: 'Document ouvert' });
  },

  // Télécharger un document
  downloadDocument: (document) => {
    // Simuler le téléchargement
    const blob = new Blob(['Contenu simulé du document: ' + document.name], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = document.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Nettoyer l'URL
    URL.revokeObjectURL(url);
    
    return Promise.resolve({ success: true, message: 'Document téléchargé' });
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
