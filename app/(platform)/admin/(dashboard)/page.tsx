import { getHealthAction } from '@/actions/platform/health'
import { getTenants } from '@/actions/platform/get-tenants'
import { getSubscriptions } from '@/actions/platform/subscriptions'
import { PlatformKpiCard } from '@/components/admin/platform-kpi-card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrencyEGP, summarizePlatform } from '@/lib/platform-admin-metrics'
import {
  Activity,
  ArrowLeft,
  Building2,
  CreditCard,
  DollarSign,
  ShieldCheck,
} from 'lucide-react'
import Link from 'next/link'

const toHealthString = (source: Record<string, unknown>, ...keys: string[]): string => {
  for (const key of keys) {
    if (typeof source[key] === 'string') {
      return source[key] as string
    }
  }

  return 'Unknown'
}

export default async function AdminPage() {
  const [tenantsResponse, subscriptionsResponse, healthResponse] = await Promise.all([
    getTenants(),
    getSubscriptions(),
    getHealthAction(),
  ])

  const tenants = tenantsResponse.data?.items || []
  const subscriptions = subscriptionsResponse.data?.items || []
  const summary = summarizePlatform(tenants, subscriptions)

  const healthPayload = (healthResponse.data || {}) as Record<string, unknown>
  const apiStatus = toHealthString(healthPayload, 'status', 'Status')
  const dbStatus = toHealthString(healthPayload, 'database', 'Database')

  return (
    <div className='space-y-6'>
      <section className='rounded-2xl border bg-gradient-to-l from-primary/5 via-background to-background p-6'>
        <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
          <div>
            <h1 className='text-2xl font-bold'>لوحة التحكم المركزية للمنصة</h1>
            <p className='mt-1 text-sm text-muted-foreground'>
              متابعة حالة العيادات، الاشتراكات، والتحصيل المالي من مكان واحد.
            </p>
          </div>
          <div className='flex flex-wrap gap-2'>
            <Button asChild variant='outline'>
              <Link href='/admin/control-tower'>
                مركز القيادة
                <ArrowLeft className='mr-2 h-4 w-4' />
              </Link>
            </Button>
            <Button asChild>
              <Link href='/admin/tenants'>
                إدارة العيادات
                <ArrowLeft className='mr-2 h-4 w-4' />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {!tenantsResponse.success || !subscriptionsResponse.success ? (
        <Alert variant='destructive'>
          <AlertTitle>تنبيه بيانات</AlertTitle>
          <AlertDescription>
            بعض البيانات لم تُحمّل بالكامل. راجع صفحة صحة النظام للتأكد من سلامة الخدمات.
          </AlertDescription>
        </Alert>
      ) : null}

      <section className='grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4'>
        <PlatformKpiCard
          title='إجمالي العيادات'
          value={summary.tenants.total}
          hint={`${summary.tenants.active} عيادة نشطة`}
          icon={Building2}
          accentClassName='bg-emerald-500/40'
        />
        <PlatformKpiCard
          title='إجمالي الاشتراكات'
          value={summary.subscriptions.total}
          hint={`${summary.subscriptions.active} اشتراك نشط`}
          icon={CreditCard}
          accentClassName='bg-blue-500/40'
        />
        <PlatformKpiCard
          title='إجمالي التعاقدات'
          value={formatCurrencyEGP(summary.revenue.total)}
          hint={`نسبة التحصيل ${summary.revenue.collectionRate}%`}
          icon={DollarSign}
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

      <section className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <ShieldCheck className='h-5 w-5 text-primary' />
              إجراءات سريعة
            </CardTitle>
          </CardHeader>
          <CardContent className='grid gap-3 sm:grid-cols-2'>
            <Button asChild variant='outline' className='justify-between'>
              <Link href='/admin/tenant-status'>مراقبة حالات العيادات</Link>
            </Button>
            <Button asChild variant='outline' className='justify-between'>
              <Link href='/admin/renewal-center'>مركز التجديدات</Link>
            </Button>
            <Button asChild variant='outline' className='justify-between'>
              <Link href='/admin/billing'>مركز الفواتير والتحصيل</Link>
            </Button>
            <Button asChild variant='outline' className='justify-between'>
              <Link href='/admin/health'>صحة النظام</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>نقاط تحتاج متابعة</CardTitle>
          </CardHeader>
          <CardContent className='space-y-3 text-sm'>
            <div className='rounded-lg border bg-muted/30 p-3'>
              <p className='font-medium'>اشتراكات غير مسددة</p>
              <p className='text-muted-foreground'>
                {summary.subscriptions.overduePayments} اشتراك يحتاج متابعة مالية.
              </p>
            </div>
            <div className='rounded-lg border bg-muted/30 p-3'>
              <p className='font-medium'>اشتراكات قرب الانتهاء</p>
              <p className='text-muted-foreground'>
                {summary.subscriptions.expiringIn14Days} اشتراك ينتهي خلال 14 يومًا.
              </p>
            </div>
            <div className='rounded-lg border bg-muted/30 p-3'>
              <p className='font-medium'>عيادات غير مستقرة</p>
              <p className='text-muted-foreground'>
                {summary.tenants.suspended + summary.tenants.blocked} عيادة بين الإيقاف والحظر.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
