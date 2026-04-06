import { getDoctorMyOverviewReportAction } from '@/actions/reports/clinic-reports'
import { DashboardHeader, DashboardShell } from '@/components/shell'
import { Card } from '@/components/ui/card'
import { format } from 'date-fns'
import Link from 'next/link'

interface Props {
  params: Promise<{ tenantSlug: string }>
  searchParams: Promise<{
    fromDate?: string
    toDate?: string
    visitType?: 'Exam' | 'Consultation'
    source?:
      | 'WalkInTicket'
      | 'Booking'
      | 'ConsultationBooking'
      | 'PatientSelfServiceTicket'
      | 'PatientSelfServiceBooking'
  }>
}

export default async function DoctorReportsPage({ params, searchParams }: Props) {
  const { tenantSlug } = await params
  const { fromDate, toDate, visitType, source } = await searchParams

  const from = fromDate || format(new Date(), 'yyyy-MM-01')
  const to = toDate || format(new Date(), 'yyyy-MM-dd')

  const reportRes = await getDoctorMyOverviewReportAction(tenantSlug, {
    fromDate: from,
    toDate: to,
    visitType,
    source,
  })

  const report = reportRes.success ? reportRes.data : null

  return (
    <DashboardShell>
      <DashboardHeader
        heading='تقاريري'
        text='ملخص أداء الطبيب للفترة المحددة (زيارات، تحصيل، وتقدير الاستحقاق)'
      />

      <Card className='rounded-2xl border-border/50 p-4'>
        <form className='grid grid-cols-1 md:grid-cols-3 gap-3' method='GET'>
          <div>
            <label className='text-xs text-muted-foreground'>من تاريخ</label>
            <input
              name='fromDate'
              type='date'
              defaultValue={from}
              className='w-full h-10 rounded-md border border-input bg-background px-3 text-sm'
            />
          </div>
          <div>
            <label className='text-xs text-muted-foreground'>إلى تاريخ</label>
            <input
              name='toDate'
              type='date'
              defaultValue={to}
              className='w-full h-10 rounded-md border border-input bg-background px-3 text-sm'
            />
          </div>
          <div className='flex items-end gap-2'>
            <button className='h-10 px-4 rounded-md bg-primary text-primary-foreground text-sm'>
              تطبيق
            </button>
            <Link
              href={`/${tenantSlug}/dashboard/doctor/reports`}
              className='h-10 px-4 rounded-md border border-input text-sm inline-flex items-center'
            >
              إعادة ضبط
            </Link>
          </div>
          <div>
            <label className='text-xs text-muted-foreground'>نوع الزيارة</label>
            <select
              name='visitType'
              defaultValue={visitType || ''}
              className='w-full h-10 rounded-md border border-input bg-background px-3 text-sm'
            >
              <option value=''>الكل</option>
              <option value='Exam'>كشف</option>
              <option value='Consultation'>استشارة</option>
            </select>
          </div>
          <div>
            <label className='text-xs text-muted-foreground'>مصدر الزيارة</label>
            <select
              name='source'
              defaultValue={source || ''}
              className='w-full h-10 rounded-md border border-input bg-background px-3 text-sm'
            >
              <option value=''>الكل</option>
              <option value='WalkInTicket'>من العيادة</option>
              <option value='Booking'>حجز داخلي</option>
              <option value='ConsultationBooking'>حجز استشارة</option>
              <option value='PatientSelfServiceTicket'>تذكرة من التطبيق</option>
              <option value='PatientSelfServiceBooking'>حجز من التطبيق</option>
            </select>
          </div>
        </form>
      </Card>

      {!report ? (
        <Card className='rounded-2xl border-border/50 p-8 text-center text-muted-foreground'>
          تعذر تحميل التقرير: {reportRes.message || 'حدث خطأ غير متوقع'}
        </Card>
      ) : (
        <>
          <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3'>
            <Card className='rounded-2xl border-border/50 p-4'>
              <p className='text-xs text-muted-foreground'>إجمالي الزيارات</p>
              <p className='text-2xl font-bold mt-1'>{report.totalVisits}</p>
            </Card>
            <Card className='rounded-2xl border-border/50 p-4'>
              <p className='text-xs text-muted-foreground'>كشف</p>
              <p className='text-2xl font-bold mt-1'>{report.examVisits}</p>
            </Card>
            <Card className='rounded-2xl border-border/50 p-4'>
              <p className='text-xs text-muted-foreground'>استشارة</p>
              <p className='text-2xl font-bold mt-1'>{report.consultationVisits}</p>
            </Card>
            <Card className='rounded-2xl border-border/50 p-4'>
              <p className='text-xs text-muted-foreground'>إجمالي التحصيل</p>
              <p className='text-2xl font-bold mt-1'>
                {report.totalCollected.toLocaleString('ar-EG')} ج.م
              </p>
            </Card>
            <Card className='rounded-2xl border-border/50 p-4'>
              <p className='text-xs text-muted-foreground'>الخدمة الأعلى طلباً</p>
              <p className='text-base font-bold mt-1'>
                {report.topSoldService?.serviceName || 'لا توجد بيانات'}
              </p>
              {report.topSoldService ? (
                <p className='text-xs text-muted-foreground mt-1'>
                  الكمية: {report.topSoldService.quantity} •
                  {` ${report.topSoldService.grossAmount.toLocaleString('ar-EG')} ج.م`}
                </p>
              ) : null}
            </Card>
          </div>

          <Card className='rounded-2xl border-border/50 p-4 space-y-3'>
            <h3 className='font-bold text-sm'>تفصيل الطبيب</h3>
            {report.doctors.length === 0 ? (
              <p className='text-sm text-muted-foreground'>لا توجد بيانات للطبيب في هذه الفترة.</p>
            ) : (
              <div className='space-y-2'>
                {report.doctors.map((row) => (
                  <div
                    key={row.doctorId}
                    className='rounded-xl border border-border/40 p-3 flex flex-col md:flex-row md:items-center justify-between gap-2'
                  >
                    <div>
                      <p className='text-sm font-semibold'>{row.doctorName}</p>
                      <p className='text-xs text-muted-foreground'>
                        الزيارات: {row.visitsCount} • النمط: {row.compensationMode} • نسبة التحصيل:{' '}
                        {row.collectedSharePercent.toLocaleString('ar-EG')}%
                      </p>
                    </div>
                    <div className='text-sm'>
                      <p>قيمة التعاقد: {row.compensationValue.toLocaleString('ar-EG')}</p>
                      <p>التحصيل: {row.collectedAmount.toLocaleString('ar-EG')} ج.م</p>
                      <p>
                        الاستحقاق التقديري:{' '}
                        {row.estimatedCompensationAmount.toLocaleString('ar-EG')} ج.م
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className='rounded-2xl border-border/50 p-4 space-y-3'>
            <h3 className='font-bold text-sm'>الخدمات المباعة</h3>
            {report.servicesSold.length === 0 ? (
              <p className='text-sm text-muted-foreground'>لا توجد خدمات مباعة في الفترة المحددة.</p>
            ) : (
              <div className='space-y-2'>
                {report.servicesSold.slice(0, 8).map((row) => (
                  <div
                    key={row.serviceName}
                    className='rounded-xl border border-border/40 p-3 flex flex-col md:flex-row md:items-center justify-between gap-2'
                  >
                    <div>
                      <p className='text-sm font-semibold'>{row.serviceName}</p>
                      <p className='text-xs text-muted-foreground'>عدد الفواتير: {row.invoicesCount}</p>
                    </div>
                    <div className='text-sm'>
                      <p>الكمية: {row.quantity}</p>
                      <p>إجمالي المبيعات: {row.grossAmount.toLocaleString('ar-EG')} ج.م</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      )}
    </DashboardShell>
  )
}
