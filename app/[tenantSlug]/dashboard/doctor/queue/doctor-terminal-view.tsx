'use client'

import { getMyQueueAction } from '@/actions/doctor/get-my-queue'
import { ICreateTicketResponse, IQueueBoardSession, IQueueTicket } from '@/types/queue'
import { AlertCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { toast } from 'sonner' // 👈 متنساش دي
import useSWR from 'swr'
import { Card, CardContent } from '../../../../../components/ui/card'
import { BaseApiResponse } from '../../../../../types/api'
import { CurrentPatientCard } from './current-patient-card'
import { OpenMySessionButton } from './open-my-session-button'
import { WaitingQueueList } from './waiting-queue-list'

interface Props {
  initialData: IQueueBoardSession | null
  tenantSlug: string
}

export function DoctorTerminalView({ initialData, tenantSlug }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const { data: queueData, mutate } = useSWR(
    ['doctorQueue', tenantSlug],
    async ([, slug]) => {
      const res = await getMyQueueAction(slug)
      if (!res.success || !res.data) return null
      return res.data
    },
    {
      fallbackData: initialData,
      refreshInterval: 10000,
      revalidateOnFocus: true,
      keepPreviousData: true,
      refreshWhenHidden: false,
    },
  )

  const currentData = queueData !== undefined ? queueData : initialData

  if (!currentData || !currentData.isActive) {
    return (
      <div className='max-w-2xl mx-auto mt-10'>
        <Card className='border-dashed shadow-none bg-muted/10'>
          <CardContent className='flex flex-col items-center justify-center py-16 text-center'>
            <AlertCircle className='w-12 h-12 text-muted-foreground/50 mb-4' />
            <h2 className='text-xl font-bold text-foreground mb-2'>العيادة مغلقة حالياً</h2>
            <p className='text-sm text-muted-foreground mb-6'>
              لا توجد جلسة عمل نشطة. افتح الجلسة لتمكين حجز المرضى وإدارة الطابور.
            </p>
            <OpenMySessionButton tenantSlug={tenantSlug} />
          </CardContent>
        </Card>
      </div>
    )
  }

  const { currentTicket, waitingTickets, waitingCount } = currentData

  const handleAction = (
    actionFn: (
      tenantSlug: string,
      ticketId: string,
    ) => Promise<BaseApiResponse<IQueueTicket | ICreateTicketResponse>>, // 👈 خليناها any عشان نقبل إن الـ data تكون null عادي
    ticketId: string,
  ) => {
    startTransition(async () => {
      try {
        const result = await actionFn(tenantSlug, ticketId)

        if (!result) {
          toast.error('لم يتم تلقي استجابة من الخادم')
          return
        }

        if (result.success) {
          await mutate() // نحدث الطابور

          // 👈 لو فيه visitId (زي حالة بدء الكشف) هنوديه عليها
          if (result.data && 'visitId' in result.data) {
            const visitId = result.data.visitId
            if (visitId) {
              router.push(`/${tenantSlug}/dashboard/doctor/visits/${visitId}`)
              return
            }
          }

          // لو أكشن تاني (إنهاء/نداء/تخطي) والداتا null بس success true، ده صح 100%
          toast.success(result.message || 'تم الإجراء بنجاح')
        } else {
          // 🔥 هنا السر: الباك إند هيقولك ليه رافض ينهي الزيارة!
          toast.error(result.message || 'لا يمكن إتمام هذا الإجراء الآن')
        }
      } catch (error) {
        toast.error('حدث خطأ أثناء الاتصال')
      }
    })
  }

  return (
    <div className='space-y-8 animate-in fade-in duration-500'>
      <CurrentPatientCard
        currentTicket={currentTicket}
        waitingTickets={waitingTickets}
        isPending={isPending}
        onAction={handleAction}
      />
      <WaitingQueueList waitingTickets={waitingTickets} waitingCount={waitingCount} />
    </div>
  )
}
