import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Signup from "./pages/auth/Signup";
import EmailVerification from "./pages/auth/EmailVerification";
import Login from "./pages/auth/Login";
import Dashboard from "./pages/dashboard/Dashboard";
import UserDashboard from "./pages/dashboard/UserDashboard";
import Customers from "./pages/customers/Customers";
import Suppliers from "./pages/suppliers/Suppliers";
import Inventory from "./pages/inventory/Inventory";
import Sales from "./pages/sales/Sales";
import Payments from "./pages/payments/Payments";
import Purchases from "./pages/purchases/Purchases";
import Expenses from "./pages/expenses/Expenses";
import Settings from "./pages/Settings/Settings";
import FinancialReports from "./pages/reports/FinancialReports";
import Subscription from "./pages/subscription/Subscription";
import ProtectedRoute from "./components/ProtectedRoute";
import SubscriptionBanner from "./components/SubscriptionBanner";
import { useUser } from "./contexts/UserContext";

function App() {
  const { isAuthenticated } = useUser();

  return (
    <>
      {/* Show subscription banner on all authenticated pages */}
      {isAuthenticated && <SubscriptionBanner />}
      
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/email-verification" element={<EmailVerification />} />
        <Route path="/login" element={<Login />} />
        
        {/* Dashboard - role-based routing */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute alwaysAccessible={true} requiresSubscription={false}>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        
        {/* User Dashboard - for staff/user role */}
        <Route
          path="/user-dashboard"
          element={
            <ProtectedRoute alwaysAccessible={true} requiresSubscription={false}>
              <UserDashboard />
            </ProtectedRoute>
          }
        />
        
        {/* Always accessible routes - remain open even after expiration */}
        <Route
          path="/customers"
          element={
            <ProtectedRoute alwaysAccessible={true} requiresSubscription={false}>
              <Customers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/suppliers"
          element={
            <ProtectedRoute alwaysAccessible={true} requiresSubscription={false}>
              <Suppliers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/inventory"
          element={
            <ProtectedRoute alwaysAccessible={true} requiresSubscription={false}>
              <Inventory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute alwaysAccessible={true} requiresSubscription={false}>
              <Settings />
            </ProtectedRoute>
          }
        />
        
        {/* Locked routes - require active subscription */}
        <Route
          path="/sales"
          element={
            <ProtectedRoute requiresSubscription={true}>
              <Sales />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payments"
          element={
            <ProtectedRoute requiresSubscription={true}>
              <Payments />
            </ProtectedRoute>
          }
        />
        <Route
          path="/purchases"
          element={
            <ProtectedRoute requiresSubscription={true}>
              <Purchases />
            </ProtectedRoute>
          }
        />
        <Route
          path="/expenses"
          element={
            <ProtectedRoute requiresSubscription={true}>
              <Expenses />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute requiresSubscription={true}>
              <FinancialReports />
            </ProtectedRoute>
          }
        />
        
        {/* Subscription page - requires auth but not subscription */}
        <Route
          path="/subscription"
          element={
            <ProtectedRoute requiresSubscription={false}>
              <Subscription />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
}

export default App;

