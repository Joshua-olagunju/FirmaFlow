import { createContext, useContext, useEffect, useCallback } from "react";
import { useUserStore } from "../stores/useUserStore";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const {
    user,
    token,
    role,
    companyId,
    userId,
    isAuthenticated,
    login,
    logout,
    updateUser,
  } = useUserStore();

  const handleLogout = useCallback(() => {
    logout();
    navigate("/login");
  }, [logout, navigate]);

  // Check if user session is still valid
  useEffect(() => {
    if (isAuthenticated && !user) {
      // Session expired or corrupted
      handleLogout();
    }
  }, [isAuthenticated, user, handleLogout]);

  const handleLogin = (userData) => {
    login(userData);
  };

  const value = {
    user,
    token,
    role,
    companyId,
    userId,
    isAuthenticated,
    login: handleLogin,
    logout: handleLogout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
