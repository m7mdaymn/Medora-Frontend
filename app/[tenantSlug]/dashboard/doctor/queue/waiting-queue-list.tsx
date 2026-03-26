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
  if (waitingTickets.length === 0) return null // لو مفيش مرضى، مفيش داعي نعرض مساحة فاضية كبيرة تحت

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
                    {new Date(ticket.calledAt!).toLocaleTimeString('ar-EG', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
