'use client'

import { useEffect, useMemo, useState } from 'react'
import { ILabRequest, IVisit } from '@/types/visit'
import { valibotResolver } from '@hookform/resolvers/valibot'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import useSWR from 'swr'

import { createLabRequestAction } from '@/actions/labs/create-lab-request'
import { createLabPartnerOrderAction } from '@/actions/labs/create-lab-partner-order'
import {
  listPartnerContractsAction,
  listPartnersAction,
  listPartnerServicesAction,
} from '@/actions/partner/workflow'
import { deleteLabRequestAction } from '../../../../../../actions/labs/delete-lab-request'
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
import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { LabRequestFormInput, labRequestSchema } from '@/validation/labs'
import { AlertCircle, Beaker, ExternalLink, Loader2, Plus, Trash2 } from 'lucide-react'

interface LabsTabProps {
  visit: IVisit
  tenantSlug: string
  isClosed?: boolean
}

// تعريف الاختيارات السريعة للتحاليل
const quickLabs = {
  testName: [
    'CBC',
    'CRP',
    'HbA1c',
    'Urine Analysis',
    'Lipid Profile',
    'X-Ray Chest',
    'Pelvic Ultrasound',
  ],
}

type LabPartnerOrderContext = {
  labRequestId: string
  partnerType: 'Laboratory' | 'Radiology'
}

export function LabsTab({ visit, tenantSlug, isClosed }: LabsTabProps) {
  // تحديد الحقل النشط للاقتراحات
  const [activeField, setActiveField] = useState<keyof typeof quickLabs | null>(null)
  const [partnerOrderContext, setPartnerOrderContext] = useState<LabPartnerOrderContext | null>(null)
  const [selectedPartnerId, setSelectedPartnerId] = useState('')
  const [selectedContractId, setSelectedContractId] = useState('')
  const [selectedServiceId, setSelectedServiceId] = useState('')
  const [estimatedCostInput, setEstimatedCostInput] = useState('')
  const [partnerNotes, setPartnerNotes] = useState('')
  const [isSubmittingPartnerOrder, setIsSubmittingPartnerOrder] = useState(false)

  const selectedLabRequest = partnerOrderContext
    ? visit.labRequests?.find((lab) => lab.id === partnerOrderContext.labRequestId) ?? null
    : null

  const partnerOrderLabRequestId = partnerOrderContext?.labRequestId ?? null
  const partnerOrderType = partnerOrderContext?.partnerType ?? null

  const partnerTypeLabel =
    partnerOrderContext?.partnerType === 'Laboratory'
      ? 'معمل'
      : partnerOrderContext?.partnerType === 'Radiology'
        ? 'أشعة'
        : 'شريك'

  const { data: partnersRes, isLoading: partnersLoading } = useSWR(
    partnerOrderContext
      ? ['visit-lab-partner-options', tenantSlug, partnerOrderContext.partnerType]
      : null,
    () =>
      listPartnersAction(tenantSlug, {
        type: partnerOrderContext!.partnerType,
        activeOnly: true,
        pageNumber: 1,
        pageSize: 200,
      }),
  )

  const { data: contractsRes, isLoading: contractsLoading } = useSWR(
    partnerOrderContext && selectedPartnerId
      ? ['visit-lab-partner-contracts', tenantSlug, selectedPartnerId]
      : null,
    () =>
      listPartnerContractsAction(tenantSlug, {
        partnerId: selectedPartnerId,
        activeOnly: true,
      }),
  )

  const { data: servicesRes, isLoading: servicesLoading } = useSWR(
    partnerOrderContext && selectedPartnerId
      ? ['visit-lab-partner-services', tenantSlug, selectedPartnerId]
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
    if (!partnerOrderLabRequestId || !partnerOrderType) return

    setSelectedPartnerId('')
    setSelectedContractId('')
    setSelectedServiceId('')
    setEstimatedCostInput('')
    setPartnerNotes('')
  }, [partnerOrderLabRequestId, partnerOrderType])

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

  const form = useForm<LabRequestFormInput>({
    resolver: valibotResolver(labRequestSchema),
    defaultValues: {
      testName: '',
      type: 'Lab',
      notes: '',
      isUrgent: false,
    },
  })

  const onSubmit = async (data: LabRequestFormInput) => {
    if (isClosed) return
    const res = await createLabRequestAction(tenantSlug, visit.id, data)
    if (res.success) {
      toast.success('تم إضافة طلب الفحص')
      form.reset({ ...form.getValues(), testName: '', notes: '', isUrgent: false })
      setActiveField(null)
      document.getElementById('testNameInput')?.focus()
    } else {
      toast.error(res.message)
    }
  }

  const handleDelete = async (id: string) => {
    const res = await deleteLabRequestAction(tenantSlug, visit.id, id)
    if (res.success) toast.success('تم حذف طلب الفحص')
    else toast.error(res.message)
  }

  const openPartnerOrderDialog = (lab: ILabRequest) => {
    const partnerType: LabPartnerOrderContext['partnerType'] =
      lab.type === 'Lab' ? 'Laboratory' : 'Radiology'

    setPartnerOrderContext({
      labRequestId: lab.id,
      partnerType,
    })
  }

  const closePartnerOrderDialog = () => {
    if (isSubmittingPartnerOrder) return
    setPartnerOrderContext(null)
  }

  const handleCreatePartnerOrder = async () => {
    if (!partnerOrderContext) return

    if (!selectedPartnerId) {
      toast.error('اختر الشريك أولاً')
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
      const res = await createLabPartnerOrderAction(
        tenantSlug,
        visit.id,
        partnerOrderContext.labRequestId,
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
        setPartnerOrderContext(null)
      } else {
        toast.error(res.message || 'فشل إرسال الطلب للشريك')
      }
    } finally {
      setIsSubmittingPartnerOrder(false)
    }
  }

  // دالة الاختيار السريع بدون any
  const setQuickChoice = (fieldName: keyof typeof quickLabs, value: string) => {
    form.setValue(fieldName as keyof LabRequestFormInput, value, { shouldValidate: true })
  }

  return (
    <div className='w-full mt-2 print:hidden space-y-2'>
      <div className='flex items-center gap-2 border-b pb-2 mb-2'>
        <Beaker className='w-4 h-4 text-muted-foreground' />
        <h3 className='text-sm font-semibold text-foreground'>الفحوصات المطلوبة</h3>
      </div>

      {!isClosed && (
        <div className='relative'>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className='flex flex-col md:flex-row bg-card border rounded-lg shadow-sm focus-within:ring-1 focus-within:ring-primary overflow-hidden transition-all'>
                {/* اسم الفحص */}
                <FormField
                  control={form.control}
                  name='testName'
                  render={({ field }) => (
                    <FormItem className='flex-[1.5] space-y-0'>
                      <FormControl>
                        <Input
                          id='testNameInput'
                          placeholder='اسم التحليل أو الأشعة...'
                          className='border-0 focus-visible:ring-0 rounded-none h-10 font-bold text-primary placeholder:font-normal'
                          {...field}
                          onFocus={() => setActiveField('testName')}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className='hidden md:block w-px h-6 bg-border my-auto' />

                {/* نوع الفحص */}
                <FormField
                  control={form.control}
                  name='type'
                  render={({ field }) => (
                    <FormItem className='w-full md:w-32 space-y-0'>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className='border-0 focus:ring-0 rounded-none h-10 bg-transparent shadow-none text-xs text-center md:text-right'>
                            <SelectValue placeholder='النوع' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value='Lab'>معمل</SelectItem>
                          <SelectItem value='Imaging'>أشعة</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />

                <div className='hidden md:block w-px h-6 bg-border my-auto' />

                {/* ملاحظات الفحص */}
                <FormField
                  control={form.control}
                  name='notes'
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

                {/* زرار عاجل */}
                <FormField
                  control={form.control}
                  name='isUrgent'
                  render={({ field }) => (
                    <div
                      onClick={() => field.onChange(!field.value)}
                      className={cn(
                        'flex items-center justify-center px-4 cursor-pointer transition-colors border-r md:border-l md:border-r-0 shrink-0 h-10',
                        field.value
                          ? 'bg-red-50 text-red-600'
                          : 'text-muted-foreground hover:bg-muted',
                      )}
                    >
                      <AlertCircle
                        className={cn('w-4 h-4', field.value && 'fill-red-600 text-white')}
                      />
                      <span className='text-[10px] font-bold mr-1 hidden lg:inline uppercase'>
                        عاجل
                      </span>
                    </div>
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
            {activeField && quickLabs[activeField] && (
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
                    {quickLabs[activeField].map((chip) => (
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

      {/* قائمة الفحوصات */}
      <div className='flex flex-col border rounded-lg bg-card shadow-sm overflow-hidden mt-1'>
        {!visit.labRequests?.length ? (
          <div className='text-center py-4 text-muted-foreground/30 text-[10px] italic'>
            لا توجد فحوصات مضافة
          </div>
        ) : (
          visit.labRequests.map((lab: ILabRequest, index: number) => (
            <div
              key={lab.id}
              className={cn(
                'group flex items-center justify-between px-4 py-1.5 border-b last:border-0 hover:bg-muted/20 transition-colors',
                lab.isUrgent && 'bg-red-50/20 hover:bg-red-50/30',
              )}
            >
              <div className='flex items-center gap-2 text-sm'>
                <span className='text-muted-foreground/40 font-mono text-[10px]'>{index + 1}.</span>

                <span className='font-bold text-primary text-sm'>{lab.testName}</span>

                <span className='text-muted-foreground/20'>|</span>

                <span
                  className={cn(
                    'text-[9px] px-1.5 py-0.5 rounded font-bold border uppercase tracking-tighter',
                    lab.type === 'Lab'
                      ? 'bg-blue-50 text-blue-700 border-blue-100'
                      : 'bg-purple-50 text-purple-700 border-purple-100',
                  )}
                >
                  {lab.type === 'Lab' ? 'معمل' : 'أشعة'}
                </span>

                {lab.isUrgent && (
                  <span className='flex items-center gap-0.5 text-red-600 font-bold text-[9px] bg-red-100 px-1.5 rounded animate-pulse'>
                    <AlertCircle className='w-3 h-3' /> عاجل
                  </span>
                )}

                {lab.notes && (
                  <>
                    <span className='text-muted-foreground/20'>|</span>
                    <span className='text-muted-foreground text-[10px] bg-muted px-1.5 py-0.5 rounded ml-2 italic'>
                      {lab.notes}
                    </span>
                  </>
                )}
              </div>

              {!isClosed && (
                <div className='flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity'>
                  <Button
                    type='button'
                    variant='ghost'
                    size='icon'
                    className='h-6 w-6'
                    onClick={() => openPartnerOrderDialog(lab)}
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
                        <AlertDialogTitle className='text-sm'>حذف الفحص؟</AlertDialogTitle>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className='h-8 text-xs'>إلغاء</AlertDialogCancel>
                        <AlertDialogAction
                          className='h-8 text-xs bg-destructive'
                          onClick={() => handleDelete(lab.id)}
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

      <Dialog open={Boolean(partnerOrderContext)} onOpenChange={(open) => !open && closePartnerOrderDialog()}>
        <DialogContent className='sm:max-w-xl' showCloseButton={!isSubmittingPartnerOrder}>
          <DialogHeader>
            <DialogTitle className='text-base font-bold'>إرسال طلب إلى {partnerTypeLabel}</DialogTitle>
            <DialogDescription>
              {selectedLabRequest
                ? `الفحص: ${selectedLabRequest.testName}`
                : 'اختر بيانات الشريك قبل الإرسال'}
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-4'>
            <div className='space-y-2'>
              <Label>الشريك</Label>
              <Select
                value={selectedPartnerId || undefined}
                onValueChange={(value) => setSelectedPartnerId(value)}
                disabled={partnersLoading || isSubmittingPartnerOrder}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={partnersLoading ? 'جاري تحميل الشركاء...' : 'اختر الشريك'}
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
                <p className='text-xs text-muted-foreground'>لا يوجد شركاء نشطون لهذا النوع حالياً.</p>
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
                  <SelectValue placeholder='اختر خدمة من كتالوج الشريك' />
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
                placeholder='مثال: 250'
                disabled={isSubmittingPartnerOrder}
              />
            </div>

            <div className='space-y-2'>
              <Label>ملاحظات (اختياري)</Label>
              <Textarea
                value={partnerNotes}
                onChange={(event) => setPartnerNotes(event.target.value)}
                placeholder='أي تفاصيل إضافية للشريك...'
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
