import { getDailyFinance } from '@/actions/finance/get-daily-finance'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle } from 'lucide-react'
import { getFinanceByDoctorAction, getYearlyFinanceAction } from '../../actions/finance/reports'
import { DashboardHeader, DashboardShell } from '../shell'
import { DashboardCharts } from './DashboardCharts'
import { StaleVisitsAlert } from './StaleVisitsAlert'

interface OwnerDashboardProps {
  tenantSlug: string
}

export default async function OwnerDashboard({ tenantSlug }: OwnerDashboardProps) {
  // 1. جلب التاريخ والسنة الحالية ديناميكياً
  const today = new Date()
  const currentYear = today.getFullYear()

  // 2. فورمات التاريخ بالعربي ليكون بشياكة (مثال: الجمعة، 6 مارس 2026)
  const formattedDate = new Intl.DateTimeFormat('ar-EG', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(today)

  // 3. جلب الداتا مع استخدام السنة الحالية بدل الـ Hardcoded
  const [dailyRes, yearlyRes, doctorsRes] = await Promise.all([
    getDailyFinance(tenantSlug),
    getYearlyFinanceAction(tenantSlug, currentYear),
    getFinanceByDoctorAction(tenantSlug),
  ])

  // لو الـ Daily ضربت (وهي الأساسية)، نطلع إيرور
  if (!dailyRes.success || !dailyRes.data) {
    return (
      <DashboardShell>
        <Alert variant='destructive' className='mt-4'>
          <AlertCircle className='h-4 w-4' />
          <AlertTitle>خطأ في جلب البيانات</AlertTitle>
          <AlertDescription>
            {dailyRes.message || 'حدث خطأ أثناء جلب البيانات المالية. يرجى المحاولة لاحقاً.'}
          </AlertDescription>
        </Alert>
      </DashboardShell>
    )
  }

  const { totalRevenue, totalPaid, totalUnpaid, invoiceCount, paymentCount } = dailyRes.data

  const statCards = [
    {
      title: 'إجمالي الدخل اليومي',
      value: `${totalPaid.toLocaleString()} ج.م`,
    },
    {
      title: 'المحصل في الخزنة اليوم',
      value: `${totalRevenue.toLocaleString()} ج.م`,
    },
    {
      title: 'المستحقات غير المدفوعة اليوم',
      value: `${totalUnpaid.toLocaleString()} ج.م`,
    },
    {
      title: 'فواتير العيادة اليوم',
      value: `${invoiceCount} فاتورة`,
      subValue: `${paymentCount} عملية دفع`,
    },
  ]

  return (
    <DashboardShell>
      <DashboardHeader
        heading='الصفحة الرئيسية'
        text={`نظرة عامة على أداء العيادة المالي والتشغيلي ليوم ${formattedDate}`}
      />

      <div className='grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'>
        {statCards.map((stat, index) => {
          return (
            <Card key={index} className='transition-all hover:shadow-md border-border/50'>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium text-muted-foreground'>
                  {stat.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-black text-foreground'>{stat.value}</div>
                {stat.subValue && (
                  <p className='text-xs text-muted-foreground mt-1'>{stat.subValue}</p>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div>
        <StaleVisitsAlert tenantSlug={tenantSlug} />
      </div>

      {yearlyRes.success && yearlyRes.data && doctorsRes.success && doctorsRes.data && (
        <DashboardCharts yearlyData={yearlyRes.data} doctorsData={doctorsRes.data} />
      )}
    </DashboardShell>
  )
}
