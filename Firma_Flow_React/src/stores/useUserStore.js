import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useUserStore = create(
  persist(
    (set) => ({
      // User state
      user: null,
      token: null,
      role: null,
      companyId: null,
      userId: null,
      isAuthenticated: false,

      // Setters
      setUser: (userData) =>
        set({
          user: userData,
          isAuthenticated: true,
        }),

      setToken: (token) => set({ token }),

      setRole: (role) => set({ role }),

      setCompanyId: (companyId) => set({ companyId }),

      setUserId: (userId) => set({ userId }),

      // Login action - set all user data at once
      login: (userData) =>
        set({
          user: userData.user || userData,
          token: userData.token || null,
          role: userData.role || userData.user?.role || null,
          companyId: userData.company_id || userData.user?.company_id || null,
          userId: userData.user_id || userData.user?.id || null,
          isAuthenticated: true,
        }),

      // Logout action - clear all user data
      logout: () =>
        set({
          user: null,
          token: null,
          role: null,
          companyId: null,
          userId: null,
          isAuthenticated: false,
        }),

      // Update user profile
      updateUser: (updates) =>
        set((state) => ({
          user: { ...state.user, ...updates },
        })),
    }),
    {
      name: "user-store", // localStorage key
      version: 1, // version for migrations
    }
  )
);
