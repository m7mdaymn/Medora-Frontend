'use client'

import {
  addPatientPartnerOrderCommentAppAction,
  confirmPatientPartnerOrderArrivalAppAction,
  getPatientPartnerOrdersAppAction,
  getPatientVisitsAppAction,
  uploadPatientPartnerOrderResultDocumentAppAction,
} from '@/actions/patient-app/profile'
import { ProfileSwitcher } from '@/components/patient/profile-switcher'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { usePatientAuthStore } from '@/store/usePatientAuthStore'
import {
  Calendar,
  CircleCheck,
  Clock3,
  MapPin,
  MessageSquareText,
  Pill,
  Phone,
  SearchX,
  Stethoscope,
  TestTube,
  UploadCloud,
} from 'lucide-react'
import { useParams } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import useSWR from 'swr'

export default function PatientHistoryPage() {
  const params = useParams()
  const tenantSlug = params.tenantSlug as string
  const [page, setPage] = useState(1)
  const [arrivingOrderId, setArrivingOrderId] = useState<string | null>(null)
  const [uploadingOrderId, setUploadingOrderId] = useState<string | null>(null)
  const [commentingOrderId, setCommentingOrderId] = useState<string | null>(null)
  const [selectedFilesByOrderId, setSelectedFilesByOrderId] = useState<Record<string, File | null>>({})
  const [uploadNotesByOrderId, setUploadNotesByOrderId] = useState<Record<string, string>>({})

  const authData = usePatientAuthStore((state) => state.tenants[tenantSlug])
  const activeProfileId = authData?.activeProfileId

  // جلب سجل الزيارات
  const { data: historyRes, isLoading } = useSWR(
    activeProfileId ? ['patientHistory', tenantSlug, activeProfileId, page] : null,
    () => getPatientVisitsAppAction(tenantSlug, activeProfileId!, page, 10),
  )

  const {
    data: partnerOrdersRes,
    isLoading: partnerOrdersLoading,
    mutate: mutatePartnerOrders,
  } = useSWR(
    activeProfileId ? ['patientPartnerOrders', tenantSlug, activeProfileId] : null,
    () => getPatientPartnerOrdersAppAction(tenantSlug, activeProfileId!),
  )

  const visits = historyRes?.data?.items || []
  const partnerOrders = partnerOrdersRes?.data || []

  const confirmArrivalAtPartner = async (orderId: string) => {
    if (!activeProfileId) return

    setArrivingOrderId(orderId)
    try {
      const response = await confirmPatientPartnerOrderArrivalAppAction(
        tenantSlug,
        activeProfileId,
        orderId,
      )

      if (!response.success) {
        toast.error(response.message || 'تعذر تأكيد الحضور حالياً')
        return
      }

      toast.success('تم تأكيد ذهابك للشريك بنجاح')
      await mutatePartnerOrders()
    } finally {
      setArrivingOrderId(null)
    }
  }

  const sendPartnerOrderComment = async (orderId: string) => {
    if (!activeProfileId) return

    const comment = window.prompt('اكتب تعليقك أو استفسارك للطبيب حول هذا الطلب:')
    if (!comment || !comment.trim()) return

    setCommentingOrderId(orderId)
    try {
      const response = await addPatientPartnerOrderCommentAppAction(
        tenantSlug,
        activeProfileId,
        orderId,
        comment,
      )

      if (!response.success) {
        toast.error(response.message || 'تعذر إرسال التعليق حالياً')
        return
      }

      toast.success('تم إرسال تعليقك للطبيب')
      await mutatePartnerOrders()
    } finally {
      setCommentingOrderId(null)
    }
  }

  const uploadFallbackResult = async (orderId: string, visitId: string, partnerType: string) => {
    if (!activeProfileId) return

    const file = selectedFilesByOrderId[orderId]
    if (!file) {
      toast.error('اختر ملف النتيجة أولاً')
      return
    }

    setUploadingOrderId(orderId)
    try {
      const response = await uploadPatientPartnerOrderResultDocumentAppAction(tenantSlug, activeProfileId, {
        orderId,
        visitId,
        partnerType,
        file,
        notes: uploadNotesByOrderId[orderId],
      })

      if (!response.success) {
        toast.error(response.message || 'فشل رفع النتيجة')
        return
      }

      toast.success('تم رفع النتيجة، وسيتم إشعار الطبيب للمراجعة')
      setSelectedFilesByOrderId((current) => ({ ...current, [orderId]: null }))
      setUploadNotesByOrderId((current) => ({ ...current, [orderId]: '' }))
      await mutatePartnerOrders()
    } finally {
      setUploadingOrderId(null)
    }
  }

  if (!activeProfileId) return null

  return (
    <div
      className='max-w-full overflow-x-hidden p-4 pb-24 space-y-6 animate-in fade-in duration-500'
      dir='rtl'
    >
      {/* الهيدر */}
      <div className='flex items-center justify-between gap-2'>
        <div>
          <h2 className='text-2xl font-bold tracking-tight text-foreground'>السجل الطبي</h2>
          <p className='text-[10px] text-muted-foreground font-medium mt-1'>
            تاريخ الكشوفات، الروشتات، والتحاليل
          </p>
        </div>
        <div className='shrink-0'>
          <ProfileSwitcher tenantSlug={tenantSlug} />
        </div>
      </div>

      {/* قائمة الزيارات */}
      <div className='space-y-4'>
        {isLoading ? (
          <div className='space-y-4'>
            <Skeleton className='h-24 w-full rounded-2xl' />
            <Skeleton className='h-24 w-full rounded-2xl' />
            <Skeleton className='h-24 w-full rounded-2xl' />
          </div>
        ) : visits.length > 0 ? (
          <Accordion type='single' collapsible className='w-full space-y-4'>
            {visits.map((visit) => (
              <AccordionItem
                key={visit.id}
                value={visit.id}
                className='border border-border/40 rounded-2xl bg-background overflow-hidden px-4 shadow-sm'
              >
                <AccordionTrigger className='hover:no-underline py-4'>
                  <div className='flex items-center gap-4 text-right w-full'>
                    <div className='w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center shrink-0 border border-border/50'>
                      <Stethoscope className='w-5 h-5 text-primary' />
                    </div>
                    <div className='flex flex-col gap-1 items-start'>
                      <p className='font-bold text-sm text-foreground'>د. {visit.doctorName}</p>
                      <div className='flex items-center gap-2 text-[10px] text-muted-foreground font-medium'>
                        <Calendar className='w-3 h-3' />
                        {new Date(visit.startedAt).toLocaleDateString('ar-EG', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                        <Badge
                          variant='outline'
                          className='text-[9px] font-bold h-4 py-0 leading-none'
                        >
                          {visit.visitType === 'Exam' ? 'كشف' : 'استشارة'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </AccordionTrigger>

                <AccordionContent className='pb-4 pt-2 border-t border-border/40 space-y-4'>
                  {/* التشخيص */}
                  {visit.diagnosis && (
                    <div className='bg-primary/5 p-3 rounded-xl border border-primary/10'>
                      <p className='text-[10px] font-bold text-primary mb-1 uppercase tracking-wider'>
                        التشخيص
                      </p>
                      <p className='text-sm font-semibold text-foreground leading-relaxed'>
                        {visit.diagnosis}
                      </p>
                    </div>
                  )}

                  {/* الروشتة (الأدوية) */}
                  {visit.prescriptions && visit.prescriptions.length > 0 && (
                    <div className='space-y-2'>
                      <div className='flex items-center gap-2 text-[10px] font-bold text-muted-foreground px-1 uppercase tracking-wider'>
                        <Pill className='w-3 h-3' /> الأدوية الموصوفة
                      </div>
                      <div className='grid gap-2'>
                        {visit.prescriptions.map((p) => (
                          <div
                            key={p.id}
                            className='bg-muted/20 border border-border/40 p-2.5 rounded-lg flex flex-col gap-0.5'
                          >
                            <p className='text-xs font-bold text-foreground'>{p.medicationName}</p>
                            <p className='text-[10px] text-muted-foreground'>
                              {p.dosage} • {p.frequency} • {p.duration}
                            </p>
                            {p.instructions && (
                              <p className='text-[10px] text-primary/70 italic mt-1 font-medium'>
                                {p.instructions}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* التحاليل والأشعة */}
                  {visit.labRequests && visit.labRequests.length > 0 && (
                    <div className='space-y-2'>
                      <div className='flex items-center gap-2 text-[10px] font-bold text-muted-foreground px-1 uppercase tracking-wider'>
                        <TestTube className='w-3 h-3' /> الفحوصات المطلوبة
                      </div>
                      <div className='grid gap-2'>
                        {visit.labRequests.map((lab) => (
                          <div
                            key={lab.id}
                            className='bg-muted/20 border border-border/40 p-2.5 rounded-lg flex items-center justify-between'
                          >
                            <div className='flex flex-col gap-0.5'>
                              <p className='text-xs font-bold text-foreground'>{lab.testName}</p>
                              <p className='text-[10px] text-muted-foreground'>
                                {lab.type === 'Lab' ? 'تحليل دم/معمل' : 'أشعة/تصوير'}
                              </p>
                            </div>
                            {lab.isUrgent && (
                              <Badge variant='destructive' className='text-[8px] h-4'>
                                عاجل
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ملاحظات الطبيب */}
                  {visit.notes && (
                    <div className='space-y-1'>
                      <p className='text-[10px] font-bold text-muted-foreground px-1'>
                        ملاحظات إضافية
                      </p>
                      <p className='text-xs text-muted-foreground leading-relaxed px-1 italic'>
                        {visit.notes}
                      </p>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ) : (
          /* Empty State */
          <div className='flex flex-col items-center justify-center py-24 text-center space-y-4'>
            <div className='w-20 h-20 rounded-full bg-muted/30 flex items-center justify-center'>
              <SearchX className='w-10 h-10 text-muted-foreground/20' />
            </div>
            <div className='space-y-1'>
              <p className='text-sm font-bold text-muted-foreground'>لا يوجد سجل طبي حالياً</p>
              <p className='text-[10px] text-muted-foreground/60'>
                تظهر هنا نتائج كشوفاتك السابقة فور اعتمادها
              </p>
            </div>
          </div>
        )}
      </div>

      {/* رحلة الطلبات الخارجية */}
      <div className='space-y-3'>
        <div className='flex items-center gap-2 text-[10px] font-bold text-muted-foreground px-1 uppercase tracking-wider'>
          <TestTube className='w-3 h-3' /> متابعة التحاليل والخدمات الخارجية
        </div>

        {partnerOrdersLoading ? (
          <div className='space-y-2'>
            <Skeleton className='h-20 w-full rounded-2xl' />
            <Skeleton className='h-20 w-full rounded-2xl' />
          </div>
        ) : partnerOrders.length > 0 ? (
          <div className='grid gap-2'>
            {partnerOrders.map((item) => (
              <div
                key={item.id}
                className='rounded-2xl border border-border/40 bg-background p-3 shadow-sm space-y-2'
              >
                <div className='flex items-start justify-between gap-2'>
                  <div>
                    <p className='text-sm font-bold text-foreground'>{item.partnerName}</p>
                    <p className='text-[10px] text-muted-foreground'>
                      {item.serviceName || 'خدمة خارجية'}
                    </p>
                    {item.doctorName && (
                      <p className='text-[10px] text-muted-foreground'>الطبيب المتابع: {item.doctorName}</p>
                    )}
                  </div>
                  <span className='text-[10px] px-2 py-1 rounded-full bg-primary/10 text-primary font-bold'>
                    {item.status === 'Completed'
                      ? 'مكتمل'
                      : item.status === 'InProgress'
                        ? 'جاري التنفيذ'
                        : item.status === 'Accepted'
                          ? 'مقبول'
                          : item.status === 'Sent'
                            ? 'مرسل'
                            : item.status}
                  </span>
                </div>

                <div className='grid gap-1 text-[10px] text-muted-foreground'>
                  {item.scheduledAt && (
                    <div className='flex items-center gap-1.5'>
                      <Clock3 className='w-3 h-3' />
                      موعد الحضور:{' '}
                      {new Date(item.scheduledAt).toLocaleString('ar-EG', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  )}

                  {item.partnerContactPhone && (
                    <div className='flex items-center gap-1.5'>
                      <Phone className='w-3 h-3' />
                      هاتف الشريك: {item.partnerContactPhone}
                    </div>
                  )}

                  {item.partnerAddress && (
                    <div className='flex items-start gap-1.5'>
                      <MapPin className='w-3 h-3 mt-0.5' />
                      <span>{item.partnerAddress}</span>
                    </div>
                  )}

                  {(item.price !== null || item.finalCost !== null) && (
                    <div>
                      التكلفة: {item.finalCost ?? item.price} ج.م
                      {item.patientDiscountPercentage !== null &&
                        ` (خصم متوقع ${item.patientDiscountPercentage}%)`}
                    </div>
                  )}

                  {item.externalReference && <div>مرجع خارجي: {item.externalReference}</div>}

                  {item.visitDiagnosis && <div>تشخيص الزيارة: {item.visitDiagnosis}</div>}

                  {item.resultSummary && (
                    <div className='flex items-start gap-1.5 text-foreground'>
                      <CircleCheck className='w-3 h-3 mt-0.5 text-emerald-600' />
                      <span>{item.resultSummary}</span>
                    </div>
                  )}

                  {item.notes && <div>{item.notes}</div>}
                </div>

                <div className='pt-1 flex flex-wrap gap-2'>
                  {(item.status === 'Sent' || item.status === 'Accepted') && !item.patientArrivedAt && (
                    <Button
                      size='sm'
                      variant='outline'
                      onClick={() => void confirmArrivalAtPartner(item.id)}
                      disabled={arrivingOrderId === item.id}
                    >
                      {arrivingOrderId === item.id ? 'جارٍ التأكيد...' : 'تأكيد الذهاب للشريك'}
                    </Button>
                  )}

                  <Button
                    size='sm'
                    variant='secondary'
                    onClick={() => void sendPartnerOrderComment(item.id)}
                    disabled={commentingOrderId === item.id}
                  >
                    <MessageSquareText className='w-3 h-3 ml-1' />
                    {commentingOrderId === item.id ? 'جارٍ...' : 'تعليق للطبيب'}
                  </Button>
                </div>

                {!item.resultUploadedAt && (
                  <div className='rounded-xl border border-dashed border-border/60 p-2.5 space-y-2'>
                    <p className='text-[10px] text-muted-foreground'>
                      لو الشريك ما رفعش النتيجة، تقدر ترفع الملف هنا عشان الطبيب يراجعه.
                    </p>

                    <input
                      type='file'
                      accept='.pdf,.jpg,.jpeg,.png,.webp'
                      className='block w-full text-[11px]'
                      onChange={(event) =>
                        setSelectedFilesByOrderId((current) => ({
                          ...current,
                          [item.id]: event.target.files?.[0] || null,
                        }))
                      }
                    />

                    <Textarea
                      value={uploadNotesByOrderId[item.id] || ''}
                      onChange={(event) =>
                        setUploadNotesByOrderId((current) => ({
                          ...current,
                          [item.id]: event.target.value,
                        }))
                      }
                      placeholder='ملاحظات إضافية للطبيب (اختياري)'
                      className='min-h-[68px] text-[11px]'
                    />

                    <Button
                      size='sm'
                      variant='outline'
                      onClick={() =>
                        void uploadFallbackResult(item.id, item.visitId, item.partnerType)
                      }
                      disabled={uploadingOrderId === item.id}
                    >
                      <UploadCloud className='w-3 h-3 ml-1' />
                      {uploadingOrderId === item.id ? 'جارٍ الرفع...' : 'رفع نتيجة بديلة'}
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className='rounded-2xl border border-dashed border-border/60 p-4 text-center text-[11px] text-muted-foreground'>
            لا توجد طلبات خارجية مرتبطة بسجلك حالياً.
          </div>
        )}
      </div>

      {/* زرار "عرض المزيد" بسيط جداً */}
      {historyRes?.data?.hasNextPage && (
        <button
          onClick={() => setPage((p) => p + 1)}
          className='w-full py-3 text-xs font-bold text-primary bg-primary/5 rounded-2xl border border-primary/10 hover:bg-primary/10 transition-colors'
        >
          عرض المزيد من الزيارات
        </button>
      )}
    </div>
  )
}
