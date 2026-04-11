'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { ar } from 'date-fns/locale'
import { Loader2, SendHorizontal } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import useSWR from 'swr'
import { toast } from 'sonner'

import {
  getPlatformSupportMessagesAction,
  getPlatformSupportThreadsAction,
  sendPlatformSupportMessageAction,
} from '@/actions/support/chat'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

export default function PlatformSupportPage() {
  const searchParams = useSearchParams()
  const tenantIdFromQuery = searchParams.get('tenantId')?.trim() || ''

  const [selectedTenantId, setSelectedTenantId] = useState<string>('')
  const [message, setMessage] = useState('')
  const [isSending, setIsSending] = useState(false)

  const { data: threadsRes, isLoading: loadingThreads, mutate: mutateThreads } = useSWR(
    ['platform-support-threads'],
    () => getPlatformSupportThreadsAction(),
    { refreshInterval: 8000 },
  )

  const threads = useMemo(() => threadsRes?.data ?? [], [threadsRes?.data])

  useEffect(() => {
    if (threads.length === 0) return

    const hasCurrentSelection = threads.some((thread) => thread.tenantId === selectedTenantId)
    if (hasCurrentSelection) return

    if (tenantIdFromQuery) {
      const hasQueryTenant = threads.some((thread) => thread.tenantId === tenantIdFromQuery)
      if (hasQueryTenant) {
        setSelectedTenantId(tenantIdFromQuery)
        return
      }
    }

    setSelectedTenantId(threads[0].tenantId)
  }, [selectedTenantId, tenantIdFromQuery, threads])

  const { data: messagesRes, isLoading: loadingMessages, mutate: mutateMessages } = useSWR(
    selectedTenantId ? ['platform-support-messages', selectedTenantId] : null,
    () => getPlatformSupportMessagesAction(selectedTenantId),
    { refreshInterval: 6000 },
  )

  const messages = useMemo(() => messagesRes?.data ?? [], [messagesRes?.data])
  const selectedThread = useMemo(
    () => threads.find((thread) => thread.tenantId === selectedTenantId),
    [selectedTenantId, threads],
  )

  const onSend = async (event: FormEvent) => {
    event.preventDefault()

    if (!selectedTenantId) {
      toast.error('اختر عيادة أولاً')
      return
    }

    const payload = message.trim()
    if (!payload) {
      toast.error('اكتب الرد أولاً')
      return
    }

    setIsSending(true)
    try {
      const response = await sendPlatformSupportMessageAction(selectedTenantId, payload)
      if (!response.success) {
        toast.error(response.message || 'تعذر إرسال الرد')
        return
      }

      setMessage('')
      await Promise.all([mutateMessages(), mutateThreads()])
      toast.success('تم إرسال الرد للعيادة')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className='space-y-6'>
      <section className='flex flex-col gap-4 rounded-2xl border bg-card p-6 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h1 className='text-2xl font-bold'>صندوق دعم المنصة</h1>
          <p className='mt-1 text-sm text-muted-foreground'>
            استقبل أسئلة العيادات من صفحة الدعم والرد عليها مباشرة.
          </p>
        </div>

        <Button asChild variant='outline'>
          <Link href='/admin/control-tower'>العودة لمركز القيادة</Link>
        </Button>
      </section>

      <div className='grid gap-4 lg:grid-cols-[320px_1fr]'>
        <Card className='border-border/60'>
          <CardHeader>
            <CardTitle className='text-base'>العيادات</CardTitle>
          </CardHeader>
          <CardContent className='space-y-2 max-h-[70vh] overflow-y-auto'>
            {loadingThreads ? (
              <div className='py-6 text-center text-sm text-muted-foreground'>
                <Loader2 className='h-4 w-4 animate-spin inline ml-2' />
                جاري تحميل المحادثات...
              </div>
            ) : threads.length === 0 ? (
              <div className='py-6 text-center text-sm text-muted-foreground'>
                لا توجد رسائل دعم حالياً.
              </div>
            ) : (
              threads.map((thread) => (
                <button
                  key={thread.tenantId}
                  type='button'
                  onClick={() => setSelectedTenantId(thread.tenantId)}
                  className={`w-full rounded-xl border p-3 text-right transition ${
                    selectedTenantId === thread.tenantId
                      ? 'border-primary bg-primary/5'
                      : 'border-border/60 hover:border-primary/50'
                  }`}
                >
                  <div className='flex items-center justify-between gap-2'>
                    <p className='font-semibold text-sm truncate'>{thread.tenantName}</p>
                    {thread.pendingTenantMessages > 0 && (
                      <Badge>{thread.pendingTenantMessages}</Badge>
                    )}
                  </div>
                  <p className='text-xs text-muted-foreground truncate mt-1'>{thread.lastMessage}</p>
                  <p className='text-[11px] text-muted-foreground mt-1'>
                    {formatDistanceToNow(new Date(thread.lastAt), {
                      addSuffix: true,
                      locale: ar,
                    })}
                  </p>
                </button>
              ))
            )}
          </CardContent>
        </Card>

        <Card className='border-border/60'>
          <CardHeader className='flex-row items-center justify-between space-y-0'>
            <CardTitle className='text-base'>
              {selectedThread ? `محادثة: ${selectedThread.tenantName}` : 'اختر عيادة'}
            </CardTitle>
            <Badge variant='outline'>تحديث تلقائي</Badge>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='h-[55vh] overflow-y-auto rounded-xl border border-border/60 p-3 space-y-3 bg-muted/10'>
              {!selectedTenantId ? (
                <div className='h-full flex items-center justify-center text-sm text-muted-foreground'>
                  اختر عيادة من القائمة لعرض المحادثة.
                </div>
              ) : loadingMessages ? (
                <div className='h-full flex items-center justify-center text-sm text-muted-foreground'>
                  <Loader2 className='h-4 w-4 animate-spin inline ml-2' />
                  جاري تحميل الرسائل...
                </div>
              ) : messages.length === 0 ? (
                <div className='h-full flex items-center justify-center text-sm text-muted-foreground'>
                  لا توجد رسائل في هذه المحادثة بعد.
                </div>
              ) : (
                messages.map((item) => {
                  const fromTenant = item.direction === 'TenantToPlatform'
                  return (
                    <div key={item.id} className={`flex ${fromTenant ? 'justify-start' : 'justify-end'}`}>
                      <div
                        className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                          fromTenant
                            ? 'bg-card border border-border/60 text-foreground'
                            : 'bg-primary text-primary-foreground'
                        }`}
                      >
                        <div className='text-[11px] opacity-80 mb-1'>
                          {item.senderName || (fromTenant ? item.tenantName : 'فريق المنصة')}
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
                placeholder='اكتب ردك للعيادة...'
                maxLength={4000}
                className='h-11'
                disabled={!selectedTenantId}
              />
              <Button type='submit' className='h-11' disabled={isSending || !selectedTenantId}>
                {isSending ? <Loader2 className='h-4 w-4 animate-spin' /> : <SendHorizontal className='h-4 w-4' />}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
