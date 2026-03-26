'use client'

import { valibotResolver } from '@hookform/resolvers/valibot'
import { format } from 'date-fns'
import { ar } from 'date-fns/locale'
import { Activity, CalendarIcon, Edit, Loader2, UserCircle } from 'lucide-react'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Path, useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'

import { getChronicConditionsAction } from '@/actions/patient/get-chronic-conditions' //
import { updatePatientAction } from '@/actions/patient/update-patient'
import { cn } from '@/lib/utils'
import { IPatient } from '@/types/patient'
import { UpdatePatientInput, UpdatePatientSchema } from '@/validation/patient'
import { updateChronicConditionsAction } from '../../../../../actions/patient/updateChronicConditions'

// 🔴 مصفوفة الأمراض بنوع Path لضمان النوع الصحيح تماماً
const chronicItems: { id: Path<UpdatePatientInput>; label: string }[] = [
  { id: 'diabetes', label: 'سكر' },
  { id: 'hypertension', label: 'ضغط' },
  { id: 'cardiacDisease', label: 'قلب' },
  { id: 'asthma', label: 'حساسية صدر' },
]

export function EditPatientModal({ patient }: { patient: IPatient }) {
  const [open, setOpen] = useState(false)
  const [isLoadingChronic, setIsLoadingChronic] = useState(false)
  const [showChronic, setShowChronic] = useState(false)

  // 🔥 لحفظ الحالة الأصلية من السيرفر للمقارنة (Dirty Check)
  const [initialChronic, setInitialChronic] = useState<Partial<UpdatePatientInput> | null>(null)

  const { tenantSlug } = useParams()

  const form = useForm({
    resolver: valibotResolver(UpdatePatientSchema),
    defaultValues: {
      name: patient.name,
      phone: patient.phone,
      gender: (patient.gender as 'Male' | 'Female') || 'Male',
      dateOfBirth: new Date(patient.dateOfBirth),
      address: patient.address || '',
      notes: patient.notes || '',
      diabetes: false,
      hypertension: false,
      cardiacDisease: false,
      asthma: false,
      otherChronic: '',
    },
  })

  // 🔴 جلب البيانات الطبية المنفصلة
  useEffect(() => {
    if (open) {
      const fetchChronicData = async () => {
        setIsLoadingChronic(true)
        const res = await getChronicConditionsAction(patient.id, tenantSlug as string)
        if (res.success && res.data) {
          const chronicData = {
            diabetes: !!res.data.diabetes,
            hypertension: !!res.data.hypertension,
            cardiacDisease: !!res.data.cardiacDisease,
            asthma: !!res.data.asthma,
            otherChronic: res.data.otherNotes || '',
          }

          setInitialChronic(chronicData) // حفظ النسخة الأصلية

          form.reset({
            ...form.getValues(),
            ...chronicData,
          })

          if (Object.values(chronicData).some((val) => val === true) || res.data.otherNotes) {
            setShowChronic(true)
          }
        }
        setIsLoadingChronic(false)
      }
      fetchChronicData()
    }
  }, [open, patient.id, tenantSlug, form])

  const onSubmit = async (values: UpdatePatientInput) => {
    try {
      // 1. تحديث البيانات الأساسية
      const result = await updatePatientAction(patient.id, values, tenantSlug as string)

      if (result.success) {
        const hasChronicChanges =
          initialChronic &&
          (values.diabetes !== initialChronic.diabetes ||
            values.hypertension !== initialChronic.hypertension ||
            values.cardiacDisease !== initialChronic.cardiacDisease ||
            values.asthma !== initialChronic.asthma ||
            values.otherChronic !== initialChronic.otherChronic)

        if (hasChronicChanges) {
          await updateChronicConditionsAction(
            patient.id,
            {
              diabetes: values.diabetes || false,
              hypertension: values.hypertension || false,
              cardiacDisease: values.cardiacDisease || false,
              asthma: values.asthma || false,
              other: !!values.otherChronic,
              otherNotes: values.otherChronic || '',
            },
            tenantSlug as string,
          )
        }

        toast.success('تم تحديث ملف المريض بنجاح')
        setOpen(false)
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      toast.error('حدث خطأ غير متوقع أثناء التعديل')
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <div className='relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground'>
          <Edit className='w-4 h-4 ml-2 text-muted-foreground' />
          تعديل البيانات
        </div>
      </DialogTrigger>

      <DialogContent className='sm:max-w-137.5 max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <UserCircle className='h-5 w-5 text-primary' />
            تعديل ملف: {patient.name}
          </DialogTitle>
        </DialogHeader>

        {isLoadingChronic ? (
          <div className='flex flex-col items-center justify-center py-12 space-y-4'>
            <Loader2 className='h-8 w-8 animate-spin text-primary' />
            <p className='text-sm text-muted-foreground'>جاري تحميل السجل الطبي...</p>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
              <div className='grid grid-cols-2 gap-4'>
                <FormField
                  control={form.control}
                  name='name'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>اسم المريض</FormLabel>
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
                      <FormLabel>رقم الهاتف</FormLabel>
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
                        <PopoverContent className='w-auto p-0' align='start'>
                          {/* 🔴 الحل النهائي لمشكلة السنين */}
                          <Calendar
                            mode='single'
                            selected={field.value}
                            onSelect={field.onChange}
                            captionLayout='dropdown'
                            fromYear={1900}
                            toYear={new Date().getFullYear()}
                            locale={ar}
                          />
                        </PopoverContent>
                      </Popover>
                    </FormItem>
                  )}
                />
              </div>

              <div className='space-y-4 border-t pt-4'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    <Activity className='h-4 w-4 text-primary' />
                    <span className='font-bold text-sm'>تعديل التاريخ الطبي</span>
                  </div>
                  <Switch checked={showChronic} onCheckedChange={setShowChronic} dir='ltr' />
                </div>

                {showChronic && (
                  <div className='grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-xl animate-in fade-in zoom-in-95 duration-200'>
                    {chronicItems.map((item) => (
                      <FormField
                        key={item.id}
                        control={form.control}
                        name={item.id}
                        render={({ field }) => (
                          <FormItem className='flex flex-row items-center space-x-reverse space-x-3 space-y-0'>
                            <FormControl>
                              <Checkbox checked={!!field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                            <FormLabel className='text-sm font-medium cursor-pointer'>
                              {item.label}
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    ))}
                    <div className='col-span-2 mt-2'>
                      <FormField
                        control={form.control}
                        name='otherChronic'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className='text-xs text-muted-foreground'>
                              تنبيهات طبية أخرى
                            </FormLabel>
                            <FormControl>
                              <Input {...field} className='h-8 text-xs' />
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
                      <Textarea {...field} className='resize-none' />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className='flex gap-3 pt-4 border-t'>
                <Button
                  type='button'
                  variant='outline'
                  className='flex-1 font-bold'
                  onClick={() => setOpen(false)}
                >
                  إلغاء
                </Button>
                <Button
                  type='submit'
                  className='flex-1 font-bold'
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                  حفظ التعديلات
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  )
}
