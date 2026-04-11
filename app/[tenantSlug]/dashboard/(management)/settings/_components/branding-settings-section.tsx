import { ClinicImage } from '@/components/shared/clinic-image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Textarea } from '@/components/ui/textarea'
import { UpdateSettingsInput } from '@/validation/settings'
import { Image as ImageIcon, Loader2, Upload } from 'lucide-react'
import { RefObject } from 'react'
import { UseFormReturn } from 'react-hook-form'

interface BrandingSettingsSectionProps {
  form: UseFormReturn<UpdateSettingsInput>
  logoInputRef: RefObject<HTMLInputElement | null>
  imageInputRef: RefObject<HTMLInputElement | null>
  isUploadingLogo: boolean
  isUploadingImage: boolean
  logoPreviewUrl: string | null
  imagePreviewUrl: string | null
  onLogoUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>
}

export function BrandingSettingsSection({
  form,
  logoInputRef,
  imageInputRef,
  isUploadingLogo,
  isUploadingImage,
  logoPreviewUrl,
  imagePreviewUrl,
  onLogoUpload,
  onImageUpload,
}: BrandingSettingsSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>الهوية والمظهر</CardTitle>
      </CardHeader>
      <CardContent className='space-y-6'>
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
          <div className='flex items-center gap-6 p-4 border rounded-lg bg-muted/20'>
            <div className='relative h-20 w-20 shrink-0 rounded-full border-2 border-dashed flex items-center justify-center overflow-hidden bg-background'>
              {isUploadingLogo ? (
                <Loader2 className='animate-spin' />
              ) : (
                <ClinicImage
                  src={logoPreviewUrl || form.watch('logoUrl')}
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
                onClick={() => logoInputRef.current?.click()}
                disabled={isUploadingLogo}
              >
                <Upload className='w-4 h-4 ml-2' /> رفع الشعار
              </Button>
              <input
                type='file'
                className='hidden'
                ref={logoInputRef}
                onChange={onLogoUpload}
                accept='image/*'
              />
            </div>
          </div>

          <div className='flex items-center gap-6 p-4 border rounded-lg bg-muted/20'>
            <div className='relative h-20 w-20 shrink-0 rounded-lg border-2 border-dashed flex items-center justify-center overflow-hidden bg-background'>
              {isUploadingImage ? (
                <Loader2 className='animate-spin' />
              ) : form.watch('imgUrl') || imagePreviewUrl ? (
                <ClinicImage
                  src={imagePreviewUrl || form.watch('imgUrl')}
                  alt='Clinic Cover'
                  fill
                  fallbackType='general'
                  className='object-cover'
                />
              ) : (
                <ImageIcon className='h-8 w-8 text-muted-foreground/40' />
              )}
            </div>
            <div className='space-y-1.5'>
              <h3 className='font-semibold text-sm'>صورة الغلاف</h3>
              <Button
                type='button'
                variant='secondary'
                size='sm'
                onClick={() => imageInputRef.current?.click()}
                disabled={isUploadingImage}
              >
                <Upload className='w-4 h-4 ml-2' /> رفع صورة الغلاف
              </Button>
              <input
                type='file'
                className='hidden'
                ref={imageInputRef}
                onChange={onImageUpload}
                accept='image/*'
              />
            </div>
          </div>
        </div>

        <FormField
          control={form.control}
          name='description'
          render={({ field }) => (
            <FormItem>
              <FormLabel>وصف العيادة</FormLabel>
              <FormControl>
                <Textarea {...field} value={field.value || ''} rows={5} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  )
}
