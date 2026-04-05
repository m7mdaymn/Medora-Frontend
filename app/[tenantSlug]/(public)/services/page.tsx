import { getPublicClinicAction, getPublicServicesAction } from '@/actions/public/landing'
import { Card } from '@/components/ui/card'
import Link from 'next/link'

interface Props {
  params: Promise<{ tenantSlug: string }>
}

export default async function PublicServicesPage({ params }: Props) {
  const { tenantSlug } = await params

  const [clinicRes, servicesRes] = await Promise.all([
    getPublicClinicAction(tenantSlug),
    getPublicServicesAction(tenantSlug),
  ])

  const clinic = clinicRes.data
  const services = servicesRes.data || []

  return (
    <main className='container mx-auto px-4 py-8 space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold'>خدمات {clinic?.clinicName || tenantSlug}</h1>
          <p className='text-sm text-muted-foreground'>أسعار الخدمات المتاحة للحجز</p>
        </div>
        <Link
          href={`/${tenantSlug}`}
          className='h-10 px-4 rounded-md border border-input text-sm inline-flex items-center'
        >
          الرجوع للرئيسية
        </Link>
      </div>

      {services.length === 0 ? (
        <Card className='rounded-2xl p-8 text-center text-muted-foreground'>
          لا توجد خدمات منشورة حالياً.
        </Card>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3'>
          {services.map((service) => (
            <Card key={service.id} className='rounded-2xl p-4 border-border/50'>
              <p className='text-sm font-bold'>{service.serviceName}</p>
              <p className='text-xs text-muted-foreground mt-1'>
                {service.durationMinutes || '-'} دقيقة
              </p>
              <p className='text-lg font-bold mt-3'>{service.price.toLocaleString('ar-EG')} ج.م</p>
            </Card>
          ))}
        </div>
      )}
    </main>
  )
}
