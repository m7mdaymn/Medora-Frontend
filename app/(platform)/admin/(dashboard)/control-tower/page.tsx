import { getHealthAction } from '@/actions/platform/health'
import { getTenants } from '@/actions/platform/get-tenants'
import { getSubscriptions } from '@/actions/platform/subscriptions'
import { PlatformKpiCard } from '@/components/admin/platform-kpi-card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  buildTenantNameMap,
  formatCurrencyEGP,
  getTenantStatusClass,
  getTenantStatusLabel,
  summarizePlatform,
} from '@/lib/platform-admin-metrics'
import { Activity, ArrowLeft, Building2, CreditCard, Siren, TriangleAlert } from 'lucide-react'
import Link from 'next/link'

const toHealthString = (source: Record<string, unknown>, ...keys: string[]): string => {
  for (const key of keys) {
    if (typeof source[key] === 'string') {
      return source[key] as string
    }
  }

  return 'Unknown'
}

export default async function ControlTowerPage() {
  const [tenantsResponse, subscriptionsResponse, healthResponse] = await Promise.all([
    getTenants(),
    getSubscriptions(),
    getHealthAction(),
  ])

  const tenants = tenantsResponse.data?.items || []
  const subscriptions = subscriptionsResponse.data?.items || []
  const summary = summarizePlatform(tenants, subscriptions)
  const tenantMap = buildTenantNameMap(tenants)

  const healthPayload = (healthResponse.data || {}) as Record<string, unknown>
  const apiStatus = toHealthString(healthPayload, 'status', 'Status')
  const dbStatus = toHealthString(healthPayload, 'database', 'Database')

  const blockedTenants = tenants.filter((tenant) => tenant.status === 'Blocked')
  const suspendedTenants = tenants.filter((tenant) => tenant.status === 'Suspended')
  const overdueSubscriptions = subscriptions.filter((subscription) => !subscription.isPaid)

  const hasCriticalAlerts =
    blockedTenants.length > 0 || suspendedTenants.length > 0 || overdueSubscriptions.length > 0

  return (
    <div className='space-y-6'>
      <section className='rounded-2xl border bg-gradient-to-l from-primary/5 via-background to-background p-6'>
        <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
          <div>
            <h1 className='text-2xl font-bold'>مركز القيادة المباشر</h1>
            <p className='mt-1 text-sm text-muted-foreground'>
              مراقبة الإنذارات التشغيلية والتجارية على مستوى المنصة بالكامل.
            </p>
          </div>

          <div className='flex flex-wrap gap-2'>
            <Button asChild variant='outline'>
              <Link href='/admin'>
                العودة للوحة الرئيسية
                <ArrowLeft className='mr-2 h-4 w-4' />
              </Link>
            </Button>
            <Button asChild>
              <Link href='/admin/tenant-status'>
                مراجعة حالات العيادات
                <ArrowLeft className='mr-2 h-4 w-4' />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {hasCriticalAlerts ? (
        <Alert variant='destructive'>
          <TriangleAlert className='h-4 w-4' />
          <AlertTitle>تنبيهات حرجة</AlertTitle>
          <AlertDescription>
            يوجد {blockedTenants.length} عيادة محظورة، {suspendedTenants.length} عيادة موقوفة، و
            {overdueSubscriptions.length} اشتراك غير مسدد.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert>
          <Siren className='h-4 w-4' />
          <AlertTitle>الحالة مستقرة</AlertTitle>
          <AlertDescription>لا توجد إنذارات حرجة حالياً على مستوى المنصة.</AlertDescription>
        </Alert>
      )}

      <section className='grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4'>
        <PlatformKpiCard
          title='العيادات النشطة'
          value={`${summary.tenants.active}/${summary.tenants.total}`}
          hint='عيادات متاحة فعلياً للتشغيل'
          icon={Building2}
          accentClassName='bg-emerald-500/40'
        />
        <PlatformKpiCard
          title='الاشتراكات النشطة'
          value={`${summary.subscriptions.active}/${summary.subscriptions.total}`}
          hint='اشتراكات قيد الخدمة'
          icon={CreditCard}
          accentClassName='bg-blue-500/40'
        />
        <PlatformKpiCard
          title='التحصيل الكلي'
          value={formatCurrencyEGP(summary.revenue.paid)}
          hint={`المستحقات: ${formatCurrencyEGP(summary.revenue.unpaid)}`}
          icon={CreditCard}
          accentClassName='bg-amber-500/40'
        />
        <PlatformKpiCard
          title='صحة المنصة'
          value={apiStatus}
          hint={`قاعدة البيانات: ${dbStatus}`}
          icon={Activity}
          accentClassName='bg-violet-500/40'
        />
      </section>

      <section className='grid grid-cols-1 gap-4 xl:grid-cols-2'>
        <Card>
          <CardHeader>
            <CardTitle>عيادات تحتاج تدخل</CardTitle>
          </CardHeader>
          <CardContent className='space-y-2'>
            {[...blockedTenants, ...suspendedTenants].slice(0, 8).map((tenant) => (
              <div key={tenant.id} className='flex items-center justify-between rounded-lg border p-3'>
                <div>
                  <p className='font-medium'>{tenant.name}</p>
                  <p className='text-xs text-muted-foreground'>{tenant.slug}</p>
                </div>
                <Badge className={getTenantStatusClass(tenant.status)}>
                  {getTenantStatusLabel(tenant.status)}
                </Badge>
              </div>
            ))}
            {blockedTenants.length === 0 && suspendedTenants.length === 0 ? (
              <p className='text-sm text-muted-foreground'>لا توجد عيادات موقوفة أو محظورة حالياً.</p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>مدفوعات تحتاج متابعة</CardTitle>
          </CardHeader>
          <CardContent className='space-y-2'>
            {overdueSubscriptions.slice(0, 8).map((subscription) => (
              <div key={subscription.id} className='flex items-center justify-between rounded-lg border p-3'>
                <div>
                  <p className='font-medium'>
                    {tenantMap.get(subscription.tenantId) || 'عيادة غير معروفة'}
                  </p>
                  <p className='text-xs text-muted-foreground'>{subscription.planName}</p>
                </div>
                <div className='text-left'>
                  <p className='font-semibold'>{formatCurrencyEGP(subscription.amount)}</p>
                  <p className='text-xs text-muted-foreground'>غير مسدد</p>
                </div>
              </div>
            ))}
            {overdueSubscriptions.length === 0 ? (
              <p className='text-sm text-muted-foreground'>لا توجد مدفوعات متأخرة حالياً.</p>
            ) : null}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
