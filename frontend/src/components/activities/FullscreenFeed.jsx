/**
 * Composant de navigation plein écran style TikTok
 * Permet de naviguer entre les publications en glissant verticalement
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { FiX, FiMessageCircle, FiShare2, FiUser, FiChevronUp, FiChevronDown, FiChevronLeft, FiChevronRight, FiImage } from 'react-icons/fi';
import { FaFacebook, FaInstagram, FaTiktok } from 'react-icons/fa';
import CommentSection from './CommentSection';
import activityService from '../../services/activityService';
import { useAuth } from '../../contexts/AuthContext';
import { useDialogContext } from '../../contexts/DialogContext';
import { getStaffPositionLabel } from '../../utils/staffPosition';

const FullscreenFeed = ({
    activities,
    initialIndex = 0,
    initialPhotoIndex = 0,
    onClose,
    onReact,
    isRTL = false,
    hasMore,
    onLoadMore
}) => {
    const { user } = useAuth();
    const dialog = useDialogContext();
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [currentPhotoIndex, setCurrentPhotoIndex] = useState(initialPhotoIndex || 0);
    const [showComments, setShowComments] = useState(false);
    const [showShareMenu, setShowShareMenu] = useState(false);
    const [showReactionPicker, setShowReactionPicker] = useState(false);
    const [fullscreenComment, setFullscreenComment] = useState('');
    const [isAnimating, setIsAnimating] = useState(false);
    const containerRef = useRef(null);
    const videoRefs = useRef({});
    const longPressTimer = useRef(null);
    const commentInputRef = useRef(null);
    const touchStartX = useRef(0);
    const touchStartY = useRef(0);

    const handlePhotoTouchStart = (e) => {
        if (e.touches && e.touches.length === 1) {
            touchStartX.current = e.touches[0].clientX;
            touchStartY.current = e.touches[0].clientY;
        }
    };

    const handlePhotoTouchEnd = (e) => {
        if (!e.changedTouches || e.changedTouches.length === 0) return;
        const deltaX = e.changedTouches[0].clientX - touchStartX.current;
        const deltaY = e.changedTouches[0].clientY - touchStartY.current;

        // Si le geste est principalement horizontal et dépasse 30px
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 30) {
            if (deltaX < 0) {
                // Swipe vers la gauche -> photo suivante
                isRTL ? goToPrevPhoto() : goToNextPhoto();
            } else {
                // Swipe vers la droite -> photo précédente
                isRTL ? goToNextPhoto() : goToPrevPhoto();
            }
        }
    };

    const currentActivity = activities[currentIndex];

    // Médias de la publication courante
    const currentMediaItems = Array.isArray(currentActivity?.mediaUrls) && currentActivity?.mediaUrls.length > 0
        ? currentActivity.mediaUrls
        : (currentActivity?.mediaUrl ? [{ url: currentActivity.mediaUrl, thumbnailUrl: currentActivity.mediaThumbnailUrl, type: currentActivity.mediaType }] : []);

    const isCurrentVideo = currentActivity?.mediaType === 'video' || (currentMediaItems.length === 1 && currentMediaItems[0].type === 'video');

    // Réinitialiser la photo courante lors du passage à une autre publication
    useEffect(() => {
        setCurrentPhotoIndex(0);
    }, [currentIndex]);

    // Charger plus de publications si on approche de la fin
    useEffect(() => {
        if (currentIndex >= activities.length - 2 && hasMore) {
            onLoadMore?.();
        }
    }, [currentIndex, activities.length, hasMore, onLoadMore]);

    // Bloquer le scroll du body et cacher le FAB quand le modal est ouvert
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        document.body.classList.add('fullscreen-mode');
        return () => {
            document.body.style.overflow = '';
            document.body.classList.remove('fullscreen-mode');
        };
    }, []);

    // Gérer la lecture vidéo
    useEffect(() => {
        // Pause toutes les vidéos
        Object.values(videoRefs.current).forEach(video => {
            if (video) video.pause();
        });
        // Jouer la vidéo courante
        const currentVideo = videoRefs.current[currentIndex];
        if (currentVideo) {
            currentVideo.play().catch(() => { });
        }
    }, [currentIndex]);

    // Navigation
    const goToNext = () => {
        if (currentIndex < activities.length - 1 && !isAnimating) {
            setIsAnimating(true);
            setCurrentIndex(prev => prev + 1);
            setShowComments(false);
            setShowShareMenu(false);
            setShowReactionPicker(false);
            setTimeout(() => setIsAnimating(false), 300);
        }
    };

    const goToPrevious = () => {
        if (currentIndex > 0 && !isAnimating) {
            setIsAnimating(true);
            setCurrentIndex(prev => prev - 1);
            setShowComments(false);
            setShowShareMenu(false);
            setShowReactionPicker(false);
            setTimeout(() => setIsAnimating(false), 300);
        }
    };

    // Navigation photos dans la même publication
    const goToNextPhoto = (e) => {
        e?.stopPropagation?.();
        if (currentPhotoIndex < currentMediaItems.length - 1) {
            setCurrentPhotoIndex(prev => prev + 1);
        }
    };

    const goToPrevPhoto = (e) => {
        e?.stopPropagation?.();
        if (currentPhotoIndex > 0) {
            setCurrentPhotoIndex(prev => prev - 1);
        }
    };

    // Navigation clavier (Flèches haut/bas pour posts, gauche/droite pour photos, Escape pour fermer)
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                onClose?.();
            } else if (e.key === 'ArrowUp') {
                goToPrevious();
            } else if (e.key === 'ArrowDown') {
                goToNext();
            } else if (e.key === 'ArrowLeft') {
                if (currentMediaItems.length > 1) {
                    isRTL ? goToNextPhoto() : goToPrevPhoto();
                }
            } else if (e.key === 'ArrowRight') {
                if (currentMediaItems.length > 1) {
                    isRTL ? goToPrevPhoto() : goToNextPhoto();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentIndex, currentPhotoIndex, currentMediaItems.length, activities.length, isAnimating, isRTL]);

    // Gestion du swipe vertical
    const handleDragEnd = (e, info) => {
        const threshold = 50;
        const velocity = 500;

        if (info.offset.y < -threshold || info.velocity.y < -velocity) {
            goToNext();
        } else if (info.offset.y > threshold || info.velocity.y > velocity) {
            goToPrevious();
        }
    };

    // Fonctions de partage
    const shareOnFacebook = () => {
        const url = encodeURIComponent(window.location.href);
        const text = encodeURIComponent(currentActivity.title);
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${text}`, '_blank', 'width=600,height=400');
        setShowShareMenu(false);
    };

    const shareOnInstagram = () => {
        navigator.clipboard.writeText(window.location.href);
        dialog.success(isRTL ? 'تم نسخ الرابط! الصقه في Instagram' : 'Lien copié ! Collez-le sur Instagram');
        setShowShareMenu(false);
    };

    const shareOnTikTok = () => {
        navigator.clipboard.writeText(window.location.href);
        dialog.success(isRTL ? 'تم نسخ الرابط! الصقه في TikTok' : 'Lien copié ! Collez-le sur TikTok');
        setShowShareMenu(false);
    };

    // Envoyer un commentaire
    const handleComment = async (e) => {
        e.preventDefault();
        if (!fullscreenComment.trim()) return;

        try {
            await activityService.addComment(currentActivity.id, fullscreenComment.trim());
            setFullscreenComment('');
            setShowComments(true);
        } catch (error) {
            console.error('Erreur ajout commentaire:', error);
        }
    };

    // Badge de rôle
    const getRoleBadge = (author) => {
        const badges = {
            admin: { label: isRTL ? 'المدير' : 'Directeur', color: 'bg-red-100 text-red-700' },
            staff: { label: isRTL ? 'موظف' : 'Personnel', color: 'bg-blue-100 text-blue-700' },
            parent: { label: isRTL ? 'ولي' : 'Parent', color: 'bg-green-100 text-green-700' }
        };
        const defaultBadge = badges[author?.role] || badges.parent;

        // Si un poste précis (genré) est défini pour le personnel, on l'utilise à la place du libellé générique
        const positionLabel = getStaffPositionLabel(author?.staffPosition, author?.gender, isRTL);
        return positionLabel ? { ...defaultBadge, label: positionLabel } : defaultBadge;
    };

    // Emoji de réaction
    const getReactionEmoji = (reaction) => {
        const emojis = {
            like: '👍', love: '❤️', laugh: '😂', wow: '😮', clap: '👏', celebrate: '🎉'
        };
        return emojis[reaction] || '👍';
    };

    if (!currentActivity) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black"
            ref={containerRef}
        >
            {/* Bouton fermer avec Safe Area iOS */}
            <button
                type="button"
                onClick={onClose}
                className="absolute left-4 z-50 p-2.5 text-white bg-black/60 hover:bg-black/80 backdrop-blur-md rounded-full shadow-lg transition-transform active:scale-95"
                style={{ top: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}
                title={isRTL ? 'إغلاق' : 'Fermer'}
            >
                <FiX size={22} />
            </button>

            {/* Indicateurs de navigation */}
            {currentIndex > 0 && (
                <button
                    onClick={goToPrevious}
                    className="absolute top-1/4 left-1/2 -translate-x-1/2 z-40 text-white/50 animate-bounce"
                >
                    <FiChevronUp size={32} />
                </button>
            )}
            {currentIndex < activities.length - 1 && (
                <button
                    onClick={goToNext}
                    className="absolute bottom-32 left-1/2 -translate-x-1/2 z-40 text-white/50 animate-bounce"
                >
                    <FiChevronDown size={32} />
                </button>
            )}

            {/* Contenu avec swipe */}
            <motion.div
                drag="y"
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={0.2}
                onDragEnd={handleDragEnd}
                className="absolute inset-0"
                onClick={() => {
                    if (showComments) setShowComments(false);
                    if (showShareMenu) setShowShareMenu(false);
                    if (showReactionPicker) setShowReactionPicker(false);
                }}
            >
                {/* Média */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={`${currentActivity.id}-${currentPhotoIndex}`}
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ duration: 0.2 }}
                        className="absolute inset-0 flex items-center justify-center"
                    >
                        {isCurrentVideo ? (
                            <video
                                ref={el => videoRefs.current[currentIndex] = el}
                                src={currentActivity.mediaUrl}
                                className="w-full h-full object-contain"
                                loop
                                playsInline
                                muted={false}
                                controls
                            />
                        ) : (
                            <div 
                                className="relative w-full h-full flex items-center justify-center"
                                onTouchStart={handlePhotoTouchStart}
                                onTouchEnd={handlePhotoTouchEnd}
                            >
                                <img
                                    src={currentMediaItems[currentPhotoIndex]?.url || currentActivity.mediaUrl}
                                    alt={currentActivity.title}
                                    className="w-full h-full object-contain select-none"
                                />

                                {/* Contrôles carrousel pour photos multiples */}
                                {currentMediaItems.length > 1 && (
                                    <>
                                        {/* Bouton photo précédente */}
                                        {currentPhotoIndex > 0 && (
                                            <button
                                                type="button"
                                                onClick={goToPrevPhoto}
                                                className="absolute left-3 top-1/2 -translate-y-1/2 z-40 p-3 rounded-full bg-black/60 hover:bg-black/80 text-white transition-all backdrop-blur-md pointer-events-auto shadow-2xl active:scale-90"
                                                title={isRTL ? 'الصورة السابقة' : 'Photo précédente'}
                                            >
                                                <FiChevronLeft size={28} />
                                            </button>
                                        )}

                                        {/* Bouton photo suivante */}
                                        {currentPhotoIndex < currentMediaItems.length - 1 && (
                                            <button
                                                type="button"
                                                onClick={goToNextPhoto}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 z-40 p-3 rounded-full bg-black/60 hover:bg-black/80 text-white transition-all backdrop-blur-md pointer-events-auto shadow-2xl active:scale-90"
                                                title={isRTL ? 'الصورة التالية' : 'Photo suivante'}
                                            >
                                                <FiChevronRight size={28} />
                                            </button>
                                        )}

                                        {/* Badge compteur de photos en haut au milieu avec Safe Area */}
                                        <div 
                                            className="absolute left-1/2 -translate-x-1/2 z-40 px-3.5 py-1.5 bg-black/60 backdrop-blur-md rounded-full text-white text-xs font-semibold flex items-center gap-1.5 shadow-md pointer-events-none"
                                            style={{ top: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}
                                        >
                                            <FiImage size={13} className="text-green-400" />
                                            <span>{currentPhotoIndex + 1} / {currentMediaItems.length}</span>
                                        </div>

                                        {/* Puces de pagination en bas */}
                                        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 pointer-events-auto">
                                            {currentMediaItems.map((_, pIdx) => (
                                                <button
                                                    key={pIdx}
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setCurrentPhotoIndex(pIdx);
                                                    }}
                                                    className={`h-2 rounded-full transition-all ${
                                                        pIdx === currentPhotoIndex
                                                            ? 'w-6 bg-white shadow-md'
                                                            : 'w-2 bg-white/40 hover:bg-white/70'
                                                    }`}
                                                    title={`Photo ${pIdx + 1}`}
                                                />
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>

                {/* Overlay avec infos */}
                <div className="absolute inset-0 pointer-events-none">
                    {/* Gradient bas */}
                    <div className="absolute bottom-0 left-0 right-0 h-56 bg-gradient-to-t from-black/95 via-black/60 to-transparent" />

                    {/* Actions côté droit (placées en bas à droite pour ne pas bloquer les photos) */}
                    <div className="absolute right-2.5 bottom-28 z-40 flex flex-col items-center gap-2 pointer-events-auto">
                        {/* Réaction */}
                        <div className="relative">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (!showReactionPicker) {
                                        onReact?.(currentActivity.id, currentActivity.reactions?.userReaction || 'like');
                                    }
                                    setShowReactionPicker(false);
                                }}
                                onTouchStart={() => {
                                    longPressTimer.current = setTimeout(() => setShowReactionPicker(true), 500);
                                }}
                                onTouchEnd={() => clearTimeout(longPressTimer.current)}
                                onMouseDown={() => {
                                    longPressTimer.current = setTimeout(() => setShowReactionPicker(true), 500);
                                }}
                                onMouseUp={() => clearTimeout(longPressTimer.current)}
                                onMouseLeave={() => clearTimeout(longPressTimer.current)}
                                className="flex flex-col items-center py-1"
                            >
                                <div className={`w-10 h-10 rounded-full ${currentActivity.reactions?.userReaction ? 'bg-white/20' : 'bg-white/10'} backdrop-blur-sm flex items-center justify-center`}>
                                    <span className="text-xl">{getReactionEmoji(currentActivity.reactions?.userReaction)}</span>
                                </div>
                                <span className="text-white text-[10px] font-medium">
                                    {currentActivity.reactions?.total || 0}
                                </span>
                            </button>

                            {/* Picker de réactions */}
                            <AnimatePresence>
                                {showReactionPicker && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.5, x: 20 }}
                                        animate={{ opacity: 1, scale: 1, x: 0 }}
                                        exit={{ opacity: 0, scale: 0.5, x: 20 }}
                                        className="absolute right-12 top-0 bg-white dark:bg-gray-800 rounded-full shadow-xl px-2 py-1 flex items-center gap-1"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        {[
                                            { type: 'like', emoji: '👍' },
                                            { type: 'love', emoji: '❤️' },
                                            { type: 'laugh', emoji: '😂' },
                                            { type: 'wow', emoji: '😮' },
                                            { type: 'clap', emoji: '👏' },
                                            { type: 'celebrate', emoji: '🎉' }
                                        ].map((reaction) => (
                                            <button
                                                key={reaction.type}
                                                onClick={() => {
                                                    onReact?.(currentActivity.id, reaction.type);
                                                    setShowReactionPicker(false);
                                                }}
                                                className="w-9 h-9 flex items-center justify-center hover:scale-125 transition-transform"
                                            >
                                                <span className="text-2xl">{reaction.emoji}</span>
                                            </button>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Commentaires */}
                        <button
                            onClick={(e) => { e.stopPropagation(); setShowComments(true); }}
                            className="flex flex-col items-center py-1"
                        >
                            <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
                                <FiMessageCircle size={20} className="text-white" />
                            </div>
                            <span className="text-white text-[10px] font-medium">
                                {currentActivity.commentsCount || 0}
                            </span>
                        </button>

                        {/* Partage */}
                        <div className="relative">
                            <button
                                onClick={(e) => { e.stopPropagation(); setShowShareMenu(!showShareMenu); }}
                                className="flex flex-col items-center py-1"
                            >
                                <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
                                    <FiShare2 size={20} className="text-white" />
                                </div>
                                <span className="text-white text-[10px] font-medium">
                                    {isRTL ? 'مشاركة' : 'Partager'}
                                </span>
                            </button>

                            {/* Menu partage */}
                            <AnimatePresence>
                                {showShareMenu && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.8, x: 10 }}
                                        animate={{ opacity: 1, scale: 1, x: 0 }}
                                        exit={{ opacity: 0, scale: 0.8, x: 10 }}
                                        className="absolute right-12 top-0 bg-white dark:bg-gray-800 rounded-xl shadow-xl p-2 flex flex-col gap-1 min-w-[140px]"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <button onClick={shareOnFacebook} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                                            <FaFacebook size={20} className="text-blue-600" />
                                            <span className="text-sm text-gray-700 dark:text-gray-200">Facebook</span>
                                        </button>
                                        <button onClick={shareOnInstagram} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                                            <FaInstagram size={20} className="text-pink-500" />
                                            <span className="text-sm text-gray-700 dark:text-gray-200">Instagram</span>
                                        </button>
                                        <button onClick={shareOnTikTok} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                                            <FaTiktok size={20} className="text-gray-900 dark:text-white" />
                                            <span className="text-sm text-gray-700 dark:text-gray-200">TikTok</span>
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Infos auteur en bas */}
                    <div className="absolute bottom-20 left-3 right-16 pointer-events-auto z-30">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white overflow-hidden border-2 border-white shadow-lg flex-shrink-0">
                                {currentActivity.author?.profileImage ? (
                                    <img src={currentActivity.author.profileImage} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <FiUser size={14} />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-white text-sm drop-shadow-lg truncate">
                                        {currentActivity.author?.firstName} {currentActivity.author?.lastName}
                                    </span>
                                    <span className={`text-[9px] px-1 py-0.5 rounded-full flex-shrink-0 ${getRoleBadge(currentActivity.author).color}`}>
                                        {getRoleBadge(currentActivity.author).label}
                                    </span>
                                </div>
                                <h3 className="font-semibold text-white text-sm drop-shadow-lg truncate">{currentActivity.title}</h3>
                            </div>
                        </div>
                        {currentActivity.description && (
                            <p className="text-white/80 text-xs line-clamp-1 drop-shadow-md mt-1 ml-10">{currentActivity.description}</p>
                        )}
                    </div>

                    {/* Champ de commentaire avec Safe Area Bottom */}
                    <form
                        onSubmit={handleComment}
                        className="absolute bottom-0 left-0 right-0 p-3 pb-[max(0.75rem,calc(env(safe-area-inset-bottom,0px)+0.25rem))] pointer-events-auto bg-black/75 backdrop-blur-md z-40"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white overflow-hidden flex-shrink-0">
                                {user?.profile_image ? (
                                    <img src={user.profile_image} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <FiUser size={14} />
                                )}
                            </div>
                            <div className="flex-1 bg-white/10 rounded-full px-4 py-2 flex items-center">
                                <input
                                    ref={commentInputRef}
                                    type="text"
                                    value={fullscreenComment}
                                    onChange={(e) => setFullscreenComment(e.target.value)}
                                    placeholder={isRTL ? 'أضف تعليقاً...' : 'Ajouter un commentaire...'}
                                    className="w-full bg-transparent text-white placeholder-white/50 text-sm outline-none"
                                />
                            </div>
                            {fullscreenComment.trim() && (
                                <button type="submit" className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white flex-shrink-0">
                                    <FiMessageCircle size={16} />
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            </motion.div>

            {/* Panel des commentaires */}
            <AnimatePresence>
                {showComments && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/40 z-40"
                            onClick={() => setShowComments(false)}
                        />
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            drag="y"
                            dragControls={dragControls}
                            dragConstraints={{ top: 0, bottom: 0 }}
                            dragElastic={{ top: 0, bottom: 0.5 }}
                            onDragEnd={(e, info) => {
                                if (info.offset.y > 100 || info.velocity.y > 500) {
                                    setShowComments(false);
                                }
                            }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="absolute bottom-0 left-0 right-0 max-h-[70vh] bg-white dark:bg-gray-900 rounded-t-3xl z-50 flex flex-col"
                            style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div
                                className="flex justify-center py-3 cursor-grab active:cursor-grabbing touch-none flex-shrink-0"
                                onPointerDown={(e) => dragControls.start(e)}
                            >
                                <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full" />
                            </div>
                            <div className="px-4 pb-3 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                                <h3 className="text-center font-semibold text-gray-900 dark:text-white">
                                    {isRTL ? 'التعليقات' : 'Commentaires'} ({currentActivity.commentsCount || 0})
                                </h3>
                            </div>
                            <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 min-h-0">
                                <CommentSection
                                    activityId={currentActivity.id}
                                    commentsCount={currentActivity.commentsCount}
                                    isRTL={isRTL}
                                    isFullscreen={true}
                                />
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default FullscreenFeed;
