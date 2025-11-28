/**
 * Barre de réactions pour les activités
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const REACTIONS = [
  { type: 'like', emoji: '👍', label: 'J\'aime', labelAr: 'أعجبني' },
  { type: 'love', emoji: '❤️', label: 'J\'adore', labelAr: 'أحببته' },
  { type: 'laugh', emoji: '😂', label: 'Haha', labelAr: 'هاها' },
  { type: 'wow', emoji: '😮', label: 'Wow', labelAr: 'واو' },
  { type: 'clap', emoji: '👏', label: 'Bravo', labelAr: 'برافو' },
  { type: 'celebrate', emoji: '🎉', label: 'Célébrer', labelAr: 'احتفال' }
];

const ReactionBar = ({ reactions = {}, onReact, isRTL = false }) => {
  const [showPicker, setShowPicker] = useState(false);
  const userReaction = reactions.userReaction;

  const handleReaction = (type) => {
    onReact(type);
    setShowPicker(false);
  };

  const currentReaction = REACTIONS.find(r => r.type === userReaction);

  return (
    <div className="relative">
      {/* Bouton principal */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowPicker(!showPicker)}
          onMouseEnter={() => setShowPicker(true)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all
            ${userReaction 
              ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            }`}
        >
          <span className="text-lg">{currentReaction?.emoji || '👍'}</span>
          <span>{currentReaction ? (isRTL ? currentReaction.labelAr : currentReaction.label) : (isRTL ? 'أعجبني' : 'J\'aime')}</span>
        </button>

        {/* Compteur total */}
        {reactions.total > 0 && (
          <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex -space-x-1">
              {REACTIONS.filter(r => reactions[r.type] > 0).slice(0, 3).map(r => (
                <span key={r.type} className="text-base">{r.emoji}</span>
              ))}
            </div>
            <span>{reactions.total}</span>
          </div>
        )}
      </div>

      {/* Picker de réactions */}
      <AnimatePresence>
        {showPicker && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            onMouseLeave={() => setShowPicker(false)}
            className={`absolute bottom-full mb-2 ${isRTL ? 'right-0' : 'left-0'} 
              bg-white dark:bg-gray-800 rounded-full shadow-lg border border-gray-200 dark:border-gray-700 
              px-2 py-1.5 flex gap-1 z-50`}
          >
            {REACTIONS.map((reaction) => (
              <motion.button
                key={reaction.type}
                whileHover={{ scale: 1.3, y: -5 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleReaction(reaction.type)}
                className={`text-2xl p-1 rounded-full transition-colors
                  ${userReaction === reaction.type ? 'bg-blue-100 dark:bg-blue-900/30' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                title={isRTL ? reaction.labelAr : reaction.label}
              >
                {reaction.emoji}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ReactionBar;

