import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: true,

      setUser: (user) => set({ user, isAuthenticated: !!user }),

      setTokens: (accessToken, refreshToken) => {
        set({ accessToken, refreshToken, isAuthenticated: !!accessToken })
      },

      login: (user, accessToken, refreshToken) => {
        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
        })
      },

      logout: () => {
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,  // ← این خط را اضافه کنید
        })
      },

      updateUser: (userData) => {
        set((state) => ({
          user: { ...state.user, ...userData },
        }))
      },

      setLoading: (isLoading) => set({ isLoading }),

      getUserRole: () => get().user?.role || null,
      isBuyer: () => get().user?.role === 'buyer',
      isSeller: () => get().user?.role === 'seller' || get().user?.role === 'service_provider',
      isServiceProvider: () => get().user?.role === 'service_provider',
      isAdmin: () => get().user?.role === 'admin' || get().user?.is_staff,
    }),
    {
      name: 'induservice-auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
      // مشکل: isLoading هم ذخیره میشد و باعث ریدایرکت میشد
      // حالا فقط موارد ضروری ذخیره میشن
    }
  )
)