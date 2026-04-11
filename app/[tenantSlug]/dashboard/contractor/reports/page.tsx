import { getPartnerOrdersKpiAction, listPartnerOrdersAction } from '@/actions/partner/workflow'
import { DashboardHeader, DashboardShell } from '@/components/shell'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  Clock3,
  HandCoins,
  ListChecks,
  Stethoscope,
} from 'lucide-react'
import Link from 'next/link'

const currencyFormatter = new Intl.NumberFormat('ar-EG', {
  style: 'currency',
  currency: 'EGP',
  maximumFractionDigits: 2,
})

function formatCurrency(value: number): string {
  return currencyFormatter.format(value || 0)
}

function partnerTypeLabel(partnerType: string): string {
  switch (partnerType) {
    case 'Laboratory':
      return 'معامل'
    case 'Radiology':
      return 'أشعة'
    case 'Pharmacy':
      return 'صيدليات'
    default:
      return partnerType || 'غير محدد'
  }
}

function statusLabel(status: string): string {
  switch (status) {
    case 'Sent':
      return 'مرسل'
    case 'Accepted':
      return 'مقبول'
    case 'InProgress':
      return 'جاري التنفيذ'
    case 'Completed':
      return 'مكتمل'
    case 'Cancelled':
      return 'ملغي'
    default:
      return status
  }
}

export default async function ContractorReportsPage({
  params,
}: {
  params: Promise<{ tenantSlug: string }>
}) {
  const { tenantSlug } = await params

  const [kpiResponse, ordersResponse] = await Promise.all([
    getPartnerOrdersKpiAction(tenantSlug),
    listPartnerOrdersAction(tenantSlug, { pageNumber: 1, pageSize: 5 }),
  ])

  const kpi = kpiResponse.data
  const recentOrders = ordersResponse.data?.items || []

  return (
    <DashboardShell>
      <DashboardHeader
        heading='تقارير الأداء'
        text='مؤشرات التشغيل والتحصيل لطلبات الشريك مع تفصيل حسب نوع الخدمة.'
      />

      {!kpiResponse.success || !kpi ? (
        <Alert variant='destructive'>
          <AlertTitle>تعذر تحميل مؤشرات الأداء</AlertTitle>
          <AlertDescription>{kpiResponse.message || 'يرجى المحاولة مرة أخرى.'}</AlertDescription>
        </Alert>
      ) : (
        <div className='space-y-6'>
          <section className='grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4'>
            <Card className='border-border/60'>
              <CardHeader className='pb-2'>
                <CardTitle className='text-sm text-muted-foreground flex items-center justify-between'>
                  إجمالي الطلبات
                  <ListChecks className='h-4 w-4 text-primary' />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className='text-2xl font-black'>{kpi.totalOrders}</p>
              </CardContent>
            </Card>

            <Card className='border-border/60'>
              <CardHeader className='pb-2'>
                <CardTitle className='text-sm text-muted-foreground flex items-center justify-between'>
                  الطلبات المكتملة
                  <CheckCircle2 className='h-4 w-4 text-emerald-600' />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className='text-2xl font-black'>{kpi.completedOrders}</p>
                <p className='text-xs text-muted-foreground'>نسبة الإنجاز {kpi.completionRate}%</p>
              </CardContent>
            </Card>

            <Card className='border-border/60'>
              <CardHeader className='pb-2'>
                <CardTitle className='text-sm text-muted-foreground flex items-center justify-between'>
                  إجمالي التسويات
                  <HandCoins className='h-4 w-4 text-amber-600' />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className='text-2xl font-black'>{formatCurrency(kpi.totalSettledAmount)}</p>
                <p className='text-xs text-muted-foreground'>إيراد العيادة {formatCurrency(kpi.totalClinicRevenue)}</p>
              </CardContent>
            </Card>

            <Card className='border-border/60'>
              <CardHeader className='pb-2'>
                <CardTitle className='text-sm text-muted-foreground flex items-center justify-between'>
                  متوسط زمن الإكمال
                  <Clock3 className='h-4 w-4 text-primary' />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className='text-2xl font-black'>
                  {kpi.averageCompletionHours == null ? '—' : `${kpi.averageCompletionHours} س`}
                </p>
                <p className='text-xs text-muted-foreground'>من إنشاء الطلب حتى رفع النتيجة</p>
              </CardContent>
            </Card>
          </section>

          <section className='grid gap-4 xl:grid-cols-2'>
            <Card className='border-border/60'>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <BarChart3 className='h-5 w-5 text-primary' />
                  الأداء حسب نوع الشريك
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-3'>
                {kpi.byPartnerType.length > 0 ? (
                  kpi.byPartnerType.map((item) => (
                    <div key={item.partnerType} className='rounded-xl border p-3 space-y-2'>
                      <div className='flex items-center justify-between gap-2'>
                        <p className='font-semibold'>{partnerTypeLabel(item.partnerType)}</p>
                        <Badge variant='outline'>{item.totalOrders} طلب</Badge>
                      </div>

                      <div className='text-xs text-muted-foreground grid gap-1'>
                        <p>مكتمل: {item.completedOrders} ({item.completionRate}%)</p>
                        <p>إجمالي التسوية: {formatCurrency(item.totalSettledAmount)}</p>
                        <p>إيراد العيادة: {formatCurrency(item.clinicRevenueAmount)}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className='text-sm text-muted-foreground'>لا توجد بيانات تفصيلية حسب النوع حالياً.</p>
                )}
              </CardContent>
            </Card>

            <Card className='border-border/60'>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Stethoscope className='h-5 w-5 text-primary' />
                  آخر الطلبات
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-3'>
                {recentOrders.length > 0 ? (
                  recentOrders.map((order) => (
                    <div key={order.id} className='rounded-xl border p-3'>
                      <div className='flex items-center justify-between gap-2'>
                        <p className='font-medium'>{order.serviceNameSnapshot || 'خدمة خارجية'}</p>
                        <Badge variant='secondary'>{statusLabel(order.status)}</Badge>
                      </div>
                      <p className='text-xs text-muted-foreground mt-1'>
                        {order.patientName} • {new Date(order.orderedAt).toLocaleString('ar-EG')}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className='text-sm text-muted-foreground'>لا توجد طلبات حديثة لعرضها.</p>
                )}

                <Separator />

                <div className='flex flex-wrap gap-2'>
                  <Button asChild variant='outline'>
                    <Link href={`/${tenantSlug}/dashboard/contractor/orders`}>
                      الانتقال إلى الطلبات
                      <ArrowLeft className='mr-2 h-4 w-4' />
                    </Link>
                  </Button>
                  <Button asChild variant='outline'>
                    <Link href={`/${tenantSlug}/dashboard/contractor/support`}>مركز الدعم</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      )}
    </DashboardShell>
  )
}
