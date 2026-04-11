'use client'

import { valibotResolver } from '@hookform/resolvers/valibot'
import { format } from 'date-fns'
import { ar } from 'date-fns/locale'
import { CalendarIcon, CheckCircle2, Loader2, UserPlus } from 'lucide-react'
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
import { useBranchSelectionStore } from '@/store/useBranchSelectionStore'

import { cn } from '@/lib/utils'
import { getBranchesAction } from '../../../../../actions/branch/branches'
import { createPatientAction } from '../../../../../actions/patient/createPatient'
import { updateChronicConditionsAction } from '../../../../../actions/patient/updateChronicConditions'
import { IBranch } from '../../../../../types/branch'
import { CreatePatientInput, CreatePatientSchema } from '../../../../../validation/patient'

interface AddPatientModalProps {
  tenantSlug: string
  initialPhone?: string
  trigger?: React.ReactNode
  onSuccess?: (patientId: string, patientName: string) => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

function getSelectedBranchFromCookie(tenantSlug: string): string | undefined {
  if (typeof document === 'undefined') return undefined

  const cookieName = `selected_branch_${tenantSlug}`
  const cookieEntry = document.cookie
    .split(';')
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${cookieName}=`))

  if (!cookieEntry) return undefined

  const value = cookieEntry.slice(cookieName.length + 1)
  return value ? decodeURIComponent(value) : undefined
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
  const [branches, setBranches] = useState<IBranch[]>([])
  const [isLoadingBranches, setIsLoadingBranches] = useState(false)
  const selectedBranchByTenant = useBranchSelectionStore((state) => state.selectedBranchByTenant)
  const selectedBranchId = selectedBranchByTenant[tenantSlug]

  const form = useForm<CreatePatientInput>({
    resolver: valibotResolver(CreatePatientSchema),
    defaultValues: {
      name: '',
      phone: initialPhone || '',
      branchId: '',
      address: '',
      notes: '',
      gender: 'Male',
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

  useEffect(() => {
    if (!open || credentials) return

    let cancelled = false

    const loadBranches = async () => {
      setIsLoadingBranches(true)

      try {
        const result = await getBranchesAction(tenantSlug, false)
        if (cancelled) return

        if (!result.success) {
          setBranches([])
          toast.error(result.message || 'تعذر تحميل الفروع')
          return
        }

        const activeBranches = (result.data || []).filter((branch) => branch.isActive)
        setBranches(activeBranches)

        const preferredBranchId = selectedBranchId || getSelectedBranchFromCookie(tenantSlug)
        if (preferredBranchId && activeBranches.some((branch) => branch.id === preferredBranchId)) {
          form.setValue('branchId', preferredBranchId, {
            shouldDirty: true,
            shouldValidate: true,
          })
          return
        }

        const currentBranchId = form.getValues('branchId')
        if (!currentBranchId && activeBranches.length === 1) {
          form.setValue('branchId', activeBranches[0].id, {
            shouldDirty: true,
            shouldValidate: true,
          })
        }
      } finally {
        if (!cancelled) {
          setIsLoadingBranches(false)
        }
      }
    }

    void loadBranches()

    return () => {
      cancelled = true
    }
  }, [open, credentials, tenantSlug, form, selectedBranchId])

  useEffect(() => {
    if (!open || !selectedBranchId) return

    const isAvailable = branches.some((branch) => branch.id === selectedBranchId)
    if (!isAvailable) return

    const currentBranchId = form.getValues('branchId')
    if (currentBranchId === selectedBranchId) return

    form.setValue('branchId', selectedBranchId, {
      shouldDirty: true,
      shouldValidate: true,
    })
  }, [open, selectedBranchId, branches, form])

  const onSubmit = async (values: CreatePatientInput) => {
    try {
      const branchIdFromNavbar = selectedBranchId?.trim()
      const submitValues = branchIdFromNavbar ? { ...values, branchId: branchIdFromNavbar } : values

      const result = await createPatientAction(submitValues, tenantSlug)

      if (result.success && result.data) {
        const patientId = result.data.patient.id

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
      if (error instanceof Error) toast.error('حدث خطأ أثناء حفظ البيانات')
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
            <Button size={'lg'} type='button'>
              <UserPlus className='mr-2 h-4 w-4' /> مريض جديد
            </Button>
          )}
        </DialogTrigger>
      )}

      <DialogContent
        className='sm:max-w-137.5 max-h-[90vh] overflow-y-auto'
        onInteractOutside={(e) => {
          if (form.formState.isSubmitting || credentials) e.preventDefault()
        }}
        onEscapeKeyDown={(e) => {
          if (form.formState.isSubmitting || credentials) e.preventDefault()
        }}
      >
        {credentials ? (
          <>
            <DialogHeader className='flex flex-col items-center justify-center gap-3 pt-6'>
              <div className='flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100/50 dark:bg-emerald-100/10'>
                <CheckCircle2 className='h-8 w-8 text-emerald-600 dark:text-emerald-400' />
              </div>
              <DialogTitle className='text-xl'>تم التسجيل بنجاح</DialogTitle>
            </DialogHeader>

            <div className='w-full bg-muted/30 p-4 rounded-lg space-y-3 border my-2 '>
              <div className='flex justify-between items-center flex-wrap'>
                <span className='text-sm text-muted-foreground'>اسم المستخدم:</span>
                <b>{credentials.username}</b>
              </div>
              <div className='flex justify-between items-center flex-wrap'>
                <span className='text-sm text-muted-foreground'>كلمة المرور:</span>
                <b>{credentials.password}</b>
              </div>
            </div>

            <DialogFooter>
              <Button onClick={handleClose} variant='outline' type='button'>
                إغلاق
              </Button>
              <Button
                onClick={handleSendWhatsApp}
                type='button'
                className=' bg-green-600 hover:bg-green-700 text-white'
              >
                إرسال واتساب
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className='flex items-center gap-2'>إضافة مريض</DialogTitle>
            </DialogHeader>

            <Form {...form}>
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  e.stopPropagation() // To Prevent Access Ticket Form
                  form.handleSubmit(onSubmit)(e)
                }}
                className='space-y-5'
              >
                <div className='grid grid-cols-2 gap-4'>
                  <FormField
                    control={form.control}
                    name='name'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الاسم</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder='أحمد محمود' />
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
                          <Input {...field} placeholder='010' />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name='branchId'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الفرع</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={
                          isLoadingBranches ||
                          (Boolean(selectedBranchId) &&
                            branches.some((branch) => branch.id === selectedBranchId))
                        }
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue
                              placeholder={
                                isLoadingBranches ? 'جاري تحميل الفروع...' : 'اختر الفرع'
                              }
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {branches.length > 0 ? (
                            branches.map((branch) => (
                              <SelectItem key={branch.id} value={branch.id}>
                                {branch.name}
                              </SelectItem>
                            ))
                          ) : (
                            <p className='p-2 text-sm text-center text-muted-foreground'>
                              لا توجد فروع متاحة
                            </p>
                          )}
                        </SelectContent>
                      </Select>
                      {selectedBranchId && branches.some((branch) => branch.id === selectedBranchId) ? (
                        <FormDescription>الفرع مرتبط بالاختيار الحالي من الشريط العلوي.</FormDescription>
                      ) : null}
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                    <div className='grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-xl animate-in fade-in slide-in-from-top-2 duration-300'>
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
                    className='w-full'
                    size={'xl'}
                  >
                    {form.formState.isSubmitting && (
                      <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    )}
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
