import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Eye, EyeOff, Mail, Lock, User, Building, Phone,
  AlertCircle, CheckCircle, Loader2, ArrowLeft, ArrowRight
} from 'lucide-react';
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

const STEPS = [
  { id: 1, label: 'Your Info' },
  { id: 2, label: 'Company' },
  { id: 3, label: 'Review' },
];

const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
const strengthColors = ['bg-gray-200', 'bg-red-500', 'bg-orange-400', 'bg-yellow-400', 'bg-green-400', 'bg-emerald-500'];

function calcStrength(pw) {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[a-z]/.test(pw)) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^a-zA-Z0-9]/.test(pw)) s++;
  return s;
}

export default function Signup() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '',
    password: '', confirm_password: '',
    company_name: '', phone: '',
    agreeToTerms: false,
  });
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const strength = calcStrength(form.password);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
    setErrors(er => ({ ...er, [name]: '' }));
  };

  const validateStep = (s) => {
    const errs = {};
    if (s === 1) {
      if (!form.first_name.trim()) errs.first_name = 'First name is required';
      if (!form.last_name.trim()) errs.last_name = 'Last name is required';
      if (!form.email.trim()) errs.email = 'Email is required';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Enter a valid email';
    }
    if (s === 2) {
      if (!form.company_name.trim()) errs.company_name = 'Company name is required';
      if (!form.password) errs.password = 'Password is required';
      else if (form.password.length < 6) errs.password = 'Password must be at least 6 characters';
      if (form.password !== form.confirm_password) errs.confirm_password = 'Passwords do not match';
    }
    if (s === 3) {
      if (!form.agreeToTerms) errs.agreeToTerms = 'You must agree to the terms';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => { if (validateStep(step)) setStep(s => s + 1); };
  const handleBack = () => setStep(s => s - 1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep(3)) return;
    setLoading(true);
    try {
      const res = await fetch(buildApiUrl('api/auth.php'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'signup',
          first_name: form.first_name,
          last_name: form.last_name,
          email: form.email,
          password: form.password,
          confirm_password: form.confirm_password,
          company_name: form.company_name,
          phone: form.phone,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        navigate('/email-verification', { state: { email: form.email } });
      } else {
        setErrors({ submit: data.error || data.message || 'Registration failed. Please try again.' });
      }
    } catch {
      setErrors({ submit: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = () => {
    setGoogleLoading(true);
    const clientId = import.meta.env?.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      setGoogleLoading(false);
      setErrors({ submit: 'Google Sign-Up is not configured yet. Please register with email.' });
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

  const inputCls = (field) =>
    `w-full pl-10 pr-4 py-3 rounded-xl border text-sm outline-none transition-all focus:ring-2 focus:ring-violet-500 focus:border-violet-500 ${
      errors[field] ? 'border-red-400 bg-red-50' :
      isDark ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-600'
             : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
    }`;

  return (
    <div className={`min-h-screen flex ${isDark ? 'bg-gray-950' : 'bg-slate-50'}`}>
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-2/5 bg-gradient-to-br from-violet-600 via-purple-700 to-blue-700 items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-16 w-56 h-56 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-8 w-72 h-72 bg-blue-300 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 text-white text-center max-w-sm">
          <Link to="/" className="inline-flex items-center gap-3 mb-10">
            <img src="/firmaflow-logo.jpg" className="w-14 h-14 rounded-2xl shadow-2xl" alt="FirmaFlow" />
            <span className="text-3xl font-bold tracking-tight">FirmaFlow</span>
          </Link>
          <h1 className="text-3xl font-extrabold leading-tight mb-4">
            Start your free 14-day trial
          </h1>
          <p className="text-purple-200 text-base leading-relaxed mb-8">
            No credit card required. Full access to all features.
          </p>
          <div className="space-y-3 text-left">
            {[
              'Complete accounting & invoicing',
              'Expense tracking & payroll',
              'Real-time financial reports',
              'AI business assistant',
              'Multi-user & roles',
            ].map(feat => (
              <div key={feat} className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-400 shrink-0" />
                <span className="text-sm text-purple-100">{feat}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: form */}
      <div className={`flex-1 flex items-center justify-center px-6 py-10 overflow-y-auto ${isDark ? 'bg-gray-950' : 'bg-white'}`}>
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-6">
            <Link to="/" className="inline-flex items-center gap-2">
              <img src="/firmaflow-logo.jpg" className="w-10 h-10 rounded-xl" alt="FirmaFlow" />
              <span className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-blue-600 bg-clip-text text-transparent">FirmaFlow</span>
            </Link>
          </div>

          <div className="mb-6">
            <h2 className={`text-3xl font-extrabold ${isDark ? 'text-white' : 'text-gray-900'}`}>Create an account</h2>
            <p className={`mt-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Join thousands of businesses managing finances smarter.
            </p>
          </div>

          {/* Progress steps */}
          <div className="flex items-center gap-2 mb-8">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    step > s.id ? 'bg-violet-600 text-white' :
                    step === s.id ? 'bg-violet-600 text-white ring-4 ring-violet-200' :
                    isDark ? 'bg-gray-800 text-gray-500' : 'bg-gray-100 text-gray-400'
                  }`}>
                    {step > s.id ? <CheckCircle className="w-4 h-4" /> : s.id}
                  </div>
                  <span className={`text-xs mt-1 font-medium ${step >= s.id ? 'text-violet-600' : isDark ? 'text-gray-600' : 'text-gray-400'}`}>{s.label}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`h-0.5 flex-1 mb-5 mx-1 rounded transition-all ${step > s.id ? 'bg-violet-600' : isDark ? 'bg-gray-800' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>

          {/* Google Sign Up (only step 1) */}
          {step === 1 && (
            <>
              <button
                type="button"
                onClick={handleGoogleSignup}
                disabled={googleLoading}
                className={`w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border font-medium text-sm transition-all duration-200 mb-5 ${
                  isDark ? 'bg-gray-800 border-gray-700 text-gray-200 hover:bg-gray-700'
                         : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                } shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {googleLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <GoogleIcon />}
                Continue with Google
              </button>
              <div className="relative mb-5">
                <div className="absolute inset-0 flex items-center">
                  <div className={`w-full border-t ${isDark ? 'border-gray-800' : 'border-gray-200'}`} />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className={`px-3 font-medium tracking-wider ${isDark ? 'bg-gray-950 text-gray-500' : 'bg-white text-gray-400'}`}>
                    or register with email
                  </span>
                </div>
              </div>
            </>
          )}

          {/* Error */}
          {errors.submit && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}

          <form onSubmit={step === 3 ? handleSubmit : (e) => e.preventDefault()} className="space-y-4">

            {/* ── STEP 1: Personal Info ── */}
            {step === 1 && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  {[['first_name', 'First Name', 'Alex'], ['last_name', 'Last Name', 'Smith']].map(([field, label, ph]) => (
                    <div key={field}>
                      <label className={`block text-sm font-semibold mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{label}</label>
                      <div className="relative">
                        <User className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                        <input
                          name={field}
                          value={form[field]}
                          onChange={handleChange}
                          placeholder={ph}
                          className={inputCls(field)}
                        />
                      </div>
                      {errors[field] && <p className="mt-1 text-xs text-red-500">{errors[field]}</p>}
                    </div>
                  ))}
                </div>

                <div>
                  <label className={`block text-sm font-semibold mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Email address</label>
                  <div className="relative">
                    <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                    <input
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="alex@company.com"
                      className={inputCls('email')}
                    />
                  </div>
                  {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
                </div>
              </>
            )}

            {/* ── STEP 2: Company + Password ── */}
            {step === 2 && (
              <>
                <div>
                  <label className={`block text-sm font-semibold mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Company Name</label>
                  <div className="relative">
                    <Building className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                    <input
                      name="company_name"
                      value={form.company_name}
                      onChange={handleChange}
                      placeholder="Acme Corporation Ltd."
                      className={inputCls('company_name')}
                    />
                  </div>
                  {errors.company_name && <p className="mt-1 text-xs text-red-500">{errors.company_name}</p>}
                </div>

                <div>
                  <label className={`block text-sm font-semibold mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Phone <span className="font-normal text-gray-400">(optional)</span></label>
                  <div className="relative">
                    <Phone className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                    <input
                      name="phone"
                      type="tel"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="+234 800 000 0000"
                      className={inputCls('phone')}
                    />
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-semibold mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Password</label>
                  <div className="relative">
                    <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                    <input
                      name="password"
                      type={showPw ? 'text' : 'password'}
                      value={form.password}
                      onChange={handleChange}
                      placeholder="Create a strong password"
                      className={`${inputCls('password')} pr-11`}
                    />
                    <button type="button" onClick={() => setShowPw(v => !v)} className={`absolute right-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}>
                      {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {form.password && (
                    <div className="mt-2 space-y-1">
                      <div className="flex gap-1">
                        {[1,2,3,4,5].map(i => (
                          <div key={i} className={`flex-1 h-1.5 rounded-full transition-all ${i <= strength ? strengthColors[strength] : isDark ? 'bg-gray-800' : 'bg-gray-200'}`} />
                        ))}
                      </div>
                      <p className={`text-xs font-medium ${strength <= 1 ? 'text-red-500' : strength <= 2 ? 'text-orange-500' : strength <= 3 ? 'text-yellow-500' : 'text-green-500'}`}>
                        {strengthLabels[strength]}
                      </p>
                    </div>
                  )}
                  {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
                </div>

                <div>
                  <label className={`block text-sm font-semibold mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Confirm Password</label>
                  <div className="relative">
                    <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                    <input
                      name="confirm_password"
                      type={showConfirm ? 'text' : 'password'}
                      value={form.confirm_password}
                      onChange={handleChange}
                      placeholder="Repeat your password"
                      className={`${inputCls('confirm_password')} pr-11`}
                    />
                    <button type="button" onClick={() => setShowConfirm(v => !v)} className={`absolute right-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}>
                      {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.confirm_password && <p className="mt-1 text-xs text-red-500">{errors.confirm_password}</p>}
                </div>
              </>
            )}

            {/* ── STEP 3: Review + Terms ── */}
            {step === 3 && (
              <>
                <div className={`p-5 rounded-2xl border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-gray-50 border-gray-100'}`}>
                  <h3 className={`font-bold text-sm mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>Account Summary</h3>
                  <div className="space-y-2">
                    {[
                      ['Name', `${form.first_name} ${form.last_name}`],
                      ['Email', form.email],
                      ['Company', form.company_name],
                      ...(form.phone ? [['Phone', form.phone]] : []),
                    ].map(([label, val]) => (
                      <div key={label} className="flex justify-between text-sm">
                        <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>{label}</span>
                        <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{val}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="agreeToTerms"
                    checked={form.agreeToTerms}
                    onChange={handleChange}
                    className="mt-0.5 h-4 w-4 text-violet-600 focus:ring-violet-500 rounded border-gray-300"
                  />
                  <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    I agree to the{' '}
                    <Link to="/terms" className="text-violet-600 hover:text-violet-500 font-semibold">Terms of Service</Link>
                    {' '}and{' '}
                    <Link to="/privacy" className="text-violet-600 hover:text-violet-500 font-semibold">Privacy Policy</Link>
                  </span>
                </label>
                {errors.agreeToTerms && <p className="text-xs text-red-500">{errors.agreeToTerms}</p>}
              </>
            )}

            {/* Navigation buttons */}
            <div className={`flex gap-3 pt-2 ${step > 1 ? 'justify-between' : ''}`}>
              {step > 1 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className={`flex items-center gap-2 px-5 py-3 rounded-xl border font-semibold text-sm transition-all ${isDark ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
              )}

              {step < 3 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 text-white font-semibold text-sm shadow-lg shadow-violet-500/25 transition-all transform hover:-translate-y-0.5"
                >
                  Continue <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 text-white font-semibold text-sm shadow-lg shadow-violet-500/25 transition-all transform hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Creating account...</> : 'Create Account'}
                </button>
              )}
            </div>
          </form>

          <p className={`mt-6 text-center text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-violet-600 hover:text-violet-500 transition-colors">Sign in</Link>
          </p>

          <div className={`mt-4 text-center border-t pt-4 ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
            <Link to="/" className={`text-xs font-medium transition-colors ${isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}>
              ← Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
