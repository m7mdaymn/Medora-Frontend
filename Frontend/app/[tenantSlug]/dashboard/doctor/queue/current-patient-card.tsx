'use client'

import { getPatientSummaryAction } from '@/actions/patient/get-patient-summary'
import {
  callTicketAction,
  finishTicketAction,
  skipTicketAction,
  startVisitAction,
} from '@/actions/queue/tickets'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ICreateTicketResponse, IQueueTicket } from '@/types/queue'
import {
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Clock,
  FastForward,
  Loader2,
  PlayCircle,
  Stethoscope,
} from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { BaseApiResponse } from '../../../../../types/api'

interface Props {
  currentTicket?: IQueueTicket | null
  waitingTickets: IQueueTicket[]
  isPending: boolean
  onAction: (
    actionFn: (
      tenantSlug: string,
      ticketId: string,
    ) => Promise<BaseApiResponse<IQueueTicket | ICreateTicketResponse>>,
    ticketId: string,
  ) => void
}

export function CurrentPatientCard({ currentTicket, waitingTickets, isPending, onAction }: Props) {
  const router = useRouter()
  const params = useParams()
  const tenantSlug = params.tenantSlug as string
  const [isReturning, setIsReturning] = useState(false)

  const handleReturnToVisit = async () => {
    if (!currentTicket) return
    if ('visitId' in currentTicket && currentTicket.visitId) {
      router.push(`/${tenantSlug}/dashboard/doctor/visits/${currentTicket.visitId}`)
      return
    }
    setIsReturning(true)
    try {
      const summaryRes = await getPatientSummaryAction(tenantSlug, currentTicket.patientId)
      if (summaryRes.success && summaryRes.data) {
        const activeVisit = summaryRes.data.recentVisits?.find(
          (v) => v.completedAt === null && v.doctorName === currentTicket.doctorName,
        )
        if (activeVisit) router.push(`/${tenantSlug}/dashboard/doctor/visits/${activeVisit.id}`)
        else toast.error('لم يتم العثور على سجل زيارة مفتوح لهذا المريض.')
      } else {
        toast.error('فشل في جلب بيانات الزيارة.')
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء محاولة العودة للكشف.')
    } finally {
      setIsReturning(false)
    }
  }

  return (
    <Card className='border border-border/60 shadow-sm bg-card overflow-hidden'>
      <CardContent className='p-5 sm:p-8'>
        {currentTicket ? (
          <div className='space-y-6'>
            {/* Header: Responsive Layout */}
            <div className='flex flex-col sm:flex-row sm:items-start justify-between gap-4'>
              <div className='space-y-1.5'>
                <h2 className='text-2xl sm:text-3xl font-bold tracking-tight text-foreground'>
                  {currentTicket.patientName}
                </h2>
                <div className='flex flex-wrap items-center gap-y-2 gap-x-3 text-sm text-muted-foreground'>
                  <span className='font-mono font-bold text-primary bg-primary/5 px-2 py-0.5 rounded border border-primary/10'>
                    #{currentTicket.ticketNumber}
                  </span>
                  <span className='hidden sm:inline opacity-40'>•</span>
                  <span className='flex items-center gap-1.5'>
                    <Stethoscope className='w-4 h-4 opacity-70' />
                    {currentTicket.serviceName || 'كشف عام'}
                  </span>
                  <span className='hidden sm:inline opacity-40'>•</span>
                  <span className='flex items-center gap-1.5'>
                    <Clock className='w-4 h-4 opacity-70' />
                    {new Date(currentTicket.calledAt!).toLocaleTimeString('ar-EG', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>

              <div className='flex items-center gap-2'>
                {currentTicket.isUrgent && (
                  <Badge variant='destructive' className='px-2.5 py-0.5 rounded-md font-bold'>
                    حالة طارئة
                  </Badge>
                )}
                {currentTicket.status === 'InVisit' && (
                  <Badge
                    variant='secondary'
                    className='bg-primary/10 text-primary border-primary/20 px-2.5 py-0.5 rounded-md font-bold'
                  >
                    قيد الكشف الآن
                  </Badge>
                )}
              </div>
            </div>

            {/* Notes Section: Cleaner Design */}
            {currentTicket.notes && (
              <div className='bg-muted/40 border-r-4 border-primary p-4 rounded-l-xl'>
                <div className='flex items-center gap-2 mb-2'>
                  <ClipboardList className='w-4 h-4 text-primary' />
                  <span className='text-xs font-bold uppercase tracking-wider text-foreground/70'>
                    ملاحظات الفحص المبدئي
                  </span>
                </div>
                <p className='text-sm text-foreground/80 font-medium leading-relaxed'>
                  {currentTicket.notes}
                </p>
              </div>
            )}

            {/* Actions: Full width on mobile, auto on desktop */}
            <div className='flex flex-wrap items-center gap-3 pt-6 border-t border-border/60'>
              {currentTicket.status === 'Called' && (
                <>
                  <Button
                    variant='outline'
                    className='flex-1 sm:flex-none h-12 px-6 font-bold rounded-xl'
                    disabled={isPending}
                    onClick={() => onAction(skipTicketAction, currentTicket.id)}
                  >
                    <FastForward className='w-4 h-4 ml-2 opacity-60' /> تخطي المريض
                  </Button>

                  <Button
                    className='flex-1 sm:flex-none h-12 px-8 font-bold rounded-xl shadow-lg shadow-primary/20'
                    disabled={isPending}
                    onClick={() => onAction(startVisitAction, currentTicket.id)}
                  >
                    <PlayCircle className='w-5 h-5 ml-2' /> بدء الكشف
                  </Button>
                </>
              )}

              {currentTicket.status === 'InVisit' && (
                <>
                  <Button
                    variant='outline'
                    className='flex-1 sm:flex-none h-12 px-6 font-bold rounded-xl'
                    disabled={isPending || isReturning}
                    onClick={handleReturnToVisit}
                  >
                    {isReturning ? (
                      <Loader2 className='w-4 h-4 ml-2 animate-spin' />
                    ) : (
                      <ArrowRight className='w-4 h-4 ml-2' />
                    )}
                    {isReturning ? 'جاري التحميل...' : 'العودة لصفحة الكشف'}
                  </Button>

                  <Button
                    className='flex-1 sm:flex-none h-12 px-8 font-bold rounded-xl shadow-lg shadow-primary/20'
                    disabled={isPending || isReturning}
                    onClick={() => onAction(finishTicketAction, currentTicket.id)}
                  >
                    <CheckCircle2 className='w-5 h-5 ml-2' /> إنهاء الزيارة
                  </Button>
                </>
              )}
            </div>
          </div>
        ) : (
          /* Empty State: Focused & Minimal */
          <div className='flex flex-col items-center justify-center py-10 text-center'>
            <h3 className='text-xl font-bold text-foreground mb-1'>لا يوجد مريض حالياً</h3>
            <p className='text-sm text-muted-foreground mb-8 max-w-62.5'>
              غرفة الكشف فارغة، يمكنك مناداة المريض التالي من قائمة الانتظار.
            </p>
            <Button
              className='h-12 px-10 font-bold rounded-xl shadow-md'
              variant={waitingTickets.length > 0 ? 'default' : 'secondary'}
              disabled={waitingTickets.length === 0 || isPending}
              onClick={() => onAction(callTicketAction, waitingTickets[0]?.id)}
            >
              <PlayCircle className='w-5 h-5 ml-2' />
              {waitingTickets.length > 0 ? 'نداء المريض التالي' : 'قائمة الانتظار فارغة'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
