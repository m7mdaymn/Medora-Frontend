import { ClinicImage } from '@/components/shared/clinic-image'
import { fetchApi } from '@/lib/fetchApi'
import { IPublicClinic } from '../../../types/public'
import { LoginForm } from './login-form'

export default async function LoginPage({ params }: { params: Promise<{ tenantSlug: string }> }) {
  const { tenantSlug } = await params

  let clinic: IPublicClinic | null = null
  try {
    const response = await fetchApi<IPublicClinic>(`/api/public/${tenantSlug}/clinic`, {
      cache: 'no-store',
    })
    clinic = response?.data || null
  } catch {}

  console.log(clinic)

  return (
    <div className='min-h-screen w-full grid grid-cols-1 lg:grid-cols-2'>
      <div className='flex flex-col justify-center p-6 sm:p-12 bg-background relative'>
        <div className='w-full max-w-100 mx-auto'>
          <LoginForm
            tenantSlug={tenantSlug}
            clinicName={clinic?.clinicName}
            logoUrl={clinic?.logoUrl as string}
          />
        </div>
      </div>

      <div className='hidden lg:flex flex-col justify-between p-12 bg-muted/30 border-r border-border/50 relative overflow-hidden'>
        <div className='absolute inset-0 opacity-20'>
          {clinic?.imgUrl ? (
            <ClinicImage
              src={clinic.imgUrl}
              alt='Cover'
              fill
              className='object-cover'
              fallbackType='general'
            />
          ) : (
            <div
              className='w-full h-full'
              style={{
                background:
                  'radial-gradient(circle at top left, var(--primary) 0%, transparent 40%)',
              }}
            />
          )}
        </div>

        <div className='relative z-10 flex items-center gap-3'>
          {clinic?.logoUrl ? (
            <ClinicImage
              src={clinic.logoUrl}
              alt='Clinic Logo'
              width={40}
              height={40}
              className='rounded-md object-contain bg-white p-1 shadow-sm'
              fallbackType='logo'
            />
          ) : (
            <div className='w-10 h-10 rounded-md bg-primary flex items-center justify-center text-primary-foreground font-bold text-xl'>
              {clinic?.clinicName?.charAt(0) || tenantSlug.charAt(0).toUpperCase()}
            </div>
          )}
          <span className='font-bold text-xl tracking-tight'>{clinic?.clinicName || 'العيادة'}</span>
        </div>

        <div className='relative z-10 space-y-4 max-w-sm'>
          <h1 className='text-4xl font-black tracking-tight text-foreground'>
            نظام إدارة العيادات الذكي.
          </h1>
          <p className='text-lg font-medium text-muted-foreground'>
            قم بتسجيل الدخول للوصول إلى سجلات المرضى، الحجوزات، والتقارير المالية الخاصة بك.
          </p>
        </div>
      </div>
    </div>
  )
}
