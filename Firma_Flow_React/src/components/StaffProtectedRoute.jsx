import { Navigate } from 'react-router-dom';
import { useStaff } from '../contexts/StaffContext';

const StaffProtectedRoute = ({ children }) => {
  const { staff, isAuthenticated, loading } = useStaff();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Check if authenticated and has staff role (admin or support)
  if (!isAuthenticated || !staff) {
    // Not logged in, redirect to SuperAdmin login
    return <Navigate to="/superadmin/login" replace />;
  }

  // Check if user has staff role
  if (staff.role !== 'admin' && staff.role !== 'support') {
    // User is logged in but not a staff member, redirect to appropriate dashboard
    if (staff.role === 'superadmin') {
      return <Navigate to="/superadmin/dashboard" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  // User is authenticated and is staff (admin or support)
  return children;
};

export default StaffProtectedRoute;
