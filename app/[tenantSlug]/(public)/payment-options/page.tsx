import {
  getPublicClinicAction,
  getPublicLandingAction,
  getPublicPaymentOptionsAction,
} from '@/actions/public/landing'
import { Card } from '@/components/ui/card'
import Link from 'next/link'

interface Props {
  params: Promise<{ tenantSlug: string }>
  searchParams: Promise<{ branchId?: string }>
}

export default async function PublicPaymentOptionsPage({ params, searchParams }: Props) {
  const { tenantSlug } = await params
  const { branchId } = await searchParams

  const [clinicRes, landingRes, optionsRes] = await Promise.all([
    getPublicClinicAction(tenantSlug),
    getPublicLandingAction(tenantSlug),
    getPublicPaymentOptionsAction(tenantSlug, branchId),
  ])

  const clinic = clinicRes.data
  const branches = landingRes.data?.branches || []
  const options = optionsRes.data
  const methods = options?.methods || []

  const selectedBranchName = branchId
    ? branches.find((branch) => branch.id === branchId)?.name || 'الفرع المحدد'
    : 'كل الفروع'

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

      {branches.length > 0 && (
        <Card className='rounded-2xl border-border/50 p-4 space-y-3'>
          <div className='text-sm font-semibold'>تصفية طرق الدفع حسب الفرع</div>
          <div className='flex flex-wrap gap-2'>
            <Link
              href={`/${tenantSlug}/payment-options`}
              className={`inline-flex h-9 items-center rounded-md border px-3 text-sm ${
                !branchId ? 'bg-primary text-primary-foreground border-primary' : 'border-input'
              }`}
            >
              كل الفروع
            </Link>
            {branches.map((branch) => (
              <Link
                key={branch.id}
                href={`/${tenantSlug}/payment-options?branchId=${branch.id}`}
                className={`inline-flex h-9 items-center rounded-md border px-3 text-sm ${
                  branchId === branch.id ? 'bg-primary text-primary-foreground border-primary' : 'border-input'
                }`}
              >
                {branch.name}
              </Link>
            ))}
          </div>
          <p className='text-xs text-muted-foreground'>العرض الحالي: {selectedBranchName}</p>
        </Card>
      )}

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

              <p className='text-xs text-muted-foreground'>
                النطاق: {method.branchName || 'متاح لكل الفروع'}
              </p>

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
