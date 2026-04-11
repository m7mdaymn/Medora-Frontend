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
  const activeCount = tenants.filter((tenant) => tenant.status === 'Active').length
  const suspendedCount = tenants.filter((tenant) => tenant.status === 'Suspended').length
  const blockedCount = tenants.filter((tenant) => tenant.status === 'Blocked').length
  const clinicCount = tenants.filter((tenant) => tenant.tenantType === 'Clinic').length
  const partnerCount = tenants.filter((tenant) => tenant.tenantType === 'Partner').length

  return (
    <div className='space-y-6'>
      {/* قسم الهيدر والإحصائيات */}
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-6 rounded-xl border shadow-sm'>
        <div>
          <h1 className='text-2xl font-bold flex items-center gap-2 text-primary'>
            <Building2 className='w-6 h-6' />
            إدارة الكيانات (Tenants)
          </h1>
          <p className='text-muted-foreground mt-1'>
            إجمالي الكيانات المسجلة على المنصة: {totalCount}
          </p>
        </div>

        {/* المودال اللي عملناه هيركب هنا كزرار */}
        <CreateTenantModal />
      </div>

      <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-5'>
        <div className='rounded-xl border bg-card px-4 py-3'>
          <p className='text-xs text-muted-foreground'>نشط</p>
          <p className='text-xl font-black text-emerald-600'>{activeCount}</p>
        </div>
        <div className='rounded-xl border bg-card px-4 py-3'>
          <p className='text-xs text-muted-foreground'>موقوف</p>
          <p className='text-xl font-black text-amber-600'>{suspendedCount}</p>
        </div>
        <div className='rounded-xl border bg-card px-4 py-3'>
          <p className='text-xs text-muted-foreground'>محظور</p>
          <p className='text-xl font-black text-rose-600'>{blockedCount}</p>
        </div>
        <div className='rounded-xl border bg-card px-4 py-3'>
          <p className='text-xs text-muted-foreground'>عيادات</p>
          <p className='text-xl font-black'>{clinicCount}</p>
        </div>
        <div className='rounded-xl border bg-card px-4 py-3'>
          <p className='text-xs text-muted-foreground'>شركاء</p>
          <p className='text-xl font-black'>{partnerCount}</p>
        </div>
      </div>

      {/* قسم الجدول */}
      <DataTable
        columns={columns}
        data={tenants}
        searchKey='name'
        filterColumn='tenantType'
        filterOptions={[
          { value: 'Clinic', label: 'عيادة' },
          { value: 'Partner', label: 'شريك' },
        ]}
        filterPlaceholder='تصفية بنوع الكيان'
        filterAllLabel='كل الأنواع'
      />
    </div>
  )
}
