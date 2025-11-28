/**
 * Service pour la gestion des activités (fil d'actualités)
 */

const db = require('../config/db_postgres');
const cloudinaryService = require('./cloudinaryService');

const REACTION_TYPES = ['like', 'love', 'laugh', 'wow', 'clap', 'celebrate'];

const activityService = {
  /**
   * Créer une nouvelle activité
   */
  async createActivity(data, authorId) {
    try {
      const { title, description, mediaType, mediaUrl, mediaThumbnailUrl, cloudinaryPublicId, isPinned } = data;

      const result = await db.query(
        `INSERT INTO activities (author_id, title, description, media_type, media_url, media_thumbnail_url, cloudinary_public_id, is_pinned)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [authorId, title, description || null, mediaType || 'none', mediaUrl || null, mediaThumbnailUrl || null, cloudinaryPublicId || null, isPinned || false]
      );

      return { success: true, activity: result.rows[0] };
    } catch (error) {
      console.error('Erreur createActivity:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Récupérer les activités avec pagination
   */
  async getActivities(options = {}) {
    try {
      const { page = 1, limit = 10, userId = null } = options;
      const offset = (page - 1) * limit;

      // Requête principale avec auteur et compteurs
      const activitiesQuery = `
        SELECT
          a.*,
          u.first_name as author_first_name,
          u.last_name as author_last_name,
          u.role as author_role,
          u.profile_image as author_profile_image,
          (SELECT COUNT(*) FROM activity_comments WHERE activity_id = a.id AND is_visible = true) as comments_count,
          (SELECT COUNT(*) FROM activity_reactions WHERE activity_id = a.id) as reactions_total
        FROM activities a
        JOIN users u ON a.author_id = u.id
        WHERE a.is_visible = true
        ORDER BY a.is_pinned DESC, a.created_at DESC
        LIMIT $1 OFFSET $2
      `;

      const activities = await db.query(activitiesQuery, [limit, offset]);

      // Récupérer les réactions par type pour chaque activité
      for (let activity of activities.rows) {
        const reactionsQuery = `
          SELECT reaction_type, COUNT(*) as count
          FROM activity_reactions
          WHERE activity_id = $1
          GROUP BY reaction_type
        `;
        const reactions = await db.query(reactionsQuery, [activity.id]);

        activity.reactions = {
          like: 0, love: 0, laugh: 0, wow: 0, clap: 0, celebrate: 0,
          total: parseInt(activity.reactions_total) || 0
        };

        reactions.rows.forEach(r => {
          activity.reactions[r.reaction_type] = parseInt(r.count);
        });

        // Réaction de l'utilisateur connecté
        if (userId) {
          const userReaction = await db.query(
            'SELECT reaction_type FROM activity_reactions WHERE activity_id = $1 AND user_id = $2',
            [activity.id, userId]
          );
          activity.reactions.userReaction = userReaction.rows[0]?.reaction_type || null;
        }
      }

      // Compter le total
      const countResult = await db.query('SELECT COUNT(*) FROM activities WHERE is_visible = true');
      const total = parseInt(countResult.rows[0].count);

      return {
        success: true,
        activities: activities.rows.map(a => this.formatActivity(a)),
        pagination: {
          page,
          limit,
          total,
          hasMore: offset + activities.rows.length < total
        }
      };
    } catch (error) {
      console.error('Erreur getActivities:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Récupérer une activité par ID
   */
  async getActivityById(id, userId = null) {
    try {
      const result = await db.query(
        `SELECT a.*, u.first_name as author_first_name, u.last_name as author_last_name,
                u.role as author_role, u.profile_image as author_profile_image
         FROM activities a
         JOIN users u ON a.author_id = u.id
         WHERE a.id = $1`,
        [id]
      );

      if (result.rows.length === 0) {
        return { success: false, error: 'Activité non trouvée' };
      }

      // Incrémenter le compteur de vues
      await db.query('UPDATE activities SET view_count = view_count + 1 WHERE id = $1', [id]);

      const activity = result.rows[0];

      // Récupérer les réactions
      const reactionsQuery = `
        SELECT reaction_type, COUNT(*) as count
        FROM activity_reactions WHERE activity_id = $1 GROUP BY reaction_type
      `;
      const reactions = await db.query(reactionsQuery, [id]);

      activity.reactions = { like: 0, love: 0, laugh: 0, wow: 0, clap: 0, celebrate: 0, total: 0 };
      reactions.rows.forEach(r => {
        activity.reactions[r.reaction_type] = parseInt(r.count);
        activity.reactions.total += parseInt(r.count);
      });

      if (userId) {
        const userReaction = await db.query(
          'SELECT reaction_type FROM activity_reactions WHERE activity_id = $1 AND user_id = $2',
          [id, userId]
        );
        activity.reactions.userReaction = userReaction.rows[0]?.reaction_type || null;
      }

      // Compter les commentaires
      const commentsCount = await db.query(
        'SELECT COUNT(*) FROM activity_comments WHERE activity_id = $1 AND is_visible = true',
        [id]
      );
      activity.comments_count = parseInt(commentsCount.rows[0].count);

      return { success: true, activity: this.formatActivity(activity) };
    } catch (error) {
      console.error('Erreur getActivityById:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Formater une activité pour l'API
   */
  formatActivity(a) {
    return {
      id: a.id,
      author: {
        id: a.author_id,
        firstName: a.author_first_name,
        lastName: a.author_last_name,
        role: a.author_role,
        profileImage: a.author_profile_image
      },
      title: a.title,
      description: a.description,
      mediaType: a.media_type,
      mediaUrl: a.media_url,
      mediaThumbnailUrl: a.media_thumbnail_url,
      isPinned: a.is_pinned,
      viewCount: a.view_count,
      createdAt: a.created_at,
      updatedAt: a.updated_at,
      reactions: a.reactions || {},
      commentsCount: parseInt(a.comments_count) || 0
    };
  },

  /**
   * Mettre à jour une activité
   */
  async updateActivity(id, data, userId, userRole) {
    try {
      // Vérifier les permissions
      const activity = await db.query('SELECT author_id FROM activities WHERE id = $1', [id]);
      if (activity.rows.length === 0) {
        return { success: false, error: 'Activité non trouvée' };
      }

      if (userRole !== 'admin' && activity.rows[0].author_id !== userId) {
        return { success: false, error: 'Non autorisé' };
      }

      const { title, description, isPinned } = data;

      // Seul admin peut épingler
      const pinValue = userRole === 'admin' ? (isPinned || false) : activity.rows[0].is_pinned;

      const result = await db.query(
        `UPDATE activities
         SET title = COALESCE($1, title),
             description = COALESCE($2, description),
             is_pinned = $3,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $4
         RETURNING *`,
        [title, description, pinValue, id]
      );

      return { success: true, activity: result.rows[0] };
    } catch (error) {
      console.error('Erreur updateActivity:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Supprimer une activité
   */
  async deleteActivity(id, userId, userRole) {
    try {
      const activity = await db.query('SELECT author_id, cloudinary_public_id FROM activities WHERE id = $1', [id]);
      if (activity.rows.length === 0) {
        return { success: false, error: 'Activité non trouvée' };
      }

      if (userRole !== 'admin' && activity.rows[0].author_id !== userId) {
        return { success: false, error: 'Non autorisé' };
      }

      // Supprimer le média de Cloudinary si présent
      if (activity.rows[0].cloudinary_public_id) {
        await cloudinaryService.deleteFile(activity.rows[0].cloudinary_public_id);
      }

      await db.query('DELETE FROM activities WHERE id = $1', [id]);
      return { success: true, message: 'Activité supprimée' };
    } catch (error) {
      console.error('Erreur deleteActivity:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Ajouter ou modifier une réaction
   */
  async toggleReaction(activityId, userId, reactionType) {
    try {
      if (!REACTION_TYPES.includes(reactionType)) {
        return { success: false, error: 'Type de réaction invalide' };
      }

      // Vérifier si l'utilisateur a déjà réagi
      const existing = await db.query(
        'SELECT id, reaction_type FROM activity_reactions WHERE activity_id = $1 AND user_id = $2',
        [activityId, userId]
      );

      if (existing.rows.length > 0) {
        if (existing.rows[0].reaction_type === reactionType) {
          // Même réaction = supprimer
          await db.query('DELETE FROM activity_reactions WHERE id = $1', [existing.rows[0].id]);
          return { success: true, action: 'removed', reactionType: null };
        } else {
          // Réaction différente = mettre à jour
          await db.query(
            'UPDATE activity_reactions SET reaction_type = $1 WHERE id = $2',
            [reactionType, existing.rows[0].id]
          );
          return { success: true, action: 'updated', reactionType };
        }
      } else {
        // Nouvelle réaction
        await db.query(
          'INSERT INTO activity_reactions (activity_id, user_id, reaction_type) VALUES ($1, $2, $3)',
          [activityId, userId, reactionType]
        );
        return { success: true, action: 'added', reactionType };
      }
    } catch (error) {
      console.error('Erreur toggleReaction:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Récupérer les commentaires d'une activité
   */
  async getComments(activityId, page = 1, limit = 20) {
    try {
      const offset = (page - 1) * limit;

      const result = await db.query(
        `SELECT c.*, u.first_name, u.last_name, u.role, u.profile_image
         FROM activity_comments c
         JOIN users u ON c.user_id = u.id
         WHERE c.activity_id = $1 AND c.is_visible = true AND c.parent_comment_id IS NULL
         ORDER BY c.created_at DESC
         LIMIT $2 OFFSET $3`,
        [activityId, limit, offset]
      );

      // Récupérer les réponses pour chaque commentaire
      for (let comment of result.rows) {
        const replies = await db.query(
          `SELECT c.*, u.first_name, u.last_name, u.role, u.profile_image
           FROM activity_comments c
           JOIN users u ON c.user_id = u.id
           WHERE c.parent_comment_id = $1 AND c.is_visible = true
           ORDER BY c.created_at ASC`,
          [comment.id]
        );
        comment.replies = replies.rows.map(r => this.formatComment(r));
      }

      const countResult = await db.query(
        'SELECT COUNT(*) FROM activity_comments WHERE activity_id = $1 AND is_visible = true AND parent_comment_id IS NULL',
        [activityId]
      );

      return {
        success: true,
        comments: result.rows.map(c => this.formatComment(c)),
        pagination: {
          page,
          limit,
          total: parseInt(countResult.rows[0].count)
        }
      };
    } catch (error) {
      console.error('Erreur getComments:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Ajouter un commentaire
   */
  async addComment(activityId, userId, content, parentCommentId = null) {
    try {
      const result = await db.query(
        `INSERT INTO activity_comments (activity_id, user_id, content, parent_comment_id)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [activityId, userId, content, parentCommentId]
      );

      // Récupérer les infos de l'auteur
      const author = await db.query(
        'SELECT first_name, last_name, role, profile_image FROM users WHERE id = $1',
        [userId]
      );

      const comment = { ...result.rows[0], ...author.rows[0] };
      return { success: true, comment: this.formatComment(comment) };
    } catch (error) {
      console.error('Erreur addComment:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Supprimer un commentaire
   */
  async deleteComment(commentId, userId, userRole) {
    try {
      const comment = await db.query('SELECT user_id FROM activity_comments WHERE id = $1', [commentId]);
      if (comment.rows.length === 0) {
        return { success: false, error: 'Commentaire non trouvé' };
      }

      if (userRole !== 'admin' && comment.rows[0].user_id !== userId) {
        return { success: false, error: 'Non autorisé' };
      }

      // Soft delete
      await db.query('UPDATE activity_comments SET is_visible = false WHERE id = $1', [commentId]);
      return { success: true, message: 'Commentaire supprimé' };
    } catch (error) {
      console.error('Erreur deleteComment:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Formater un commentaire pour l'API
   */
  formatComment(c) {
    return {
      id: c.id,
      activityId: c.activity_id,
      author: {
        id: c.user_id,
        firstName: c.first_name,
        lastName: c.last_name,
        role: c.role,
        profileImage: c.profile_image
      },
      content: c.content,
      parentCommentId: c.parent_comment_id,
      createdAt: c.created_at,
      replies: c.replies || []
    };
  },

  /**
   * Notifier les parents d'une nouvelle activité
   */
  async notifyParentsNewActivity(activity) {
    try {
      // Récupérer tous les parents actifs
      const parents = await db.query(
        "SELECT id FROM users WHERE role = 'parent' AND is_active = true"
      );

      if (parents.rows.length === 0) return;

      // Créer les notifications en batch
      const values = parents.rows.map((p, i) =>
        `($${i * 5 + 1}, $${i * 5 + 2}, $${i * 5 + 3}, $${i * 5 + 4}, $${i * 5 + 5})`
      ).join(', ');

      const params = parents.rows.flatMap(p => [
        p.id,
        'Nouvelle activité',
        activity.title,
        'activity',
        activity.id
      ]);

      await db.query(
        `INSERT INTO notifications (user_id, title, message, type, related_id)
         VALUES ${values}`,
        params
      );

      return { success: true, notified: parents.rows.length };
    } catch (error) {
      console.error('Erreur notifyParentsNewActivity:', error);
      return { success: false, error: error.message };
    }
  }
};

module.exports = activityService;

