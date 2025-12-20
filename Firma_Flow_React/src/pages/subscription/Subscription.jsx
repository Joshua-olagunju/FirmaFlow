import { useState, useRef } from "react";
import Layout from "../../components/Layout";
import { Menu, Crown, Check, Sparkles, TrendingUp, History } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import { useSettings } from "../../contexts/SettingsContext";
import { useUser } from "../../contexts/UserContext";
import { useSubscription } from "../../contexts/SubscriptionContext";
import { initiateFlutterwavePayment } from "./flutterwaveUtils";
import BillingHistory from "./BillingHistory";

const Subscription = () => {
  const { theme } = useTheme();
  const { formatCurrency } = useSettings();
  const { user } = useUser();
  const { 
    subscriptionStatus, 
    refreshSubscription, 
    isLoading: subscriptionLoading,
    isInherited,
    inheritedFrom,
  } = useSubscription();
  const openSidebarRef = useRef(null);
  const [billingPeriod, setBillingPeriod] = useState("monthly");
  const [isProcessing, setIsProcessing] = useState(false);

  // Plans configuration matching PHP subscription_helper.php getAllowedFeatures()
  const plans = [
    {
      id: 1,
      name: "Starter",
      basePrice: 5000,
      features: [
        "Up to 100 customers",
        "Up to 500 products",
        "Basic reporting",
        "Email support",
        "1 user account",
        "Mobile app access",
      ],
      recommended: false,
    },
    {
      id: 2,
      name: "Professional",
      basePrice: 10000,
      features: [
        "Up to 1,000 customers",
        "Up to 2,000 products",
        "Advanced reporting & analytics",
        "Priority email & chat support",
        "Up to 5 user accounts",
        "Mobile app access",
        "Custom branding",
        "API access",
      ],
      recommended: true,
    },
    {
      id: 3,
      name: "Enterprise",
      basePrice: 15000,
      features: [
        "Unlimited customers",
        "Unlimited products",
        "Full reporting suite",
        "24/7 phone support",
        "Unlimited user accounts",
        "Dedicated account manager",
        "Custom integrations",
        "Advanced security features",
        "SLA guarantee",
      ],
      recommended: false,
    },
  ];

  const billingPeriods = [
    { value: "monthly", label: "Monthly", discount: 0, multiplier: 1 },
    { value: "quarterly", label: "Quarterly", discount: 3, multiplier: 3 },
    { value: "six_months", label: "6 Months", discount: 6, multiplier: 6 },
    { value: "yearly", label: "Yearly", discount: 10, multiplier: 12 },
  ];

  const calculatePrice = (basePrice) => {
    const period = billingPeriods.find((p) => p.value === billingPeriod);
    const discount = period?.discount || 0;
    const multiplier = period?.multiplier || 1;
    const totalPrice = basePrice * multiplier;
    const discountedPrice = totalPrice * (1 - discount / 100);

    return {
      total: discountedPrice,
      original: totalPrice,
      discount,
      multiplier,
      saved: totalPrice - discountedPrice,
    };
  };

  const handleSubscribe = async (plan) => {
    if (!user) {
      alert("Please log in to subscribe");
      return;
    }

    setIsProcessing(true);
    try {
      const pricing = calculatePrice(plan.basePrice);
      await initiateFlutterwavePayment({
        amount: pricing.total,
        email: user.email,
        name: user.full_name || user.username,
        phone: user.phone || "",
        planName: plan.name.toLowerCase(),
        billingPeriod,
        onSuccess: async () => {
          // Refresh subscription context - updates from real database via subscription.php API
          await refreshSubscription();
          setIsProcessing(false);
          alert("Subscription activated successfully!");
        },
        onClose: () => {
          setIsProcessing(false);
        },
      });
    } catch (error) {
      console.error("Payment error:", error);
      alert("Failed to initiate payment. Please try again.");
      setIsProcessing(false);
    }
  };

  // Get current plan from subscription context (loaded from database via subscription.php)
  const currentPlan = subscriptionStatus?.subscription_plan;
  const isLoading = subscriptionLoading;

  return (
    <Layout onMenuClick={(fn) => (openSidebarRef.current = fn)}>
      <div className="w-full flex flex-col flex-1 gap-6 px-2 md:px-4 pb-8">
        {/* Header */}
        <div className="w-full flex justify-between items-start rounded-b-lg align-top p-4 md:p-6 bg-gradient-to-br from-[#667eea] to-[#764ba2] mt-0">
          <div className="flex-col items-center pb-2 md:pb-4 flex-1">
            <h2 className="text-white font-bold text-xl md:text-3xl flex items-center gap-2">
              <Crown size={32} />
              Subscription Plans
            </h2>
            <p className="m-0 text-xs md:text-base font-medium text-slate-200 mt-1">
              Choose the perfect plan for your business needs
            </p>
          </div>
          <button
            onClick={() => openSidebarRef.current?.()}
            className="md:hidden p-2 hover:bg-white/10 rounded-lg transition flex-shrink-0"
          >
            <Menu size={24} className="text-white" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#667eea]"></div>
          </div>
        ) : (
          <>
            {/* Current Plan Banner */}
            {subscriptionStatus && currentPlan && currentPlan !== 'free' && (
              <div className={`${theme.cardBg} rounded-xl shadow-lg p-6 border-2 border-green-500`}>
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                      <Check className="text-green-600 dark:text-green-400" size={24} />
                    </div>
                    <div>
                      <h3 className={`text-lg font-bold ${theme.text}`}>
                        Current Plan: {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)}
                      </h3>
                      <p className={`text-sm ${theme.textSecondary}`}>
                        Status: {subscriptionStatus.subscription_status}
                        {isInherited && (
                          <span className="ml-2 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded text-xs font-medium">
                            Inherited from company admin
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="inline-flex items-center px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-sm font-semibold">
                    <TrendingUp size={16} className="mr-1" />
                    Active
                  </div>
                </div>
                {isInherited && (
                  <div className={`mt-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800`}>
                    <p className={`text-sm ${theme.text}`}>
                      <strong>Note:</strong> This subscription is managed by your company administrator. 
                      Contact your admin to change or upgrade the subscription plan.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Billing Period Selector */}
            <div className={`${theme.cardBg} rounded-xl shadow-lg p-6`}>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h3 className={`text-lg font-bold ${theme.text} mb-1`}>Choose Your Billing Period</h3>
                  <p className={`text-sm ${theme.textSecondary}`}>
                    Save more with longer billing periods
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {billingPeriods.map((period) => (
                    <button
                      key={period.value}
                      onClick={() => setBillingPeriod(period.value)}
                      className={`relative px-6 py-3 rounded-xl font-medium transition-all ${
                        billingPeriod === period.value
                          ? "bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white shadow-lg scale-105"
                          : `${theme.cardBg} border-2 ${theme.border} ${theme.text} hover:border-[#667eea]`
                      }`}
                    >
                      {period.label}
                      {period.discount > 0 && (
                        <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-bold shadow">
                          -{period.discount}%
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Subscription Plans */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {plans.map((plan) => {
                const pricing = calculatePrice(plan.basePrice);
                const isCurrentPlan = currentPlan?.toLowerCase() === plan.name.toLowerCase();

                return (
                  <div
                    key={plan.id}
                    className={`${theme.cardBg} rounded-2xl shadow-xl relative transition-all hover:scale-105 hover:shadow-2xl flex flex-col ${
                      plan.recommended
                        ? "ring-4 ring-[#667eea] ring-opacity-50"
                        : "border-2 border-gray-200 dark:border-gray-700"
                    }`}
                  >
                    {plan.recommended && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                        <span className="bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white text-xs font-bold px-4 py-1.5 rounded-full flex items-center gap-1 shadow-lg whitespace-nowrap">
                          <Sparkles size={12} />
                          MOST POPULAR
                        </span>
                      </div>
                    )}

                    <div className="p-5 md:p-6 flex flex-col flex-1">
                      {/* Plan Name */}
                      <h3 className={`text-xl md:text-2xl font-bold ${theme.text} mb-3`}>
                        {plan.name}
                      </h3>

                      {/* Price */}
                      <div className="mb-5">
                        <div className="flex items-baseline gap-1.5 flex-wrap">
                          <span className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-[#667eea] to-[#764ba2] bg-clip-text text-transparent">
                            {formatCurrency(pricing.total)}
                          </span>
                          <span className={`text-xs md:text-sm ${theme.textSecondary}`}>
                            /{billingPeriod}
                          </span>
                        </div>
                        
                        {pricing.discount > 0 && (
                          <div className="mt-2 flex items-center gap-2 flex-wrap">
                            <span className={`text-sm ${theme.textSecondary} line-through`}>
                              {formatCurrency(pricing.original)}
                            </span>
                            <span className="text-sm text-green-600 dark:text-green-400 font-semibold">
                              Save {formatCurrency(pricing.saved)}!
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Features */}
                      <ul className="space-y-2.5 mb-6 flex-1">
                        {plan.features.map((feature, index) => (
                          <li key={index} className="flex items-start gap-2.5">
                            <Check
                              className="flex-shrink-0 text-green-500 mt-0.5"
                              size={18}
                            />
                            <span className={`text-xs md:text-sm ${theme.text} leading-relaxed`}>
                              {feature}
                            </span>
                          </li>
                        ))}
                      </ul>

                      {/* Subscribe Button */}
                      <button
                        onClick={() => handleSubscribe(plan)}
                        disabled={isCurrentPlan || isProcessing || isInherited}
                        className={`w-full py-3 md:py-3.5 rounded-xl font-bold text-sm md:text-base transition-all ${
                          isCurrentPlan || isInherited
                            ? `${theme.cardBg} border-2 ${theme.border} ${theme.textSecondary} cursor-not-allowed`
                            : plan.recommended
                            ? "bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white hover:shadow-2xl hover:scale-105"
                            : `bg-[#667eea] text-white hover:bg-[#5568d3] hover:shadow-xl`
                        } ${isProcessing ? "opacity-50 cursor-wait" : ""}`}
                      >
                        {isCurrentPlan
                          ? "✓ Current Plan"
                          : isInherited
                          ? "Managed by Admin"
                          : isProcessing
                          ? "Processing..."
                          : `Start ${plan.name} Plan`}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Billing History Section */}
            <div className="mt-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gradient-to-r from-[#667eea] to-[#764ba2] rounded-lg">
                  <History className="text-white" size={24} />
                </div>
                <div>
                  <h3 className={`text-xl md:text-2xl font-bold ${theme.text}`}>
                    Billing History
                  </h3>
                  <p className={`text-sm ${theme.textSecondary}`}>
                    View all your past subscription payments
                  </p>
                </div>
              </div>
              <BillingHistory formatCurrency={formatCurrency} />
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};

export default Subscription;
