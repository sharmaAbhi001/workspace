import { Loader2 } from "lucide-react"
import { Navigate, useLocation } from "react-router-dom"
import type { ReactNode } from "react"

import { paths } from "@/app/router/paths"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { useRestoreSession } from "@/features/auth/hooks/use-restore-session"

function FullPageSpinner() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-background">
      <Loader2 className="size-6 animate-spin text-muted-foreground" />
    </div>
  )
}

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const location = useLocation()
  const restore = useRestoreSession()

  // isPending = first load only. Avoid isFetching — refetches/clears could loop the spinner.
  if (!user && restore.isPending) {
    return <FullPageSpinner />
  }

  if (!user) {
    return <Navigate to={paths.auth} replace state={{ from: location }} />
  }

  return children
}

export function GuestOnly({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const restore = useRestoreSession()

  if (!user && restore.isPending) {
    return <FullPageSpinner />
  }

  if (user) {
    return <Navigate to={paths.dashboard} replace />
  }

  return children
}
