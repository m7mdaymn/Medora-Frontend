export type SupportChatDirection = 'TenantToPlatform' | 'PlatformToTenant'

export interface ISupportChatMessage {
  id: string
  tenantId: string
  tenantName: string
  direction: SupportChatDirection
  message: string
  senderUserId?: string | null
  senderName?: string | null
  senderRole?: string | null
  createdAt: string
}

export interface ISupportChatThread {
  tenantId: string
  tenantName: string
  lastDirection: SupportChatDirection
  lastMessage: string
  lastSenderName?: string | null
  lastAt: string
  pendingTenantMessages: number
}
