export type MessageChannel = 'WhatsApp' | 'PWA' | string

export type MessageStatus =
  | 'Pending'
  | 'Sending'
  | 'Sent'
  | 'Delivered'
  | 'Read'
  | 'Failed'
  | 'Retrying'
  | string

export interface IMessageLog {
  id: string
  templateName: string
  recipientPhone: string | null
  recipientUserId: string | null
  channel: MessageChannel
  status: MessageStatus
  attemptCount: number
  nextAttemptAt: string | null
  lastAttemptAt: string | null
  sentAt: string | null
  deliveredAt: string | null
  providerMessageId: string | null
  lastProviderStatus: string | null
  providerRawResponse: string | null
  renderedBody: string | null
  failureReason: string | null
  variables: string | null
  createdAt: string
}

export interface ISendMessagePayload {
  templateName: string
  recipientPhone?: string
  recipientUserId?: string
  channel: MessageChannel
  variables?: Record<string, string>
}
