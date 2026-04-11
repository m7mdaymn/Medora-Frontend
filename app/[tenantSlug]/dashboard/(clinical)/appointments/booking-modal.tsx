'use client'

import { valibotResolver } from '@hookform/resolvers/valibot'
import { format } from 'date-fns'
import { ar } from 'date-fns/locale'
import { AlertCircle, CalendarIcon, Loader2, User, Users } from 'lucide-react'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

import { getBranchesAction } from '@/actions/branch/branches'
import { createBookingAction } from '@/actions/booking/create-booking'
import { IBranch } from '@/types/branch'
import { IDoctor } from '@/types/doctor'
import { IPatient } from '@/types/patient'
import { CreateBookingInput, createBookingSchema } from '@/validation/booking'
import { PatientSearch } from '@/components/patient-search'

interface Props {
  doctors: IDoctor[]
}

export function BookingModal({ doctors = [] }: Props) {
  const [open, setOpen] = useState(false)
  const { tenantSlug } = useParams()

  const safeDoctors = doctors.filter((doctor) => doctor.isEnabled) || []
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null)
  const [transferReceiptFile, setTransferReceiptFile] = useState<File | null>(null)
  const [branches, setBranches] = useState<IBranch[]>([])
  const [isBranchesLoading, setIsBranchesLoading] = useState(false)

  // 🔥 ستيت حفظ الأكونت لعرض أفراد العائلة
  const [selectedAccount, setSelectedAccount] = useState<IPatient | null>(null)

  const form = useForm<CreateBookingInput>({
    resolver: valibotResolver(createBookingSchema),
    defaultValues: {
      patientId: '',
      branchId: '',
      doctorId: '',
      doctorServiceId: '',
      notes: '',
      bookingTime: '09:00',
      bookingDate: new Date(),
      paymentMethod: 'none',
      paidAmount: '',
      paymentReference: '',
      paymentNotes: '',
    },
  })

  const activeDoctor = safeDoctors.find((d) => d.id === selectedDoctorId)
  const hasServices = activeDoctor && (activeDoctor.services?.length ?? 0) > 0
  const selectedPaymentMethod = useWatch({ control: form.control, name: 'paymentMethod' })
  const requiresTransferReceipt =
    selectedPaymentMethod === 'Transfer' || selectedPaymentMethod === 'Receipt'

  useEffect(() => {
    if (!open) return

    let active = true

    const loadBranches = async () => {
      setIsBranchesLoading(true)
      try {
        const response = await getBranchesAction(tenantSlug as string, false)
        if (!active) return

        if (!response.success) {
          setBranches([])
          return
        }

        const activeBranches = (response.data ?? []).filter((branch) => branch.isActive)
        setBranches(activeBranches)

        const currentBranchId = form.getValues('branchId')
        const hasCurrentBranch = currentBranchId
          ? activeBranches.some((branch) => branch.id === currentBranchId)
          : false

        if (!hasCurrentBranch) {
          form.setValue('branchId', activeBranches[0]?.id ?? '', { shouldDirty: false })
        }
      } finally {
        if (active) {
          setIsBranchesLoading(false)
        }
      }
    }

    void loadBranches()

    return () => {
      active = false
    }
  }, [open, tenantSlug, form])

  const onSubmit = async (values: CreateBookingInput) => {
    if (!values.branchId?.trim()) {
      toast.error('اختر الفرع أولاً')
      return
    }

    if (!hasServices) {
      toast.error('لا يمكن الحجز لدكتور ليس لديه خدمات معرفة')
      return
    }

    const hasPaidAmount = Boolean(values.paidAmount?.trim())
    const paidAmount = hasPaidAmount ? Number(values.paidAmount) : 0
    if (hasPaidAmount && Number.isNaN(paidAmount)) {
      toast.error('صيغة مبلغ الدفع غير صحيحة')
      return
    }

    const effectivePaymentMethod = values.paymentMethod === 'none' ? '' : values.paymentMethod

    if (hasPaidAmount && paidAmount > 0 && !effectivePaymentMethod) {
      toast.error('اختر طريقة الدفع: كاش أو إيصال')
      return
    }

    if (
      (effectivePaymentMethod === 'Transfer' || effectivePaymentMethod === 'Receipt') &&
      hasPaidAmount &&
      paidAmount > 0 &&
      !transferReceiptFile
    ) {
      toast.error('ارفع صورة إيصال التحويل قبل تأكيد الحجز')
      return
    }

    const payloadPaymentMethod: CreateBookingInput['paymentMethod'] =
      effectivePaymentMethod === 'Cash' ||
      effectivePaymentMethod === 'Receipt' ||
      effectivePaymentMethod === 'Transfer'
        ? effectivePaymentMethod
        : 'none'

    try {
      const result = await createBookingAction(
        {
          ...values,
          paymentMethod: payloadPaymentMethod,
        },
        tenantSlug as string,
        transferReceiptFile,
      )
      if (result.success) {
        toast.success(result.message)
        setOpen(false)
        form.reset()
        setSelectedDoctorId(null)
        setSelectedAccount(null)
        setTransferReceiptFile(null)
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      if (error instanceof Error) toast.error('حدث خطأ أثناء الاتصال بالسيرفر')
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen)
        if (!isOpen) {
          form.reset()
          setSelectedAccount(null)
          setTransferReceiptFile(null)
        }
      }}
    >
      <DialogTrigger asChild>
        <Button>حجز موعد جديد</Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-125 max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>حجز موعد جديد</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            {/* 1. المريض واختيار أفراد العائلة */}
            <FormField
              control={form.control}
              name='patientId'
              render={({ field }) => (
                <div className='space-y-3'>
                  <FormItem className='flex flex-col'>
                    <FormLabel>المريض (أو ولي الأمر)</FormLabel>
                    <FormControl>
                      <PatientSearch
                        tenantSlug={tenantSlug as string}
                        selectedPatientId={selectedAccount?.id}
                        onSelect={(patient) => {
                          setSelectedAccount(patient)
                          field.onChange(patient.id)
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>

                  {/* بلوك أفراد العائلة */}
                  {selectedAccount &&
                    selectedAccount.subProfiles &&
                    selectedAccount.subProfiles.length > 0 && (
                      <div className='p-4 border rounded-lg bg-muted/10 space-y-3 animate-in fade-in slide-in-from-top-2'>
                        <h4 className='text-sm font-bold flex items-center gap-2'>
                          <Users className='w-4 h-4 text-primary' />
                          الحجز لمن بالظبط؟
                        </h4>
                        <div className='grid grid-cols-2 gap-3'>
                          {/* كارت الأب */}
                          <div
                            onClick={() => field.onChange(selectedAccount.id)}
                            className={cn(
                              'p-3 border rounded-md cursor-pointer transition-all flex flex-col',
                              field.value === selectedAccount.id
                                ? 'border-primary bg-primary/5 ring-1 ring-primary'
                                : 'hover:border-primary/50 hover:bg-muted/50 bg-background',
                            )}
                          >
                            <span className='font-bold text-sm flex items-center gap-2 truncate'>
                              <User className='w-4 h-4 shrink-0' /> {selectedAccount.name}
                            </span>
                            <Badge variant='secondary' className='w-fit mt-2 text-[10px]'>
                              صاحب الحساب
                            </Badge>
                          </div>

                          {/* كروت التابعين */}
                          {selectedAccount.subProfiles.map((sub) => (
                            <div
                              key={sub.id}
                              onClick={() => field.onChange(sub.id)}
                              className={cn(
                                'p-3 border rounded-md cursor-pointer transition-all flex flex-col',
                                field.value === sub.id
                                  ? 'border-primary bg-primary/5 ring-1 ring-primary'
                                  : 'hover:border-primary/50 hover:bg-muted/50 bg-background',
                              )}
                            >
                              <span className='font-bold text-sm flex items-center gap-2 truncate'>
                                <User className='w-4 h-4 shrink-0' /> {sub.name}
                              </span>
                              <Badge variant='outline' className='w-fit mt-2 text-[10px]'>
                                {sub.gender === 'Male' ? 'ذكر' : 'أنثى'} • تابع
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                </div>
              )}
            />

            <FormField
              control={form.control}
              name='branchId'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>الفرع</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || undefined}
                    disabled={isBranchesLoading || branches.length === 0}
                  >
                    <FormControl>
                      <SelectTrigger className='text-right h-11'>
                        <SelectValue
                          placeholder={isBranchesLoading ? 'جاري تحميل الفروع...' : 'اختر الفرع'}
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {branches.map((branch) => (
                        <SelectItem key={branch.id} value={branch.id} className='text-right'>
                          {branch.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 2. اختيار الطبيب (بدون تغيير) */}
            <FormField
              control={form.control}
              name='doctorId'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>الطبيب المعالج</FormLabel>
                  <Select
                    onValueChange={(val) => {
                      field.onChange(val)
                      setSelectedDoctorId(val)
                      form.setValue('doctorServiceId', '')
                    }}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className='text-right h-11'>
                        <SelectValue placeholder='اختر الطبيب' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {safeDoctors.map((doc) => (
                        <SelectItem key={doc.id} value={doc.id} className='text-right'>
                          {doc.name} - {doc.specialty || 'تخصص عام'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 3. الخدمة (بدون تغيير) */}
            {selectedDoctorId && (
              <FormField
                control={form.control}
                name='doctorServiceId'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الخدمة المطلوبة</FormLabel>
                    {hasServices ? (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className='text-right h-11'>
                            <SelectValue placeholder='اختر نوع الخدمة/الكشف' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {activeDoctor.services?.map((svc) => (
                            <SelectItem key={svc.id} value={svc.id!} className='text-right'>
                              {svc.serviceName} ({svc.price} ج.م)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className='flex items-center gap-2 p-3 text-xs bg-destructive/10 text-destructive rounded-md border border-destructive/20'>
                        <AlertCircle className='h-4 w-4' />
                        عذراً، هذا الطبيب ليس لديه خدمات متاحة حالياً.
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* 4. التاريخ والوقت (بدون تغيير) */}
            <div className='grid grid-cols-2 gap-4'>
              <FormField
                control={form.control}
                name='bookingDate'
                render={({ field }) => (
                  <FormItem className='flex flex-col'>
                    <FormLabel>التاريخ</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={'outline'}
                            className={cn(
                              'w-full pl-3 text-right font-normal h-11',
                              !field.value && 'text-muted-foreground',
                            )}
                          >
                            {field.value ? (
                              format(field.value, 'PPP', { locale: ar })
                            ) : (
                              <span>اختر يوم</span>
                            )}
                            <CalendarIcon className='mr-auto h-4 w-4 opacity-50' />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className='w-auto p-0' align='start'>
                        <Calendar
                          mode='single'
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                          initialFocus
                          locale={ar}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='bookingTime'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الساعة</FormLabel>
                    <FormControl>
                      <Input
                        type='time'
                        {...field}
                        className='text-right cursor-pointer h-11'
                        onClick={(e) => e.currentTarget.showPicker?.()}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* 5. الدفع الاختياري */}
            <div className='rounded-lg border border-border/60 p-3 space-y-3 bg-muted/10'>
              <div className='text-sm font-semibold'>الدفع عند الحجز (اختياري)</div>
              <p className='text-xs text-muted-foreground'>
                يمكنك تحصيل مبلغ الآن (كاش/إيصال) لإنشاء الفاتورة مباشرة. يتطلب ذلك موعد اليوم وشِفت مفتوح للطبيب.
              </p>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                <FormField
                  control={form.control}
                  name='paymentMethod'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>طريقة الدفع</FormLabel>
                      <Select value={field.value || 'none'} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className='h-11 text-right'>
                            <SelectValue placeholder='بدون دفع الآن' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value='none'>بدون دفع الآن</SelectItem>
                          <SelectItem value='Cash'>كاش</SelectItem>
                          <SelectItem value='Transfer'>تحويل (مع إيصال)</SelectItem>
                          <SelectItem value='Receipt'>إيصال</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='paidAmount'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>المبلغ المحصل</FormLabel>
                      <FormControl>
                        <Input
                          type='number'
                          min='0'
                          step='0.01'
                          value={field.value || ''}
                          onChange={(event) => field.onChange(event.target.value)}
                          placeholder='0.00'
                          className='h-11 text-right'
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {requiresTransferReceipt && (
                  <FormField
                    control={form.control}
                    name='paymentReference'
                    render={({ field }) => (
                      <FormItem className='md:col-span-2'>
                        <FormLabel>مرجع العملية (اختياري)</FormLabel>
                        <FormControl>
                          <Input
                            value={field.value || ''}
                            onChange={(event) => field.onChange(event.target.value)}
                            placeholder='REF-12345'
                            className='h-11 text-right'
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {requiresTransferReceipt && (
                  <div className='md:col-span-2 space-y-2'>
                    <FormLabel>صورة إيصال التحويل</FormLabel>
                    <Input
                      type='file'
                      accept='image/*'
                      className='h-11 file:ml-3 file:rounded file:border-0 file:bg-primary/10 file:px-3 file:py-1 file:text-primary'
                      onChange={(event) => {
                        const file = event.target.files?.[0] || null
                        setTransferReceiptFile(file)
                      }}
                    />
                    {transferReceiptFile && (
                      <p className='text-xs text-muted-foreground'>
                        تم اختيار الملف: {transferReceiptFile.name}
                      </p>
                    )}
                  </div>
                )}

                <FormField
                  control={form.control}
                  name='paymentNotes'
                  render={({ field }) => (
                    <FormItem className='md:col-span-2'>
                      <FormLabel>ملاحظات الدفع (اختياري)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder='أي ملاحظات متعلقة بالدفع'
                          value={field.value || ''}
                          onChange={(event) => field.onChange(event.target.value)}
                          className='text-right resize-none'
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* 6. ملاحظات الحجز */}
            <FormField
              control={form.control}
              name='notes'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ملاحظات (اختياري)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder='أي تفاصيل إضافية...'
                      {...field}
                      className='text-right resize-none'
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type='submit'
              className='w-full h-11 text-lg font-bold'
              disabled={form.formState.isSubmitting || (selectedDoctorId !== null && !hasServices)}
            >
              {form.formState.isSubmitting ? (
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              ) : (
                'تأكيد الحجز'
              )}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
