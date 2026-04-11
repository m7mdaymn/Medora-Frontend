import { getSubscriptions } from '@/actions/platform/subscriptions'
import { getTenants } from '@/actions/platform/get-tenants'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrencyEGP, getDaysUntil, getExpiringSubscriptions } from '@/lib/platform-admin-metrics'
import { ArrowLeft, CalendarClock, ClockAlert } from 'lucide-react'
import Link from 'next/link'

const formatDate = (value: string): string =>
  new Date(value).toLocaleDateString('ar-EG', {
    dateStyle: 'medium',
  })

export default async function RenewalCenterPage() {
  const [subscriptionsResponse, tenantsResponse] = await Promise.all([getSubscriptions(), getTenants()])

  const subscriptions = subscriptionsResponse.data?.items || []
  const tenants = tenantsResponse.data?.items || []
  const tenantNameMap = new Map(tenants.map((tenant) => [tenant.id, tenant.name]))

  const expiringSoon = getExpiringSubscriptions(subscriptions, 30)
  const overdue = subscriptions.filter((subscription) => !subscription.isPaid)

  return (
    <div className='space-y-6'>
      <section className='flex flex-col gap-4 rounded-2xl border bg-card p-6 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h1 className='text-2xl font-bold'>مركز التجديدات</h1>
          <p className='mt-1 text-sm text-muted-foreground'>
            لوحة مركزة للاشتراكات التي تقترب من الانتهاء أو تحتاج متابعة دفع.
          </p>
        </div>

        <div className='flex flex-wrap gap-2'>
          <Button asChild variant='outline'>
            <Link href='/admin/subscriptions'>
              صفحة الاشتراكات
              <ArrowLeft className='mr-2 h-4 w-4' />
            </Link>
          </Button>
          <Button asChild variant='outline'>
            <Link href='/admin/billing'>
              متابعة التحصيل
              <ArrowLeft className='mr-2 h-4 w-4' />
            </Link>
          </Button>
        </div>
      </section>

      <section className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <CalendarClock className='h-5 w-5 text-amber-600' />
              اشتراكات تنتهي خلال 30 يوم
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-2'>
            {expiringSoon.length > 0 ? (
              expiringSoon.map((subscription) => {
                const daysLeft = getDaysUntil(subscription.endDate)

                return (
                  <div key={subscription.id} className='rounded-lg border p-3 flex items-center justify-between gap-3'>
                    <div>
                      <p className='font-medium'>
                        {tenantNameMap.get(subscription.tenantId) || 'منشأة غير معروفة'}
                      </p>
                      <p className='text-xs text-muted-foreground'>
                        {subscription.planName} • ينتهي {formatDate(subscription.endDate)}
                      </p>
                    </div>
                    <Badge variant='outline'>
                      {Number.isFinite(daysLeft) ? `${daysLeft} يوم` : '—'}
                    </Badge>
                  </div>
                )
              })
            ) : (
              <p className='text-sm text-muted-foreground'>لا توجد اشتراكات تنتهي قريباً.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <ClockAlert className='h-5 w-5 text-rose-600' />
              اشتراكات غير مسددة
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-2'>
            {overdue.length > 0 ? (
              overdue.map((subscription) => (
                <div key={subscription.id} className='rounded-lg border p-3 flex items-center justify-between gap-3'>
                  <div>
                    <p className='font-medium'>
                      {tenantNameMap.get(subscription.tenantId) || 'منشأة غير معروفة'}
                    </p>
                    <p className='text-xs text-muted-foreground'>
                      {subscription.planName} • {formatDate(subscription.endDate)}
                    </p>
                  </div>
                  <Badge variant='destructive'>{formatCurrencyEGP(subscription.amount)}</Badge>
                </div>
              ))
            ) : (
              <p className='text-sm text-muted-foreground'>لا توجد اشتراكات غير مسددة حالياً.</p>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
