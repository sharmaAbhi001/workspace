import { Link } from "react-router-dom"

import { paths } from "@/app/router/paths"
import { buttonVariants } from "@/shared/components/ui/button"
import { cn } from "@/shared/lib/utils"

export function FinalCta() {
  return (
    <section className="border-t bg-primary/5 py-16 sm:py-20">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
        <h2 className="text-3xl font-semibold tracking-tight">
          Ready to clear your inbox?
        </h2>
        <p className="mt-3 text-muted-foreground">
          Connect Gmail and start reviewing AI drafts — with you in control of
          every send.
        </p>
        <Link
          to={paths.auth}
          className={cn(buttonVariants({ size: "lg" }), "mt-8 inline-flex h-11 px-5")}
        >
          Continue with Google
        </Link>
      </div>
    </section>
  )
}
