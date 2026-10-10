import api from './api.js'

const enrollmentsService = {
  // Obtenir toutes les inscriptions avec pagination et filtres
  getAllEnrollments: async (params = {}) => {
    try {
      const { page = 1, limit = 20, status = 'all' } = params
      const response = await api.get('/api/enrollments', {
        params: { page, limit, status }
      })
      return response.data
    } catch (error) {
      console.error('Erreur lors de la récupération des inscriptions:', error)
      throw error
    }
  },

  // Obtenir une inscription par ID
  getEnrollmentById: async (id) => {
    try {
      const response = await api.get(`/api/enrollments/${id}`)
      return response.data
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'inscription:', error)
      throw error
    }
  },

  // Obtenir les statistiques des inscriptions
  getEnrollmentStats: async () => {
    try {
      const response = await api.get('/api/enrollments/stats')
      return response.data
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error)
      throw error
    }
  },

  // Créer une nouvelle inscription (public)
  createEnrollment: async (enrollmentData, files = []) => {
    try {
      const formData = new FormData()

      // Ajouter les données de l'inscription
      Object.keys(enrollmentData).forEach(key => {
        if (enrollmentData[key] !== null && enrollmentData[key] !== undefined) {
          formData.append(key, enrollmentData[key])
        }
      })

      // Ajouter les fichiers
      files.forEach(file => {
        formData.append('documents', file)
      })

      const response = await api.post('/api/enrollments', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      return response.data
    } catch (error) {
      console.error('Erreur lors de la création de l\'inscription:', error)
      throw error
    }
  },

  // Approuver une inscription
  approveEnrollment: async (id, data = {}) => {
    try {
      const response = await api.post(`/api/enrollments/${id}/approve`, data)
      return response.data
    } catch (error) {
      console.error('Erreur lors de l\'approbation de l\'inscription:', error)
      throw error
    }
  },

  // Rejeter une inscription
  rejectEnrollment: async (id, data = {}) => {
    try {
      const response = await api.put(`/api/enrollments/${id}/reject`, data)
      return response.data
    } catch (error) {
      console.error('Erreur lors du rejet de l\'inscription:', error)
      throw error
    }
  },

  // Obtenir les documents d'une inscription
  getEnrollmentDocuments: async (id) => {
    try {
      const response = await api.get(`/api/enrollments/${id}/documents`)
      return response.data
    } catch (error) {
      console.error('Erreur lors de la récupération des documents:', error)
      throw error
    }
  },

  /**
   * [DEV ONLY] Finalise une inscription en un clic, sans attendre le RDV.
   * Enchaîne : approbation (si pending) → validation du RDV → création de l'enfant.
   * @param {Object} enrollment - L'inscription (avec id, status, applicant_email, active_appointment_id)
   */
  devFinalizeEnrollment: async (enrollment) => {
    try {
      let appointmentId = enrollment.active_appointment_id

      // Dossier "pending" : approuver d'abord (crée le compte parent + le RDV)
      if (!appointmentId && enrollment.status === 'pending') {
        const approval = await api.post(`/api/enrollments/${enrollment.id}/approve`, {
          appointment_date: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
          admin_comment: 'Approbation automatique (dev)'
        })
        appointmentId = approval.data?.enrollment?.active_appointment_id
      }

      // Fallback : récupérer le RDV lié via la route publique si l'ID n'est pas exposé
      if (!appointmentId && enrollment.applicant_email) {
        const lookup = await api.get(`/api/appointments/by-enrollment/${enrollment.id}`, {
          params: { email: enrollment.applicant_email }
        })
        appointmentId = lookup.data?.appointment?.id
      }

      if (!appointmentId) {
        throw new Error('Aucun rendez-vous lié à ce dossier')
      }

      // Valider le RDV → crée l'enfant et archive le dossier
      const response = await api.patch(`/api/appointments/${appointmentId}/complete`, {
        notes: 'Validé via bouton dev'
      })
      return response.data
    } catch (error) {
      console.error('Erreur finalisation dev:', error)
      throw error
    }
  }
}

export default enrollmentsService
