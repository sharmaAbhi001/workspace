import { useQuery } from "@tanstack/react-query"

import { authApi } from "../api/auth.api"
import { useAuthStore } from "../store/auth.store"

/** Prevents /me + /refresh from looping on the auth page after a failed restore. */
let restoreSettled = false

export function resetSessionRestore() {
  restoreSettled = false
}

export function markSessionRestoreSettled() {
  restoreSettled = true
}

export function useRestoreSession() {
  const user = useAuthStore((state) => state.user)
  const setUser = useAuthStore((state) => state.setUser)
  const clearSession = useAuthStore((state) => state.clearSession)

  return useQuery({
    queryKey: ["auth", "me"],
    // Skip on auth screen after a failed attempt; Google success resets via resetSessionRestore().
    enabled: !user && !restoreSettled,
    retry: false,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    queryFn: async () => {
      try {
        const me = await authApi.me()
        restoreSettled = true
        setUser(me)
        return me
      } catch {
        restoreSettled = true
        clearSession()
        return null
      }
    },
  })
}
