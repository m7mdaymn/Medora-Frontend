'use client'

import { useEffect, useMemo, useState } from 'react'
import { Handshake, Loader2, Percent } from 'lucide-react'
import { useParams } from 'next/navigation'
import useSWR from 'swr'
import { toast } from 'sonner'

import {
  listPartnerServicesAction,
  listPartnersAction,
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

export default function ContractsPage() {
  const params = useParams()
  const tenantSlug = params.tenantSlug as string

  const [search, setSearch] = useState('')
  const [selectedServiceId, setSelectedServiceId] = useState<string>('')
  const [doctorShare, setDoctorShare] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const { data: partnersRes } = useSWR(['partners', tenantSlug], () =>
    listPartnersAction(tenantSlug, {
      activeOnly: true,
      pageNumber: 1,
      pageSize: 200,
    }),
  )

  const {
    data: servicesRes,
    isLoading,
    mutate,
  } = useSWR(['partner-services', tenantSlug], () => listPartnerServicesAction(tenantSlug, { activeOnly: true }))

  const partners = useMemo(() => partnersRes?.data?.items ?? [], [partnersRes?.data?.items])
  const services = useMemo(() => servicesRes?.data ?? [], [servicesRes?.data])

  const filteredServices = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return services

    return services.filter((item) => {
      return (
        item.serviceName.toLowerCase().includes(term) ||
        item.partnerName.toLowerCase().includes(term) ||
        item.settlementTarget.toLowerCase().includes(term)
      )
    })
  }, [search, services])

  const selectedService = useMemo(
    () => services.find((item) => item.id === selectedServiceId) ?? null,
    [selectedServiceId, services],
  )

  useEffect(() => {
    if (!selectedServiceId && filteredServices.length > 0) {
      setSelectedServiceId(filteredServices[0].id)
    }
  }, [filteredServices, selectedServiceId])

  useEffect(() => {
    if (!selectedService) {
      setDoctorShare('')
      return
    }

    const currentShare = selectedService.clinicDoctorSharePercentage
    setDoctorShare(currentShare === null ? '' : String(currentShare))
  }, [selectedService])

  const onSaveDoctorShare = async () => {
    if (!selectedService) {
      toast.error('اختر خدمة أولاً')
      return
    }

    if (selectedService.settlementTarget !== 'Clinic') {
      toast.error('يمكن تعديل نسبة الطبيب فقط عندما تكون التسوية لصالح العيادة')
      return
    }

    const parsedShare = doctorShare.trim() ? Number(doctorShare) : undefined

    if (parsedShare !== undefined && (Number.isNaN(parsedShare) || parsedShare < 0 || parsedShare > 100)) {
      toast.error('نسبة الطبيب يجب أن تكون بين 0 و100')
      return
    }

    setIsSaving(true)
    try {
      const response = await updatePartnerServiceAction(tenantSlug, selectedService.id, {
        branchId: selectedService.branchId || undefined,
        serviceName: selectedService.serviceName,
        price: selectedService.price,
        settlementTarget: selectedService.settlementTarget,
        settlementPercentage: selectedService.settlementPercentage,
        clinicDoctorSharePercentage: parsedShare,
        patientDiscountPercentage: selectedService.patientDiscountPercentage ?? undefined,
        doctorFixedPayoutAmount: selectedService.doctorFixedPayoutAmount ?? undefined,
        isActive: selectedService.isActive,
        notes: selectedService.notes || undefined,
      })

      if (!response.success) {
        toast.error(response.message || 'تعذر حفظ نسبة الطبيب')
        return
      }

      toast.success('تم تحديث نسبة الطبيب بنجاح')
      await mutate()
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <DashboardShell>
      <DashboardHeader
        heading='سوق خدمات الشركاء'
        text='عرض موحد لكل خدمات الشركاء مع تحديد نسبة الطبيب من النسبة المتفق عليها.'
      />

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-3'>
        <Card className='rounded-2xl border-border/50 p-4'>
          <p className='text-xs text-muted-foreground'>إجمالي الشركاء النشطين</p>
          <p className='text-2xl font-bold mt-1'>{partners.length}</p>
        </Card>

        <Card className='rounded-2xl border-border/50 p-4'>
          <p className='text-xs text-muted-foreground'>الخدمات النشطة</p>
          <p className='text-2xl font-bold mt-1'>{services.length}</p>
        </Card>

        <Card className='rounded-2xl border-border/50 p-4'>
          <p className='text-xs text-muted-foreground'>خدمات بتسوية لصالح العيادة</p>
          <p className='text-2xl font-bold mt-1'>
            {services.filter((item) => item.settlementTarget === 'Clinic').length}
          </p>
        </Card>
      </div>

      <div className='grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-4'>
        <Card className='rounded-2xl border-border/50 p-4 space-y-3'>
          <div className='flex items-center gap-2'>
            <Handshake className='w-4 h-4 text-primary' />
            <h3 className='font-bold'>كل خدمات الشركاء</h3>
          </div>

          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder='ابحث باسم الخدمة أو الشريك'
          />

          {isLoading ? (
            <div className='space-y-2'>
              <Skeleton className='h-20 w-full rounded-xl' />
              <Skeleton className='h-20 w-full rounded-xl' />
            </div>
          ) : filteredServices.length === 0 ? (
            <div className='rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground'>
              لا توجد خدمات مطابقة للبحث.
            </div>
          ) : (
            <div className='space-y-2 max-h-[70vh] overflow-y-auto'>
              {filteredServices.map((item: IPartnerServiceCatalogItem) => (
                <button
                  key={item.id}
                  type='button'
                  onClick={() => setSelectedServiceId(item.id)}
                  className={`w-full rounded-xl border p-3 text-right transition ${
                    selectedServiceId === item.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border/50 hover:border-primary/50'
                  }`}
                >
                  <div className='flex items-center justify-between gap-2'>
                    <p className='text-sm font-bold'>{item.serviceName}</p>
                    <Badge variant='outline'>{item.partnerName}</Badge>
                  </div>

                  <div className='mt-2 text-xs text-muted-foreground space-y-1'>
                    <p>السعر: {item.price} ج.م</p>
                    <p>
                      النسبة الأساسية: {item.settlementPercentage}% ({' '}
                      {item.settlementTarget === 'Clinic' ? 'لصالح العيادة' : 'لصالح الطبيب'})
                    </p>
                    <p>
                      نسبة الطبيب الحالية: {item.clinicDoctorSharePercentage ?? 0}%
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </Card>

        <Card className='rounded-2xl border-border/50 p-4 space-y-4'>
          <div className='flex items-center gap-2'>
            <Percent className='w-4 h-4 text-primary' />
            <h3 className='font-bold'>تحديد نسبة الطبيب</h3>
          </div>

          {!selectedService ? (
            <div className='rounded-xl border border-dashed p-6 text-sm text-muted-foreground'>
              اختر خدمة من القائمة لعرض تفاصيل النسبة.
            </div>
          ) : (
            <>
              <div className='rounded-xl border border-border/60 p-3 space-y-1'>
                <p className='text-sm font-bold'>{selectedService.serviceName}</p>
                <p className='text-xs text-muted-foreground'>الشريك: {selectedService.partnerName}</p>
                <p className='text-xs text-muted-foreground'>
                  النسبة الأساسية من الشريك: {selectedService.settlementPercentage}%
                </p>
                <p className='text-xs text-muted-foreground'>
                  نوع التسوية: {selectedService.settlementTarget === 'Clinic' ? 'لصالح العيادة' : 'لصالح الطبيب'}
                </p>
              </div>

              <div className='space-y-2'>
                <Label>نسبة الطبيب من حصة العيادة (%)</Label>
                <Input
                  value={doctorShare}
                  onChange={(event) => setDoctorShare(event.target.value)}
                  placeholder='مثال: 30'
                  disabled={selectedService.settlementTarget !== 'Clinic'}
                />
                {selectedService.settlementTarget !== 'Clinic' && (
                  <p className='text-xs text-muted-foreground'>
                    هذه الخدمة مضبوطة على تسوية مباشرة للطبيب، لذلك لا يوجد نسبة فرعية للعيادة.
                  </p>
                )}
              </div>

              <Button
                onClick={onSaveDoctorShare}
                disabled={isSaving || selectedService.settlementTarget !== 'Clinic'}
                className='w-full'
              >
                {isSaving ? <Loader2 className='w-4 h-4 animate-spin' /> : 'حفظ نسبة الطبيب'}
              </Button>
            </>
          )}
        </Card>
      </div>
    </DashboardShell>
  )
}
