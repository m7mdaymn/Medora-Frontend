export type InAppNotificationType =
  | 'PartnerOrderStatusChanged'
  | 'MedicalDocumentThreadUpdated'
  | 'PrescriptionRevised'
  | 'System'
  | string

export interface INotificationSubscription {
  id: string
  userId: string
  endpoint: string
  isActive: boolean
  lastUsedAt: string | null
  createdAt: string
}

export interface IInAppNotification {
  id: string
  type: InAppNotificationType
  title: string
  body: string
  entityType: string | null
  entityId: string | null
  isRead: boolean
  readAt: string | null
  createdAt: string
}

export interface INotificationSubscriptionPayload {
  endpoint: string
  p256dh: string
  auth: string
}

export interface ISendNotificationPayload {
  userId: string
  title: string
  body: string
  templateName?: string
  variables?: Record<string, string>
}
