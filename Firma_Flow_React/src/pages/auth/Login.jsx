import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { useUser } from '../../contexts/UserContext';
import { useSuperAdmin } from '../../contexts/SuperAdminContext';
import { useTheme } from '../../contexts/ThemeContext';
import { buildApiUrl } from '../../config/api.config';

// Google SVG icon
const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useUser();
  const { checkSession } = useSuperAdmin();
  const { theme } = useTheme();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  // Success message from navigation state (e.g. after password reset)
  const successMessage = location.state?.message || '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // First try to authenticate as Super Admin/Staff
      const staffResponse = await fetch(buildApiUrl('superadmin/api/auth.php'), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', email: formData.email, password: formData.password }),
      });

      const staffData = await staffResponse.json();

      if (staffResponse.ok && staffData.success) {
        localStorage.setItem('superAdminToken', staffData.token || 'authenticated');
        localStorage.setItem('superAdminUser', JSON.stringify(staffData.user));
        try { await checkSession(); } catch (_) {}
        navigate(staffData.redirect_path || '/superadmin/dashboard');
        return;
      }

      // Try regular user/admin login
      const userResponse = await fetch(buildApiUrl('api/auth.php'), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', email: formData.email, password: formData.password }),
      });

      const userData = await userResponse.json();

      if (userResponse.ok && userData.success) {
        login(userData.user);
        navigate(userData.redirect_path || '/dashboard');
      } else {
        setError(userData.error || 'Invalid email or password. Please try again.');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    setGoogleLoading(true);
    // Google OAuth – configure GOOGLE_CLIENT_ID in your environment
    const clientId = import.meta.env?.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      setGoogleLoading(false);
      setError('Google Sign-In is not configured yet. Please use email/password login.');
      return;
    }
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: `${window.location.origin}/auth/google/callback`,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'select_account',
    });
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const isDark = theme === 'dark';

  return (
    <div className={`min-h-screen flex ${isDark ? 'bg-gray-950' : 'bg-slate-50'}`}>
      {/* Left decorative panel – hidden on small screens */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-violet-600 via-purple-600 to-blue-600 items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-10 w-64 h-64 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-80 h-80 bg-blue-300 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 text-white text-center max-w-md">
          <Link to="/" className="inline-flex items-center gap-3 mb-10">
            <img src="/firmaflow-logo.jpg" className="w-14 h-14 rounded-2xl shadow-2xl" alt="FirmaFlow" />
            <span className="text-3xl font-bold tracking-tight">FirmaFlow</span>
          </Link>
          <h1 className="text-4xl font-extrabold leading-tight mb-4">
            Manage your business finances with confidence
          </h1>
          <p className="text-purple-200 text-lg leading-relaxed">
            Invoices, expenses, payroll and full accounting — all in one beautiful platform.
          </p>
          <div className="mt-10 grid grid-cols-3 gap-6 text-center">
            {[['10K+', 'Businesses'], ['99.9%', 'Uptime'], ['24/7', 'Support']].map(([val, label]) => (
              <div key={label} className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm">
                <div className="text-2xl font-black">{val}</div>
                <div className="text-purple-200 text-sm mt-1">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Form */}
      <div className={`flex-1 flex items-center justify-center px-6 py-12 ${isDark ? 'bg-gray-950' : 'bg-white'}`}>
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2">
              <img src="/firmaflow-logo.jpg" className="w-10 h-10 rounded-xl" alt="FirmaFlow" />
              <span className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-blue-600 bg-clip-text text-transparent">FirmaFlow</span>
            </Link>
          </div>

          <div className="mb-8">
            <h2 className={`text-3xl font-extrabold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Welcome back
            </h2>
            <p className={`mt-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Sign in to your account to continue
            </p>
          </div>

          {/* Success message */}
          {successMessage && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
              <p className="text-sm text-green-700">{successMessage}</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Google Sign In */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={googleLoading || loading}
            className={`w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border font-medium text-sm transition-all duration-200 mb-6 ${
              isDark
                ? 'bg-gray-800 border-gray-700 text-gray-200 hover:bg-gray-700'
                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
            } shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {googleLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <GoogleIcon />}
            Continue with Google
          </button>

          {/* Divider */}
          <div className="relative mb-6">
            <div className={`absolute inset-0 flex items-center`}>
              <div className={`w-full border-t ${isDark ? 'border-gray-800' : 'border-gray-200'}`} />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className={`px-3 font-medium tracking-wider ${isDark ? 'bg-gray-950 text-gray-500' : 'bg-white text-gray-400'}`}>
                or sign in with email
              </span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label htmlFor="email" className={`block text-sm font-semibold mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Email address
              </label>
              <div className="relative">
                <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="you@company.com"
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm transition-all outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 ${
                    isDark
                      ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-600'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                  }`}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className={`block text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Password
                </label>
                <Link to="/forgot-password" className="text-xs font-medium text-violet-600 hover:text-violet-500 transition-colors">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Enter your password"
                  className={`w-full pl-10 pr-11 py-3 rounded-xl border text-sm transition-all outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 ${
                    isDark
                      ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-600'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 text-white font-semibold text-sm transition-all duration-200 shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 disabled:opacity-60 disabled:cursor-not-allowed transform hover:-translate-y-0.5"
            >
              {loading ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Signing in...</>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          {/* Sign up link */}
          <p className={`mt-6 text-center text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Don't have an account?{' '}
            <Link to="/signup" className="font-semibold text-violet-600 hover:text-violet-500 transition-colors">
              Create one free
            </Link>
          </p>

          <div className={`mt-6 text-center border-t pt-5 ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
            <Link to="/" className={`text-xs font-medium transition-colors ${isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}>
              ← Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
