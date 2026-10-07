import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { useEffect, useState, type ReactNode } from "react"
import { useForm } from "react-hook-form"
import { Link, useSearchParams } from "react-router-dom"

import { paths } from "@/app/router/paths"
import { getApiErrorMessage } from "@/shared/api/error"
import { GoogleIcon } from "@/shared/components/icons/BrandIcons"
import { ThemeToggle } from "@/shared/components/ThemeToggle"
import { Button, buttonVariants } from "@/shared/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card"
import { Separator } from "@/shared/components/ui/separator"
import { cn } from "@/shared/lib/utils"

import { useGoogleAuth } from "../hooks/use-google-auth"
import { useLogin } from "../hooks/use-login"
import { useSignup } from "../hooks/use-signup"
import {
  loginSchema,
  signupSchema,
  type LoginFormValues,
  type SignupFormValues,
} from "../schemas/auth.schema"

type AuthMode = "create" | "login"

const fieldClassName = cn(
  "flex h-10 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none transition-colors",
  "placeholder:text-muted-foreground",
  "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
  "disabled:cursor-not-allowed disabled:opacity-50",
  "aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
  "dark:bg-input/30"
)

export function AuthPage() {
  const [mode, setMode] = useState<AuthMode>("create")
  const [formError, setFormError] = useState<string | null>(null)
  const [searchParams, setSearchParams] = useSearchParams()
  const isCreate = mode === "create"

  const signup = useSignup()
  const login = useLogin()
  const googleAuth = useGoogleAuth()

  useEffect(() => {
    const oauthError = searchParams.get("error")
    if (!oauthError) return
    setFormError(oauthError)
    const next = new URLSearchParams(searchParams)
    next.delete("error")
    setSearchParams(next, { replace: true })
  }, [searchParams, setSearchParams])

  const signupForm = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    mode: "onTouched",
  })

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "onTouched",
  })

  const isBusy = signup.isPending || login.isPending || googleAuth.isPending
  const submitPending = isCreate ? signup.isPending : login.isPending
  const activeForm = isCreate ? signupForm : loginForm

  function onSignupSubmit(values: SignupFormValues) {
    if (isBusy) return
    setFormError(null)

    const parsed = signupSchema.parse(values)
    signup.mutate(
      {
        name: parsed.name,
        email: parsed.email,
        password: parsed.password,
      },
      {
        onError: (error) => {
          setFormError(getApiErrorMessage(error, "Could not create account"))
        },
      }
    )
  }

  function onLoginSubmit(values: LoginFormValues) {
    if (isBusy) return
    setFormError(null)

    const parsed = loginSchema.parse(values)
    login.mutate(parsed, {
      onError: (error) => {
        setFormError(getApiErrorMessage(error, "Could not log in"))
      },
    })
  }

  function handleGoogleClick() {
    if (isBusy) return
    setFormError(null)
    googleAuth.mutate(undefined, {
      onError: (error) => {
        setFormError(getApiErrorMessage(error, "Could not start Google sign-in"))
      },
    })
  }

  function switchMode(next: AuthMode) {
    if (isBusy || next === mode) return
    setFormError(null)
    signupForm.reset()
    loginForm.reset()
    setMode(next)
  }

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="flex items-center justify-between px-4 py-4 sm:px-6">
        <Link to={paths.home} className="text-lg font-semibold tracking-tight">
          Workspace
        </Link>
        <ThemeToggle />
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md shadow-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">
              {isCreate ? "Create your account" : "Welcome back"}
            </CardTitle>
            <CardDescription>
              {isCreate
                ? "Enter your details to get started with Workspace."
                : "Sign in to continue to Workspace."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {isCreate ? (
              <form
                className="space-y-3"
                onSubmit={signupForm.handleSubmit(onSignupSubmit)}
                noValidate
              >
                <Field
                  id="name"
                  label="Full name"
                  error={signupForm.formState.errors.name?.message}
                >
                  <input
                    id="name"
                    type="text"
                    autoComplete="name"
                    disabled={isBusy}
                    placeholder="Ada Lovelace"
                    aria-invalid={Boolean(signupForm.formState.errors.name)}
                    className={fieldClassName}
                    {...signupForm.register("name")}
                  />
                </Field>

                <Field
                  id="signup-email"
                  label="Email"
                  error={signupForm.formState.errors.email?.message}
                >
                  <input
                    id="signup-email"
                    type="email"
                    autoComplete="email"
                    disabled={isBusy}
                    placeholder="you@company.com"
                    aria-invalid={Boolean(signupForm.formState.errors.email)}
                    className={fieldClassName}
                    {...signupForm.register("email")}
                  />
                </Field>

                <Field
                  id="signup-password"
                  label="Password"
                  error={signupForm.formState.errors.password?.message}
                >
                  <input
                    id="signup-password"
                    type="password"
                    autoComplete="new-password"
                    disabled={isBusy}
                    placeholder="At least 8 characters"
                    aria-invalid={Boolean(signupForm.formState.errors.password)}
                    className={fieldClassName}
                    {...signupForm.register("password")}
                  />
                </Field>

                <Field
                  id="confirmPassword"
                  label="Confirm password"
                  error={signupForm.formState.errors.confirmPassword?.message}
                >
                  <input
                    id="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    disabled={isBusy}
                    placeholder="Re-enter your password"
                    aria-invalid={Boolean(
                      signupForm.formState.errors.confirmPassword
                    )}
                    className={fieldClassName}
                    {...signupForm.register("confirmPassword")}
                  />
                </Field>

                {formError ? (
                  <p className="text-sm text-destructive" role="alert">
                    {formError}
                  </p>
                ) : null}

                <Button
                  type="submit"
                  className="h-11 w-full"
                  size="lg"
                  disabled={isBusy || activeForm.formState.isSubmitting}
                >
                  {submitPending ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Creating account…
                    </>
                  ) : (
                    "Create account"
                  )}
                </Button>
              </form>
            ) : (
              <form
                className="space-y-3"
                onSubmit={loginForm.handleSubmit(onLoginSubmit)}
                noValidate
              >
                <Field
                  id="login-email"
                  label="Email"
                  error={loginForm.formState.errors.email?.message}
                >
                  <input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    disabled={isBusy}
                    placeholder="you@company.com"
                    aria-invalid={Boolean(loginForm.formState.errors.email)}
                    className={fieldClassName}
                    {...loginForm.register("email")}
                  />
                </Field>

                <Field
                  id="login-password"
                  label="Password"
                  error={loginForm.formState.errors.password?.message}
                >
                  <input
                    id="login-password"
                    type="password"
                    autoComplete="current-password"
                    disabled={isBusy}
                    placeholder="At least 8 characters"
                    aria-invalid={Boolean(loginForm.formState.errors.password)}
                    className={fieldClassName}
                    {...loginForm.register("password")}
                  />
                </Field>

                {formError ? (
                  <p className="text-sm text-destructive" role="alert">
                    {formError}
                  </p>
                ) : null}

                <Button
                  type="submit"
                  className="h-11 w-full"
                  size="lg"
                  disabled={isBusy || activeForm.formState.isSubmitting}
                >
                  {submitPending ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Logging in…
                    </>
                  ) : (
                    "Log in"
                  )}
                </Button>
              </form>
            )}

            <div className="flex items-center gap-3">
              <Separator className="flex-1" />
              <span className="text-xs text-muted-foreground">or</span>
              <Separator className="flex-1" />
            </div>

            <Button
              type="button"
              variant="outline"
              className="h-11 w-full gap-2.5"
              size="lg"
              disabled={isBusy}
              onClick={handleGoogleClick}
            >
              {googleAuth.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Redirecting…
                </>
              ) : (
                <>
                  <GoogleIcon className="size-5" />
                  Continue with Google
                </>
              )}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              {isCreate ? "Already have an account?" : "Don't have an account?"}{" "}
              <button
                type="button"
                className="font-medium text-foreground underline-offset-4 hover:underline disabled:opacity-50"
                disabled={isBusy}
                onClick={() => switchMode(isCreate ? "login" : "create")}
              >
                {isCreate ? "Log in" : "Create account"}
              </button>
            </p>

            <Link
              to={paths.home}
              className={cn(
                buttonVariants({ variant: "ghost" }),
                "mx-auto flex w-fit",
                isBusy && "pointer-events-none opacity-50"
              )}
            >
              Back to home
            </Link>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string
  label: string
  error?: string
  children: ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
      </label>
      {children}
      {error ? (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
