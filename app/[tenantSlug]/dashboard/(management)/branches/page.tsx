import { getToken } from '@/actions/auth/getToken'
import { getBranchesAction } from '@/actions/branch/branches'
import { DashboardHeader, DashboardShell } from '@/components/shell'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertTriangle } from 'lucide-react'
import { redirect } from 'next/navigation'
import { BranchesManager } from './branches-manager'

interface Props {
  params: Promise<{ tenantSlug: string }>
}

export default async function BranchesPage({ params }: Props) {
  const { tenantSlug } = await params

  const token = await getToken()
  if (!token) {
    redirect(`/${tenantSlug}/login`)
  }

  let role: string | null = null
  try {
    const payloadBase64 = token.split('.')[1]
    const payload = JSON.parse(Buffer.from(payloadBase64, 'base64').toString('utf-8'))
    role =
      payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || payload.role || null
  } catch {
    redirect(`/${tenantSlug}/dashboard`)
  }

  if (role !== 'ClinicOwner' && role !== 'SuperAdmin') {
    redirect(`/${tenantSlug}/dashboard`)
  }

  const response = await getBranchesAction(tenantSlug, true)
  const hasLoadError = !response?.success
  const errorMessage = response?.message || 'يرجى المحاولة مرة أخرى.'
  const initialBranches = response?.data || []

  return (
    <DashboardShell>
      <DashboardHeader
        heading='إدارة الفروع'
        text='إضافة الفروع وتعديلها والتحكم في تفعيلها وربط الموظفين بها.'
      />

      {hasLoadError ? (
        <Alert variant='destructive'>
          <AlertTriangle className='h-4 w-4' />
          <AlertTitle>تعذر تحميل بيانات الفروع</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      ) : null}

      <BranchesManager tenantSlug={tenantSlug} initialBranches={initialBranches} />
    </DashboardShell>
  )
}
