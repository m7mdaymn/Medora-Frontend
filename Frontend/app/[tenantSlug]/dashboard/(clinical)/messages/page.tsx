'use client'

import {
  listMessagesAction,
  retryMessageAction,
  sendMessageAction,
} from '@/actions/messages/messages'
import { getDoctorsAction } from '@/actions/doctor/get-doctors'
import { getPatientsAction } from '@/actions/patient/getPatients'
import { DashboardHeader, DashboardShell } from '@/components/shell'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { IMessageLog, MessageChannel, MessageScenario } from '@/types/messages'
import { useParams } from 'next/navigation'
import { FormEvent, useMemo, useState } from 'react'
import { toast } from 'sonner'
import useSWR from 'swr'

const SCENARIO_OPTIONS: Array<{ value: MessageScenario; label: string }> = [
  { value: 'Manual', label: 'رسالة يدوية' },
  { value: 'PatientAccountCreated', label: 'إنشاء حساب مريض' },
  { value: 'QueueTicketIssued', label: 'إصدار تذكرة انتظار' },
  { value: 'QueueTurnReady', label: 'الدور جاهز' },
  { value: 'MedicationReminder', label: 'تذكير دواء' },
  { value: 'BookingConfirmed', label: 'تأكيد حجز' },
  { value: 'BookingCancelled', label: 'إلغاء حجز' },
]

function statusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'Delivered':
    case 'Read':
      return 'default'
    case 'Sending':
    case 'Sent':
    case 'Retrying':
      return 'secondary'
    case 'Failed':
      return 'destructive'
    default:
      return 'outline'
  }
}

export default function MessagesPage() {
  const params = useParams()
  const tenantSlug = params.tenantSlug as string

  const [templateName, setTemplateName] = useState<MessageScenario>('Manual')
  const [channel, setChannel] = useState<MessageChannel>('PWA')
  const [recipientUserId, setRecipientUserId] = useState('')
  const [body, setBody] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [workingId, setWorkingId] = useState<string | null>(null)

  const {
    data: messagesRes,
    isLoading,
    mutate,
  } = useSWR(['messages', tenantSlug], () =>
    listMessagesAction(tenantSlug, {
      pageNumber: 1,
      pageSize: 100,
    }),
  )

  const messages = messagesRes?.data?.items || []

  const { data: doctorsRes } = useSWR(['message-doctors', tenantSlug], () =>
    getDoctorsAction(tenantSlug),
  )

  const { data: patientsRes } = useSWR(['message-patients', tenantSlug], () =>
    getPatientsAction(tenantSlug, 1, 200),
  )

  const recipientOptions = useMemo(() => {
    const doctors = (doctorsRes?.doctors || [])
      .filter((doctor) => doctor.userId)
      .map((doctor) => ({
        id: doctor.userId,
        label: `د. ${doctor.name}`,
        category: 'Doctor',
      }))

    const patients = (patientsRes?.items || [])
      .filter((patient) => patient.userId)
      .map((patient) => ({
        id: patient.userId,
        label: patient.name,
        category: 'Patient',
      }))

    return [...doctors, ...patients]
  }, [doctorsRes?.doctors, patientsRes?.items])

  const onSend = async (event: FormEvent) => {
    event.preventDefault()

    if (!templateName.trim()) {
      toast.error('اسم القالب مطلوب')
      return
    }

    if (!recipientUserId.trim()) {
      toast.error('اختيار المستلم مطلوب')
      return
    }

    if (templateName === 'Manual' && !body.trim()) {
      toast.error('نص الرسالة مطلوب في الرسالة اليدوية')
      return
    }

    setIsSending(true)
    try {
      const response = await sendMessageAction(tenantSlug, {
        templateName: templateName.trim(),
        recipientUserId: recipientUserId.trim(),
        channel,
        variables: body.trim() ? { body: body.trim() } : undefined,
      })

      if (!response.success) {
        toast.error(response.message || 'فشل إرسال الرسالة')
        return
      }

      toast.success('تم إرسال الرسالة')
      setBody('')
      await mutate()
    } finally {
      setIsSending(false)
    }
  }

  const onRetry = async (message: IMessageLog) => {
    setWorkingId(message.id)
    try {
      const response = await retryMessageAction(tenantSlug, message.id)
      if (!response.success) {
        toast.error(response.message || 'فشل إعادة الإرسال')
        return
      }

      toast.success('تمت محاولة إعادة الإرسال')
      await mutate()
    } finally {
      setWorkingId(null)
    }
  }

  return (
    <DashboardShell>
      <DashboardHeader
        heading='مركز الرسائل'
        text='إرسال رسائل القوالب ومتابعة حالة التسليم وإعادة المحاولة عند الفشل'
      />

      <Card className='rounded-2xl border-border/50 p-4'>
        <form onSubmit={onSend} className='grid grid-cols-1 md:grid-cols-2 gap-3'>
          <div className='space-y-2'>
            <Label>سيناريو الرسالة</Label>
            <select
              className='w-full h-10 rounded-md border border-input bg-background px-3 text-sm'
              value={templateName}
              onChange={(event) => setTemplateName(event.target.value as MessageScenario)}
            >
              {SCENARIO_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className='space-y-2'>
            <Label>القناة</Label>
            <select
              className='w-full h-10 rounded-md border border-input bg-background px-3 text-sm'
              value={channel}
              onChange={(event) => setChannel(event.target.value as MessageChannel)}
            >
              <option value='WhatsApp'>WhatsApp</option>
              <option value='PWA'>PWA</option>
            </select>
          </div>

          <div className='space-y-2'>
            <Label>المستلم</Label>
            <select
              className='w-full h-10 rounded-md border border-input bg-background px-3 text-sm'
              value={recipientUserId}
              onChange={(event) => setRecipientUserId(event.target.value)}
            >
              <option value=''>اختر مستخدماً...</option>
              {recipientOptions.map((recipient) => (
                <option key={`${recipient.category}-${recipient.id}`} value={recipient.id}>
                  {recipient.label} ({recipient.category})
                </option>
              ))}
            </select>
          </div>

          <div className='space-y-2'>
            <Label>متغير الرسالة body</Label>
            <Input value={body} onChange={(event) => setBody(event.target.value)} placeholder='نص الرسالة' />
          </div>

          <div className='md:col-span-2'>
            <Button type='submit' disabled={isSending}>
              إرسال رسالة
            </Button>
          </div>
        </form>
      </Card>

      {isLoading ? (
        <div className='space-y-2'>
          <Skeleton className='h-20 w-full rounded-2xl' />
          <Skeleton className='h-20 w-full rounded-2xl' />
        </div>
      ) : messages.length === 0 ? (
        <Card className='rounded-2xl p-10 text-center text-muted-foreground'>
          لا يوجد سجل رسائل بعد.
        </Card>
      ) : (
        <div className='space-y-2'>
          {messages.map((message) => (
            <Card key={message.id} className='rounded-2xl border-border/50 p-4 space-y-2'>
              <div className='flex items-start justify-between gap-3'>
                <div>
                  <p className='text-sm font-bold'>{message.templateName}</p>
                  <p className='text-xs text-muted-foreground'>
                    {message.recipientPhone || message.recipientUserId || '-'} • {message.channel}
                  </p>
                </div>
                <Badge variant={statusVariant(message.status)}>{message.status}</Badge>
              </div>

              <div className='text-xs text-muted-foreground'>
                المحاولات: {message.attemptCount} • آخر تحديث:{' '}
                {new Date(message.createdAt).toLocaleString('ar-EG')}
              </div>

              {message.failureReason && (
                <p className='text-xs text-destructive'>سبب الفشل: {message.failureReason}</p>
              )}

              {message.status === 'Failed' && (
                <Button
                  size='sm'
                  variant='outline'
                  disabled={workingId === message.id}
                  onClick={() => void onRetry(message)}
                >
                  إعادة المحاولة
                </Button>
              )}
            </Card>
          ))}
        </div>
      )}
    </DashboardShell>
  )
}
