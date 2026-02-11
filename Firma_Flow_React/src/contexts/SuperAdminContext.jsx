import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const SuperAdminContext = createContext(null);

export const SuperAdminProvider = ({ children }) => {
  const navigate = useNavigate();
  const [superAdmin, setSuperAdmin] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check session on mount
  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const response = await fetch('http://localhost/FirmaFlow/superadmin/api/auth.php?action=check_session', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();
      
      if (data.success && data.authenticated) {
        setSuperAdmin(data.user);
        setIsAuthenticated(true);
      } else {
        setSuperAdmin(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Session check failed:', error);
      setSuperAdmin(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password, remember = false) => {
    try {
      // Use email field for login (can accept username too)
      const response = await fetch('http://localhost/FirmaFlow/superadmin/api/auth.php', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'login',
          email: username, // API expects 'email' but accepts username format too
          password: password,
          remember: remember
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setSuperAdmin(data.user);
        setIsAuthenticated(true);
        // Return redirect path from API
        return { 
          success: true, 
          user: data.user,
          redirect_path: data.redirect_path || '/superadmin/dashboard'
        };
      } else {
        return { success: false, message: data.message || data.error || 'Login failed' };
      }
    } catch (error) {
      console.error('Login failed:', error);
      return { success: false, message: 'Network error. Please try again.' };
    }
  };

  const logout = async () => {
    try {
      await fetch('http://localhost/FirmaFlow/superadmin/api/auth.php', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'logout'
        })
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setSuperAdmin(null);
      setIsAuthenticated(false);
      navigate('/superadmin/login');
    }
  };

  const value = {
    superAdmin,
    isAuthenticated,
    loading,
    login,
    logout,
    checkSession
  };

  return (
    <SuperAdminContext.Provider value={value}>
      {children}
    </SuperAdminContext.Provider>
  );
};

export function useSuperAdmin() {
  const context = useContext(SuperAdminContext);
  if (!context) {
    throw new Error('useSuperAdmin must be used within a SuperAdminProvider');
  }
  return context;
}
