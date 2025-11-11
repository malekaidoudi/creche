import { useState, useEffect } from 'react';
import { Send, MessageSquare, X, Info, Shield, Users as UsersIcon, User } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3003/api';

export default function MessagesPage() {
  const [contacts, setContacts] = useState([]);
  const [children, setChildren] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [conversation, setConversation] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [showChildInfo, setShowChildInfo] = useState(null);
  const [replyContent, setReplyContent] = useState('');

  useEffect(() => {
    loadCurrentUser();
    loadContacts();
    loadChildren();
  }, []);

  const loadCurrentUser = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setCurrentUser(user);
  };

  const loadContacts = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('🔍 Chargement contacts...');
      const response = await axios.get(`${API_URL}/users?limit=100`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('📦 Réponse users:', response.data);
      
      if (response.data.success) {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const filtered = response.data.users.filter(u => u.id !== user.userId);
        console.log('✅ Contacts filtrés:', filtered.length);
        setContacts(filtered);
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
      const response = await axios.get(`${API_URL}/children?limit=100`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('📦 Réponse children:', response.data);
      
      if (response.data.success) {
        setChildren(response.data.children || []);
        console.log('✅ Enfants chargés:', response.data.children?.length || 0);
      }
    } catch (error) {
      console.error('❌ Erreur chargement enfants:', error);
      console.error('Détails:', error.response?.data);
    }
  };

  const loadConversation = async (contactId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/staff-messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        const messages = response.data.messages || [];
        const filtered = messages.filter(m => 
          m.sender_id === contactId || m.recipient_id === contactId
        );
        
        const allConversations = [];
        for (const msg of filtered) {
          const convResponse = await axios.get(
            `${API_URL}/staff-messages/${msg.id}/conversation`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (convResponse.data.success) {
            allConversations.push(...convResponse.data.conversation);
          }
        }
        
        const unique = Array.from(new Map(allConversations.map(m => [m.id, m])).values());
        unique.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        
        setConversation(unique);
      }
    } catch (error) {
      console.error('Erreur chargement conversation:', error);
    }
  };

  const handleSelectContact = async (contact) => {
    setSelectedContact(contact);
    await loadConversation(contact.id);
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
        setReplyContent('');
        loadConversation(selectedContact.id);
      }
    } catch (error) {
      console.error('Erreur envoi message:', error);
    }
  };

  const getChildrenForParent = (parentId) => {
    // Filtrer les enfants par parent_id ou parent_user_id
    const parentChildren = children.filter(c => 
      c.parent_id === parentId || c.parent_user_id === parentId
    );
    console.log(`👶 Enfants pour parent ${parentId}:`, parentChildren);
    return parentChildren;
  };

  const groupContactsByRole = () => {
    return {
      admin: contacts.filter(c => c.role === 'admin'),
      staff: contacts.filter(c => c.role === 'staff'),
      parent: contacts.filter(c => c.role === 'parent')
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
        <div className="lg:col-span-1 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h2 className="font-semibold text-gray-900">Contacts</h2>
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
                {grouped.parent.map((contact) => {
                  const contactChildren = getChildrenForParent(contact.id);
                  
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
                        
                        {contactChildren.length > 0 && (
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowChildInfo(showChildInfo === contact.id ? null : contact.id);
                              }}
                              className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                            >
                              <Info className="w-4 h-4 text-purple-600" />
                            </button>
                            
                            {showChildInfo === contact.id && (
                              <div className="absolute right-0 top-8 z-10 bg-white border border-gray-200 rounded-lg shadow-lg p-3 min-w-[200px]">
                                <p className="text-xs font-semibold text-gray-700 mb-2">Enfants:</p>
                                {contactChildren.map((child) => (
                                  <p key={child.id} className="text-xs text-gray-600">
                                    • {child.first_name} {child.last_name}
                                  </p>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
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
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
                    const isMe = msg.sender_id === currentUser?.userId;
                    
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] sm:max-w-[70%] rounded-lg p-3 ${
                            isMe
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                          <p className={`text-xs mt-1 ${isMe ? 'text-blue-100' : 'text-gray-500'}`}>
                            {new Date(msg.created_at).toLocaleString('fr-FR', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
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
