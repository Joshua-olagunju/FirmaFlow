import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { ShieldCheck, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { buildApiUrl } from '../../config/api.config';

const OTP_LENGTH = 6;

export default function ForgotPasswordOTP() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const email = location.state?.email || '';

  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(60);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (!email) navigate('/forgot-password');
  }, [email, navigate]);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  // Auto-focus first input on mount
  useEffect(() => { inputRefs.current[0]?.focus(); }, []);

  const otpValue = otp.join('');

  const handleChange = (index, value) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const next = [...otp]; next[index] = digit; setOtp(next); setError('');
    if (digit && index < OTP_LENGTH - 1) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (otp[index]) { const n = [...otp]; n[index] = ''; setOtp(n); }
      else if (index > 0) inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) inputRefs.current[index - 1]?.focus();
    else if (e.key === 'ArrowRight' && index < OTP_LENGTH - 1) inputRefs.current[index + 1]?.focus();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    const next = Array(OTP_LENGTH).fill('');
    text.split('').forEach((ch, i) => { next[i] = ch; });
    setOtp(next);
    inputRefs.current[Math.min(text.length, OTP_LENGTH - 1)]?.focus();
  };

  const handleVerify = async (e) => {
    e?.preventDefault();
    if (otpValue.length < OTP_LENGTH) { setError('Please enter all 6 digits'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch(buildApiUrl('api/password_reset.php'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify_otp', email, otp: otpValue }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        navigate('/forgot-password/reset', { state: { email, reset_token: data.reset_token } });
      } else {
        setError(data.error || 'Invalid or expired code. Please try again.');
        setOtp(Array(OTP_LENGTH).fill(''));
        inputRefs.current[0]?.focus();
      }
    } catch { setError('Network error. Please try again.'); }
    finally { setLoading(false); }
  };

  const handleResend = async () => {
    if (countdown > 0 || resending) return;
    setResending(true); setError('');
    try {
      const res = await fetch(buildApiUrl('api/password_reset.php'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'request_reset', email }),
      });
      const data = await res.json();
      if (data.success) {
        setCountdown(60); setOtp(Array(OTP_LENGTH).fill(''));
        inputRefs.current[0]?.focus();
      } else { setError(data.error || 'Failed to resend.'); }
    } catch { setError('Network error.'); }
    finally { setResending(false); }
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
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/30">
              <ShieldCheck className="w-8 h-8 text-white" />
            </div>
          </div>

          <div className="text-center mb-8">
            <h2 className={`text-2xl font-extrabold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Enter reset code
            </h2>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              We sent a 6-digit reset code to
            </p>
            <p className={`font-semibold mt-1 ${isDark ? 'text-violet-400' : 'text-violet-600'}`}>{email}</p>
          </div>

          {error && (
            <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleVerify} className="space-y-6">
            <div>
              <label className={`block text-sm font-semibold text-center mb-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Enter your reset code
              </label>
              <div className="flex gap-2 justify-center" onPaste={handlePaste}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={el => (inputRefs.current[i] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleChange(i, e.target.value)}
                    onKeyDown={e => handleKeyDown(i, e)}
                    className={`w-12 h-14 text-center text-xl font-bold rounded-xl border-2 outline-none transition-all ${
                      digit ? 'border-violet-500 bg-violet-50 text-violet-700'
                             : isDark ? 'border-gray-700 bg-gray-800 text-white focus:border-violet-500'
                                      : 'border-gray-200 bg-gray-50 text-gray-900 focus:border-violet-500 focus:bg-white'
                    }`}
                  />
                ))}
              </div>
              <p className={`text-xs text-center mt-3 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                Code expires in 15 minutes
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || otpValue.length < OTP_LENGTH}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 text-white font-semibold text-sm shadow-lg shadow-violet-500/25 transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Verifying…</> : 'Verify Code'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Didn't get the code?{' '}
              {countdown > 0 ? (
                <span className={isDark ? 'text-gray-600' : 'text-gray-400'}>Resend in <strong>{countdown}s</strong></span>
              ) : (
                <button type="button" onClick={handleResend} disabled={resending}
                  className="font-semibold text-violet-600 hover:text-violet-500 inline-flex items-center gap-1 disabled:opacity-50">
                  {resending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />} Resend
                </button>
              )}
            </p>
          </div>

          <div className={`mt-6 text-center border-t pt-5 ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
            <Link to="/forgot-password" className={`text-xs font-medium transition-colors ${isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}>
              ← Change email address
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
