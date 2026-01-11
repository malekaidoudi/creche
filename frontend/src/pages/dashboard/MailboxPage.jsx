import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Mail,
    MailOpen,
    Send,
    Trash2,
    RefreshCw,
    Search,
    Filter,
    ChevronLeft,
    Clock,
    User,
    Phone,
    MessageSquare,
    CheckCircle,
    Archive,
    Reply,
    X,
    Inbox,
    AlertCircle
} from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

const MailboxPage = () => {
    const { isRTL } = useLanguage();
    const [messages, setMessages] = useState([]);
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [stats, setStats] = useState({ new_count: 0, total: 0 });
    const [showReplyModal, setShowReplyModal] = useState(false);
    const [replyText, setReplyText] = useState('');
    const [replySubject, setReplySubject] = useState('');

    // Charger les messages
    const loadMessages = async () => {
        try {
            setLoading(true);
            const statusParam = filter === 'all' ? '' : `?status=${filter}`;
            const response = await api.get(`/api/admin/contact-messages${statusParam}`);

            if (response.data.success) {
                setMessages(response.data.messages);
                setStats({
                    new_count: response.data.unreadCount,
                    total: response.data.total
                });
            }
        } catch (error) {
            console.error('Erreur chargement messages:', error);
            toast.error(isRTL ? 'خطأ في تحميل الرسائل' : 'Erreur lors du chargement des messages');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadMessages();
    }, [filter]);

    // Sélectionner un message
    const handleSelectMessage = async (message) => {
        try {
            const response = await api.get(`/api/admin/contact-messages/${message.id}`);
            if (response.data.success) {
                setSelectedMessage(response.data.message);
                // Mettre à jour la liste locale
                setMessages(prev => prev.map(m =>
                    m.id === message.id ? { ...m, status: 'read' } : m
                ));
                // Mettre à jour le compteur
                if (message.status === 'new') {
                    setStats(prev => ({ ...prev, new_count: Math.max(0, prev.new_count - 1) }));
                }
            }
        } catch (error) {
            console.error('Erreur lecture message:', error);
        }
    };

    // Répondre à un message
    const handleReply = async () => {
        if (!replyText.trim()) {
            toast.error(isRTL ? 'الرجاء كتابة رسالة' : 'Veuillez écrire un message');
            return;
        }

        try {
            setSending(true);
            const response = await api.post(`/api/admin/contact-messages/${selectedMessage.id}/reply`, {
                replyMessage: replyText,
                subject: replySubject || `Re: ${selectedMessage.subject || 'Votre message'}`
            });

            if (response.data.success) {
                toast.success(
                    response.data.emailSent
                        ? (isRTL ? 'تم إرسال الرد بنجاح' : 'Réponse envoyée avec succès')
                        : (isRTL ? 'تم حفظ الرد (البريد غير متاح)' : 'Réponse enregistrée (email non disponible)')
                );
                setShowReplyModal(false);
                setReplyText('');
                setReplySubject('');
                // Mettre à jour le message
                setSelectedMessage(prev => ({ ...prev, status: 'responded' }));
                setMessages(prev => prev.map(m =>
                    m.id === selectedMessage.id ? { ...m, status: 'responded' } : m
                ));
            }
        } catch (error) {
            console.error('Erreur envoi réponse:', error);
            toast.error(isRTL ? 'خطأ في إرسال الرد' : 'Erreur lors de l\'envoi de la réponse');
        } finally {
            setSending(false);
        }
    };

    // Supprimer un message
    const handleDelete = async (messageId) => {
        if (!confirm(isRTL ? 'هل أنت متأكد من حذف هذه الرسالة؟' : 'Êtes-vous sûr de vouloir supprimer ce message ?')) {
            return;
        }

        try {
            await api.delete(`/api/admin/contact-messages/${messageId}`);
            toast.success(isRTL ? 'تم حذف الرسالة' : 'Message supprimé');
            setMessages(prev => prev.filter(m => m.id !== messageId));
            if (selectedMessage?.id === messageId) {
                setSelectedMessage(null);
            }
        } catch (error) {
            console.error('Erreur suppression:', error);
            toast.error(isRTL ? 'خطأ في الحذف' : 'Erreur lors de la suppression');
        }
    };

    // Archiver un message
    const handleArchive = async (messageId) => {
        try {
            await api.patch(`/api/admin/contact-messages/${messageId}/status`, { status: 'archived' });
            toast.success(isRTL ? 'تم أرشفة الرسالة' : 'Message archivé');
            loadMessages();
        } catch (error) {
            console.error('Erreur archivage:', error);
        }
    };

    // Filtrer les messages
    const filteredMessages = messages.filter(m => {
        if (!searchTerm) return true;
        const search = searchTerm.toLowerCase();
        return (
            m.name?.toLowerCase().includes(search) ||
            m.email?.toLowerCase().includes(search) ||
            m.subject?.toLowerCase().includes(search) ||
            m.message?.toLowerCase().includes(search)
        );
    });

    // Formater la date
    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now - date;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days === 0) {
            return date.toLocaleTimeString(isRTL ? 'ar-TN' : 'fr-FR', { hour: '2-digit', minute: '2-digit' });
        } else if (days === 1) {
            return isRTL ? 'أمس' : 'Hier';
        } else if (days < 7) {
            return date.toLocaleDateString(isRTL ? 'ar-TN' : 'fr-FR', { weekday: 'long' });
        } else {
            return date.toLocaleDateString(isRTL ? 'ar-TN' : 'fr-FR', { day: 'numeric', month: 'short' });
        }
    };

    // Badge de statut
    const StatusBadge = ({ status }) => {
        const config = {
            new: { color: 'bg-blue-100 text-blue-800', icon: Mail, label: isRTL ? 'جديد' : 'Nouveau' },
            read: { color: 'bg-gray-100 text-gray-800', icon: MailOpen, label: isRTL ? 'مقروء' : 'Lu' },
            responded: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: isRTL ? 'تمت الإجابة' : 'Répondu' },
            archived: { color: 'bg-yellow-100 text-yellow-800', icon: Archive, label: isRTL ? 'مؤرشف' : 'Archivé' }
        };
        const { color, icon: Icon, label } = config[status] || config.new;

        return (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>
                <Icon className="w-3 h-3" />
                {label}
            </span>
        );
    };

    if (loading && messages.length === 0) {
        return (
            <div className="flex items-center justify-center h-96">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Mail className="w-7 h-7 text-primary-500" />
                        {isRTL ? 'البريد' : 'Courrier'}
                        {stats.new_count > 0 && (
                            <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                                {stats.new_count}
                            </span>
                        )}
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        {isRTL ? 'إدارة رسائل الاتصال' : 'Gérer les messages de contact'}
                    </p>
                </div>

                <Button onClick={loadMessages} variant="outline" className="gap-2">
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    {isRTL ? 'تحديث' : 'Actualiser'}
                </Button>
            </div>

            {/* Filtres et recherche */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                        {/* Recherche */}
                        <div className="relative flex-1">
                            <Search className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder={isRTL ? 'بحث...' : 'Rechercher...'}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 rtl:pl-4 rtl:pr-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                            />
                        </div>

                        {/* Filtres */}
                        <div className="flex gap-2">
                            {[
                                { value: 'all', label: isRTL ? 'الكل' : 'Tous', icon: Inbox },
                                { value: 'new', label: isRTL ? 'جديد' : 'Nouveaux', icon: Mail },
                                { value: 'read', label: isRTL ? 'مقروء' : 'Lus', icon: MailOpen },
                                { value: 'responded', label: isRTL ? 'تمت الإجابة' : 'Répondus', icon: CheckCircle }
                            ].map(f => (
                                <button
                                    key={f.value}
                                    onClick={() => setFilter(f.value)}
                                    className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${filter === f.value
                                        ? 'bg-primary-500 text-white'
                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                        }`}
                                >
                                    <f.icon className="w-4 h-4" />
                                    <span className="hidden sm:inline">{f.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Contenu principal */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Liste des messages */}
                <Card className="lg:col-span-1 overflow-hidden">
                    <CardHeader className="border-b dark:border-gray-700 py-3">
                        <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            {isRTL ? `${filteredMessages.length} رسالة` : `${filteredMessages.length} message(s)`}
                        </CardTitle>
                    </CardHeader>
                    <div className="divide-y dark:divide-gray-700 max-h-[600px] overflow-y-auto">
                        {filteredMessages.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                <Inbox className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                <p>{isRTL ? 'لا توجد رسائل' : 'Aucun message'}</p>
                            </div>
                        ) : (
                            filteredMessages.map((message) => (
                                <motion.div
                                    key={message.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 ${selectedMessage?.id === message.id ? 'bg-primary-50 dark:bg-primary-900/20' : ''
                                        } ${message.status === 'new' ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''} group`}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div
                                            className="flex-1 min-w-0"
                                            onClick={() => handleSelectMessage(message)}
                                        >
                                            <div className="flex items-center gap-2">
                                                {message.status === 'new' && (
                                                    <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                                                )}
                                                <span className={`font-medium truncate ${message.status === 'new' ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                                                    {message.name}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 truncate mt-1">
                                                {message.subject || (isRTL ? 'بدون موضوع' : 'Sans sujet')}
                                            </p>
                                            <p className="text-xs text-gray-500 truncate mt-1">
                                                {message.message?.substring(0, 50)}...
                                            </p>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <div className="flex items-center gap-1">
                                                <span className="text-xs text-gray-500 whitespace-nowrap">
                                                    {formatDate(message.created_at)}
                                                </span>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDelete(message.id);
                                                    }}
                                                    className="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                                                    title={isRTL ? 'حذف' : 'Supprimer'}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <StatusBadge status={message.status} />
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>
                </Card>

                {/* Détail du message */}
                <Card className="lg:col-span-2">
                    {selectedMessage ? (
                        <div className="h-full flex flex-col">
                            {/* Header du message */}
                            <div className="p-4 border-b dark:border-gray-700">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                            {selectedMessage.subject || (isRTL ? 'بدون موضوع' : 'Sans sujet')}
                                        </h2>
                                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                                            <span className="flex items-center gap-1">
                                                <User className="w-4 h-4" />
                                                {selectedMessage.name}
                                            </span>
                                            <a href={`mailto:${selectedMessage.email}`} className="flex items-center gap-1 text-primary-500 hover:underline">
                                                <Mail className="w-4 h-4" />
                                                {selectedMessage.email}
                                            </a>
                                            {selectedMessage.phone && (
                                                <a href={`tel:${selectedMessage.phone}`} className="flex items-center gap-1 text-primary-500 hover:underline">
                                                    <Phone className="w-4 h-4" />
                                                    {selectedMessage.phone}
                                                </a>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 mt-2">
                                            <Clock className="w-4 h-4 text-gray-400" />
                                            <span className="text-sm text-gray-500">
                                                {new Date(selectedMessage.created_at).toLocaleString(isRTL ? 'ar-TN' : 'fr-FR')}
                                            </span>
                                            <StatusBadge status={selectedMessage.status} />
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setSelectedMessage(null)}
                                        className="lg:hidden p-2 text-gray-500 hover:text-gray-700"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Corps du message */}
                            <div className="flex-1 p-6 overflow-y-auto">
                                <div className="prose dark:prose-invert max-w-none">
                                    <p className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                                        {selectedMessage.message}
                                    </p>
                                </div>

                                {/* Info réponse */}
                                {selectedMessage.status === 'responded' && selectedMessage.responded_at && (
                                    <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                                        <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                                            <CheckCircle className="w-5 h-5" />
                                            <span className="font-medium">
                                                {isRTL ? 'تمت الإجابة' : 'Répondu'}
                                            </span>
                                        </div>
                                        <p className="text-sm text-green-600 dark:text-green-500 mt-1">
                                            {isRTL ? 'بواسطة' : 'Par'} {selectedMessage.responder_first_name} {selectedMessage.responder_last_name} - {new Date(selectedMessage.responded_at).toLocaleString(isRTL ? 'ar-TN' : 'fr-FR')}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="p-4 border-t dark:border-gray-700 flex flex-wrap gap-2">
                                <Button
                                    onClick={() => {
                                        setReplySubject(`Re: ${selectedMessage.subject || 'Votre message'}`);
                                        setShowReplyModal(true);
                                    }}
                                    className="gap-2"
                                >
                                    <Reply className="w-4 h-4" />
                                    {selectedMessage.status === 'responded'
                                        ? (isRTL ? 'رد مرة أخرى' : 'Répondre à nouveau')
                                        : (isRTL ? 'رد' : 'Répondre')
                                    }
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => handleArchive(selectedMessage.id)}
                                    className="gap-2"
                                >
                                    <Archive className="w-4 h-4" />
                                    {isRTL ? 'أرشفة' : 'Archiver'}
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => handleDelete(selectedMessage.id)}
                                    className="gap-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    {isRTL ? 'حذف' : 'Supprimer'}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="h-96 flex items-center justify-center text-gray-500">
                            <div className="text-center">
                                <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-30" />
                                <p>{isRTL ? 'اختر رسالة للقراءة' : 'Sélectionnez un message pour le lire'}</p>
                            </div>
                        </div>
                    )}
                </Card>
            </div>

            {/* Modal de réponse */}
            <AnimatePresence>
                {showReplyModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                        onClick={() => setShowReplyModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl"
                        >
                            <div className="p-4 border-b dark:border-gray-700 flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                    <Reply className="w-5 h-5" />
                                    {isRTL ? 'رد على الرسالة' : 'Répondre au message'}
                                </h3>
                                <button
                                    onClick={() => setShowReplyModal(false)}
                                    className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-4 space-y-4">
                                {/* Destinataire */}
                                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                    <span className="font-medium">{isRTL ? 'إلى:' : 'À:'}</span>
                                    <span>{selectedMessage?.name} ({selectedMessage?.email})</span>
                                </div>

                                {/* Sujet */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        {isRTL ? 'الموضوع' : 'Sujet'}
                                    </label>
                                    <input
                                        type="text"
                                        value={replySubject}
                                        onChange={(e) => setReplySubject(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    />
                                </div>

                                {/* Message */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        {isRTL ? 'الرسالة' : 'Message'}
                                    </label>
                                    <textarea
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                        rows={8}
                                        placeholder={isRTL ? 'اكتب ردك هنا...' : 'Écrivez votre réponse ici...'}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                                    />
                                </div>

                                {/* Avertissement email */}
                                <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-yellow-800 dark:text-yellow-200 text-sm">
                                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                    <p>
                                        {isRTL
                                            ? 'سيتم إرسال هذا الرد عبر البريد الإلكتروني إذا كانت الخدمة متاحة.'
                                            : 'Cette réponse sera envoyée par email si le service est disponible.'}
                                    </p>
                                </div>
                            </div>

                            <div className="p-4 border-t dark:border-gray-700 flex justify-end gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => setShowReplyModal(false)}
                                >
                                    {isRTL ? 'إلغاء' : 'Annuler'}
                                </Button>
                                <Button
                                    onClick={handleReply}
                                    disabled={sending || !replyText.trim()}
                                    className="gap-2"
                                >
                                    {sending ? (
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Send className="w-4 h-4" />
                                    )}
                                    {isRTL ? 'إرسال' : 'Envoyer'}
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default MailboxPage;
