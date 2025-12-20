/**
 * SUBSCRIPTION CONTEXT USAGE EXAMPLES
 * 
 * This file demonstrates how to use the subscription system across your React app.
 * The subscription context is now available on all pages automatically.
 */

import { useSubscription } from "../contexts/SubscriptionContext";

// ============================================
// EXAMPLE 1: Basic Subscription Status Display
// ============================================
const SubscriptionStatusExample = () => {
  const {
    hasValidSubscription,
    isTrialActive,
    daysRemaining,
    statusMessage,
    plan,
  } = useSubscription();

  return (
    <div>
      <h3>Subscription Status</h3>
      <p>Plan: {plan}</p>
      <p>Status: {statusMessage}</p>
      <p>Valid: {hasValidSubscription ? "Yes" : "No"}</p>
      {isTrialActive && <p>Trial days remaining: {daysRemaining}</p>}
    </div>
  );
};

// ============================================
// EXAMPLE 2: Live Countdown Timer
// ============================================
const LiveCountdownExample = () => {
  const { liveCountdown, statusMessage } = useSubscription();

  if (!liveCountdown) {
    return <p>No active subscription countdown</p>;
  }

  return (
    <div>
      <h3>Time Remaining</h3>
      {liveCountdown.expired ? (
        <p className="text-red-600">Subscription Expired</p>
      ) : (
        <div>
          <p>{liveCountdown.message}</p>
          <div className="flex gap-2">
            {liveCountdown.days > 0 && <span>{liveCountdown.days}d</span>}
            {liveCountdown.hours > 0 && <span>{liveCountdown.hours}h</span>}
            <span>{liveCountdown.minutes}m</span>
            <span>{liveCountdown.seconds}s</span>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================
// EXAMPLE 3: Feature Access Control
// ============================================
const FeatureAccessExample = () => {
  const { canAccessFeature, allowedFeatures } = useSubscription();

  // Check if user can add more customers
  const currentCustomerCount = 150; // Get from your state
  const canAddCustomer = canAccessFeature("customers", currentCustomerCount + 1);

  return (
    <div>
      <h3>Feature Limits</h3>
      <p>Max Customers: {allowedFeatures.customers}</p>
      <p>Max Products: {allowedFeatures.products}</p>
      <p>Max Users: {allowedFeatures.users}</p>
      
      {!canAddCustomer && (
        <div className="alert alert-warning">
          You've reached your customer limit. Upgrade to add more.
        </div>
      )}
      
      <button disabled={!canAddCustomer}>Add Customer</button>
    </div>
  );
};

// ============================================
// EXAMPLE 4: Conditional Rendering Based on Plan
// ============================================
const ConditionalFeatureExample = () => {
  const { plan, hasValidSubscription } = useSubscription();

  return (
    <div>
      {/* Show to all plans */}
      <BasicReports />

      {/* Show only to Professional and Enterprise */}
      {(plan === "professional" || plan === "enterprise") && (
        <AdvancedAnalytics />
      )}

      {/* Show only to Enterprise */}
      {plan === "enterprise" && (
        <CustomIntegrations />
      )}

      {/* Show upgrade prompt for basic plans */}
      {plan === "starter" && (
        <UpgradePrompt message="Upgrade to Professional for advanced analytics" />
      )}
    </div>
  );
};

// ============================================
// EXAMPLE 5: Trial Progress Bar
// ============================================
const TrialProgressExample = () => {
  const { isTrialActive, trialProgress, daysRemaining } = useSubscription();

  if (!isTrialActive) {
    return null;
  }

  return (
    <div className="trial-progress">
      <h4>Trial Progress</h4>
      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${trialProgress}%` }}
        />
      </div>
      <p>{daysRemaining} days remaining</p>
    </div>
  );
};

// ============================================
// EXAMPLE 6: Dashboard Widget
// ============================================
const DashboardSubscriptionWidget = () => {
  const {
    plan,
    statusMessage,
    liveCountdown,
    isTrialActive,
    requiresSubscription,
  } = useSubscription();

  // Urgent state when expiring soon or expired
  const isUrgent = requiresSubscription || (liveCountdown && liveCountdown.days <= 3);

  return (
    <div className={`subscription-widget ${isUrgent ? "urgent" : ""}`}>
      <div className="widget-header">
        <h3>Subscription</h3>
        <span className={`badge ${isTrialActive ? "trial" : "paid"}`}>
          {plan.toUpperCase()}
        </span>
      </div>
      
      <p className="status-message">{statusMessage}</p>
      
      {liveCountdown && !liveCountdown.expired && (
        <div className="countdown">
          <div className="countdown-display">
            {liveCountdown.days > 0 && (
              <div className="time-unit">
                <span className="value">{liveCountdown.days}</span>
                <span className="label">days</span>
              </div>
            )}
            <div className="time-unit">
              <span className="value">{liveCountdown.hours}</span>
              <span className="label">hrs</span>
            </div>
            <div className="time-unit">
              <span className="value">{liveCountdown.minutes}</span>
              <span className="label">min</span>
            </div>
            <div className="time-unit">
              <span className="value">{liveCountdown.seconds}</span>
              <span className="label">sec</span>
            </div>
          </div>
        </div>
      )}
      
      {isUrgent && (
        <button className="btn-upgrade">
          {requiresSubscription ? "Subscribe Now" : "Upgrade Plan"}
        </button>
      )}
    </div>
  );
};

// ============================================
// EXAMPLE 7: Refresh Subscription After Payment
// ============================================
const PaymentSuccessHandler = () => {
  const { refreshSubscription } = useSubscription();

  const handlePaymentSuccess = async () => {
    // After successful payment...
    await refreshSubscription();
    
    // Now subscription state is updated
    alert("Subscription activated!");
  };

  return <button onClick={handlePaymentSuccess}>Complete Payment</button>;
};

// ============================================
// EXAMPLE 8: Check Access Before Action
// ============================================
const AddCustomerButton = () => {
  const { hasValidSubscription, canAccessFeature, plan } = useSubscription();
  const [customers, setCustomers] = useState([]);

  const handleAddCustomer = () => {
    // Check subscription first
    if (!hasValidSubscription) {
      alert("Please subscribe to add customers");
      navigate("/subscription");
      return;
    }

    // Check feature limit
    if (!canAccessFeature("customers", customers.length + 1)) {
      alert(`Your ${plan} plan is limited to ${allowedFeatures.customers} customers. Please upgrade.`);
      navigate("/subscription");
      return;
    }

    // Proceed with adding customer
    addCustomer();
  };

  return (
    <button onClick={handleAddCustomer}>
      Add Customer
    </button>
  );
};

// ============================================
// EXAMPLE 9: Inline Warning for Expiring Subscription
// ============================================
const ExpirationWarning = () => {
  const { daysRemaining, isTrialActive, hasValidSubscription } = useSubscription();

  if (!hasValidSubscription) return null;
  
  // Show warning when less than 7 days remaining
  if (daysRemaining > 7) return null;

  return (
    <div className="alert alert-warning">
      <AlertTriangle size={20} />
      <span>
        {isTrialActive
          ? `Your trial ends in ${daysRemaining} days. Upgrade to keep access.`
          : `Your subscription expires in ${daysRemaining} days. Renew now to avoid interruption.`}
      </span>
      <button onClick={() => navigate("/subscription")}>
        {isTrialActive ? "Upgrade" : "Renew"}
      </button>
    </div>
  );
};

// ============================================
// AVAILABLE SUBSCRIPTION CONTEXT VALUES
// ============================================
/*
{
  subscriptionStatus,        // Full API response object
  isLoading,                 // Boolean: true while fetching
  hasValidSubscription,      // Boolean: can user access features?
  isTrialActive,            // Boolean: is trial period active?
  daysRemaining,            // Number: days until expiration
  trialProgress,            // Number: 0-100 percentage
  allowedFeatures,          // Object: feature limits
  canAccessFeature,         // Function: check if feature allowed
  statusMessage,            // String: human-readable status
  liveCountdown,            // Object: real-time countdown data
  refreshSubscription,      // Function: reload subscription data
  plan,                     // String: "free", "starter", "professional", "enterprise"
  status,                   // String: "active", "trial", "expired", etc.
  isTrial,                  // Boolean: is user on trial?
  requiresSubscription,     // Boolean: needs to subscribe?
}
*/

// Dummy components for examples
const BasicReports = () => <div>Basic Reports</div>;
const AdvancedAnalytics = () => <div>Advanced Analytics</div>;
const CustomIntegrations = () => <div>Custom Integrations</div>;
const UpgradePrompt = ({ message }) => <div className="upgrade-prompt">{message}</div>;

export {
  SubscriptionStatusExample,
  LiveCountdownExample,
  FeatureAccessExample,
  ConditionalFeatureExample,
  TrialProgressExample,
  DashboardSubscriptionWidget,
  PaymentSuccessHandler,
  AddCustomerButton,
  ExpirationWarning,
};
