const { query } = require('../config/database');

class Attendance {
  constructor(data) {
    this.id = data.id;
    this.child_id = data.child_id;
    this.date = data.date;
    this.check_in_time = data.check_in_time;
    this.check_out_time = data.check_out_time;
    this.notes = data.notes;
    this.created_by = data.created_by;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  // Créer une nouvelle présence (check-in)
  static async checkIn(childId, createdBy, notes = null) {
    const today = new Date().toISOString().split('T')[0];
    
    // Vérifier s'il y a déjà un check-in aujourd'hui
    const existing = await this.findByChildAndDate(childId, today);
    if (existing && existing.check_in_time) {
      throw new Error('L\'enfant est déjà arrivé aujourd\'hui');
    }

    const now = new Date().toTimeString().split(' ')[0];
    
    const sql = `
      INSERT INTO attendance (child_id, date, check_in_time, notes, created_by)
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
      check_in_time = VALUES(check_in_time),
      notes = VALUES(notes),
      created_by = VALUES(created_by),
      updated_at = CURRENT_TIMESTAMP
    `;
    
    const result = await query(sql, [childId, today, now, notes, createdBy]);
    
    // Récupérer l'enregistrement créé/mis à jour
    return await this.findByChildAndDate(childId, today);
  }

  // Check-out d'un enfant
  static async checkOut(childId, createdBy, notes = null) {
    const today = new Date().toISOString().split('T')[0];
    
    // Vérifier s'il y a un check-in aujourd'hui
    const existing = await this.findByChildAndDate(childId, today);
    if (!existing || !existing.check_in_time) {
      throw new Error('L\'enfant n\'est pas encore arrivé aujourd\'hui');
    }
    
    if (existing.check_out_time) {
      throw new Error('L\'enfant est déjà parti aujourd\'hui');
    }

    const now = new Date().toTimeString().split(' ')[0];
    
    const sql = `
      UPDATE attendance 
      SET check_out_time = ?, notes = CONCAT(IFNULL(notes, ''), CASE WHEN notes IS NOT NULL THEN ' | ' ELSE '' END, ?), updated_at = CURRENT_TIMESTAMP
      WHERE child_id = ? AND date = ?
    `;
    
    await query(sql, [now, notes || 'Départ', childId, today]);
    
    return await this.findByChildAndDate(childId, today);
  }

  // Trouver la présence d'un enfant pour une date donnée
  static async findByChildAndDate(childId, date) {
    const sql = `
      SELECT 
        a.*,
        c.first_name as child_first_name,
        c.last_name as child_last_name,
        u.first_name as created_by_name,
        u.last_name as created_by_lastname
      FROM attendance a
      JOIN children c ON a.child_id = c.id
      LEFT JOIN users u ON a.created_by = u.id
      WHERE a.child_id = ? AND a.date = ?
    `;
    
    const results = await query(sql, [childId, date]);
    
    if (results.length === 0) {
      return null;
    }
    
    return new Attendance(results[0]);
  }

  // Obtenir les présences par date avec pagination
  static async findByDate(date, page = 1, limit = 50) {
    let pageNum = Math.max(1, parseInt(page) || 1);
    let limitNum = Math.max(1, Math.min(100, parseInt(limit) || 50));
    const offset = (pageNum - 1) * limitNum;
    
    const sql = `
      SELECT 
        a.*,
        c.first_name as child_first_name,
        c.last_name as child_last_name,
        c.birth_date,
        u.first_name as created_by_name,
        u.last_name as created_by_lastname
      FROM attendance a
      JOIN children c ON a.child_id = c.id
      LEFT JOIN users u ON a.created_by = u.id
      WHERE a.date = ?
      ORDER BY a.check_in_time DESC
      LIMIT ${limitNum} OFFSET ${offset}
    `;
    
    const results = await query(sql, [date]);
    
    // Compter le total
    const countSql = 'SELECT COUNT(*) as total FROM attendance WHERE date = ?';
    const countResult = await query(countSql, [date]);
    const total = countResult[0].total;

    return {
      attendances: results.map(attendance => new Attendance(attendance)),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    };
  }

  // Obtenir les présences d'un enfant avec pagination
  static async findByChildId(childId, page = 1, limit = 30) {
    let pageNum = Math.max(1, parseInt(page) || 1);
    let limitNum = Math.max(1, Math.min(100, parseInt(limit) || 30));
    const offset = (pageNum - 1) * limitNum;
    
    const sql = `
      SELECT 
        a.*,
        c.first_name as child_first_name,
        c.last_name as child_last_name
      FROM attendance a
      JOIN children c ON a.child_id = c.id
      WHERE a.child_id = ?
      ORDER BY a.date DESC, a.check_in_time DESC
      LIMIT ${limitNum} OFFSET ${offset}
    `;
    
    const results = await query(sql, [childId]);
    
    // Compter le total
    const countSql = 'SELECT COUNT(*) as total FROM attendance WHERE child_id = ?';
    const countResult = await query(countSql, [childId]);
    const total = countResult[0].total;

    return {
      attendances: results.map(attendance => new Attendance(attendance)),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    };
  }

  // Obtenir les statistiques de présence
  static async getStats(date = null) {
    const today = date || new Date().toISOString().split('T')[0];
    
    const sql = `
      SELECT 
        COUNT(*) as total_present,
        SUM(CASE WHEN check_out_time IS NULL THEN 1 ELSE 0 END) as currently_present,
        SUM(CASE WHEN check_out_time IS NOT NULL THEN 1 ELSE 0 END) as already_left
      FROM attendance 
      WHERE date = ?
    `;
    
    const results = await query(sql, [today]);
    return results[0];
  }

  // Obtenir les enfants présents actuellement
  static async getCurrentlyPresent() {
    const today = new Date().toISOString().split('T')[0];
    
    const sql = `
      SELECT 
        a.*,
        c.first_name as child_first_name,
        c.last_name as child_last_name,
        c.birth_date,
        c.photo_url
      FROM attendance a
      JOIN children c ON a.child_id = c.id
      WHERE a.date = ? AND a.check_in_time IS NOT NULL AND a.check_out_time IS NULL
      ORDER BY a.check_in_time ASC
    `;
    
    const results = await query(sql, [today]);
    return results.map(attendance => new Attendance(attendance));
  }
}

module.exports = Attendance;
