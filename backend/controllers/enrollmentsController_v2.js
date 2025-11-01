const db = require('../config/db_postgres');
const multer = require('multer');
const path = require('path');

// Configuration upload
const upload = multer({
  dest: 'uploads/enrollments/',
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'application/pdf'];
    cb(null, allowed.includes(file.mimetype));
  }
});

const enrollmentsController = {
  
  // POST /api/enrollments - Création dossier visiteur
  createEnrollment: async (req, res) => {
    const client = await db.connect();
    try {
      await client.query('BEGIN');
      
      const {
        applicant_first_name, applicant_last_name, applicant_email, applicant_phone,
        child_first_name, child_last_name, child_birth_date, child_gender
      } = req.body;
      
      // Validation
      if (!applicant_email || !child_first_name) {
        return res.status(400).json({ success: false, error: 'Champs requis manquants' });
      }
      
      // Créer enrollment
      const result = await client.query(`
        INSERT INTO enrollments (
          applicant_first_name, applicant_last_name, applicant_email, applicant_phone,
          child_first_name, child_last_name, child_birth_date, child_gender,
          new_status, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', NOW())
        RETURNING id, new_status
      `, [applicant_first_name, applicant_last_name, applicant_email, applicant_phone,
          child_first_name, child_last_name, child_birth_date, child_gender]);
      
      await client.query('COMMIT');
      
      res.status(201).json({
        success: true,
        enrollment: result.rows[0],
        message: 'Dossier créé avec succès'
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      res.status(500).json({ success: false, error: error.message });
    } finally {
      client.release();
    }
  },
  
  // POST /api/enrollments/:id/approve - Approbation (TRANSACTION ATOMIQUE)
  approveEnrollment: async (req, res) => {
    const client = await db.connect();
    try {
      await client.query('BEGIN');
      
      const { id } = req.params;
      
      // 1. Récupérer enrollment
      const enrollment = await client.query(
        'SELECT * FROM enrollments WHERE id = $1 FOR UPDATE', [id]
      );
      
      if (!enrollment.rows[0]) {
        return res.status(404).json({ success: false, error: 'Dossier non trouvé' });
      }
      
      const e = enrollment.rows[0];
      
      // 2. Créer/trouver parent
      let parent = await client.query('SELECT * FROM users WHERE email = $1', [e.applicant_email]);
      
      if (parent.rows.length === 0) {
        const parentResult = await client.query(`
          INSERT INTO users (email, first_name, last_name, role, is_active, created_at)
          VALUES ($1, $2, $3, 'parent', true, NOW()) RETURNING id
        `, [e.applicant_email, e.applicant_first_name, e.applicant_last_name]);
        parent = parentResult;
      }
      
      const parentId = parent.rows[0].id;
      
      // 3. Créer enfant
      const childResult = await client.query(`
        INSERT INTO children (first_name, last_name, birth_date, gender, medical_info, 
                             emergency_contact_name, emergency_contact_phone, is_active, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, true, NOW()) RETURNING id
      `, [e.child_first_name, e.child_last_name, e.child_birth_date, e.child_gender,
          e.child_medical_info, e.emergency_contact_name, e.emergency_contact_phone]);
      
      const childId = childResult.rows[0].id;
      
      // 4. Transférer documents
      await client.query(`
        INSERT INTO children_documents (child_id, filename, original_filename, file_path, 
                                       mime_type, document_type, uploaded_at)
        SELECT $1, filename, original_filename, file_path, mime_type, document_type, uploaded_at
        FROM enrollment_documents WHERE enrollment_id = $2
      `, [childId, id]);
      
      // 5. Marquer enrollment approuvé
      await client.query(`
        UPDATE enrollments 
        SET new_status = 'approved', parent_id = $1, child_id = $2, 
            approved_by = $3, approved_at = NOW(), updated_at = NOW()
        WHERE id = $4
      `, [parentId, childId, req.user.id, id]);
      
      await client.query('COMMIT');
      
      res.json({
        success: true,
        message: 'Dossier approuvé avec succès',
        parent_id: parentId,
        child_id: childId
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      res.status(500).json({ success: false, error: error.message });
    } finally {
      client.release();
    }
  },
  
  // GET /api/enrollments - Liste dossiers
  getAllEnrollments: async (req, res) => {
    try {
      const { status = 'all', page = 1, limit = 20 } = req.query;
      const offset = (page - 1) * limit;
      
      let whereClause = '1=1';
      let params = [];
      
      if (status !== 'all') {
        whereClause = 'e.new_status = $1';
        params.push(status);
      }
      
      const query = `
        SELECT e.*, COUNT(ed.id) as documents_count
        FROM enrollments e
        LEFT JOIN enrollment_documents ed ON e.id = ed.enrollment_id
        WHERE ${whereClause}
        GROUP BY e.id
        ORDER BY e.created_at DESC
        LIMIT $${params.length + 1} OFFSET $${params.length + 2}
      `;
      
      params.push(limit, offset);
      
      const result = await db.query(query, params);
      
      res.json({
        success: true,
        enrollments: result.rows
      });
      
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },
  
  // PUT /api/enrollments/:id/reject
  rejectEnrollment: async (req, res) => {
    try {
      const { id } = req.params;
      const { reason, type = 'incomplete' } = req.body;
      
      const status = type === 'delete' ? 'rejected_deleted' : 'rejected_incomplete';
      
      await db.query(`
        UPDATE enrollments 
        SET new_status = $1, decision_notes = $2, rejected_by = $3, rejected_at = NOW()
        WHERE id = $4
      `, [status, reason, req.user.id, id]);
      
      res.json({
        success: true,
        message: 'Dossier rejeté',
        status
      });
      
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
};

module.exports = enrollmentsController;
