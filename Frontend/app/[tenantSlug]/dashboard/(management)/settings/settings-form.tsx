'use client'

import { getBranchesAction } from '@/actions/branch/branches'
import {
  deleteClinicGalleryImageAction,
  uploadClinicGalleryImageAction,
} from '@/actions/settings/clinic-gallery'
import { getClinicPaymentOptionsAction } from '@/actions/settings/get-settings'
import { updateClinicSettings } from '@/actions/settings/update-settings'
import {
  ReplaceClinicPaymentMethodInput,
  replaceClinicPaymentMethodsAction,
} from '@/actions/settings/update-settings'
import { uploadClinicLogoAction } from '@/actions/settings/upload-logo'
import { IBranch } from '@/types/branch'
import { DAYS_AR } from '@/types/public'
import { IClinicPaymentMethod, IClinicSettings } from '@/types/settings'
import { UpdateSettingsInput, UpdateSettingsSchema } from '@/validation/settings'
import { valibotResolver } from '@hookform/resolvers/valibot'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
import { Loader2, Trash2, Upload } from 'lucide-react'
import { ClinicImage } from '../../../../../components/shared/clinic-image'

interface SettingsFormProps {
  initialData: IClinicSettings
  tenantSlug: string
}

interface PaymentMethodDraft {
  tempId: string
  branchId: string
  methodName: string
  providerName: string
  accountName: string
  accountNumber: string
  iban: string
  walletNumber: string
  instructions: string
  isActive: boolean
  displayOrder: number
}

function generateTempId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `pm-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function createPaymentMethodDraft(
  method?: IClinicPaymentMethod,
  fallbackDisplayOrder = 1,
  defaultBranchId = '',
): PaymentMethodDraft {
  if (!method) {
    return {
      tempId: generateTempId(),
      branchId: defaultBranchId,
      methodName: '',
      providerName: '',
      accountName: '',
      accountNumber: '',
      iban: '',
      walletNumber: '',
      instructions: '',
      isActive: true,
      displayOrder: fallbackDisplayOrder,
    }
  }

  return {
    tempId: method.id,
    branchId: method.branchId || '',
    methodName: method.methodName,
    providerName: method.providerName || '',
    accountName: method.accountName || '',
    accountNumber: method.accountNumber || '',
    iban: method.iban || '',
    walletNumber: method.walletNumber || '',
    instructions: method.instructions || '',
    isActive: method.isActive,
    displayOrder: method.displayOrder || fallbackDisplayOrder,
  }
}

export function SettingsForm({ initialData, tenantSlug }: SettingsFormProps) {
  const defaultDays = Object.keys(DAYS_AR) as UpdateSettingsInput['workingHours'][0]['dayOfWeek'][]

  const fileInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)
  const [isUploadingGallery, setIsUploadingGallery] = useState(false)
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [galleryImages, setGalleryImages] = useState(initialData.galleryImages || [])
  const [branches, setBranches] = useState<IBranch[]>([])
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodDraft[]>([])
  const [isLoadingPaymentMethods, setIsLoadingPaymentMethods] = useState(true)
  const [isSavingPaymentMethods, setIsSavingPaymentMethods] = useState(false)
  const [paymentFilterBranchId, setPaymentFilterBranchId] = useState('all')

  const sanitizeOptionalValue = (value: string) => {
    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : undefined
  }

  const visiblePaymentMethods = useMemo(() => {
    if (paymentFilterBranchId === 'all') {
      return paymentMethods
    }

    if (paymentFilterBranchId === 'unscoped') {
      return paymentMethods.filter((method) => !method.branchId)
    }

    return paymentMethods.filter(
      (method) => !method.branchId || method.branchId === paymentFilterBranchId,
    )
  }, [paymentFilterBranchId, paymentMethods])

  const refreshPaymentSettings = useCallback(async () => {
    setIsLoadingPaymentMethods(true)

    const [branchesResponse, paymentOptionsResponse] = await Promise.all([
      getBranchesAction(tenantSlug, true),
      getClinicPaymentOptionsAction(tenantSlug),
    ])

    if (branchesResponse.success && branchesResponse.data) {
      setBranches(branchesResponse.data)
    } else {
      toast.error(branchesResponse.message || 'تعذر تحميل الفروع')
    }

    if (paymentOptionsResponse.success && paymentOptionsResponse.data) {
      const drafts = paymentOptionsResponse.data.methods
        .slice()
        .sort((a, b) => a.displayOrder - b.displayOrder)
        .map((method, index) => createPaymentMethodDraft(method, index + 1))

      setPaymentMethods(drafts)
    } else {
      toast.error(paymentOptionsResponse.message || 'تعذر تحميل وسائل الدفع')
    }

    setIsLoadingPaymentMethods(false)
  }, [tenantSlug])

  useEffect(() => {
    void refreshPaymentSettings()
  }, [refreshPaymentSettings])

  function updatePaymentMethodField<K extends keyof PaymentMethodDraft>(
    methodId: string,
    field: K,
    value: PaymentMethodDraft[K],
  ) {
    setPaymentMethods((current) =>
      current.map((method) =>
        method.tempId === methodId
          ? {
              ...method,
              [field]: value,
            }
          : method,
      ),
    )
  }

  function addPaymentMethodRow() {
    const defaultBranchId =
      paymentFilterBranchId !== 'all' && paymentFilterBranchId !== 'unscoped'
        ? paymentFilterBranchId
        : ''

    setPaymentMethods((current) => {
      const nextDisplayOrder =
        current.length > 0
          ? Math.max(...current.map((method) => method.displayOrder || 0)) + 1
          : 1

      return [...current, createPaymentMethodDraft(undefined, nextDisplayOrder, defaultBranchId)]
    })
  }

  function removePaymentMethodRow(methodId: string) {
    setPaymentMethods((current) => current.filter((method) => method.tempId !== methodId))
  }

  const savePaymentMethods = async () => {
    const normalizedMethods = paymentMethods
      .map((method, index): ReplaceClinicPaymentMethodInput | null => {
        const methodName = method.methodName.trim()
        if (!methodName) {
          return null
        }

        const displayOrder =
          Number.isFinite(method.displayOrder) && method.displayOrder > 0
            ? Math.trunc(method.displayOrder)
            : index + 1

        return {
          branchId: method.branchId || undefined,
          methodName,
          providerName: sanitizeOptionalValue(method.providerName),
          accountName: sanitizeOptionalValue(method.accountName),
          accountNumber: sanitizeOptionalValue(method.accountNumber),
          iban: sanitizeOptionalValue(method.iban),
          walletNumber: sanitizeOptionalValue(method.walletNumber),
          instructions: sanitizeOptionalValue(method.instructions),
          isActive: method.isActive,
          displayOrder,
        }
      })
      .filter((method): method is ReplaceClinicPaymentMethodInput => method !== null)

    if (normalizedMethods.length === 0) {
      toast.error('أضف وسيلة دفع واحدة على الأقل')
      return
    }

    setIsSavingPaymentMethods(true)

    try {
      const response = await replaceClinicPaymentMethodsAction(tenantSlug, normalizedMethods)

      if (!response.success || !response.data) {
        toast.error(response.message || 'فشل تحديث وسائل الدفع')
        return
      }

      const drafts = response.data
        .slice()
        .sort((a, b) => a.displayOrder - b.displayOrder)
        .map((method, index) => createPaymentMethodDraft(method, index + 1))

      setPaymentMethods(drafts)
      toast.success('تم تحديث وسائل الدفع بنجاح')
    } finally {
      setIsSavingPaymentMethods(false)
    }
  }

  const heroPreviewImages = useMemo(() => {
    const galleryUrls = galleryImages.map((image) => image.publicUrl)
    if (galleryUrls.length > 0) {
      return galleryUrls
    }

    if (initialData.imgUrl) {
      return [initialData.imgUrl]
    }

    return []
  }, [galleryImages, initialData.imgUrl])

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
    } catch {
      toast.error('حدث خطأ أثناء الرفع')
    } finally {
      setIsUploadingLogo(false)
    }
  }

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    const oversizedFile = files.find((file) => file.size > 4 * 1024 * 1024)
    if (oversizedFile) {
      toast.error('كل صورة يجب أن لا تتجاوز 4 ميجا بايت')
      return
    }

    setIsUploadingGallery(true)
    try {
      for (const file of files) {
        const formData = new FormData()
        formData.append('file', file)

        const res = await uploadClinicGalleryImageAction(tenantSlug, formData)
        if (res.success && res.data) {
          setGalleryImages((current) => [res.data!, ...current])
        }
      }

      toast.success('تم رفع صور معرض العيادة')
    } catch {
      toast.error('حدث خطأ أثناء رفع صور المعرض')
    } finally {
      setIsUploadingGallery(false)
      if (galleryInputRef.current) {
        galleryInputRef.current.value = ''
      }
    }
  }

  const deleteGalleryImage = async (imageId: string) => {
    setDeletingImageId(imageId)
    try {
      const res = await deleteClinicGalleryImageAction(tenantSlug, imageId)
      if (!res.success) {
        toast.error(res.message || 'فشل حذف الصورة')
        return
      }

      setGalleryImages((current) => current.filter((image) => image.id !== imageId))
      toast.success('تم حذف الصورة من المعرض')
    } finally {
      setDeletingImageId(null)
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
    } catch {
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
                value='payments'
                className='py-2.5 px-4 rounded-md data-[state=active]:shadow-sm'
              >
                وسائل الدفع
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

                <div className='space-y-3 rounded-lg border p-4 bg-muted/10'>
                  <div className='flex flex-wrap items-center justify-between gap-2'>
                    <div>
                      <h3 className='font-semibold text-sm'>صور معرض العيادة</h3>
                      <p className='text-xs text-muted-foreground'>تظهر الصور في الصفحة الرئيسية للعيادة</p>
                    </div>
                    <Button
                      type='button'
                      variant='secondary'
                      size='sm'
                      onClick={() => galleryInputRef.current?.click()}
                      disabled={isUploadingGallery}
                    >
                      {isUploadingGallery ? <Loader2 className='w-4 h-4 animate-spin ml-2' /> : <Upload className='w-4 h-4 ml-2' />}
                      إضافة صور
                    </Button>
                    <input
                      type='file'
                      className='hidden'
                      ref={galleryInputRef}
                      onChange={handleGalleryUpload}
                      accept='image/*'
                      multiple
                    />
                  </div>

                  {heroPreviewImages.length === 0 ? (
                    <div className='text-xs text-muted-foreground rounded-md border border-dashed p-4 text-center'>
                      لا توجد صور حالياً
                    </div>
                  ) : (
                    <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
                      {heroPreviewImages.map((imageUrl, index) => {
                        const imageId = galleryImages[index]?.id || ''

                        return (
                          <div
                            key={`${imageUrl}-${index}`}
                            className='relative h-24 rounded-md overflow-hidden border bg-background'
                          >
                            <ClinicImage
                              src={imageUrl}
                              alt={`gallery-${index + 1}`}
                              fill
                              fallbackType='general'
                              className='object-cover'
                            />

                            {imageId ? (
                              <Button
                                type='button'
                                size='icon'
                                variant='destructive'
                                className='absolute top-1 left-1 h-7 w-7'
                                onClick={() => deleteGalleryImage(imageId)}
                                disabled={deletingImageId === imageId}
                              >
                                {deletingImageId === imageId ? (
                                  <Loader2 className='h-3.5 w-3.5 animate-spin' />
                                ) : (
                                  <Trash2 className='h-3.5 w-3.5' />
                                )}
                              </Button>
                            ) : null}
                          </div>
                        )
                      })}
                    </div>
                  )}
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

          <TabsContent value='payments'>
            <Card>
              <CardHeader className='space-y-3'>
                <div className='flex flex-wrap items-center justify-between gap-2'>
                  <CardTitle>وسائل الدفع</CardTitle>
                  <Button
                    type='button'
                    variant='secondary'
                    size='sm'
                    onClick={addPaymentMethodRow}
                    disabled={isLoadingPaymentMethods || isSavingPaymentMethods}
                  >
                    إضافة وسيلة دفع
                  </Button>
                </div>

                <div className='grid grid-cols-1 gap-2 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]'>
                  <div className='space-y-1'>
                    <p className='text-xs font-medium text-muted-foreground'>فلترة حسب الفرع</p>
                    <select
                      className='h-9 w-full rounded-md border border-input bg-background px-3 text-sm'
                      value={paymentFilterBranchId}
                      onChange={(event) => setPaymentFilterBranchId(event.target.value)}
                      disabled={isLoadingPaymentMethods || isSavingPaymentMethods}
                    >
                      <option value='all'>كل وسائل الدفع</option>
                      <option value='unscoped'>الوسائل العامة فقط</option>
                      {branches.map((branch) => (
                        <option key={branch.id} value={branch.id}>
                          {branch.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className='text-xs text-muted-foreground flex items-end'>
                    الوسائل العامة بدون فرع تظهر في كل الفروع تلقائياً.
                  </div>

                  <div className='flex items-end'>
                    <Button
                      type='button'
                      variant='outline'
                      size='sm'
                      onClick={() => void refreshPaymentSettings()}
                      disabled={isLoadingPaymentMethods || isSavingPaymentMethods}
                    >
                      تحديث
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className='space-y-4'>
                {isLoadingPaymentMethods ? (
                  <div className='h-24 rounded-md border border-dashed flex items-center justify-center text-sm text-muted-foreground'>
                    <Loader2 className='h-4 w-4 animate-spin ml-2' />
                    جاري تحميل وسائل الدفع...
                  </div>
                ) : paymentMethods.length === 0 ? (
                  <div className='h-24 rounded-md border border-dashed flex items-center justify-center text-sm text-muted-foreground'>
                    لا توجد وسائل دفع حالياً. أضف وسيلة دفع للبدء.
                  </div>
                ) : visiblePaymentMethods.length === 0 ? (
                  <div className='h-24 rounded-md border border-dashed flex items-center justify-center text-sm text-muted-foreground'>
                    لا توجد وسائل دفع مطابقة للفلاتر الحالية.
                  </div>
                ) : (
                  visiblePaymentMethods.map((method) => (
                    <div key={method.tempId} className='rounded-lg border p-4 space-y-3'>
                      <div className='grid grid-cols-1 md:grid-cols-[100px_minmax(0,1fr)_auto] gap-3 items-end'>
                        <div className='space-y-1'>
                          <label className='text-sm font-medium'>الترتيب</label>
                          <Input
                            type='number'
                            min={1}
                            value={method.displayOrder}
                            onChange={(event) => {
                              const parsed = Number(event.target.value)
                              updatePaymentMethodField(
                                method.tempId,
                                'displayOrder',
                                Number.isNaN(parsed) ? 1 : parsed,
                              )
                            }}
                            disabled={isSavingPaymentMethods}
                          />
                        </div>

                        <div className='flex items-center justify-between rounded-md border px-3 py-2'>
                          <span className='text-sm'>مفعلة للمرضى</span>
                          <Switch
                            checked={method.isActive}
                            onCheckedChange={(checked) =>
                              updatePaymentMethodField(method.tempId, 'isActive', checked)
                            }
                            dir='ltr'
                            disabled={isSavingPaymentMethods}
                          />
                        </div>

                        <Button
                          type='button'
                          variant='destructive'
                          size='sm'
                          onClick={() => removePaymentMethodRow(method.tempId)}
                          disabled={isSavingPaymentMethods}
                        >
                          حذف
                        </Button>
                      </div>

                      <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                        <div className='space-y-1'>
                          <label className='text-sm font-medium'>اسم وسيلة الدفع</label>
                          <Input
                            value={method.methodName}
                            onChange={(event) =>
                              updatePaymentMethodField(method.tempId, 'methodName', event.target.value)
                            }
                            placeholder='مثال: تحويل بنكي'
                            disabled={isSavingPaymentMethods}
                          />
                        </div>

                        <div className='space-y-1'>
                          <label className='text-sm font-medium'>النطاق</label>
                          <select
                            className='h-9 w-full rounded-md border border-input bg-background px-3 text-sm'
                            value={method.branchId}
                            onChange={(event) =>
                              updatePaymentMethodField(method.tempId, 'branchId', event.target.value)
                            }
                            disabled={isSavingPaymentMethods}
                          >
                            <option value=''>متاح لكل الفروع</option>
                            {branches.map((branch) => (
                              <option key={branch.id} value={branch.id}>
                                {branch.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className='space-y-1'>
                          <label className='text-sm font-medium'>مزود الخدمة</label>
                          <Input
                            value={method.providerName}
                            onChange={(event) =>
                              updatePaymentMethodField(method.tempId, 'providerName', event.target.value)
                            }
                            placeholder='مثال: البنك الأهلي'
                            disabled={isSavingPaymentMethods}
                          />
                        </div>

                        <div className='space-y-1'>
                          <label className='text-sm font-medium'>اسم الحساب</label>
                          <Input
                            value={method.accountName}
                            onChange={(event) =>
                              updatePaymentMethodField(method.tempId, 'accountName', event.target.value)
                            }
                            placeholder='اسم صاحب الحساب'
                            disabled={isSavingPaymentMethods}
                          />
                        </div>

                        <div className='space-y-1'>
                          <label className='text-sm font-medium'>رقم الحساب</label>
                          <Input
                            value={method.accountNumber}
                            onChange={(event) =>
                              updatePaymentMethodField(method.tempId, 'accountNumber', event.target.value)
                            }
                            placeholder='رقم الحساب البنكي'
                            disabled={isSavingPaymentMethods}
                          />
                        </div>

                        <div className='space-y-1'>
                          <label className='text-sm font-medium'>المحفظة</label>
                          <Input
                            value={method.walletNumber}
                            onChange={(event) =>
                              updatePaymentMethodField(method.tempId, 'walletNumber', event.target.value)
                            }
                            placeholder='رقم المحفظة'
                            disabled={isSavingPaymentMethods}
                          />
                        </div>

                        <div className='space-y-1 md:col-span-2'>
                          <label className='text-sm font-medium'>IBAN</label>
                          <Input
                            value={method.iban}
                            onChange={(event) =>
                              updatePaymentMethodField(method.tempId, 'iban', event.target.value)
                            }
                            placeholder='اختياري'
                            disabled={isSavingPaymentMethods}
                          />
                        </div>

                        <div className='space-y-1 md:col-span-2'>
                          <label className='text-sm font-medium'>تعليمات للمريض</label>
                          <textarea
                            className='min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm'
                            value={method.instructions}
                            onChange={(event) =>
                              updatePaymentMethodField(method.tempId, 'instructions', event.target.value)
                            }
                            placeholder='تعليمات التحويل أو خطوات إرسال إثبات الدفع...'
                            disabled={isSavingPaymentMethods}
                          />
                        </div>
                      </div>
                    </div>
                  ))
                )}

                <div className='flex justify-end'>
                  <Button
                    type='button'
                    onClick={() => void savePaymentMethods()}
                    disabled={isLoadingPaymentMethods || isSavingPaymentMethods}
                  >
                    {isSavingPaymentMethods ? (
                      <>
                        <Loader2 className='h-4 w-4 animate-spin ml-2' />
                        جاري حفظ وسائل الدفع...
                      </>
                    ) : (
                      'حفظ وسائل الدفع'
                    )}
                  </Button>
                </div>
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
