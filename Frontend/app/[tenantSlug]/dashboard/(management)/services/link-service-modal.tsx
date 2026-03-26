'use client'

import { valibotResolver } from '@hookform/resolvers/valibot'
import { Link2, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { upsertDoctorLinkAction } from '@/actions/service/doctor-services'
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
  FormDescription,
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
import { Switch } from '@/components/ui/switch'
import { IClinicService, IDoctorServiceLink } from '@/types/services'
import { DoctorLinkInput, DoctorLinkSchema } from '@/validation/doctor-services'

interface Props {
  tenantSlug: string
  doctorId: string
  catalogServices: IClinicService[]
  existingLink?: IDoctorServiceLink // لو مبعوتة يبقى إحنا في وضع التعديل
  children?: React.ReactNode // عشان نقدر نغير شكل الزرار من بره
}

export function LinkServiceModal({
  tenantSlug,
  doctorId,
  catalogServices,
  existingLink,
  children,
}: Props) {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  const form = useForm({
    resolver: valibotResolver(DoctorLinkSchema),
    defaultValues: {
      clinicServiceId: existingLink?.clinicServiceId || '',
      overridePrice: existingLink?.overridePrice ?? null,
      overrideDurationMinutes: existingLink?.overrideDurationMinutes ?? null,
      isActive: existingLink?.isActive ?? true,
    },
  })

  // لما اليوزر يختار خدمة، نجيب السعر الافتراضي نعرضهوله كمعلومة
  const selectedServiceId = form.watch('clinicServiceId')
  const activeCatalogService = catalogServices.find((s) => s.id === selectedServiceId)

  const onSubmit = async (values: DoctorLinkInput) => {
    try {
      const result = await upsertDoctorLinkAction(tenantSlug, doctorId, values.clinicServiceId, {
        overridePrice: values.overridePrice,
        overrideDurationMinutes: values.overrideDurationMinutes,
        isActive: values.isActive,
      })

      if (result.success) {
        toast.success(existingLink ? 'تم تعديل التسعير بنجاح' : 'تم ربط الخدمة بنجاح')
        setOpen(false)
        router.refresh()
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      toast.error('حدث خطأ غير متوقع')
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button className='font-bold'>
            <Link2 className='mr-2 h-4 w-4' /> ربط خدمة للطبيب
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className='sm:max-w-125' dir='rtl'>
        <DialogHeader>
          <DialogTitle>{existingLink ? 'تعديل تسعير الخدمة' : 'ربط خدمة جديدة للطبيب'}</DialogTitle>
          <DialogDescription>
            يمكنك تخصيص سعر أو مدة محددة لهذا الطبيب، أو تركها فارغة لاستخدام السعر الافتراضي
            للعيادة.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-5 mt-2'>
            <FormField
              control={form.control}
              name='clinicServiceId'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>اختر الخدمة من الكتالوج</FormLabel>
                  <Select
                    disabled={!!existingLink} // مينفعش نغير الخدمة لو بنعدل
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className='text-right'>
                        <SelectValue placeholder='اختر الخدمة...' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {catalogServices.map((svc) => (
                        <SelectItem key={svc.id} value={svc.id} className='text-right'>
                          {svc.name} - ({svc.defaultPrice} ج.م)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className='grid grid-cols-2 gap-4 p-4 bg-muted/40 rounded-lg border'>
              <FormField
                control={form.control}
                name='overridePrice'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>السعر الخاص بالطبيب</FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        placeholder={
                          activeCatalogService
                            ? `${activeCatalogService.defaultPrice} (الافتراضي)`
                            : 'السعر الافتراضي'
                        }
                        value={field.value === null ? '' : field.value}
                        onChange={(e) =>
                          field.onChange(e.target.value === '' ? null : Number(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormDescription className='text-[10px]'>
                      اتركه فارغاً للسعر الافتراضي
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='overrideDurationMinutes'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>المدة الخاصة بالطبيب</FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        placeholder={
                          activeCatalogService
                            ? `${activeCatalogService.defaultDurationMinutes} د (الافتراضي)`
                            : 'المدة الافتراضية'
                        }
                        value={field.value === null ? '' : field.value}
                        onChange={(e) =>
                          field.onChange(e.target.value === '' ? null : Number(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormDescription className='text-[10px]'>
                      اتركه فارغاً للمدة الافتراضية
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name='isActive'
              render={({ field }) => (
                <FormItem className='flex items-center justify-between border p-3 rounded-lg'>
                  <FormLabel>تفعيل الخدمة لهذا الطبيب</FormLabel>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} dir='ltr' />
                  </FormControl>
                </FormItem>
              )}
            />

            <Button
              type='submit'
              className='w-full font-bold'
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
              حفظ التخصيص
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
