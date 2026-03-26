'use client'

import { valibotResolver } from '@hookform/resolvers/valibot'
import { format } from 'date-fns'
import { ar } from 'date-fns/locale'
import { CalendarIcon, CheckCircle2, Loader2, MessageCircle, UserPlus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Path, useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Checkbox } from '@/components/ui/checkbox' // تأكد من وجود المكون ده عندك
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
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
import { Switch } from '@/components/ui/switch' // أو Switch لليوزبيليتي
import { Textarea } from '@/components/ui/textarea'

import { cn } from '@/lib/utils'
import { createPatientAction } from '../../../../../actions/patient/createPatient'
import { updateChronicConditionsAction } from '../../../../../actions/patient/updateChronicConditions'
import { CreatePatientInput, CreatePatientSchema } from '../../../../../validation/patient'

interface AddPatientModalProps {
  tenantSlug: string
  initialPhone?: string
  trigger?: React.ReactNode
  onSuccess?: (patientId: string, patientName: string) => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function AddPatientModal({
  tenantSlug,
  initialPhone,
  trigger,
  onSuccess,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
}: AddPatientModalProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setOpen = setControlledOpen || setInternalOpen

  const [credentials, setCredentials] = useState<{
    username: string
    password: string
    name: string
    phone: string
  } | null>(null)

  const [newPatientData, setNewPatientData] = useState<{ id: string; name: string } | null>(null)

  const chronicItems: { id: Path<CreatePatientInput>; label: string }[] = [
    { id: 'diabetes', label: 'سكر' },
    { id: 'hypertension', label: 'ضغط' },
    { id: 'cardiacDisease', label: 'قلب' },
    { id: 'asthma', label: 'حساسية صدر' },
  ]

  // 🔴 State لإظهار أو إخفاء قسم الأمراض المزمنة في الـ UI
  const [showChronicFields, setShowChronicFields] = useState(false)

  const form = useForm({
    resolver: valibotResolver(CreatePatientSchema),
    defaultValues: {
      name: '',
      phone: initialPhone || '',
      address: '',
      notes: '',
      gender: 'Male',
      // القيم الافتراضية للتايبس الجديدة
      diabetes: false,
      hypertension: false,
      cardiacDisease: false,
      asthma: false,
      otherChronic: '',
    },
  })

  useEffect(() => {
    if (initialPhone) form.setValue('phone', initialPhone)
  }, [initialPhone, form])

  const onSubmit = async (values: CreatePatientInput) => {
    try {
      // 1. إنشاء المريض الأساسي
      const result = await createPatientAction(values, tenantSlug)

      if (result.success && result.data) {
        const patientId = result.data.patient.id

        // 🛑 المنطق الذكي: لو اختار أمراض، اضرب الريكوست التاني
        const hasChronicData =
          values.diabetes ||
          values.hypertension ||
          values.cardiacDisease ||
          values.asthma ||
          values.otherChronic

        if (hasChronicData) {
          await updateChronicConditionsAction(
            patientId,
            {
              diabetes: values.diabetes || false,
              hypertension: values.hypertension || false,
              cardiacDisease: values.cardiacDisease || false,
              asthma: values.asthma || false,
              other: !!values.otherChronic,
              otherNotes: values.otherChronic || '',
            },
            tenantSlug,
          )
        }

        toast.success('تم إنشاء ملف المريض بنجاح')

        setCredentials({
          username: result.data.username || '',
          password: result.data.password || result.data.initialPassword || '',
          name: values.name,
          phone: values.phone,
        })

        setNewPatientData({
          id: result.data.patient.id,
          name: result.data.patient.name,
        })
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء حفظ البيانات')
    }
  }

  const handleSendWhatsApp = () => {
    if (!credentials) return
    const phone = credentials.phone.startsWith('0')
      ? '20' + credentials.phone.substring(1)
      : credentials.phone.replace(/\+/g, '')
    const clinicLink = `${window.location.origin}/${tenantSlug}/patient/login`
    const message = `بيانات دخولك للعيادة:\nالمستخدم: *${credentials.username}*\nكلمة المرور: *${credentials.password}*\nالرابط: ${clinicLink}`
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank')
  }

  const handleClose = () => {
    setOpen(false)
    if (onSuccess && newPatientData) onSuccess(newPatientData.id, newPatientData.name)
    setTimeout(() => {
      form.reset()
      setCredentials(null)
      setNewPatientData(null)
      setShowChronicFields(false)
    }, 200)
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => (!isOpen ? handleClose() : setOpen(true))}>
      {controlledOpen === undefined && (
        <DialogTrigger asChild>
          {trigger || (
            <Button>
              <UserPlus className='mr-2 h-4 w-4' /> مريض جديد
            </Button>
          )}
        </DialogTrigger>
      )}

      <DialogContent className='sm:max-w-137.5 max-h-[90vh] overflow-y-auto'>
        {credentials ? (
          <div className='flex flex-col items-center justify-center py-6 space-y-6'>
            <div className='flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100'>
              <CheckCircle2 className='h-10 w-10 text-emerald-600' />
            </div>
            <DialogTitle>تم التسجيل بنجاح</DialogTitle>
            <div className='w-full bg-muted/50 p-4 rounded-lg space-y-3 border'>
              <div className='flex justify-between'>
                <span className='text-muted-foreground'>اسم المستخدم:</span>
                <b>{credentials.username}</b>
              </div>
              <div className='flex justify-between'>
                <span className='text-muted-foreground'>كلمة المرور:</span>
                <b>{credentials.password}</b>
              </div>
            </div>
            <div className='flex w-full gap-3'>
              <Button onClick={handleClose} variant='outline' className='flex-1'>
                إغلاق
              </Button>
              <Button
                onClick={handleSendWhatsApp}
                className='flex-1 bg-green-600 hover:bg-green-500'
              >
                <MessageCircle className='mr-2 h-4 w-4' /> واتساب
              </Button>
            </div>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className='flex items-center gap-2'>
                <UserPlus className='h-5 w-5 text-primary' /> إضافة مريض
              </DialogTitle>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-5'>
                <div className='grid grid-cols-2 gap-4'>
                  <FormField
                    control={form.control}
                    name='name'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الاسم</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name='phone'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الهاتف</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className='grid grid-cols-2 gap-4'>
                  <FormField
                    control={form.control}
                    name='gender'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>النوع</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value='Male'>ذكر</SelectItem>
                            <SelectItem value='Female'>أنثى</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name='dateOfBirth'
                    render={({ field }) => (
                      <FormItem className='flex flex-col'>
                        <FormLabel className='mb-2'>تاريخ الميلاد</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant='outline'
                              className={cn(
                                'w-full text-right',
                                !field.value && 'text-muted-foreground',
                              )}
                            >
                              {field.value
                                ? format(field.value, 'PPP', { locale: ar })
                                : 'اختر التاريخ'}
                              <CalendarIcon className='mr-auto h-4 w-4 opacity-50' />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className='w-auto p-0'>
                            <Calendar
                              mode='single'
                              selected={field.value}
                              onSelect={field.onChange}
                              // 🔴 السطرين دول هم السحر
                              captionLayout='dropdown' 
                              fromYear={1900}
                              toYear={new Date().getFullYear()}
                              // ---------------------------
                              disabled={(date) =>
                                date > new Date() || date < new Date('1900-01-01')
                              }
                              initialFocus
                              locale={ar}
                            />
                          </PopoverContent>
                        </Popover>
                      </FormItem>
                    )}
                  />
                </div>

                {/* 🔴 قسم الأمراض المزمنة المطور */}
                <div className='space-y-4 border-t pt-4'>
                  <div className='flex items-center justify-between'>
                    <div className='space-y-0.5'>
                      <FormLabel className='text-base'>التاريخ الطبي</FormLabel>
                      <FormDescription>هل يعاني المريض من أمراض مزمنة؟</FormDescription>
                    </div>
                    <Switch
                      checked={showChronicFields}
                      onCheckedChange={setShowChronicFields}
                      dir='ltr'
                    />
                  </div>

                  {showChronicFields && (
                    <div className='grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-xl animate-in fade-in slide-in-from-top-2 duration-300'>
                      {chronicItems.map((item) => (
                        <FormField
                          key={item.id}
                          control={form.control}
                          name={item.id}
                          render={({ field }) => (
                            <FormItem className='flex flex-row items-center space-x-reverse space-x-3 space-y-0'>
                              <FormControl>
                                <Checkbox
                                  checked={!!field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <FormLabel className='text-sm font-medium cursor-pointer'>
                                {item.label}
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                      ))}

                      {/* خانة "أخرى" بنوعها المظبوط برضه */}
                      <div className='col-span-2 pt-2 border-t mt-2'>
                        <FormField
                          control={form.control}
                          name='otherChronic'
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className='text-xs text-muted-foreground'>
                                أمراض أو تنبيهات أخرى
                              </FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder='مثلاً: غدة درقية، سيولة..'
                                  className='h-8 text-xs'
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <FormField
                  control={form.control}
                  name='notes'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ملاحظات إضافية</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <DialogFooter className='mt-6'>
                  <Button
                    type='submit'
                    disabled={form.formState.isSubmitting}
                    className='w-full sm:w-auto'
                  >
                    {form.formState.isSubmitting && (
                      <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    )}{' '}
                    حفظ البيانات
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
