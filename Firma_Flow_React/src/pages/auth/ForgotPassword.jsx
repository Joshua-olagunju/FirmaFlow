import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, AlertCircle, Loader2, KeyRound } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { buildApiUrl } from '../../config/api.config';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) { setError('Please enter your email address'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(buildApiUrl('api/password_reset.php'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'request_reset', email: email.toLowerCase().trim() }),
      });
      const data = await res.json();
      if (data.success) {
        // Always redirect (API uses neutral response to prevent enumeration)
        navigate('/forgot-password/verify', { state: { email: email.toLowerCase().trim() } });
      } else {
        setError(data.error || 'Something went wrong. Please try again.');
      }
    } catch {
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center px-4 ${isDark ? 'bg-gray-950' : 'bg-gradient-to-br from-violet-50 via-blue-50 to-indigo-50'}`}>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <img src="/firmaflow-logo.jpg" className="w-10 h-10 rounded-xl" alt="FirmaFlow" />
            <span className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-blue-600 bg-clip-text text-transparent">FirmaFlow</span>
          </Link>
        </div>

        {/* Card */}
        <div className={`p-8 rounded-3xl shadow-xl border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/30">
              <KeyRound className="w-8 h-8 text-white" />
            </div>
          </div>

          <div className="text-center mb-8">
            <h2 className={`text-2xl font-extrabold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Forgot your password?
            </h2>
            <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              No worries! Enter your registered email and we'll send you a verification code to reset your password.
            </p>
          </div>

          {error && (
            <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className={`block text-sm font-semibold mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Email address
              </label>
              <div className="relative">
                <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError(''); }}
                  placeholder="you@company.com"
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm outline-none transition-all focus:ring-2 focus:ring-violet-500 focus:border-violet-500 ${
                    isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-600'
                           : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                  }`}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 text-white font-semibold text-sm shadow-lg shadow-violet-500/25 transition-all transform hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Sending code…</> : 'Send Reset Code'}
            </button>
          </form>

          <div className={`mt-6 text-center border-t pt-5 ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
            <Link to="/login" className={`text-sm font-medium transition-colors ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`}>
              ← Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
