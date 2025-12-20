# Subscription Inheritance System

## Overview
Implemented a subscription inheritance system where users created under an admin (staff/user role) automatically inherit the admin's subscription status. This eliminates the need for individual user subscriptions and ensures consistent access across the company.

## How It Works

### Subscription Hierarchy
```
Company Admin (role: 'admin')
    ├── Subscription Plan (e.g., Professional)
    ├── Subscription Status (e.g., Active)
    ├── Trial Period
    └── Expiration Dates
            ↓ Inherited by
    Staff Users (role: 'user')
        ├── Same Subscription Plan
        ├── Same Subscription Status
        ├── Same Trial Period
        └── Same Expiration Dates
```

### Database Structure
- **users** table has `company_id` field linking users to their company
- **users** table has `role` field: `'admin'` (company owner) or `'user'` (staff member)
- Admin user (first user in company) owns the subscription
- All users with same `company_id` inherit from the admin's subscription

## Implementation Details

### 1. Backend API (subscription.php)

Modified the `current` action to check for subscription inheritance:

```php
// Get user's company_id and role
$stmt = $pdo->prepare("SELECT company_id, role FROM users WHERE id = ?");
$stmt->execute([$userId]);
$userInfo = $stmt->fetch(PDO::FETCH_ASSOC);

// If user has company_id and is not admin, get subscription from admin
if ($companyId && $userRole !== 'admin') {
    // Find admin user for this company
    $stmt = $pdo->prepare("
        SELECT subscription_plan, subscription_status, trial_dates, etc.
        FROM users 
        WHERE company_id = ? AND role = 'admin'
        ORDER BY created_at ASC
        LIMIT 1
    ");
    $stmt->execute([$companyId]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
}
```

**Response includes**:
```json
{
  "success": true,
  "data": {
    "subscription_plan": "professional",
    "subscription_status": "active",
    "trial_start_date": "2025-10-28 00:54:41",
    "trial_end_date": "2025-11-11 00:54:41",
    "subscription_start_date": null,
    "subscription_end_date": null,
    "expiration_timestamp": 1731283481,
    "seconds_remaining": 604800,
    "days_remaining": 14,
    "inherited_from": "company_admin",
    "is_company_subscription": true
  }
}
```

### 2. Frontend Context (SubscriptionContext.jsx)

Added inheritance information to subscription context:

```jsx
const value = {
  // ... existing fields
  isInherited: subscriptionStatus?.is_company_subscription || false,
  inheritedFrom: subscriptionStatus?.inherited_from || 'self',
};
```

### 3. Subscription Page UI

**For Admin Users**:
- Full access to all subscription plans
- Can subscribe and upgrade/downgrade
- Shows current plan and billing options
- Can view billing history

**For Staff Users (Inherited Subscription)**:
- Shows current plan with "Inherited from company admin" badge
- All subscription plan buttons disabled with "Managed by Admin" text
- Blue information banner explaining subscription is managed by admin
- Cannot purchase or change subscription independently

```jsx
{isInherited && (
  <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
    <p className="text-sm">
      <strong>Note:</strong> This subscription is managed by your company administrator. 
      Contact your admin to change or upgrade the subscription plan.
    </p>
  </div>
)}
```

## User Experience

### Admin User Flow
1. Admin signs up and creates company
2. Admin starts on 14-day free trial
3. Admin can subscribe to any plan (Starter, Professional, Enterprise)
4. Admin can add staff users under their company
5. All staff users automatically get same subscription benefits

### Staff User Flow
1. Staff user is created by admin
2. Upon login, automatically inherits admin's subscription
3. Can view subscription page but cannot change plan
4. Sees "Inherited from company admin" badge
5. All features accessible based on admin's subscription level

## Benefits

### For Admins
- ✅ Single subscription covers entire company
- ✅ Easy user management
- ✅ Predictable costs
- ✅ Full control over subscription

### For Staff Users
- ✅ No separate subscription needed
- ✅ Automatic access to features
- ✅ No payment concerns
- ✅ Same trial period as admin

### For Business
- ✅ Simplified billing (one subscription per company)
- ✅ Encourages team collaboration
- ✅ Clear subscription ownership
- ✅ Reduced support complexity

## Subscription Rules

| Scenario | Admin Status | Staff Status | Result |
|----------|-------------|-------------|---------|
| Admin on Free Trial | Trial Active | Trial Active | Both have 14-day access |
| Admin Trial Expired | Trial Expired | Trial Expired | Both locked out of premium features |
| Admin Subscribed (Professional) | Active | Active | Both have Professional features |
| Admin Subscription Expired | Expired | Expired | Both locked out of premium features |
| Admin Cancels Subscription | Cancelled | Cancelled | Both lose access when period ends |

## Feature Access

### Always Accessible (Even When Expired)
- Dashboard
- Customers
- Suppliers (admin only)
- Inventory
- Settings
- Subscription Page

### Requires Active Subscription
- Sales
- Payments
- Purchases (admin only)
- Expenses (admin only)
- Reports (admin only)
- Advanced Reports (admin only)

Staff users with role='user' can only see:
- Dashboard (user-dashboard)
- Customers
- Inventory
- Sales
- Payments
- Settings
- Subscription (view only)

## Technical Notes

### API Endpoints
- **GET /api/subscription.php?action=current** - Returns inherited subscription for staff users
- Checks `company_id` and `role` to determine inheritance
- Falls back to user's own subscription if no company/admin found

### Database Queries
1. Check user's `company_id` and `role`
2. If staff user (`role='user'`), find admin in same company
3. Return admin's subscription data with inheritance flags
4. If no admin found, return user's own subscription

### Frontend Components
- **SubscriptionContext**: Provides `isInherited` and `inheritedFrom` flags
- **SubscriptionPage**: Disables purchase buttons for inherited subscriptions
- **SubscriptionBanner**: Shows same subscription status for all company users
- **ProtectedRoute**: Uses inherited subscription for access control

## Testing Scenarios

### Test Case 1: Admin Creates Staff User
1. Admin signs up, gets 14-day trial
2. Admin creates staff user
3. Staff logs in → sees same 14-day trial
4. Both can access Sales, Payments during trial

### Test Case 2: Admin Subscribes, Staff Inherits
1. Admin subscribes to Professional plan
2. Staff user logs in
3. Staff sees "Professional Plan - Inherited from company admin"
4. Staff cannot change plan (buttons disabled)
5. Both have access to Professional features

### Test Case 3: Admin Subscription Expires
1. Admin's subscription expires
2. Staff user logs in
3. Both see "Subscription Expired" banner
4. Both locked out of Sales, Payments, Reports
5. Both can still access Dashboard, Customers, Inventory, Settings

### Test Case 4: Admin on Trial, Staff Added Mid-Trial
1. Admin starts trial on Jan 1 (expires Jan 15)
2. Admin adds staff on Jan 8
3. Staff inherits same expiration (Jan 15)
4. Both have 7 days remaining
5. When trial expires, both lose access simultaneously

## Future Enhancements

### Possible Improvements
1. **Per-User Licenses**: Charge based on number of users
2. **Role-Based Pricing**: Different pricing for different roles
3. **User Limits**: Restrict number of staff users per plan
4. **Individual Overrides**: Allow specific staff to have different subscriptions
5. **Company Dashboard**: Admin view of all staff access levels
6. **Invitation System**: Email invitations to join company
7. **User Transfer**: Move staff between companies
8. **Sub-Accounts**: Hierarchical user management

## Code References

### Modified Files
1. ✅ `api/subscription.php` - Subscription inheritance logic
2. ✅ `Firma_Flow_React/src/contexts/SubscriptionContext.jsx` - Inheritance flags
3. ✅ `Firma_Flow_React/src/pages/subscription/Subscription.jsx` - UI updates
4. ✅ `Firma_Flow_React/src/pages/dashboard/UserDashboard.jsx` - Staff dashboard
5. ✅ `Firma_Flow_React/src/components/Sidebar.jsx` - Role-based menu
6. ✅ `Firma_Flow_React/src/pages/auth/Login.jsx` - Role-based redirect

### Database Schema
```sql
-- Users table structure
CREATE TABLE users (
  id BIGINT PRIMARY KEY,
  company_id BIGINT,  -- Links users to company
  role ENUM('admin', 'user'),  -- admin = owner, user = staff
  subscription_plan ENUM('free', 'starter', 'professional', 'enterprise'),
  subscription_status ENUM('trial', 'active', 'expired', 'cancelled'),
  trial_start_date DATETIME,
  trial_end_date DATETIME,
  subscription_start_date DATETIME,
  subscription_end_date DATETIME,
  -- ... other fields
);

-- Admin user (role='admin') owns the subscription
-- Staff users (role='user') inherit from admin with same company_id
```

## Summary

The subscription inheritance system ensures that:
- ✅ One subscription covers the entire company
- ✅ Staff users automatically inherit admin's subscription
- ✅ Staff cannot independently purchase subscriptions
- ✅ Consistent feature access across all company users
- ✅ Simplified billing and user management
- ✅ Clear separation between admin and staff capabilities

This approach provides a scalable, user-friendly subscription model that encourages team collaboration while maintaining clear ownership and control.
