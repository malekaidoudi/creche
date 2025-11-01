const db = require('../config/db_postgres');

const childrenController = {
  
  // GET /api/children - Liste des enfants actifs avec parents
  getAllChildren: async (req, res) => {
    try {
      const { page = 1, limit = 20, search = '', status = 'active' } = req.query;
      const offset = (page - 1) * limit;
      
      let whereConditions = [];
      let params = [];
      let paramCount = 0;
      
      // Filtrer par statut
      if (status === 'active') {
        whereConditions.push('c.is_active = true');
      } else if (status === 'archived') {
        whereConditions.push('c.is_active = false');
      }
      
      // Recherche
      if (search) {
        paramCount++;
        whereConditions.push(`(
          c.first_name ILIKE $${paramCount} OR 
          c.last_name ILIKE $${paramCount} OR
          u.first_name ILIKE $${paramCount} OR
          u.last_name ILIKE $${paramCount} OR
          u.email ILIKE $${paramCount}
        )`);
        params.push(`%${search}%`);
      }
      
      const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';
      
      // NOUVELLE REQUÊTE: Utilise enrollments approuvés pour liaison parent-enfant
      const query = `
        SELECT 
          c.*,
          EXTRACT(YEAR FROM AGE(c.birth_date)) as age,
          u.id as parent_id,
          u.first_name as parent_first_name,
          u.last_name as parent_last_name,
          u.email as parent_email,
          u.phone as parent_phone,
          e.enrollment_date,
          e.new_status as enrollment_status,
          COUNT(cd.id) as documents_count
        FROM children c
        LEFT JOIN enrollments e ON c.id = e.child_id AND e.new_status = 'approved'
        LEFT JOIN users u ON e.parent_id = u.id
        LEFT JOIN children_documents cd ON c.id = cd.child_id
        ${whereClause}
        GROUP BY c.id, u.id, e.enrollment_date, e.new_status
        ORDER BY c.created_at DESC
        LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
      `;
      
      params.push(parseInt(limit), parseInt(offset));
      
      const result = await db.query(query, params);
      
      // Compter le total
      const countQuery = `
        SELECT COUNT(DISTINCT c.id) as total
        FROM children c
        LEFT JOIN enrollments e ON c.id = e.child_id AND e.new_status = 'approved'
        LEFT JOIN users u ON e.parent_id = u.id
        ${whereClause}
      `;
      
      const countResult = await db.query(countQuery, params.slice(0, paramCount));
      const total = parseInt(countResult.rows[0].total);
      
      res.json({
        success: true,
        data: {
          children: result.rows,
          pagination: {
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(total / limit)
          }
        }
      });
      
    } catch (error) {
      console.error('❌ Erreur getAllChildren:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des enfants',
        details: error.message
      });
    }
  },
  
  // GET /api/children/:id - Détails d'un enfant
  getChildById: async (req, res) => {
    try {
      const { id } = req.params;
      
      const query = `
        SELECT 
          c.*,
          EXTRACT(YEAR FROM AGE(c.birth_date)) as age,
          u.id as parent_id,
          u.first_name as parent_first_name,
          u.last_name as parent_last_name,
          u.email as parent_email,
          u.phone as parent_phone,
          e.enrollment_date,
          e.new_status as enrollment_status,
          e.lunch_assistance,
          e.regulation_accepted
        FROM children c
        LEFT JOIN enrollments e ON c.id = e.child_id AND e.new_status = 'approved'
        LEFT JOIN users u ON e.parent_id = u.id
        WHERE c.id = $1
      `;
      
      const result = await db.query(query, [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Enfant non trouvé'
        });
      }
      
      // Récupérer les documents
      const documentsQuery = `
        SELECT id, filename, original_filename, document_type, file_size, uploaded_at
        FROM children_documents
        WHERE child_id = $1
        ORDER BY uploaded_at DESC
      `;
      
      const documentsResult = await db.query(documentsQuery, [id]);
      
      res.json({
        success: true,
        child: result.rows[0],
        documents: documentsResult.rows
      });
      
    } catch (error) {
      console.error('❌ Erreur getChildById:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération de l\'enfant'
      });
    }
  },
  
  // POST /api/children - Créer enfant (DÉPRÉCIÉ - utiliser workflow enrollments)
  createChild: async (req, res) => {
    res.status(410).json({
      success: false,
      error: 'Endpoint déprécié',
      message: 'Utilisez le workflow d\'inscription: POST /api/enrollments puis approbation',
      new_workflow: {
        step1: 'POST /api/enrollments - Soumission dossier',
        step2: 'POST /api/enrollments/:id/approve - Approbation (crée enfant + parent)'
      }
    });
  },
  
  // PUT /api/children/:id - Modifier enfant
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
        emergency_contact_phone
      } = req.body;
      
      // Vérifier que l'enfant existe
      const existingChild = await db.query('SELECT id FROM children WHERE id = $1', [id]);
      if (existingChild.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Enfant non trouvé'
        });
      }
      
      const updateQuery = `
        UPDATE children 
        SET first_name = $1, last_name = $2, birth_date = $3, gender = $4,
            medical_info = $5, emergency_contact_name = $6, emergency_contact_phone = $7,
            updated_at = NOW()
        WHERE id = $8
        RETURNING *
      `;
      
      const result = await db.query(updateQuery, [
        first_name, last_name, birth_date, gender,
        medical_info, emergency_contact_name, emergency_contact_phone, id
      ]);
      
      res.json({
        success: true,
        message: 'Enfant mis à jour avec succès',
        child: result.rows[0]
      });
      
    } catch (error) {
      console.error('❌ Erreur updateChild:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la mise à jour de l\'enfant'
      });
    }
  },
  
  // DELETE /api/children/:id - Archiver enfant (soft delete)
  archiveChild: async (req, res) => {
    const client = await db.connect();
    
    try {
      await client.query('BEGIN');
      
      const { id } = req.params;
      const { reason = 'Départ de l\'établissement' } = req.body;
      
      // Vérifier que l'enfant existe et est actif
      const child = await client.query(
        'SELECT * FROM children WHERE id = $1 AND is_active = true',
        [id]
      );
      
      if (child.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Enfant non trouvé ou déjà archivé'
        });
      }
      
      // Archiver dans children_archive
      await client.query(`
        INSERT INTO children_archive 
        SELECT *, NOW() as archived_at, $1 as archived_by, $2 as archive_reason
        FROM children WHERE id = $3
      `, [req.user.id, reason, id]);
      
      // Marquer comme inactif
      await client.query(`
        UPDATE children 
        SET is_active = false, archived_at = NOW(), archived_by = $1, archive_reason = $2
        WHERE id = $3
      `, [req.user.id, reason, id]);
      
      // Archiver l'enrollment associé
      await client.query(`
        UPDATE enrollments 
        SET new_status = 'archived', updated_at = NOW()
        WHERE child_id = $1 AND new_status = 'approved'
      `, [id]);
      
      await client.query('COMMIT');
      
      res.json({
        success: true,
        message: 'Enfant archivé avec succès',
        archived_child: child.rows[0]
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Erreur archiveChild:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de l\'archivage de l\'enfant'
      });
    } finally {
      client.release();
    }
  },
  
  // POST /api/children/:id/restore - Restaurer enfant archivé
  restoreChild: async (req, res) => {
    try {
      const { id } = req.params;
      
      const result = await db.query(`
        UPDATE children 
        SET is_active = true, archived_at = NULL, archived_by = NULL, archive_reason = NULL
        WHERE id = $1 AND is_active = false
        RETURNING *
      `, [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Enfant non trouvé ou déjà actif'
        });
      }
      
      // Restaurer l'enrollment
      await db.query(`
        UPDATE enrollments 
        SET new_status = 'approved', updated_at = NOW()
        WHERE child_id = $1 AND new_status = 'archived'
      `, [id]);
      
      res.json({
        success: true,
        message: 'Enfant restauré avec succès',
        child: result.rows[0]
      });
      
    } catch (error) {
      console.error('❌ Erreur restoreChild:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la restauration de l\'enfant'
      });
    }
  },
  
  // GET /api/children/orphans - Enfants sans parents (pour debug)
  getOrphans: async (req, res) => {
    try {
      const query = `
        SELECT c.*, 'Aucun enrollment approuvé' as reason
        FROM children c
        LEFT JOIN enrollments e ON c.id = e.child_id AND e.new_status = 'approved'
        WHERE c.is_active = true AND e.child_id IS NULL
        ORDER BY c.created_at DESC
      `;
      
      const result = await db.query(query);
      
      res.json({
        success: true,
        orphans: result.rows,
        count: result.rows.length,
        message: result.rows.length === 0 
          ? 'Tous les enfants ont des parents associés' 
          : 'Enfants sans parents trouvés'
      });
      
    } catch (error) {
      console.error('❌ Erreur getOrphans:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la recherche d\'orphelins'
      });
    }
  }
};

module.exports = childrenController;
