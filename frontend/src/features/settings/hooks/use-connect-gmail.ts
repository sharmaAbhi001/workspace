import { useMutation } from "@tanstack/react-query"

import { integrationsApi } from "../api/integrations.api"

/** Calls connect API, then redirects to Google — backend host stays hidden. */
export function useConnectGmail() {
  return useMutation({
    mutationKey: ["integrations", "gmail", "connect"],
    mutationFn: async () => {
      const { authorizationURL } = await integrationsApi.startGmailConnect()
      window.location.assign(authorizationURL)
      return new Promise<never>(() => {})
    },
  })
}
