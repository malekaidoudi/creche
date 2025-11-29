/**
 * Carte d'activité pour le fil d'actualités
 */

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMoreVertical, FiTrash2, FiEdit2, FiMessageCircle, FiEye, FiUser, FiPlay, FiX, FiMaximize2, FiVolume2, FiVolumeX } from 'react-icons/fi';
import { BsPin, BsPinFill } from 'react-icons/bs';
import ReactionBar from './ReactionBar';
import CommentSection from './CommentSection';
import { useAuth } from '../../contexts/AuthContext';

const ActivityCard = ({ activity, onReact, onDelete, onEdit, isRTL = false }) => {
  const { user } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const videoRef = useRef(null);
  const fullscreenVideoRef = useRef(null);

  const canModify = user?.role === 'admin' || user?.id === activity.author?.id;

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden"
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
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {activity.author?.firstName} {activity.author?.lastName}
              </h3>
              <span className={`text-xs px-2 py-0.5 rounded-full ${badge.color}`}>
                {badge.label}
              </span>
              {activity.isPinned && (
                <BsPinFill className="text-yellow-500" size={14} />
              )}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {formatDate(activity.createdAt)}
            </p>
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
      <div className="px-4 pb-3">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {activity.title}
        </h4>
        {activity.description && (
          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
            {activity.description}
          </p>
        )}
      </div>

      {/* Média - cliquable pour plein écran */}
      {activity.mediaType !== 'none' && activity.mediaUrl && (
        <div className="relative group cursor-pointer" onClick={() => setShowFullscreen(true)}>
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
                  <img
                    src={activity.mediaThumbnailUrl || activity.mediaUrl.replace('/upload/', '/upload/so_0,w_800,h_450,c_fill/')}
                    alt={activity.title}
                    className="w-full max-h-[400px] object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                      <FiPlay className="text-gray-900 ml-1" size={28} />
                    </div>
                  </div>
                  {/* Bouton plein écran */}
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowFullscreen(true); }}
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
                    onClick={(e) => { e.stopPropagation(); setShowFullscreen(true); }}
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
      <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700">
        <ReactionBar
          reactions={activity.reactions}
          onReact={(type) => onReact?.(activity.id, type)}
          isRTL={isRTL}
        />
      </div>

      {/* Commentaires */}
      <div className="px-4 pb-4">
        <CommentSection
          activityId={activity.id}
          commentsCount={activity.commentsCount}
          isRTL={isRTL}
        />
      </div>

      {/* Modal plein écran */}
      <AnimatePresence>
        {showFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex"
            onClick={() => setShowFullscreen(false)}
          >
            {/* Bouton fermer */}
            <button
              onClick={() => setShowFullscreen(false)}
              className="absolute top-4 right-4 rtl:left-4 rtl:right-auto z-50 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
            >
              <FiX size={24} />
            </button>

            {/* Container principal */}
            <div className="flex flex-col lg:flex-row w-full h-full" onClick={(e) => e.stopPropagation()}>
              {/* Zone média (gauche/haut) */}
              <div className="flex-1 flex items-center justify-center p-4 lg:p-8 min-h-0">
                {activity.mediaType === 'image' ? (
                  <img
                    src={activity.mediaUrl}
                    alt={activity.title}
                    className="max-w-full max-h-full object-contain rounded-lg"
                  />
                ) : (
                  <div className="relative w-full h-full flex items-center justify-center">
                    <video
                      ref={fullscreenVideoRef}
                      src={activity.mediaUrl}
                      controls
                      autoPlay
                      playsInline
                      className="max-w-full max-h-full object-contain rounded-lg"
                    />
                  </div>
                )}
              </div>

              {/* Zone commentaires (droite/bas) */}
              <div className="w-full lg:w-96 bg-white dark:bg-gray-900 flex flex-col max-h-[40vh] lg:max-h-full overflow-hidden">
                {/* En-tête */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white overflow-hidden">
                      {activity.author?.profileImage ? (
                        <img src={activity.author.profileImage} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <FiUser size={18} />
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                        {activity.author?.firstName} {activity.author?.lastName}
                      </h4>
                      <p className="text-xs text-gray-500">{formatDate(activity.createdAt)}</p>
                    </div>
                  </div>
                  <h3 className="mt-3 font-bold text-gray-900 dark:text-white">{activity.title}</h3>
                  {activity.description && (
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 line-clamp-3">{activity.description}</p>
                  )}
                </div>

                {/* Commentaires scrollables */}
                <div className="flex-1 overflow-y-auto p-4">
                  <CommentSection
                    activityId={activity.id}
                    commentsCount={activity.commentsCount}
                    isRTL={isRTL}
                    isFullscreen={true}
                  />
                </div>

                {/* Réactions en bas */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                  <ReactionBar
                    reactions={activity.reactions}
                    onReact={(type) => onReact?.(activity.id, type)}
                    isRTL={isRTL}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ActivityCard;

