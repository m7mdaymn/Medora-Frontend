import { getTenants } from '@/actions/platform/get-tenants'
import { PlatformKpiCard } from '@/components/admin/platform-kpi-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  getTenantStatusClass,
  getTenantStatusLabel,
  summarizePlatform,
} from '@/lib/platform-admin-metrics'
import { ArrowLeft, Ban, Building2, PauseCircle, ShieldCheck } from 'lucide-react'
import Link from 'next/link'

const formatDate = (value: string): string =>
  new Date(value).toLocaleDateString('ar-EG', {
    dateStyle: 'medium',
  })

export default async function TenantStatusPage() {
  const response = await getTenants()
  const tenants = response.data?.items || []
  const summary = summarizePlatform(tenants, [])

  return (
    <div className='space-y-6'>
      <section className='flex flex-col gap-4 rounded-2xl border bg-card p-6 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h1 className='text-2xl font-bold'>حالة العيادات</h1>
          <p className='mt-1 text-sm text-muted-foreground'>
            متابعة تفعيل، إيقاف، وحظر العيادات على مستوى المنصة.
          </p>
        </div>
        <Button asChild variant='outline'>
          <Link href='/admin/tenants'>
            فتح إدارة العيادات
            <ArrowLeft className='mr-2 h-4 w-4' />
          </Link>
        </Button>
      </section>

      <section className='grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4'>
        <PlatformKpiCard
          title='إجمالي العيادات'
          value={summary.tenants.total}
          icon={Building2}
          accentClassName='bg-blue-500/40'
        />
        <PlatformKpiCard
          title='عيادات نشطة'
          value={summary.tenants.active}
          icon={ShieldCheck}
          accentClassName='bg-emerald-500/40'
        />
        <PlatformKpiCard
          title='عيادات موقوفة'
          value={summary.tenants.suspended}
          icon={PauseCircle}
          accentClassName='bg-amber-500/40'
        />
        <PlatformKpiCard
          title='عيادات محظورة'
          value={summary.tenants.blocked}
          icon={Ban}
          accentClassName='bg-rose-500/40'
        />
      </section>

      <Card>
        <CardHeader>
          <CardTitle>قائمة الحالة الحالية</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>العيادة</TableHead>
                <TableHead>المعرف</TableHead>
                <TableHead>هاتف التواصل</TableHead>
                <TableHead>تاريخ الإنشاء</TableHead>
                <TableHead>الحالة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenants.length > 0 ? (
                tenants.map((tenant) => (
                  <TableRow key={tenant.id}>
                    <TableCell className='font-medium'>{tenant.name}</TableCell>
                    <TableCell className='font-mono text-xs'>{tenant.slug}</TableCell>
                    <TableCell>{tenant.contactPhone || '—'}</TableCell>
                    <TableCell>{formatDate(tenant.createdAt)}</TableCell>
                    <TableCell>
                      <Badge className={getTenantStatusClass(tenant.status)}>
                        {getTenantStatusLabel(tenant.status)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className='h-24 text-center text-muted-foreground'>
                    لا توجد عيادات لعرضها حالياً.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
