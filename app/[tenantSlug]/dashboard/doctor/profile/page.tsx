import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { getDoctorMeAction } from '../../../../../actions/Profiles/doctor-profile'
import { VISIT_CONFIG_LABELS } from '../../../../../constants/visit-fields'
import { ClinicImage } from '../../../../../components/shared/clinic-image'

export default async function DoctorProfilePage({
  params,
}: {
  params: Promise<{ tenantSlug: string }>
}) {
  const { tenantSlug } = await params

  const response = await getDoctorMeAction(tenantSlug)
  const doctor = response?.data

  if (!doctor) {
    return (
      <div className='py-20 text-center text-sm font-medium text-muted-foreground border border-border/40 rounded-xl bg-muted/5'>
        تعذر تحميل بيانات الطبيب.
      </div>
    )
  }


  return (
    <div className='max-w-4xl mx-auto pt-8 pb-16 animate-in fade-in duration-500 space-y-12'>
      {/* =====================================================================
          1. Hero Section (Profile Card)
          ===================================================================== */}
      <div className='relative flex flex-col bg-card border border-border/50 rounded-3xl shadow-sm overflow-hidden'>
        <div className='h-32 sm:h-40 bg-linear-to-r from-primary/10 via-muted/30 to-background border-b border-border/40' />

        <div className='absolute top-16 sm:top-24 right-8 w-24 h-24 sm:w-32 sm:h-32 bg-background border-4 border-background rounded-full flex items-center justify-center shadow-sm  overflow-hidden'>
          <ClinicImage src={doctor.photoUrl} alt='Doctor Image' fill fallbackType='doctor' />
        </div>

        <div className='pt-12 sm:pt-20 px-8 pb-10 flex flex-col md:flex-row md:justify-between md:items-end gap-6'>
          <div className='flex flex-col gap-2'>
            <h1 className='text-3xl sm:text-4xl font-black text-foreground tracking-tight'>
              د. {doctor.name}
            </h1>
            <p className='text-lg font-bold text-muted-foreground'>{doctor.specialty}</p>
            {doctor.bio && (
              <p className='text-sm font-medium text-muted-foreground/80 max-w-xl mt-2 leading-relaxed'>
                {doctor.bio}
              </p>
            )}
          </div>

          <div className='flex flex-col gap-1 text-right'>
            <span className='text-[10px] font-bold uppercase tracking-wider text-muted-foreground'>
              رقم التواصل
            </span>
            <span className='text-lg font-mono font-bold text-foreground'>
              {doctor.phone || 'غير مسجل'}
            </span>
          </div>
        </div>
      </div>

      {/* =====================================================================
          2. Queue & Urgent Configurations
          ===================================================================== */}
      <div className='flex flex-col space-y-4'>
        <h3 className='text-sm font-bold uppercase tracking-wider text-muted-foreground'>
          إعدادات الكشف والطابور
        </h3>

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-border/40 border border-border/40 rounded-xl overflow-hidden shadow-sm'>
          <div className='bg-background p-6 flex flex-col gap-2'>
            <span className='text-[10px] font-bold uppercase tracking-wider text-muted-foreground'>
              متوسط وقت الكشف
            </span>
            <div className='flex items-baseline gap-1'>
              <span className='text-2xl font-mono font-bold text-foreground'>
                {doctor.avgVisitDurationMinutes}
              </span>
              <span className='text-xs font-bold text-muted-foreground'>دقيقة</span>
            </div>
          </div>

          <div className='bg-background p-6 flex flex-col gap-2'>
            <span className='text-[10px] font-bold uppercase tracking-wider text-muted-foreground'>
              دعم الحالات المستعجلة
            </span>
            <div>
              <span
                className={cn(
                  'inline-flex items-center justify-center px-3 py-1 text-xs font-bold rounded-md',
                  doctor.supportsUrgent
                    ? 'bg-emerald-500/10 text-emerald-600'
                    : 'bg-muted text-muted-foreground',
                )}
              >
                {doctor.supportsUrgent ? 'مفعل' : 'غير مفعل'}
              </span>
            </div>
          </div>

          <div className='bg-background p-6 flex flex-col gap-2'>
            <span className='text-[10px] font-bold uppercase tracking-wider text-muted-foreground'>
              نظام إدخال المستعجل
            </span>
            <span className='text-sm font-bold text-foreground'>{doctor.urgentCaseMode}</span>
          </div>

          <div className='bg-background p-6 flex flex-col gap-2'>
            <span className='text-[10px] font-bold uppercase tracking-wider text-muted-foreground'>
              تخطي أدوار المستعجل
            </span>
            <div className='flex items-baseline gap-1'>
              <span className='text-xl font-mono font-bold text-foreground'>
                {doctor.urgentInsertAfterCount}
              </span>
              <span className='text-xs font-bold text-muted-foreground'>مرضى</span>
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================================
          3. Vital Signs Configurations (Badges Map)
          ===================================================================== */}
      <div className='flex flex-col space-y-4'>
        <h3 className='text-sm font-bold uppercase tracking-wider text-muted-foreground'>
          العلامات الحيوية المفعلة للقياس
        </h3>
        <div className='bg-background border border-border/40 rounded-xl p-6 shadow-sm'>
          <div className='flex flex-wrap gap-3'>
            {Object.entries(doctor.visitFieldConfig).map(([key, isEnabled]) => {
              const configKey = key as keyof typeof VISIT_CONFIG_LABELS

              return (
                <span
                  key={key}
                  className={cn(
                    'px-3 py-1.5 text-xs font-bold rounded-md transition-colors',
                    isEnabled
                      ? 'bg-primary/10 text-primary border border-primary/20'
                      : 'bg-muted/30 text-muted-foreground/50 border border-border/40 line-through decoration-muted-foreground/30',
                  )}
                >
                  {VISIT_CONFIG_LABELS[configKey] || key}
                </span>
              )
            })}
          </div>
        </div>
      </div>

      {/* =====================================================================
          4. Services & Pricing Table
          ===================================================================== */}
      <div className='flex flex-col space-y-4'>
        <h3 className='text-sm font-bold uppercase tracking-wider text-muted-foreground'>
          الخدمات والتسعير
        </h3>
        <div className='bg-background border border-border/40 rounded-xl overflow-hidden shadow-sm'>
          <Table dir='rtl'>
            <TableHeader className='bg-muted/10'>
              <TableRow className='hover:bg-transparent border-border/40'>
                <TableHead className='h-10 text-xs font-semibold text-muted-foreground'>
                  اسم الخدمة
                </TableHead>
                <TableHead className='h-10 text-xs font-semibold text-muted-foreground text-center'>
                  المدة المقدرة
                </TableHead>
                <TableHead className='h-10 text-xs font-semibold text-muted-foreground text-left'>
                  التسعيرة
                </TableHead>
                <TableHead className='h-10 text-xs font-semibold text-muted-foreground text-center'>
                  الحالة
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {doctor.services.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className='py-8 text-center text-xs font-medium text-muted-foreground'
                  >
                    لا توجد خدمات مسجلة لهذا الطبيب.
                  </TableCell>
                </TableRow>
              ) : (
                doctor.services.map((service) => (
                  <TableRow key={service.id} className='border-border/30 hover:bg-muted/5'>
                    <TableCell className='py-3 text-sm font-bold text-foreground'>
                      {service.serviceName}
                    </TableCell>

                    <TableCell className='py-3 text-center'>
                      <span className='font-mono text-xs font-medium text-muted-foreground'>
                        {service.durationMinutes} دقيقة
                      </span>
                    </TableCell>

                    <TableCell className='py-3 text-left'>
                      <div className='flex items-baseline justify-end gap-1'>
                        <span className='font-mono font-bold text-sm text-foreground'>
                          {service.price.toLocaleString()}
                        </span>
                        <span className='text-[10px] font-bold text-muted-foreground'>EGP</span>
                      </div>
                    </TableCell>

                    <TableCell className='py-3 text-center'>
                      <span
                        className={cn(
                          'text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-sm',
                          service.isActive
                            ? 'bg-emerald-500/10 text-emerald-600'
                            : 'bg-rose-500/10 text-rose-600',
                        )}
                      >
                        {service.isActive ? 'متاحة' : 'موقوفة'}
                      </span>
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
