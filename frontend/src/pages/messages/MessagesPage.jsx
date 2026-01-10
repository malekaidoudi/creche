/**
 * MessagesPage - Version Fullscreen Overlay Mobile
 * 
 * Changements appliqués :
 * 1. Conversation en fullscreen overlay (fixed inset-0 z-50) quand contact sélectionné
 * 2. scrollToBottomAndFocus() robuste avec multi-délais (80ms, 200ms, 500ms)
 * 3. Structure flex optimisée : header shrink-0, messages flex-1, input shrink-0
 * 4. Compatible iOS/Android - input reste visible avec clavier
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Send, MessageSquare, X, Info, Shield, Users as UsersIcon, User, ArrowLeft } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth';
import useIsMobile from '../../hooks/useIsMobile';
import MobileNavigation from '../../components/mobile/MobileNavigation';
import API_CONFIG from '../../config/api';

const API_URL = `${API_CONFIG.BASE_URL}/api`;

export default function MessagesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [searchParams] = useSearchParams();

  // États
  const [contacts, setContacts] = useState([]);
  const [children, setChildren] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [conversation, setConversation] = useState([]);
  const [conversationCache, setConversationCache] = useState(() => loadCacheFromStorage());
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [showChildInfo, setShowChildInfo] = useState(null);
  const [replyContent, setReplyContent] = useState('');

  // Refs
  const messagesContainerRef = useRef(null);
  const messageInputRef = useRef(null);
  const hasOpenedFromNotification = useRef(false);

  // ============================================================================
  // FONCTIONS UTILITAIRES
  // ============================================================================

  // Fonction pour fermer la conversation (compatible mobile)
  const handleCloseConversation = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    console.log('🔙 Fermeture conversation mobile');

    // Nettoyer le paramètre messageId de l'URL si présent
    const messageId = searchParams.get('messageId');
    if (messageId) {
      console.log('🗑️ Suppression paramètre messageId de l\'URL');
      // Réinitialiser le flag pour permettre une future ouverture depuis notification
      hasOpenedFromNotification.current = false;

      // Rediriger vers le dashboard approprié selon le rôle
      if (user?.role === 'parent') {
        console.log('👤 Redirection vers Mon espace parent');
        navigate('/mon-espace', { replace: true });
      } else {
        console.log('👔 Redirection vers Dashboard staff/admin');
        navigate('/dashboard', { replace: true });
      }
      return; // Sortir de la fonction après redirection
    }

    setSelectedContact(null);
    setConversation([]);
    setReplyContent('');
  };

  function loadCacheFromStorage() {
    try {
      const cached = localStorage.getItem('messagesCache');
      if (cached) {
        const parsed = JSON.parse(cached);
        const now = Date.now();
        const isValid = Object.values(parsed).every(item =>
          item.timestamp && (now - item.timestamp < 24 * 60 * 60 * 1000)
        );
        if (isValid) return parsed;
      }
    } catch (error) {
      console.error('Erreur chargement cache:', error);
    }
    return {};
  }

  function scrollToBottomAndFocus() {
    // Scroll immédiat
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: "smooth"
      });
    }

    // Focus input
    if (messageInputRef.current) {
      messageInputRef.current.focus();
    }

    // Re-scroll multi-délais pour compenser le clavier mobile
    setTimeout(() => {
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTo({
          top: messagesContainerRef.current.scrollHeight,
          behavior: "smooth"
        });
      }
    }, 80);

    setTimeout(() => {
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTo({
          top: messagesContainerRef.current.scrollHeight,
          behavior: "smooth"
        });
      }
    }, 200);

    setTimeout(() => {
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTo({
          top: messagesContainerRef.current.scrollHeight,
          behavior: "smooth"
        });
      }
    }, 500);
  }

  function formatMessageDate(dateString) {
    const msgDate = new Date(dateString);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const msgDay = new Date(msgDate.getFullYear(), msgDate.getMonth(), msgDate.getDate());

    const time = msgDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

    if (msgDay.getTime() === today.getTime()) return time;
    if (msgDay.getTime() === yesterday.getTime()) return `Hier ${time}`;

    const day = msgDate.getDate();
    const month = msgDate.toLocaleDateString('fr-FR', { month: 'short' });

    if (msgDate.getFullYear() === now.getFullYear()) {
      return `${day} ${month} ${time}`;
    }

    return `${day} ${month} ${msgDate.getFullYear()} ${time}`;
  }

  function groupContactsByRole() {
    return {
      admin: contacts.filter(c => c.role === 'admin' && c.is_active),
      staff: contacts.filter(c => c.role === 'staff' && c.is_active),
      parent: contacts.filter(c => c.role === 'parent' && c.is_active)
    };
  }

  function getRoleLabel(role) {
    const labels = { admin: 'Directeur', staff: 'Personnel', parent: 'Parents' };
    return labels[role] || role;
  }

  function getRoleIcon(role) {
    if (role === 'admin') return <Shield className="w-4 h-4 text-blue-600" />;
    if (role === 'staff') return <UsersIcon className="w-4 h-4 text-green-600" />;
    return <User className="w-4 h-4 text-purple-600" />;
  }

  function getRoleColor(role) {
    if (role === 'admin') return 'bg-blue-600';
    if (role === 'staff') return 'bg-green-600';
    return 'bg-purple-600';
  }

  function getChildrenForParent(parentId) {
    const parentIdNum = Number(parentId);
    return children.filter(c => {
      const childParentId = Number(c.parent_id);
      const childParentUserId = Number(c.parent_user_id);
      return childParentId === parentIdNum || childParentUserId === parentIdNum;
    });
  }

  // ============================================================================
  // API CALLS
  // ============================================================================

  async function loadCurrentUser() {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      let user = null;
      if (response.data.success && response.data.user) {
        user = response.data.user;
      } else if (response.data.user) {
        user = response.data.user;
      } else if (response.data.id) {
        user = response.data;
      }

      if (user && user.id) {
        setCurrentUser(user);
        return user;
      }
    } catch (error) {
      console.error('Erreur chargement utilisateur:', error);
    }

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setCurrentUser(user);
    return user;
  }

  async function loadContacts(user) {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/users?limit=100`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success && response.data.users) {
        const filtered = response.data.users.filter(u => {
          const isCurrentUser = u.id === user.userId || u.id === user.id || u.email === user.email;
          if (isCurrentUser) return false;

          if (user.role === 'parent' && u.role === 'parent') return false;

          return u.is_active;
        });

        setContacts(filtered);
      }
    } catch (error) {
      console.error('Erreur chargement contacts:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadChildren() {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/children/simple`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setChildren(response.data.children || []);
      }
    } catch (error) {
      console.error('Erreur chargement enfants:', error);
    }
  }

  async function loadConversation(contactId) {
    try {
      const token = localStorage.getItem('token');
      const currentUserId = currentUser?.userId || currentUser?.id;

      // Optimisation: Une seule requête API avec le paramètre contactId
      const response = await axios.get(`${API_URL}/staff-messages/conversation/${contactId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        const messages = response.data.messages || [];
        messages.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

        setConversation(messages);

        // Mise à jour du cache
        const contact = contacts.find(c => c.id === contactId);
        if (contact) {
          const cacheKey = `contact_${contactId}`;
          setConversationCache(prev => ({
            ...prev,
            [cacheKey]: {
              contactId: contactId,
              contactName: contact.first_name + ' ' + contact.last_name,
              messages: messages,
              timestamp: Date.now()
            }
          }));
        }
      }
    } catch (error) {
      console.error('Erreur chargement conversation:', error);
      // Fallback: charger tous les messages et filtrer côté client
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_URL}/staff-messages`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data.success) {
          const messages = response.data.messages || [];
          const filtered = messages.filter(m =>
            (m.sender_id === currentUserId && m.recipient_id === contactId) ||
            (m.sender_id === contactId && m.recipient_id === currentUserId)
          );
          filtered.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
          setConversation(filtered);
        }
      } catch (fallbackError) {
        console.error('Erreur fallback conversation:', fallbackError);
      }
    }
  }

  async function openConversationFromMessage(messageId) {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/staff-messages/${messageId}/conversation`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success && response.data.conversation.length > 0) {
        const firstMessage = response.data.conversation[0];
        const currentUserId = currentUser?.userId || currentUser?.id;

        const contactId = firstMessage.sender_id === currentUserId
          ? firstMessage.recipient_id
          : firstMessage.sender_id;

        const contact = contacts.find(c => c.id === contactId);
        if (contact) {
          await handleSelectContact(contact);
        }
      }
    } catch (error) {
      console.error('Erreur ouverture conversation:', error);
    }
  }

  // ============================================================================
  // HANDLERS
  // ============================================================================

  async function handleSelectContact(contact) {
    // Sauvegarder la conversation actuelle dans le cache
    if (selectedContact && conversation.length > 0) {
      const cacheKey = `contact_${selectedContact.id}`;
      setConversationCache(prev => ({
        ...prev,
        [cacheKey]: {
          contactId: selectedContact.id,
          contactName: selectedContact.first_name + ' ' + selectedContact.last_name,
          messages: conversation,
          timestamp: Date.now()
        }
      }));
    }

    setConversation([]);
    setSelectedContact(contact);

    // Charger depuis le cache ou l'API
    const cacheKey = `contact_${contact.id}`;
    if (conversationCache[cacheKey]) {
      setConversation(conversationCache[cacheKey].messages);
      setTimeout(scrollToBottomAndFocus, 40);
    } else {
      await loadConversation(contact.id);
      setTimeout(scrollToBottomAndFocus, 40);
    }
  }

  async function handleSendMessage(e) {
    e.preventDefault();
    if (!replyContent.trim() || !selectedContact) return;

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/staff-messages`,
        {
          recipient_id: selectedContact.id,
          content: replyContent
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        const newMessage = {
          id: response.data.message?.id || Date.now(),
          sender_id: currentUser?.userId || currentUser?.id,
          recipient_id: selectedContact.id,
          content: replyContent,
          created_at: new Date().toISOString(),
          is_read: false
        };

        const updatedConversation = [...conversation, newMessage];
        setConversation(updatedConversation);
        setReplyContent('');

        // Mise à jour du cache
        const cacheKey = `contact_${selectedContact.id}`;
        setConversationCache(prev => ({
          ...prev,
          [cacheKey]: {
            contactId: selectedContact.id,
            contactName: selectedContact.first_name + ' ' + selectedContact.last_name,
            messages: updatedConversation,
            timestamp: Date.now()
          }
        }));

        // Auto-scroll après envoi
        setTimeout(() => {
          if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTo({
              top: messagesContainerRef.current.scrollHeight,
              behavior: "smooth"
            });
          }
        }, 50);
      }
    } catch (error) {
      console.error('Erreur envoi message:', error);
    }
  }

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    const initData = async () => {
      const user = await loadCurrentUser();
      await loadContacts(user);
      await loadChildren();
    };
    initData();
  }, []);

  useEffect(() => {
    if (Object.keys(conversationCache).length > 0) {
      try {
        localStorage.setItem('messagesCache', JSON.stringify(conversationCache));
      } catch (error) {
        console.error('Erreur sauvegarde cache:', error);
      }
    }
  }, [conversationCache]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      localStorage.removeItem('messagesCache');
      setConversationCache({});
    }
  }, []);

  useEffect(() => {
    if (!selectedContact) return;

    requestAnimationFrame(() => {
      scrollToBottomAndFocus();
    });
  }, [conversation]);

  useEffect(() => {
    if (selectedContact && !searchParams.get('messageId')) {
      loadConversation(selectedContact.id);
    }
  }, [selectedContact]);

  useEffect(() => {
    if (!selectedContact) return;

    const interval = setInterval(async () => {
      await loadConversation(selectedContact.id);
    }, 10000);

    return () => clearInterval(interval);
  }, [selectedContact]);

  useEffect(() => {
    const messageId = searchParams.get('messageId');
    if (messageId && contacts.length > 0 && !selectedContact && !hasOpenedFromNotification.current) {
      console.log('📬 Ouverture conversation depuis notification:', messageId);
      hasOpenedFromNotification.current = true;
      openConversationFromMessage(parseInt(messageId));
    }
  }, [searchParams, contacts, selectedContact]);

  // Ouvrir une conversation depuis le paramètre user ou contactId (ex: ?user=2 ou ?contactId=2)
  useEffect(() => {
    const userId = searchParams.get('user') || searchParams.get('contactId');
    if (userId && contacts.length > 0 && !selectedContact && !hasOpenedFromNotification.current) {
      const contact = contacts.find(c => c.id === parseInt(userId));
      if (contact) {
        console.log('📬 Ouverture conversation avec utilisateur:', userId);
        hasOpenedFromNotification.current = true;
        handleSelectContact(contact);
      }
    }
  }, [searchParams, contacts]);

  // ============================================================================
  // RENDER
  // ============================================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const grouped = groupContactsByRole();

  return (
    <div className={`h-screen flex flex-col max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 ${isMobile ? 'pb-20' : ''}`}>
      {/* Header */}
      <div className="mb-4 shrink-0">
        {/* Bouton retour - masqué sur mobile */}
        {user?.role === 'parent' && !isMobile && (
          <button
            onClick={() => navigate('/mon-espace')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Retour à Mon Espace</span>
          </button>
        )}

        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Messages</h1>
        <p className="text-gray-600 mt-1">Communiquez avec l'équipe et les parents</p>
      </div>

      {/* Layout responsive */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        {/* Section Contacts */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col min-h-0 h-full lg:h-[650px]">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 shrink-0">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <UsersIcon className="w-5 h-5" />
              Contacts
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto min-h-0">
            {/* Directeur */}
            {grouped.admin.length > 0 && (
              <div className="border-b border-gray-200 dark:border-gray-700">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-semibold text-blue-900 dark:text-blue-300">Directeur</span>
                </div>
                {grouped.admin.map((contact) => (
                  <button
                    key={contact.id}
                    onClick={() => handleSelectContact(contact)}
                    className={`w-full p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 ${selectedContact?.id === contact.id ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-600' : ''
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {contact.first_name} {contact.last_name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{contact.email}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Personnel */}
            {grouped.staff.length > 0 && (
              <div className="border-b border-gray-200 dark:border-gray-700">
                <div className="p-3 bg-green-50 dark:bg-green-900/20 flex items-center gap-2">
                  <UsersIcon className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <span className="text-sm font-semibold text-green-900 dark:text-green-300">Personnel</span>
                </div>
                {grouped.staff.map((contact) => (
                  <button
                    key={contact.id}
                    onClick={() => handleSelectContact(contact)}
                    className={`w-full p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 ${selectedContact?.id === contact.id ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-600' : ''
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {contact.first_name} {contact.last_name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{contact.email}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Parents */}
            {grouped.parent.length > 0 && (
              <div>
                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 flex items-center gap-2">
                  <User className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span className="text-sm font-semibold text-purple-900 dark:text-purple-300">Parents</span>
                </div>
                {grouped.parent.map((contact, index) => {
                  const contactChildren = getChildrenForParent(contact.id);
                  const isLastTwo = index >= grouped.parent.length - 2;

                  return (
                    <button
                      key={contact.id}
                      onClick={() => handleSelectContact(contact)}
                      className={`w-full p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 ${selectedContact?.id === contact.id ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-600' : ''
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 dark:text-white">
                            {contact.first_name} {contact.last_name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{contact.email}</p>
                        </div>

                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowChildInfo(showChildInfo === contact.id ? null : contact.id);
                            }}
                            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors"
                            title={contactChildren.length > 0 ? `${contactChildren.length} enfant(s)` : 'Aucun enfant'}
                          >
                            <Info className="w-4 h-4 text-purple-600" />
                          </button>

                          {showChildInfo === contact.id && (
                            <div className={`absolute right-0 z-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 min-w-[200px] ${isLastTwo ? 'bottom-8' : 'top-8'
                              }`}>
                              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Enfants:</p>
                              {contactChildren.length > 0 ? (
                                contactChildren.map((child) => (
                                  <p key={child.id} className="text-xs text-gray-600 dark:text-gray-400">
                                    • {child.first_name} {child.last_name}
                                  </p>
                                ))
                              ) : (
                                <p className="text-xs text-gray-500 dark:text-gray-400 italic">Aucun enfant associé</p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {contacts.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p>Aucun contact</p>
              </div>
            )}
          </div>
        </div>

        {/* Section Conversation */}
        {selectedContact ? (
          /* Fullscreen overlay pour mobile */
          <div className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-gray-800 lg:relative lg:col-span-2 lg:h-[650px] lg:rounded-lg lg:shadow-sm lg:border lg:border-gray-200 lg:dark:border-gray-700">
            {/* Header conversation */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 shrink-0 relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Bouton retour mobile */}
                  <button
                    onClick={handleCloseConversation}
                    onTouchEnd={handleCloseConversation}
                    className="lg:hidden p-3 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors active:scale-95 touch-manipulation cursor-pointer"
                    aria-label="Retour aux contacts"
                    type="button"
                    style={{ WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation' }}
                  >
                    <ArrowLeft className="w-6 h-6 text-gray-700 dark:text-gray-200" />
                  </button>
                  {getRoleIcon(selectedContact.role)}
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {selectedContact.first_name} {selectedContact.last_name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {getRoleLabel(selectedContact.role)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleCloseConversation}
                  onTouchEnd={handleCloseConversation}
                  className="lg:hidden p-3 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors active:scale-95 touch-manipulation cursor-pointer"
                  aria-label="Fermer la conversation"
                  type="button"
                  style={{ WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation' }}
                >
                  <X className="w-7 h-7 text-gray-700 dark:text-gray-200" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 min-h-0 space-y-3">
              {conversation.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p>Aucun message</p>
                    <p className="text-sm mt-1">Commencez la conversation</p>
                  </div>
                </div>
              ) : (
                conversation.map((msg) => {
                  const isMe = msg.sender_id === currentUser?.id || msg.sender_id === currentUser?.userId;
                  const contactRole = selectedContact?.role;
                  const bgColor = isMe ? getRoleColor(contactRole) : 'bg-gray-100';
                  const textColor = isMe ? 'text-white' : 'text-gray-900';

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      <p className="text-xs text-gray-500 mb-1 px-1">
                        {formatMessageDate(msg.created_at)}
                      </p>
                      <div className={`max-w-[80%] sm:max-w-[70%] rounded-lg px-4 py-2 ${bgColor} ${textColor}`}>
                        <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Formulaire envoi */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shrink-0">
              <div className="flex gap-2">
                <input
                  ref={messageInputRef}
                  type="text"
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Écrivez votre message..."
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
                />
                <button
                  type="submit"
                  disabled={!replyContent.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col lg:h-[650px] min-h-0">
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium">Sélectionnez un contact</p>
                <p className="text-sm mt-1">Choisissez un contact pour commencer à discuter</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation mobile - masquée quand conversation ouverte */}
      {isMobile && !selectedContact && <MobileNavigation />}
    </div>
  );
}
