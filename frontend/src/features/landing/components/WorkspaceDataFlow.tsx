import { WorkspaceAgent } from "./data-flow/WorkspaceAgent"
import { InboxDraftMockup } from "./mockups/InboxDraftMockup"

export function WorkspaceDataFlow() {
  return (
    <div className="mt-14 space-y-6">
      <div className="mx-auto max-w-4xl">
        <InboxDraftMockup />
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Data from your sources powers a workspace agent that helps you move
        faster — with you approving every send.
      </p>

      <WorkspaceAgent />
    </div>
  )
}
