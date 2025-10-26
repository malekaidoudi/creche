const { query } = require('../config/db_postgres');

class Enrollment {
  constructor(data) {
    this.id = data.id;
    this.parent_id = data.parent_id;
    this.child_id = data.child_id;
    this.enrollment_date = data.enrollment_date;
    this.status = data.status; // 'pending', 'approved', 'rejected'
    this.lunch_assistance = data.lunch_assistance;
    this.regulation_accepted = data.regulation_accepted;
    this.appointment_date = data.appointment_date;
    this.appointment_time = data.appointment_time;
    this.admin_notes = data.admin_notes;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  // Créer une nouvelle inscription
  static async create(enrollmentData) {
    const {
      parent_id,
      child_id,
      enrollment_date,
      status = 'pending',
      lunch_assistance = false,
      regulation_accepted = false
    } = enrollmentData;

    const sql = `
      INSERT INTO enrollments (
        parent_id, child_id, enrollment_date, status, 
        lunch_assistance, regulation_accepted
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    const result = await query(sql, [
      parent_id,
      child_id,
      enrollment_date,
      status,
      lunch_assistance ? 1 : 0,
      regulation_accepted ? 1 : 0
    ]);
    
    return await this.findById(result.insertId);
  }

  // Trouver une inscription par ID avec les données du parent et de l'enfant
  static async findById(id) {
    const sql = `
      SELECT 
        e.*,
        u.first_name as parent_first_name,
        u.last_name as parent_last_name,
        u.email as parent_email,
        u.phone as parent_phone,
        c.first_name as child_first_name,
        c.last_name as child_last_name,
        c.birth_date,
        c.gender,
        c.medical_info,
        c.emergency_contact_name,
        c.emergency_contact_phone
      FROM enrollments e
      JOIN users u ON e.parent_id = u.id
      JOIN children c ON e.child_id = c.id
      WHERE e.id = ?
    `;
    
    const results = await query(sql, [id]);
    
    if (results.length === 0) {
      return null;
    }
    
    return new Enrollment(results[0]);
  }

  // Obtenir toutes les inscriptions avec pagination et filtres
  static async findAll(page = 1, limit = 10, status = null) {
    let pageNum = Math.max(1, parseInt(page) || 1);
    let limitNum = Math.max(1, Math.min(100, parseInt(limit) || 10));
    const offset = (pageNum - 1) * limitNum;
    
    let sql = `
      SELECT 
        e.*,
        u.first_name as parent_first_name,
        u.last_name as parent_last_name,
        u.email as parent_email,
        u.phone as parent_phone,
        c.first_name as child_first_name,
        c.last_name as child_last_name,
        c.birth_date,
        c.gender
      FROM enrollments e
      JOIN users u ON e.parent_id = u.id
      JOIN children c ON e.child_id = c.id
    `;
    
    let params = [];
    
    if (status) {
      sql += ' WHERE e.status = ?';
      params.push(status);
    }
    
    sql += ` ORDER BY e.created_at DESC LIMIT ${limitNum} OFFSET ${offset}`;
    
    const results = await query(sql, params);
    
    // Compter le total
    let countSql = 'SELECT COUNT(*) as total FROM enrollments e';
    let countParams = [];
    
    if (status) {
      countSql += ' WHERE e.status = ?';
      countParams.push(status);
    }
    
    const countResult = await query(countSql, countParams);
    const total = countResult[0].total;

    return {
      enrollments: results.map(enrollment => new Enrollment(enrollment)),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    };
  }

  // Obtenir les inscriptions d'un parent
  static async findByParentId(parentId) {
    const sql = `
      SELECT 
        e.*,
        c.first_name as child_first_name,
        c.last_name as child_last_name,
        c.birth_date,
        c.gender,
        c.medical_info
      FROM enrollments e
      JOIN children c ON e.child_id = c.id
      WHERE e.parent_id = ?
      ORDER BY e.created_at DESC
    `;
    
    const results = await query(sql, [parentId]);
    return results.map(enrollment => new Enrollment(enrollment));
  }

  // Mettre à jour le statut d'une inscription
  static async updateStatus(id, status, adminNotes = null, appointmentDate = null, appointmentTime = null) {
    const validStatuses = ['pending', 'approved', 'rejected'];
    if (!validStatuses.includes(status)) {
      throw new Error('Statut invalide');
    }

    const sql = `
      UPDATE enrollments 
      SET status = ?, admin_notes = ?, appointment_date = ?, appointment_time = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    
    await query(sql, [status, adminNotes, appointmentDate, appointmentTime, id]);
    return await this.findById(id);
  }

  // Obtenir les documents d'une inscription
  static async getDocuments(enrollmentId) {
    const sql = `
      SELECT 
        ed.document_type,
        u.id as upload_id,
        u.filename,
        u.original_name,
        u.file_path,
        u.file_size,
        u.mime_type,
        u.created_at
      FROM enrollment_documents ed
      JOIN uploads u ON ed.upload_id = u.id
      WHERE ed.enrollment_id = ?
      ORDER BY ed.created_at DESC
    `;
    
    return await query(sql, [enrollmentId]);
  }

  // Obtenir les statistiques des inscriptions
  static async getStats() {
    const sql = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected
      FROM enrollments
    `;
    
    const results = await query(sql);
    return results[0];
  }
}

module.exports = Enrollment;
