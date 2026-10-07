# Frontend Architecture — Workspace

Production-grade guide for the Vite + React 19 frontend: **TanStack Query** (server state), **Zustand** (client / UI context), **Axios** (HTTP), **React Router 7** (routing), feature-based clean architecture, hooks, and component conventions.

This document is the target architecture. **Current shipping code** (landing + auth + shared UI) already lives under `app/` / `shared/` / `features/`. Remaining phases add Query/Zustand/Axios and future product features.

---

## 1. Goals

| Goal | How we achieve it |
|------|-------------------|
| Predictable data flow | Server data only in TanStack Query; UI/session only in Zustand / local state |
| Testable boundaries | Pure API services (no React); hooks wrap Query/Zustand; components stay thin |
| Scalable ownership | Feature folders own their API, hooks, store, UI, and types |
| Safe auth & HTTP | One Axios instance + interceptors; route guards; token refresh in one place |
| Fast UX | Query cache, stale-while-revalidate, lazy routes, selective Zustand selectors |

---

## 2. Stack decisions

| Concern | Library | Why |
|---------|---------|-----|
| Server state (lists, detail, mutations) | `@tanstack/react-query` | Cache, retries, invalidation, background refetch, DevTools |
| Client / UI / session context | `zustand` | Tiny, no Provider tree hell, fine-grained selectors |
| HTTP | `axios` | Interceptors, cancel tokens, consistent error shape |
| Routing | `react-router-dom` v7 (already in app) | Nested layouts, loaders optional, lazy routes |
| Forms / validation | `react-hook-form` + `zod` (recommended) | Typed forms aligned with API DTOs |
| UI primitives | Existing `components/ui` (shadcn / Base UI) | Design system stays shared |

### What goes where (hard rules)

| State type | Examples | Owner |
|------------|----------|--------|
| **Server** | inbox drafts, email thread, docs list, user profile from API | TanStack Query |
| **Client / UI** | sidebar open, selected draft id for UI chrome, theme, wizard step | Zustand or `useState` |
| **Auth session (client mirror)** | `accessToken`, `user` summary for guards | Zustand (hydrate from API / storage); **source of truth for “who am I?” after fetch stays in Query if you also cache `/me`** |
| **URL state** | filters, page, modal open via query string | React Router search params |
| **Ephemeral form** | controlled inputs before submit | Local component state / RHF |

**Never** put API response caches in Zustand.  
**Never** put “is sidebar open” in TanStack Query.  
**Avoid** React Context for global app state unless you need React-tree-scoped DI (e.g. theme from CSS already handled).

---

## 3. Recommended folder structure

```text
frontend/src/
├── app/                          # App shell only
│   ├── App.tsx                   # Providers + Router mount
│   ├── providers/
│   │   ├── AppProviders.tsx      # Compose Query + Toaster + Theme
│   │   └── query-client.ts       # QueryClient factory + defaults
│   ├── router/
│   │   ├── index.tsx             # createBrowserRouter / Routes tree
│   │   ├── paths.ts              # typed path constants
│   │   └── guards.tsx            # RequireAuth, GuestOnly
│   └── layouts/
│       ├── PublicLayout.tsx      # Landing / auth chrome
│       ├── AppLayout.tsx         # Authenticated shell (nav, sidebar)
│       └── AuthLayout.tsx        # Centered auth card
│
├── shared/                       # Cross-feature, no business rules
│   ├── api/
│   │   ├── axios-client.ts       # Single Axios instance
│   │   ├── interceptors.ts       # Auth header, 401 refresh, error normalize
│   │   └── types.ts              # ApiError, PaginatedResponse, etc.
│   ├── components/
│   │   ├── ui/                   # Design system (button, card, input…)
│   │   └── feedback/             # Spinner, EmptyState, ErrorBoundary
│   ├── hooks/                    # Generic hooks (useMediaQuery, useDebounce)
│   ├── lib/                      # cn, date, string helpers
│   ├── constants/
│   └── types/
│
├── features/                     # Business domains (vertical slices)
│   ├── auth/
│   │   ├── api/
│   │   │   └── auth.api.ts       # Pure Axios calls
│   │   ├── hooks/
│   │   │   ├── use-login.ts
│   │   │   ├── use-register.ts
│   │   │   └── use-session.ts
│   │   ├── store/
│   │   │   └── auth.store.ts     # Zustand: tokens, session flags
│   │   ├── components/
│   │   ├── pages/
│   │   │   └── AuthPage.tsx
│   │   ├── schemas/
│   │   │   └── auth.schema.ts    # Zod
│   │   ├── types.ts
│   │   └── index.ts              # Public API of the feature
│   ├── inbox/                    # Gmail drafts, approve / reject
│   ├── documents/                # Knowledge base uploads
│   ├── dashboard/                # Attention / reminders
│   ├── agent/                    # Workspace Agent chat
│   └── landing/                  # Marketing site (mostly presentational)
│
├── pages/                        # Optional thin re-exports during migration
├── assets/
├── index.css
└── main.tsx                      # createRoot → AppProviders → Router
```

### Feature folder rules

1. **A feature may import from `shared/` and `app/` (paths/guards only). It must not import another feature’s internals.**
2. Cross-feature needs → move shared types/hooks into `shared/`, or import only via that feature’s `index.ts` public exports (prefer extract to `shared/` for anything used by 2+ features).
3. Each feature’s `index.ts` exports only what other layers need (pages for router, a few hooks). Keep private files unexported.
4. Prefer **co-located pages** under `features/<name>/pages` over a giant global `pages/`.

### Workspace feature map (product-aligned)

| Feature | Owns |
|---------|------|
| `auth` | Google OAuth / email signup UI, session store, login mutations |
| `inbox` | Draft list/detail, approve, reject, edit-with-AI rounds |
| `documents` | Upload, list, delete knowledge docs |
| `dashboard` | Attention items, reminders, notes summary |
| `agent` | Chat UI + conversation queries/mutations |
| `landing` | Marketing sections (already mostly built) |

---

## 4. Layering (clean architecture for React)

```text
UI (components / pages)
        ↓ hooks only
Hooks (TanStack Query + Zustand selectors + RHF)
        ↓ call
API services (pure async functions using axios-client)
        ↓ HTTP
Backend REST
```

### Responsibility of each layer

| Layer | Does | Does not |
|-------|------|----------|
| **Component** | Render, wire events to hooks, local UI state | Call Axios, know URLs, own cache keys |
| **Hook** | `useQuery` / `useMutation`, map errors to UI, invalidate keys | Contain JSX, hardcode fetch URLs (except via api module) |
| **API service** | `GET/POST/...`, map DTO → domain type | Touch React, toast, navigate |
| **Zustand store** | UI flags, auth token mirror, selection that isn’t URL | Fetch lists or duplicate Query cache |
| **Router** | Match URL → layout → page, auth guards, lazy load | Business logic beyond redirects |

---

## 5. Axios (HTTP layer)

### Setup

```ts
// shared/api/axios-client.ts
import axios from "axios"

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true, // if refresh cookie is httpOnly
  timeout: 30_000,
  headers: { "Content-Type": "application/json" },
})
```

### Interceptors (production checklist)

1. **Request** — attach `Authorization: Bearer <accessToken>` from auth store (or memory).
2. **Response error** — normalize to `{ message, code, status, details? }`.
3. **401** — single-flight refresh queue; retry original request once; on failure clear session + redirect to `/auth`.
4. **No toast in interceptors for every error** — let hooks decide UX (silent background refetch vs form error).

### API service pattern

```ts
// features/inbox/api/inbox.api.ts
import { api } from "@/shared/api/axios-client"
import type { Draft, DraftListParams } from "../types"

export const inboxApi = {
  listDrafts: (params: DraftListParams) =>
    api.get<Draft[]>("/mail/drafts", { params }).then((r) => r.data),

  getDraft: (id: string) =>
    api.get<Draft>(`/mail/drafts/${id}`).then((r) => r.data),

  approve: (id: string) =>
    api.post<Draft>(`/mail/drafts/${id}/approve`).then((r) => r.data),
}
```

Keep services **framework-agnostic** so they can be unit-tested with mocked Axios.

---

## 6. TanStack Query (server state)

### QueryClient defaults (recommended starting point)

```ts
// app/providers/query-client.ts
import { QueryClient } from "@tanstack/react-query"

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,          // 1 min — tune per domain
        gcTime: 5 * 60_000,
        retry: 1,                   // production: fewer noisy retries than default 3
        refetchOnWindowFocus: true,
      },
      mutations: {
        retry: 0,
      },
    },
  })
}
```

### Query key factories (mandatory)

```ts
// features/inbox/hooks/inbox.keys.ts
export const inboxKeys = {
  all: ["inbox"] as const,
  lists: () => [...inboxKeys.all, "list"] as const,
  list: (params: { status?: string }) =>
    [...inboxKeys.lists(), params] as const,
  details: () => [...inboxKeys.all, "detail"] as const,
  detail: (id: string) => [...inboxKeys.details(), id] as const,
}
```

### Query / mutation hooks

```ts
// features/inbox/hooks/use-drafts.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { inboxApi } from "../api/inbox.api"
import { inboxKeys } from "./inbox.keys"

export function useDrafts(params: { status?: string } = {}) {
  return useQuery({
    queryKey: inboxKeys.list(params),
    queryFn: () => inboxApi.listDrafts(params),
  })
}

export function useApproveDraft() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => inboxApi.approve(id),
    onSuccess: (draft) => {
      void qc.invalidateQueries({ queryKey: inboxKeys.lists() })
      qc.setQueryData(inboxKeys.detail(draft.id), draft)
    },
  })
}
```

### Hook naming conventions

| Pattern | Use |
|---------|-----|
| `useX` | Query for resource X |
| `useXList` / `useXs` | Collection |
| `useCreateX` / `useUpdateX` / `useDeleteX` | Mutations |
| `useXForm` | RHF + schema + mutation orchestration |

### Invalidation strategy

- After **create/update/delete**, invalidate the relevant `lists()` and patch or invalidate `detail(id)`.
- Prefer **narrow keys** over `invalidateQueries({ queryKey: ['inbox'] })` when possible.
- Optimistic updates only for high-confidence UX (approve/reject); always reconcile on settle.

### DevTools

Mount `@tanstack/react-query-devtools` in development only inside `AppProviders`.

---

## 7. Zustand (client / context state)

### When to create a store

- Auth session flags / tokens needed outside React Query lifecycle
- Persistent UI prefs (sidebar collapsed) — use `persist` middleware sparingly
- Cross-route ephemeral selection that is **not** worth putting in the URL

### Store pattern

```ts
// features/auth/store/auth.store.ts
import { create } from "zustand"
import { persist } from "zustand/middleware"

type AuthState = {
  accessToken: string | null
  user: { id: string; email: string; name: string } | null
  setSession: (payload: {
    accessToken: string
    user: AuthState["user"]
  }) => void
  clearSession: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      user: null,
      setSession: ({ accessToken, user }) => set({ accessToken, user }),
      clearSession: () => set({ accessToken: null, user: null }),
    }),
    {
      name: "workspace-auth",
      // Prefer memory / sessionStorage for accessToken in production;
      // refresh token should be httpOnly cookie when possible.
      partialize: (s) => ({ user: s.user }), // example: don’t persist token long-term
    }
  )
)
```

### Selector discipline

```ts
// Good — re-renders only when user changes
const user = useAuthStore((s) => s.user)

// Bad — re-renders on any store change
const store = useAuthStore()
```

Use `useShallow` from `zustand/react/shallow` when selecting objects/arrays.

### Auth + Query together

1. Login mutation succeeds → `setSession` in Zustand + optionally `queryClient.setQueryData(userKeys.me(), user)`.
2. App boot → `useSession` / `restoreSession` mutation or query that refreshes tokens.
3. Route guard reads Zustand (`accessToken` / `user`) or a `useAuth()` facade hook.
4. Logout → `clearSession` + `queryClient.clear()`.

Expose a single facade:

```ts
// features/auth/hooks/use-auth.ts
export function useAuth() {
  const user = useAuthStore((s) => s.user)
  const clearSession = useAuthStore((s) => s.clearSession)
  // + login/logout mutations as needed
  return { user, isAuthenticated: Boolean(user), clearSession }
}
```

---

## 8. Production-grade routing

### Keep React Router 7 (current choice)

Stay on `react-router-dom` unless you need first-class typed search params / file routing. Revisit **TanStack Router** later for heavy filter/dashboard URL state.

### Route tree shape

```text
/                     → PublicLayout → LandingPage
/auth                 → AuthLayout → AuthPage (guest only)
/app                  → AppLayout (RequireAuth)
  /app                → DashboardPage
  /app/inbox          → InboxListPage
  /app/inbox/:draftId → InboxDetailPage
  /app/documents      → DocumentsPage
  /app/agent          → AgentPage
  /app/settings       → SettingsPage
*                     → NotFound or redirect
```

### Implementation sketch

```tsx
// app/router/index.tsx
import { lazy, Suspense } from "react"
import { createBrowserRouter, Navigate } from "react-router-dom"
import { AppLayout } from "@/app/layouts/AppLayout"
import { AuthLayout } from "@/app/layouts/AuthLayout"
import { PublicLayout } from "@/app/layouts/PublicLayout"
import { RequireAuth, GuestOnly } from "@/app/router/guards"
import { paths } from "@/app/router/paths"

const LandingPage = lazy(() =>
  import("@/features/landing/pages/LandingPage").then((m) => ({
    default: m.LandingPage,
  }))
)
// …same for Auth, Dashboard, Inbox, etc.

export const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      { path: paths.home, element: <LandingPage /> },
    ],
  },
  {
    element: (
      <GuestOnly>
        <AuthLayout />
      </GuestOnly>
    ),
    children: [{ path: paths.auth, element: /* AuthPage */ null }],
  },
  {
    path: paths.appRoot,
    element: (
      <RequireAuth>
        <AppLayout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: /* Dashboard */ null },
      { path: "inbox", element: /* Inbox list */ null },
      { path: "inbox/:draftId", element: /* Inbox detail */ null },
      { path: "documents", element: /* Documents */ null },
      { path: "agent", element: /* Agent */ null },
    ],
  },
  { path: "*", element: <Navigate to={paths.home} replace /> },
])
```

### Path constants

```ts
// app/router/paths.ts
export const paths = {
  home: "/",
  auth: "/auth",
  appRoot: "/app",
  dashboard: "/app",
  inbox: "/app/inbox",
  inboxDetail: (id: string) => `/app/inbox/${id}`,
  documents: "/app/documents",
  agent: "/app/agent",
} as const
```

Always navigate with `paths.*` — never scatter magic strings.

### Guards

```tsx
// app/router/guards.tsx
import { Navigate, useLocation } from "react-router-dom"
import { useAuthStore } from "@/features/auth/store/auth.store"
import { paths } from "@/app/router/paths"

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user)
  const location = useLocation()
  if (!user) {
    return <Navigate to={paths.auth} replace state={{ from: location }} />
  }
  return children
}

export function GuestOnly({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user)
  if (user) return <Navigate to={paths.dashboard} replace />
  return children
}
```

### Lazy loading & Suspense

- Lazy-load every authenticated feature page.
- Put a single route-level `<Suspense fallback={<PageSpinner />}>` in layouts.
- Keep layouts eager so chrome does not flash.

### URL as state

Put filters that should be shareable/bookmarkable in search params (`?status=pending&page=1`). Sync them with Query keys:

```ts
queryKey: inboxKeys.list({ status, page })
```

---

## 9. Component architecture

### Categories

| Kind | Location | Rules |
|------|----------|-------|
| **UI primitive** | `shared/components/ui` | No feature imports, no API |
| **Shared composite** | `shared/components/*` | EmptyState, ConfirmDialog — still API-free |
| **Feature component** | `features/x/components` | May use feature hooks |
| **Page** | `features/x/pages` | Composition only; no fat logic |
| **Layout** | `app/layouts` | Slots + chrome; no domain fetch except session bootstrap |

### Page pattern

```tsx
export function InboxPage() {
  const { data, isPending, isError, error } = useDrafts({ status: "pending" })
  const approve = useApproveDraft()

  if (isPending) return <PageSpinner />
  if (isError) return <ErrorState message={error.message} />

  return (
    <InboxDraftList
      drafts={data}
      onApprove={(id) => approve.mutate(id)}
      isApproving={approve.isPending}
    />
  )
}
```

### Presentational vs container

- Prefer **hooks at page / container boundary**, presentational children take props.
- Avoid prop-drilling across 4+ levels — lift to URL or a small Zustand UI store for that feature.

### Naming

| Type | Convention |
|------|------------|
| Components | `PascalCase.tsx` |
| Hooks | `use-thing.ts` or `useThing.ts` (pick one; stick to it) |
| API | `thing.api.ts` |
| Keys | `thing.keys.ts` |
| Store | `thing.store.ts` |
| Schema | `thing.schema.ts` |

---

## 10. Providers & bootstrap

```tsx
// main.tsx
createRoot(root).render(
  <StrictMode>
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  </StrictMode>
)
```

```tsx
// app/providers/AppProviders.tsx
export function AppProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => createQueryClient())
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
```

Order matters: **QueryClient → Router → Layouts → Pages**. Zustand needs no provider.

---

## 11. Error & loading conventions

1. **Queries** — page-level Pending / Error / Empty triad.
2. **Mutations** — disable buttons with `isPending`; surface field errors from Zod / API `details`.
3. **Global** — ErrorBoundary around layouts for render crashes.
4. **Axios errors** — map in `shared/api` to a typed `ApiError`; hooks read `error.message`.

---

## 12. Env & security

```env
VITE_API_BASE_URL=https://api.example.com
```

- Only `VITE_*` vars are exposed to the client.
- Prefer **httpOnly refresh cookie** + short-lived access token in memory.
- Never log tokens.
- CSRF: if cookie-based sessions, align with backend CSRF strategy.

---

## 13. Testing strategy (aligned with layers)

| Layer | Test with |
|-------|-----------|
| API services | Vitest + mocked Axios / MSW |
| Hooks | `@testing-library/react` + `QueryClientProvider` |
| Zustand | Direct store actions + selector assertions |
| Pages | RTL + MSW for network |
| E2E | Playwright critical paths (login → inbox → approve) |

---

## 14. Packages to add

```bash
npm install @tanstack/react-query axios zustand
npm install -D @tanstack/react-query-devtools
# recommended soon:
npm install react-hook-form zod @hookform/resolvers
```

Optional later: `@tanstack/react-table`, `sonner` (toasts), MSW.

---

## 15. Migration plan (from current codebase)

Current state: `App.tsx` routes, `pages/AuthPage`, `pages/LandingPage`, `components/landing/*`, `components/ui/*`.

| Phase | Work |
|-------|------|
| **0–2** | ✅ Done — `app/`, `shared/`, `features/landing`, `features/auth` |
| **3** | Add `RequireAuth` / `GuestOnly`; nest `/app/*` routes when app shell ships |
| **4** | Add deps + `shared/api/axios-client`; wire QueryClient in `AppProviders`; `auth.api` + `auth.store` |
| **5** | Add `inbox`, `documents`, `dashboard`, `agent` features as backend endpoints land |
| **6** | Enforce feature import boundaries in lint (optional eslint rule) |

Do not big-bang rewrite the landing animation code — move folders first, behavior second.

---

## 16. Import boundaries (cheat sheet)

```text
✅ features/inbox/hooks → features/inbox/api
✅ features/inbox/pages → features/inbox/hooks
✅ features/inbox/* → shared/*
✅ app/router → features/*/pages (pages only) + features/auth/store (guards)
❌ features/inbox → features/documents/internal
❌ shared → features/*
❌ components → axios directly
❌ Zustand store → useQuery inside create()
```

---

## 17. Example end-to-end flow (approve draft)

```text
InboxDetailPage
  → useDraft(id)                    # Query: GET /mail/drafts/:id
  → useApproveDraft()               # Mutation: POST .../approve
       → inboxApi.approve           # Axios
       → invalidate inboxKeys.lists
       → setQueryData detail
  → useUiStore.setToast(...)        # optional Zustand UI feedback
  → navigate(paths.inbox)           # Router
```

---

## 18. Definition of done (per feature)

A feature is “architecture-complete” when:

- [ ] `api/*.api.ts` has no React imports  
- [ ] All fetches go through TanStack Query hooks with key factories  
- [ ] Mutations invalidate the correct keys  
- [ ] UI-only state is local or Zustand (not Query)  
- [ ] Page is lazy-routed under the right layout / guard  
- [ ] Types + Zod schemas cover request/response used by the UI  
- [ ] Public exports are limited via `index.ts`  

---

## 19. References

- [TanStack Query — Important Defaults](https://tanstack.com/query/latest/docs/framework/react/guides/important-defaults)
- [TanStack Query — Query Keys](https://tanstack.com/query/latest/docs/framework/react/guides/query-keys)
- [Zustand — Practice](https://docs.pmnd.rs/zustand/guides/practice-with-no-store-actions)
- [Axios Interceptors](https://axios-http.com/docs/interceptors)
- [React Router 7 — Data Routers](https://reactrouter.com/en/main)

---

*Living doc for Workspace frontend. Update when adding a new top-level feature or changing auth/token strategy.*
