export type MailProvider = "GMAIL" | "OUTLOOK" | "YAHOO"

export type IntegrationStatus = "ACTIVE" | "DISCONNECTED"

export type Integration = {
  id: string
  provider: MailProvider
  providerEmail: string
  status: IntegrationStatus
  watchExpiresAt: string | null
}
