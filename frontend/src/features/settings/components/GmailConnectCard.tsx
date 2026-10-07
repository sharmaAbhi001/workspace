import { Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"

import { getApiErrorMessage } from "@/shared/api/error"
import { GmailIcon } from "@/shared/components/icons/BrandIcons"
import { Button } from "@/shared/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card"

import { useConnectGmail } from "../hooks/use-connect-gmail"
import { useIntegrations } from "../hooks/use-integrations"
import { GmailConsentDialog } from "./GmailConsentDialog"

export function GmailConnectCard() {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [banner, setBanner] = useState<string | null>(null)
  const [searchParams, setSearchParams] = useSearchParams()

  const integrations = useIntegrations()
  const connectGmail = useConnectGmail()

  const gmailAccounts =
    integrations.data?.filter(
      (item) => item.provider === "GMAIL" && item.status === "ACTIVE"
    ) ?? []

  useEffect(() => {
    const status = searchParams.get("gmail")
    if (!status) return

    if (status === "connected") {
      setBanner("Gmail connected successfully.")
      void integrations.refetch()
    } else if (status === "error") {
      setBanner(
        searchParams.get("message") ?? "Could not connect Gmail. Try again."
      )
    }

    const next = new URLSearchParams(searchParams)
    next.delete("gmail")
    next.delete("message")
    setSearchParams(next, { replace: true })
  }, [searchParams, setSearchParams, integrations.refetch])

  function handleContinue() {
    if (connectGmail.isPending) return
    setError(null)
    connectGmail.mutate(undefined, {
      onError: (err) => {
        setError(getApiErrorMessage(err, "Could not start Gmail connect"))
      },
    })
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-start gap-3 space-y-0">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
            <GmailIcon className="size-6" />
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <CardTitle>Gmail</CardTitle>
            <CardDescription>
              Connect Gmail so Workspace can read mail, draft replies, and keep
              you in control of every send.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {banner ? (
            <p
              className="text-sm text-muted-foreground"
              role="status"
            >
              {banner}
            </p>
          ) : null}

          {integrations.isPending ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Loading connections…
            </div>
          ) : gmailAccounts.length > 0 ? (
            <ul className="space-y-2">
              {gmailAccounts.map((account) => (
                <li
                  key={account.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border/80 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {account.providerEmail}
                    </p>
                    <p className="text-xs text-muted-foreground">Connected</p>
                  </div>
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium tracking-wide text-primary uppercase">
                    Active
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              No Gmail account connected yet.
            </p>
          )}

          <Button
            type="button"
            className="gap-2"
            onClick={() => {
              setError(null)
              setOpen(true)
            }}
          >
            <GmailIcon className="size-4" />
            {gmailAccounts.length > 0 ? "Connect another Gmail" : "Integrate Gmail"}
          </Button>
        </CardContent>
      </Card>

      <GmailConsentDialog
        open={open}
        onOpenChange={setOpen}
        onContinue={handleContinue}
        isPending={connectGmail.isPending}
        error={error}
      />
    </>
  )
}
