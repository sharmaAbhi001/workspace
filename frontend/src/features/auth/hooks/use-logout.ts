import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"

import { paths } from "@/app/router/paths"

import { resetRefreshCircuit } from "@/shared/api/interceptors"

import { authApi } from "../api/auth.api"
import { markSessionRestoreSettled } from "./use-restore-session"
import { useAuthStore } from "../store/auth.store"

export function useLogout() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const clearSession = useAuthStore((state) => state.clearSession)

  return useMutation({
    mutationKey: ["auth", "logout"],
    mutationFn: () => authApi.logout(),
    onSettled: () => {
      clearSession()
      // Avoid a fresh /me + /refresh attempt on the auth screen after logout.
      markSessionRestoreSettled()
      resetRefreshCircuit()
      queryClient.clear()
      void navigate(paths.auth, { replace: true })
    },
  })
}
