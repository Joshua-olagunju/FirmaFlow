import { useState, useEffect, useRef } from "react";
import { MessageSquare, Send, Clock, User, Bot, X, Paperclip, Image, FileImage } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import { useUser } from "../../contexts/UserContext";
import { buildApiUrl } from "../../config/api.config";

const LiveChatComponent = ({ onClose }) => {
  const { theme } = useTheme();
  const { user } = useUser();
  const [sessionId, setSessionId] = useState(null);
  const [status, setStatus] = useState('idle'); // 'idle', 'starting', 'waiting', 'active', 'ended'
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [queuePosition, setQueuePosition] = useState(null);
  const [estimatedWait, setEstimatedWait] = useState(null);
  const [assignedAdmin, setAssignedAdmin] = useState(null);
  const [error, setError] = useState("");
  const [lastMessageId, setLastMessageId] = useState(0);
  const messagesEndRef = useRef(null);
  const pollingRef = useRef(null);
  const fileInputRef = useRef(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Start chat session
  const startChat = async () => {
    try {
      setLoading(true);
      setError("");
      setStatus('starting');

      const response = await fetch(buildApiUrl("api/start_support_chat.php"), {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        }
      });

      const data = await response.json();

      if (data.success) {
        setSessionId(data.session_id);
        setQueuePosition(data.queue_position);
        setEstimatedWait(data.estimated_wait);
        setStatus(data.is_existing ? 'active' : 'waiting');
        
        // Start polling for updates
        startPolling(data.session_id);
        
        // Load initial messages
        loadMessages(data.session_id, 0);
      } else {
        throw new Error(data.message || "Failed to start chat");
      }
    } catch (err) {
      setError(err.message);
      setStatus('idle');
    } finally {
      setLoading(false);
    }
  };

  // Start polling for status and messages
  const startPolling = (sessionId) => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }

    pollingRef.current = setInterval(() => {
      checkStatus(sessionId);
      if (status === 'active' || status === 'waiting') {
        loadMessages(sessionId, lastMessageId);
      }
    }, 3000); // Poll every 3 seconds
  };

  // Stop polling
  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  // Check chat status
  const checkStatus = async (sessionId) => {
    try {
      const response = await fetch(buildApiUrl(`api/support_chat_status.php?session_id=${sessionId}`), {
        method: "GET",
        credentials: "include"
      });

      const data = await response.json();

      if (data.success) {
        setStatus(data.status);
        setQueuePosition(data.queue_position);
        setEstimatedWait(data.estimated_wait_time);
        setAssignedAdmin(data.assigned_admin);

        // If chat ended, stop polling
        if (data.status === 'closed') {
          stopPolling();
        }
      }
    } catch (err) {
      console.error("Failed to check chat status:", err);
    }
  };

  // Load messages
  const loadMessages = async (sessionId, sinceId = 0) => {
    try {
      const url = buildApiUrl(`api/support_chat_messages.php?session_id=${sessionId}&since_id=${sinceId}`);
      const response = await fetch(url, {
        method: "GET",
        credentials: "include"
      });

      const data = await response.json();

      if (data.success) {
        if (sinceId === 0) {
          setMessages(data.messages);
        } else {
          setMessages(prev => [...prev, ...data.messages]);
        }

        // Update last message ID for polling
        if (data.messages.length > 0) {
          setLastMessageId(data.messages[data.messages.length - 1].id);
        }

        // Update status if changed
        if (data.session_status !== status) {
          setStatus(data.session_status);
        }
        if (data.assigned_admin && !assignedAdmin) {
          setAssignedAdmin(data.assigned_admin);
        }
      }
    } catch (err) {
      console.error("Failed to load messages:", err);
    }
  };

  // Send message
  const sendMessage = async () => {
    if (!newMessage.trim() || !sessionId) return;

    try {
      setLoading(true);
      const response = await fetch(buildApiUrl("api/support_chat_messages.php"), {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          session_id: sessionId,
          message: newMessage
        })
      });

      const data = await response.json();

      if (data.success) {
        setNewMessage("");
        // Add message optimistically
        setMessages(prev => [...prev, data.data]);
        setLastMessageId(data.data.id);
      } else {
        throw new Error(data.message || "Failed to send message");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle image upload
  const handleImageUpload = async (file) => {
    if (!sessionId || !file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be under 5MB');
      return;
    }

    try {
      setUploading(true);
      setError("");

      const formData = new FormData();
      formData.append('image', file);
      formData.append('session_id', sessionId);

      const response = await fetch(buildApiUrl("api/support_chat_upload.php"), {
        method: "POST",
        credentials: "include",
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        // Refresh messages to get the uploaded image
        setTimeout(() => {
          loadMessages(sessionId, 0);
        }, 500);
      } else {
        throw new Error(data.message || "Failed to upload image");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  // Handle file input change
  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleImageUpload(file);
    }
    // Reset input
    e.target.value = '';
  };

  // Handle message input
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, []);

  // Format timestamp
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Render message content
  const renderMessageContent = (message) => {
    if (message.message_type === 'image' && message.file_path) {
      const imageUrl = buildApiUrl(message.file_path);
      return (
        <div className="space-y-2">
          <img 
            src={imageUrl} 
            alt={message.file_name || "Shared image"}
            className="max-w-xs rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => window.open(imageUrl, '_blank')}
            style={{ maxHeight: '200px' }}
          />
          {message.message !== 'Image shared' && (
            <p className="text-sm">{message.message}</p>
          )}
        </div>
      );
    }
    return <span className="whitespace-pre-wrap">{message.message}</span>;
  };
  // Render message
  const renderMessage = (message) => {
    const isUser = message.sender_type === 'visitor';
    const isSystem = message.sender_type === 'system';
    
    return (
      <div key={message.id} className={`mb-4 ${isUser ? 'text-right' : 'text-left'}`}>
        {isSystem ? (
          <div className="text-center">
            <div className={`inline-block px-4 py-2 rounded-lg ${theme.bgAccent} ${theme.textSecondary} text-sm`}>
              <Bot size={16} className="inline mr-2" />
              {message.message}
            </div>
            <div className={`text-xs ${theme.textTertiary} mt-1`}>
              {formatTime(message.created_at)}
            </div>
          </div>
        ) : (
          <div className={`max-w-[70%] ${isUser ? 'ml-auto' : 'mr-auto'}`}>
            <div className={`px-4 py-2 rounded-lg ${
              isUser 
                ? 'bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white'
                : `${theme.bgCard} border ${theme.borderSecondary} ${theme.textPrimary}`
            }`}>
              {!isUser && (
                <div className="text-xs opacity-75 mb-1">
                  <User size={12} className="inline mr-1" />
                  {message.sender_name}
                </div>
              )}
              <div>{renderMessageContent(message)}</div>
            </div>
            <div className={`text-xs ${theme.textTertiary} mt-1 ${isUser ? 'text-right' : 'text-left'}`}>
              {formatTime(message.created_at)}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-96">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <MessageSquare size={20} className="text-[#667eea]" />
          <span className={`font-medium ${theme.textPrimary}`}>
            {status === 'waiting' ? 'Support Chat - In Queue' :
             status === 'active' ? `Support Chat - ${assignedAdmin || 'Support Agent'}` :
             'Support Chat'}
          </span>
        </div>
        <button
          onClick={onClose}
          className={`p-1 rounded ${theme.textSecondary} hover:${theme.textPrimary}`}
        >
          <X size={18} />
        </button>
      </div>

      {/* Status/Queue Info */}
      {status === 'waiting' && (
        <div className={`p-4 ${theme.bgAccent} border-b ${theme.borderSecondary}`}>
          <div className="flex items-center gap-2 text-sm">
            <Clock size={16} className="text-orange-500" />
            <span className={theme.textPrimary}>
              Position in queue: {queuePosition}
              {estimatedWait && ` • Estimated wait: ${estimatedWait} minutes`}
            </span>
          </div>
        </div>
      )}

      {status === 'active' && assignedAdmin && (
        <div className={`p-4 ${theme.bgAccent} border-b ${theme.borderSecondary}`}>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className={theme.textPrimary}>
              Connected with {assignedAdmin}
            </span>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 border-b-0">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {status === 'idle' ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6">
            <div className="text-center">
              <MessageSquare size={48} className="text-[#667eea] mx-auto mb-4" />
              <h3 className={`text-lg font-medium ${theme.textPrimary} mb-2`}>
                Start Live Chat
              </h3>
              <p className={`${theme.textSecondary} mb-6`}>
                Connect with our support team for real-time assistance
              </p>
              <button
                onClick={startChat}
                disabled={loading}
                className="px-6 py-3 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white rounded-lg hover:shadow-lg transition font-medium disabled:opacity-50"
              >
                {loading ? "Starting..." : "Start Chat"}
              </button>
            </div>
          </div>
        ) : status === 'ended' || status === 'closed' ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6">
            <div className="text-center">
              <MessageSquare size={48} className={`${theme.textSecondary} mx-auto mb-4`} />
              <h3 className={`text-lg font-medium ${theme.textPrimary} mb-2`}>
                Chat Ended
              </h3>
              <p className={`${theme.textSecondary} mb-6`}>
                This chat session has been closed. Thank you for contacting support.
              </p>
              <button
                onClick={() => {
                  setStatus('idle');
                  setSessionId(null);
                  setMessages([]);
                  setError("");
                }}
                className={`px-6 py-2 ${theme.bgCard} border ${theme.borderSecondary} ${theme.textPrimary} rounded-lg ${theme.bgHover} transition font-medium`}
              >
                Start New Chat
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {messages.map(renderMessage)}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            {(status === 'waiting' || status === 'active') && (
              <div className={`p-4 border-t ${theme.borderSecondary}`}>
                <div className="flex gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileInputChange}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading || loading}
                    className={`p-3 border ${theme.borderSecondary} rounded-lg ${theme.bgCard} ${theme.textSecondary} hover:${theme.textPrimary} hover:${theme.borderPrimary} transition disabled:opacity-50`}
                    title="Upload image"
                  >
                    {uploading ? (
                      <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Image size={18} />
                    )}
                  </button>
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={
                      status === 'waiting' 
                        ? "You can send a message while waiting..."
                        : "Type your message..."
                    }
                    className={`flex-1 p-3 border ${theme.borderSecondary} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#667eea] ${theme.bgCard} ${theme.textPrimary}`}
                    disabled={loading}
                    maxLength={500}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={loading || !newMessage.trim()}
                    className="px-4 py-3 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white rounded-lg hover:shadow-lg transition disabled:opacity-50"
                  >
                    <Send size={18} />
                  </button>
                </div>
                <div className={`text-xs ${theme.textTertiary} mt-1 flex justify-between`}>
                  <span>Supports: JPEG, PNG, GIF, WebP (max 5MB)</span>
                  <span>{newMessage.length}/500</span>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default LiveChatComponent;