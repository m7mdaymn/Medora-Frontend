import { cookies } from 'next/headers'
import { decodeJwt } from 'jose'
import { UserRole } from '../types/api'

export async function getUserRole(): Promise<UserRole | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value

  if (!token) return null

  try {
    const payload = decodeJwt(token)
    return (
      (payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] as UserRole) || null
    )
  } catch {
    return null
  }
}
