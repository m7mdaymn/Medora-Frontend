'use client'

import {
  createPartnerServiceAction,
  listPartnerServicesAction,
  updatePartnerServiceAction,
} from '@/actions/partner/workflow'
import { DashboardHeader, DashboardShell } from '@/components/shell'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { IPartnerServiceCatalogItem } from '@/types/partner'
import { Pencil, Save, Wrench, X } from 'lucide-react'
import { useParams } from 'next/navigation'
import { FormEvent, useMemo, useState } from 'react'
import { toast } from 'sonner'
import useSWR from 'swr'

export default function ContractorServicesPage() {
  const params = useParams()
  const tenantSlug = params.tenantSlug as string

  const { data: servicesRes, isLoading, mutate } = useSWR(['contractor-services', tenantSlug], () =>
    listPartnerServicesAction(tenantSlug, { activeOnly: false }),
  )

  const services = useMemo(() => servicesRes?.data ?? [], [servicesRes?.data])
  const defaultPartnerId = useMemo(() => services[0]?.partnerId || '', [services])

  const [editingServiceId, setEditingServiceId] = useState<string | null>(null)
  const [partnerIdInput, setPartnerIdInput] = useState('')
  const [branchId, setBranchId] = useState('')
  const [serviceName, setServiceName] = useState('')
  const [price, setPrice] = useState('')
  const [settlementTarget, setSettlementTarget] = useState<'Doctor' | 'Clinic'>('Clinic')
  const [settlementPercentage, setSettlementPercentage] = useState('')
  const [clinicDoctorSharePercentage, setClinicDoctorSharePercentage] = useState('')
  const [patientDiscountPercentage, setPatientDiscountPercentage] = useState('')
  const [doctorFixedPayoutAmount, setDoctorFixedPayoutAmount] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const resetForm = () => {
    setEditingServiceId(null)
    setPartnerIdInput('')
    setBranchId('')
    setServiceName('')
    setPrice('')
    setSettlementTarget('Clinic')
    setSettlementPercentage('')
    setClinicDoctorSharePercentage('')
    setPatientDiscountPercentage('')
    setDoctorFixedPayoutAmount('')
    setIsActive(true)
  }

  const startEdit = (service: IPartnerServiceCatalogItem) => {
    setEditingServiceId(service.id)
    setPartnerIdInput(service.partnerId)
    setBranchId(service.branchId || '')
    setServiceName(service.serviceName)
    setPrice(String(service.price))
    setSettlementTarget(service.settlementTarget === 'Doctor' ? 'Doctor' : 'Clinic')
    setSettlementPercentage(String(service.settlementPercentage))
    setClinicDoctorSharePercentage(
      service.clinicDoctorSharePercentage !== null
        ? String(service.clinicDoctorSharePercentage)
        : '',
    )
    setPatientDiscountPercentage(
      service.patientDiscountPercentage !== null ? String(service.patientDiscountPercentage) : '',
    )
    setDoctorFixedPayoutAmount(
      service.doctorFixedPayoutAmount !== null ? String(service.doctorFixedPayoutAmount) : '',
    )
    setIsActive(service.isActive)
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()

    const parsedPrice = Number(price)
    const parsedSettlementPercentage = Number(settlementPercentage)
    const parsedClinicDoctorShare =
      clinicDoctorSharePercentage.trim().length > 0 ? Number(clinicDoctorSharePercentage) : undefined
    const parsedPatientDiscount =
      patientDiscountPercentage.trim().length > 0 ? Number(patientDiscountPercentage) : undefined
    const parsedDoctorFixedPayout =
      doctorFixedPayoutAmount.trim().length > 0 ? Number(doctorFixedPayoutAmount) : undefined

    if (!serviceName.trim()) {
      toast.error('اسم الخدمة مطلوب')
      return
    }

    if (Number.isNaN(parsedPrice) || parsedPrice <= 0) {
      toast.error('سعر الخدمة غير صحيح')
      return
    }

    if (Number.isNaN(parsedSettlementPercentage) || parsedSettlementPercentage <= 0) {
      toast.error('نسبة التسوية غير صحيحة')
      return
    }

    if (parsedClinicDoctorShare !== undefined && Number.isNaN(parsedClinicDoctorShare)) {
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
      toast.error('المبلغ الثابت للطبيب غير صحيح')
      return
    }

    setIsSubmitting(true)
    try {
      const partnerIdForRequest = partnerIdInput.trim() || defaultPartnerId

      const response = editingServiceId
        ? await updatePartnerServiceAction(tenantSlug, editingServiceId, {
            branchId: branchId.trim() || undefined,
            serviceName: serviceName.trim(),
            price: parsedPrice,
            settlementTarget,
            settlementPercentage: parsedSettlementPercentage,
            clinicDoctorSharePercentage:
              settlementTarget === 'Clinic' ? parsedClinicDoctorShare : undefined,
            patientDiscountPercentage: parsedPatientDiscount,
            doctorFixedPayoutAmount: parsedDoctorFixedPayout,
            isActive,
          })
        : await createPartnerServiceAction(tenantSlug, {
            partnerId: partnerIdForRequest,
            branchId: branchId.trim() || undefined,
            serviceName: serviceName.trim(),
            price: parsedPrice,
            settlementTarget,
            settlementPercentage: parsedSettlementPercentage,
            clinicDoctorSharePercentage:
              settlementTarget === 'Clinic' ? parsedClinicDoctorShare : undefined,
            patientDiscountPercentage: parsedPatientDiscount,
            doctorFixedPayoutAmount: parsedDoctorFixedPayout,
          })

      if (!editingServiceId && !partnerIdForRequest) {
        toast.error('Partner ID مطلوب لإنشاء خدمة جديدة')
        return
      }

      if (!response.success) {
        toast.error(response.message || 'فشل حفظ الخدمة')
        return
      }

      resetForm()
      await mutate()
      toast.success(editingServiceId ? 'تم تعديل الخدمة بنجاح' : 'تم إضافة الخدمة بنجاح')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <DashboardShell>
      <DashboardHeader
        heading='دليل خدمات المتعاقد'
        text='حدد سعر كل خدمة وآلية توزيع النسبة بين الطبيب والعيادة'
      />

      {editingServiceId && (
        <Card className='rounded-2xl border-amber-300 bg-amber-50/40 p-3 text-sm flex items-center justify-between gap-3'>
          <span>وضع التعديل مفعل</span>
          <Button type='button' variant='outline' size='sm' onClick={resetForm} className='gap-1'>
            <X className='w-3.5 h-3.5' />
            إلغاء التعديل
          </Button>
        </Card>
      )}

      <Card className='rounded-2xl border-border/50 p-4'>
        <form onSubmit={onSubmit} className='grid grid-cols-1 md:grid-cols-2 gap-3'>
          <div className='space-y-2 md:col-span-2'>
            <Label>Partner ID</Label>
            <Input
              value={partnerIdInput}
              onChange={(e) => setPartnerIdInput(e.target.value)}
              placeholder={defaultPartnerId || 'GUID للشريك'}
              disabled={Boolean(editingServiceId)}
            />
          </div>

          <div className='space-y-2'>
            <Label>Branch ID (اختياري)</Label>
            <Input value={branchId} onChange={(e) => setBranchId(e.target.value)} />
          </div>

          <div className='space-y-2'>
            <Label>اسم الخدمة</Label>
            <Input
              value={serviceName}
              onChange={(e) => setServiceName(e.target.value)}
              placeholder='مثال: CBC + ESR'
            />
          </div>

          <div className='space-y-2'>
            <Label>سعر الخدمة</Label>
            <Input value={price} onChange={(e) => setPrice(e.target.value)} placeholder='900' />
          </div>

          <div className='space-y-2'>
            <Label>النسبة تذهب إلى</Label>
            <select
              className='w-full h-10 rounded-md border border-input bg-background px-3 text-sm'
              value={settlementTarget}
              onChange={(e) => setSettlementTarget(e.target.value as 'Doctor' | 'Clinic')}
            >
              <option value='Clinic'>العيادة</option>
              <option value='Doctor'>الطبيب مباشرة</option>
            </select>
          </div>

          <div className='space-y-2'>
            <Label>نسبة التسوية (%)</Label>
            <Input
              value={settlementPercentage}
              onChange={(e) => setSettlementPercentage(e.target.value)}
              placeholder='50'
            />
          </div>

          {settlementTarget === 'Clinic' && (
            <div className='space-y-2'>
              <Label>نسبة الطبيب من حصة العيادة (%)</Label>
              <Input
                value={clinicDoctorSharePercentage}
                onChange={(e) => setClinicDoctorSharePercentage(e.target.value)}
                placeholder='20 (اختياري)'
              />
            </div>
          )}

          <div className='space-y-2'>
            <Label>خصم المريض (%)</Label>
            <Input
              value={patientDiscountPercentage}
              onChange={(e) => setPatientDiscountPercentage(e.target.value)}
              placeholder='10 (اختياري)'
            />
          </div>

          <div className='space-y-2'>
            <Label>مبلغ ثابت للطبيب</Label>
            <Input
              value={doctorFixedPayoutAmount}
              onChange={(e) => setDoctorFixedPayoutAmount(e.target.value)}
              placeholder='50 (اختياري)'
            />
          </div>

          {editingServiceId && (
            <label className='inline-flex items-center gap-2 text-sm'>
              <input
                type='checkbox'
                checked={isActive}
                onChange={(event) => setIsActive(event.target.checked)}
              />
              الخدمة نشطة
            </label>
          )}

          <div className='md:col-span-2 flex items-center gap-2'>
            <Button type='submit' disabled={isSubmitting} className='gap-2'>
              <Save className='w-4 h-4' />
              {editingServiceId ? 'حفظ التعديل' : 'حفظ الخدمة'}
            </Button>
            {editingServiceId && (
              <Button type='button' variant='outline' onClick={resetForm}>
                إلغاء
              </Button>
            )}
          </div>
        </form>
      </Card>

      {isLoading ? (
        <div className='space-y-3'>
          <Skeleton className='h-20 w-full rounded-xl' />
          <Skeleton className='h-20 w-full rounded-xl' />
        </div>
      ) : services.length === 0 ? (
        <Card className='rounded-2xl p-10 text-center text-muted-foreground'>
          لا توجد خدمات مضافة حالياً.
        </Card>
      ) : (
        <div className='grid gap-3'>
          {services.map((service: IPartnerServiceCatalogItem) => (
            <Card key={service.id} className='rounded-2xl border-border/50 p-4'>
              <div className='flex items-start justify-between gap-3'>
                <div>
                  <p className='font-bold'>{service.serviceName}</p>
                  <p className='text-xs text-muted-foreground'>{service.partnerName}</p>
                </div>
                <Badge variant={service.isActive ? 'default' : 'outline'}>
                  {service.isActive ? 'نشط' : 'موقوف'}
                </Badge>
              </div>

              <div className='mt-3 grid gap-1 text-xs text-muted-foreground'>
                <p>السعر: {service.price} ج.م</p>
                <p>
                  التوزيع: {service.settlementTarget === 'Doctor' ? 'إلى الطبيب مباشرة' : 'إلى العيادة'} ({' '}
                  {service.settlementPercentage}% )
                </p>
                {service.settlementTarget === 'Clinic' && service.clinicDoctorSharePercentage !== null && (
                  <p>حصة الطبيب من حصة العيادة: {service.clinicDoctorSharePercentage}%</p>
                )}
                {service.patientDiscountPercentage !== null && (
                  <p>خصم المريض: {service.patientDiscountPercentage}%</p>
                )}
                {service.doctorFixedPayoutAmount !== null && (
                  <p>مبلغ ثابت للطبيب: {service.doctorFixedPayoutAmount} ج.م</p>
                )}
              </div>

              <div className='mt-3'>
                <Button type='button' size='sm' variant='outline' onClick={() => startEdit(service)} className='gap-1'>
                  <Pencil className='w-3.5 h-3.5' />
                  تعديل
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Card className='rounded-2xl border-dashed p-4 text-xs text-muted-foreground flex items-start gap-2'>
        <Wrench className='w-4 h-4 mt-0.5' />
        <span>
          في حال ارتباط حسابك بأكثر من شريك، سيطلب النظام تحديد partnerId أثناء إنشاء الخدمة. هذه النسخة تُبسّط الإدخال
          للحالة الأكثر شيوعاً (شريك واحد لكل حساب متعاقد).
        </span>
      </Card>
    </DashboardShell>
  )
}
