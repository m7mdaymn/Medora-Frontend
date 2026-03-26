import { columns } from './columns'
// تأكد من مسار الـ DataTable اللي إنت لسه عامله
import { DataTable } from '@/components/ui/data-table'
import { Building2 } from 'lucide-react'
import { getTenants } from '../../../../../actions/platform/get-tenants'
import { CreateTenantModal } from './create-tenant-modal'

export default async function TenantsPage() {
  // 1. سحب الداتا من السيرفر قبل ما الصفحة تترندر أصلاً
  const res = await getTenants()

  // 2. تأمين الداتا (Fallbacks) عشان لو الباك إند واقع الجدول ميضربش
  const tenants = res.data?.items || []
  const totalCount = res.data?.totalCount || 0

  return (
    <div className='space-y-6'>
      {/* قسم الهيدر والإحصائيات */}
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-6 rounded-xl border shadow-sm'>
        <div>
          <h1 className='text-2xl font-bold flex items-center gap-2 text-primary'>
            <Building2 className='w-6 h-6' />
            إدارة العيادات (Tenants)
          </h1>
          <p className='text-muted-foreground mt-1'>
            إجمالي العيادات المسجلة على المنصة: {totalCount}
          </p>
        </div>

        {/* المودال اللي عملناه هيركب هنا كزرار */}
        <CreateTenantModal />
      </div>

      {/* قسم الجدول */}
        <DataTable
          columns={columns}
          data={tenants}
          searchKey='name' // ده الحقل اللي الدالة safeGetColumn هتدور فيه
        />
    </div>
  )
}
