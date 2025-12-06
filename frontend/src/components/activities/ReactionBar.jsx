/**
 * Barre de réactions pour les activités - Style moderne type Facebook/Instagram
 */

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Emojis animés modernes avec gradients de couleur
const REACTIONS = [
  { type: 'like', emoji: '👍', animatedEmoji: '👍🏻', label: 'J\'aime', labelAr: 'أعجبني', color: 'from-blue-400 to-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/40' },
  { type: 'love', emoji: '❤️', animatedEmoji: '💗', label: 'J\'adore', labelAr: 'أحببته', color: 'from-red-400 to-pink-500', bg: 'bg-red-100 dark:bg-red-900/40' },
  { type: 'laugh', emoji: '😂', animatedEmoji: '🤣', label: 'Haha', labelAr: 'هاها', color: 'from-yellow-400 to-orange-500', bg: 'bg-yellow-100 dark:bg-yellow-900/40' },
  { type: 'wow', emoji: '😮', animatedEmoji: '🤩', label: 'Wow', labelAr: 'واو', color: 'from-yellow-400 to-amber-500', bg: 'bg-amber-100 dark:bg-amber-900/40' },
  { type: 'clap', emoji: '👏', animatedEmoji: '👏🏻', label: 'Bravo', labelAr: 'برافو', color: 'from-green-400 to-emerald-500', bg: 'bg-green-100 dark:bg-green-900/40' },
  { type: 'celebrate', emoji: '🎉', animatedEmoji: '🥳', label: 'Célébrer', labelAr: 'احتفال', color: 'from-purple-400 to-pink-500', bg: 'bg-purple-100 dark:bg-purple-900/40' }
];

const ReactionBar = ({ reactions = {}, onReact, isRTL = false }) => {
  const [showPicker, setShowPicker] = useState(false);
  const [hoveredReaction, setHoveredReaction] = useState(null);
  const longPressTimer = useRef(null);
  const userReaction = reactions.userReaction;

  const handleReaction = (type) => {
    onReact(type);
    setShowPicker(false);
  };

  // Gestion de l'appui long pour afficher le picker
  const handleTouchStart = (e) => {
    e.preventDefault(); // Empêcher la sélection de texte
    longPressTimer.current = setTimeout(() => {
      setShowPicker(true);
    }, 500); // 500ms pour l'appui long
  };

  const handleTouchEnd = (e) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      // Si le picker n'est pas affiché, c'était un tap court -> toggle reaction
      if (!showPicker) {
        if (userReaction) {
          onReact(userReaction); // Retirer la réaction
        } else {
          onReact('like'); // Ajouter un like par défaut
        }
      }
    }
  };

  const handleTouchCancel = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  };

  const currentReaction = REACTIONS.find(r => r.type === userReaction);

  return (
    <div className="relative overflow-visible">
      {/* Bouton principal */}
      <div className="flex items-center gap-3 flex-wrap">
        <motion.button
          onClick={() => userReaction ? onReact(userReaction) : setShowPicker(!showPicker)}
          onMouseEnter={() => setShowPicker(true)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchCancel}
          onContextMenu={(e) => e.preventDefault()}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all shadow-sm select-none touch-manipulation
            ${currentReaction
              ? `${currentReaction.bg} bg-gradient-to-r ${currentReaction.color} bg-clip-text text-transparent border border-transparent`
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600'
            }`}
        >
          <motion.span
            className="text-xl"
            animate={currentReaction ? { scale: [1, 1.2, 1] } : {}}
            transition={{ duration: 0.3 }}
          >
            {currentReaction?.animatedEmoji || currentReaction?.emoji || '👍'}
          </motion.span>
          <span className={currentReaction ? 'text-gray-700 dark:text-gray-200 font-semibold' : ''}>
            {currentReaction ? (isRTL ? currentReaction.labelAr : currentReaction.label) : (isRTL ? 'أعجبني' : 'J\'aime')}
          </span>
        </motion.button>

        {/* Compteur avec emojis empilés style Facebook */}
        {reactions.total > 0 && (
          <div className="flex items-center gap-2">
            <div className="flex -space-x-1">
              {REACTIONS.filter(r => reactions[r.type] > 0).slice(0, 3).map((r, index) => (
                <motion.div
                  key={r.type}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className={`w-6 h-6 rounded-full ${r.bg} flex items-center justify-center border-2 border-white dark:border-gray-800 shadow-sm`}
                  style={{ zIndex: 3 - index }}
                >
                  <span className="text-sm">{r.emoji}</span>
                </motion.div>
              ))}
            </div>
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{reactions.total}</span>
          </div>
        )}
      </div>

      {/* Picker de réactions moderne avec tooltips */}
      <AnimatePresence>
        {showPicker && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            onMouseLeave={() => setShowPicker(false)}
            className={`absolute bottom-full mb-3 ${isRTL ? 'right-0' : 'left-0'}
              bg-white dark:bg-gray-800 rounded-full shadow-2xl border border-gray-100 dark:border-gray-700
              px-2 py-1.5 flex items-center gap-0.5 z-50`}
          >
            {REACTIONS.map((reaction, index) => (
              <motion.div
                key={reaction.type}
                className="relative"
                onMouseEnter={() => setHoveredReaction(reaction.type)}
                onMouseLeave={() => setHoveredReaction(null)}
              >
                {/* Tooltip */}
                <AnimatePresence>
                  {hoveredReaction === reaction.type && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-2 py-1 rounded-lg whitespace-nowrap shadow-lg"
                    >
                      {isRTL ? reaction.labelAr : reaction.label}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Bouton emoji */}
                <motion.button
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.03, type: "spring", stiffness: 400 }}
                  whileHover={{ scale: 1.3, y: -4 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleReaction(reaction.type)}
                  className={`text-2xl w-10 h-10 flex items-center justify-center rounded-full transition-all
                    ${userReaction === reaction.type ? `${reaction.bg}` : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                >
                  {reaction.emoji}
                </motion.button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ReactionBar;

