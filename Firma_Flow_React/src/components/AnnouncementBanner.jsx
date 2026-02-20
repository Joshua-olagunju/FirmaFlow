import React, { useState, useEffect, useRef } from 'react';
import { X, Info, AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';

const ICON_MAP = {
  info:    { Icon: Info,          bg: 'bg-blue-600',   text: 'text-white' },
  warning: { Icon: AlertTriangle, bg: 'bg-amber-500',  text: 'text-white' },
  success: { Icon: CheckCircle,   bg: 'bg-emerald-600',text: 'text-white' },
  error:   { Icon: AlertCircle,   bg: 'bg-rose-600',   text: 'text-white' },
};

const POLL_INTERVAL = 60_000; // poll every 60 seconds

export default function AnnouncementBanner() {
  const [queue, setQueue]     = useState([]);  // announcements to show
  const [shown, setShown]     = useState([]); // dismissed ids (stored in session)

  const dismissedRef = useRef(
    JSON.parse(sessionStorage.getItem('dismissed_announcements') || '[]')
  );

  const dismiss = (id) => {
    dismissedRef.current = [...dismissedRef.current, id];
    sessionStorage.setItem('dismissed_announcements', JSON.stringify(dismissedRef.current));
    setQueue(q => q.filter(a => a.id !== id));
  };

  const fetchAnnouncements = async () => {
    try {
      const r = await fetch('http://localhost/FirmaFlow/api/announcements_public.php', {
        credentials: 'include',
      });
      if (!r.ok) return;
      const d = await r.json();
      if (!d.success || !d.data?.length) return;

      // Only show announcements not already dismissed this session
      const newItems = d.data.filter(
        a => !dismissedRef.current.includes(a.id)
      );
      setQueue(newItems);
    } catch (e) {
      // silently ignore — non-critical feature
    }
  };

  useEffect(() => {
    fetchAnnouncements();
    const iv = setInterval(fetchAnnouncements, POLL_INTERVAL);
    return () => clearInterval(iv);
  }, []);

  if (!queue.length) return null;

  // Show the newest (first) announcement
  const ann = queue[0];
  const { Icon, bg, text } = ICON_MAP[ann.type] || ICON_MAP.info;

  return (
    <div
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-[9999] w-[calc(100%-2rem)] max-w-xl shadow-2xl rounded-2xl flex items-start gap-3 p-4 ${bg} ${text} animate-in slide-in-from-top-4 duration-300`}
      role="alert"
    >
      <Icon className="w-5 h-5 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-relaxed">{ann.message}</p>
        {queue.length > 1 && (
          <p className="text-xs opacity-70 mt-0.5">{queue.length - 1} more announcement{queue.length > 2 ? 's' : ''}</p>
        )}
      </div>
      <button
        onClick={() => dismiss(ann.id)}
        className="shrink-0 p-1 rounded-lg opacity-80 hover:opacity-100 transition-opacity"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
