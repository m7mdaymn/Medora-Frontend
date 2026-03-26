'use client'

import { createTicket } from '@/actions/queue/tickets'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { IDoctor } from '@/types/doctor'
import { IPatient } from '@/types/patient'
import { IQueueBoardSession } from '@/types/queue'
import { CutTicketSchema, type CutTicketInput } from '@/validation/queue'
import { valibotResolver } from '@hookform/resolvers/valibot'
import { AlertCircle, Banknote, CreditCard, Loader2, Ticket, User, Users } from 'lucide-react' // 👈 ضفنا AlertCircle
import * as React from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { mutate } from 'swr'
import { PatientSearch } from '../../../../../components/patient-search'

interface CutTicketDialogProps {
  tenantSlug: string
  activeSessions: IQueueBoardSession[]
  doctors: IDoctor[]
}

export function CutTicketDialog({ tenantSlug, activeSessions, doctors }: CutTicketDialogProps) {
  const [open, setOpen] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const [selectedAccount, setSelectedAccount] = React.useState<IPatient | null>(null)

  const form = useForm<CutTicketInput>({
    resolver: valibotResolver(CutTicketSchema),
    defaultValues: {
      isUrgent: false,
      notes: '',
      paymentMethod: 'Cash',
      // تأكدنا إن الـ doctorServiceId بيبدأ فاضي عشان نجبره يختار
      doctorServiceId: '',
      visitType: 'Exam',
      paidAmount: undefined,
    },
  })

  const selectedSessionId = form.watch('sessionId')
  const selectedServiceId = form.watch('doctorServiceId')

  const selectedDoctor = React.useMemo(() => {
    const session = activeSessions.find((s) => s.sessionId === selectedSessionId)
    if (!session) return null
    return doctors.find((d) => d.id === session.doctorId)
  }, [selectedSessionId, activeSessions, doctors])

  // 🔥 التحقق هل الدكتور المختار عنده خدمات فعلاً ولا لأ
  const hasServices =
    selectedDoctor && (selectedDoctor.services?.filter((s) => s.isActive)?.length ?? 0) > 0

  const handleServiceChange = (serviceId: string) => {
    form.setValue('doctorServiceId', serviceId)
    const service = selectedDoctor?.services?.find((s) => s.id === serviceId)
    if (service && service.price) {
      form.setValue('paymentAmount', Number(service.price))
      form.setValue('paidAmount', Number(service.price)) // 👈 بينزل أوتوماتيك زي السعر
    } else {
      form.setValue('paymentAmount', 0)
      form.setValue('paidAmount', 0)
    }
  }

  async function onSubmit(values: CutTicketInput) {
    if (!values.doctorServiceId) {
      toast.error('يجب اختيار الخدمة المطلوبة أولاً')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await createTicket(tenantSlug, values)

      if (!res.success) {
        throw new Error(res.message || 'فشل إصدار التذكرة')
      }

      toast.success('تم الحجز وإصدار التذكرة بنجاح')
      setOpen(false)
      form.reset()
      setSelectedAccount(null)

      await mutate(['queueBoard', tenantSlug])
    } catch (error) {
      if (error instanceof Error) toast.error(error.message)
    } finally {
      setIsSubmitting(false)
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
        }
      }}
    >
      <DialogTrigger asChild>
        <Button className='gap-2 shadow-md'>
          <Ticket className='h-5 w-5' />
          قطع تذكرة
        </Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-125 max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='text-xl font-bold flex items-center gap-2'>
            <Ticket className='h-6 w-6 text-primary' />
            حجز موعد جديد
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-5'>
            {/* 1. العيادة */}
            <FormField
              control={form.control}
              name='sessionId'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    العيادة المفتوحة <span className='text-destructive'>*</span>
                  </FormLabel>
                  <Select
                    onValueChange={(val) => {
                      field.onChange(val)
                      const docId = activeSessions.find((s) => s.sessionId === val)?.doctorId
                      if (docId) form.setValue('doctorId', docId)
                      form.setValue('doctorServiceId', '') // تصفير الخدمة لما يغير العيادة
                      form.setValue('paymentAmount', undefined)
                    }}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className='h-11 bg-muted/20'>
                        <SelectValue placeholder='اختر العيادة...' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {activeSessions.map((session) => (
                        <SelectItem key={session.sessionId} value={session.sessionId}>
                          عيادة د. {session.doctorName}
                          <span className='text-muted-foreground mr-2 text-xs'>
                            ({session.waitingCount} انتظار)
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 2. المريض واختيار أفراد العائلة */}
            <FormField
              control={form.control}
              name='patientId'
              render={({ field }) => (
                <div className='space-y-3'>
                  <FormItem className='flex flex-col'>
                    <FormLabel>
                      المريض (أو ولي الأمر) <span className='text-destructive'>*</span>
                    </FormLabel>
                    <FormControl>
                      <PatientSearch
                        tenantSlug={tenantSlug}
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

            {/* 3. الخدمة والطوارئ */}
            <div className='grid grid-cols-2 gap-4'>
              <FormField
                control={form.control}
                name='doctorServiceId'
                render={({ field }) => (
                  <FormItem className='md:col-span-1'>
                    <FormLabel>
                      الخدمة المطلوبة <span className='text-destructive'>*</span>
                    </FormLabel>

                    {/* 🔥 بنشيك هل الدكتور ليه خدمات ولا لأ */}
                    {selectedDoctor && !hasServices ? (
                      <div className='flex items-center gap-2 p-3 text-xs bg-destructive/10 text-destructive rounded-md border border-destructive/20'>
                        <AlertCircle className='h-4 w-4 shrink-0' />
                        هذا الطبيب ليس لديه خدمات.
                      </div>
                    ) : (
                      <Select onValueChange={handleServiceChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className='h-11' disabled={!selectedDoctor}>
                            <SelectValue placeholder='اختر الخدمة...' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {selectedDoctor?.services
                            ?.filter((s) => s.isActive)
                            .map((service) => (
                              <SelectItem key={service.id} value={service.id!}>
                                {service.serviceName}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='visitType'
                render={({ field }) => (
                  <FormItem className='md:col-span-1'>
                    <FormLabel>
                      نوع الزيارة <span className='text-destructive'>*</span>
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className='h-11 bg-background'>
                          <SelectValue placeholder='اختر النوع...' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value='Exam'>كشف جديد (Exam)</SelectItem>
                        <SelectItem value='Consultation'>استشارة (Consultation)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='isUrgent'
                render={({ field }) => (
                  <FormItem className='flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-destructive/5 border-destructive/10 md:col-span-1 h-11 mt-8'>
                    <div className='space-y-0.5'>
                      <FormLabel className='text-destructive font-bold cursor-pointer ml-2'>
                        كشف مستعجل
                      </FormLabel>
                    </div>
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className='data-[state=checked]:bg-destructive data-[state=checked]:border-destructive'
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {/* 4. تفاصيل الدفع */}
            {selectedServiceId && (
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/30 rounded-xl border border-muted'>
                {/* إجمالي تكلفة الخدمة */}
                <FormField
                  control={form.control}
                  name='paymentAmount'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>المدفوع الآن (جنيه)</FormLabel>
                      <FormControl>
                        <Input
                          type='number'
                          className='h-11 font-bold border-primary/50 focus-visible:ring-primary'
                          value={field.value ?? ''}
                          onChange={(e) =>
                            field.onChange(e.target.value ? Number(e.target.value) : undefined)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* 👈 المبلغ المدفوع فعلياً (الجديد) */}
                <FormField
                  control={form.control}
                  name='paidAmount'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>تكلفة الخدمة</FormLabel>
                      <FormControl>
                        <Input
                          type='number'
                          disabled // 👈 مقفول عشان ده بييجي من الباك إند
                          className='h-11 font-bold bg-muted/50 cursor-not-allowed'
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='paymentMethod'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>طريقة الدفع</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className='h-11'>
                            <SelectValue placeholder='اختر...' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value='Cash'>
                            <span className='flex items-center gap-2'>
                              <Banknote className='w-4 h-4' /> كاش
                            </span>
                          </SelectItem>
                          <SelectItem value='Card'>
                            <span className='flex items-center gap-2'>
                              <CreditCard className='w-4 h-4' /> فيزا / بطاقة
                            </span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* 5. الملاحظات */}
            <FormField
              control={form.control}
              name='notes'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ملاحظات الاستقبال</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder='أي تفاصيل إضافية...'
                      className='resize-none h-20'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 6. زرار الحفظ */}
            {/* 🔥 قفلنا الزرار لو مفيش خدمة متحددة أو لو مفيش دكتور متحدد */}
            <Button
              type='submit'
              className='w-full h-12 text-lg font-bold'
              disabled={isSubmitting || !selectedServiceId || !selectedSessionId}
            >
              {isSubmitting ? <Loader2 className='animate-spin' /> : 'إصدار التذكرة'}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
