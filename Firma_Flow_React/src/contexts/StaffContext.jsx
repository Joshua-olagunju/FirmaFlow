import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const StaffContext = createContext(null);

export const StaffProvider = ({ children }) => {
  const navigate = useNavigate();
  const [staff, setStaff] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check session on mount - uses SAME auth as superadmin
  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      // Use the SAME auth endpoint as superadmin
      const response = await fetch('http://localhost/FirmaFlow/superadmin/api/auth.php?action=check_session', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();
      
      // Check if user is staff (admin or support role)
      if (data.success && data.authenticated && data.user) {
        const userRole = data.user.role;
        if (userRole === 'admin' || userRole === 'support') {
          setStaff(data.user);
          setIsAuthenticated(true);
        } else {
          // Not a staff member
          setStaff(null);
          setIsAuthenticated(false);
        }
      } else {
        setStaff(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Session check failed:', error);
      setStaff(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Use same logout as superadmin
      await fetch('http://localhost/FirmaFlow/superadmin/api/logout.php', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setStaff(null);
      setIsAuthenticated(false);
      navigate('/login'); // Single login page
    }
  };

  const value = {
    staff,
    isAuthenticated,
    loading,
    logout,
    checkSession
  };

  return (
    <StaffContext.Provider value={value}>
      {children}
    </StaffContext.Provider>
  );
};

export const useStaff = () => {
  const context = useContext(StaffContext);
  if (!context) {
    throw new Error('useStaff must be used within a StaffProvider');
  }
  return context;
};

export default StaffContext;
