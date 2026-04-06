import { fetchApi } from '@/lib/fetchApi' 
import { UserProfile } from '../../types/auth'

export async function getMeAction(tenantSlug: string) {
  return await fetchApi<UserProfile>('/api/Auth/me', {
    tenantSlug, 
    authType: 'staff', 
    cache: 'no-store', 
  })
}


