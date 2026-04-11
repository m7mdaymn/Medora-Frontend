'use client'

import { FormEvent, useMemo, useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { ar } from 'date-fns/locale'
import { Loader2, SendHorizontal } from 'lucide-react'
import { useParams } from 'next/navigation'
import { toast } from 'sonner'
import useSWR from 'swr'

import {
  getTenantSupportMessagesAction,
  sendTenantSupportMessageAction,
} from '@/actions/support/chat'
import { DashboardHeader, DashboardShell } from '@/components/shell'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

export default function SupportPage() {
  const params = useParams()
  const tenantSlug = params.tenantSlug as string

  const [message, setMessage] = useState('')
  const [isSending, setIsSending] = useState(false)

  const { data, isLoading, mutate } = useSWR(['tenant-support-chat', tenantSlug], () =>
    getTenantSupportMessagesAction(tenantSlug),
    {
      refreshInterval: 8000,
    },
  )

  const messages = useMemo(() => data?.data ?? [], [data?.data])

  const onSend = async (event: FormEvent) => {
    event.preventDefault()
    const payload = message.trim()

    if (!payload) {
      toast.error('اكتب رسالتك أولاً')
      return
    }

    setIsSending(true)
    try {
      const response = await sendTenantSupportMessageAction(tenantSlug, payload)
      if (!response.success) {
        toast.error(response.message || 'تعذر إرسال الرسالة')
        return
      }

      setMessage('')
      await mutate()
      toast.success('تم إرسال الرسالة لفريق المنصة')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <DashboardShell>
      <DashboardHeader
        heading='دعم المنصة'
        text='محادثة مباشرة مع فريق Medora (Super Admin / Worker) للطلبات التشغيلية.'
      />

      <Card className='border-border/60'>
        <CardHeader className='flex-row items-center justify-between space-y-0'>
          <CardTitle className='text-base'>محادثة الدعم</CardTitle>
          <Badge variant='outline'>تحديث تلقائي كل 8 ثواني</Badge>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='h-[55vh] overflow-y-auto rounded-xl border border-border/60 p-3 space-y-3 bg-muted/10'>
            {isLoading ? (
              <div className='h-full flex items-center justify-center text-muted-foreground text-sm'>
                <Loader2 className='h-4 w-4 animate-spin ml-2' />
                جاري تحميل المحادثة...
              </div>
            ) : messages.length === 0 ? (
              <div className='h-full flex items-center justify-center text-muted-foreground text-sm'>
                لا توجد رسائل بعد. ابدأ سؤالك الآن.
              </div>
            ) : (
              messages.map((item) => {
                const fromPlatform = item.direction === 'PlatformToTenant'

                return (
                  <div
                    key={item.id}
                    className={`flex ${fromPlatform ? 'justify-start' : 'justify-end'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                        fromPlatform
                          ? 'bg-card border border-border/60 text-foreground'
                          : 'bg-primary text-primary-foreground'
                      }`}
                    >
                      <div className='text-[11px] opacity-80 mb-1'>
                        {item.senderName || (fromPlatform ? 'فريق المنصة' : 'فريق العيادة')}
                        {item.senderRole ? ` • ${item.senderRole}` : ''}
                      </div>
                      <p className='whitespace-pre-wrap break-words'>{item.message}</p>
                      <div className='mt-1 text-[10px] opacity-70'>
                        {formatDistanceToNow(new Date(item.createdAt), {
                          addSuffix: true,
                          locale: ar,
                        })}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          <form onSubmit={onSend} className='flex gap-2'>
            <Input
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder='اكتب رسالتك لفريق المنصة...'
              maxLength={4000}
              className='h-11'
            />
            <Button type='submit' className='h-11' disabled={isSending}>
              {isSending ? <Loader2 className='h-4 w-4 animate-spin' /> : <SendHorizontal className='h-4 w-4' />}
            </Button>
          </form>
        </CardContent>
      </Card>
    </DashboardShell>
  )
}
