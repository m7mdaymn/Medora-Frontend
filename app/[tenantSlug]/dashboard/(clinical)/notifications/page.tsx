'use client'

import {
  getMyNotificationSubscriptionsAction,
  listInAppNotificationsAction,
  markAllInAppNotificationsReadAction,
  markInAppNotificationReadAction,
  unsubscribeNotificationAction,
} from '@/actions/notifications/notifications'
import { DashboardHeader, DashboardShell } from '@/components/shell'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { IInAppNotification, INotificationSubscription } from '@/types/notifications'
import { BellRing } from 'lucide-react'
import { useParams } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import useSWR from 'swr'

export default function NotificationsPage() {
  const params = useParams()
  const tenantSlug = params.tenantSlug as string
  const [workingId, setWorkingId] = useState<string | null>(null)

  const {
    data: inAppRes,
    isLoading: loadingInApp,
    mutate: mutateInApp,
  } = useSWR(['in-app-notifications', tenantSlug], () =>
    listInAppNotificationsAction(tenantSlug, {
      pageNumber: 1,
      pageSize: 100,
    }),
  )

  const {
    data: subscriptionsRes,
    isLoading: loadingSubscriptions,
    mutate: mutateSubscriptions,
  } = useSWR(['notification-subscriptions', tenantSlug], () =>
    getMyNotificationSubscriptionsAction(tenantSlug),
  )

  const notifications = inAppRes?.data?.items || []
  const subscriptions = subscriptionsRes?.data || []

  const markRead = async (notification: IInAppNotification) => {
    setWorkingId(notification.id)
    try {
      const response = await markInAppNotificationReadAction(tenantSlug, notification.id)
      if (!response.success) {
        toast.error(response.message || 'فشل تحديث حالة الإشعار')
        return
      }

      await mutateInApp()
    } finally {
      setWorkingId(null)
    }
  }

  const markAllRead = async () => {
    const response = await markAllInAppNotificationsReadAction(tenantSlug)
    if (!response.success) {
      toast.error(response.message || 'فشل تعليم كل الإشعارات كمقروءة')
      return
    }

    toast.success('تم تعليم كل الإشعارات كمقروءة')
    await mutateInApp()
  }

  const removeSubscription = async (subscription: INotificationSubscription) => {
    setWorkingId(subscription.id)
    try {
      const response = await unsubscribeNotificationAction(tenantSlug, subscription.id)
      if (!response.success) {
        toast.error(response.message || 'فشل إلغاء الاشتراك')
        return
      }

      toast.success('تم إلغاء الاشتراك')
      await mutateSubscriptions()
    } finally {
      setWorkingId(null)
    }
  }

  return (
    <DashboardShell>
      <DashboardHeader
        heading='الإشعارات'
        text='متابعة إشعارات النظام الداخلية وإدارة اشتراكات Push'
      >
        <Button variant='outline' onClick={() => void markAllRead()}>
          تعليم الكل كمقروء
        </Button>
      </DashboardHeader>

      <div className='grid grid-cols-1 xl:grid-cols-2 gap-4'>
        <Card className='rounded-2xl border-border/50 p-4 space-y-3'>
          <h3 className='text-sm font-bold'>إشعارات داخل التطبيق</h3>

          {loadingInApp ? (
            <div className='space-y-2'>
              <Skeleton className='h-20 w-full rounded-xl' />
              <Skeleton className='h-20 w-full rounded-xl' />
            </div>
          ) : notifications.length === 0 ? (
            <div className='text-sm text-muted-foreground text-center p-8 border border-dashed rounded-xl'>
              لا توجد إشعارات حالياً.
            </div>
          ) : (
            <div className='space-y-2'>
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className='rounded-xl border border-border/40 p-3 flex items-start justify-between gap-3'
                >
                  <div>
                    <div className='flex items-center gap-2'>
                      <p className='text-sm font-bold'>{notification.title}</p>
                      {!notification.isRead && <Badge variant='secondary'>جديد</Badge>}
                    </div>
                    <p className='text-xs text-muted-foreground mt-1'>{notification.body}</p>
                    <p className='text-[11px] text-muted-foreground mt-1'>
                      {new Date(notification.createdAt).toLocaleString('ar-EG')}
                    </p>
                  </div>

                  {!notification.isRead && (
                    <Button
                      variant='outline'
                      size='sm'
                      disabled={workingId === notification.id}
                      onClick={() => void markRead(notification)}
                    >
                      مقروء
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className='rounded-2xl border-border/50 p-4 space-y-3'>
          <h3 className='text-sm font-bold'>اشتراكات Push</h3>

          {loadingSubscriptions ? (
            <div className='space-y-2'>
              <Skeleton className='h-16 w-full rounded-xl' />
              <Skeleton className='h-16 w-full rounded-xl' />
            </div>
          ) : subscriptions.length === 0 ? (
            <div className='text-sm text-muted-foreground text-center p-8 border border-dashed rounded-xl'>
              لا توجد اشتراكات Push محفوظة لهذا المستخدم.
            </div>
          ) : (
            <div className='space-y-2'>
              {subscriptions.map((subscription) => (
                <div
                  key={subscription.id}
                  className='rounded-xl border border-border/40 p-3 flex items-center justify-between gap-3'
                >
                  <div className='min-w-0'>
                    <p className='text-sm font-semibold truncate flex items-center gap-1'>
                      <BellRing className='w-3.5 h-3.5 text-muted-foreground' />
                      {subscription.endpoint}
                    </p>
                    <p className='text-xs text-muted-foreground'>
                      {subscription.isActive ? 'نشط' : 'موقوف'}
                    </p>
                  </div>

                  <Button
                    variant='destructive'
                    size='sm'
                    disabled={workingId === subscription.id}
                    onClick={() => void removeSubscription(subscription)}
                  >
                    إلغاء
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </DashboardShell>
  )
}
