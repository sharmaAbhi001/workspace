import { useAuthStore } from "../store/auth.store"

export function useAuth() {
  const user = useAuthStore((state) => state.user)
  const clearSession = useAuthStore((state) => state.clearSession)

  return {
    user,
    isAuthenticated: Boolean(user),
    clearSession,
  }
}
