import { useMutation } from "@tanstack/react-query"

import { resetRefreshCircuit } from "@/shared/api/interceptors"

import { resetSessionRestore } from "./use-restore-session"

/**
 * Full-page navigate to the API so `connect.sid` is set first-party,
 * then the API redirects to Google. Avoids cross-origin Axios session issues.
 */
export function useGoogleAuth() {
  return useMutation({
    mutationKey: ["auth", "google"],
    mutationFn: async () => {
      resetSessionRestore()
      resetRefreshCircuit()

      const base = import.meta.env.VITE_API_BASE_URL.replace(/\/$/, "")
      window.location.assign(`${base}/api/v1/auth/google/auth`)

      return new Promise<never>(() => {})
    },
  })
}
