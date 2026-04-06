import {
  getClinicOverviewReportAction,
  getClinicServicesReportAction,
} from '@/actions/reports/clinic-reports'
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
import { ActivityIcon, ReceiptIcon, WalletIcon } from 'lucide-react'

export async function OverviewTab({
  tenantSlug,
  from,
  to,
}: {
  tenantSlug: string
  from?: string
  to?: string
}) {
  const [overviewResponse, servicesResponse] = await Promise.all([
    getClinicOverviewReportAction(tenantSlug, { from, to }),
    getClinicServicesReportAction(tenantSlug, { from, to }),
  ])

  const report = overviewResponse.success ? overviewResponse.data : null
  const servicesReport = servicesResponse.success ? servicesResponse.data : null
  const serviceRows = report?.servicesSold?.length
    ? report.servicesSold
    : servicesReport?.rows || []
  const topSoldService = report?.topSoldService || serviceRows[0] || null

  if (!report) {
    return (
      <div className='p-8 text-center border rounded-xl text-muted-foreground bg-muted/20'>
        لا توجد بيانات مالية لهذه الفترة.
      </div>
    )
  }

  const isPositiveCashflow = report.netCashflow >= 0

  return (
    <div className='space-y-8 animate-in fade-in duration-500'>
      <div className='flex items-center justify-between'>
        <h3 className='text-lg font-black tracking-tight'>ملخص الأداء المالي والتشغيلي</h3>
        <PeriodFilter />
      </div>

      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between pb-2 space-y-0'>
            <CardTitle className='text-sm font-bold text-muted-foreground'>
              إجمالي التحصيل
            </CardTitle>
            <ActivityIcon className='w-4 h-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-black'>{report.totalCollected.toLocaleString('ar-EG')} ج.م</div>
            <p className='text-xs text-muted-foreground mt-1'>إجمالي ما تم تحصيله في الفترة</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between pb-2 space-y-0'>
            <CardTitle className='text-sm font-bold text-muted-foreground'>
              إجمالي الفواتير
            </CardTitle>
            <WalletIcon className='w-4 h-4 text-primary' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-black text-primary'>{report.totalInvoiced.toLocaleString('ar-EG')} ج.م</div>
            <p className='text-xs text-muted-foreground mt-1'>إجمالي قيمة الزيارات المسعرة</p>
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
            <div className='text-2xl font-black text-destructive'>{report.totalExpenses.toLocaleString('ar-EG')} ج.م</div>
            <p className='text-xs text-muted-foreground mt-1'>مصروفات التشغيل في الفترة</p>
          </CardContent>
        </Card>

        <Card
          className={cn(
            'border-2',
            isPositiveCashflow
              ? 'border-primary/50 bg-primary/5'
              : 'border-destructive/50 bg-destructive/5',
          )}
        >
          <CardHeader className='flex flex-row items-center justify-between pb-2 space-y-0'>
            <CardTitle
              className={cn(
                'text-sm font-black',
                isPositiveCashflow ? 'text-primary' : 'text-destructive',
              )}
            >
              صافي التدفق النقدي
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={cn(
                'text-3xl font-black',
                isPositiveCashflow ? 'text-primary' : 'text-destructive',
              )}
            >
              {report.netCashflow.toLocaleString('ar-EG')} ج.م
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className='text-sm font-bold'>تفصيل مصادر الزيارات</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid gap-3 md:grid-cols-3 lg:grid-cols-6 text-sm'>
            <div className='rounded-md border p-3'>
              <p className='text-muted-foreground text-xs'>إجمالي الزيارات</p>
              <p className='font-black text-lg'>{report.totalVisits}</p>
            </div>
            <div className='rounded-md border p-3'>
              <p className='text-muted-foreground text-xs'>كشف</p>
              <p className='font-black text-lg'>{report.examVisits}</p>
            </div>
            <div className='rounded-md border p-3'>
              <p className='text-muted-foreground text-xs'>استشارة</p>
              <p className='font-black text-lg'>{report.consultationVisits}</p>
            </div>
            <div className='rounded-md border p-3'>
              <p className='text-muted-foreground text-xs'>من الحجز</p>
              <p className='font-black text-lg'>{report.bookingVisits}</p>
            </div>
            <div className='rounded-md border p-3'>
              <p className='text-muted-foreground text-xs'>حضور مباشر</p>
              <p className='font-black text-lg'>{report.walkInVisits}</p>
            </div>
            <div className='rounded-md border p-3'>
              <p className='text-muted-foreground text-xs'>من التطبيق</p>
              <p className='font-black text-lg'>{report.selfServiceVisits}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className='space-y-4'>
        <h3 className='text-lg font-black tracking-tight'>نسب مساهمة الأطباء في التحصيل</h3>
        <div className='overflow-hidden border rounded-md'>
          <Table dir='rtl'>
            <TableHeader className='bg-muted/50 h-12'>
              <TableRow>
                <TableHead className='font-bold text-right'>اسم الطبيب</TableHead>
                <TableHead className='font-bold text-right'>التحصيل</TableHead>
                <TableHead className='font-bold text-right'>النسبة من تحصيل العيادة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report.doctorsPercentages.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className='h-24 text-center text-muted-foreground font-medium'
                  >
                    لا توجد كشوفات مسجلة في هذه الفترة
                  </TableCell>
                </TableRow>
              ) : (
                report.doctorsPercentages.map((doc) => (
                  <TableRow key={doc.doctorId}>
                    <TableCell className='font-bold'>{doc.doctorName}</TableCell>
                    <TableCell className='text-primary font-black'>
                      {doc.collectedAmount.toLocaleString('ar-EG')} ج.م
                    </TableCell>
                    <TableCell className='font-bold'>
                      {doc.percentageOfClinicCollection.toLocaleString('ar-EG')}%
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className='space-y-4'>
        <h3 className='text-lg font-black tracking-tight'>الخدمات الأكثر بيعاً</h3>
        <Card>
          <CardHeader>
            <CardTitle className='text-sm font-bold'>الأكثر طلباً</CardTitle>
          </CardHeader>
          <CardContent>
            {!topSoldService ? (
              <p className='text-sm text-muted-foreground'>لا توجد خدمات مباعة في هذه الفترة.</p>
            ) : (
              <div className='text-sm'>
                <p className='font-bold text-base'>{topSoldService.serviceName}</p>
                <p className='text-muted-foreground'>
                  الكمية: {topSoldService.quantity} •
                  {` ${topSoldService.grossAmount.toLocaleString('ar-EG')} ج.م`}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className='overflow-hidden border rounded-md'>
          <Table dir='rtl'>
            <TableHeader className='bg-muted/50 h-12'>
              <TableRow>
                <TableHead className='font-bold text-right'>الخدمة</TableHead>
                <TableHead className='font-bold text-right'>الكمية</TableHead>
                <TableHead className='font-bold text-right'>إجمالي البيع</TableHead>
                <TableHead className='font-bold text-right'>عدد الفواتير</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {serviceRows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className='h-24 text-center text-muted-foreground font-medium'
                  >
                    لا توجد خدمات مباعة في هذه الفترة
                  </TableCell>
                </TableRow>
              ) : (
                serviceRows.slice(0, 10).map((service) => (
                  <TableRow key={service.serviceName}>
                    <TableCell className='font-bold'>{service.serviceName}</TableCell>
                    <TableCell>{service.quantity}</TableCell>
                    <TableCell className='font-bold'>
                      {service.grossAmount.toLocaleString('ar-EG')} ج.م
                    </TableCell>
                    <TableCell>{service.invoicesCount}</TableCell>
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
