/**
 * MessagesPage - Refonte Moderne & Responsive
 * 
 * Améliorations majeures :
 * 1. Présentation Contacts & Suppression des emails provisoires :
 *    - Masquage intégral des emails techniques générés (parent.noemail... @creche.local).
 *    - Affichage direct et élégant des enfants associés sous le nom des parents (badges enfants).
 *    - Plus de bouton (i) minuscule décalé à droite : les informations sont fluides et natives.
 * 2. Ergonomie Mobile & Safe Area :
 *    - En-tête conversation avec padding-top safe-area (pt-[calc(env(safe-area-inset-top,0px)+0.75rem)])
 *      positionné sous l'îlot dynamique / l'encoche et l'horloge iOS.
 *    - Bouton retour unique "←", spacieux (42x42px) et tactile, sans bouton "X" redondant.
 * 3. Barre de saisie moderne (Dock Chat) :
 *    - Style messagerie moderne (iMessage / WhatsApp) en pilule arrondie rounded-2xl.
 *    - Suppression de l'espacement excessif de 80px sur mobile : padding-bottom adaptatif (safe-area).
 *    - Police 16px sur mobile pour empêcher tout auto-zoom iOS Safari intempestif.
 * 4. Architecture Master-Detail fluide :
 *    - Mobile : transition nette entre Liste de contacts et Conversation en plein écran.
 *    - Desktop : vue double colonne 380px / flex-1 avec écran d'accueil chaleureux.
 *    - Recherche unifiée (par nom de parent, staff ou nom d'enfant) et onglets de filtrage par rôle.
 */

import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import {
  Send,
  MessageSquare,
  Search,
  X,
  ArrowLeft,
  Shield,
  Users as UsersIcon,
  User,
  Baby,
  Check,
  CheckCheck,
  Mail,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';
import useIsMobile from '../../hooks/useIsMobile';
import MobileNavigation from '../../components/mobile/MobileNavigation';
import API_CONFIG from '../../config/api';
import { useAccess } from '../../access';

const API_URL = `${API_CONFIG.BASE_URL}/api`;

/**
 * Détecte si un email est un identifiant technique provisoire
 */
const isProvisionalEmail = (email) => {
  if (!email || typeof email !== 'string') return true;
  const lower = email.toLowerCase().trim();
  return (
    lower.includes('noemail') ||
    lower.endsWith('@creche.local') ||
    lower.includes('placeholder')
  );
};

/**
 * Récupère les initiales d'un utilisateur
 */
const getInitials = (firstName, lastName) => {
  const f = (firstName || '').trim()[0] || '';
  const l = (lastName || '').trim()[0] || '';
  return (f + l).toUpperCase() || '?';
};

export default function MessagesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { isRTL } = useLanguage();
  const isMobile = useIsMobile();
  const [searchParams, setSearchParams] = useSearchParams();
  const { can, loading: accessLoading } = useAccess();

  // États principaux
  const [contacts, setContacts] = useState([]);
  const [children, setChildren] = useState([]);
  const [conversationsMap, setConversationsMap] = useState({});
  const [selectedContact, setSelectedContact] = useState(null);
  const [conversation, setConversation] = useState([]);
  const [conversationCache, setConversationCache] = useState(() => loadCacheFromStorage());
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [replyContent, setReplyContent] = useState('');

  // Filtres & Recherche
  const [searchQuery, setSearchQuery] = useState('');
  const [activeRoleFilter, setActiveRoleFilter] = useState('all'); // 'all', 'parent', 'staff', 'admin'

  // Refs
  const messagesContainerRef = useRef(null);
  const messageInputRef = useRef(null);
  const hasOpenedFromNotification = useRef(false);

  // Helper: déterminer si un contact est en ligne (last_active < 5 min)
  const isContactOnline = (contact) => {
    if (!contact?.last_active) return false;
    const lastActive = new Date(contact.last_active);
    const now = new Date();
    return now - lastActive < 5 * 60 * 1000;
  };

  function loadCacheFromStorage() {
    try {
      const cached = localStorage.getItem('messagesCache');
      if (cached) {
        const parsed = JSON.parse(cached);
        const now = Date.now();
        const isValid = Object.values(parsed).every(
          (item) => item.timestamp && now - item.timestamp < 24 * 60 * 60 * 1000
        );
        if (isValid) return parsed;
      }
    } catch (error) {
      console.error('Erreur chargement cache:', error);
    }
    return {};
  }

  function scrollToBottomAndFocus() {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }

    if (messageInputRef.current) {
      messageInputRef.current.focus();
    }

    setTimeout(() => {
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTo({
          top: messagesContainerRef.current.scrollHeight,
          behavior: 'smooth'
        });
      }
    }, 120);
  }

  // Fermer la conversation (retour à la liste de contacts)
  const handleCloseConversation = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    // Nettoyer les paramètres de requête de l'URL
    const messageId = searchParams.get('messageId');
    const userParam = searchParams.get('user');
    const contactIdParam = searchParams.get('contactId');

    if (messageId || userParam || contactIdParam) {
      hasOpenedFromNotification.current = false;
      navigate(location.pathname, { replace: true });
    }

    setSelectedContact(null);
    setConversation([]);
    setReplyContent('');
  };

  // Formatage des dates de bulles
  function formatMessageTime(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  // Formatage pour l'en-tête de date dans la conversation
  function formatDateHeader(dateString) {
    const msgDate = new Date(dateString);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const msgDay = new Date(msgDate.getFullYear(), msgDate.getMonth(), msgDate.getDate());

    if (msgDay.getTime() === today.getTime()) return "Aujourd'hui";
    if (msgDay.getTime() === yesterday.getTime()) return 'Hier';

    return msgDate.toLocaleDateString('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  }

  function shouldShowDateHeader(messages, index) {
    if (index === 0) return true;
    const prevDate = new Date(messages[index - 1].created_at).toDateString();
    const currentDate = new Date(messages[index].created_at).toDateString();
    return prevDate !== currentDate;
  }

  // Formatage court pour la liste des contacts
  function formatShortDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Hier';
    }
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  }

  function getChildrenForParent(parentId) {
    const parentIdNum = Number(parentId);
    return children.filter((c) => {
      const childParentId = Number(c.parent_id);
      const childParentUserId = Number(c.parent_user_id);
      return childParentId === parentIdNum || childParentUserId === parentIdNum;
    });
  }

  function getRoleLabel(role) {
    const labels = {
      admin: isRTL ? 'الإدارة' : 'Direction',
      staff: isRTL ? 'إطار تربوي' : 'Éducatrice',
      parent: isRTL ? 'ولي أمر' : 'Parent'
    };
    return labels[role] || role;
  }

  function getRoleBadgeStyle(role) {
    if (role === 'admin') {
      return 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800';
    }
    if (role === 'staff') {
      return 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800';
    }
    return 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800';
  }

  function getRoleAvatarBg(role) {
    if (role === 'admin') return 'bg-gradient-to-br from-blue-500 to-indigo-700 text-white';
    if (role === 'staff') return 'bg-gradient-to-br from-emerald-500 to-teal-700 text-white';
    return 'bg-gradient-to-br from-purple-500 to-pink-600 text-white';
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

      let loadedUser = null;
      if (response.data.success && response.data.user) {
        loadedUser = response.data.user;
      } else if (response.data.user) {
        loadedUser = response.data.user;
      } else if (response.data.id) {
        loadedUser = response.data;
      }

      if (loadedUser && loadedUser.id) {
        setCurrentUser(loadedUser);
        return loadedUser;
      }
    } catch (error) {
      console.error('Erreur chargement utilisateur:', error);
    }

    const fallbackUser = JSON.parse(localStorage.getItem('user') || '{}');
    setCurrentUser(fallbackUser);
    return fallbackUser;
  }

  async function loadConversationsList() {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/staff-messages/conversations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data && response.data.success && Array.isArray(response.data.conversations)) {
        const map = {};
        response.data.conversations.forEach((conv) => {
          map[conv.contact_id] = conv;
        });
        setConversationsMap(map);
      }
    } catch (err) {
      // Ignorer silencieusement si la route de résumé n'est pas supportée
    }
  }

  async function loadContacts(currentUserParam) {
    try {
      const token = localStorage.getItem('token');
      const activeUser = currentUserParam || currentUser || user || {};

      const canMessageParents = can('MESSAGES_PARENTS');

      const response = await axios.get(`${API_URL}/users/contacts`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const contactList = response.data.contacts || response.data.users || [];
      if (response.data.success && Array.isArray(contactList)) {
        const activeUserId = activeUser.userId || activeUser.id;
        const activeUserEmail = activeUser.email;

        const filtered = contactList.filter((u) => {
          const isCurrent =
            u.id === activeUserId || (activeUserEmail && u.email === activeUserEmail);
          if (isCurrent) return false;

          if (activeUser.role === 'parent' && u.role === 'parent') return false;
          if (u.role === 'parent' && activeUser.role === 'staff' && !canMessageParents) return false;

          return u.is_active !== false;
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

      const response = await axios.get(`${API_URL}/staff-messages/conversation/${contactId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        const messages = response.data.messages || [];
        messages.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

        setConversation(messages);

        // Mettre à jour le cache
        const contact = contacts.find((c) => c.id === contactId);
        if (contact) {
          const cacheKey = `contact_${contactId}`;
          setConversationCache((prev) => ({
            ...prev,
            [cacheKey]: {
              contactId: contactId,
              contactName: contact.first_name + ' ' + contact.last_name,
              messages: messages,
              timestamp: Date.now()
            }
          }));
        }

        // Marquer comme lu dans la carte des conversations
        setConversationsMap((prev) => ({
          ...prev,
          [contactId]: {
            ...(prev[contactId] || {}),
            unread_count: 0
          }
        }));
      }
    } catch (error) {
      console.error('Erreur chargement conversation:', error);
      // Fallback
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_URL}/staff-messages`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data.success) {
          const currentUserId = currentUser?.userId || currentUser?.id;
          const messages = response.data.messages || [];
          const filtered = messages.filter(
            (m) =>
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
      const response = await axios.get(
        `${API_URL}/staff-messages/${messageId}/conversation`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success && response.data.conversation.length > 0) {
        const firstMessage = response.data.conversation[0];
        const currentUserId = currentUser?.userId || currentUser?.id;

        const contactId =
          firstMessage.sender_id === currentUserId
            ? firstMessage.recipient_id
            : firstMessage.sender_id;

        const contact = contacts.find((c) => c.id === contactId);
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
    if (selectedContact && conversation.length > 0) {
      const cacheKey = `contact_${selectedContact.id}`;
      setConversationCache((prev) => ({
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
    if (e) e.preventDefault();
    if (!replyContent.trim() || !selectedContact) return;

    const messageText = replyContent.trim();

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/staff-messages`,
        {
          recipient_id: selectedContact.id,
          content: messageText
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        const newMessage = {
          id: response.data.message?.id || Date.now(),
          sender_id: currentUser?.userId || currentUser?.id,
          recipient_id: selectedContact.id,
          content: messageText,
          created_at: new Date().toISOString(),
          is_read: false
        };

        const updatedConversation = [...conversation, newMessage];
        setConversation(updatedConversation);
        setReplyContent('');

        // Mise à jour du cache
        const cacheKey = `contact_${selectedContact.id}`;
        setConversationCache((prev) => ({
          ...prev,
          [cacheKey]: {
            contactId: selectedContact.id,
            contactName: selectedContact.first_name + ' ' + selectedContact.last_name,
            messages: updatedConversation,
            timestamp: Date.now()
          }
        }));

        // Mettre à jour la carte des conversations
        setConversationsMap((prev) => ({
          ...prev,
          [selectedContact.id]: {
            ...(prev[selectedContact.id] || {}),
            last_message: messageText,
            last_message_date: new Date().toISOString()
          }
        }));

        setTimeout(() => {
          if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTo({
              top: messagesContainerRef.current.scrollHeight,
              behavior: 'smooth'
            });
          }
        }, 50);
      }
    } catch (error) {
      console.error('Erreur envoi message:', error);
    }
  }

  // ============================================================================
  // FILTRAGE ET RECHERCHE DES CONTACTS
  // ============================================================================

  const filteredContacts = useMemo(() => {
    return contacts.filter((c) => {
      // Filtre de rôle
      if (activeRoleFilter !== 'all' && c.role !== activeRoleFilter) {
        return false;
      }

      // Recherche textuelle
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const fullName = `${c.first_name || ''} ${c.last_name || ''}`.toLowerCase();
        const email = (c.email || '').toLowerCase();
        const cChildren = getChildrenForParent(c.id);
        const childrenNames = cChildren
          .map((child) => `${child.first_name || ''} ${child.last_name || ''}`.toLowerCase())
          .join(' ');

        const matchName = fullName.includes(q);
        const matchEmail = !isProvisionalEmail(email) && email.includes(q);
        const matchChildren = childrenNames.includes(q);

        if (!matchName && !matchEmail && !matchChildren) {
          return false;
        }
      }

      return true;
    });
  }, [contacts, activeRoleFilter, searchQuery, children]);

  const roleCounts = useMemo(() => {
    return {
      all: contacts.length,
      parent: contacts.filter((c) => c.role === 'parent').length,
      staff: contacts.filter((c) => c.role === 'staff').length,
      admin: contacts.filter((c) => c.role === 'admin').length
    };
  }, [contacts]);

  // Enfants du contact sélectionné
  const selectedContactChildren = useMemo(() => {
    if (!selectedContact || selectedContact.role !== 'parent') return [];
    return getChildrenForParent(selectedContact.id);
  }, [selectedContact, children]);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    if (accessLoading) return;

    const initData = async () => {
      const loadedUser = await loadCurrentUser();
      await loadContacts(loadedUser);
      await loadChildren();
      await loadConversationsList();
    };
    initData();
  }, [accessLoading]);

  useEffect(() => {
    // Heartbeat de présence toutes les 30s
    const presenceInterval = setInterval(() => {
      const token = localStorage.getItem('token');
      if (token) {
        axios
          .post(`${API_URL}/users/presence`, {}, { headers: { Authorization: `Bearer ${token}` } })
          .catch(() => {});
      }
    }, 30000);
    return () => clearInterval(presenceInterval);
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
      hasOpenedFromNotification.current = true;
      openConversationFromMessage(parseInt(messageId));
    }
  }, [searchParams, contacts, selectedContact]);

  useEffect(() => {
    const userId = searchParams.get('user') || searchParams.get('contactId');
    if (userId && contacts.length > 0 && !selectedContact && !hasOpenedFromNotification.current) {
      const contact = contacts.find((c) => c.id === parseInt(userId));
      if (contact) {
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
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Chargement des messages...</p>
      </div>
    );
  }

  return (
    <div className={`h-[100dvh] max-h-[100dvh] flex flex-col bg-gray-50 dark:bg-gray-950 overflow-hidden ${
      isMobile && !selectedContact ? 'pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))]' : ''
    }`}>
      {/* ================================================================ */}
      {/* VUE PRINCIPALE : MASTER-DETAIL ADAPTATIF                           */}
      {/* ================================================================ */}
      <div className="flex-1 flex min-h-0 w-full max-w-7xl mx-auto lg:p-4 lg:gap-4 overflow-hidden">
        
        {/* ============================================================== */}
        {/* COLONNE GAUCHE : LISTE DES CONTACTS (Plein écran mobile ou 380px) */}
        {/* ============================================================== */}
        <div
          className={`flex-1 lg:flex-none lg:w-[380px] xl:w-[420px] bg-white dark:bg-gray-900 lg:rounded-2xl lg:shadow-sm lg:border lg:border-gray-200/80 lg:dark:border-gray-800 flex flex-col min-h-0 overflow-hidden ${
            selectedContact ? 'hidden lg:flex' : 'flex'
          }`}
        >
          {/* En-tête de la liste avec safe-area iOS */}
          <div className="pt-[calc(env(safe-area-inset-top,0px)+0.75rem)] pb-3 px-4 sm:px-5 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 shrink-0">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 via-sky-600 to-indigo-600 text-white flex items-center justify-center shadow-xs">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white leading-tight">
                    Messages
                  </h1>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    {contacts.length} contact{contacts.length > 1 ? 's' : ''} disponible{contacts.length > 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              {/* Bouton retour vers Espace Parent sur mobile */}
              {user?.role === 'parent' && (
                <button
                  onClick={() => navigate('/mon-espace')}
                  className="px-3 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 rounded-xl transition-colors cursor-pointer"
                >
                  Mon Espace
                </button>
              )}
            </div>

            {/* Barre de Recherche */}
            <div className="relative mb-2.5">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher un parent, éducatrice ou enfant..."
                className="w-full pl-9 pr-8 py-2 bg-gray-100 dark:bg-gray-800/80 border border-gray-200/80 dark:border-gray-700/80 rounded-xl text-xs sm:text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Onglets de filtrage par rôle */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth -mx-1 px-1 pb-0.5">
              {[
                { id: 'all', label: 'Tous', count: roleCounts.all },
                { id: 'parent', label: 'Parents', count: roleCounts.parent },
                { id: 'staff', label: 'Éducatrices', count: roleCounts.staff },
                { id: 'admin', label: 'Direction', count: roleCounts.admin }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveRoleFilter(tab.id)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 transition-all cursor-pointer ${
                    activeRoleFilter === tab.id
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {tab.label} <span className="text-[10px] opacity-80">({tab.count})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Liste déroulante des contacts */}
          <div className="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800/70">
            {filteredContacts.length > 0 ? (
              filteredContacts.map((contact) => {
                const contactChildren = getChildrenForParent(contact.id);
                const conv = conversationsMap[contact.id];
                const isSelected = selectedContact?.id === contact.id;

                return (
                  <button
                    key={contact.id}
                    onClick={() => handleSelectContact(contact)}
                    className={`w-full p-3 sm:p-3.5 text-left rtl:text-right transition-all flex items-center gap-3 hover:bg-blue-50/50 dark:hover:bg-gray-800/60 active:scale-[0.99] cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50/90 dark:bg-blue-950/40 border-l-4 border-l-blue-600 shadow-2xs'
                        : ''
                    }`}
                  >
                    {/* Avatar avec statut en ligne */}
                    <div className="relative shrink-0">
                      <div
                        className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center font-bold text-sm shadow-xs ${getRoleAvatarBg(
                          contact.role
                        )}`}
                      >
                        {getInitials(contact.first_name, contact.last_name)}
                      </div>
                      {isContactOnline(contact) && (
                        <span
                          className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 ring-2 ring-white dark:ring-gray-900 rounded-full"
                          title="En ligne"
                        />
                      )}
                    </div>

                    {/* Informations textuelles & Enfants associés */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <h3 className="font-bold text-sm text-gray-900 dark:text-white truncate">
                          {contact.first_name} {contact.last_name}
                        </h3>
                        {conv?.last_message_date && (
                          <span className="text-[10px] text-gray-400 shrink-0">
                            {formatShortDate(conv.last_message_date)}
                          </span>
                        )}
                      </div>

                      {/* Sous-titre : dernier message OU enfants OU rôle (JAMAIS d'email technique provisoire) */}
                      {conv?.last_message ? (
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {conv.last_message}
                        </p>
                      ) : contact.role === 'parent' ? (
                        contactChildren.length > 0 ? (
                          <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/50 px-2 py-0.5 rounded-md border border-purple-200/60 dark:border-purple-800/50">
                              <Baby className="w-3 h-3 text-purple-500 shrink-0" />
                              <span className="truncate max-w-[190px] sm:max-w-none">
                                {contactChildren.map((c) => c.first_name).join(', ')}
                              </span>
                            </span>
                          </div>
                        ) : (
                          <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                            {!isProvisionalEmail(contact.email)
                              ? contact.email
                              : "Parent d'élève"}
                          </p>
                        )
                      ) : (
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {!isProvisionalEmail(contact.email)
                            ? contact.email
                            : getRoleLabel(contact.role)}
                        </p>
                      )}
                    </div>

                    {/* Badge de non-lus & Chevron */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {conv?.unread_count > 0 && (
                        <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-blue-600 text-white shadow-xs">
                          {conv.unread_count}
                        </span>
                      )}
                      <ChevronRight className="w-4 h-4 text-gray-400 hidden sm:block" />
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="p-8 text-center text-gray-400">
                <MessageSquare className="w-10 h-10 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                  Aucun contact trouvé
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Essayez avec un autre terme de recherche
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ============================================================== */}
        {/* COLONNE DROITE : CONVERSATION ACTIVE (Fullscreen sur mobile)   */}
        {/* ============================================================== */}
        {selectedContact ? (
          <div
            className="fixed inset-0 z-50 flex flex-col bg-gray-50 dark:bg-gray-900 lg:relative lg:inset-auto lg:z-auto lg:flex-1 lg:rounded-2xl lg:shadow-sm lg:border lg:border-gray-200/80 lg:dark:border-gray-800 overflow-hidden"
          >
            {/* Header de conversation avec Safe Area iOS (Bouton retour spacieux et accessible) */}
            <div className="pt-[calc(env(safe-area-inset-top,0px)+0.75rem)] pb-3 px-3.5 sm:px-5 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-xs flex items-center justify-between shrink-0 z-20">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                {/* Bouton retour - Très confortable au toucher (42x42px) */}
                <button
                  onClick={handleCloseConversation}
                  className="p-2 sm:p-2.5 -ml-1 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full active:scale-95 transition-all flex items-center justify-center shrink-0 min-w-[42px] min-h-[42px] cursor-pointer"
                  aria-label="Retour aux contacts"
                  title="Retour aux contacts"
                >
                  <ArrowLeft className={`w-5 h-5 sm:w-6 sm:h-6 ${isRTL ? 'rotate-180' : ''}`} />
                </button>

                {/* Avatar du contact */}
                <div className="relative shrink-0">
                  <div
                    className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center font-bold text-white shadow-xs ${getRoleAvatarBg(
                      selectedContact.role
                    )}`}
                  >
                    {getInitials(selectedContact.first_name, selectedContact.last_name)}
                  </div>
                  {isContactOnline(selectedContact) && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 ring-2 ring-white dark:ring-gray-900 rounded-full" />
                  )}
                </div>

                {/* Nom, Rôle et Enfants */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h3 className="font-bold text-sm sm:text-base text-gray-900 dark:text-white truncate">
                      {selectedContact.first_name} {selectedContact.last_name}
                    </h3>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${getRoleBadgeStyle(
                        selectedContact.role
                      )}`}
                    >
                      {getRoleLabel(selectedContact.role)}
                    </span>
                  </div>

                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                    {isContactOnline(selectedContact) ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">● En ligne</span>
                    ) : selectedContactChildren.length > 0 ? (
                      `👶 Parent de ${selectedContactChildren.map((c) => c.first_name).join(', ')}`
                    ) : (
                      'Hors ligne'
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Fil des messages avec date headers */}
            <div
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 min-h-0 bg-gray-50/70 dark:bg-gray-950/70"
            >
              {conversation.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-6 text-gray-400">
                  <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-500 flex items-center justify-center mb-3 shadow-xs">
                    <MessageSquare className="w-8 h-8" />
                  </div>
                  <h4 className="font-bold text-base text-gray-800 dark:text-gray-200">
                    Aucun message échangé
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs mt-1">
                    Envoyez votre premier message pour démarrer la conversation avec{' '}
                    <span className="font-semibold text-gray-700 dark:text-gray-300">
                      {selectedContact.first_name}
                    </span>
                    .
                  </p>
                </div>
              ) : (
                conversation.map((msg, index) => {
                  const isMe =
                    msg.sender_id === (currentUser?.userId || currentUser?.id);
                  const showDateHeader = shouldShowDateHeader(conversation, index);

                  return (
                    <div key={msg.id} className="space-y-1">
                      {showDateHeader && (
                        <div className="flex items-center justify-center my-3">
                          <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 bg-gray-200/70 dark:bg-gray-800/80 px-3 py-1 rounded-full shadow-2xs">
                            {formatDateHeader(msg.created_at)}
                          </span>
                        </div>
                      )}

                      <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                        <div
                          className={`max-w-[85%] sm:max-w-[70%] px-4 py-2.5 rounded-2xl shadow-2xs leading-relaxed text-sm ${
                            isMe
                              ? 'bg-gradient-to-r from-blue-600 via-sky-600 to-indigo-600 text-white rounded-tr-xs'
                              : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-tl-xs border border-gray-200/60 dark:border-gray-700/60'
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                          <div
                            className={`flex items-center gap-1 mt-1 text-[10px] ${
                              isMe
                                ? 'text-blue-100 justify-end'
                                : 'text-gray-400 dark:text-gray-400 justify-start'
                            }`}
                          >
                            <span>{formatMessageTime(msg.created_at)}</span>
                            {isMe &&
                              (msg.is_read ? (
                                <CheckCheck className="w-3.5 h-3.5 text-cyan-200" title="Lu" />
                              ) : (
                                <Check className="w-3.5 h-3.5 text-blue-200" title="Envoyé" />
                              ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Barre de saisie moderne (Dock Chat sécurisé pour mobile) */}
            <form
              onSubmit={handleSendMessage}
              className="p-2.5 sm:p-3.5 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-gray-200/80 dark:border-gray-800 shrink-0 z-20"
              style={{
                paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom, 0px))'
              }}
            >
              <div className="flex items-center gap-2 max-w-4xl mx-auto w-full">
                <div className="flex-1 min-w-0 flex items-center bg-gray-100 dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700 rounded-2xl px-3.5 py-1.5 focus-within:ring-2 focus-within:ring-blue-500/40 focus-within:border-blue-500 transition-all">
                  <input
                    ref={messageInputRef}
                    type="text"
                    dir="auto"
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="Écrivez votre message..."
                    className="flex-1 min-w-0 bg-transparent text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 text-[16px] sm:text-sm focus:outline-none py-1.5 text-start"
                    style={{ fontSize: '16px' }}
                    autoComplete="off"
                    autoCorrect="off"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!replyContent.trim()}
                  aria-label="Envoyer le message"
                  className="p-2.5 sm:p-3 bg-gradient-to-r from-blue-600 via-sky-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-2xl shadow-md transition-all active:scale-95 shrink-0 min-w-[42px] min-h-[42px] flex items-center justify-center cursor-pointer"
                >
                  <Send className={`w-4 h-4 sm:w-5 sm:h-5 ${isRTL ? 'rotate-180' : ''}`} />
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* Écran d'accueil de la messagerie sur Desktop (Aucune conversation sélectionnée) */
          <div className="hidden lg:flex flex-1 flex-col items-center justify-center bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200/80 dark:border-gray-800 p-8 text-center">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4 shadow-sm border border-blue-100 dark:border-blue-900/50">
              <MessageSquare className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Vos échanges en direct
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm leading-relaxed">
              Sélectionnez un contact dans la liste à gauche pour consulter l'historique ou envoyer un nouveau message.
            </p>
          </div>
        )}
      </div>

      {/* Navigation mobile native (uniquement lorsque la liste des contacts est visible) */}
      {isMobile && !selectedContact && <MobileNavigation />}
    </div>
  );
}
