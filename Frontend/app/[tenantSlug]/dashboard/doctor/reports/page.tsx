import { getDoctorMyOverviewReportAction } from '@/actions/reports/clinic-reports'
import { getPartnerOrdersKpiAction, listPartnerOrdersAction } from '@/actions/partner/workflow'
import { DashboardHeader, DashboardShell } from '@/components/shell'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { format } from 'date-fns'
import Link from 'next/link'

type PartnerStatusFilter = 'Sent' | 'Accepted' | 'InProgress' | 'Completed' | 'Cancelled'

function partnerStatusLabel(status: string): string {
  switch (status) {
    case 'Sent':
      return 'مرسل'
    case 'Accepted':
      return 'مقبول'
    case 'InProgress':
      return 'قيد التنفيذ'
    case 'Completed':
      return 'مكتمل'
    case 'Cancelled':
      return 'ملغي'
    default:
      return status
  }
}

function partnerStatusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'Completed':
      return 'default'
    case 'Cancelled':
      return 'destructive'
    case 'InProgress':
      return 'secondary'
    default:
      return 'outline'
  }
}

interface Props {
  params: Promise<{ tenantSlug: string }>
  searchParams: Promise<{
    fromDate?: string
    toDate?: string
    visitType?: 'Exam' | 'Consultation'
    partnerStatus?: PartnerStatusFilter
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
  const { fromDate, toDate, visitType, source, partnerStatus } = await searchParams

  const from = fromDate || format(new Date(), 'yyyy-MM-01')
  const to = toDate || format(new Date(), 'yyyy-MM-dd')

  const [reportRes, partnerKpiRes, partnerOrdersRes] = await Promise.all([
    getDoctorMyOverviewReportAction(tenantSlug, {
      fromDate: from,
      toDate: to,
      visitType,
      source,
    }),
    getPartnerOrdersKpiAction(tenantSlug, {
      fromDate: from,
      toDate: to,
      status: partnerStatus,
    }),
    listPartnerOrdersAction(tenantSlug, {
      fromDate: from,
      toDate: to,
      status: partnerStatus,
      pageNumber: 1,
      pageSize: 8,
    }),
  ])

  const report = reportRes.success ? reportRes.data : null
  const partnerKpis = partnerKpiRes.success ? partnerKpiRes.data : null
  const partnerOrders = partnerOrdersRes.success ? partnerOrdersRes.data?.items || [] : []

  return (
    <DashboardShell>
      <DashboardHeader
        heading='تقاريري'
        text='ملخص أداء الطبيب للفترة المحددة (زيارات، تحصيل، وتقدير الاستحقاق)'
      />

      <Card className='rounded-2xl border-border/50 p-4'>
        <form className='grid grid-cols-1 md:grid-cols-4 gap-3' method='GET'>
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
          <div>
            <label className='text-xs text-muted-foreground'>حالة تحويلات الشركاء</label>
            <select
              name='partnerStatus'
              defaultValue={partnerStatus || ''}
              className='w-full h-10 rounded-md border border-input bg-background px-3 text-sm'
            >
              <option value=''>الكل</option>
              <option value='Sent'>مرسل</option>
              <option value='Accepted'>مقبول</option>
              <option value='InProgress'>قيد التنفيذ</option>
              <option value='Completed'>مكتمل</option>
              <option value='Cancelled'>ملغي</option>
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
            <h3 className='font-bold text-sm'>مؤشرات تحويلات الشركاء</h3>
            {!partnerKpis ? (
              <p className='text-sm text-muted-foreground'>تعذر تحميل مؤشرات تحويلات الشركاء.</p>
            ) : (
              <>
                <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3'>
                  <Card className='rounded-xl border-border/50 p-3'>
                    <p className='text-xs text-muted-foreground'>إجمالي التحويلات</p>
                    <p className='text-xl font-bold mt-1'>{partnerKpis.totalOrders}</p>
                  </Card>
                  <Card className='rounded-xl border-border/50 p-3'>
                    <p className='text-xs text-muted-foreground'>قيد التنفيذ</p>
                    <p className='text-xl font-bold mt-1'>
                      {partnerKpis.sentOrders + partnerKpis.acceptedOrders + partnerKpis.inProgressOrders}
                    </p>
                  </Card>
                  <Card className='rounded-xl border-border/50 p-3'>
                    <p className='text-xs text-muted-foreground'>مكتمل</p>
                    <p className='text-xl font-bold mt-1'>{partnerKpis.completedOrders}</p>
                  </Card>
                  <Card className='rounded-xl border-border/50 p-3'>
                    <p className='text-xs text-muted-foreground'>إجمالي المستحق للطبيب</p>
                    <p className='text-xl font-bold mt-1'>
                      {partnerKpis.totalDoctorPayout.toLocaleString('ar-EG')} ج.م
                    </p>
                  </Card>
                  <Card className='rounded-xl border-border/50 p-3'>
                    <p className='text-xs text-muted-foreground'>إجمالي التسويات</p>
                    <p className='text-xl font-bold mt-1'>
                      {partnerKpis.totalSettledAmount.toLocaleString('ar-EG')} ج.م
                    </p>
                  </Card>
                </div>

                <div className='rounded-xl border border-border/50 p-3 text-xs text-muted-foreground'>
                  متوسط زمن الإكمال:{' '}
                  {partnerKpis.averageCompletionHours !== null
                    ? `${partnerKpis.averageCompletionHours.toLocaleString('ar-EG')} ساعة`
                    : 'غير متاح'}
                </div>
              </>
            )}
          </Card>

          <Card className='rounded-2xl border-border/50 p-4 space-y-3'>
            <div className='flex items-center justify-between gap-2'>
              <h3 className='font-bold text-sm'>آخر تحويلات الشركاء</h3>
              <Link
                href={`/${tenantSlug}/dashboard/doctor/contracts`}
                className='text-xs text-primary hover:underline'
              >
                عرض صفحة التعاقدات
              </Link>
            </div>

            {partnerOrders.length === 0 ? (
              <p className='text-sm text-muted-foreground'>لا توجد تحويلات شركاء في الفترة المحددة.</p>
            ) : (
              <div className='space-y-2'>
                {partnerOrders.map((order) => (
                  <div
                    key={order.id}
                    className='rounded-xl border border-border/40 p-3 flex flex-col lg:flex-row lg:items-center justify-between gap-2'
                  >
                    <div>
                      <div className='flex items-center gap-2'>
                        <p className='text-sm font-semibold'>{order.patientName}</p>
                        <Badge variant={partnerStatusVariant(order.status)}>
                          {partnerStatusLabel(order.status)}
                        </Badge>
                      </div>
                      <p className='text-xs text-muted-foreground mt-1'>
                        {order.partnerName} • {order.serviceNameSnapshot || 'خدمة غير محددة'}
                      </p>
                      <p className='text-xs text-muted-foreground'>
                        {new Date(order.createdAt).toLocaleString('ar-EG')}
                      </p>
                    </div>

                    <div className='text-sm'>
                      <p>
                        التكلفة النهائية:{' '}
                        {order.finalCost !== null
                          ? `${order.finalCost.toLocaleString('ar-EG')} ج.م`
                          : 'غير متاحة'}
                      </p>
                      <p>
                        مستحق الطبيب:{' '}
                        {order.doctorPayoutAmount !== null
                          ? `${order.doctorPayoutAmount.toLocaleString('ar-EG')} ج.م`
                          : 'غير محسوب'}
                      </p>
                      <Link
                        href={`/${tenantSlug}/dashboard/doctor/visits/${order.visitId}`}
                        className='text-xs text-primary hover:underline'
                      >
                        فتح الزيارة
                      </Link>
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
