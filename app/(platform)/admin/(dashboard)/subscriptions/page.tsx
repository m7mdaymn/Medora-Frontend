import { getSubscriptions } from '@/actions/platform/subscriptions'
import { getTenants } from '@/actions/platform/get-tenants'
import { PlatformKpiCard } from '@/components/admin/platform-kpi-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  formatCurrencyEGP,
  getDaysUntil,
  getSubscriptionStatusClass,
  getSubscriptionStatusLabel,
  summarizePlatform,
} from '@/lib/platform-admin-metrics'
import { ArrowLeft, CalendarClock, CreditCard, Wallet } from 'lucide-react'
import Link from 'next/link'

const formatDate = (value: string): string =>
  new Date(value).toLocaleDateString('ar-EG', {
    dateStyle: 'medium',
  })

export default async function SubscriptionsPage() {
  const [subscriptionsResponse, tenantsResponse] = await Promise.all([getSubscriptions(), getTenants()])

  const subscriptions = subscriptionsResponse.data?.items || []
  const tenants = tenantsResponse.data?.items || []
  const summary = summarizePlatform(tenants, subscriptions)
  const tenantNameMap = new Map(tenants.map((tenant) => [tenant.id, tenant.name]))

  return (
    <div className='space-y-6'>
      <section className='flex flex-col gap-4 rounded-2xl border bg-card p-6 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h1 className='text-2xl font-bold'>الاشتراكات والمدفوعات</h1>
          <p className='mt-1 text-sm text-muted-foreground'>
            متابعة وضع الاشتراكات، المدفوعات، والانتهاء المتوقع لكل منشأة.
          </p>
        </div>
        <div className='flex flex-wrap gap-2'>
          <Button asChild variant='outline'>
            <Link href='/admin/renewal-center'>
              مركز التجديدات
              <ArrowLeft className='mr-2 h-4 w-4' />
            </Link>
          </Button>
          <Button asChild variant='outline'>
            <Link href='/admin/billing'>
              مركز الفواتير
              <ArrowLeft className='mr-2 h-4 w-4' />
            </Link>
          </Button>
        </div>
      </section>

      <section className='grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4'>
        <PlatformKpiCard
          title='اشتراكات نشطة'
          value={summary.subscriptions.active}
          icon={CreditCard}
          accentClassName='bg-emerald-500/40'
        />
        <PlatformKpiCard
          title='اشتراكات معلقة'
          value={summary.subscriptions.pending}
          icon={CalendarClock}
          accentClassName='bg-amber-500/40'
        />
        <PlatformKpiCard
          title='مدفوعات متأخرة'
          value={summary.subscriptions.overduePayments}
          icon={Wallet}
          accentClassName='bg-rose-500/40'
        />
        <PlatformKpiCard
          title='إجمالي المحصل'
          value={formatCurrencyEGP(summary.revenue.paid)}
          hint={`معدل التحصيل ${summary.revenue.collectionRate}%`}
          icon={CreditCard}
          accentClassName='bg-blue-500/40'
        />
      </section>

      <Card>
        <CardHeader>
          <CardTitle>تفاصيل الاشتراكات</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>المنشأة</TableHead>
                <TableHead>الخطة</TableHead>
                <TableHead>القيمة</TableHead>
                <TableHead>ينتهي في</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>الدفع</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscriptions.length > 0 ? (
                subscriptions.map((subscription) => {
                  const daysLeft = getDaysUntil(subscription.endDate)

                  return (
                    <TableRow key={subscription.id}>
                      <TableCell className='font-medium'>
                        {tenantNameMap.get(subscription.tenantId) || 'منشأة غير معروفة'}
                      </TableCell>
                      <TableCell>{subscription.planName}</TableCell>
                      <TableCell>{formatCurrencyEGP(subscription.amount)}</TableCell>
                      <TableCell>
                        <div className='space-y-0.5'>
                          <p>{formatDate(subscription.endDate)}</p>
                          <p className='text-xs text-muted-foreground'>
                            {Number.isFinite(daysLeft) ? `${daysLeft} يوم` : '—'}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getSubscriptionStatusClass(subscription.status)}>
                          {getSubscriptionStatusLabel(subscription.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {subscription.isPaid ? (
                          <Badge className='bg-emerald-500/15 text-emerald-700 border-emerald-200'>
                            مسدد
                          </Badge>
                        ) : (
                          <Badge variant='destructive'>غير مسدد</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className='h-24 text-center text-muted-foreground'>
                    لا توجد اشتراكات لعرضها حالياً.
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
