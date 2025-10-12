const db = require('../config/database');

const childrenController = {
  // Obtenir tous les enfants
  getAllChildren: async (req, res) => {
    try {
      const { page = 1, limit = 20, search = '', status = 'all', age = 'all' } = req.query;
      const offset = (page - 1) * limit;

      // Construction des conditions WHERE
      let whereConditions = ['c.is_active = 1'];
      let params = [];

      // Filtre par recherche (nom ou prénom)
      if (search && search.trim() !== '') {
        whereConditions.push('(c.first_name LIKE ? OR c.last_name LIKE ?)');
        params.push(`%${search}%`, `%${search}%`);
      }

      // Filtre par statut
      if (status !== 'all') {
        whereConditions.push('c.status = ?');
        params.push(status);
      }

      // Filtre par âge
      if (age !== 'all') {
        const today = new Date();
        if (age === 'baby') {
          // Moins d'1 an
          const oneYearAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
          whereConditions.push('c.birth_date > ?');
          params.push(oneYearAgo.toISOString().split('T')[0]);
        } else if (age === 'toddler') {
          // 1-3 ans
          const oneYearAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
          const threeYearsAgo = new Date(today.getFullYear() - 3, today.getMonth(), today.getDate());
          whereConditions.push('c.birth_date <= ? AND c.birth_date > ?');
          params.push(oneYearAgo.toISOString().split('T')[0], threeYearsAgo.toISOString().split('T')[0]);
        } else if (age === 'preschool') {
          // Plus de 3 ans
          const threeYearsAgo = new Date(today.getFullYear() - 3, today.getMonth(), today.getDate());
          whereConditions.push('c.birth_date <= ?');
          params.push(threeYearsAgo.toISOString().split('T')[0]);
        }
      }

      const whereClause = whereConditions.join(' AND ');

      // Requête pour récupérer les enfants
      const query = `
        SELECT 
          c.*,
          p.first_name as parent_first_name,
          p.last_name as parent_last_name,
          p.email as parent_email,
          p.phone as parent_phone
        FROM children c
        LEFT JOIN users p ON c.parent_id = p.id
        WHERE ${whereClause}
        ORDER BY c.created_at DESC
        LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}
      `;

      const [children] = await db.execute(query, params);

      // Compter le total avec les mêmes filtres
      const countQuery = `SELECT COUNT(*) as total FROM children c WHERE ${whereClause}`;
      const [countResult] = await db.execute(countQuery, params);
      const total = countResult[0].total;

      res.json({
        success: true,
        data: {
          children,
          total,
          totalPages: Math.ceil(total / limit),
          currentPage: parseInt(page)
        }
      });
    } catch (error) {
      console.error('Erreur récupération enfants:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  },

  // Obtenir un enfant par ID
  getChildById: async (req, res) => {
    try {
      const { id } = req.params;

      const [children] = await db.execute(`
        SELECT c.*, 
               CONCAT(u.first_name, ' ', u.last_name) as parent_name,
               u.email as parent_email,
               TIMESTAMPDIFF(YEAR, c.birth_date, CURDATE()) as age
        FROM children c
        LEFT JOIN users u ON c.parent_id = u.id
        WHERE c.id = ?
        ORDER BY c.first_name, c.last_name
      `, [id]);

      if (children.length === 0) {
        return res.status(404).json({ success: false, error: 'Enfant non trouvé' });
      }

      const child = children[0];
      res.json({
        success: true,
        child: {
          ...child,
          age: calculateAge(child.birth_date),
          parent: child.parent_first_name ? {
            first_name: child.parent_first_name,
            last_name: child.parent_last_name,
            email: child.parent_email,
            phone: child.parent_phone
          } : null
        }
      });
    } catch (error) {
      console.error('Erreur récupération enfant:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  },

  // Créer un nouvel enfant
  createChild: async (req, res) => {
    try {
      const {
        first_name,
        last_name,
        birth_date,
        gender,
        parent_id,
        medical_info,
        emergency_contact_name,
        emergency_contact_phone,
        lunch_assistance,
        enrollment_date
      } = req.body;

      // Validation des champs requis
      if (!first_name || !last_name || !birth_date || !gender || !emergency_contact_name || !emergency_contact_phone) {
        return res.status(400).json({ error: 'Champs requis manquants' });
      }

      // Vérifier que le parent existe si fourni
      if (parent_id) {
        const [parents] = await db.execute('SELECT id FROM users WHERE id = ? AND role = "parent"', [parent_id]);
        if (parents.length === 0) {
          return res.status(400).json({ error: 'Parent non trouvé' });
        }
      }

      const [result] = await db.execute(`
        INSERT INTO children (
          first_name, last_name, birth_date, gender, parent_id,
          medical_info, emergency_contact_name, emergency_contact_phone,
          lunch_assistance, enrollment_date
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        first_name, last_name, birth_date, gender, parent_id,
        medical_info, emergency_contact_name, emergency_contact_phone,
        lunch_assistance || false, enrollment_date || new Date().toISOString().split('T')[0]
      ]);

      // Récupérer l'enfant créé avec les informations du parent
      const [newChild] = await db.execute(`
        SELECT 
          c.*,
          p.first_name as parent_first_name,
          p.last_name as parent_last_name,
          p.email as parent_email,
          p.phone as parent_phone
        FROM children c
        LEFT JOIN users p ON c.parent_id = p.id
        WHERE c.id = ?
      `, [result.insertId]);

      const child = newChild[0];
      res.status(201).json({
        message: 'Enfant créé avec succès',
        child: {
          ...child,
          age: calculateAge(child.birth_date),
          parent: child.parent_first_name ? {
            first_name: child.parent_first_name,
            last_name: child.parent_last_name,
            email: child.parent_email,
            phone: child.parent_phone
          } : null
        }
      });
    } catch (error) {
      console.error('Erreur création enfant:', error);
      res.status(500).json({ error: 'Erreur lors de la création' });
    }
  },

  // Mettre à jour un enfant
  updateChild: async (req, res) => {
    try {
      const { id } = req.params;
      const {
        first_name,
        last_name,
        birth_date,
        gender,
        parent_id,
        medical_info,
        emergency_contact_name,
        emergency_contact_phone,
        lunch_assistance,
        enrollment_date,
        is_active
      } = req.body;

      // Vérifier que l'enfant existe
      const [existingChildren] = await db.execute('SELECT id FROM children WHERE id = ?', [id]);
      if (existingChildren.length === 0) {
        return res.status(404).json({ error: 'Enfant non trouvé' });
      }

      // Vérifier que le parent existe si fourni
      if (parent_id) {
        const [parents] = await db.execute('SELECT id FROM users WHERE id = ? AND role = "parent"', [parent_id]);
        if (parents.length === 0) {
          return res.status(400).json({ error: 'Parent non trouvé' });
        }
      }

      await db.execute(`
        UPDATE children SET
          first_name = ?, last_name = ?, birth_date = ?, gender = ?, parent_id = ?,
          medical_info = ?, emergency_contact_name = ?, emergency_contact_phone = ?,
          lunch_assistance = ?, enrollment_date = ?, is_active = ?, updated_at = NOW()
        WHERE id = ?
      `, [
        first_name, last_name, birth_date, gender, parent_id,
        medical_info, emergency_contact_name, emergency_contact_phone,
        lunch_assistance, enrollment_date, is_active !== undefined ? is_active : true, id
      ]);

      // Récupérer l'enfant mis à jour
      const [updatedChild] = await db.execute(`
        SELECT 
          c.*,
          p.first_name as parent_first_name,
          p.last_name as parent_last_name,
          p.email as parent_email,
          p.phone as parent_phone
        FROM children c
        LEFT JOIN users p ON c.parent_id = p.id
        WHERE c.id = ?
      `, [id]);

      const child = updatedChild[0];
      res.json({
        message: 'Enfant mis à jour avec succès',
        child: {
          ...child,
          age: calculateAge(child.birth_date),
          parent: child.parent_first_name ? {
            first_name: child.parent_first_name,
            last_name: child.parent_last_name,
            email: child.parent_email,
            phone: child.parent_phone
          } : null
        }
      });
    } catch (error) {
      console.error('Erreur mise à jour enfant:', error);
      res.status(500).json({ error: 'Erreur lors de la mise à jour' });
    }
  },

  // Supprimer un enfant (soft delete)
  deleteChild: async (req, res) => {
    try {
      const { id } = req.params;

      // Vérifier que l'enfant existe
      const [existingChildren] = await db.execute('SELECT id FROM children WHERE id = ?', [id]);
      if (existingChildren.length === 0) {
        return res.status(404).json({ error: 'Enfant non trouvé' });
      }

      // Soft delete
      await db.execute('UPDATE children SET is_active = FALSE, updated_at = NOW() WHERE id = ?', [id]);

      res.json({ 
        success: true, 
        message: 'Enfant supprimé avec succès' 
      });
    } catch (error) {
      console.error('Erreur suppression enfant:', error);
      res.status(500).json({ error: 'Erreur lors de la suppression' });
    }
  },

  // Récupérer les enfants disponibles (sans parent)
  getAvailableChildren: async (req, res) => {
    try {
      const [children] = await db.execute(`
        SELECT c.*, 
               TIMESTAMPDIFF(YEAR, c.birth_date, CURDATE()) as age
        FROM children c
        WHERE c.parent_id IS NULL AND c.is_active = TRUE
        ORDER BY c.first_name, c.last_name
      `);

      res.json({
        success: true,
        children: children.map(child => ({
          ...child,
          age: calculateAge(child.birth_date)
        }))
      });
    } catch (error) {
      console.error('Erreur récupération enfants disponibles:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des enfants disponibles'
      });
    }
  },

  // Obtenir les enfants d'un parent
  getChildrenByParent: async (req, res) => {
    try {
      const { parentId } = req.params;

      const [children] = await db.execute(`
        SELECT * FROM children 
        WHERE parent_id = ? AND is_active = TRUE
        ORDER BY first_name, last_name
      `, [parentId]);

      res.json({
        children: children.map(child => ({
          ...child,
          age: calculateAge(child.birth_date)
        }))
      });
    } catch (error) {
      console.error('Erreur récupération enfants parent:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  },

  // Obtenir les statistiques des enfants
  getChildrenStats: async (req, res) => {
    try {
      const [totalResult] = await db.execute('SELECT COUNT(*) as total FROM children WHERE is_active = TRUE');
      const [boysResult] = await db.execute('SELECT COUNT(*) as boys FROM children WHERE gender = "M" AND is_active = TRUE');
      const [girlsResult] = await db.execute('SELECT COUNT(*) as girls FROM children WHERE gender = "F" AND is_active = TRUE');
      
      // Statistiques par âge
      const [ageStats] = await db.execute(`
        SELECT 
          CASE 
            WHEN TIMESTAMPDIFF(MONTH, birth_date, CURDATE()) < 12 THEN 'babies'
            WHEN TIMESTAMPDIFF(MONTH, birth_date, CURDATE()) < 24 THEN 'toddlers'
            WHEN TIMESTAMPDIFF(MONTH, birth_date, CURDATE()) < 36 THEN 'preschool'
            ELSE 'older'
          END as age_group,
          COUNT(*) as count
        FROM children 
        WHERE is_active = TRUE
        GROUP BY age_group
      `);

      const stats = {
        total: totalResult[0].total,
        boys: boysResult[0].boys,
        girls: girlsResult[0].girls,
        ageGroups: ageStats.reduce((acc, stat) => {
          acc[stat.age_group] = stat.count;
          return acc;
        }, {})
      };

      res.json(stats);
    } catch (error) {
      console.error('Erreur statistiques enfants:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  },

  // Associer un enfant à un parent existant
  associateChildToParent: async (req, res) => {
    try {
      const { childId } = req.params;
      const { parentId } = req.body;

      // Vérifier que l'enfant existe et n'a pas déjà de parent
      const [children] = await db.execute(
        'SELECT id, parent_id FROM children WHERE id = ?',
        [childId]
      );

      if (children.length === 0) {
        return res.status(404).json({ error: 'Enfant non trouvé' });
      }

      if (children[0].parent_id) {
        return res.status(400).json({ error: 'Cet enfant est déjà associé à un parent' });
      }

      // Vérifier que le parent existe
      const [parents] = await db.execute(
        'SELECT id, first_name, last_name FROM users WHERE id = ? AND role = "parent"',
        [parentId]
      );

      if (parents.length === 0) {
        return res.status(404).json({ error: 'Parent non trouvé' });
      }

      // Associer l'enfant au parent
      await db.execute(
        'UPDATE children SET parent_id = ?, updated_at = NOW() WHERE id = ?',
        [parentId, childId]
      );

      // Récupérer l'enfant mis à jour
      const [updatedChild] = await db.execute(`
        SELECT 
          c.*,
          p.first_name as parent_first_name,
          p.last_name as parent_last_name,
          p.email as parent_email,
          p.phone as parent_phone
        FROM children c
        LEFT JOIN users p ON c.parent_id = p.id
        WHERE c.id = ?
      `, [childId]);

      res.json({
        success: true,
        message: 'Enfant associé au parent avec succès',
        child: {
          ...updatedChild[0],
          age: calculateAge(updatedChild[0].birth_date),
          parent: updatedChild[0].parent_first_name ? {
            first_name: updatedChild[0].parent_first_name,
            last_name: updatedChild[0].parent_last_name,
            email: updatedChild[0].parent_email,
            phone: updatedChild[0].parent_phone
          } : null
        }
      });
    } catch (error) {
      console.error('Erreur association enfant-parent:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  },

  // Obtenir les enfants sans parent (orphelins)
  getOrphanChildren: async (req, res) => {
    try {
      const [children] = await db.execute(`
        SELECT 
          c.*
        FROM children c
        WHERE c.parent_id IS NULL AND c.is_active = TRUE
        ORDER BY c.first_name, c.last_name
      `);

      res.json({
        success: true,
        children: children.map(child => ({
          ...child,
          age: calculateAge(child.birth_date)
        }))
      });
    } catch (error) {
      console.error('Erreur récupération enfants orphelins:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
};

// Fonction utilitaire pour calculer l'âge
function calculateAge(birthDate) {
  const today = new Date();
  const birth = new Date(birthDate);
  const ageInMonths = (today.getFullYear() - birth.getFullYear()) * 12 + (today.getMonth() - birth.getMonth());
  
  if (ageInMonths < 12) {
    return `${ageInMonths} mois`;
  } else {
    const years = Math.floor(ageInMonths / 12);
    const months = ageInMonths % 12;
    return `${years} an${years > 1 ? 's' : ''} ${months > 0 ? `${months} mois` : ''}`;
  }
}

module.exports = childrenController;
