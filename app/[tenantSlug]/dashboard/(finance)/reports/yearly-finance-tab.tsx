import { getYearlyFinanceAction } from '@/actions/finance/reports'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export async function YearlyFinanceTab({
  tenantSlug,
  year,
}: {
  tenantSlug: string
  year?: string
}) {
  const targetYear = Number(year) || new Date().getFullYear()

  const response = await getYearlyFinanceAction(tenantSlug, targetYear)
  const report = response?.data

  if (!report) {
    return <div className='p-8 text-center border rounded-xl'>لا توجد بيانات لعام {targetYear}</div>
  }

  return (
    <div className='space-y-6 animate-in fade-in duration-500'>
      <div className='flex items-center justify-between'>
        <h3 className='text-lg font-black tracking-tight'>التقرير المالي لعام {targetYear}</h3>
      </div>

      <div className='grid gap-4 md:grid-cols-4'>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm'>إجمالي إيرادات السنة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-black'>{report.totalRevenue} ج.م</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm'>المحصل الكلي</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-black text-primary'>{report.totalPaid} ج.م</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm'>إجمالي المصروفات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-black text-destructive'>{report.totalExpenses} ج.م</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm'>صافي أرباح السنة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-black'>{report.netProfit} ج.م</div>
          </CardContent>
        </Card>
      </div>

      <h3 className='text-lg font-black tracking-tight mt-8'>تفصيل الشهور</h3>
      <div className='overflow-hidden border rounded-md'>
        <Table dir='rtl'>
          <TableHeader className='bg-muted/50 h-12'>
            <TableRow>
              <TableHead className='font-bold text-right'>الشهر</TableHead>
              <TableHead className='font-bold text-right'>عدد الفواتير</TableHead>
              <TableHead className='font-bold text-right'>الإيرادات</TableHead>
              <TableHead className='font-bold text-right'>المصروفات</TableHead>
              <TableHead className='font-bold text-right'>صافي الربح</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {report.months.map((month) => (
              <TableRow key={month.month}>
                <TableCell className='font-bold'>شهر {month.month}</TableCell>
                <TableCell className='font-mono'>{month.invoiceCount}</TableCell>
                <TableCell className='font-bold text-primary'>{month.totalRevenue} ج.م</TableCell>
                <TableCell className='font-bold text-destructive'>
                  {month.totalExpenses} ج.م
                </TableCell>
                <TableCell className='font-black'>{month.netProfit} ج.م</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
