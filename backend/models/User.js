const { query } = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  constructor(data) {
    this.id = data.id;
    this.email = data.email;
    this.password = data.password;
    this.first_name = data.first_name;
    this.last_name = data.last_name;
    this.phone = data.phone;
    this.role = data.role;
    this.profile_image = data.profile_image || data.profile_picture_url;
    this.is_active = data.is_active;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  // Créer un nouvel utilisateur
  static async create(userData) {
    const { email, password, first_name, last_name, phone, role = 'parent' } = userData;
    
    // Vérifier si l'email existe déjà
    const existingUser = await this.findByEmail(email);
    if (existingUser) {
      throw new Error('Un utilisateur avec cet email existe déjà');
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    const sql = `
      INSERT INTO users (email, password, first_name, last_name, phone, role)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    const result = await query(sql, [email, hashedPassword, first_name, last_name, phone, role]);
    
    // Récupérer l'utilisateur créé
    return await this.findById(result.insertId);
  }

  // Trouver un utilisateur par ID
  static async findById(id) {
    const sql = 'SELECT * FROM users WHERE id = ? AND is_active = TRUE';
    const results = await query(sql, [id]);
    
    if (results.length === 0) {
      return null;
    }
    
    return new User(results[0]);
  }

  // Trouver un utilisateur par email
  static async findByEmail(email) {
    const sql = 'SELECT * FROM users WHERE email = ? AND is_active = TRUE';
    const results = await query(sql, [email]);
    
    if (results.length === 0) {
      return null;
    }
    
    return new User(results[0]);
  }

  // Obtenir tous les utilisateurs avec pagination
  static async findAll(page = 1, limit = 10, role = null) {
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
    
    let sql = 'SELECT * FROM users WHERE is_active = TRUE';
    let params = [];

    if (role) {
      sql += ' AND role = ?';
      params.push(role);
    }

    sql += ` ORDER BY created_at DESC LIMIT ${limitNum} OFFSET ${offset}`;
    // Ne pas ajouter limit et offset aux params car MySQL ne les accepte pas comme paramètres

    const results = await query(sql, params);
    
    // Compter le total
    let countSql = 'SELECT COUNT(*) as total FROM users WHERE is_active = TRUE';
    let countParams = [];
    
    if (role) {
      countSql += ' AND role = ?';
      countParams.push(role);
    }
    
    const countResult = await query(countSql, countParams);
    const total = countResult[0].total;

    return {
      users: results.map(user => new User(user)),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    };
  }

  // Mettre à jour un utilisateur
  static async update(id, userData) {
    const { email, first_name, last_name, phone, role, is_active } = userData;
    
    // Vérifier si l'utilisateur existe
    const existingUser = await this.findById(id);
    if (!existingUser) {
      throw new Error('Utilisateur non trouvé');
    }

    // Vérifier si le nouvel email n'est pas déjà utilisé par un autre utilisateur
    if (email && email !== existingUser.email) {
      const emailExists = await this.findByEmail(email);
      if (emailExists && emailExists.id !== id) {
        throw new Error('Un utilisateur avec cet email existe déjà');
      }
    }

    const sql = `
      UPDATE users 
      SET email = ?, first_name = ?, last_name = ?, phone = ?, role = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    
    await query(sql, [
      email || existingUser.email,
      first_name || existingUser.first_name,
      last_name || existingUser.last_name,
      phone || existingUser.phone,
      role || existingUser.role,
      is_active !== undefined ? is_active : existingUser.is_active,
      id
    ]);

    return await this.findById(id);
  }

  // Mettre à jour le profil utilisateur (pour les utilisateurs connectés)
  static async updateProfile(id, profileData) {
    const { first_name, last_name, phone, profile_image } = profileData;
    
    // Vérifier si l'utilisateur existe
    const existingUser = await this.findById(id);
    if (!existingUser) {
      throw new Error('Utilisateur non trouvé');
    }

    const sql = `
      UPDATE users 
      SET first_name = ?, last_name = ?, phone = ?, profile_image = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    
    await query(sql, [
      first_name || existingUser.first_name,
      last_name || existingUser.last_name,
      phone || existingUser.phone,
      profile_image || existingUser.profile_image,
      id
    ]);

    return await this.findById(id);
  }

  // Supprimer un utilisateur (soft delete)
  static async delete(id) {
    const sql = 'UPDATE users SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    const result = await query(sql, [id]);
    
    return result.affectedRows > 0;
  }

  // Changer le mot de passe
  static async changePassword(id, oldPassword, newPassword) {
    const user = await this.findById(id);
    if (!user) {
      throw new Error('Utilisateur non trouvé');
    }

    // Vérifier l'ancien mot de passe
    const isValidPassword = await bcrypt.compare(oldPassword, user.password);
    if (!isValidPassword) {
      throw new Error('Ancien mot de passe incorrect');
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const sql = 'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    await query(sql, [hashedPassword, id]);

    return true;
  }

  // Vérifier le mot de passe
  async verifyPassword(password) {
    return await bcrypt.compare(password, this.password);
  }

  // Obtenir les données publiques de l'utilisateur (sans mot de passe)
  toJSON() {
    const { password, ...userWithoutPassword } = this;
    return userWithoutPassword;
  }

  // Obtenir le nom complet
  get fullName() {
    return `${this.first_name} ${this.last_name}`;
  }
}

module.exports = User;
