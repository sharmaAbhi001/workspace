import { Loader2 } from "lucide-react"
import { useEffect, useState, type ReactNode } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"

import { paths } from "@/app/router/paths"
import { resetRefreshCircuit } from "@/shared/api/interceptors"
import { getApiErrorMessage } from "@/shared/api/error"

import { authApi } from "../api/auth.api"
import {
  markSessionRestoreSettled,
  resetSessionRestore,
} from "../hooks/use-restore-session"
import { useAuthStore } from "../store/auth.store"

/**
 * Completes Google OAuth after the API redirects to /app?google=success
 * by loading /me and hydrating the auth store.
 */
export function GoogleAuthBridge({ children }: { children: ReactNode }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const setUser = useAuthStore((state) => state.setUser)
  const clearSession = useAuthStore((state) => state.clearSession)
  const googleFlag = searchParams.get("google")
  const [bootstrapping, setBootstrapping] = useState(googleFlag === "success")

  useEffect(() => {
    if (googleFlag !== "success") return

    let cancelled = false

    async function finishGoogleLogin() {
      resetSessionRestore()
      resetRefreshCircuit()

      try {
        const user = await authApi.me()
        if (cancelled) return
        setUser(user)
        markSessionRestoreSettled()
      } catch (error) {
        if (cancelled) return
        clearSession()
        markSessionRestoreSettled()
        navigate(
          `${paths.auth}?error=${encodeURIComponent(
            getApiErrorMessage(error, "Google sign-in failed")
          )}`,
          { replace: true }
        )
        return
      } finally {
        if (!cancelled) {
          const next = new URLSearchParams(searchParams)
          next.delete("google")
          setSearchParams(next, { replace: true })
          setBootstrapping(false)
        }
      }
    }

    void finishGoogleLogin()

    return () => {
      cancelled = true
    }
  }, [
    googleFlag,
    clearSession,
    navigate,
    searchParams,
    setSearchParams,
    setUser,
  ])

  if (bootstrapping) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
          Finishing Google sign-in…
        </div>
      </div>
    )
  }

  return children
}
