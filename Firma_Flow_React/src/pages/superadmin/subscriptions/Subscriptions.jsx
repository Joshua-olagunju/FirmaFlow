import React, { useState, useEffect, useCallback, useRef } from 'react';
import SuperAdminLayout from '../../../components/SuperAdminLayout';
import {
  CreditCard, Search, CheckCircle, XCircle, Eye, DollarSign,
  TrendingUp, Calendar, Building2, X, ChevronLeft, ChevronRight,
  RefreshCw, Pencil, Percent, AlertCircle, MoreVertical,
} from 'lucide-react';
import { useTheme } from '../../../contexts/ThemeContext';

const API_BASE = 'http://localhost/FirmaFlow';
const fmt = (n) => n != null ? Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00';
const fmtDate = (d) => d ? new Date(d).toLocaleDateString() : '';

const planColor = (p) => ({
  free: 'bg-slate-100 text-slate-600', trial: 'bg-amber-100 text-amber-700',
  starter: 'bg-sky-100 text-sky-700', professional: 'bg-violet-100 text-violet-700',
  enterprise: 'bg-orange-100 text-orange-700',
})[p] || 'bg-slate-100 text-slate-600';

const statusColor = (s) => ({
  active: 'bg-emerald-500/15 text-emerald-600', pending: 'bg-amber-500/15 text-amber-600',
  expired: 'bg-rose-500/15 text-rose-500', cancelled: 'bg-slate-100 text-slate-500',
  trial: 'bg-amber-500/15 text-amber-600',
})[s] || 'bg-slate-100 text-slate-500';

export default function Subscriptions() {
  const { theme } = useTheme();
  const dk = theme === 'dark';

  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  /* modals */
  const [detailModal, setDetailModal] = useState(null);
  const [pricingModal, setPricingModal] = useState(null);
  const [discountModal, setDiscountModal] = useState(null);
  const [pricingForm, setPricingForm] = useState({ new_amount: '', billing_cycle: 'monthly', plan: '' });
  const [discountForm, setDiscountForm] = useState({ discount_percent: '' });
  const [saving, setSaving] = useState(false);

  const [toast, setToast] = useState(null);
  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); };

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

  const card    = dk ? 'bg-slate-800 border-slate-700'    : 'bg-white border-slate-200';
  const inner   = dk ? 'bg-slate-700/50 border-slate-600' : 'bg-slate-50 border-slate-200';
  const sub     = dk ? 'text-slate-400'                   : 'text-slate-500';
  const textMain= dk ? 'text-white'                       : 'text-slate-900';
  const rowHov  = dk ? 'hover:bg-slate-700/40'            : 'hover:bg-slate-50';
  const borderR = dk ? 'border-slate-700'                 : 'border-slate-100';
  const inputCls = `w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${
    dk ? 'bg-slate-800 border-slate-600 text-white placeholder:text-slate-500' : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400'
  }`;

  /*  fetch  */
  const fetchSubs = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({
        page: currentPage, limit: 15, search: searchTerm,
        status: statusFilter !== 'all' ? statusFilter : '',
        plan: planFilter !== 'all' ? planFilter : '',
      });
      const r = await fetch(`${API_BASE}/superadmin/api/subscriptions.php?action=list&${p}`, { credentials: 'include' });
      const d = await r.json();
      if (d.success) {
        setSubs(d.subscriptions || []);
        setTotalPages(d.pagination?.total_pages || 1);
        setTotalCount(d.pagination?.total_count || 0);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [currentPage, statusFilter, planFilter, searchTerm]);

  useEffect(() => { fetchSubs(); }, [fetchSubs]);

  /*  view detail  */
  const viewDetail = async (id) => {
    try {
      const r = await fetch(`${API_BASE}/superadmin/api/subscriptions.php?action=get_subscription&id=${id}`, { credentials: 'include' });
      const d = await r.json();
      if (d.success) setDetailModal(d.subscription);
    } catch { showToast('Failed to load details', 'error'); }
  };

  /*  confirm / reject  */
  const confirmPayment = async (id) => {
    try {
      const r = await fetch(`${API_BASE}/superadmin/api/subscriptions.php`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'confirm_payment', subscription_id: id }),
      });
      const d = await r.json();
      if (d.success) { showToast('Payment confirmed'); fetchSubs(); }
      else showToast(d.message || 'Failed', 'error');
    } catch { showToast('Request failed', 'error'); }
  };

  const rejectPayment = async (id) => {
    try {
      const r = await fetch(`${API_BASE}/superadmin/api/subscriptions.php`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject_payment', subscription_id: id }),
      });
      const d = await r.json();
      if (d.success) { showToast('Payment rejected'); fetchSubs(); }
      else showToast(d.message || 'Failed', 'error');
    } catch { showToast('Request failed', 'error'); }
  };

  /*  update pricing  */
  const openPricingModal = (s) => {
    setPricingModal(s);
    setPricingForm({ new_amount: s.amount || '', billing_cycle: s.billing_cycle || 'monthly', plan: s.subscription_plan || '' });
  };

  const savePricing = async () => {
    if (!pricingModal) return;
    setSaving(true);
    try {
      const r = await fetch(`${API_BASE}/superadmin/api/subscriptions.php`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_pricing',
          company_id: pricingModal.company_id,
          new_amount: parseFloat(pricingForm.new_amount),
          billing_cycle: pricingForm.billing_cycle,
          plan: pricingForm.plan,
        }),
      });
      const d = await r.json();
      if (d.success) { showToast('Pricing updated'); setPricingModal(null); fetchSubs(); }
      else showToast(d.message || 'Failed', 'error');
    } catch { showToast('Request failed', 'error'); }
    finally { setSaving(false); }
  };

  /*  apply discount  */
  const openDiscountModal = (s) => { setDiscountModal(s); setDiscountForm({ discount_percent: '' }); };

  const saveDiscount = async () => {
    if (!discountModal) return;
    setSaving(true);
    try {
      const r = await fetch(`${API_BASE}/superadmin/api/subscriptions.php`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'apply_discount',
          company_id: discountModal.company_id,
          discount_percent: parseFloat(discountForm.discount_percent),
        }),
      });
      const d = await r.json();
      if (d.success) { showToast(d.message || 'Discount applied'); setDiscountModal(null); fetchSubs(); }
      else showToast(d.message || 'Failed', 'error');
    } catch { showToast('Request failed', 'error'); }
    finally { setSaving(false); }
  };

  /*  stats  */
  const totalRevenue = subs.reduce((acc, s) => acc + parseFloat(s.amount || 0), 0);
  const STATS = [
    { l: 'Total',    v: totalCount,                                              color: 'text-indigo-600',  bg: dk ? 'bg-indigo-500/15' : 'bg-indigo-50', Icon: CreditCard   },
    { l: 'Active',   v: subs.filter(s => s.status === 'active').length,          color: 'text-emerald-600', bg: dk ? 'bg-emerald-500/15' : 'bg-emerald-50', Icon: CheckCircle },
    { l: 'Pending',  v: subs.filter(s => s.status === 'pending').length,         color: 'text-amber-600',   bg: dk ? 'bg-amber-500/15' : 'bg-amber-50',     Icon: AlertCircle },
    { l: 'Revenue',  v: '' + fmt(totalRevenue),                                 color: 'text-violet-600',  bg: dk ? 'bg-violet-500/15' : 'bg-violet-50',   Icon: TrendingUp  },
  ];

  /*  */
  return (
    <SuperAdminLayout title="Subscriptions" subtitle="Billing, plans and payment management">
      <div className="space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {STATS.map(({ l, v, color, bg, Icon }) => (
            <div key={l} className={`flex items-center gap-3 p-4 rounded-2xl border ${card}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${bg}`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <div>
                <p className={`text-xs ${sub}`}>{l}</p>
                <p className={`text-xl font-bold ${color}`}>{v}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className={`p-4 rounded-2xl border ${card}`}>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${sub}`} />
              <input type="text" placeholder="Search by company or reference" value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchSubs()}
                className={`${inputCls} pl-9`} />
            </div>
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }} className={inputCls + ' sm:w-40'}>
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="expired">Expired</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select value={planFilter} onChange={(e) => { setPlanFilter(e.target.value); setCurrentPage(1); }} className={inputCls + ' sm:w-44'}>
              <option value="all">All Plans</option>
              <option value="starter">Starter</option>
              <option value="professional">Professional</option>
              <option value="enterprise">Enterprise</option>
            </select>
            <button onClick={fetchSubs} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors">
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
                      <th className="hidden lg:table-cell px-4 py-3 text-right">Amount</th>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="hidden sm:table-cell px-4 py-3 text-left">Expires</th>
                      <th className="px-4 py-3 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${borderR}`}>
                    {subs.length === 0 ? (
                      <tr><td colSpan={6} className={`text-center py-16 ${sub}`}>
                        <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p>No subscriptions found</p>
                      </td></tr>
                    ) : subs.map((s) => (
                      <tr key={s.id} className={`transition-colors ${rowHov}`}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                              {s.company_name?.[0]?.toUpperCase()}
                            </div>
                            <div>
                              <p className={`font-medium ${textMain}`}>{s.company_name}</p>
                              <p className={`text-xs truncate max-w-[140px] ${sub}`}>{s.transaction_reference}</p>
                            </div>
                          </div>
                        </td>
                        <td className="hidden md:table-cell px-4 py-3">
                          <span className={`capitalize px-2 py-0.5 rounded-full text-xs font-medium ${planColor(s.subscription_plan)}`}>
                            {s.subscription_plan || ''}
                          </span>
                        </td>
                        <td className={`hidden lg:table-cell px-4 py-3 text-right font-semibold ${textMain}`}>
                          {fmt(s.amount)}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`capitalize px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(s.status)}`}>
                            {s.status || ''}
                          </span>
                        </td>
                        <td className={`hidden sm:table-cell px-4 py-3 text-xs ${sub}`}>
                          {fmtDate(s.ends_at || s.subscription_end_date)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="relative" ref={openMenu === s.id ? menuRef : null}>
                            <button
                              onClick={() => setOpenMenu(openMenu === s.id ? null : s.id)}
                              className={`p-1.5 rounded-lg transition-colors ${
                                dk ? 'text-slate-400 hover:bg-slate-700 hover:text-white' : 'text-slate-500 hover:bg-slate-100'
                              }`}>
                              <MoreVertical className="w-4 h-4" />
                            </button>
                            {openMenu === s.id && (
                              <div className={`absolute right-0 top-full mt-1 w-48 rounded-xl border shadow-xl z-50 py-1 ${
                                dk ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
                              }`}>
                                <button onClick={() => { viewDetail(s.id); setOpenMenu(null); }}
                                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors ${
                                    dk ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-700 hover:bg-slate-50'
                                  }`}>
                                  <Eye className="w-3.5 h-3.5 text-indigo-400" /> View Details
                                </button>
                                {s.status === 'pending' && (<>
                                  <button onClick={() => { confirmPayment(s.id); setOpenMenu(null); }}
                                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors ${
                                      dk ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-700 hover:bg-slate-50'
                                    }`}>
                                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Confirm Payment
                                  </button>
                                  <button onClick={() => { rejectPayment(s.id); setOpenMenu(null); }}
                                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors ${
                                      dk ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-700 hover:bg-slate-50'
                                    }`}>
                                    <XCircle className="w-3.5 h-3.5 text-rose-400" /> Reject Payment
                                  </button>
                                </>)}
                                <div className={`my-1 border-t ${ dk ? 'border-slate-700' : 'border-slate-100' }`} />
                                <button onClick={() => { openPricingModal(s); setOpenMenu(null); }}
                                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors ${
                                    dk ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-700 hover:bg-slate-50'
                                  }`}>
                                  <Pencil className="w-3.5 h-3.5 text-amber-400" /> Edit Pricing
                                </button>
                                <button onClick={() => { openDiscountModal(s); setOpenMenu(null); }}
                                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors ${
                                    dk ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-700 hover:bg-slate-50'
                                  }`}>
                                  <Percent className="w-3.5 h-3.5 text-violet-400" /> Apply Discount
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

              {totalPages > 1 && (
                <div className={`flex items-center justify-between px-4 py-3 border-t ${borderR}`}>
                  <span className={`text-xs ${sub}`}>{totalCount} subscriptions</span>
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

      {/*  Detail Modal  */}
      {detailModal && (
        <Modal title="Subscription Details" sub={detailModal.company_name} onClose={() => setDetailModal(null)} dk={dk} card={card}>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              ['Plan', detailModal.subscription_plan],
              ['Status', detailModal.status],
              ['Amount', '' + fmt(detailModal.amount)],
              ['Billing cycle', detailModal.billing_cycle || ''],
              ['Created', fmtDate(detailModal.created_at)],
              ['Expires', fmtDate(detailModal.ends_at || detailModal.subscription_end_date)],
              ['Transaction ref.', detailModal.transaction_reference],
              ['Payment method', detailModal.payment_method || ''],
            ].map(([label, value]) => (
              <div key={label} className={`p-3 rounded-xl border ${inner}`}>
                <p className={`text-xs ${sub}`}>{label}</p>
                <p className={`font-medium capitalize ${textMain}`}>{value || ''}</p>
              </div>
            ))}
          </div>
          {detailModal.status === 'pending' && (
            <div className="flex gap-3 mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
              <button onClick={() => { confirmPayment(detailModal.id); setDetailModal(null); }}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700">
                <CheckCircle className="w-4 h-4" /> Confirm Payment
              </button>
              <button onClick={() => { rejectPayment(detailModal.id); setDetailModal(null); }}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-rose-600 text-white text-sm font-medium hover:bg-rose-700">
                <XCircle className="w-4 h-4" /> Reject Payment
              </button>
            </div>
          )}
        </Modal>
      )}

      {/*  Pricing Modal  */}
      {pricingModal && (
        <Modal title="Edit Pricing" sub={pricingModal.company_name} onClose={() => setPricingModal(null)} dk={dk} card={card}>
          <div className="space-y-4">
            <div>
              <label className={`block text-xs font-medium mb-1 ${sub}`}>New Monthly Amount ()</label>
              <input type="number" min="0" step="0.01" value={pricingForm.new_amount}
                onChange={(e) => setPricingForm(p => ({ ...p, new_amount: e.target.value }))}
                className={inputCls} placeholder="e.g. 5000" />
            </div>
            <div>
              <label className={`block text-xs font-medium mb-1 ${sub}`}>Plan</label>
              <select value={pricingForm.plan}
                onChange={(e) => setPricingForm(p => ({ ...p, plan: e.target.value }))}
                className={inputCls}>
                <option value="">Keep current</option>
                <option value="free">Free</option>
                <option value="trial">Trial</option>
                <option value="starter">Starter</option>
                <option value="professional">Professional</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
            <div>
              <label className={`block text-xs font-medium mb-1 ${sub}`}>Billing Cycle</label>
              <select value={pricingForm.billing_cycle}
                onChange={(e) => setPricingForm(p => ({ ...p, billing_cycle: e.target.value }))}
                className={inputCls}>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="annually">Annually</option>
              </select>
            </div>
            <button onClick={savePricing} disabled={saving}
              className="w-full py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-60">
              {saving ? 'Saving' : 'Update Pricing'}
            </button>
          </div>
        </Modal>
      )}

      {/*  Discount Modal  */}
      {discountModal && (
        <Modal title="Apply Discount" sub={discountModal.company_name} onClose={() => setDiscountModal(null)} dk={dk} card={card}>
          <div className="space-y-4">
            <div className={`p-3 rounded-xl border text-sm ${inner}`}>
              <p className={sub}>Current amount</p>
              <p className={`font-bold text-lg ${textMain}`}>{fmt(discountModal.amount)}</p>
            </div>
            <div>
              <label className={`block text-xs font-medium mb-1 ${sub}`}>Discount Percentage (%)</label>
              <input type="number" min="0" max="100" step="1" value={discountForm.discount_percent}
                onChange={(e) => setDiscountForm({ discount_percent: e.target.value })}
                className={inputCls} placeholder="e.g. 20" />
              {discountForm.discount_percent && (
                <p className={`text-xs mt-1 ${sub}`}>
                  New amount: {fmt(parseFloat(discountModal.amount) * (1 - parseFloat(discountForm.discount_percent) / 100))}
                </p>
              )}
            </div>
            <button onClick={saveDiscount} disabled={saving}
              className="w-full py-2.5 rounded-xl bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 transition-colors disabled:opacity-60">
              {saving ? 'Applying' : 'Apply Discount'}
            </button>
          </div>
        </Modal>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-5 right-5 px-5 py-3 rounded-xl shadow-2xl text-white text-sm font-medium z-[70] max-w-xs ${
          toast.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'
        }`}>{toast.msg}</div>
      )}
    </SuperAdminLayout>
  );
}

function Modal({ title, sub, onClose, dk, card, children }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`w-full max-w-md rounded-2xl border shadow-2xl ${card}`}>
        <div className={`flex items-center justify-between px-5 py-4 border-b ${dk ? 'border-slate-700' : 'border-slate-200'}`}>
          <div>
            <p className={`font-bold text-sm ${dk ? 'text-white' : 'text-slate-900'}`}>{title}</p>
            {sub && <p className={`text-xs ${dk ? 'text-slate-400' : 'text-slate-500'}`}>{sub}</p>}
          </div>
          <button onClick={onClose} className={`p-1.5 rounded-lg ${dk ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}>
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
