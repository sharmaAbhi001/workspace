import { QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { useEffect, useState, type ReactNode } from "react"

import { createQueryClient } from "@/app/providers/query-client"
import { paths } from "@/app/router/paths"
import { useAuthStore } from "@/features/auth/store/auth.store"
import { setUnauthorizedHandler } from "@/shared/api/session-events"

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => createQueryClient())

  useEffect(() => {
    setUnauthorizedHandler(() => {
      useAuthStore.getState().clearSession()

      // Full navigation away from the protected app. Never clear the QueryClient
      // while still on /auth — that restarts /me and /refresh in a loop.
      if (!window.location.pathname.startsWith(paths.auth)) {
        window.location.assign(paths.auth)
      }
    })

    return () => setUnauthorizedHandler(() => {})
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {import.meta.env.DEV ? (
        <ReactQueryDevtools initialIsOpen={false} />
      ) : null}
    </QueryClientProvider>
  )
}
