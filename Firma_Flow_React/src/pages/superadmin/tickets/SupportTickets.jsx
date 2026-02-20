import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTheme } from '../../../contexts/ThemeContext';
import { buildApiUrl } from '../../../config/api.config';
import SuperAdminLayout from '../../../components/SuperAdminLayout';
import {
  Ticket, Search, RefreshCw, ChevronLeft, ChevronRight,
  Eye, CheckCircle, XCircle, Clock, AlertTriangle, ArrowUpRight,
  User, Mail, Calendar, MessageSquare, Tag, MoreVertical,
} from 'lucide-react';

const STATUS_COLORS = {
  open:        'bg-amber-100 text-amber-700',
  in_progress: 'bg-blue-100 text-blue-700',
  resolved:    'bg-emerald-100 text-emerald-700',
  closed:      'bg-slate-100 text-slate-600',
};
const PRIORITY_COLORS = {
  low:      'bg-emerald-100 text-emerald-700',
  medium:   'bg-amber-100 text-amber-700',
  high:     'bg-orange-100 text-orange-700',
  critical: 'bg-rose-100 text-rose-700',
};

export default function SupportTickets() {
  const { theme } = useTheme();
  const dk = theme === 'dark';
  const [tickets, setTickets]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [statusFilter, setStatus]     = useState('all');
  const [priorityFilter, setPriority] = useState('all');
  const [page, setPage]               = useState(1);
  const [totalPages, setTotalPages]   = useState(1);
  const [modal, setModal]             = useState(null); // null | ticket object
  const [updating, setUpdating]       = useState(false);

  /* 3-dot dropdown */
  const [openMenu, setOpenMenu] = useState(null);
  const menuRef = useRef(null);
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpenMenu(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const card    = dk ? 'bg-slate-800 border-slate-700'  : 'bg-white border-slate-200';
  const textM   = dk ? 'text-white'                     : 'text-slate-900';
  const sub     = dk ? 'text-slate-400'                 : 'text-slate-500';
  const inp     = dk ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-slate-300 text-slate-600 placeholder-slate-400';
  const rowHov  = dk ? 'hover:bg-slate-700/40'          : 'hover:bg-slate-50';
  const focus   = 'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent';

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page, status: statusFilter, priority: priorityFilter, search, limit: 15 });
      const r = await fetch(buildApiUrl(`superadmin/api/tickets.php?${params}`), { credentials: 'include' });
      if (r.ok) {
        const d = await r.json();
        if (d.success) { setTickets(d.tickets || []); setTotalPages(d.pagination?.pages || 1); }
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [page, statusFilter, priorityFilter, search]);

  useEffect(() => { load(); }, [load]);

  const openDetail = async (id) => {
    try {
      const r = await fetch(buildApiUrl(`superadmin/api/tickets.php?action=details&ticket_id=${id}`), { credentials: 'include' });
      if (r.ok) { const d = await r.json(); if (d.success) setModal(d.ticket); }
    } catch (e) { console.error(e); }
  };

  const updateStatus = async (ticketId, status) => {
    try {
      setUpdating(true);
      const r = await fetch(buildApiUrl('superadmin/api/tickets.php'), {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_status', ticket_id: ticketId, status }),
      });
      const d = await r.json();
      if (d.success) { load(); if (modal?.id === ticketId) setModal(prev => prev ? { ...prev, status } : prev); }
    } catch (e) { console.error(e); }
    finally { setUpdating(false); }
  };

  const STATS = [
    { label: 'Total',        value: tickets.length,                                                          color: 'text-slate-600',   bg: dk?'bg-slate-500/15':'bg-slate-50', Icon: Ticket       },
    { label: 'Open',         value: tickets.filter(t=>t.status==='open').length,                             color: 'text-amber-600',   bg: dk?'bg-amber-500/15':'bg-amber-50', Icon: Clock        },
    { label: 'In Progress',  value: tickets.filter(t=>t.status==='in_progress').length,                      color: 'text-blue-600',    bg: dk?'bg-blue-500/15':'bg-blue-50',   Icon: ArrowUpRight },
    { label: 'Critical',     value: tickets.filter(t=>t.priority==='critical'&&t.status!=='closed').length,  color: 'text-rose-600',    bg: dk?'bg-rose-500/15':'bg-rose-50',   Icon: AlertTriangle},
  ];

  const fmtDate = (s) => s ? new Date(s).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'}) : '';

  return (
    <SuperAdminLayout title="Support Tickets" subtitle="Manage and resolve customer support requests">
      <div className="space-y-5">

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {STATS.map(({ label, value, color, bg, Icon }) => (
            <div key={label} className={`flex items-center gap-4 p-4 rounded-2xl border ${card}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bg}`}>
                <Icon className={`w-5 h-5 ${color}`}/>
              </div>
              <div>
                <p className={`text-xl font-bold ${textM}`}>{value}</p>
                <p className={`text-xs ${sub}`}>{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className={`flex flex-col sm:flex-row gap-3 p-4 rounded-2xl border ${card}`}>
          <div className="relative flex-1">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${sub}`}/>
            <input value={search} onChange={e=>{ setSearch(e.target.value); setPage(1); }}
              placeholder="Search by subject, name, email"
              className={`w-full pl-9 pr-3 py-2 text-sm rounded-xl border ${inp} ${focus} transition-colors`}/>
          </div>
          <select value={statusFilter} onChange={e=>{ setStatus(e.target.value); setPage(1); }}
            className={`px-3 py-2 text-sm rounded-xl border ${inp} ${focus} transition-colors`}>
            <option value="all">All Statuses</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
          <select value={priorityFilter} onChange={e=>{ setPriority(e.target.value); setPage(1); }}
            className={`px-3 py-2 text-sm rounded-xl border ${inp} ${focus} transition-colors`}>
            <option value="all">All Priorities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <button onClick={load} disabled={loading}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm border transition-colors ${dk?'border-slate-600 text-slate-300 hover:bg-slate-700':'border-slate-200 text-slate-600 hover:bg-slate-100'} disabled:opacity-50`}>
            <RefreshCw className={`w-4 h-4 ${loading?'animate-spin':''}`}/> Refresh
          </button>
        </div>

        {/* Table */}
        <div className={`rounded-2xl border overflow-hidden ${card}`}>
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"/>
            </div>
          ) : tickets.length === 0 ? (
            <div className={`text-center py-16 ${sub}`}>
              <Ticket className="w-12 h-12 mx-auto mb-3 opacity-30"/>
              <p className="font-medium">No tickets found</p>
              <p className="text-xs mt-1">Try changing your filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className={dk?'bg-slate-700/50':'bg-slate-50'}>
                    {['#','Subject','Requester','Priority','Status','Date','Actions'].map(h=>(
                      <th key={h} className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${sub}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {tickets.map(t=>(
                    <tr key={t.id} className={`${rowHov} transition-colors`}>
                      <td className={`px-4 py-3 font-mono text-xs ${sub}`}>#{t.id}</td>
                      <td className={`px-4 py-3 font-medium max-w-xs truncate ${textM}`}>{t.subject}</td>
                      <td className={`px-4 py-3`}>
                        <p className={`text-sm font-medium ${textM}`}>{t.name||''}</p>
                        <p className={`text-xs ${sub}`}>{t.email||''}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${PRIORITY_COLORS[t.priority]||'bg-slate-100 text-slate-600'}`}>
                          {(t.priority||'medium').toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[t.status]||STATUS_COLORS.open}`}>
                          {(t.status||'open').replace('_',' ').toUpperCase()}
                        </span>
                      </td>
                      <td className={`px-4 py-3 text-xs ${sub}`}>{fmtDate(t.created_at)}</td>
                      <td className="px-4 py-3">
                        <div className="relative" ref={openMenu === t.id ? menuRef : null}>
                          <button
                            onClick={() => setOpenMenu(openMenu === t.id ? null : t.id)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              dk ? 'text-slate-400 hover:bg-slate-700 hover:text-white' : 'text-slate-500 hover:bg-slate-100'
                            }`}>
                            <MoreVertical className="w-4 h-4"/>
                          </button>
                          {openMenu === t.id && (
                            <div className={`absolute right-0 top-full mt-1 w-44 rounded-xl border shadow-xl z-50 py-1 ${
                              dk ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
                            }`}>
                              <button onClick={() => { openDetail(t.id); setOpenMenu(null); }}
                                className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors ${
                                  dk ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-700 hover:bg-slate-50'
                                }`}>
                                <Eye className="w-3.5 h-3.5 text-indigo-400"/> View Details
                              </button>
                              {t.status !== 'resolved' && t.status !== 'closed' && (
                                <button onClick={() => { updateStatus(t.id,'resolved'); setOpenMenu(null); }} disabled={updating}
                                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors disabled:opacity-40 ${
                                    dk ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-700 hover:bg-slate-50'
                                  }`}>
                                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400"/> Mark Resolved
                                </button>
                              )}
                              {t.status !== 'closed' && (
                                <button onClick={() => { updateStatus(t.id,'closed'); setOpenMenu(null); }} disabled={updating}
                                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors disabled:opacity-40 ${
                                    dk ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-700 hover:bg-slate-50'
                                  }`}>
                                  <XCircle className="w-3.5 h-3.5 text-rose-400"/> Close Ticket
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className={`text-sm ${sub}`}>Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page<=1||loading}
                className={`p-2 rounded-xl border transition-colors ${dk?'border-slate-600 hover:bg-slate-700 text-slate-300':'border-slate-200 hover:bg-slate-100 text-slate-600'} disabled:opacity-40`}>
                <ChevronLeft className="w-4 h-4"/>
              </button>
              <button onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page>=totalPages||loading}
                className={`p-2 rounded-xl border transition-colors ${dk?'border-slate-600 hover:bg-slate-700 text-slate-300':'border-slate-200 hover:bg-slate-100 text-slate-600'} disabled:opacity-40`}>
                <ChevronRight className="w-4 h-4"/>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={()=>setModal(null)}/>
          <div className={`relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border shadow-2xl ${card}`}>
            <div className={`sticky top-0 flex items-center justify-between p-5 border-b ${dk?'border-slate-700 bg-slate-800':'border-slate-200 bg-white'}`}>
              <div>
                <h3 className={`text-base font-bold ${textM}`}>Ticket #{modal.id}</h3>
                <p className={`text-xs ${sub} mt-0.5`}>{fmtDate(modal.created_at)}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${PRIORITY_COLORS[modal.priority]||''}`}>{(modal.priority||'').toUpperCase()}</span>
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[modal.status]||STATUS_COLORS.open}`}>{(modal.status||'').replace('_',' ').toUpperCase()}</span>
                <button onClick={()=>setModal(null)} className={`ml-2 p-1.5 rounded-lg ${dk?'hover:bg-slate-700':'hover:bg-slate-100'}`}>
                  <XCircle className={`w-5 h-5 ${sub}`}/>
                </button>
              </div>
            </div>
            <div className="p-5 space-y-5">
              <div>
                <h4 className={`font-semibold text-base ${textM}`}>{modal.subject}</h4>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { Icon:User,    label:'From',    value:modal.name  },
                  { Icon:Mail,    label:'Email',   value:modal.email },
                  { Icon:Tag,     label:'Category',value:modal.category||'General' },
                  { Icon:Calendar,label:'Created', value:fmtDate(modal.created_at) },
                ].map(({ Icon, label, value }) => (
                  <div key={label} className={`flex items-start gap-3 p-3 rounded-xl ${dk?'bg-slate-700/40':'bg-slate-50'}`}>
                    <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${sub}`}/>
                    <div><p className={`text-xs ${sub}`}>{label}</p><p className={`text-sm font-medium ${textM}`}>{value||''}</p></div>
                  </div>
                ))}
              </div>
              {modal.message && (
                <div>
                  <p className={`text-xs font-semibold uppercase tracking-wider mb-2 ${sub}`}>Message</p>
                  <div className={`p-4 rounded-xl text-sm leading-relaxed ${textM} ${dk?'bg-slate-700/40':'bg-slate-50'}`}>{modal.message}</div>
                </div>
              )}
              {modal.replies?.length > 0 && (
                <div>
                  <p className={`text-xs font-semibold uppercase tracking-wider mb-3 ${sub}`}>Replies ({modal.replies.length})</p>
                  <div className="space-y-3">
                    {modal.replies.map((r,i)=>(
                      <div key={i} className={`p-3 rounded-xl ${r.is_staff ? (dk?'bg-indigo-500/15 border border-indigo-500/30':'bg-indigo-50 border border-indigo-200') : (dk?'bg-slate-700/40':'bg-slate-50')}`}>
                        <div className="flex justify-between mb-1">
                          <span className={`text-xs font-medium ${r.is_staff?'text-indigo-600':textM}`}>{r.is_staff?'Support Team':r.name||'User'}</span>
                          <span className={`text-xs ${sub}`}>{fmtDate(r.created_at)}</span>
                        </div>
                        <p className={`text-sm ${textM}`}>{r.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {modal.status!=='closed' && (
                <div className="flex gap-3 pt-2">
                  {modal.status!=='resolved' && (
                    <button onClick={()=>updateStatus(modal.id,'resolved')} disabled={updating}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50">
                      <CheckCircle className="w-4 h-4"/> Mark Resolved
                    </button>
                  )}
                  <button onClick={()=>updateStatus(modal.id,'closed')} disabled={updating}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-xl transition-colors disabled:opacity-50 ${dk?'bg-slate-700 hover:bg-slate-600 text-slate-200':'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}>
                    <XCircle className="w-4 h-4"/> Close Ticket
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </SuperAdminLayout>
  );
}