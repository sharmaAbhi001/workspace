import {
  Bot,
  FileText,
  Inbox,
  LayoutDashboard,
  LogOut,
  Settings,
  type LucideIcon,
} from "lucide-react"
import { NavLink } from "react-router-dom"

import { paths } from "@/app/router/paths"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { useLogout } from "@/features/auth/hooks/use-logout"
import { Button } from "@/shared/components/ui/button"
import { Separator } from "@/shared/components/ui/separator"
import { cn } from "@/shared/lib/utils"

type NavItem = {
  label: string
  to: string
  icon: LucideIcon
  end?: boolean
  soon?: boolean
}

const primaryNav: NavItem[] = [
  {
    label: "Dashboard",
    to: paths.dashboard,
    icon: LayoutDashboard,
    end: true,
  },
  { label: "Inbox", to: paths.inbox, icon: Inbox, soon: true },
  { label: "Documents", to: paths.documents, icon: FileText, soon: true },
  { label: "Agent", to: paths.agent, icon: Bot, soon: true },
]

const secondaryNav: NavItem[] = [
  { label: "Settings", to: paths.settings, icon: Settings },
]

type AppSidebarProps = {
  onNavigate?: () => void
  className?: string
}

export function AppSidebar({ onNavigate, className }: AppSidebarProps) {
  const { user } = useAuth()
  const logout = useLogout()

  return (
    <aside
      className={cn(
        "flex h-full w-64 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground",
        className
      )}
    >
      <div className="flex h-14 items-center px-4">
        <NavLink
          to={paths.dashboard}
          onClick={onNavigate}
          className="text-lg font-semibold tracking-tight"
        >
          Workspace
        </NavLink>
      </div>

      <Separator />

      <nav className="flex flex-1 flex-col gap-6 p-3" aria-label="App">
        <NavSection
          items={primaryNav}
          onNavigate={onNavigate}
          title="Workspace"
        />
        <NavSection
          items={secondaryNav}
          onNavigate={onNavigate}
          title="Account"
        />
      </nav>

      <div className="mt-auto space-y-3 border-t border-sidebar-border p-3">
        <div className="rounded-lg bg-sidebar-accent/60 px-3 py-2">
          <p className="truncate text-sm font-medium">{user?.name}</p>
          <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
        </div>
        <Button
          type="button"
          variant="ghost"
          className="w-full justify-start gap-2"
          disabled={logout.isPending}
          onClick={() => logout.mutate()}
        >
          <LogOut className="size-4" />
          {logout.isPending ? "Signing out…" : "Sign out"}
        </Button>
      </div>
    </aside>
  )
}

function NavSection({
  title,
  items,
  onNavigate,
}: {
  title: string
  items: NavItem[]
  onNavigate?: () => void
}) {
  return (
    <div className="space-y-1">
      <p className="px-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {title}
      </p>
      <ul className="space-y-0.5">
        {items.map((item) => (
          <li key={item.label}>
            {item.soon ? (
              <div className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-muted-foreground">
                <item.icon className="size-4 shrink-0 opacity-70" />
                <span className="flex-1">{item.label}</span>
                <span className="text-[10px] font-medium tracking-wide uppercase">
                  Soon
                </span>
              </div>
            ) : (
              <NavLink
                to={item.to}
                end={item.end}
                onClick={onNavigate}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm transition-colors",
                    isActive
                      ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground"
                  )
                }
              >
                <item.icon className="size-4 shrink-0" />
                {item.label}
              </NavLink>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
