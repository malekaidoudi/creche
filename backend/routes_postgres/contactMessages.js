const express = require('express');
const router = express.Router();
const db = require('../config/db_postgres');
const { authenticateToken } = require('../middleware/auth');
const emailService = require('../emails/emailService');

/**
 * GET /api/admin/contact-messages
 * Récupérer tous les messages de contact (admin uniquement)
 */
router.get('/', authenticateToken, async (req, res) => {
    try {
        // Vérifier que l'utilisateur est admin
        if (req.user.role !== 'admin' && req.user.role !== 'developer') {
            return res.status(403).json({
                success: false,
                error: 'Accès non autorisé'
            });
        }

        const { status, limit = 50, offset = 0 } = req.query;

        let sql = `
      SELECT 
        cm.*,
        u.first_name as responder_first_name,
        u.last_name as responder_last_name
      FROM contact_messages cm
      LEFT JOIN users u ON cm.responded_by = u.id
    `;
        const params = [];
        let paramIndex = 1;

        if (status && status !== 'all') {
            sql += ` WHERE cm.status = $${paramIndex}`;
            params.push(status);
            paramIndex++;
        }

        sql += ` ORDER BY cm.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(parseInt(limit), parseInt(offset));

        const result = await db.query(sql, params);

        // Compter les messages non lus
        const unreadCount = await db.query(
            "SELECT COUNT(*) as count FROM contact_messages WHERE status = 'new'"
        );

        // Compter le total
        let countSql = 'SELECT COUNT(*) as count FROM contact_messages';
        const countParams = [];
        if (status && status !== 'all') {
            countSql += ' WHERE status = $1';
            countParams.push(status);
        }
        const totalCount = await db.query(countSql, countParams);

        res.json({
            success: true,
            messages: result.rows,
            unreadCount: parseInt(unreadCount.rows[0].count),
            total: parseInt(totalCount.rows[0].count),
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

    } catch (error) {
        console.error('❌ Erreur récupération messages contact:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la récupération des messages'
        });
    }
});

/**
 * GET /api/admin/contact-messages/:id
 * Récupérer un message spécifique et le marquer comme lu
 */
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin' && req.user.role !== 'developer') {
            return res.status(403).json({
                success: false,
                error: 'Accès non autorisé'
            });
        }

        const { id } = req.params;

        // Récupérer le message
        const result = await db.query(
            `SELECT cm.*, u.first_name as responder_first_name, u.last_name as responder_last_name
       FROM contact_messages cm
       LEFT JOIN users u ON cm.responded_by = u.id
       WHERE cm.id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Message non trouvé'
            });
        }

        // Marquer comme lu si c'est nouveau
        if (result.rows[0].status === 'new') {
            await db.query(
                "UPDATE contact_messages SET status = 'read' WHERE id = $1",
                [id]
            );
            result.rows[0].status = 'read';
        }

        res.json({
            success: true,
            message: result.rows[0]
        });

    } catch (error) {
        console.error('❌ Erreur récupération message:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la récupération du message'
        });
    }
});

/**
 * POST /api/admin/contact-messages/:id/reply
 * Répondre à un message de contact
 */
router.post('/:id/reply', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin' && req.user.role !== 'developer') {
            return res.status(403).json({
                success: false,
                error: 'Accès non autorisé'
            });
        }

        const { id } = req.params;
        const { replyMessage, subject } = req.body;

        if (!replyMessage || replyMessage.trim() === '') {
            return res.status(400).json({
                success: false,
                error: 'Le message de réponse est requis'
            });
        }

        // Récupérer le message original
        const original = await db.query(
            'SELECT * FROM contact_messages WHERE id = $1',
            [id]
        );

        if (original.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Message non trouvé'
            });
        }

        const originalMessage = original.rows[0];

        // Envoyer l'email de réponse
        const emailResult = await emailService.sendEmail('CONTACT_REPLY', originalMessage.email, {
            recipient_name: originalMessage.name,
            original_subject: originalMessage.subject || 'Votre message',
            original_message: originalMessage.message,
            reply_message: replyMessage,
            subject: subject || `Re: ${originalMessage.subject || 'Votre message'}`
        });

        if (!emailResult.success) {
            // Même si l'email échoue, on enregistre la réponse
            console.warn('⚠️ Email de réponse non envoyé, mais réponse enregistrée');
        }

        // Mettre à jour le statut du message
        await db.query(
            `UPDATE contact_messages 
       SET status = 'responded', responded_at = NOW(), responded_by = $1
       WHERE id = $2`,
            [req.user.id, id]
        );

        // Enregistrer la réponse dans une table de suivi (optionnel)
        try {
            await db.query(
                `INSERT INTO contact_message_replies (message_id, reply_text, sent_by, sent_at, email_sent)
         VALUES ($1, $2, $3, NOW(), $4)`,
                [id, replyMessage, req.user.id, emailResult.success]
            );
        } catch (replyLogError) {
            // La table n'existe peut-être pas encore, ce n'est pas critique
            console.warn('⚠️ Impossible d\'enregistrer la réponse dans les logs');
        }

        res.json({
            success: true,
            message: 'Réponse envoyée avec succès',
            emailSent: emailResult.success
        });

    } catch (error) {
        console.error('❌ Erreur envoi réponse:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de l\'envoi de la réponse'
        });
    }
});

/**
 * PATCH /api/admin/contact-messages/:id/status
 * Changer le statut d'un message
 */
router.patch('/:id/status', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin' && req.user.role !== 'developer') {
            return res.status(403).json({
                success: false,
                error: 'Accès non autorisé'
            });
        }

        const { id } = req.params;
        const { status } = req.body;

        const validStatuses = ['new', 'read', 'responded', 'archived'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                error: 'Statut invalide'
            });
        }

        await db.query(
            'UPDATE contact_messages SET status = $1 WHERE id = $2',
            [status, id]
        );

        res.json({
            success: true,
            message: 'Statut mis à jour'
        });

    } catch (error) {
        console.error('❌ Erreur mise à jour statut:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la mise à jour du statut'
        });
    }
});

/**
 * DELETE /api/admin/contact-messages/:id
 * Supprimer un message
 */
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin' && req.user.role !== 'developer') {
            return res.status(403).json({
                success: false,
                error: 'Accès non autorisé'
            });
        }

        const { id } = req.params;

        await db.query('DELETE FROM contact_messages WHERE id = $1', [id]);

        res.json({
            success: true,
            message: 'Message supprimé'
        });

    } catch (error) {
        console.error('❌ Erreur suppression message:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la suppression du message'
        });
    }
});

/**
 * GET /api/admin/contact-messages/stats
 * Statistiques des messages
 */
router.get('/stats/summary', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin' && req.user.role !== 'developer') {
            return res.status(403).json({
                success: false,
                error: 'Accès non autorisé'
            });
        }

        const stats = await db.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'new' THEN 1 END) as new_count,
        COUNT(CASE WHEN status = 'read' THEN 1 END) as read_count,
        COUNT(CASE WHEN status = 'responded' THEN 1 END) as responded_count,
        COUNT(CASE WHEN status = 'archived' THEN 1 END) as archived_count,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '24 hours' THEN 1 END) as last_24h,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as last_7d
      FROM contact_messages
    `);

        res.json({
            success: true,
            stats: stats.rows[0]
        });

    } catch (error) {
        console.error('❌ Erreur stats messages:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la récupération des statistiques'
        });
    }
});

module.exports = router;
