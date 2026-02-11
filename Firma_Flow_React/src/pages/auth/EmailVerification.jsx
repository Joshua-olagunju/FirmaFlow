import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Mail, CheckCircle, RefreshCw, ArrowLeft, AlertCircle } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { buildApiUrl } from '../../config/api.config';

export default function EmailVerification() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);

  // Get email from location state or URL params
  const email = location.state?.email || new URLSearchParams(location.search).get('email');
  const token = new URLSearchParams(location.search).get('token');

  useEffect(() => {
    // If there's a token in URL, verify it automatically
    if (token) {
      verifyEmail();
    }
  }, [token]);

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const verifyEmail = async () => {
    if (!token) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch(buildApiUrl('api/auth.php'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'verify_email',
          token: token
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage('Email verified successfully! Redirecting to login...');
        setTimeout(() => {
          navigate('/login', { 
            state: { 
              message: 'Email verified successfully! You can now sign in.',
              email: email
            }
          });
        }, 2000);
      } else {
        setError(data.message || 'Failed to verify email. Please try again.');
      }
    } catch (error) {
      console.error('Email verification error:', error);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const resendVerificationEmail = async () => {
    if (!email || countdown > 0) return;

    setResending(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch(buildApiUrl('api/auth.php'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'resend_verification',
          email: email
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage('Verification email sent! Please check your inbox.');
        setCountdown(60); // 60 second cooldown
      } else {
        setError(data.message || 'Failed to resend verification email.');
      }
    } catch (error) {
      console.error('Resend verification error:', error);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center px-4 ${
      theme === 'dark' ? 'bg-gray-900' : 'bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50'
    }`}>
      <div className="max-w-md w-full space-y-8">
        {/* Logo and Header */}
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2 text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent hover:opacity-80 transition-opacity">
            <img src="/firmaflow-logo.jpg" className="w-10 h-10 rounded-lg" alt="FirmaFlow" />
            FirmaFlow
          </Link>
        </div>

        {/* Main Card */}
        <div className={`p-8 rounded-2xl shadow-lg border ${
          theme === 'dark' 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-100'
        }`}>
          
          {loading ? (
            // Verification in progress
            <div className="text-center space-y-6">
              <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
                <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
              </div>
              <div>
                <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Verifying Email
                </h2>
                <p className={`mt-2 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Please wait while we verify your email address...
                </p>
              </div>
            </div>
          ) : message ? (
            // Success message
            <div className="text-center space-y-6">
              <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Success!
                </h2>
                <p className={`mt-2 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  {message}
                </p>
              </div>
            </div>
          ) : (
            // Default verification page
            <div className="text-center space-y-6">
              <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
                <Mail className="w-8 h-8 text-blue-600" />
              </div>
              
              <div>
                <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Check your email
                </h2>
                <p className={`mt-2 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  We've sent a verification link to:
                </p>
                {email && (
                  <p className={`mt-2 font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {email}
                  </p>
                )}
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div className="space-y-4">
                <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                    Click the verification link in your email to activate your account. 
                    If you don't see the email, check your spam folder.
                  </p>
                </div>

                {email && (
                  <div>
                    <p className={`text-sm mb-3 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      Didn't receive the email?
                    </p>
                    <button
                      onClick={resendVerificationEmail}
                      disabled={resending || countdown > 0}
                      className={`w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-lg text-sm font-medium transition-colors ${
                        resending || countdown > 0
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-purple-600 text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500'
                      }`}
                    >
                      <RefreshCw className={`w-4 h-4 mr-2 ${resending ? 'animate-spin' : ''}`} />
                      {countdown > 0 
                        ? `Resend in ${countdown}s` 
                        : resending 
                        ? 'Sending...' 
                        : 'Resend verification email'
                      }
                    </button>
                  </div>
                )}
              </div>

              {/* Instructions */}
              <div className={`text-left p-4 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-blue-50 border-blue-200'}`}>
                <h4 className={`font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-blue-900'}`}>
                  What's next?
                </h4>
                <ol className={`text-sm space-y-1 ${theme === 'dark' ? 'text-gray-300' : 'text-blue-800'}`}>
                  <li>1. Check your email inbox for our verification message</li>
                  <li>2. Click the verification link in the email</li>
                  <li>3. You'll be automatically redirected to sign in</li>
                  <li>4. Start managing your business finances!</li>
                </ol>
              </div>

              {/* Navigation */}
              <div className="flex flex-col space-y-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => navigate('/login', { state: { email } })}
                  className={`flex items-center justify-center py-2 px-4 border border-gray-300 rounded-lg text-sm font-medium transition-colors ${
                    theme === 'dark'
                      ? 'text-gray-300 hover:bg-gray-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Sign In
                </button>
                
                <Link
                  to="/"
                  className={`text-sm font-medium transition-colors text-center ${
                    theme === 'dark' 
                      ? 'text-gray-400 hover:text-gray-300' 
                      : 'text-gray-600 hover:text-gray-700'
                  }`}
                >
                  ← Back to home
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Help Section */}
        <div className="text-center">
          <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            Need help?{' '}
            <Link
              to="/support"
              className="font-medium text-purple-600 hover:text-purple-500 transition-colors"
            >
              Contact our support team
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}