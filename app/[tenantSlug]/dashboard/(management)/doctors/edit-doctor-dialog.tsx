'use client'

import { valibotResolver } from '@hookform/resolvers/valibot'
import { AlertCircle, Camera, Clock, Loader2 } from 'lucide-react'
import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
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

import { updateDoctorAction } from '@/actions/doctor/update-doctor'
import { uploadDoctorPhotoAction } from '@/actions/doctor/upload-photo'
import { MEDICAL_SPECIALTIES } from '@/constants/specialties'
import { IDoctor } from '@/types/doctor'
import { UpdateDoctorInput, UpdateDoctorSchema } from '@/validation/doctor'
import { ClinicImage } from '@/components/shared/clinic-image'

interface EditDoctorDialogProps {
  doctor: IDoctor
  tenantSlug: string
  isOpen: boolean
  onClose: () => void
}

export function EditDoctorDialog({ doctor, tenantSlug, isOpen, onClose }: EditDoctorDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const form = useForm<UpdateDoctorInput>({
    resolver: valibotResolver(UpdateDoctorSchema),
    defaultValues: {
      name: doctor.name,
      phone: doctor.phone || '',
      specialty: doctor.specialty,
      bio: doctor.bio || '',
      urgentInsertAfterCount: doctor.urgentInsertAfterCount ?? 0, // 👈 التعديل هنا
      avgVisitDurationMinutes: doctor.avgVisitDurationMinutes,
      photoUrl: doctor.photoUrl || '',
    },
  })

  const watchPhotoUrl = form.watch('photoUrl')

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) return toast.error('الصورة كبيرة جداً (الحد الأقصى 2 ميجا)')

    const objectUrl = URL.createObjectURL(file)
    setPreviewUrl(objectUrl)

    const formData = new FormData()
    formData.append('file', file)

    setIsUploading(true)
    try {
      const res = await uploadDoctorPhotoAction(tenantSlug, doctor.id, formData)
      if (res.success && res.data?.publicUrl) {
        form.setValue('photoUrl', res.data.publicUrl, { shouldDirty: true })
        toast.success('تم تحديث صورة الطبيب')
      } else {
        toast.error(res.message || 'فشل في رفع الصورة')
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء الرفع')
    } finally {
      setIsUploading(false)
    }
  }

  const onSubmit = async (values: UpdateDoctorInput) => {
    const res = await updateDoctorAction(doctor.id, tenantSlug, values)
    if (res.success) {
      toast.success('تم تحديث بيانات الطبيب بنجاح')
      onClose()
    } else {
      toast.error(res.message || 'حدث خطأ أثناء التحديث')
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className='sm:max-w-2xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='text-xl font-bold'>تعديل بيانات الطبيب</DialogTitle>
        </DialogHeader>

        <div className='flex flex-col items-center gap-3 py-4'>
          <div className='relative h-24 w-24 rounded-full border-2 border-dashed border-primary/40 flex items-center justify-center bg-muted/50 overflow-hidden group shadow-sm'>
            {isUploading ? (
              <Loader2 className='animate-spin text-primary w-6 h-6' />
            ) : (
              <ClinicImage
                src={previewUrl || watchPhotoUrl}
                alt={doctor.name}
                fill
                fallbackType='doctor'
                className='h-full w-full object-cover'
              />
            )}

            <button
              type='button'
              onClick={() => fileInputRef.current?.click()}
              className='absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-10'
            >
              <Camera className='text-white w-6 h-6' />
            </button>
          </div>
          <input
            type='file'
            className='hidden'
            ref={fileInputRef}
            onChange={handlePhotoUpload}
            accept='image/*'
          />
          <p className='text-xs font-medium text-muted-foreground'>اضغط على الصورة لتغييرها</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-5'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <FormField
                control={form.control}
                name='name'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الاسم ثلاثي</FormLabel>
                    <FormControl>
                      <Input className='h-11' {...field} />
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
                      <Input className='h-11' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name='specialty'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>التخصص</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className='h-11'>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className='max-h-52'>
                      {MEDICAL_SPECIALTIES.map((spec) => (
                        <SelectItem key={spec} value={spec}>
                          {spec}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='bio'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>النبذة التعريفية</FormLabel>
                  <FormControl>
                    <Textarea className='h-20 resize-none bg-background' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/20 p-5 rounded-xl border border-border/50'>
              <FormField
                control={form.control}
                name='avgVisitDurationMinutes'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='flex items-center gap-2'>
                      <Clock className='w-4 h-4 text-primary' /> مدة الكشف (دقيقة)
                    </FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        className='h-11 bg-background'
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='urgentInsertAfterCount'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='flex items-center gap-2'>
                      <AlertCircle className='w-4 h-4 text-destructive' /> نظام إدراج الطوارئ
                    </FormLabel>
                    <Select
                      onValueChange={(val) => field.onChange(Number(val))}
                      defaultValue={String(field.value)}
                    >
                      <FormControl>
                        <SelectTrigger className='h-11 bg-background border-destructive/20 focus:ring-destructive/30'>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {/* 👈 التعديل هنا للقِيَم الجديدة بوضوح */}
                        <SelectItem value='0'>مباشرة (أول الطابور)</SelectItem>
                        <SelectItem value='1'>بعد مريض واحد</SelectItem>
                        <SelectItem value='2'>بعد مريضين</SelectItem>
                        <SelectItem value='3'>بعد 3 مرضى</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button
              type='submit'
              className='w-full h-12 text-base font-bold shadow-lg shadow-primary/20 mt-2'
              disabled={form.formState.isSubmitting || isUploading}
            >
              {form.formState.isSubmitting ? (
                <>
                  <Loader2 className='animate-spin w-5 h-5 ml-2' /> جاري التحديث...
                </>
              ) : (
                'تحديث البيانات'
              )}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
