import React, { useState, useEffect } from 'react';
import SuperAdminLayout from '../../../components/SuperAdminLayout';
import { 
  Settings as SettingsIcon,
  Save,
  DollarSign,
  Globe,
  Shield,
  Mail,
  Database,
  Bell,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useTheme } from '../../../contexts/ThemeContext';

export default function Settings() {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [message, setMessage] = useState({ type: '', text: '' });

  // General Settings
  const [generalSettings, setGeneralSettings] = useState({
    site_name: '',
    site_url: '',
    admin_email: '',
    timezone: '',
    date_format: '',
    items_per_page: 15
  });

  // Currency Settings
  const [currencySettings, setCurrencySettings] = useState({
    default_currency: 'NGN',
    currency_symbol: '₦',
    currency_position: 'before',
    decimal_separator: '.',
    thousand_separator: ',',
    decimal_places: 2
  });

  // Email Settings
  const [emailSettings, setEmailSettings] = useState({
    smtp_host: '',
    smtp_port: '',
    smtp_username: '',
    smtp_password: '',
    smtp_encryption: 'tls',
    from_email: '',
    from_name: ''
  });

  // Security Settings
  const [securitySettings, setSecuritySettings] = useState({
    session_timeout: 30,
    password_min_length: 8,
    require_special_char: true,
    max_login_attempts: 5,
    two_factor_auth: false,
    ip_whitelist_enabled: false
  });

  // Subscription Settings
  const [subscriptionSettings, setSubscriptionSettings] = useState({
    free_trial_days: 14,
    allow_downgrades: true,
    auto_suspend_on_failure: true,
    grace_period_days: 3,
    reminder_days_before_expiry: 7
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost/FirmaFlow/superadmin/api/settings.php', {
        method: 'GET',
        credentials: 'include',
      });

      const data = await response.json();
      
      if (data.success) {
        if (data.settings.general) setGeneralSettings(data.settings.general);
        if (data.settings.currency) setCurrencySettings(data.settings.currency);
        if (data.settings.email) setEmailSettings(data.settings.email);
        if (data.settings.security) setSecuritySettings(data.settings.security);
        if (data.settings.subscription) setSubscriptionSettings(data.settings.subscription);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (category) => {
    try {
      setSaving(true);
      const settingsData = {
        general: category === 'general' ? generalSettings : null,
        currency: category === 'currency' ? currencySettings : null,
        email: category === 'email' ? emailSettings : null,
        security: category === 'security' ? securitySettings : null,
        subscription: category === 'subscription' ? subscriptionSettings : null
      };

      const response = await fetch('http://localhost/FirmaFlow/superadmin/api/settings.php', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'update',
          category,
          settings: settingsData[category]
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setMessage({ type: 'success', text: 'Settings saved successfully!' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to save settings' });
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'general', label: 'General', icon: SettingsIcon },
    { id: 'currency', label: 'Currency', icon: DollarSign },
    { id: 'email', label: 'Email', icon: Mail },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'subscription', label: 'Subscription', icon: Database }
  ];

  if (loading) {
    return (
      <SuperAdminLayout title="Settings" subtitle="Configure system settings">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p className={theme.textSecondary}>Loading settings...</p>
          </div>
        </div>
      </SuperAdminLayout>
    );
  }

  return (
    <SuperAdminLayout title="Settings" subtitle="Configure system settings">
      <div className="space-y-6">
        {/* Message Alert */}
        {message.text && (
          <div className={`p-4 rounded-lg flex items-center gap-3 ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
              : 'bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-400'
          }`}>
            {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            {message.text}
          </div>
        )}

        {/* Tabs */}
        <div className={`${theme.bgCard} rounded-xl ${theme.shadow} border ${theme.borderPrimary} overflow-hidden`}>
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 min-w-[120px] px-4 py-3 flex items-center justify-center gap-2 border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400'
                      : `border-transparent ${theme.textSecondary} hover:bg-gray-50 dark:hover:bg-gray-800`
                  }`}
                >
                  <Icon size={18} />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="p-6">
            {/* General Settings */}
            {activeTab === 'general' && (
              <div className="space-y-6">
                <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4`}>General Settings</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>
                      Site Name
                    </label>
                    <input
                      type="text"
                      value={generalSettings.site_name}
                      onChange={(e) => setGeneralSettings({...generalSettings, site_name: e.target.value})}
                      className={`w-full px-4 py-2 border ${theme.borderPrimary} rounded-lg ${theme.bgPrimary} ${theme.textPrimary} focus:outline-none focus:ring-2 focus:ring-purple-500`}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>
                      Site URL
                    </label>
                    <input
                      type="url"
                      value={generalSettings.site_url}
                      onChange={(e) => setGeneralSettings({...generalSettings, site_url: e.target.value})}
                      className={`w-full px-4 py-2 border ${theme.borderPrimary} rounded-lg ${theme.bgPrimary} ${theme.textPrimary} focus:outline-none focus:ring-2 focus:ring-purple-500`}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>
                      Admin Email
                    </label>
                    <input
                      type="email"
                      value={generalSettings.admin_email}
                      onChange={(e) => setGeneralSettings({...generalSettings, admin_email: e.target.value})}
                      className={`w-full px-4 py-2 border ${theme.borderPrimary} rounded-lg ${theme.bgPrimary} ${theme.textPrimary} focus:outline-none focus:ring-2 focus:ring-purple-500`}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>
                      Timezone
                    </label>
                    <select
                      value={generalSettings.timezone}
                      onChange={(e) => setGeneralSettings({...generalSettings, timezone: e.target.value})}
                      className={`w-full px-4 py-2 border ${theme.borderPrimary} rounded-lg ${theme.bgPrimary} ${theme.textPrimary} focus:outline-none focus:ring-2 focus:ring-purple-500`}
                    >
                      <option value="UTC">UTC</option>
                      <option value="Africa/Lagos">Africa/Lagos</option>
                      <option value="America/New_York">America/New_York</option>
                      <option value="Europe/London">Europe/London</option>
                    </select>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>
                      Date Format
                    </label>
                    <select
                      value={generalSettings.date_format}
                      onChange={(e) => setGeneralSettings({...generalSettings, date_format: e.target.value})}
                      className={`w-full px-4 py-2 border ${theme.borderPrimary} rounded-lg ${theme.bgPrimary} ${theme.textPrimary} focus:outline-none focus:ring-2 focus:ring-purple-500`}
                    >
                      <option value="Y-m-d">YYYY-MM-DD</option>
                      <option value="d/m/Y">DD/MM/YYYY</option>
                      <option value="m/d/Y">MM/DD/YYYY</option>
                    </select>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>
                      Items Per Page
                    </label>
                    <input
                      type="number"
                      min="10"
                      max="100"
                      value={generalSettings.items_per_page}
                      onChange={(e) => setGeneralSettings({...generalSettings, items_per_page: parseInt(e.target.value)})}
                      className={`w-full px-4 py-2 border ${theme.borderPrimary} rounded-lg ${theme.bgPrimary} ${theme.textPrimary} focus:outline-none focus:ring-2 focus:ring-purple-500`}
                    />
                  </div>
                </div>

                <button
                  onClick={() => saveSettings('general')}
                  disabled={saving}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Save size={18} />
                  {saving ? 'Saving...' : 'Save General Settings'}
                </button>
              </div>
            )}

            {/* Currency Settings */}
            {activeTab === 'currency' && (
              <div className="space-y-6">
                <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4`}>Currency Settings</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>
                      Default Currency
                    </label>
                    <select
                      value={currencySettings.default_currency}
                      onChange={(e) => setCurrencySettings({...currencySettings, default_currency: e.target.value})}
                      className={`w-full px-4 py-2 border ${theme.borderPrimary} rounded-lg ${theme.bgPrimary} ${theme.textPrimary} focus:outline-none focus:ring-2 focus:ring-purple-500`}
                    >
                      <option value="NGN">Nigerian Naira (NGN)</option>
                      <option value="USD">US Dollar (USD)</option>
                      <option value="EUR">Euro (EUR)</option>
                      <option value="GBP">British Pound (GBP)</option>
                    </select>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>
                      Currency Symbol
                    </label>
                    <input
                      type="text"
                      value={currencySettings.currency_symbol}
                      onChange={(e) => setCurrencySettings({...currencySettings, currency_symbol: e.target.value})}
                      className={`w-full px-4 py-2 border ${theme.borderPrimary} rounded-lg ${theme.bgPrimary} ${theme.textPrimary} focus:outline-none focus:ring-2 focus:ring-purple-500`}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>
                      Currency Position
                    </label>
                    <select
                      value={currencySettings.currency_position}
                      onChange={(e) => setCurrencySettings({...currencySettings, currency_position: e.target.value})}
                      className={`w-full px-4 py-2 border ${theme.borderPrimary} rounded-lg ${theme.bgPrimary} ${theme.textPrimary} focus:outline-none focus:ring-2 focus:ring-purple-500`}
                    >
                      <option value="before">Before Amount (₦100)</option>
                      <option value="after">After Amount (100₦)</option>
                    </select>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>
                      Decimal Places
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="4"
                      value={currencySettings.decimal_places}
                      onChange={(e) => setCurrencySettings({...currencySettings, decimal_places: parseInt(e.target.value)})}
                      className={`w-full px-4 py-2 border ${theme.borderPrimary} rounded-lg ${theme.bgPrimary} ${theme.textPrimary} focus:outline-none focus:ring-2 focus:ring-purple-500`}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>
                      Decimal Separator
                    </label>
                    <select
                      value={currencySettings.decimal_separator}
                      onChange={(e) => setCurrencySettings({...currencySettings, decimal_separator: e.target.value})}
                      className={`w-full px-4 py-2 border ${theme.borderPrimary} rounded-lg ${theme.bgPrimary} ${theme.textPrimary} focus:outline-none focus:ring-2 focus:ring-purple-500`}
                    >
                      <option value=".">Period (.)</option>
                      <option value=",">Comma (,)</option>
                    </select>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>
                      Thousand Separator
                    </label>
                    <select
                      value={currencySettings.thousand_separator}
                      onChange={(e) => setCurrencySettings({...currencySettings, thousand_separator: e.target.value})}
                      className={`w-full px-4 py-2 border ${theme.borderPrimary} rounded-lg ${theme.bgPrimary} ${theme.textPrimary} focus:outline-none focus:ring-2 focus:ring-purple-500`}
                    >
                      <option value=",">Comma (,)</option>
                      <option value=".">Period (.)</option>
                      <option value=" ">Space ( )</option>
                      <option value="">None</option>
                    </select>
                  </div>
                </div>

                <div className={`p-4 ${theme.bgAccent} rounded-lg`}>
                  <p className={`text-sm ${theme.textSecondary} mb-2`}>Preview:</p>
                  <p className={`text-2xl font-bold ${theme.textPrimary}`}>
                    {currencySettings.currency_position === 'before' 
                      ? `${currencySettings.currency_symbol}1${currencySettings.thousand_separator}234${currencySettings.decimal_separator}${Array(currencySettings.decimal_places).fill('56').join('')}`
                      : `1${currencySettings.thousand_separator}234${currencySettings.decimal_separator}${Array(currencySettings.decimal_places).fill('56').join('')}${currencySettings.currency_symbol}`
                    }
                  </p>
                </div>

                <button
                  onClick={() => saveSettings('currency')}
                  disabled={saving}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Save size={18} />
                  {saving ? 'Saving...' : 'Save Currency Settings'}
                </button>
              </div>
            )}

            {/* Email Settings */}
            {activeTab === 'email' && (
              <div className="space-y-6">
                <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4`}>Email Configuration</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>
                      SMTP Host
                    </label>
                    <input
                      type="text"
                      value={emailSettings.smtp_host}
                      onChange={(e) => setEmailSettings({...emailSettings, smtp_host: e.target.value})}
                      placeholder="smtp.gmail.com"
                      className={`w-full px-4 py-2 border ${theme.borderPrimary} rounded-lg ${theme.bgPrimary} ${theme.textPrimary} focus:outline-none focus:ring-2 focus:ring-purple-500`}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>
                      SMTP Port
                    </label>
                    <input
                      type="number"
                      value={emailSettings.smtp_port}
                      onChange={(e) => setEmailSettings({...emailSettings, smtp_port: e.target.value})}
                      placeholder="587"
                      className={`w-full px-4 py-2 border ${theme.borderPrimary} rounded-lg ${theme.bgPrimary} ${theme.textPrimary} focus:outline-none focus:ring-2 focus:ring-purple-500`}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>
                      SMTP Username
                    </label>
                    <input
                      type="text"
                      value={emailSettings.smtp_username}
                      onChange={(e) => setEmailSettings({...emailSettings, smtp_username: e.target.value})}
                      className={`w-full px-4 py-2 border ${theme.borderPrimary} rounded-lg ${theme.bgPrimary} ${theme.textPrimary} focus:outline-none focus:ring-2 focus:ring-purple-500`}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>
                      SMTP Password
                    </label>
                    <input
                      type="password"
                      value={emailSettings.smtp_password}
                      onChange={(e) => setEmailSettings({...emailSettings, smtp_password: e.target.value})}
                      className={`w-full px-4 py-2 border ${theme.borderPrimary} rounded-lg ${theme.bgPrimary} ${theme.textPrimary} focus:outline-none focus:ring-2 focus:ring-purple-500`}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>
                      Encryption
                    </label>
                    <select
                      value={emailSettings.smtp_encryption}
                      onChange={(e) => setEmailSettings({...emailSettings, smtp_encryption: e.target.value})}
                      className={`w-full px-4 py-2 border ${theme.borderPrimary} rounded-lg ${theme.bgPrimary} ${theme.textPrimary} focus:outline-none focus:ring-2 focus:ring-purple-500`}
                    >
                      <option value="tls">TLS</option>
                      <option value="ssl">SSL</option>
                      <option value="none">None</option>
                    </select>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>
                      From Email
                    </label>
                    <input
                      type="email"
                      value={emailSettings.from_email}
                      onChange={(e) => setEmailSettings({...emailSettings, from_email: e.target.value})}
                      className={`w-full px-4 py-2 border ${theme.borderPrimary} rounded-lg ${theme.bgPrimary} ${theme.textPrimary} focus:outline-none focus:ring-2 focus:ring-purple-500`}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>
                      From Name
                    </label>
                    <input
                      type="text"
                      value={emailSettings.from_name}
                      onChange={(e) => setEmailSettings({...emailSettings, from_name: e.target.value})}
                      placeholder="FirmaFlow"
                      className={`w-full px-4 py-2 border ${theme.borderPrimary} rounded-lg ${theme.bgPrimary} ${theme.textPrimary} focus:outline-none focus:ring-2 focus:ring-purple-500`}
                    />
                  </div>
                </div>

                <button
                  onClick={() => saveSettings('email')}
                  disabled={saving}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Save size={18} />
                  {saving ? 'Saving...' : 'Save Email Settings'}
                </button>
              </div>
            )}

            {/* Security Settings */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4`}>Security Configuration</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>
                      Session Timeout (minutes)
                    </label>
                    <input
                      type="number"
                      min="5"
                      max="1440"
                      value={securitySettings.session_timeout}
                      onChange={(e) => setSecuritySettings({...securitySettings, session_timeout: parseInt(e.target.value)})}
                      className={`w-full px-4 py-2 border ${theme.borderPrimary} rounded-lg ${theme.bgPrimary} ${theme.textPrimary} focus:outline-none focus:ring-2 focus:ring-purple-500`}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>
                      Minimum Password Length
                    </label>
                    <input
                      type="number"
                      min="6"
                      max="32"
                      value={securitySettings.password_min_length}
                      onChange={(e) => setSecuritySettings({...securitySettings, password_min_length: parseInt(e.target.value)})}
                      className={`w-full px-4 py-2 border ${theme.borderPrimary} rounded-lg ${theme.bgPrimary} ${theme.textPrimary} focus:outline-none focus:ring-2 focus:ring-purple-500`}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>
                      Max Login Attempts
                    </label>
                    <input
                      type="number"
                      min="3"
                      max="10"
                      value={securitySettings.max_login_attempts}
                      onChange={(e) => setSecuritySettings({...securitySettings, max_login_attempts: parseInt(e.target.value)})}
                      className={`w-full px-4 py-2 border ${theme.borderPrimary} rounded-lg ${theme.bgPrimary} ${theme.textPrimary} focus:outline-none focus:ring-2 focus:ring-purple-500`}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border ${theme.borderPrimary} rounded-lg">
                    <div>
                      <p className={`font-medium ${theme.textPrimary}`}>Require Special Character</p>
                      <p className={`text-sm ${theme.textSecondary}`}>In passwords</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={securitySettings.require_special_char}
                        onChange={(e) => setSecuritySettings({...securitySettings, require_special_char: e.target.checked})}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 border ${theme.borderPrimary} rounded-lg">
                    <div>
                      <p className={`font-medium ${theme.textPrimary}`}>Two-Factor Authentication</p>
                      <p className={`text-sm ${theme.textSecondary}`}>Enable 2FA for all users</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={securitySettings.two_factor_auth}
                        onChange={(e) => setSecuritySettings({...securitySettings, two_factor_auth: e.target.checked})}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 border ${theme.borderPrimary} rounded-lg">
                    <div>
                      <p className={`font-medium ${theme.textPrimary}`}>IP Whitelist</p>
                      <p className={`text-sm ${theme.textSecondary}`}>Restrict access by IP</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={securitySettings.ip_whitelist_enabled}
                        onChange={(e) => setSecuritySettings({...securitySettings, ip_whitelist_enabled: e.target.checked})}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
                    </label>
                  </div>
                </div>

                <button
                  onClick={() => saveSettings('security')}
                  disabled={saving}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Save size={18} />
                  {saving ? 'Saving...' : 'Save Security Settings'}
                </button>
              </div>
            )}

            {/* Subscription Settings */}
            {activeTab === 'subscription' && (
              <div className="space-y-6">
                <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4`}>Subscription Configuration</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>
                      Free Trial Days
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="90"
                      value={subscriptionSettings.free_trial_days}
                      onChange={(e) => setSubscriptionSettings({...subscriptionSettings, free_trial_days: parseInt(e.target.value)})}
                      className={`w-full px-4 py-2 border ${theme.borderPrimary} rounded-lg ${theme.bgPrimary} ${theme.textPrimary} focus:outline-none focus:ring-2 focus:ring-purple-500`}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>
                      Grace Period (days)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="30"
                      value={subscriptionSettings.grace_period_days}
                      onChange={(e) => setSubscriptionSettings({...subscriptionSettings, grace_period_days: parseInt(e.target.value)})}
                      className={`w-full px-4 py-2 border ${theme.borderPrimary} rounded-lg ${theme.bgPrimary} ${theme.textPrimary} focus:outline-none focus:ring-2 focus:ring-purple-500`}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>
                      Reminder Days Before Expiry
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={subscriptionSettings.reminder_days_before_expiry}
                      onChange={(e) => setSubscriptionSettings({...subscriptionSettings, reminder_days_before_expiry: parseInt(e.target.value)})}
                      className={`w-full px-4 py-2 border ${theme.borderPrimary} rounded-lg ${theme.bgPrimary} ${theme.textPrimary} focus:outline-none focus:ring-2 focus:ring-purple-500`}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border ${theme.borderPrimary} rounded-lg">
                    <div>
                      <p className={`font-medium ${theme.textPrimary}`}>Allow Downgrades</p>
                      <p className={`text-sm ${theme.textSecondary}`}>Users can downgrade plans</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={subscriptionSettings.allow_downgrades}
                        onChange={(e) => setSubscriptionSettings({...subscriptionSettings, allow_downgrades: e.target.checked})}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 border ${theme.borderPrimary} rounded-lg md:col-span-2">
                    <div>
                      <p className={`font-medium ${theme.textPrimary}`}>Auto-Suspend on Payment Failure</p>
                      <p className={`text-sm ${theme.textSecondary}`}>Automatically suspend accounts with failed payments</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={subscriptionSettings.auto_suspend_on_failure}
                        onChange={(e) => setSubscriptionSettings({...subscriptionSettings, auto_suspend_on_failure: e.target.checked})}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
                    </label>
                  </div>
                </div>

                <button
                  onClick={() => saveSettings('subscription')}
                  disabled={saving}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Save size={18} />
                  {saving ? 'Saving...' : 'Save Subscription Settings'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </SuperAdminLayout>
  );
}
