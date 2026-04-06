'use client'

import {
  createPartnerServiceAction,
  createPartnerUserAction,
  listPartnerServicesAction,
  listPartnersAction,
} from '@/actions/partner/workflow'
import { DashboardHeader, DashboardShell } from '@/components/shell'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { IPartnerServiceCatalogItem } from '@/types/partner'
import { Handshake, Plus, UserPlus } from 'lucide-react'
import { useParams } from 'next/navigation'
import { FormEvent, useMemo, useState } from 'react'
import { toast } from 'sonner'
import useSWR from 'swr'

export default function ContractsPage() {
  const params = useParams()
  const tenantSlug = params.tenantSlug as string

  const { data: partnersRes, isLoading: partnersLoading } = useSWR(['partners', tenantSlug], () =>
    listPartnersAction(tenantSlug, {
      activeOnly: true,
      pageNumber: 1,
      pageSize: 200,
    }),
  )

  const {
    data: servicesRes,
    isLoading: servicesLoading,
    mutate: mutateServices,
  } = useSWR(['partner-services', tenantSlug], () => listPartnerServicesAction(tenantSlug, { activeOnly: false }))

  const partners = useMemo(() => partnersRes?.data?.items ?? [], [partnersRes?.data?.items])
  const services = servicesRes?.data || []
  const defaultPartnerId = useMemo(() => partners[0]?.id || '', [partners])

  const [selectedPartnerId, setSelectedPartnerId] = useState('')
  const [serviceName, setServiceName] = useState('')
  const [price, setPrice] = useState('')
  const [settlementTarget, setSettlementTarget] = useState<'Doctor' | 'Clinic'>('Clinic')
  const [settlementPercentage, setSettlementPercentage] = useState('')
  const [clinicDoctorShare, setClinicDoctorShare] = useState('')
  const [patientDiscount, setPatientDiscount] = useState('')
  const [doctorFixedPayout, setDoctorFixedPayout] = useState('')
  const [serviceSaving, setServiceSaving] = useState(false)

  const [userPartnerId, setUserPartnerId] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [phone, setPhone] = useState('')
  const [userSaving, setUserSaving] = useState(false)

  const targetPartnerForService = selectedPartnerId || defaultPartnerId
  const targetPartnerForUser = userPartnerId || defaultPartnerId

  const onCreateService = async (e: FormEvent) => {
    e.preventDefault()

    const parsedPrice = Number(price)
    const parsedSettlementPercentage = Number(settlementPercentage)
    const parsedDoctorShare = clinicDoctorShare.trim() ? Number(clinicDoctorShare) : undefined
    const parsedPatientDiscount = patientDiscount.trim() ? Number(patientDiscount) : undefined
    const parsedDoctorFixedPayout = doctorFixedPayout.trim() ? Number(doctorFixedPayout) : undefined

    if (!targetPartnerForService) {
      toast.error('لا يوجد شريك متاح للاختيار')
      return
    }

    if (!serviceName.trim() || Number.isNaN(parsedPrice) || parsedPrice <= 0) {
      toast.error('تأكد من اسم الخدمة والسعر')
      return
    }

    if (Number.isNaN(parsedSettlementPercentage) || parsedSettlementPercentage <= 0) {
      toast.error('نسبة التسوية غير صحيحة')
      return
    }

    if (parsedDoctorShare !== undefined && Number.isNaN(parsedDoctorShare)) {
      toast.error('نسبة الطبيب من حصة العيادة غير صحيحة')
      return
    }

    if (
      parsedPatientDiscount !== undefined &&
      (Number.isNaN(parsedPatientDiscount) || parsedPatientDiscount < 0 || parsedPatientDiscount > 100)
    ) {
      toast.error('نسبة خصم المريض يجب أن تكون بين 0 و100')
      return
    }

    if (parsedDoctorFixedPayout !== undefined && (Number.isNaN(parsedDoctorFixedPayout) || parsedDoctorFixedPayout < 0)) {
      toast.error('قيمة المبلغ الثابت للطبيب غير صحيحة')
      return
    }

    setServiceSaving(true)
    try {
      const partnerIdForRequest =
        targetPartnerForService || '00000000-0000-0000-0000-000000000000'

      const response = await createPartnerServiceAction(tenantSlug, {
        partnerId: partnerIdForRequest,
        serviceName: serviceName.trim(),
        price: parsedPrice,
        settlementTarget,
        settlementPercentage: parsedSettlementPercentage,
        clinicDoctorSharePercentage: settlementTarget === 'Clinic' ? parsedDoctorShare : undefined,
        patientDiscountPercentage: parsedPatientDiscount,
        doctorFixedPayoutAmount: parsedDoctorFixedPayout,
      })

      if (!response.success) {
        toast.error(response.message || 'فشل إنشاء الخدمة')
        return
      }

      toast.success('تم إنشاء خدمة الشريك بنجاح')
      setServiceName('')
      setPrice('')
      setSettlementPercentage('')
      setClinicDoctorShare('')
      setPatientDiscount('')
      setDoctorFixedPayout('')
      await mutateServices()
    } finally {
      setServiceSaving(false)
    }
  }

  const onCreateContractorUser = async (e: FormEvent) => {
    e.preventDefault()

    if (!targetPartnerForUser) {
      toast.error('اختر شريكاً لإنشاء حساب المتعاقد')
      return
    }

    if (!username.trim() || !password.trim() || !displayName.trim()) {
      toast.error('الاسم واسم المستخدم وكلمة المرور مطلوبة')
      return
    }

    setUserSaving(true)
    try {
      const response = await createPartnerUserAction(tenantSlug, targetPartnerForUser, {
        username: username.trim(),
        password: password.trim(),
        displayName: displayName.trim(),
        phone: phone.trim() || undefined,
        isPrimary: true,
      })

      if (!response.success) {
        toast.error(response.message || 'فشل إنشاء حساب المتعاقد')
        return
      }

      toast.success('تم إنشاء حساب المتعاقد بنجاح')
      setUsername('')
      setPassword('')
      setDisplayName('')
      setPhone('')
    } finally {
      setUserSaving(false)
    }
  }

  return (
    <DashboardShell>
      <DashboardHeader
        heading='تعاقدات الشركاء'
        text='إدارة خدمات الشريك وربط حسابات المتعاقدين الخارجيين'
      />

      <div className='grid grid-cols-1 xl:grid-cols-2 gap-4'>
        <Card className='rounded-2xl border-border/50 p-4'>
          <div className='flex items-center gap-2 mb-4'>
            <Handshake className='w-4 h-4 text-primary' />
            <h3 className='font-bold'>إضافة خدمة شريك</h3>
          </div>

          <form onSubmit={onCreateService} className='space-y-3'>
            <div className='space-y-2'>
              <Label>الشريك</Label>
              <select
                className='w-full h-10 rounded-md border border-input bg-background px-3 text-sm'
                value={selectedPartnerId}
                onChange={(e) => setSelectedPartnerId(e.target.value)}
              >
                <option value=''>اختر الشريك</option>
                {partners.map((partner) => (
                  <option key={partner.id} value={partner.id}>
                    {partner.name}
                  </option>
                ))}
              </select>
            </div>

            <div className='space-y-2'>
              <Label>اسم الخدمة</Label>
              <Input value={serviceName} onChange={(e) => setServiceName(e.target.value)} />
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
              <div className='space-y-2'>
                <Label>السعر</Label>
                <Input value={price} onChange={(e) => setPrice(e.target.value)} />
              </div>

              <div className='space-y-2'>
                <Label>النسبة (%)</Label>
                <Input
                  value={settlementPercentage}
                  onChange={(e) => setSettlementPercentage(e.target.value)}
                />
              </div>
            </div>

            <div className='space-y-2'>
              <Label>التسوية تذهب إلى</Label>
              <select
                className='w-full h-10 rounded-md border border-input bg-background px-3 text-sm'
                value={settlementTarget}
                onChange={(e) => setSettlementTarget(e.target.value as 'Doctor' | 'Clinic')}
              >
                <option value='Clinic'>العيادة</option>
                <option value='Doctor'>الطبيب</option>
              </select>
            </div>

            {settlementTarget === 'Clinic' && (
              <div className='space-y-2'>
                <Label>نسبة الطبيب من حصة العيادة (%)</Label>
                <Input
                  value={clinicDoctorShare}
                  onChange={(e) => setClinicDoctorShare(e.target.value)}
                />
              </div>
            )}

            <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
              <div className='space-y-2'>
                <Label>خصم المريض (%)</Label>
                <Input
                  value={patientDiscount}
                  onChange={(e) => setPatientDiscount(e.target.value)}
                  placeholder='مثال: 10'
                />
              </div>

              <div className='space-y-2'>
                <Label>مبلغ ثابت للطبيب (اختياري)</Label>
                <Input
                  value={doctorFixedPayout}
                  onChange={(e) => setDoctorFixedPayout(e.target.value)}
                  placeholder='مثال: 50'
                />
              </div>
            </div>

            <Button type='submit' disabled={serviceSaving} className='gap-2'>
              <Plus className='w-4 h-4' />
              إضافة خدمة
            </Button>
          </form>
        </Card>

        <Card className='rounded-2xl border-border/50 p-4'>
          <div className='flex items-center gap-2 mb-4'>
            <UserPlus className='w-4 h-4 text-primary' />
            <h3 className='font-bold'>إنشاء حساب متعاقد</h3>
          </div>

          <form onSubmit={onCreateContractorUser} className='space-y-3'>
            <div className='space-y-2'>
              <Label>الشريك</Label>
              <select
                className='w-full h-10 rounded-md border border-input bg-background px-3 text-sm'
                value={userPartnerId}
                onChange={(e) => setUserPartnerId(e.target.value)}
              >
                <option value=''>اختر الشريك</option>
                {partners.map((partner) => (
                  <option key={partner.id} value={partner.id}>
                    {partner.name}
                  </option>
                ))}
              </select>
            </div>

            <div className='space-y-2'>
              <Label>الاسم الظاهر</Label>
              <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            </div>

            <div className='space-y-2'>
              <Label>اسم المستخدم</Label>
              <Input value={username} onChange={(e) => setUsername(e.target.value)} />
            </div>

            <div className='space-y-2'>
              <Label>كلمة المرور</Label>
              <Input
                type='password'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className='space-y-2'>
              <Label>رقم الهاتف (اختياري)</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>

            <Button type='submit' disabled={userSaving} className='gap-2'>
              <UserPlus className='w-4 h-4' />
              إنشاء الحساب
            </Button>
          </form>
        </Card>
      </div>

      <Separator />

      <div className='space-y-3'>
        <h3 className='font-bold'>الخدمات المسجلة</h3>

        {partnersLoading || servicesLoading ? (
          <div className='space-y-2'>
            <Skeleton className='h-20 w-full rounded-xl' />
            <Skeleton className='h-20 w-full rounded-xl' />
          </div>
        ) : services.length === 0 ? (
          <Card className='rounded-2xl p-8 text-center text-muted-foreground'>
            لا توجد خدمات شركاء حتى الآن.
          </Card>
        ) : (
          <div className='grid gap-2'>
            {services.map((service: IPartnerServiceCatalogItem) => (
              <Card key={service.id} className='rounded-xl p-3 border-border/40'>
                <div className='flex items-center justify-between gap-2'>
                  <div>
                    <p className='text-sm font-bold'>{service.serviceName}</p>
                    <p className='text-xs text-muted-foreground'>{service.partnerName}</p>
                  </div>
                  <Badge variant={service.isActive ? 'default' : 'outline'}>
                    {service.isActive ? 'نشط' : 'موقوف'}
                  </Badge>
                </div>
                <div className='mt-2 text-xs text-muted-foreground space-y-1'>
                  <p>السعر: {service.price} ج.م</p>
                  <p>
                    التوزيع: {service.settlementTarget === 'Doctor' ? 'إلى الطبيب' : 'إلى العيادة'} ({' '}
                    {service.settlementPercentage}% )
                  </p>
                  {service.patientDiscountPercentage !== null && (
                    <p>خصم المريض: {service.patientDiscountPercentage}%</p>
                  )}
                  {service.doctorFixedPayoutAmount !== null && (
                    <p>مبلغ ثابت للطبيب: {service.doctorFixedPayoutAmount} ج.م</p>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  )
}
