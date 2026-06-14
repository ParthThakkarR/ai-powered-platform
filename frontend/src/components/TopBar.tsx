import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Bell, CheckCheck, Command, Loader2, ArrowRight } from 'lucide-react';
import { searchApi, notificationApi } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ThemeToggle } from './ThemeProvider';

interface SearchResult {
  id: number;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  project_id: number;
  due_date: string | null;
  labels: { id: number; name: string; color: string }[];
}

interface Notification {
  id: number;
  user_id: number;
  content: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

const statusColors: Record<string, string> = {
  TODO: 'bg-slate-500/20 text-slate-400 ring-1 ring-slate-500/20',
  IN_PROGRESS: 'bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/20',
  REVIEW: 'bg-cyan-500/15 text-cyan-400 ring-1 ring-cyan-500/20',
  DONE: 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/20',
};

const priorityDots: Record<string, string> = {
  LOW: 'bg-slate-400',
  MEDIUM: 'bg-amber-400',
  HIGH: 'bg-red-400',
  URGENT: 'bg-red-500',
};

export const TopBar = () => {
  const navigate = useNavigate();

  // Search state
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Notification state
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifLoading, setNotifLoading] = useState(false);

  // Keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setNotifOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Focus search input when opened
  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults([]);
      setTotal(0);
    }
  }, [searchOpen]);

  // Fetch unread count
  const fetchUnread = useCallback(async () => {
    try {
      const res = await notificationApi.unreadCount();
      setUnreadCount(res.data.count);
    } catch {}
  }, []);

  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [fetchUnread]);

  // Search
  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); setTotal(0); return; }
    setSearchLoading(true);
    try {
      const res = await searchApi.search({ q: q.trim(), limit: 15 });
      setResults(res.data.results);
      setTotal(res.data.total);
    } catch {
      toast.error('Search failed');
    } finally {
      setSearchLoading(false);
    }
  }, []);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(value), 250);
  };

  const handleSelectResult = (result: SearchResult) => {
    navigate(`/projects/${result.project_id}/board?task=${result.id}`);
    setSearchOpen(false);
  };

  // Notifications
  const toggleNotifications = async () => {
    const next = !notifOpen;
    setNotifOpen(next);
    if (next) {
      setNotifLoading(true);
      try {
        const res = await notificationApi.list({ limit: 20 });
        setNotifications(res.data);
      } catch {}
      setNotifLoading(false);
    }
  };

  const handleMarkNotifRead = async (notif: Notification) => {
    if (!notif.is_read) {
      await notificationApi.markRead(notif.id);
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
    if (notif.link) navigate(notif.link);
    setNotifOpen(false);
  };

  const handleMarkAllRead = async () => {
    await notificationApi.markAllRead();
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <>
      {/* Top Bar */}
      <div className="h-14 border-b border-glass-border bg-surface-1/50 backdrop-blur-xl flex items-center justify-between px-5 flex-shrink-0 z-20">
        {/* Search Trigger */}
        <button
          onClick={() => setSearchOpen(true)}
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-surface-0/80 border border-glass-border text-slate-500 hover:text-slate-300 hover:border-slate-600 transition-all text-sm w-80 group"
        >
          <Search className="w-4 h-4 flex-shrink-0" />
          <span className="flex-1 text-left">Search tasks...</span>
          <kbd className="hidden sm:flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-md bg-surface-2/80 text-slate-500 font-mono group-hover:text-slate-400 transition-colors">
            <Command className="w-2.5 h-2.5" />K
          </kbd>
        </button>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={toggleNotifications}
              className="relative p-2 rounded-xl text-slate-400 hover:text-white hover:bg-glass-white transition-all"
              title="Notifications"
            >
              <Bell className="w-[18px] h-[18px]" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center px-1 shadow-lg shadow-red-500/30">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {notifOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                <div className="absolute right-0 top-full mt-2 w-96 bg-surface-1 rounded-2xl shadow-2xl shadow-black/40 border border-glass-border overflow-hidden z-50 animate-scale-in">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-glass-border">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-white">Notifications</h3>
                      {unreadCount > 0 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-brand-primary/20 text-brand-primary font-medium">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-xs text-slate-400 hover:text-brand-primary transition-colors flex items-center gap-1"
                      >
                        <CheckCheck className="w-3 h-3" /> Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifLoading ? (
                      <div className="p-10 text-center">
                        <div className="w-6 h-6 border-2 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto" />
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="p-10 text-center">
                        <Bell className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                        <p className="text-slate-500 text-sm">No notifications yet</p>
                        <p className="text-slate-600 text-xs mt-1">Activity will appear here</p>
                      </div>
                    ) : (
                      notifications.map(notif => (
                        <button
                          key={notif.id}
                          onClick={() => handleMarkNotifRead(notif)}
                          className={`flex items-start gap-3 w-full px-4 py-3 hover:bg-glass-white transition-all text-left border-b border-glass-border/50 last:border-0 ${!notif.is_read ? 'bg-brand-primary/[0.03]' : ''}`}
                        >
                          <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${!notif.is_read ? 'bg-brand-primary shadow-sm shadow-brand-primary/50' : 'bg-transparent'}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-slate-300 leading-snug">{notif.content}</p>
                            <p className="text-[11px] text-slate-600 mt-1">{formatTime(notif.created_at)}</p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Search Modal */}
      {searchOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh] bg-black/70 backdrop-blur-md" onClick={() => setSearchOpen(false)}>
          <div className="w-full max-w-2xl bg-surface-1 rounded-2xl shadow-2xl shadow-black/50 border border-glass-border overflow-hidden animate-scale-in" onClick={e => e.stopPropagation()}>
            {/* Search Input */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-glass-border">
              <Search className="w-5 h-5 text-slate-400 flex-shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => handleQueryChange(e.target.value)}
                placeholder="Search tasks, projects, labels..."
                className="flex-1 bg-transparent text-white placeholder-slate-500 outline-none text-[15px]"
              />
              {searchLoading && <Loader2 className="w-4 h-4 text-brand-primary animate-spin" />}
              <button
                onClick={() => setSearchOpen(false)}
                className="text-xs px-2 py-1 rounded-md bg-surface-2 text-slate-400 hover:text-white transition-colors"
              >
                ESC
              </button>
            </div>

            {/* Results */}
            <div className="max-h-[60vh] overflow-y-auto">
              {!query.trim() ? (
                <div className="p-10 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-surface-2 flex items-center justify-center mx-auto mb-3">
                    <Search className="w-5 h-5 text-slate-500" />
                  </div>
                  <p className="text-slate-400 text-sm font-medium">Start typing to search</p>
                  <p className="text-slate-600 text-xs mt-1.5">Search across all your tasks and projects</p>
                  <div className="flex items-center justify-center gap-4 mt-4 text-[11px] text-slate-600">
                    <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded bg-surface-2 text-slate-500 font-mono">Tab</kbd> Navigate</span>
                    <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded bg-surface-2 text-slate-500 font-mono">↵</kbd> Open</span>
                    <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded bg-surface-2 text-slate-500 font-mono">Esc</kbd> Close</span>
                  </div>
                </div>
              ) : results.length === 0 && !searchLoading ? (
                <div className="p-10 text-center">
                  <p className="text-slate-400 text-sm">No results for "{query}"</p>
                  <p className="text-slate-600 text-xs mt-1">Try different keywords</p>
                </div>
              ) : (
                <>
                  <div className="px-5 py-2.5 text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                    {total} result{total !== 1 ? 's' : ''} found
                  </div>
                  {results.map((result) => (
                    <button
                      key={result.id}
                      onClick={() => handleSelectResult(result)}
                      className="flex items-center gap-4 w-full px-5 py-3 hover:bg-glass-white transition-all text-left group border-b border-glass-border/30 last:border-0"
                    >
                      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${priorityDots[result.priority] || 'bg-slate-400'}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2.5">
                          <span className="text-sm font-medium text-white group-hover:text-brand-primary transition-colors truncate">{result.title}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusColors[result.status] || ''}`}>
                            {result.status.replace('_', ' ')}
                          </span>
                        </div>
                        {result.description && (
                          <p className="text-xs text-slate-500 truncate mt-1">{result.description}</p>
                        )}
                        {result.labels.length > 0 && (
                          <div className="flex gap-1.5 mt-1.5">
                            {result.labels.map(l => (
                              <span key={l.id} className="text-[10px] px-2 py-0.5 rounded-full text-white/90 font-medium" style={{ backgroundColor: l.color }}>
                                {l.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-brand-primary transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100" />
                    </button>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
