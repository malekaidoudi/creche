import { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare, X, Info, Shield, Users as UsersIcon, User } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3003/api';

export default function MessagesPage() {
  const [contacts, setContacts] = useState([]);
  const [children, setChildren] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [conversation, setConversation] = useState([]);
  const [conversationCache, setConversationCache] = useState(() => {
    // Charger le cache depuis localStorage au démarrage
    try {
      const cached = localStorage.getItem('messagesCache');
      if (cached) {
        const parsed = JSON.parse(cached);
        // Vérifier si le cache n'est pas expiré (24h)
        const now = Date.now();
        const isValid = Object.values(parsed).every(item => 
          item.timestamp && (now - item.timestamp < 24 * 60 * 60 * 1000)
        );
        if (isValid) {
          console.log('📦 Cache chargé depuis localStorage:', Object.keys(parsed).length, 'conversations');
          return parsed;
        }
      }
    } catch (error) {
      console.error('Erreur chargement cache:', error);
    }
    return {};
  });
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [showChildInfo, setShowChildInfo] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const initData = async () => {
      const user = await loadCurrentUser();
      await loadContacts(user);
      await loadChildren();
    };
    initData();
  }, []);

  // Sauvegarder le cache dans localStorage à chaque modification
  useEffect(() => {
    if (Object.keys(conversationCache).length > 0) {
      try {
        localStorage.setItem('messagesCache', JSON.stringify(conversationCache));
        console.log('💾 Cache sauvegardé dans localStorage:', Object.keys(conversationCache).length, 'conversations');
      } catch (error) {
        console.error('Erreur sauvegarde cache:', error);
      }
    }
  }, [conversationCache]);

  // Vider le cache si le token n'existe plus
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      localStorage.removeItem('messagesCache');
      setConversationCache({});
      console.log('🗑️ Cache vidé (pas de token)');
    }
  }, []);

  // Auto-scroll vers le bas quand la conversation change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversation]);

  // Rafraîchir la conversation toutes les 10 secondes si un contact est sélectionné
  useEffect(() => {
    if (!selectedContact) return;
    
    const interval = setInterval(async () => {
      console.log('🔄 Rafraîchissement automatique conversation pour:', selectedContact.first_name);
      await loadConversation(selectedContact.id);
    }, 10000); // 10 secondes
    
    return () => clearInterval(interval);
  }, [selectedContact]);

  const loadCurrentUser = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('📦 Réponse /auth/me:', response.data);
      
      // Accepter différentes structures de réponse
      let user = null;
      if (response.data.success && response.data.user) {
        user = response.data.user;
      } else if (response.data.user) {
        user = response.data.user;
      } else if (response.data.id) {
        // La réponse est directement l'utilisateur
        user = response.data;
      }
      
      if (user && user.id) {
        console.log('👤 loadCurrentUser depuis API:', user);
        setCurrentUser(user);
        return user;
      }
    } catch (error) {
      console.error('❌ Erreur chargement utilisateur:', error);
    }
    
    // Fallback sur localStorage
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    console.log('👤 loadCurrentUser depuis localStorage:', user);
    setCurrentUser(user);
    return user;
  };

  const loadContacts = async (user) => {
    try {
      const token = localStorage.getItem('token');
      console.log('🔍 Chargement contacts...');
      const response = await axios.get(`${API_URL}/users?limit=100`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('📦 Réponse users:', response.data);
      console.log('🔍 Success?', response.data.success);
      console.log('🔍 Users array?', Array.isArray(response.data.users));
      
      if (response.data.success && response.data.users) {
        console.log('👤 Utilisateur actuel:', { userId: user.userId, id: user.id, email: user.email });
        console.log('📋 Tous contacts AVANT filtrage:', response.data.users.map(u => ({ id: u.id, name: u.first_name + ' ' + u.last_name, email: u.email })));
        
        // Exclure l'utilisateur actuel de la liste des contacts
        const filtered = response.data.users.filter(u => {
          const isCurrentUser = u.id === user.userId || u.id === user.id || u.email === user.email;
          if (isCurrentUser) {
            console.log('🚫 Exclu utilisateur actuel:', u.first_name, u.last_name, u.email, 'ID:', u.id);
          }
          return !isCurrentUser && u.is_active;
        });
        
        console.log('✅ Contacts filtrés:', filtered.length, '(exclu utilisateur actuel)');
        console.log('📋 Contacts APRÈS filtrage:', filtered.map(u => ({ id: u.id, name: u.first_name + ' ' + u.last_name, email: u.email })));
        setContacts(filtered);
      } else {
        console.error('❌ Problème avec la réponse users:', response.data);
      }
    } catch (error) {
      console.error('❌ Erreur chargement contacts:', error);
      console.error('Détails:', error.response?.data);
    } finally {
      setLoading(false);
    }
  };

  const loadChildren = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('🔍 Chargement enfants...');
      const response = await axios.get(`${API_URL}/children/simple`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('📦 Réponse children:', response.data);
      
      if (response.data.success) {
        const childrenData = response.data.children || [];
        setChildren(childrenData);
        console.log('✅ Enfants chargés:', childrenData.length);
        console.log('📋 Exemple enfant:', childrenData[0]);
        console.log('👨‍👩‍👧 parent_ids:', childrenData.map(c => ({ id: c.id, name: c.first_name, parent_id: c.parent_id, parent_user_id: c.parent_user_id })));
      }
    } catch (error) {
      console.error('❌ Erreur chargement enfants:', error);
      console.error('Détails:', error.response?.data);
    }
  };

  const loadConversation = async (contactId) => {
    try {
      console.log('🔄 loadConversation pour contactId:', contactId, 'utilisateur actuel:', currentUser?.userId || currentUser?.id);
      const token = localStorage.getItem('token');
      const currentUserId = currentUser?.userId || currentUser?.id;
      
      const response = await axios.get(`${API_URL}/staff-messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        const messages = response.data.messages || [];
        console.log('📨 Messages totaux:', messages.length);
        
        // Filtrer UNIQUEMENT les messages entre l'utilisateur actuel ET le contact sélectionné
        const filtered = messages.filter(m => 
          (m.sender_id === currentUserId && m.recipient_id === contactId) ||
          (m.sender_id === contactId && m.recipient_id === currentUserId)
        );
        console.log('📨 Messages filtrés entre utilisateur', currentUserId, 'et contact', contactId, ':', filtered.length);
        
        const allConversations = [];
        for (const msg of filtered) {
          console.log('🔍 Chargement conversation pour message ID:', msg.id, 'entre', msg.sender_id, '→', msg.recipient_id);
          const convResponse = await axios.get(
            `${API_URL}/staff-messages/${msg.id}/conversation`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (convResponse.data.success) {
            console.log('💬 Messages dans conversation:', convResponse.data.conversation.length);
            // Filtrer encore une fois les messages de la conversation
            const filteredConv = convResponse.data.conversation.filter(cm =>
              (cm.sender_id === currentUserId && cm.recipient_id === contactId) ||
              (cm.sender_id === contactId && cm.recipient_id === currentUserId)
            );
            allConversations.push(...filteredConv);
          }
        }
        
        const unique = Array.from(new Map(allConversations.map(m => [m.id, m])).values());
        unique.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        
        console.log('✅ Conversation finale entre utilisateur', currentUserId, 'et contact', contactId, ':', unique.length, 'messages');
        console.log('📋 Détails messages:', unique.map(m => ({
          id: m.id,
          from: m.sender_id,
          to: m.recipient_id,
          content: m.content.substring(0, 30) + '...'
        })));
        setConversation(unique);
        
        // Mettre à jour le cache avec la conversation fraîche
        const contact = contacts.find(c => c.id === contactId);
        if (contact) {
          const cacheKey = `contact_${contactId}`;
          setConversationCache(prev => ({
            ...prev,
            [cacheKey]: {
              contactId: contactId,
              contactName: contact.first_name + ' ' + contact.last_name,
              messages: unique,
              timestamp: Date.now()
            }
          }));
        }
      }
    } catch (error) {
      console.error('Erreur chargement conversation:', error);
    }
  };

  const handleSelectContact = async (contact) => {
    console.log('🎯 Sélection contact:', contact.first_name, contact.last_name, 'ID:', contact.id, 'Type:', typeof contact.id);
    
    // Sauvegarder la conversation actuelle dans le cache
    if (selectedContact && conversation.length > 0) {
      const cacheKey = `contact_${selectedContact.id}`;
      console.log('💾 Sauvegarde conversation pour:', selectedContact.first_name, 'ID:', selectedContact.id, 'CacheKey:', cacheKey, 'Messages:', conversation.length);
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
    
    // Vider la conversation AVANT de charger la nouvelle
    setConversation([]);
    setSelectedContact(contact);
    
    // Charger depuis le cache ou depuis l'API
    const cacheKey = `contact_${contact.id}`;
    if (conversationCache[cacheKey]) {
      const cached = conversationCache[cacheKey];
      console.log('📋 Chargement conversation depuis cache pour:', contact.first_name, 'ID:', contact.id, 'CacheKey:', cacheKey);
      console.log('📋 Cache info:', { contactId: cached.contactId, contactName: cached.contactName, messages: cached.messages.length });
      setConversation(cached.messages);
    } else {
      console.log('🔍 Chargement conversation depuis API pour:', contact.first_name, 'ID:', contact.id, 'CacheKey:', cacheKey);
      await loadConversation(contact.id);
    }
  };

  const handleSendMessage = async (e) => {
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
        // Ajouter le message immédiatement à la conversation
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
        
        // Mettre à jour le cache avec la nouvelle conversation
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
      }
    } catch (error) {
      console.error('Erreur envoi message:', error);
    }
  };

  const getChildrenForParent = (parentId) => {
    // Convertir en nombre pour comparaison
    const parentIdNum = Number(parentId);
    
    // Filtrer les enfants par parent_id ou parent_user_id
    const parentChildren = children.filter(c => {
      const childParentId = Number(c.parent_id);
      const childParentUserId = Number(c.parent_user_id);
      
      const match = childParentId === parentIdNum || childParentUserId === parentIdNum;
      
      if (match) {
        console.log(`✅ Match trouvé pour parent ${parentId}:`, c.first_name, c.last_name, '(parent_id:', c.parent_id, ', parent_user_id:', c.parent_user_id, ')');
      }
      return match;
    });
    
    console.log(`👶 Recherche enfants pour parent ID ${parentId} (type: ${typeof parentId})`);
    console.log(`👶 Total enfants trouvés:`, parentChildren.length);
    
    if (parentChildren.length === 0) {
      console.log(`⚠️ Aucun enfant trouvé pour parent ${parentId}.`);
      console.log(`📋 Tous les enfants disponibles:`, children.map(c => ({ 
        id: c.id, 
        name: c.first_name, 
        parent_id: c.parent_id + ' (type: ' + typeof c.parent_id + ')', 
        parent_user_id: c.parent_user_id + ' (type: ' + typeof c.parent_user_id + ')'
      })));
    }
    
    return parentChildren;
  };

  const groupContactsByRole = () => {
    return {
      admin: contacts.filter(c => c.role === 'admin' && c.is_active),
      staff: contacts.filter(c => c.role === 'staff' && c.is_active),
      parent: contacts.filter(c => c.role === 'parent' && c.is_active)
    };
  };

  const getRoleLabel = (role) => {
    const labels = {
      admin: 'Directeur',
      staff: 'Personnel',
      parent: 'Parents'
    };
    return labels[role] || role;
  };

  const getRoleIcon = (role) => {
    if (role === 'admin') return <Shield className="w-4 h-4 text-blue-600" />;
    if (role === 'staff') return <UsersIcon className="w-4 h-4 text-green-600" />;
    return <User className="w-4 h-4 text-purple-600" />;
  };

  const getRoleColor = (role) => {
    if (role === 'admin') return 'bg-blue-600';
    if (role === 'staff') return 'bg-green-600';
    return 'bg-purple-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const grouped = groupContactsByRole();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Messages</h1>
        <p className="text-gray-600 mt-1">Communiquez avec l'équipe et les parents</p>
      </div>

      {/* Layout responsive */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Section Contacts */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <UsersIcon className="w-5 h-5" />
              Contacts
            </h2>
          </div>
          <div className="max-h-[600px] overflow-y-auto">
            {/* Directeur */}
            {grouped.admin.length > 0 && (
              <div className="border-b border-gray-200">
                <div className="p-3 bg-blue-50 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-semibold text-blue-900">Directeur</span>
                </div>
                {grouped.admin.map((contact) => (
                  <button
                    key={contact.id}
                    onClick={() => handleSelectContact(contact)}
                    className={`w-full p-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 ${
                      selectedContact?.id === contact.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          {contact.first_name} {contact.last_name}
                        </p>
                        <p className="text-xs text-gray-500">{contact.email}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Personnel */}
            {grouped.staff.length > 0 && (
              <div className="border-b border-gray-200">
                <div className="p-3 bg-green-50 flex items-center gap-2">
                  <UsersIcon className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-semibold text-green-900">Personnel</span>
                </div>
                {grouped.staff.map((contact) => (
                  <button
                    key={contact.id}
                    onClick={() => handleSelectContact(contact)}
                    className={`w-full p-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 ${
                      selectedContact?.id === contact.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          {contact.first_name} {contact.last_name}
                        </p>
                        <p className="text-xs text-gray-500">{contact.email}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Parents */}
            {grouped.parent.length > 0 && (
              <div>
                <div className="p-3 bg-purple-50 flex items-center gap-2">
                  <User className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-semibold text-purple-900">Parents</span>
                </div>
                {grouped.parent.map((contact, index) => {
                  const contactChildren = getChildrenForParent(contact.id);
                  const isLastTwo = index >= grouped.parent.length - 2; // Les 2 derniers
                  console.log(`👤 Contact parent ${contact.id} (${contact.first_name}):`, contactChildren.length, 'enfants');
                  
                  return (
                    <button
                      key={contact.id}
                      onClick={() => handleSelectContact(contact)}
                      className={`w-full p-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 ${
                        selectedContact?.id === contact.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            {contact.first_name} {contact.last_name}
                          </p>
                          <p className="text-xs text-gray-500">{contact.email}</p>
                        </div>
                        
                        {/* Toujours afficher l'icône info pour les parents */}
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowChildInfo(showChildInfo === contact.id ? null : contact.id);
                            }}
                            className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                            title={contactChildren.length > 0 ? `${contactChildren.length} enfant(s)` : 'Aucun enfant'}
                          >
                            <Info className="w-4 h-4 text-purple-600" />
                          </button>
                          
                          {showChildInfo === contact.id && (
                            <div className={`absolute right-0 z-10 bg-white border border-gray-200 rounded-lg shadow-lg p-3 min-w-[200px] ${
                              isLastTwo ? 'bottom-8' : 'top-8'
                            }`}>
                              <p className="text-xs font-semibold text-gray-700 mb-2">Enfants:</p>
                              {contactChildren.length > 0 ? (
                                contactChildren.map((child) => (
                                  <p key={child.id} className="text-xs text-gray-600">
                                    • {child.first_name} {child.last_name}
                                  </p>
                                ))
                              ) : (
                                <p className="text-xs text-gray-500 italic">Aucun enfant associé</p>
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
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col h-[600px]">
          {selectedContact ? (
            <>
              {/* Header conversation */}
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getRoleIcon(selectedContact.role)}
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {selectedContact.first_name} {selectedContact.last_name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {getRoleLabel(selectedContact.role)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedContact(null)}
                    className="lg:hidden p-2 hover:bg-gray-200 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
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
                    // Couleur selon le rôle du contact sélectionné
                    const contactRole = selectedContact?.role;
                    const bgColor = isMe ? getRoleColor(contactRole) : 'bg-gray-100';
                    const textColor = isMe ? 'text-white' : 'text-gray-900';
                    
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        {/* Heure au-dessus */}
                        <p className="text-xs text-gray-500 mb-1 px-1">
                          {new Date(msg.created_at).toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                        
                        {/* Message */}
                        <div className={`max-w-[80%] sm:max-w-[70%] rounded-lg px-4 py-2 ${bgColor} ${textColor}`}>
                          <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                        </div>
                      </div>
                    );
                  })
                )}
                {/* Référence pour auto-scroll */}
                <div ref={messagesEndRef} />
              </div>

              {/* Formulaire envoi */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="Écrivez votre message..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium">Sélectionnez un contact</p>
                <p className="text-sm mt-1">Choisissez un contact pour commencer à discuter</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
