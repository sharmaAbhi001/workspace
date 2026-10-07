import { GmailConnectCard } from "../components/GmailConnectCard"

export function SettingsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <section className="space-y-2">
        <p className="text-sm font-medium text-primary">Settings</p>
        <h1 className="text-3xl font-semibold tracking-tight">Integrations</h1>
        <p className="max-w-2xl text-muted-foreground">
          Connect the tools Workspace uses for context. You stay in control —
          connect or disconnect anytime.
        </p>
      </section>

      <GmailConnectCard />
    </div>
  )
}
