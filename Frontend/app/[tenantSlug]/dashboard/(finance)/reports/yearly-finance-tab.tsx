import { getYearlyFinanceAction } from '@/actions/finance/reports'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { IMonthlyFinance, IYearlyFinance } from '../../../../../types/finance'

const ARABIC_MONTHS = [
  'يناير',
  'فبراير',
  'مارس',
  'أبريل',
  'مايو',
  'يونيو',
  'يوليو',
  'أغسطس',
  'سبتمبر',
  'أكتوبر',
  'نوفمبر',
  'ديسمبر',
]

// ============================================================================
// 1. Main Parent Component (Data Fetching & Manipulation)
// ============================================================================
export async function YearlyFinanceTab({
  tenantSlug,
  year,
}: {
  tenantSlug: string
  year?: string
}) {
  const targetYear = Number(year) || new Date().getFullYear()
  const response = await getYearlyFinanceAction(tenantSlug, targetYear)
  const originalReport = response?.data

  if (!originalReport) {
    return (
      <div className='py-20 text-center text-sm font-medium text-muted-foreground border border-border/40 rounded-xl bg-muted/5'>
        لا توجد بيانات لعام {targetYear}
      </div>
    )
  }

  const report = {
    ...originalReport,
    totalRevenue: originalReport.totalPaid,
    totalPaid: originalReport.totalRevenue,
    months: originalReport.months.map((m: IMonthlyFinance) => ({
      ...m,
      totalRevenue: m.totalPaid,
      totalPaid: m.totalRevenue,
    })),
  }

  return (
    <div className='space-y-10 animate-in fade-in duration-500'>
      <div className='border-b border-border/40 pb-4'>
        <h2 className='text-xl font-bold tracking-tight text-foreground'>
          التقرير السنوي - {targetYear}
        </h2>
      </div>

      <YearlyStatsCards report={report} />

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
        <YearlyHorizontalChart months={report.months} />
        <YearlyDetailsTable months={report.months} />
      </div>
    </div>
  )
}

// ============================================================================
// 2. Stats Component (Pure Typography, No Icons)
// ============================================================================
function YearlyStatsCards({ report }: { report: IYearlyFinance }) {
  const isProfit = report.netProfit >= 0

  return (
    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-border/40 border border-border/40 rounded-xl overflow-hidden'>
      <div className='bg-background p-6 flex flex-col gap-1.5'>
        <span className='text-[10px] font-bold uppercase tracking-wider text-muted-foreground'>
          إجمالي الإيرادات
        </span>
        <div className='flex items-baseline gap-1'>
          <span className='text-2xl font-mono font-bold text-foreground'>
            {report.totalRevenue.toLocaleString()}
          </span>
          <span className='text-xs font-medium text-muted-foreground'>EGP</span>
        </div>
      </div>

      <div className='bg-background p-6 flex flex-col gap-1.5'>
        <span className='text-[10px] font-bold uppercase tracking-wider text-muted-foreground'>
          المحصل الكلي
        </span>
        <div className='flex items-baseline gap-1'>
          <span className='text-2xl font-mono font-bold text-foreground'>
            {report.totalPaid.toLocaleString()}
          </span>
          <span className='text-xs font-medium text-muted-foreground'>EGP</span>
        </div>
      </div>

      <div className='bg-background p-6 flex flex-col gap-1.5'>
        <span className='text-[10px] font-bold uppercase tracking-wider text-muted-foreground'>
          المصروفات
        </span>
        <div className='flex items-baseline gap-1'>
          <span className='text-2xl font-mono font-bold text-foreground'>
            {report.totalExpenses.toLocaleString()}
          </span>
          <span className='text-xs font-medium text-muted-foreground'>EGP</span>
        </div>
      </div>

      <div
        className={cn('p-6 flex flex-col gap-1.5', isProfit ? 'bg-emerald-500/5' : 'bg-rose-500/5')}
      >
        <span
          className={cn(
            'text-[10px] font-bold uppercase tracking-wider',
            isProfit ? 'text-emerald-700' : 'text-rose-700',
          )}
        >
          صافي الربح
        </span>
        <div className='flex items-baseline gap-1'>
          <span
            className={cn(
              'text-2xl font-mono font-bold',
              isProfit ? 'text-emerald-600' : 'text-rose-600',
            )}
          >
            {isProfit ? '+' : ''}
            {report.netProfit.toLocaleString()}
          </span>
          <span
            className={cn(
              'text-xs font-medium',
              isProfit ? 'text-emerald-600/70' : 'text-rose-600/70',
            )}
          >
            EGP
          </span>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// 3. Chart Component (Horizontal - Clean & Readable)
// ============================================================================
function YearlyHorizontalChart({ months }: { months: IMonthlyFinance[] }) {
  // بنجيب أعلى قيمة عشان نظبط عرض الـ Bars بالنسبة المئوية
  const maxRevenue = Math.max(...months.map((m) => m.totalRevenue), 1)

  return (
    <div className='flex flex-col space-y-4'>
      <h3 className='text-sm font-bold uppercase tracking-wider text-muted-foreground'>
        مؤشر الإيرادات الشهري
      </h3>
      <div className='bg-background border border-border/40 rounded-xl p-6 space-y-4 shadow-sm'>
        {months.map((month) => {
          const widthPercent = (month.totalRevenue / maxRevenue) * 100

          return (
            <div key={month.month} className='flex items-center gap-4 group'>
              {/* اسم الشهر */}
              <div className='w-12 shrink-0 text-xs font-bold text-muted-foreground'>
                {ARABIC_MONTHS[month.month - 1]}
              </div>

              {/* البار الأفقي */}
              <div className='flex-1 h-6 bg-muted/30 rounded-sm overflow-hidden'>
                <div
                  className='h-full bg-primary/80 group-hover:bg-primary transition-all duration-500 rounded-sm'
                  style={{ width: `${widthPercent}%` }}
                />
              </div>

              {/* القيمة */}
              <div className='w-24 shrink-0 text-left'>
                <span className='text-sm font-mono font-bold text-foreground'>
                  {month.totalRevenue.toLocaleString()}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ============================================================================
// 4. Table Component (Minimalist Auditing)
// ============================================================================
function YearlyDetailsTable({ months }: { months: IMonthlyFinance[] }) {
  return (
    <div className='flex flex-col space-y-4'>
      <h3 className='text-sm font-bold uppercase tracking-wider text-muted-foreground'>
        جدول المراجعة (Auditing)
      </h3>
      <div className='bg-background border border-border/40 rounded-xl overflow-hidden shadow-sm'>
        <Table dir='rtl'>
          <TableHeader className='bg-muted/10'>
            <TableRow className='hover:bg-transparent border-border/40'>
              <TableHead className='h-10 text-xs font-semibold text-muted-foreground'>
                الشهر
              </TableHead>
              <TableHead className='h-10 text-xs font-semibold text-muted-foreground text-left'>
                الإيرادات
              </TableHead>
              <TableHead className='h-10 text-xs font-semibold text-muted-foreground text-left'>
                المصروفات
              </TableHead>
              <TableHead className='h-10 text-xs font-semibold text-muted-foreground text-left'>
                الصافي
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {months.map((month) => {
              const isProfit = month.netProfit >= 0
              return (
                <TableRow key={month.month} className='border-border/30 hover:bg-muted/5'>
                  <TableCell className='py-3 text-xs font-bold text-foreground'>
                    {ARABIC_MONTHS[month.month - 1]}
                  </TableCell>

                  <TableCell className='py-3 text-left font-mono text-sm text-foreground'>
                    {month.totalRevenue.toLocaleString()}
                  </TableCell>

                  <TableCell className='py-3 text-left font-mono text-sm text-muted-foreground'>
                    {month.totalExpenses.toLocaleString()}
                  </TableCell>

                  <TableCell className='py-3 text-left'>
                    <span
                      className={cn(
                        'font-mono font-bold text-sm',
                        isProfit ? 'text-emerald-600' : 'text-rose-600',
                      )}
                    >
                      {isProfit ? '+' : ''}
                      {month.netProfit.toLocaleString()}
                    </span>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
