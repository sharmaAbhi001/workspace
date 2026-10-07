import { create } from "zustand"
import { persist } from "zustand/middleware"

import type { AuthUser } from "../types"

type AuthState = {
  user: AuthUser | null
  setUser: (user: AuthUser) => void
  clearSession: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      clearSession: () => set({ user: null }),
    }),
    {
      name: "workspace-auth",
      partialize: (state) => ({ user: state.user }),
    }
  )
)
