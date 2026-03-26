'use client'

import { valibotResolver } from '@hookform/resolvers/valibot'
import { CalendarIcon, Loader2, UserPlus } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
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

import { addSubProfileAction } from '@/actions/patient/add-subprofile'
import { CreateSubPatientSchema, type CreateSubPatientInput } from '@/validation/patient'
import { format } from 'date-fns'
import { ar } from 'date-fns/locale'
import { Calendar } from '../../../../../components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '../../../../../components/ui/popover'
import { cn } from '../../../../../lib/utils'

interface Props {
  parentId: string
  parentName: string
  tenantSlug: string
}

const AddSubProfileModal = ({ parentId, parentName, tenantSlug }: Props) => {
  const [open, setOpen] = useState(false)

  const form = useForm<CreateSubPatientInput>({
    resolver: valibotResolver(CreateSubPatientSchema),
    defaultValues: {
      name: '',
      phone: '',
      gender: 'Male',
    },
  })

  async function onSubmit(values: CreateSubPatientInput) {
    try {
      const res = await addSubProfileAction(tenantSlug, parentId, values)

      if (res.success) {
        toast.success('تم إضافة فرد الأسرة بنجاح')
        form.reset()
        setOpen(false)
      } else {
        toast.error(res.message || 'حدث خطأ ما')
      }
    } catch (error) {
      toast.error('فشل الاتصال بالخادم')
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {/* الـ Trigger متظبط عشان يشتغل جوه DropdownMenuItem بسلاسة */}
        <div
          className='relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground gap-2'
          onClick={(e) => e.stopPropagation()} // منع الـ Dropdown من الانغلاق فوراً
        >
          <UserPlus className='h-4 w-4' />
          <span>إضافة فرد أسرة</span>
        </div>
      </DialogTrigger>

      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>إضافة تابع لـ {parentName}</DialogTitle>
          <DialogDescription>
            ادخل بيانات فرد العائلة الجديد لإضافته للملف الأساسي.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <FormField
              control={form.control}
              name='name'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>الاسم بالكامل</FormLabel>
                  <FormControl>
                    <Input placeholder='اسم القريب...' {...field} />
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
                    <Input placeholder='01xxxxxxxxx' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className='grid grid-cols-2 gap-4'>
              <FormField
                control={form.control}
                name='dateOfBirth'
                render={({ field }) => (
                  <FormItem className='flex flex-col'>
                    <FormLabel className='mb-2.5'>تاريخ الميلاد</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={'outline'}
                            className={cn(
                              'w-full pl-3 text-right font-normal',
                              !field.value && 'text-muted-foreground',
                            )}
                          >
                            {field.value ? (
                              format(field.value, 'PPP', { locale: ar })
                            ) : (
                              <span>يوم / شهر / سنة</span>
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
                          captionLayout='dropdown'
                          fromYear={1900}
                          toYear={new Date().getFullYear()}
                          disabled={(date) => date > new Date() || date < new Date('1900-01-01')}
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
                name='gender'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>النوع</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='اختر...' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value='Male'>ذكر</SelectItem>
                        <SelectItem value='Female'>أنثى</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button type='submit' className='w-full mt-4' disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? (
                <Loader2 className='h-4 w-4 animate-spin' />
              ) : (
                'حفظ البيانات'
              )}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export default AddSubProfileModal
