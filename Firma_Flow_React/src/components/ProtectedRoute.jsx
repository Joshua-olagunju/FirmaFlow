import { Navigate, useLocation } from "react-router-dom";
import { useSubscription } from "../contexts/SubscriptionContext";
import { useUser } from "../contexts/UserContext";

/**
 * ProtectedRoute component that checks both authentication and subscription status
 * 
 * Route Access Levels:
 * - alwaysAccessible: Always accessible even without subscription (customers, suppliers, inventory, settings)
 * - requiresSubscription: Locked when trial/subscription expires (sales, payments, purchases, expenses, reports)
 * 
 * During free trial: All features accessible
 * After expiration: Only alwaysAccessible routes remain open
 */
const ProtectedRoute = ({ children, requiresSubscription = true, alwaysAccessible = false }) => {
  const { isAuthenticated } = useUser();
  const { hasValidSubscription, isLoading } = useSubscription();
  const location = useLocation();

  // Show loading spinner while checking subscription
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#667eea] mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Check authentication first
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Allow access to subscription page itself
  if (location.pathname === "/subscription") {
    return children;
  }

  // If route is always accessible (customers, suppliers, inventory, settings), allow access
  if (alwaysAccessible) {
    return children;
  }

  // For routes that require subscription (sales, payments, purchases, expenses, reports)
  if (requiresSubscription && !hasValidSubscription) {
    // Redirect to subscription page with message
    return <Navigate to="/subscription" state={{ from: location, needsSubscription: true }} replace />;
  }

  return children;
};

export default ProtectedRoute;
