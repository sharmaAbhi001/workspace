import { Check, Loader2 } from "lucide-react"
import { useState } from "react"

import { GmailIcon } from "@/shared/components/icons/BrandIcons"
import { Button } from "@/shared/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog"
import { cn } from "@/shared/lib/utils"

const permissions = [
  {
    id: "gmail.readonly",
    label: "Read your Gmail messages",
    detail: "Classify mail, extract notes, and draft replies. Nothing is sent without your approval.",
  },
] as const

type GmailConsentDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onContinue: () => void
  isPending: boolean
  error?: string | null
}

export function GmailConsentDialog({
  open,
  onOpenChange,
  onContinue,
  isPending,
  error,
}: GmailConsentDialogProps) {
  const [accepted, setAccepted] = useState(false)

  function handleOpenChange(next: boolean) {
    if (isPending) return
    if (!next) setAccepted(false)
    onOpenChange(next)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent showCloseButton={!isPending}>
        <DialogHeader>
          <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-muted">
            <GmailIcon className="size-6" />
          </div>
          <DialogTitle>Connect Gmail</DialogTitle>
          <DialogDescription>
            Workspace will ask Google for permission. Review what we need, then
            continue to Google Authorization.
          </DialogDescription>
        </DialogHeader>

        <ul className="space-y-3 rounded-lg border border-border/80 p-3">
          {permissions.map((permission) => (
            <li key={permission.id} className="flex gap-3">
              <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                <Check className="size-3.5" strokeWidth={2.5} />
              </span>
              <div>
                <p className="text-sm font-medium">{permission.label}</p>
                <p className="text-xs text-muted-foreground">
                  {permission.detail}
                </p>
              </div>
            </li>
          ))}
        </ul>

        <label
          className={cn(
            "flex cursor-pointer items-start gap-3 rounded-lg border border-border/80 px-3 py-3",
            "has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50"
          )}
        >
          <input
            type="checkbox"
            checked={accepted}
            disabled={isPending}
            onChange={(event) => setAccepted(event.target.checked)}
            className="mt-0.5 size-4 accent-primary"
          />
          <span className="text-sm text-foreground">
            I understand Workspace will access my Gmail with{" "}
            <span className="font-medium">Google Authorization</span>, and
            nothing is sent without my approval.
          </span>
        </label>

        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() => handleOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={!accepted || isPending}
            onClick={onContinue}
          >
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Connecting…
              </>
            ) : (
              "Continue with Google"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
