import { useState, useEffect } from 'react';
import { Send, MessageSquare, CheckCheck, Clock, User, X } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3003';

export default function MessagesPage() {
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [conversation, setConversation] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  
  // Formulaire nouveau message
  const [newMessage, setNewMessage] = useState({
    recipient_id: '',
    subject: '',
    content: ''
  });
  
  // Réponse
  const [replyContent, setReplyContent] = useState('');

  useEffect(() => {
    loadCurrentUser();
    loadMessages();
    loadUsers();
  }, []);

  const loadCurrentUser = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setCurrentUser(user);
  };

  const loadMessages = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/staff-messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setMessages(response.data.messages || []);
      }
    } catch (error) {
      console.error('Erreur chargement messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        // Filtrer pour ne garder que admin et staff
        const filtered = response.data.users.filter(u => 
          ['admin', 'staff'].includes(u.role) && u.id !== currentUser?.userId
        );
        setUsers(filtered);
      }
    } catch (error) {
      console.error('Erreur chargement utilisateurs:', error);
    }
  };

  const loadConversation = async (messageId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_URL}/api/staff-messages/${messageId}/conversation`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        setConversation(response.data.conversation || []);
      }
    } catch (error) {
      console.error('Erreur chargement conversation:', error);
    }
  };

  const handleSelectMessage = async (message) => {
    setSelectedMessage(message);
    await loadConversation(message.id);
    
    // Marquer comme lu si non lu
    if (!message.is_read && message.recipient_id === currentUser?.userId) {
      await markAsRead(message.id);
    }
  };

  const markAsRead = async (messageId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `${API_URL}/api/staff-messages/${messageId}/read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Recharger les messages
      loadMessages();
    } catch (error) {
      console.error('Erreur marquage lu:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/api/staff-messages`,
        newMessage,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        setShowNewMessage(false);
        setNewMessage({ recipient_id: '', subject: '', content: '' });
        loadMessages();
      }
    } catch (error) {
      console.error('Erreur envoi message:', error);
      alert('Erreur lors de l\'envoi du message');
    }
  };

  const handleReply = async (e) => {
    e.preventDefault();
    
    if (!replyContent.trim()) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/api/staff-messages`,
        {
          recipient_id: selectedMessage.sender_id === currentUser?.userId 
            ? selectedMessage.recipient_id 
            : selectedMessage.sender_id,
          parent_message_id: selectedMessage.id,
          content: replyContent
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        setReplyContent('');
        loadConversation(selectedMessage.id);
        loadMessages();
      }
    } catch (error) {
      console.error('Erreur envoi réponse:', error);
    }
  };

  const getOtherUser = (message) => {
    return message.sender_id === currentUser?.userId 
      ? message.recipient_name 
      : message.sender_name;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Messages</h1>
          <p className="text-gray-600 mt-1">
            {messages.filter(m => !m.is_read && m.recipient_id === currentUser?.userId).length} non lus
          </p>
        </div>
        
        <button
          onClick={() => setShowNewMessage(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Send className="w-5 h-5" />
          Nouveau message
        </button>
      </div>

      {/* Layout responsive */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Liste des messages */}
        <div className="lg:col-span-1 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h2 className="font-semibold text-gray-900">Conversations</h2>
          </div>
          
          <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
            {messages.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p>Aucun message</p>
              </div>
            ) : (
              messages.map((message) => (
                <button
                  key={message.id}
                  onClick={() => handleSelectMessage(message)}
                  className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                    selectedMessage?.id === message.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                  } ${
                    !message.is_read && message.recipient_id === currentUser?.userId ? 'bg-blue-50/50' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <p className="font-medium text-gray-900 truncate">
                          {getOtherUser(message)}
                        </p>
                      </div>
                      
                      <p className="text-sm text-gray-600 mt-1 truncate">
                        {message.subject || 'Sans objet'}
                      </p>
                      
                      <p className="text-xs text-gray-500 mt-1 truncate">
                        {message.content}
                      </p>
                    </div>
                    
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      {!message.is_read && message.recipient_id === currentUser?.userId ? (
                        <Clock className="w-4 h-4 text-blue-600" />
                      ) : (
                        <CheckCheck className="w-4 h-4 text-gray-400" />
                      )}
                      <span className="text-xs text-gray-500">
                        {new Date(message.created_at).toLocaleDateString('fr-FR', { 
                          day: 'numeric', 
                          month: 'short' 
                        })}
                      </span>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Conversation */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col h-[600px]">
          {selectedMessage ? (
            <>
              {/* Header conversation */}
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {selectedMessage.subject || 'Sans objet'}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Avec {getOtherUser(selectedMessage)}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedMessage(null)}
                    className="lg:hidden p-2 hover:bg-gray-200 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {conversation.map((msg) => {
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
                })}
              </div>

              {/* Formulaire réponse */}
              <form onSubmit={handleReply} className="p-4 border-t border-gray-200">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="Votre réponse..."
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
                <p>Sélectionnez une conversation</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal nouveau message */}
      {showNewMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Nouveau message</h2>
                <button
                  onClick={() => setShowNewMessage(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSendMessage} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Destinataire
                  </label>
                  <select
                    value={newMessage.recipient_id}
                    onChange={(e) => setNewMessage({ ...newMessage, recipient_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Sélectionner...</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.first_name} {user.last_name} ({user.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Objet
                  </label>
                  <input
                    type="text"
                    value={newMessage.subject}
                    onChange={(e) => setNewMessage({ ...newMessage, subject: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Message
                  </label>
                  <textarea
                    value={newMessage.content}
                    onChange={(e) => setNewMessage({ ...newMessage, content: e.target.value })}
                    rows={6}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    required
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowNewMessage(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Envoyer
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
