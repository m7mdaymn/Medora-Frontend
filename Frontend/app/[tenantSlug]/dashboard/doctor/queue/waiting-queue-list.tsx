import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { IQueueTicket } from '@/types/queue'
import { Clock, Stethoscope } from 'lucide-react'

interface Props {
  waitingTickets: IQueueTicket[]
  waitingCount: number
}

export function WaitingQueueList({ waitingTickets, waitingCount }: Props) {
  if (waitingTickets.length === 0) return null

  const getVisitTypeLabel = (value?: string | null) => {
    if (value === 'Consultation') return 'استشارة'
    if (value === 'Exam') return 'كشف'
    return null
  }

  const getSourceLabel = (value?: string | null) => {
    if (!value) return null
    if (value === 'Booking' || value === 'ConsultationBooking') return 'حجز'
    if (value === 'PatientSelfServiceTicket' || value === 'PatientSelfServiceBooking') {
      return 'خدمة ذاتية'
    }
    if (value === 'WalkInTicket') return 'حضور مباشر'
    return null
  }

  return (
    <div className='mt-8'>
      <div className='flex items-center justify-between mb-4 px-1'>
        <h3 className='text-lg font-bold text-foreground'>قائمة الانتظار ({waitingCount})</h3>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3'>
        {waitingTickets.map((ticket, index) => {
          const isNext = index === 0

          return (
            <Card
              key={ticket.id}
              className={cn(
                'border shadow-sm',
                isNext ? 'border-primary/50 bg-primary/5' : 'bg-card',
                ticket.isUrgent && 'border-destructive/30 bg-destructive/5',
              )}
            >
              <CardContent className='p-4'>
                <div className='flex items-start justify-between mb-3'>
                  <span className='font-mono text-sm font-medium bg-background border px-2 py-0.5 rounded text-muted-foreground'>
                    #{ticket.ticketNumber}
                  </span>
                  <div className='flex gap-1.5'>
                    {isNext && <Badge className='px-2 py-0.5 text-xs font-normal'>التالي</Badge>}
                    {ticket.isUrgent && (
                      <Badge variant='destructive' className='px-2 py-0.5 text-xs font-normal'>
                        طارئ
                      </Badge>
                    )}
                  </div>
                </div>

                <h4 className='font-semibold text-foreground truncate'>{ticket.patientName}</h4>

                <div className='flex items-center gap-3 mt-2 text-xs text-muted-foreground'>
                  {ticket.serviceName && (
                    <span className='flex items-center gap-1 truncate'>
                      <Stethoscope className='w-3.5 h-3.5' />
                      {ticket.serviceName}
                    </span>
                  )}
                  <span className='flex items-center gap-1'>
                    <Clock className='w-3.5 h-3.5' />
                    {/* 🔥 التعديل هنا: استخدمنا issuedAt بدل calledAt لأن المريض لسه في الانتظار */}
                    {new Date(ticket.issuedAt).toLocaleTimeString('ar-EG', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                {(getVisitTypeLabel(ticket.visitType) || getSourceLabel(ticket.source)) && (
                  <div className='mt-2 text-[11px] text-muted-foreground'>
                    {getVisitTypeLabel(ticket.visitType) || 'زيارة'}
                    {getSourceLabel(ticket.source) ? ` • ${getSourceLabel(ticket.source)}` : ''}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
