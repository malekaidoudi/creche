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

const ReactionBar = ({ reactions = {}, onReact, onShowReactors, isRTL = false }) => {
  const [showPicker, setShowPicker] = useState(false);
  const [hoveredReaction, setHoveredReaction] = useState(null);
  const hidePickerTimer = useRef(null);
  const userReaction = reactions?.userReaction || null;

  const handleReaction = (type) => {
    onReact(type);
    setShowPicker(false);
  };

  // Clic sur le bouton principal = like ou annuler
  const handleMainClick = () => {
    if (userReaction) {
      onReact(userReaction); // Annuler
    } else {
      onReact('like'); // Like
    }
  };

  // Desktop: survol pour afficher picker
  const handleMouseEnter = () => {
    if (hidePickerTimer.current) clearTimeout(hidePickerTimer.current);
    setShowPicker(true);
  };

  const handleMouseLeave = () => {
    hidePickerTimer.current = setTimeout(() => setShowPicker(false), 300);
  };

  const currentReaction = userReaction ? REACTIONS.find(r => r.type === userReaction) : null;

  return (
    <div className="relative overflow-visible">
      {/* Bouton principal */}
      <div className="flex items-center gap-3 flex-wrap">
        <motion.button
          onClick={handleMainClick}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all shadow-sm
            ${currentReaction
              ? `${currentReaction.bg} bg-gradient-to-r ${currentReaction.color} bg-clip-text text-transparent border border-transparent`
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600'
            }`}
        >
          <motion.span
            key={userReaction || 'default'}
            className="text-xl"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            {currentReaction ? (currentReaction.animatedEmoji || currentReaction.emoji) : '👍'}
          </motion.span>
          <span className={currentReaction ? 'text-gray-700 dark:text-gray-200 font-semibold' : ''}>
            {currentReaction ? (isRTL ? currentReaction.labelAr : currentReaction.label) : (isRTL ? 'أعجبني' : 'J\'aime')}
          </span>
        </motion.button>

        {/* Compteur avec emojis empilés style Facebook - Cliquable */}
        {reactions.total > 0 && (
          <button
            onClick={onShowReactors}
            className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg px-2 py-1 transition-colors"
          >
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
          </button>
        )}
      </div>

      {/* Overlay pour fermer le picker sur mobile */}
      {showPicker && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowPicker(false)}
        />
      )}

      {/* Picker de réactions moderne avec tooltips */}
      <AnimatePresence>
        {showPicker && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            onMouseEnter={() => hidePickerTimer.current && clearTimeout(hidePickerTimer.current)}
            onMouseLeave={handleMouseLeave}
            style={{
              position: 'absolute',
              bottom: '100%',
              left: isRTL ? 'auto' : '0',
              right: isRTL ? '0' : 'auto',
              marginBottom: '8px',
              zIndex: 9999
            }}
            className="bg-white dark:bg-gray-800 rounded-full shadow-2xl border border-gray-100 dark:border-gray-700 px-2 py-1.5 flex items-center gap-0.5"
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
                    ${userReaction === reaction.type ? `${reaction.bg} ring-2 ring-offset-2 ring-blue-500` : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
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

