import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useUser } from "./UserContext";
import { buildApiUrl } from "../config/api.config";

const SubscriptionContext = createContext(null);

export const SubscriptionProvider = ({ children }) => {
  const { user, isAuthenticated } = useUser();
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [liveCountdown, setLiveCountdown] = useState(null);
  const [lastCheckTime, setLastCheckTime] = useState(null);

  // Check if we should fetch subscription (only 3 times per day)
  const shouldFetchSubscription = useCallback(() => {
    if (!lastCheckTime) return true;
    
    const now = Date.now();
    const hoursSinceLastCheck = (now - lastCheckTime) / (1000 * 60 * 60);
    
    // Check every 8 hours (3 times per day)
    return hoursSinceLastCheck >= 8;
  }, [lastCheckTime]);

  // Fetch subscription status from API
  const fetchSubscriptionStatus = useCallback(async (force = false) => {
    if (!isAuthenticated || !user) {
      setIsLoading(false);
      return;
    }

    // Skip if not forced and already checked recently
    if (!force && !shouldFetchSubscription()) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(
        buildApiUrl("api/subscription.php?action=current"),
        {
          method: "GET",
          credentials: "include",
        }
      );
      const data = await response.json();
      
      if (response.ok && data.success) {
        setSubscriptionStatus(data.data);
        setLastCheckTime(Date.now());
      } else {
        setSubscriptionStatus(null);
      }
    } catch (err) {
      console.error("Error fetching subscription status:", err);
      setSubscriptionStatus(null);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user, shouldFetchSubscription]);

  // Initialize subscription check on mount/login only
  useEffect(() => {
    console.log('🔄 Initial subscription check on login/mount');
    fetchSubscriptionStatus(true); // Force check on mount/login
  }, [user?.id]); // Only trigger when user ID changes (login/logout)

  // Periodic check every 8 hours
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const interval = setInterval(() => {
      if (shouldFetchSubscription()) {
        console.log('🔄 Periodic subscription check (8 hours)');
        fetchSubscriptionStatus(true);
      }
    }, 1000 * 60 * 60); // Check every hour if 8 hours have passed

    return () => clearInterval(interval);
  }, [isAuthenticated, user, shouldFetchSubscription, fetchSubscriptionStatus]);

  // Live countdown timer for expiration
  useEffect(() => {
    if (!subscriptionStatus?.expiration_timestamp) {
      setLiveCountdown(null);
      return;
    }

    const updateCountdown = () => {
      const now = Math.floor(Date.now() / 1000);
      const remaining = subscriptionStatus.expiration_timestamp - now;

      if (remaining <= 0) {
        setLiveCountdown({
          expired: true,
          message: "Expired",
          seconds: 0,
        });
        // Refresh subscription status when expired
        fetchSubscriptionStatus(true);
        return;
      }

      const days = Math.floor(remaining / 86400);
      const hours = Math.floor((remaining % 86400) / 3600);
      const minutes = Math.floor((remaining % 3600) / 60);
      const seconds = remaining % 60;

      let message = "";
      if (days > 0) {
        message = `${days}d ${hours}h ${minutes}m remaining`;
      } else if (hours > 0) {
        message = `${hours}h ${minutes}m ${seconds}s remaining`;
      } else if (minutes > 0) {
        message = `${minutes}m ${seconds}s remaining`;
      } else {
        message = `${seconds}s remaining`;
      }

      setLiveCountdown({
        expired: false,
        message,
        days,
        hours,
        minutes,
        seconds,
        totalSeconds: remaining,
      });
    };

    // Update immediately
    updateCountdown();

    // Update every second
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [subscriptionStatus?.expiration_timestamp, fetchSubscriptionStatus]);

  // Check if user has valid subscription (trial or paid)
  const hasValidSubscription = useCallback(() => {
    if (!subscriptionStatus) {
      return false;
    }
    
    // Check for active paid subscription
    if (
      subscriptionStatus.subscription_status === "active" &&
      subscriptionStatus.subscription_plan !== "free" &&
      subscriptionStatus.subscription_start_date
    ) {
      // Verify not expired
      if (subscriptionStatus.subscription_end_date) {
        const now = new Date();
        const endDate = new Date(subscriptionStatus.subscription_end_date);
        return now <= endDate;
      }
      return true;
    }

    // Check trial status
    const isTrial = !subscriptionStatus.subscription_start_date;
    
    if (isTrial && subscriptionStatus.trial_end_date) {
      const now = new Date();
      const trialEnd = new Date(subscriptionStatus.trial_end_date);
      return now <= trialEnd;
    }

    return false;
  }, [subscriptionStatus]);

  // Check if user is on trial
  const isTrialActive = useCallback(() => {
    if (!subscriptionStatus) return false;
    
    const isTrial = !subscriptionStatus.subscription_start_date;
    
    if (!isTrial) return false;

    if (subscriptionStatus.trial_end_date) {
      const now = new Date();
      const trialEnd = new Date(subscriptionStatus.trial_end_date);
      return now <= trialEnd;
    }

    return false;
  }, [subscriptionStatus]);

  // Get days remaining (trial or subscription)
  const getDaysRemaining = useCallback(() => {
    if (!subscriptionStatus) return 0;

    const endDate = subscriptionStatus.subscription_end_date || 
                    subscriptionStatus.trial_end_date;
    
    if (!endDate) return 0;

    const now = new Date();
    const end = new Date(endDate);
    
    if (now > end) return 0;

    const diffTime = end - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  }, [subscriptionStatus]);

  // Get trial progress percentage (0-100)
  const getTrialProgress = useCallback(() => {
    if (!subscriptionStatus?.trial_start_date || !subscriptionStatus?.trial_end_date) {
      return 100;
    }

    const start = new Date(subscriptionStatus.trial_start_date);
    const end = new Date(subscriptionStatus.trial_end_date);
    const now = new Date();

    const total = end - start;
    const elapsed = now - start;

    if (elapsed <= 0) return 0;
    if (elapsed >= total) return 100;

    return Math.round((elapsed / total) * 100);
  }, [subscriptionStatus]);

  // Get allowed features based on plan
  const getAllowedFeatures = useCallback(() => {
    if (!subscriptionStatus) return [];

    const plan = subscriptionStatus.subscription_plan || "free";
    const planFeatures = {
      free: ["dashboard", "customers", "suppliers", "inventory", "settings"],
      starter: ["dashboard", "customers", "suppliers", "inventory", "sales", "payments", "settings"],
      professional: ["dashboard", "customers", "suppliers", "inventory", "sales", "payments", "purchases", "expenses", "reports", "settings"],
      enterprise: ["dashboard", "customers", "suppliers", "inventory", "sales", "payments", "purchases", "expenses", "reports", "advanced_reports", "settings"],
    };

    return planFeatures[plan] || planFeatures.free;
  }, [subscriptionStatus]);

  // Check if user can access a specific feature
  const canAccessFeature = useCallback((feature) => {
    const allowed = getAllowedFeatures();
    return allowed.includes(feature.toLowerCase());
  }, [getAllowedFeatures]);

  // Get status message
  const getStatusMessage = useCallback(() => {
    if (!subscriptionStatus) return "No subscription";

    const isTrial = !subscriptionStatus.subscription_start_date;
    const daysLeft = getDaysRemaining();

    if (isTrial) {
      if (daysLeft > 0) {
        return `Trial: ${daysLeft} day${daysLeft !== 1 ? 's' : ''} remaining`;
      }
      return "Trial expired";
    }

    if (subscriptionStatus.subscription_status === "active") {
      if (daysLeft > 0) {
        return `Active: ${daysLeft} day${daysLeft !== 1 ? 's' : ''} remaining`;
      }
      return "Active";
    }

    return subscriptionStatus.subscription_status;
  }, [subscriptionStatus, getDaysRemaining]);

  // Force refresh subscription (for manual refresh)
  const refreshSubscription = useCallback(() => {
    return fetchSubscriptionStatus(true);
  }, [fetchSubscriptionStatus]);

  const value = {
    subscriptionStatus,
    isLoading,
    hasValidSubscription: hasValidSubscription(),
    isTrialActive: isTrialActive(),
    daysRemaining: getDaysRemaining(),
    trialProgress: getTrialProgress(),
    allowedFeatures: getAllowedFeatures(),
    canAccessFeature,
    statusMessage: getStatusMessage(),
    liveCountdown,
    refreshSubscription,
    // Helper properties
    plan: subscriptionStatus?.subscription_plan || "free",
    status: subscriptionStatus?.subscription_status || "inactive",
    isTrial: !subscriptionStatus?.subscription_start_date,
    requiresSubscription: !hasValidSubscription(),
    // Subscription inheritance
    isInherited: subscriptionStatus?.is_company_subscription || false,
    inheritedFrom: subscriptionStatus?.inherited_from || 'self',
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error("useSubscription must be used within a SubscriptionProvider");
  }
  return context;
};
