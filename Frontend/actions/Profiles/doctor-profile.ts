import { fetchApi } from '../../lib/fetchApi'
import { IDoctor } from '../../types/doctor'

export async function getDoctorMeAction(tenantSlug: string) {
  return await fetchApi<IDoctor>('/api/clinic/doctors/me', {
    tenantSlug,
    authType: 'staff',
    cache: 'no-store',
  })
}
