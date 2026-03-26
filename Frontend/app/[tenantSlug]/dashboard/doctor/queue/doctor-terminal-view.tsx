'use client'

import { getMyQueueAction } from '@/actions/doctor/get-my-queue'
import { ICreateTicketResponse, IQueueBoardSession, IQueueTicket } from '@/types/queue'
import { AlertCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import useSWR from 'swr'
import { Card, CardContent } from '../../../../../components/ui/card'
import { BaseApiResponse } from '../../../../../types/api'
import { CurrentPatientCard } from './current-patient-card'
import { OpenMySessionButton } from './open-my-session-button'
import { WaitingQueueList } from './waiting-queue-list'

interface Props {
  // عدلنا النوع عشان يقبل null في البداية
  initialData: IQueueBoardSession | null
  tenantSlug: string
}

export function DoctorTerminalView({ initialData, tenantSlug }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // الـ SWR ده بقى شغال 24 ساعة، سواء العيادة مقفولة أو مفتوحة
  const { data: queueData, mutate } = useSWR(
    ['doctorQueue', tenantSlug],
    async ([, slug]) => {
      const res = await getMyQueueAction(slug)
      if (!res.success || !res.data) return null
      return res.data
    },
    {
      fallbackData: initialData,
      refreshInterval: 10000, // كل 10 ثواني هيسأل
      revalidateOnFocus: true,
      keepPreviousData: true,
      refreshWhenHidden: false,
    },
  )

  // بنعتمد على الداتا اللي جاية من SWR (ولو لسه بتحمل، بناخد الـ initial)
  const currentData = queueData !== undefined ? queueData : initialData

  // 🔴 السحر هنا: الشاشة بتتغير أوتوماتيك لو مفيش داتا أو العيادة مش نشطة
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

  // 🟢 لو فيه داتا (العيادة اتفتحت)، هنرسم الطابور العادي
  const { currentTicket, waitingTickets, waitingCount } = currentData

  const handleAction = (
    actionFn: (
      tenantSlug: string,
      ticketId: string,
    ) => Promise<BaseApiResponse<IQueueTicket | ICreateTicketResponse>>,
    ticketId: string,
  ) => {
    startTransition(async () => {
      const result = await actionFn(tenantSlug, ticketId)
      if (result.success) {
        await mutate()
        if (result.data && 'visitId' in result.data) {
          const visitId = (result.data as ICreateTicketResponse).visitId
          router.push(`/${tenantSlug}/dashboard/doctor/visits/${visitId}`)
        }
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
