import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useStaff } from '../../contexts/StaffContext';
import { buildApiUrl } from '../../config/api.config';
import StaffLayout from '../../components/StaffLayout';
import {
  Send,
  Clock,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Search,
  RefreshCw,
} from 'lucide-react';

const StaffChat = () => {
  const { theme } = useTheme();
  const { staff } = useStaff();

  /* ── Data ────────────────────────────────────────────────────────────── */
  const [chatSessions, setChatSessions] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  /* ── UI ──────────────────────────────────────────────────────────────── */
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState(null);
  const [showTakeModal, setShowTakeModal] = useState(false);
  const [chatToTake, setChatToTake] = useState(null);
  const [showNewMessageNotice, setShowNewMessageNotice] = useState(false);
  /** Mobile navigation — 'list' | 'chat' */
  const [mobileView, setMobileView] = useState('list');

  const messagesRef = useRef(null);
  const isAtBottomRef = useRef(true);

  /* ── Toast ───────────────────────────────────────────────────────────── */
  const showToast = (msg, type = 'success') => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  /* ── Polling ─────────────────────────────────────────────────────────── */
  useEffect(() => {
    fetchSessions();
    const iv = setInterval(fetchSessions, 5000);
    return () => clearInterval(iv);
  }, [staff]);

  useEffect(() => {
    if (!selectedChat) return;
    fetchMessages(selectedChat.session_id);
    const iv = setInterval(() => fetchMessages(selectedChat.session_id), 2000);
    return () => clearInterval(iv);
  }, [selectedChat]);

  /* ── Scroll tracking ─────────────────────────────────────────────────── */
  const onScroll = () => {
    const c = messagesRef.current;
    if (!c) return;
    isAtBottomRef.current = c.scrollHeight - c.scrollTop - c.clientHeight < 80;
    if (isAtBottomRef.current) setShowNewMessageNotice(false);
  };

  /* ── Message renderer ────────────────────────────────────────────────── */
  const renderContent = (msg) => {
    if (msg.message_type === 'image' && msg.file_path) {
      const url = buildApiUrl(msg.file_path);
      return (
        <div className="space-y-1">
          <img
            src={url}
            alt={msg.file_name || 'image'}
            className="max-w-xs rounded-xl shadow cursor-pointer"
            style={{ maxHeight: 200 }}
            onClick={() => window.open(url, '_blank')}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          {msg.message && msg.message !== 'Image shared' && (
            <p className="text-sm">{msg.message}</p>
          )}
        </div>
      );
    }
    return <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.message}</p>;
  };

  /* ── API helpers ─────────────────────────────────────────────────────── */
  const apiFetch = (path, init = {}) =>
    fetch(buildApiUrl(path), {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      ...init,
    }).then((r) => r.json());

  const fetchSessions = async () => {
    try {
      const d = await apiFetch('superadmin/api/chat_sessions.php');
      if (d.success) {
        setChatSessions(
          (d.sessions || []).filter((s) => {
            const isMe =
              s.assigned_admin === staff?.username ||
              s.assigned_admin === staff?.full_name;
            const isQueue =
              !s.assigned_admin ||
              s.assigned_admin === null ||
              s.assigned_admin === '';
            return isMe || isQueue;
          })
        );
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (sid) => {
    try {
      const d = await apiFetch(`superadmin/api/chat_messages.php?session_id=${sid}`);
      if (d.success) {
        setMessages((prev) => {
          const next = d.messages || [];
          const prevLast = prev.length ? prev[prev.length - 1].id : 0;
          const nextLast = next.length ? next[next.length - 1].id : 0;
          if (prev.length && nextLast > prevLast && !isAtBottomRef.current)
            setShowNewMessageNotice(true);
          return next;
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat) return;
    setSending(true);
    try {
      const d = await apiFetch('superadmin/api/send-chat-message.php', {
        method: 'POST',
        body: JSON.stringify({
          session_id: selectedChat.session_id,
          message: newMessage,
          sender_type: 'admin',
        }),
      });
      if (d.success) {
        setNewMessage('');
        await fetchMessages(selectedChat.session_id);
      } else showToast(d.message || 'Failed to send', 'error');
    } catch {
      showToast('Failed to send message', 'error');
    } finally {
      setSending(false);
    }
  };

  const takeChat = async (sid) => {
    try {
      const d = await apiFetch('superadmin/api/assign-chat.php', {
        method: 'POST',
        body: JSON.stringify({ session_id: sid, assign_to: null }),
      });
      if (d.success) {
        showToast('Chat taken!', 'success');
        fetchSessions();
        setShowTakeModal(false);
        const session = chatSessions.find((s) => s.session_id === sid);
        if (session) {
          setSelectedChat({ ...session, assigned_admin: staff?.username });
          setMobileView('chat');
        }
      } else showToast(d.message || 'Failed to take chat', 'error');
    } catch {
      showToast('Failed to take chat', 'error');
    }
  };

  const closeChat = async (sid) => {
    try {
      const d = await apiFetch('superadmin/api/close-chat.php', {
        method: 'POST',
        body: JSON.stringify({ session_id: sid }),
      });
      if (d.success) {
        showToast('Chat closed', 'success');
        setSelectedChat(null);
        setMobileView('list');
        fetchSessions();
      }
    } catch {
      showToast('Failed to close chat', 'error');
    }
  };

  const selectChat = (s) => {
    setSelectedChat(s);
    setMobileView('chat');
    setShowNewMessageNotice(false);
  };

  /* ── Derived ─────────────────────────────────────────────────────────── */
  const isMeCheck = (s) =>
    s.assigned_admin === staff?.username || s.assigned_admin === staff?.full_name;
  const isQueueCheck = (s) =>
    !s.assigned_admin || s.assigned_admin === null || s.assigned_admin === '';

  const filtered = chatSessions.filter((s) => {
    const q = searchTerm.toLowerCase();
    const matchSearch =
      s.visitor_name?.toLowerCase().includes(q) ||
      s.visitor_email?.toLowerCase().includes(q);
    if (!matchSearch) return false;
    if (activeFilter === 'assigned') return isMeCheck(s);
    if (activeFilter === 'queue') return isQueueCheck(s);
    if (activeFilter === 'active') return s.status === 'active';
    return true;
  });

  const assignedCount = chatSessions.filter(isMeCheck).length;
  const queueCount = chatSessions.filter(isQueueCheck).length;
  const activeCount = chatSessions.filter((s) => s.status === 'active').length;
  const unreadCount = chatSessions.filter((s) => s.is_read === 0).length;

  /* ── Theme shortcuts ─────────────────────────────────────────────────── */
  const dk = theme === 'dark';
  const card = dk ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200';
  const sub = dk ? 'text-slate-400' : 'text-slate-500';
  const inp = dk
    ? 'bg-slate-950 border-slate-700 text-white placeholder-slate-500'
    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400';
  const hov = dk ? 'hover:bg-slate-800' : 'hover:bg-slate-100';

  /* ── Render ──────────────────────────────────────────────────────────── */
  return (
    <StaffLayout>
      <div className="flex flex-col gap-5">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Live Chat</h1>
          <p className={`text-sm mt-0.5 ${sub}`}>
            Manage queue chats and active conversations in real time.
          </p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'My Chats', value: assignedCount, icon: <MessageSquare className="w-7 h-7 text-indigo-500" /> },
            { label: 'In Queue', value: queueCount, icon: <Clock className="w-7 h-7 text-amber-500" /> },
            { label: 'Active', value: activeCount, icon: <CheckCircle2 className="w-7 h-7 text-emerald-500" /> },
            { label: 'Unread', value: unreadCount, icon: <AlertCircle className="w-7 h-7 text-rose-500" /> },
          ].map(({ label, value, icon }) => (
            <div key={label} className={`p-4 rounded-2xl border flex items-center justify-between ${card}`}>
              <div>
                <p className={`text-xs font-medium mb-0.5 ${sub}`}>{label}</p>
                <p className="text-2xl font-bold">{value}</p>
              </div>
              {icon}
            </div>
          ))}
        </div>

        {/* Chat interface — fixed height so it scrolls correctly */}
        <div
          className={`rounded-2xl border overflow-hidden flex ${card}`}
          style={{ height: 'calc(100vh - 22rem)', minHeight: 440 }}
        >
          {/* ── Sessions panel ─────────────────────────────────────────── */}
          {/* Mobile: toggle; Desktop: always visible */}
          <div
            className={`${
              mobileView === 'list' ? 'flex' : 'hidden'
            } lg:flex flex-col flex-shrink-0 w-full lg:w-72 xl:w-80 border-r ${
              dk ? 'border-slate-800' : 'border-slate-200'
            }`}
          >
            {/* Search bar */}
            <div className={`p-3 border-b ${dk ? 'border-slate-800' : 'border-slate-200'} flex gap-2`}>
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full pl-8 pr-3 py-2 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${inp}`}
                />
              </div>
              <button
                onClick={fetchSessions}
                title="Refresh"
                className={`p-2 rounded-xl border transition ${dk ? 'border-slate-700 hover:bg-slate-800' : 'border-slate-200 hover:bg-slate-100'}`}
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Filter tabs */}
            <div className={`px-3 py-2 border-b flex gap-1 flex-wrap ${dk ? 'border-slate-800' : 'border-slate-200'}`}>
              {['all', 'assigned', 'queue', 'active'].map((f) => (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  className={`px-2.5 py-1 text-xs rounded-lg font-medium transition ${
                    activeFilter === f
                      ? 'bg-indigo-500 text-white'
                      : dk
                      ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>

            {/* Session items */}
            <div className={`flex-1 overflow-y-auto ${dk ? 'divide-slate-800' : 'divide-slate-100'} divide-y`}>
              {loading ? (
                <p className={`p-6 text-sm text-center ${sub}`}>Loading…</p>
              ) : filtered.length === 0 ? (
                <p className={`p-6 text-sm text-center ${sub}`}>
                  {activeFilter === 'assigned' ? 'No chats assigned to you' : 'No chats available'}
                </p>
              ) : (
                filtered.map((s) => {
                  const isMe = isMeCheck(s);
                  const isQ = isQueueCheck(s);
                  const isSel = selectedChat?.session_id === s.session_id;
                  return (
                    <div
                      key={s.id}
                      onClick={() => isMe && selectChat(s)}
                      className={`p-3.5 transition-colors ${isMe ? 'cursor-pointer' : ''} ${
                        isSel
                          ? dk
                            ? 'bg-indigo-500/10 border-l-2 border-l-indigo-500'
                            : 'bg-indigo-50 border-l-2 border-l-indigo-500'
                          : dk
                          ? 'hover:bg-slate-800/50'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="relative shrink-0">
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm text-white ${
                              isMe
                                ? 'bg-gradient-to-br from-indigo-500 to-violet-500'
                                : 'bg-gradient-to-br from-slate-500 to-slate-600'
                            }`}
                          >
                            {(s.visitor_name || 'A')[0].toUpperCase()}
                          </div>
                          {s.unread_count > 0 && (
                            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-indigo-500 rounded-full border-2 border-white dark:border-slate-900" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{s.visitor_name || 'Anonymous'}</p>
                          <p className={`text-xs truncate ${sub}`}>{s.visitor_email || 'No email'}</p>
                        </div>
                        {isMe && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                      </div>
                      {isQ && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setChatToTake(s);
                            setShowTakeModal(true);
                          }}
                          className="mt-2 w-full py-1.5 text-xs rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-medium transition"
                        >
                          Take Chat
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* ── Messages panel ─────────────────────────────────────────── */}
          <div className={`${mobileView === 'chat' ? 'flex' : 'hidden'} lg:flex flex-col flex-1 min-w-0`}>
            {selectedChat ? (
              <>
                {/* Chat header */}
                <div className={`px-4 py-3 border-b flex items-center gap-3 shrink-0 ${dk ? 'border-slate-800' : 'border-slate-200'}`}>
                  <button
                    className={`lg:hidden p-1.5 rounded-xl transition ${hov}`}
                    onClick={() => { setMobileView('list'); setSelectedChat(null); }}
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center font-bold text-sm text-white shrink-0">
                    {(selectedChat.visitor_name || 'A')[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{selectedChat.visitor_name || 'Anonymous'}</p>
                    <p className={`text-xs truncate ${sub}`}>{selectedChat.visitor_email || 'No email'}</p>
                  </div>
                  <button
                    onClick={() => closeChat(selectedChat.session_id)}
                    className="shrink-0 px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white text-xs rounded-xl font-medium transition"
                  >
                    Close
                  </button>
                </div>

                {/* Messages area */}
                <div
                  ref={messagesRef}
                  onScroll={onScroll}
                  className="flex-1 overflow-y-auto p-4 space-y-3"
                  style={{ minHeight: 0 }}
                >
                  {messages.length === 0 && (
                    <p className={`text-center text-sm pt-8 ${sub}`}>No messages yet.</p>
                  )}
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${
                        msg.sender_type === 'admin'
                          ? 'justify-end'
                          : msg.sender_type === 'system'
                          ? 'justify-center'
                          : 'justify-start'
                      }`}
                    >
                      {msg.sender_type === 'system' ? (
                        <div
                          className={`px-4 py-1 rounded-full text-xs ${
                            dk
                              ? 'bg-amber-900/30 text-amber-300 border border-amber-700/40'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {msg.message}
                        </div>
                      ) : (
                        <div
                          className={`max-w-[70%] md:max-w-sm px-3.5 py-2.5 rounded-2xl ${
                            msg.sender_type === 'admin'
                              ? 'bg-indigo-500 text-white rounded-br-md'
                              : dk
                              ? 'bg-slate-800 text-slate-100 rounded-bl-md'
                              : 'bg-slate-100 text-slate-800 rounded-bl-md'
                          }`}
                        >
                          {msg.sender_type !== 'admin' && msg.sender_name && (
                            <p className={`text-xs font-semibold mb-1 ${dk ? 'text-slate-400' : 'text-slate-500'}`}>
                              {msg.sender_name}
                            </p>
                          )}
                          {renderContent(msg)}
                          <p className={`text-xs mt-1 ${
                            msg.sender_type === 'admin' ? 'text-indigo-200' : dk ? 'text-slate-500' : 'text-slate-400'
                          }`}>
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* New message notice */}
                {showNewMessageNotice && (
                  <div className="px-4 pb-1">
                    <button
                      onClick={() => {
                        const c = messagesRef.current;
                        if (c) c.scrollTop = c.scrollHeight;
                        setShowNewMessageNotice(false);
                      }}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
                        dk
                          ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300'
                          : 'bg-indigo-50 border-indigo-200 text-indigo-700'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                      New message · scroll down
                    </button>
                  </div>
                )}

                {/* Input */}
                <div className={`p-3 border-t shrink-0 ${dk ? 'border-slate-800' : 'border-slate-200'}`}>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                      placeholder="Type a message…"
                      className={`flex-1 px-4 py-2.5 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${inp}`}
                    />
                    <button
                      onClick={sendMessage}
                      disabled={sending || !newMessage.trim()}
                      className="px-4 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center gap-3">
                <MessageSquare className={`w-12 h-12 ${dk ? 'text-slate-700' : 'text-slate-300'}`} />
                <p className={`text-sm ${sub}`}>Select a conversation</p>
                <button
                  className={`lg:hidden px-4 py-2 text-sm rounded-xl border ${dk ? 'border-slate-700 hover:bg-slate-800' : 'border-slate-200 hover:bg-slate-50'}`}
                  onClick={() => setMobileView('list')}
                >
                  ← View Sessions
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-5 right-5 px-5 py-3 rounded-xl shadow-2xl text-white text-sm font-medium z-50 ${
          toast.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'
        }`}>
          {toast.message}
        </div>
      )}

      {/* Take chat modal */}
      {showTakeModal && chatToTake && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`rounded-2xl p-6 max-w-md w-full shadow-2xl border ${dk ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
            <h3 className={`text-lg font-bold mb-2 ${dk ? 'text-white' : 'text-slate-900'}`}>Take Chat</h3>
            <p className={`text-sm mb-6 ${dk ? 'text-slate-400' : 'text-slate-600'}`}>
              Take this conversation from{' '}
              <span className={`font-semibold ${dk ? 'text-white' : 'text-slate-900'}`}>
                {chatToTake.visitor_name || 'Anonymous'}
              </span>
              ? It will be assigned to you.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowTakeModal(false)}
                className={`px-4 py-2 rounded-xl text-sm font-medium ${dk ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
              >
                Cancel
              </button>
              <button
                onClick={() => takeChat(chatToTake.session_id)}
                className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-sm font-medium transition"
              >
                Take Chat
              </button>
            </div>
          </div>
        </div>
      )}
    </StaffLayout>
  );
};

export default StaffChat;
