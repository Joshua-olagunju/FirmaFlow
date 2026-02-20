import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../../../contexts/ThemeContext';
import { buildApiUrl } from '../../../config/api.config';
import SuperAdminLayout from '../../../components/SuperAdminLayout';
import { Send, UserCircle, Clock, MessageSquare, X, CheckCircle2, AlertCircle, Image } from 'lucide-react';

const SuperAdminLiveChat = () => {
  const { theme } = useTheme();
  const [chatSessions, setChatSessions] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState(null);
  const [staff, setStaff] = useState([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState('self');
  const [chatToAssign, setChatToAssign] = useState(null);
  const [showNewMessageNotice, setShowNewMessageNotice] = useState(false);
  const messagesContainerRef = useRef(null);
  const isAtBottomRef = useRef(true);

  const handleMessagesScroll = () => {
    const c = messagesContainerRef.current;
    if (!c) return;
    isAtBottomRef.current = c.scrollHeight - c.scrollTop - c.clientHeight < 80;
    if (isAtBottomRef.current) {
      setShowNewMessageNotice(false);
    }
  };

  // Render message body â€” handles text and image types
  const renderMessageContent = (message) => {
    if (message.message_type === 'image' && message.file_path) {
      const imgUrl = buildApiUrl(message.file_path);
      return (
        <div className="space-y-1">
          <img
            src={imgUrl}
            alt={message.file_name || 'Shared image'}
            className="max-w-xs rounded-lg shadow cursor-pointer hover:shadow-md transition-shadow"
            style={{ maxHeight: '200px' }}
            onClick={() => window.open(imgUrl, '_blank')}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          {message.message && message.message !== 'Image shared' && (
            <p className="text-sm whitespace-pre-wrap">{message.message}</p>
          )}
        </div>
      );
    }
    return <p className="text-sm whitespace-pre-wrap">{message.message}</p>;
  };

  // Toast notification helper
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    fetchChatSessions();
    fetchStaff();
    // Set up real-time updates
    const interval = setInterval(fetchChatSessions, 5000);
    return () => clearInterval(interval);
  }, [activeFilter]);

  useEffect(() => {
    if (selectedChat) {
      fetchMessages(selectedChat.session_id);
      // Update messages more frequently for selected chat
      const messageInterval = setInterval(() => fetchMessages(selectedChat.session_id), 2000);
      return () => clearInterval(messageInterval);
    }
  }, [selectedChat]);

  const fetchStaff = async () => {
    try {
      const response = await fetch(buildApiUrl('superadmin/api/staff.php'), {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setStaff(data.staff || []);
        }
      }
    } catch (error) {
      console.error('Failed to fetch staff:', error);
    }
  };

  const fetchChatSessions = async () => {
    try {
      const params = new URLSearchParams({
        status: activeFilter,
        search: searchTerm
      });

      const response = await fetch(buildApiUrl(`superadmin/api/chat_sessions.php?${params}`), {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setChatSessions(data.sessions || []);
        }
      }
    } catch (error) {
      console.error('Failed to fetch chat sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (sessionId) => {
    try {
      const response = await fetch(buildApiUrl(`superadmin/api/chat_messages.php?session_id=${sessionId}`), {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setMessages((prev) => {
            const next = data.messages || [];
            const previousLastId = prev.length ? prev[prev.length - 1].id : 0;
            const nextLastId = next.length ? next[next.length - 1].id : 0;
            if (prev.length > 0 && nextLastId > previousLastId && !isAtBottomRef.current) {
              setShowNewMessageNotice(true);
            }
            return next;
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat || sending) return;

    setSending(true);
    try {
      const response = await fetch(buildApiUrl('superadmin/api/send-chat-message.php'), {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: selectedChat.session_id,
          message: newMessage.trim()
        })
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        setNewMessage('');
        fetchMessages(selectedChat.session_id);
        showToast('Message sent successfully!');
      } else {
        showToast(data.message || 'Failed to send message', 'error');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      showToast('Network error. Please try again.', 'error');
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const assignChat = async (sessionId, staffUsername = null) => {
    try {
      const response = await fetch(buildApiUrl('superadmin/api/assign-chat.php'), {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          session_id: sessionId,
          assign_to: staffUsername 
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        fetchChatSessions();
        if (!staffUsername || staffUsername === 'self') {
          setSelectedChat({ session_id: sessionId, ...data.session });
          showToast('Chat assigned to you successfully!', 'success');
        } else {
          showToast(`Chat assigned to ${staffUsername} successfully!`, 'success');
        }
        setShowAssignModal(false);
      } else {
        showToast(data.message || 'Failed to assign chat', 'error');
      }
    } catch (error) {
      console.error('Failed to assign chat:', error);
      showToast('Failed to assign chat', 'error');
    }
  };

  const openAssignModal = (session) => {
    setChatToAssign(session);
    setSelectedStaff('self');
    setShowAssignModal(true);
  };

  const handleAssignSubmit = () => {
    if (!chatToAssign) return;
    
    const staffUsername = selectedStaff === 'self' ? null : selectedStaff;
    assignChat(chatToAssign.session_id, staffUsername);
  };

  const closeChat = async () => {
    if (!selectedChat || !confirm('Are you sure you want to close this chat?')) return;

    try {
      const response = await fetch(buildApiUrl('superadmin/api/close-chat.php'), {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ session_id: selectedChat.session_id })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setSelectedChat(null);
        setMessages([]);
        fetchChatSessions();
        showToast('Chat closed successfully', 'success');
      } else {
        showToast(data.message || 'Failed to close chat', 'error');
      }
    } catch (error) {
      console.error('Failed to close chat:', error);
    }
  };

  const updateSessionStatus = async (sessionId, newStatus) => {
    if (newStatus === 'closed') {
      await closeChat();
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'waiting': return 'text-yellow-600 bg-yellow-100';
      case 'closed': return 'text-slate-600 bg-slate-100';
      default: return 'text-slate-600 bg-slate-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return 'ðŸŸ¢';
      case 'waiting': return 'ðŸŸ¡';
      case 'closed': return 'âšª';
      default: return 'âšª';
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) { // Less than 1 minute
      return 'Just now';
    } else if (diff < 3600000) { // Less than 1 hour
      return `${Math.floor(diff / 60000)}m ago`;
    } else if (diff < 86400000) { // Less than 1 day
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString();
    }
  };

  const filteredSessions = chatSessions.filter(session =>
    session.visitor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    session.visitor_email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: chatSessions.length,
    active: chatSessions.filter(s => s.status === 'active').length,
    waiting: chatSessions.filter(s => s.status === 'waiting').length,
    closed: chatSessions.filter(s => s.status === 'closed').length
  };

  if (loading) {
    return (
      <SuperAdminLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className={`${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
              Loading chat sessions...
            </p>
          </div>
        </div>
      </SuperAdminLayout>
    );
  }

  return (
    <SuperAdminLayout>
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 animate-fadeIn">
          <div className={`flex items-center space-x-3 px-4 py-3 rounded-lg shadow-lg ${
            toast.type === 'success' 
              ? 'bg-green-600 text-white' 
              : 'bg-red-600 text-white'
          }`}>
            {toast.type === 'success' ? (
              <CheckCircle2 size={20} />
            ) : (
              <AlertCircle size={20} />
            )}
            <span className="font-medium">{toast.message}</span>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div>
            <h1 className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              Live Chat Management
            </h1>
            <p className={`mt-2 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
              Monitor and respond to customer chat sessions
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={fetchChatSessions}
              disabled={loading}
              className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                theme === 'dark'
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200'
              }`}
            >
              <svg className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>Total Sessions</p>
                <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{stats.total}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <span className="text-blue-600 text-xl">ðŸ’¬</span>
              </div>
            </div>
          </div>
          <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>Active Chats</p>
                <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{stats.active}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <span className="text-green-600 text-xl">ðŸŸ¢</span>
              </div>
            </div>
          </div>
          <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>Waiting</p>
                <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{stats.waiting}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <span className="text-yellow-600 text-xl">â³</span>
              </div>
            </div>
          </div>
          <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>Closed</p>
                <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{stats.closed}</p>
              </div>
              <div className="p-3 bg-slate-100 rounded-lg">
                <span className="text-slate-600 text-xl">âœ…</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Chat Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chat Sessions List */}
          <div className={`border rounded-lg ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
            <div className="p-4 border-b border-slate-200 dark:border-slate-700">
              <div className="space-y-3">
                <h2 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  Chat Sessions
                </h2>
                <input
                  type="text"
                  placeholder="Search sessions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    theme === 'dark'
                      ? 'bg-slate-700 border-slate-600 text-white'
                      : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
                <div className="flex space-x-2">
                  {['all', 'active', 'waiting', 'closed'].map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setActiveFilter(filter)}
                      className={`px-3 py-1 text-sm rounded-full transition-colors ${
                        activeFilter === filter
                          ? 'bg-blue-600 text-white'
                          : theme === 'dark'
                          ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                          : 'bg-slate-100 text-slate-600 hover:bg-gray-200'
                      }`}
                    >
                      {filter.charAt(0).toUpperCase() + filter.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="overflow-y-auto" style={{ height: 'calc(100vh - 24rem)', minHeight: '300px' }}>
              {filteredSessions.map((session) => (
                <div
                  key={session.id}
                  className={`p-3 border-b border-slate-200 dark:border-slate-700 cursor-pointer transition-colors ${
                    selectedChat?.id === session.id
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-600'
                      : theme === 'dark'
                      ? 'hover:bg-slate-700'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <div onClick={() => setSelectedChat(session)} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1">
                      <div className="flex-shrink-0 relative">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          theme === 'dark' ? 'bg-slate-600' : 'bg-gray-300'
                        }`}>
                          <span className="text-lg">ðŸ‘¤</span>
                        </div>
                        <span className="absolute -bottom-1 -right-1 text-base">{getStatusIcon(session.status)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                          {session.visitor_name || 'Anonymous'}
                        </p>
                        <p className={`text-xs truncate ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                          {session.visitor_email || 'No email'}
                        </p>
                        {session.last_message && (
                          <p className={`text-xs truncate ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'} mt-1`}>
                            {session.last_message.substring(0, 40)}{session.last_message.length > 40 ? '...' : ''}
                          </p>
                        )}
                        <p className={`text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'} mt-1`}>
                          {formatTime(session.last_activity)}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-1 ml-2">
                      {session.unread_count > 0 && (
                        <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[1.5rem] text-center font-semibold">
                          {session.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                  {session.status === 'waiting' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openAssignModal(session);
                      }}
                      className="mt-2 w-full px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 transition-colors font-medium"
                    >
                      âœ… Assign Chat
                    </button>
                  )}
                </div>
              ))}
              {filteredSessions.length === 0 && (
                <div className="p-6 text-center">
                  <p className={`${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                    No chat sessions found
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Chat Messages */}
          <div className={`lg:col-span-2 border rounded-lg flex flex-col ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
            {selectedChat ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        theme === 'dark' ? 'bg-slate-600' : 'bg-gray-300'
                      }`}>
                        <span className="text-lg">ðŸ‘¤</span>
                      </div>
                      <div>
                        <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                          {selectedChat.visitor_name || 'Anonymous'}
                        </h3>
                        <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                          {selectedChat.visitor_email || 'No email'}
                        </p>
                        {selectedChat.company_name && (
                          <p className={`text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                            ðŸ“¦ {selectedChat.company_name}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedChat.status)}`}>
                        {selectedChat.status.toUpperCase()}
                      </span>
                      {selectedChat.status === 'waiting' && (
                        <button
                          onClick={() => openAssignModal(selectedChat)}
                          className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                        >
                          Assign Chat
                        </button>
                      )}
                      {selectedChat.status === 'active' && (
                        <button
                          onClick={closeChat}
                          className="px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                        >
                          Close Chat
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div
                  ref={messagesContainerRef}
                  onScroll={handleMessagesScroll}
                  className="flex-1 overflow-y-auto p-4 space-y-4"
                  style={{ height: 'calc(100vh - 28rem)', minHeight: '300px' }}
                >
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.sender_type === 'admin' ? 'justify-end' :
                        message.sender_type === 'system' ? 'justify-center' : 'justify-start'
                      }`}
                    >
                      {message.sender_type === 'system' ? (
                        <div className={`px-4 py-2 rounded-lg text-sm text-center max-w-sm ${
                          theme === 'dark'
                            ? 'bg-yellow-900/30 text-yellow-300 border border-yellow-700'
                            : 'bg-yellow-50 text-yellow-800 border border-yellow-200'
                        }`}>
                          {message.message}
                          <div className={`text-xs mt-1 ${theme === 'dark' ? 'text-yellow-500' : 'text-yellow-700'}`}>
                            {formatTime(message.created_at)}
                          </div>
                        </div>
                      ) : (
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            message.sender_type === 'admin'
                              ? 'bg-blue-600 text-white'
                              : theme === 'dark'
                              ? 'bg-slate-700 text-white'
                              : 'bg-slate-100 text-slate-900'
                          }`}
                        >
                          {message.sender_name && (
                            <p className={`text-xs font-semibold mb-1 ${
                              message.sender_type === 'admin' ? 'text-blue-100' : theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
                            }`}>
                              {message.sender_name}
                            </p>
                          )}
                          {renderMessageContent(message)}
                          <p className={`text-xs mt-1 ${
                            message.sender_type === 'admin' ? 'text-blue-100' : theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                          }`}>
                            {formatTime(message.created_at)}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                  {messages.length === 0 && (
                    <div className="text-center py-8">
                      <p className={`${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                        No messages yet
                      </p>
                    </div>
                  )}
                </div>

                {showNewMessageNotice && (
                  <div className="px-4 pb-2">
                    <div className="inline-flex items-center rounded-full bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 text-xs">
                      New message received
                    </div>
                  </div>
                )}

                {/* Message Input */}
                {selectedChat.status === 'active' && (
                  <div className="p-4 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex space-x-3">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Type your message..."
                        disabled={sending}
                        className={`flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          theme === 'dark'
                            ? 'bg-slate-700 border-slate-600 text-white placeholder-gray-400'
                            : 'bg-white border-slate-300 text-slate-900 placeholder-gray-500'
                        }`}
                      />
                      <button
                        onClick={sendMessage}
                        disabled={!newMessage.trim() || sending}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                      >
                        {sending ? (
                          <>
                            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Sending...</span>
                          </>
                        ) : (
                          <>
                            <Send size={16} />
                            <span>Send</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
                {selectedChat.status === 'waiting' && (
                  <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-yellow-50 dark:bg-yellow-900/20">
                    <div className="flex items-center justify-center space-x-2 text-yellow-700 dark:text-yellow-400">
                      <AlertCircle size={20} />
                      <p className="text-sm font-medium">Assign this chat to start messaging</p>
                    </div>
                  </div>
                )}
                {selectedChat.status === 'closed' && (
                  <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/20">
                    <div className="flex items-center justify-center space-x-2 text-slate-600 dark:text-slate-400">
                      <CheckCircle2 size={20} />
                      <p className="text-sm font-medium">This chat has been closed</p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl mb-4">ðŸ’¬</div>
                  <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    Select a chat session
                  </h3>
                  <p className={`${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                    Choose a session from the list to start chatting with customers
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Assign Chat Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`${theme === 'dark' ? 'bg-slate-800' : 'bg-white'} rounded-xl shadow-xl max-w-md w-full animate-fadeIn`}>
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
              <h3 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                Assign Chat
              </h3>
              <button
                onClick={() => setShowAssignModal(false)}
                className={`p-2 rounded-lg ${theme === 'dark' ? 'hover:bg-slate-700' : 'hover:bg-slate-100'} transition-colors`}
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                Assign this chat to yourself or another staff member:
              </p>

              {chatToAssign && (
                <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-slate-700' : 'bg-slate-50'}`}>
                  <p className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    {chatToAssign.visitor_name || 'Anonymous'}
                  </p>
                  <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                    {chatToAssign.visitor_email || 'No email'}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                  Assign to:
                </label>
                
                <div className="space-y-2">
                  <label className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                    selectedStaff === 'self'
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                      : theme === 'dark'
                      ? 'border-slate-600 hover:border-gray-500'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}>
                    <input
                      type="radio"
                      name="assignee"
                      value="self"
                      checked={selectedStaff === 'self'}
                      onChange={(e) => setSelectedStaff(e.target.value)}
                      className="mr-3"
                    />
                    <span className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                      Myself
                    </span>
                  </label>

                  {staff.map((member) => (
                    <label
                      key={member.id}
                      className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                        selectedStaff === member.username
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                          : theme === 'dark'
                          ? 'border-slate-600 hover:border-gray-500'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="assignee"
                        value={member.username}
                        checked={selectedStaff === member.username}
                        onChange={(e) => setSelectedStaff(e.target.value)}
                        className="mr-3"
                      />
                      <div className="flex-1">
                        <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                          {member.full_name}
                        </p>
                        <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                          {member.department} - {member.role}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>

                {staff.length === 0 && selectedStaff === 'self' && (
                  <p className={`text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'} mt-2`}>
                    ðŸ’¡ Add staff members in Settings to assign chats to them
                  </p>
                )}
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className={`flex-1 px-4 py-2 border rounded-lg transition-colors ${
                    theme === 'dark'
                      ? 'border-slate-600 text-slate-300 hover:bg-slate-700'
                      : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAssignSubmit}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Assign Chat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </SuperAdminLayout>
  );
};

export default SuperAdminLiveChat;