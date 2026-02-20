import React, { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { buildApiUrl } from '../../config/api.config';
import StaffLayout from '../../components/StaffLayout';
import {
  Search, Eye, Building2, Users, ShoppingCart, Truck,
  FileText, CreditCard, Star, XCircle, CheckCircle2,
  ToggleLeft, ToggleRight, AlertCircle, Calendar, Mail,
  Phone, Globe, MapPin, RefreshCw,
} from 'lucide-react';

/* ── Tab definitions ────────────────────────────────────────────────────── */
const TABS = [
  { key: 'overview',      label: 'Overview',      icon: Building2   },
  { key: 'users',         label: 'Users',         icon: Users       },
  { key: 'customers',     label: 'Customers',     icon: ShoppingCart},
  { key: 'vendors',       label: 'Vendors',       icon: Truck       },
  { key: 'transactions',  label: 'Transactions',  icon: FileText    },
  { key: 'payments',      label: 'Payments',      icon: CreditCard  },
  { key: 'subscription',  label: 'Subscription',  icon: Star        },
];

/* ── helpers ────────────────────────────────────────────────────────────── */
const fmt = (n) =>
  n !== undefined && n !== null
    ? Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : '—';
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : '—');
const statusPill = (active, dk) =>
  active == 1
    ? `bg-emerald-500/15 text-emerald-600 ${dk ? 'dark:text-emerald-300' : ''}`
    : `bg-slate-500/15 text-slate-500`;

/* ════════════════════════════════════════════════════════════════════════ */
const StaffUsers = () => {
  const { theme } = useTheme();
  const dk = theme === 'dark';

  /* ── List state ──────────────────────────────────────────────────────── */
  const [companies, setCompanies]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  /* ── Modal state ─────────────────────────────────────────────────────── */
  const [modal, setModal]           = useState(null);   // selected company
  const [activeTab, setActiveTab]   = useState('overview');
  const [tabData, setTabData]       = useState({});     // cached tab data
  const [tabLoading, setTabLoading] = useState(false);
  const [toast, setToast]           = useState(null);

  /* ── Colours ─────────────────────────────────────────────────────────── */
  const card  = dk ? 'bg-slate-900 border-slate-800'  : 'bg-white border-slate-200';
  const inner = dk ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200';
  const sub   = dk ? 'text-slate-400' : 'text-slate-500';
  const inp   = dk ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900';

  /* ── Toast ───────────────────────────────────────────────────────────── */
  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  /* ── Fetch list ──────────────────────────────────────────────────────── */
  useEffect(() => { fetchCompanies(); }, []);

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const r = await fetch(buildApiUrl('superadmin/api/users.php'), {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      const d = await r.json();
      if (d.success) setCompanies(d.users || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  /* ── Open modal ──────────────────────────────────────────────────────── */
  const openModal = (company) => {
    setModal(company);
    setTabData({});
    setActiveTab('overview');
    loadTab('overview', company.id);
  };

  const closeModal = () => setModal(null);

  /* ── Load tab data lazily ────────────────────────────────────────────── */
  const loadTab = async (tab, companyId) => {
    const cid = companyId ?? modal?.id;
    if (!cid) return;
    if (tabData[tab]) return; // cached
    setTabLoading(true);
    try {
      const url =
        tab === 'overview'
          ? buildApiUrl(`superadmin/api/user_detail.php?company_id=${cid}`)
          : buildApiUrl(`superadmin/api/user_detail.php?company_id=${cid}&tab=${tab}`);
      const r = await fetch(url, { credentials: 'include' });
      const d = await r.json();
      if (d.success) {
        setTabData((prev) => ({ ...prev, [tab]: d }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setTabLoading(false);
    }
  };

  const switchTab = (tab) => {
    setActiveTab(tab);
    loadTab(tab);
  };

  /* ── Toggle user status ──────────────────────────────────────────────── */
  const toggleUser = async (userId, current) => {
    try {
      const r = await fetch(buildApiUrl('superadmin/api/user_detail.php'), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle_user', user_id: userId, is_active: current == 1 ? 0 : 1 }),
      });
      const d = await r.json();
      if (d.success) {
        showToast(d.message);
        // Invalidate users cache to reload
        setTabData((prev) => {
          const n = { ...prev };
          delete n['users'];
          delete n['overview'];
          return n;
        });
        loadTab('users');
        loadTab('overview');
      } else showToast(d.message || 'Failed', 'error');
    } catch {
      showToast('Request failed', 'error');
    }
  };

  /* ── Filtered list ───────────────────────────────────────────────────── */
  const filtered = companies.filter((c) => {
    const q = searchTerm.toLowerCase();
    return (
      c.name?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.country?.toLowerCase().includes(q)
    );
  });

  const stats = {
    total:  companies.length,
    active: companies.filter((c) => c.subscription_status === 'active').length,
    trial:  companies.filter((c) => c.subscription_status === 'trial').length,
    free:   companies.filter((c) => c.subscription_plan === 'free').length,
  };

  /* ── Render ──────────────────────────────────────────────────────────── */
  return (
    <StaffLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Users &amp; Accounts</h1>
          <p className={`text-sm mt-0.5 ${sub}`}>Browse company accounts and their full details.</p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Total', value: stats.total,  color: 'text-indigo-500' },
            { label: 'Active',value: stats.active, color: 'text-emerald-500'},
            { label: 'Trial', value: stats.trial,  color: 'text-amber-500'  },
            { label: 'Free',  value: stats.free,   color: 'text-slate-500'  },
          ].map(({ label, value, color }) => (
            <div key={label} className={`p-4 rounded-2xl border ${card}`}>
              <p className={`text-xs font-medium mb-0.5 ${sub}`}>{label}</p>
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* Search & list */}
        <div className={`rounded-2xl border ${card} overflow-hidden`}>
          <div className={`p-4 border-b ${dk ? 'border-slate-800' : 'border-slate-200'} flex gap-3`}>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, email, country…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-9 pr-4 py-2 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${inp}`}
              />
            </div>
            <button
              onClick={fetchCompanies}
              className={`p-2 rounded-xl border transition ${dk ? 'border-slate-700 hover:bg-slate-800' : 'border-slate-200 hover:bg-slate-100'}`}
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {loading ? (
            <div className={`p-12 text-center text-sm ${sub}`}>Loading accounts…</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className={`text-left text-xs font-medium uppercase tracking-wider ${sub} border-b ${dk ? 'border-slate-800' : 'border-slate-200'}`}>
                    <th className="px-4 py-3">Company</th>
                    <th className="hidden md:table-cell px-4 py-3">Country</th>
                    <th className="px-4 py-3">Plan</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="hidden sm:table-cell px-4 py-3">Joined</th>
                    <th className="px-4 py-3">View</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${dk ? 'divide-slate-800' : 'divide-slate-100'}`}>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className={`px-4 py-10 text-center text-sm ${sub}`}>No accounts found</td>
                    </tr>
                  ) : (
                    filtered.map((c) => (
                      <tr key={c.id} className={`transition ${dk ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'}`}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                              {(c.name || '?')[0].toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-sm truncate">{c.name}</p>
                              <p className={`text-xs truncate ${sub}`}>{c.email || 'No email'}</p>
                            </div>
                          </div>
                        </td>
                        <td className={`hidden md:table-cell px-4 py-3 text-sm ${sub}`}>{c.country || '—'}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                            c.subscription_plan === 'enterprise' ? 'bg-violet-500/15 text-violet-600' :
                            c.subscription_plan === 'professional' ? 'bg-indigo-500/15 text-indigo-600' :
                            c.subscription_plan === 'starter' ? 'bg-sky-500/15 text-sky-600' :
                            'bg-slate-500/15 text-slate-500'
                          }`}>
                            {c.subscription_plan || 'free'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                            c.subscription_status === 'active' ? 'bg-emerald-500/15 text-emerald-600' :
                            c.subscription_status === 'trial'  ? 'bg-amber-500/15 text-amber-600' :
                            'bg-rose-500/15 text-rose-500'
                          }`}>
                            {c.subscription_status || 'trial'}
                          </span>
                        </td>
                        <td className={`hidden sm:table-cell px-4 py-3 text-xs ${sub}`}>{fmtDate(c.created_at)}</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => openModal(c)}
                            className={`p-2 rounded-xl transition ${dk ? 'hover:bg-indigo-500/10 text-indigo-400' : 'hover:bg-indigo-50 text-indigo-600'}`}
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          Detail Modal
      ═══════════════════════════════════════════════════════════════════ */}
      {modal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center z-50 p-3 md:p-6 overflow-y-auto">
          <div
            className={`relative w-full max-w-5xl rounded-2xl border shadow-2xl ${
              dk ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'
            }`}
          >
            {/* Modal header */}
            <div className={`sticky top-0 z-10 flex items-center gap-4 p-5 border-b rounded-t-2xl ${
              dk ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold text-lg shrink-0">
                {(modal.name || '?')[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-bold text-lg truncate">{modal.name}</h2>
                <p className={`text-sm truncate ${sub}`}>{modal.email || 'No email'}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`hidden sm:inline-flex px-2.5 py-1 rounded-full text-xs font-medium capitalize ${
                  modal.subscription_status === 'active' ? 'bg-emerald-500/15 text-emerald-600' :
                  modal.subscription_status === 'trial'  ? 'bg-amber-500/15 text-amber-600' :
                  'bg-rose-500/15 text-rose-500'
                }`}>
                  {modal.subscription_status || 'trial'}
                </span>
                <button
                  onClick={closeModal}
                  className={`p-2 rounded-xl transition ${dk ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Tab nav */}
            <div className={`flex gap-1 px-5 py-3 border-b overflow-x-auto ${dk ? 'border-slate-800' : 'border-slate-200'}`}>
              {TABS.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => switchTab(key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl whitespace-nowrap transition ${
                    activeTab === key
                      ? 'bg-indigo-500 text-white'
                      : dk
                      ? 'text-slate-400 hover:bg-slate-800 hover:text-white'
                      : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="p-5 min-h-[320px]">
              {tabLoading && !tabData[activeTab] ? (
                <div className={`text-center py-12 text-sm ${sub}`}>Loading…</div>
              ) : (
                <TabContent
                  tab={activeTab}
                  data={tabData[activeTab]}
                  modal={modal}
                  dk={dk}
                  sub={sub}
                  inner={inner}
                  toggleUser={toggleUser}
                  showToast={showToast}
                  buildApiUrl={buildApiUrl}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-5 right-5 px-5 py-3 rounded-xl shadow-2xl text-white text-sm font-medium z-[60] ${
          toast.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'
        }`}>
          {toast.msg}
        </div>
      )}
    </StaffLayout>
  );
};

/* ─── Tab content renderer ──────────────────────────────────────────────── */
const TabContent = ({ tab, data, modal, dk, sub, inner, toggleUser }) => {
  const borderRow = dk ? 'border-slate-800' : 'border-slate-100';
  const cellSub = dk ? 'text-slate-400' : 'text-slate-500';

  if (!data) return <p className={`text-sm ${sub}`}>No data available.</p>;

  /* ── Overview ── */
  if (tab === 'overview') {
    const co = data.company;
    if (!co) return <p className={`text-sm ${sub}`}>No data.</p>;
    return (
      <div className="space-y-5">
        {/* Summary metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Users',        value: co.user_count,        color: 'text-indigo-500' },
            { label: 'Customers',    value: co.customer_count,    color: 'text-emerald-500'},
            { label: 'Vendors',      value: co.vendor_count,      color: 'text-amber-500'  },
            { label: 'Transactions', value: co.transaction_count, color: 'text-violet-500' },
          ].map(({ label, value, color }) => (
            <div key={label} className={`p-3 rounded-xl border ${inner}`}>
              <p className={`text-xs ${sub}`}>{label}</p>
              <p className={`text-xl font-bold ${color}`}>{value ?? 0}</p>
            </div>
          ))}
        </div>

        {/* Company info grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { icon: Mail,    label: 'Email',       value: co.email     },
            { icon: Phone,   label: 'Phone',       value: co.phone     },
            { icon: Globe,   label: 'Website',     value: co.website   },
            { icon: MapPin,  label: 'Address',     value: [co.city, co.state, co.country].filter(Boolean).join(', ') || co.address },
            { icon: Calendar,label: 'Registered',  value: fmtDate(co.created_at) },
            { icon: Star,    label: 'Revenue',     value: '₦' + fmt(co.total_revenue) },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className={`flex items-start gap-3 p-3 rounded-xl border ${inner}`}>
              <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${sub}`} />
              <div>
                <p className={`text-xs ${sub}`}>{label}</p>
                <p className="text-sm font-medium">{value || '—'}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Admins quick list */}
        {co.users?.length > 0 && (
          <div>
            <p className={`text-xs font-semibold uppercase tracking-wider mb-2 ${sub}`}>Account Users</p>
            <div className="space-y-2">
              {co.users.map((u) => (
                <div key={u.id} className={`flex items-center justify-between p-3 rounded-xl border ${inner}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-xs font-bold">
                      {u.first_name?.[0]}{u.last_name?.[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{u.first_name} {u.last_name}</p>
                      <p className={`text-xs ${cellSub}`}>{u.role} · {u.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleUser(u.id, u.is_active)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                      u.is_active == 1
                        ? 'bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/30'
                        : 'bg-slate-500/15 text-slate-500 hover:bg-slate-500/25'
                    }`}
                  >
                    {u.is_active == 1 ? (
                      <><ToggleRight className="w-3.5 h-3.5" /> Active</>
                    ) : (
                      <><ToggleLeft className="w-3.5 h-3.5" /> Inactive</>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ── Users ── */
  if (tab === 'users') {
    const users = data.users || [];
    if (!users.length) return <p className={`text-sm ${sub}`}>No users in this account.</p>;
    return (
      <div className="space-y-2">
        {users.map((u) => (
          <div key={u.id} className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border ${inner}`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                {u.first_name?.[0]}{u.last_name?.[0]}
              </div>
              <div>
                <p className="font-medium text-sm">{u.first_name} {u.last_name}</p>
                <p className={`text-xs ${cellSub}`}>{u.email}</p>
                <div className="flex gap-2 mt-1 flex-wrap">
                  <span className={`px-1.5 py-0.5 rounded text-xs capitalize ${
                    u.role === 'admin' ? 'bg-rose-500/15 text-rose-600' :
                    u.role === 'manager' ? 'bg-amber-500/15 text-amber-600' :
                    'bg-slate-500/15 text-slate-500'
                  }`}>{u.role}</span>
                  <span className={`px-1.5 py-0.5 rounded text-xs ${
                    u.is_active == 1 ? 'bg-emerald-500/15 text-emerald-600' : 'bg-slate-500/15 text-slate-500'
                  }`}>{u.is_active == 1 ? 'Active' : 'Inactive'}</span>
                  {u.last_login && (
                    <span className={`text-xs ${cellSub}`}>Last login {fmtDate(u.last_login)}</span>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={() => toggleUser(u.id, u.is_active)}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition ${
                u.is_active == 1
                  ? 'bg-rose-500/10 text-rose-500 hover:bg-rose-500/20'
                  : 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20'
              }`}
            >
              {u.is_active == 1 ? (
                <><ToggleLeft className="w-3.5 h-3.5" /> Deactivate</>
              ) : (
                <><ToggleRight className="w-3.5 h-3.5" /> Activate</>
              )}
            </button>
          </div>
        ))}
      </div>
    );
  }

  /* ── Customers ── */
  if (tab === 'customers') {
    const rows = data.customers || [];
    if (!rows.length) return <p className={`text-sm ${sub}`}>No customers found.</p>;
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className={`text-left text-xs font-medium uppercase ${sub} border-b ${borderRow}`}>
              <th className="pb-2">Name</th>
              <th className="hidden md:table-cell pb-2">Email</th>
              <th className="pb-2">Type</th>
              <th className="pb-2 text-right">Balance</th>
              <th className="pb-2">Status</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${borderRow}`}>
            {rows.map((c) => (
              <tr key={c.id}>
                <td className="py-2.5 pr-4">{c.name}</td>
                <td className={`hidden md:table-cell py-2.5 pr-4 text-xs ${cellSub}`}>{c.email || '—'}</td>
                <td className={`py-2.5 pr-4 text-xs capitalize ${cellSub}`}>{c.customer_type || '—'}</td>
                <td className="py-2.5 pr-4 text-right">₦{fmt(c.balance)}</td>
                <td className="py-2.5">
                  <span className={`px-1.5 py-0.5 rounded text-xs ${statusPill(c.is_active, dk)}`}>
                    {c.is_active == 1 ? 'Active' : 'Inactive'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  /* ── Vendors ── */
  if (tab === 'vendors') {
    const rows = data.vendors || [];
    if (!rows.length) return <p className={`text-sm ${sub}`}>No vendors found.</p>;
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className={`text-left text-xs font-medium uppercase ${sub} border-b ${borderRow}`}>
              <th className="pb-2">Name</th>
              <th className="hidden md:table-cell pb-2">Contact</th>
              <th className="pb-2 text-right">Balance</th>
              <th className="pb-2">Status</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${borderRow}`}>
            {rows.map((v) => (
              <tr key={v.id}>
                <td className="py-2.5 pr-4">
                  <p>{v.name}</p>
                  <p className={`text-xs ${cellSub}`}>{v.email || '—'}</p>
                </td>
                <td className={`hidden md:table-cell py-2.5 pr-4 text-xs ${cellSub}`}>{v.contact_person || v.phone || '—'}</td>
                <td className="py-2.5 pr-4 text-right">₦{fmt(v.balance)}</td>
                <td className="py-2.5">
                  <span className={`px-1.5 py-0.5 rounded text-xs ${statusPill(v.is_active, dk)}`}>
                    {v.is_active == 1 ? 'Active' : 'Inactive'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  /* ── Transactions ── */
  if (tab === 'transactions') {
    const rows = data.transactions || [];
    if (!rows.length) return <p className={`text-sm ${sub}`}>No transactions found.</p>;
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className={`text-left text-xs font-medium uppercase ${sub} border-b ${borderRow}`}>
              <th className="pb-2">Invoice</th>
              <th className="hidden md:table-cell pb-2">Customer</th>
              <th className="pb-2">Date</th>
              <th className="pb-2 text-right">Total</th>
              <th className="pb-2">Status</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${borderRow}`}>
            {rows.map((t) => (
              <tr key={t.id}>
                <td className="py-2.5 pr-4 font-mono text-xs">{t.invoice_no}</td>
                <td className={`hidden md:table-cell py-2.5 pr-4 text-xs ${cellSub}`}>{t.customer_name || '—'}</td>
                <td className={`py-2.5 pr-4 text-xs ${cellSub}`}>{fmtDate(t.invoice_date)}</td>
                <td className="py-2.5 pr-4 text-right">₦{fmt(t.total)}</td>
                <td className="py-2.5">
                  <span className={`px-1.5 py-0.5 rounded text-xs capitalize ${
                    t.status === 'paid'           ? 'bg-emerald-500/15 text-emerald-600' :
                    t.status === 'partially_paid' ? 'bg-amber-500/15 text-amber-600' :
                    t.status === 'cancelled'      ? 'bg-rose-500/15 text-rose-500' :
                    'bg-slate-500/15 text-slate-500'
                  }`}>{t.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  /* ── Payments ── */
  if (tab === 'payments') {
    const rows = data.payments || [];
    if (!rows.length) return <p className={`text-sm ${sub}`}>No payments found.</p>;
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className={`text-left text-xs font-medium uppercase ${sub} border-b ${borderRow}`}>
              <th className="pb-2">Reference</th>
              <th className="hidden md:table-cell pb-2">Party</th>
              <th className="pb-2">Type</th>
              <th className="pb-2">Date</th>
              <th className="pb-2 text-right">Amount</th>
              <th className="pb-2">Status</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${borderRow}`}>
            {rows.map((p) => (
              <tr key={p.id}>
                <td className="py-2.5 pr-4 font-mono text-xs">{p.reference || '—'}</td>
                <td className={`hidden md:table-cell py-2.5 pr-4 text-xs ${cellSub}`}>{p.party_name || '—'}</td>
                <td className="py-2.5 pr-4">
                  <span className={`px-1.5 py-0.5 rounded text-xs ${
                    p.type === 'received' ? 'bg-emerald-500/15 text-emerald-600' : 'bg-rose-500/15 text-rose-500'
                  }`}>{p.type || '—'}</span>
                </td>
                <td className={`py-2.5 pr-4 text-xs ${cellSub}`}>{fmtDate(p.payment_date)}</td>
                <td className="py-2.5 pr-4 text-right">₦{fmt(p.amount)}</td>
                <td className="py-2.5">
                  <span className={`px-1.5 py-0.5 rounded text-xs capitalize ${
                    p.status === 'completed' ? 'bg-emerald-500/15 text-emerald-600' :
                    p.status === 'pending'   ? 'bg-amber-500/15 text-amber-600' :
                    'bg-rose-500/15 text-rose-500'
                  }`}>{p.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  /* ── Subscription ── */
  if (tab === 'subscription') {
    const sub2 = data.subscription;
    if (!sub2) return <p className={`text-sm ${sub}`}>No subscription data.</p>;
    const SI = sub2;
    return (
      <div className="space-y-5">
        {/* Company plan card */}
        <div className={`p-5 rounded-xl border ${inner} space-y-3`}>
          <div className="flex items-center justify-between">
            <p className="font-semibold">{SI.company_name}</p>
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${
              SI.status === 'active'  ? 'bg-emerald-500/15 text-emerald-600' :
              SI.status === 'trial'   ? 'bg-amber-500/15 text-amber-600' :
              'bg-rose-500/15 text-rose-500'
            }`}>{SI.status}</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
            {[
              [ 'Plan',         SI.plan ],
              [ 'Billing',      SI.billing_cycle ],
              [ 'Amount',       SI.amount ? '₦' + fmt(SI.amount) : '—' ],
              [ 'Start date',   fmtDate(SI.start_date) ],
              [ 'End date',     fmtDate(SI.end_date) ],
              [ 'Last payment', fmtDate(SI.last_payment_date) ],
            ].map(([label, value]) => (
              <div key={label}>
                <p className={`text-xs ${sub}`}>{label}</p>
                <p className="font-medium capitalize">{value || '—'}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Per-user rows */}
        {SI.users?.length > 0 && (
          <div>
            <p className={`text-xs font-semibold uppercase tracking-wider mb-2 ${sub}`}>User Plans</p>
            <div className="space-y-2">
              {SI.users.map((u) => (
                <div key={u.id} className={`grid grid-cols-2 md:grid-cols-4 gap-2 p-3 rounded-xl border text-xs ${inner}`}>
                  <div>
                    <p className={sub}>{u.first_name} {u.last_name}</p>
                    <p className={`${sub} text-xs`}>{u.email}</p>
                  </div>
                  <div>
                    <p className={sub}>Plan</p>
                    <p className="font-medium capitalize">{u.subscription_plan}</p>
                  </div>
                  <div>
                    <p className={sub}>Status</p>
                    <span className={`px-1.5 py-0.5 rounded capitalize ${
                      u.subscription_status === 'active' ? 'bg-emerald-500/15 text-emerald-600' :
                      u.subscription_status === 'trial'  ? 'bg-amber-500/15 text-amber-600' :
                      'bg-rose-500/15 text-rose-500'
                    }`}>{u.subscription_status}</span>
                  </div>
                  <div>
                    <p className={sub}>Trial ends</p>
                    <p className="font-medium">{fmtDate(u.trial_end_date)}</p>
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
};

export default StaffUsers;
