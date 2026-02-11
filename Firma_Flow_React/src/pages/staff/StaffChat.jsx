import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useStaff } from '../../contexts/StaffContext';
import { buildApiUrl } from '../../config/api.config';
import StaffLayout from '../../components/StaffLayout';
import { Send, UserCircle, Clock, MessageSquare, CheckCircle2, AlertCircle } from 'lucide-react';

const StaffChat = () => {
  const { theme } = useTheme();
  const { staff } = useStaff();
  const [chatSessions, setChatSessions] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState(null);
  const [showTakeModal, setShowTakeModal] = useState(false);
  const [chatToTake, setChatToTake] = useState(null);
  const messagesEndRef = useRef(null);

  // Toast notification helper
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    fetchChatSessions();
    const interval = setInterval(fetchChatSessions, 5000);
    return () => clearInterval(interval);
  }, [staff]);

  useEffect(() => {
    if (selectedChat) {
      fetchMessages(selectedChat.session_id);
      const interval = setInterval(() => fetchMessages(selectedChat.session_id), 2000);
      return () => clearInterval(interval);
    }
  }, [selectedChat]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchChatSessions = async () => {
    try {
      const url = buildApiUrl('superadmin/api/chat_sessions.php');
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();
      if (data.success) {
        // Show queue chats (no assigned_admin) AND chats assigned to this staff member
        const relevantSessions = data.sessions.filter(session => {
          const isAssignedToMe = session.assigned_admin === staff?.username || session.assigned_admin === staff?.full_name;
          const isInQueue = !session.assigned_admin || session.assigned_admin === null || session.assigned_admin === '';
          return isAssignedToMe || isInQueue;
        });
        setChatSessions(relevantSessions);
      }
    } catch (error) {
      console.error('Failed to fetch chat sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (sessionId) => {
    try {
      const url = buildApiUrl(`superadmin/api/chat_messages.php?session_id=${sessionId}`);
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();
      if (data.success) {
        setMessages(data.messages);
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat) return;

    setSending(true);
    try {
      const url = buildApiUrl('superadmin/api/send-chat-message.php');
      const response = await fetch(url, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: selectedChat.session_id,
          message: newMessage,
          sender_type: 'admin'
        })
      });

      const data = await response.json();
      if (data.success) {
        setNewMessage('');
        await fetchMessages(selectedChat.session_id);
        showToast('Message sent', 'success');
      } else {
        showToast(data.message || 'Failed to send message', 'error');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      showToast('Failed to send message', 'error');
    } finally {
      setSending(false);
    }
  };

  const takeChat = async (sessionId) => {
    try {
      const url = buildApiUrl('superadmin/api/assign-chat.php');
      const response = await fetch(url, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          session_id: sessionId,
          assign_to: null // Assign to self
        })
      });

      const data = await response.json();
      if (data.success) {
        showToast('Chat taken successfully!', 'success');
        fetchChatSessions();
        setShowTakeModal(false);
        // Auto-select the chat
        const session = chatSessions.find(s => s.id === sessionId);
        if (session) {
          setSelectedChat({ ...session, assigned_admin: staff?.username });
        }
      } else {
        showToast(data.message || 'Failed to take chat', 'error');
      }
    } catch (error) {
      console.error('Failed to take chat:', error);
      showToast('Failed to take chat', 'error');
    }
  };

  const closeChat = async (sessionId) => {
    try {
      const url = buildApiUrl('superadmin/api/close-chat.php');
      const response = await fetch(url, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId })
      });

      const data = await response.json();
      if (data.success) {
        showToast('Chat closed successfully', 'success');
        setSelectedChat(null);
        fetchChatSessions();
      }
    } catch (error) {
      console.error('Failed to close chat:', error);
      showToast('Failed to close chat', 'error');
    }
  };

  const openTakeModal = (session) => {
    setChatToTake(session);
    setShowTakeModal(true);
  };

  const handleTakeChatConfirm = () => {
    if (chatToTake) {
      takeChat(chatToTake.id);
    }
  };

  const filteredSessions = chatSessions.filter(session => {
    const matchesSearch = session.visitor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         session.visitor_email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesFilter = true;
    if (activeFilter === 'assigned') {
      matchesFilter = session.assigned_admin === staff?.username || session.assigned_admin === staff?.full_name;
    } else if (activeFilter === 'queue') {
      matchesFilter = !session.assigned_admin || session.assigned_admin === null || session.assigned_admin === '';
    } else if (activeFilter === 'active') {
      matchesFilter = session.status === 'active';
    }
    
    return matchesSearch && matchesFilter;
  });

  const assignedCount = chatSessions.filter(s => s.assigned_admin === staff?.username || s.assigned_admin === staff?.full_name).length;
  const queueCount = chatSessions.filter(s => !s.assigned_admin || s.assigned_admin === null || s.assigned_admin === '').length;
  const unreadCount = chatSessions.filter(s => s.is_read === 0).length;

  return (
    <StaffLayout>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Live Chat Support</h1>
          <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
            View queue chats and manage conversations assigned to you
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Assigned to Me</p>
                <p className="text-2xl font-bold">{assignedCount}</p>
              </div>
              <MessageSquare className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>In Queue</p>
                <p className="text-2xl font-bold">{queueCount}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </div>

          <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Active</p>
                <p className="text-2xl font-bold">{chatSessions.filter(s => s.status === 'active').length}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Unread</p>
                <p className="text-2xl font-bold">{unreadCount}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
          </div>
        </div>

        {/* Chat Interface */}
        <div className={`flex-1 grid grid-cols-3 gap-4 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow overflow-hidden`}>
          {/* Sessions List */}
          <div className={`col-span-1 ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} border-r flex flex-col`}>
            {/* Search */}
            <div className="p-4 border-b">
              <input
                type="text"
                placeholder="Search chats..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-gray-50 border-gray-200 text-gray-900'
                } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
            </div>

            {/* Filters */}
            <div className="p-2 border-b flex space-x-2">
              {['all', 'assigned', 'queue', 'active'].map(filter => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                    activeFilter === filter
                      ? 'bg-blue-500 text-white'
                      : theme === 'dark'
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
              ))}
            </div>

            {/* Chat List */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center">Loading...</div>
              ) : filteredSessions.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  {activeFilter === 'assigned' ? 'No chats assigned to you' : 'No chats available'}
                </div>
              ) : (
                filteredSessions.map(session => {
                  const isAssigned = session.assigned_admin === staff?.username || session.assigned_admin === staff?.full_name;
                  const isInQueue = !session.assigned_admin || session.assigned_admin === null || session.assigned_admin === '';
                  
                  return (
                    <div
                      key={session.id}
                      onClick={() => isAssigned && setSelectedChat(session)}
                      className={`p-4 border-b transition-colors ${
                        isInQueue ? '' : 'cursor-pointer'
                      } ${
                        selectedChat?.id === session.id
                          ? theme === 'dark' ? 'bg-gray-700' : 'bg-blue-50'
                          : theme === 'dark' ? 'hover:bg-gray-750' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <UserCircle className="w-10 h-10 text-gray-400" />
                          <div>
                            <p className="font-medium">{session.visitor_name || 'Anonymous'}</p>
                            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                              {session.visitor_email || 'No email'}
                            </p>
                          </div>
                        </div>
                        {session.is_read === 0 && (
                          <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                        )}
                      </div>
                      
                      {/* Status Indicator */}
                      {isAssigned ? (
                        <div className="flex items-center text-xs text-green-500 ml-13">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          <span>Assigned to you</span>
                        </div>
                      ) : isInQueue ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openTakeModal(session);
                          }}
                          className="w-full mt-2 px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                        >
                          Take Chat
                        </button>
                      ) : null}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Messages Area */}
          <div className="col-span-2 flex flex-col">
            {selectedChat ? (
              <>
                {/* Chat Header */}
                <div className={`p-4 border-b flex items-center justify-between ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                  <div>
                    <h3 className="font-semibold">{selectedChat.visitor_name || 'Anonymous'}</h3>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      {selectedChat.visitor_email || 'No email'}
                    </p>
                  </div>
                  <button
                    onClick={() => closeChat(selectedChat.session_id)}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                  >
                    Close Chat
                  </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map(msg => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender_type === 'admin' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-xs px-4 py-2 rounded-lg ${
                        msg.sender_type === 'admin'
                          ? 'bg-blue-500 text-white'
                          : theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
                      }`}>
                        <p>{msg.message}</p>
                        <p className={`text-xs mt-1 ${
                          msg.sender_type === 'admin' ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          {new Date(msg.sent_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className={`p-4 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                  <div className="flex space-x-3">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      placeholder="Type your message..."
                      className={`flex-1 px-4 py-2 rounded-lg ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-gray-50 border-gray-200 text-gray-900'
                      } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    />
                    <button
                      onClick={sendMessage}
                      disabled={sending || !newMessage.trim()}
                      className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                Select a chat to start messaging
              </div>
            )}
          </div>
        </div>

        {/* Toast */}
        {toast && (
          <div className={`fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg ${
            toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
          } text-white z-50`}>
            {toast.message}
          </div>
        )}

        {/* Take Chat Modal */}
        {showTakeModal && chatToTake && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg p-6 max-w-md w-full`}>
              <h3 className="text-xl font-bold mb-4">Take Chat</h3>
              <p className="mb-6">
                Are you sure you want to take this chat from <strong>{chatToTake.visitor_name || 'Anonymous'}</strong>?
                This chat will be assigned to you.
              </p>
              <div className="flex space-x-3 justify-end">
                <button
                  onClick={() => setShowTakeModal(false)}
                  className={`px-4 py-2 rounded-lg ${
                    theme === 'dark'
                      ? 'bg-gray-700 hover:bg-gray-600'
                      : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleTakeChatConfirm}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  Take Chat
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </StaffLayout>
  );
};

export default StaffChat;
