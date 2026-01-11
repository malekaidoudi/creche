/**
 * ROUTES DOCUMENTS
 * Gestion des documents administratifs, enfants et archives
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../config/db_postgres');
const auth = require('../middleware/auth');
const cloudinaryService = require('../services/cloudinaryService');

// Configuration multer pour upload temporaire
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../uploads/temp');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Type de fichier non autorisé. Utilisez PDF, JPEG ou PNG.'));
        }
    }
});

// =====================================================
// DOCUMENTS ADMINISTRATIFS (Templates)
// =====================================================

/**
 * GET /api/documents/admin
 * Liste des documents administratifs (templates pour inscription)
 */
router.get('/admin', auth.authenticateToken, async (req, res) => {
    try {
        const result = await db.query(`
      SELECT 
        ad.*,
        u.first_name || ' ' || u.last_name as uploaded_by_name
      FROM admin_documents ad
      LEFT JOIN users u ON ad.uploaded_by = u.id
      ORDER BY ad.created_at DESC
    `);

        res.json({
            success: true,
            documents: result.rows,
            count: result.rows.length
        });
    } catch (error) {
        console.error('❌ Erreur GET /api/documents/admin:', error);
        res.status(500).json({ success: false, error: 'Erreur serveur' });
    }
});

/**
 * POST /api/documents/admin
 * Upload d'un document administratif (admin only)
 */
router.post('/admin',
    auth.authenticateToken,
    auth.requireRole('admin'),
    upload.single('document'),
    async (req, res) => {
        try {
            const { title, description, document_type, is_public, is_required } = req.body;
            const file = req.file;

            if (!file || !title) {
                return res.status(400).json({
                    success: false,
                    error: 'Titre et fichier requis'
                });
            }

            // Upload vers Cloudinary
            let cloudinaryUrl = null;
            let cloudinaryPublicId = null;

            if (cloudinaryService.isConfigured()) {
                const uploadResult = await cloudinaryService.uploadFile(
                    file.path,
                    `admin_documents/${document_type || 'general'}`
                );
                if (uploadResult.success) {
                    cloudinaryUrl = uploadResult.url;
                    cloudinaryPublicId = uploadResult.publicId;
                } else {
                    console.error('❌ Erreur upload Cloudinary:', uploadResult.error);
                }

                // Supprimer fichier local
                fs.unlinkSync(file.path);
            }

            const result = await db.query(`
        INSERT INTO admin_documents (
          title, description, document_type, original_filename,
          cloudinary_url, cloudinary_public_id, file_size, mime_type,
          is_public, is_required, uploaded_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `, [
                title,
                description || null,
                document_type || 'general',
                file.originalname,
                cloudinaryUrl,
                cloudinaryPublicId,
                file.size,
                file.mimetype,
                is_public === 'true' || is_public === true,
                is_required === 'true' || is_required === true,
                req.user.id
            ]);

            res.json({
                success: true,
                message: 'Document administratif ajouté',
                document: result.rows[0]
            });
        } catch (error) {
            console.error('❌ Erreur POST /api/documents/admin:', error);
            res.status(500).json({ success: false, error: 'Erreur serveur' });
        }
    }
);

/**
 * DELETE /api/documents/admin/:id
 * Supprimer un document administratif (admin only)
 */
router.delete('/admin/:id',
    auth.authenticateToken,
    auth.requireRole('admin'),
    async (req, res) => {
        try {
            const { id } = req.params;

            // Récupérer le document pour supprimer de Cloudinary
            const docResult = await db.query(
                'SELECT cloudinary_public_id FROM admin_documents WHERE id = $1',
                [id]
            );

            if (docResult.rows.length === 0) {
                return res.status(404).json({ success: false, error: 'Document non trouvé' });
            }

            // Supprimer de Cloudinary si configuré
            if (docResult.rows[0].cloudinary_public_id && cloudinaryService.isConfigured()) {
                await cloudinaryService.deleteFile(docResult.rows[0].cloudinary_public_id);
            }

            // Supprimer de la base
            await db.query('DELETE FROM admin_documents WHERE id = $1', [id]);

            res.json({ success: true, message: 'Document supprimé' });
        } catch (error) {
            console.error('❌ Erreur DELETE /api/documents/admin/:id:', error);
            res.status(500).json({ success: false, error: 'Erreur serveur' });
        }
    }
);

/**
 * GET /api/documents/admin/:id/download
 * Générer une URL signée avec expiration pour télécharger un document PDF
 */
router.get('/admin/:id/download', auth.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await db.query(
            'SELECT cloudinary_public_id, cloudinary_url, original_filename, mime_type FROM admin_documents WHERE id = $1',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Document non trouvé' });
        }

        const doc = result.rows[0];

        if (!doc.cloudinary_url) {
            return res.status(400).json({ success: false, error: 'Document non disponible' });
        }

        // Retourner l'URL directe (PDF delivery activé sur Cloudinary)
        res.json({
            success: true,
            url: doc.cloudinary_url,
            filename: doc.original_filename
        });
    } catch (error) {
        console.error('❌ Erreur GET /api/documents/admin/:id/download:', error);
        res.status(500).json({ success: false, error: 'Erreur serveur' });
    }
});

/**
 * GET /api/documents/public/reglement
 * Récupérer le dernier règlement intérieur (accessible sans authentification)
 */
router.get('/public/reglement', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT cloudinary_url, original_filename 
            FROM admin_documents 
            WHERE document_type = 'reglement' 
            ORDER BY created_at DESC 
            LIMIT 1
        `);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Règlement non disponible'
            });
        }

        const doc = result.rows[0];

        res.json({
            success: true,
            url: doc.cloudinary_url,
            filename: doc.original_filename || 'reglement-interieur.pdf'
        });
    } catch (error) {
        console.error('❌ Erreur GET /api/documents/public/reglement:', error);
        res.status(500).json({ success: false, error: 'Erreur serveur' });
    }
});

// =====================================================
// DOCUMENTS ENFANTS (Enfants inscrits actifs)
// =====================================================

/**
 * GET /api/documents/children
 * Liste des documents de tous les enfants actifs
 */
router.get('/children', auth.authenticateToken, async (req, res) => {
    try {
        const result = await db.query(`
      SELECT 
        cd.*,
        c.first_name as child_first_name,
        c.last_name as child_last_name,
        u.first_name || ' ' || u.last_name as parent_name,
        uploader.first_name || ' ' || uploader.last_name as uploaded_by_name
      FROM children_documents cd
      JOIN children c ON cd.child_id = c.id
      LEFT JOIN users u ON c.parent_id = u.id
      LEFT JOIN users uploader ON cd.uploaded_by = uploader.id
      WHERE c.is_active = true
      ORDER BY c.first_name, c.last_name, cd.document_type
    `);

        res.json({
            success: true,
            documents: result.rows,
            count: result.rows.length
        });
    } catch (error) {
        console.error('❌ Erreur GET /api/documents/children:', error);
        res.status(500).json({ success: false, error: 'Erreur serveur' });
    }
});

/**
 * GET /api/documents/children/:childId
 * Documents d'un enfant spécifique
 */
router.get('/children/:childId', auth.authenticateToken, async (req, res) => {
    try {
        const { childId } = req.params;

        const result = await db.query(`
      SELECT 
        cd.*,
        c.first_name as child_first_name,
        c.last_name as child_last_name,
        uploader.first_name || ' ' || uploader.last_name as uploaded_by_name
      FROM children_documents cd
      JOIN children c ON cd.child_id = c.id
      LEFT JOIN users uploader ON cd.uploaded_by = uploader.id
      WHERE cd.child_id = $1
      ORDER BY cd.document_type
    `, [childId]);

        res.json({
            success: true,
            documents: result.rows,
            count: result.rows.length
        });
    } catch (error) {
        console.error('❌ Erreur GET /api/documents/children/:childId:', error);
        res.status(500).json({ success: false, error: 'Erreur serveur' });
    }
});

/**
 * POST /api/documents/children/:childId
 * Upload d'un document pour un enfant
 */
router.post('/children/:childId',
    auth.authenticateToken,
    upload.single('document'),
    async (req, res) => {
        try {
            const { childId } = req.params;
            const { document_type, notes } = req.body;
            const file = req.file;

            if (!file) {
                return res.status(400).json({ success: false, error: 'Fichier requis' });
            }

            // Vérifier que l'enfant existe
            const childCheck = await db.query('SELECT id FROM children WHERE id = $1', [childId]);
            if (childCheck.rows.length === 0) {
                fs.unlinkSync(file.path);
                return res.status(404).json({ success: false, error: 'Enfant non trouvé' });
            }

            // Upload vers Cloudinary
            let cloudinaryUrl = null;
            let cloudinaryPublicId = null;

            console.log('📤 Cloudinary configuré:', cloudinaryService.isConfigured());

            if (cloudinaryService.isConfigured()) {
                console.log('📤 Tentative upload vers Cloudinary:', file.path);
                const uploadResult = await cloudinaryService.uploadFile(
                    file.path,
                    `children/child_${childId}`
                );
                console.log('📤 Résultat upload Cloudinary:', uploadResult);
                if (uploadResult.success) {
                    cloudinaryUrl = uploadResult.url;
                    cloudinaryPublicId = uploadResult.publicId;
                    console.log('✅ Upload Cloudinary réussi:', cloudinaryUrl);
                } else {
                    console.error('❌ Upload Cloudinary échoué:', uploadResult.error);
                }
                fs.unlinkSync(file.path);
            } else {
                console.log('⚠️ Cloudinary non configuré, fichier stocké localement');
            }

            // Supprimer l'entrée "Dossier non disponible" si elle existe
            await db.query(`
                DELETE FROM children_documents 
                WHERE child_id = $1 AND document_type = 'dossier_complet' AND cloudinary_url IS NULL
            `, [childId]);

            const result = await db.query(`
        INSERT INTO children_documents (
          child_id, filename, original_filename, file_path,
          mime_type, file_size, document_type, uploaded_by,
          uploaded_at, notes, cloudinary_url, cloudinary_public_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), $9, $10, $11)
        RETURNING *
      `, [
                childId,
                file.filename,
                file.originalname,
                cloudinaryUrl || file.path,
                file.mimetype,
                file.size,
                document_type || 'other',
                req.user.id,
                notes || null,
                cloudinaryUrl,
                cloudinaryPublicId
            ]);

            res.json({
                success: true,
                message: 'Document ajouté',
                document: result.rows[0]
            });
        } catch (error) {
            console.error('❌ Erreur POST /api/documents/children/:childId:', error);
            res.status(500).json({ success: false, error: 'Erreur serveur' });
        }
    }
);

// =====================================================
// DOCUMENTS ARCHIVES (Enfants partis)
// =====================================================

/**
 * GET /api/documents/archives
 * Liste des documents archivés (enfants partis)
 */
router.get('/archives', auth.authenticateToken, async (req, res) => {
    try {
        const result = await db.query(`
      SELECT 
        ad.*,
        ea.applicant_first_name,
        ea.applicant_last_name,
        archiver.first_name || ' ' || archiver.last_name as archived_by_name
      FROM archived_documents ad
      LEFT JOIN enrollments_archive ea ON ad.archive_id = ea.id
      LEFT JOIN users archiver ON ad.archived_by = archiver.id
      ORDER BY ad.archived_at DESC
    `);

        res.json({
            success: true,
            documents: result.rows,
            count: result.rows.length
        });
    } catch (error) {
        console.error('❌ Erreur GET /api/documents/archives:', error);
        res.status(500).json({ success: false, error: 'Erreur serveur' });
    }
});

// =====================================================
// ROUTE PRINCIPALE - TOUS LES DOCUMENTS
// =====================================================

/**
 * GET /api/documents
 * Liste combinée de tous les documents selon le type demandé
 */
router.get('/', auth.authenticateToken, async (req, res) => {
    try {
        const { type = 'all' } = req.query;

        let documents = [];

        if (type === 'all' || type === 'admin') {
            const adminDocs = await db.query(`
        SELECT 
          id, title, description, document_type, original_filename,
          cloudinary_url, file_size, mime_type, is_public, is_required,
          created_at, 'admin' as category
        FROM admin_documents
        ORDER BY created_at DESC
      `);
            documents = [...documents, ...adminDocs.rows];
        }

        if (type === 'all' || type === 'children') {
            // Documents des enfants actifs (children_documents seulement)
            const childrenDocs = await db.query(`
        SELECT 
          cd.id, 
          c.first_name || ' ' || c.last_name || ' - ' || cd.document_type as title,
          cd.notes as description,
          cd.document_type,
          cd.original_filename,
          cd.cloudinary_url,
          cd.file_size,
          cd.mime_type,
          true as is_public,
          false as is_required,
          cd.uploaded_at as created_at,
          'children' as category,
          c.first_name as child_first_name,
          c.last_name as child_last_name,
          cd.child_id
        FROM children_documents cd
        JOIN children c ON cd.child_id = c.id
        WHERE c.is_active = true
        ORDER BY c.first_name, c.last_name, cd.uploaded_at DESC
      `);
            documents = [...documents, ...childrenDocs.rows];
        }

        if (type === 'all' || type === 'archives') {
            const archiveDocs = await db.query(`
        SELECT 
          ad.id,
          ad.child_first_name || ' ' || ad.child_last_name || ' - ' || ad.document_type as title,
          'Document archivé' as description,
          ad.document_type,
          ad.original_filename,
          ad.cloudinary_url,
          ad.file_size,
          ad.mime_type,
          false as is_public,
          false as is_required,
          ad.archived_at as created_at,
          'archives' as category,
          ad.child_first_name,
          ad.child_last_name,
          ad.archive_id
        FROM archived_documents ad
        ORDER BY ad.archived_at DESC
      `);
            documents = [...documents, ...archiveDocs.rows];
        }

        res.json({
            success: true,
            documents,
            count: documents.length
        });
    } catch (error) {
        console.error('❌ Erreur GET /api/documents:', error);
        res.status(500).json({ success: false, error: 'Erreur serveur' });
    }
});

/**
 * GET /api/documents/stats
 * Statistiques des documents
 */
router.get('/stats', auth.authenticateToken, async (req, res) => {
    try {
        const [adminCount, childrenDocsCount, archivesCount] = await Promise.all([
            db.query('SELECT COUNT(*) as count FROM admin_documents'),
            db.query(`
        SELECT COUNT(*) as count FROM children_documents cd
        JOIN children c ON cd.child_id = c.id
        WHERE c.is_active = true
      `),
            db.query('SELECT COUNT(*) as count FROM archived_documents')
        ]);

        const adminTotal = parseInt(adminCount.rows[0].count);
        const childrenTotal = parseInt(childrenDocsCount.rows[0].count);
        const archivesTotal = parseInt(archivesCount.rows[0].count);

        res.json({
            success: true,
            stats: {
                admin: adminTotal,
                children: childrenTotal,
                archives: archivesTotal,
                total: adminTotal + childrenTotal + archivesTotal
            }
        });
    } catch (error) {
        console.error('❌ Erreur GET /api/documents/stats:', error);
        res.status(500).json({ success: false, error: 'Erreur serveur' });
    }
});

module.exports = router;
