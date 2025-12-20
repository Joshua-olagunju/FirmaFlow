import { useState } from "react";
import { useSubscription } from "../contexts/SubscriptionContext";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Clock, Crown, X } from "lucide-react";

/**
 * SubscriptionBanner - Shows subscription status across all pages
 * Displays trial countdown, expiration warnings, and upgrade prompts
 */
const SubscriptionBanner = () => {
  const navigate = useNavigate();
  const {
    hasValidSubscription,
    isTrialActive,
    daysRemaining,
    statusMessage,
    liveCountdown,
    plan,
    requiresSubscription,
  } = useSubscription();
  
  const [isDismissed, setIsDismissed] = useState(false);

  // Don't show banner if dismissed or has valid non-trial subscription
  if (isDismissed || (hasValidSubscription && !isTrialActive)) {
    return null;
  }

  // Show critical banner if subscription required
  if (requiresSubscription) {
    return (
      <div className="bg-red-600 text-white">
        <div className="max-w-7xl mx-auto py-3 px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between flex-wrap">
            <div className="w-0 flex-1 flex items-center">
              <span className="flex p-2 rounded-lg bg-red-800">
                <AlertTriangle className="h-5 w-5" />
              </span>
              <div className="ml-3">
                <p className="font-medium text-sm md:text-base">
                  {statusMessage}
                </p>
                <p className="text-xs md:text-sm opacity-90 mt-0.5">
                  Sales, Payments, Purchases, Expenses & Reports are locked. Customers, Suppliers, Inventory & Settings remain accessible.
                </p>
              </div>
            </div>
            <div className="order-3 mt-2 flex-shrink-0 w-full sm:order-2 sm:mt-0 sm:w-auto">
              <button
                onClick={() => navigate("/subscription")}
                className="flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-red-600 bg-white hover:bg-red-50 transition w-full sm:w-auto"
              >
                Subscribe Now
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show warning banner for trial or near expiration
  if (isTrialActive) {
    const isUrgent = daysRemaining <= 3;
    const bgColor = isUrgent ? "bg-orange-600" : "bg-blue-600";
    const bgHover = isUrgent ? "bg-orange-50" : "bg-blue-50";
    const textColor = isUrgent ? "text-orange-600" : "text-blue-600";

    return (
      <div className={`${bgColor} text-white`}>
        <div className="max-w-7xl mx-auto py-2 px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex-1 flex items-center min-w-0">
              <span className={`flex p-2 rounded-lg ${isUrgent ? 'bg-orange-800' : 'bg-blue-800'}`}>
                {isUrgent ? (
                  <AlertTriangle className="h-4 w-4 md:h-5 md:w-5" />
                ) : (
                  <Clock className="h-4 w-4 md:h-5 md:w-5" />
                )}
              </span>
              <div className="ml-3 min-w-0 flex-1">
                <p className="font-medium text-xs md:text-sm">
                  Free Trial {isUrgent ? "Ending Soon" : "Active"}
                </p>
                {liveCountdown ? (
                  <p className="text-xs md:text-sm opacity-90">
                    {liveCountdown.message}
                  </p>
                ) : (
                  <p className="text-xs md:text-sm opacity-90">
                    {daysRemaining} {daysRemaining === 1 ? "day" : "days"} remaining
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate("/subscription")}
                className={`flex items-center gap-1 px-3 py-1.5 md:px-4 md:py-2 border border-transparent rounded-md shadow-sm text-xs md:text-sm font-medium ${textColor} bg-white hover:${bgHover} transition`}
              >
                <Crown className="h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden sm:inline">Upgrade Now</span>
                <span className="sm:hidden">Upgrade</span>
              </button>
              <button
                onClick={() => setIsDismissed(true)}
                className="p-1.5 hover:bg-white/10 rounded transition"
                aria-label="Dismiss banner"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show info banner for paid subscription near expiration
  if (hasValidSubscription && daysRemaining <= 7) {
    return (
      <div className="bg-yellow-600 text-white">
        <div className="max-w-7xl mx-auto py-2 px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex-1 flex items-center min-w-0">
              <span className="flex p-2 rounded-lg bg-yellow-800">
                <Clock className="h-4 w-4 md:h-5 md:w-5" />
              </span>
              <div className="ml-3 min-w-0 flex-1">
                <p className="font-medium text-xs md:text-sm">
                  Subscription Expiring Soon
                </p>
                <p className="text-xs md:text-sm opacity-90">
                  Your {plan} plan {liveCountdown ? liveCountdown.message : `expires in ${daysRemaining} days`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate("/subscription")}
                className="px-3 py-1.5 md:px-4 md:py-2 border border-transparent rounded-md shadow-sm text-xs md:text-sm font-medium text-yellow-600 bg-white hover:bg-yellow-50 transition"
              >
                <span className="hidden sm:inline">Renew Subscription</span>
                <span className="sm:hidden">Renew</span>
              </button>
              <button
                onClick={() => setIsDismissed(true)}
                className="p-1.5 hover:bg-white/10 rounded transition"
                aria-label="Dismiss banner"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default SubscriptionBanner;
