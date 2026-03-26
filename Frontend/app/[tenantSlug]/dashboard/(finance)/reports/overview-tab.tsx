import { getProfitReportAction } from '@/actions/finance/reports'
import { PeriodFilter } from '@/components/shared/period-filter'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { ActivityIcon, ArrowDownIcon, ArrowUpIcon, ReceiptIcon, WalletIcon } from 'lucide-react'

export async function OverviewTab({
  tenantSlug,
  from,
  to,
}: {
  tenantSlug: string
  from?: string
  to?: string
}) {
  // الريكويست بيتضرب هنا في السيرفر
  const response = await getProfitReportAction(tenantSlug, from, to)
  const report = response?.data

  if (!report) {
    return (
      <div className='p-8 text-center border rounded-xl text-muted-foreground bg-muted/20'>
        لا توجد بيانات مالية لهذه الفترة.
      </div>
    )
  }

  // لو الربح موجب أو صفر هيبقى لونه أخضر (أو Primary)، لو سالب هيبقى أحمر
  const isProfit = report.netProfit >= 0

  return (
    <div className='space-y-8 animate-in fade-in duration-500'>
      <div className='flex items-center justify-between'>
        <h3 className='text-lg font-black tracking-tight'>ملخص الأرباح والمصروفات</h3>
        <PeriodFilter />
      </div>

      {/* 1. كروت الـ KPIs */}
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between pb-2 space-y-0'>
            <CardTitle className='text-sm font-bold text-muted-foreground'>
              إجمالي الإيرادات
            </CardTitle>
            <ActivityIcon className='w-4 h-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-black'>{report.totalPaid} ج.م</div>
            <p className='text-xs text-muted-foreground mt-1'>شامل المديونيات</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between pb-2 space-y-0'>
            <CardTitle className='text-sm font-bold text-muted-foreground'>
              المحصل الفعلي (الكاش)
            </CardTitle>
            <WalletIcon className='w-4 h-4 text-primary' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-black text-primary'>{report.totalRevenue} ج.م</div>
            <p className='text-xs text-muted-foreground mt-1'>من {report.invoiceCount} فاتورة</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between pb-2 space-y-0'>
            <CardTitle className='text-sm font-bold text-muted-foreground'>
              المصروفات الخارجة
            </CardTitle>
            <ReceiptIcon className='w-4 h-4 text-destructive' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-black text-destructive'>{report.totalExpenses} ج.م</div>
            <p className='text-xs text-muted-foreground mt-1'>من {report.expenseCount} عملية صرف</p>
          </CardContent>
        </Card>

        {/* كارت صافي الربح (بيتغير لونه حسب المكسب والخسارة) */}
        <Card
          className={cn(
            'border-2',
            isProfit ? 'border-primary/50 bg-primary/5' : 'border-destructive/50 bg-destructive/5',
          )}
        >
          <CardHeader className='flex flex-row items-center justify-between pb-2 space-y-0'>
            <CardTitle
              className={cn('text-sm font-black', isProfit ? 'text-primary' : 'text-destructive')}
            >
              صافي الربح
            </CardTitle>
            {isProfit ? (
              <ArrowUpIcon className='w-5 h-5 text-primary' />
            ) : (
              <ArrowDownIcon className='w-5 h-5 text-destructive' />
            )}
          </CardHeader>
          <CardContent>
            <div
              className={cn('text-3xl font-black', isProfit ? 'text-primary' : 'text-destructive')}
            >
              {report.netProfit} ج.م
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 2. أداء الدكاترة (عشان صاحب العيادة يعرف مين بيدخله فلوس ومين مريح) */}
      <div className='space-y-4'>
        <h3 className='text-lg font-black tracking-tight'>مساهمة الأطباء في الإيرادات</h3>
        <div className='overflow-hidden border rounded-md'>
          <Table dir='rtl'>
            <TableHeader className='bg-muted/50 h-12'>
              <TableRow>
                <TableHead className='font-bold text-right'>اسم الطبيب</TableHead>
                <TableHead className='font-bold text-right'>عدد الكشوفات</TableHead>
                <TableHead className='font-bold text-right'>الإيراد الكلي</TableHead>
                <TableHead className='font-bold text-right'>المحصل الفعلي</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report.byDoctor.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className='h-24 text-center text-muted-foreground font-medium'
                  >
                    لا توجد كشوفات مسجلة في هذه الفترة
                  </TableCell>
                </TableRow>
              ) : (
                report.byDoctor.map((doc) => (
                  <TableRow key={doc.doctorId}>
                    <TableCell className='font-bold'>{doc.doctorName}</TableCell>
                    <TableCell className='font-mono'>{doc.visitCount}</TableCell>
                    <TableCell className='font-bold'>{doc.totalRevenue} ج.م</TableCell>
                    <TableCell className='text-primary font-black'>{doc.totalPaid} ج.م</TableCell>
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
