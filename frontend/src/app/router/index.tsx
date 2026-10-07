import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"

import { AppLayout } from "@/app/layouts/AppLayout"
import { AuthLayout } from "@/app/layouts/AuthLayout"
import { PublicLayout } from "@/app/layouts/PublicLayout"
import { GuestOnly, RequireAuth } from "@/app/router/guards"
import { paths } from "@/app/router/paths"
import { AuthPage } from "@/features/auth"
import { GoogleAuthBridge } from "@/features/auth/components/GoogleAuthBridge"
import { DashboardPage } from "@/features/dashboard"
import { LandingPage } from "@/features/landing"
import { SettingsPage } from "@/features/settings"

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path={paths.home} element={<LandingPage />} />
        </Route>

        <Route
          element={
            <GuestOnly>
              <AuthLayout />
            </GuestOnly>
          }
        >
          <Route path={paths.auth} element={<AuthPage />} />
        </Route>

        <Route
          path={paths.appRoot}
          element={
            <GoogleAuthBridge>
              <RequireAuth>
                <AppLayout />
              </RequireAuth>
            </GoogleAuthBridge>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        <Route path="*" element={<Navigate to={paths.home} replace />} />
      </Routes>
    </BrowserRouter>
  )
}
