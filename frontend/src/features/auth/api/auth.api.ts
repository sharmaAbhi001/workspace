import { api } from "@/shared/api/axios-client"
import type { ApiSuccess } from "@/shared/api/types"

import type { AuthUser, LoginInput, SignupInput } from "../types"

type GoogleAuthStart = {
  authorizationURL: string
}

export const authApi = {
  signup: (input: SignupInput) =>
    api
      .post<ApiSuccess<AuthUser>>("/api/v1/auth/signup", input)
      .then((response) => response.data.data),

  login: (input: LoginInput) =>
    api
      .post<ApiSuccess<AuthUser>>("/api/v1/auth/login", input)
      .then((response) => response.data.data),

  /** Starts OAuth via API (sets session cookie) and returns Google's URL. */
  startGoogleAuth: () =>
    api
      .get<ApiSuccess<GoogleAuthStart>>("/api/v1/auth/google/auth", {
        headers: { Accept: "application/json" },
      })
      .then((response) => {
        const payload = response.data.data
        if (!payload?.authorizationURL) {
          throw new Error("Google authorization URL missing")
        }
        return payload
      }),

  me: () =>
    api
      .get<ApiSuccess<AuthUser>>("/api/v1/auth/me")
      .then((response) => {
        const user = response.data.data
        if (!user) throw new Error("Session user missing")
        return user
      }),

  logout: () => api.post("/api/v1/auth/logout").then(() => undefined),
}
