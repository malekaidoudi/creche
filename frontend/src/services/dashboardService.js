import { childrenService } from './childrenService'
import { attendanceService } from './attendanceService'
import { enrollmentService } from './enrollmentService'

export const dashboardService = {
  // Obtenir les statistiques générales pour l'admin
  getAdminStats: async () => {
    try {
      const [childrenResponse, todayAttendanceResponse, enrollmentsResponse] = await Promise.all([
        childrenService.getAllChildren(),
        attendanceService.getTodayAttendance(),
        enrollmentService.getAllEnrollments()
      ])

      const totalChildren = childrenResponse.children?.length || 0
      const todayAttendance = todayAttendanceResponse.attendance?.length || 0
      const allEnrollments = enrollmentsResponse.enrollments || []
      const pendingEnrollments = allEnrollments.filter(e => e.status === 'pending').length
      const approvedEnrollments = allEnrollments.filter(e => e.status === 'approved').length

      return {
        totalChildren,
        todayAttendance,
        pendingEnrollments,
        approvedEnrollments,
        attendanceRate: totalChildren > 0 ? Math.round((todayAttendance / totalChildren) * 100) : 0
      }
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques admin:', error)
      throw error
    }
  },

  // Obtenir les statistiques pour le staff
  getStaffStats: async () => {
    try {
      const [childrenResponse, todayAttendanceResponse] = await Promise.all([
        childrenService.getAllChildren(),
        attendanceService.getTodayAttendance()
      ])

      const totalChildren = childrenResponse.children?.length || 0
      const todayAttendance = todayAttendanceResponse.attendance?.length || 0
      const absentToday = totalChildren - todayAttendance

      return {
        totalChildren,
        presentToday: todayAttendance,
        absentToday,
        attendanceRate: totalChildren > 0 ? Math.round((todayAttendance / totalChildren) * 100) : 0
      }
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques staff:', error)
      throw error
    }
  },

  // Obtenir les données pour un parent
  getParentData: async (parentId, parentEmail) => {
    try {
      // Récupérer tous les enfants et filtrer ceux du parent
      const childrenResponse = await childrenService.getAllChildren()
      const allChildren = childrenResponse.children || []
      
      // Filtrer les enfants du parent
      const myChildren = allChildren.filter(child => 
        child.parent_email === parentEmail || 
        child.parent_id === parentId ||
        child.guardian_email === parentEmail
      )

      if (myChildren.length === 0) {
        return {
          children: [],
          todayAttendance: [],
          weekAttendance: []
        }
      }

      // Récupérer les présences d'aujourd'hui
      const today = new Date().toISOString().split('T')[0]
      const todayAttendanceResponse = await attendanceService.getAttendanceByDate(today)
      const todayRecords = todayAttendanceResponse.attendance || []
      
      // Filtrer les présences pour ses enfants
      const myChildrenIds = myChildren.map(child => child.id)
      const myTodayAttendance = todayRecords.filter(record => 
        myChildrenIds.includes(record.child_id)
      )

      // Récupérer les présences de la semaine (7 derniers jours)
      const weekAttendance = []
      for (let i = 6; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        const dateStr = date.toISOString().split('T')[0]
        
        try {
          const dayAttendanceResponse = await attendanceService.getAttendanceByDate(dateStr)
          const dayRecords = dayAttendanceResponse.attendance || []
          const myDayAttendance = dayRecords.filter(record => 
            myChildrenIds.includes(record.child_id)
          )
          
          weekAttendance.push({
            date: dateStr,
            attendance: myDayAttendance,
            presentCount: myDayAttendance.length
          })
        } catch (error) {
          console.error(`Erreur pour la date ${dateStr}:`, error)
          weekAttendance.push({
            date: dateStr,
            attendance: [],
            presentCount: 0
          })
        }
      }

      return {
        children: myChildren,
        todayAttendance: myTodayAttendance,
        weekAttendance
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données parent:', error)
      throw error
    }
  }
}
