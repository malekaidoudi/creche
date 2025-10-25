const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// GET /api/user/has-children - Vérifier si l'utilisateur a des enfants
router.get('/has-children', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    
    let hasChildren = false;
    let childrenCount = 0;
    
    if (userRole === 'parent') {
      // Pour les parents : enfants où parent_id = user.id
      const [children] = await db.execute(
        'SELECT COUNT(*) as count FROM children WHERE parent_id = ?',
        [userId]
      );
      childrenCount = children[0].count;
      hasChildren = childrenCount > 0;
    } else if (userRole === 'staff' || userRole === 'admin') {
      // Pour staff/admin : vérifier s'ils ont des enfants en tant que parent
      const [ownChildren] = await db.execute(
        'SELECT COUNT(*) as count FROM children WHERE parent_id = ?',
        [userId]
      );
      
      childrenCount = ownChildren[0].count;
      hasChildren = childrenCount > 0;
    }
    
    res.json({
      success: true,
      hasChildren,
      childrenCount,
      userRole
    });
    
  } catch (error) {
    console.error('❌ Erreur vérification enfants:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
});

// GET /api/user/children-summary - Résumé des enfants pour Mon espace
router.get('/children-summary', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    
    let children = [];
    let enrollments = [];
    let recentAttendance = [];
    
    if (userRole === 'parent') {
      // Enfants du parent
      const [childrenRows] = await db.execute(`
        SELECT c.*, e.status as enrollment_status, e.enrollment_date
        FROM children c
        LEFT JOIN enrollments e ON c.id = e.child_id
        WHERE c.parent_id = ?
        ORDER BY c.birth_date DESC
      `, [userId]);
      children = childrenRows;
      
      // Inscriptions du parent
      const [enrollmentRows] = await db.execute(`
        SELECT e.*, c.first_name, c.last_name
        FROM enrollments e
        JOIN children c ON e.child_id = c.id
        WHERE e.parent_id = ?
        ORDER BY e.created_at DESC
      `, [userId]);
      enrollments = enrollmentRows;
      
    } else if (userRole === 'staff' || userRole === 'admin') {
      // Pour staff/admin, montrer seulement leurs enfants propres s'ils en ont
      const [childrenRows] = await db.execute(`
        SELECT c.*, e.status as enrollment_status, e.enrollment_date,
               'own' as relation_type
        FROM children c
        LEFT JOIN enrollments e ON c.id = e.child_id
        WHERE c.parent_id = ?
        ORDER BY c.birth_date DESC
      `, [userId]);
      children = childrenRows;
    }
    
    // Présences récentes pour tous les enfants
    if (children.length > 0) {
      const childIds = children.map(c => c.id);
      const placeholders = childIds.map(() => '?').join(',');
      
      const [attendanceRows] = await db.execute(`
        SELECT a.*, c.first_name, c.last_name
        FROM attendance a
        JOIN children c ON a.child_id = c.id
        WHERE a.child_id IN (${placeholders})
        ORDER BY a.date DESC, a.check_in_time DESC
        LIMIT 10
      `, childIds);
      recentAttendance = attendanceRows;
    }
    
    // Statistiques
    const stats = {
      totalChildren: children.length,
      approvedEnrollments: enrollments.filter(e => e.status === 'approved').length,
      pendingEnrollments: enrollments.filter(e => e.status === 'pending').length,
      rejectedEnrollments: enrollments.filter(e => e.status === 'rejected').length,
      presentToday: recentAttendance.filter(a => {
        const today = new Date().toISOString().split('T')[0];
        const attendanceDate = new Date(a.date).toISOString().split('T')[0];
        return attendanceDate === today && a.status === 'present';
      }).length
    };
    
    res.json({
      success: true,
      children,
      enrollments,
      recentAttendance,
      stats,
      userRole
    });
    
  } catch (error) {
    console.error('❌ Erreur résumé enfants:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
});

module.exports = router;
