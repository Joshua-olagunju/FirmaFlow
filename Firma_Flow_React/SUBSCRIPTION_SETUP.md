# Subscription System - Quick Setup Guide

## ✅ What's Been Done

The complete subscription management system from `includes/subscription_helper.php` has been migrated to React and is now working across all pages.

## 📦 Files Created

### Core System
1. **`src/contexts/SubscriptionContext.jsx`** - Main subscription state management
2. **`src/components/ProtectedRoute.jsx`** - Route protection wrapper
3. **`src/components/SubscriptionBanner.jsx`** - Top banner for subscription status

### Documentation & Examples
4. **`src/examples/SubscriptionUsageExamples.jsx`** - 9+ usage examples
5. **`SUBSCRIPTION_SYSTEM.md`** - Complete documentation

## 🔧 Configuration Changes

### Updated Files
- ✅ `src/main.jsx` - Added `SubscriptionProvider` wrapper
- ✅ `src/App.jsx` - Wrapped all routes with `ProtectedRoute`, added `SubscriptionBanner`
- ✅ `src/pages/subscription/Subscription.jsx` - Integrated with subscription context

## 🚀 How It Works Now

### 1. Automatic Protection
Every page automatically checks subscription status:
```
User visits /dashboard
  ↓
ProtectedRoute checks authentication
  ↓
ProtectedRoute checks subscription
  ↓
Valid subscription? → Show page
No subscription? → Redirect to /subscription
```

### 2. Real-Time Status Banner
Shows at the top of every authenticated page:
- **Red** - Subscription expired (blocking)
- **Orange** - Trial ending soon (≤3 days)
- **Blue** - Trial active (>3 days)
- **Yellow** - Paid subscription expiring soon (≤7 days)

### 3. Live Countdown
Updates every second with remaining time:
- "2d 14h 35m remaining"
- "14h 35m 42s remaining"
- "35m 42s remaining"

## 🎯 Using in Your Components

### Basic Usage
```jsx
import { useSubscription } from "../contexts/SubscriptionContext";

function MyComponent() {
  const { hasValidSubscription, plan, daysRemaining } = useSubscription();
  
  return (
    <div>
      <p>Plan: {plan}</p>
      <p>Days: {daysRemaining}</p>
      <p>Access: {hasValidSubscription ? "Yes" : "No"}</p>
    </div>
  );
}
```

### Feature Access Control
```jsx
function AddCustomerButton() {
  const { canAccessFeature, allowedFeatures } = useSubscription();
  const customerCount = 150;
  
  const canAdd = canAccessFeature("customers", customerCount + 1);
  
  return (
    <button disabled={!canAdd}>
      Add Customer
      {!canAdd && ` (Limit: ${allowedFeatures.customers})`}
    </button>
  );
}
```

### After Payment
```jsx
function PaymentSuccess() {
  const { refreshSubscription } = useSubscription();
  
  useEffect(() => {
    refreshSubscription(); // Reload subscription after payment
  }, []);
}
```

## 📊 Available Data

```jsx
const {
  // Status
  hasValidSubscription,  // Boolean: can access features?
  isTrialActive,        // Boolean: on trial?
  requiresSubscription, // Boolean: needs to subscribe?
  
  // Plan Info
  plan,                 // "free" | "starter" | "professional" | "enterprise"
  status,               // "active" | "trial" | "expired"
  
  // Time
  daysRemaining,        // Number: days until expiration
  liveCountdown,        // Object: {days, hours, minutes, seconds, message}
  trialProgress,        // Number: 0-100 percentage
  
  // Features
  allowedFeatures,      // Object: {customers, products, users, reports, support}
  canAccessFeature,     // Function: check if feature allowed
  
  // Messages
  statusMessage,        // String: human-readable status
  
  // Methods
  refreshSubscription,  // Function: reload subscription data
} = useSubscription();
```

## 🔐 Route Protection

All main routes are now protected:
- `/dashboard` ✅ Protected
- `/customers` ✅ Protected
- `/suppliers` ✅ Protected
- `/inventory` ✅ Protected
- `/sales` ✅ Protected
- `/payments` ✅ Protected
- `/purchases` ✅ Protected
- `/expenses` ✅ Protected
- `/reports` ✅ Protected
- `/settings` ✅ Protected
- `/subscription` ✅ Auth required, subscription not required

## 🎨 Subscription Banner

Automatically shows on all authenticated pages:

**Behavior:**
- Shows critical alerts when subscription expired
- Shows warnings when trial/subscription ending soon
- Can be dismissed (except critical alerts)
- Updates every second with live countdown
- Responsive (mobile & desktop)

**Dismiss:**
Users can dismiss non-critical banners. Banner reappears on page refresh or when status changes.

## 💡 Examples

See `src/examples/SubscriptionUsageExamples.jsx` for complete working examples:

1. ✅ Basic status display
2. ✅ Live countdown timer
3. ✅ Feature access control
4. ✅ Conditional rendering by plan
5. ✅ Trial progress bar
6. ✅ Dashboard widget
7. ✅ Payment success handler
8. ✅ Pre-action access checks
9. ✅ Expiration warnings

## 🏢 Company-Wide Subscription

Just like PHP version:
- **Admin users** = Own subscription
- **Non-admin users** = Follow admin's subscription
- Automatically handled by API
- No manual configuration needed

## 🔄 Auto-Updates

The system automatically:
- ✅ Fetches subscription on login
- ✅ Updates countdown every second
- ✅ Refreshes when subscription expires
- ✅ Can be manually refreshed with `refreshSubscription()`

## 🎉 You're Done!

The subscription system is fully integrated and working. You can now:

1. **Use `useSubscription()` hook** in any component
2. **Check subscription status** before actions
3. **Display subscription info** to users
4. **Control feature access** based on plan
5. **Show upgrade prompts** when limits reached

## 📚 Need Help?

- **Full docs**: `SUBSCRIPTION_SYSTEM.md`
- **Examples**: `src/examples/SubscriptionUsageExamples.jsx`
- **Context code**: `src/contexts/SubscriptionContext.jsx`

## 🐛 Testing

To test the system:

1. **Login** as admin user
2. **Check banner** appears at top
3. **Try accessing** protected routes
4. **Go to /subscription** to see plans
5. **Check countdown** updates every second
6. **Dismiss banner** (if not critical)

## 🚨 Important Notes

- Subscription checks happen **client-side** but are validated **server-side**
- All API calls use `credentials: 'include'` for session cookies
- CORS is configured for localhost:5173 and localhost:5174
- Banner is dismissable except for critical (expired) status
- Live countdown updates every second (performance optimized)

---

**Everything is ready to use!** The subscription system matches all functionality from `subscription_helper.php` and works across all pages automatically.
