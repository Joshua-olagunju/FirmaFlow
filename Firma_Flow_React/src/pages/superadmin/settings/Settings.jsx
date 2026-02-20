import React, { useState, useEffect, useCallback } from 'react';
import SuperAdminLayout from '../../../components/SuperAdminLayout';
import {
  Settings as SettingsIcon, Save, DollarSign, Shield, Mail, Database,
  CheckCircle, AlertCircle, Trash2, Plus, RefreshCw, UserCog, Eye, EyeOff,
  Megaphone, Users2, Wrench, BellRing, CreditCard, Zap, Globe,
  AlertTriangle, Package, Server,
} from 'lucide-react';
import { useTheme } from '../../../contexts/ThemeContext';

const API = 'http://localhost/FirmaFlow/superadmin/api';

export default function Settings() {
  const { theme } = useTheme();
  const dk = theme === 'dark';
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [msg, setMsg] = useState({ type: '', text: '' });

  const [generalSettings, setGeneralSettings] = useState({ site_name: '', site_url: '', admin_email: '', timezone: '', date_format: '', items_per_page: 15 });
  const [currencySettings, setCurrencySettings] = useState({ default_currency: 'NGN', currency_symbol: '', currency_position: 'before', decimal_separator: '.', thousand_separator: ',', decimal_places: 2 });
  const [emailSettings, setEmailSettings] = useState({ smtp_host: '', smtp_port: '', smtp_username: '', smtp_password: '', smtp_encryption: 'tls', from_email: '', from_name: '' });
  const [securitySettings, setSecuritySettings] = useState({ session_timeout: 30, password_min_length: 8, require_special_char: true, max_login_attempts: 5, two_factor_auth: false, ip_whitelist_enabled: false });
  const [subscriptionSettings, setSubscriptionSettings] = useState({ free_trial_days: 14, allow_downgrades: true, auto_suspend_on_failure: true, grace_period_days: 3, reminder_days_before_expiry: 7, require_payment_proof: true, send_expiry_reminders: true });
  const [maintenanceSettings, setMaintenanceSettings] = useState({ maintenance_mode: false, maintenance_message: 'System is under maintenance. Please check back later.', debug_mode: false, log_errors: true, api_rate_limit: 100, allow_superadmin_access: true });
  const [plansSettings, setPlansSettings] = useState({ starter_price: 5000, starter_users: 5, starter_storage: 1, professional_price: 15000, professional_users: 20, professional_storage: 10, enterprise_price: 50000, enterprise_users: 100, enterprise_storage: 100, trial_days: 14, currency: 'NGN' });
  const [notifSettings, setNotifSettings] = useState({ notify_new_company: true, notify_payment_received: true, notify_subscription_expired: true, notify_trial_ending: true, notify_failed_payment: true, notify_support_ticket: true, notify_new_user: false, admin_digest_frequency: 'daily' });

  const [announcements, setAnnouncements] = useState([]);
  const [annLoading, setAnnLoading] = useState(false);
  const [annForm, setAnnForm] = useState({ message: '', type: 'info', target: 'all', expires_at: '' });
  const [annSaving, setAnnSaving] = useState(false);

  const [staffList, setStaffList] = useState([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const [staffModal, setStaffModal] = useState(null);
  const [staffForm, setStaffForm] = useState({ username: '', email: '', password: '', role: 'staff' });
  const [showPwd, setShowPwd] = useState(false);
  const [staffSaving, setStaffSaving] = useState(false);

  const card  = dk ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200';
  const inner = dk ? 'bg-slate-700/40 border-slate-600' : 'bg-slate-50 border-slate-200';
  const textM = dk ? 'text-white' : 'text-slate-900';
  const sub   = dk ? 'text-slate-400' : 'text-slate-500';
  const inp   = dk ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400';
  const focus = 'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent';
  const rowHov = dk ? 'hover:bg-slate-700/40' : 'hover:bg-slate-50';

  const flash = (type, text) => { setMsg({ type, text }); setTimeout(() => setMsg({ type: '', text: '' }), 3500); };

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const r = await fetch(API + '/settings.php', { credentials: 'include' });
        const d = await r.json();
        if (d.success) {
          if (d.settings?.general)       setGeneralSettings(p => ({ ...p, ...d.settings.general }));
          if (d.settings?.currency)      setCurrencySettings(p => ({ ...p, ...d.settings.currency }));
          if (d.settings?.email)         setEmailSettings(p => ({ ...p, ...d.settings.email }));
          if (d.settings?.security)      setSecuritySettings(p => ({ ...p, ...d.settings.security }));
          if (d.settings?.subscription)  setSubscriptionSettings(p => ({ ...p, ...d.settings.subscription }));
          if (d.settings?.maintenance)   setMaintenanceSettings(p => ({ ...p, ...d.settings.maintenance }));
          if (d.settings?.plans)         setPlansSettings(p => ({ ...p, ...d.settings.plans }));
          if (d.settings?.notifications) setNotifSettings(p => ({ ...p, ...d.settings.notifications }));
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  const saveSettings = async (category) => {
    try {
      setSaving(true);
      const map = { general: generalSettings, currency: currencySettings, email: emailSettings, security: securitySettings, subscription: subscriptionSettings, maintenance: maintenanceSettings, plans: plansSettings, notifications: notifSettings };
      const r = await fetch(API + '/settings.php', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update', category, settings: map[category] }),
      });
      const d = await r.json();
      if (d.success) flash('success', 'Settings saved!');
      else flash('error', d.message || 'Failed to save');
    } catch (e) { flash('error', 'Network error'); }
    finally { setSaving(false); }
  };

  const loadAnnouncements = useCallback(async () => {
    setAnnLoading(true);
    try {
      const r = await fetch(API + '/announcements.php?action=list', { credentials: 'include' });
      const d = await r.json();
      if (d.success) setAnnouncements(d.data || []);
    } catch (e) { console.error(e); }
    finally { setAnnLoading(false); }
  }, []);

  useEffect(() => { if (activeTab === 'announcements') loadAnnouncements(); }, [activeTab, loadAnnouncements]);

  const createAnnouncement = async () => {
    if (!annForm.message.trim()) { flash('error', 'Message is required'); return; }
    setAnnSaving(true);
    try {
      const r = await fetch(API + '/announcements.php', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', ...annForm }),
      });
      const d = await r.json();
      if (d.success) { flash('success', 'Announcement broadcast!'); setAnnForm({ message: '', type: 'info', target: 'all', expires_at: '' }); loadAnnouncements(); }
      else flash('error', d.message);
    } catch (e) { flash('error', 'Network error'); }
    finally { setAnnSaving(false); }
  };

  const toggleAnn = async (id) => {
    try { const r = await fetch(API + '/announcements.php', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'toggle', id }) }); const d = await r.json(); if (d.success) loadAnnouncements(); } catch (e) { console.error(e); }
  };

  const deleteAnn = async (id) => {
    if (!confirm('Delete this announcement?')) return;
    try { const r = await fetch(API + '/announcements.php', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'delete', id }) }); const d = await r.json(); if (d.success) loadAnnouncements(); } catch (e) { console.error(e); }
  };

  const loadStaff = useCallback(async () => {
    setStaffLoading(true);
    try { const r = await fetch(API + '/staff.php', { credentials: 'include' }); const d = await r.json(); setStaffList(Array.isArray(d.data) ? d.data : (Array.isArray(d) ? d : [])); } catch (e) { console.error(e); }
    finally { setStaffLoading(false); }
  }, []);

  useEffect(() => { if (activeTab === 'administrators') loadStaff(); }, [activeTab, loadStaff]);

  const openCreate = () => { setStaffForm({ username: '', email: '', password: '', role: 'staff' }); setStaffModal('create'); };
  const openEdit   = (s)  => { setStaffForm({ username: s.username||'', email: s.email||'', password: '', role: s.role||'staff' }); setStaffModal(s); };

  const saveStaff = async () => {
    if (!staffForm.username || !staffForm.email) { flash('error', 'Username and email required'); return; }
    if (staffModal === 'create' && !staffForm.password) { flash('error', 'Password required for new admin'); return; }
    setStaffSaving(true);
    try {
      const isCreate = staffModal === 'create';
      const body = isCreate ? { ...staffForm } : { id: staffModal.id, ...staffForm };
      if (!body.password) delete body.password;
      const r = await fetch(API + '/staff.php', { method: isCreate ? 'POST' : 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const d = await r.json();
      if (d.success) { flash('success', isCreate ? 'Admin created!' : 'Admin updated!'); setStaffModal(null); loadStaff(); }
      else flash('error', d.message || 'Failed');
    } catch (e) { flash('error', 'Network error'); }
    finally { setStaffSaving(false); }
  };

  const deleteStaff = async (id) => {
    if (!confirm('Remove this administrator?')) return;
    try { const r = await fetch(API + '/staff.php', { method: 'DELETE', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) }); const d = await r.json(); if (d.success) loadStaff(); else flash('error', d.message); } catch (e) { flash('error', 'Network error'); }
  };

  const TABS = [
    { id: 'general',        label: 'General',        Icon: SettingsIcon },
    { id: 'currency',       label: 'Currency',        Icon: DollarSign   },
    { id: 'email',          label: 'Email',           Icon: Mail         },
    { id: 'security',       label: 'Security',        Icon: Shield       },
    { id: 'plans',          label: 'Plans & Pricing', Icon: CreditCard   },
    { id: 'subscription',   label: 'Subscription',    Icon: Database     },
    { id: 'notifications',  label: 'Notifications',   Icon: BellRing     },
    { id: 'maintenance',    label: 'Maintenance',      Icon: Wrench       },
    { id: 'announcements',  label: 'Announcements',   Icon: Megaphone    },
    { id: 'administrators', label: 'Administrators',  Icon: UserCog      },
  ];

  const Field = ({ label, children }) => (<div><label className={'block text-xs font-medium mb-1.5 ' + sub}>{label}</label>{children}</div>);
  const Input = ({ value, onChange, type='text', placeholder='', min, max }) => (<input type={type} value={value} onChange={onChange} placeholder={placeholder} min={min} max={max} className={'w-full px-3 py-2 text-sm rounded-xl border ' + inp + ' ' + focus + ' transition-colors'} />);
  const Select = ({ value, onChange, children }) => (<select value={value} onChange={onChange} className={'w-full px-3 py-2 text-sm rounded-xl border ' + inp + ' ' + focus + ' transition-colors'}>{children}</select>);
  const Toggle = ({ label, desc, checked, onChange }) => (
    <div className={'flex items-center justify-between p-3 rounded-xl border ' + (dk ? 'border-slate-700 bg-slate-700/30' : 'border-slate-200 bg-slate-50')}>
      <div><p className={'text-sm font-medium ' + textM}>{label}</p>{desc && <p className={'text-xs ' + sub}>{desc}</p>}</div>
      <label className="relative inline-flex items-center cursor-pointer ml-3 shrink-0">
        <input type="checkbox" checked={checked} onChange={onChange} className="sr-only peer" />
        <div className="w-10 h-5 bg-slate-300 dark:bg-slate-600 peer-focus:ring-2 peer-focus:ring-indigo-500 rounded-full peer peer-checked:after:translate-x-5 peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600" />
      </label>
    </div>
  );
  const SaveBtn = ({ label, onClick }) => (<button onClick={onClick} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50"><Save className="w-4 h-4" />{saving ? 'Saving...' : (label || 'Save Changes')}</button>);
  const SectionTitle = ({ title, desc }) => (<div className="mb-5"><h3 className={'text-base font-semibold ' + textM}>{title}</h3>{desc && <p className={'text-sm mt-0.5 ' + sub}>{desc}</p>}</div>);

  const annTypeColor = { info:'text-blue-600', warning:'text-amber-600', success:'text-emerald-600', error:'text-rose-600' };
  const annTypeBg   = { info: dk?'bg-blue-500/15 border-blue-500/30':'bg-blue-50 border-blue-200', warning:dk?'bg-amber-500/15 border-amber-500/30':'bg-amber-50 border-amber-200', success:dk?'bg-emerald-500/15 border-emerald-500/30':'bg-emerald-50 border-emerald-200', error:dk?'bg-rose-500/15 border-rose-500/30':'bg-rose-50 border-rose-200' };

  if (loading) {
    return (
      <SuperAdminLayout title="Settings" subtitle="Configure system settings">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto mb-3" />
            <p className={sub}>Loading settings</p>
          </div>
        </div>
      </SuperAdminLayout>
    );
  }

  return (
    <SuperAdminLayout title="Settings" subtitle="Configure system settings">
      <div className="space-y-5">
        {msg.text && (
          <div className={'p-4 rounded-xl flex items-center gap-3 text-sm font-medium border ' + (msg.type==='success' ? (dk?'bg-emerald-500/15 border-emerald-500/30 text-emerald-400':'bg-emerald-50 border-emerald-200 text-emerald-700') : (dk?'bg-rose-500/15 border-rose-500/30 text-rose-400':'bg-rose-50 border-rose-200 text-rose-700'))}>
            {msg.type==='success' ? <CheckCircle className="w-4 h-4 shrink-0"/> : <AlertCircle className="w-4 h-4 shrink-0"/>} {msg.text}
          </div>
        )}

        {maintenanceSettings.maintenance_mode && (
          <div className={'p-4 rounded-xl flex items-center gap-3 text-sm font-medium border ' + (dk?'bg-amber-500/15 border-amber-500/30 text-amber-400':'bg-amber-50 border-amber-200 text-amber-700')}>
            <AlertTriangle className="w-4 h-4 shrink-0"/> Maintenance mode is <strong className="mx-1">ACTIVE</strong>. Users cannot access the platform.
          </div>
        )}

        <div className={'rounded-2xl border ' + card + ' overflow-hidden'}>
          <div className={'flex overflow-x-auto border-b ' + (dk?'border-slate-700':'border-slate-200')}>
            {TABS.map(({id,label,Icon}) => (
              <button key={id} onClick={() => setActiveTab(id)}
                className={'flex-shrink-0 flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors ' + (activeTab===id ? 'border-indigo-500 text-indigo-600' : 'border-transparent ' + sub + ' ' + rowHov)}>
                <Icon className="w-4 h-4"/><span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>

          <div className="p-6">

            {activeTab==='general' && (
              <div className="space-y-5">
                <SectionTitle title="General Settings" desc="Core platform identity and regional preferences" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Site Name"><Input value={generalSettings.site_name} onChange={e=>setGeneralSettings({...generalSettings,site_name:e.target.value})}/></Field>
                  <Field label="Site URL"><Input type="url" value={generalSettings.site_url} onChange={e=>setGeneralSettings({...generalSettings,site_url:e.target.value})}/></Field>
                  <Field label="Admin Email"><Input type="email" value={generalSettings.admin_email} onChange={e=>setGeneralSettings({...generalSettings,admin_email:e.target.value})}/></Field>
                  <Field label="Timezone"><Select value={generalSettings.timezone} onChange={e=>setGeneralSettings({...generalSettings,timezone:e.target.value})}><option value="UTC">UTC</option><option value="Africa/Lagos">Africa/Lagos</option><option value="America/New_York">America/New_York</option><option value="Europe/London">Europe/London</option></Select></Field>
                  <Field label="Date Format"><Select value={generalSettings.date_format} onChange={e=>setGeneralSettings({...generalSettings,date_format:e.target.value})}><option value="Y-m-d">YYYY-MM-DD</option><option value="d/m/Y">DD/MM/YYYY</option><option value="m/d/Y">MM/DD/YYYY</option></Select></Field>
                  <Field label="Items Per Page"><Input type="number" min="10" max="100" value={generalSettings.items_per_page} onChange={e=>setGeneralSettings({...generalSettings,items_per_page:+e.target.value})}/></Field>
                  <Field label="Support Email"><Input type="email" value={generalSettings.support_email||''} onChange={e=>setGeneralSettings({...generalSettings,support_email:e.target.value})}/></Field>
                  <Field label="Support Phone"><Input value={generalSettings.phone||''} placeholder="+234..." onChange={e=>setGeneralSettings({...generalSettings,phone:e.target.value})}/></Field>
                  <Field label="Office Address"><Input value={generalSettings.address||''} placeholder="Street, City, Country" onChange={e=>setGeneralSettings({...generalSettings,address:e.target.value})}/></Field>
                </div>
                <SaveBtn label="Save General Settings" onClick={()=>saveSettings('general')}/>
              </div>
            )}

            {activeTab==='currency' && (
              <div className="space-y-5">
                <SectionTitle title="Currency Settings" desc="Platform-wide currency and number formatting" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Default Currency"><Select value={currencySettings.default_currency} onChange={e=>setCurrencySettings({...currencySettings,default_currency:e.target.value})}><option value="NGN">Nigerian Naira (NGN)</option><option value="USD">US Dollar (USD)</option><option value="EUR">Euro (EUR)</option><option value="GBP">British Pound (GBP)</option></Select></Field>
                  <Field label="Currency Symbol"><Input value={currencySettings.currency_symbol} onChange={e=>setCurrencySettings({...currencySettings,currency_symbol:e.target.value})}/></Field>
                  <Field label="Currency Position"><Select value={currencySettings.currency_position} onChange={e=>setCurrencySettings({...currencySettings,currency_position:e.target.value})}><option value="before">Before (100)</option><option value="after">After (100)</option></Select></Field>
                  <Field label="Decimal Places"><Input type="number" min="0" max="4" value={currencySettings.decimal_places} onChange={e=>setCurrencySettings({...currencySettings,decimal_places:+e.target.value})}/></Field>
                  <Field label="Decimal Separator"><Select value={currencySettings.decimal_separator} onChange={e=>setCurrencySettings({...currencySettings,decimal_separator:e.target.value})}><option value=".">Period (.)</option><option value=",">Comma (,)</option></Select></Field>
                  <Field label="Thousand Separator"><Select value={currencySettings.thousand_separator} onChange={e=>setCurrencySettings({...currencySettings,thousand_separator:e.target.value})}><option value=",">Comma (,)</option><option value=".">Period (.)</option><option value=" ">Space</option><option value="">None</option></Select></Field>
                </div>
                <div className={'p-4 rounded-xl border ' + (dk?'bg-slate-700/40 border-slate-600':'bg-slate-50 border-slate-200')}>
                  <p className={'text-xs ' + sub + ' mb-1'}>Preview</p>
                  <p className={'text-2xl font-bold ' + textM}>{currencySettings.currency_position==='before' ? currencySettings.currency_symbol+'1'+currencySettings.thousand_separator+'234'+currencySettings.decimal_separator+'56' : '1'+currencySettings.thousand_separator+'234'+currencySettings.decimal_separator+'56'+currencySettings.currency_symbol}</p>
                </div>
                <SaveBtn label="Save Currency Settings" onClick={()=>saveSettings('currency')}/>
              </div>
            )}

            {activeTab==='email' && (
              <div className="space-y-5">
                <SectionTitle title="Email / SMTP Configuration" desc="Outgoing email server settings" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="SMTP Host"><Input value={emailSettings.smtp_host} placeholder="smtp.gmail.com" onChange={e=>setEmailSettings({...emailSettings,smtp_host:e.target.value})}/></Field>
                  <Field label="SMTP Port"><Input type="number" value={emailSettings.smtp_port} placeholder="587" onChange={e=>setEmailSettings({...emailSettings,smtp_port:e.target.value})}/></Field>
                  <Field label="SMTP Username"><Input value={emailSettings.smtp_username} onChange={e=>setEmailSettings({...emailSettings,smtp_username:e.target.value})}/></Field>
                  <Field label="SMTP Password"><Input type="password" value={emailSettings.smtp_password} onChange={e=>setEmailSettings({...emailSettings,smtp_password:e.target.value})}/></Field>
                  <Field label="Encryption"><Select value={emailSettings.smtp_encryption} onChange={e=>setEmailSettings({...emailSettings,smtp_encryption:e.target.value})}><option value="tls">TLS</option><option value="ssl">SSL</option><option value="none">None</option></Select></Field>
                  <Field label="From Email"><Input type="email" value={emailSettings.from_email} onChange={e=>setEmailSettings({...emailSettings,from_email:e.target.value})}/></Field>
                  <Field label="From Name"><Input value={emailSettings.from_name} placeholder="FirmaFlow" onChange={e=>setEmailSettings({...emailSettings,from_name:e.target.value})}/></Field>
                </div>
                <SaveBtn label="Save Email Settings" onClick={()=>saveSettings('email')}/>
              </div>
            )}

            {activeTab==='security' && (
              <div className="space-y-5">
                <SectionTitle title="Security Configuration" desc="Authentication, passwords, and access controls" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Session Timeout (min)"><Input type="number" min="5" max="1440" value={securitySettings.session_timeout} onChange={e=>setSecuritySettings({...securitySettings,session_timeout:+e.target.value})}/></Field>
                  <Field label="Min Password Length"><Input type="number" min="6" max="32" value={securitySettings.password_min_length} onChange={e=>setSecuritySettings({...securitySettings,password_min_length:+e.target.value})}/></Field>
                  <Field label="Max Login Attempts"><Input type="number" min="3" max="10" value={securitySettings.max_login_attempts} onChange={e=>setSecuritySettings({...securitySettings,max_login_attempts:+e.target.value})}/></Field>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                  <Toggle label="Require Special Character" desc="In passwords" checked={securitySettings.require_special_char} onChange={e=>setSecuritySettings({...securitySettings,require_special_char:e.target.checked})}/>
                  <Toggle label="Two-Factor Authentication" desc="Require 2FA for all users" checked={securitySettings.two_factor_auth} onChange={e=>setSecuritySettings({...securitySettings,two_factor_auth:e.target.checked})}/>
                  <Toggle label="IP Whitelist" desc="Restrict admin access by IP" checked={securitySettings.ip_whitelist_enabled} onChange={e=>setSecuritySettings({...securitySettings,ip_whitelist_enabled:e.target.checked})}/>
                  <Toggle label="Auto-Logout Inactive Users" desc="Log out after session timeout" checked={securitySettings.auto_logout_inactive||false} onChange={e=>setSecuritySettings({...securitySettings,auto_logout_inactive:e.target.checked})}/>
                  <Toggle label="Force HTTPS" desc="Redirect all HTTP to HTTPS" checked={securitySettings.force_https||false} onChange={e=>setSecuritySettings({...securitySettings,force_https:e.target.checked})}/>
                </div>
                <SaveBtn label="Save Security Settings" onClick={()=>saveSettings('security')}/>
              </div>
            )}

            {activeTab==='plans' && (
              <div className="space-y-6">
                <SectionTitle title="Plans & Pricing" desc="Define subscription plan prices, user limits and storage quotas" />
                {[{key:'starter',label:'Starter',col:'sky'},{key:'professional',label:'Professional',col:'violet'},{key:'enterprise',label:'Enterprise',col:'orange'}].map(({key,label,col}) => (
                  <div key={key} className={'p-5 rounded-2xl border ' + (dk?`bg-${col}-500/10 border-${col}-500/30`:`bg-${col}-50 border-${col}-200`)}>
                    <div className="flex items-center gap-2 mb-4">
                      <Package className={`w-5 h-5 text-${col}-500`}/>
                      <h4 className={'font-semibold ' + textM}>{label} Plan</h4>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <Field label={'Monthly Price (' + plansSettings.currency + ')'}><Input type="number" min="0" step="100" value={plansSettings[key+'_price']} onChange={e=>setPlansSettings({...plansSettings,[key+'_price']:+e.target.value})}/></Field>
                      <Field label="Max Users"><Input type="number" min="1" value={plansSettings[key+'_users']} onChange={e=>setPlansSettings({...plansSettings,[key+'_users']:+e.target.value})}/></Field>
                      <Field label="Storage (GB)"><Input type="number" min="1" value={plansSettings[key+'_storage']} onChange={e=>setPlansSettings({...plansSettings,[key+'_storage']:+e.target.value})}/></Field>
                    </div>
                  </div>
                ))}
                <div className={'p-4 rounded-xl border grid grid-cols-1 sm:grid-cols-2 gap-4 ' + inner}>
                  <Field label="Free Trial Duration (days)"><Input type="number" min="0" max="90" value={plansSettings.trial_days} onChange={e=>setPlansSettings({...plansSettings,trial_days:+e.target.value})}/></Field>
                  <Field label="Pricing Currency"><select value={plansSettings.currency} onChange={e=>setPlansSettings({...plansSettings,currency:e.target.value})} className={'w-full px-3 py-2 text-sm rounded-xl border '+inp+' '+focus+' transition-colors'}><option value="NGN">NGN - Nigerian Naira</option><option value="USD">USD - US Dollar</option><option value="GBP">GBP - British Pound</option><option value="EUR">EUR - Euro</option></select></Field>
                </div>
                <SaveBtn label="Save Plans & Pricing" onClick={()=>saveSettings('plans')}/>
              </div>
            )}

            {activeTab==='subscription' && (
              <div className="space-y-5">
                <SectionTitle title="Subscription Management" desc="Control billing behaviour, trial periods and expiry rules" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Free Trial Days"><Input type="number" min="0" max="90" value={subscriptionSettings.free_trial_days} onChange={e=>setSubscriptionSettings({...subscriptionSettings,free_trial_days:+e.target.value})}/></Field>
                  <Field label="Grace Period (days)"><Input type="number" min="0" max="30" value={subscriptionSettings.grace_period_days} onChange={e=>setSubscriptionSettings({...subscriptionSettings,grace_period_days:+e.target.value})}/></Field>
                  <Field label="Reminder Days Before Expiry"><Input type="number" min="1" max="30" value={subscriptionSettings.reminder_days_before_expiry} onChange={e=>setSubscriptionSettings({...subscriptionSettings,reminder_days_before_expiry:+e.target.value})}/></Field>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                  <Toggle label="Allow Plan Downgrades" desc="Users can switch to lower plans" checked={subscriptionSettings.allow_downgrades} onChange={e=>setSubscriptionSettings({...subscriptionSettings,allow_downgrades:e.target.checked})}/>
                  <Toggle label="Auto-Suspend on Failure" desc="Suspend accounts on failed payments" checked={subscriptionSettings.auto_suspend_on_failure} onChange={e=>setSubscriptionSettings({...subscriptionSettings,auto_suspend_on_failure:e.target.checked})}/>
                  <Toggle label="Require Payment Proof Upload" desc="Users must upload bank transfer proof" checked={subscriptionSettings.require_payment_proof||false} onChange={e=>setSubscriptionSettings({...subscriptionSettings,require_payment_proof:e.target.checked})}/>
                  <Toggle label="Send Expiry Reminder Emails" desc="Automated reminder emails before expiry" checked={subscriptionSettings.send_expiry_reminders||false} onChange={e=>setSubscriptionSettings({...subscriptionSettings,send_expiry_reminders:e.target.checked})}/>
                </div>
                <SaveBtn label="Save Subscription Settings" onClick={()=>saveSettings('subscription')}/>
              </div>
            )}

            {activeTab==='notifications' && (
              <div className="space-y-5">
                <SectionTitle title="Admin Notification Preferences" desc="Choose which events trigger email alerts to administrators" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Toggle label="New Company Registration" desc="When a new company signs up" checked={notifSettings.notify_new_company} onChange={e=>setNotifSettings({...notifSettings,notify_new_company:e.target.checked})}/>
                  <Toggle label="Payment Received" desc="When a subscription payment is confirmed" checked={notifSettings.notify_payment_received} onChange={e=>setNotifSettings({...notifSettings,notify_payment_received:e.target.checked})}/>
                  <Toggle label="Subscription Expired" desc="When a company subscription expires" checked={notifSettings.notify_subscription_expired} onChange={e=>setNotifSettings({...notifSettings,notify_subscription_expired:e.target.checked})}/>
                  <Toggle label="Trial Ending Soon" desc="When a trial is 3 days from ending" checked={notifSettings.notify_trial_ending} onChange={e=>setNotifSettings({...notifSettings,notify_trial_ending:e.target.checked})}/>
                  <Toggle label="Failed Payment Alert" desc="When a payment attempt fails" checked={notifSettings.notify_failed_payment} onChange={e=>setNotifSettings({...notifSettings,notify_failed_payment:e.target.checked})}/>
                  <Toggle label="New Support Ticket" desc="When a support ticket is opened" checked={notifSettings.notify_support_ticket} onChange={e=>setNotifSettings({...notifSettings,notify_support_ticket:e.target.checked})}/>
                  <Toggle label="New User Account" desc="When any user registers" checked={notifSettings.notify_new_user} onChange={e=>setNotifSettings({...notifSettings,notify_new_user:e.target.checked})}/>
                </div>
                <Field label="Admin Digest Email Frequency">
                  <select value={notifSettings.admin_digest_frequency} onChange={e=>setNotifSettings({...notifSettings,admin_digest_frequency:e.target.value})} className={'w-full px-3 py-2 text-sm rounded-xl border '+inp+' '+focus+' transition-colors'}>
                    <option value="realtime">Real-time (immediately)</option>
                    <option value="hourly">Hourly</option>
                    <option value="daily">Daily digest</option>
                    <option value="weekly">Weekly digest</option>
                    <option value="never">Never / Disabled</option>
                  </select>
                </Field>
                <SaveBtn label="Save Notification Settings" onClick={()=>saveSettings('notifications')}/>
              </div>
            )}

            {activeTab==='maintenance' && (
              <div className="space-y-5">
                <SectionTitle title="Maintenance & System" desc="Maintenance mode, logging, and diagnostics" />
                <div className={'p-5 rounded-2xl border-2 ' + (maintenanceSettings.maintenance_mode ? (dk?'bg-amber-500/10 border-amber-500/40':'bg-amber-50 border-amber-300') : (dk?'bg-slate-700/30 border-slate-600':'bg-slate-50 border-slate-200'))}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className={'w-10 h-10 rounded-xl flex items-center justify-center ' + (maintenanceSettings.maintenance_mode?'bg-amber-500/20':(dk?'bg-slate-600':'bg-slate-200'))}>
                        <Wrench className={'w-5 h-5 ' + (maintenanceSettings.maintenance_mode?'text-amber-500':sub)}/>
                      </div>
                      <div>
                        <p className={'font-semibold ' + textM}>Maintenance Mode</p>
                        <p className={'text-xs ' + sub}>Disables user access to the platform</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                      <input type="checkbox" checked={maintenanceSettings.maintenance_mode} onChange={e=>setMaintenanceSettings({...maintenanceSettings,maintenance_mode:e.target.checked})} className="sr-only peer"/>
                      <div className="w-12 h-6 bg-slate-300 dark:bg-slate-600 peer-focus:ring-2 peer-focus:ring-amber-500 rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"/>
                    </label>
                  </div>
                  {maintenanceSettings.maintenance_mode && (
                    <div className="mt-4">
                      <Field label="Maintenance Message (shown to users)">
                        <textarea rows={3} value={maintenanceSettings.maintenance_message} onChange={e=>setMaintenanceSettings({...maintenanceSettings,maintenance_message:e.target.value})} className={'w-full px-3 py-2 text-sm rounded-xl border resize-none '+inp+' '+focus+' transition-colors'}/>
                      </Field>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="API Rate Limit (requests / minute)"><Input type="number" min="10" max="1000" value={maintenanceSettings.api_rate_limit} onChange={e=>setMaintenanceSettings({...maintenanceSettings,api_rate_limit:+e.target.value})}/></Field>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Toggle label="Debug Mode" desc="Show detailed error messages (disable in production)" checked={maintenanceSettings.debug_mode} onChange={e=>setMaintenanceSettings({...maintenanceSettings,debug_mode:e.target.checked})}/>
                  <Toggle label="Error Logging" desc="Write errors to server log files" checked={maintenanceSettings.log_errors} onChange={e=>setMaintenanceSettings({...maintenanceSettings,log_errors:e.target.checked})}/>
                  <Toggle label="SuperAdmin Access During Maintenance" desc="Admins can still log in during maintenance" checked={maintenanceSettings.allow_superadmin_access} onChange={e=>setMaintenanceSettings({...maintenanceSettings,allow_superadmin_access:e.target.checked})}/>
                </div>
                <div className={'p-4 rounded-2xl border ' + inner}>
                  <p className={'text-xs font-semibold uppercase tracking-wider mb-3 ' + sub}>System Info</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[{label:'PHP',value:'8.x',Icon:Server},{label:'MySQL',value:'8.x',Icon:Database},{label:'React',value:'18.x',Icon:Zap},{label:'Platform',value:'XAMPP',Icon:Globe}].map(({label,value,Icon}) => (
                      <div key={label} className={'flex items-center gap-2 p-3 rounded-xl border ' + (dk?'bg-slate-700/50 border-slate-600':'bg-white border-slate-200')}>
                        <Icon className={'w-4 h-4 shrink-0 ' + sub}/>
                        <div><p className={'text-xs ' + sub}>{label}</p><p className={'text-sm font-medium ' + textM}>{value}</p></div>
                      </div>
                    ))}
                  </div>
                </div>
                <SaveBtn label="Save Maintenance Settings" onClick={()=>saveSettings('maintenance')}/>
              </div>
            )}

            {activeTab==='announcements' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className={'text-base font-semibold ' + textM}>Global Announcements</h3>
                  <button onClick={loadAnnouncements} disabled={annLoading} className={'flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-xl border transition-colors ' + (dk?'border-slate-600 text-slate-300 hover:bg-slate-700':'border-slate-200 text-slate-600 hover:bg-slate-100')}>
                    <RefreshCw className={'w-3 h-3 ' + (annLoading?'animate-spin':'')}/> Refresh
                  </button>
                </div>
                <div className={'p-5 rounded-2xl border-2 ' + (dk?'bg-indigo-500/10 border-indigo-500/30':'bg-indigo-50 border-indigo-200')}>
                  <div className="flex items-center gap-2 mb-4"><Megaphone className="w-5 h-5 text-indigo-500"/><p className={'text-sm font-semibold ' + textM}>Create & Broadcast Announcement</p></div>
                  <div className="space-y-3">
                    <Field label="Message">
                      <textarea rows={3} value={annForm.message} onChange={e=>setAnnForm({...annForm,message:e.target.value})} placeholder="Type your announcement" className={'w-full px-3 py-2 text-sm rounded-xl border resize-none ' + inp + ' ' + focus + ' transition-colors'}/>
                    </Field>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <Field label="Type"><Select value={annForm.type} onChange={e=>setAnnForm({...annForm,type:e.target.value})}><option value="info">Info</option><option value="warning">Warning</option><option value="success">Success</option><option value="error">Alert</option></Select></Field>
                      <Field label="Target"><Select value={annForm.target} onChange={e=>setAnnForm({...annForm,target:e.target.value})}><option value="all">All Users</option><option value="companies">Companies</option><option value="superadmin">Admins Only</option></Select></Field>
                      <Field label="Expires At (optional)"><Input type="datetime-local" value={annForm.expires_at} onChange={e=>setAnnForm({...annForm,expires_at:e.target.value})}/></Field>
                    </div>
                    <button onClick={createAnnouncement} disabled={annSaving} className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50">
                      <Megaphone className="w-4 h-4"/> {annSaving?'Broadcasting':'Broadcast Now'}
                    </button>
                  </div>
                </div>
                <div className="space-y-3">
                  {annLoading ? (
                    <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"/></div>
                  ) : announcements.length===0 ? (
                    <div className={'text-center py-12 ' + sub}><Megaphone className="w-10 h-10 mx-auto mb-2 opacity-30"/><p className="text-sm">No announcements yet</p></div>
                  ) : announcements.map(a => (
                    <div key={a.id} className={'flex items-start gap-3 p-4 rounded-xl border ' + (annTypeBg[a.type]||'')}>
                      <div className="flex-1 min-w-0">
                        <p className={'text-sm font-medium leading-relaxed ' + textM}>{a.message}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-1.5">
                          <span className={'text-xs font-semibold uppercase ' + (annTypeColor[a.type]||'')}>{a.type}</span>
                          <span className={'text-xs ' + sub}> {a.target}</span>
                          {a.expires_at && <span className={'text-xs ' + sub}>Expires: {new Date(a.expires_at).toLocaleDateString()}</span>}
                          <span className={'text-xs ' + sub}>{new Date(a.created_at).toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={()=>toggleAnn(a.id)} className={'px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ' + (a.is_active?'bg-emerald-100 text-emerald-700 hover:bg-emerald-200':'bg-slate-200 text-slate-600 hover:bg-slate-300')}>{a.is_active?'Active':'Paused'}</button>
                        <button onClick={()=>deleteAnn(a.id)} className={'p-1.5 rounded-lg transition-colors ' + (dk?'hover:bg-rose-500/20 text-rose-400':'hover:bg-rose-50 text-rose-500')}><Trash2 className="w-4 h-4"/></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab==='administrators' && (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <SectionTitle title="Administrator Accounts" desc="Manage staff who have access to this control panel" />
                  <div className="flex gap-2">
                    <button onClick={loadStaff} disabled={staffLoading} className={'flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-xl border transition-colors ' + (dk?'border-slate-600 text-slate-300 hover:bg-slate-700':'border-slate-200 text-slate-600 hover:bg-slate-100')}><RefreshCw className={'w-3 h-3 '+(staffLoading?'animate-spin':'')}/> Refresh</button>
                    <button onClick={openCreate} className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors"><Plus className="w-3 h-3"/> Add Admin</button>
                  </div>
                </div>
                {staffLoading ? (
                  <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"/></div>
                ) : staffList.length===0 ? (
                  <div className={'text-center py-12 ' + sub}><Users2 className="w-10 h-10 mx-auto mb-2 opacity-30"/><p className="text-sm">No administrators found</p></div>
                ) : (
                  <div className={'rounded-2xl border overflow-hidden ' + card}>
                    <table className="w-full text-sm">
                      <thead><tr className={dk?'bg-slate-700/50':'bg-slate-50'}>{['Username','Email','Role','Status','Actions'].map(h=><th key={h} className={'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider '+sub}>{h}</th>)}</tr></thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                        {staffList.map(s=>(
                          <tr key={s.id} className={rowHov+' transition-colors'}>
                            <td className={'px-4 py-3 font-medium '+textM}>{s.username}</td>
                            <td className={'px-4 py-3 '+sub}>{s.email}</td>
                            <td className="px-4 py-3"><span className={'px-2 py-0.5 rounded-full text-xs font-medium '+(s.role==='superadmin'?'bg-violet-100 text-violet-700':'bg-slate-100 text-slate-700')}>{s.role||'staff'}</span></td>
                            <td className="px-4 py-3"><span className={'px-2 py-0.5 rounded-full text-xs font-medium '+(s.is_active==1||s.status==='active'?'bg-emerald-100 text-emerald-700':'bg-slate-200 text-slate-600')}>{s.is_active==1||s.status==='active'?'Active':'Inactive'}</span></td>
                            <td className="px-4 py-3"><div className="flex gap-1">
                              <button onClick={()=>openEdit(s)} className={'p-1.5 rounded-lg transition-colors '+(dk?'hover:bg-indigo-500/20 text-indigo-400':'hover:bg-indigo-50 text-indigo-600')}><UserCog className="w-4 h-4"/></button>
                              <button onClick={()=>deleteStaff(s.id)} className={'p-1.5 rounded-lg transition-colors '+(dk?'hover:bg-rose-500/20 text-rose-400':'hover:bg-rose-50 text-rose-500')}><Trash2 className="w-4 h-4"/></button>
                            </div></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>

      {staffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={()=>setStaffModal(null)}/>
          <div className={'relative w-full max-w-md rounded-2xl border shadow-2xl p-6 '+card}>
            <h3 className={'text-base font-bold mb-5 '+textM}>{staffModal==='create'?'Add Administrator':'Edit: '+staffModal.username}</h3>
            <div className="space-y-4">
              <Field label="Username"><Input value={staffForm.username} onChange={e=>setStaffForm({...staffForm,username:e.target.value})}/></Field>
              <Field label="Email"><Input type="email" value={staffForm.email} onChange={e=>setStaffForm({...staffForm,email:e.target.value})}/></Field>
              <Field label={staffModal==='create'?'Password':'New Password (blank = keep current)'}>
                <div className="relative">
                  <input type={showPwd?'text':'password'} value={staffForm.password} onChange={e=>setStaffForm({...staffForm,password:e.target.value})} className={'w-full px-3 py-2 pr-10 text-sm rounded-xl border '+inp+' '+focus+' transition-colors'}/>
                  <button onClick={()=>setShowPwd(!showPwd)} className={'absolute right-2.5 top-1/2 -translate-y-1/2 '+sub}>{showPwd?<EyeOff className="w-4 h-4"/>:<Eye className="w-4 h-4"/>}</button>
                </div>
              </Field>
              <Field label="Role"><Select value={staffForm.role} onChange={e=>setStaffForm({...staffForm,role:e.target.value})}><option value="staff">Staff</option><option value="superadmin">Super Admin</option></Select></Field>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={()=>setStaffModal(null)} className={'flex-1 py-2.5 rounded-xl text-sm font-medium border transition-colors '+(dk?'border-slate-600 text-slate-300 hover:bg-slate-700':'border-slate-200 text-slate-600 hover:bg-slate-100')}>Cancel</button>
              <button onClick={saveStaff} disabled={staffSaving} className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50">{staffSaving?'Saving':(staffModal==='create'?'Create Admin':'Save Changes')}</button>
            </div>
          </div>
        </div>
      )}

    </SuperAdminLayout>
  );
}