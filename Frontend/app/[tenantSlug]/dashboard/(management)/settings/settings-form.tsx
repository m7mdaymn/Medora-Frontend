'use client'

import { updateClinicSettings } from '@/actions/settings/update-settings'
import { uploadClinicLogoAction } from '@/actions/settings/upload-logo'
import { DAYS_AR } from '@/types/public'
import { IClinicSettings } from '@/types/settings'
import { UpdateSettingsInput, UpdateSettingsSchema } from '@/validation/settings'
import { valibotResolver } from '@hookform/resolvers/valibot'
import { useRef, useState } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, Upload } from 'lucide-react'
import { ClinicImage } from '../../../../../components/shared/clinic-image'

interface SettingsFormProps {
  initialData: IClinicSettings
  tenantSlug: string
}

export function SettingsForm({ initialData, tenantSlug }: SettingsFormProps) {
  const defaultDays = Object.keys(DAYS_AR) as UpdateSettingsInput['workingHours'][0]['dayOfWeek'][]

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const form = useForm<UpdateSettingsInput>({
    resolver: valibotResolver(UpdateSettingsSchema),
    defaultValues: {
      clinicName: initialData.clinicName || '',
      phone: initialData.phone || '',
      supportWhatsAppNumber: initialData.supportWhatsAppNumber || '',
      address: initialData.address || '',
      city: initialData.city || '',
      logoUrl: initialData.logoUrl || '',
      bookingEnabled: initialData.bookingEnabled,
      cancellationWindowHours: initialData.cancellationWindowHours,
      workingHours: defaultDays.map((dayName) => {
        const backendDay = initialData.workingHours?.find((wh) => wh.dayOfWeek === dayName)
        return backendDay
          ? {
              dayOfWeek: dayName,
              startTime: backendDay.startTime?.split('.')[0] || '09:00:00',
              endTime: backendDay.endTime?.split('.')[0] || '17:00:00',
              isActive: backendDay.isActive,
            }
          : {
              dayOfWeek: dayName,
              startTime: '09:00:00',
              endTime: '17:00:00',
              isActive: false,
            }
      }),
    },
  })

  const { fields } = useFieldArray({ control: form.control, name: 'workingHours' })

  // --- منطق بناء اللينك الكامل ---
  const watchLogoUrl = form.watch('logoUrl')
  const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || ''
  const fullLogoUrl = watchLogoUrl
    ? watchLogoUrl.startsWith('http')
      ? watchLogoUrl
      : `${baseUrl}${watchLogoUrl.startsWith('/') ? '' : '/'}${watchLogoUrl}`
    : ''

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) return toast.error('حجم الصورة يجب أن لا يتعدى 2 ميجا بايت')

    const objectUrl = URL.createObjectURL(file)
    setPreviewUrl(objectUrl)

    const formData = new FormData()
    formData.append('file', file)

    setIsUploadingLogo(true)
    try {
      const res = await uploadClinicLogoAction(tenantSlug, formData)
      if (res.success && res.data?.publicUrl) {
        form.setValue('logoUrl', res.data.publicUrl, { shouldDirty: true })
        toast.success('تم رفع اللوجو بنجاح')
      } else {
        toast.error(res.message || 'فشل في رفع اللوجو')
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء الرفع')
    } finally {
      setIsUploadingLogo(false)
    }
  }

  const onSubmit = async (data: UpdateSettingsInput) => {
    try {
      const response = await updateClinicSettings(tenantSlug, data)
      if (response.success) {
        toast.success('تم حفظ الإعدادات بنجاح')
        setPreviewUrl(null)
      } else {
        toast.error(response.message || 'حدث خطأ أثناء الحفظ')
      }
    } catch (error) {
      toast.error('حدث خطأ غير متوقع')
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
        <Tabs defaultValue='general' className='w-full'>
          <div className='relative w-full overflow-hidden'>
            <TabsList
              className='
              mb-8 
              w-full 
              justify-start 
              h-auto 
              p-1 
              bg-muted/50 
              overflow-x-auto 
              flex-nowrap 
              whitespace-nowrap 
              scrollbar-hide 
              [-ms-overflow-style:none] 
              [scrollbar-width:none] 
              [&::-webkit-scrollbar]:hidden
            '
            >
              <TabsTrigger
                value='general'
                className='py-2.5 px-4 rounded-md data-[state=active]:shadow-sm'
              >
                البيانات الأساسية
              </TabsTrigger>
              <TabsTrigger
                value='contact'
                className='py-2.5 px-4 rounded-md data-[state=active]:shadow-sm'
              >
                أرقام التواصل
              </TabsTrigger>
              <TabsTrigger
                value='booking'
                className='py-2.5 px-4 rounded-md data-[state=active]:shadow-sm'
              >
                إعدادات الحجز
              </TabsTrigger>
              <TabsTrigger
                value='workingHours'
                className='py-2.5 px-4 rounded-md data-[state=active]:shadow-sm'
              >
                أوقات العمل
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value='general'>
            <Card>
              <CardHeader>
                <CardTitle>البيانات الأساسية</CardTitle>
              </CardHeader>
              <CardContent className='space-y-6'>
                <div className='flex items-center gap-6 p-4 border rounded-lg bg-muted/20'>
                  <div className='relative h-20 w-20 shrink-0 rounded-full border-2 border-dashed flex items-center justify-center overflow-hidden bg-background'>
                    {isUploadingLogo ? (
                      <Loader2 className='animate-spin' />
                    ) : (
                      <ClinicImage
                        src={previewUrl || form.watch('logoUrl')} // بياخد البريفيو أو اللينك من الفورم
                        alt='Clinic Logo'
                        fill
                        fallbackType='logo'
                        className='object-cover'
                      />
                    )}
                  </div>
                  <div className='space-y-1.5'>
                    <h3 className='font-semibold text-sm'>شعار العيادة</h3>
                    <Button
                      type='button'
                      variant='secondary'
                      size='sm'
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingLogo}
                    >
                      <Upload className='w-4 h-4 ml-2' /> رفع صورة
                    </Button>
                    <input
                      type='file'
                      className='hidden'
                      ref={fileInputRef}
                      onChange={handleLogoUpload}
                      accept='image/*'
                    />
                  </div>
                </div>
                <FormField
                  control={form.control}
                  name='clinicName'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>اسم العيادة</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <FormField
                    control={form.control}
                    name='city'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>المدينة</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name='address'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>العنوان</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value='contact'>
            <Card>
              <CardHeader>
                <CardTitle>أرقام التواصل</CardTitle>
              </CardHeader>
              <CardContent className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <FormField
                  control={form.control}
                  name='phone'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>رقم هاتف العيادة</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='supportWhatsAppNumber'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>رقم واتساب الدعم (للمرضى)</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value='booking'>
            <Card>
              <CardHeader>
                <CardTitle>إعدادات الحجز</CardTitle>
              </CardHeader>
              <CardContent className='space-y-6'>
                <FormField
                  control={form.control}
                  name='bookingEnabled'
                  render={({ field }) => (
                    <FormItem className='flex items-center justify-between border p-4 rounded-lg'>
                      <FormLabel>تفعيل الحجز الأونلاين</FormLabel>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} dir='ltr' />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='cancellationWindowHours'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>فترة الإلغاء (ساعات)</FormLabel>
                      <FormControl>
                        <Input
                          type='number'
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value='workingHours'>
            <Card>
              <CardHeader>
                <CardTitle>أوقات العمل</CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                {fields.map((field, index) => (
                  <div key={field.id} className='flex items-end gap-4 border-b pb-4'>
                    <div className='w-24 font-bold'>{DAYS_AR[field.dayOfWeek]}</div>
                    <FormField
                      control={form.control}
                      name={`workingHours.${index}.startTime`}
                      render={({ field }) => (
                        <FormItem className='flex-1'>
                          <FormLabel>من</FormLabel>
                          <FormControl>
                            <Input type='time' step='1' {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`workingHours.${index}.endTime`}
                      render={({ field }) => (
                        <FormItem className='flex-1'>
                          <FormLabel>إلى</FormLabel>
                          <FormControl>
                            <Input type='time' step='1' {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`workingHours.${index}.isActive`}
                      render={({ field }) => (
                        <FormItem className='pb-2'>
                          <FormLabel>يعمل؟</FormLabel>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              dir='ltr'
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className='flex justify-end'>
          <Button
            type='submit'
            className='w-full md:w-auto'
            size='lg'
            disabled={form.formState.isSubmitting || isUploadingLogo}
          >
            {form.formState.isSubmitting ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
