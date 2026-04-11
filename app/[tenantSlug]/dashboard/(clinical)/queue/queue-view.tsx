'use client'

import { getQueueBoard } from '@/actions/queue/queue-board' // الـ Action بتاعك
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { PlusCircle, Stethoscope } from 'lucide-react'
import * as React from 'react'
import useSWR from 'swr' // <-- الاستيراد الجديد
import { BaseApiResponse } from '../../../../../types/api'
import { IDoctor } from '../../../../../types/doctor'
import { IQueueBoard } from '../../../../../types/queue'
import { DoctorQueueCard } from './doctor-queue-card'
import { OpenSessionDialog } from './open-session-dialog'

interface QueueViewProps {
  tenantSlug: string
  initialBoardRes: BaseApiResponse<IQueueBoard>
  doctors: IDoctor[]
}

export function QueueView({ tenantSlug, initialBoardRes, doctors }: QueueViewProps) {
  const { data: boardRes } = useSWR(['queueBoard', tenantSlug], ([, slug]) => getQueueBoard(slug), {
    fallbackData: initialBoardRes,
    refreshInterval: 10000,
    revalidateOnFocus: true,
    keepPreviousData: true,
    refreshWhenHidden: false,
  })

  const activeSessions = React.useMemo(() => {
    return (boardRes?.data?.sessions || []).filter((s) => s.isActive)
  }, [boardRes?.data?.sessions])

  const [selectedSessionId, setSelectedSessionId] = React.useState<string | null>(
    activeSessions.length > 0 ? activeSessions[0].sessionId : null,
  )

  React.useEffect(() => {
    if (
      activeSessions.length > 0 &&
      !activeSessions.find((s) => s.sessionId === selectedSessionId)
    ) {
      setSelectedSessionId(activeSessions[0].sessionId)
    }
  }, [activeSessions, selectedSessionId])

  const selectedSession = activeSessions.find((s) => s.sessionId === selectedSessionId)

  return (
    <div className='flex flex-col h-[calc(100vh-200px)] md:h-[calc(100vh-250px)] gap-6'>
      {activeSessions.length > 0 ? (
        <div className='flex flex-col md:flex-row flex-1 gap-4 md:gap-6 overflow-hidden'>
          {/* Sidebar List */}
          <Card className='w-full md:w-72 shrink-0 flex flex-col overflow-hidden border bg-muted/20 p-0'>
            <div className='p-3 border-b bg-background/50 flex items-center justify-between'>
              <h3 className='text-xs font-medium text-muted-foreground uppercase tracking-wider'>
                قائمة العيادات
              </h3>
              <OpenSessionDialog
                tenantSlug={tenantSlug}
                doctors={doctors}
                activeSessions={activeSessions}
              />
            </div>

            <div className='flex-1 overflow-x-auto md:overflow-x-hidden md:overflow-y-auto'>
              <div className='flex md:flex-col p-2 gap-2 min-w-max md:min-w-0'>
                {activeSessions.map((session) => {
                  const isSelected = session.sessionId === selectedSessionId
                  return (
                    <button
                      key={session.sessionId}
                      onClick={() => setSelectedSessionId(session.sessionId)}
                      className={cn(
                        'flex items-center justify-between p-3 rounded-md text-sm transition-colors border text-right',
                        'min-w-50 md:min-w-0',
                        isSelected
                          ? 'bg-background border-primary shadow-sm text-primary font-medium'
                          : 'bg-transparent border-transparent hover:bg-background/50 text-muted-foreground hover:text-foreground',
                      )}
                    >
                      <div className='flex items-center gap-2 truncate max-w-30 md:max-w-full'>
                        <div
                          className={cn(
                            'w-2 h-2 rounded-full shrink-0 transition-colors duration-500',
                            session.currentTicket ? 'bg-orange-500 animate-pulse' : 'bg-green-500',
                          )}
                        />
                        <span className='truncate'>د. {session.doctorName}</span>
                      </div>
                      <Badge
                        variant={isSelected ? 'outline' : 'secondary'}
                        className='mr-2 text-xs h-5 px-1.5 font-normal'
                      >
                        {session.waitingCount} انتظار
                      </Badge>
                    </button>
                  )
                })}
              </div>
            </div>
          </Card>

          {/* Main Detail View */}
          <div className='flex-1 h-full overflow-hidden rounded-lg border bg-background shadow-sm'>
            {selectedSession ? (
              <div className='h-full overflow-y-auto'>
                <DoctorQueueCard
                  key={selectedSession.sessionId}
                  tenantSlug={tenantSlug}
                  session={selectedSession}
                />
              </div>
            ) : (
              <div className='h-full flex flex-col items-center justify-center text-muted-foreground'>
                <p>اختر عيادة لعرض التفاصيل</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className='flex flex-col items-center justify-center w-full min-h-112.5  p-8 text-center animate-in fade-in-50 duration-500'>
          <div className='relative flex items-center justify-center w-20 h-20 mb-6 rounded-full border-2 bg-primary/10 '>
            <Stethoscope className='w-10 h-10 text-primary' />
            <div className='absolute -bottom-1 -right-1 bg-background rounded-full'>
              <PlusCircle className='w-6 h-6 text-primary fill-background' />
            </div>
          </div>

          <h3 className='text-2xl font-bold text-foreground mb-3 tracking-tight'>
            لا توجد عيادات مفتوحة حالياً
          </h3>

          <p className='text-base text-muted-foreground max-w-105 mx-auto mb-8 leading-relaxed'>
            ابدأ بفتح العيادة للطبيب لتتمكن من تسجيل الحجوزات، قطع التذاكر، وتنظيم أدوار المرضى.
          </p>

          <div className='shrink-0'>
            <OpenSessionDialog
              tenantSlug={tenantSlug}
              doctors={doctors}
              activeSessions={activeSessions}
            />
          </div>
        </div>
      )}
    </div>
  )
}
