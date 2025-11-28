/**
 * Section commentaires pour les activités
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSend, FiTrash2, FiCornerDownRight, FiUser } from 'react-icons/fi';
import activityService from '../../services/activityService';
import { useAuth } from '../../contexts/AuthContext';

const CommentSection = ({ activityId, commentsCount = 0, isRTL = false }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [showComments, setShowComments] = useState(false);

  const t = {
    comments: isRTL ? 'تعليقات' : 'Commentaires',
    writeComment: isRTL ? 'اكتب تعليقاً...' : 'Écrire un commentaire...',
    reply: isRTL ? 'رد' : 'Répondre',
    delete: isRTL ? 'حذف' : 'Supprimer',
    noComments: isRTL ? 'لا توجد تعليقات بعد' : 'Aucun commentaire pour le moment',
    showComments: isRTL ? 'عرض التعليقات' : 'Voir les commentaires',
    hideComments: isRTL ? 'إخفاء التعليقات' : 'Masquer les commentaires'
  };

  // Charger les commentaires
  const loadComments = async () => {
    if (!showComments) return;
    try {
      setLoading(true);
      const result = await activityService.getComments(activityId);
      if (result.success) {
        setComments(result.comments);
      }
    } catch (error) {
      console.error('Erreur chargement commentaires:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (showComments) {
      loadComments();
    }
  }, [showComments, activityId]);

  // Envoyer un commentaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const result = await activityService.addComment(activityId, newComment.trim(), replyTo?.id);
      if (result.success) {
        if (replyTo) {
          // Ajouter comme réponse
          setComments(prev => prev.map(c => 
            c.id === replyTo.id 
              ? { ...c, replies: [...(c.replies || []), result.comment] }
              : c
          ));
        } else {
          // Ajouter comme nouveau commentaire
          setComments(prev => [result.comment, ...prev]);
        }
        setNewComment('');
        setReplyTo(null);
      }
    } catch (error) {
      console.error('Erreur ajout commentaire:', error);
    }
  };

  // Supprimer un commentaire
  const handleDelete = async (commentId) => {
    try {
      const result = await activityService.deleteComment(activityId, commentId);
      if (result.success) {
        setComments(prev => prev.filter(c => c.id !== commentId));
      }
    } catch (error) {
      console.error('Erreur suppression commentaire:', error);
    }
  };

  const formatDate = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diff = (now - d) / 1000;
    
    if (diff < 60) return isRTL ? 'الآن' : 'À l\'instant';
    if (diff < 3600) return `${Math.floor(diff / 60)} ${isRTL ? 'دقيقة' : 'min'}`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} ${isRTL ? 'ساعة' : 'h'}`;
    return d.toLocaleDateString(isRTL ? 'ar-TN' : 'fr-FR');
  };

  const CommentItem = ({ comment, isReply = false }) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 ${isReply ? 'ml-10 rtl:mr-10 rtl:ml-0' : ''}`}
    >
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-sm flex-shrink-0">
        {comment.author?.profileImage ? (
          <img src={comment.author.profileImage} alt="" className="w-full h-full rounded-full object-cover" />
        ) : (
          <FiUser />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl px-4 py-2">
          <p className="font-medium text-sm text-gray-900 dark:text-white">
            {comment.author?.firstName} {comment.author?.lastName}
          </p>
          <p className="text-gray-700 dark:text-gray-300 text-sm break-words">{comment.content}</p>
        </div>
        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
          <span>{formatDate(comment.createdAt)}</span>
          {!isReply && (
            <button onClick={() => setReplyTo(comment)} className="hover:text-blue-500 font-medium">
              {t.reply}
            </button>
          )}
          {(user?.role === 'admin' || user?.id === comment.author?.id) && (
            <button onClick={() => handleDelete(comment.id)} className="hover:text-red-500">
              <FiTrash2 size={12} />
            </button>
          )}
        </div>
        {/* Réponses */}
        {comment.replies?.length > 0 && (
          <div className="mt-2 space-y-2">
            {comment.replies.map(reply => (
              <CommentItem key={reply.id} comment={reply} isReply />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
      {/* Toggle commentaires */}
      <button
        onClick={() => setShowComments(!showComments)}
        className="text-sm text-gray-500 hover:text-blue-500 mb-3"
      >
        {showComments ? t.hideComments : `${t.showComments} (${commentsCount})`}
      </button>

      <AnimatePresence>
        {showComments && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
            {/* Liste des commentaires */}
            <div className="space-y-3 mb-4 max-h-80 overflow-y-auto">
              {loading ? (
                <div className="text-center py-4 text-gray-500">{isRTL ? 'جاري التحميل...' : 'Chargement...'}</div>
              ) : comments.length === 0 ? (
                <p className="text-center text-gray-500 py-4">{t.noComments}</p>
              ) : (
                comments.map(comment => <CommentItem key={comment.id} comment={comment} />)
              )}
            </div>

            {/* Formulaire de commentaire */}
            <form onSubmit={handleSubmit} className="flex gap-2 items-center">
              {replyTo && (
                <div className="flex items-center gap-1 text-xs text-blue-500 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded">
                  <FiCornerDownRight size={12} />
                  <span>{replyTo.author?.firstName}</span>
                  <button type="button" onClick={() => setReplyTo(null)} className="ml-1 hover:text-red-500">×</button>
                </div>
              )}
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={t.writeComment}
                className="flex-1 px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-700 border-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <button
                type="submit"
                disabled={!newComment.trim()}
                className="p-2 rounded-full bg-blue-500 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors"
              >
                <FiSend size={18} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CommentSection;

