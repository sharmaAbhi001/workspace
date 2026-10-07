import { Link } from "react-router-dom"

import { paths } from "@/app/router/paths"
import { buttonVariants } from "@/shared/components/ui/button"
import { cn } from "@/shared/lib/utils"

import { DataFlowCanvas } from "./data-flow/DataFlowCanvas"

export function Hero() {
  return (
    <section className="animate-fade-in border-b">
      <div className="mx-auto grid max-w-6xl items-start gap-10 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-20">
        <div className="order-1 space-y-6">
          <p className="text-sm font-semibold tracking-wide text-primary">
            Workspace
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            Clear your inbox without losing control
          </h1>
          <p className="max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Connect Gmail, let AI classify mail and draft replies, then approve
            every send yourself.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              to={paths.auth}
              className={cn(buttonVariants({ size: "lg" }), "h-11 px-5")}
            >
              Continue with Google
            </Link>
            <a
              href="#how-it-works"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "h-11 px-5"
              )}
            >
              See how it works
            </a>
          </div>
        </div>

        <div className="order-2 min-w-0">
          <DataFlowCanvas variant="hero" />
        </div>
      </div>
    </section>
  )
}
