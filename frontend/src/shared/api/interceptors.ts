import type { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from "axios"

import { emitUnauthorized } from "@/shared/api/session-events"

type RetriableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean
}

const REFRESH_URL = "/api/v1/auth/refresh"

const SKIP_REFRESH_PATHS = [
  "/api/v1/auth/login",
  "/api/v1/auth/signup",
  "/api/v1/auth/refresh",
  "/api/v1/auth/logout",
  "/api/v1/auth/google/auth",
]

let refreshPromise: Promise<void> | null = null
/** After one failed refresh, stop retrying until the next login. */
let refreshBlocked = false

export function resetRefreshCircuit() {
  refreshBlocked = false
}

function shouldSkipRefresh(url?: string) {
  if (!url) return false
  return SKIP_REFRESH_PATHS.some((path) => url.includes(path))
}

function isAuthPage() {
  return window.location.pathname.startsWith("/auth")
}

async function refreshSession(api: AxiosInstance) {
  await api.post(REFRESH_URL)
}

export function attachAuthInterceptors(api: AxiosInstance) {
  api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const original = error.config as RetriableRequestConfig | undefined
      const status = error.response?.status

      if (
        !original ||
        status !== 401 ||
        original._retry ||
        refreshBlocked ||
        shouldSkipRefresh(original.url)
      ) {
        return Promise.reject(error)
      }

      original._retry = true

      try {
        if (!refreshPromise) {
          refreshPromise = refreshSession(api).finally(() => {
            refreshPromise = null
          })
        }

        await refreshPromise
        return api(original)
      } catch (refreshError) {
        refreshBlocked = true
        // On the auth page, just fail the request — do not retrigger restore loops.
        if (!isAuthPage()) {
          emitUnauthorized()
        }
        return Promise.reject(refreshError)
      }
    }
  )
}
