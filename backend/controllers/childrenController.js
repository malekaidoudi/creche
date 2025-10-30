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
  // Obtenir tous les enfants avec leurs parents via enrollments
  getAllChildren: async (req, res) => {
    try {
      const { page = 1, limit = 20, search = '', status = 'all', age = 'all' } = req.query;
      const offset = (page - 1) * limit;

      // Construction des conditions WHERE
      let whereConditions = ['c.is_active = true'];
      let params = [];
      let paramCount = 0;

      if (search) {
        paramCount++;
        whereConditions.push(`(c.first_name ILIKE $${paramCount} OR c.last_name ILIKE $${paramCount})`);
        params.push(`%${search}%`);
      }

      if (status !== 'all') {
        paramCount++;
        whereConditions.push(`e.status = $${paramCount}`);
        params.push(status);
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
          e.status as enrollment_status,
          EXTRACT(YEAR FROM AGE(c.birth_date)) as age
        FROM children c
        LEFT JOIN enrollments e ON c.id = e.child_id
        LEFT JOIN users p ON e.parent_id = p.id
        WHERE ${whereClause}
        ORDER BY c.created_at DESC
        LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
      `;

      params.push(parseInt(limit), parseInt(offset));

      console.log('🔍 Requête enfants:', query);
      console.log('🔍 Paramètres:', params);

      const childrenResult = await db.query(query, params);
      const children = childrenResult.rows;

      // Compter le total avec les mêmes filtres
      const countQuery = `
        SELECT COUNT(*) as total 
        FROM children c
        LEFT JOIN enrollments e ON c.id = e.child_id
        LEFT JOIN users p ON e.parent_id = p.id
        WHERE ${whereClause}
      `;
      const countResult = await db.query(countQuery, params.slice(0, paramCount));
      const total = parseInt(countResult.rows[0].total);

      // Formater les données pour inclure les informations parent
      const formattedChildren = children.map(child => ({
        ...child,
        age: calculateAge(child.birth_date),
        parent: child.parent_first_name ? {
          first_name: child.parent_first_name,
          last_name: child.parent_last_name,
          email: child.parent_email,
          phone: child.parent_phone
        } : null
      }));

      res.json({
        success: true,
        data: {
          children: formattedChildren,
          total,
          totalPages: Math.ceil(total / limit),
          currentPage: parseInt(page)
        }
      });

    } catch (error) {
      console.error('❌ Erreur récupération enfants:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erreur serveur: ' + error.message 
      });
    }
  },

  // Obtenir un enfant par ID avec son parent
  getChildById: async (req, res) => {
    try {
      const { id } = req.params;

      const childrenResult = await db.query(`
        SELECT c.*, 
               p.first_name as parent_first_name,
               p.last_name as parent_last_name,
               p.email as parent_email,
               p.phone as parent_phone,
               EXTRACT(YEAR FROM AGE(c.birth_date)) as age,
               e.status as enrollment_status
        FROM children c
        LEFT JOIN enrollments e ON c.id = e.child_id
        LEFT JOIN users p ON e.parent_id = p.id
        WHERE c.id = $1
      `, [id]);
      
      const children = childrenResult.rows;

      if (children.length === 0) {
        return res.status(404).json({ 
          success: false, 
          error: 'Enfant non trouvé' 
        });
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
      console.error('❌ Erreur récupération enfant:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erreur serveur: ' + error.message 
      });
    }
  },

  // Créer un nouvel enfant
  createChild: async (req, res) => {
    console.log('=== DEBUT CREATE CHILD ===');
    
    try {
      const { first_name, last_name, birth_date, gender, medical_info, emergency_contact_name, emergency_contact_phone } = req.body;
      
      console.log('Données reçues:', { first_name, last_name, birth_date, gender });
      
      // Validation simple
      if (!first_name || !last_name || !birth_date || !gender) {
        console.log('❌ Validation échouée');
        return res.status(400).json({ 
          success: false, 
          error: 'Champs requis manquants: first_name, last_name, birth_date, gender' 
        });
      }
      
      console.log('✅ Validation OK');
      
      // Insertion
      console.log('Insertion en cours...');
      const result = await db.query(
        'INSERT INTO children (first_name, last_name, birth_date, gender, medical_info, emergency_contact_name, emergency_contact_phone, is_active) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id',
        [first_name, last_name, birth_date, gender, medical_info || '', emergency_contact_name || '', emergency_contact_phone || '', true]
      );
      
      const insertId = result.rows[0].id;
      console.log('✅ Insertion réussie, ID:', insertId);
      
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

  // Associer un enfant à un parent via enrollments
  associateChildToParent: async (req, res) => {
    try {
      const { childId, parentId } = req.body;

      console.log('🔗 Association enfant-parent:', { childId, parentId });

      // Vérifier que l'enfant existe
      const childResult = await db.query('SELECT * FROM children WHERE id = $1', [childId]);
      if (childResult.rows.length === 0) {
        return res.status(404).json({ 
          success: false, 
          error: 'Enfant non trouvé' 
        });
      }

      // Vérifier que le parent existe
      const parentResult = await db.query('SELECT id FROM users WHERE id = $1 AND role = $2', [parentId, 'parent']);
      if (parentResult.rows.length === 0) {
        return res.status(400).json({ 
          success: false, 
          error: 'Parent non trouvé' 
        });
      }

      // Vérifier s'il existe déjà un enrollment pour cet enfant
      const existingEnrollment = await db.query(
        'SELECT id FROM enrollments WHERE child_id = $1', 
        [childId]
      );

      if (existingEnrollment.rows.length > 0) {
        // Mettre à jour l'enrollment existant
        await db.query(
          'UPDATE enrollments SET parent_id = $1, status = $2, updated_at = NOW() WHERE child_id = $3',
          [parentId, 'approved', childId]
        );
        console.log('✅ Enrollment mis à jour');
      } else {
        // Créer un nouvel enrollment
        await db.query(
          'INSERT INTO enrollments (parent_id, child_id, status, enrollment_date, lunch_assistance, regulation_accepted, created_at) VALUES ($1, $2, $3, CURRENT_DATE, $4, $5, NOW())',
          [parentId, childId, 'approved', true, true]
        );
        console.log('✅ Nouvel enrollment créé');
      }

      res.json({
        success: true,
        message: 'Enfant associé au parent avec succès'
      });

    } catch (error) {
      console.error('❌ Erreur association enfant-parent:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erreur serveur: ' + error.message 
      });
    }
  },

  // Mettre à jour un enfant (sans toucher aux enrollments)
  updateChild: async (req, res) => {
    try {
      const { id } = req.params;
      const {
        first_name,
        last_name,
        birth_date,
        gender,
        medical_info,
        emergency_contact_name,
        emergency_contact_phone,
        is_active
      } = req.body;

      // Vérifier que l'enfant existe
      const existingChild = await db.query('SELECT * FROM children WHERE id = $1', [id]);
      if (existingChild.rows.length === 0) {
        return res.status(404).json({ 
          success: false, 
          error: 'Enfant non trouvé' 
        });
      }

      const currentChild = existingChild.rows[0];

      // Construire la requête de mise à jour dynamiquement
      const updates = [];
      const params = [];
      let paramCount = 0;

      if (first_name !== undefined) {
        paramCount++;
        updates.push(`first_name = $${paramCount}`);
        params.push(first_name);
      }

      if (last_name !== undefined) {
        paramCount++;
        updates.push(`last_name = $${paramCount}`);
        params.push(last_name);
      }

      if (birth_date !== undefined) {
        paramCount++;
        updates.push(`birth_date = $${paramCount}`);
        params.push(birth_date);
      }

      if (gender !== undefined) {
        paramCount++;
        updates.push(`gender = $${paramCount}`);
        params.push(gender);
      }

      if (medical_info !== undefined) {
        paramCount++;
        updates.push(`medical_info = $${paramCount}`);
        params.push(medical_info);
      }

      if (emergency_contact_name !== undefined) {
        paramCount++;
        updates.push(`emergency_contact_name = $${paramCount}`);
        params.push(emergency_contact_name);
      }

      if (emergency_contact_phone !== undefined) {
        paramCount++;
        updates.push(`emergency_contact_phone = $${paramCount}`);
        params.push(emergency_contact_phone);
      }

      if (is_active !== undefined) {
        paramCount++;
        updates.push(`is_active = $${paramCount}`);
        params.push(is_active);
      }

      if (updates.length === 0) {
        return res.status(400).json({ 
          success: false,
          error: 'Aucune donnée à mettre à jour' 
        });
      }

      // Ajouter updated_at
      paramCount++;
      updates.push(`updated_at = $${paramCount}`);
      params.push(new Date());

      // Ajouter l'ID pour la clause WHERE
      paramCount++;
      params.push(id);

      const updateQuery = `
        UPDATE children 
        SET ${updates.join(', ')} 
        WHERE id = $${paramCount}
        RETURNING *
      `;

      const result = await db.query(updateQuery, params);

      res.json({
        success: true,
        message: 'Enfant mis à jour avec succès',
        child: result.rows[0]
      });

    } catch (error) {
      console.error('❌ Erreur mise à jour enfant:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erreur serveur: ' + error.message 
      });
    }
  }
};

module.exports = childrenController;
