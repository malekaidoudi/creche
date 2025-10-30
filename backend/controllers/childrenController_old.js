const db = require('../config/db_postgres');

// Fonction pour calculer l'âge
const calculateAge = (birthDate) => {
  const today = new Date();
  const birth = new Date(birthDate);
  
  let years = today.getFullYear() - birth.getFullYear();
  let months = today.getMonth() - birth.getMonth();
  let days = today.getDate() - birth.getDate();
  
  if (days < 0) {
    months--;
    const lastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    days += lastMonth.getDate();
  }
  
  if (months < 0) {
    years--;
    months += 12;
  }
  
  if (years === 0 && months === 0) {
    return `${days} jour${days > 1 ? 's' : ''}`;
  }
  
  if (years === 0) {
    if (days === 0) {
      return `${months} mois`;
    }
    return `${months} mois et ${days} jour${days > 1 ? 's' : ''}`;
  }
  
  if (months === 0) {
    return `${years} an${years > 1 ? 's' : ''}`;
  }
  
  return `${years} an${years > 1 ? 's' : ''} et ${months} mois`;
};

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

      // Requête pour récupérer les enfants avec parents via enrollments
      const query = `
        SELECT 
          c.*,
          p.first_name as parent_first_name,
          p.last_name as parent_last_name,
          p.email as parent_email,
          p.phone as parent_phone,
          e.status as enrollment_status
        FROM children c
        LEFT JOIN enrollments e ON c.id = e.child_id
        LEFT JOIN users p ON e.parent_id = p.id
        WHERE ${whereClause}
        ORDER BY c.created_at DESC
        LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}
      `;

      const childrenResult = await db.query(query, params);
      const children = childrenResult.rows;

      // Compter le total avec les mêmes filtres
      const countQuery = `SELECT COUNT(*) as total FROM children c WHERE ${whereClause}`;
      const countResult = await db.query(countQuery, params);
      const total = countResult.rows[0].total;

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

      const childrenResult = await db.query(`
        SELECT c.*, 
               CONCAT(u.first_name, ' ', u.last_name) as parent_name,
               u.email as parent_email,
               EXTRACT(YEAR FROM AGE(c.birth_date)) as age,
               e.status as enrollment_status
        FROM children c
        LEFT JOIN enrollments e ON c.id = e.child_id
        LEFT JOIN users u ON e.parent_id = u.id
        WHERE c.id = $1
        ORDER BY c.first_name, c.last_name
      `, [id]);
      
      const children = childrenResult.rows;

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

  // Créer un nouvel enfant - VERSION SIMPLE
  createChild: async (req, res) => {
    console.log('=== DEBUT CREATE CHILD ===');
    
    try {
      // 1. Récupérer les données
      const { first_name, last_name, birth_date, gender, medical_info, emergency_contact_name, emergency_contact_phone } = req.body;
      
      console.log('Données reçues:', { first_name, last_name, birth_date, gender });
      
      // 2. Validation simple
      if (!first_name || !last_name || !birth_date || !gender) {
        console.log('❌ Validation échouée');
        return res.status(400).json({ 
          success: false, 
          error: 'Champs requis manquants: first_name, last_name, birth_date, gender' 
        });
      }
      
      console.log('✅ Validation OK');
      
      // 3. Insertion simple
      console.log('Insertion en cours...');
      const result = await db.query(
        'INSERT INTO children (first_name, last_name, birth_date, gender, medical_info, emergency_contact_name, emergency_contact_phone, is_active) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id',
        [first_name, last_name, birth_date, gender, medical_info || '', emergency_contact_name || '', emergency_contact_phone || '', true]
      );
      
      const insertId = result.rows[0].id;
      console.log('✅ Insertion réussie, ID:', insertId);
      
      // 4. Réponse simple
      res.status(201).json({
        success: true,
        message: 'Enfant créé avec succès',
        child: {
          id: insertId,
          first_name,
          last_name,
          birth_date,
          gender,
          is_active: true
        }
      });
      
      console.log('✅ Réponse envoyée');
      
    } catch (error) {
      console.error('❌ ERREUR CREATE CHILD:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erreur lors de la création: ' + error.message 
      });
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
        status,
        is_active
      } = req.body;

      // Vérifier que l'enfant existe
      const [existingChildren] = await db.execute('SELECT * FROM children WHERE id = ?', [id]);
      if (existingChildren.length === 0) {
        return res.status(404).json({ error: 'Enfant non trouvé' });
      }

      const currentChild = existingChildren[0];

      // Vérifier que le parent existe si fourni
      if (parent_id) {
        const [parents] = await db.execute('SELECT id FROM users WHERE id = ? AND role = "parent"', [parent_id]);
        if (parents.length === 0) {
          return res.status(400).json({ error: 'Parent non trouvé' });
        }
      }

      // Mise à jour avec les valeurs actuelles si non fournies
      const updateValues = {
        first_name: first_name || currentChild.first_name,
        last_name: last_name || currentChild.last_name,
        birth_date: birth_date || currentChild.birth_date,
        gender: gender || currentChild.gender,
        parent_id: parent_id !== undefined ? parent_id : currentChild.parent_id,
        medical_info: medical_info !== undefined ? medical_info : currentChild.medical_info,
        emergency_contact_name: emergency_contact_name !== undefined ? emergency_contact_name : currentChild.emergency_contact_name,
        emergency_contact_phone: emergency_contact_phone !== undefined ? emergency_contact_phone : currentChild.emergency_contact_phone,
        status: status || currentChild.status,
        is_active: is_active !== undefined ? is_active : currentChild.is_active
      };

      await db.execute(`
        UPDATE children SET
          first_name = ?, last_name = ?, birth_date = ?, gender = ?, parent_id = ?,
          medical_info = ?, emergency_contact_name = ?, emergency_contact_phone = ?,
          status = ?, is_active = ?, updated_at = NOW()
        WHERE id = ?
      `, [
        updateValues.first_name,
        updateValues.last_name,
        updateValues.birth_date,
        updateValues.gender,
        updateValues.parent_id,
        updateValues.medical_info,
        updateValues.emergency_contact_name,
        updateValues.emergency_contact_phone,
        updateValues.status,
        updateValues.is_active,
        id
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
        success: true,
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

      console.log('📋 Récupération des enfants pour le parent:', parentId);
      console.log('🔐 Vérification permissions:', { userRole: req.user.role, userId: req.user.id, requestedParentId: parentId });

      // Vérifier les permissions
      if (req.user.role !== 'admin' && req.user.role !== 'staff' && req.user.id != parentId) {
        return res.status(403).json({ error: 'Accès non autorisé' });
      }

      // Récupérer les enfants via la table enrollments (seulement les approuvés)
      const [children] = await db.execute(`
        SELECT c.*, e.status as enrollment_status, e.created_at as enrollment_date
        FROM children c 
        INNER JOIN enrollments e ON c.id = e.child_id
        WHERE e.parent_id = ? AND e.status = 'approved' AND c.is_active = TRUE
        ORDER BY c.first_name, c.last_name
      `, [parentId]);

      console.log('✅', children.length, 'enfants approuvés trouvés pour le parent', parentId);

      res.json({
        success: true,
        children: children.map(child => ({
          ...child,
          age: calculateAge(child.birth_date)
        }))
      });
    } catch (error) {
      console.error('❌ Erreur récupération enfants parent:', error);
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

  // Associer un enfant à un parent existant via enrollment
  associateChildToParent: async (req, res) => {
    try {
      const { childId } = req.params;
      const { parentId } = req.body;

      // Vérifier que l'enfant existe et n'a pas déjà d'enrollment actif
      const [children] = await db.execute(
        'SELECT id FROM children WHERE id = ?',
        [childId]
      );

      if (children.length === 0) {
        return res.status(404).json({ error: 'Enfant non trouvé' });
      }

      // Vérifier s'il y a déjà un enrollment actif
      const [existingEnrollment] = await db.execute(
        'SELECT id FROM enrollments WHERE child_id = ? AND status = "approved"',
        [childId]
      );

      if (existingEnrollment.length > 0) {
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

      // Créer un enrollment approuvé
      await db.execute(
        'INSERT INTO enrollments (child_id, parent_id, status, enrollment_date, created_at) VALUES (?, ?, "approved", NOW(), NOW())',
        [childId, parentId]
      );

      // Récupérer l'enfant mis à jour avec son parent
      const [updatedChild] = await db.execute(`
        SELECT 
          c.*,
          p.first_name as parent_first_name,
          p.last_name as parent_last_name,
          p.email as parent_email,
          p.phone as parent_phone,
          e.status as enrollment_status
        FROM children c
        LEFT JOIN enrollments e ON c.id = e.child_id
        LEFT JOIN users p ON e.parent_id = p.id
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
  },

  // Désactiver le compte parent d'un enfant
  deactivateParent: async (req, res) => {
    try {
      const { id } = req.params;
      
      console.log('🔒 Désactivation du parent pour l\'enfant ID:', id);

      // Récupérer l'enfant et son parent
      const [children] = await db.execute(
        'SELECT * FROM children WHERE id = ?',
        [id]
      );

      if (children.length === 0) {
        return res.status(404).json({ error: 'Enfant non trouvé' });
      }

      const child = children[0];
      
      if (!child.parent_id) {
        return res.status(400).json({ error: 'Cet enfant n\'a pas de parent associé' });
      }

      // Désactiver le compte parent
      await db.execute(
        'UPDATE users SET is_active = 0, updated_at = NOW() WHERE id = ?',
        [child.parent_id]
      );

      // Optionnel : Marquer l'enfant comme inactif aussi
      await db.execute(
        'UPDATE children SET is_active = 0, updated_at = NOW() WHERE id = ?',
        [id]
      );

      console.log('✅ Compte parent désactivé avec succès');

      res.json({
        success: true,
        message: 'Compte parent désactivé avec succès',
        childId: id,
        parentId: child.parent_id
      });

    } catch (error) {
      console.error('❌ Erreur désactivation parent:', error);
      res.status(500).json({ error: 'Erreur lors de la désactivation du compte parent' });
    }
  }
};

module.exports = childrenController;
