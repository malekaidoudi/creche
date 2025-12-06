/**
 * Modal affichant la liste des personnes ayant réagi à une activité
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiUser } from 'react-icons/fi';
import activityService from '../../services/activityService';

const REACTIONS = [
    { type: 'like', emoji: '👍', label: 'J\'aime', labelAr: 'أعجبني', bg: 'bg-blue-100 dark:bg-blue-900/40' },
    { type: 'love', emoji: '❤️', label: 'J\'adore', labelAr: 'أحببته', bg: 'bg-red-100 dark:bg-red-900/40' },
    { type: 'laugh', emoji: '😂', label: 'Haha', labelAr: 'هاها', bg: 'bg-yellow-100 dark:bg-yellow-900/40' },
    { type: 'wow', emoji: '😮', label: 'Wow', labelAr: 'واو', bg: 'bg-amber-100 dark:bg-amber-900/40' },
    { type: 'clap', emoji: '👏', label: 'Bravo', labelAr: 'برافو', bg: 'bg-green-100 dark:bg-green-900/40' },
    { type: 'celebrate', emoji: '🎉', label: 'Célébrer', labelAr: 'احتفال', bg: 'bg-purple-100 dark:bg-purple-900/40' }
];

const ReactorsModal = ({ activityId, isOpen, onClose, isRTL = false }) => {
    const [loading, setLoading] = useState(true);
    const [reactionsData, setReactionsData] = useState({});
    const [selectedTab, setSelectedTab] = useState('all');
    const [total, setTotal] = useState(0);

    useEffect(() => {
        if (isOpen && activityId) {
            fetchReactionDetails();
        }
    }, [isOpen, activityId]);

    const fetchReactionDetails = async () => {
        setLoading(true);
        try {
            const response = await activityService.getReactionDetails(activityId);
            if (response.success) {
                setReactionsData(response.reactions);
                setTotal(response.total);
            }
        } catch (error) {
            console.error('Erreur chargement réactions:', error);
        } finally {
            setLoading(false);
        }
    };

    // Obtenir tous les utilisateurs ou filtrés par type
    const getUsers = () => {
        if (selectedTab === 'all') {
            const allUsers = [];
            Object.entries(reactionsData).forEach(([type, users]) => {
                users.forEach(user => {
                    allUsers.push({ ...user, reactionType: type });
                });
            });
            return allUsers;
        }
        return (reactionsData[selectedTab] || []).map(user => ({ ...user, reactionType: selectedTab }));
    };

    const getReactionEmoji = (type) => {
        return REACTIONS.find(r => r.type === type)?.emoji || '👍';
    };

    const getRoleLabel = (role) => {
        const roles = {
            admin: isRTL ? 'مدير' : 'Admin',
            staff: isRTL ? 'موظف' : 'Personnel',
            parent: isRTL ? 'ولي أمر' : 'Parent'
        };
        return roles[role] || role;
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {isRTL ? 'التفاعلات' : 'Réactions'}
                        </h3>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                        >
                            <FiX className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-1 p-2 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
                        <button
                            onClick={() => setSelectedTab('all')}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap
                ${selectedTab === 'all'
                                    ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400'
                                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
                                }`}
                        >
                            {isRTL ? 'الكل' : 'Tous'} ({total})
                        </button>
                        {REACTIONS.filter(r => reactionsData[r.type]?.length > 0).map(reaction => (
                            <button
                                key={reaction.type}
                                onClick={() => setSelectedTab(reaction.type)}
                                className={`px-3 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-1
                  ${selectedTab === reaction.type
                                        ? `${reaction.bg} text-gray-900 dark:text-white`
                                        : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
                                    }`}
                            >
                                <span>{reaction.emoji}</span>
                                <span>{reactionsData[reaction.type]?.length || 0}</span>
                            </button>
                        ))}
                    </div>

                    {/* Liste des utilisateurs */}
                    <div className="overflow-y-auto max-h-[50vh] p-2">
                        {loading ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                            </div>
                        ) : getUsers().length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                {isRTL ? 'لا توجد تفاعلات' : 'Aucune réaction'}
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {getUsers().map((user, index) => (
                                    <motion.div
                                        key={`${user.userId}-${index}`}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.03 }}
                                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                    >
                                        {/* Avatar */}
                                        <div className="relative">
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white overflow-hidden">
                                                {user.profileImage ? (
                                                    <img src={user.profileImage} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <FiUser className="w-6 h-6" />
                                                )}
                                            </div>
                                            {/* Badge réaction */}
                                            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm border border-gray-200 dark:border-gray-600">
                                                <span className="text-sm">{getReactionEmoji(user.reactionType)}</span>
                                            </div>
                                        </div>

                                        {/* Info utilisateur */}
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-gray-900 dark:text-white truncate">
                                                {user.firstName} {user.lastName}
                                            </p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                {getRoleLabel(user.role)}
                                            </p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default ReactorsModal;
