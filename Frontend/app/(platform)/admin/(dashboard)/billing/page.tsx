import { getSubscriptions } from '@/actions/platform/subscriptions'
import { getTenants } from '@/actions/platform/get-tenants'
import { PlatformKpiCard } from '@/components/admin/platform-kpi-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrencyEGP, summarizePlatform } from '@/lib/platform-admin-metrics'
import { ArrowLeft, CreditCard, Landmark, Wallet } from 'lucide-react'
import Link from 'next/link'

type TenantBillingSummary = {
  tenantId: string
  tenantName: string
  total: number
  paid: number
  unpaid: number
  unpaidCount: number
}

export default async function BillingPage() {
  const [subscriptionsResponse, tenantsResponse] = await Promise.all([getSubscriptions(), getTenants()])

  const subscriptions = subscriptionsResponse.data?.items || []
  const tenants = tenantsResponse.data?.items || []
  const summary = summarizePlatform(tenants, subscriptions)

  const byTenant = new Map<string, TenantBillingSummary>()

  for (const tenant of tenants) {
    byTenant.set(tenant.id, {
      tenantId: tenant.id,
      tenantName: tenant.name,
      total: 0,
      paid: 0,
      unpaid: 0,
      unpaidCount: 0,
    })
  }

  for (const subscription of subscriptions) {
    const current = byTenant.get(subscription.tenantId)
    if (!current) continue

    current.total += subscription.amount
    if (subscription.isPaid) {
      current.paid += subscription.amount
    } else {
      current.unpaid += subscription.amount
      current.unpaidCount += 1
    }
  }

  const tenantRows = Array.from(byTenant.values()).sort((a, b) => b.unpaid - a.unpaid)

  return (
    <div className='space-y-6'>
      <section className='flex flex-col gap-4 rounded-2xl border bg-card p-6 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h1 className='text-2xl font-bold'>مركز الفواتير والتحصيل</h1>
          <p className='mt-1 text-sm text-muted-foreground'>
            نظرة موحدة على المبالغ المحصلة والمستحقات المتبقية لكل منشأة.
          </p>
        </div>

        <div className='flex flex-wrap gap-2'>
          <Button asChild variant='outline'>
            <Link href='/admin/subscriptions'>
              إدارة الاشتراكات
              <ArrowLeft className='mr-2 h-4 w-4' />
            </Link>
          </Button>
          <Button asChild variant='outline'>
            <Link href='/admin/renewal-center'>
              مركز التجديدات
              <ArrowLeft className='mr-2 h-4 w-4' />
            </Link>
          </Button>
        </div>
      </section>

      <section className='grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4'>
        <PlatformKpiCard
          title='إجمالي الفواتير'
          value={formatCurrencyEGP(summary.revenue.total)}
          icon={CreditCard}
          accentClassName='bg-blue-500/40'
        />
        <PlatformKpiCard
          title='المحصل'
          value={formatCurrencyEGP(summary.revenue.paid)}
          icon={Landmark}
          accentClassName='bg-emerald-500/40'
        />
        <PlatformKpiCard
          title='المستحق'
          value={formatCurrencyEGP(summary.revenue.unpaid)}
          icon={Wallet}
          accentClassName='bg-rose-500/40'
        />
        <PlatformKpiCard
          title='معدل التحصيل'
          value={`${summary.revenue.collectionRate}%`}
          hint='حسب الاشتراكات المسجلة'
          icon={CreditCard}
          accentClassName='bg-amber-500/40'
        />
      </section>

      <Card>
        <CardHeader>
          <CardTitle>توزيع التحصيل حسب المنشآت</CardTitle>
        </CardHeader>
        <CardContent className='space-y-2'>
          {tenantRows.length > 0 ? (
            tenantRows.map((row) => (
              <div key={row.tenantId} className='rounded-lg border p-3 flex items-center justify-between gap-3'>
                <div>
                  <p className='font-medium'>{row.tenantName}</p>
                  <p className='text-xs text-muted-foreground'>
                    إجمالي: {formatCurrencyEGP(row.total)} • محصل: {formatCurrencyEGP(row.paid)}
                  </p>
                </div>

                {row.unpaid > 0 ? (
                  <Badge variant='destructive'>
                    مستحق {formatCurrencyEGP(row.unpaid)} ({row.unpaidCount})
                  </Badge>
                ) : (
                  <Badge className='bg-emerald-500/15 text-emerald-700 border-emerald-200'>
                    لا يوجد مستحقات
                  </Badge>
                )}
              </div>
            ))
          ) : (
            <p className='text-sm text-muted-foreground'>لا توجد بيانات تحصيل لعرضها حالياً.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
