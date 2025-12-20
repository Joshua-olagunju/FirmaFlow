import { useState } from "react";
import { Check, Sparkles } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import { initiateFlutterwavePayment } from "./flutterwaveUtils";
import { useUser } from "../../contexts/UserContext";

const SubscriptionPlans = ({
  subscriptionData,
  formatCurrency,
  onPaymentSuccess,
}) => {
  const { theme } = useTheme();
  const { user } = useUser();
  const [billingPeriod, setBillingPeriod] = useState("monthly");
  const [isProcessing, setIsProcessing] = useState(false);

  const plans = [
    {
      id: 1,
      name: "Starter",
      basePrice: 5000,
      features: [
        "Up to 50 invoices per month",
        "Basic reporting",
        "Email support",
        "2 user accounts",
        "Mobile app access",
      ],
      recommended: false,
    },
    {
      id: 2,
      name: "Professional",
      basePrice: 10000,
      features: [
        "Unlimited invoices",
        "Advanced reporting & analytics",
        "Priority email & chat support",
        "5 user accounts",
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
        "Everything in Professional",
        "Unlimited user accounts",
        "24/7 phone support",
        "Dedicated account manager",
        "Custom integrations",
        "Advanced security features",
        "SLA guarantee",
      ],
      recommended: false,
    },
  ];

  const billingPeriods = [
    { value: "monthly", label: "Monthly", discount: 0 },
    { value: "quarterly", label: "Quarterly", discount: 3 },
    { value: "6-months", label: "6 Months", discount: 6 },
    { value: "yearly", label: "Yearly", discount: 10 },
  ];

  const calculatePrice = (basePrice) => {
    const period = billingPeriods.find((p) => p.value === billingPeriod);
    const discount = period?.discount || 0;
    const multiplier =
      billingPeriod === "quarterly"
        ? 3
        : billingPeriod === "6-months"
        ? 6
        : billingPeriod === "yearly"
        ? 12
        : 1;

    const totalPrice = basePrice * multiplier;
    const discountedPrice = totalPrice * (1 - discount / 100);

    return {
      total: discountedPrice,
      original: totalPrice,
      discount,
      multiplier,
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
        billingPeriod: billingPeriod === '6-months' ? 'six_months' : billingPeriod,
        onSuccess: () => {
          onPaymentSuccess();
          setIsProcessing(false);
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

  const currentPlan = subscriptionData?.data?.subscription_plan;

  return (
    <div className="space-y-6">
      {/* Billing Period Toggle */}
      <div className={`${theme.cardBg} rounded-lg shadow p-4 md:p-6`}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h3 className={`text-lg font-semibold ${theme.text}`}>
              Choose Your Billing Period
            </h3>
            <p className={`text-sm ${theme.textSecondary} mt-1`}>
              Save more with longer billing periods
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {billingPeriods.map((period) => (
              <button
                key={period.value}
                onClick={() => setBillingPeriod(period.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition relative ${
                  billingPeriod === period.value
                    ? "bg-[#667eea] text-white"
                    : `${theme.cardBg} border ${theme.border} ${theme.text} hover:border-[#667eea]`
                }`}
              >
                {period.label}
                {period.discount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                    -{period.discount}%
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {plans.map((plan) => {
          const pricing = calculatePrice(plan.basePrice);
          const isCurrentPlan =
            currentPlan?.toLowerCase() === plan.name.toLowerCase();

          return (
            <div
              key={plan.id}
              className={`${theme.cardBg} rounded-lg shadow relative ${
                plan.recommended
                  ? "ring-2 ring-[#667eea] transform scale-105"
                  : ""
              }`}
            >
              {plan.recommended && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white text-xs font-bold px-4 py-1 rounded-full flex items-center gap-1">
                    <Sparkles size={12} />
                    RECOMMENDED
                  </span>
                </div>
              )}

              <div className="p-6">
                {/* Plan Name */}
                <h3 className={`text-2xl font-bold ${theme.text} mb-2`}>
                  {plan.name}
                </h3>

                {/* Price */}
                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className={`text-3xl font-bold ${theme.text}`}>
                      {formatCurrency(pricing.total)}
                    </span>
                    <span className={`text-sm ${theme.textSecondary}`}>
                      /{billingPeriod}
                    </span>
                  </div>

                  {pricing.discount > 0 && (
                    <div className="mt-1">
                      <span className={`text-sm ${theme.textSecondary} line-through`}>
                        {formatCurrency(pricing.original)}
                      </span>
                      <span className="text-sm text-green-500 ml-2 font-medium">
                        Save {pricing.discount}%
                      </span>
                    </div>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check
                        className="flex-shrink-0 text-green-500 mt-0.5"
                        size={18}
                      />
                      <span className={`text-sm ${theme.text}`}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* Subscribe Button */}
                <button
                  onClick={() => handleSubscribe(plan)}
                  disabled={isCurrentPlan || isProcessing}
                  className={`w-full py-3 rounded-lg font-medium transition ${
                    isCurrentPlan
                      ? `${theme.cardBg} border ${theme.border} ${theme.textSecondary} cursor-not-allowed`
                      : plan.recommended
                      ? "bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white hover:shadow-lg"
                      : `bg-[#667eea] text-white hover:bg-[#5568d3]`
                  } ${isProcessing ? "opacity-50 cursor-wait" : ""}`}
                >
                  {isCurrentPlan
                    ? "Current Plan"
                    : isProcessing
                    ? "Processing..."
                    : "Subscribe Now"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SubscriptionPlans;
