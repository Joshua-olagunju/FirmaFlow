import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Briefcase,
  Mail,
  Phone,
  Eye,
  EyeOff,
  Rocket,
  ShieldCheck,
  CheckCircle,
  Gift,
  LogIn,
  Lock,
  Home,
} from "lucide-react";

export default function Signup() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    company: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    agree: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState("");

  // ✅ API Endpoint
  const API_BASE =
    import.meta.env.VITE_API_BASE ||
    "http://localhost:8888/firmaflow-React/FirmaFlow";
  const API_ENDPOINT = `${API_BASE}/api/auth.php`;

  const features = [
    { label: "14-day free trial" },
    { label: "No credit card required" },
    { label: "Cancel anytime" },
    { label: "24/7 support included" },
  ];

  // ✅ Strong password rule
  const strongPasswordPattern =
    /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;

  // ✅ Validation logic
  const validate = () => {
    const e = {};
    if (!form.firstName.trim()) e.firstName = "First name is required";
    if (!form.lastName.trim()) e.lastName = "Last name is required";
    if (!form.company.trim()) e.company = "Company name is required";
    if (!form.email.match(/^\S+@\S+\.\S+$/)) e.email = "Valid email required";
    if (!form.password || form.password.length < 6)
      e.password = "Password must be at least 6 characters";
    else if (!strongPasswordPattern.test(form.password))
      e.password =
        "Password must include at least one uppercase letter, one number, and one special character";
    if (form.password !== form.confirmPassword)
      e.confirmPassword = "Passwords do not match";
    if (!form.agree) e.agree = "You must agree to Terms of Service";
    return e;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((s) => ({ ...s, [name]: type === "checkbox" ? checked : value }));
    setErrors((s) => ({ ...s, [name]: undefined }));
    setGeneralError("");
  };

  // ✅ Submit logic
  const handleSubmit = async (e) => {
    e.preventDefault();
    const eobj = validate();
    setErrors(eobj);
    if (Object.keys(eobj).length) return;

    setIsSubmitting(true);
    setGeneralError("");

    try {
      const payload = {
        action: "signup",
        first_name: form.firstName.trim(),
        last_name: form.lastName.trim(),
        company_name: form.company.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        password: form.password,
        confirm_password: form.confirmPassword,
      };

      const res = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const msg = (data && data.error) || `Server returned ${res.status}`;
        setGeneralError(msg);
        return;
      }

      if (data?.success) {
        if (data.requires_verification && data.email) {
          navigate("/email-verification", { state: { email: data.email } });
        } else {
          navigate("/email-verification", { state: { email: form.email } });
        }
      } else {
        setGeneralError(data?.error || "Unable to complete registration");
      }
    } catch (err) {
      console.error("Signup error", err);
      setGeneralError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-purple-800 py-12 px-4">
      <div className="max-w-lg mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-purple-600 to-purple-400 text-white p-6 md:p-8">
          <div className="w-full flex items-center justify-start mb-5">
            <button
              onClick={() => navigate("/")}
              className="w-20 flex items-center justify-center gap-1 border-2 rounded-md hover:bg-blue-50 hover:text-gray-600 transition"
            >
              <Home size={18} className="mt-0.5" /> Home
            </button>
          </div>

          <div className="flex flex-col items-start gap-4 md:gap-6">
            <div className="m-auto w-75 gap-3 flex items-start justify-center mb-2">
              <img
                src="./firmaflow-logo.jpg"
                alt="FirmaFlow Ledger"
                className="mx-auto w-14 h-14 mb-2 rounded-md mt-1"
              />
              <span className="flex flex-col items-start">
                <h1 className="text-4xl font-semibold">FirmaFlow</h1>
                <p className="text-xs opacity-100 mt-1">LEDGER</p>
              </span>
            </div>
            <div className="flex flex-col m-auto text-center">
              <p className="text-sm md:text-base max-w-xl">
                Start managing your business like a pro
              </p>
              <div className="mt-3 inline-flex items-center gap-2 bg-white/10 rounded-full px-3 py-1 text-xs md:text-sm">
                <Gift size={15} />
                <span>14-day free trial • No credit card required</span>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
          {/* Name Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <User size={14} /> First Name <span className="text-red-500">*</span>
              </label>
              <input
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
                placeholder="Enter first name"
                className={`w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none ${
                  errors.firstName ? "border-red-400" : "border-gray-200"
                }`}
              />
              {errors.firstName && (
                <div className="text-xs text-red-500 mt-1">{errors.firstName}</div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                name="lastName"
                value={form.lastName}
                onChange={handleChange}
                placeholder="Enter last name"
                className={`w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none ${
                  errors.lastName ? "border-red-400" : "border-gray-200"
                }`}
              />
              {errors.lastName && (
                <div className="text-xs text-red-500 mt-1">{errors.lastName}</div>
              )}
            </div>
          </div>

          {/* Company */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
              <Briefcase size={14} /> Company Name <span className="text-red-500">*</span>
            </label>
            <input
              name="company"
              value={form.company}
              onChange={handleChange}
              placeholder="Enter your company name"
              className={`w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none ${
                errors.company ? "border-red-400" : "border-gray-200"
              }`}
            />
            {errors.company && (
              <div className="text-xs text-red-500 mt-1">{errors.company}</div>
            )}
          </div>

          {/* Email + Phone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <Mail size={14} /> Email Address <span className="text-red-500">*</span>
              </label>
              <input
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Enter email address"
                className={`w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none ${
                  errors.email ? "border-red-400" : "border-gray-200"
                }`}
              />
              {errors.email && (
                <div className="text-xs text-red-500 mt-1">{errors.email}</div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <Phone size={14} /> Phone Number
              </label>
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="Enter phone number"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none border-gray-200"
              />
            </div>
          </div>

          {/* Password Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                <Lock size={14} /> Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Create password"
                  className={`w-full border rounded-lg px-3 py-2 pr-10 text-sm focus:ring-2 focus:ring-purple-500 outline-none ${
                    errors.password ? "border-red-400" : "border-gray-200"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-2 top-2 text-gray-500"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <div className="text-xs text-red-500 mt-1">{errors.password}</div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  name="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm password"
                  className={`w-full border rounded-lg px-3 py-2 pr-10 text-sm focus:ring-2 focus:ring-purple-500 outline-none ${
                    errors.confirmPassword ? "border-red-400" : "border-gray-200"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((s) => !s)}
                  className="absolute right-2 top-2 text-gray-500"
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.confirmPassword && (
                <div className="text-xs text-red-500 mt-1">
                  {errors.confirmPassword}
                </div>
              )}
            </div>
          </div>

          {/* Terms */}
          <div className="flex items-start gap-3">
            <input
              name="agree"
              type="checkbox"
              checked={form.agree}
              onChange={handleChange}
              className="mt-1 w-4 h-4 text-purple-600 border-gray-300 rounded"
            />
            <div className="text-sm text-gray-700">
              I agree to the{" "}
              <a className="text-purple-600 hover:underline" href="#">
                Terms of Service
              </a>{" "}
              and{" "}
              <a className="text-purple-600 hover:underline" href="#">
                Privacy Policy
              </a>
              .
              {errors.agree && (
                <div className="text-xs text-red-500 mt-1">{errors.agree}</div>
              )}
            </div>
          </div>

          {/* Submit */}
          {generalError && (
            <div className="text-sm text-red-500 text-center">{generalError}</div>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-xl text-white font-semibold bg-gradient-to-r from-purple-600 to-purple-500 hover:opacity-95 transition flex items-center justify-center gap-1"
          >
            {isSubmitting ? (
              "Starting trial..."
            ) : (
              <>
                <Rocket size={18} /> Start Free Trial
              </>
            )}
          </button>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs md:text-sm text-gray-600">
            {features.map((f, i) => (
              <div key={i} className="flex items-start gap-2">
                <CheckCircle size={18} className="text-purple-600 mt-0.5" />
                <div className="font-medium text-gray-800">{f.label}</div>
              </div>
            ))}
          </div>

          {/* Sign In */}
          <div className="text-center">
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-200" />
              <div className="text-xs text-gray-400">Already have an account?</div>
              <div className="flex-1 h-px bg-gray-200" />
            </div>
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="w-full mt-5 flex items-center justify-center gap-1 py-2 border-2 border-gray-200 rounded-lg text-gray-800 hover:bg-blue-50 hover:border-blue-600"
            >
              <LogIn size={15} className="mt-1" /> Sign In Instead
            </button>
          </div>

          {/* Footer */}
          <div className="text-center text-xs text-gray-500 mt-4">
            <div className="flex items-center justify-center gap-2">
              <div className="bg-gray-100 p-2 rounded-full">
                <ShieldCheck size={16} />
              </div>
              <div>
                Your data is secure and protected with enterprise-grade encryption
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
