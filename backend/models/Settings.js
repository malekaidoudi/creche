const { pool } = require('../config/database');

class Settings {
  // Récupérer tous les paramètres
  static async getAll() {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM creche_settings ORDER BY category, setting_key'
      );
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Récupérer les paramètres publics seulement
  static async getPublic() {
    try {
      const [rows] = await pool.execute(
        'SELECT setting_key, setting_value, setting_type FROM creche_settings WHERE is_public = TRUE ORDER BY category, setting_key'
      );
      
      // Convertir en objet clé-valeur avec parsing automatique
      const settings = {};
      rows.forEach(row => {
        let value = row.setting_value;
        
        // Parser selon le type
        switch (row.setting_type) {
          case 'number':
            value = parseFloat(value);
            break;
          case 'boolean':
            value = value === 'true';
            break;
          case 'json':
            try {
              value = JSON.parse(value);
            } catch (e) {
              console.warn(`Failed to parse JSON for ${row.setting_key}:`, value);
            }
            break;
          default:
            // string et image restent en string
            break;
        }
        
        settings[row.setting_key] = value;
      });
      
      return settings;
    } catch (error) {
      throw error;
    }
  }

  // Récupérer par catégorie
  static async getByCategory(category) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM creche_settings WHERE category = ? ORDER BY setting_key',
        [category]
      );
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Récupérer un paramètre spécifique
  static async getByKey(key) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM creche_settings WHERE setting_key = ?',
        [key]
      );
      return rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Mettre à jour un paramètre
  static async updateByKey(key, value, type = 'string') {
    try {
      // Valider et convertir la valeur selon le type
      let processedValue = value;
      
      switch (type) {
        case 'json':
          if (typeof value === 'object') {
            processedValue = JSON.stringify(value);
          }
          break;
        case 'boolean':
          processedValue = value ? 'true' : 'false';
          break;
        case 'number':
          processedValue = value.toString();
          break;
        default:
          processedValue = value.toString();
      }

      const [result] = await pool.execute(
        'UPDATE creche_settings SET setting_value = ?, setting_type = ?, updated_at = CURRENT_TIMESTAMP WHERE setting_key = ?',
        [processedValue, type, key]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  // Mettre à jour plusieurs paramètres
  static async updateMultiple(settings) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      for (const [key, data] of Object.entries(settings)) {
        const { value, type = 'string' } = typeof data === 'object' && data.hasOwnProperty('value') 
          ? data 
          : { value: data };
        
        let processedValue = value;
        
        switch (type) {
          case 'json':
            if (typeof value === 'object') {
              processedValue = JSON.stringify(value);
            }
            break;
          case 'boolean':
            processedValue = value ? 'true' : 'false';
            break;
          case 'number':
            processedValue = value.toString();
            break;
          default:
            processedValue = value.toString();
        }

        await connection.execute(
          'UPDATE creche_settings SET setting_value = ?, setting_type = ?, updated_at = CURRENT_TIMESTAMP WHERE setting_key = ?',
          [processedValue, type, key]
        );
      }
      
      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // Créer un nouveau paramètre
  static async create(key, value, type = 'string', category = 'general', description = '', isPublic = true) {
    try {
      let processedValue = value;
      
      switch (type) {
        case 'json':
          if (typeof value === 'object') {
            processedValue = JSON.stringify(value);
          }
          break;
        case 'boolean':
          processedValue = value ? 'true' : 'false';
          break;
        case 'number':
          processedValue = value.toString();
          break;
        default:
          processedValue = value.toString();
      }

      const [result] = await pool.execute(
        'INSERT INTO creche_settings (setting_key, setting_value, setting_type, category, description, is_public) VALUES (?, ?, ?, ?, ?, ?)',
        [key, processedValue, type, category, description, isPublic]
      );
      
      return result.insertId;
    } catch (error) {
      throw error;
    }
  }

  // Supprimer un paramètre
  static async delete(key) {
    try {
      const [result] = await pool.execute(
        'DELETE FROM creche_settings WHERE setting_key = ?',
        [key]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  // Récupérer les catégories disponibles
  static async getCategories() {
    try {
      const [rows] = await pool.execute(
        'SELECT DISTINCT category FROM creche_settings ORDER BY category'
      );
      return rows.map(row => row.category);
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Settings;
