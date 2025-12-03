import { createContext, useContext, useEffect, useCallback } from "react";
import { useUserStore } from "../stores/useUserStore";
import { useNavigate } from "react-router-dom";

const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
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

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

// Custom hook to use user context
export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
