'use client'

import { getQueueBoard } from '@/actions/queue/queue-board'
import { BaseApiResponse } from '@/types/api'
import { IDoctor } from '@/types/doctor'
import { IQueueBoard } from '@/types/queue'
import useSWR from 'swr'
import { CutTicketDialog } from './cut-ticket-dialog'

// شيلنا المرضى من الانترفيس
interface QueueActionsProps {
  tenantSlug: string
  doctors: IDoctor[]
  initialBoardRes: BaseApiResponse<IQueueBoard>
}

export function QueueActions({ tenantSlug, doctors, initialBoardRes }: QueueActionsProps) {
  const { data: boardRes } = useSWR(['queueBoard', tenantSlug], ([, slug]) => getQueueBoard(slug), {
    fallbackData: initialBoardRes,
    refreshInterval: 10000,
    refreshWhenHidden: false,
  })

  const activeSessions = (boardRes?.data?.sessions || [])
    .filter((s) => s.isActive)
    .map((session) => {
      let finalDoctorName = session.doctorName
      if (!finalDoctorName && session.doctorId) {
        const matchedDoctor = doctors.find((d) => d.id === session.doctorId)
        finalDoctorName = matchedDoctor?.name || 'غير محدد'
      }
      return {
        ...session,
        doctorName: finalDoctorName || 'غير محدد',
      }
    })

  return (
    <div className='flex w-full flex-col-reverse gap-2 sm:w-auto sm:flex-row sm:items-center'>
      <CutTicketDialog tenantSlug={tenantSlug} activeSessions={activeSessions} doctors={doctors} />
    </div>
  )
}
