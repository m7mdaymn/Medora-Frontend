import { getClinicOverviewReportAction } from '@/actions/reports/clinic-reports'
import { PeriodFilter } from '@/components/shared/period-filter'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

export async function OverviewTab({
  tenantSlug,
  from,
  to,
}: {
  tenantSlug: string
  from?: string
  to?: string
}) {
  const today = new Date()
  const lastYear = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate())
  const actualFrom = from || lastYear.toISOString().split('T')[0]
  const actualTo = to || today.toISOString().split('T')[0]

  const response = await getClinicOverviewReportAction(tenantSlug, {
    from: actualFrom,
    to: actualTo,
  })
  const report = response?.data

  if (!report) {
    return (
      <div className='flex flex-col items-center justify-center py-20 text-muted-foreground border border-dashed rounded-xl bg-muted/10'>
        <p className='text-sm font-medium'>لا توجد بيانات مالية لهذه الفترة المحددة.</p>
      </div>
    )
  }

  const isProfit = report.netCashflow >= 0

  return (
    <div className='space-y-10 animate-in fade-in duration-500'>
      {/* Header Area */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-4'>
        <div >
          <h3 className='text-lg font-black tracking-tight'>نظرة عامة على الأداء</h3>
        </div>
        <PeriodFilter />
      </div>

      {/* 1. Metric Blocks (Stripe-like Minimalist Grid) */}
      <div className='border rounded-xl bg-card overflow-hidden shadow-sm'>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 divide-y md:divide-y-0 md:divide-x md:divide-x-reverse divide-border/60'>
          {/* Revenue */}
          <div className='p-6 flex flex-col gap-2'>
            <span className='text-[10px] font-bold uppercase tracking-wider text-muted-foreground'>
              إجمالي الفواتير
            </span>
            <div className='flex items-baseline gap-1'>
              <span className='text-2xl font-black font-mono tracking-tight text-foreground'>
                {report.totalInvoiced.toLocaleString()}
              </span>
              <span className='text-xs font-semibold text-muted-foreground'>ج.م</span>
            </div>
            <span className='text-xs text-muted-foreground mt-1'>قبل التحصيل والخصومات</span>
          </div>

          {/* Cash Collected */}
          <div className='p-6 flex flex-col gap-2'>
            <span className='text-[10px] font-bold uppercase tracking-wider text-muted-foreground'>
              المحصل الفعلي
            </span>
            <div className='flex items-baseline gap-1'>
              <span className='text-2xl font-black font-mono tracking-tight text-foreground'>
                {report.totalCollected.toLocaleString()}
              </span>
              <span className='text-xs font-semibold text-muted-foreground'>ج.م</span>
            </div>
            <span className='text-xs text-muted-foreground mt-1'>
              من إجمالي <span className='font-bold text-foreground'>{report.totalVisits}</span> زيارة
            </span>
          </div>

          {/* Expenses */}
          <div className='p-6 flex flex-col gap-2'>
            <span className='text-[10px] font-bold uppercase tracking-wider text-muted-foreground'>
              المصروفات التشغيلية
            </span>
            <div className='flex items-baseline gap-1'>
              <span className='text-2xl font-black font-mono tracking-tight text-foreground'>
                {report.totalExpenses.toLocaleString()}
              </span>
              <span className='text-xs font-semibold text-muted-foreground'>ج.م</span>
            </div>
            <span className='text-xs text-muted-foreground mt-1'>مصروفات الفترة المحددة</span>
          </div>

          {/* Net Profit (Dynamic Color Accent) */}
          <div
            className={cn(
              'p-6 flex flex-col gap-2 relative overflow-hidden',
              isProfit ? 'bg-emerald-500/5' : 'bg-rose-500/5',
            )}
          >
            {/* Accent Line */}
            <div
              className={cn(
                'absolute top-0 bottom-0 right-0 w-1',
                isProfit ? 'bg-emerald-500' : 'bg-rose-500',
              )}
            />

            <span
              className={cn(
                'text-[10px] font-bold uppercase tracking-wider',
                isProfit
                  ? 'text-emerald-700 dark:text-emerald-500'
                  : 'text-rose-700 dark:text-rose-500',
              )}
            >
              صافي الربح
            </span>
            <div className='flex items-baseline gap-1'>
              <span
                className={cn(
                  'text-3xl font-black font-mono tracking-tight',
                  isProfit
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400',
                )}
              >
                {isProfit ? '+' : ''}
                {report.netCashflow.toLocaleString()}
              </span>
              <span
                className={cn(
                  'text-xs font-bold',
                  isProfit ? 'text-emerald-600/70' : 'text-rose-600/70',
                )}
              >
                ج.م
              </span>
            </div>
            <span className='text-xs font-medium text-muted-foreground mt-1'>
              صافي التدفق النقدي بعد المصروفات
            </span>
          </div>
        </div>
      </div>

      <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2'>
        <div className='rounded-lg border p-3 text-xs'>كشف: <b>{report.examVisits}</b></div>
        <div className='rounded-lg border p-3 text-xs'>استشارة: <b>{report.consultationVisits}</b></div>
        <div className='rounded-lg border p-3 text-xs'>حجوزات: <b>{report.bookingVisits}</b></div>
        <div className='rounded-lg border p-3 text-xs'>حضور مباشر: <b>{report.walkInVisits}</b></div>
        <div className='rounded-lg border p-3 text-xs'>خدمة ذاتية: <b>{report.selfServiceVisits}</b></div>
      </div>

      {/* 2. Doctor Performance Table (Clean UI) */}
      <div className='space-y-4'>
        <div className='flex items-center justify-between'>
          <h3 className='text-sm font-bold uppercase tracking-wider text-muted-foreground'>
            أداء الأطباء
          </h3>
        </div>

        <div className='border rounded-xl overflow-hidden shadow-sm'>
          <Table>
            <TableHeader className='bg-muted/30'>
              <TableRow className='hover:bg-transparent border-border/40'>
                <TableHead className='h-10 text-xs font-semibold text-muted-foreground'>
                  اسم الطبيب
                </TableHead>
                <TableHead className='h-10 text-xs font-semibold text-muted-foreground text-center'>
                  الكشوفات
                </TableHead>
                <TableHead className='h-10 text-xs font-semibold text-muted-foreground text-left'>
                  المحصل
                </TableHead>
                <TableHead className='h-10 text-xs font-semibold text-muted-foreground text-left'>
                  نمط التعاقد
                </TableHead>
                <TableHead className='h-10 text-xs font-semibold text-muted-foreground text-left'>
                  المستحق التقديري
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report.doctors.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className='h-24 text-center text-xs text-muted-foreground font-medium'
                  >
                    لا توجد بيانات مسجلة للأطباء في هذه الفترة
                  </TableCell>
                </TableRow>
              ) : (
                report.doctors.map((doc) => (
                  <TableRow
                    key={doc.doctorId}
                    className='hover:bg-muted/10 border-border/30 transition-colors'
                  >
                    <TableCell className='py-3 font-semibold text-sm text-foreground'>
                      د. {doc.doctorName}
                    </TableCell>
                    <TableCell className='py-3 text-center'>
                      <span className='inline-flex items-center justify-center px-2 py-1 text-xs font-mono font-bold bg-muted rounded-md'>
                        {doc.visitsCount}
                      </span>
                    </TableCell>
                    <TableCell className='py-3 text-left font-mono font-medium text-sm text-muted-foreground'>
                      {doc.collectedAmount.toLocaleString()} ج.م
                    </TableCell>
                    <TableCell className='py-3 text-left text-xs text-muted-foreground'>
                      {doc.compensationMode} ({doc.compensationValue})
                    </TableCell>
                    <TableCell className='py-3 text-left font-mono font-bold text-sm text-foreground'>
                      {doc.estimatedCompensationAmount.toLocaleString()} ج.م
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
