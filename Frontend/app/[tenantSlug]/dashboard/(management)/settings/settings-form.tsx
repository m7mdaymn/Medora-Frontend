'use client'

import { updateClinicSettings } from '@/actions/settings/update-settings'
import { DAYS_AR } from '@/types/public'
import { IClinicSettings } from '@/types/settings'
import { UpdateSettingsInput, UpdateSettingsSchema } from '@/validation/settings'
import { valibotResolver } from '@hookform/resolvers/valibot'
import { useFieldArray, useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Form } from '@/components/ui/form'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BookingSettingsSection } from './_components/booking-settings-section'
import { BrandingSettingsSection } from './_components/branding-settings-section'
import { ContactSettingsSection } from './_components/contact-settings-section'
import { GeneralSettingsSection } from './_components/general-settings-section'
import { SocialLinksSettingsSection } from './_components/social-links-settings-section'
import { useClinicMediaUpload } from './_components/use-clinic-media-upload'
import { WorkingHoursSettingsSection } from './_components/working-hours-settings-section'

interface SettingsFormProps {
  initialData: IClinicSettings
  tenantSlug: string
}

export function SettingsForm({ initialData, tenantSlug }: SettingsFormProps) {
  const defaultDays = Object.keys(DAYS_AR) as UpdateSettingsInput['workingHours'][0]['dayOfWeek'][]

  const form = useForm<UpdateSettingsInput>({
    resolver: valibotResolver(UpdateSettingsSchema),
    defaultValues: {
      clinicName: initialData.clinicName || '',
      phone: initialData.phone || '',
      whatsAppSenderNumber: initialData.whatsAppSenderNumber || '',
      supportWhatsAppNumber: initialData.supportWhatsAppNumber || '',
      supportPhoneNumber: initialData.supportPhoneNumber || '',
      address: initialData.address || '',
      city: initialData.city || '',
      logoUrl: initialData.logoUrl || '',
      imgUrl: initialData.imgUrl || '',
      description: initialData.description || '',
      socialLinks: {
        website: initialData.socialLinks?.website || '',
        facebook: initialData.socialLinks?.facebook || '',
        instagram: initialData.socialLinks?.instagram || '',
        x: initialData.socialLinks?.x || '',
        youtube: initialData.socialLinks?.youtube || '',
        tiktok: initialData.socialLinks?.tiktok || '',
      },
      bookingEnabled: initialData.bookingEnabled,
      retainCreditOnNoShow: initialData.retainCreditOnNoShow,
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

  const {
    logoInputRef,
    imageInputRef,
    isUploadingLogo,
    isUploadingImage,
    logoPreviewUrl,
    imagePreviewUrl,
    handleLogoUpload,
    handleImageUpload,
    resetPreviewUrls,
  } = useClinicMediaUpload({ tenantSlug, form })

  const onSubmit = async (data: UpdateSettingsInput) => {
    try {
      const cleanedSocialLinks = Object.fromEntries(
        Object.entries(data.socialLinks || {}).filter(([, value]) => value?.trim()),
      )

      const response = await updateClinicSettings(tenantSlug, {
        ...data,
        socialLinks: Object.keys(cleanedSocialLinks).length > 0 ? cleanedSocialLinks : undefined,
      })
      if (response.success) {
        toast.success('تم حفظ الإعدادات بنجاح')
        resetPreviewUrls()
      } else {
        toast.error(response.message || 'حدث خطأ أثناء الحفظ')
      }
    } catch {
      toast.error('حدث خطأ غير متوقع')
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
        <input type='hidden' {...form.register('logoUrl')} />
        <input type='hidden' {...form.register('imgUrl')} />

        <Tabs defaultValue='branding' className='w-full'>
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
                value='branding'
                className='py-2.5 px-4 rounded-md data-[state=active]:shadow-sm'
              >
                الهوية والمظهر
              </TabsTrigger>
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
                value='social'
                className='py-2.5 px-4 rounded-md data-[state=active]:shadow-sm'
              >
                روابط السوشيال
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

          <TabsContent value='branding'>
            <BrandingSettingsSection
              form={form}
              logoInputRef={logoInputRef}
              imageInputRef={imageInputRef}
              isUploadingLogo={isUploadingLogo}
              isUploadingImage={isUploadingImage}
              logoPreviewUrl={logoPreviewUrl}
              imagePreviewUrl={imagePreviewUrl}
              onLogoUpload={handleLogoUpload}
              onImageUpload={handleImageUpload}
            />
          </TabsContent>

          <TabsContent value='general'>
            <GeneralSettingsSection form={form} />
          </TabsContent>

          <TabsContent value='contact'>
            <ContactSettingsSection form={form} />
          </TabsContent>

          <TabsContent value='social'>
            <SocialLinksSettingsSection form={form} />
          </TabsContent>

          <TabsContent value='booking'>
            <BookingSettingsSection form={form} />
          </TabsContent>

          <TabsContent value='workingHours'>
            <WorkingHoursSettingsSection form={form} fields={fields} />
          </TabsContent>
        </Tabs>

        <div className='flex justify-end'>
          <Button
            type='submit'
            className='w-full md:w-auto'
            size='lg'
            disabled={form.formState.isSubmitting || isUploadingLogo || isUploadingImage}
          >
            {form.formState.isSubmitting ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
