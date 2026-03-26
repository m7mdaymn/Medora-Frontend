'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Calendar, User } from 'lucide-react'
import Link from 'next/link'
import useSWR from 'swr'
import { getMyTicketAction } from '../../actions/patient-app/get-my-ticket'

export function LiveQueueStatus({ tenantSlug }: { tenantSlug: string }) {
  const { data: response, isLoading } = useSWR(
    ['live-patient-ticket', tenantSlug],
    () => getMyTicketAction(tenantSlug),
    { refreshInterval: 10000, refreshWhenHidden: false },
  )

  // 1. Minimal Skeleton (No big blobs, just structural lines)
  if (isLoading) {
    return (
      <div className='space-y-3 animate-pulse'>
        <div className='h-4 w-20 bg-muted rounded' />
        <div className='border rounded-xl h-48 bg-card' />
      </div>
    )
  }

  const ticket = response?.data

  // TODO: هنستبدل دول لما الباك إند يبعتهم في الـ API زي ما اتفقنا
  const mockedCurrentServing = ticket ? Math.max(1, ticket.ticketNumber - 2) : 0
  const mockedPeopleAhead = ticket ? Math.max(0, ticket.ticketNumber - mockedCurrentServing - 1) : 0

  // 2. Empty State (Vercel Style: Dashed border, completely muted)
  if (!response?.success || !ticket) {
    return (
      <div className='flex flex-col items-center justify-center p-8 border border-dashed rounded-xl bg-muted/10 text-center space-y-3'>
        <div className='p-3 bg-muted rounded-full'>
          <Calendar className='w-5 h-5 text-muted-foreground' />
        </div>
        <div className='space-y-1'>
          <p className='text-sm font-medium text-foreground'>لا يوجد دور نشط</p>
          <p className='text-xs text-muted-foreground'>ليس لديك تذاكر في طابور الانتظار اليوم.</p>
        </div>
        <Button asChild variant='outline' size='sm' className='mt-2 text-xs'>
          <Link href={`/${tenantSlug}/patient/book`}>حجز موعد جديد</Link>
        </Button>
      </div>
    )
  }

  // 3. Active Ticket State (Ultra Minimal)
  return (
    <div className='space-y-3'>
      {/* Header */}
      <div className='flex items-center justify-between px-1'>
        <h2 className='text-sm font-medium text-muted-foreground'>دورك الحالي</h2>
        {ticket.status === 'Waiting' && (
          <span className='flex items-center gap-2 text-[10px] font-medium text-emerald-600 uppercase tracking-wider'>
            <span className='relative flex h-1.5 w-1.5'>
              <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75'></span>
              <span className='relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500'></span>
            </span>
            تحديث مباشر
          </span>
        )}
      </div>

      {/* Main Ticket Container (Clean borders, divide-y, no shadows) */}
      <div className='border rounded-xl bg-background overflow-hidden flex flex-col'>
        {/* Top Section: Ticket Number */}
        <div className='p-6 flex items-center justify-between border-b'>
          <div className='space-y-1'>
            <p className='text-[10px] font-medium text-muted-foreground uppercase tracking-widest'>
              رقم التذكرة
            </p>
            <p className='text-5xl font-mono font-semibold tracking-tighter text-foreground'>
              {ticket.ticketNumber}
            </p>
          </div>
          <div className='text-left'>
            <Badge
              variant='secondary'
              className={`font-normal text-xs px-2.5 py-0.5 rounded-md ${
                ticket.status === 'Called'
                  ? 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/10'
                  : ticket.status === 'InVisit'
                    ? 'bg-blue-500/10 text-blue-600 hover:bg-blue-500/10'
                    : ''
              }`}
            >
              {ticket.status === 'Waiting'
                ? 'في الانتظار'
                : ticket.status === 'Called'
                  ? 'تفضل بالدخول'
                  : ticket.status === 'InVisit'
                    ? 'داخل العيادة'
                    : ticket.status}
            </Badge>
          </div>
        </div>

        {/* Middle Section: The Context (Grid with dividers) */}
        <div className='grid grid-cols-2 divide-x divide-x-reverse border-b bg-muted/20'>
          <div className='p-4 flex flex-col items-center justify-center space-y-1'>
            <span className='text-[10px] text-muted-foreground uppercase tracking-wider'>
              يكشف الآن
            </span>
            <span className='text-xl font-mono font-medium text-foreground'>
              {mockedCurrentServing > 0 ? `#${mockedCurrentServing}` : '--'}
            </span>
          </div>
          <div className='p-4 flex flex-col items-center justify-center space-y-1'>
            <span className='text-[10px] text-muted-foreground uppercase tracking-wider'>
              أمامك
            </span>
            <span className='text-xl font-mono font-medium text-foreground'>
              {mockedPeopleAhead > 0 ? `${mockedPeopleAhead}` : '0'}
            </span>
          </div>
        </div>

        {/* Bottom Section: Doctor & Service Info */}
        <div className='p-4 flex items-center justify-between bg-muted/5'>
          <div className='flex items-center gap-3'>
            <div className='h-8 w-8 rounded-full bg-muted flex items-center justify-center border'>
              <User className='h-4 w-4 text-muted-foreground' />
            </div>
            <div className='flex flex-col'>
              <span className='text-sm font-medium text-foreground'>{ticket.doctorName}</span>
              <span className='text-[10px] text-muted-foreground'>
                {ticket.serviceName || 'كشف عام'}
              </span>
            </div>
          </div>

          {/* Subtle CTA if needed, e.g., view details */}
          <Button
            variant='ghost'
            size='icon'
            className='h-8 w-8 text-muted-foreground hover:text-foreground'
          >
            <ArrowLeft className='h-4 w-4' />
          </Button>
        </div>
      </div>
    </div>
  )
}
