import { getPublicClinicAction, getPublicPaymentOptionsAction } from '@/actions/public/landing'
import { Card } from '@/components/ui/card'
import Link from 'next/link'

interface Props {
  params: Promise<{ tenantSlug: string }>
}

export default async function PublicPaymentOptionsPage({ params }: Props) {
  const { tenantSlug } = await params

  const [clinicRes, optionsRes] = await Promise.all([
    getPublicClinicAction(tenantSlug),
    getPublicPaymentOptionsAction(tenantSlug),
  ])

  const clinic = clinicRes.data
  const options = optionsRes.data
  const methods = options?.methods || []

  return (
    <main className='container mx-auto px-4 py-8 space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold'>خيارات الدفع - {clinic?.clinicName || tenantSlug}</h1>
          <p className='text-sm text-muted-foreground'>طرق الدفع المتاحة للمرضى</p>
        </div>
        <Link
          href={`/${tenantSlug}`}
          className='h-10 px-4 rounded-md border border-input text-sm inline-flex items-center'
        >
          الرجوع للرئيسية
        </Link>
      </div>

      {methods.length === 0 ? (
        <Card className='rounded-2xl p-8 text-center text-muted-foreground'>
          لا توجد طرق دفع منشورة حالياً.
        </Card>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
          {methods.map((method) => (
            <Card key={method.id} className='rounded-2xl border-border/50 p-4 space-y-2'>
              <div className='flex items-center justify-between'>
                <p className='font-bold'>{method.methodName}</p>
                <span className='text-xs text-muted-foreground'>ترتيب {method.displayOrder}</span>
              </div>

              {method.providerName && (
                <p className='text-sm text-muted-foreground'>المزود: {method.providerName}</p>
              )}
              {method.accountName && (
                <p className='text-sm text-muted-foreground'>اسم الحساب: {method.accountName}</p>
              )}
              {method.accountNumber && (
                <p className='text-sm text-muted-foreground'>رقم الحساب: {method.accountNumber}</p>
              )}
              {method.iban && <p className='text-sm text-muted-foreground'>IBAN: {method.iban}</p>}
              {method.walletNumber && (
                <p className='text-sm text-muted-foreground'>المحفظة: {method.walletNumber}</p>
              )}
              {method.instructions && <p className='text-sm'>{method.instructions}</p>}
            </Card>
          ))}
        </div>
      )}
    </main>
  )
}
