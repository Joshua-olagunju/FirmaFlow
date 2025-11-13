import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  CheckCircle,
  Star,
  HelpCircle,
  KeyIcon,
  LogIn,
  Home,
} from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((s) => ({
      ...s,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Auto-hide messages after 5s
  useState(() => {
    if (message.text) {
      const timer = setTimeout(() => setMessage({ text: "", type: "" }), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ text: "", type: "" }); // Clear previous messages

    try {
      const response = await fetch(
        "http://localhost:8888/firmaflow-React/FirmaFlow/api/auth.php",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "login",
            email: formData.email,
            password: formData.password,
            rememberMe: formData.rememberMe,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setMessage({ text: "Login successful! Redirecting...", type: "success" });
        // Redirect after 1s to allow user to see message
        setTimeout(() => navigate("/dashboard"), 1000);
      } else {
        setMessage({ text: data.error || "Invalid credentials", type: "error" });
      }
    } catch (error) {
      console.error("Login error:", error);
      setMessage({ text: "Network error. Please check your connection.", type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  const benefits = [
    "Complete inventory & sales management",
    "Professional invoicing & payments",
    "Real-time business analytics",
    "Multi-device access & cloud sync",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-purple-800 flex items-start justify-center py-12 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* top header gradient */}
        <div className="bg-gradient-to-b from-purple-800 to-blue-500 text-white p-6 text-center">
          <div className="w-full flex align-center justify-start mb-5">
            <button
              onClick={() => navigate("/")}
              className="w-20 flex align-center justify-center gap-1 border-2 rounded-md hover:transition-2 hover:bg-blue-50 hover:text-gray-500"
            >
              <Home size={18} className="mt-0.5 " />Home
            </button>
          </div>
          <div className="m-auto w-75 gap-3 flex items-start justify-center mb-2">
            <span>
              <img
                src="./firmaflow-logo.jpg"
                alt="FirmaFlow Ledger"
                className="mx-auto w-14 h-14 mb-2 rounded-md mt-1"
              />
            </span>
            <span className="flex flex-col align-start">
              <h1 className="text-4xl font-semibold">FirmaFlow</h1>
              <p className="text-xs opacity-100 mt-1 flex align-start">LEDGER</p>
            </span>
          </div>
          <p className="mt-3 text-sm w-75 m-auto">Welcome back! Sign in to your business dashboard</p>
        </div>

        {/* form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Success/Error Message */}
          {message.text && (
            <div
              className={`p-3 mb-4 text-center rounded ${
                message.type === "success"
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {message.text}
            </div>
          )}

          {/* email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail size={18} className="absolute left-3 top-4 text-gray-400" />
              <input
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email address"
                className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>
          </div>

          {/* password */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <a href="#" className="text-sm text-purple-600 hover:underline">
                Forgot password?
              </a>
            </div>
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-4 text-gray-400" />
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                className="w-full pl-11 pr-11 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3 top-3 text-gray-500"
                aria-label="toggle password visibility"
              >
                {showPassword ? <EyeOff size={18} className="mt-1" /> : <Eye size={18} className="mt-1" />}
              </button>
            </div>
          </div>

          {/* remember */}
          <div className="flex items-center">
            <input
              id="remember"
              name="rememberMe"
              type="checkbox"
              checked={formData.rememberMe}
              onChange={handleChange}
              className="w-4 h-4 text-purple-600 border-gray-300 rounded"
            />
            <label htmlFor="remember" className="ml-3 text-sm text-gray-700">
              Keep me signed in for 30 days
            </label>
          </div>

          {/* sign in button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex align-center justify-center gap-1 rounded-xl py-3 font-semibold text-white bg-gradient-to-r from-purple-600 to-purple-500 shadow-sm hover:opacity-90"
          >
            <LogIn size={15} className="mt-1"/>
            {isLoading ? "Signing in..." : "Sign In to Dashboard"}
          </button>

                    {/* small divider line */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-200" />
            <div className="text-xs text-gray-400">Don't have an account?</div>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* create account button - pill with icon */}
          <div>
            <button
              type="button"
              onClick={() => navigate("/signup")}
              className="w-full flex items-center justify-center rounded-lg py-3 border border-gray-200 bg-white text-gray-800 font-medium hover:bg-blue-50 hover:border-blue-600 border-2"
            >
              <User size={16} /><span>+ Create Free Account</span>
            </button>
          </div>

          {/* benefits block (soft purple card) */}
          <div className="mt-1 bg-purple-50 border border-transparent rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Star size={14} className="text-purple-600" />
              <div className="text-xs font-medium text-purple-700">What you get with FirmaFlow Ledger</div>
            </div>

            <ul className="space-y-3 text-sm text-gray-700">
              {benefits.map((b, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="mt-0.5 w-7 h-7 rounded-full bg-purple-600/20 flex items-center justify-center">
                    <CheckCircle size={14} className="text-purple-600" />
                  </div>
                  <div className="leading-snug">{b}</div>
                </li>
              ))}
            </ul>
          </div>

          {/* thin divider */}
          <div className="h-px bg-gray-200 my-3" />

          {/* help header */}
          <div className="text-center">
            <div className="inline-flex items-center gap-2 text-xs text-blue-600 font-medium">
              <HelpCircle size={14} /> Need Help Accessing Your Account?
            </div>
            <p className="mt-2 text-xs text-gray-600">
              Can't log in? Account suspended or deactivated? We're here to help.
            </p>
          </div>

          {/* Reset & Contact buttons (green outline and blue outline) */}
          <div className="flex gap-3 mt-3">
            <button
              type="button"
              className="flex-1 flex gap-1 align-center justify-center py-2 rounded-md border-2 border-green-500 text-green-600 font-medium text-sm hover:bg-green-50"
              onClick={() => alert("Reset password flow")}
            >
              <KeyIcon size={15} className="mt-0.5" />
              Reset Password
            </button>

            <button
              type="button"
              className="flex-1 flex gap-1 align-center justify-center py-2 rounded-md border-2 border-blue-600 text-blue-600 font-medium text-sm hover:bg-blue-50"
              onClick={() => alert("Contact support flow")}
            >
              <Mail size={15} className="mt-0.5" />
              Contact Support
            </button>
          </div>

          <div className="text-xs text-gray-500 mt-2">
            For password resets, use our secure OTP system. For other issues, contact support@firmaflowledger.com
          </div>

          <div className="h-px bg-gray-200 my-4" />

          {/* terms & privacy */}
          <div className="text-center text-xs text-gray-600">
            By signing in, you agree to our{" "}
            <a href="#" className="text-purple-600 hover:underline">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="text-purple-600 hover:underline">
              Privacy Policy
            </a>
          </div>

          {/* lock row */}
          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-500">
            <div className="w-5 h-5 flex items-center justify-center rounded-full bg-gray-100">🔒</div>
            <div>Your data is secure and protected with enterprise-grade encryption</div>
          </div>
        </form>
      </div>
    </div>
  );
}


// import { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import {
//   Eye,
//   EyeOff,
//   Mail,
//   Lock,
//   User,
//   CheckCircle,
//   Star,
//   HelpCircle,
//   KeyIcon,
//   LogIn,
//   Home,
// } 
// from "lucide-react";

// export default function Login() {
//   const navigate = useNavigate();
//   const [showPassword, setShowPassword] = useState(false);
//   const [isLoading, setIsLoading] = useState(false);

//   const [formData, setFormData] = useState({
//     email: "",
//     password: "",
//     rememberMe: false,
//   });

//   const handleChange = (e) => {
//     const { name, value, type, checked } = e.target;
//     setFormData((s) => ({
//       ...s,
//       [name]: type === "checkbox" ? checked : value,
//     }));
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setIsLoading(true);

//     // simulate auth request
//     setTimeout(() => {
//       setIsLoading(false);
//       navigate("/dashboard");
//     }, 900);
//   };

//   const benefits = [
//     "Complete inventory & sales management",
//     "Professional invoicing & payments",
//     "Real-time business analytics",
//     "Multi-device access & cloud sync",
//   ];

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-purple-800 flex items-start justify-center py-12 px-4">
//       <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
//         {/* top header gradient */}
//         <div className="bg-gradient-to-b from-purple-800 to-blue-500 text-white p-6 text-center">
//           <div className="w-full flex align-center justify-start mb-5">
//             <button
//               onClick={() => navigate("/")}
//               className="w-20 flex align-center justify-center gap-1 border-2 rounded-md hover:transition-2 hover:bg-blue-50 hover:text-gray-500"
//             >
//               <Home size={18} className="mt-0.5 " />Home
//             </button>
//           </div>
//           <div className="m-auto w-75 gap-3 flex items-start justify-center mb-2">
//             <span className="">
//                <img
//                 src="./firmaflow-logo.jpg"
//                 alt="FirmaFlow Ledger"
//                 className="mx-auto w-14 h-14 mb-2 rounded-md mt-1"
//               />
//             </span>
//             <span className="flex flex-col align-start">
//               <h1 className="text-4xl font-semibold">FirmaFlow</h1>
//               <p className="text-xs opacity-100 mt-1 flex align-start">LEDGER</p>
//             </span>
//           </div>
//           <p className="mt-3 text-sm w-75 m-auto">Welcome back! Sign in to your business dashboard</p>
//         </div>

//         {/* form */}
//         <form onSubmit={handleSubmit} className="p-6 space-y-5">
//           {/* email */}
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-2">
//               Email Address
//             </label>
//             <div className="relative">
//               <Mail size={18} className="absolute left-3 top-4 text-gray-400" />
//               <input
//                 name="email"
//                 type="email"
//                 required
//                 value={formData.email}
//                 onChange={handleChange}
//                 placeholder="Enter your email address"
//                 className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
//               />
//             </div>
//           </div>

//           {/* password */}
//           <div>
//             <div className="flex items-center justify-between mb-1">
//               <label className="block text-sm font-medium text-gray-700">Password</label>
//               <a href="#" className="text-sm text-purple-600 hover:underline">
//                 Forgot password?
//               </a>
//             </div>

//             <div className="relative">
//               <Lock size={18} className="absolute left-3 top-4 text-gray-400" />
//               <input
//                 name="password"
//                 type={showPassword ? "text" : "password"}
//                 required
//                 value={formData.password}
//                 onChange={handleChange}
//                 placeholder="Enter your password"
//                 className="w-full pl-11 pr-11 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
//               />
//               <button
//                 type="button"
//                 onClick={() => setShowPassword((s) => !s)}
//                 className="absolute right-3 top-3 text-gray-500"
//                 aria-label="toggle password visibility"
//               >
//                 {showPassword ? <EyeOff size={18} className="mt-1" /> : <Eye size={18} className="mt-1" />}
//               </button>
//             </div>
//           </div>

//           {/* remember */}
//           <div className="flex items-center">
//             <input
//               id="remember"
//               name="rememberMe"
//               type="checkbox"
//               checked={formData.rememberMe}
//               onChange={handleChange}
//               className="w-4 h-4 text-purple-600 border-gray-300 rounded"
//             />
//             <label htmlFor="remember" className="ml-3 text-sm text-gray-700">
//               Keep me signed in for 30 days
//             </label>
//           </div>

//           {/* sign in button (primary) */}
//           <button
//             type="submit"
//             disabled={isLoading}
//             className="w-full flex align-center justify-center gap-1 rounded-xl py-3 font-semibold text-white bg-gradient-to-r from-purple-600 to-purple-500 shadow-sm border-3 hover:opacity-90 transition flex items-center justify-center hover:border-purple-600"
//           >
//             <LogIn size={15} className="log"/>
//             {isLoading ? "Signing in..." : "Sign In to Dashboard"}
//           </button>

//           {/* small divider line */}
//           <div className="flex items-center gap-3">
//             <div className="flex-1 h-px bg-gray-200" />
//             <div className="text-xs text-gray-400">Don't have an account?</div>
//             <div className="flex-1 h-px bg-gray-200" />
//           </div>

//           {/* create account button - pill with icon */}
//           <div>
//             <button
//               type="button"
//               onClick={() => navigate("/signup")}
//               className="w-full flex items-center justify-center rounded-lg py-3 border border-gray-200 bg-white text-gray-800 font-medium hover:bg-blue-50 hover:border-blue-600 border-2"
//             >
//               <User size={16} /><span>+ Create Free Account</span>
//             </button>
//           </div>

//           {/* benefits block (soft purple card) */}
//           <div className="mt-1 bg-purple-50 border border-transparent rounded-xl p-4">
//             <div className="flex items-center gap-2 mb-3">
//               <Star size={14} className="text-purple-600" />
//               <div className="text-xs font-medium text-purple-700">What you get with FirmaFlow Ledger</div>
//             </div>

//             <ul className="space-y-3 text-sm text-gray-700">
//               {benefits.map((b, i) => (
//                 <li key={i} className="flex items-start gap-3">
//                   <div className="mt-0.5 w-7 h-7 rounded-full bg-purple-600/20 flex items-center justify-center">
//                     <CheckCircle size={14} className="text-purple-600" />
//                   </div>
//                   <div className="leading-snug">{b}</div>
//                 </li>
//               ))}
//             </ul>
//           </div>

//           {/* thin divider */}
//           <div className="h-px bg-gray-200 my-3" />

//           {/* help header */}
//           <div className="text-center">
//             <div className="inline-flex items-center gap-2 text-xs text-blue-600 font-medium">
//               <HelpCircle size={14} /> Need Help Accessing Your Account?
//             </div>
//             <p className="mt-2 text-xs text-gray-600">
//               Can't log in? Account suspended or deactivated? We're here to help.
//             </p>
//           </div>

//           {/* Reset & Contact buttons (green outline and blue outline) */}
//           <div className="flex gap-3 mt-3">
//             <button
//               type="button"
//               className="flex-1 flex gap-1 align-center justify-center py-2 rounded-md border-2 border-green-500 text-green-600 font-medium text-sm hover:bg-green-50"
//               onClick={() => alert("Reset password flow")}
//             >
//               <KeyIcon size={15} className="mt-0.5" />
//               Reset Password
//             </button>

//             <button
//               type="button"
//               className="flex-1 flex gap-1 align-center justify-center py-2 rounded-md border-2 border-blue-600 text-blue-600 font-medium text-sm hover:bg-blue-50"
//               onClick={() => alert("Contact support flow")}
//             >
//               <Mail size={15} className="mt-0.5" />
//               Contact Support
//             </button>
//           </div>

//           <div className="text-xs text-gray-500 mt-2">
//             For password resets, use our secure OTP system. For other issues, contact support@firmaflowledger.com
//           </div>

//           <div className="h-px bg-gray-200 my-4" />

//           {/* terms & privacy */}
//           <div className="text-center text-xs text-gray-600">
//             By signing in, you agree to our{" "}
//             <a href="#" className="text-purple-600 hover:underline">
//               Terms of Service
//             </a>{" "}
//             and{" "}
//             <a href="#" className="text-purple-600 hover:underline">
//               Privacy Policy
//             </a>
//           </div>

//           {/* lock row */}
//           <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-500">
//             <div className="w-5 h-5 flex items-center justify-center rounded-full bg-gray-100">🔒</div>
//             <div>Your data is secure and protected with enterprise-grade encryption</div>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// }

