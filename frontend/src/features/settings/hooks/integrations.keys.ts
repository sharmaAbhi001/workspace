export const integrationsKeys = {
  all: ["integrations"] as const,
  list: () => [...integrationsKeys.all, "list"] as const,
}
