'use client'

import { valibotResolver } from '@hookform/resolvers/valibot'
import { AlertCircle, Camera, Clock, Loader2, Plus } from 'lucide-react'
import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
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

import { createDoctorAction } from '@/actions/doctor/create-doctor'
import { uploadDoctorPhotoAction } from '@/actions/doctor/upload-photo'
import { ClinicImage } from '@/components/shared/clinic-image'
import { MEDICAL_SPECIALTIES } from '@/constants/specialties'
import { CreateDoctorInput, CreateDoctorSchema } from '@/validation/doctor'

export function AddDoctorDialog({ tenantSlug }: { tenantSlug: string }) {
  const [open, setOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<CreateDoctorInput>({
    resolver: valibotResolver(CreateDoctorSchema),
    defaultValues: {
      name: '',
      username: '',
      password: '',
      phone: '',
      specialty: '',
      urgentInsertAfterCount: 0, // 👈 التعديل هنا
      avgVisitDurationMinutes: 15,
      bio: '',
    },
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) return toast.error('حجم الصورة يجب أن لا يتعدى 2 ميجا')

      if (previewUrl) URL.revokeObjectURL(previewUrl)

      const objectUrl = URL.createObjectURL(file)
      setSelectedFile(file)
      setPreviewUrl(objectUrl)
    }
  }

  const handleReset = () => {
    form.reset()
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setSelectedFile(null)
    setPreviewUrl(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const onSubmit = async (values: CreateDoctorInput) => {
    setIsSubmitting(true)
    try {
      const res = await createDoctorAction(values, tenantSlug)

      if (res.success && res.data) {
        const newDoctorId = res.data.id

        if (selectedFile) {
          const formData = new FormData()
          formData.append('file', selectedFile)
          const photoRes = await uploadDoctorPhotoAction(tenantSlug, newDoctorId, formData)
          if (!photoRes.success) toast.error('تم إنشاء الدكتور ولكن فشل رفع الصورة')
        }

        toast.success('تم إضافة الطبيب بنجاح')
        setOpen(false)
        handleReset()
      } else {
        toast.error(res.message || 'فشل إنشاء الحساب')
      }
    } catch (error) {
      toast.error('حدث خطأ غير متوقع')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        setOpen(val)
        if (!val) handleReset()
      }}
    >
      <DialogTrigger asChild>
        <Button className='gap-2 shadow-sm'>
          <Plus className='h-4 w-4' /> طبيب جديد
        </Button>
      </DialogTrigger>

      <DialogContent className='sm:max-w-2xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='text-xl font-bold'>بيانات الطبيب الجديد</DialogTitle>
        </DialogHeader>

        <div className='flex flex-col items-center justify-center gap-2 py-4'>
          <div
            className='relative h-24 w-24 rounded-full border-2 border-dashed border-primary/40 flex items-center justify-center bg-muted/50 overflow-hidden group cursor-pointer hover:border-primary transition-all shadow-sm'
            onClick={() => fileInputRef.current?.click()}
          >
            <ClinicImage
              src={previewUrl}
              alt='Doctor Preview'
              fill
              fallbackType='doctor'
              className='object-cover'
            />

            <div className='absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity'>
              <Camera className='text-white w-6 h-6' />
            </div>
          </div>
          <input
            type='file'
            className='hidden'
            ref={fileInputRef}
            onChange={handleFileChange}
            accept='image/*'
          />
          <span className='text-xs font-medium text-muted-foreground'>اضغط لرفع صورة تعريفية</span>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-5' autoComplete='off'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <FormField
                control={form.control}
                name='name'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الاسم ثلاثي</FormLabel>
                    <FormControl>
                      <Input placeholder='د. محمد أحمد' className='h-11' {...field} />
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
                      <Input className='h-11' placeholder='01xxxxxxxxx' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <FormField
                control={form.control}
                name='username'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>اسم المستخدم</FormLabel>
                    <FormControl>
                      <Input placeholder='dr_mohamed' className='h-11' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='password'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>كلمة المرور</FormLabel>
                    <FormControl>
                      <Input type='password' placeholder='******' className='h-11' {...field} />
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
                        <SelectValue placeholder='اختر التخصص' />
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
                    <Textarea
                      placeholder='خبرات الطبيب ومؤهلاته...'
                      className='resize-none h-20 bg-background'
                      {...field}
                    />
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
                      <Clock className='w-4 h-4 text-primary' /> مدة الكشف التقريبية (دقيقة)
                    </FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        className='h-11 bg-background'
                        {...field}
                        value={(field.value as number) ?? ''}
                        onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
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
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className='animate-spin w-5 h-5 ml-2' /> جاري الإضافة...
                </>
              ) : (
                'حفظ وإضافة الطبيب'
              )}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
