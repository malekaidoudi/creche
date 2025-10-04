import { apiRequest, getPaginatedData } from './api'

export const attendanceService = {
  // Obtenir toutes les présences
  getAttendance: async (params = {}) => {
    return await getPaginatedData('/attendance', params)
  },

  // Obtenir les présences d'aujourd'hui
  getTodayAttendance: async () => {
    const response = await apiRequest.get('/attendance/today')
    return response.data
  },

  // Obtenir les présences par date
  getAttendanceByDate: async (date) => {
    const defaultParams = {
      page: 1,
      limit: 100
    }
    const response = await getPaginatedData(`/attendance/date/${date}`, defaultParams)
    return response
  },

  // Obtenir les présences d'un enfant
  getChildAttendance: async (childId, params = {}) => {
    return await getPaginatedData(`/attendance/child/${childId}`, params)
  },

  // Enregistrer l'arrivée d'un enfant
  checkIn: async (checkInData) => {
    const response = await apiRequest.post('/attendance/checkin', checkInData)
    return response.data
  },

  // Enregistrer le départ d'un enfant
  checkOut: async (checkOutData) => {
    const response = await apiRequest.post('/attendance/checkout', checkOutData)
    return response.data
  },
}
