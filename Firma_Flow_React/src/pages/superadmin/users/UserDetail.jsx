import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SuperAdminLayout from '../../../components/SuperAdminLayout';
import { useTheme } from '../../../contexts/ThemeContext';
import {
  ArrowLeft, Building2, Users, ShoppingCart, Truck, FileText,
  CreditCard, Star, ToggleLeft, ToggleRight, Trash2, Lock,
  Mail, Phone, Globe, MapPin, Calendar, RefreshCw, AlertTriangle,
} from 'lucide-react';

/* ── Tab config ─────────────────────────────────────────────────────────── */
const TABS = [
  { key: 'overview',     label: 'Overview',     icon: Building2    },
  { key: 'users',        label: 'Users',        icon: Users        },
  { key: 'customers',    label: 'Customers',    icon: ShoppingCart },
  { key: 'vendors',      label: 'Vendors',      icon: Truck        },
  { key: 'transactions', label: 'Transactions', icon: FileText     },
  { key: 'payments',     label: 'Payments',     icon: CreditCard   },
  { key: 'subscription', label: 'Subscription', icon: Star         },
];

/* ── Helpers ────────────────────────────────────────────────────────────── */
const fmt     = (n) => n != null ? Number(n).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2}) : '—';
const fmtDate = (d) => d ? new Date(d).toLocaleDateString() : '—';

/* ════════════════════════════════════════════════════════════════════════ */
export default function UserDetail() {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const { theme }  = useTheme();
  const dk         = theme === 'dark';

  /* ── State ─────────────────────────────────────────────────────────── */
  const [user,       setUser]       = useState(null);
  const [activeTab,  setActiveTab]  = useState('overview');
  const [tabData,    setTabData]    = useState({});
  const [tabLoading, setTabLoading] = useState(false);
  const [userLoading,setUserLoading]= useState(true);
  const [error,      setError]      = useState(null);
  const [toast,      setToast]      = useState(null);
  const [confirmDel, setConfirmDel] = useState(false);

  /* ── Colours matching SuperAdmin theme ─────────────────────────────── */
  const card   = dk ? 'bg-slate-800 border-slate-700'  : 'bg-white border-slate-200';
  const inner  = dk ? 'bg-slate-700/60 border-slate-600' : 'bg-slate-50 border-slate-200';
  const sub    = dk ? 'text-slate-400' : 'text-slate-500';
  const borderRow = dk ? 'border-slate-700' : 'border-slate-100';

  /* ── Toast helper ───────────────────────────────────────────────────── */
  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  /* ── Fetch the user record (to get company_id) ─────────────────────── */
  useEffect(() => {
    fetchUser();
  }, [id]);

  const fetchUser = async () => {
    setUserLoading(true);
    setError(null);
    try {
      // id from route is the company_id (Users page lists companies)
      const r = await fetch(
        `http://localhost/FirmaFlow/superadmin/api/user_detail.php?company_id=${id}`,
        { credentials: 'include' }
      );
      const d = await r.json();
      if (d.success && d.company) {
        const co = d.company;
        // Primary admin user in the company
        const primaryUser = co.users?.find((u) => u.role === 'admin') || co.users?.[0] || {};
        setUser({
          id:           primaryUser.id   || id,
          company_id:   co.id            || id,
          company_name: co.name,
          first_name:   primaryUser.first_name || co.name,
          last_name:    primaryUser.last_name  || '',
          email:        primaryUser.email      || co.email,
          phone:        primaryUser.phone      || co.phone,
          role:         primaryUser.role       || 'admin',
          is_active:    primaryUser.is_active  ?? 1,
          last_login:   primaryUser.last_login,
        });
        // Cache overview data immediately
        setTabData({ overview: d });
      } else {
        setError(d.message || 'Company not found');
      }
    } catch (e) {
      setError('Failed to load company data');
    } finally {
      setUserLoading(false);
    }
  };

  /* ── Load tab data ──────────────────────────────────────────────────── */
  const loadTab = async (tab, companyId) => {
    const cid = companyId ?? user?.company_id ?? id; // id from route IS the company_id
    if (!cid) return;
    if (tabData[tab]) return;
    setTabLoading(true);
    try {
      const url = tab === 'overview'
        ? `http://localhost/FirmaFlow/superadmin/api/user_detail.php?company_id=${cid}`
        : `http://localhost/FirmaFlow/superadmin/api/user_detail.php?company_id=${cid}&tab=${tab}`;
      const r = await fetch(url, { credentials: 'include' });
      const d = await r.json();
      if (d.success) setTabData((p) => ({ ...p, [tab]: d }));
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

  /* ── Toggle individual user ─────────────────────────────────────────── */
  const toggleUser = async (uid, current) => {
    try {
      const r = await fetch('http://localhost/FirmaFlow/superadmin/api/user_detail.php', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle_user', user_id: uid, is_active: current == 1 ? 0 : 1 }),
      });
      const d = await r.json();
      if (d.success) {
        showToast(d.message);
        // If this is the primary user being viewed
        if (uid == id) { setUser((u) => ({ ...u, is_active: current == 1 ? 0 : 1 })); }
        setTabData((p) => { const n={...p}; delete n.users; delete n.overview; return n; });
        loadTab('users');
        loadTab('overview');
      } else showToast(d.message || 'Failed', 'error');
    } catch { showToast('Request failed', 'error'); }
  };

  /* ── Toggle company ─────────────────────────────────────────────────── */
  const toggleCompany = async () => {
    if (!user?.company_id) return;
    const curActive = tabData.overview?.company?.is_active ?? 1;
    try {
      const r = await fetch('http://localhost/FirmaFlow/superadmin/api/user_detail.php', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle_company', company_id: user.company_id, is_active: curActive == 1 ? 0 : 1 }),
      });
      const d = await r.json();
      if (d.success) {
        showToast(d.message);
        setTabData((p) => { const n={...p}; delete n.overview; return n; });
        loadTab('overview');
      } else showToast(d.message || 'Failed', 'error');
    } catch { showToast('Request failed', 'error'); }
  };

  /* ── Reset password ─────────────────────────────────────────────────── */
  const resetPassword = async () => {
    try {
      const r = await fetch('http://localhost/FirmaFlow/superadmin/api/users.php', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset_password', user_id: id }),
      });
      const d = await r.json();
      if (d.success) {
        showToast(`Password reset. New password: ${d.new_password}`, 'success');
      } else showToast(d.message || 'Failed', 'error');
    } catch { showToast('Request failed', 'error'); }
  };

  /* ── Delete user ────────────────────────────────────────────────────── */
  const deleteUser = async () => {
    setConfirmDel(false);
    try {
      const r = await fetch('http://localhost/FirmaFlow/superadmin/api/user_detail.php', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete_user', user_id: id }),
      });
      const d = await r.json();
      if (d.success) {
        showToast('User deleted');
        setTimeout(() => navigate('/superadmin/users'), 1500);
      } else showToast(d.message || 'Failed', 'error');
    } catch { showToast('Request failed', 'error'); }
  };

  /* ── Loading / error ────────────────────────────────────────────────── */
  if (userLoading) {
    return (
      <SuperAdminLayout title="User Detail" subtitle="">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4" />
            <p className={sub}>Loading user…</p>
          </div>
        </div>
      </SuperAdminLayout>
    );
  }

  if (error) {
    return (
      <SuperAdminLayout title="User Detail" subtitle="">
        <div className="flex flex-col items-center justify-center h-96 gap-4">
          <AlertTriangle className="w-12 h-12 text-rose-500" />
          <p className="text-rose-500 font-medium">{error}</p>
          <button onClick={() => navigate('/superadmin/users')}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm">
            <ArrowLeft className="w-4 h-4" /> Back to Users
          </button>
        </div>
      </SuperAdminLayout>
    );
  }

  const companyActive = tabData.overview?.company?.is_active ?? 1;

  /* ─────────────────────────────────────────────────────────────────── */
  return (
    <SuperAdminLayout title="User Detail" subtitle={user?.company_name || ''}>
      <div className="space-y-6 pb-10">

        {/* Back + header row */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <button
            onClick={() => navigate('/superadmin/users')}
            className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded-xl border transition ${
              dk ? 'border-slate-700 hover:bg-slate-800' : 'border-slate-200 hover:bg-slate-100'
            }`}
          >
            <ArrowLeft className="w-4 h-4" /> Back to Users
          </button>

          <div className="flex-1" />

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2">
            <button onClick={toggleCompany}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl transition ${
                companyActive == 1
                  ? 'bg-amber-500/15 text-amber-600 hover:bg-amber-500/25'
                  : 'bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25'
              }`}
            >
              {companyActive == 1 ? <><ToggleLeft className="w-3.5 h-3.5" /> Deactivate Company</> : <><ToggleRight className="w-3.5 h-3.5" /> Activate Company</>}
            </button>
            <button onClick={() => toggleUser(id, user?.is_active)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl transition ${
                user?.is_active == 1
                  ? 'bg-rose-500/10 text-rose-500 hover:bg-rose-500/20'
                  : 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20'
              }`}
            >
              {user?.is_active == 1 ? <><ToggleLeft className="w-3.5 h-3.5" /> Deactivate User</> : <><ToggleRight className="w-3.5 h-3.5" /> Activate User</>}
            </button>
            <button onClick={resetPassword}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl bg-indigo-500/15 text-indigo-600 hover:bg-indigo-500/25 transition"
            >
              <Lock className="w-3.5 h-3.5" /> Reset Password
            </button>
            <button onClick={() => setConfirmDel(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete User
            </button>
          </div>
        </div>

        {/* User card */}
        <div className={`flex flex-col sm:flex-row items-start sm:items-center gap-4 p-5 rounded-2xl border ${card}`}>
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xl shrink-0">
            {user?.first_name?.[0]}{user?.last_name?.[0]}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold">{user?.first_name} {user?.last_name}</h1>
            <p className={`text-sm ${sub}`}>{user?.email}</p>
            <div className="flex flex-wrap gap-2 mt-1.5">
              <span className={`px-2 py-0.5 rounded-full text-xs capitalize ${
                user?.role === 'admin'   ? 'bg-rose-500/15 text-rose-600' :
                user?.role === 'manager' ? 'bg-amber-500/15 text-amber-600' :
                'bg-slate-500/15 text-slate-500'
              }`}>{user?.role}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs ${
                user?.is_active == 1 ? 'bg-emerald-500/15 text-emerald-600' : 'bg-slate-500/15 text-slate-500'
              }`}>{user?.is_active == 1 ? 'Active' : 'Inactive'}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs bg-indigo-500/15 text-indigo-600`}>{user?.company_name}</span>
            </div>
          </div>
          <div className={`text-right text-xs ${sub}`}>
            <p>Last login</p>
            <p className="font-medium">{fmtDate(user?.last_login)}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className={`rounded-2xl border overflow-hidden ${card}`}>
          {/* Tab nav */}
          <div className={`flex gap-1 px-4 py-3 border-b overflow-x-auto ${dk ? 'border-slate-700' : 'border-slate-200'}`}>
            {TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => switchTab(key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl whitespace-nowrap transition ${
                  activeTab === key
                    ? 'bg-purple-600 text-white'
                    : dk
                    ? 'text-slate-400 hover:bg-slate-700 hover:text-white'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="p-5 min-h-[300px]">
            {tabLoading && !tabData[activeTab] ? (
              <div className={`text-center py-12 text-sm ${sub}`}>Loading…</div>
            ) : (
              <TabContent
                tab={activeTab} data={tabData[activeTab]}
                dk={dk} sub={sub} inner={inner} borderRow={borderRow}
                toggleUser={toggleUser}
              />
            )}
          </div>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      {confirmDel && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-sm rounded-2xl border p-6 shadow-2xl space-y-4 ${
            dk ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'
          }`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/15 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-rose-500" />
              </div>
              <div>
                <h3 className="font-bold">Delete User</h3>
                <p className={`text-sm ${sub}`}>This action cannot be undone.</p>
              </div>
            </div>
            <p className={`text-sm ${sub}`}>
              Are you sure you want to permanently delete <strong>{user?.first_name} {user?.last_name}</strong>?
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirmDel(false)}
                className={`px-4 py-2 rounded-xl text-sm font-medium border transition ${
                  dk ? 'border-slate-700 hover:bg-slate-800' : 'border-slate-200 hover:bg-slate-100'
                }`}
              >Cancel</button>
              <button onClick={deleteUser}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-rose-500 text-white hover:bg-rose-600 transition"
              >Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-5 right-5 px-5 py-3 rounded-xl shadow-2xl text-white text-sm font-medium z-[60] max-w-xs ${
          toast.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'
        }`}>
          {toast.msg}
        </div>
      )}
    </SuperAdminLayout>
  );
}

/* ─── Tab content ─────────────────────────────────────────────────────── */
function TabContent({ tab, data, dk, sub, inner, borderRow, toggleUser }) {
  const cellSub = dk ? 'text-slate-400' : 'text-slate-500';

  if (!data) return <p className={`text-sm ${sub}`}>No data available.</p>;

  /* Overview */
  if (tab === 'overview') {
    const co = data.company;
    if (!co) return <p className={`text-sm ${sub}`}>No data.</p>;
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Users',        value: co.user_count,        color: 'text-indigo-600'  },
            { label: 'Customers',    value: co.customer_count,    color: 'text-emerald-600' },
            { label: 'Vendors',      value: co.vendor_count,      color: 'text-amber-600'   },
            { label: 'Transactions', value: co.transaction_count, color: 'text-violet-600'  },
          ].map(({ label, value, color }) => (
            <div key={label} className={`p-3 rounded-xl border ${inner}`}>
              <p className={`text-xs ${sub}`}>{label}</p>
              <p className={`text-xl font-bold ${color}`}>{value ?? 0}</p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { icon: Mail,     label: 'Email',    value: co.email   },
            { icon: Phone,    label: 'Phone',    value: co.phone   },
            { icon: Globe,    label: 'Website',  value: co.website },
            { icon: MapPin,   label: 'Address',  value: [co.city,co.state,co.country].filter(Boolean).join(', ')||co.address },
            { icon: Calendar, label: 'Joined',   value: fmtDate(co.created_at) },
            { icon: Star,     label: 'Revenue',  value: '₦'+fmt(co.total_revenue) },
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
        {co.users?.length > 0 && (
          <div>
            <p className={`text-xs font-semibold uppercase tracking-wider mb-2 ${sub}`}>All Users in Company</p>
            {co.users.map((u) => (
              <div key={u.id} className={`flex items-center justify-between p-3 rounded-xl border mb-2 ${inner}`}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
                    {u.first_name?.[0]}{u.last_name?.[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{u.first_name} {u.last_name}</p>
                    <p className={`text-xs ${cellSub}`}>{u.role} · {u.email}</p>
                  </div>
                </div>
                <button onClick={() => toggleUser(u.id, u.is_active)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                    u.is_active == 1 ? 'bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/30' : 'bg-slate-500/15 text-slate-500 hover:bg-slate-500/25'
                  }`}
                >
                  {u.is_active == 1 ? <><ToggleRight className="w-3.5 h-3.5"/>Active</> : <><ToggleLeft className="w-3.5 h-3.5"/>Inactive</>}
                </button>
              </div>
            ))}
          </div>
        )}
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
          <div key={u.id} className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border ${inner}`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                {u.first_name?.[0]}{u.last_name?.[0]}
              </div>
              <div>
                <p className="font-medium text-sm">{u.first_name} {u.last_name}</p>
                <p className={`text-xs ${cellSub}`}>{u.email}</p>
                <div className="flex gap-2 mt-1 flex-wrap">
                  <span className={`px-1.5 py-0.5 rounded text-xs capitalize ${u.role==='admin'?'bg-rose-500/15 text-rose-600':u.role==='manager'?'bg-amber-500/15 text-amber-600':'bg-slate-500/15 text-slate-500'}`}>{u.role}</span>
                  <span className={`px-1.5 py-0.5 rounded text-xs ${u.is_active==1?'bg-emerald-500/15 text-emerald-600':'bg-slate-500/15 text-slate-500'}`}>{u.is_active==1?'Active':'Inactive'}</span>
                </div>
              </div>
            </div>
            <button onClick={() => toggleUser(u.id, u.is_active)}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition ${
                u.is_active==1?'bg-rose-500/10 text-rose-500 hover:bg-rose-500/20':'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20'
              }`}
            >
              {u.is_active==1 ? <><ToggleLeft className="w-3.5 h-3.5"/>Deactivate</> : <><ToggleRight className="w-3.5 h-3.5"/>Activate</>}
            </button>
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
          <thead><tr className={`text-left text-xs font-medium uppercase ${sub} border-b ${borderRow}`}>
            <th className="pb-2">Name</th>
            <th className="hidden md:table-cell pb-2">Email</th>
            <th className="pb-2 text-right">Balance</th>
            <th className="pb-2">Status</th>
          </tr></thead>
          <tbody className={`divide-y ${borderRow}`}>
            {rows.map((c) => (
              <tr key={c.id}>
                <td className="py-2.5 pr-4">{c.name}</td>
                <td className={`hidden md:table-cell py-2.5 pr-4 text-xs ${cellSub}`}>{c.email||'—'}</td>
                <td className="py-2.5 pr-4 text-right">₦{fmt(c.balance)}</td>
                <td className="py-2.5"><span className={`px-1.5 py-0.5 rounded text-xs ${c.is_active==1?'bg-emerald-500/15 text-emerald-600':'bg-slate-500/15 text-slate-500'}`}>{c.is_active==1?'Active':'Inactive'}</span></td>
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
          <thead><tr className={`text-left text-xs font-medium uppercase ${sub} border-b ${borderRow}`}>
            <th className="pb-2">Name</th>
            <th className="hidden md:table-cell pb-2">Contact</th>
            <th className="pb-2 text-right">Balance</th>
            <th className="pb-2">Status</th>
          </tr></thead>
          <tbody className={`divide-y ${borderRow}`}>
            {rows.map((v) => (
              <tr key={v.id}>
                <td className="py-2.5 pr-4"><p>{v.name}</p><p className={`text-xs ${cellSub}`}>{v.email||'—'}</p></td>
                <td className={`hidden md:table-cell py-2.5 pr-4 text-xs ${cellSub}`}>{v.contact_person||v.phone||'—'}</td>
                <td className="py-2.5 pr-4 text-right">₦{fmt(v.balance)}</td>
                <td className="py-2.5"><span className={`px-1.5 py-0.5 rounded text-xs ${v.is_active==1?'bg-emerald-500/15 text-emerald-600':'bg-slate-500/15 text-slate-500'}`}>{v.is_active==1?'Active':'Inactive'}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  /* Transactions */
  if (tab === 'transactions') {
    const rows = data.transactions || [];
    if (!rows.length) return <p className={`text-sm ${sub}`}>No transactions found.</p>;
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className={`text-left text-xs font-medium uppercase ${sub} border-b ${borderRow}`}>
            <th className="pb-2">Invoice</th>
            <th className="hidden md:table-cell pb-2">Customer</th>
            <th className="pb-2">Date</th>
            <th className="pb-2 text-right">Total</th>
            <th className="pb-2">Status</th>
          </tr></thead>
          <tbody className={`divide-y ${borderRow}`}>
            {rows.map((t) => (
              <tr key={t.id}>
                <td className="py-2.5 pr-4 font-mono text-xs">{t.invoice_no}</td>
                <td className={`hidden md:table-cell py-2.5 pr-4 text-xs ${cellSub}`}>{t.customer_name||'—'}</td>
                <td className={`py-2.5 pr-4 text-xs ${cellSub}`}>{fmtDate(t.invoice_date)}</td>
                <td className="py-2.5 pr-4 text-right">₦{fmt(t.total)}</td>
                <td className="py-2.5"><span className={`px-1.5 py-0.5 rounded text-xs capitalize ${t.status==='paid'?'bg-emerald-500/15 text-emerald-600':t.status==='partially_paid'?'bg-amber-500/15 text-amber-600':t.status==='cancelled'?'bg-rose-500/15 text-rose-500':'bg-slate-500/15 text-slate-500'}`}>{t.status}</span></td>
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
          <thead><tr className={`text-left text-xs font-medium uppercase ${sub} border-b ${borderRow}`}>
            <th className="pb-2">Reference</th>
            <th className="hidden md:table-cell pb-2">Party</th>
            <th className="pb-2">Type</th>
            <th className="pb-2">Date</th>
            <th className="pb-2 text-right">Amount</th>
            <th className="pb-2">Status</th>
          </tr></thead>
          <tbody className={`divide-y ${borderRow}`}>
            {rows.map((p) => (
              <tr key={p.id}>
                <td className="py-2.5 pr-4 font-mono text-xs">{p.reference||'—'}</td>
                <td className={`hidden md:table-cell py-2.5 pr-4 text-xs ${cellSub}`}>{p.party_name||'—'}</td>
                <td className="py-2.5 pr-4"><span className={`px-1.5 py-0.5 rounded text-xs ${p.type==='received'?'bg-emerald-500/15 text-emerald-600':'bg-rose-500/15 text-rose-500'}`}>{p.type||'—'}</span></td>
                <td className={`py-2.5 pr-4 text-xs ${cellSub}`}>{fmtDate(p.payment_date)}</td>
                <td className="py-2.5 pr-4 text-right">₦{fmt(p.amount)}</td>
                <td className="py-2.5"><span className={`px-1.5 py-0.5 rounded text-xs capitalize ${p.status==='completed'?'bg-emerald-500/15 text-emerald-600':p.status==='pending'?'bg-amber-500/15 text-amber-600':'bg-rose-500/15 text-rose-500'}`}>{p.status}</span></td>
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
    return (
      <div className="space-y-5">
        <div className={`p-5 rounded-xl border ${inner} space-y-3`}>
          <div className="flex items-center justify-between">
            <p className="font-semibold">{SI.company_name}</p>
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${SI.status==='active'?'bg-emerald-500/15 text-emerald-600':SI.status==='trial'?'bg-amber-500/15 text-amber-600':'bg-rose-500/15 text-rose-500'}`}>{SI.status}</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
            {[['Plan',SI.plan],['Billing',SI.billing_cycle],['Amount',SI.amount?'₦'+fmt(SI.amount):'—'],['Start',fmtDate(SI.start_date)],['End',fmtDate(SI.end_date)],['Last payment',fmtDate(SI.last_payment_date)]]
              .map(([label,value]) => (
                <div key={label}>
                  <p className={`text-xs ${sub}`}>{label}</p>
                  <p className="font-medium capitalize">{value||'—'}</p>
                </div>
              ))}
          </div>
        </div>
        {SI.users?.length > 0 && (
          <div>
            <p className={`text-xs font-semibold uppercase tracking-wider mb-2 ${sub}`}>User Plans</p>
            <div className="space-y-2">
              {SI.users.map((u) => (
                <div key={u.id} className={`grid grid-cols-2 md:grid-cols-4 gap-2 p-3 rounded-xl border text-xs ${inner}`}>
                  <div><p className={sub}>{u.first_name} {u.last_name}</p><p className={`${sub}`}>{u.email}</p></div>
                  <div><p className={sub}>Plan</p><p className="font-medium capitalize">{u.subscription_plan}</p></div>
                  <div><p className={sub}>Status</p><span className={`px-1.5 py-0.5 rounded capitalize ${u.subscription_status==='active'?'bg-emerald-500/15 text-emerald-600':u.subscription_status==='trial'?'bg-amber-500/15 text-amber-600':'bg-rose-500/15 text-rose-500'}`}>{u.subscription_status}</span></div>
                  <div><p className={sub}>Trial ends</p><p className="font-medium">{fmtDate(u.trial_end_date)}</p></div>
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
