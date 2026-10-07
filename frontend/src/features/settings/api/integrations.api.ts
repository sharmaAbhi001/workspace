import { api } from "@/shared/api/axios-client"
import type { ApiSuccess } from "@/shared/api/types"

import type { Integration } from "../types"

type GmailConnectStart = {
  authorizationURL: string
}

export const integrationsApi = {
  list: () =>
    api
      .get<ApiSuccess<Integration[]>>("/api/v1/integrations")
      .then((response) => response.data.data ?? []),

  startGmailConnect: () =>
    api
      .get<ApiSuccess<GmailConnectStart>>("/api/v1/integrations/gmail/connect", {
        headers: { Accept: "application/json" },
      })
      .then((response) => {
        const payload = response.data.data
        if (!payload?.authorizationURL) {
          throw new Error("Gmail authorization URL missing")
        }
        return payload
      }),

  disconnect: (id: string) =>
    api.delete(`/api/v1/integrations/${id}`).then(() => undefined),
}
