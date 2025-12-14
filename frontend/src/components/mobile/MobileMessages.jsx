/**
 * MobileMessages - Interface de messagerie mobile (chat-like)
 * 
 * Liste des conversations avec aperçu, puis vue chat pour
 * une conversation spécifique.
 */

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MessageCircle,
    Send,
    ArrowLeft,
    ArrowRight,
    Search,
    Plus,
    Check,
    CheckCheck,
    Clock,
    User,
    Paperclip,
    Image,
    Smile,
    MoreVertical
} from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import MobileHeader from './MobileHeader';

const MobileMessages = ({
    conversations = [],
    currentConversation = null,
    messages = [],
    loading = false,
    sending = false,
    onSelectConversation,
    onSendMessage,
    onBack,
    onNewConversation,
    currentUserId
}) => {
    const { isRTL } = useLanguage();
    const [messageText, setMessageText] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    // Auto-scroll vers le bas quand nouveaux messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = () => {
        if (messageText.trim() && onSendMessage) {
            onSendMessage(messageText.trim());
            setMessageText('');
            inputRef.current?.focus();
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const formatTime = (date) => {
        const d = new Date(date);
        const now = new Date();
        const diff = now - d;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days === 0) {
            return d.toLocaleTimeString(isRTL ? 'ar-TN' : 'fr-FR', {
                hour: '2-digit',
                minute: '2-digit'
            });
        } else if (days === 1) {
            return isRTL ? 'أمس' : 'Hier';
        } else if (days < 7) {
            return d.toLocaleDateString(isRTL ? 'ar-TN' : 'fr-FR', { weekday: 'short' });
        }
        return d.toLocaleDateString(isRTL ? 'ar-TN' : 'fr-FR', {
            day: 'numeric',
            month: 'short'
        });
    };

    const getMessageStatus = (message) => {
        if (message.status === 'sending') return <Clock className="w-3.5 h-3.5 text-gray-400" />;
        if (message.status === 'sent') return <Check className="w-3.5 h-3.5 text-gray-400" />;
        if (message.status === 'delivered') return <CheckCheck className="w-3.5 h-3.5 text-gray-400" />;
        if (message.status === 'read') return <CheckCheck className="w-3.5 h-3.5 text-blue-500" />;
        return null;
    };

    const filteredConversations = conversations.filter(conv => {
        if (!searchQuery) return true;
        const name = conv.participant_name || conv.name || '';
        return name.toLowerCase().includes(searchQuery.toLowerCase());
    });

    const BackIcon = isRTL ? ArrowRight : ArrowLeft;

    // Vue Conversation (Chat)
    if (currentConversation) {
        return (
            <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900">
                {/* Header de la conversation */}
                <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center gap-3 safe-area-inset-top">
                    <button
                        onClick={onBack}
                        className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                    >
                        <BackIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </button>

                    <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                        {currentConversation.avatar ? (
                            <img
                                src={currentConversation.avatar}
                                alt=""
                                className="w-full h-full rounded-full object-cover"
                            />
                        ) : (
                            <User className="w-5 h-5 text-primary-600" />
                        )}
                    </div>

                    <div className="flex-1 min-w-0">
                        <h2 className="font-semibold text-gray-900 dark:text-white truncate">
                            {currentConversation.participant_name || currentConversation.name}
                        </h2>
                        {currentConversation.online && (
                            <p className="text-xs text-green-500">{isRTL ? 'متصل' : 'En ligne'}</p>
                        )}
                    </div>

                    <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                        <MoreVertical className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <MessageCircle className="w-16 h-16 text-gray-300 mb-4" />
                            <p className="text-gray-500 dark:text-gray-400">
                                {isRTL ? 'ابدأ المحادثة!' : 'Commencez la conversation !'}
                            </p>
                        </div>
                    ) : (
                        <>
                            {messages.map((message, index) => {
                                const isOwn = message.sender_id === currentUserId;
                                const showAvatar = !isOwn && (
                                    index === 0 ||
                                    messages[index - 1]?.sender_id !== message.sender_id
                                );

                                return (
                                    <motion.div
                                        key={message.id || index}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                                    >
                                        {!isOwn && showAvatar && (
                                            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mr-2 flex-shrink-0">
                                                <User className="w-4 h-4 text-gray-500" />
                                            </div>
                                        )}
                                        {!isOwn && !showAvatar && <div className="w-10" />}

                                        <div className={`max-w-[75%] ${isOwn ? 'order-1' : ''}`}>
                                            <div
                                                className={`px-4 py-2.5 rounded-2xl ${isOwn
                                                        ? 'bg-primary-600 text-white rounded-br-md'
                                                        : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-md shadow-sm'
                                                    }`}
                                            >
                                                <p className="text-sm whitespace-pre-wrap break-words">
                                                    {message.content || message.text}
                                                </p>
                                            </div>
                                            <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end' : ''}`}>
                                                <span className="text-xs text-gray-400">
                                                    {formatTime(message.created_at || message.timestamp)}
                                                </span>
                                                {isOwn && getMessageStatus(message)}
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </>
                    )}
                </div>

                {/* Input */}
                <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-3 safe-area-inset-bottom">
                    <div className="flex items-end gap-2">
                        <button className="p-2.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full flex-shrink-0">
                            <Paperclip className="w-5 h-5" />
                        </button>

                        <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-2xl px-4 py-2.5">
                            <textarea
                                ref={inputRef}
                                value={messageText}
                                onChange={(e) => setMessageText(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder={isRTL ? 'اكتب رسالة...' : 'Écrivez un message...'}
                                className="w-full bg-transparent text-gray-900 dark:text-white placeholder-gray-500 resize-none focus:outline-none text-sm max-h-24"
                                rows={1}
                                style={{ minHeight: '24px' }}
                            />
                        </div>

                        <button
                            onClick={handleSend}
                            disabled={!messageText.trim() || sending}
                            className={`p-2.5 rounded-full flex-shrink-0 transition-colors ${messageText.trim()
                                    ? 'bg-primary-600 text-white hover:bg-primary-700'
                                    : 'bg-gray-200 dark:bg-gray-700 text-gray-400'
                                }`}
                        >
                            {sending ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <Send className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
                            )}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Vue Liste des conversations
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
            <MobileHeader
                title={isRTL ? 'الرسائل' : 'Messages'}
                showSearch={true}
                onSearch={setSearchQuery}
                searchPlaceholder={isRTL ? 'بحث...' : 'Rechercher...'}
                actions={[
                    { icon: Plus, onClick: onNewConversation, label: 'Nouveau' }
                ]}
            />

            <div className="p-4">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : filteredConversations.length === 0 ? (
                    <div className="text-center py-12">
                        <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 dark:text-gray-400 mb-4">
                            {searchQuery
                                ? (isRTL ? 'لا توجد نتائج' : 'Aucun résultat')
                                : (isRTL ? 'لا توجد محادثات' : 'Aucune conversation')}
                        </p>
                        {!searchQuery && (
                            <button
                                onClick={onNewConversation}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium"
                            >
                                <Plus className="w-4 h-4" />
                                {isRTL ? 'محادثة جديدة' : 'Nouvelle conversation'}
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-2">
                        {filteredConversations.map((conversation) => (
                            <motion.button
                                key={conversation.id}
                                onClick={() => onSelectConversation?.(conversation)}
                                className="w-full bg-white dark:bg-gray-800 rounded-xl p-4 flex items-center gap-3 text-left rtl:text-right active:scale-[0.98] transition-transform shadow-sm"
                                whileTap={{ scale: 0.98 }}
                            >
                                {/* Avatar */}
                                <div className="relative flex-shrink-0">
                                    <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                                        {conversation.avatar ? (
                                            <img
                                                src={conversation.avatar}
                                                alt=""
                                                className="w-full h-full rounded-full object-cover"
                                            />
                                        ) : (
                                            <User className="w-6 h-6 text-primary-600" />
                                        )}
                                    </div>
                                    {conversation.online && (
                                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full" />
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                                            {conversation.participant_name || conversation.name}
                                        </h3>
                                        <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                                            {formatTime(conversation.last_message_at || conversation.updated_at)}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                            {conversation.last_message || (isRTL ? 'لا توجد رسائل' : 'Aucun message')}
                                        </p>
                                        {conversation.unread_count > 0 && (
                                            <span className="flex-shrink-0 ml-2 px-2 py-0.5 bg-primary-600 text-white text-xs font-bold rounded-full min-w-[20px] text-center">
                                                {conversation.unread_count}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </motion.button>
                        ))}
                    </div>
                )}
            </div>

            {/* FAB pour nouveau message */}
            {onNewConversation && (
                <motion.button
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={onNewConversation}
                    className="fixed bottom-24 right-4 rtl:right-auto rtl:left-4 w-14 h-14 bg-primary-600 hover:bg-primary-700 text-white rounded-full shadow-lg flex items-center justify-center z-40"
                >
                    <Plus className="w-6 h-6" />
                </motion.button>
            )}
        </div>
    );
};

export default MobileMessages;
