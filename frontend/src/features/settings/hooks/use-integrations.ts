import { useQuery } from "@tanstack/react-query"

import { integrationsApi } from "../api/integrations.api"
import { integrationsKeys } from "./integrations.keys"

export function useIntegrations() {
  return useQuery({
    queryKey: integrationsKeys.list(),
    queryFn: () => integrationsApi.list(),
  })
}
