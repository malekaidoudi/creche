/**
 * Carte d'activité pour le fil d'actualités
 */

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMoreVertical, FiTrash2, FiEdit2, FiMessageCircle, FiEye, FiUser, FiPlay, FiMaximize2, FiShare2 } from 'react-icons/fi';
import { FaFacebook, FaInstagram, FaTiktok } from 'react-icons/fa';
import { BsPin, BsPinFill } from 'react-icons/bs';
import ReactionBar from './ReactionBar';
import ReactorsModal from './ReactorsModal';
import CommentSection from './CommentSection';
import { useAuth } from '../../contexts/AuthContext';

const ActivityCard = ({ activity, onReact, onDelete, onEdit, isRTL = false, onOpenFullscreen }) => {
  const { user } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false); // Menu de partage
  const [showReactorsModal, setShowReactorsModal] = useState(false); // Modal des réacteurs
  const videoRef = useRef(null);

  const canModify = user?.role === 'admin' || user?.id === activity.author?.id;

  // Générer une URL de thumbnail valide pour les vidéos Cloudinary
  const getVideoThumbnail = () => {
    // Si une thumbnail existe et est valide, l'utiliser
    if (activity.mediaThumbnailUrl && activity.mediaThumbnailUrl.includes('.jpg')) {
      return activity.mediaThumbnailUrl;
    }

    // Sinon, générer une thumbnail à partir de l'URL vidéo Cloudinary
    if (activity.mediaUrl && activity.mediaUrl.includes('cloudinary.com')) {
      return activity.mediaUrl
        .replace('/video/upload/', '/video/upload/so_0,w_800,h_450,c_fill,f_jpg/')
        .replace(/\.(mp4|webm|mov|avi|MOV|MP4)$/i, '.jpg');
    }

    return null;
  };

  const formatDate = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diff = (now - d) / 1000;

    if (diff < 60) return isRTL ? 'الآن' : 'À l\'instant';
    if (diff < 3600) return `${Math.floor(diff / 60)} ${isRTL ? 'دقيقة' : 'min'}`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} ${isRTL ? 'ساعة' : 'h'}`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} ${isRTL ? 'يوم' : 'j'}`;
    return d.toLocaleDateString(isRTL ? 'ar-TN' : 'fr-FR', { day: 'numeric', month: 'short' });
  };

  const getRoleBadge = (role) => {
    const badges = {
      admin: { label: isRTL ? 'المدير' : 'Directeur', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
      staff: { label: isRTL ? 'موظف' : 'Personnel', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
      parent: { label: isRTL ? 'ولي' : 'Parent', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' }
    };
    return badges[role] || badges.parent;
  };

  const badge = getRoleBadge(activity.author?.role);

  // Fonctions de partage sur les réseaux sociaux
  const shareOnFacebook = () => {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(activity.title);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${text}`, '_blank', 'width=600,height=400');
    setShowShareMenu(false);
  };

  const shareOnInstagram = () => {
    // Instagram ne supporte pas le partage direct via URL, on copie le lien
    navigator.clipboard.writeText(window.location.href);
    alert(isRTL ? 'تم نسخ الرابط! الصقه في Instagram' : 'Lien copié ! Collez-le sur Instagram');
    setShowShareMenu(false);
  };

  const shareOnTikTok = () => {
    // TikTok ne supporte pas le partage direct via URL, on copie le lien
    navigator.clipboard.writeText(window.location.href);
    alert(isRTL ? 'تم نسخ الرابط! الصقه في TikTok' : 'Lien copié ! Collez-le sur TikTok');
    setShowShareMenu(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700"
    >
      {/* En-tête */}
      <div className="p-4 flex items-start justify-between">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-lg flex-shrink-0 overflow-hidden">
            {activity.author?.profileImage ? (
              <img src={activity.author.profileImage} alt="" className="w-full h-full object-cover" />
            ) : (
              <FiUser />
            )}
          </div>

          {/* Infos auteur */}
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                {activity.author?.firstName} {activity.author?.lastName}
              </h3>
              {activity.isPinned && (
                <BsPinFill className="text-yellow-500 flex-shrink-0" size={14} />
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`text-xs px-2 py-0.5 rounded-full ${badge.color}`}>
                {badge.label}
              </span>
              <span className="text-xs text-gray-400">•</span>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {formatDate(activity.createdAt)}
              </p>
            </div>
          </div>
        </div>

        {/* Menu actions */}
        {canModify && (
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <FiMoreVertical className="text-gray-500" />
            </button>

            {showMenu && (
              <div className="absolute right-0 rtl:left-0 rtl:right-auto mt-1 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-10">
                <button
                  onClick={() => { onEdit?.(activity); setShowMenu(false); }}
                  className="w-full px-4 py-2 text-left rtl:text-right text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                >
                  <FiEdit2 size={14} />
                  {isRTL ? 'تعديل' : 'Modifier'}
                </button>
                <button
                  onClick={() => { onDelete?.(activity.id); setShowMenu(false); }}
                  className="w-full px-4 py-2 text-left rtl:text-right text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                >
                  <FiTrash2 size={14} />
                  {isRTL ? 'حذف' : 'Supprimer'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Contenu */}
      <div className="px-4 pb-3 overflow-hidden">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 break-words">
          {activity.title}
        </h4>
        {activity.description && (
          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words overflow-wrap-anywhere">
            {activity.description}
          </p>
        )}
      </div>

      {/* Média - cliquable pour plein écran */}
      {activity.mediaType !== 'none' && activity.mediaUrl && (
        <div className="relative group cursor-pointer" onClick={() => onOpenFullscreen?.()}>
          {activity.mediaType === 'image' ? (
            <>
              <img
                src={activity.mediaUrl}
                alt={activity.title}
                className="w-full max-h-[500px] object-cover"
                loading="lazy"
              />
              {/* Overlay pour agrandir */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                <div className="p-3 bg-white/90 rounded-full shadow-lg">
                  <FiMaximize2 size={24} className="text-gray-900" />
                </div>
              </div>
            </>
          ) : activity.mediaType === 'video' && (
            <div className="relative">
              {!showVideo ? (
                <div className="relative" onClick={(e) => { e.stopPropagation(); setShowVideo(true); }}>
                  {/* Thumbnail vidéo avec transformation Cloudinary correcte */}
                  {getVideoThumbnail() ? (
                    <img
                      src={getVideoThumbnail()}
                      alt={activity.title}
                      className="w-full max-h-[400px] object-cover bg-gray-200 dark:bg-gray-700"
                      onError={(e) => {
                        // Fallback si la thumbnail échoue - utiliser une frame de la vidéo
                        e.target.style.display = 'none';
                        e.target.nextSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  {/* Fallback: lecteur vidéo en pause pour générer une preview */}
                  <video
                    src={activity.mediaUrl}
                    className={`w-full max-h-[400px] object-cover bg-gray-900 ${getVideoThumbnail() ? 'hidden' : ''}`}
                    preload="metadata"
                    muted
                    playsInline
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                      <FiPlay className="text-gray-900 ml-1" size={28} />
                    </div>
                  </div>
                  {/* Bouton plein écran */}
                  <button
                    onClick={(e) => { e.stopPropagation(); onOpenFullscreen?.(); }}
                    className="absolute top-3 right-3 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
                  >
                    <FiMaximize2 size={18} />
                  </button>
                </div>
              ) : (
                <div className="relative" onClick={(e) => e.stopPropagation()}>
                  <video
                    ref={videoRef}
                    src={activity.mediaUrl}
                    controls
                    autoPlay
                    playsInline
                    muted={isMuted}
                    className="w-full max-h-[500px] bg-black"
                  />
                  {/* Bouton plein écran */}
                  <button
                    onClick={(e) => { e.stopPropagation(); onOpenFullscreen?.(); }}
                    className="absolute top-3 right-3 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
                  >
                    <FiMaximize2 size={18} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="px-4 py-2 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-4">
          {activity.reactions?.total > 0 && (
            <span>{activity.reactions.total} {isRTL ? 'تفاعل' : 'réaction(s)'}</span>
          )}
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <FiMessageCircle size={14} />
            {activity.commentsCount || 0}
          </span>
          <span className="flex items-center gap-1">
            <FiEye size={14} />
            {activity.viewCount || 0}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700 overflow-visible">
        <div className="flex items-center justify-between gap-2">
          <ReactionBar
            reactions={activity.reactions}
            onReact={(type) => onReact?.(activity.id, type)}
            onShowReactors={() => setShowReactorsModal(true)}
            isRTL={isRTL}
          />

          {/* Bouton Partager */}
          <div className="relative">
            <button
              onClick={() => setShowShareMenu(!showShareMenu)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm"
            >
              <FiShare2 size={16} />
              <span className="hidden sm:inline">{isRTL ? 'مشاركة' : 'Partager'}</span>
            </button>

            {/* Menu de partage */}
            <AnimatePresence>
              {showShareMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 10 }}
                  className="absolute bottom-full right-0 mb-2 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-2 min-w-[160px] z-20"
                >
                  <button
                    onClick={shareOnFacebook}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <FaFacebook size={18} className="text-blue-600" />
                    <span className="text-sm text-gray-700 dark:text-gray-200">Facebook</span>
                  </button>
                  <button
                    onClick={shareOnInstagram}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <FaInstagram size={18} className="text-pink-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-200">Instagram</span>
                  </button>
                  <button
                    onClick={shareOnTikTok}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <FaTiktok size={18} className="text-gray-900 dark:text-white" />
                    <span className="text-sm text-gray-700 dark:text-gray-200">TikTok</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Commentaires */}
      <div className="px-4 pb-4">
        <CommentSection
          activityId={activity.id}
          commentsCount={activity.commentsCount}
          isRTL={isRTL}
        />
      </div>

      {/* Modal des réacteurs */}
      <ReactorsModal
        activityId={activity.id}
        isOpen={showReactorsModal}
        onClose={() => setShowReactorsModal(false)}
        isRTL={isRTL}
      />
    </motion.div>
  );
};

export default ActivityCard;
