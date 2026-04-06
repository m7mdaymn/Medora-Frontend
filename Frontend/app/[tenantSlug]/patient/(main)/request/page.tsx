'use client'

import {
  createPatientSelfServiceRequestAppAction,
  getPatientSelfServiceRequestsAppAction,
  reuploadPatientSelfServicePaymentProofAppAction,
} from '@/actions/patient-app/profile'
import {
  getPublicDoctorsAction,
  getPublicDoctorsAvailableNowAction,
  getPublicLandingAction,
  getPublicPaymentOptionsAction,
} from '@/actions/public/landing'
import { ProfileSwitcher } from '@/components/patient/profile-switcher'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { usePatientAuthStore } from '@/store/usePatientAuthStore'
import type { IPublicPaymentMethod } from '@/types/public'
import type { ISelfServiceRequest } from '@/types/self-service'
import {
  CalendarClock,
  CheckCircle2,
  Clock3,
  Loader2,
  MessageCircle,
  ShieldCheck,
  Ticket,
  UploadCloud,
  WalletCards,
} from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import useSWR from 'swr'

const REQUEST_TYPE_OPTIONS = [
  {
    value: 'SameDayTicket' as const,
    title: 'تذكرة اليوم',
    description: 'للدخول الآن مع دكتور لديه شيفت مفتوح',
  },
  {
    value: 'FutureBooking' as const,
    title: 'حجز مستقبلي',
    description: 'حجز موعد قادم بعد مراجعة الدفع',
  },
]

export default function PatientSelfServiceRequestPage() {
  const params = useParams()
  const tenantSlug = params.tenantSlug as string

  const authData = usePatientAuthStore((state) => state.tenants[tenantSlug])
  const activeProfileId = authData?.activeProfileId

  const today = useMemo(() => formatDateInput(new Date()), [])
  const tomorrow = useMemo(() => {
    const nextDay = new Date()
    nextDay.setDate(nextDay.getDate() + 1)
    return formatDateInput(nextDay)
  }, [])

  const [requestType, setRequestType] = useState<'SameDayTicket' | 'FutureBooking'>('SameDayTicket')
  const [doctorId, setDoctorId] = useState('')
  const [branchId, setBranchId] = useState('')
  const [doctorServiceId, setDoctorServiceId] = useState('')
  const [visitType, setVisitType] = useState<'Exam' | 'Consultation'>('Exam')
  const [requestedDate, setRequestedDate] = useState(today)
  const [requestedTime, setRequestedTime] = useState('')
  const [complaint, setComplaint] = useState('')
  const [symptoms, setSymptoms] = useState('')
  const [durationNotes, setDurationNotes] = useState('')
  const [notes, setNotes] = useState('')
  const [paidAmount, setPaidAmount] = useState('')
  const [transferSenderName, setTransferSenderName] = useState('')
  const [transferReference, setTransferReference] = useState('')
  const [transferDate, setTransferDate] = useState('')
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState('')
  const [paymentProof, setPaymentProof] = useState<File | null>(null)
  const [supportingDocuments, setSupportingDocuments] = useState<File[]>([])
  const [submitting, setSubmitting] = useState(false)

  const [successDialogOpen, setSuccessDialogOpen] = useState(false)
  const [createdRequest, setCreatedRequest] = useState<ISelfServiceRequest | null>(null)

  const [reuploadingRequestId, setReuploadingRequestId] = useState<string | null>(null)
  const [reuploadFiles, setReuploadFiles] = useState<Record<string, File | null>>({})

  const { data: landingRes, isLoading: loadingLanding } = useSWR(
    ['publicLanding', tenantSlug],
    () => getPublicLandingAction(tenantSlug),
  )

  const { data: paymentOptionsRes, isLoading: loadingPaymentOptions } = useSWR(
    ['publicPaymentOptions', tenantSlug, branchId],
    () => getPublicPaymentOptionsAction(tenantSlug, branchId || undefined),
  )

  const { data: availableNowDoctorsRes, isLoading: loadingAvailableNowDoctors } = useSWR(
    ['publicDoctorsAvailableNow', tenantSlug],
    () => getPublicDoctorsAvailableNowAction(tenantSlug),
  )

  const { data: allDoctorsRes, isLoading: loadingAllDoctors } = useSWR(
    ['publicDoctors', tenantSlug],
    () => getPublicDoctorsAction(tenantSlug),
  )

  const {
    data: selfServiceRes,
    isLoading: loadingSelfService,
    mutate: mutateSelfService,
  } = useSWR(
    activeProfileId ? ['patientSelfServiceRequests', tenantSlug, activeProfileId] : null,
    () => getPatientSelfServiceRequestsAppAction(tenantSlug, activeProfileId!),
  )

  const branches = useMemo(() => landingRes?.data?.branches ?? [], [landingRes?.data?.branches])
  const supportWhatsAppNumber = landingRes?.data?.clinic?.supportWhatsAppNumber ?? null
  const paymentOptions = paymentOptionsRes?.data
  const paymentMethods = useMemo(
    () => {
      const sourceMethods =
        paymentOptions?.methods?.length && paymentOptions.methods.length > 0
          ? paymentOptions.methods
          : (landingRes?.data?.paymentMethods ?? [])

      if (!branchId) {
        return sourceMethods
      }

      return sourceMethods.filter(
        (method) => !method.branchId || method.branchId === branchId,
      )
    },
    [branchId, paymentOptions?.methods, landingRes?.data?.paymentMethods],
  )
  const paymentPolicy = paymentOptions?.selfServicePaymentPolicy ?? 'FullOnly'
  const requestExpiryHours = paymentOptions?.selfServiceRequestExpiryHours ?? 24

  const doctors = useMemo(
    () =>
      requestType === 'SameDayTicket'
        ? (availableNowDoctorsRes?.data ?? [])
        : (allDoctorsRes?.data ?? []),
    [requestType, availableNowDoctorsRes?.data, allDoctorsRes?.data],
  )

  const loadingDoctors =
    requestType === 'SameDayTicket' ? loadingAvailableNowDoctors : loadingAllDoctors

  const selectedDoctor = doctors.find((doctor) => doctor.id === doctorId) ?? null
  const selectedService = selectedDoctor?.services.find((service) => service.id === doctorServiceId) ?? null
  const selectedPaymentMethod =
    paymentMethods.find((method) => method.id === selectedPaymentMethodId) ?? null

  const selfServiceRequests = selfServiceRes?.data ?? []

  const parsedPaidAmount = paidAmount.trim() ? Number(paidAmount) : NaN

  useEffect(() => {
    if (!branchId && branches.length > 0) {
      setBranchId(branches[0].id)
    }
  }, [branchId, branches])

  useEffect(() => {
    if (paymentMethods.length === 0) {
      if (selectedPaymentMethodId) {
        setSelectedPaymentMethodId('')
      }
      return
    }

    const selectedStillExists = paymentMethods.some(
      (method) => method.id === selectedPaymentMethodId,
    )

    if (!selectedStillExists) {
      setSelectedPaymentMethodId(paymentMethods[0].id)
    }
  }, [paymentMethods, selectedPaymentMethodId])

  useEffect(() => {
    if (!doctorId) {
      setDoctorServiceId('')
      return
    }

    const doctor = doctors.find((entry) => entry.id === doctorId)
    if (!doctor) {
      setDoctorId('')
      setDoctorServiceId('')
      return
    }

    const serviceExists = doctor.services.some((service) => service.id === doctorServiceId)
    if (!serviceExists) {
      if (doctor.services.length === 1) {
        setDoctorServiceId(doctor.services[0].id)
      } else {
        setDoctorServiceId('')
      }
    }
  }, [doctorId, doctorServiceId, doctors])

  useEffect(() => {
    if (requestType === 'SameDayTicket') {
      setRequestedDate(today)
      return
    }

    if (!requestedDate || requestedDate < tomorrow) {
      setRequestedDate(tomorrow)
    }
  }, [requestType, requestedDate, today, tomorrow])

  const isReferenceDataLoading = loadingLanding || loadingPaymentOptions

  const submitRequest = async () => {
    if (!activeProfileId) {
      return
    }

    if (!branchId) {
      toast.error('اختر فرع العيادة أولاً')
      return
    }

    if (!doctorId) {
      toast.error('اختر الطبيب')
      return
    }

    if (!doctorServiceId) {
      toast.error('اختر الخدمة المطلوبة')
      return
    }

    if (!complaint.trim()) {
      toast.error('حقل الشكوى / طلب الزيارة مطلوب')
      return
    }

    if (requestType === 'FutureBooking') {
      if (!requestedDate) {
        toast.error('اختر تاريخ الحجز')
        return
      }

      if (requestedDate < tomorrow) {
        toast.error('الحجز المستقبلي يجب أن يكون من الغد أو بعده')
        return
      }

      if (!requestedTime.trim()) {
        toast.error('اختر وقت الحجز')
        return
      }
    }

    if (!Number.isFinite(parsedPaidAmount) || parsedPaidAmount <= 0) {
      toast.error('أدخل قيمة مدفوعة صحيحة')
      return
    }

    if (paymentPolicy === 'FullOnly' && selectedService && parsedPaidAmount < selectedService.price) {
      toast.error('سياسة العيادة تتطلب دفع المبلغ كاملاً قبل اعتماد الطلب')
      return
    }

    if (paymentMethods.length > 0 && !selectedPaymentMethod) {
      toast.error('اختر وسيلة الدفع المستخدمة')
      return
    }

    if (!paymentProof) {
      toast.error('ارفع صورة إثبات الدفع')
      return
    }

    setSubmitting(true)

    try {
      const response = await createPatientSelfServiceRequestAppAction(tenantSlug, activeProfileId, {
        requestType,
        doctorId,
        branchId,
        doctorServiceId,
        visitType,
        requestedDate,
        requestedTime: requestedTime.trim() || undefined,
        complaint: complaint.trim(),
        symptoms: symptoms.trim() || undefined,
        durationNotes: durationNotes.trim() || undefined,
        notes: notes.trim() || undefined,
        paymentMethod: selectedPaymentMethod?.methodName,
        transferReference: transferReference.trim() || undefined,
        transferSenderName: transferSenderName.trim() || undefined,
        transferDate: transferDate.trim() || undefined,
        paidAmount: parsedPaidAmount,
        paymentProof,
        supportingDocuments,
      })

      if (!response.success || !response.data) {
        toast.error(response.message || 'تعذر إرسال الطلب حالياً')
        return
      }

      setCreatedRequest(response.data)
      setSuccessDialogOpen(true)

      toast.success('تم إرسال الطلب وبانتظار مراجعة الدفع من العيادة')

      setDoctorId('')
      setDoctorServiceId('')
      setVisitType('Exam')
      setRequestedTime('')
      setRequestedDate(requestType === 'SameDayTicket' ? today : tomorrow)
      setComplaint('')
      setSymptoms('')
      setDurationNotes('')
      setNotes('')
      setPaidAmount('')
      setTransferSenderName('')
      setTransferReference('')
      setTransferDate('')
      setPaymentProof(null)
      setSupportingDocuments([])

      await mutateSelfService()
    } finally {
      setSubmitting(false)
    }
  }

  const reuploadPaymentProof = async (requestId: string) => {
    if (!activeProfileId) {
      return
    }

    const selectedFile = reuploadFiles[requestId]
    if (!selectedFile) {
      toast.error('اختر صورة إثبات الدفع أولاً')
      return
    }

    setReuploadingRequestId(requestId)

    try {
      const response = await reuploadPatientSelfServicePaymentProofAppAction(
        tenantSlug,
        activeProfileId,
        requestId,
        selectedFile,
      )

      if (!response.success) {
        toast.error(response.message || 'تعذر إرسال إعادة الرفع حالياً')
        return
      }

      toast.success('تم إرسال إثبات الدفع الجديد بنجاح')
      setReuploadFiles((current) => ({ ...current, [requestId]: null }))
      await mutateSelfService()
    } finally {
      setReuploadingRequestId(null)
    }
  }

  const openWhatsApp = () => {
    if (!supportWhatsAppNumber) {
      toast.error('رقم واتساب العيادة غير متاح حالياً')
      return
    }

    const normalizedPhone = normalizeWhatsAppNumber(supportWhatsAppNumber)
    if (!normalizedPhone) {
      toast.error('رقم واتساب العيادة غير صالح')
      return
    }

    const requestLabel =
      createdRequest?.requestType === 'FutureBooking' ? 'حجز مستقبلي' : 'تذكرة نفس اليوم'

    const message = encodeURIComponent(
      createdRequest
        ? `السلام عليكم، أرسلت طلب ${requestLabel} برقم ${createdRequest.id} وتم رفع إثبات الدفع. برجاء المتابعة.`
        : 'السلام عليكم، أحتاج متابعة طلب الدفع الذاتي الخاص بي.',
    )

    window.open(`https://wa.me/${normalizedPhone}?text=${message}`, '_blank', 'noopener,noreferrer')
  }

  if (!activeProfileId) {
    return null
  }

  return (
    <div className='max-w-full overflow-x-hidden p-4 pb-24 space-y-6 animate-in fade-in duration-500' dir='rtl'>
      <div className='flex items-center justify-between gap-2'>
        <div>
          <h2 className='text-2xl font-bold tracking-tight text-foreground'>طلب تذكرة أو حجز</h2>
          <p className='text-[10px] text-muted-foreground font-medium mt-1'>
            ارفع إثبات الدفع وانتظر تأكيد العيادة قبل إصدار التذكرة أو تثبيت الحجز
          </p>
        </div>
        <div className='shrink-0'>
          <ProfileSwitcher tenantSlug={tenantSlug} />
        </div>
      </div>

      <div className='flex flex-wrap items-center gap-2'>
        <Badge variant='outline' className='text-[10px] font-bold'>
          <ShieldCheck className='w-3 h-3 ml-1' />
          سياسة الدفع: {paymentPolicy === 'FullOnly' ? 'سداد كامل' : 'سداد جزئي/كامل'}
        </Badge>
        <Badge variant='outline' className='text-[10px] font-bold'>
          <Clock3 className='w-3 h-3 ml-1' />
          تنتهي صلاحية الطلب خلال {requestExpiryHours} ساعة
        </Badge>
      </div>

      <Card className='rounded-2xl border-border/40 shadow-sm'>
        <CardContent className='p-4 space-y-5'>
          <div className='grid gap-2'>
            <Label className='text-xs font-bold text-muted-foreground'>نوع الطلب</Label>
            <div className='grid grid-cols-2 gap-2'>
              {REQUEST_TYPE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type='button'
                  onClick={() => setRequestType(option.value)}
                  className={
                    requestType === option.value
                      ? 'rounded-xl border border-primary bg-primary/10 p-3 text-right transition-colors'
                      : 'rounded-xl border border-border/60 bg-background p-3 text-right transition-colors hover:border-primary/40'
                  }
                >
                  <p className='text-xs font-bold text-foreground'>{option.title}</p>
                  <p className='text-[10px] text-muted-foreground mt-1 leading-relaxed'>
                    {option.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div className='grid gap-4 sm:grid-cols-2'>
            <div className='grid gap-2'>
              <Label className='text-xs font-bold text-muted-foreground'>فرع العيادة</Label>
              {isReferenceDataLoading ? (
                <Skeleton className='h-10 w-full rounded-md' />
              ) : (
                <select
                  value={branchId}
                  onChange={(event) => setBranchId(event.target.value)}
                  className='h-10 w-full rounded-md border border-input bg-background px-3 text-sm'
                >
                  <option value=''>اختر الفرع</option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className='grid gap-2'>
              <Label className='text-xs font-bold text-muted-foreground'>الطبيب</Label>
              {loadingDoctors ? (
                <Skeleton className='h-10 w-full rounded-md' />
              ) : (
                <select
                  value={doctorId}
                  onChange={(event) => setDoctorId(event.target.value)}
                  className='h-10 w-full rounded-md border border-input bg-background px-3 text-sm'
                >
                  <option value=''>
                    {requestType === 'SameDayTicket'
                      ? 'اختر طبيباً متاحاً الآن'
                      : 'اختر الطبيب المطلوب'}
                  </option>
                  {doctors.map((doctor) => (
                    <option key={doctor.id} value={doctor.id}>
                      د. {doctor.name} {doctor.specialty ? `- ${doctor.specialty}` : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className='grid gap-2'>
              <Label className='text-xs font-bold text-muted-foreground'>الخدمة</Label>
              <select
                value={doctorServiceId}
                onChange={(event) => setDoctorServiceId(event.target.value)}
                disabled={!selectedDoctor}
                className='h-10 w-full rounded-md border border-input bg-background px-3 text-sm disabled:cursor-not-allowed disabled:opacity-50'
              >
                <option value=''>{selectedDoctor ? 'اختر الخدمة' : 'اختر الطبيب أولاً'}</option>
                {(selectedDoctor?.services ?? []).map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.serviceName} - {service.price.toLocaleString('ar-EG')} ج.م
                  </option>
                ))}
              </select>
            </div>

            <div className='grid gap-2'>
              <Label className='text-xs font-bold text-muted-foreground'>نوع الزيارة</Label>
              <select
                value={visitType}
                onChange={(event) =>
                  setVisitType(event.target.value === 'Consultation' ? 'Consultation' : 'Exam')
                }
                className='h-10 w-full rounded-md border border-input bg-background px-3 text-sm'
              >
                <option value='Exam'>كشف</option>
                <option value='Consultation'>استشارة</option>
              </select>
            </div>

            <div className='grid gap-2'>
              <Label className='text-xs font-bold text-muted-foreground'>تاريخ الزيارة</Label>
              <Input
                type='date'
                value={requestedDate}
                min={requestType === 'FutureBooking' ? tomorrow : today}
                onChange={(event) => setRequestedDate(event.target.value)}
                disabled={requestType === 'SameDayTicket'}
              />
              {requestType === 'SameDayTicket' && (
                <p className='text-[10px] text-muted-foreground'>
                  طلب تذكرة اليوم يقبل تاريخ اليوم فقط.
                </p>
              )}
            </div>

            <div className='grid gap-2'>
              <Label className='text-xs font-bold text-muted-foreground'>وقت الزيارة</Label>
              <Input
                type='time'
                value={requestedTime}
                onChange={(event) => setRequestedTime(event.target.value)}
                placeholder='اختياري'
              />
              {requestType === 'FutureBooking' && (
                <p className='text-[10px] text-muted-foreground'>
                  وقت الحجز مطلوب لطلبات الحجز المستقبلي.
                </p>
              )}
            </div>
          </div>

          <div className='grid gap-2'>
            <Label className='text-xs font-bold text-muted-foreground'>الشكوى / طلب الزيارة</Label>
            <Textarea
              value={complaint}
              onChange={(event) => setComplaint(event.target.value)}
              className='min-h-[92px]'
              placeholder='اكتب سبب الزيارة بشكل واضح'
            />
          </div>

          <div className='grid gap-4 sm:grid-cols-2'>
            <div className='grid gap-2'>
              <Label className='text-xs font-bold text-muted-foreground'>الأعراض (اختياري)</Label>
              <Textarea
                value={symptoms}
                onChange={(event) => setSymptoms(event.target.value)}
                className='min-h-[76px]'
                placeholder='مثل: صداع، حرارة، ألم مستمر'
              />
            </div>

            <div className='grid gap-2'>
              <Label className='text-xs font-bold text-muted-foreground'>مدة الحالة (اختياري)</Label>
              <Textarea
                value={durationNotes}
                onChange={(event) => setDurationNotes(event.target.value)}
                className='min-h-[76px]'
                placeholder='منذ يومين، منذ أسبوع...'
              />
            </div>
          </div>

          <div className='grid gap-2'>
            <Label className='text-xs font-bold text-muted-foreground'>ملاحظات إضافية (اختياري)</Label>
            <Textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className='min-h-[72px]'
              placeholder='أي تفاصيل إضافية للطبيب أو الاستقبال'
            />
          </div>

          <div className='rounded-xl border border-border/60 bg-muted/20 p-3 space-y-3'>
            <div className='flex items-center justify-between gap-2'>
              <div className='flex items-center gap-2'>
                <WalletCards className='w-4 h-4 text-primary' />
                <p className='text-xs font-bold'>وسائل الدفع من إعدادات العيادة</p>
              </div>
              {selectedService && (
                <span className='text-[10px] font-bold text-primary'>
                  سعر الخدمة: {selectedService.price.toLocaleString('ar-EG')} ج.م
                </span>
              )}
            </div>

            {isReferenceDataLoading ? (
              <div className='space-y-2'>
                <Skeleton className='h-12 w-full rounded-xl' />
                <Skeleton className='h-12 w-full rounded-xl' />
              </div>
            ) : paymentMethods.length > 0 ? (
              <div className='grid gap-2 sm:grid-cols-2'>
                {paymentMethods.map((method) => (
                  <button
                    key={method.id}
                    type='button'
                    onClick={() => setSelectedPaymentMethodId(method.id)}
                    className={
                      selectedPaymentMethodId === method.id
                        ? 'rounded-xl border border-primary bg-primary/10 px-3 py-2 text-right'
                        : 'rounded-xl border border-border/60 bg-background px-3 py-2 text-right hover:border-primary/40'
                    }
                  >
                    <p className='text-xs font-bold'>{method.methodName}</p>
                    <p className='text-[10px] text-muted-foreground mt-1'>
                      {renderPaymentMethodSummary(method)}
                    </p>
                  </button>
                ))}
              </div>
            ) : (
              <p className='text-[11px] text-muted-foreground'>
                لا توجد وسائل دفع مفعلة حالياً. تواصل مع العيادة لتحديث الإعدادات.
              </p>
            )}

            {selectedPaymentMethod && selectedPaymentMethod.instructions && (
              <div className='rounded-lg border border-dashed border-primary/30 bg-primary/5 px-3 py-2 text-[11px] text-primary leading-relaxed'>
                {selectedPaymentMethod.instructions}
              </div>
            )}

            <div className='grid gap-4 sm:grid-cols-2'>
              <div className='grid gap-2'>
                <Label className='text-xs font-bold text-muted-foreground'>المبلغ المدفوع</Label>
                <Input
                  type='number'
                  min='0'
                  step='0.01'
                  value={paidAmount}
                  onChange={(event) => setPaidAmount(event.target.value)}
                  placeholder='0.00'
                />
              </div>

              <div className='grid gap-2'>
                <Label className='text-xs font-bold text-muted-foreground'>تاريخ التحويل (اختياري)</Label>
                <Input
                  type='date'
                  value={transferDate}
                  onChange={(event) => setTransferDate(event.target.value)}
                />
              </div>

              <div className='grid gap-2'>
                <Label className='text-xs font-bold text-muted-foreground'>اسم المحول (اختياري)</Label>
                <Input
                  value={transferSenderName}
                  onChange={(event) => setTransferSenderName(event.target.value)}
                  placeholder='اسم صاحب التحويل'
                />
              </div>

              <div className='grid gap-2'>
                <Label className='text-xs font-bold text-muted-foreground'>مرجع العملية (اختياري)</Label>
                <Input
                  value={transferReference}
                  onChange={(event) => setTransferReference(event.target.value)}
                  placeholder='رقم مرجعي أو آخر 4 أرقام'
                />
              </div>
            </div>

            <div className='grid gap-2'>
              <Label className='text-xs font-bold text-muted-foreground'>
                صورة إثبات الدفع (إجباري)
              </Label>
              <input
                type='file'
                accept='image/*'
                className='block w-full rounded-md border border-input bg-background px-3 py-2 text-[11px]'
                onChange={(event) => setPaymentProof(event.target.files?.[0] ?? null)}
              />
            </div>

            <div className='grid gap-2'>
              <Label className='text-xs font-bold text-muted-foreground'>مستندات إضافية (اختياري)</Label>
              <input
                type='file'
                accept='.pdf,.jpg,.jpeg,.png,.webp'
                multiple
                className='block w-full rounded-md border border-input bg-background px-3 py-2 text-[11px]'
                onChange={(event) => setSupportingDocuments(Array.from(event.target.files ?? []))}
              />
            </div>
          </div>

          <Button
            type='button'
            className='w-full rounded-xl'
            disabled={submitting || isReferenceDataLoading}
            onClick={() => void submitRequest()}
          >
            {submitting ? (
              <>
                <Loader2 className='w-4 h-4 animate-spin' />
                جارٍ إرسال الطلب...
              </>
            ) : (
              <>
                <UploadCloud className='w-4 h-4' />
                إرسال الطلب وانتظار مراجعة الدفع
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card className='rounded-2xl border-border/40 shadow-sm'>
        <CardContent className='p-4 space-y-3'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <Ticket className='w-4 h-4 text-primary' />
              <h3 className='text-sm font-bold'>حالة طلباتك الحالية</h3>
            </div>
            <Button asChild size='sm' variant='outline'>
              <Link href={`/${tenantSlug}/patient/bookings`}>عرض صفحة الحجوزات</Link>
            </Button>
          </div>

          {loadingSelfService ? (
            <div className='space-y-2'>
              <Skeleton className='h-24 w-full rounded-2xl' />
              <Skeleton className='h-24 w-full rounded-2xl' />
            </div>
          ) : selfServiceRequests.length > 0 ? (
            <div className='grid gap-3'>
              {selfServiceRequests.map((request) => (
                <div key={request.id} className='rounded-xl border border-border/50 p-3 space-y-2'>
                  <div className='flex items-start justify-between gap-3'>
                    <div>
                      <p className='text-sm font-bold text-foreground'>
                        {request.requestType === 'FutureBooking' ? 'حجز مستقبلي' : 'تذكرة اليوم'}
                      </p>
                      <p className='text-[11px] text-muted-foreground'>
                        د. {request.doctorName} • {request.serviceName || 'خدمة غير محددة'}
                      </p>
                    </div>
                    <SelfServiceStatusBadge status={request.status} />
                  </div>

                  <div className='grid gap-1.5 text-[11px] text-muted-foreground'>
                    <div className='flex items-center gap-1.5'>
                      <CalendarClock className='w-3.5 h-3.5 text-primary' />
                      {new Date(request.requestedDate).toLocaleDateString('ar-EG')} •{' '}
                      {request.requestedTime || '--'}
                    </div>
                    <div className='flex items-center gap-1.5'>
                      <WalletCards className='w-3.5 h-3.5 text-primary' />
                      المدفوع:{' '}
                      {(request.adjustedPaidAmount ?? request.declaredPaidAmount ?? 0).toLocaleString(
                        'ar-EG',
                      )}{' '}
                      ج.م
                    </div>
                    <div className='flex items-center gap-1.5'>
                      <Clock3 className='w-3.5 h-3.5 text-muted-foreground' />
                      ينتهي الطلب: {new Date(request.expiresAt).toLocaleString('ar-EG')}
                    </div>
                  </div>

                  <div className='rounded-lg bg-muted/20 border border-border/40 p-2 text-[11px] leading-relaxed text-muted-foreground'>
                    {getSelfServiceStatusHint(request.status)}
                  </div>

                  {request.status === 'ReuploadRequested' && (
                    <div className='rounded-lg border border-amber-500/30 bg-amber-500/5 p-2.5 space-y-2'>
                      <p className='text-[11px] font-medium text-amber-700 dark:text-amber-400'>
                        مطلوب إعادة رفع صورة الدفع. ارفع صورة أوضح ثم أرسلها للمراجعة.
                      </p>
                      <input
                        type='file'
                        accept='image/*'
                        className='block w-full rounded-md border border-input bg-background px-3 py-2 text-[11px]'
                        onChange={(event) =>
                          setReuploadFiles((current) => ({
                            ...current,
                            [request.id]: event.target.files?.[0] ?? null,
                          }))
                        }
                      />
                      <Button
                        type='button'
                        size='sm'
                        onClick={() => void reuploadPaymentProof(request.id)}
                        disabled={reuploadingRequestId === request.id}
                      >
                        {reuploadingRequestId === request.id ? (
                          <>
                            <Loader2 className='w-3.5 h-3.5 animate-spin' />
                            جارٍ الإرسال...
                          </>
                        ) : (
                          <>
                            <UploadCloud className='w-3.5 h-3.5' />
                            إرسال إثبات جديد
                          </>
                        )}
                      </Button>
                    </div>
                  )}

                  {(request.convertedQueueTicketId || request.convertedBookingId) && (
                    <div className='rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-[11px] font-bold text-primary'>
                      {request.convertedQueueTicketId
                        ? 'تم تحويل الطلب إلى تذكرة عيادة بنجاح.'
                        : 'تم تحويل الطلب إلى حجز مؤكد بنجاح.'}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className='rounded-xl border border-dashed border-border/60 p-4 text-center text-[11px] text-muted-foreground'>
              لا توجد طلبات دفع ذاتي حتى الآن.
            </div>
          )}
        </CardContent>
      </Card>

      <Card className='rounded-2xl border-border/40 shadow-sm'>
        <CardContent className='p-4 space-y-3'>
          <div className='flex items-center gap-2'>
            <MessageCircle className='w-4 h-4 text-emerald-600' />
            <p className='text-sm font-bold'>تواصل مباشر مع العيادة عبر واتساب</p>
          </div>

          <p className='text-[11px] text-muted-foreground leading-relaxed'>
            بعد إرسال الطلب يمكنك المتابعة فوراً مع العيادة إذا أردت تسريع المراجعة أو الاستفسار
            عن حالة الدفع.
          </p>

          {supportWhatsAppNumber ? (
            <Button type='button' variant='outline' className='w-full' onClick={openWhatsApp}>
              <MessageCircle className='w-4 h-4' />
              تواصل عبر واتساب
            </Button>
          ) : (
            <p className='text-[11px] text-muted-foreground'>
              رقم واتساب العيادة غير متاح حالياً.
            </p>
          )}
        </CardContent>
      </Card>

      <Dialog open={successDialogOpen} onOpenChange={setSuccessDialogOpen}>
        <DialogContent className='rounded-2xl' dir='rtl'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2 text-right'>
              <CheckCircle2 className='w-5 h-5 text-emerald-600' />
              تم إرسال طلبك بنجاح
            </DialogTitle>
            <DialogDescription className='text-right leading-relaxed'>
              الطلب الآن في مرحلة انتظار مراجعة الدفع من العيادة. ستجد حالة الطلب محدثة في نفس
              الصفحة وفي صفحة الحجوزات.
            </DialogDescription>
          </DialogHeader>

          {createdRequest && (
            <div className='rounded-xl border border-border/60 bg-muted/20 p-3 text-[11px] space-y-1'>
              <p>
                رقم الطلب: <span className='font-bold'>{createdRequest.id}</span>
              </p>
              <p>
                النوع:{' '}
                <span className='font-bold'>
                  {createdRequest.requestType === 'FutureBooking' ? 'حجز مستقبلي' : 'تذكرة اليوم'}
                </span>
              </p>
              <p>
                الحالة الحالية: <span className='font-bold'>قيد مراجعة الدفع</span>
              </p>
            </div>
          )}

          <DialogFooter className='sm:justify-start'>
            <Button type='button' onClick={() => setSuccessDialogOpen(false)}>
              متابعة الحالة
            </Button>
            {supportWhatsAppNumber && (
              <Button type='button' variant='outline' onClick={openWhatsApp}>
                <MessageCircle className='w-4 h-4' />
                التواصل مع العيادة
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function SelfServiceStatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'PendingPaymentReview':
      return (
        <Badge variant='outline' className='text-[10px] font-bold'>
          قيد مراجعة الدفع
        </Badge>
      )
    case 'PaymentApproved':
      return (
        <Badge
          variant='outline'
          className='bg-emerald-500/5 text-emerald-600 border-emerald-500/20 text-[10px] font-bold'
        >
          تم اعتماد الدفع
        </Badge>
      )
    case 'ReuploadRequested':
      return (
        <Badge
          variant='outline'
          className='bg-amber-500/5 text-amber-600 border-amber-500/20 text-[10px] font-bold'
        >
          مطلوب إعادة الإثبات
        </Badge>
      )
    case 'ConvertedToQueueTicket':
      return (
        <Badge
          variant='outline'
          className='bg-primary/5 text-primary border-primary/20 text-[10px] font-bold'
        >
          تحول إلى تذكرة
        </Badge>
      )
    case 'ConvertedToBooking':
      return (
        <Badge
          variant='outline'
          className='bg-primary/5 text-primary border-primary/20 text-[10px] font-bold'
        >
          تحول إلى حجز
        </Badge>
      )
    case 'Rejected':
      return (
        <Badge
          variant='outline'
          className='bg-destructive/5 text-destructive border-destructive/20 text-[10px] font-bold'
        >
          مرفوض
        </Badge>
      )
    case 'Expired':
      return (
        <Badge variant='outline' className='text-[10px] font-bold'>
          منتهي الصلاحية
        </Badge>
      )
    default:
      return (
        <Badge variant='outline' className='text-[10px] font-bold'>
          {status}
        </Badge>
      )
  }
}

function getSelfServiceStatusHint(status: string): string {
  switch (status) {
    case 'PendingPaymentReview':
      return 'طلبك في قائمة الانتظار، فريق العيادة يراجع صورة الدفع حالياً.'
    case 'PaymentApproved':
      return 'تم اعتماد الدفع وسيتم تحويل الطلب تلقائياً إلى تذكرة أو حجز.'
    case 'ReuploadRequested':
      return 'العيادة طلبت إعادة رفع إثبات الدفع قبل استكمال الطلب.'
    case 'ConvertedToQueueTicket':
      return 'تم اعتماد الطلب وتحويله إلى تذكرة في العيادة.'
    case 'ConvertedToBooking':
      return 'تم اعتماد الطلب وتحويله إلى حجز مؤكد.'
    case 'Rejected':
      return 'تم رفض الطلب. يمكنك التواصل مع العيادة لمعرفة السبب وإعادة التقديم.'
    case 'Expired':
      return 'انتهت صلاحية الطلب لعدم اكتمال المراجعة في الوقت المحدد.'
    default:
      return 'حالة الطلب قيد التحديث. يمكنك المتابعة من صفحة الحجوزات.'
  }
}

function renderPaymentMethodSummary(method: IPublicPaymentMethod): string {
  if (method.providerName) {
    return method.providerName
  }

  if (method.walletNumber) {
    return `محفظة: ${method.walletNumber}`
  }

  if (method.accountNumber) {
    return `حساب: ${method.accountNumber}`
  }

  return 'طريقة دفع معتمدة من العيادة'
}

function formatDateInput(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function normalizeWhatsAppNumber(phone: string): string {
  return phone.replace(/[^\d]/g, '')
}
