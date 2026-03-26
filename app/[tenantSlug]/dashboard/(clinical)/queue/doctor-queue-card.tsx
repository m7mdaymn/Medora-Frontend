'use client'

import { closeQueueSession } from '@/actions/queue/sessions'
import { cancelTicket, markTicketUrgent } from '@/actions/queue/tickets'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { IQueueBoardSession } from '@/types/queue'
import { ArrowUp, MoreHorizontal, Power, X } from 'lucide-react'
import { toast } from 'sonner'
import { mutate } from 'swr'

interface DoctorQueueCardProps {
  tenantSlug: string
  session: IQueueBoardSession
}

export function DoctorQueueCard({ tenantSlug, session }: DoctorQueueCardProps) {
  // 1. الداتا بتتعرض زي ما الباك إند باعتها بدون أي تلاعب في الترتيب
  const waitlist = session.waitingTickets || []
  // 2. متغيرات حالة الطابور عشان الـ Force Close
  const isPatientInVisit = !!session.currentTicket
  const hasWaitingPatients = waitlist.length > 0
  
  const handleCloseSession = async () => {
    // الإنهاء الإجباري بيتبعت بس لو فيه مريض لسه بيكشف جوه الأوضة
    const res = await closeQueueSession(tenantSlug, session.sessionId)
    if (res.success) {
      toast.success(`تم إنهاء شفت د. ${session.doctorName}`)
      await mutate(['queueBoard', tenantSlug])
    } else {
      toast.error(res.message)
    }
  }
  
  const handleUrgent = async (ticketId: string) => {
    const res = await markTicketUrgent(tenantSlug, ticketId)
    if (res.success) {
      toast.success('تم رفع الحالة لطوارئ')
      await mutate(['queueBoard', tenantSlug])
    } else {
      toast.error(res.message)
    }
  }
  
  const handleCancel = async (ticketId: string) => {
    const res = await cancelTicket(tenantSlug, ticketId)
    if (res.success) {
      toast.success('تم إلغاء التذكرة')
      await mutate(['queueBoard', tenantSlug])
    } else {
      toast.error(res.message)
    }
  }
  

  return (
    <div className='flex flex-col h-full'>
      {/* Header */}
      <div className='flex items-center justify-between p-4 border-b bg-card'>
        <div className='flex items-center gap-3'>
          <div className='h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold'>
            {session.doctorName?.charAt(0) || '?'}
          </div>
          <div>
            <h2 className='font-semibold'>
              {session.doctorName ? `د. ${session.doctorName}` : 'طبيب غير محدد'}
            </h2>
          </div>
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant='ghost' size='sm' className='text-destructive hover:bg-destructive/10'>
              <Power className='h-4 w-4 md:mr-2' />
              <span className='hidden md:inline'>إنهاء</span>
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className={isPatientInVisit ? 'text-destructive' : ''}>
                {isPatientInVisit ? 'تحذير: إنهاء إجباري للعيادة!' : 'إغلاق العيادة؟'}
              </AlertDialogTitle>
              <AlertDialogDescription
                className={isPatientInVisit ? 'font-bold text-destructive/80' : ''}
              >
                {isPatientInVisit
                  ? 'يوجد مريض داخل غرفة الكشف حالياً! هل أنت متأكد من الإنهاء الإجباري للعيادة؟'
                  : hasWaitingPatients
                    ? `هل أنت متأكد من إغلاق العيادة؟ يوجد (${waitlist.length}) مرضى في الانتظار سيتم تحويلهم إلى متغيبين.`
                    : 'هل أنت متأكد من إنهاء شفت الطبيب؟'}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>إلغاء</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleCloseSession}
                variant={isPatientInVisit ? 'destructive' : 'default'}
              >
                {isPatientInVisit ? 'تأكيد الإنهاء الإجباري' : 'تأكيد الإغلاق'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <div className='flex-1 overflow-y-auto p-4 space-y-6'>
        {/* Current Patient */}
        <div className='rounded-lg border bg-muted/30 p-6 flex flex-col items-center justify-center text-center space-y-2'>
          {session.currentTicket ? (
            <>
              <h1 className='text-3xl font-bold tracking-tight text-primary'>
                {session.currentTicket.patientName}
              </h1>
              <div className='flex items-center gap-2 text-muted-foreground'>
                <span className='font-mono font-bold text-foreground'>
                  #{session.currentTicket.ticketNumber}
                </span>
                <span>•</span>
                <span>{session.currentTicket.serviceName || 'كشف'}</span>
              </div>
              {session.currentTicket.isUrgent && (
                <Badge variant='destructive' className='mt-2'>
                  حالة طارئة
                </Badge>
              )}
            </>
          ) : (
            <p className='text-muted-foreground py-4'>بانتظار دخول المريض التالي...</p>
          )}
        </div>

        {/* Waiting List */}
        <div>
          <h3 className='font-semibold text-sm mb-3 flex items-center gap-2'>
            الانتظار
            <Badge variant='secondary' className='rounded-full'>
              {waitlist.length}
            </Badge>
          </h3>

          <div className='rounded-md border divide-y'>
            {waitlist.length > 0 ? (
              waitlist.map((ticket) => (
                <div
                  key={ticket.id}
                  className='flex items-center justify-between p-3 hover:bg-muted/50 transition-colors'
                >
                  <div className='flex items-center gap-4'>
                    <div className='flex items-center justify-center w-8 h-8 rounded bg-muted text-sm font-bold font-mono'>
                      {ticket.ticketNumber}
                    </div>
                    <div>
                      <p className='text-sm font-medium leading-none'>
                        {ticket.patientName}
                        {ticket.isUrgent && (
                          <Badge variant='destructive' className='mr-2 text-[10px] h-4 px-1'>
                            طوارئ
                          </Badge>
                        )}
                      </p>
                      <p className='text-xs text-muted-foreground mt-1'>
                        {ticket.serviceName || 'كشف عام'}
                      </p>
                    </div>
                  </div>

                  {/* Actions Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant='ghost' size='icon' className='h-8 w-8'>
                        <MoreHorizontal className='h-4 w-4' />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align='end'>
                      <DropdownMenuLabel>إجراءات</DropdownMenuLabel>
                      {!ticket.isUrgent && (
                        <DropdownMenuItem onClick={() => handleUrgent(ticket.id)}>
                          <ArrowUp className='ml-2 h-4 w-4' /> استعجال
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleCancel(ticket.id)}
                        className='text-destructive focus:text-destructive'
                      >
                        <X className='ml-2 h-4 w-4' /> إلغاء التذكرة
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))
            ) : (
              <div className='p-8 text-center text-muted-foreground text-sm'>
                لا يوجد مرضى في الانتظار
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
