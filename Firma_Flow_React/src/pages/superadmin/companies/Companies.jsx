import React, { useState, useEffect, useCallback, useRef } from 'react';
import SuperAdminLayout from '../../../components/SuperAdminLayout';
import {
  Building2, Search, Eye, Play, Pause, Trash2, Users as UsersIcon,
  CreditCard, CheckCircle, X, ShoppingCart, Truck, FileText,
  DollarSign, Star, ToggleLeft, ToggleRight, RefreshCw,
  Mail, Phone, MapPin, Calendar, ChevronLeft, ChevronRight, Globe, MoreVertical,
} from 'lucide-react';
import { useTheme } from '../../../contexts/ThemeContext';

/* â”€â”€ helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const API_BASE = 'http://localhost/FirmaFlow';
const fmt = (n) => n != null ? Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : 'â€”';
const fmtDate = (d) => d ? new Date(d).toLocaleDateString() : 'â€”';

const TABS = [
  { key: 'overview',      label: 'Overview',     Icon: Building2    },
  { key: 'users',         label: 'Users',        Icon: UsersIcon    },
  { key: 'customers',     label: 'Customers',    Icon: ShoppingCart },
  { key: 'vendors',       label: 'Vendors',      Icon: Truck        },
  { key: 'transactions',  label: 'Invoices',     Icon: FileText     },
  { key: 'payments',      label: 'Payments',     Icon: DollarSign   },
  { key: 'subscription',  label: 'Subscription', Icon: Star         },
];

const planColor = (p) => ({
  free:         'bg-slate-100 text-slate-600',
  trial:        'bg-amber-100 text-amber-700',
  starter:      'bg-sky-100 text-sky-700',
  professional: 'bg-violet-100 text-violet-700',
  enterprise:   'bg-orange-100 text-orange-700',
})[p] || 'bg-slate-100 text-slate-600';

const statusColor = (s) => ({
  active:    'bg-emerald-500/15 text-emerald-600',
  inactive:  'bg-slate-100 text-slate-500',
  suspended: 'bg-rose-500/15 text-rose-500',
  expired:   'bg-rose-500/15 text-rose-500',
  cancelled: 'bg-slate-100 text-slate-500',
  pending:   'bg-amber-500/15 text-amber-600',
  trial:     'bg-amber-500/15 text-amber-600',
})[s] || 'bg-slate-100 text-slate-500';

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
export default function Companies() {
  const { theme } = useTheme();
  const dk = theme === 'dark';

  /* list state */
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

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

  /* detail panel state */
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelCompany, setPanelCompany] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [tabData, setTabData] = useState({});
  const [tabLoading, setTabLoading] = useState(false);

  /* toast */
  const [toast, setToast] = useState(null);
  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  /* colours */
  const card    = dk ? 'bg-slate-800 border-slate-700'     : 'bg-white border-slate-200';
  const inner   = dk ? 'bg-slate-700/50 border-slate-600'  : 'bg-slate-50 border-slate-200';
  const sub     = dk ? 'text-slate-400'                    : 'text-slate-500';
  const textMain= dk ? 'text-white'                        : 'text-slate-900';
  const rowHov  = dk ? 'hover:bg-slate-700/40'             : 'hover:bg-slate-50';
  const borderR = dk ? 'border-slate-700'                  : 'border-slate-100';
  const inputCls= `w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${
    dk ? 'bg-slate-800 border-slate-600 text-white placeholder:text-slate-500' : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400'
  }`;

  /* â”€â”€â”€ fetch companies â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({
        action: 'list', page: currentPage, limit: 15,
        search: searchTerm,
        status: statusFilter !== 'all' ? statusFilter : '',
        plan:   planFilter   !== 'all' ? planFilter   : '',
      });
      const r = await fetch(`${API_BASE}/superadmin/api/companies.php?${p}`, { credentials: 'include' });
      const d = await r.json();
      if (d.success) {
        setCompanies(d.companies || []);
        setTotalPages(d.pagination?.total_pages || 1);
        setTotalCount(d.pagination?.total_count || 0);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [currentPage, statusFilter, planFilter, searchTerm]);

  useEffect(() => { fetchCompanies(); }, [fetchCompanies]);

  /* â”€â”€â”€ toggle company status â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  const toggleStatus = async (company) => {
    const action = company.subscription_status === 'active' ? 'deactivate' : 'activate';
    const fd = new FormData();
    fd.append('action', action);
    fd.append('id', company.id);
    try {
      const r = await fetch(`${API_BASE}/superadmin/api/companies.php`, { method: 'POST', credentials: 'include', body: fd });
      const d = await r.json();
      if (d.success) { showToast(d.message || 'Status updated'); fetchCompanies(); }
      else showToast(d.message || 'Failed', 'error');
    } catch { showToast('Request failed', 'error'); }
  };

  /* â”€â”€â”€ delete company â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  const deleteCompany = async (company) => {
    if (!window.confirm(`Delete "${company.name}"? This cannot be undone.`)) return;
    const fd = new FormData(); fd.append('action', 'delete'); fd.append('id', company.id);
    try {
      const r = await fetch(`${API_BASE}/superadmin/api/companies.php`, { method: 'POST', credentials: 'include', body: fd });
      const d = await r.json();
      if (d.success) { showToast('Company deleted'); fetchCompanies(); }
      else showToast(d.message || 'Failed', 'error');
    } catch { showToast('Request failed', 'error'); }
  };

  /* â”€â”€â”€ open detail panel â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  const openPanel = (company) => {
    setPanelCompany(company);
    setActiveTab('overview');
    setTabData({});
    setPanelOpen(true);
    loadTab('overview', company.id);
  };

  const loadTab = async (tab, companyId) => {
    if (tabData[tab]) return;
    setTabLoading(true);
    try {
      const url = tab === 'overview'
        ? `${API_BASE}/superadmin/api/user_detail.php?company_id=${companyId}`
        : `${API_BASE}/superadmin/api/user_detail.php?company_id=${companyId}&tab=${tab}`;
      const r = await fetch(url, { credentials: 'include' });
      const d = await r.json();
      if (d.success) setTabData((p) => ({ ...p, [tab]: d }));
    } catch { /* ignore */ }
    finally { setTabLoading(false); }
  };

  const switchTab = (tab) => {
    setActiveTab(tab);
    loadTab(tab, panelCompany?.id);
  };

  /* â”€â”€â”€ close panel â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  const closePanel = () => { setPanelOpen(false); setPanelCompany(null); setTabData({}); };

  /* â”€â”€â”€ stats â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  const STATS = [
    { label: 'Total Companies', value: totalCount,
      color: 'text-indigo-600',  bg: dk ? 'bg-indigo-500/15' : 'bg-indigo-50',   Icon: Building2   },
    { label: 'Active',          value: companies.filter(c => c.subscription_status === 'active').length,
      color: 'text-emerald-600', bg: dk ? 'bg-emerald-500/15' : 'bg-emerald-50', Icon: CheckCircle },
    { label: 'Paid Plans',      value: companies.filter(c => !['free','trial'].includes(c.subscription_plan)).length,
      color: 'text-violet-600',  bg: dk ? 'bg-violet-500/15' : 'bg-violet-50',   Icon: CreditCard  },
    { label: 'Trial / Free',    value: companies.filter(c => ['free','trial'].includes(c.subscription_plan)).length,
      color: 'text-amber-600',   bg: dk ? 'bg-amber-500/15'  : 'bg-amber-50',    Icon: Star        },
  ];

  /* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
  return (
    <SuperAdminLayout title="Companies" subtitle="Monitor and manage all companies">
      <div className="space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {STATS.map(({ label, value, color, bg, Icon }) => (
            <div key={label} className={`flex items-center gap-3 p-4 rounded-2xl border ${card}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${bg}`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <div>
                <p className={`text-xs ${sub}`}>{label}</p>
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className={`p-4 rounded-2xl border ${card}`}>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${sub}`} />
              <input type="text" placeholder="Search companiesâ€¦" value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchCompanies()}
                className={`${inputCls} pl-9`} />
            </div>
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className={inputCls + ' sm:w-40'}>
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
            <select value={planFilter} onChange={(e) => { setPlanFilter(e.target.value); setCurrentPage(1); }}
              className={inputCls + ' sm:w-44'}>
              <option value="all">All Plans</option>
              <option value="free">Free</option>
              <option value="trial">Trial</option>
              <option value="starter">Starter</option>
              <option value="professional">Professional</option>
              <option value="enterprise">Enterprise</option>
            </select>
            <button onClick={fetchCompanies}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors">
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
          </div>
        </div>

        {/* Table */}
        <div className={`rounded-2xl border overflow-hidden ${card}`}>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className={`text-xs font-medium uppercase tracking-wider ${sub} border-b ${borderR} ${dk ? 'bg-slate-900/50' : 'bg-slate-50'}`}>
                      <th className="px-4 py-3 text-left">Company</th>
                      <th className="hidden md:table-cell px-4 py-3 text-left">Plan</th>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="hidden lg:table-cell px-4 py-3 text-left">Users</th>
                      <th className="hidden sm:table-cell px-4 py-3 text-left">Created</th>
                      <th className="hidden xl:table-cell px-4 py-3 text-left">Expires</th>
                      <th className="px-4 py-3 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${borderR}`}>
                    {companies.length === 0 ? (
                      <tr>
                        <td colSpan={7} className={`text-center py-16 ${sub}`}>
                          <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                          <p>No companies found</p>
                        </td>
                      </tr>
                    ) : companies.map((co) => (
                      <tr key={co.id} className={`transition-colors ${rowHov}`}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                              {co.name?.[0]?.toUpperCase()}
                            </div>
                            <div>
                              <p className={`font-medium ${textMain}`}>{co.name}</p>
                              <p className={`text-xs truncate max-w-[160px] ${sub}`}>{co.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="hidden md:table-cell px-4 py-3">
                          <span className={`capitalize px-2 py-0.5 rounded-full text-xs font-medium ${planColor(co.subscription_plan)}`}>
                            {co.subscription_plan || 'â€”'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`capitalize px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(co.subscription_status)}`}>
                            {co.subscription_status || 'â€”'}
                          </span>
                        </td>
                        <td className="hidden lg:table-cell px-4 py-3">
                          <span className={`flex items-center gap-1 ${sub}`}>
                            <UsersIcon className="w-3.5 h-3.5" />{co.user_count || 0}
                          </span>
                        </td>
                        <td className={`hidden sm:table-cell px-4 py-3 text-xs ${sub}`}>{fmtDate(co.created_at)}</td>
                        <td className={`hidden xl:table-cell px-4 py-3 text-xs ${
                          co.days_until_expiry != null && co.days_until_expiry < 7
                            ? 'text-rose-500 font-medium'
                            : sub
                        }`}>
                          {co.subscription_end_date
                            ? `${fmtDate(co.subscription_end_date)}${co.days_until_expiry != null ? ` (${co.days_until_expiry}d)` : ''}`
                            : 'â€”'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="relative" ref={openMenu === co.id ? menuRef : null}>
                            <button
                              onClick={() => setOpenMenu(openMenu === co.id ? null : co.id)}
                              className={`p-1.5 rounded-lg transition-colors ${
                                dk ? 'text-slate-400 hover:bg-slate-700 hover:text-white' : 'text-slate-500 hover:bg-slate-100'
                              }`}>
                              <MoreVertical className="w-4 h-4" />
                            </button>
                            {openMenu === co.id && (
                              <div className={`absolute right-0 top-full mt-1 w-44 rounded-xl border shadow-xl z-50 py-1 ${
                                dk ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
                              }`}>
                                <button onClick={() => { openPanel(co); setOpenMenu(null); }}
                                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors ${
                                    dk ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-700 hover:bg-slate-50'
                                  }`}>
                                  <Eye className="w-3.5 h-3.5 text-indigo-400" /> View Details
                                </button>
                                <button onClick={() => { toggleStatus(co); setOpenMenu(null); }}
                                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors ${
                                    dk ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-700 hover:bg-slate-50'
                                  }`}>
                                  {co.subscription_status === 'active'
                                    ? <><Pause className="w-3.5 h-3.5 text-amber-400" /> Deactivate</>
                                    : <><Play className="w-3.5 h-3.5 text-emerald-400" /> Activate</>}
                                </button>
                                <div className={`my-1 border-t ${ dk ? 'border-slate-700' : 'border-slate-100' }`} />
                                <button onClick={() => { deleteCompany(co); setOpenMenu(null); }}
                                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-rose-500 hover:bg-rose-500/10 transition-colors">
                                  <Trash2 className="w-3.5 h-3.5" /> Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className={`flex items-center justify-between px-4 py-3 border-t ${borderR}`}>
                  <span className={`text-xs ${sub}`}>{totalCount} companies</span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                      className={`p-1.5 rounded-lg border transition-colors ${borderR} ${currentPage === 1 ? 'opacity-40 cursor-not-allowed' : 'hover:bg-indigo-600 hover:text-white hover:border-indigo-600'}`}>
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className={`text-xs ${sub}`}>{currentPage} / {totalPages}</span>
                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                      className={`p-1.5 rounded-lg border transition-colors ${borderR} ${currentPage === totalPages ? 'opacity-40 cursor-not-allowed' : 'hover:bg-indigo-600 hover:text-white hover:border-indigo-600'}`}>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* â”€â”€ Company Detail Panel â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {panelOpen && panelCompany && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closePanel} />

          {/* Side Sheet */}
          <div className={`relative ml-auto w-full max-w-3xl h-full flex flex-col shadow-2xl ${dk ? 'bg-slate-900' : 'bg-white'}`}>

            {/* Header */}
            <div className={`flex items-center justify-between px-6 py-4 border-b ${dk ? 'border-slate-700' : 'border-slate-200'} shrink-0`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold shrink-0">
                  {panelCompany.name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p className={`font-bold ${textMain}`}>{panelCompany.name}</p>
                  <p className={`text-xs ${sub}`}>{panelCompany.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => toggleStatus(panelCompany)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition ${
                    panelCompany.subscription_status === 'active'
                      ? 'bg-amber-500/15 text-amber-600 hover:bg-amber-500/25'
                      : 'bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25'
                  }`}>
                  {panelCompany.subscription_status === 'active'
                    ? <><Pause className="w-3.5 h-3.5" /> Deactivate</>
                    : <><Play className="w-3.5 h-3.5" /> Activate</>}
                </button>
                <button onClick={closePanel} className={`p-2 rounded-lg transition-colors ${dk ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}>
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Tab nav */}
            <div className={`flex gap-1 px-4 py-2 border-b overflow-x-auto shrink-0 ${dk ? 'border-slate-700' : 'border-slate-200'}`}>
              {TABS.map(({ key, label, Icon }) => (
                <button key={key} onClick={() => switchTab(key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition ${
                    activeTab === key
                      ? 'bg-indigo-600 text-white'
                      : dk
                      ? 'text-slate-400 hover:bg-slate-800 hover:text-white'
                      : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                  }`}>
                  <Icon className="w-3.5 h-3.5" />{label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto p-6">
              {tabLoading && !tabData[activeTab] ? (
                <div className="flex items-center justify-center h-32">
                  <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                </div>
              ) : (
                <PanelTabContent
                  tab={activeTab}
                  data={tabData[activeTab]}
                  company={panelCompany}
                  dk={dk} sub={sub} inner={inner} textMain={textMain} borderR={borderR}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-5 right-5 px-5 py-3 rounded-xl shadow-2xl text-white text-sm font-medium z-[70] max-w-xs ${
          toast.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'
        }`}>
          {toast.msg}
        </div>
      )}
    </SuperAdminLayout>
  );
}

/* â”€â”€ Panel tab content â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function PanelTabContent({ tab, data, company, dk, sub, inner, textMain, borderR }) {
  if (!data) return <p className={`text-sm ${sub}`}>No data.</p>;

  /* Overview */
  if (tab === 'overview') {
    const co = data.company || {};
    return (
      <div className="space-y-5">
        {/* KPI row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { l: 'Users',        v: co.user_count        || 0, color: 'text-indigo-600'  },
            { l: 'Customers',    v: co.customer_count    || 0, color: 'text-emerald-600' },
            { l: 'Vendors',      v: co.vendor_count      || 0, color: 'text-amber-600'   },
            { l: 'Transactions', v: co.transaction_count || 0, color: 'text-violet-600'  },
          ].map(({ l, v, color }) => (
            <div key={l} className={`p-3 rounded-xl border ${inner}`}>
              <p className={`text-xs ${sub}`}>{l}</p>
              <p className={`text-xl font-bold ${color}`}>{v}</p>
            </div>
          ))}
        </div>
        {/* Details grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { Icon: Mail,     label: 'Email',    value: co.email   },
            { Icon: Phone,    label: 'Phone',    value: co.phone   },
            { Icon: Globe,    label: 'Website',  value: co.website },
            { Icon: MapPin,   label: 'Location', value: [co.city, co.country].filter(Boolean).join(', ') || co.address },
            { Icon: Calendar, label: 'Joined',   value: fmtDate(co.created_at) },
            { Icon: CreditCard, label: 'Revenue', value: 'â‚¦' + fmt(co.total_revenue) },
          ].map(({ Icon, label, value }) => (
            <div key={label} className={`flex items-start gap-3 p-3 rounded-xl border ${inner}`}>
              <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${sub}`} />
              <div>
                <p className={`text-xs ${sub}`}>{label}</p>
                <p className={`text-sm font-medium ${textMain}`}>{value || 'â€”'}</p>
              </div>
            </div>
          ))}
        </div>
        {/* Plan info */}
        <div className={`p-4 rounded-xl border ${inner} space-y-2`}>
          <p className={`text-xs font-semibold uppercase tracking-wider ${sub}`}>Subscription</p>
          <div className="flex flex-wrap gap-3 text-sm">
            <div><p className={`text-xs ${sub}`}>Plan</p><p className="font-medium capitalize">{co.subscription_plan || 'â€”'}</p></div>
            <div><p className={`text-xs ${sub}`}>Status</p><span className={`px-2 py-0.5 rounded-full text-xs capitalize ${statusColor(co.subscription_status)}`}>{co.subscription_status || 'â€”'}</span></div>
            <div><p className={`text-xs ${sub}`}>Expires</p><p className="font-medium">{fmtDate(co.subscription_end_date)}</p></div>
            <div><p className={`text-xs ${sub}`}>Billing</p><p className="font-medium capitalize">{co.billing_cycle || 'â€”'}</p></div>
          </div>
        </div>
      </div>
    );
  }

  /* Users */
  if (tab === 'users') {
    const rows = data.users || [];
    if (!rows.length) return <p className={`text-sm ${sub}`}>No users found.</p>;
    return (
      <div className="space-y-2">
        {rows.map((u) => (
          <div key={u.id} className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl border ${inner}`}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                {u.first_name?.[0]}{u.last_name?.[0]}
              </div>
              <div>
                <p className={`font-medium text-sm ${textMain}`}>{u.first_name} {u.last_name}</p>
                <p className={`text-xs ${sub}`}>{u.email}</p>
                <div className="flex gap-1.5 mt-1 flex-wrap">
                  <span className={`px-1.5 py-0.5 rounded text-xs capitalize ${u.role === 'admin' ? 'bg-rose-500/15 text-rose-600' : 'bg-slate-500/15 text-slate-500'}`}>{u.role}</span>
                  <span className={`px-1.5 py-0.5 rounded text-xs ${u.is_active == 1 ? 'bg-emerald-500/15 text-emerald-600' : 'bg-slate-500/15 text-slate-500'}`}>{u.is_active == 1 ? 'Active' : 'Inactive'}</span>
                </div>
              </div>
            </div>
            <p className={`text-xs ${sub} shrink-0`}>Last login: {fmtDate(u.last_login)}</p>
          </div>
        ))}
      </div>
    );
  }

  /* Customers */
  if (tab === 'customers') {
    const rows = data.customers || [];
    if (!rows.length) return <p className={`text-sm ${sub}`}>No customers found.</p>;
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className={`text-left text-xs font-medium uppercase ${sub} border-b ${borderR}`}>
            <th className="pb-2">Name</th><th className="hidden md:table-cell pb-2">Email</th>
            <th className="pb-2 text-right">Balance</th><th className="pb-2">Status</th>
          </tr></thead>
          <tbody className={`divide-y ${borderR}`}>
            {rows.map((c) => (
              <tr key={c.id}>
                <td className={`py-2.5 pr-3 font-medium ${textMain}`}>{c.name}</td>
                <td className={`hidden md:table-cell py-2.5 pr-3 text-xs ${sub}`}>{c.email || 'â€”'}</td>
                <td className="py-2.5 pr-3 text-right">â‚¦{fmt(c.balance)}</td>
                <td className="py-2.5"><span className={`px-1.5 py-0.5 rounded text-xs ${c.is_active == 1 ? 'bg-emerald-500/15 text-emerald-600' : 'bg-slate-500/15 text-slate-500'}`}>{c.is_active == 1 ? 'Active' : 'Inactive'}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  /* Vendors */
  if (tab === 'vendors') {
    const rows = data.vendors || [];
    if (!rows.length) return <p className={`text-sm ${sub}`}>No vendors found.</p>;
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className={`text-left text-xs font-medium uppercase ${sub} border-b ${borderR}`}>
            <th className="pb-2">Name</th><th className="hidden md:table-cell pb-2">Contact</th>
            <th className="pb-2 text-right">Balance</th><th className="pb-2">Status</th>
          </tr></thead>
          <tbody className={`divide-y ${borderR}`}>
            {rows.map((v) => (
              <tr key={v.id}>
                <td className={`py-2.5 pr-3 font-medium ${textMain}`}>{v.name}</td>
                <td className={`hidden md:table-cell py-2.5 pr-3 text-xs ${sub}`}>{v.contact_person || v.phone || 'â€”'}</td>
                <td className="py-2.5 pr-3 text-right">â‚¦{fmt(v.balance)}</td>
                <td className="py-2.5"><span className={`px-1.5 py-0.5 rounded text-xs ${v.is_active == 1 ? 'bg-emerald-500/15 text-emerald-600' : 'bg-slate-500/15 text-slate-500'}`}>{v.is_active == 1 ? 'Active' : 'Inactive'}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  /* Transactions / Invoices */
  if (tab === 'transactions') {
    const rows = data.transactions || [];
    if (!rows.length) return <p className={`text-sm ${sub}`}>No invoices found.</p>;
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className={`text-left text-xs font-medium uppercase ${sub} border-b ${borderR}`}>
            <th className="pb-2">Invoice #</th><th className="hidden md:table-cell pb-2">Customer</th>
            <th className="pb-2">Date</th><th className="pb-2 text-right">Total</th><th className="pb-2">Status</th>
          </tr></thead>
          <tbody className={`divide-y ${borderR}`}>
            {rows.map((t) => (
              <tr key={t.id}>
                <td className="py-2.5 pr-3 font-mono text-xs">{t.invoice_no}</td>
                <td className={`hidden md:table-cell py-2.5 pr-3 text-xs ${sub}`}>{t.customer_name || 'â€”'}</td>
                <td className={`py-2.5 pr-3 text-xs ${sub}`}>{fmtDate(t.invoice_date)}</td>
                <td className="py-2.5 pr-3 text-right">â‚¦{fmt(t.total)}</td>
                <td className="py-2.5"><span className={`px-1.5 py-0.5 rounded text-xs capitalize ${statusColor(t.status)}`}>{t.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  /* Payments */
  if (tab === 'payments') {
    const rows = data.payments || [];
    if (!rows.length) return <p className={`text-sm ${sub}`}>No payments found.</p>;
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className={`text-left text-xs font-medium uppercase ${sub} border-b ${borderR}`}>
            <th className="pb-2">Reference</th><th className="hidden md:table-cell pb-2">Party</th>
            <th className="pb-2">Date</th><th className="pb-2 text-right">Amount</th><th className="pb-2">Status</th>
          </tr></thead>
          <tbody className={`divide-y ${borderR}`}>
            {rows.map((p) => (
              <tr key={p.id}>
                <td className="py-2.5 pr-3 font-mono text-xs">{p.reference || 'â€”'}</td>
                <td className={`hidden md:table-cell py-2.5 pr-3 text-xs ${sub}`}>{p.party_name || 'â€”'}</td>
                <td className={`py-2.5 pr-3 text-xs ${sub}`}>{fmtDate(p.payment_date)}</td>
                <td className="py-2.5 pr-3 text-right">â‚¦{fmt(p.amount)}</td>
                <td className="py-2.5"><span className={`px-1.5 py-0.5 rounded text-xs capitalize ${statusColor(p.status)}`}>{p.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  /* Subscription */
  if (tab === 'subscription') {
    const SI = data.subscription;
    if (!SI) return <p className={`text-sm ${sub}`}>No subscription data.</p>;
    const fields = [
      ['Plan', SI.plan || SI.subscription_plan || 'â€”'],
      ['Status', SI.status || SI.subscription_status || 'â€”'],
      ['Billing', SI.billing_cycle || 'â€”'],
      ['Amount', SI.amount ? 'â‚¦' + fmt(SI.amount) : 'â€”'],
      ['Start date', fmtDate(SI.start_date || SI.subscription_start_date)],
      ['End date', fmtDate(SI.end_date || SI.subscription_end_date)],
      ['Last payment', fmtDate(SI.last_payment_date)],
    ];
    return (
      <div className="space-y-4">
        <div className={`p-4 rounded-xl border ${inner} grid grid-cols-2 sm:grid-cols-3 gap-4`}>
          {fields.map(([label, value]) => (
            <div key={label}>
              <p className={`text-xs ${sub}`}>{label}</p>
              <p className={`text-sm font-medium capitalize ${textMain}`}>{value}</p>
            </div>
          ))}
        </div>
        {SI.users?.length > 0 && (
          <div>
            <p className={`text-xs font-semibold uppercase tracking-wider mb-2 ${sub}`}>User Plans</p>
            <div className="space-y-2">
              {SI.users.map((u) => (
                <div key={u.id} className={`flex items-center justify-between p-3 rounded-xl border text-xs ${inner}`}>
                  <div>
                    <p className={`font-medium ${textMain}`}>{u.first_name} {u.last_name}</p>
                    <p className={sub}>{u.email}</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-1.5 py-0.5 rounded capitalize ${statusColor(u.subscription_status)}`}>{u.subscription_status}</span>
                    <p className={`mt-1 ${sub}`}>{u.subscription_plan}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
}
