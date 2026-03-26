import { DashboardHeader, DashboardShell } from '@/components/shell'
import { DataTable } from '@/components/ui/data-table'
import { getAllStaffAction } from '../../../../../actions/staff/get-staff'
import { AddStaffDialog } from './add-staff-dialog'
import { columns } from './columns'

interface Props {
  params: Promise<{ tenantSlug: string }>
}

export default async function StaffPage({ params }: Props) {
  const { tenantSlug } = await params

  const staffList = await getAllStaffAction(tenantSlug)

  return (
    <DashboardShell>
      <DashboardHeader
        heading='فريق العمل'
        text={`إدارة حسابات الموظفين`}
      >
        <AddStaffDialog tenantSlug={tenantSlug} />
      </DashboardHeader>

      <DataTable data={staffList} columns={columns} searchKey='name' filterColumn='role' />
    </DashboardShell>
  )
}
