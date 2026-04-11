'use client'

import {
  listPartnerContractsAction,
  listPartnersAction,
  listPartnerServicesAction,
} from '@/actions/partner/workflow'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { IPrescription, IVisit } from '@/types/visit'
import { valibotResolver } from '@hookform/resolvers/valibot'
import { AnimatePresence, motion } from 'framer-motion'
import { ExternalLink, Loader2, Pill, Plus, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import useSWR from 'swr'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

import { createPrescriptionAction } from '../../../../../../actions/prescription/create-prescription'
import { createPrescriptionPartnerOrderAction } from '../../../../../../actions/prescription/create-prescription-partner-order'
import { deletePrescriptionAction } from '../../../../../../actions/prescription/delete-prescription'
import {
  PrescriptionFormInput,
  prescriptionSchema,
} from '../../../../../../validation/prescription'

interface PrescriptionTabProps {
  visit: IVisit
  tenantSlug: string
  isClosed?: boolean
}

// تعريف الاختيارات السريعة
const quickChips = {
  dosage: ['قرص', 'نصف قرص', 'ملعقة', 'بخة', 'دهان'],
  frequency: ['مرة يومياً', 'كل 12 ساعة', 'كل 8 ساعات', 'عند اللزوم'],
  duration: ['أسبوع', '5 أيام', '10 أيام', 'شهر'],
}

export function PrescriptionTab({ visit, tenantSlug, isClosed }: PrescriptionTabProps) {
  // تحديد الحقول اللي مسموح ليها تظهر اقتراحات
  const [activeField, setActiveField] = useState<keyof typeof quickChips | null>(null)
  const [partnerDialogPrescriptionId, setPartnerDialogPrescriptionId] = useState<string | null>(null)
  const [selectedPartnerId, setSelectedPartnerId] = useState('')
  const [selectedContractId, setSelectedContractId] = useState('')
  const [selectedServiceId, setSelectedServiceId] = useState('')
  const [estimatedCostInput, setEstimatedCostInput] = useState('')
  const [partnerNotes, setPartnerNotes] = useState('')
  const [isSubmittingPartnerOrder, setIsSubmittingPartnerOrder] = useState(false)

  const selectedPrescription = partnerDialogPrescriptionId
    ? visit.prescriptions?.find((item) => item.id === partnerDialogPrescriptionId) ?? null
    : null

  const { data: partnersRes, isLoading: partnersLoading } = useSWR(
    partnerDialogPrescriptionId ? ['visit-prescription-partner-options', tenantSlug] : null,
    () =>
      listPartnersAction(tenantSlug, {
        type: 'Pharmacy',
        activeOnly: true,
        pageNumber: 1,
        pageSize: 200,
      }),
  )

  const { data: contractsRes, isLoading: contractsLoading } = useSWR(
    partnerDialogPrescriptionId && selectedPartnerId
      ? ['visit-prescription-partner-contracts', tenantSlug, selectedPartnerId]
      : null,
    () =>
      listPartnerContractsAction(tenantSlug, {
        partnerId: selectedPartnerId,
        activeOnly: true,
      }),
  )

  const { data: servicesRes, isLoading: servicesLoading } = useSWR(
    partnerDialogPrescriptionId && selectedPartnerId
      ? ['visit-prescription-partner-services', tenantSlug, selectedPartnerId]
      : null,
    () =>
      listPartnerServicesAction(tenantSlug, {
        partnerId: selectedPartnerId,
        activeOnly: true,
      }),
  )

  const partners = useMemo(() => partnersRes?.data?.items ?? [], [partnersRes?.data?.items])
  const contracts = useMemo(() => contractsRes?.data ?? [], [contractsRes?.data])
  const services = useMemo(() => servicesRes?.data ?? [], [servicesRes?.data])

  useEffect(() => {
    if (!partnerDialogPrescriptionId) return

    setSelectedPartnerId('')
    setSelectedContractId('')
    setSelectedServiceId('')
    setEstimatedCostInput('')
    setPartnerNotes('')
  }, [partnerDialogPrescriptionId])

  useEffect(() => {
    if (partners.length === 1 && !selectedPartnerId) {
      setSelectedPartnerId(partners[0].id)
    }
  }, [partners, selectedPartnerId])

  useEffect(() => {
    setSelectedContractId('')
    setSelectedServiceId('')
    setEstimatedCostInput('')
  }, [selectedPartnerId])

  useEffect(() => {
    if (!selectedServiceId) return

    const selectedService = services.find((item) => item.id === selectedServiceId)
    if (!selectedService) return

    setEstimatedCostInput(selectedService.price.toString())
  }, [selectedServiceId, services])

  const form = useForm<PrescriptionFormInput>({
    resolver: valibotResolver(prescriptionSchema),
    defaultValues: {
      medicationName: '',
      dosage: '',
      frequency: '',
      duration: '',
      instructions: '',
    },
  })

  const onSubmit = async (data: PrescriptionFormInput) => {
    if (isClosed) return
    const res = await createPrescriptionAction(tenantSlug, visit.id, data)
    if (res.success) {
      toast.success('تم إضافة الدواء')
      form.reset()
      setActiveField(null)
      document.getElementById('medicationNameInput')?.focus()
    } else {
      toast.error('حدث خطأ', { description: res.message })
    }
  }

  const handleDelete = async (id: string) => {
    const res = await deletePrescriptionAction(tenantSlug, visit.id, id)
    if (res.success) toast.success('تم حذف الدواء')
    else toast.error(res.message)
  }

  const openPartnerOrderDialog = (prescription: IPrescription) => {
    setPartnerDialogPrescriptionId(prescription.id)
  }

  const closePartnerOrderDialog = () => {
    if (isSubmittingPartnerOrder) return
    setPartnerDialogPrescriptionId(null)
  }

  const handleCreatePartnerOrder = async () => {
    if (!partnerDialogPrescriptionId) return

    if (!selectedPartnerId) {
      toast.error('اختر الصيدلية أولاً')
      return
    }

    const normalizedCost = estimatedCostInput.trim()
    let estimatedCost: number | undefined

    if (normalizedCost.length > 0) {
      const parsedCost = Number(normalizedCost)
      if (Number.isNaN(parsedCost) || parsedCost < 0) {
        toast.error('قيمة التكلفة التقديرية غير صحيحة')
        return
      }

      estimatedCost = parsedCost
    }

    setIsSubmittingPartnerOrder(true)
    try {
      const res = await createPrescriptionPartnerOrderAction(
        tenantSlug,
        visit.id,
        partnerDialogPrescriptionId,
        {
          partnerId: selectedPartnerId,
          partnerContractId: selectedContractId || undefined,
          partnerServiceCatalogItemId: selectedServiceId || undefined,
          estimatedCost,
          notes: partnerNotes.trim() || undefined,
        },
      )

      if (res.success) {
        toast.success('تم إرسال الطلب للشريك بنجاح')
        setPartnerDialogPrescriptionId(null)
      } else {
        toast.error(res.message || 'فشل إرسال الطلب للشريك')
      }
    } finally {
      setIsSubmittingPartnerOrder(false)
    }
  }

  // 🔥 الدالة دي دلوقتي Typed صح 100% ومفيش any
  const setQuickChoice = (fieldName: keyof typeof quickChips, value: string) => {
    form.setValue(fieldName, value, { shouldValidate: true })
  }

  return (
    <div className='w-full mt-2 print:hidden space-y-2'>
      <div className='flex items-center gap-2 border-b pb-2 mb-2'>
        <Pill className='w-4 h-4 text-muted-foreground' />
        <h3 className='text-sm font-semibold text-foreground'>الروشتة</h3>
      </div>

      {!isClosed && (
        <div className='relative'>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className='flex flex-col md:flex-row bg-card border rounded-lg shadow-sm focus-within:ring-1 focus-within:ring-primary overflow-hidden transition-all'>
                {/* اسم الدواء */}
                <FormField
                  control={form.control}
                  name='medicationName'
                  render={({ field }) => (
                    <FormItem className='flex-[1.5] space-y-0'>
                      <FormControl>
                        <Input
                          id='medicationNameInput'
                          placeholder='اسم الدواء...'
                          className='border-0 focus-visible:ring-0 rounded-none h-10 font-bold text-primary placeholder:font-normal'
                          {...field}
                          value={field.value ?? ''}
                          onFocus={() => setActiveField(null)}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className='hidden md:block w-px h-6 bg-border my-auto' />

                {/* الجرعة */}
                <FormField
                  control={form.control}
                  name='dosage'
                  render={({ field }) => (
                    <FormItem className='w-full md:w-24 space-y-0'>
                      <FormControl>
                        <Input
                          placeholder='الجرعة'
                          className='border-0 focus-visible:ring-0 rounded-none h-10 text-sm text-center md:text-right'
                          {...field}
                          value={field.value ?? ''}
                          onFocus={() => setActiveField('dosage')}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className='hidden md:block w-px h-6 bg-border my-auto' />

                {/* التكرار */}
                <FormField
                  control={form.control}
                  name='frequency'
                  render={({ field }) => (
                    <FormItem className='w-full md:w-32 space-y-0'>
                      <FormControl>
                        <Input
                          placeholder='التكرار'
                          className='border-0 focus-visible:ring-0 rounded-none h-10 text-sm text-center md:text-right'
                          {...field}
                          value={field.value ?? ''}
                          onFocus={() => setActiveField('frequency')}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className='hidden md:block w-px h-6 bg-border my-auto' />

                {/* المدة */}
                <FormField
                  control={form.control}
                  name='duration'
                  render={({ field }) => (
                    <FormItem className='w-full md:w-24 space-y-0'>
                      <FormControl>
                        <Input
                          placeholder='المدة'
                          className='border-0 focus-visible:ring-0 rounded-none h-10 text-sm text-center md:text-right'
                          {...field}
                          value={field.value ?? ''}
                          onFocus={() => setActiveField('duration')}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className='hidden md:block w-px h-6 bg-border my-auto' />

                {/* ملاحظات */}
                <FormField
                  control={form.control}
                  name='instructions'
                  render={({ field }) => (
                    <FormItem className='flex-1 space-y-0'>
                      <FormControl>
                        <Input
                          placeholder='ملاحظات...'
                          className='border-0 focus-visible:ring-0 rounded-none h-10 text-sm'
                          {...field}
                          value={field.value ?? ''}
                          onFocus={() => setActiveField(null)}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <Button
                  type='submit'
                  disabled={form.formState.isSubmitting}
                  className='h-10 w-full md:w-12 rounded-none bg-primary/10 hover:bg-primary text-primary hover:text-white shrink-0'
                >
                  {form.formState.isSubmitting ? (
                    <Loader2 className='w-4 h-4 animate-spin' />
                  ) : (
                    <Plus className='w-4 h-4' />
                  )}
                </Button>
              </div>
            </form>
          </Form>

          {/* الاقتراحات - تظهر وتختفي وتزق اللي تحتها بنعومة */}
          <AnimatePresence>
            {activeField && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className='overflow-hidden'
              >
                <div className='flex items-center gap-3 px-3 py-2 bg-muted/30 border-x border-b rounded-b-lg'>
                  <span className='text-[10px] font-bold text-muted-foreground uppercase tracking-tight'>
                    اقتراحات:
                  </span>
                  <div className='flex gap-1.5 flex-wrap'>
                    {quickChips[activeField].map((chip) => (
                      <Badge
                        key={chip}
                        variant='secondary'
                        className='cursor-pointer font-normal hover:bg-primary hover:text-white px-2 py-0.5 text-[11px] shadow-none border-transparent hover:border-primary transition-all'
                        onClick={() => setQuickChoice(activeField, chip)}
                      >
                        {chip}
                      </Badge>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* قائمة الأدوية */}
      <div className='flex flex-col border rounded-lg bg-card shadow-sm overflow-hidden mt-1'>
        {!visit.prescriptions?.length ? (
          <div className='text-center py-4 text-muted-foreground/30 text-[10px] italic'>
            لا توجد أدوية مضافة
          </div>
        ) : (
          visit.prescriptions.map((p: IPrescription, index: number) => (
            <div
              key={p.id}
              className='group flex items-center justify-between px-4 py-1.5 border-b last:border-0 hover:bg-muted/20 transition-colors'
            >
              <div className='flex items-center gap-2 text-sm'>
                <span className='text-muted-foreground/40 font-mono text-[10px]'>{index + 1}.</span>
                <span className='font-bold text-primary text-sm'>{p.medicationName}</span>
                <span className='text-muted-foreground/20'>|</span>
                <span className='text-foreground/70 text-xs'>
                  {p.dosage} {p.frequency && `• ${p.frequency}`} {p.duration && `• ${p.duration}`}
                </span>
                {p.instructions && (
                  <span className='text-muted-foreground text-[10px] bg-muted px-1.5 py-0.5 rounded ml-2'>
                    {p.instructions}
                  </span>
                )}
              </div>

              {!isClosed && (
                <div className='flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity'>
                  <Button
                    type='button'
                    variant='ghost'
                    size='icon'
                    className='h-6 w-6'
                    onClick={() => openPartnerOrderDialog(p)}
                    title='إرسال لشريك'
                  >
                    <ExternalLink className='h-3.5 w-3.5 text-muted-foreground/60 hover:text-primary' />
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant='ghost' size='icon' className='h-6 w-6'>
                        <Trash2 className='h-3.5 w-3.5 text-muted-foreground/40 hover:text-destructive' />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle className='text-sm'>حذف الدواء؟</AlertDialogTitle>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className='h-8 text-xs'>إلغاء</AlertDialogCancel>
                        <AlertDialogAction
                          className='h-8 text-xs bg-destructive'
                          onClick={() => handleDelete(p.id)}
                        >
                          حذف
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <Dialog open={Boolean(partnerDialogPrescriptionId)} onOpenChange={(open) => !open && closePartnerOrderDialog()}>
        <DialogContent className='sm:max-w-xl' showCloseButton={!isSubmittingPartnerOrder}>
          <DialogHeader>
            <DialogTitle className='text-base font-bold'>إرسال وصفة إلى صيدلية شريك</DialogTitle>
            <DialogDescription>
              {selectedPrescription
                ? `الدواء: ${selectedPrescription.medicationName}`
                : 'اختر بيانات الصيدلية قبل الإرسال'}
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-4'>
            <div className='space-y-2'>
              <Label>الصيدلية</Label>
              <Select
                value={selectedPartnerId || undefined}
                onValueChange={(value) => setSelectedPartnerId(value)}
                disabled={partnersLoading || isSubmittingPartnerOrder}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={partnersLoading ? 'جاري تحميل الصيدليات...' : 'اختر الصيدلية'}
                  />
                </SelectTrigger>
                <SelectContent>
                  {partners.map((partner) => (
                    <SelectItem key={partner.id} value={partner.id}>
                      {partner.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!partnersLoading && partners.length === 0 && (
                <p className='text-xs text-muted-foreground'>لا توجد صيدليات شركاء نشطة حالياً.</p>
              )}
            </div>

            <div className='space-y-2'>
              <Label>العقد (اختياري)</Label>
              <Select
                value={selectedContractId || 'none'}
                onValueChange={(value) => setSelectedContractId(value === 'none' ? '' : value)}
                disabled={!selectedPartnerId || contractsLoading || isSubmittingPartnerOrder}
              >
                <SelectTrigger>
                  <SelectValue placeholder='بدون عقد محدد' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='none'>بدون عقد</SelectItem>
                  {contracts.map((contract) => (
                    <SelectItem key={contract.id} value={contract.id}>
                      {contract.serviceScope || 'عقد شريك'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <Label>الخدمة (اختياري)</Label>
              <Select
                value={selectedServiceId || 'none'}
                onValueChange={(value) => setSelectedServiceId(value === 'none' ? '' : value)}
                disabled={!selectedPartnerId || servicesLoading || isSubmittingPartnerOrder}
              >
                <SelectTrigger>
                  <SelectValue placeholder='اختر خدمة من كتالوج الصيدلية' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='none'>بدون خدمة محددة</SelectItem>
                  {services.map((service) => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.serviceName} - {service.price.toLocaleString('ar-EG')} ج.م
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <Label>التكلفة التقديرية (اختياري)</Label>
              <Input
                type='number'
                min='0'
                step='0.01'
                value={estimatedCostInput}
                onChange={(event) => setEstimatedCostInput(event.target.value)}
                placeholder='مثال: 180'
                disabled={isSubmittingPartnerOrder}
              />
            </div>

            <div className='space-y-2'>
              <Label>ملاحظات (اختياري)</Label>
              <Textarea
                value={partnerNotes}
                onChange={(event) => setPartnerNotes(event.target.value)}
                placeholder='أي تفاصيل إضافية للصيدلية...'
                disabled={isSubmittingPartnerOrder}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={closePartnerOrderDialog}
              disabled={isSubmittingPartnerOrder}
            >
              إلغاء
            </Button>
            <Button
              type='button'
              onClick={() => void handleCreatePartnerOrder()}
              disabled={isSubmittingPartnerOrder || !selectedPartnerId}
            >
              {isSubmittingPartnerOrder ? (
                <>
                  <Loader2 className='ml-2 h-4 w-4 animate-spin' />
                  جاري الإرسال...
                </>
              ) : (
                'إرسال الطلب'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
