# React Subscription System

Complete subscription management system with trial periods, live countdowns, and feature access control.

## 🚀 Overview

This system replicates all functionality from `includes/subscription_helper.php` in React, providing:

- ✅ Real-time subscription status checking
- ✅ Trial period management with live countdown
- ✅ Feature access control based on subscription plan
- ✅ Automatic route protection
- ✅ Subscription status banners
- ✅ Company-wide subscription (admin's subscription applies to all users)

## 📁 File Structure

```
src/
├── contexts/
│   └── SubscriptionContext.jsx       # Main subscription state management
├── components/
│   ├── ProtectedRoute.jsx            # Route wrapper for subscription checks
│   └── SubscriptionBanner.jsx        # Top banner showing subscription status
├── examples/
│   └── SubscriptionUsageExamples.jsx # Usage examples for developers
└── pages/
    └── subscription/
        └── Subscription.jsx           # Subscription management page
```

## 🎯 Quick Start

### 1. Context is Already Configured

The `SubscriptionProvider` is already wrapped around your app in `main.jsx`:

```jsx
<SubscriptionProvider>
  <App />
</SubscriptionProvider>
```

### 2. Use in Any Component

```jsx
import { useSubscription } from "../contexts/SubscriptionContext";

function MyComponent() {
  const { 
    hasValidSubscription, 
    plan, 
    daysRemaining,
    liveCountdown 
  } = useSubscription();

  return (
    <div>
      <h1>Plan: {plan}</h1>
      <p>Days remaining: {daysRemaining}</p>
      {liveCountdown && <p>{liveCountdown.message}</p>}
    </div>
  );
}
```

## 🔐 Route Protection

All main routes are automatically protected:

```jsx
// In App.jsx
<Route
  path="/dashboard"
  element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  }
/>
```

**Behavior:**
- Not authenticated → Redirects to `/login`
- Authenticated but no valid subscription → Redirects to `/subscription`
- Valid subscription → Access granted

**Subscription page exception:**
```jsx
<ProtectedRoute requiresSubscription={false}>
  <Subscription />
</ProtectedRoute>
```

## 📊 Available Context Values

### Basic Status
```jsx
const {
  hasValidSubscription,  // Boolean: can access features?
  isTrialActive,        // Boolean: on trial?
  plan,                 // String: "free" | "starter" | "professional" | "enterprise"
  status,               // String: "active" | "trial" | "expired"
  daysRemaining,        // Number: days until expiration
  requiresSubscription, // Boolean: needs to subscribe?
  isTrial,             // Boolean: on trial (no paid subscription)?
} = useSubscription();
```

### Live Countdown
```jsx
const { liveCountdown } = useSubscription();

// liveCountdown structure:
{
  expired: false,
  message: "2d 14h 35m remaining",
  days: 2,
  hours: 14,
  minutes: 35,
  seconds: 42,
  totalSeconds: 225342
}
```

### Feature Access
```jsx
const { allowedFeatures, canAccessFeature } = useSubscription();

// Check feature limits
allowedFeatures = {
  customers: 1000,
  products: 2000,
  users: 5,
  reports: "advanced",
  support: "email_chat"
};

// Check if can add more
const canAdd = canAccessFeature("customers", currentCount + 1);
```

### Methods
```jsx
const { refreshSubscription } = useSubscription();

// After payment success
await refreshSubscription();
```

## 🎨 Subscription Banner

Automatically displayed on all authenticated pages:

**Shows:**
- ⚠️ **Critical** (Red) - Subscription expired or required
- ⚠️ **Warning** (Orange) - Trial ending soon (≤3 days)
- ℹ️ **Info** (Blue) - Trial active (>3 days remaining)
- ⚠️ **Notice** (Yellow) - Paid subscription expiring (≤7 days)

**Features:**
- Live countdown timer
- Dismissable (except critical)
- Responsive design
- Auto-refreshes on expiration

## 💡 Common Use Cases

### 1. Display Subscription Status

```jsx
function StatusWidget() {
  const { statusMessage, liveCountdown } = useSubscription();
  
  return (
    <div>
      <p>{statusMessage}</p>
      {liveCountdown && <span>{liveCountdown.message}</span>}
    </div>
  );
}
```

### 2. Trial Progress Bar

```jsx
function TrialProgress() {
  const { isTrialActive, trialProgress, daysRemaining } = useSubscription();
  
  if (!isTrialActive) return null;
  
  return (
    <div>
      <div className="progress-bar">
        <div style={{ width: `${trialProgress}%` }} />
      </div>
      <p>{daysRemaining} days remaining</p>
    </div>
  );
}
```

### 3. Feature Access Control

```jsx
function AddCustomerButton() {
  const { hasValidSubscription, canAccessFeature, allowedFeatures } = useSubscription();
  const [customers] = useCustomers(); // Your customer state
  
  const handleAdd = () => {
    if (!hasValidSubscription) {
      navigate("/subscription");
      return;
    }
    
    if (!canAccessFeature("customers", customers.length + 1)) {
      alert(`Limit: ${allowedFeatures.customers} customers. Please upgrade.`);
      navigate("/subscription");
      return;
    }
    
    addCustomer();
  };
  
  return <button onClick={handleAdd}>Add Customer</button>;
}
```

### 4. Conditional Features by Plan

```jsx
function ReportsPage() {
  const { plan } = useSubscription();
  
  return (
    <div>
      {/* All plans */}
      <BasicReports />
      
      {/* Professional & Enterprise only */}
      {(plan === "professional" || plan === "enterprise") && (
        <AdvancedAnalytics />
      )}
      
      {/* Enterprise only */}
      {plan === "enterprise" && (
        <CustomIntegrations />
      )}
    </div>
  );
}
```

### 5. Payment Success Handler

```jsx
function PaymentModal() {
  const { refreshSubscription } = useSubscription();
  
  const handlePaymentSuccess = async () => {
    // Payment completed
    await refreshSubscription(); // Reload subscription status
    alert("Subscription activated!");
    navigate("/dashboard");
  };
  
  return <FlutterwaveButton onSuccess={handlePaymentSuccess} />;
}
```

### 6. Expiration Warning

```jsx
function ExpirationAlert() {
  const { daysRemaining, hasValidSubscription, isTrialActive } = useSubscription();
  
  if (!hasValidSubscription || daysRemaining > 7) return null;
  
  return (
    <Alert severity="warning">
      {isTrialActive
        ? `Trial ends in ${daysRemaining} days`
        : `Subscription expires in ${daysRemaining} days`}
      <Button onClick={() => navigate("/subscription")}>
        {isTrialActive ? "Upgrade" : "Renew"}
      </Button>
    </Alert>
  );
}
```

## 🏢 Company-Wide Subscription

Just like the PHP version, all users in a company follow the admin's subscription:

- **Admin users**: Have their own subscription settings
- **Non-admin users**: Inherit subscription from company admin
- **Automatic**: No manual configuration needed
- **API handles it**: Backend `subscription.php` returns admin's subscription for all company users

## 🔄 Auto-Refresh

The context automatically:
- Fetches subscription on mount
- Updates every second for live countdown
- Refreshes when subscription expires
- Can be manually refreshed with `refreshSubscription()`

## 📱 Responsive Design

All components are mobile-responsive:
- Subscription cards: Stack on mobile, grid on desktop
- Banner: Compact on mobile, full on desktop
- Countdown: Adaptive text sizing
- Buttons: Full-width on mobile

## 🎯 Feature Limits by Plan

```javascript
const PLAN_FEATURES = {
  free: {
    customers: 100,
    products: 500,
    users: 1,
    reports: "basic",
    support: "email"
  },
  starter: {
    customers: 100,
    products: 500,
    users: 1,
    reports: "basic",
    support: "email"
  },
  professional: {
    customers: 1000,
    products: 2000,
    users: 5,
    reports: "advanced",
    support: "email_chat"
  },
  enterprise: {
    customers: "unlimited",
    products: "unlimited",
    users: "unlimited",
    reports: "full",
    support: "all_channels"
  }
};
```

## 🛠️ API Integration

The system integrates with `api/subscription.php`:

**Endpoints used:**
- `GET ?action=current` - Fetch subscription status
- `POST action=activate_subscription` - Activate after payment
- `GET ?action=history` - Get billing history

**Required fields in API response:**
```json
{
  "success": true,
  "data": {
    "subscription_plan": "professional",
    "subscription_status": "active",
    "trial_start_date": "2025-01-01 00:00:00",
    "trial_end_date": "2025-01-15 23:59:59",
    "subscription_start_date": "2025-01-15 10:30:00",
    "subscription_end_date": "2025-02-15 10:30:00",
    "expiration_timestamp": 1739620200,
    "seconds_remaining": 2160000,
    "days_remaining": 25
  }
}
```

## 🐛 Debugging

Enable debug logging:
```jsx
// In SubscriptionContext.jsx, add:
console.log("Subscription Status:", subscriptionStatus);
console.log("Has Valid:", hasValidSubscription);
console.log("Live Countdown:", liveCountdown);
```

Check context values in React DevTools:
- Look for `SubscriptionContext.Provider`
- Inspect `value` prop

## ⚡ Performance

- **Minimal re-renders**: Uses `useCallback` and `useMemo`
- **Efficient countdown**: Only updates when visible
- **Single API call**: Fetches once on mount
- **Manual refresh**: Use `refreshSubscription()` only when needed

## 🔒 Security

- **Server-side validation**: All checks performed on backend
- **Session-based**: Uses `credentials: 'include'`
- **No token in URL**: Relies on HTTP-only cookies
- **CORS configured**: Allows localhost:5173 and localhost:5174

## 📚 Additional Resources

See `src/examples/SubscriptionUsageExamples.jsx` for:
- 9+ working examples
- Copy-paste ready code
- Best practices
- Common patterns

## 🎉 That's It!

The subscription system is now fully integrated and working on all pages. All functionality from `subscription_helper.php` is available in React through the `useSubscription()` hook.
