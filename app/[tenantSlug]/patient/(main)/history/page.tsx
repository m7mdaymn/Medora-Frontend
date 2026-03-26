'use client'

import { getPatientVisitsAppAction } from '@/actions/patient-app/profile'
import { ProfileSwitcher } from '@/components/patient/profile-switcher'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { usePatientAuthStore } from '@/store/usePatientAuthStore'
import {
  Calendar,
  Pill,
  SearchX,
  Stethoscope,
  TestTube
} from 'lucide-react'
import { useParams } from 'next/navigation'
import { useState } from 'react'
import useSWR from 'swr'

export default function PatientHistoryPage() {
  const params = useParams()
  const tenantSlug = params.tenantSlug as string
  const [page, setPage] = useState(1)

  const authData = usePatientAuthStore((state) => state.tenants[tenantSlug])
  const activeProfileId = authData?.activeProfileId

  // جلب سجل الزيارات
  const { data: historyRes, isLoading } = useSWR(
    activeProfileId ? ['patientHistory', tenantSlug, activeProfileId, page] : null,
    () => getPatientVisitsAppAction(tenantSlug, activeProfileId!, page, 10),
  )

  const visits = historyRes?.data?.items || []

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
