import { useMutation } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"

import { paths } from "@/app/router/paths"

import { resetRefreshCircuit } from "@/shared/api/interceptors"

import { authApi } from "../api/auth.api"
import { resetSessionRestore } from "./use-restore-session"
import { useAuthStore } from "../store/auth.store"
import type { SignupInput } from "../types"

export function useSignup() {
  const navigate = useNavigate()
  const setUser = useAuthStore((state) => state.setUser)

  return useMutation({
    mutationKey: ["auth", "signup"],
    mutationFn: (input: SignupInput) => authApi.signup(input),
    onSuccess: (user) => {
      resetRefreshCircuit()
      resetSessionRestore()
      setUser(user)
      void navigate(paths.dashboard, { replace: true })
    },
  })
}
