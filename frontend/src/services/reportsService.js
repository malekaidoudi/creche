import api from './api.js'

const reportsService = {
  // Obtenir le rapport général
  getGeneralReport: async (params = {}) => {
    try {
      const response = await api.get('/reports/general', { params })
      return response.data
    } catch (error) {
      console.error('Erreur lors de la récupération du rapport général:', error)
      throw error
    }
  },

  // Obtenir le rapport de présences
  getAttendanceReport: async (params = {}) => {
    try {
      const response = await api.get('/reports/attendance', { params })
      return response.data
    } catch (error) {
      console.error('Erreur lors de la récupération du rapport de présences:', error)
      throw error
    }
  },

  // Obtenir le rapport des inscriptions
  getEnrollmentsReport: async (params = {}) => {
    try {
      const response = await api.get('/reports/enrollments', { params })
      return response.data
    } catch (error) {
      console.error('Erreur lors de la récupération du rapport des inscriptions:', error)
      throw error
    }
  },

  // Exporter en CSV
  exportToCSV: async (type, params = {}) => {
    try {
      const response = await api.get('/reports/export/csv', {
        params: { type, ...params },
        responseType: 'blob'
      })
      return response
    } catch (error) {
      console.error('Erreur lors de l\'export CSV:', error)
      throw error
    }
  },

  // Télécharger un export CSV
  downloadCSV: async (type, params = {}, filename = null) => {
    try {
      const response = await reportsService.exportToCSV(type, params)
      
      // Créer un lien de téléchargement
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      
      // Extraire le nom de fichier des headers ou utiliser celui fourni
      const contentDisposition = response.headers['content-disposition']
      let downloadFilename = filename
      
      if (!downloadFilename && contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/)
        if (filenameMatch) {
          downloadFilename = filenameMatch[1]
        }
      }
      
      if (!downloadFilename) {
        downloadFilename = `export_${type}_${new Date().toISOString().split('T')[0]}.csv`
      }
      
      link.setAttribute('download', downloadFilename)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      
      return true
    } catch (error) {
      console.error('Erreur lors du téléchargement CSV:', error)
      throw error
    }
  }
}

export default reportsService
