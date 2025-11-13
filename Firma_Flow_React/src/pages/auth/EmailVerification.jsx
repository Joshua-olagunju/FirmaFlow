import React, { useRef, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Send, RotateCcw, ArrowLeft } from "lucide-react";

export default function EmailVerification() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || "";

  const [otp, setOtp] = useState(new Array(6).fill(""));
  const [isVerifying, setIsVerifying] = useState(false);
  const [canResend, setCanResend] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const inputsRef = useRef([]);

  // ✅ Use environment variable or fallback to localhost
  const API_BASE =
    import.meta.env.VITE_API_BASE ||
    "http://localhost:8888/firmaflow-React/FirmaFlow";
  const API_ENDPOINT = `${API_BASE}/api/auth.php`;

  // Countdown timer logic
  useEffect(() => {
    if (!canResend && resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer((t) => t - 1), 1000);
      return () => clearTimeout(timer);
    }
    if (resendTimer === 0) setCanResend(true);
  }, [canResend, resendTimer]);

  // Handle OTP input change
  const handleChange = (e, idx) => {
    const val = e.target.value;
    if (!val) {
      setOtp((prev) => {
        const copy = [...prev];
        copy[idx] = "";
        return copy;
      });
      return;
    }

    const char = val.slice(-1);
    if (!/^\d$/.test(char)) return;

    setOtp((prev) => {
      const copy = [...prev];
      copy[idx] = char;
      return copy;
    });

    if (idx < 5) inputsRef.current[idx + 1]?.focus();
  };

  // Handle navigation keys
  const handleKeyDown = (e, idx) => {
    if (e.key === "Backspace") {
      if (otp[idx]) {
        setOtp((prev) => {
          const copy = [...prev];
          copy[idx] = "";
          return copy;
        });
      } else if (idx > 0) inputsRef.current[idx - 1]?.focus();
    } else if (e.key === "ArrowLeft" && idx > 0) {
      inputsRef.current[idx - 1]?.focus();
    } else if (e.key === "ArrowRight" && idx < 5) {
      inputsRef.current[idx + 1]?.focus();
    }
  };

  // Paste handler for OTP
  const handlePaste = (e) => {
    e.preventDefault();
    const paste = e.clipboardData.getData("text").trim();
    const digits = paste.replace(/\D/g, "").slice(0, 6).split("");
    if (!digits.length) return;

    setOtp((prev) => {
      const copy = [...prev];
      for (let i = 0; i < 6; i++) copy[i] = digits[i] || "";
      return copy;
    });
    inputsRef.current[Math.min(digits.length, 5)]?.focus();
  };

  // ✅ Verify OTP with backend API
  const verify = async (e) => {
    e.preventDefault();
    if (otp.some((d) => d === "")) {
      setError("Please enter all 6 digits");
      return;
    }

    setIsVerifying(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "verify_otp",
          email,
          otp_code: otp.join(""),
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data) {
        setError(`Server returned ${res.status}`);
        return;
      }

      if (data.success) {
        setSuccess("Email successfully verified! Redirecting...");
        setTimeout(() => navigate("/dashboard"), 2000);
      } else {
        setError(data.error || "Invalid OTP code. Try again.");
        setOtp(new Array(6).fill(""));
        inputsRef.current[0]?.focus();
      }
    } catch (err) {
      console.error("Verification Error:", err);
      setError("Network error. Please check your connection.");
    } finally {
      setIsVerifying(false);
    }
  };

  // ✅ Resend OTP
  const handleResend = async () => {
    if (!canResend) return;

    setCanResend(false);
    setResendTimer(30);
    setOtp(new Array(6).fill(""));
    setError("");
    setSuccess("");

    try {
      const res = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "resend_otp",
          email,
        }),
      });

      const data = await res.json().catch(() => null);
      if (data?.success) {
        setSuccess("A new OTP code has been sent to your email.");
      } else {
        setError(data?.error || "Failed to resend OTP. Try again.");
      }
    } catch (err) {
      setError("Network error while resending OTP.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-indigo-600 to-purple-800 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-purple-600 to-purple-400 p-8 text-center">
          <h2 className="text-3xl md:text-4xl font-semibold text-white">
            Verify Your Email
          </h2>
          <p className="text-sm md:text-base text-white/90 mt-2">
            Enter the 6-digit code sent to your email
          </p>
        </div>

        {/* Card Body */}
        <div className="bg-white p-8">
          <div className="bg-gray-50 border border-gray-100 rounded-lg p-4 mb-6 text-center">
            <div className="flex items-center justify-center gap-2 text-gray-600 mb-1">
              <Send size={16} className="text-indigo-500" />
              <span className="text-sm">We’ve sent a verification code to:</span>
            </div>
            <div className="font-medium text-gray-800">{email}</div>
          </div>

          <form onSubmit={verify} className="space-y-6">
            <div
              className="flex items-center justify-center gap-3"
              onPaste={handlePaste}
            >
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => (inputsRef.current[idx] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength="1"
                  value={digit}
                  onChange={(e) => handleChange(e, idx)}
                  onKeyDown={(e) => handleKeyDown(e, idx)}
                  className="w-12 h-12 text-center text-xl font-semibold border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition"
                />
              ))}
            </div>

            {/* ✅ Display success/error messages */}
            {error && (
              <div className="text-sm text-red-500 text-center">{error}</div>
            )}
            {success && (
              <div className="text-sm text-green-600 text-center">{success}</div>
            )}

            <button
              type="submit"
              disabled={isVerifying}
              className="w-full py-3 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold hover:opacity-95 transition disabled:opacity-60"
            >
              {isVerifying ? "Verifying..." : "Verify Email"}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <p className="text-gray-600 mb-3">Didn’t receive the code?</p>
            <button
              onClick={handleResend}
              disabled={!canResend}
              className={`inline-flex items-center gap-2 font-semibold ${
                canResend
                  ? "text-indigo-600 hover:text-indigo-800"
                  : "text-gray-400 cursor-not-allowed"
              }`}
            >
              <RotateCcw size={18} />
              {canResend ? "Resend Code" : `Resend in ${resendTimer}s`}
            </button>
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft size={14} /> Back to Registration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
