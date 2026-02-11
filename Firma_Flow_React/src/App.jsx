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
import SuperAdminLogin from "./pages/superadmin/auth/SuperAdminLogin";
import SuperAdminDashboard from "./pages/superadmin/dashboard/SuperAdminDashboard";
import SuperAdminTickets from "./pages/superadmin/tickets/SupportTickets";
import SuperAdminLiveChat from "./pages/superadmin/chat/LiveChat";
import SuperAdminUsers from "./pages/superadmin/users/Users";
import SuperAdminCompanies from "./pages/superadmin/companies/Companies";
import SuperAdminSubscriptions from "./pages/superadmin/subscriptions/Subscriptions";
import SuperAdminSettings from "./pages/superadmin/Settings";
import StaffDashboard from "./pages/staff/StaffDashboard";
import StaffChat from "./pages/staff/StaffChat";
import StaffComplaints from "./pages/staff/StaffComplaints";
import StaffUsers from "./pages/staff/StaffUsers";
import ProtectedRoute from "./components/ProtectedRoute";
import SuperAdminProtectedRoute from "./components/SuperAdminProtectedRoute";
import StaffProtectedRoute from "./components/StaffProtectedRoute";
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
        
        {/* SuperAdmin Login */}
        <Route path="/superadmin/login" element={<SuperAdminLogin />} />
        
        {/* SuperAdmin Routes */}
        <Route
          path="/superadmin/dashboard"
          element={
            <SuperAdminProtectedRoute>
              <SuperAdminDashboard />
            </SuperAdminProtectedRoute>
          }
        />
        <Route
          path="/superadmin/tickets"
          element={
            <SuperAdminProtectedRoute>
              <SuperAdminTickets />
            </SuperAdminProtectedRoute>
          }
        />
        <Route
          path="/superadmin/live-chat"
          element={
            <SuperAdminProtectedRoute>
              <SuperAdminLiveChat />
            </SuperAdminProtectedRoute>
          }
        />
        <Route
          path="/superadmin/users"
          element={
            <SuperAdminProtectedRoute>
              <SuperAdminUsers />
            </SuperAdminProtectedRoute>
          }
        />
        <Route
          path="/superadmin/companies"
          element={
            <SuperAdminProtectedRoute>
              <SuperAdminCompanies />
            </SuperAdminProtectedRoute>
          }
        />
        <Route
          path="/superadmin/subscriptions"
          element={
            <SuperAdminProtectedRoute>
              <SuperAdminSubscriptions />
            </SuperAdminProtectedRoute>
          }
        />
        <Route
          path="/superadmin/settings"
          element={
            <SuperAdminProtectedRoute>
              <SuperAdminSettings />
            </SuperAdminProtectedRoute>
          }
        />
        
        {/* Staff Routes - uses same login as SuperAdmin, redirects based on role */}
        <Route
          path="/staff"
          element={<StaffProtectedRoute><StaffDashboard /></StaffProtectedRoute>}
        />
        <Route
          path="/staff/chat"
          element={<StaffProtectedRoute><StaffChat /></StaffProtectedRoute>}
        />
        <Route
          path="/staff/complaints"
          element={<StaffProtectedRoute><StaffComplaints /></StaffProtectedRoute>}
        />
        <Route
          path="/staff/users"
          element={<StaffProtectedRoute><StaffUsers /></StaffProtectedRoute>}
        />
        
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

