'use client'

import { Badge } from '@/components/ui/badge'
import { IVisit } from '@/types/visit'
import { format } from 'date-fns'
import { ar } from 'date-fns/locale'
import { Activity, ChevronDown, FileText, HeartPulse, Stethoscope } from 'lucide-react'
import { useState } from 'react'

interface VisitsTimelineProps {
  visits: IVisit[]
  tenantSlug: string
}

function TimelineItem({ visit, tenantSlug }: { visit: IVisit; tenantSlug: string }) {
  const [expanded, setExpanded] = useState(false)
  const isCompleted = visit.status === 'Completed'

  return (
    <div className='relative pl-0 pr-6 md:pr-8 py-3 group'>
      {/* الخط الزمني والنقطة */}
      <div
        className={`absolute top-5 right-0 md:-right-1.25 w-3 h-3 rounded-full z-10 ring-4 ring-background transition-colors ${
          isCompleted ? 'bg-primary' : 'bg-muted-foreground'
        }`}
      />

      <div
        className={`rounded-xl border border-border/50 bg-card overflow-hidden transition-all duration-200 ${expanded ? 'shadow-md ring-1 ring-primary/20' : 'hover:border-primary/30'}`}
      >
        {/* الهيدر المصغر (بيظهر دايماً ومناسب جداً للموبايل) */}
        <div
          className='p-4 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3'
          onClick={() => setExpanded(!expanded)}
        >
          <div className='flex-1'>
            <div className='flex items-center gap-2 mb-1.5'>
              <h3 className='font-bold text-foreground text-sm flex items-center gap-1.5'>
                <Stethoscope className='w-4 h-4 text-primary' />
                د. {visit.doctorName}
              </h3>
              <Badge
                variant={isCompleted ? 'default' : 'secondary'}
                className='text-[10px] h-5 px-1.5 shadow-none'
              >
                {isCompleted ? 'مكتملة' : visit.status}
              </Badge>
            </div>
            <p className='text-xs text-muted-foreground'>
              {format(new Date(visit.startedAt), 'd MMM yyyy • p', { locale: ar })}
            </p>
          </div>

          <div className='flex items-center gap-2 self-end sm:self-auto'>
            <div
              className={`p-1.5 rounded-md bg-muted/50 transition-transform ${expanded ? 'rotate-180' : ''}`}
            >
              <ChevronDown className='h-4 w-4 text-muted-foreground' />
            </div>
          </div>
        </div>

        {/* التفاصيل اللي بتفتح (Accordion Content) */}
        {expanded && (
          <div className='px-4 pb-4 pt-1 border-t border-border/30 bg-muted/5 animate-in slide-in-from-top-2 duration-200'>
            {/* الشكوى والتشخيص */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-3 mt-3'>
              <div className='bg-background p-3 rounded-lg border border-border/50'>
                <span className='text-[10px] font-bold text-muted-foreground block mb-1'>
                  الشكوى
                </span>
                <p className='text-sm text-foreground'>{visit.complaint || 'لم تُسجل'}</p>
              </div>
              <div className='bg-background p-3 rounded-lg border border-border/50'>
                <span className='text-[10px] font-bold text-muted-foreground block mb-1'>
                  التشخيص المبدئي
                </span>
                <p className='text-sm text-foreground'>{visit.diagnosis || 'لم يُسجل'}</p>
              </div>
            </div>

            {/* العلامات الحيوية (مدمجة جداً) */}
            {(visit.bloodPressureSystolic ||
              visit.heartRate ||
              visit.temperature ||
              visit.weight) && (
              <div className='mt-4'>
                <span className='text-xs font-bold flex items-center gap-1.5 mb-2 text-foreground'>
                  <HeartPulse className='w-3.5 h-3.5 text-rose-500' /> العلامات الحيوية
                </span>
                <div className='flex flex-wrap gap-2'>
                  {visit.bloodPressureSystolic && (
                    <Badge variant='outline' className='bg-background font-normal text-xs'>
                      الضغط: {visit.bloodPressureSystolic}/{visit.bloodPressureDiastolic}
                    </Badge>
                  )}
                  {visit.heartRate && (
                    <Badge variant='outline' className='bg-background font-normal text-xs'>
                      النبض: {visit.heartRate}
                    </Badge>
                  )}
                  {visit.temperature && (
                    <Badge variant='outline' className='bg-background font-normal text-xs'>
                      الحرارة: {visit.temperature}°
                    </Badge>
                  )}
                  {visit.weight && (
                    <Badge variant='outline' className='bg-background font-normal text-xs'>
                      الوزن: {visit.weight}kg
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* الأدوية الموصوفة */}
            {visit.prescriptions && visit.prescriptions.length > 0 && (
              <div className='mt-4'>
                <span className='text-xs font-bold flex items-center gap-1.5 mb-2 text-foreground'>
                  <FileText className='w-3.5 h-3.5 text-blue-500' /> الروشتة الطبية
                </span>
                <div className='flex flex-col gap-1.5'>
                  {visit.prescriptions.map((rx) => (
                    <div
                      key={rx.id}
                      className='bg-background border border-border/50 rounded-lg p-2.5 flex items-center justify-between'
                    >
                      <span className='text-sm font-bold'>{rx.medicationName}</span>
                      <span className='text-[10px] text-muted-foreground bg-muted px-2 py-1 rounded-md'>
                        {rx.dosage} • {rx.frequency}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export function VisitsTimeline({ visits, tenantSlug }: VisitsTimelineProps) {
  if (!visits || visits.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center py-12 text-muted-foreground border border-dashed border-border rounded-xl bg-card/50'>
        <Activity className='h-10 w-10 mb-3 opacity-20' />
        <p className='text-sm font-medium'>لم يقم المريض بأي زيارة حتى الآن.</p>
      </div>
    )
  }

  return (
    <div className='relative border-r border-border/40 space-y-1 mt-2 mr-2 md:mr-4'>
      {visits.map((visit) => (
        <TimelineItem key={visit.id} visit={visit} tenantSlug={tenantSlug} />
      ))}
    </div>
  )
}
