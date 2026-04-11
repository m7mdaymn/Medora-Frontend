'use server'

import { fetchApi } from '@/lib/fetchApi'
import { BaseApiResponse } from '@/types/api'
import { ISupportChatMessage, ISupportChatThread } from '@/types/support-chat'

function normalizeMessage(message: string): string {
  return message.trim()
}

export async function getTenantSupportMessagesAction(
  tenantSlug: string,
): Promise<BaseApiResponse<ISupportChatMessage[]>> {
  return await fetchApi<ISupportChatMessage[]>('/api/clinic/support-chat/messages', {
    method: 'GET',
    tenantSlug,
    cache: 'no-store',
  })
}

export async function sendTenantSupportMessageAction(
  tenantSlug: string,
  message: string,
): Promise<BaseApiResponse<ISupportChatMessage>> {
  return await fetchApi<ISupportChatMessage>('/api/clinic/support-chat/messages', {
    method: 'POST',
    tenantSlug,
    body: JSON.stringify({ message: normalizeMessage(message) }),
  })
}

export async function getPlatformSupportThreadsAction(): Promise<BaseApiResponse<ISupportChatThread[]>> {
  return await fetchApi<ISupportChatThread[]>('/api/platform/support-chat/threads', {
    method: 'GET',
    cache: 'no-store',
  })
}

export async function getPlatformSupportMessagesAction(
  tenantId: string,
): Promise<BaseApiResponse<ISupportChatMessage[]>> {
  return await fetchApi<ISupportChatMessage[]>(`/api/platform/support-chat/threads/${tenantId}/messages`, {
    method: 'GET',
    cache: 'no-store',
  })
}

export async function sendPlatformSupportMessageAction(
  tenantId: string,
  message: string,
): Promise<BaseApiResponse<ISupportChatMessage>> {
  return await fetchApi<ISupportChatMessage>(`/api/platform/support-chat/threads/${tenantId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ message: normalizeMessage(message) }),
  })
}
