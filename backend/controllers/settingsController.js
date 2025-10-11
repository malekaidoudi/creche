const db = require('../config/database');

const settingsController = {
  // Obtenir tous les paramètres (admin) ou seulement publics (autres)
  getAllSettings: async (req, res) => {
    try {
      const isAdmin = req.user.role === 'admin';
      
      let whereClause = isAdmin ? '1=1' : 'is_public = TRUE';
      
      const [settings] = await db.execute(`
        SELECT setting_key, setting_value, setting_type, description, is_public
        FROM settings 
        WHERE ${whereClause}
        ORDER BY setting_key
      `);

      // Convertir les valeurs selon leur type
      const formattedSettings = settings.reduce((acc, setting) => {
        let value = setting.setting_value;
        
        switch (setting.setting_type) {
          case 'number':
            value = parseFloat(value);
            break;
          case 'boolean':
            value = value === 'true' || value === '1';
            break;
          case 'json':
            try {
              value = JSON.parse(value);
            } catch (e) {
              value = null;
            }
            break;
          default:
            // string - pas de conversion nécessaire
            break;
        }

        acc[setting.setting_key] = {
          value,
          type: setting.setting_type,
          description: setting.description,
          isPublic: setting.is_public
        };
        
        return acc;
      }, {});

      res.json({
        success: true,
        settings: formattedSettings
      });
    } catch (error) {
      console.error('Erreur récupération paramètres:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  },

  // Obtenir un paramètre spécifique
  getSetting: async (req, res) => {
    try {
      const { key } = req.params;
      const isAdmin = req.user.role === 'admin';
      
      let whereClause = 'setting_key = ?';
      let params = [key];
      
      if (!isAdmin) {
        whereClause += ' AND is_public = TRUE';
      }

      const [settings] = await db.execute(`
        SELECT setting_key, setting_value, setting_type, description, is_public
        FROM settings 
        WHERE ${whereClause}
      `, params);

      if (settings.length === 0) {
        return res.status(404).json({ error: 'Paramètre non trouvé' });
      }

      const setting = settings[0];
      let value = setting.setting_value;
      
      // Convertir selon le type
      switch (setting.setting_type) {
        case 'number':
          value = parseFloat(value);
          break;
        case 'boolean':
          value = value === 'true' || value === '1';
          break;
        case 'json':
          try {
            value = JSON.parse(value);
          } catch (e) {
            value = null;
          }
          break;
      }

      res.json({
        success: true,
        setting: {
          key: setting.setting_key,
          value,
          type: setting.setting_type,
          description: setting.description,
          isPublic: setting.is_public
        }
      });
    } catch (error) {
      console.error('Erreur récupération paramètre:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  },

  // Mettre à jour ou créer un paramètre (admin seulement)
  updateSetting: async (req, res) => {
    try {
      const { key } = req.params;
      const { value, type = 'string', description, isPublic = false } = req.body;

      // Valider le type
      const validTypes = ['string', 'number', 'boolean', 'json'];
      if (!validTypes.includes(type)) {
        return res.status(400).json({ error: 'Type de paramètre invalide' });
      }

      // Convertir la valeur en string pour stockage
      let stringValue;
      switch (type) {
        case 'number':
          if (isNaN(value)) {
            return res.status(400).json({ error: 'Valeur numérique invalide' });
          }
          stringValue = String(value);
          break;
        case 'boolean':
          stringValue = value ? 'true' : 'false';
          break;
        case 'json':
          try {
            stringValue = JSON.stringify(value);
          } catch (e) {
            return res.status(400).json({ error: 'JSON invalide' });
          }
          break;
        default:
          stringValue = String(value);
      }

      // Vérifier si le paramètre existe
      const [existing] = await db.execute(
        'SELECT id FROM settings WHERE setting_key = ?',
        [key]
      );

      if (existing.length > 0) {
        // Mettre à jour
        await db.execute(`
          UPDATE settings 
          SET setting_value = ?, setting_type = ?, description = ?, is_public = ?, updated_at = NOW()
          WHERE setting_key = ?
        `, [stringValue, type, description, isPublic, key]);
      } else {
        // Créer
        await db.execute(`
          INSERT INTO settings (setting_key, setting_value, setting_type, description, is_public)
          VALUES (?, ?, ?, ?, ?)
        `, [key, stringValue, type, description, isPublic]);
      }

      res.json({
        success: true,
        message: 'Paramètre mis à jour avec succès',
        setting: {
          key,
          value,
          type,
          description,
          isPublic
        }
      });
    } catch (error) {
      console.error('Erreur mise à jour paramètre:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  },

  // Supprimer un paramètre (admin seulement)
  deleteSetting: async (req, res) => {
    try {
      const { key } = req.params;

      const [result] = await db.execute(
        'DELETE FROM settings WHERE setting_key = ?',
        [key]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Paramètre non trouvé' });
      }

      res.json({
        success: true,
        message: 'Paramètre supprimé avec succès'
      });
    } catch (error) {
      console.error('Erreur suppression paramètre:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  },

  // Mettre à jour plusieurs paramètres en une fois (admin seulement)
  updateMultipleSettings: async (req, res) => {
    try {
      const { settings } = req.body;

      if (!Array.isArray(settings)) {
        return res.status(400).json({ error: 'Format de données invalide' });
      }

      // Traiter chaque paramètre
      for (const setting of settings) {
        const { key, value, type = 'string', description, isPublic = false } = setting;

        if (!key) continue;

        // Convertir la valeur
        let stringValue;
        switch (type) {
          case 'number':
            stringValue = String(value);
            break;
          case 'boolean':
            stringValue = value ? 'true' : 'false';
            break;
          case 'json':
            try {
              stringValue = JSON.stringify(value);
            } catch (e) {
              continue; // Ignorer les JSON invalides
            }
            break;
          default:
            stringValue = String(value);
        }

        // Upsert
        await db.execute(`
          INSERT INTO settings (setting_key, setting_value, setting_type, description, is_public)
          VALUES (?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
          setting_value = VALUES(setting_value),
          setting_type = VALUES(setting_type),
          description = VALUES(description),
          is_public = VALUES(is_public),
          updated_at = NOW()
        `, [key, stringValue, type, description, isPublic]);
      }

      res.json({
        success: true,
        message: 'Paramètres mis à jour avec succès'
      });
    } catch (error) {
      console.error('Erreur mise à jour multiple:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
};

module.exports = settingsController;
