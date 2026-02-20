import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Eye, EyeOff, Lock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { buildApiUrl } from '../../config/api.config';

const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
const strengthColors = ['bg-gray-200', 'bg-red-500', 'bg-orange-400', 'bg-yellow-400', 'bg-green-400', 'bg-emerald-500'];
const strengthTextColors = ['', 'text-red-500', 'text-orange-500', 'text-yellow-500', 'text-green-500', 'text-emerald-500'];

function calcStrength(pw) {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[a-z]/.test(pw)) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^a-zA-Z0-9]/.test(pw)) s++;
  return s;
}

export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const resetToken = location.state?.reset_token || '';
  const email = location.state?.email || '';

  const [form, setForm] = useState({ new_password: '', confirm_password: '' });
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const strength = calcStrength(form.new_password);

  useEffect(() => {
    if (!resetToken) navigate('/forgot-password');
  }, [resetToken, navigate]);

  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.new_password.length < 8) { setError('Password must be at least 8 characters'); return; }
    if (form.new_password !== form.confirm_password) { setError('Passwords do not match'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch(buildApiUrl('api/password_reset.php'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reset_password',
          reset_token: resetToken,
          new_password: form.new_password,
          confirm_password: form.confirm_password,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setDone(true);
        setTimeout(() => navigate('/login', { state: { message: 'Password reset successfully! You can now sign in.' } }), 2500);
      } else {
        setError(data.error || 'Failed to reset password. Please try again.');
      }
    } catch { setError('Network error. Please try again.'); }
    finally { setLoading(false); }
  };

  if (done) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-gray-950' : 'bg-slate-50'}`}>
        <div className="text-center space-y-4 px-4">
          <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Password reset!</h2>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Your password has been updated. Redirecting to sign in…
          </p>
          <Loader2 className="w-5 h-5 animate-spin mx-auto text-violet-500" />
        </div>
      </div>
    );
  }

  const inputCls = (hasError) =>
    `w-full pl-10 pr-11 py-3 rounded-xl border text-sm outline-none transition-all focus:ring-2 focus:ring-violet-500 focus:border-violet-500 ${
      hasError ? 'border-red-400' :
      isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-600'
             : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
    }`;

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
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/30">
              <Lock className="w-8 h-8 text-white" />
            </div>
          </div>

          <div className="text-center mb-8">
            <h2 className={`text-2xl font-extrabold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Create new password
            </h2>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Choose a strong password for{' '}
              <span className={`font-semibold ${isDark ? 'text-violet-400' : 'text-violet-600'}`}>{email}</span>
            </p>
          </div>

          {error && (
            <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* New password */}
            <div>
              <label className={`block text-sm font-semibold mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                New password
              </label>
              <div className="relative">
                <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                <input
                  name="new_password"
                  type={showPw ? 'text' : 'password'}
                  value={form.new_password}
                  onChange={handleChange}
                  placeholder="At least 8 characters"
                  className={inputCls(false)}
                />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}>
                  {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {form.new_password && (
                <div className="mt-2 space-y-1">
                  <div className="flex gap-1">
                    {[1,2,3,4,5].map(i => (
                      <div key={i} className={`flex-1 h-1.5 rounded-full transition-all ${i <= strength ? strengthColors[strength] : isDark ? 'bg-gray-800' : 'bg-gray-200'}`} />
                    ))}
                  </div>
                  <p className={`text-xs font-medium ${strengthTextColors[strength]}`}>{strengthLabels[strength]}</p>
                </div>
              )}
            </div>

            {/* Confirm password */}
            <div>
              <label className={`block text-sm font-semibold mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Confirm new password
              </label>
              <div className="relative">
                <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                <input
                  name="confirm_password"
                  type={showConfirm ? 'text' : 'password'}
                  value={form.confirm_password}
                  onChange={handleChange}
                  placeholder="Repeat your new password"
                  className={inputCls(false)}
                />
                <button type="button" onClick={() => setShowConfirm(v => !v)}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}>
                  {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {form.confirm_password && form.new_password !== form.confirm_password && (
                <p className="mt-1 text-xs text-red-500">Passwords don't match</p>
              )}
              {form.confirm_password && form.new_password === form.confirm_password && form.new_password && (
                <p className="mt-1 text-xs text-green-500 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Passwords match
                </p>
              )}
            </div>

            {/* Password requirements */}
            <div className={`p-3 rounded-xl text-xs space-y-1 ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
              <p className={`font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Password requirements:</p>
              {[
                ['At least 8 characters', form.new_password.length >= 8],
                ['One uppercase letter', /[A-Z]/.test(form.new_password)],
                ['One lowercase letter', /[a-z]/.test(form.new_password)],
                ['One number', /\d/.test(form.new_password)],
              ].map(([req, met]) => (
                <div key={req} className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${met ? 'bg-green-500' : isDark ? 'bg-gray-600' : 'bg-gray-300'}`} />
                  <span className={met ? 'text-green-600' : isDark ? 'text-gray-500' : 'text-gray-400'}>{req}</span>
                </div>
              ))}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 text-white font-semibold text-sm shadow-lg shadow-violet-500/25 transition-all transform hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Saving…</> : 'Reset Password'}
            </button>
          </form>

          <div className={`mt-6 text-center border-t pt-5 ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
            <Link to="/login" className={`text-xs font-medium transition-colors ${isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}>
              ← Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
