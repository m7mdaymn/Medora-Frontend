'use client'

import { FormEvent, useMemo, useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { ar } from 'date-fns/locale'
import {
  AlertCircle,
  ArrowLeft,
  LifeBuoy,
  Loader2,
  MessageSquare,
  SendHorizontal,
  Wrench,
} from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import useSWR from 'swr'
import { toast } from 'sonner'

import {
  getTenantSupportMessagesAction,
  sendTenantSupportMessageAction,
} from '@/actions/support/chat'
import { DashboardHeader, DashboardShell } from '@/components/shell'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

export default function ContractorSupportPage() {
  const params = useParams()
  const tenantSlug = params.tenantSlug as string

  const [message, setMessage] = useState('')
  const [isSending, setIsSending] = useState(false)

  const { data, isLoading, mutate } = useSWR(['contractor-support-chat', tenantSlug], () =>
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
        heading='دعم المتعاقد'
        text='محادثة مباشرة مع فريق المنصة + مسارات التشغيل اليومية للطلبات.'
      />

      <div className='grid gap-4 xl:grid-cols-[1fr_360px]'>
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
                          {item.senderName || (fromPlatform ? 'فريق المنصة' : 'فريق المتعاقد')}
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
                {isSending ? (
                  <Loader2 className='h-4 w-4 animate-spin' />
                ) : (
                  <SendHorizontal className='h-4 w-4' />
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className='space-y-4'>
          <Card className='border-border/60'>
            <CardHeader>
              <CardTitle className='flex items-center gap-2 text-base'>
                <MessageSquare className='h-5 w-5 text-primary' />
                قنوات الدعم المتاحة
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-2'>
              <Button asChild variant='outline' className='w-full justify-between'>
                <Link href={`/${tenantSlug}/dashboard/contractor/orders`}>
                  التواصل عبر تعليقات الطلبات
                </Link>
              </Button>
              <Button asChild variant='outline' className='w-full justify-between'>
                <Link href={`/${tenantSlug}/dashboard/contractor/reports`}>
                  عرض تقارير الأداء
                </Link>
              </Button>
              <Button asChild variant='outline' className='w-full justify-between'>
                <Link href={`/${tenantSlug}/dashboard/contractor/settings`}>
                  مراجعة إعدادات التشغيل
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className='border-border/60'>
            <CardHeader>
              <CardTitle className='flex items-center gap-2 text-base'>
                <LifeBuoy className='h-5 w-5 text-primary' />
                دليل حل المشكلات السريع
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-3 text-sm text-muted-foreground'>
              <div className='rounded-xl border p-3'>
                <p className='font-medium text-foreground'>1) الطلب لا يظهر في القائمة</p>
                <p className='mt-1'>افتح صفحة الطلبات ثم حدّث الصفحة، وتأكد من أنك على نفس المنشأة.</p>
              </div>
              <div className='rounded-xl border p-3'>
                <p className='font-medium text-foreground'>2) تعذر رفع النتيجة</p>
                <p className='mt-1'>تحقق من ملخص النتيجة والتكلفة النهائية، ثم أعد المحاولة من بطاقة الطلب.</p>
              </div>
              <div className='rounded-xl border p-3'>
                <p className='font-medium text-foreground'>3) استفسار تشغيلي</p>
                <p className='mt-1'>أضف تعليقاً داخل الطلب نفسه حتى يظهر للطبيب وفريق العيادة فوراً.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className='mt-4 border-border/50'>
        <CardContent className='p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
          <div className='flex items-start gap-2 text-sm'>
            <AlertCircle className='h-4 w-4 mt-0.5 text-amber-600' />
            <p className='text-muted-foreground'>
              للحالات العاجلة المتعلقة بتسليم النتائج، ابدأ من صفحة الطلبات لضمان توثيق كامل للمحادثة.
            </p>
          </div>
          <Button asChild>
            <Link href={`/${tenantSlug}/dashboard/contractor/orders`}>
              الذهاب إلى الطلبات
              <ArrowLeft className='mr-2 h-4 w-4' />
            </Link>
          </Button>
        </CardContent>
      </Card>

      <Card className='mt-4 border-border/50'>
        <CardContent className='p-4 text-xs text-muted-foreground flex items-center gap-2'>
          <Wrench className='h-4 w-4 text-primary' />
          هذا المركز مخصص لعمليات المتعاقد داخل البوابة، وجميع التحديثات تحفظ ضمن سجل الطلبات.
        </CardContent>
      </Card>
    </DashboardShell>
  )
}
