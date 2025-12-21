import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSubscription } from "../contexts/SubscriptionContext";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Clock, Crown, X } from "lucide-react";

/**
 * SubscriptionBanner - Shows subscription status across all pages
 * Displays trial countdown, expiration warnings, and upgrade prompts
 * Positioned absolutely at the top, above sidebar and layout
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
  const [isVisible, setIsVisible] = useState(false);

  // Show banner after mount to trigger animation
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Debug: Log subscription status
  useEffect(() => {
    console.log("📊 Subscription Banner Status:", {
      plan,
      hasValidSubscription,
      isTrialActive,
      requiresSubscription,
      daysRemaining,
    });
  }, [
    plan,
    hasValidSubscription,
    isTrialActive,
    requiresSubscription,
    daysRemaining,
  ]);

  // Don't show banner if dismissed, on enterprise/professional plan, or has valid non-trial subscription
  const isEnterpriseOrPro = plan === "enterprise" || plan === "professional";
  if (
    isDismissed ||
    isEnterpriseOrPro ||
    (hasValidSubscription && !isTrialActive)
  ) {
    return null;
  }

  // Show critical banner if subscription required
  if (requiresSubscription) {
    return (
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed top-0 left-0 right-0 z-[9999] bg-red-600 text-white shadow-lg"
          >
            <div className="max-w-7xl mx-auto py-3 px-3 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between flex-wrap">
                <div className="w-0 flex-1 flex items-center">
                  <motion.span
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="flex p-2 rounded-lg bg-red-800"
                  >
                    <AlertTriangle className="h-5 w-5" />
                  </motion.span>
                  <div className="ml-3">
                    <p className="font-medium text-sm md:text-base">
                      {statusMessage}
                    </p>
                    <p className="text-xs md:text-sm opacity-90 mt-0.5">
                      Sales, Payments, Purchases, Expenses & Reports are locked.
                      Customers, Suppliers, Inventory & Settings remain
                      accessible.
                    </p>
                  </div>
                </div>
                <div className="order-3 mt-2 flex-shrink-0 w-full sm:order-2 sm:mt-0 sm:w-auto">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate("/subscription")}
                    className="flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-red-600 bg-white hover:bg-red-50 transition w-full sm:w-auto"
                  >
                    Subscribe Now
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  // Show warning banner for trial or near expiration
  if (isTrialActive) {
    const isUrgent = daysRemaining <= 3;
    const bgColor = isUrgent ? "bg-orange-600" : "bg-blue-600";
    const bgHover = isUrgent ? "hover:bg-orange-50" : "hover:bg-blue-50";
    const textColor = isUrgent ? "text-orange-600" : "text-blue-600";
    const iconBg = isUrgent ? "bg-orange-800" : "bg-blue-800";

    return (
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={`fixed top-0 left-0 right-0 z-[9999] ${bgColor} text-white shadow-lg`}
          >
            <div className="max-w-7xl mx-auto py-2 px-3 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex-1 flex items-center min-w-0">
                  <motion.span
                    animate={isUrgent ? { scale: [1, 1.1, 1] } : {}}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className={`flex p-2 rounded-lg ${iconBg}`}
                  >
                    {isUrgent ? (
                      <AlertTriangle className="h-4 w-4 md:h-5 md:w-5" />
                    ) : (
                      <Clock className="h-4 w-4 md:h-5 md:w-5" />
                    )}
                  </motion.span>
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
                        {daysRemaining} {daysRemaining === 1 ? "day" : "days"}{" "}
                        remaining
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate("/subscription")}
                    className={`flex items-center gap-1 px-3 py-1.5 md:px-4 md:py-2 border border-transparent rounded-md shadow-sm text-xs md:text-sm font-medium ${textColor} bg-white ${bgHover} transition`}
                  >
                    <Crown className="h-3 w-3 md:h-4 md:w-4" />
                    <span className="hidden sm:inline">Upgrade</span>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsDismissed(true)}
                    className="p-1.5 hover:bg-white/20 rounded-md transition"
                    aria-label="Dismiss"
                  >
                    <X className="h-4 w-4 md:h-5 md:w-5" />
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  return null;
};

export default SubscriptionBanner;
