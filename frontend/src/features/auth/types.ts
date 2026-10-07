export type AuthUser = {
  id: string
  name: string
  email: string
  emailVerified: boolean
}

export type { LoginFormValues, LoginInput, SignupFormValues, SignupInput } from "./schemas/auth.schema"
