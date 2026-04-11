'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { ar } from 'date-fns/locale'
import { Eye, Stethoscope, Clock } from 'lucide-react'
import Link from 'next/link'
import { IPatientSummary } from '../../../../../../types/patient-app'

interface HistoryTabProps {
  summary: IPatientSummary | null
  tenantSlug: string
  currentVisitId: string
}

export function HistoryTab({ summary, tenantSlug, currentVisitId }: HistoryTabProps) {
  if (!summary) {
    return (
      <div className='flex flex-col items-center justify-center p-8 text-muted-foreground text-sm'>
        <p>تعذر تحميل السجل الطبي للمريض.</p>
      </div>
    )
  }

  // فلترة الزيارة الحالية
  const previousVisits = summary.recentVisits?.filter((v) => v.id !== currentVisitId) || []

  return (
    <div className='space-y-6'>


      {previousVisits.length === 0 ? (
        <div className='flex flex-col items-center justify-center py-10 text-muted-foreground opacity-60'>
          <Clock className='w-8 h-8 mb-3' />
          <p className='text-sm'>هذه هي الزيارة الأولى للمريض.</p>
        </div>
      ) : (
        /* 🔥 ستايل التايم لاين الجديد: خط رفيع وبادينج مظبوط */
        <div className='space-y-6 border-r border-muted-foreground/20 pr-5 mr-2 pb-4'>
          {previousVisits.map((v) => (
            <div key={v.id} className='relative'>
              {/* نقطة التايم لاين */}
              <div className='absolute w-2.5 h-2.5 bg-primary/80 rounded-full -right-6.25 top-1.5 ring-4 ring-background' />

              {/* كارت الزيارة: بدون خلفية مزعجة، مجرد بوردر خفيف */}
              <div className='p-4 rounded-xl border border-muted-foreground/15 bg-transparent hover:border-primary/30 hover:bg-muted/10 transition-all duration-200 group'>
                {/* دكتور الزيارة والتاريخ */}
                <div className='flex justify-between items-start gap-2 mb-3'>
                  <div className='flex items-center gap-1.5 font-bold text-sm text-foreground/90'>
                    <Stethoscope className='w-3.5 h-3.5 text-primary' />
                    د. {v.doctorName}
                  </div>
                  <span className='text-[10px] text-muted-foreground'>
                    {format(new Date(v.startedAt), 'dd MMM yyyy', { locale: ar })}
                  </span>
                </div>

                {/* الشكوى والتشخيص */}
                <div className='space-y-2.5 text-sm'>
                  {v.complaint && (
                    <div>
                      <span className='text-[10px] text-muted-foreground block mb-0.5'>
                        الشكوى:
                      </span>
                      <p className='font-medium text-foreground/80 leading-relaxed text-xs'>
                        {v.complaint}
                      </p>
                    </div>
                  )}
                  {v.diagnosis && (
                    <div>
                      <span className='text-[10px] text-muted-foreground block mb-0.5'>
                        التشخيص:
                      </span>
                      <p className='font-bold text-primary leading-relaxed text-xs'>
                        {v.diagnosis}
                      </p>
                    </div>
                  )}
                  {!v.complaint && !v.diagnosis && (
                    <p className='text-xs text-muted-foreground italic'>
                      لم يتم تسجيل تفاصيل سريرية.
                    </p>
                  )}
                </div>

                {/* زرار الروشتة: Ghost عشان ميزحمش الدنيا وبيظهر حلاوته في الهوفر */}
                <div className='mt-3 pt-3 border-t border-muted-foreground/10'>
                  <Link
                    href={`/${tenantSlug}/dashboard/doctor/visits/${v.id}?tab=prescription`}
                    target='_blank'
                  >
                    <Button
                      variant='ghost'
                      size='sm'
                      className='w-full h-8 text-xs text-muted-foreground hover:text-primary hover:bg-primary/5 gap-1.5'
                    >
                      <Eye className='w-3.5 h-3.5' />
                      عرض الروشتة والتفاصيل
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
