const { query } = require('../config/database');

class Child {
  constructor(data) {
    this.id = data.id;
    this.first_name = data.first_name;
    this.last_name = data.last_name;
    this.birth_date = data.birth_date;
    this.gender = data.gender;
    this.medical_info = data.medical_info;
    this.emergency_contact_name = data.emergency_contact_name;
    this.emergency_contact_phone = data.emergency_contact_phone;
    this.photo_url = data.photo_url;
    this.is_active = data.is_active;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  // Créer un nouvel enfant
  static async create(childData) {
    const {
      first_name,
      last_name,
      birth_date,
      gender,
      medical_info,
      emergency_contact_name,
      emergency_contact_phone,
      photo_url
    } = childData;

    const sql = `
      INSERT INTO children (
        first_name, last_name, birth_date, gender, medical_info,
        emergency_contact_name, emergency_contact_phone, photo_url
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const result = await query(sql, [
      first_name,
      last_name,
      birth_date,
      gender,
      medical_info,
      emergency_contact_name,
      emergency_contact_phone,
      photo_url
    ]);
    
    return await this.findById(result.insertId);
  }

  // Trouver un enfant par ID
  static async findById(id) {
    const sql = 'SELECT * FROM children WHERE id = ? AND is_active = TRUE';
    const results = await query(sql, [id]);
    
    if (results.length === 0) {
      return null;
    }
    
    return new Child(results[0]);
  }

  // Obtenir tous les enfants avec pagination
  static async findAll(page = 1, limit = 10, search = null) {
    // S'assurer que page et limit sont des entiers valides
    let pageNum = 1;
    let limitNum = 10;
    
    if (page !== null && page !== undefined && !isNaN(page)) {
      pageNum = Math.max(1, parseInt(page));
    }
    
    if (limit !== null && limit !== undefined && !isNaN(limit)) {
      limitNum = Math.max(1, Math.min(100, parseInt(limit)));
    }
    
    const offset = (pageNum - 1) * limitNum;
    
    let sql = 'SELECT * FROM children WHERE is_active = TRUE';
    let params = [];

    if (search) {
      sql += ' AND (first_name LIKE ? OR last_name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    sql += ` ORDER BY first_name, last_name LIMIT ${limitNum} OFFSET ${offset}`;
    // Ne pas ajouter limit et offset aux params car MySQL ne les accepte pas comme paramètres

    const results = await query(sql, params);
    
    // Compter le total
    let countSql = 'SELECT COUNT(*) as total FROM children WHERE is_active = TRUE';
    let countParams = [];
    
    if (search) {
      countSql += ' AND (first_name LIKE ? OR last_name LIKE ?)';
      countParams.push(`%${search}%`, `%${search}%`);
    }
    
    const countResult = await query(countSql, countParams);
    const total = countResult[0].total;

    return {
      children: results.map(child => new Child(child)),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    };
  }

  // Obtenir les enfants d'un parent
  static async findByParent(parentId, page = 1, limit = 10) {
    // S'assurer que page et limit sont des entiers valides
    let pageNum = 1;
    let limitNum = 10;
    
    if (page !== null && page !== undefined && !isNaN(page)) {
      pageNum = Math.max(1, parseInt(page));
    }
    
    if (limit !== null && limit !== undefined && !isNaN(limit)) {
      limitNum = Math.max(1, Math.min(100, parseInt(limit)));
    }
    
    const offset = (pageNum - 1) * limitNum;
    
    const sql = `
      SELECT c.* FROM children c
      INNER JOIN enrollments e ON c.id = e.child_id
      WHERE e.parent_id = ? AND c.is_active = TRUE AND e.status = 'approved'
      ORDER BY c.first_name, c.last_name
      LIMIT ${limitNum} OFFSET ${offset}
    `;
    
    const results = await query(sql, [parentId]);
    
    // Compter le total
    const countSql = `
      SELECT COUNT(*) as total FROM children c
      INNER JOIN enrollments e ON c.id = e.child_id
      WHERE e.parent_id = ? AND c.is_active = TRUE AND e.status = 'approved'
    `;
    
    const countResult = await query(countSql, [parentId]);
    const total = countResult[0].total;

    return {
      children: results.map(child => new Child(child)),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    };
  }

  // Mettre à jour un enfant
  static async update(id, childData) {
    const existingChild = await this.findById(id);
    if (!existingChild) {
      throw new Error('Enfant non trouvé');
    }

    const {
      first_name,
      last_name,
      birth_date,
      gender,
      medical_info,
      emergency_contact_name,
      emergency_contact_phone,
      photo_url,
      is_active
    } = childData;

    const sql = `
      UPDATE children 
      SET first_name = ?, last_name = ?, birth_date = ?, gender = ?, 
          medical_info = ?, emergency_contact_name = ?, emergency_contact_phone = ?, 
          photo_url = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    
    await query(sql, [
      first_name || existingChild.first_name,
      last_name || existingChild.last_name,
      birth_date || existingChild.birth_date,
      gender || existingChild.gender,
      medical_info !== undefined ? medical_info : existingChild.medical_info,
      emergency_contact_name || existingChild.emergency_contact_name,
      emergency_contact_phone || existingChild.emergency_contact_phone,
      photo_url !== undefined ? photo_url : existingChild.photo_url,
      is_active !== undefined ? is_active : existingChild.is_active,
      id
    ]);

    return await this.findById(id);
  }

  // Supprimer un enfant (soft delete)
  static async delete(id) {
    const sql = 'UPDATE children SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    const result = await query(sql, [id]);
    
    return result.affectedRows > 0;
  }

  // Calculer l'âge de l'enfant
  get age() {
    const today = new Date();
    const birthDate = new Date(this.birth_date);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  // Obtenir le nom complet
  get fullName() {
    return `${this.first_name} ${this.last_name}`;
  }

  // Vérifier si l'enfant est présent aujourd'hui
  async isPresent() {
    const today = new Date().toISOString().split('T')[0];
    const sql = `
      SELECT COUNT(*) as count FROM attendance 
      WHERE child_id = ? AND DATE(check_in_time) = ? AND check_out_time IS NULL
    `;
    
    const result = await query(sql, [this.id, today]);
    return result[0].count > 0;
  }

  // Obtenir les présences de l'enfant
  async getAttendance(startDate = null, endDate = null) {
    let sql = `
      SELECT a.*, u.first_name as staff_first_name, u.last_name as staff_last_name
      FROM attendance a
      INNER JOIN users u ON a.staff_id = u.id
      WHERE a.child_id = ?
    `;
    
    let params = [this.id];
    
    if (startDate) {
      sql += ' AND DATE(a.check_in_time) >= ?';
      params.push(startDate);
    }
    
    if (endDate) {
      sql += ' AND DATE(a.check_in_time) <= ?';
      params.push(endDate);
    }
    
    sql += ' ORDER BY a.check_in_time DESC';
    
    return await query(sql, params);
  }
}

module.exports = Child;
